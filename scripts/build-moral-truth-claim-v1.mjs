// Version one exact metaethical proposition from two already administered items.
// This script creates successor artifacts; it never rewrites a historical release.
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
const old={sources:'data/sources-v1.4.json',ledger:'data/generic/source-ledger-v0.10.json',
 model:'data/generic/model-v1.6-pilot.json',full:'data/philosophy/public-pilot-v1.6.json',
 depth:'data/experience/progressive-depth-v1.7.json',pilot:'data/pilots/pilot-candidate-v1.6.json',
 catalog:'data/affinities/catalog-v1.7.json',localization:'data/localization/catalog-v8.json',
 experience:'data/experience/policy-v1.13.json',channels:'data/releases/channels-v10.json'};
const next={sources:'data/sources-v1.5.json',ledger:'data/generic/source-ledger-v0.11.json',
 model:'data/generic/model-v1.7-pilot.json',full:'data/philosophy/public-pilot-v1.7.json',
 depth:'data/experience/progressive-depth-v1.8.json',pilot:'data/pilots/pilot-candidate-v1.7.json',
 catalog:'data/affinities/catalog-v1.8.json',localization:'data/localization/catalog-v9.json',
 experience:'data/experience/policy-v1.14.json',channels:'data/releases/channels-v11.json'};
const ruleId='reviewed-ME06-literal-truth-claim',sourceId='sep-moral-truth-claim-criterion';
const proposition='Some ordinary moral wrongness statements make claims that can literally be true or false.';
const claim='Cognitivist accounts treat ordinary moral sentences as truth-apt and their acceptance as belief-like. Noncognitivist accounts question substantial truth conditions or belief expression, although sophisticated expressivists may allow deflationary truth talk. Truth-aptness alone does not establish that any moral claim is true.';
const source={id:sourceId,kind:'academic',title:'Stanford Encyclopedia of Philosophy: Moral Cognitivism vs. Non-Cognitivism',
 url:'https://plato.stanford.edu/entries/moral-cognitivism/',
 use:'Introduction and sections 1.1–1.3, 2.3, and 5: truth-aptness, belief expression, cognitivist subjectivism, and minimalist/quasi-realist limits.',
 evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',reviewedOn:'2026-09-30',
 reuse:'Conceptual basis only; neither original question is empirically validated.',claim};
const bank=await read('data/items/candidate-v0.12.json');
for(const id of ['MEI017','MEI018'])if(!bank.items.some(row=>row.id===id&&row.revision===1))
 throw Error('Required historical item revision unavailable: '+id+'@1');
const sources=await read(old.sources);sources.sources.push(source);await write(next.sources,sources);
const ledger=await read(old.ledger);ledger.version='0.11.0';ledger.sources.push({...source,
 useByRules:[ruleId],useByConstructs:['ME06'],useByItems:['MEI017','MEI018'],
 permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
 detailedUseLimit:'Supports the scoped truth-claim contrast; not moral realism, error theory, expressivist identity, or psychometric validity.'});
await write(next.ledger,ledger);
const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.7.0-pilot';model.sources.push(source);
model.commitments.push({id:ruleId,constructId:'ME06',label:proposition,facetId:'meta-status',domainId:'ME',
 layer:'metaethical',tier:'diagnostic',sourceIds:[sourceId],
 sourceClaims:[{sourceId,relationship:'supports',claim}],
 evidence:[{itemId:'MEI017',itemRevision:1,unitId:'MEI017',support:[1,2],oppose:[-2,-1]},
  {itemId:'MEI018',itemRevision:1,unitId:'MEI018',support:['truth_claim'],oppose:['prescription']}],
 boundary:'A truth-apt moral claim need not be true. An error theorist or cognitivist relativist can affirm truth-aptness. The attitude and mixed answers do not reject literal truth claims; hybrid and quasi-realist views can combine expressive and truth-talk features.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',
 thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',
 hypothesizedConstructId:'ME06',affinityCriterion:false,researchVariable:false,
 neighbors:['Moral realism','Moral error theory','Cognitivist relativism','Expressivism','Quasi-realism'],
 nonEntailments:['Any moral claim is actually true','Stance-independent moral facts','Moral realism',
  'Moral error theory','A complete account of moral judgment as belief','Psychometrically validated metaethical type'],
 falsePositives:['A cognitivist error theorist treats moral claims as truth-apt while denying that substantive moral claims are true.',
  'A cognitivist subjectivist can treat approval-dependent moral claims as truth-apt.',
  'A sophisticated expressivist may use deflationary truth language without accepting robust cognitivist semantics.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
  singleDirectionalUnit:'leaned_toward'}});
