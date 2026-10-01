// Version the sacred-status result claim without changing released answers or item wording.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const old={sources:'data/sources-v1.8.json',ledger:'data/generic/source-ledger-v0.16.json',
 model:'data/generic/model-v1.12-pilot.json',full:'data/philosophy/public-pilot-v1.12.json',
 depth:'data/experience/progressive-depth-v2.3.json',pilot:'data/pilots/pilot-candidate-v1.12.json',
 catalog:'data/affinities/catalog-v2.3.json',localization:'data/localization/catalog-v14.json',
 experience:'data/experience/policy-v1.19.json',channels:'data/releases/channels-v16.json'};
const next={sources:'data/sources-v1.9.json',ledger:'data/generic/source-ledger-v0.17.json',
 model:'data/generic/model-v1.13-pilot.json',full:'data/philosophy/public-pilot-v1.13.json',
 depth:'data/experience/progressive-depth-v2.4.json',pilot:'data/pilots/pilot-candidate-v1.13.json',
 catalog:'data/affinities/catalog-v2.4.json',localization:'data/localization/catalog-v15.json',
 experience:'data/experience/policy-v1.20.json',channels:'data/releases/channels-v17.json'};
const depthManifest='data/experience/progressive-depth-v2.4.manifest.json';
const affinityManifest='data/affinities/manifest-v2.4.json';
const localizationManifest='data/localization/manifest-v2.4.json';
const localizedFiles=['data/localization/ar-draft-v15.json','data/localization/en-US-v15.json',
 'data/localization/es-ES-draft-v15.json'];
