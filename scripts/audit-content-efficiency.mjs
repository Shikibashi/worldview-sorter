import fs from 'node:fs';
import crypto from 'node:crypto';
import {generatePhilosophyPacket, auditPhilosophyPacket} from '../packages/philosophy/forms.js';

// An authored content audit. Seed samples test route opportunities, not respondent
// behavior or psychometric item information.
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const bank=read('data/items/candidate-v0.9.json');
const registry=read('data/registries/constructs-v0.2.json');
const model=read('data/generic/model-v0.3.json');
const coverage=read('data/generic/coverage-v0.3.json');
const short=read('data/philosophy/public-form-v1.1.json');
const full=read('data/philosophy/public-full-v1.1.json');
const profiles=read('data/profiles/catalog-v0.2.json');
const priorAudit=read('data/academic/unmapped-audit-v1.json');
const inputs=['data/items/candidate-v0.9.json','data/registries/constructs-v0.2.json','data/generic/model-v0.3.json','data/generic/coverage-v0.3.json','data/philosophy/public-form-v1.1.json','data/philosophy/public-full-v1.1.json','data/profiles/catalog-v0.2.json','data/academic/unmapped-audit-v1.json'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+p,import.meta.url))).digest('hex');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
assert(bank.items.length===562&&bank.bankVersion==='0.9.0','Unexpected item bank baseline');
assert(registry.constructs.filter(c=>c.measurementStatus!=='deprecated').length===181,'Unexpected construct baseline');
assert(coverage.constructs.length===181&&coverage.constructs.filter(c=>c.ruleIds.length).length===164,'Unexpected coverage baseline');
assert(model.modelVersion==='generic-0.3.0'&&model.domains.length===12&&model.facets.length===31,'Unexpected model baseline');
assert(short.sizes.join(',')==='80,120,160'&&full.sizes.join(',')==='240'&&profiles.profiles.length===9,'Unexpected route/profile baseline');
const items=new Map(bank.items.map(i=>[i.id,i]));
const rules=new Map(model.commitments.map(r=>[r.id,r]));
const active=registry.constructs.filter(c=>c.measurementStatus!=='deprecated');
const researchOnly=new Set(priorAudit.decisions.filter(d=>d.decision==='remain_research_only').map(d=>d.constructId));
const constructIds=new Set(registry.constructs.map(c=>c.id));
const sourceIds=new Set(model.sources.map(s=>s.id));
assert(items.size===bank.items.length&&constructIds.size===registry.constructs.length&&rules.size===model.commitments.length,'Duplicate IDs');
for(const i of bank.items){
 assert(Number.isInteger(i.revision)&&i.revision>=1,'Invalid revision '+i.id);
 assert(i.targets.every(t=>constructIds.has(t.constructId)),'Dangling target '+i.id);
 assert(i.provenance.sourceRefs.length>0&&i.provenance.sourceRefs.every(id=>sourceIds.has(id)),'Missing source '+i.id);
 if(i.eligibility.mode==='conditional')for(const c of i.eligibility.all)assert(items.has(c.itemId),'Dangling prerequisite '+i.id);
}
for(const policy of [short,full]){
 assert(policy.bankVersion===bank.bankVersion&&policy.modelVersion===model.modelVersion,'Route/model mismatch');
 for(const b of policy.bundles)for(const id of b.itemIds)assert(items.has(id),'Dangling route bundle item '+id);
 for(const f of policy.facets)for(const id of f.bundleIds)assert(policy.bundles.some(b=>b.id===id),'Dangling facet bundle '+id);
}
for(const r of model.commitments){
 assert(r.evidence.every(e=>items.get(e.itemId)?.revision===e.itemRevision),'Dangling/stale rule item '+r.id);
 assert(r.sourceIds.every(id=>sourceIds.has(id)),'Dangling rule source '+r.id);
}
for(const p of profiles.profiles)for(const c of p.criteria)for(const e of c.evidence)assert(items.get(e.itemId)?.revision===e.itemRevision,'Dangling/stale reference evidence '+p.id);
const fmt=i=>i.responseScaleId;
const primary=i=>i.targets.filter(t=>t.role==='primary').map(t=>t.constructId);
const secondary=i=>i.targets.filter(t=>t.role!=='primary').map(t=>t.constructId);
const ruleUse=new Map(bank.items.map(i=>[i.id,[]]));
for(const r of model.commitments)for(const e of r.evidence)ruleUse.get(e.itemId)?.push(r.id);
const profileUse=new Map(bank.items.map(i=>[i.id,[]]));
for(const p of profiles.profiles)for(const c of p.criteria)for(const e of c.evidence)profileUse.get(e.itemId)?.push(p.id+':'+c.id);

