import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dispositions,retainedRules,draftItems,contentFindings,additionalSources,dispositionSourceIds} from '../data/academic/unmapped-audit-v2.mjs';
import {validateModel} from '../packages/worldview/index.js';
import {generatePhilosophyPacket} from '../packages/philosophy/forms.js';

const root=new URL('../',import.meta.url);
const raw=p=>readFile(new URL(p,root),'utf8');
const read=async p=>JSON.parse(await raw(p));
const hash=s=>createHash('sha256').update(s).digest('hex');
const output=new Set();
const write=async(p,v)=>{await mkdir(new URL(p.slice(0,p.lastIndexOf('/')+1),root),{recursive:true});await writeFile(new URL(p,root),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');output.add(p);};
const frozenPaths=['data/items/candidate-v0.9.json','data/generic/model-v0.2.json','data/generic/model-v0.3.json',
 'data/generic/coverage-v0.2.json','data/generic/coverage-v0.3.json','data/academic/unmapped-audit-v1.json',
 'data/philosophy/public-form-v1.1.json','data/philosophy/public-full-v1.1.json','data/experience/policy-v1.2.json'];
const frozen=Object.fromEntries(await Promise.all(frozenPaths.map(async p=>[p,hash(await raw(p))])));
const current=await read('data/current.json');
const bank=await read('data/items/candidate-v0.9.json');
const pilot=await read(current.pilot.path);
const scalesDoc=await read('data/response-scales.json');
const registry=(await read('data/constructs.json')).constructs;
const base=await read('data/generic/model-v0.3.json');
const oldCoverage=await read('data/generic/coverage-v0.2.json');
const priorAudit=await read('data/academic/unmapped-audit-v1.json');
const oldLedger=await read('data/generic/source-ledger-v0.3.json');
const oldPublic=await read('data/philosophy/public-form-v1.1.json');
const oldFull=await read('data/philosophy/public-full-v1.1.json');
const oldExperience=await read('data/experience/policy-v1.2.json');
assert.equal(base.modelVersion,'generic-0.3.0');
assert.deepEqual(Object.keys(dispositions).sort(),oldCoverage.constructs.filter(c=>!c.ruleIds.length).map(c=>c.id).sort());
assert.equal(priorAudit.decisions.length,49);
const items=new Map(bank.items.map(i=>[i.id,i]));
const constructs=new Map(registry.map(c=>[c.id,c]));
const priorRules=new Map(base.commitments.filter(c=>c.mappingStatus==='academic_unmapped_audit_v1').map(c=>[c.id,c]));
const model=structuredClone(base);
model.modelVersion='generic-0.4.0';
model.parentModelVersion=base.modelVersion;
model.engineVersion='generic-evidence-2';
model.sources.push(...additionalSources);
model.commitments=model.commitments.filter(c=>c.mappingStatus!=='academic_unmapped_audit_v1');
model.comparisons=model.comparisons.filter(c=>!c.id.startsWith('compare-audit-'));
for(const f of model.facets??[])f.ruleIds=f.ruleIds.filter(id=>!id.startsWith('audit-'));
for(const [oldId,edit] of Object.entries(retainedRules)){
 const before=priorRules.get(oldId);assert.ok(before,'Unknown previous audit rule '+oldId);
 const rule={...before,id:oldId.replace(/^audit-/,'audit2-'),label:edit.proposition,scope:edit.proposition,
  proposition:edit.proposition,interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',
  hypothesizedConstructId:before.constructId,affinityCriterion:false,researchVariable:false,
  neighbors:edit.neighbors,nonEntailments:edit.nonEntailments,falsePositives:edit.falsePositives,
  missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward'},
  mappingStatus:'academic_unmapped_audit_v2',evidence:edit.evidence.map(x=>{
   const item=items.get(x.itemId);assert.ok(item,'Unknown mapped item '+x.itemId);
   return {...x,itemRevision:item.revision,unitId:item.mirrorGroup??item.scenarioGroup??item.id};
  })};
 assert.ok(['directly_interpretable','split'].includes(dispositions[rule.constructId].disposition),'Rule without direct/split disposition '+rule.id);
 model.commitments.push(rule);
 model.comparisons.push({id:'compare-'+rule.id,label:rule.label,scope:rule.scope,kind:'specified_commitment',
  sourceIds:rule.sourceIds,criteria:[{commitmentId:rule.id,expected:'support',role:'defining'}],
  limitations:[rule.boundary,...rule.nonEntailments.map(x=>'Does not entail: '+x)]});
 const facet=model.facets?.find(f=>f.id===rule.facetId);if(facet)facet.ruleIds.push(rule.id);
}
model.commitments.sort((a,b)=>a.id.localeCompare(b.id,'en'));
model.comparisons.sort((a,b)=>a.id.localeCompare(b.id,'en'));
model.coverage=structuredClone(base.coverage);
for(const c of model.coverage.constructs){
 c.ruleIds=model.commitments.filter(r=>r.constructId===c.id).map(r=>r.id);
 const decision=dispositions[c.id];
 c.disposition=decision?.disposition??null;
 c.coverageGap=decision&&!c.ruleIds.length?decision.reason:null;
 c.status=c.ruleIds.length?'scoped_comparison_available':'candidate_or_reference_only_no_inference_rule';
}
for(const row of model.coverage.items){
 row.ruleIds=model.commitments.filter(r=>r.evidence.some(e=>e.itemId===row.itemId)).map(r=>r.id);
 row.status=row.ruleIds.length?'explicit_mapping_only':'not_used_for_profile_inference';
}
model.evidenceConcepts={
 itemTarget:'Authored question intent, not an inference rule.',
 interpretableProposition:'Exact answer-grounded claim expressed by a direct rule.',
 hypothesizedPsychometricConstruct:'Unvalidated theoretical registry entry; no factor loading or calibrated scale is implied.',
 derivedConclusion:'A synthesis across independently interpreted propositions, never a direct response rule.',
 philosophicalAffinityCriterion:'A comparison criterion; it does not identify the respondent with a school.',
 researchVariable:'Exploratory content excluded from direct respondent-facing interpretations unless separately approved.',
 coverageGap:'A retained distinction for which current evidence is inadequate.'
};
model.limitations=[...base.limitations,
 'The original 49 constructs are an authored theoretical ontology, not empirically established latent factors.',
 'A presented item with no directional answer differs from a proposition never measured on a route.',
 'Single directional authored units are reported only as a lean; no numerical probability or scale score is implied.',
 'A source supporting a conceptual distinction does not validate these custom questions or answer mappings.'];
validateModel({model,bank,scalesDoc});

const draftIdSet=new Set(bank.items.map(i=>i.id));
for(const draft of draftItems){assert.ok(!draftIdSet.has(draft.id),'Draft item reuses historical ID '+draft.id);draftIdSet.add(draft.id);}
const drafts={schemaVersion:'1.0.0',bankVersion:'0.9.0-unmapped-draft-1',status:'candidate',
 purpose:'Original candidate additions to the 0.9.0 bank audit; not in any released bank or public route and not approved for interpretation.',
 itemIdPolicy:bank.itemIdPolicy,
 items:draftItems.map(d=>({id:d.id,revision:d.revision,domainId:d.domainId,text:d.text,responseType:d.responseType,
  responseScaleId:d.responseScaleId,status:'candidate',contentKind:'contrast',targets:[{constructId:d.constructId,relation:'diagnostic',role:'secondary'}],
  options:d.options,mirrorGroup:null,scenarioGroup:null,eligibility:{mode:'always'},specialStates:['no_view','not_understood'],
  contentTags:['unmapped-audit-v2'],provenance:{origin:'original_project_draft',sourceRefs:priorAudit.decisions.find(x=>x.constructId===d.constructId).sourceIds,
   license:{status:'undecided',spdx:null},copiedText:false},notes:d.reason}))};
const allowedScales=new Set(scalesDoc.scales.map(s=>s.id));
for(const item of drafts.items){assert.ok(constructs.has(item.targets[0].constructId));assert.ok(allowedScales.has(item.responseScaleId));
 assert.equal(new Set(item.options.map(o=>o.id)).size,item.options.length);assert.ok(item.options.length>=2);}

const routeRules=model.commitments.filter(c=>c.mappingStatus==='academic_unmapped_audit_v2');
const publicPolicy={...structuredClone(oldPublic),policyVersion:'philosophy-blueprint-1.2.0',parentPolicyVersion:oldPublic.policyVersion,
 modelVersion:model.modelVersion,instrumentVersion:'worldview-public-1.2.0'};
const fullPolicy={...structuredClone(oldFull),policyVersion:'philosophy-full-1.2.0',parentPolicyVersion:oldFull.policyVersion,
 modelVersion:model.modelVersion,instrumentVersion:'worldview-public-240-1.2.0'};
// The full route now makes the reviewed propositions reachable. This is a
// content opportunity; responses, branches, and non-directional answers still
// govern whether any inference is permitted.
for(const rule of routeRules){
 const bundleId=rule.id+':full-route';
 assert.ok(rule.evidence.every(e=>!fullPolicy.excludedItemIds.includes(e.itemId)),'Excluded audit item in full route '+rule.id);
 fullPolicy.bundles.push({id:bundleId,commitmentId:rule.id,domainId:rule.domainId,
  itemIds:rule.evidence.map(e=>e.itemId),itemRevisions:rule.evidence.map(e=>e.itemRevision),
  evidenceUnits:[...new Set(rule.evidence.map(e=>e.unitId))]});
 fullPolicy.facets.push({id:rule.id+':opportunity',title:rule.label,question:rule.proposition,
  domainId:rule.domainId,ruleIds:[rule.id],minimumBundles:1,bundleIds:[bundleId]});
}
// This is opportunity, not an observed psychometric property. Branch items
// counted here are an upper bound because prerequisites may skip them.
const routeOpportunity={sampleSeeds:100,routeSize:240,formPolicyVersion:fullPolicy.policyVersion,
 interpretation:'Deterministic sample of assigned question IDs; conditional items may still be skipped.',rules:{}};
for(const rule of routeRules)routeOpportunity.rules[rule.id]={packetsWithTwoDistinctUnits:0,maxAssignedUnits:0};
for(let n=0;n<100;n++){
 const packet=generatePhilosophyPacket({bank,pilot,policy:fullPolicy,seed:'audit-v2-'+n,size:240});
 const assigned=new Set(packet.entries.map(e=>e.itemId));
 for(const rule of routeRules){
  const units=new Set(rule.evidence.filter(e=>assigned.has(e.itemId)).map(e=>e.unitId));
  const row=routeOpportunity.rules[rule.id];row.maxAssignedUnits=Math.max(row.maxAssignedUnits,units.size);
  if(units.size>=rule.minimumEvidenceUnits)row.packetsWithTwoDistinctUnits++;
 }
}

const ledger=structuredClone(oldLedger);ledger.version='0.4.0';
ledger.sources.push(...additionalSources);
for(const source of ledger.sources){
 source.useByRules=model.commitments.filter(r=>r.sourceIds.includes(source.id)).map(r=>r.id);
 source.useByItems=bank.items.filter(i=>model.commitments.some(r=>r.sourceIds.includes(source.id)&&r.evidence.some(e=>e.itemId===i.id))).map(i=>i.id);
}
const sourceMap=new Map(model.sources.map(s=>[s.id,s]));
const decisions=Object.values(dispositions).map(d=>{
 const construct=constructs.get(d.constructId);assert.ok(construct);
 const candidateItems=bank.items.filter(i=>i.targets.some(t=>t.constructId===d.constructId)).map(i=>({
  itemId:i.id,itemRevision:i.revision,text:i.text,responseScaleId:i.responseScaleId,options:i.options,
  targets:i.targets,mirrorGroup:i.mirrorGroup,scenarioGroup:i.scenarioGroup,provenance:i.provenance,
  excludedFromPublicForm:oldFull.excludedItemIds.includes(i.id)
 }));
 const accepted=model.commitments.filter(r=>r.mappingStatus==='academic_unmapped_audit_v2'&&r.constructId===d.constructId);
 const older=priorAudit.decisions.find(x=>x.constructId===d.constructId);
 const sourceIds=[...new Set([...older.sourceIds,...(dispositionSourceIds[d.constructId]??[])])];
 const neighborIds=new Set(candidateItems.flatMap(i=>i.targets.map(t=>t.constructId)).filter(id=>id!==d.constructId));
 const seq=Number(d.constructId.slice(2));for(const offset of [-1,1]){const id=d.constructId.slice(0,2)+String(seq+offset).padStart(2,'0');if(constructs.has(id))neighborIds.add(id);}
 return {...d,construct,neighborConstructs:[...neighborIds].map(id=>({id,name:constructs.get(id)?.name??null})),
  candidateItems,priorDecision:older.decision,sourceIds,
  academicSources:sourceIds.map(id=>sourceMap.get(id)).filter(Boolean).map(s=>({id:s.id,title:s.title,url:s.url,access:s.access??null})),
  acceptedRuleIds:accepted.map(r=>r.id),draftItemIds:draftItems.filter(i=>i.constructId===d.constructId).map(i=>i.id),
  answerMeanings:accepted.map(r=>({ruleId:r.id,proposition:r.proposition,inferenceStatus:r.inferenceStatus,
   supporting:r.evidence.map(e=>({itemId:e.itemId,revision:e.itemRevision,values:e.support})),
   opposing:r.evidence.map(e=>({itemId:e.itemId,revision:e.itemRevision,values:e.oppose})),
   mixedBehavior:'Both directional answers across authored units remain mixed/context-dependent.',
   missingBehavior:r.missingEvidenceBehavior,neighbors:r.neighbors,nonEntailments:r.nonEntailments,falsePositives:r.falsePositives,
   academicSourceIds:r.sourceIds}))};
});
const decisionCounts=Object.fromEntries([...new Set(decisions.map(d=>d.disposition))].sort().map(kind=>[kind,decisions.filter(d=>d.disposition===kind).length]));
const audit={schemaVersion:'2.0.0',auditVersion:'unmapped-audit-2.0.0',baseCoverageVersion:'0.2.0',
 previousAuditVersion:priorAudit.auditVersion,resultModelVersion:model.modelVersion,auditedConstructs:49,
 decisionCounts,decisions,contentFindings,routeOpportunity,
 unvalidatedMeasurementNotice:'Constructs, weights, thresholds, panel labels, and evidence units are authored theory and engineering choices, not psychometrically established.',
 historicalArtifactsPreserved:true,empiricalValidationClaimed:false};
assert.equal(decisions.length,49);

const experience=structuredClone(oldExperience);experience.experienceVersion='quiz-1.4.0';
experience.routes=experience.routes.map(r=>({...r,formPolicyVersion:r.size===240?fullPolicy.policyVersion:publicPolicy.policyVersion}));
experience.formPolicies.push({version:publicPolicy.policyVersion,path:'data/philosophy/public-form-v1.2.json'},
 {version:fullPolicy.policyVersion,path:'data/philosophy/public-full-v1.2.json'});
experience.modelPolicies=[
 {version:'generic-0.2.0',path:'data/generic/model-v0.2.json'},
 {version:'generic-0.3.0',path:'data/generic/model-v0.3.json'},
 {version:model.modelVersion,path:'data/generic/model-v0.4.json'}
];
experience.academicAudit={version:audit.auditVersion,path:'data/academic/unmapped-audit-v2.json',resultModelVersion:model.modelVersion};

await write('data/generic/model-v0.4.json',model);
await write('data/generic/coverage-v0.4.json',model.coverage);
await write('data/generic/source-ledger-v0.4.json',ledger);
await write('data/academic/unmapped-audit-v2.json',audit);
await write('data/items/unmapped-draft-v1.json',drafts);
await write('data/philosophy/public-form-v1.2.json',publicPolicy);
await write('data/philosophy/public-full-v1.2.json',fullPolicy);
await write('data/experience/policy-v1.3.json',experience);
current.worldviewModel={version:model.modelVersion,path:'data/generic/model-v0.4.json'};
current.worldviewCoverage={version:'0.4.0',path:'data/generic/coverage-v0.4.json'};
current.worldviewSourceLedger={version:'0.4.0',path:'data/generic/source-ledger-v0.4.json'};
current.publicForm={version:publicPolicy.policyVersion,path:'data/philosophy/public-form-v1.2.json'};
current.fullForm={version:fullPolicy.policyVersion,path:'data/philosophy/public-full-v1.2.json'};
current.quizExperience={version:experience.experienceVersion,path:'data/experience/policy-v1.3.json',entrypoint:'apps/quiz/index.html'};
current.unmappedAcademicAudit={version:audit.auditVersion,path:'data/academic/unmapped-audit-v2.json'};
current.unmappedDraftItems={version:drafts.bankVersion,path:'data/items/unmapped-draft-v1.json'};
await write('data/current.json',current);

const docs=['# Evidence-limited audit of 49 previously unmapped constructs','',
 'The baseline is `coverage-v0.2.json`. The authored construct registry is a theoretical ontology, not a validated factor model. The 562 released bank items and historical public forms are unchanged. Two new draft candidates are outside released instruments.','',
 '## Dispositions','',...Object.entries(decisionCounts).map(([k,v])=>`- **${k}**: ${v}`),'',
 `The new model contains ${routeRules.length} reviewed direct propositions across ${new Set(routeRules.map(r=>r.constructId)).size} of the 49 constructs. Other distinctions remain explicit gaps. A rule in the bank is not evidence that a particular route asked its questions.`,'',
 '## Public 240-question route opportunity','',
 `For ${routeOpportunity.sampleSeeds} deterministic packets, these counts show assignment of two distinct authored evidence units before conditional skips. They are engineering observations, not sampling estimates or validated coverage rates.`,'',
 ...routeRules.map(r=>{const row=routeOpportunity.rules[r.id];return `- ${r.id}: ${row.packetsWithTwoDistinctUnits}/${routeOpportunity.sampleSeeds} packets assigned two units; maximum ${row.maxAssignedUnits} units.`;}),'',
 '## Decisions','',
 ...decisions.flatMap(d=>[`### ${d.constructId} — ${d.construct.name}`,
 `Disposition: **${d.disposition}**. ${d.reason}`,
 `Candidate items: ${d.candidateItems.map(i=>i.itemId+'@'+i.itemRevision).join(', ')||'none'}.`,
 `Accepted rules: ${d.acceptedRuleIds.join(', ')||'none'}. Draft items: ${d.draftItemIds.join(', ')||'none'}.`,
 `Academic basis: ${d.academicSources.map(s=>`[${s.title}](${s.url})`).join('; ')||'none recorded'}.`,
 ...d.answerMeanings.flatMap(m=>[`Exact proposition: ${m.proposition}`,
 `Support: ${m.supporting.map(x=>`${x.itemId}@${x.revision}=${JSON.stringify(x.values)}`).join('; ')}.`,
 `Opposition: ${m.opposing.map(x=>`${x.itemId}@${x.revision}=${JSON.stringify(x.values)}`).join('; ')}.`,
 `Neighbors: ${m.neighbors.join('; ')}. Non-entailments: ${m.nonEntailments.join('; ')}.`,
 `False-positive guards: ${m.falsePositives.join('; ')}. Missing: ${JSON.stringify(m.missingBehavior)}.`]),'']),
 '## Focused content-validity findings','',...contentFindings.map(f=>`- **${f.kind}** (${f.itemIds.join(', ')}): ${f.finding}`),'',
 'Research-only, derived-only, split, and unresolved status are intentional dispositions. The draft items require cognitive review and a future versioned bank/form decision before respondent-facing interpretation.',''].join('\n');
await write('docs/UNMAPPED_AUDIT.md',docs);
await write('docs/FULL_ROUTE.md',[
 '# 240-question full exploration','',
 'The active full form is `'+fullPolicy.policyVersion+'` with interpretation model `'+model.modelVersion+'`. It assigns exactly 240 distinct questions from the unchanged 562-item released bank. The 80, 120, and 160-question forms remain available.','',
 'The full form retains the 31 authored academic content facets and adds 17 required content bundles for the reviewed direct propositions in the 49-construct audit. This guarantees assigned opportunity for those propositions in the tested form seeds. Conditional branches may still be skipped; no-view, neutral, mixed, and missing answers do not turn into a forced conclusion. See [the item-level audit](UNMAPPED_AUDIT.md).','',
 '## Compatibility','',
 '- Historical banks, forms, item revisions, and evidence models remain at their original versioned paths.',
 '- A saved public packet resolves its exact form and evidence model versions before interpretation. Unknown versions fail closed.',
 '- Two new draft candidate questions are stored separately in `data/items/unmapped-draft-v1.json`; neither appears on a released route.','',
 '## Evidence limits','',
 'The form is a content blueprint, not an empirically validated short form. A two-unit assignment is not a reliability estimate. Results distinguish supported, leaned toward, mixed or context-dependent, opposed, insufficient evidence, and not measured. They do not produce identity matches or percentages.','',
 '## Validation','',
 'Run `npm test` for data, engine, form, audit, and regression checks. Run `npm run test:quiz:browser` with Playwright installed for the actual browser flow. The audit suite checks 100 deterministic full-route seeds and exact historical packet replay.',''
 ].join('\n'));
let readme=await raw('README.md');
readme=readme.split('\n## Evidence-limited 49-construct audit\n')[0];
await write('README.md',readme+'\n## Evidence-limited 49-construct audit\n\nAll 49 constructs unmapped in `coverage-v0.2.json` now have explicit dispositions. The active model retains only narrow direct propositions with answer-level counterexamples; other distinctions remain derived, research-only, split, or unresolved. The full route assigns the reviewed evidence bundles but individual results still depend on presented and answered items. See [the 49-construct audit](docs/UNMAPPED_AUDIT.md) and [current full-route behavior](docs/FULL_ROUTE.md).\n');
let guide=await raw('docs/QUIZ_EXPERIENCE.md');
guide=guide.replace('three clearly labeled routes (80/120/160 questions)','four clearly labeled routes (80/120/160/240 questions)')
 .replace('Supported, opposed, mixed and insufficient evidence remain distinct.','Supported, leaned toward, mixed or context-dependent, opposed, insufficient evidence, and not measured remain distinct.')
 .replace('The question bank, interpretation model and historical versions are unchanged by this interface release.',
  'Released question wording and historical versions are preserved; the active interpretation model has its own version.')
 .replace('The raw session records `clientVersion=quiz-1.0.0` so this administration can be distinguished from the earlier client.',
  'The raw session records an exact client version; the current interface is `quiz-1.4.0`, while older backups retain their versions.');
await write('docs/QUIZ_EXPERIENCE.md',guide);
for(const [p,expected] of Object.entries(frozen))assert.equal(hash(await raw(p)),expected,'Historical artifact mutated: '+p);
const buildOut=await read('data/academic/build-output.json');buildOut.paths=[...new Set([...buildOut.paths,...output])].sort();
await write('data/academic/build-output.json',buildOut);
console.log(JSON.stringify({modelVersion:model.modelVersion,decisionCounts,retainedRules:routeRules.length,
 routeRulesWithOpportunity:Object.values(routeOpportunity.rules).filter(x=>x.packetsWithTwoDistinctUnits>0).length},null,2));
