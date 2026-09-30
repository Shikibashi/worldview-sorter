// An affinity is a sourced comparison over already interpreted propositions.
// This module does not classify respondents or read raw answers.
export function evaluateAffinityExamples({definitions,report}){
 const interpreted=new Map(report.commitments.map(c=>[c.commitmentId,c]));
 const out=[];
 for(const definition of definitions){
  const criteria=definition.criteria.map(c=>{
   const proposition=interpreted.get(c.ruleId);
   if(!proposition)throw new Error('Affinity criterion lacks interpreted proposition: '+c.ruleId);
   const state=proposition.state;
   const finding=state==='not_measured'?'unmeasured':
    ['insufficient_evidence','mixed_context_dependent','mixed','leaned_toward'].includes(state)?'unresolved':
    state===c.expectedState?'overlap':'divergence';
   return {...c,observedState:state,finding};
  });
  out.push({id:definition.id,label:definition.label,kind:'research_stress_example_not_identity',
   criteria,measuredDefining:criteria.filter(c=>c.role==='defining'&&c.finding!=='unmeasured'),
   unmeasuredDefining:criteria.filter(c=>c.role==='defining'&&c.finding==='unmeasured'),
   overlap:criteria.filter(c=>c.finding==='overlap'),divergence:criteria.filter(c=>c.finding==='divergence'),
   unresolved:criteria.filter(c=>c.finding==='unresolved'),nearbyTraditions:definition.nearbyTraditions,
   sourceIds:definition.sourceIds,identityClaim:false,percentage:null});
 }
 return out;
}

// Catalog comparisons consume only the pilot's interpreted, public proposition
// states. Doctrinal gaps stay gaps even when a neighboring rule has evidence.
const settled=new Set(['supported','opposed']);
const states=new Set(['supported','opposed','leaned_toward','mixed_context_dependent','insufficient_evidence','not_measured']);
const requireValue=(ok,message)=>{if(!ok)throw new Error('Affinity catalog: '+message);};
const linkedSupport=rule=>rule?.sourceClaims?.some(claim=>claim.relationship==='supports'&&
 rule.sourceIds?.includes(claim.sourceId)&&typeof claim.claim==='string'&&claim.claim.trim());

