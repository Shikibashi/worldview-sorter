// Editorial governance is a release-time layer. It never scores respondents.
export const CHANGE_CLASSES=Object.freeze(['editorial_only','semantic_clarification','substantive_revision',
 'new_object','deprecation','split','merge','reclassification','source_correction']);
export const OBJECT_TYPES=Object.freeze(['item','construct','proposition','derived_rule','tradition','criterion','source',
 'localization','route','result_semantics','research_classification']);
export const REVIEW_ROLES=Object.freeze(['philosophical','measurement','linguistic','cultural','engineering','privacy']);
const meaningful=new Set(CHANGE_CLASSES.filter(x=>x!=='editorial_only'));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const unique=values=>new Set(values).size===values.length;
const fail=message=>{throw Error('Governance: '+message);};
const insist=(condition,message)=>{if(!condition)fail(message);};
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);

export function requiredReviewRoles(proposal){
 if(proposal.changeClass==='editorial_only')return ['engineering'];
 if(proposal.objectType==='localization')return ['linguistic','philosophical'];
 if(proposal.objectType==='route')return ['philosophical','engineering'];
 if(proposal.objectType==='source')return ['philosophical'];
 if(proposal.objectType==='result_semantics')return ['philosophical','engineering'];
 return ['philosophical','engineering'];
}
export function validateProposal(proposal){
 insist(proposal?.schemaVersion==='model-change-proposal-1','unknown proposal schema');
 insist(/^MCP-[0-9]{4}-[0-9]{3,}$/.test(proposal.proposalId)&&nonempty(proposal.title)&&nonempty(proposal.author),
  'proposal identity is incomplete');
 insist(OBJECT_TYPES.includes(proposal.objectType)&&CHANGE_CLASSES.includes(proposal.changeClass),
  'unknown governed object or change class');
 insist(['draft','under_review','approved','released','rejected','withdrawn'].includes(proposal.status),
  'invalid proposal status');
 insist(Array.isArray(proposal.affectedObjects)&&proposal.affectedObjects.length>0&&
  proposal.affectedObjects.every(x=>OBJECT_TYPES.includes(x.type)&&nonempty(x.id))&&
  unique(proposal.affectedObjects.map(x=>x.type+':'+x.id)),'affected objects are incomplete');
 for(const field of ['currentBehavior','proposedBehavior','rationale','respondentImpact','historicalCompatibility'])
  insist(nonempty(proposal[field]),field+' is required');
 insist(Array.isArray(proposal.alternatives)&&proposal.alternatives.length>0&&proposal.alternatives.every(nonempty),
  'alternatives must be considered');
 insist(Array.isArray(proposal.sourceClaims)&&proposal.sourceClaims.every(x=>nonempty(x.sourceId)&&nonempty(x.claim)&&
  ['supports','challenges','context'].includes(x.relationship)),'source-to-claim links are incomplete');
 if(meaningful.has(proposal.changeClass)){
  const basis=proposal.philosophicalBasis;
  for(const field of ['proposition','neighboringViews','nonEntailments','existingGap','scholarlyDisagreement'])
   insist(field==='neighboringViews'||field==='nonEntailments'?Array.isArray(basis?.[field])&&basis[field].length>0&&basis[field].every(nonempty):nonempty(basis?.[field]),
    'philosophical basis missing '+field);
  insist(proposal.sourceClaims.length>0,'substantive proposal needs claim-linked sources');
  if(proposal.changeClass!=='deprecation'&&['proposition','derived_rule','criterion','tradition'].includes(proposal.objectType))
   insist(proposal.sourceClaims.some(claim=>claim.relationship==='supports'),
    'new or changed inference needs a source claim marked supports; context alone is insufficient');
 }
 insist(proposal.tests&&Array.isArray(proposal.tests.required)&&Array.isArray(proposal.tests.paths)&&
  proposal.tests.required.every(nonempty)&&proposal.tests.paths.every(nonempty),'test plan is incomplete');
 if(meaningful.has(proposal.changeClass)&&['item','proposition','derived_rule','criterion','tradition','result_semantics','research_classification'].includes(proposal.objectType)){
  const cases=['positive','negative','mixed','missing','false_positive_neighbor','historical'];
  insist(cases.every(test=>proposal.tests.required.includes(test)),
   'meaning-sensitive inference change must review positive, negative, mixed, missing, false-positive neighbor, and historical cases');
 }
 insist(Array.isArray(proposal.release?.components)&&proposal.release.components.every(nonempty)&&
  nonempty(proposal.release?.migration),'release consequences are incomplete');
 if(proposal.release.targetVersion!==undefined)insist(/^model-release-[0-9]+\.[0-9]+\.[0-9]+$/.test(proposal.release.targetVersion),
  'invalid target release version');
 insist(Array.isArray(proposal.implementationRefs)&&proposal.implementationRefs.every(nonempty),
  'implementation references must be an array');
 insist(Array.isArray(proposal.review?.approvals),'review history is missing');
 for(const approval of proposal.review.approvals)insist(REVIEW_ROLES.includes(approval.role)&&nonempty(approval.reviewer)&&
  nonempty(approval.note)&&!Number.isNaN(Date.parse(approval.at)),'review record is incomplete');
 if(['approved','released'].includes(proposal.status)){
  const roles=requiredReviewRoles(proposal);
  insist(roles.every(role=>proposal.review.approvals.some(a=>a.role===role)),
   'approval lacks required review roles: '+roles.join(', '));
  insist(proposal.tests.paths.length>0||proposal.changeClass==='editorial_only',
   'approved meaning change lacks regression evidence');
 }
 return proposal;
}

