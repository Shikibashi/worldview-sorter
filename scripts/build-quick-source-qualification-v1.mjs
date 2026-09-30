// Pin one reviewed Quick-route proposition to an exact philosophical source claim.
// Historical model and route artifacts are read only; successors use new paths.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const old={sources:'data/sources-v1.5.json',ledger:'data/generic/source-ledger-v0.11.json',
 model:'data/generic/model-v1.7-pilot.json',full:'data/philosophy/public-pilot-v1.7.json',
 depth:'data/experience/progressive-depth-v1.8.json',pilot:'data/pilots/pilot-candidate-v1.7.json',
 catalog:'data/affinities/catalog-v1.8.json',localization:'data/localization/catalog-v9.json',
 experience:'data/experience/policy-v1.14.json',channels:'data/releases/channels-v11.json'};
const next={sources:'data/sources-v1.6.json',ledger:'data/generic/source-ledger-v0.12.json',
 model:'data/generic/model-v1.8-pilot.json',full:'data/philosophy/public-pilot-v1.8.json',
 depth:'data/experience/progressive-depth-v1.9.json',pilot:'data/pilots/pilot-candidate-v1.8.json',
 catalog:'data/affinities/catalog-v1.9.json',localization:'data/localization/catalog-v10.json',
 experience:'data/experience/policy-v1.15.json',channels:'data/releases/channels-v12.json'};
const reviewedOn='2026-09-30';
const sourceSpecs=[
 {id:'sep-observation-public-testability',ruleId:'audit2-EP06-testability',constructId:'EP06',
  itemIds:['EPI004','EPI026'],title:'Stanford Encyclopedia of Philosophy: Theory and Observation in Science',
  url:'https://plato.stanford.edu/entries/science-theory-observation/',
  use:'Section 2.1: intersubjectively ascertainable observation reports and publicly appraisable theory tests; sections 1–2 discuss theory-ladenness and the limits of simple objectivity.',
  claim:'Intersubjectively ascertainable observations and public theory testing are a recognized rationale for the epistemic credibility of empirical claims; the account also acknowledges theory-ladenness and does not make every private experience worthless.'}
];
const sourceRecord=spec=>({id:spec.id,kind:'academic',title:spec.title,url:spec.url,use:spec.use,
 evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',reviewedOn,
 reuse:'Conceptual distinction only; original Worldview Sorter questions are not validated by this source.',
 validatesThisQuiz:false,claim:spec.claim});
const bank=await read('data/items/candidate-v0.12.json');
for(const spec of sourceSpecs)for(const itemId of spec.itemIds)
 assert.ok(bank.items.some(row=>row.id===itemId&&row.revision===(itemId==='EPI004'?2:1)),
  'Required exact item revision unavailable: '+itemId);
const sources=await read(old.sources),ledger=await read(old.ledger);
ledger.version='0.12.0';
for(const spec of sourceSpecs){
 const record=sourceRecord(spec);sources.sources.push(record);
 ledger.sources.push({...record,useByRules:[spec.ruleId],useByConstructs:[spec.constructId],
  useByItems:spec.itemIds,permissionToCopyItems:false,validatesOurItems:false,
  sourceRole:'signed_scholarly_synthesis',
  detailedUseLimit:'Supports the named conceptual contrast only. It does not validate the item wording, evidence-unit threshold, respondent type, or neighboring philosophical identity.'});
}
await write(next.sources,sources);await write(next.ledger,ledger);

const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.8.0-pilot';
for(const spec of sourceSpecs){
 const rule=model.commitments.find(row=>row.id===spec.ruleId);
 assert.ok(rule&&model.publicRuleIds.includes(rule.id),'Expected active public rule: '+spec.ruleId);
 rule.sourceIds.push(spec.id);rule.sourceClaims=[{sourceId:spec.id,relationship:'supports',claim:spec.claim}];
 const coverage=model.coverage.constructs.find(row=>row.id===spec.constructId);
 assert.ok(coverage);coverage.declaredSources.push(spec.id);
 model.sources.push(sourceRecord(spec));
}
const testability=model.commitments.find(row=>row.id==='audit2-EP06-testability');
assert.equal(testability.proposition,testability.scope);
testability.nonEntailments.push('A publicly testable method is infallible or every private experience lacks personal evidential value.');
testability.falsePositives.push('Preference between these two methods does not license a general rule that all knowledge must be experimental.');
await write(next.model,model);

const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.8.0';full.modelVersion=model.modelVersion;
await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-1.9.0';
depth.modelVersion=model.modelVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-1.9.0';
depth.selectionBasis='All 64/120/243 exact item revisions and order remain unchanged. Quick public-testability now has an exact source claim; no route gains an evidence opportunity.';
for(const route of depth.routes)route.routeVersion=route.id+'-1.9.0';
await write(next.depth,depth);
await write('data/experience/progressive-depth-v1.9.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});

const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-1.9.0';
catalog.modelVersion=model.modelVersion;await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.9.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.9.0';
localization.modelVersion=model.modelVersion;localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v10.json':locale.locale+'-draft-v10.json');
 const version='localization-'+locale.locale+(en?'-1.9.0':'-draft-10');
 bundle.bundleVersion=version;bundle.modelVersion=model.modelVersion;
 bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' The exact public-testability claim needs linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.9.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.8.0';
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.frozenArtifactHashes={[pilot.contentReview.path]:await hash(pilot.contentReview.path),
 [pilot.route.instrumentManifestPath]:await hash(pilot.route.instrumentManifestPath),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[pilot.itemBank.path]:await hash(pilot.itemBank.path),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),[next.sources]:await hash(next.sources)};
pilot.limitations.push('The source-qualified Quick public-testability proposition does not prove scientific exclusivism or psychometric validity.');
await write(next.pilot,pilot);

const experience=await read(old.experience);experience.experienceVersion='quiz-1.15.0';
experience.formPolicies.push({version:full.policyVersion,path:next.full},
 {version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.9.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The authored 64/120/243 item sets and evidence opportunities are unchanged; one Quick-route proposition gains a reviewed claim-level source link.';
await write(next.experience,experience);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-12.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.11.0';
await write(next.channels,channels);
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');
current.sourceRegistry={version:'source-registry-1.6.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.9.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v1.9.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v1.9.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',current);
console.log('Prepared one exact Quick-route source claim; bank, routes, answer mappings, and affinities unchanged.');
