// Publish a narrower free-will conditional with an applied discriminator.
// Every predecessor artifact stays immutable for historical replay.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const old={bank:'data/items/candidate-v0.12.json',sources:'data/sources-v1.6.json',
 ledger:'data/generic/source-ledger-v0.12.json',model:'data/generic/model-v1.8-pilot.json',
 full:'data/philosophy/public-pilot-v1.8.json',depth:'data/experience/progressive-depth-v1.9.json',
 pilot:'data/pilots/pilot-candidate-v1.8.json',review:'data/pilots/content-review-v1.3.json',
 catalog:'data/affinities/catalog-v1.9.json',localization:'data/localization/catalog-v10.json',
 experience:'data/experience/policy-v1.15.json',channels:'data/releases/channels-v12.json'};
const next={bank:'data/items/candidate-v0.13.json',sources:'data/sources-v1.7.json',
 ledger:'data/generic/source-ledger-v0.13.json',model:'data/generic/model-v1.9-pilot.json',
 full:'data/philosophy/public-pilot-v1.9.json',depth:'data/experience/progressive-depth-v2.json',
 pilot:'data/pilots/pilot-candidate-v1.9.json',review:'data/pilots/content-review-v1.4.json',
 catalog:'data/affinities/catalog-v2.json',localization:'data/localization/catalog-v11.json',
 experience:'data/experience/policy-v1.16.json',channels:'data/releases/channels-v13.json',
 research:'data/instruments/research-pool-0.13.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.4.json',
 runtimePilot:'data/pilots/pilot-0.6.json',academic:'data/academic/release-v0.13.json'};
const proposition='If a choice is fixed by the complete prior state of the world and the laws of nature, it cannot be genuinely free.';
const sources=[
 {id:'sep-incompatibilism-condition',kind:'academic',
  title:'Stanford Encyclopedia of Philosophy: Arguments for Incompatibilism',
  url:'https://plato.stanford.edu/entries/incompatibilism-arguments/',
  use:'Introduction and section 1 distinguish the free-will compatibility conditional from actual determinism, moral responsibility, fatalism, and mere causation.',
  claim:'The free-will incompatibilist denies that a choice fixed by the complete prior state and laws can be free; this conditional does not assert that determinism is actually true or settle moral responsibility.'},
 {id:'sep-compatibilism-boundaries',kind:'academic',
  title:'Stanford Encyclopedia of Philosophy: Compatibilism',
  url:'https://plato.stanford.edu/entries/compatibilism/',
  use:'The distinct alternative-possibilities and sourcehood discussions delimit the conditional and reasons-based compatibilist alternatives.',
  claim:'Compatibilist theories can allow free choice under determinism, while the alternatives-possibilities and sourcehood debates do not collapse into a single necessary condition.'}
];
const record=s=>({...s,evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',
 reviewedOn:'2026-09-30',reuse:'Conceptual basis only; neither original question nor its evidence threshold is empirically validated.',
 validatesThisQuiz:false});
const item={id:'AHI108',revision:1,domainId:'AH',
 text:'Suppose someone weighs their reasons and chooses without pressure. The complete earlier state of the world and the laws of nature still fix that choice. Which view is closest to yours?',
 responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'contrast',
 targets:[{constructId:'AH14',relation:'diagnostic',role:'primary'}],
 options:[
  {id:'determination_rules_out_freedom',label:'The choice cannot be genuinely free because it was fixed in that way.'},
  {id:'determination_can_allow_freedom',label:'The choice could still be genuinely free despite being fixed in that way.'},
  {id:'other_conditions_matter',label:'Those facts alone do not settle whether this choice is genuinely free.'}
 ],mirrorGroup:null,scenarioGroup:'free-will-compatibility-case',eligibility:{mode:'always'},
 specialStates:['no_view','not_understood'],contentTags:['academic_contrast','ah14','conditional_compatibility'],
 provenance:{origin:'original_project_draft',sourceRefs:sources.map(s=>s.id),
  license:{status:'undecided',spdx:null},copiedText:false},
 notes:'Applied countercase for the free-will/determinism conditional. The third answer is nondirectional. No answer asserts that determinism is true, that people have free will, or that moral responsibility follows. Authored content; response processes and independence from AHI103 are untested.'};