function opportunity(rule,ids){
 const selected=rule.evidence.filter(e=>ids.has(e.itemId));
 const units=new Set(selected.map(e=>e.unitId));
 const support=new Set(selected.filter(e=>e.support.length).map(e=>e.unitId));
 const oppose=new Set(selected.filter(e=>e.oppose.length).map(e=>e.unitId));
 const conditional=selected.filter(e=>items.get(e.itemId).eligibility.mode==='conditional').map(e=>e.itemId);
 return {assessable:units.size>=rule.minimumEvidenceUnits,supportPossible:support.size>=rule.minimumEvidenceUnits,
  opposePossible:oppose.size>=rule.minimumEvidenceUnits,units:units.size,conditionalItemIds:conditional};
}
const sizes=[80,120,160,240],sampleCount=32;
const routeSamples={},packetSets={};
for(const size of sizes){
 const policy=size===240?full:short;
 const packets=[];
 for(let n=0;n<sampleCount;n++){
  const packet=generatePhilosophyPacket({bank,pilot:null,policy,seed:'content-audit-'+String(n).padStart(3,'0'),size});
  assert(auditPhilosophyPacket(packet,policy).allRequired,'Facet guarantee failed');
  assert(packet.entries.length===size&&new Set(packet.entries.map(e=>e.itemId)).size===size,'Route size/duplicate failure');
  for(const e of packet.entries)assert(items.get(e.itemId)?.revision===e.itemRevision,'Stale route item revision');
  packets.push(packet);
 }
 packetSets[size]=packets.map(packet=>new Set(packet.entries.map(e=>e.itemId)));
 const itemCounts=Object.fromEntries(bank.items.map(i=>[i.id,0]));
 const ruleCounts=Object.fromEntries(model.commitments.map(r=>[r.id,{assessable:0,supportPossible:0,opposePossible:0,conditional:0}]));
 const profileCounts=Object.fromEntries(profiles.profiles.map(p=>[p.id,{allDefining:0,anyDefining:0}]));
 const domains={},methods={};let minDomains=Infinity,maxDomains=0;
 for(const packet of packets){
  const ids=new Set(packet.entries.map(e=>e.itemId));
  for(const id of ids)itemCounts[id]++;
  const ds=new Set(packet.entries.map(e=>e.domainId));minDomains=Math.min(minDomains,ds.size);maxDomains=Math.max(maxDomains,ds.size);
  for(const e of packet.entries){domains[e.domainId]=(domains[e.domainId]??0)+1;const f=fmt(items.get(e.itemId));methods[f]=(methods[f]??0)+1;}
  for(const r of model.commitments){const o=opportunity(r,ids),c=ruleCounts[r.id];if(o.assessable)c.assessable++;if(o.supportPossible)c.supportPossible++;if(o.opposePossible)c.opposePossible++;if(o.conditionalItemIds.length)c.conditional++;}
  for(const p of profiles.profiles){
   const defining=p.criteria.filter(c=>c.essential);
   const ready=defining.filter(c=>new Set(c.evidence.filter(e=>ids.has(e.itemId)).map(e=>e.itemId)).size>=c.minimumIndependentItems);
   if(ready.length)profileCounts[p.id].anyDefining++;
   if(ready.length===defining.length)profileCounts[p.id].allDefining++;
  }
 }
 routeSamples[size]={policyVersion:policy.policyVersion,sampleCount,seedPattern:'content-audit-000 through content-audit-031',
  itemCounts,ruleCounts,profileCounts,minDomains,maxDomains,
  guaranteedFacetIds:policy.facets.filter(f=>f.minimumBundles>0).map(f=>f.id),
  meanItemsByDomain:Object.fromEntries(Object.entries(domains).map(([k,v])=>[k,v/sampleCount])),
  meanItemsByResponseScale:Object.fromEntries(Object.entries(methods).map(([k,v])=>[k,v/sampleCount])),
  assessableRuleIdsEverySample:Object.entries(ruleCounts).filter(([,v])=>v.assessable===sampleCount).map(([k])=>k),
  assessableRuleIdsSomeSamples:Object.entries(ruleCounts).filter(([,v])=>v.assessable>0&&v.assessable<sampleCount).map(([k])=>k),
 assessableRuleIdsNoSamples:Object.entries(ruleCounts).filter(([,v])=>v.assessable===0).map(([k])=>k)};
}
const opportunityIds=ids=>new Set(model.commitments.filter(r=>opportunity(r,ids).assessable).map(r=>r.id));
const routeTransitions=[];
for(let n=1;n<sizes.length;n++){
 const from=sizes[n-1],to=sizes[n];let retained=0,added=0,dropped=0,newRulePaths=0,lostRulePaths=0;
 const gainedByRule={},lostByRule={};
 for(let k=0;k<sampleCount;k++){
  const before=packetSets[from][k],after=packetSets[to][k];
  retained+=[...before].filter(id=>after.has(id)).length;
  added+=[...after].filter(id=>!before.has(id)).length;
  dropped+=[...before].filter(id=>!after.has(id)).length;
  const oldRules=opportunityIds(before),newRules=opportunityIds(after);
  for(const id of newRules)if(!oldRules.has(id)){newRulePaths++;gainedByRule[id]=(gainedByRule[id]??0)+1;}
  for(const id of oldRules)if(!newRules.has(id)){lostRulePaths++;lostByRule[id]=(lostByRule[id]??0)+1;}
 }
 routeTransitions.push({from,to,pairedSeedCount:sampleCount,meanRetainedItems:retained/sampleCount,
  meanAddedItems:added/sampleCount,meanDroppedItems:dropped/sampleCount,
  meanNewRulePaths:newRulePaths/sampleCount,meanLostRulePaths:lostRulePaths/sampleCount,
  gainedRuleSampleCounts:gainedByRule,lostRuleSampleCounts:lostByRule});
}
const routeMarginal={};
for(const size of sizes){
 const policy=size===240?full:short;
 const byId=new Map(bank.items.map(i=>[i.id,i]));
 const stats=Object.fromEntries(bank.items.map(i=>[i.id,{assigned:0,publicRulePathLoss:0,facetMinimumLoss:0,formatGuaranteeLoss:0,lostPublicRuleIds:[]}]));
 for(const ids of packetSets[size]){
  const beforeRules=opportunityIds(ids);
  const beforeFacet=policy.facets.map(f=>f.bundleIds.filter(id=>policy.bundles.find(b=>b.id===id).itemIds.every(itemId=>ids.has(itemId))).length);
  for(const id of ids){
   const row=stats[id];row.assigned++;
   const after=new Set(ids);after.delete(id);
   // A conditional follow-up cannot remain assigned without its parent.
   let progress=true;while(progress){progress=false;for(const other of [...after]){
    const item=byId.get(other);
    if(item.eligibility.mode==='conditional'&&item.eligibility.all.some(c=>!after.has(c.itemId))){after.delete(other);progress=true;}
   }}
   const newRules=opportunityIds(after);
   const lost=[...beforeRules].filter(ruleId=>rules.get(ruleId).tier!=='research'&&!newRules.has(ruleId));
   if(lost.length){row.publicRulePathLoss++;for(const ruleId of lost)if(!row.lostPublicRuleIds.includes(ruleId))row.lostPublicRuleIds.push(ruleId);}
   if(policy.facets.some((f,index)=>beforeFacet[index]>=f.minimumBundles&&
    f.bundleIds.filter(bundleId=>policy.bundles.find(b=>b.id===bundleId).itemIds.every(itemId=>after.has(itemId))).length<f.minimumBundles))row.facetMinimumLoss++;
   if(policy.responseScaleIds.some(scaleId=>[...ids].some(itemId=>byId.get(itemId).responseScaleId===scaleId)&&
    ![...after].some(itemId=>byId.get(itemId).responseScaleId===scaleId)))row.formatGuaranteeLoss++;
  }
 }
 routeMarginal[size]=stats;
}