export function validateAffinityCatalog({catalog,model,pilot}){
 requireValue(catalog?.schemaVersion==='philosophical-affinity-catalog-1','unknown schema');
 requireValue(/^philosophical-affinity-\d+\.\d+\.\d+$/.test(catalog.catalogVersion),'invalid catalog version');
 requireValue(catalog.affinitySemanticsVersion==='doctrinal-comparison-1.0.0','unsupported affinity semantics');
 requireValue(catalog.modelVersion===model.modelVersion&&catalog.resultSemanticsVersion===model.resultSemanticsVersion,'pilot interpretation mismatch');
 requireValue(catalog.instrumentVersion===model.pilotInstrumentVersion,'pilot instrument mismatch');
 requireValue(catalog.identityOutputAllowed===false&&catalog.percentageMatchAllowed===false,'identity or percentage output is forbidden');
 requireValue(Array.isArray(catalog.traditions)&&catalog.traditions.length>0,'empty catalog');
 const sources=new Set((catalog.sources??[]).map(s=>s.id));
 requireValue(sources.size===catalog.sources.length,'duplicate source ID');
 for(const source of catalog.sources)requireValue(source.type==='primary'||source.type==='academic_secondary','invalid source type');
 const measured=new Set(pilot.interpretationRules.routeMeasuredDirectRuleIds);
 const publicIds=new Set(model.publicRuleIds);
 const researchIds=new Set(model.researchOnlyRuleIds??[]);
 const derived=new Set(model.derivedRules.map(r=>r.id));
 requireValue(researchIds.size===(model.researchOnlyRuleIds??[]).length&&
  [...publicIds].every(id=>!researchIds.has(id)&&model.commitments.some(rule=>rule.id===id&&rule.tier!=='research'))&&
  [...researchIds].every(id=>model.commitments.some(rule=>rule.id===id&&rule.tier==='research')),
  'public and research-only propositions must be disjoint');
 requireValue(model.derivedRules.every(rule=>rule.requires?.every(dep=>publicIds.has(dep.ruleId))),
  'derived doctrine cannot depend on nonpublic propositions');
 const ids=new Set();
 for(const tradition of catalog.traditions){
  requireValue(!ids.has(tradition.id),'duplicate tradition '+tradition.id);ids.add(tradition.id);
  requireValue(['comprehensive_system','epistemological_tradition','ethical_theory','metaethical_position','metaphysical_position','political_philosophy'].includes(tradition.scope),'invalid scope '+tradition.id);
  requireValue(tradition.identityClaimAllowed===false,'identity claim enabled '+tradition.id);
  requireValue(Array.isArray(tradition.commitments)&&tradition.commitments.some(c=>c.role==='defining'),'missing defining doctrine '+tradition.id);
  requireValue(Array.isArray(tradition.nonEntailments)&&tradition.nonEntailments.length>0,'missing non-entailments '+tradition.id);
  requireValue(Array.isArray(tradition.neighbors)&&tradition.neighbors.length>0&&Array.isArray(tradition.discriminators)&&tradition.discriminators.length>0,'missing neighbors or discriminators '+tradition.id);
  requireValue(Array.isArray(tradition.secondarySourceIds)&&tradition.secondarySourceIds.length>0,'missing academic sources '+tradition.id);
  const criterionIds=new Set();
  const traditionSourceIds=new Set([...tradition.primarySourceIds,...tradition.secondarySourceIds]);
  for(const id of traditionSourceIds)requireValue(sources.has(id),'missing source '+id);
  for(const c of tradition.commitments){
   requireValue(!criterionIds.has(c.id),'duplicate criterion '+c.id);criterionIds.add(c.id);
   requireValue(['defining','characteristic','disputed'].includes(c.role),'invalid role '+c.id);
   requireValue(['direct','derived','partial','not_measured','unsuitable'].includes(c.mapping.status),'invalid mapping '+c.id);
   for(const id of c.sourceIds)requireValue(sources.has(id)&&traditionSourceIds.has(id),
    'criterion source is not declared by its tradition '+c.id+': '+id);
   if(['direct','derived','partial'].includes(c.mapping.status)){
    requireValue(['supported','opposed'].includes(c.mapping.expectedState),'invalid expected state '+c.id);
   const id=c.mapping.propositionId;
   requireValue(c.mapping.status==='derived'?derived.has(id):publicIds.has(id),'nonpublic proposition '+c.id);
   if(c.mapping.status==='derived'){
    const rule=model.derivedRules.find(candidate=>candidate.id===id);
    requireValue(typeof rule?.proposition==='string'&&rule.proposition.trim()&&linkedSupport(rule),
     'derived mapping lacks an exact sourced conclusion '+c.id);
    for(const dependency of rule.requires){
     const prerequisite=model.commitments.find(candidate=>candidate.id===dependency.ruleId);
     requireValue(publicIds.has(dependency.ruleId)&&typeof prerequisite?.proposition==='string'&&
      prerequisite.proposition.trim()&&linkedSupport(prerequisite),
      'derived mapping lacks an exact sourced public prerequisite '+c.id+': '+dependency.ruleId);
    }
   }
    if(c.mapping.status==='direct')requireValue(measured.has(id),'direct mapping lacks pilot content '+c.id);
    if(c.mapping.status==='partial')requireValue(measured.has(id),'partial mapping lacks pilot content '+c.id);
   }else requireValue(!c.mapping.propositionId,'unmeasured doctrine has a proposition ID '+c.id);
  }
 }
 return true;
}

function criterionFinding(criterion,observation){
 const status=criterion.mapping.status;
 if(status==='not_measured'||status==='unsuitable')return {finding:'unmeasured',observedState:null,leanDirection:null};
 requireValue(observation,'missing interpreted proposition '+criterion.mapping.propositionId);
 requireValue(states.has(observation.state),'unknown proposition state '+observation.state);
 const state=observation.state;
 if(state==='not_measured')return {finding:'unmeasured',observedState:state,leanDirection:null};
 if(status==='partial')return {finding:'partial',observedState:state,leanDirection:observation.leanDirection??null};
 if(state==='leaned_toward')return {finding:'unresolved',observedState:state,leanDirection:observation.leanDirection??null};
 if(state==='mixed_context_dependent')return {finding:'contradictory',observedState:state,leanDirection:null};
 if(!settled.has(state))return {finding:'unresolved',observedState:state,leanDirection:null};
 return {finding:state===criterion.mapping.expectedState?'overlap':'divergence',observedState:state,leanDirection:null};
}