const asMap=(rows,key='id')=>new Map((rows??[]).map(row=>[row[key],row]));
const changedFields=(a,b)=>[...new Set([...Object.keys(a??{}),...Object.keys(b??{})])].filter(key=>stable(a?.[key])!==stable(b?.[key]));
const editorialFields={item:new Set(['notes']),construct:new Set(['candidateItemTarget']),proposition:new Set(),
 derived_rule:new Set(),tradition:new Set(),criterion:new Set(),source:new Set(),localization:new Set(),route:new Set(),
 result_semantics:new Set(),research_classification:new Set()};
const compareRows=(out,type,before,after,component)=>{
 const old=asMap(before),now=asMap(after);
 for(const id of new Set([...old.keys(),...now.keys()])){
  const a=old.get(id),b=now.get(id);if(stable(a)===stable(b))continue;
  const fields=a&&b?changedFields(a,b):[];
  out.push({objectType:type,id,component,kind:!a?'added':!b?'removed':'modified',changedFields:fields,
   risk:!a||!b||fields.some(field=>!editorialFields[type]?.has(field))?'meaning_sensitive':'editorial_only'});
 }
};
const criteria=catalog=>(catalog?.traditions??[]).flatMap(t=>t.commitments.map(c=>({...c,id:t.id+'/'+c.id})));
const localizations=catalogs=>(catalogs?.bundles??[]).flatMap(b=>[
 ...b.itemRealizations.map(r=>({...r,id:b.locale+'/item/'+r.itemId+'@'+r.itemRevision})),
 ...b.propositionRealizations.map(r=>({...r,id:b.locale+'/proposition/'+r.propositionId})),
  ...b.affinityRealizations.map(r=>({...r,id:b.locale+'/tradition/'+r.traditionId}))]);
const localeMetadata=localization=>[
 {id:'catalog/model-binding',modelVersion:localization?.catalog?.modelVersion,
  affinityCatalogVersion:localization?.catalog?.affinityCatalogVersion},
 ...(localization?.catalog?.locales??[]).map(row=>({...row,id:'catalog/'+row.locale})),
 ...(localization?.bundles??[]).map(b=>({id:'bundle/'+b.locale,bundleVersion:b.bundleVersion,status:b.status,
  resultStates:b.resultStates,uiStrings:b.uiStrings,scaleRealizations:b.scaleRealizations,
  sourceRealizations:b.sourceRealizations,sourceNotes:b.sourceNotes,
  terminologyDecisions:b.terminologyDecisions}))];