const bank=await read(old.bank);
assert.equal(bank.items.length,566);
assert.ok(!bank.items.some(row=>row.id===item.id));
bank.bankVersion='0.13.0';bank.items.push(item);await write(next.bank,bank);
const sourceRegistry=await read(old.sources),ledger=await read(old.ledger);
ledger.version='0.13.0';
for(const s of sources){
 sourceRegistry.sources.push(record(s));
 ledger.sources.push({...record(s),useByRules:['construct-AH14'],useByConstructs:['AH14'],
  useByItems:['AHI103','AHI105','AHI108'],permissionToCopyItems:false,validatesOurItems:false,
  sourceRole:'signed_scholarly_synthesis',
  detailedUseLimit:'Supports only the named free-will compatibility distinction. It does not establish independence, item validity, actual determinism, or a responsibility theory.'});
}
await write(next.sources,sourceRegistry);await write(next.ledger,ledger);
const model=await read(old.model),rule=model.commitments.find(row=>row.id==='construct-AH14');
assert.ok(rule&&rule.evidence.map(e=>e.itemId).join(',')==='AHI103,AHI104,AHI105');
model.parentModelVersion=model.modelVersion;model.modelVersion='generic-1.9.0-pilot';
model.bankVersion=bank.bankVersion;model.pilotInstrumentVersion='worldview-pilot-1.4.0';
model.sources.push(...sources.map(record));
rule.scope=proposition;rule.proposition=proposition;rule.label='Determinism excludes free choice';
rule.sourceIds.push(...sources.map(s=>s.id));
rule.sourceClaims=sources.map(s=>({sourceId:s.id,relationship:'supports',claim:s.claim}));
rule.boundary='A conditional about determined choices and freedom, not a belief that determinism is true, that free will exists, or that moral responsibility requires free will. AHI104 tests necessary alternatives and is excluded from this broad rule. Disagreement with the reasons-and-capacities sufficient condition in AHI105 is nondirectional.';
rule.evidence=[
 {itemId:'AHI103',itemRevision:1,unitId:'AHI103',support:[1,2],oppose:[-2,-1]},
 {itemId:'AHI105',itemRevision:1,unitId:'AHI105',support:[],oppose:[1,2]},
 {itemId:'AHI108',itemRevision:1,unitId:'AHI108',support:['determination_rules_out_freedom'],
  oppose:['determination_can_allow_freedom']}
];
rule.mappingStatus='source_reviewed_authored_rule_not_calibrated';
rule.interpretationKind='direct_interpretable_proposition';rule.inferenceStatus='direct';
rule.hypothesizedConstructId='AH14';rule.affinityCriterion=false;rule.researchVariable=false;
rule.neighbors=['Compatibilism about free will','Alternative-possibilities incompatibilism',
 'Source incompatibilism','Belief that determinism is true','Moral-responsibility incompatibilism'];
rule.nonEntailments=['Determinism is actually true','The respondent has or lacks free will',
 'The respondent endorses libertarian agency','Moral responsibility is impossible','Uncaused randomness produces freedom'];
rule.falsePositives=['Rejecting one reasons-and-capacities sufficient condition does not establish that every determined choice is unfree.',
 'Requiring alternative possibilities is a narrower route to incompatibilism; two near-paraphrases cannot count as independent authored support.',
 'A belief about whether determinism is true does not answer the conditional compatibility question.'];
rule.missingEvidenceBehavior={notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
 singleDirectionalUnit:'leaned_toward'};
const coverage=model.coverage.constructs.find(row=>row.id==='AH14');
coverage.candidateItemIds.push('AHI108');coverage.declaredSources.push(...sources.map(s=>s.id));
coverage.auditDecision='versioned_conditional_rule_with_applied_countercase';
coverage.auditRationale='AHI104 is a near-parallel necessary-alternatives claim. AHI108 asks the compatibility question under favorable deliberation conditions; AHI105 agreement can oppose, but disagreement is nondirectional.';
model.coverage.version='0.13.0';
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.9.0';full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;
full.instrumentVersion=model.pilotInstrumentVersion;
const swap=refs=>{const pos=refs.findIndex(ref=>ref.itemId==='AHI104'&&ref.itemRevision===1);
 assert.ok(pos>=0&&!refs.some(ref=>ref.itemId==='AHI108'));
 refs[pos]={itemId:'AHI108',itemRevision:1};};
