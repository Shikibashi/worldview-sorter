// A presentation projection of interpreted results. No raw answers or scoring enter here.
const displayable=row=>row?.displayState!=='model_review_required'&&row?.presentationReview?.state==='eligible'&&
 row?.inferenceStatus==='direct'&&row?.propositionBasis==='explicit_rule_proposition';
const distinctDomains=(rows,limit)=>{
 const chosen=[];
 for(const row of rows)if(!chosen.some(other=>other.domainId===row.domainId)){chosen.push(row);if(chosen.length===limit)return chosen;}
 for(const row of rows)if(!chosen.includes(row)){chosen.push(row);if(chosen.length===limit)break;}
 return chosen;
};
const stateOf=row=>{
 if(row.status==='not_measured'||row.status==='insufficient_evidence')return row.status;
 if(row.displayState==='model_review_required'||row.presentationReview?.state!=='eligible')return 'review_required';
 return row.status==='mixed'?'mixed_context_dependent':row.status;
};

export function resultOverviewDescription(projection){
 const hasDirect=[projection?.supported,projection?.opposed,projection?.mixed].some(rows=>rows?.length);
 if(hasDirect)return 'These are selected interpretations of specific propositions, not an overall philosophy label. Open a topic to see the answers and sources behind each.';
 if(projection?.provisionalPatterns?.length)return 'Some question patterns remain provisional because the exact proposition and its supporting source are not linked together here. They are not presented as established philosophical positions.';
 return 'No direct proposition is ready to highlight from this route. Below, you can inspect mixed answers, questions that did not support a direction, and distinctions this route did not measure.';
}

export function resultStatusLabel(row){
 if(!row)return '';
 if(row.status==='not_measured')return 'Not measured here';
 if(row.status==='insufficient_evidence')return 'Insufficient evidence';
 if(row.presentationReview?.state==='inherited_rule_scope'){
  const direction=row.status==='supported'?'answers align with the broader rule':
   row.status==='opposed'?'answers run against the broader rule':
   row.status==='leaned_toward'?(row.leanDirection==='oppose'?'one answer points against the broader rule':'one answer points toward the broader rule'):
   ['mixed','mixed_context_dependent'].includes(row.status)?'answers differ across the broader rule':null;
  return direction?'Provisional answer pattern: '+direction:row.statusLabel??'';
 }
 if(row.presentationReview?.state==='source_claim_unresolved')
  return 'Provisional interpretation · supporting source link not recorded';
 if(row.displayState==='model_review_required')return 'Provisional derived interpretation';
 return row.statusLabel??'';
}

export function formatResponseCoverage(session){
 const counts={answered:0,no_view:0,not_understood:0,not_applicable:0};
 for(const response of session?.responses??[])if(Object.hasOwn(counts,response.state))counts[response.state]++;
 const parts=[`${counts.answered} substantive`];
 for(const [state,label] of [['no_view','no view'],['not_understood','not understood'],['not_applicable','not applicable']])
  if(counts[state])parts.push(`${counts[state]} ${label}`);
 const conditionalSkips=(session?.presentedItems??[]).filter(item=>item.skippedByBranch).length;
 if(conditionalSkips)parts.push(`${conditionalSkips} conditional question${conditionalSkips===1?'':'s'} not asked`);
 return 'Responses recorded: '+parts.join(' · ');
}

export function buildResultOverview(summary){
 if(summary?.schemaVersion!=='quiz-summary-3')return null;
 const rows=summary.rows??[];
 const direct=rows.filter(displayable);
 const byStatus=status=>direct.filter(row=>row.status===status);
 const domains=(summary.domains??[]).map(domain=>{
  const counts={supported:0,opposed:0,leaned_toward:0,mixed_context_dependent:0,
   insufficient_evidence:0,not_measured:0,review_required:0};
  for(const row of domain.rows??[])counts[stateOf(row)]=(counts[stateOf(row)]??0)+1;
  const total=(domain.rows??[]).length;
  return {id:domain.id,total,assessed:total-counts.not_measured,counts};
 });
 return {
  supported:distinctDomains(byStatus('supported'),4),
  opposed:distinctDomains(byStatus('opposed'),2),
  mixed:distinctDomains(byStatus('mixed_context_dependent'),2),
  insufficient:distinctDomains(byStatus('insufficient_evidence'),1),
  provisionalPatterns:distinctDomains(rows.filter(row=>row.inferenceStatus==='direct'&&
   ['supported','opposed','mixed_context_dependent'].includes(row.status)&&!displayable(row)),4),
  unmeasured:domains.filter(domain=>domain.counts.not_measured>0).sort((a,b)=>
   b.counts.not_measured-a.counts.not_measured||a.id.localeCompare(b.id)).slice(0,2),
  domains
 };
}