export function semanticDiff(before,after){
 const changes=[];
 compareRows(changes,'item',before.bank?.items,after.bank?.items,'bank');
 compareRows(changes,'construct',before.registry?.constructs,after.registry?.constructs,'registry');
 compareRows(changes,'proposition',before.model?.commitments,after.model?.commitments,'model');
 compareRows(changes,'derived_rule',before.model?.derivedRules,after.model?.derivedRules,'model');
 compareRows(changes,'tradition',before.affinity?.traditions?.map(({commitments,...rest})=>rest),
  after.affinity?.traditions?.map(({commitments,...rest})=>rest),'affinity');
 compareRows(changes,'criterion',criteria(before.affinity),criteria(after.affinity),'affinity');
 compareRows(changes,'source',before.sources?.sources,after.sources?.sources,'sources');
 compareRows(changes,'source',before.model?.sources,after.model?.sources,'model');
 compareRows(changes,'source',before.affinity?.sources,after.affinity?.sources,'affinity');
 compareRows(changes,'source',before.sourceLedger?.sources,after.sourceLedger?.sources,'source_ledger');
 compareRows(changes,'route',before.routes?.routes,after.routes?.routes,'routes');
 compareRows(changes,'route',[{id:'route-policy',algorithm:before.routes?.algorithm,
  modelVersion:before.routes?.modelVersion,instrumentVersion:before.routes?.instrumentVersion,
  pilotFormPolicyVersion:before.routes?.pilotFormPolicyVersion,
  adaptivePolicyVersion:before.routes?.adaptivePolicyVersion,clarificationBudget:before.routes?.clarificationBudget,
  selectionBasis:before.routes?.selectionBasis,resultSemanticsVersion:before.routes?.resultSemanticsVersion,
  affinityCatalogVersion:before.routes?.affinityCatalogVersion}],
  [{id:'route-policy',algorithm:after.routes?.algorithm,adaptivePolicyVersion:after.routes?.adaptivePolicyVersion,
   modelVersion:after.routes?.modelVersion,instrumentVersion:after.routes?.instrumentVersion,
   pilotFormPolicyVersion:after.routes?.pilotFormPolicyVersion,
   clarificationBudget:after.routes?.clarificationBudget,selectionBasis:after.routes?.selectionBasis,
   resultSemanticsVersion:after.routes?.resultSemanticsVersion,
   affinityCatalogVersion:after.routes?.affinityCatalogVersion}],'routes');
 compareRows(changes,'localization',localizations(before.localization),localizations(after.localization),'localization');
 compareRows(changes,'localization',localeMetadata(before.localization),localeMetadata(after.localization),'localization');
 compareRows(changes,'result_semantics',[{id:'model-policy',publicRuleIds:before.model?.publicRuleIds,
  comparisons:before.model?.comparisons,coverage:before.model?.coverage,
  evidenceConcepts:before.model?.evidenceConcepts,tensionPairs:before.model?.tensionPairs}],
  [{id:'model-policy',publicRuleIds:after.model?.publicRuleIds,comparisons:after.model?.comparisons,
   coverage:after.model?.coverage,evidenceConcepts:after.model?.evidenceConcepts,
   tensionPairs:after.model?.tensionPairs}],'model');
 compareRows(changes,'result_semantics',[{id:'affinity-catalog-policy',affinitySemanticsVersion:before.affinity?.affinitySemanticsVersion,
  modelVersion:before.affinity?.modelVersion,instrumentVersion:before.affinity?.instrumentVersion,
  identityOutputAllowed:before.affinity?.identityOutputAllowed,percentageMatchAllowed:before.affinity?.percentageMatchAllowed}],
  [{id:'affinity-catalog-policy',affinitySemanticsVersion:after.affinity?.affinitySemanticsVersion,
   modelVersion:after.affinity?.modelVersion,instrumentVersion:after.affinity?.instrumentVersion,
   identityOutputAllowed:after.affinity?.identityOutputAllowed,
   percentageMatchAllowed:after.affinity?.percentageMatchAllowed}],'affinity');
 for(const [type,component,oldValue,newValue] of [
  ['result_semantics','model',before.model?.resultSemanticsVersion,after.model?.resultSemanticsVersion],
  ['research_classification','model',before.model?.researchOnlyRuleIds,after.model?.researchOnlyRuleIds]])
  if(stable(oldValue)!==stable(newValue))changes.push({objectType:type,id:type,component,kind:'modified',changedFields:[type],risk:'meaning_sensitive'});
 const oldPublic=new Set(before.model?.publicRuleIds??[]),newPublic=new Set(after.model?.publicRuleIds??[]);
 for(const id of new Set([...oldPublic,...newPublic]))if(oldPublic.has(id)!==newPublic.has(id))
  changes.push({objectType:'research_classification',id,component:'model',
   kind:newPublic.has(id)?'added':'removed',changedFields:['publicRuleIds'],risk:'meaning_sensitive'});
 return changes.sort((a,b)=>(a.component+a.objectType+a.id).localeCompare(b.component+b.objectType+b.id));
}