const stop=new Set(['a','an','the','to','of','in','on','for','with','by','and','or','is','are','can','be','that','it','their','they','one','some','if','even','than','as','at','from','should','would','could','more','most']);
const tokens=s=>new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stop.has(w)));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b),n=[...A].filter(x=>B.has(x)).length;return n/Math.max(1,Math.min(A.size,B.size));};
const near=[];
for(let x=0;x<bank.items.length;x++)for(let y=x+1;y<bank.items.length;y++){
 const a=bank.items[x],b=bank.items[y];if(!primary(a).some(id=>primary(b).includes(id)))continue;
 const score=similarity(a.text,b.text);
 if(score>=0.72)near.push({itemIds:[a.id,b.id],sharedPrimary:primary(a).filter(id=>primary(b).includes(id)),tokenContainment:+score.toFixed(3),sameMethod:fmt(a)===fmt(b)});
}
near.sort((a,b)=>b.tokenContainment-a.tokenContainment||a.itemIds[0].localeCompare(b.itemIds[0]));

// Editorial overrides are deliberately small. Similarity alone cannot decide
// whether parallel items, counterexamples, or method variation are redundant.
const dispositions={
 MEI009:['keep_parallel_indicator','A second moral-universalism framing; review alongside MEI024 before route changes.'],
 MEI024:['route_reconsider','Near-paraphrase of MEI009; check whether its framing adds an independent discrimination opportunity.'],
 MEI004:['keep_parallel_indicator','Desire-independent reasons framing retained as a parallel indicator.'],
 MEI026:['route_reconsider','Overlaps MEI004 closely; assess whether the context changes the target.'],
 NEI009:['keep_parallel_indicator','Reasonable-rejection statement retained as an authored parallel indicator; no statistical independence is claimed.'],
 NEI017:['route_reconsider','Similar contractualist reasonable-rejection wording to NEI009.'],
 NEI013:['keep_parallel_indicator','Doing-versus-allowing distinction is a valid second indicator.'],
 NEI023:['route_reconsider','Similar doing-versus-allowing proposition to NEI013.'],
 NEI030:['route_reconsider','Rescue/bystander vignette overlaps NEI005 and is already excluded from public policies.'],
 NEI102:['rewrite_candidate','Absolute reverse ethical-egoism wording may conflate permissibility with a universal command.'],
 NEI117:['rewrite_candidate','Absolute never wording in induced-reliance item risks a different target.'],
 NEI120:['rewrite_candidate','Absolute reverse wording in voluntary-concern item risks a different target.']
 ,SOI019:['keep_discriminator','Unlike SOI010, unjustified standing differences explicitly distinguish egalitarian concern from a blanket claim about all differences.'],
 RCI021:['keep_parallel_indicator','Confidence range complements rather than repeats the agreement item RCI014.'],
 AHI016:['keep_discriminator','Reverse framing tests whether self-interest is treated as unavoidable, not merely common.'],
 AHI034:['keep_discriminator','Compatibilist own-reasons framing adds lack of coercion relative to AHI012.'],
 RCI017:['keep_discriminator','Natural-process exclusion is an explicit counterposition to miracles.'],
 RCI015:['keep_discriminator','Impersonal divine option is a nearby counterposition to agentic divinity.'],
 RCI030:['keep_parallel_indicator','Life-decision salience adds behavioral context to generic spiritual-importance wording.'],
 AHI101:['keep_discriminator','Anonymous helping probes the broad psychological-egoism claim in a plausible benevolence case.'],
 SOI008:['rewrite_candidate','Social categories is underspecified: an answer may concern unlike categories and fail to isolate social essentialism.'],
 PLI116:['keep_parallel_indicator','Stateless endpoint is distinct from PLI115 about whether even a decent state should be replaced.'],
 EPI025:['rewrite_candidate','Clearest-case option can elicit recognition of a textbook example rather than the respondent’s own epistemic view.'],
 EPI042:['rewrite_candidate','Epistemic justification and four textbook-theory options impose unnecessary jargon for a public worldview question.'],
 VAI042:['route_reconsider','Close same-method caring paraphrase of VAI031; establish its added facet before giving it a public route slot.'],
 VAI051:['keep_discriminator','Commitment and promise wording narrows the reliability value compared with VAI016 and VAI032.']
};
const wordingFlags=i=>{
 const text=i.text,flags=[];
 if(/\b(always|never|every|all people|no one)\b/i.test(text))flags.push('absolute_quantifier_review');
 if(/\b(and|or)\b/i.test(text)&&text.split(/\s+/).length>25)flags.push('multiple_clause_review');
 if(text.split(/\s+/).length>38)flags.push('long_wording_review');
 if(/\b(according to|who argued|which philosopher|the term)\b/i.test(text))flags.push('knowledge_question_review');
 if(/\b(this|that|these|those)\b/i.test(text)&&!i.scenarioGroup)flags.push('referent_review');
 return flags;
};
const itemAudit=bank.items.map(i=>{
 const base=dispositions[i.id]??(primary(i).length>0&&primary(i).every(id=>researchOnly.has(id))&&ruleUse.get(i.id).length===0?['keep_research_only','Targets a construct deliberately retained for research without a public interpretation rule.']:
  profileUse.get(i.id).length&&ruleUse.get(i.id).length===0?['keep_discriminator','Reference-comparison discriminator; prototype use only.']:
  ruleUse.get(i.id).length>1?['keep_parallel_indicator','Serves multiple authored rules; semantic independence remains unvalidated.']:
  ['keep','No concrete content defect established by this audit.']);
 return {itemId:i.id,revision:i.revision,domainId:i.domainId,primaryConstructIds:primary(i),secondaryConstructIds:secondary(i),responseType:i.responseType,responseScaleId:fmt(i),
  semanticTarget:i.text,answerOptions:i.options.map(o=>({id:o.id,label:o.label})),itemNotes:i.notes,contentKind:i.contentKind,polarity:i.targets.map(t=>({constructId:t.constructId,relation:t.relation})),
  authoredItemTargets:i.targets.map(t=>({constructId:t.constructId,role:t.role,relation:t.relation,
   constructDescription:registry.constructs.find(c=>c.id===t.constructId)?.description??null})),
  interpretablePropositions:ruleUse.get(i.id).map(id=>{const r=rules.get(id),e=r.evidence.find(entry=>entry.itemId===i.id);return {ruleId:id,
   proposition:r.proposition??r.scope,propositionBasis:r.proposition?'explicit':'inherited_scope',tier:r.tier,
   supportAnswers:e.support,opposeAnswers:e.oppose,boundary:r.boundary,
   neighboringViews:r.neighbors??[],falsePositiveNotes:r.falsePositives??[]};}),
  routeSampleInclusion:Object.fromEntries(sizes.map(size=>[size,routeSamples[size].itemCounts[i.id]])),
  routeMarginalOpportunity:Object.fromEntries(sizes.map(size=>[size,routeMarginal[size][i.id]])),
  interpretationRuleIds:ruleUse.get(i.id),referenceCriterionIds:profileUse.get(i.id),eligibility:i.eligibility,
  sourceIds:i.provenance.sourceRefs,provenanceOrigin:i.provenance.origin,contentTags:i.contentTags,
  editorialDisposition:base[0],dispositionRationale:base[1],wordingReviewFlags:wordingFlags(i),
  relatedHighSimilarityItems:near.filter(x=>x.itemIds.includes(i.id)).slice(0,5).map(x=>({itemId:x.itemIds.find(y=>y!==i.id),tokenContainment:x.tokenContainment}))};
});
const constructAudit=active.map(c=>{
 const primaryItems=bank.items.filter(i=>primary(i).includes(c.id));
 const secondaryItems=bank.items.filter(i=>secondary(i).includes(c.id));
 const ids=new Set([...primaryItems,...secondaryItems].map(i=>i.id));
 const mapped=coverage.constructs.find(x=>x.id===c.id);
 return {constructId:c.id,name:c.name,domainId:c.domainId,tier:c.tier,measurementStatus:c.measurementStatus,
  candidateItemCount:ids.size,primaryItemIds:primaryItems.map(i=>i.id),secondaryItemIds:secondaryItems.map(i=>i.id),
  responseScaleIds:[...new Set([...primaryItems,...secondaryItems].map(fmt))],contentTags:[...new Set([...primaryItems,...secondaryItems].flatMap(i=>i.contentTags))],
 routeSampleExposure:Object.fromEntries(sizes.map(size=>[size,{mean:[...ids].reduce((v,id)=>v+routeSamples[size].itemCounts[id],0)/sampleCount}])),
  approvedRuleIds:mapped?.ruleIds??[],ruleOpportunity:Object.fromEntries(sizes.map(size=>[size,(mapped?.ruleIds??[]).map(id=>({ruleId:id,...routeSamples[size].ruleCounts[id]}))])),
  knownFalsePositiveProtections:(mapped?.ruleIds??[]).map(id=>({ruleId:id,boundary:rules.get(id)?.boundary??null,
   opposingItemIds:rules.get(id)?.evidence.filter(e=>e.oppose.length).map(e=>e.itemId)??[]})),
  contentGaps:!mapped?.ruleIds.length?['Intentionally unmapped; do not infer respondent position.']:
   (mapped.ruleIds.filter(id=>routeSamples[240].ruleCounts[id]?.assessable===0).map(id=>'No complete 240-route path in 32 sampled packets: '+id))};
});
const profileAudit=profiles.profiles.map(p=>({profileId:p.id,label:p.label,scope:p.scope,sourceIds:p.sourceIds,
 definingCriterionCount:p.criteria.filter(c=>c.essential).length,characteristicCriterionCount:p.criteria.filter(c=>!c.essential).length,
 criteria:p.criteria.map(c=>({criterionId:c.id,essential:c.essential,sourceIds:c.sourceIds,minimumIndependentItems:c.minimumIndependentItems,
  evidenceItemIds:c.evidence.map(e=>e.itemId),modelCommitmentIds:[...new Set(c.evidence.flatMap(e=>ruleUse.get(e.itemId)))],
  directPropositionMapping:false})),
 routeSampleOpportunity:Object.fromEntries(sizes.map(size=>[size,routeSamples[size].profileCounts[p.id]])),
 architecturalLimit:'Prototype matcher consumes versioned raw answers directly; this is not a proposition-layer philosophical affinity catalog.'}));
