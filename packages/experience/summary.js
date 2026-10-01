import {compareWorldview} from '../worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../worldview/affinities.js';
import {EXPERIENCE_VERSION} from './quiz.js';

export const DOMAIN_COPY={
 ME:['Metaethics','What makes a moral claim true?'],NE:['Normative & applied ethics','What should guide our choices?'],
 MF:['Moral psychology','What catches your moral attention?'],VA:['Values & axiology','Which priorities shape your life?'],
 EP:['Epistemology','How do you decide what to believe?'],OM:['Ontology & metaphysics','What kinds of things exist?'],
 MS:['Mind & personal identity','What makes you, you?'],AH:['Agency & human nature','What does it mean to choose freely?'],
 RC:['Philosophy of religion','What lies beyond ordinary experience?'],EX:['Meaning & existential outlook','What makes a life meaningful?'],
 SO:['Social philosophy & ontology','How do people and institutions fit together?'],PL:['Political, legal & economic philosophy','How should authority and cooperation work?']
};
const STATUS={supported:'Your answers support this',opposed:'Your answers oppose this',leaned_toward:'Your answers lean toward this',mixed:'Your answers differ here',mixed_context_dependent:'Your answers are mixed or context-dependent',insufficient_evidence:'Insufficient evidence',not_measured:'Not measured here'};
const LABELS={no_view:'No view',not_understood:'I do not understand this item',not_applicable:'Not applicable'};
const FRIENDLY={
 'legacy-objectivism-moral-truth-aptness':'Moral claims can be true or false',
 'legacy-objectivism-market-coordination':'Market coordination',
 'legacy-philosophical-anarchism-no-general-obedience':'No general duty to obey the law'
};
export function responseLabel(item,scale,response){
 if(response.state!=='answered')return LABELS[response.state]??response.state;
 if(Array.isArray(response.value))return response.value.map(id=>item.options.find(o=>o.id===id)?.label??id).join(' → ');
 return (typeof response.value==='number'?scale.options.find(o=>o.value===response.value):item.options.find(o=>o.id===response.value))?.label??String(response.value);
}
export function qualifyAffinityPresentation({affinities,model}){
 if(!affinities)return null;
 const rules=new Map(model.commitments.map(rule=>[rule.id,rule]));
 const traditions=affinities.traditions.map(tradition=>{
  const mappedDefining=tradition.criteria.filter(criterion=>criterion.role==='defining'&&
   ['direct','partial'].includes(criterion.mapping.status));
  const legacyDefiningCriterionIds=mappedDefining.filter(criterion=>
   !rules.get(criterion.mapping.propositionId)?.proposition).map(criterion=>criterion.id);
  const claimUnlinkedDefiningCriterionIds=mappedDefining.filter(criterion=>{
   const rule=rules.get(criterion.mapping.propositionId);
   return rule?.proposition&&!rule.sourceClaims?.some(claim=>claim.relationship==='supports'&&
    rule.sourceIds?.includes(claim.sourceId)&&typeof claim.claim==='string'&&claim.claim.trim());
  }).map(criterion=>criterion.id);
  return {traditionId:tradition.id,
   state:legacyDefiningCriterionIds.length?'legacy_scope_unresolved':
    claimUnlinkedDefiningCriterionIds.length?'source_claim_unresolved':tradition.summaryState,
   legacyDefiningCriterionIds,claimUnlinkedDefiningCriterionIds};
 });
 return {schemaVersion:'affinity-presentation-1',traditions,
  hasEstablishedAffinity:traditions.some(row=>row.state==='overlap_on_measured_core')};
}
const hasLinkedSupportingClaim=rule=>rule?.sourceClaims?.some(claim=>
 claim.relationship==='supports'&&rule.sourceIds?.includes(claim.sourceId)&&
 typeof claim.claim==='string'&&claim.claim.trim())??false;