export function buildDependencyGraph({bank,registry,model,affinity,routes,localization,sourceLedger,sources}){
 const edges=[];const add=(from,to,relation,detail={})=>{if(nonempty(from)&&nonempty(to))edges.push({from,to,relation,...detail});};
 const sourceMap=new Map([...(sources?.sources??[]),...sourceLedger.sources,...model.sources,...affinity.sources]
  .map(source=>[source.id,source]));
 const addSourceClaims=(object,node,fallbackRelation)=>{
  for(const id of object.sourceIds??[]){
   const claims=(object.sourceClaims??[]).filter(claim=>claim.sourceId===id);
   if(claims.length)for(const claim of claims)add('source:'+id,node,'claim_'+claim.relationship,{claim:claim.claim});
   else {const source=sourceMap.get(id),claim=source?.claim??source?.implication;
    add('source:'+id,node,fallbackRelation,{claimStatus:claim?'source_record_claim':'topic_only',...(claim?{claim}:{})});}
  }
 };
 const derivedIds=new Set(model.derivedRules.map(r=>r.id));
 for(const item of bank.items){const node='item:'+item.id;
  for(const target of item.targets??[])add(node,'construct:'+target.constructId,'targets');
  for(const id of item.provenance?.sourceRefs??[])add('source:'+id,node,'item_basis');}
 for(const construct of registry.constructs){for(const id of construct.evidenceBasis??[])add('source:'+id,'construct:'+construct.id,'definition_basis');}
 for(const source of sourceLedger.sources){
  for(const id of source.useByItems??[])add('source:'+source.id,'item:'+id,'ledger_item_basis');
  for(const id of source.useByConstructs??[])add('source:'+source.id,'construct:'+id,'ledger_construct_basis');
  for(const id of source.useByRules??[])add('source:'+source.id,
   (model.derivedRules.some(rule=>rule.id===id)?'derived_rule:':'proposition:')+id,'ledger_rule_basis',
   {claimStatus:'ledger_reference'});
 }
 for(const rule of model.commitments){const node='proposition:'+rule.id;
  add('construct:'+rule.constructId,node,'interprets');
  for(const evidence of rule.evidence??[])add('item:'+evidence.itemId,node,'evidence',{
   itemRevision:evidence.itemRevision,unitId:evidence.unitId,support:evidence.support,oppose:evidence.oppose});
  addSourceClaims(rule,node,'rule_basis');
  if(model.publicRuleIds.includes(rule.id))add(node,'result_domain:'+rule.domainId,'public_domain_result');}
 for(const rule of model.derivedRules){const node='derived_rule:'+rule.id;
  add('construct:'+rule.constructId,node,'derived_construct');
  for(const dep of rule.requires??[])add('proposition:'+dep.ruleId,node,'derives_from',{requiredState:dep.state});
  addSourceClaims(rule,node,'derived_basis');
  add(node,'result_domain:'+rule.domainId,'derived_domain_result');}
 for(const comparison of model.comparisons??[])for(const criterion of comparison.criteria??[])
  add('proposition:'+criterion.commitmentId,'comparison:'+comparison.id,'comparison_criterion',
   {expected:criterion.expected,role:criterion.role});
 for(const covered of model.coverage?.constructs??[])for(const ruleId of covered.ruleIds??[])
  add((derivedIds.has(ruleId)?'derived_rule:':'proposition:')+ruleId,
   'coverage:'+covered.id,'coverage_rule');
 for(const pair of model.tensionPairs??[])for(const side of ['left','right'])
  add((derivedIds.has(pair[side+'RuleId'])?'derived_rule:':'proposition:')+pair[side+'RuleId'],
   'tension:'+pair.id,'tension_indicator',{side,expectedState:pair[side+'State']});
 for(const tradition of affinity.traditions){const node='tradition:'+tradition.id;
  addSourceClaims({...tradition,sourceIds:[...tradition.primarySourceIds,...tradition.secondarySourceIds]},node,'tradition_basis');
  for(const criterion of tradition.commitments){const c='criterion:'+tradition.id+'/'+criterion.id;
   add(c,node,'doctrine',{role:criterion.role,doctrine:criterion.doctrine});
   if(criterion.mapping?.propositionId)add((derivedIds.has(criterion.mapping.propositionId)?'derived_rule:':'proposition:')+criterion.mapping.propositionId,c,'criterion_mapping',
    {mappingStatus:criterion.mapping.status,expectedState:criterion.mapping.expectedState??null});
   addSourceClaims(criterion,c,'doctrinal_basis');}}
 for(const route of routes.routes){
  const assigned=new Set(route.itemRefs.map(ref=>ref.itemId+'@'+ref.itemRevision));
  for(const ref of route.itemRefs)add('item:'+ref.itemId,'route:'+route.id,'assigned',
   {itemRevision:ref.itemRevision});
  for(const rule of model.commitments){const included=(rule.evidence??[]).filter(e=>assigned.has(e.itemId+'@'+e.itemRevision));
   if(included.length)add('proposition:'+rule.id,'route:'+route.id,'interpreted_on_route',
    {itemRefs:included.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision}))});
  }
 }
 for(const bundle of localization.bundles){for(const row of bundle.itemRealizations)add('item:'+row.itemId,'localization:'+bundle.locale+'/item/'+row.itemId,'translated');
  for(const row of bundle.propositionRealizations)add((derivedIds.has(row.propositionId)?'derived_rule:':'proposition:')+row.propositionId,'localization:'+bundle.locale+'/proposition/'+row.propositionId,'translated');
  for(const row of bundle.affinityRealizations)add('tradition:'+row.traditionId,'localization:'+bundle.locale+'/tradition/'+row.traditionId,'translated');}
 return {edges};
}
export function analyzeImpact(graph,objectType,id){
 const start=objectType+':'+id,byFrom=new Map();
 for(const edge of graph.edges){const list=byFrom.get(edge.from)??[];list.push(edge);byFrom.set(edge.from,list);}
 const seen=new Set([start]),distance=new Map([[start,0]]),queue=[start],affected=[];
 while(queue.length){const from=queue.shift();for(const edge of byFrom.get(from)??[]){
  if(seen.has(edge.to))continue;seen.add(edge.to);distance.set(edge.to,distance.get(from)+1);
  queue.push(edge.to);affected.push({...edge,depth:distance.get(edge.to)});}}
 return {objectType,id,affected,counts:Object.fromEntries([...new Set(affected.map(e=>e.to.split(':')[0]))].map(type=>
  [type,affected.filter(e=>e.to.startsWith(type+':')).length]))};
}