const report={schemaVersion:'content-efficiency-audit-1',auditKind:'authored_semantic_and_structural_not_psychometric',
 baseline:{branch:'construct-registry-v0.1',bankVersion:bank.bankVersion,modelVersion:model.modelVersion,registryVersion:registry.registryVersion,
  itemCount:bank.items.length,activeConstructCount:active.length,mappedActiveConstructCount:coverage.constructs.filter(c=>c.ruleIds.length).length,
  intentionallyUnmappedCount:coverage.constructs.filter(c=>!c.ruleIds.length).length,domainCount:model.domains.length,publicFacetCount:model.facets.length,
  profileCount:profiles.profiles.length,inputSha256:Object.fromEntries(inputs.map(p=>[p,sha(p)]))},
 methodology:{routeSeeds:sampleCount,routeSampling:'Deterministic diagnostic sample, not a guarantee or empirical response distribution.',
  semanticFlags:'Regex and token containment are review prompts, not findings of statistical local dependence or item redundancy.',
  disposition:'Keep is the conservative default where no concrete defect is established; named exceptions have explicit rationale.'},
 sourceMetadata:model.sources.map(s=>({id:s.id,title:s.title,url:s.url??null,access:s.access??null})),
 itemDispositions:itemAudit,constructRepresentation:constructAudit,routeDiagnostics:routeSamples,routeTransitions,
 suspectedSimilarityPairs:near,referenceComparisons:profileAudit,
 publicResultContract:{states:['supported','opposed','mixed','insufficient_evidence'],routeOmissionStateCurrently:'insufficient_evidence',
  recommendation:'Add versioned not_measured semantics before asserting route-aware absence; distinguish branch skips from omissions and inconclusive presented evidence.'},
 routeChangeProposal:{status:'no_released_route_mutation',changes:[],reason:'Candidate swaps require a reviewed semantic and rule-opportunity case; diagnostic seed frequency alone is insufficient.'}};