model.publicRuleIds.push(ruleId);
const coverage=model.coverage.constructs.find(row=>row.id==='ME06');
if(!coverage)throw Error('ME06 coverage record unavailable.');
coverage.ruleIds.push(ruleId);coverage.declaredSources.push(sourceId);
coverage.auditDecision='existing_items_support_scoped_truth_claim_only';
coverage.auditRationale='MEI017 asks literal truth-aptness; MEI018 contrasts a literal truth claim with prescription. Attitude and mixed alternatives remain nondirectional.';
coverage.disposition='directly_interpretable';coverage.coverageGap='Actual moral truth, belief-state semantics, and specific noncognitivist theories remain unmeasured.';
await write(next.model,model);

const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.7.0';full.modelVersion=model.modelVersion;
full.bundles.push({id:ruleId+':full-route',commitmentId:ruleId,domainId:'ME',
 itemIds:['MEI017','MEI018'],itemRevisions:[1,1],evidenceUnits:['MEI017','MEI018']});
const facet=full.facets.find(row=>row.id==='meta-status');facet.ruleIds.push(ruleId);
facet.bundleIds.push(ruleId+':full-route');await write(next.full,full);

const depth=await read(old.depth);depth.policyVersion='progressive-depth-1.8.0';
depth.modelVersion=model.modelVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-1.8.0';
depth.selectionBasis='All 64/120/243 exact item revisions and order remain unchanged. Full can now interpret a narrow moral truth-claim proposition from MEI017@1 and MEI018@1; shorter routes leave it not measured.';
for(const route of depth.routes){route.routeVersion=route.id+'-1.8.0';
 if(route.id==='full')route.assessableDirectRuleIds.push(ruleId);}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v1.8.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});

const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-1.8.0';
catalog.modelVersion=model.modelVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.8.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.8.0';
localization.modelVersion=model.modelVersion;localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v9.json':locale.locale+'-draft-v9.json');
 const version='localization-'+locale.locale+(en?'-1.8.0':'-draft-9');
 bundle.bundleVersion=version;bundle.modelVersion=model.modelVersion;
 bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' The scoped moral truth-claim proposition needs linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.8.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.7.0';
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds.push(ruleId);
pilot.interpretationRules.routeMeasuredDirectRuleIds.push(ruleId);
pilot.frozenArtifactHashes={[pilot.contentReview.path]:await hash(pilot.contentReview.path),
 [pilot.route.instrumentManifestPath]:await hash(pilot.route.instrumentManifestPath),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[pilot.itemBank.path]:await hash(pilot.itemBank.path),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),[next.sources]:await hash(next.sources)};
pilot.limitations.push('Literal moral truth-claim answers do not establish that any moral claim is true or identify a metaethical school.');
await write(next.pilot,pilot);

const experience=await read(old.experience);experience.experienceVersion='quiz-1.14.0';
experience.formPolicies.push({version:full.policyVersion,path:next.full},
 {version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.8.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The authored 64/120/243 item sets are unchanged. Full can now assess a narrow literal moral truth-claim proposition; Quick and Standard leave it not measured.';
await write(next.experience,experience);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-11.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.10.0';
await write(next.channels,channels);
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');
current.sourceRegistry={version:'source-registry-1.5.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.8.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v1.8.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v1.8.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',current);
console.log('Prepared scoped moral truth-claim rule from existing MEI017@1 and MEI018@1; exact route items unchanged.');