export function sourceTrace(graph,sourceId){return analyzeImpact(graph,'source',sourceId);}
export function traceBasis(graph,objectType,id){
 const start=objectType+':'+id,byTo=new Map();for(const edge of graph.edges){const list=byTo.get(edge.to)??[];list.push(edge);byTo.set(edge.to,list);}
 const seen=new Set([start]),queue=[start],basis=[];
 while(queue.length){const to=queue.shift();for(const edge of byTo.get(to)??[]){
  if(edge.relation==='targets')continue; // item targets are not evidence for a particular rule
  basis.push(edge);
  if(seen.has(edge.from))continue;
  seen.add(edge.from);queue.push(edge.from);}}
 const sources=[...seen].filter(node=>node.startsWith('source:')).map(node=>node.slice(7)).sort();
 const directSourceLinks=basis.filter(edge=>edge.to===start&&edge.from.startsWith('source:'));
 const directIds=new Set(directSourceLinks.map(edge=>edge.from.slice(7)));
 return {objectType,id,basis,sources,directSourceLinks,
  upstreamSourceIds:sources.filter(sourceId=>!directIds.has(sourceId))};
}
export function sourceQuality(source){
 const type=source.type??source.evidenceType??source.kind??'unspecified';
 if(type==='primary'||type==='primary_source')return 'primary_philosophical_text_or_statement';
 if(type==='primary_empirical_research_context_limited')return 'context_limited_empirical_research';
 if(type==='author_theoretical_overview')return 'academic_author_overview';
 if(type.includes('instrument')||type.includes('measurement')||type.includes('survey'))return 'measurement_or_survey_literature';
 if(type.includes('peer_reviewed'))return 'peer_reviewed_research';
 if(type.includes('monograph'))return 'academic_book';
 if(type==='academic_secondary'||type.includes('scholarly')||type.includes('academic_conceptual'))return 'academic_secondary_or_reference';
 if(type==='project')return 'provisional_project_source';
 if(type==='article')return 'article_source_type_unverified';
 return 'needs_source_type_review';
}

export function claimLevelProvenance(model){
 const modelSources=new Map(model.sources.map(source=>[source.id,source]));
 const publicSourceLinks=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id)).map(rule=>{
  const ruleLinked=rule.sourceIds.filter(id=>rule.sourceClaims?.some(claim=>claim.sourceId===id&&nonempty(claim.claim)));
  const ruleLinkedSupporting=rule.sourceIds.filter(id=>rule.sourceClaims?.some(claim=>claim.sourceId===id&&
   claim.relationship==='supports'&&nonempty(claim.claim)));
  const sourceRecordOnly=rule.sourceIds.filter(id=>!ruleLinked.includes(id)&&
   nonempty(modelSources.get(id)?.claim??modelSources.get(id)?.implication));
  return {ruleId:rule.id,sourceIds:rule.sourceIds,ruleLinked,ruleLinkedSupporting,sourceRecordOnly,
   withoutExplicitClaim:rule.sourceIds.filter(id=>!ruleLinked.includes(id)&&!sourceRecordOnly.includes(id))};
 });
 return {
  totalPublicRuleSourceReferences:publicSourceLinks.reduce((sum,rule)=>sum+rule.sourceIds.length,0),
  ruleLinkedClaimReferences:publicSourceLinks.reduce((sum,rule)=>sum+rule.ruleLinked.length,0),
  ruleLinkedSupportingClaimReferences:publicSourceLinks.reduce((sum,rule)=>sum+rule.ruleLinkedSupporting.length,0),
  sourceRecordClaimOnlyReferences:publicSourceLinks.reduce((sum,rule)=>sum+rule.sourceRecordOnly.length,0),
  referencesWithoutExplicitClaim:publicSourceLinks.reduce((sum,rule)=>sum+rule.withoutExplicitClaim.length,0),
  rulesWithoutRuleLinkedSupportingClaim:publicSourceLinks.filter(rule=>!rule.ruleLinkedSupporting.length)
   .map(rule=>rule.ruleId),
  rulesWithNoExplicitSourceClaim:publicSourceLinks.filter(rule=>rule.withoutExplicitClaim.length===rule.sourceIds.length)
   .map(rule=>({ruleId:rule.ruleId,sourceIds:rule.sourceIds})),
  rulesWithPartialClaimMetadata:publicSourceLinks.filter(rule=>rule.withoutExplicitClaim.length>0&&
   rule.withoutExplicitClaim.length<rule.sourceIds.length)
   .map(rule=>({ruleId:rule.ruleId,sourceIdsWithoutExplicitClaim:rule.withoutExplicitClaim})),
  limitation:'Only a rule-linked claim marked supports counts as a supporting academic-basis link. Context or challenge claims and broader source-record claims do not support every citing rule. A supporting link still does not prove item validity or empirical calibration.'};
}