export function qualifyDirectPresentation(rule){
 const exactProposition=typeof rule?.proposition==='string'&&Boolean(rule.proposition.trim());
 const linkedSupportingClaim=hasLinkedSupportingClaim(rule);
 return {schemaVersion:'direct-presentation-1',state:!exactProposition?'inherited_rule_scope':
  !linkedSupportingClaim?'source_claim_unresolved':'eligible',exactProposition,linkedSupportingClaim};
}
function directStatusLabel(result,review){
 if(['not_measured','insufficient_evidence'].includes(result.state))return STATUS[result.state];
 if(review.state==='inherited_rule_scope'){
  if(result.state==='supported')return 'Your answers align with this inherited rule scope under the authored rule';
  if(result.state==='opposed')return 'Your answers run against this inherited rule scope under the authored rule';
  if(result.state==='leaned_toward')return result.leanDirection==='oppose'?
   'One answer leans against this inherited rule scope':'One answer leans toward this inherited rule scope';
  return 'Your answers differ across this inherited rule scope under the authored rule';
 }
 const label=result.state==='leaned_toward'&&result.leanDirection==='oppose'?
  'Your answers lean against this':STATUS[result.state];
 return review.state==='source_claim_unresolved'?label+' · supporting source link under review':label;
}
export function qualifyDerivedPresentation({rule,model}){
 const direct=new Map(model.commitments.map(candidate=>[candidate.id,candidate]));
 const publicIds=new Set(model.publicRuleIds);
 const unresolvedPrerequisiteRuleIds=rule.requires.filter(dependency=>
  !publicIds.has(dependency.ruleId)||!direct.get(dependency.ruleId)?.proposition).map(dependency=>dependency.ruleId);
 const claimUnlinkedPrerequisiteRuleIds=rule.requires.filter(dependency=>{
  const prerequisite=direct.get(dependency.ruleId);
  return publicIds.has(dependency.ruleId)&&prerequisite?.proposition&&!hasLinkedSupportingClaim(prerequisite);
 }).map(dependency=>dependency.ruleId);
 const derivedClaimUnlinked=!hasLinkedSupportingClaim(rule);
 return {schemaVersion:'derived-presentation-1',state:unresolvedPrerequisiteRuleIds.length?'prerequisite_unresolved':
  claimUnlinkedPrerequisiteRuleIds.length||derivedClaimUnlinked?'source_claim_unresolved':'eligible',
  unresolvedPrerequisiteRuleIds,claimUnlinkedPrerequisiteRuleIds,derivedClaimUnlinked};
}
export function buildQuizSummary({model,bank,scalesDoc,session,affinityCatalog=null,affinityPilot=null,routeManifest=null}){
 if(session.completionStatus!=='completed')throw new Error('Interpretive feedback is available after completion, not during answering.');
 if(model.engineVersion==='generic-evidence-3')return buildPilotSummary({model,bank,scalesDoc,session,affinityCatalog,affinityPilot,routeManifest});
 const input=structuredClone(session);
 const report=compareWorldview({model,bank,scalesDoc,input});
 const items=new Map(bank.items.map(i=>[i.id,i])),scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));
 const sources=new Map(model.sources.map(s=>[s.id,s]));
 const specified=new Map(model.commitments.map(c=>[c.id,c]));
 const rows=report.commitments.filter(c=>c.tier!=='research').map(c=>({
  id:c.commitmentId,domainId:c.domainId,facetId:specified.get(c.commitmentId)?.facetId??model.facets?.find(f=>f.ruleIds.includes(c.commitmentId))?.id??null,label:FRIENDLY[c.commitmentId]??c.label,status:c.state,statusLabel:c.state==='leaned_toward'&&c.leanDirection==='oppose'?'Your answers lean against this':STATUS[c.state],leanDirection:c.leanDirection,scope:c.scope,
  // These inherited boundaries are lists of prohibited inferences. They must
  // never be presented as if they were positive claims about the respondent.
  boundary:c.commitmentId.startsWith('construct-')?'Do not infer: '+c.boundary:c.boundary,
  counts:{support:c.supportingUnits,oppose:c.opposingUnits,required:c.minimumEvidenceUnits},
  evidence:c.observations.filter(o=>o.rawResponse).map(o=>({itemId:o.itemId,itemRevision:o.itemRevision,text:items.get(o.itemId).text,
   answer:responseLabel(items.get(o.itemId),scales.get(items.get(o.itemId).responseScaleId),o.rawResponse),interpretation:o.state})),
  sources:c.sourceIds.map(id=>sources.get(id)).filter(Boolean).map(s=>({id:s.id,title:s.title,url:s.url,access:(s.access??'inherited reference; access not reverified').replaceAll('_',' '),locator:s.locator??s.use??'Conceptual reference'}))
 }));
 const domains=report.domains.map(d=>({id:d.id,title:DOMAIN_COPY[d.id]?.[0]??d.name,prompt:DOMAIN_COPY[d.id]?.[1]??'',academicTitle:d.name,
  responses:session.presentedItems.filter(e=>e.domainId===d.id&&session.responses.some(r=>r.itemId===e.itemId)).length,
  rows:rows.filter(r=>r.domainId===d.id&&r.evidence.length>0),
  unresolvedConstructCount:d.unresolvedConstructIds.length,
  facets:(model.facets??[]).filter(f=>f.domainId===d.id).map(f=>{
   const members=rows.filter(r=>r.facetId===f.id),itemIds=new Set(members.flatMap(r=>r.evidence.map(e=>e.itemId)));
   return {id:f.id,title:f.title,question:f.question,answeredItems:itemIds.size,
    supportedPatterns:members.filter(r=>r.status==='supported').length,
    opposedPatterns:members.filter(r=>r.status==='opposed').length,
    mixedPatterns:members.filter(r=>['mixed','mixed_context_dependent'].includes(r.status)).length,
    coverageStatus:itemIds.size?'some_responses':'not_sampled_or_no_responses'};
  })}));
 return {schemaVersion:'quiz-summary-1',experienceVersion:EXPERIENCE_VERSION,modelVersion:report.modelVersion,bankVersion:report.bankVersion,
  title:'Your worldview, in pieces',subtitle:'A map of the answers you gave, not a label you have to wear.',
  academicNotice:'Informed by philosophy and psychology research. These original questions and interpretation rules are exploratory, not a validated psychological assessment.',
  coverageNotice:session.instrumentVersion.startsWith('worldview-public')?'Each route samples the core philosophical topics, but not every position. A blank or unresolved area means limited evidence or an unmapped distinction, not a neutral or opposing belief.':'This historical sample was not content-balanced. Missing topics do not indicate neutrality or opposition.',
  resolvedPatterns:rows.filter(r=>['supported','opposed','mixed','mixed_context_dependent'].includes(r.status)).length,
  answeredItems:session.responses.filter(r=>r.state==='answered').length,
  specialResponses:session.responses.filter(r=>r.state!=='answered').length,
  domains,rows,identity:null,matchPercent:null,
  comparisons:report.comparisons.filter(p=>p.kind==='selected_tradition_commitments').map(p=>({id:p.id,label:p.label,scope:p.scope,state:p.state,limitations:p.limitations})),
  limitations:report.limitations};
}

