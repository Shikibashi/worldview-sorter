import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sources,decisions,rules,questionProposals,expectedCounts} from '../data/academic/unmapped-audit-v1.mjs';
import {validateModel} from '../packages/worldview/index.js';

const root=new URL('../',import.meta.url);
const raw=p=>readFile(new URL(p,root),'utf8');
const read=async p=>JSON.parse(await raw(p));
const sha=s=>createHash('sha256').update(s).digest('hex');
const output=new Set();
const write=async(p,v)=>{await mkdir(new URL(p.slice(0,p.lastIndexOf('/')+1),root),{recursive:true});await writeFile(new URL(p,root),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');output.add(p);};

const current=await read('data/current.json');
const bank=await read(current.candidateBank.path);
const scalesDoc=await read('data/response-scales.json');
const constructs=(await read('data/constructs.json')).constructs;
const base=await read('data/generic/model-v0.2.json');
const oldCoverage=await read('data/generic/coverage-v0.2.json');
const oldLedger=await read('data/generic/source-ledger-v0.2.json');
const oldPublic=await read('data/philosophy/public-form-v1.json');
const oldFull=await read('data/philosophy/public-full-v1.json');
const oldExperience=await read('data/experience/policy-v1.1.json');
assert.equal(base.modelVersion,'generic-0.2.0');
assert.equal(decisions.length,49);
assert.deepEqual(
  Object.fromEntries(Object.entries(expectedCounts).filter(([k])=>k!=='total').map(([k])=>[k,decisions.filter(d=>d.decision===k).length])),
  Object.fromEntries(Object.entries(expectedCounts).filter(([k])=>k!=='total'))
);
const priorUnmapped=oldCoverage.constructs.filter(c=>c.ruleIds.length===0).map(c=>c.id).sort();
assert.deepEqual(priorUnmapped,decisions.map(d=>d.constructId).sort());

const frozenPaths=[
 'data/items/candidate-v0.9.json','data/generic/model-v0.2.json',
 'data/generic/coverage-v0.2.json','data/philosophy/public-form-v1.json',
 'data/philosophy/public-full-v1.json','data/experience/policy-v1.1.json'
];
const frozen=Object.fromEntries(await Promise.all(frozenPaths.map(async p=>[p,sha(await raw(p))])));
const itemMap=new Map(bank.items.map(i=>[i.id,i]));
const constructMap=new Map(constructs.map(c=>[c.id,c]));
const sourceMap=new Map(base.sources.map(s=>[s.id,s]));
for(const s of sources){assert.ok(!sourceMap.has(s.id),'Duplicate audit source '+s.id);sourceMap.set(s.id,s);}
const facetFor={
 EP02:'epistemic-method',EP05:'epistemic-method',EP06:'epistemic-method',EP10:'epistemic-method',EP11:'epistemic-justification',
 OM08:'metaontology',
 AH03:'agency-freedom',AH04:'agency-causes',AH06:'agency-causes',AH08:'agency-causes',AH09:'agency-causes',
 RC02:'religious-claims',RC04:'religious-claims',RC05:'religious-claims',RC06:'religious-claims',
 EX02:'existential-meaning',EX04:'existential-meaning',
 SO03:'social-persons',SO04:'social-persons',SO05:'social-persons',SO06:'social-persons',SO09:'social-persons',SO10:'social-entities',SO12:'social-entities',SO13:'social-entities',
 PL01:'political-authority',PL05:'political-authority',PL12:'political-economy',PL14:'political-economy',PL15:'political-economy',PL19:'political-justice',PL25:'political-authority'
};
const model=structuredClone(base);
model.modelVersion='generic-0.3.0';
model.parentModelVersion=base.modelVersion;
model.sources=[...sourceMap.values()];
const existingRuleIds=new Set(model.commitments.map(c=>c.id));
for(const draft of rules){
 assert.ok(!existingRuleIds.has(draft.id),'Duplicate audit rule '+draft.id);
 const construct=constructMap.get(draft.constructId);assert.ok(construct,'Unknown construct '+draft.constructId);
 const evidence=draft.evidence.map(e=>{const item=itemMap.get(e.itemId);assert.ok(item,'Unknown item '+e.itemId);return {...e,itemRevision:item.revision,unitId:item.mirrorGroup??item.scenarioGroup??item.id};});
 const rule={...draft,domainId:construct.domainId,tier:construct.tier,facetId:facetFor[draft.constructId]??null,
  layer:'audit_scoped_commitment',minimumEvidenceUnits:2,mappingStatus:'academic_unmapped_audit_v1',
  thresholdStatus:'engineering_duplicate_control_not_psychometric',evidence};
 model.commitments.push(rule);
 model.comparisons.push({id:'compare-'+rule.id,label:rule.label,scope:rule.scope,kind:'specified_commitment',
  sourceIds:rule.sourceIds,criteria:[{commitmentId:rule.id,expected:'support',role:'defining'}],
  limitations:[rule.boundary,'This is a scoped reported commitment, not a philosophical identity or calibrated score.']});
 existingRuleIds.add(rule.id);
}
model.commitments.sort((a,b)=>a.id.localeCompare(b.id,'en'));
model.comparisons.sort((a,b)=>a.id.localeCompare(b.id,'en'));
for(const facet of model.facets??[]){
 const additions=model.commitments.filter(c=>c.facetId===facet.id).map(c=>c.id);
 facet.ruleIds=[...new Set([...(facet.ruleIds??[]),...additions])];
}
const decisionMap=new Map(decisions.map(d=>[d.constructId,d]));
model.coverage=structuredClone(oldCoverage);
for(const c of model.coverage.constructs){
 c.ruleIds=model.commitments.filter(r=>r.constructId===c.id).map(r=>r.id);
 c.auditDecision=decisionMap.get(c.id)?.decision??null;
 c.auditRationale=decisionMap.get(c.id)?.rationale??null;
 c.status=c.ruleIds.length?'scoped_comparison_available':'candidate_or_reference_only_no_inference_rule';
}
for(const i of model.coverage.items){
 i.ruleIds=model.commitments.filter(r=>r.evidence.some(e=>e.itemId===i.itemId)).map(r=>r.id);
 i.status=i.ruleIds.length?'explicit_mapping_only':'not_used_for_profile_inference';
}
model.limitations=[...model.limitations,
 'The 49-construct audit deliberately leaves derived, research-only, underdiscriminated, and split constructs unresolved rather than forcing 100% mapped coverage.',
 'Psychological validation of cited scales does not transfer to custom Worldview Sorter items; cited measures are conceptual/measurement references only.',
 'Biological, environmental, religious, and political responses are reported as respondent commitments and are not treated as factual truth keys.'];
validateModel({model,bank,scalesDoc});

const audit={
 schemaVersion:'1.0.0',auditVersion:'unmapped-audit-1.0.0',baseModelVersion:base.modelVersion,resultModelVersion:model.modelVersion,
 auditedConstructs:49,decisionCounts:Object.fromEntries(Object.keys(expectedCounts).filter(k=>k!=='total').map(k=>[k,decisions.filter(d=>d.decision===k).length])),
 decisions:decisions.map(d=>({...d,construct:constructMap.get(d.constructId),existingItemIds:bank.items.filter(i=>i.targets.some(t=>t.constructId===d.constructId)).map(i=>i.id),
  acceptedRuleIds:model.commitments.filter(r=>r.mappingStatus==='academic_unmapped_audit_v1'&&r.constructId===d.constructId).map(r=>r.id)})),
 questionProposals,
 sourceIds:sources.map(s=>s.id),
 historicalBankChanged:false,
 empiricalValidationClaimed:false,
 cognitiveReviewRequired:false
};
const stillUnmapped=model.coverage.constructs.filter(c=>c.ruleIds.length===0).map(c=>c.id);
const auditedStillUnmapped=stillUnmapped.filter(id=>decisionMap.has(id));
assert.equal(auditedStillUnmapped.length,17);
const mappedFromAudit=decisions.filter(d=>model.coverage.constructs.find(c=>c.id===d.constructId).ruleIds.length>0);
assert.equal(mappedFromAudit.length,32);

const ledger=structuredClone(oldLedger);ledger.version='0.3.0';
for(const s of sources)ledger.sources.push({...s,useByRules:model.commitments.filter(r=>r.sourceIds.includes(s.id)).map(r=>r.id),useByItems:bank.items.filter(i=>model.commitments.some(r=>r.sourceIds.includes(s.id)&&r.evidence.some(e=>e.itemId===i.id))).map(i=>i.id)});
for(const s of ledger.sources){
 s.validatesOurItems=false;s.permissionToCopyItems=false;
 if(!s.useByRules)s.useByRules=model.commitments.filter(r=>r.sourceIds.includes(s.id)).map(r=>r.id);
 if(!s.useByItems)s.useByItems=bank.items.filter(i=>model.commitments.some(r=>r.sourceIds.includes(s.id)&&r.evidence.some(e=>e.itemId===i.id))).map(i=>i.id);
}

const newPublic={...structuredClone(oldPublic),policyVersion:'philosophy-blueprint-1.1.0',parentPolicyVersion:oldPublic.policyVersion,
 modelVersion:model.modelVersion,instrumentVersion:'worldview-public-1.1.0'};
const newFull={...structuredClone(oldFull),policyVersion:'philosophy-full-1.1.0',parentPolicyVersion:oldFull.policyVersion,
 modelVersion:model.modelVersion,instrumentVersion:'worldview-public-240-1.1.0'};
const experience=structuredClone(oldExperience);experience.experienceVersion='quiz-1.3.0';
experience.routes=experience.routes.map(r=>({...r,formPolicyVersion:r.size===240?newFull.policyVersion:newPublic.policyVersion}));
experience.formPolicies=[
 ...experience.formPolicies,
 {version:newPublic.policyVersion,path:'data/philosophy/public-form-v1.1.json'},
 {version:newFull.policyVersion,path:'data/philosophy/public-full-v1.1.json'}
];
experience.academicAudit={version:audit.auditVersion,path:'data/academic/unmapped-audit-v1.json',resultModelVersion:model.modelVersion};

await write('data/generic/model-v0.3.json',model);
await write('data/generic/coverage-v0.3.json',model.coverage);
await write('data/generic/source-ledger-v0.3.json',ledger);
await write('data/academic/unmapped-audit-v1.json',audit);
await write('data/philosophy/public-form-v1.1.json',newPublic);
await write('data/philosophy/public-full-v1.1.json',newFull);
await write('data/experience/policy-v1.2.json',experience);

current.worldviewModel={version:model.modelVersion,path:'data/generic/model-v0.3.json'};
current.worldviewCoverage={version:'0.3.0',path:'data/generic/coverage-v0.3.json'};
current.worldviewSourceLedger={version:'0.3.0',path:'data/generic/source-ledger-v0.3.json'};
current.publicForm={version:newPublic.policyVersion,path:'data/philosophy/public-form-v1.1.json'};
current.fullForm={version:newFull.policyVersion,path:'data/philosophy/public-full-v1.1.json'};
current.quizExperience={version:experience.experienceVersion,path:'data/experience/policy-v1.2.json',entrypoint:'apps/quiz/index.html'};
current.unmappedAcademicAudit={version:audit.auditVersion,path:'data/academic/unmapped-audit-v1.json'};
await write('data/current.json',current);

const docs=[
 '# Audit of the 49 previously unmapped active constructs','',
 'This audit starts from generic-0.2.0 and deliberately does not force 100% coverage. The 562-item bank is unchanged.','',
 '## Decision counts','',
 ...Object.entries(audit.decisionCounts).map(([k,v])=>'- **'+k+'**: '+v),'',
 'Thirty-two of the 49 constructs now have at least one narrowly scoped interpretation rule. Seventeen remain intentionally unresolved at the model level.','',
 '## Construct decisions','',
 ...audit.decisions.flatMap(d=>['### '+d.constructId+' — '+d.construct.name,'**Decision:** '+d.decision,d.rationale,'Existing items: '+d.existingItemIds.join(', ')+(d.acceptedRuleIds.length?'\\nAccepted rules: '+d.acceptedRuleIds.join(', '):''),'']),
 '## Additional original questions justified, but not added to the bank','',
 ...questionProposals.flatMap(p=>['### '+p.constructId,p.reason,...p.items.map(x=>'- '+x),'']),
 '## Methodological boundary','',
 'References to validated psychological instruments identify neighboring constructs and measurement distinctions. They do not validate our rewritten/original items, justify importing published norms, or authorize copying copyrighted items.',
 'Derived families remain derived. Research-only constructs remain available for later calibration but are not promoted merely because an academic scale with a related name exists.',
 'No political actor, party, or current policy choice is ranked by this audit. Political constructs are framed as reported philosophical commitments.',''
].join('\\n');
await write('docs/UNMAPPED_AUDIT.md',docs);

for(const [p,h] of Object.entries(frozen))assert.equal(sha(await raw(p)),h,'Historical artifact mutated: '+p);
const buildOut=await read('data/academic/build-output.json');
buildOut.paths=[...new Set([...buildOut.paths,...output])].sort();
await write('data/academic/build-output.json',buildOut);
console.log(JSON.stringify({modelVersion:model.modelVersion,mappedFromAudit:mappedFromAudit.length,stillUnmapped:auditedStillUnmapped.length,decisionCounts:audit.decisionCounts},null,2));