export function explicitPropositionCoverage(model){
 const publicRules=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id));
 const withoutExplicitProposition=publicRules.filter(rule=>!nonempty(rule.proposition))
  .map(rule=>({ruleId:rule.id,scope:rule.scope}));
 return {publicRuleCount:publicRules.length,
  withExplicitProposition:publicRules.length-withoutExplicitProposition.length,
  withoutExplicitProposition,
  limitation:'A legacy scope label is not a reviewed standalone inferred proposition. New or revised rules must retain their reviewed exact proposition in the versioned model.'};
}

export function affinityLegacyScopeDependencies({model,catalog}){
 const rules=new Map(model.commitments.map(rule=>[rule.id,rule]));
 const linkedSupport=rule=>rule?.sourceClaims?.some(claim=>claim.relationship==='supports'&&
  rule.sourceIds?.includes(claim.sourceId)&&nonempty(claim.claim))??false;
 const mapped=catalog.traditions.flatMap(tradition=>tradition.commitments
  .filter(criterion=>['direct','partial'].includes(criterion.mapping.status))
  .map(criterion=>({traditionId:tradition.id,criterionId:criterion.id,role:criterion.role,
   doctrine:criterion.doctrine,mappingStatus:criterion.mapping.status,
   propositionId:criterion.mapping.propositionId,
   rule:rules.get(criterion.mapping.propositionId),criterionSourceIds:criterion.sourceIds})));
 const legacy=mapped.filter(row=>!nonempty(row.rule?.proposition)).map(({rule,...row})=>({
  ...row,legacyScope:rule?.scope??null,ruleSourceIds:rule?.sourceIds??[],
  ruleHasLinkedSupportingClaim:linkedSupport(rule)}));
 const unlinked=mapped.filter(row=>!linkedSupport(row.rule)).map(({rule,...row})=>({
  ...row,ruleProposition:rule?.proposition??null,ruleScope:rule?.scope??null,
  ruleSourceIds:rule?.sourceIds??[]}));
 return {mappedCriterionCount:mapped.length,criteriaWithoutExplicitRuleProposition:legacy,
  criteriaWithoutLinkedSupportingClaim:unlinked,
  limitation:'This is a metadata dependency audit. A legacy scope is not an independently reviewed standalone proposition, and a topic citation is not a rule-linked supporting claim. Neither gap alone proves a doctrinal mapping false or valid.'};
}

export function routeEvidenceOpportunities({model,routes,catalog}){
 const publicRules=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id));
 const rules=new Map(publicRules.map(rule=>[rule.id,rule]));
 const mappedCriteria=catalog.traditions.flatMap(tradition=>tradition.commitments
  .filter(criterion=>['direct','partial'].includes(criterion.mapping.status))
  .map(criterion=>({traditionId:tradition.id,criterionId:criterion.id,role:criterion.role,
   mappingStatus:criterion.mapping.status,ruleId:criterion.mapping.propositionId})));
 const itemRef=e=>({itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId});
 return {basis:'Exact route item revisions and authored evidence units. Unit counts are content opportunities, not demonstrated independence, respondent evidence, or psychometric quality.',
  routes:routes.routes.map(route=>{
   const assigned=new Set(route.itemRefs.map(ref=>ref.itemId+'@'+ref.itemRevision));
   const available=rule=>rule.evidence.filter(e=>assigned.has(e.itemId+'@'+e.itemRevision));
   const units=(evidence,direction)=>[...new Set(evidence.filter(e=>e[direction].length).map(e=>e.unitId))];
   const thresholdReachable=rule=>{
    const evidence=available(rule);
    return ['support','oppose'].every(direction=>units(evidence,direction).length>=rule.minimumEvidenceUnits);
   };
   const atMinimum=publicRules.filter(rule=>{
    const evidence=available(rule);
    return ['support','oppose'].every(direction=>units(evidence,direction).length===rule.minimumEvidenceUnits);
   });
   return {routeId:route.id,routeVersion:route.routeVersion,
    thresholdReachablePublicRuleCount:publicRules.filter(thresholdReachable).length,
    belowThresholdPublicRuleCount:publicRules.filter(rule=>!thresholdReachable(rule)).length,
    rulesAtMinimumBothDirections:atMinimum.map(rule=>rule.id),
    mappedAffinityCriteria:mappedCriteria.map(criterion=>{
     const rule=rules.get(criterion.ruleId),evidence=available(rule);
     return {...criterion,minimumEvidenceUnits:rule.minimumEvidenceUnits,thresholdReachable:thresholdReachable(rule),
      availableSupportUnitIds:units(evidence,'support'),availableOpposeUnitIds:units(evidence,'oppose'),
      administeredItemRefs:evidence.map(itemRef),
      omittedMappedItemRefs:rule.evidence.filter(e=>!assigned.has(e.itemId+'@'+e.itemRevision)).map(itemRef)};
    })};
  })};
}