function buildPilotSummary({model,bank,scalesDoc,session,affinityCatalog,affinityPilot,routeManifest}){
 const report=compareWorldview({model,bank,scalesDoc,input:structuredClone(session),routeManifest});
 const affinities=affinityCatalog?evaluatePhilosophicalAffinities({catalog:affinityCatalog,report,model,pilot:affinityPilot}):null;
 const items=new Map(bank.items.map(i=>[i.id,i]));
 const scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));
 const sources=new Map(model.sources.map(s=>[s.id,s]));
 const rules=new Map(model.commitments.map(c=>[c.id,c]));
 const affinityPresentation=qualifyAffinityPresentation({affinities,model});
 const facetMap=new Map((model.facets??[]).map(f=>[f.id,f]));
 const sourceList=rule=>rule.sourceIds.map(id=>sources.get(id)).filter(Boolean).map(s=>{
  const claimLinks=(rule.sourceClaims??[]).filter(link=>link.sourceId===s.id)
   .map(link=>({claim:link.claim,relationship:link.relationship}));
  const sourceRecordClaim=s.claim??s.implication??null;
  return {id:s.id,title:s.title,url:s.url,
   access:(s.access??'reference access not reverified').replaceAll('_',' '),locator:s.locator??s.use??'Conceptual reference',
   claim:sourceRecordClaim,claimLinks,claimScope:claimLinks.length?'rule_linked':sourceRecordClaim?'source_record':'topic_only',
   validatesThisQuiz:s.validatesThisQuiz??null};
 });
 const facetFor=c=>c.facetId??model.facets?.find(f=>f.ruleIds.includes(c.id))?.id??c.domainId+'-other';
 const explain=(c,hasExactProposition)=>{
  const target=hasExactProposition?'this proposition':'this inherited rule scope';
  return c.state==='not_measured'?(c.measurementReason==='branch_not_reached'?
    'A conditional question path for '+target+' was not reached.':
    c.measurementReason==='unavailable_in_instrument'?
    'This instrument has no complete two-direction question path for '+target+'.':
    'This route did not assign enough distinct, appropriate directional question content for '+target+'.'):
   c.state==='insufficient_evidence'?'The route asks about '+target+', but these answers do not justify a direction.':
   c.state==='mixed_context_dependent'?'Relevant answers point in different directions; the interpretation remains mixed or context-dependent.':
   c.state==='leaned_toward'?(c.leanDirection==='oppose'?'One distinct answer points against '+target+'.':'One distinct answer points toward '+target+'.'):
   c.state==='supported'?'At least two authored evidence units support '+target+'.':'At least two authored evidence units oppose '+target+'.';
 };
 const directRows=report.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)).map(c=>{
  const rule=rules.get(c.commitmentId);
  const review=qualifyDirectPresentation(rule);
  return {id:c.commitmentId,constructId:c.constructId,domainId:c.domainId,facetId:facetFor(rule),label:FRIENDLY[c.commitmentId]??c.label,
   proposition:rule.proposition??null,propositionBasis:rule.proposition?'explicit_rule_proposition':'inherited_rule_scope',
   inferenceStatus:'direct',status:c.state,presentationReview:review,
   statusLabel:directStatusLabel(c,review),
   leanDirection:c.leanDirection,explanation:explain(c,review.exactProposition)+
    (review.state==='source_claim_unresolved'?' A supporting academic claim has not yet been linked to this exact rule; the cited sources do not by themselves establish this interpretation.':
     review.state==='inherited_rule_scope'?' This frozen rule has no separately reviewed exact proposition.':''),
   scope:c.scope,boundary:c.boundary,
   counts:{support:c.supportingUnits,oppose:c.opposingUnits,required:c.minimumEvidenceUnits,
    availableSupport:c.availableSupportUnits,availableOppose:c.availableOpposeUnits,
    assigned:c.assignedEvidenceUnits,available:c.availableEvidenceUnits,usableAnswered:c.usableAnsweredEvidenceUnits,
    branchSkipped:c.branchSkippedEvidenceUnits},measurementReason:c.measurementReason,
   insufficientEvidenceReason:c.insufficientEvidenceReason,
   interpretationRule:{id:rule.id,version:model.modelVersion,kind:'direct',constructId:rule.constructId,
    neighbors:rule.neighbors??[],nonEntailments:rule.nonEntailments??[],falsePositives:rule.falsePositives??[]},
   evidence:c.observations.filter(o=>o.rawResponse).map(o=>({itemId:o.itemId,itemRevision:o.itemRevision,unitId:o.unitId,
    text:items.get(o.itemId).text,answer:responseLabel(items.get(o.itemId),scales.get(items.get(o.itemId).responseScaleId),o.rawResponse),
    answerState:o.rawResponse.state,meaning:o.state})),sources:sourceList(rule)};
 });
 const derivedRows=report.derived.map(d=>{
  const review=qualifyDerivedPresentation({rule:model.derivedRules.find(rule=>rule.id===d.id),model});
  const unqualified=review.state!=='eligible'&&!['insufficient_evidence','not_measured'].includes(d.state);
  return {id:d.id,constructId:d.constructId,domainId:d.domainId,facetId:d.facetId??d.domainId+'-other',
  label:d.label,proposition:d.proposition,propositionBasis:'explicit_derived_proposition',inferenceStatus:'derived',status:d.state,
  displayState:unqualified?'model_review_required':d.state,
  statusLabel:unqualified?'Derived interpretation awaiting model review':STATUS[d.state],presentationReview:review,
  leanDirection:null,explanation:unqualified?
   'The frozen authored engine returns '+d.state.replaceAll('_',' ')+', but this derived interpretation has an unresolved prerequisite proposition or missing rule-linked supporting source claims. Its historical state is retained for replay, not presented as an established conclusion.':
   d.directConflicts.length?'A direct answer conflicts with this synthesis, so it is withheld.':
   d.state==='supported'?'Both required direct propositions are supported; this is a conjunction of them.':
   d.state==='not_measured'?'At least one required direct proposition is not measured by this route.':
   d.state==='opposed'?'At least one required direct proposition is opposed.':'The required direct propositions are not both established.',
  scope:d.proposition,boundary:d.boundary,counts:null,
  interpretationRule:{id:d.id,version:model.modelVersion,kind:'derived',constructId:d.constructId,dependsOn:d.dependencies},
  evidence:d.directConflicts.map(x=>({itemId:x.itemId,itemRevision:x.itemRevision,text:items.get(x.itemId).text,
   answer:responseLabel(items.get(x.itemId),scales.get(items.get(x.itemId).responseScaleId),{state:'answered',value:x.value}),meaning:'direct_conflict'})),
  dependencies:d.dependencies,sources:sourceList(model.derivedRules.find(rule=>rule.id===d.id))};
 });
 const rows=[...directRows,...derivedRows];
 const coverageState=members=>!members.length||members.every(r=>r.status==='not_measured')?'not_measured':
  members.some(r=>r.status==='not_measured')?'partially_assessed':
  members.every(r=>r.status==='insufficient_evidence')?'assessed_unresolved':'meaningfully_assessed';
 const domains=report.domains.map(d=>{
  const domainRows=rows.filter(r=>r.domainId===d.id),knownFacets=(model.facets??[]).filter(f=>f.domainId===d.id);
  const facetIds=new Set(domainRows.map(r=>r.facetId));
  const facets=[...knownFacets.map(f=>({id:f.id,title:f.title,question:f.question})),
   ...[...facetIds].filter(id=>!facetMap.has(id)).map(id=>({id,title:'Other questions in this topic',question:''}))];
  return {id:d.id,title:DOMAIN_COPY[d.id]?.[0]??d.name,prompt:DOMAIN_COPY[d.id]?.[1]??'',academicTitle:d.name,
   measurementStatus:coverageState(domainRows),
   responses:session.responses.filter(r=>session.presentedItems.find(e=>e.itemId===r.itemId)?.domainId===d.id).length,
   rows:domainRows,facets:facets.map(f=>({...f,measurementStatus:coverageState(domainRows.filter(r=>r.facetId===f.id)),
    rows:domainRows.filter(r=>r.facetId===f.id),
    answeredItems:new Set(domainRows.filter(r=>r.facetId===f.id).flatMap(r=>r.evidence.map(e=>e.itemId))).size})),
   unresolvedConstructCount:d.unresolvedConstructIds.length};
 });
 const order=row=>{const rule=rules.get(row.id);return rule?.tier==='headline'?0:rule?.tier==='primary'?1:2;};
 const supported=directRows.filter(r=>r.status==='supported').sort((a,b)=>order(a)-order(b)||a.domainId.localeCompare(b.domainId)||a.id.localeCompare(b.id));
 const overview=[];
 for(const row of supported){if(!overview.some(x=>x.domainId===row.domainId))overview.push(row);if(overview.length===8)break;}
 for(const row of supported){if(overview.length===8)break;if(!overview.includes(row))overview.push(row);}
 const openRows=rows.filter(r=>r.displayState!=='model_review_required'&&
  ['mixed_context_dependent','insufficient_evidence'].includes(r.status));
 const unmeasured=rows.filter(r=>r.status==='not_measured');
 const gapIds=new Set(rows.map(r=>r.constructId));
 const coverageGaps=model.coverage.constructs.filter(c=>!c.ruleIds.length&&!gapIds.has(c.id)).map(c=>({constructId:c.id,domainId:c.domainId,
  name:c.name??c.id,disposition:c.disposition??'unresolved',reason:c.coverageGap??'No approved interpretation rule.'}));
 return {schemaVersion:'quiz-summary-3',experienceVersion:EXPERIENCE_VERSION,modelVersion:report.modelVersion,
  resultSemanticsVersion:report.resultSemanticsVersion,bankVersion:report.bankVersion,instrumentVersion:session.instrumentVersion,
  title:'Your worldview, in pieces',subtitle:'A map of answer-grounded interpretations, not an assigned identity.',
  academicNotice:'This is a theoretically authored pilot candidate. Its items, evidence units and thresholds have not been psychometrically validated. Some frozen direct rules retain inherited scopes or lack a rule-linked supporting academic claim; inspect each result before treating it as a philosophical proposition.',
  coverageNotice:'Not measured means this administration did not offer a complete evidence path. This may reflect the route, a conditional question not reached, or a distinction the instrument cannot yet assess. Insufficient evidence means the opportunity existed but these answers do not justify a direction.',
  answeredItems:session.responses.filter(r=>r.state==='answered').length,specialResponses:session.responses.filter(r=>r.state!=='answered').length,
  resolvedPatterns:rows.filter(r=>r.displayState!=='model_review_required'&&
   ['supported','opposed','mixed_context_dependent'].includes(r.status)).length,
  overview,domains,rows,mixedOrUnresolved:openRows,unmeasured,coverageGaps,tensions:report.tensions,
  comparisons:[],affinities,affinityPresentation,affinityCatalogVersion:affinities?.catalogVersion??null,
  identity:null,matchPercent:null,limitations:report.limitations};
}
export function createSharePreview(summary,selectedIds){
 if(!Array.isArray(selectedIds)||new Set(selectedIds).size!==selectedIds.length||selectedIds.length>6)throw new Error('Choose at most six different patterns.');
 const rows=selectedIds.map(id=>summary.rows.find(r=>r.id===id));
 if(rows.some(r=>!r||['insufficient_evidence','not_measured'].includes(r.status)||
  (r.inferenceStatus==='derived'&&r.presentationReview?.state!=='eligible')))
  throw new Error('Only visible evidence-backed patterns can be selected.');
 return ['Worldview Sorter — selected answer patterns',...rows.map(r=>r.statusLabel+': '+r.label),
  'Exploratory, research-informed quiz; not an ideology diagnosis or a percentage match.',
  'Question bank '+summary.bankVersion+' · interpretation '+summary.modelVersion].join('\n');
}