const fullPool=new Set(full.bundles.flatMap(b=>b.itemIds));
const routeReview={schemaVersion:'route-review-1',sourceAudit:'content-efficiency-v1.json',existingPolicyVersions:[short.policyVersion,full.policyVersion],
 releaseMutationApproved:false,proposedChanges:[],
 meaning:'No removal/addition pair is approved. The existing policies select seeded bundles, so a concrete swap requires a new policy version and whole-packet impact review.',
 structuralGaps:routeSamples[240].assessableRuleIdsNoSamples.map(id=>{
  const r=rules.get(id);
  return {ruleId:id,constructId:r.constructId,domainId:r.domainId,requiredUnits:r.minimumEvidenceUnits,
   candidateAdditions:r.evidence.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId,inCurrentFullBundlePool:fullPool.has(e.itemId)})),
   proposedRemovals:[],constructFacetImpact:'Needs review against existing 31 facet minima and other rule paths.',
   interpretationImpact:'Could create a direct evidence opportunity; no respondent conclusion is guaranteed.',
   historicalCompatibility:'Create a new policy/instrument version; retain both 1.1.0 policies and saved packet entries.'};
 }),reviewPriority:'Rule paths with no bundled items before candidate count balancing or cosmetic route changes.'};
const out=new URL('../data/reviews/content-efficiency-v1.json',import.meta.url);
const routeOut=new URL('../data/reviews/route-review-v1.json',import.meta.url);
if(process.argv.includes('--write')){
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(routeOut,JSON.stringify(routeReview,null,2)+'\n');
}else if(process.argv.includes('--check')){
 assert(fs.readFileSync(out,'utf8')===JSON.stringify(report,null,2)+'\n','Content audit artifact stale');
 assert(fs.readFileSync(routeOut,'utf8')===JSON.stringify(routeReview,null,2)+'\n','Route review artifact stale');
}
else console.log(JSON.stringify({items:itemAudit.length,constructs:constructAudit.length,routes:Object.fromEntries(sizes.map(s=>[s,{every:routeSamples[s].assessableRuleIdsEverySample.length,some:routeSamples[s].assessableRuleIdsSomeSamples.length,none:routeSamples[s].assessableRuleIdsNoSamples.length}])),similarityPairs:near.length,dispositions:itemAudit.reduce((a,i)=>(a[i.editorialDisposition]=(a[i.editorialDisposition]??0)+1,a),{})},null,2));
