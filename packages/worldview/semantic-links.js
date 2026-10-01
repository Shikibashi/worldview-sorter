export class SemanticLinkError extends Error {
  constructor(message){super(message);this.name='SemanticLinkError';}
}

const need=(ok,message)=>{if(!ok)throw new SemanticLinkError(message);};
const states=new Set(['supported','opposed']);
const kinds=new Set(['explanatory_support','does_not_establish','can_coexist','needs_clarification','contradiction']);

function propositionIds(model){
  return new Set([
    ...(model.commitments??[]).map(row=>row.id),
    ...(model.derivedRules??[]).map(row=>row.id)
  ]);
}

function validateCondition(condition,known,label){
  need(condition&&typeof condition==='object',label+' must be an object.');
  need(known.has(condition.propositionId),label+' references unknown proposition '+condition.propositionId+'.');
  need(states.has(condition.state),label+' requires supported or opposed.');
}

function assertSupportGraphAcyclic(links){
  const edges=new Map();
  const nodes=new Set();
  for(const link of links.filter(row=>row.kind==='explanatory_support')){
    const target=link.target.propositionId;nodes.add(target);
    for(const condition of link.when){
      nodes.add(condition.propositionId);
      if(!edges.has(condition.propositionId))edges.set(condition.propositionId,new Set());
      edges.get(condition.propositionId).add(target);
    }
  }
  const active=new Set(),done=new Set();
  const visit=node=>{
    if(active.has(node))throw new SemanticLinkError('Explanatory support graph must be acyclic; cycle reaches '+node+'.');
    if(done.has(node))return;
    active.add(node);
    for(const next of edges.get(node)??[])visit(next);
    active.delete(node);done.add(node);
  };
  for(const node of nodes)visit(node);
}

export function validateSemanticLinkSet({linkSet,model}){
  need(linkSet&&typeof linkSet==='object','Semantic link set is required.');
  need(linkSet.schemaVersion==='1.0.0','Unsupported semantic link schema.');
  need(typeof linkSet.linkSetVersion==='string'&&linkSet.linkSetVersion.length>0,'Semantic link set requires a version.');
  need(linkSet.modelVersion===model?.modelVersion,'Semantic link set/model mismatch.');
  need(linkSet.mayChangeInterpretation===false,'Semantic links must not change interpretation.');
  need(Array.isArray(linkSet.links),'Semantic link set requires links.');

  const known=propositionIds(model);
  const sourceIds=new Set((model.sources??[]).map(row=>row.id));
  const ids=new Set();

  for(const link of linkSet.links){
    need(link&&typeof link==='object','Semantic link must be an object.');
    need(typeof link.id==='string'&&link.id.length>0,'Semantic link requires an id.');
    need(!ids.has(link.id),'Duplicate semantic link '+link.id+'.');ids.add(link.id);
    need(kinds.has(link.kind),'Unsupported semantic link kind '+link.kind+'.');
    need(link.mayChangeInterpretation===false,link.id+' must forbid interpretation changes.');
    need(typeof link.explanation==='string'&&link.explanation.trim().length>0,link.id+' requires an explanation.');
    need(Array.isArray(link.sourceClaims)&&link.sourceClaims.length>0,link.id+' requires source claims.');
    for(const claim of link.sourceClaims){
      need(claim&&sourceIds.has(claim.sourceId),link.id+' references unknown source '+claim?.sourceId+'.');
      need(typeof claim.claim==='string'&&claim.claim.trim().length>0,link.id+' source claim must be explicit.');
      need(['supports_link','limits_inference'].includes(claim.relationship),link.id+' has invalid source-claim relationship.');
    }

    if(['explanatory_support','does_not_establish'].includes(link.kind)){
      need(Array.isArray(link.when)&&link.when.length>0,link.id+' requires conditions.');
      link.when.forEach((condition,index)=>validateCondition(condition,known,link.id+' condition '+index));
      validateCondition(link.target,known,link.id+' target');
      need(!link.when.some(condition=>condition.propositionId===link.target.propositionId),
        link.id+' cannot target one of its own conditions.');
    }else{
      need(Array.isArray(link.when)&&link.when.length>=2,link.id+' requires at least two conditions.');
      link.when.forEach((condition,index)=>validateCondition(condition,known,link.id+' condition '+index));
      need(new Set(link.when.map(condition=>condition.propositionId)).size===link.when.length,
        link.id+' cannot repeat a proposition.');
      need(link.target===undefined,link.id+' pair/group links do not use a target.');
    }
  }

  assertSupportGraphAcyclic(linkSet.links);
  return true;
}

function stateMap(report){
  const map=new Map();
  for(const row of report.commitments??[])map.set(row.commitmentId,row.state);
  for(const row of report.derived??[])map.set(row.id,row.state);
  return map;
}

const observed=(condition,map)=>map.get(condition.propositionId)??'not_measured';
const satisfied=(condition,map)=>observed(condition,map)===condition.state;

export function evaluateSemanticLinks({linkSet,model,report}){
  validateSemanticLinkSet({linkSet,model});
  need(report?.modelVersion===model.modelVersion,'Semantic links require a report from the same model version.');
  const map=stateMap(report),findings=[];

  for(const link of linkSet.links){
    if(!link.when.every(condition=>satisfied(condition,map)))continue;
    const conditions=link.when.map(condition=>({
      propositionId:condition.propositionId,
      requiredState:condition.state,
      observedState:observed(condition,map)
    }));

    if(['explanatory_support','does_not_establish'].includes(link.kind)){
      const target={
        propositionId:link.target.propositionId,
        requiredState:link.target.state,
        observedState:observed(link.target,map)
      };
      const targetAlreadyObserved=satisfied(link.target,map);
      findings.push({
        id:link.id,
        kind:link.kind,
        status:link.kind==='does_not_establish'
          ? (targetAlreadyObserved?'boundary_active_target_independently_observed':'boundary_active_target_not_established')
          : (targetAlreadyObserved?'explanation_with_independent_target':'explanation_only'),
        conditions,target,explanation:link.explanation,sourceClaims:link.sourceClaims,
        interpretationChanged:false
      });
      continue;
    }

    findings.push({
      id:link.id,kind:link.kind,status:'active',conditions,
      explanation:link.explanation,sourceClaims:link.sourceClaims,
      interpretationChanged:false
    });
  }

  return {
    schemaVersion:'1.0.0',
    linkSetVersion:linkSet.linkSetVersion,
    modelVersion:model.modelVersion,
    interpretationChanged:false,
    findings
  };
}