export function evaluatePhilosophicalAffinities({catalog,report,model,pilot}){
 validateAffinityCatalog({catalog,model,pilot});
 requireValue(report?.schemaVersion==='3.0.0'&&report.modelVersion===catalog.modelVersion&&report.resultSemanticsVersion===catalog.resultSemanticsVersion,'interpreted pilot report required');
 const publicIds=new Set(model.publicRuleIds),derivedIds=new Set(model.derivedRules.map(rule=>rule.id));
 requireValue(report.publicRuleIds?.length===publicIds.size&&new Set(report.publicRuleIds).size===publicIds.size&&
  report.publicRuleIds.every(id=>publicIds.has(id)),'public interpretation manifest mismatch');
 requireValue(Array.isArray(report.commitments)&&Array.isArray(report.derived),'direct and derived proposition arrays required');
 const publicRows=report.commitments.filter(c=>publicIds.has(c.commitmentId));
 requireValue(publicRows.length===publicIds.size&&new Set(publicRows.map(c=>c.commitmentId)).size===publicIds.size,
  'public interpreted propositions must be complete and unique');
 requireValue(report.derived.length===derivedIds.size&&new Set(report.derived.map(c=>c.id)).size===derivedIds.size&&
  report.derived.every(c=>derivedIds.has(c.id)),'derived interpreted propositions must be complete and unique');
 const interpreted=new Map(publicRows.map(c=>[c.commitmentId,c]));
 const derived=new Map(report.derived.map(c=>[c.id,c]));
 const sourceMap=new Map(catalog.sources.map(s=>[s.id,s]));
 const traditions=catalog.traditions.map(definition=>{
  const criteria=definition.commitments.map(c=>{
   const observation=c.mapping.status==='derived'?derived.get(c.mapping.propositionId):interpreted.get(c.mapping.propositionId);
   return {...c,...criterionFinding(c,observation)};
  });
  const defining=criteria.filter(c=>c.role==='defining');
  const definingOverlap=defining.filter(c=>c.finding==='overlap');
  const definingDivergence=defining.filter(c=>c.finding==='divergence');
  const definingOpen=defining.filter(c=>['unresolved','contradictory','partial'].includes(c.finding));
  const unmeasuredDefining=defining.filter(c=>c.finding==='unmeasured');
  const summaryState=definingDivergence.length?'material_divergence':
   !definingOverlap.length?'no_sufficiently_established_affinity':
   unmeasuredDefining.length?'overlap_with_unmeasured_core':
   definingOpen.length?'overlap_with_unresolved_core':'overlap_on_measured_core';
  return {id:definition.id,name:definition.name,scope:definition.scope,context:definition.context,
   summaryState,criteria,overlap:criteria.filter(c=>c.finding==='overlap'),divergence:criteria.filter(c=>c.finding==='divergence'),
   unresolved:criteria.filter(c=>['unresolved','contradictory','partial'].includes(c.finding)),
   unmeasuredDefining,contradictory:criteria.filter(c=>c.finding==='contradictory'),
   nonEntailments:definition.nonEntailments,neighbors:definition.neighbors,discriminators:definition.discriminators,
   sourceNotes:definition.sourceNotes,sources:[...definition.primarySourceIds,...definition.secondarySourceIds].map(id=>sourceMap.get(id)),
   identityClaim:false,percentage:null};
 });
 return {schemaVersion:'philosophical-affinity-result-1',catalogVersion:catalog.catalogVersion,
  modelVersion:report.modelVersion,instrumentVersion:catalog.instrumentVersion,resultSemanticsVersion:catalog.resultSemanticsVersion,
  identity:null,matchPercent:null,ranking:null,traditions,
  hasEstablishedAffinity:traditions.some(t=>t.summaryState==='overlap_on_measured_core'),
  source:'interpreted_public_propositions_only'};
}
