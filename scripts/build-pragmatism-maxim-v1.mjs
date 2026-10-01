// Publish an exact, source-linked pragmatic-method proposition with a direct
// discriminator. Historical items, routes, rules, and catalogs stay immutable.
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
const old={bank:'data/items/candidate-v0.15.json',ledger:'data/generic/source-ledger-v0.15.json',
 model:'data/generic/model-v1.11-pilot.json',full:'data/philosophy/public-pilot-v1.11.json',
 depth:'data/experience/progressive-depth-v2.2.json',pilot:'data/pilots/pilot-candidate-v1.11.json',
 review:'data/pilots/content-review-v1.6.json',catalog:'data/affinities/catalog-v2.2.json',
 localization:'data/localization/catalog-v13.json',experience:'data/experience/policy-v1.18.json',
 channels:'data/releases/channels-v15.json'};
const next={bank:'data/items/candidate-v0.16.json',ledger:'data/generic/source-ledger-v0.16.json',
 model:'data/generic/model-v1.12-pilot.json',full:'data/philosophy/public-pilot-v1.12.json',
 depth:'data/experience/progressive-depth-v2.3.json',pilot:'data/pilots/pilot-candidate-v1.12.json',
 review:'data/pilots/content-review-v1.7.json',catalog:'data/affinities/catalog-v2.3.json',
 localization:'data/localization/catalog-v14.json',experience:'data/experience/policy-v1.19.json',
 channels:'data/releases/channels-v16.json',research:'data/instruments/research-pool-0.16.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.7.json',
 runtimePilot:'data/pilots/pilot-0.9.json',academic:'data/academic/release-v0.16.json'};
const depthManifest='data/experience/progressive-depth-v2.3.manifest.json';
const affinityManifest='data/affinities/manifest-v2.3.json';
const localizationManifest='data/localization/manifest-v2.3.json';
const localizedFiles=['data/localization/ar-draft-v14.json','data/localization/en-US-v14.json',
 'data/localization/es-ES-draft-v14.json'];
const newPaths=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,...localizedFiles];
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 assert.equal(current.worldviewModel?.path,next.model);
 assert.equal(current.fullForm?.path,next.full);
 for(const file of newPaths)await access(path.join(root,file));
 console.log('Pragmatic-maxim successor artifacts already exist and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.14.0');
const currentKeys={bank:'candidateBank',ledger:'worldviewSourceLedger',model:'worldviewModel',
 full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',review:'contentReview',
 catalog:'affinityCatalog',localization:'localizationCatalog',experience:'quizExperience',
 channels:'releaseChannels'};
