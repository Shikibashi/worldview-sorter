import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const current=await read('data/current.json');
const [policy,bank,model,catalog]=await Promise.all([
 read(current.progressiveDepth.path),read(current.candidateBank.path),
 read(current.worldviewModel.path),read(current.affinityCatalog.path)]);
const byItem=new Map(bank.items.map(item=>[item.id,item]));
const publicRules=model.commitments.filter(c=>model.publicRuleIds.includes(c.id));
const publicEvidence=new Set(publicRules.flatMap(c=>c.evidence.map(e=>e.itemId)));
const assessable=ids=>new Set(publicRules.filter(c=>{
 const e=c.evidence.filter(x=>ids.has(x.itemId));
 return new Set(e.filter(x=>x.support.length).map(x=>x.unitId)).size>=c.minimumEvidenceUnits&&
  new Set(e.filter(x=>x.oppose.length).map(x=>x.unitId)).size>=c.minimumEvidenceUnits;
}).map(c=>c.id));
const report={schemaVersion:'depth-comparison-1',policyVersion:policy.policyVersion,
 qualification:'Authored content opportunities only; no respondent certainty, item information, or psychometric optimality is inferred.',routes:[]};
for(const route of policy.routes){
 const ids=new Set(route.itemRefs.map(ref=>ref.itemId)),direct=assessable(ids);
 const derived=new Set((model.derivedRules??[]).filter(rule=>rule.requires.every(r=>direct.has(r.ruleId))).map(r=>r.id));
 const domains=Object.fromEntries(model.domains.map(d=>[d.id,route.itemRefs.filter(ref=>byItem.get(ref.itemId).domainId===d.id).length]));
 const scales=Object.fromEntries([...new Set(bank.items.map(i=>i.responseScaleId))].sort().map(scale=>
  [scale,route.itemRefs.filter(ref=>byItem.get(ref.itemId).responseScaleId===scale).length]));
 const affinity=catalog.traditions.map(t=>{
  const defining=t.commitments.filter(c=>c.role==='defining');
  const criterionAvailable=c=>c.mapping.status==='derived'?derived.has(c.mapping.propositionId):
   ['direct','partial'].includes(c.mapping.status)&&direct.has(c.mapping.propositionId);
  return {traditionId:t.id,definingTotal:defining.length,definingAssessable:defining.filter(criterionAvailable).length,
   definingDirectlyAssessable:defining.filter(c=>c.mapping.status==='direct'&&criterionAvailable(c)).length,
   definingPartiallyAssessed:defining.filter(c=>c.mapping.status==='partial'&&criterionAvailable(c)).length,
   definingDerivedAssessable:defining.filter(c=>c.mapping.status==='derived'&&criterionAvailable(c)).length,
   unmeasuredDefiningCriterionIds:defining.filter(c=>!criterionAvailable(c)).map(c=>c.id)};
 });
 report.routes.push({routeId:route.id,routeVersion:route.routeVersion,itemCount:ids.size,burden:route.burden,
  domains,responseScales:scales,assessableDirectRules:direct.size,totalPublicDirectRules:model.publicRuleIds.length,
  assessableFacetIds:model.facets.filter(f=>f.ruleIds.some(id=>direct.has(id))).map(f=>f.id),
  assessableDerivedRules:[...derived],researchOnlyItemCount:[...ids].filter(id=>!publicEvidence.has(id)).length,
  unassessablePublicRuleIds:model.publicRuleIds.filter(id=>!direct.has(id)),affinity,
  missingHeadlineDiscriminatorIds:publicRules.filter(c=>c.tier==='headline'&&!direct.has(c.id)).map(c=>c.id),
  overlapWithOtherRoutes:Object.fromEntries(policy.routes.filter(other=>other.id!==route.id).map(other=>
   [other.id,other.itemRefs.filter(ref=>ids.has(ref.itemId)).length]))});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
