import {validateResponseValue} from '../runtime/index.js';
export class WorldviewEvidenceError extends Error {
  constructor(message){super(message);this.name='WorldviewEvidenceError';}
}
const need=(ok,message)=>{if(!ok)throw new WorldviewEvidenceError(message);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const has=(xs,x)=>xs.some(v=>equal(v,x));
const order=(a,b)=>a.id.localeCompare(b.id,'en');

export function validateModel({model,bank,scalesDoc}){
  need(['generic-evidence-1','generic-evidence-2','generic-evidence-3'].includes(model?.engineVersion),'Unsupported generic evidence engine.');
  need(model.bankVersion===bank.bankVersion,'Model/bank mismatch.');
  need(model.identityOutputAllowed===false && model.percentageMatchAllowed===false,'Identity/percentage output is not supported.');
  const items=new Map(bank.items.map(x=>[x.id,x]));
  const scales=new Map(scalesDoc.scales.map(x=>[x.id,x]));
  const sourceIds=new Set(model.sources.map(x=>x.id));
  const ids=new Set();
  for(const c of model.commitments){
    need(!ids.has(c.id),'Duplicate commitment '+c.id);ids.add(c.id);
    need(c.sourceIds.length>0 && c.sourceIds.every(id=>sourceIds.has(id)),'Unknown commitment source.');
    need(c.scope && c.layer && c.domainId,'Commitments require scope, layer and domain.');
    need(Number.isInteger(c.minimumEvidenceUnits)&&c.minimumEvidenceUnits>=2,'At least two authored evidence units required.');
    const observed=new Set(),units=new Set();
    for(const e of c.evidence){
      const item=items.get(e.itemId);
      need(item&&item.revision===e.itemRevision,'Unknown/stale mapped item '+e.itemId);
      need(!observed.has(e.itemId),'Duplicate mapped item '+e.itemId);observed.add(e.itemId);
      need(typeof e.unitId==='string'&&e.unitId.length>0,'Missing evidence-unit identity.');units.add(e.unitId);
      need(Array.isArray(e.support)&&Array.isArray(e.oppose)&&(e.support.length>0||model.engineVersion!=='generic-evidence-1'),'Explicit response mapping required.');
      need(!e.support.some(v=>has(e.oppose,v)),'Overlapping support/opposition.');
      for(const v of [...e.support,...e.oppose]){
        need(v!==null,'Missing value cannot be directional evidence.');
        need(!(['agreement5','paired5'].includes(item.responseScaleId)&&v===0),'Neutral cannot support or oppose a proposition.');
        validateResponseValue(item,scales.get(item.responseScaleId),'answered',v);
      }
    }
    need(units.size>=c.minimumEvidenceUnits,'Insufficient planned units for '+c.id);
    if(model.engineVersion!=='generic-evidence-1'&&c.mappingStatus==='academic_unmapped_audit_v2'){
      need(c.interpretationKind==='direct_interpretable_proposition'&&c.inferenceStatus==='direct'&&c.proposition===c.scope,
        'Audited rule requires an exact direct proposition.');
      need(['neighbors','nonEntailments','falsePositives'].every(k=>Array.isArray(c[k])&&c[k].length>0),
        'Audited rule requires neighboring-view and false-positive boundaries.');
      need(c.evidence.every(e=>items.get(e.itemId).targets.some(t=>t.constructId===c.constructId)),
        'Audited direct rule cannot borrow an unstated neighboring construct target: '+c.id);
      for(const direction of ['support','oppose'])need(new Set(c.evidence.filter(e=>e[direction].length>0).map(e=>e.unitId)).size>=c.minimumEvidenceUnits,
        'Audited rule lacks two distinct '+direction+' units: '+c.id);
    }
  }
  const comparisonIds=new Set();
  for(const p of model.comparisons){
    need(!comparisonIds.has(p.id),'Duplicate comparison '+p.id);comparisonIds.add(p.id);
    need(p.scope&&p.sourceIds.every(id=>sourceIds.has(id)),'Comparison requires source-backed scope.');
    need(p.criteria.some(c=>c.role==='defining'),'No defining commitment in '+p.id);
    const refs=new Set();
    for(const c of p.criteria){
      need(ids.has(c.commitmentId)&&!refs.has(c.commitmentId),'Missing/duplicate commitment reference.');refs.add(c.commitmentId);
      need(['support','oppose'].includes(c.expected),'Invalid expected commitment state.');
      need(['defining','characteristic','disputed'].includes(c.role),'Invalid criterion role.');
    }
  }
  if(model.engineVersion==='generic-evidence-3'){
    need(model.resultSemanticsVersion==='pilot-result-states-1.0.0','Unknown pilot result semantics.');
    need(Array.isArray(model.publicRuleIds)&&new Set(model.publicRuleIds).size===model.publicRuleIds.length,'Public rule IDs must be distinct.');
    need(Array.isArray(model.researchOnlyRuleIds)&&new Set(model.researchOnlyRuleIds).size===model.researchOnlyRuleIds.length,
      'Research-only rule IDs must be distinct.');
    const publicIds=new Set(model.publicRuleIds),researchIds=new Set(model.researchOnlyRuleIds);
    for(const id of publicIds){const c=model.commitments.find(x=>x.id===id);
      need(c&&c.tier!=='research'&&!researchIds.has(id),'Research-only or missing public rule '+id);}
    for(const id of researchIds){const c=model.commitments.find(x=>x.id===id);
      need(c?.tier==='research'&&!publicIds.has(id),'Invalid research-only rule '+id);}
    need(Array.isArray(model.pilotRouteItemRefs)&&model.pilotRouteItemRefs.length>0,'Pilot route must be frozen.');
    for(const ref of model.pilotRouteItemRefs)need(items.get(ref.itemId)?.revision===ref.itemRevision,'Stale pilot item '+ref.itemId);
    for(const rule of model.derivedRules??[]){
      need(rule.id&&rule.proposition&&rule.sourceIds?.length&&rule.sourceIds.every(id=>sourceIds.has(id)),'Derived rule requires scope and sources.');
      need(rule.requires?.length>=2&&rule.requires.every(r=>model.publicRuleIds.includes(r.ruleId)&&['supported','opposed'].includes(r.state)),'Derived rule needs public interpreted propositions.');
      for(const guard of rule.directConflictAnswers??[]){need(items.get(guard.itemId)?.revision===guard.itemRevision,'Stale derived guard.');for(const v of guard.values)validateResponseValue(items.get(guard.itemId),scales.get(items.get(guard.itemId).responseScaleId),'answered',v);}
    }
  }
  return true;
}

function responsesFor(input,bank,scalesDoc){
  need(input?.bankVersion===bank.bankVersion&&Array.isArray(input.responses),'Exact versioned raw responses required.');
  for(const key of ['constructEstimates','probeResponses','memories','userProfile','preferredResult','countryMatches','figureMatches']){
    need(input[key]===undefined,'External prior/coordinate evidence is not accepted: '+key);
  }
  const items=new Map(bank.items.map(x=>[x.id,x]));
  const scales=new Map(scalesDoc.scales.map(x=>[x.id,x]));
  const responses=new Map();
  const presentations=new Map();
  if(input.presentedItems!==undefined){
    need(Array.isArray(input.presentedItems),'Presentation records must be an array.');
    for(const p of input.presentedItems){
      need(p&&!presentations.has(p.itemId),'Duplicate presentation.');
      need(typeof p.presented==='boolean'&&typeof p.skippedByBranch==='boolean'&&!(p.presented&&p.skippedByBranch),
        'Invalid presentation flags.');
      need(!p.skippedByBranch||items.get(p.itemId)?.eligibility?.mode==='conditional',
        'Unconditional item cannot be branch-skipped.');
      presentations.set(p.itemId,p);
    }
  }
  for(const r of input.responses){
    need(r&&!responses.has(r.itemId),'Duplicate raw response.');
    const item=items.get(r.itemId);need(item&&item.revision===r.itemRevision,'Unknown/stale raw item '+r.itemId);
    need(typeof r.value!=='number'||Number.isFinite(r.value),'Nonfinite answer.');
    validateResponseValue(item,scales.get(item.responseScaleId),r.state,r.value);
    if(input.presentedItems!==undefined){
      const p=presentations.get(r.itemId);
      need(p?.presented===true&&p.skippedByBranch===false&&p.itemRevision===r.itemRevision,'Unpresented item cannot supply evidence.');
    }
    responses.set(r.itemId,r);
  }
  for(const [id] of responses){
    const item=items.get(id);
    if(item.eligibility?.mode==='conditional'){
      for(const condition of item.eligibility.all){
        const parent=responses.get(condition.itemId);
        need(parent?.state==='answered'&&typeof parent.value==='string'&&condition.optionIds.includes(parent.value),
          'Conditional response lacks a satisfied prerequisite: '+id);
      }
    }
  }
  for(const p of presentations.values()){
    if(!p.skippedByBranch)continue;
    const eligible=items.get(p.itemId).eligibility.all.every(condition=>{
      const parent=responses.get(condition.itemId);
      return parent?.state==='answered'&&typeof parent.value==='string'&&condition.optionIds.includes(parent.value);
    });
    need(!eligible,'Eligible conditional item cannot be branch-skipped: '+p.itemId);
  }
  const identities=input.selfReportedIdentities??[];
  need(Array.isArray(identities)&&identities.length<=20&&identities.every(x=>typeof x==='string'&&x.length<=100),'Invalid self-reported labels.');
  return {responses,identities,presentations};
}

function evaluate(c,responses,items,presentations,engineVersion){
  const observations=c.evidence.map(e=>{
    const r=responses.get(e.itemId);const item=items.get(e.itemId);
    let state='not_answered';
    if(r){
      if(r.state!=='answered')state=r.state;
      else if(has(e.support,r.value))state='support';
      else if(has(e.oppose,r.value))state='oppose';
      else if(r.value===0&&['agreement5','paired5'].includes(item.responseScaleId))state='neutral';
      else state='qualified_or_non_directional';
    }
    return {itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId,state,rawResponse:r?{state:r.state,value:r.value}:null};
  });
  const units=new Map();
  for(const o of observations){if(!units.has(o.unitId))units.set(o.unitId,new Set());units.get(o.unitId).add(o.state);}
  let supportingUnits=0,opposingUnits=0;
  for(const states of units.values()){if(states.has('support'))supportingUnits++;if(states.has('oppose'))opposingUnits++;}
  const presented=c.evidence.some(e=>presentations.get(e.itemId)?.presented===true)||c.evidence.some(e=>responses.has(e.itemId));
  const modern=engineVersion!=='generic-evidence-1';
  const pilot=engineVersion==='generic-evidence-3';
  const auditedLean=c.mappingStatus==='academic_unmapped_audit_v2';
  const routeEvidence=c.evidence.filter(e=>{
    const presentation=presentations.get(e.itemId);
    return Boolean(presentation)&&presentation.skippedByBranch===false;
  });
  const availableSupportUnits=new Set(routeEvidence.filter(e=>e.support.length).map(e=>e.unitId)).size;
  const availableOpposeUnits=new Set(routeEvidence.filter(e=>e.oppose.length).map(e=>e.unitId)).size;
  const measured=availableSupportUnits>=c.minimumEvidenceUnits&&availableOpposeUnits>=c.minimumEvidenceUnits;
  const state=pilot?
    !measured?'not_measured':supportingUnits&&opposingUnits?'mixed_context_dependent':
      supportingUnits>=c.minimumEvidenceUnits?'supported':opposingUnits>=c.minimumEvidenceUnits?'opposed':
        supportingUnits||opposingUnits?'leaned_toward':'insufficient_evidence':modern?
    !presented?'not_measured':supportingUnits&&opposingUnits?'mixed_context_dependent':
      supportingUnits>=c.minimumEvidenceUnits?'supported':opposingUnits>=c.minimumEvidenceUnits?'opposed':
        supportingUnits||opposingUnits?(auditedLean?'leaned_toward':'insufficient_evidence'):'insufficient_evidence':
    supportingUnits&&opposingUnits?'mixed':supportingUnits>=c.minimumEvidenceUnits?'supported':opposingUnits>=c.minimumEvidenceUnits?'opposed':'insufficient_evidence';
  return {commitmentId:c.id,constructId:c.constructId,domainId:c.domainId,tier:c.tier,layer:c.layer,label:c.label,scope:c.scope,state,
    leanDirection:modern&&state==='leaned_toward'?(supportingUnits?'support':'oppose'):null,
    supportingUnits,opposingUnits,minimumEvidenceUnits:c.minimumEvidenceUnits,
    ...(pilot?{availableSupportUnits,availableOpposeUnits,measurementStatus:measured?'measured_content':'not_measured_content'}:{}),
    evidenceUnitMeaning:'Authored duplicate-control groups, not demonstrated statistical independence.',
    observations,sourceIds:c.sourceIds,boundary:c.boundary};
}

export function compareWorldview({model,bank,scalesDoc,input,routeManifest=null}){
  validateModel({model,bank,scalesDoc});
  const {responses,identities,presentations}=responsesFor(input,bank,scalesDoc);
  const pilot=model.engineVersion==='generic-evidence-3';
  if(pilot){
    need(input.instrumentVersion===model.pilotInstrumentVersion,'Pilot instrument version mismatch.');
    if(routeManifest){
      need(routeManifest.algorithm==='progressive-fixed-1'&&routeManifest.modelVersion===model.modelVersion&&
        routeManifest.instrumentVersion===input.instrumentVersion&&input.pilotId===routeManifest.administrationId,
        'Progressive route release mismatch.');
      const allowed=new Map(routeManifest.routes.at(-1).itemRefs.map(ref=>[ref.itemId,ref.itemRevision]));
      need(input.presentedItems?.length>0&&input.presentedItems.length<=allowed.size,'Invalid progressive route length.');
      const seen=new Set();
      for(const actual of input.presentedItems){
        need(!seen.has(actual.itemId)&&allowed.get(actual.itemId)===actual.itemRevision,
          'Progressive route item or revision mismatch: '+actual.itemId);
        seen.add(actual.itemId);
      }
    }else{
      need(input.presentedItems?.length===model.pilotRouteItemRefs.length,'Complete frozen pilot route required.');
      for(let index=0;index<model.pilotRouteItemRefs.length;index++){
        const expected=model.pilotRouteItemRefs[index],actual=input.presentedItems[index];
        need(actual.itemId===expected.itemId&&actual.itemRevision===expected.itemRevision,'Pilot route or revision mismatch at '+index);
      }
    }
  }
  const items=new Map(bank.items.map(x=>[x.id,x]));
  const commitments=[...model.commitments].sort(order).map(c=>evaluate(c,responses,items,presentations,model.engineVersion));
  const results=new Map(commitments.map(c=>[c.commitmentId,c]));
  const derived=pilot?(model.derivedRules??[]).map(rule=>{
    const dependencies=rule.requires.map(r=>({ruleId:r.ruleId,requiredState:r.state,observedState:results.get(r.ruleId).state}));
    const directConflicts=(rule.directConflictAnswers??[]).flatMap(g=>{
      const response=responses.get(g.itemId);
      return response?.state==='answered'&&has(g.values,response.value)?[{itemId:g.itemId,itemRevision:g.itemRevision,value:response.value}]:[];
    });
    const state=dependencies.some(d=>d.observedState==='not_measured')?'not_measured':
      directConflicts.length?'mixed_context_dependent':
      dependencies.some(d=>d.observedState==='mixed_context_dependent')?'mixed_context_dependent':
      dependencies.every(d=>d.observedState===d.requiredState)?'supported':
      dependencies.some(d=>['opposed','supported'].includes(d.observedState)&&d.observedState!==d.requiredState)?'opposed':'insufficient_evidence';
    return {id:rule.id,constructId:rule.constructId,domainId:rule.domainId,facetId:rule.facetId,label:rule.label,
      proposition:rule.proposition,state,inferenceStatus:'derived',dependencies,directConflicts,sourceIds:rule.sourceIds,
      boundary:rule.boundary};
  }):[];
  const tensions=[];
  if(pilot){
    for(const c of commitments.filter(x=>model.publicRuleIds.includes(x.commitmentId)&&x.state==='mixed_context_dependent')){
      const support=c.observations.filter(o=>o.state==='support').map(o=>o.itemId);
      const oppose=c.observations.filter(o=>o.state==='oppose').map(o=>o.itemId);
      const general=support.some(id=>!items.get(id).scenarioGroup)&&oppose.some(id=>items.get(id).scenarioGroup)||
        oppose.some(id=>!items.get(id).scenarioGroup)&&support.some(id=>items.get(id).scenarioGroup);
      tensions.push({id:'within-'+c.commitmentId,kind:general?'general_case_divergence':'mixed_direct_evidence',domainId:c.domainId,
        ruleIds:[c.commitmentId],supportingItemIds:support,opposingItemIds:oppose,
        explanation:general?'A general answer and a concrete case point in different directions. The distinction may depend on context.':'Answers bearing on this proposition point in different directions.'});
    }
    for(const pair of model.tensionPairs??[]){
      const left=results.get(pair.leftRuleId),right=results.get(pair.rightRuleId);
      if(left?.state===pair.leftState&&right?.state===pair.rightState)tensions.push({id:pair.id,kind:'competing_propositions',domainId:pair.domainId,
        ruleIds:[pair.leftRuleId,pair.rightRuleId],explanation:pair.explanation});
    }
    for(const d of derived.filter(x=>x.directConflicts.length))tensions.push({id:'derived-conflict-'+d.id,kind:'derived_direct_conflict',
      domainId:d.domainId,ruleIds:[d.id,...d.dependencies.map(x=>x.ruleId)],itemIds:d.directConflicts.map(x=>x.itemId),
      explanation:'A direct answer conflicts with the proposed synthesis, so the derived conclusion is withheld.'});
  }
  const comparisons=[...model.comparisons].sort(order).map(p=>{
    const criteria=p.criteria.map(c=>{
      const observed=results.get(c.commitmentId);
      const state=c.expected==='oppose'?({supported:'opposed',opposed:'supported'}[observed.state]??observed.state):observed.state;
      return {...c,state,observedCommitmentState:observed.state};
    });
    const defining=criteria.filter(c=>c.role==='defining');
    const state=defining.some(c=>c.state==='opposed')?'material_divergence':defining.some(c=>['mixed','mixed_context_dependent'].includes(c.state))?'mixed_evidence':
      defining.every(c=>c.state==='supported')?'supported_on_specified_commitments':criteria.some(c=>['supported','leaned_toward'].includes(c.state))?'partial_evidence':
        model.engineVersion!=='generic-evidence-1'&&defining.every(c=>c.state==='not_measured')?'not_measured':'insufficient_evidence';
    return {id:p.id,label:p.label,scope:p.scope,kind:p.kind,state,criteria,sourceIds:p.sourceIds,limitations:p.limitations,publicIdentityLabel:null};
  });
  return {schemaVersion:pilot?'3.0.0':model.engineVersion==='generic-evidence-2'?'2.0.0':'1.0.0',modelVersion:model.modelVersion,bankVersion:bank.bankVersion,
    status:'theory_informed_reported_commitments',measurementStatus:'original_items_not_empirically_validated',
    publicIdentityLabel:null,selectedProfileId:null,percentageMatchAllowed:false,selfReportedIdentities:[...identities],
    domains:model.domains.map(d=>({id:d.id,name:d.name,commitments:commitments.filter(c=>c.domainId===d.id),
      unresolvedConstructIds:model.coverage.constructs.filter(c=>c.domainId===d.id&&c.ruleIds.length===0).map(c=>c.id)})),
    commitments,comparisons,...(pilot?{derived,tensions,resultSemanticsVersion:model.resultSemanticsVersion,publicRuleIds:model.publicRuleIds}:{}),limitations:model.limitations};
}

// Plans missing evidence, not a truth-maximizing or calibrated adaptive test.
// Labels and the order/number of profiles never affect question priority.
export function planWorldviewFollowups({model,bank,scalesDoc,input,maxItems=12,routeManifest=null,allowedItemRefs=null,domainId=null,affinityCatalog=null}){
  need(Number.isInteger(maxItems)&&maxItems>=0&&maxItems<=100,'Invalid follow-up budget.');
  const result=compareWorldview({model,bank,scalesDoc,input,routeManifest});
  const responses=new Map(input.responses.map(r=>[r.itemId,r]));
  const byItem=new Map(bank.items.map(i=>[i.id,i]));
  const assigned=new Set(routeManifest?(input.presentedItems??[]).map(p=>p.itemId):[]);
  const allowed=allowedItemRefs?new Map(allowedItemRefs.map(ref=>[ref.itemId,ref.itemRevision])):null;
  const eligibleRules=result.commitments.filter(c=>['mixed','mixed_context_dependent','leaned_toward','insufficient_evidence','not_measured'].includes(c.state)&&
    (!routeManifest||model.publicRuleIds.includes(c.commitmentId))&&(!domainId||c.domainId===domainId));
  const definingDirect=new Set((affinityCatalog?.traditions??[]).flatMap(t=>t.commitments??[])
   .filter(c=>c.role==='defining'&&c.mapping?.status==='direct').map(c=>c.mapping.propositionId));
  const queues=new Map(model.domains.map(d=>[d.id,[]]));
  for(const r of eligibleRules){
    for(const e of r.observations){if(!assigned.has(e.itemId)&&(!allowed||allowed.get(e.itemId)===e.itemRevision)&&
      (e.state==='not_answered'))queues.get(r.domainId).push({itemId:e.itemId,ruleId:r.commitmentId});}
  }
  const ruleIndex=new Map(result.commitments.map(c=>[c.commitmentId,c]));
  const priority=id=>{const c=ruleIndex.get(id);return (['mixed','mixed_context_dependent'].includes(c.state)?0:c.supportingUnits+c.opposingUnits>0?1:2)*10+
   (definingDirect.has(id)?0:c.tier==='headline'?1:2);};
  for(const q of queues.values())q.sort((a,b)=>priority(a.ruleId)-priority(b.ruleId)||a.ruleId.localeCompare(b.ruleId)||a.itemId.localeCompare(b.itemId));
  const candidateItemRefs=[...new Map([...queues.values()].flat().map(candidate=>{
    const item=byItem.get(candidate.itemId);return [item.id,{itemId:item.id,itemRevision:item.revision}];
  })).values()];
  const selected=new Map(),withheld=[];
  const closure=(id,pending,stack=new Set())=>{
    if(selected.has(id)||responses.has(id)||pending.has(id))return true;
    if(assigned.has(id)){withheld.push({itemId:id,reason:'assigned_without_usable_answer'});return false;}
    need(!stack.has(id),'Cyclic prerequisites.');
    const item=byItem.get(id);need(item,'Unknown follow-up item.');
    if(allowed&&allowed.get(id)!==item.revision){withheld.push({itemId:id,reason:'outside_reviewed_route_content'});return false;}
    const next=new Set([...stack,id]);
    if(item.eligibility?.mode==='conditional'){
      for(const c of item.eligibility.all){
        const r=responses.get(c.itemId);
        if(r && (r.state!=='answered'||!c.optionIds.includes(r.value))){withheld.push({itemId:id,reason:'prerequisite_not_satisfied',prerequisite:c.itemId});return false;}
        if(!closure(c.itemId,pending,next))return false;
      }
    }
    pending.set(id,{itemId:id,itemRevision:item.revision,domainId:item.domainId,eligibility:item.eligibility});return true;
  };
  let progress=true;
  while(selected.size<maxItems&&progress){
    progress=false;
    for(const d of model.domains){
      const q=queues.get(d.id);
      while(q.length){
        const candidate=q.shift();if(selected.has(candidate.itemId))continue;
        const pending=new Map();if(!closure(candidate.itemId,pending))continue;
        if(selected.size+pending.size>maxItems)continue;
        const state=ruleIndex.get(candidate.ruleId).state;
        const reason=state==='mixed_context_dependent'?'resolve_conflicting_evidence':state==='leaned_toward'?'check_weak_direction':
          definingDirect.has(candidate.ruleId)?'clarify_defining_doctrine':
          state==='not_measured'?'supply_missing_direct_evidence':'clarify_insufficient_evidence';
        for(const [id,e] of pending)selected.set(id,{...e,reason:id===candidate.itemId?reason:'branch_prerequisite',ruleId:candidate.ruleId,
          priorEvidenceState:state});
        progress=true;break;
      }
      if(selected.size===maxItems)break;
    }
  }
  return {schemaVersion:'1.0.0',modelVersion:model.modelVersion,bankVersion:bank.bankVersion,
    status:'balanced_missing_evidence_plan_not_calibrated_CAT',entries:[...selected.values()],withheld,
    ...(routeManifest?{adaptivePolicyVersion:routeManifest.adaptivePolicyVersion,eligibleItemRefs:allowedItemRefs,
      candidateItemRefs,
      priorEvidence:eligibleRules.map(c=>({ruleId:c.commitmentId,state:c.state,supportingUnits:c.supportingUnits,opposingUnits:c.opposingUnits})),domainId}:{}),
    contingentItemsMustBeRechecked:true};
}