const files=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,...localizedFiles];
const current=await read('data/current.json');
if(current.worldviewModel?.path===next.model){
 for(const file of files)await access(path.join(root,file));
 console.log('Sacred-value scope successor artifacts already exist and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.15.0');
const currentKeys={sources:'sourceRegistry',ledger:'worldviewSourceLedger',model:'worldviewModel',
 full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',catalog:'affinityCatalog',
 localization:'localizationCatalog',experience:'quizExperience',channels:'releaseChannels'};
for(const [key,file] of Object.entries(old))assert.equal(current[currentKeys[key]]?.path,file);
for(const file of files){try{await access(path.join(root,file));throw Error('Successor artifact already exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}
const proposition='In the stated community-object and practical-benefit case, sacred status itself can carry at least some moral weight beyond the object\'s ordinary resource value and the specified direct harm to persons.';
const supportingClaim='Sacredness can have ethical significance, including for political morality; this supports distinguishing a sacred-status reason from an object\'s merely practical use without establishing this questionnaire\'s validity.';
const strongerClaim='One influential account treats sacred values as inviolable, incontestable, and dialectically invulnerable; assigning only some defeasible weight in a tradeoff does not establish those stronger properties.';
const comparisonClaim='Philosophers distinguish multiple meanings of value incommensurability and comparability; assigning some moral weight in one case does not settle those separate theses.';
const sources=await read(old.sources),ledger=await read(old.ledger);ledger.version='0.17.0';
const specs=[
 {id:'rotondo-sacred-2026',title:'Andrew Rotondo, The Philosophical Significance of the Sacred',
  url:'https://www.cambridge.org/core/journals/philosophy/article/abs/philosophical-significance-of-the-sacred/7B1A523474922B7051EAC55F9760B5BA',
  use:'Journal abstract and publication metadata: philosophical account of sacredness and ethical implications for political morality.',
  evidenceType:'peer_reviewed_philosophy',access:'publisher_abstract_reviewed',claim:supportingClaim},
 {id:'katsafanas-sacred-values-2022',title:'Paul Katsafanas, The Nature of Sacred Values',
  url:'https://academic.oup.com/book/44864/chapter-abstract/384569224',
  use:'Philosophy of Devotion, chapter 2 abstract: inviolability, incontestability and dialectical invulnerability.',
  evidenceType:'academic_book_chapter',access:'publisher_abstract_reviewed',claim:strongerClaim},
 {id:'sep-value-incommensurable',title:'Stanford Encyclopedia of Philosophy: Incommensurable Values',
  url:'https://plato.stanford.edu/entries/value-incommensurable/',
  use:'Sections 1 and 2: distinct senses of measurement, comparison and incommensurability.',
  evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',claim:comparisonClaim}
];
for(const spec of specs){
 assert.ok(!sources.sources.some(row=>row.id===spec.id));
 const record={id:spec.id,kind:'academic',title:spec.title,url:spec.url,use:spec.use,
  evidenceType:spec.evidenceType,access:spec.access,reviewedOn:'2026-10-01',
  reuse:'Conceptual source only; no original questionnaire wording copied or validated.',
  validatesThisQuiz:false,claim:spec.claim};
 sources.sources.push(record);
 ledger.sources.push({...record,locator:spec.use,useByRules:['ph-sacred-value'],
  useByConstructs:['RC09'],useByItems:['RCI012','RCI029'],permissionToCopyItems:false,
  validatesOurItems:false,sourceRole:spec.evidenceType,
  detailedUseLimit:'Supports the conceptual scope and neighboring stronger theses, not the questions, respondent comprehension, independence of two authored units, or the threshold.'});
}
await write(next.sources,sources);await write(next.ledger,ledger);
const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.13.0-pilot';
const rule=model.commitments.find(row=>row.id==='ph-sacred-value');assert.ok(rule);
assert.deepEqual(rule.evidence.map(row=>row.itemId),['RCI012','RCI029']);
rule.label='Sacred status can carry some moral weight in a community-object tradeoff';
rule.scope=proposition;rule.proposition=proposition;
rule.boundary='The result concerns sacred status itself in one community-object tradeoff. Some weight may be outweighed. Community-conferred and secular sacredness remain possible; inviolability, incommensurability, intrinsic status, religion, and all other cases are not inferred.';
rule.interpretationKind='direct_interpretable_proposition';rule.inferenceStatus='direct';
rule.hypothesizedConstructId='RC09';rule.affinityCriterion=false;rule.researchVariable=false;
rule.sourceIds=[...new Set([...rule.sourceIds,...specs.map(row=>row.id)])];
rule.sourceClaims=[{sourceId:'rotondo-sacred-2026',relationship:'supports',claim:supportingClaim},
 {sourceId:'katsafanas-sacred-values-2022',relationship:'challenges',claim:strongerClaim},
 {sourceId:'sep-value-incommensurable',relationship:'context',claim:comparisonClaim},
 {sourceId:'domain-sacred',relationship:'context',claim:'Context-limited experiments distinguish sacred commitments from ordinary incentives; they do not validate these items or establish a general respondent trait.'}];
rule.neighbors=['Only human reactions and relationships matter in the vignette, with no additional weight from sacred status itself',
 'Sacred status has some defeasible moral weight','Strictly inviolable sacred values',
 'Attitude-independent sacredness','Religious or purity-based sacredness'];
rule.nonEntailments=['Every sacred thing is inviolable or immune to tradeoffs',
 'Sacred and practical values are incommensurable','Sacred status exists independently of attitudes or practices',
 'A deity, revelation, religious law, purity norm, or religious identity',
 'The same judgment applies to sacred persons, places, or political commitments'];
rule.falsePositives=['The RCI029 some answer explicitly allows sufficient practical benefit to outweigh sacred status.',
 'A community-conferred or secular sacred status can support this narrow result without intrinsic sacredness.',
 'The very_high answer in one vignette does not establish absolute inviolability in all cases.',
 'The symbolic answer can affirm the moral importance of human relationships while opposing additional weight from sacred status itself.'];
rule.missingEvidenceBehavior={notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
 singleDirectionalUnit:'leaned_toward'};
for(const spec of specs)model.sources.push(sources.sources.find(row=>row.id===spec.id));
const coverage=model.coverage.constructs.find(row=>row.id==='RC09');assert.ok(coverage);
coverage.declaredSources=[...new Set([...coverage.declaredSources,...specs.map(row=>row.id)])];
coverage.auditDecision='scoped_sacred_status_tradeoff';
coverage.auditRationale='RCI012 gives a general sacred-status reason and RCI029 applies it to one community-object tradeoff. The two units are authored distinctions, not empirically independent indicators.';
coverage.coverageGap='Attitude-independent status, strict inviolability, incommensurability, and other sacred objects remain unmeasured.';
const comparison=model.comparisons.find(row=>row.id==='compare-ph-sacred-value');assert.ok(comparison);
comparison.label=rule.label;comparison.scope=proposition;
comparison.sourceIds=[...new Set([...comparison.sourceIds,...specs.map(row=>row.id)])];
comparison.limitations=[...new Set([...comparison.limitations,
 'Some moral weight can be outweighed; this comparison does not establish inviolability, incommensurability, attitude-independent sacredness, or religious identity.'])];
await write(next.model,model);
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.13.0';full.modelVersion=model.modelVersion;
await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.4.0';
depth.modelVersion=model.modelVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.4.0';
depth.selectionBasis='All 64/120/243 exact item revisions and their order remain unchanged. The public sacred-status conclusion is narrower and gains claim-linked philosophical sources; no route gains an evidence opportunity.';
for(const route of depth.routes)route.routeVersion=route.id+'-2.4.0';
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.4.0';
catalog.modelVersion=model.modelVersion;await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.4.0';
localization.modelVersion=model.modelVersion;localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v15.json':locale.locale+'-draft-v15.json');
 const version='localization-'+locale.locale+(en?'-2.4.0':'-draft-15');
 bundle.bundleVersion=version;bundle.modelVersion=model.modelVersion;
 bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' The narrower sacred-status proposition requires linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.13.0';
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.frozenArtifactHashes={[pilot.contentReview.path]:await hash(pilot.contentReview.path),
 [pilot.route.instrumentManifestPath]:await hash(pilot.route.instrumentManifestPath),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[pilot.itemBank.path]:await hash(pilot.itemBank.path),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),[next.sources]:await hash(next.sources)};
pilot.limitations.push('Sacred-status weight is interpreted only in the asked tradeoff; no source validates the two authored units or their independence.');
await write(next.pilot,pilot);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.20.0';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='All 64/120/243 item revisions and order remain unchanged. Sacred status receives a narrower public interpretation, not an additional question or evidence opportunity.';
await write(next.experience,experience);
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-17.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.16.0';
await write(next.channels,channels);
const updated=await read('data/current.json');
updated.sourceRegistry={version:'source-registry-1.9.0',path:next.sources};
updated.worldviewSourceLedger={version:ledger.version,path:next.ledger};
updated.worldviewModel={version:model.modelVersion,path:next.model};
updated.fullForm={version:full.policyVersion,path:next.full};
updated.progressiveDepth={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
updated.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
updated.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,manifestPath:affinityManifest};
updated.localizationCatalog={version:localization.catalogVersion,path:next.localization,manifestPath:localizationManifest};
updated.localizationBundles=bundles;
updated.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
updated.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared the narrower sacred-status interpretation; all exact item assignments retained.');
