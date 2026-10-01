export class WorldviewRelationError extends Error {
  constructor(message){super(message);this.name='WorldviewRelationError';}
}

const need=(ok,message)=>{if(!ok)throw new WorldviewRelationError(message);};
const directionalStates=new Set(['supported','opposed']);
const relationTypes=new Set(['grounding','non_entailment','compatibility','potential_tension','logical_conflict']);
const pairTypes=new Set(['compatibility','potential_tension','logical_conflict']);

function knownPropositionIds(model){
  return new Set([
    ...(model.commitments??[]).map(row=>row.id),
    ...(model.derivedRules??[]).map(row=>row.id)
  ]);
}

function validateCondition(condition,propositionIds,label){
  need(condition&&typeof condition==='object',label+' must be an object.');
  need(propositionIds.has(condition.propositionId),label+' references unknown proposition '+condition.propositionId+'.');
  need(directionalStates.has(condition.state),label+' requires supported or opposed.');
}

function conditionObserved(condition,states){
  return states.get(condition.propositionId)??'not_measured';
}

function conditionSatisfied(condition,states){
  return conditionObserved(condition,states)===condition.state;
}

function assertGroundingAcyclic(relations){
  const edges=new Map();
  const nodes=new Set();
  for(const relation of relations.filter(row=>row.type==='grounding')){
    const target=relation.conclusion.propositionId;nodes.add(target);
    for(const premise of relation.premises){
      nodes.add(premise.propositionId);
      if(!edges.has(premise.propositionId))edges.set(premise.propositionId,new Set());
      edges.get(premise.propositionId).add(target);
    }
  }
  const visiting=new Set(),visited=new Set();
  const walk=node=>{
    if(visiting.has(node))throw new WorldviewRelationError('Grounding graph must be acyclic; cycle reaches '+node+'.');
    if(visited.has(node))return;
    visiting.add(node);
    for(const next of edges.get(node)??[])walk(next);
    visiting.delete(node);visited.add(node);
  };
  for(const node of nodes)walk(node);
}

export function validateRelationGraph({graph,model}){
  need(graph&&typeof graph==='object','Semantic relation graph is required.');
  need(graph.schemaVersion==='1.0.0','Unsupported semantic relation schema.');
  need(typeof graph.graphVersion==='string'&&graph.graphVersion.length>0,'Semantic relation graph requires a version.');
  need(graph.modelVersion===model?.modelVersion,'Semantic relation graph/model mismatch.');
  need(graph.inferenceAllowed===false,'Semantic relation graph must be presentation-only.');
  need(Array.isArray(graph.relations),'Semantic relation graph requires relations.');

  const propositionIds=knownPropositionIds(model);
  const sourceIds=new Set((model.sources??[]).map(row=>row.id));
  const ids=new Set();

  for(const relation of graph.relations){
    need(relation&&typeof relation==='object','Relation must be an object.');
    need(typeof relation.id==='string'&&relation.id.length>0,'Relation requires an id.');
    need(!ids.has(relation.id),'Duplicate semantic relation '+relation.id+'.');ids.add(relation.id);
    need(relationTypes.has(relation.type),'Unsupported semantic relation type '+relation.type+'.');
    need(typeof relation.explanation==='string'&&relation.explanation.trim().length>0,relation.id+' requires an explanation.');
    need(relation.inferenceAllowed===false,relation.id+' must explicitly forbid inference.');
    need(Array.isArray(relation.sourceClaims)&&relation.sourceClaims.length>0,relation.id+' requires claim-level source provenance.');
    for(const sourceClaim of relation.sourceClaims){
      need(sourceClaim&&sourceIds.has(sourceClaim.sourceId),relation.id+' references unknown source '+sourceClaim?.sourceId+'.');
      need(typeof sourceClaim.claim==='string'&&sourceClaim.claim.trim().length>0,relation.id+' source claim must be explicit.');
      need(['supports_relation','limits_inference'].includes(sourceClaim.relationship),relation.id+' has invalid source-claim relationship.');
    }

    if(relation.type==='grounding'||relation.type==='non_entailment'){
      need(Array.isArray(relation.premises)&&relation.premises.length>0,relation.id+' requires premises.');
      relation.premises.forEach((row,index)=>validateCondition(row,propositionIds,relation.id+' premise '+index));
      validateCondition(relation.conclusion,propositionIds,relation.id+' conclusion');
      need(!relation.premises.some(row=>row.propositionId===relation.conclusion.propositionId),
        relation.id+' cannot use its conclusion as a premise.');
      if(relation.type==='grounding')need(relation.presentation==='explanatory_grounding',relation.id+' grounding must be explanatory only.');
      if(relation.type==='non_entailment')need(relation.presentation==='inference_guard',relation.id+' non-entailment must be an inference guard.');
    }else{
      need(pairTypes.has(relation.type),'Invalid relation type.');
      need(Array.isArray(relation.members)&&relation.members.length>=2,relation.id+' requires at least two members.');
      relation.members.forEach((row,index)=>validateCondition(row,propositionIds,relation.id+' member '+index));
      need(new Set(relation.members.map(row=>row.propositionId)).size===relation.members.length,
        relation.id+' cannot repeat a proposition.');
      need(relation.presentation==='exploration',relation.id+' must remain an exploration relation.');
    }
  }

  assertGroundingAcyclic(graph.relations);
  return true;
}

function reportStates(report){
  const states=new Map();
  for(const row of report.commitments??[])states.set(row.commitmentId,row.state);
  for(const row of report.derived??[])states.set(row.id,row.state);
  return states;
}

export function evaluateWorldviewRelations({graph,model,report}){
  validateRelationGraph({graph,model});
  need(report?.modelVersion===model.modelVersion,'Semantic relations require a report from the same model version.');
  const states=reportStates(report);
  const findings=[];

  for(const relation of graph.relations){
    if(relation.type==='grounding'||relation.type==='non_entailment'){
      const premiseObservations=relation.premises.map(row=>({
        propositionId:row.propositionId,
        requiredState:row.state,
        observedState:conditionObserved(row,states)
      }));
      if(!relation.premises.every(row=>conditionSatisfied(row,states)))continue;
      const conclusionObservation={
        propositionId:relation.conclusion.propositionId,
        requiredState:relation.conclusion.state,
        observedState:conditionObserved(relation.conclusion,states)
      };
      const conclusionSatisfied=conditionSatisfied(relation.conclusion,states);
      findings.push({
        id:relation.id,
        type:relation.type,
        status:relation.type==='non_entailment'?
          (conclusionSatisfied?'guard_active_conclusion_independently_observed':'guard_active_conclusion_not_established'):
          (conclusionSatisfied?'grounding_context_with_independent_conclusion':'grounding_context_only'),
        premiseObservations,
        conclusionObservation,
        explanation:relation.explanation,
        sourceClaims:relation.sourceClaims,
        inferenceApplied:false
      });
      continue;
    }

    if(!relation.members.every(row=>conditionSatisfied(row,states)))continue;
    findings.push({
      id:relation.id,
      type:relation.type,
      status:'active',
      memberObservations:relation.members.map(row=>({
        propositionId:row.propositionId,
        requiredState:row.state,
        observedState:conditionObserved(row,states)
      })),
      explanation:relation.explanation,
      sourceClaims:relation.sourceClaims,
      inferenceApplied:false
    });
  }

  return {
    schemaVersion:'1.0.0',
    graphVersion:graph.graphVersion,
    modelVersion:model.modelVersion,
    inferenceApplied:false,
    findings
  };
}