for(const [key,file] of Object.entries(old))assert.equal(current[currentKeys[key]]?.path,file);
for(const file of newPaths){try{await access(path.join(root,file));throw Error('Successor artifact already exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}

const proposition='Disputed ideas should be clarified through their conceivable effects on experience or conduct; if two formulations have no conceivable difference in those effects, their apparent conceptual difference is not substantive.';
const doctrine=proposition;
const sourceClaim='Peirce and James used a pragmatic method to clarify concepts by their conceivable experiential or practical bearings and to expose apparently empty disputes; their views of truth and realism still differ.';
const item={id:'EPI123',revision:1,domainId:'EP',
 text:'Two explanations use different words, but no conceivable experience or action would differ if either were correct. After clarifying the words, which is closest to your view of their remaining disagreement?',
 responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'contrast',
 targets:[{constructId:'EP16',relation:'diagnostic',role:'primary'}],
 options:[
  {id:'no_substantive_difference',label:'There is no remaining substantive difference in what the explanations claim.'},
  {id:'difference_remains',label:'They may still make substantively different claims, even with no possible difference in experience or action.'},
  {id:'reason_to_question_only',label:'The shared consequences are a reason to doubt the disagreement, but do not settle whether the claims differ.'}
 ],
 mirrorGroup:null,scenarioGroup:'pragmatic-maxim-empty-dispute',eligibility:{mode:'always'},
 specialStates:['no_view','not_understood'],
 contentTags:['academic_contrast','ep16','pragmatic_method_discriminator'],
 provenance:{origin:'original_project_draft',sourceRefs:['acad-pragmatism'],
  license:{status:'undecided',spdx:null},copiedText:false},
 notes:'Original question about whether an apparently empty conceptual dispute remains substantive. The third option distinguishes treating consequences as useful from treating their absence as settling this specific conceptual dispute. It does not ask whether either explanation is true or identify a respondent as a pragmatist. Comprehension and independence from EPI103 are untested.'};

const bank=await read(old.bank);assert.equal(bank.bankVersion,'0.15.0');
assert.equal(bank.items.length,569);assert.ok(!bank.items.some(row=>row.id===item.id));
bank.bankVersion='0.16.0';bank.items.push(item);await write(next.bank,bank);
const ledger=await read(old.ledger);assert.equal(ledger.version,'0.15.0');
const source=ledger.sources.find(row=>row.id==='acad-pragmatism');assert.ok(source);
source.useByItems.push(item.id);source.claim=sourceClaim;
source.locator='Sections 2, especially 2.1 and 2.2 (the pragmatic maxim and apparently empty disputes)';
source.detailedUseLimit='Supports the philosophical method and its neighbors, not the wording, response process, independence, or threshold of EPI103 and EPI123.';
ledger.version='0.16.0';await write(next.ledger,ledger);

const model=await read(old.model);assert.equal(model.modelVersion,'generic-1.11.0-pilot');
model.parentModelVersion=model.modelVersion;model.modelVersion='generic-1.12.0-pilot';
model.bankVersion=bank.bankVersion;model.pilotInstrumentVersion='worldview-pilot-1.7.0';
const rule=model.commitments.find(row=>row.id==='construct-EP16');
assert.deepEqual(rule.evidence.map(row=>row.itemId),['EPI103','EPI104','EPI105']);
rule.label='Pragmatic method for conceptual disputes';rule.scope=proposition;rule.proposition=proposition;
rule.boundary='The rule requires both endorsement of clarifying a disputed idea by conceivable experience or conduct and rejection of a substantive conceptual difference where no such difference is conceivable. Treating consequences as merely helpful, fallibilism, empirical testing, and disagreement with an absolute reverse item do not establish the conjunction.';
rule.mappingStatus='source_reviewed_authored_rule_not_calibrated';
rule.interpretationKind='direct_interpretable_proposition';rule.inferenceStatus='direct';
rule.hypothesizedConstructId='EP16';rule.affinityCriterion=false;rule.researchVariable=false;
rule.sourceClaims=[{sourceId:'acad-pragmatism',relationship:'supports',claim:sourceClaim}];
rule.neighbors=['Generic fallibilism','Scientific empiricism','Consequences as one useful clarification technique',
 'Logical verificationism','Metaphysical realism with no conceivable practical difference'];
rule.nonEntailments=['A belief is true because it is useful','All meaningful language is exhaustively reducible to observation',
 'Pragmatism as a complete worldview','Rejection of mind-independent reality','Atheism or any political position'];
rule.falsePositives=['EPI104 agreement only questions the substance of a dispute; it does not settle the stronger method.',
 'EPI105 disagreement rejects an absolute reverse claim and can come from non-pragmatists.',
 'EPI123 reason_to_question_only treats consequences as a clue rather than settling the conceptual dispute.',
 'EPI103 agreement alone can express a useful technique without accepting the empty-dispute consequence.',
 'Fallibilism and scientific testing do not entail the pragmatic maxim.'];
rule.missingEvidenceBehavior={notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
 singleDirectionalUnit:'leaned_toward'};
rule.evidence=[
 {itemId:'EPI103',itemRevision:1,unitId:'EPI103',support:[1,2],oppose:[-2,-1]},
 {itemId:'EPI123',itemRevision:1,unitId:'EPI123',support:['no_substantive_difference'],
  oppose:['difference_remains','reason_to_question_only']}
];
const coverage=model.coverage.constructs.find(row=>row.id==='EP16');assert.ok(coverage);
coverage.candidateItemIds.push(item.id);
coverage.auditDecision='versioned_pragmatic_maxim_method_rule';
coverage.auditRationale='EPI103 asks for the positive clarification method; EPI123 distinguishes an empty conceptual dispute from merely finding consequences useful. EPI104 is too tentative and EPI105 has an absolute reverse false positive.';
coverage.coverageGap='The rule assesses a scoped method, not a theory of truth, the entire pragmatist tradition, or exclusive philosophical identity.';
model.coverage.version='0.16.0';
for(const comparison of model.comparisons.filter(row=>row.id==='compare-construct-EP16'||row.id==='pragmatism')){
 comparison.scope=proposition;
 comparison.limitations=[...new Set([...(comparison.limitations??[]),
  'The pragmatic method does not by itself establish a pragmatist theory of truth or a complete philosophical identity.'])];}

const full=await read(old.full);assert.equal(full.policyVersion,'philosophy-pilot-1.11.0');
full.parentPolicyVersion=full.policyVersion;full.policyVersion='philosophy-pilot-1.12.0';
full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;
full.instrumentVersion=model.pilotInstrumentVersion;
const swap=(prior,successor)=>{const position=full.frozenItems.findIndex(row=>row.itemId===prior&&row.itemRevision===1);
 assert.ok(position>=0&&!full.frozenItems.some(row=>row.itemId===successor));
 full.frozenItems[position]={itemId:successor,itemRevision:1};};
swap('EPI105','EPI103');swap('EPI104','EPI123');
assert.equal(full.frozenItems.length,243);
model.pilotRouteItemRefs=structuredClone(full.frozenItems);
const oldBundles=full.bundles.filter(row=>row.commitmentId==='construct-EP16');
assert.equal(oldBundles.length,2);
oldBundles[0].itemIds=['EPI103','EPI123'];oldBundles[0].itemRevisions=[1,1];
oldBundles[0].evidenceUnits=['EPI103','EPI123'];
full.bundles=full.bundles.filter(row=>row.id!==oldBundles[1].id);
await write(next.model,model);await write(next.full,full);

const depth=await read(old.depth);assert.equal(depth.policyVersion,'progressive-depth-2.2.0');
depth.policyVersion='progressive-depth-2.3.0';depth.bankVersion=bank.bankVersion;
depth.modelVersion=model.modelVersion;depth.instrumentVersion=model.pilotInstrumentVersion;
depth.pilotFormPolicyVersion=full.policyVersion;depth.affinityCatalogVersion='philosophical-affinity-2.3.0';
depth.selectionBasis='The authored 64/120/243 routes retain their lengths. Full replaces EPI104 and ambiguous reverse EPI105 with direct method item EPI103 and a new empty-dispute discriminator EPI123. Quick and Standard remain unchanged in content and do not assess EP16.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.3.0';
 if(route.id==='full')route.itemRefs=structuredClone(full.frozenItems);
 else assert.ok(!route.itemRefs.some(ref=>['EPI103','EPI104','EPI105','EPI123'].includes(ref.itemId)));}
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});