swap(full.frozenItems);model.pilotRouteItemRefs=structuredClone(full.frozenItems);
full.bundles=full.bundles.filter(row=>row.commitmentId!=='construct-AH14');
full.bundles.push({id:'construct-AH14:current',commitmentId:'construct-AH14',domainId:'AH',
 itemIds:['AHI103','AHI108'],itemRevisions:[1,1],evidenceUnits:['AHI103','AHI108']});
for(const facet of full.facets)facet.bundleIds=facet.bundleIds.filter(id=>!id.startsWith('construct-AH14:'));
full.facets.find(row=>row.ruleIds.includes('construct-AH14')).bundleIds.push('construct-AH14:current');
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.0.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.0.0';
depth.selectionBasis='The 64/120/243 authored routes replace AHI104@1 with AHI108@1. Historical routes remain pinned. The applied choice separates the broad compatibility conditional from an alternative-possibilities requirement.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.0.0';
 if(route.id==='full')route.itemRefs=structuredClone(full.frozenItems);else swap(route.itemRefs);}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v2.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});
const research=await read('data/instruments/research-pool-0.12.json');
research.instrumentVersion='0.13.0-research';research.bankVersion=bank.bankVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.5.json');runtimePilot.pilotId='pilot-0.6';
runtimePilot.bankVersion=bank.bankVersion;runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.13 research pool includes AHI108@1; the public routes replace AHI104@1 in a separate versioned release.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.3.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.bankVersion=bank.bankVersion;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));
await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.4.0';
review.sourceFormPolicyVersion=full.policyVersion;
review.decisions.push({sourcePosition:review.decisions.length+1,itemId:'AHI108',itemRevision:1,
 domainId:'AH',targetConstructIds:['AH14'],mappedRuleIds:['construct-AH14'],
 nearbyRouteItemIds:['AHI103','AHI104','AHI105'],responseMethod:'single_choice',
 contribution:'applied_countercase',decision:'retain_for_pilot',issue:null,
 rationale:'Tests whether determination alone rules out freedom even when a person deliberates without pressure. AHI104 repeats a narrower alternatives requirement; AHI105 disagreement is nondirectional.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.0.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v2.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.0.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v11.json':locale.locale+'-draft-v11.json');
 const version='localization-'+locale.locale+(en?'-2.0.0':'-draft-11');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' AHI108@1 and the revised free-will proposition require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v2.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.9.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.route.instrumentVersion=model.pilotInstrumentVersion;pilot.route.instrumentManifestPath=next.pilotInstrument;
pilot.route.exactItemRevisions=structuredClone(full.frozenItems);
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.pilotInstrument]:await hash(next.pilotInstrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),
 [next.sources]:await hash(next.sources)};
pilot.limitations.push('AH14 now uses a direct applied compatibility choice; the two authored units are not empirically independent or calibrated.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.12.json');academic.version='0.13.0';
academic.baseBankVersion='0.12.0';academic.reviewedOn='2026-09-30';academic.itemCount=bank.items.length;
academic.newItemCount=1;academic.newConstructCount=0;
academic.note='One applied free-will compatibility discriminator; versioned route substitution and a narrower evidence rule. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.16.0';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v2.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The authored 64/120/243 route lengths stay fixed. Each route substitutes an applied free-will compatibility discriminator for a near-parallel alternative-possibilities item.';
await write(next.experience,experience);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-13.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.12.0';
await write(next.channels,channels);
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');
current.candidateBank={version:bank.bankVersion,path:next.bank};
current.instrument={version:research.instrumentVersion,path:next.research};
current.pilot={version:runtimePilot.pilotId,path:next.runtimePilot};
current.academicRelease={version:academic.version,path:next.academic};
current.sourceRegistry={version:'source-registry-1.7.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v2.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.contentReview={version:review.reviewVersion,path:next.review};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v2.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v2.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',current);
console.log('Prepared AHI108@1 and a versioned free-will condition rule on 64/120/243 routes.');