export function formatTensionDetails(tension, summary) {
  if (!tension) return null;
  const domain = summary?.domains?.find(d => d.id === tension.domainId);
  const domainTitle = domain?.title ?? domain?.name ?? tension.domainId ?? 'General';
  const involvedRows = (tension.ruleIds ?? [])
    .map(id => summary?.rows?.find(r => r.id === id))
    .filter(Boolean);
  const primaryRow = involvedRows[0];

  const isGeneralCase = tension.kind === 'general_case_divergence';
  const isMixedEvidence = tension.kind === 'mixed_direct_evidence';
  const isCompeting = tension.kind === 'competing_propositions';
  const isDerivedConflict = tension.kind === 'derived_direct_conflict';

  const relation = (isGeneralCase || tension.relation === 'coexistence') ? 'coexistence' :
    (isMixedEvidence || tension.relation === 'context_dependent') ? 'context_dependent' : 'conflict';

  const relationLabel = relation === 'coexistence' ? 'Can coexist across contexts' :
    relation === 'context_dependent' ? 'Context-dependent evidence' : 'Competing commitments';

  const answers = [];
  const seenItems = new Set();

  for (const row of involvedRows) {
    for (const ev of row.evidence ?? []) {
      const isSupport = ev.meaning === 'support' || (tension.supportingItemIds ?? []).includes(ev.itemId);
      const isOppose = ev.meaning === 'oppose' || (tension.opposingItemIds ?? []).includes(ev.itemId);
      const isConflicted = isDerivedConflict && (tension.itemIds ?? []).includes(ev.itemId);

      if ((isSupport || isOppose || isCompeting || isConflicted) && !seenItems.has(ev.itemId)) {
        seenItems.add(ev.itemId);
        const direction = isSupport ? 'support' : isOppose ? 'oppose' : 'direct_conflict';
        const target = row.proposition ?? row.scope ?? row.label;
        const meaning = direction === 'support' ? `Supports: "${target}"` :
          direction === 'oppose' ? `Opposes: "${target}"` :
          `Conflicts directly with: "${target}"`;

        answers.push({
          itemId: ev.itemId,
          text: ev.text ?? ev.prompt ?? ev.itemId,
          answer: ev.answer ?? 'Answer recorded',
          direction,
          meaning,
          ruleLabel: row.label
        });
      }
    }
  }

  let why = tension.why;
  if (!why) {
    if (isGeneralCase) {
      why = 'You endorsed a general principle while choosing differently in a concrete scenario. In philosophical reasoning, general principles often establish default guidance, while concrete dilemmas introduce competing stakes, thresholds, or exceptions. These answers can coexist consistently.';
    } else if (isMixedEvidence) {
      why = 'Your answers to different questions about this proposition emphasize competing considerations. This pattern reflects context-sensitive discrimination across different cases rather than an inconsistent stance.';
    } else if (tension.id === 'miracle-supernatural-conflict') {
      why = 'Affirming miraculous interventions while rejecting supernatural reality represents a philosophical tension. In classical metaphysics, miracles are defined as divine suspensions of natural order, which presupposes supernatural reality. Reconciling both typically requires adopting a non-literal, metaphorical, or naturalistic reinterpretation of miraculous events.';
    } else if (isDerivedConflict) {
      why = 'Your direct answer contradicts the synthesis that would normally follow from your other accepted premises. The engine respects your explicit direct judgment by withholding the derived conclusion.';
    } else {
      why = tension.explanation ?? 'These answers point in different directions and warrant closer examination.';
    }
  }

  let discriminatingQuestions = Array.isArray(tension.discriminatingQuestions) ? [...tension.discriminatingQuestions] : [];
  if (!discriminatingQuestions.length) {
    if (isGeneralCase && primaryRow?.id === 'audit2-EP02-complex-knowledge') {
      discriminatingQuestions = [
        {
          prompt: 'Consider whether knowledge differs by domain:',
          options: [
            'Theoretical frameworks are interconnected webs, while specific empirical findings are distinct facts',
            'Knowledge is fundamentally unified and web-like across all fields',
            'Knowledge is strictly a modular catalog of separate domain facts'
          ]
        }
      ];
    } else if (tension.id === 'miracle-supernatural-conflict') {
      discriminatingQuestions = [
        {
          prompt: 'Do you view miracles as literal interventions that suspend physical laws, or as deeply meaningful natural events that evoke spiritual wonder?',
          options: [
            'Literal divine intervention that suspends natural law (requires supernatural reality)',
            'Natural occurrence with profound spiritual or symbolic meaning (compatible with naturalism)'
          ]
        }
      ];
    } else if (isGeneralCase) {
      discriminatingQuestions = [
        {
          prompt: 'Does the concrete case represent an exception to the general principle, or does it define the general boundary?',
          options: [
            'The general rule holds as the default, but this concrete case is a justified exception',
            'The concrete case shows that the general rule was stated too broadly',
            'Both apply equally in different institutional or practical domains'
          ]
        }
      ];
    } else if (isCompeting) {
      discriminatingQuestions = [
        {
          prompt: 'How do you understand the relationship between these two commitments?',
          options: [
            'One takes priority over the other when they come into conflict',
            'They address separate domains and operate under different standards',
            'One commitment is understood non-literally or metaphorically'
          ]
        }
      ];
    } else if (primaryRow?.interpretationRule?.neighbors?.length) {
      discriminatingQuestions = [
        {
          prompt: `Consider which nearby position best describes the boundary in your view:`,
          options: primaryRow.interpretationRule.neighbors.slice(0, 3)
        }
      ];
    }
  }

  return {
    id: tension.id,
    kind: tension.kind,
    domainId: tension.domainId,
    domainTitle,
    title: primaryRow?.label ?? (isCompeting && involvedRows[1] ? `${primaryRow?.label} vs. ${involvedRows[1]?.label}` : domainTitle),
    relation,
    relationLabel,
    answers,
    why,
    discriminatingQuestions,
    explanation: tension.explanation ?? why
  };
}