const research=await read('data/instruments/research-pool-0.15.json');
research.instrumentVersion='0.16.0-research';research.bankVersion=bank.bankVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.8.json');
runtimePilot.pilotId='pilot-0.9';runtimePilot.bankVersion=bank.bankVersion;
runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.16 research pool includes EPI123@1; Full replaces EPI104@1 and EPI105@1 in a separately versioned public release.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.6.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.bankVersion=bank.bankVersion;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));
await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.7.0';
review.sourceFormPolicyVersion=full.policyVersion;
review.decisions.push({sourcePosition:review.decisions.length+1,itemId:'EPI103',itemRevision:1,
 domainId:'EP',targetConstructIds:['EP16'],mappedRuleIds:['construct-EP16'],
 nearbyRouteItemIds:['EPI104','EPI105','EPI123'],responseMethod:'likert',
 contribution:'positive_pragmatic_clarification_method',decision:'retain_for_pilot',issue:null,
 rationale:'Existing direct positive-method item replaces the absolute reverse wording. It cannot alone establish the stronger empty-dispute implication and therefore requires EPI123 for a supported conclusion.',
 resultUse:'only_through_explicit_interpretation_rules'});
review.decisions.push({sourcePosition:review.decisions.length+1,itemId:item.id,itemRevision:1,
 domainId:'EP',targetConstructIds:['EP16'],mappedRuleIds:['construct-EP16'],
 nearbyRouteItemIds:['EPI103','EPI104','EPI105','EPI106'],
 responseMethod:item.responseType,contribution:'empty_dispute_method_discriminator',
 decision:'retain_for_pilot',issue:null,
 rationale:'Separates the strong empty-dispute implication of the pragmatic method from treating practical consequences as one useful clue. Alongside EPI103 it tests two authored facets without counting EPI104 and EPI105 as corroboration.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);

const catalog=await read(old.catalog);assert.equal(catalog.catalogVersion,'philosophical-affinity-2.2.0');
catalog.catalogVersion='philosophical-affinity-2.3.0';catalog.modelVersion=model.modelVersion;
catalog.instrumentVersion=model.pilotInstrumentVersion;
const pragmatism=catalog.traditions.find(row=>row.id==='pragmatism');assert.ok(pragmatism);
pragmatism.sourceClaims=[{sourceId:'sep-pragmatism',relationship:'supports',claim:sourceClaim}];
const criterion=pragmatism.commitments.find(row=>row.id==='pragmatic-maxim');assert.ok(criterion);
criterion.doctrine=doctrine;criterion.sourceClaims=[{sourceId:'sep-pragmatism',relationship:'supports',claim:sourceClaim}];
criterion.mapping.note='Directly assesses this scoped pragmatic clarification method through EPI103@1 and EPI123@1. It does not determine a theory of truth or identity with the tradition.';
pragmatism.neighbors.push('logical verificationism');
pragmatism.discriminators.push('Treating practical consequences as one helpful clue does not settle the empty-dispute criterion.');
pragmatism.nonEntailments.push('Agreement with this method does not establish the whole pragmatist tradition.');
await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.3.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundlesLocalized=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v14.json':locale.locale+'-draft-v14.json');
 const version='localization-'+locale.locale+(en?'-2.3.0':'-draft-14');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' EPI123@1 and the revised pragmatic-method proposition require linguistic and philosophical review before any public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundlesLocalized.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundlesLocalized.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.12.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.route.instrumentVersion=model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath=next.pilotInstrument;
pilot.route.exactItemRevisions=structuredClone(full.frozenItems);
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),
 [next.pilotInstrument]:await hash(next.pilotInstrument),[next.model]:await hash(next.model),
 [next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),
 [current.sourceRegistry.path]:await hash(current.sourceRegistry.path)};
