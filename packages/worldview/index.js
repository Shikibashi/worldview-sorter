import {validateResponseValue} from '../runtime/index.js';
export class WorldviewEvidenceError extends Error {
  constructor(message){super(message);this.name='WorldviewEvidenceError';}
}
const need=(ok,message)=>{if(!ok)throw new WorldviewEvidenceError(message);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const has=(xs,x)=>xs.some(v=>equal(v,x));
const order=(a,b)=>a.id.localeCompare(b.id,'en');

export function validateModel({model,bank,scalesDoc}){
  need(model?.engineVersion==='generic-evidence-1','Unsupported generic evidence engine.');
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
      need(Array.isArray(e.support)&&Array.isArray(e.oppose)&&e.support.length>0,'Explicit response mapping required.');
      need(!e.support.some(v=>has(e.oppose,v)),'Overlapping support/opposition.');
      for(const v of [...e.support,...e.oppose]){
        need(v!==null,'Missing value cannot be directional evidence.');
        need(!(['agreement5','paired5'].includes(item.responseScaleId)&&v===0),'Neutral cannot support or oppose a proposition.');
        validateResponseValue(item,scales.get(item.responseScaleId),'answered',v);
      }
    }
    need(units.size>=c.minimumEvidenceUnits,'Insufficient planned units for '+c.id);
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
    for(const p of input.presentedItems){need(p&&!presentations.has(p.itemId),'Duplicate presentation.');presentations.set(p.itemId,p);}
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
  const identities=input.selfReportedIdentities??[];
  need(Array.isArray(identities)&&identities.length<=20&&identities.every(x=>typeof x==='string'&&x.length<=100),'Invalid self-reported labels.');
  return {responses,identities};
}

function evaluate(c,responses,items){
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
  const state=supportingUnits&&opposingUnits?'mixed':supportingUnits>=c.minimumEvidenceUnits?'supported':opposingUnits>=c.minimumEvidenceUnits?'opposed':'insufficient_evidence';
  return {commitmentId:c.id,constructId:c.constructId,domainId:c.domainId,tier:c.tier,layer:c.layer,label:c.label,scope:c.scope,state,
    supportingUnits,opposingUnits,minimumEvidenceUnits:c.minimumEvidenceUnits,
    evidenceUnitMeaning:'Authored duplicate-control groups, not demonstrated statistical independence.',
    observations,sourceIds:c.sourceIds,boundary:c.boundary};
}

export function compareWorldview({model,bank,scalesDoc,input}){
  validateModel({model,bank,scalesDoc});
  const {responses,identities}=responsesFor(input,bank,scalesDoc);
  const items=new Map(bank.items.map(x=>[x.id,x]));
  const commitments=[...model.commitments].sort(order).map(c=>evaluate(c,responses,items));
  const results=new Map(commitments.map(c=>[c.commitmentId,c]));
  const comparisons=[...model.comparisons].sort(order).map(p=>{
    const criteria=p.criteria.map(c=>{
      const observed=results.get(c.commitmentId);
      const state=c.expected==='oppose'?({supported:'opposed',opposed:'supported'}[observed.state]??observed.state):observed.state;
      return {...c,state,observedCommitmentState:observed.state};
    });
    const defining=criteria.filter(c=>c.role==='defining');
    const state=defining.some(c=>c.state==='opposed')?'material_divergence':defining.some(c=>c.state==='mixed')?'mixed_evidence':
      defining.every(c=>c.state==='supported')?'supported_on_specified_commitments':criteria.some(c=>c.state==='supported')?'partial_evidence':'insufficient_evidence';
    return {id:p.id,label:p.label,scope:p.scope,kind:p.kind,state,criteria,sourceIds:p.sourceIds,limitations:p.limitations,publicIdentityLabel:null};
  });
  return {schemaVersion:'1.0.0',modelVersion:model.modelVersion,bankVersion:bank.bankVersion,
    status:'theory_informed_reported_commitments',measurementStatus:'original_items_not_empirically_validated',
    publicIdentityLabel:null,selectedProfileId:null,percentageMatchAllowed:false,selfReportedIdentities:[...identities],
    domains:model.domains.map(d=>({id:d.id,name:d.name,commitments:commitments.filter(c=>c.domainId===d.id),
      unresolvedConstructIds:model.coverage.constructs.filter(c=>c.domainId===d.id&&c.ruleIds.length===0).map(c=>c.id)})),
    commitments,comparisons,limitations:model.limitations};
}

// Plans missing evidence, not a truth-maximizing or calibrated adaptive test.
// Labels and the order/number of profiles never affect question priority.
export function planWorldviewFollowups({model,bank,scalesDoc,input,maxItems=12}){
  need(Number.isInteger(maxItems)&&maxItems>=0&&maxItems<=100,'Invalid follow-up budget.');
  const result=compareWorldview({model,bank,scalesDoc,input});
  const responses=new Map(input.responses.map(r=>[r.itemId,r]));
  const byItem=new Map(bank.items.map(i=>[i.id,i]));
  const eligibleRules=result.commitments.filter(c=>['mixed','insufficient_evidence'].includes(c.state));
  const queues=new Map(model.domains.map(d=>[d.id,[]]));
  for(const r of eligibleRules){
    for(const e of r.observations){if(!responses.has(e.itemId))queues.get(r.domainId).push({itemId:e.itemId,ruleId:r.commitmentId});}
  }
  const ruleIndex=new Map(result.commitments.map(c=>[c.commitmentId,c]));
  const priority=id=>{const c=ruleIndex.get(id);return (c.state==='mixed'?0:c.supportingUnits+c.opposingUnits>0?1:2)*10+(c.tier==='headline'?0:1);};
  for(const q of queues.values())q.sort((a,b)=>priority(a.ruleId)-priority(b.ruleId)||a.ruleId.localeCompare(b.ruleId)||a.itemId.localeCompare(b.itemId));
  const selected=new Map(),withheld=[];
  const closure=(id,pending,stack=new Set())=>{
    if(selected.has(id)||responses.has(id)||pending.has(id))return true;
    need(!stack.has(id),'Cyclic prerequisites.');
    const item=byItem.get(id);need(item,'Unknown follow-up item.');
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
        for(const [id,e] of pending)selected.set(id,{...e,reason:id===candidate.itemId?'missing_direct_evidence':'branch_prerequisite'});
        progress=true;break;
      }
      if(selected.size===maxItems)break;
    }
  }
  return {schemaVersion:'1.0.0',modelVersion:model.modelVersion,bankVersion:bank.bankVersion,
    status:'balanced_missing_evidence_plan_not_calibrated_CAT',entries:[...selected.values()],withheld,
    contingentItemsMustBeRechecked:true};
}
