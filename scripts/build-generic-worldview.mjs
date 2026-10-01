import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sources as reviewedSources,commitments as authored,foundationRules,methodologicalRules,unsupportedInferences,readinessGaps} from '../data/generic/spec-v0.1.mjs';
import {additions} from '../data/academic/additions-v0.9.mjs';
import {validateModel} from '../packages/worldview/index.js';
const newSources=[...reviewedSources,{
 id:'gen-afterlife',title:'Afterlife',url:'https://plato.stanford.edu/entries/afterlife/',
 locator:'Introduction and sections 1–3: survival, dualism, materialism',
 claim:'Survival after biological death is a distinct question; dualism does not guarantee it and materialist accounts of survival are discussed.',
 access:'selected_sections_reviewed',evidenceType:'signed_scholarly_analysis',reviewedOn:'2026-09-28',
 itemReuse:'Conceptual reference only; no question wording copied.'
}];
const root=new URL('../',import.meta.url);
const raw=p=>readFile(new URL(p,root),'utf8');
const read=async p=>JSON.parse(await raw(p));
const output=new Set();
const write=async(p,v)=>{await mkdir(new URL(p.substring(0,p.lastIndexOf('/')+1),root),{recursive:true});await writeFile(new URL(p,root),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');output.add(p);};
const digest=s=>createHash('sha256').update(s).digest('hex');
const current=await read('data/current.json');
const bank=await read(current.candidateBank.path),registry=await read('data/constructs.json');
assert.equal(bank.bankVersion,'0.9.0');
const frozen=Object.fromEntries(await Promise.all(['data/items/candidate-v0.8.json','data/items/candidate-v0.9.json','data/instruments/research-pool-0.9.json','data/registries/constructs-v0.2.json'].map(async p=>[p,digest(await raw(p))])));
const domains=(await read('data/domains.json')).domains;
const scalesDoc=await read('data/response-scales.json');
const sourceDoc=await read('data/sources.json');
const supplement=await read('data/academic/methodology-supplement-v0.9.json');
const sourceMap=new Map(sourceDoc.sources.map(s=>[s.id,s]));
for(const s of [...supplement.sources,...newSources])sourceMap.set(s.id,s);
const sources=[...sourceMap.values()].sort((a,b)=>a.id.localeCompare(b.id));
const items=new Map(bank.items.map(i=>[i.id,i]));
const definitions=new Map(registry.constructs.map(c=>[c.id,c]));
const old=await read('data/profiles/catalog-v0.2.json');
const map=(await read('data/profiles/evidence-map-v0.2.json')).constructItems;
const rules=new Map(),comparisons=[];
const evidence=e=>{
 const i=items.get(e.itemId);assert.ok(i,'Unknown mapped item '+e.itemId);
 return {...e,itemRevision:i.revision,unitId:e.unitId??i.mirrorGroup??i.scenarioGroup??i.id};
};
const addRule=c=>{
 assert.ok(!rules.has(c.id),'Duplicate rule '+c.id);
 assert.ok(definitions.has(c.constructId),'Unknown construct '+c.constructId);
 const d=definitions.get(c.constructId);
 const r={...c,domainId:d.domainId,tier:d.tier,minimumEvidenceUnits:2,scope:c.scope??c.label,
  mappingStatus:c.mappingStatus??'authored_explicit_response_interpretation',
  evidence:c.evidence.map(evidence),thresholdStatus:'engineering_duplicate_control_not_psychometric',
  sourceIds:[...new Set(c.sourceIds)]};
 rules.set(r.id,r);return r.id;
};
const single=c=>comparisons.push({id:'compare-'+c.id,label:c.label,kind:c.layer==='personal_value'?'reported_value_priority':'specified_commitment',scope:c.scope??c.label,sourceIds:c.sourceIds,
 criteria:[{commitmentId:c.id,expected:'support',role:'defining'}],limitations:[c.boundary,'Comparison is confined to these answers; no whole-system identity is inferred.']});
for(const c of additions){
 const layer=({NE16:'practical_rationality',AH13:'descriptive',AH14:'conceptual_agency',SO14:'social_ontological',SO15:'explanatory_method',OM14:'metaontological_method',PL31:'institutional_justification'}[c.id]) ?? (c.id.startsWith('ME')?'metaethical':c.id.startsWith('PL')?'institutional_normative':c.id.startsWith('EP')?'epistemic':c.id.startsWith('OM')?'ontological':'normative');
 const rule={id:'construct-'+c.id,constructId:c.id,label:c.name,scope:c.scope,layer,sourceIds:c.sourceIds,
  boundary:c.doNotInfer.join('; '),mappingStatus:'inherited_academic_rule_with_recorded_limits',
  evidence:map[c.id].map(e=>({itemId:e.itemId,support:e.polarity===1?[1,2]:[-2,-1],oppose:e.polarity===1?[-2,-1]:[1,2]}))};
 addRule(rule);single(rule);
}
for(const p of old.profiles){
 const criteria=p.criteria.map(c=>{
  let id=c.constructId?'construct-'+c.constructId:null;
  if(!id){
   id='legacy-'+p.id+'-'+c.id;
   const layer=items.get(c.evidence[0].itemId).domainId==='ME'?'metaethical':'institutional_normative';
   addRule({id,constructId:items.get(c.evidence[0].itemId).targets[0].constructId,label:c.id,layer,scope:p.scope,sourceIds:c.sourceIds,evidence:c.evidence,
    boundary:'Inherited narrow criterion; do not generalize it beyond '+p.scope,mappingStatus:'inherited_academic_rule_with_recorded_limits'});
  }
  return {commitmentId:id,expected:c.expected==='reject'?'oppose':'support',role:c.essential?'defining':'disputed'};
 });
 comparisons.push({id:p.id,label:p.label,scope:p.scope,kind:'selected_tradition_commitments',sourceIds:p.sourceIds,criteria,limitations:p.limitations});
}
for(const original of authored){
 const c=original.id==='afterlife-belief'?{...original,sourceIds:['gen-afterlife']}:original;
 addRule(c);single(c);
}
assert.equal(rules.get('legacy-objectivism-moral-truth-aptness').layer,'metaethical');
assert.deepEqual(rules.get('afterlife-belief').sourceIds,['gen-afterlife']);
for(const [constructId,name,general,caseId,support,oppose] of foundationRules){
 const c={id:'moral-concern-'+name,constructId,label:'Moral relevance of '+name,layer:'moral_intuition',sourceIds:['acad-mfq2'],
  scope:'Reported importance of '+name+' in moral assessment, without assigning a party or philosophical system.',
  boundary:'Not an administration or validation of MFQ-2; other concerns can be high simultaneously.',
  evidence:[{itemId:general,support:[1,2],oppose:[-2,-1]},{itemId:caseId,support,oppose}]};
 addRule(c);single(c);
}
for(let n=1;n<=19;n++){
 const constructId='VA'+String(n).padStart(2,'0'),d=definitions.get(constructId);
 const candidates=bank.items.filter(i=>i.responseScaleId==='importance5'&&i.targets.some(t=>t.constructId===constructId&&t.role==='primary'));
 assert.ok(candidates.length>=2,'No independent value evidence '+constructId);
 const c={id:'priority-'+constructId,constructId,label:'High stated priority: '+d.name,layer:'personal_value',sourceIds:['gen-values','schwartz-refined'],
  scope:'The respondent reports this personal value as very or extremely important.',
  boundary:'Not a doctrine, moral command, population percentile, or PVQ-RR score. Moderate importance is neither rejection nor uncertainty.',
  evidence:candidates.map(i=>({itemId:i.id,support:[1,2],oppose:[-2,-1]}))};
 addRule(c);single(c);
}
const ruleList=[...rules.values()].sort((a,b)=>a.id.localeCompare(b.id));
const active=registry.constructs.filter(c=>c.measurementStatus!=='deprecated');
const coverage={constructs:active.map(c=>({id:c.id,name:c.name,domainId:c.domainId,type:c.type,tier:c.tier,
  declaredSources:c.evidenceBasis,ruleIds:ruleList.filter(r=>r.constructId===c.id).map(r=>r.id),
  candidateItemIds:bank.items.filter(i=>i.targets.some(t=>t.constructId===c.id)).map(i=>i.id),
  status:ruleList.some(r=>r.constructId===c.id)?'scoped_comparison_available':'candidate_or_reference_only_no_inference_rule'})),
 items:bank.items.map(i=>({itemId:i.id,itemRevision:i.revision,sourceIds:i.provenance.sourceRefs,
  ruleIds:ruleList.filter(r=>r.evidence.some(e=>e.itemId===i.id)).map(r=>r.id),
  status:ruleList.some(r=>r.evidence.some(e=>e.itemId===i.id))?'explicit_mapping_only':'not_used_for_profile_inference',
  sourceValidationTransferred:false}))};
const limitations=[...methodologicalRules.map(r=>r[1]),...readinessGaps.map(g=>g.reason)];
const model={schemaVersion:'1.0.0',modelVersion:'generic-0.1.0',engineVersion:'generic-evidence-1',bankVersion:bank.bankVersion,registryVersion:registry.registryVersion,
 identityOutputAllowed:false,percentageMatchAllowed:false,sourceEvidenceIsRespondentData:false,
 domains:domains.map(d=>({id:d.id,name:d.name})),sources,commitments:ruleList,comparisons,coverage,limitations};
validateModel({model,bank,scalesDoc});
assert.equal(new Set(ruleList.map(c=>c.domainId)).size,12,'Generic comparisons must cover all 12 domains.');
const sourceLedger=sources.map(s=>({...s,access:s.access??'inherited_reference_access_not_reverified',
 useByRules:ruleList.filter(r=>r.sourceIds.includes(s.id)).map(r=>r.id),
 useByConstructs:active.filter(c=>c.evidenceBasis.includes(s.id)).map(c=>c.id),
 useByItems:bank.items.filter(i=>i.provenance.sourceRefs.includes(s.id)).map(i=>i.id),
 permissionToCopyItems:false,validatesOurItems:false,
 sourceRole:s.evidenceType??(s.kind==='instrument'?'instrument_reference_not_transferable':'inherited_reference'),
 detailedUseLimit:/metadata/i.test(s.access??'')?'Reference metadata only; not detailed full-text support.':'Only the stated locator/claim is relied on.'}));
await write('data/generic/model-v0.1.json',model);
await write('data/generic/source-ledger-v0.1.json',{version:'0.1.0',rawParticipantDataImported:false,sources:sourceLedger});
await write('data/generic/coverage-v0.1.json',coverage);
await write('data/generic/anti-inference-v0.1.json',{version:'0.1.0',rules:unsupportedInferences.map(([from,to,reason])=>({from,to,reason:from==='SO14'&&to==='SO15'?'Institution-dependent social entities do not determine methodological individualism or normative priority of groups.':reason,kind:'do_not_infer',automaticPropagation:false})),gaps:readinessGaps});
const report={version:'0.1.0',bankVersion:bank.bankVersion,itemCount:bank.items.length,activeConstructCount:active.length,
 domainsCovered:new Set(ruleList.map(c=>c.domainId)).size,commitments:ruleList.length,comparisons:comparisons.length,
 sourceRecords:sourceLedger.length,newSourceRecords:newSources.length,
 constructsWithMappings:coverage.constructs.filter(c=>c.ruleIds.length).length,
 constructsWithoutMappings:coverage.constructs.filter(c=>!c.ruleIds.length).length,
 itemsWithMappings:coverage.items.filter(i=>i.ruleIds.length).length,
 frozenSourceHashes:frozen,cognitiveReviewRequired:false,empiricalDataFabricated:false};
await write('data/generic/release-v0.1.json',report);
current.worldviewModel={version:model.modelVersion,path:'data/generic/model-v0.1.json'};
current.worldviewSourceLedger={version:'0.1.0',path:'data/generic/source-ledger-v0.1.json'};
current.worldviewCoverage={version:'0.1.0',path:'data/generic/coverage-v0.1.json'};
await write('data/current.json',current);
await write('data/sources.json',{...sourceDoc,sources});
const cite=ids=>ids.map(id=>{const s=sourceMap.get(id);assert.ok(s,'Missing source '+id);return `[${s.title}](${s.url})`;}).join('; ');
const document=[
 '# Generic academic worldview layer','',
 '> Historical milestone for the earlier 83-rule model. Its counts are not current. See [the PR #1 content audit](CONTENT_EFFICIENCY_AUDIT.md) for `generic-0.3.0` and the 562-item bank.','',
 'The unit of comparison is an explicitly reported commitment, not a person, party, country or nearest philosophical identity. This layer reuses the entire repository source ledger, including critiques and limited-access records, without pretending that citations are respondent data.','',
 `The bank remains ${bank.items.length} items. The model has ${ruleList.length} reusable commitment rules and ${comparisons.length} scoped comparisons across all twelve domains. ${report.constructsWithoutMappings} active constructs still lack an approved comparison rule and remain visible as gaps.`,
 '', '## Academic and methodological decisions','',
 ...methodologicalRules.map(([id,text])=>`- **${id}**: ${text}`),
 '', '## Reusable rules, exact questions and sources','',
 ...ruleList.flatMap(c=>[`### ${c.id}: ${c.label}`,c.scope+' '+cite(c.sourceIds),`Layer: ${c.layer}. Evidence: ${c.evidence.map(e=>e.itemId+'@'+e.itemRevision).join(', ')}.`,c.boundary,'']),
 '## Remaining gaps','',...readinessGaps.map(g=>`- **${g.id}**: ${g.reason}`),'',
 '## Scope of implementation','',
 'Use `npm run worldview:compare -- responses.json` for the generic 12-domain reported-commitment fingerprint and scoped comparisons. Use `npm run worldview:followups -- responses.json 12` for label-independent, domain-balanced missing-evidence planning. The previous nine-comparison module remains for historical regression compatibility. The browser does not yet render these as a result page. No cognitive interviews, calibration, participant study or scientific-validation claim is required or implied.',''
].join('\n');
await write('docs/GENERIC_WORLDVIEW.md',document);
const ledgerDoc=['# Academic source-use and access ledger','',
 'Every source record is inventoried. Reusing an inherited citation is not a claim to have newly read its full text. Metadata-only and abstract-only access remain explicit. No published norms, questionnaire response data or licensed items have been imported.','',
 ...sourceLedger.map(s=>`- **${s.id}**: [${s.title}](${s.url}). Access: ${s.access}. Role: ${s.sourceRole}. Locator: ${s.locator??s.use??'Inherited reference; no new pinpoint claim'}. ${s.detailedUseLimit}`),''].join('\n');
await write('research/academic/GENERIC_SOURCE_LEDGER.md',ledgerDoc);
let readme=await raw('README.md');const marker='\n## Generic academic comparison layer\n';readme=readme.split(marker)[0];
readme+=marker+'\nThe active generic model covers all twelve domains using reusable, source-traceable commitments. Personal priorities, normative principles, descriptive beliefs, ontological claims and institutional prescriptions are not conflated. No profile is forced and no match percentage is produced.\n\n`npm run worldview:compare -- responses.json`\n\n`npm run worldview:followups -- responses.json 12`\n\nSee [the generic source/item matrix](docs/GENERIC_WORLDVIEW.md), [source access ledger](research/academic/GENERIC_SOURCE_LEDGER.md), and [coverage report](data/generic/coverage-v0.1.json). Existing sample collection and older comparison modules remain compatibility/development tools; the generic layer does not require cognitive review or claim empirical validation.\n';
readme+='\n## Independent semantic exploration and reference profiles\n\nWorldview Sorter can attach source-backed explanatory links to already interpreted propositions and can compare those propositions with independently authored philosopher or tradition reference profiles. These layers cannot change respondent evidence, produce a nearest-profile winner, assign an identity, or emit match percentages.\n\nThird-party philosopher/profile datasets are not used as content sources. New reference content is authored from primary texts and reviewed scholarship under the same claim-level provenance rules used elsewhere in the project. The current reference-profile catalog is an internal readiness/authoring artifact and is not part of the public result experience.\n\nSee [independent reimplementation and reference-corpus policy](docs/INDEPENDENT_REIMPLEMENTATION.md) and [reference-profile governance](docs/REFERENCE_PROFILES.md).\n';
await write('README.md',readme);
for(const [p,h] of Object.entries(frozen))assert.equal(digest(await raw(p)),h,'Frozen source mutated '+p);
const prior=await read('data/academic/build-output.json');
prior.paths=[...new Set([...prior.paths,...output,'data/generic/build-output.json'])].sort();
await write('data/academic/build-output.json',prior);
await write('data/generic/build-output.json',{paths:[...output,'data/generic/build-output.json'].sort()});
console.log(JSON.stringify(report,null,2));