pilot.limitations.push('EP16 now uses a positive clarification item and a separate empty-dispute discriminator. Authored independence and respondent comprehension remain untested.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.15.json');academic.version='0.16.0';
academic.baseBankVersion='0.15.0';academic.reviewedOn='2026-10-01';
academic.itemCount=bank.items.length;academic.newItemCount=1;academic.newConstructCount=0;
academic.note='Adds one original pragmatic-method discriminator and substitutes it with EPI103 for two weaker Full-route items. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.19.0';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick, Standard, and Full remain 64/120/243 items. Full substitutes EPI103 and EPI123 for EPI105 and EPI104 and can assess the scoped pragmatic-maxim method. Shorter routes do not ask the required pair.';
await write(next.experience,experience);
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-16.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.15.0';
await write(next.channels,channels);

const updated=await read('data/current.json');
updated.candidateBank={version:bank.bankVersion,path:next.bank};
updated.instrument={version:research.instrumentVersion,path:next.research};
updated.pilot={version:runtimePilot.pilotId,path:next.runtimePilot};
updated.academicRelease={version:academic.version,path:next.academic};
updated.worldviewSourceLedger={version:ledger.version,path:next.ledger};
updated.worldviewModel={version:model.modelVersion,path:next.model};
updated.fullForm={version:full.policyVersion,path:next.full};
updated.progressiveDepth={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
updated.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
updated.contentReview={version:review.reviewVersion,path:next.review};
updated.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,manifestPath:affinityManifest};
updated.localizationCatalog={version:localization.catalogVersion,path:next.localization,manifestPath:localizationManifest};
updated.localizationBundles=bundlesLocalized;
updated.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
updated.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared EPI123 and the scoped pragmatic-method release; 64/120/243 route lengths retained.');