export function validateReleaseTransition({previousManifest,nextManifest,changes,proposals,nextSnapshot=null}){
 const parse=x=>x.split('-').at(-1).split('.').map(Number),old=parse(previousManifest.releaseVersion),next=parse(nextManifest.releaseVersion);
 insist(next.some((part,i)=>part>old[i]&&next.slice(0,i).every((value,j)=>value===old[j])),
  'a new model release version is required');
 const before=new Map(previousManifest.components.map(c=>[c.key,c])),after=new Map(nextManifest.components.map(c=>[c.key,c]));
 const keyFor=component=>component==='localization'?'localization_catalog':component==='routes'?'progressive_routes':component;
 const matchingProposal=change=>proposals.filter(p=>['approved','released'].includes(p.status)&&
   (!p.release.targetVersion||p.release.targetVersion===nextManifest.releaseVersion)&&
   p.affectedObjects.some(o=>o.type===change.objectType&&o.id===change.id)&&
   p.release.components.includes(keyFor(change.component)))
  .sort((a,b)=>Number(b.release.targetVersion===nextManifest.releaseVersion)-Number(a.release.targetVersion===nextManifest.releaseVersion))[0];
 const classified=new Set(changes.map(change=>keyFor(change.component)));
 for(const [key,prior] of before){const future=after.get(key);
  insist(future,'release removed component '+key);
  if(prior.sha256===future.sha256)continue;
  insist(prior.path!==future.path&&prior.version!==future.version,'changed component needs a new path and version: '+key);
  const parent=key.startsWith('localization_bundle:')?'localization_catalog':
   key==='localization_manifest'?'localization_catalog':key==='progressive_manifest'?'progressive_routes':
   key.endsWith('_manifest')?key.replace('_manifest',''):key;
  insist(classified.has(parent)||['pilot','content_review','unmapped_audit','full_form','source_ledger','response_scales'].includes(key)&&
   proposals.some(p=>['approved','released'].includes(p.status)&&p.release.components.includes(key)),
   'unclassified component change needs an approved proposal: '+key);
 }
 for(const [key] of after)if(!before.has(key))insist(key==='engine_source'&&classified.has(key),
  'unclassified new release component: '+key);
 for(const change of changes){
  const component=keyFor(change.component);
  const prior=before.get(component),future=after.get(component);
  insist(future&&(prior?prior.path!==future.path&&prior.version!==future.version:
   component==='engine_source'&&change.kind==='added'),
   change.objectType+':'+change.id+' requires a new '+component+' artifact path and version');
 const matching=matchingProposal(change);
  if(change.risk==='editorial_only')continue;
  insist(matching,'missing approved proposal for '+change.objectType+':'+change.id);
  validateProposal(matching);
  insist(change.risk==='editorial_only'||meaningful.has(matching.changeClass),
   'a meaning-sensitive change cannot use editorial_only approval: '+change.objectType+':'+change.id);
  if(change.objectType==='research_classification'&&change.id!=='research_classification'){
   insist(change.kind==='added'?matching.changeClass==='reclassification':
    ['reclassification','deprecation'].includes(matching.changeClass),
    'public-rule membership needs a reclassification or deprecation proposal: '+change.id);
   if(change.kind==='added'){
    insist(nextSnapshot,'public-rule promotion requires the next release snapshot');
    const rule=nextSnapshot.model.commitments.find(row=>row.id===change.id);
    insist(rule&&nextSnapshot.model.publicRuleIds.includes(change.id)&&
     nonempty(rule.proposition)&&rule.proposition===matching.philosophicalBasis.proposition,
    'promoted public rule needs its exact reviewed proposition: '+change.id);
    insist(rule.sourceClaims?.some(claim=>claim.relationship==='supports'&&
     rule.sourceIds.includes(claim.sourceId)&&nonempty(claim.claim)&&
     matching.sourceClaims.some(reviewed=>reviewed.relationship==='supports'&&
      reviewed.sourceId===claim.sourceId&&reviewed.claim===claim.claim)),
    'promoted public rule needs a matching reviewed supporting source claim: '+change.id);
   }
  }
  if(change.kind!=='removed'&&matching.changeClass!=='deprecation'&&
   ['proposition','derived_rule','criterion','tradition'].includes(change.objectType)){
   insist(nextSnapshot,'changed philosophical claim requires the next release snapshot');
   let object=null,cited=[];
   if(change.objectType==='proposition')object=nextSnapshot.model.commitments.find(row=>row.id===change.id);
   if(change.objectType==='derived_rule')object=nextSnapshot.model.derivedRules.find(row=>row.id===change.id);
   if(change.objectType==='criterion'){
    const tradition=nextSnapshot.affinity.traditions.find(t=>t.commitments.some(c=>t.id+'/'+c.id===change.id));
    object=tradition?.commitments.find(c=>tradition.id+'/'+c.id===change.id);
   }
   if(change.objectType==='tradition')object=nextSnapshot.affinity.traditions.find(row=>row.id===change.id);
   if(['proposition','derived_rule'].includes(change.objectType))insist(
    nonempty(object?.proposition)&&object.proposition===matching.philosophicalBasis.proposition,
    'changed interpretation rule must retain the exact reviewed proposition: '+change.id);
   if(change.objectType==='derived_rule')for(const dependency of object.requires??[]){
    const direct=nextSnapshot.model.commitments.find(rule=>rule.id===dependency.ruleId);
    insist(nextSnapshot.model.publicRuleIds.includes(dependency.ruleId)&&nonempty(direct?.proposition),
     'derived rule depends on a public exact proposition: '+change.id+' → '+dependency.ruleId);
    insist(direct.sourceClaims?.some(claim=>claim.relationship==='supports'&&
     direct.sourceIds.includes(claim.sourceId)&&nonempty(claim.claim)),
    'derived rule prerequisite lacks a rule-linked supporting source claim: '+change.id+' → '+dependency.ruleId);
   }
   if(change.objectType==='criterion')insist(
    nonempty(object?.doctrine)&&object.doctrine===matching.philosophicalBasis.proposition,
    'changed affinity criterion must retain the exact reviewed doctrine: '+change.id);
   const mappedCriteria=change.objectType==='criterion'?[object]:
    change.objectType==='tradition'&&change.kind==='added'?object?.commitments??[]:[];
   for(const criterion of mappedCriteria.filter(row=>['direct','partial'].includes(row?.mapping?.status))){
    const mapped=nextSnapshot.model.commitments.find(rule=>rule.id===criterion.mapping.propositionId);
    insist(nextSnapshot.model.publicRuleIds.includes(criterion.mapping.propositionId)&&nonempty(mapped?.proposition),
     'new or changed affinity criterion must map to an explicit public proposition: '+change.id+'/'+criterion.id);
    insist(mapped.sourceClaims?.some(claim=>claim.relationship==='supports'&&
     mapped.sourceIds.includes(claim.sourceId)&&nonempty(claim.claim)),
     'new or changed affinity criterion needs a rule-linked supporting source claim on its public proposition: '+change.id+'/'+criterion.id);
   }
   for(const criterion of mappedCriteria.filter(row=>row?.mapping?.status==='derived')){
    const derived=nextSnapshot.model.derivedRules.find(rule=>rule.id===criterion.mapping.propositionId);
    insist(nonempty(derived?.proposition)&&derived.sourceClaims?.some(claim=>claim.relationship==='supports'&&
     derived.sourceIds.includes(claim.sourceId)&&nonempty(claim.claim)),
    'new or changed affinity criterion needs an exact sourced derived conclusion: '+change.id+'/'+criterion.id);
    for(const dependency of derived.requires??[]){
     const direct=nextSnapshot.model.commitments.find(rule=>rule.id===dependency.ruleId);
     insist(nextSnapshot.model.publicRuleIds.includes(dependency.ruleId)&&nonempty(direct?.proposition)&&
      direct.sourceClaims?.some(claim=>claim.relationship==='supports'&&
       direct.sourceIds.includes(claim.sourceId)&&nonempty(claim.claim)),
      'new or changed affinity criterion needs exact sourced derived prerequisites: '+change.id+'/'+criterion.id+' → '+dependency.ruleId);
    }
   }
   cited=change.objectType==='tradition'
    ? [...(object?.primarySourceIds??[]),...(object?.secondarySourceIds??[])]
    : (object?.sourceIds??[]);
   insist(object&&Array.isArray(object.sourceClaims)&&object.sourceClaims.length>0,
    'changed philosophical claim must retain sourceClaims in its released definition: '+change.id);
   insist(object.sourceClaims.every(claim=>nonempty(claim.sourceId)&&nonempty(claim.claim)&&
    ['supports','challenges','context'].includes(claim.relationship)&&cited.includes(claim.sourceId)),
   'released source claim must cite a source declared by '+change.id);
   insist(object.sourceClaims.some(claim=>claim.relationship==='supports'&&matching.sourceClaims.some(reviewed=>
    reviewed.relationship==='supports'&&reviewed.sourceId===claim.sourceId&&reviewed.claim===claim.claim)),
   'released philosophical claim needs a matching reviewed supporting source claim: '+change.id);
  }
 }
 return {changedObjects:changes.length,approvedProposalIds:[...new Set(changes.map(change=>
  matchingProposal(change)?.proposalId).filter(Boolean))]};
}

export function releaseNotes(changes){
 const sections={userVisible:[],editorial:[],researchAndModel:[],deprecations:[]};
 for(const c of changes){const text=`${c.objectType} ${c.id}: ${c.kind}${c.changedFields.length?' ('+c.changedFields.join(', ')+')':''}`;
  if(c.kind==='removed'||c.changedFields.includes('status'))sections.deprecations.push(text);
  else if(c.risk==='editorial_only')sections.editorial.push(text);
  else if(['item','route','result_semantics','localization'].includes(c.objectType)||
   c.objectType==='research_classification'&&c.kind==='added')sections.userVisible.push(text);
  else sections.researchAndModel.push(text);}
 return sections;
}
