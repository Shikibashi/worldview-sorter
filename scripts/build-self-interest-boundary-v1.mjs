// Publish a narrower normative self-interest rule using an existing draft discriminator.
// Historical bank, route, model, and affinity artifacts remain immutable.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{
 await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const old={bank:'data/items/candidate-v0.14.json',sources:'data/sources-v1.8.json',
 ledger:'data/generic/source-ledger-v0.14.json',model:'data/generic/model-v1.10-pilot.json',
 full:'data/philosophy/public-pilot-v1.10.json',depth:'data/experience/progressive-depth-v2.1.json',
 pilot:'data/pilots/pilot-candidate-v1.10.json',review:'data/pilots/content-review-v1.5.json',
 catalog:'data/affinities/catalog-v2.1.json',localization:'data/localization/catalog-v12.json',
 experience:'data/experience/policy-v1.17.json',channels:'data/releases/channels-v14.json'};
const next={bank:'data/items/candidate-v0.15.json',ledger:'data/generic/source-ledger-v0.15.json',
 model:'data/generic/model-v1.11-pilot.json',full:'data/philosophy/public-pilot-v1.11.json',
 depth:'data/experience/progressive-depth-v2.2.json',
 pilot:'data/pilots/pilot-candidate-v1.11.json',review:'data/pilots/content-review-v1.6.json',
 catalog:'data/affinities/catalog-v2.2.json',localization:'data/localization/catalog-v13.json',
 experience:'data/experience/policy-v1.18.json',channels:'data/releases/channels-v15.json',
 research:'data/instruments/research-pool-0.15.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.6.json',
 runtimePilot:'data/pilots/pilot-0.8.json',academic:'data/academic/release-v0.15.json'};
const depthManifest='data/experience/progressive-depth-v2.2.manifest.json';
const affinityManifest='data/affinities/manifest-v2.2.json';
const localizationManifest='data/localization/manifest-v2.2.json';
const releaseManifest='data/releases/model-release-v1.14.0.json';
const localizedFiles=['data/localization/ar-draft-v13.json',
 'data/localization/en-US-v13.json','data/localization/es-ES-draft-v13.json'];
const newPaths=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,
 ...localizedFiles,releaseManifest];
assert.equal(new Set(newPaths).size,newPaths.length,'Successor paths must be unique.');
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 // A complete repeat invocation is a verified no-op; a partial generation is refused below.
 assert.equal(current.worldviewModel?.path,next.model);
 assert.equal(current.fullForm?.path,next.full);
 assert.equal(current.progressiveDepth?.path,next.depth);
 assert.equal(current.affinityCatalog?.path,next.catalog);
 assert.equal(current.localizationCatalog?.path,next.localization);
 assert.ok(['model-release-1.13.0','model-release-1.14.0'].includes(current.modelRelease?.version));
 for(const file of newPaths.filter(file=>file!==releaseManifest))await access(path.join(root,file));
 const alreadyBank=await read(next.bank),alreadyDepth=await read(next.depth);
 assert.equal(alreadyBank.bankVersion,'0.15.0');
 assert.equal(alreadyBank.items.filter(row=>row.id==='NEI121'&&row.revision===1).length,1);
 assert.deepEqual(alreadyDepth.routes.map(route=>route.itemRefs.length),[64,120,243]);
 console.log('Self-interest boundary successor already generated; verified current pointers and artifacts.');
 process.exit(0);
}
assert.equal(current.modelRelease?.version,'model-release-1.13.0');
assert.equal(current.modelRelease?.path,'data/releases/model-release-v1.13.0.json');
const currentKeys={bank:'candidateBank',sources:'sourceRegistry',ledger:'worldviewSourceLedger',
 model:'worldviewModel',full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',
 review:'contentReview',catalog:'affinityCatalog',localization:'localizationCatalog',
 experience:'quizExperience',channels:'releaseChannels'};
for(const [key,file] of Object.entries(old))
 assert.equal(current[currentKeys[key]]?.path,file,'Active predecessor changed for '+key);
for(const file of newPaths){
 try{await access(path.join(root,file));throw Error('Successor artifact already exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}
}
const draft=await read('data/items/self-interest-draft-v1.json');
assert.equal(draft.items.length,1,'The approved draft set changed.');
const item=structuredClone(draft.items[0]);
assert.equal(item.id,'NEI121');assert.equal(item.revision,1);
assert.deepEqual(item.options.map(option=>option.id),
 ['independent_duty','independent_reason','own_good_only','undecided']);
item.options[3]={id:'context_matters',
 label:'The moral weight depends on further features of the situation.'};
item.contentTags=item.contentTags.filter(tag=>tag!=='unreleased_review_candidate');
item.contentTags.push('released_self_interest_discriminator');
item.notes='Authored contrast between an independent duty, a non-obligatory independent moral reason, and a reason arising only through the agent’s long-term good. Philosophical content reviewed for a narrow conjunction; respondent comprehension, localization, and empirical independence remain untested. No answer alone establishes the standard maximizing account of ethical egoism, a refusal to help, or Rand’s complete ethics.';
const proposition='Each person morally ought to make their own long-term good the ultimate end of their actions; another person’s need alone supplies no independent moral reason.';

const bank=await read(old.bank);
assert.equal(bank.bankVersion,'0.14.0');assert.equal(bank.items.length,568);
assert.ok(!bank.items.some(row=>row.id===item.id),'NEI121 must not already be in the bank.');
bank.bankVersion='0.15.0';bank.items.push(structuredClone(item));await write(next.bank,bank);

const ledger=await read(old.ledger);assert.equal(ledger.version,'0.14.0');
const egoismSource=ledger.sources.find(source=>source.id==='acad-egoism');
assert.ok(egoismSource&&egoismSource.useByItems.includes('NEI100'));
assert.ok(!egoismSource.useByItems.includes(item.id));
egoismSource.useByItems.push(item.id);
egoismSource.claim='Ethical egoism is a normative claim about each agent’s own good as the ultimate end. It differs from psychological egoism, rational egoism, ordinary self-regard, and permission for personal projects; helping others can be chosen for self-interested reasons.';
egoismSource.locator='Sections 1–3 (psychological, ethical, and rational egoism)';
egoismSource.detailedUseLimit='Supports the philosophical distinctions and the possible compatibility of egoism with helping others. It does not validate NEI121, establish its response process, or show empirical independence from NEI100.';
ledger.version='0.15.0';await write(next.ledger,ledger);

const model=await read(old.model);
assert.equal(model.modelVersion,'generic-1.10.0-pilot');
const rule=model.commitments.find(row=>row.id==='construct-NE15');
assert.ok(rule&&rule.evidence.map(row=>row.itemId).join(',')==='NEI100,NEI101,NEI102');
assert.equal(rule.minimumEvidenceUnits,2);
model.parentModelVersion=model.modelVersion;model.modelVersion='generic-1.11.0-pilot';
model.bankVersion=bank.bankVersion;model.pilotInstrumentVersion='worldview-pilot-1.6.0';
rule.label='Exclusive moral self-priority';rule.scope=proposition;rule.proposition=proposition;
rule.boundary='The rule requires both a universal own-good moral end and denial that another person’s need alone supplies an independent moral reason. Endorsing self-care or a personal prerogative, denying a duty while accepting an independent reason, and psychologically self-interested motivation do not satisfy it.';
rule.mappingStatus='source_reviewed_authored_rule_not_calibrated';
rule.interpretationKind='direct_interpretable_proposition';rule.inferenceStatus='direct';
rule.hypothesizedConstructId='NE15';rule.affinityCriterion=false;rule.researchVariable=false;
rule.sourceClaims=[{sourceId:'acad-egoism',relationship:'supports',claim:egoismSource.claim}];
rule.neighbors=['Ethical egoism as a maximizing rightness theory','Rational egoism',
 'Psychological egoism','Self-regarding prerogatives','Duties of self-care',
 'Stirnerian ownness','Rand’s life-grounded ethics','Independent other-regarding moral reasons'];
rule.nonEntailments=['People in fact always pursue their own good',
 'Each action is right if and only if it best advances the agent’s own good',
 'Rationality always requires maximizing self-interest','Rand’s complete ethical system',
 'The respondent would refuse to help anyone','The respondent is indifferent to others',
 'Egoists cannot cooperate or aid others for self-interested reasons',
 'A particular view of politics, markets, or rights'];
rule.falsePositives=['NEI100 and NEI101 paraphrase the own-good priority and cannot independently establish denial of another person’s moral reason.',
 'NEI102 disagreement can reflect rejection of its wording without affirming exclusive moral self-priority.',
 'NEI121 independent_reason denies a duty but affirms a moral reason and therefore opposes the exclusive proposition.',
 'NEI121 own_good_only alone does not establish the universal own-good moral end or Rand’s specific life-grounded ethics.',
 'NEI121 context_matters is not directional evidence.'];
rule.missingEvidenceBehavior={notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
 singleDirectionalUnit:'leaned_toward'};
rule.evidence=[
 {itemId:'NEI100',itemRevision:1,unitId:'NE-S01',support:[1,2],oppose:[-2,-1]},
 {itemId:'NEI101',itemRevision:1,unitId:'NE-S01',support:[1,2],oppose:[-2,-1]},
 {itemId:'NEI121',itemRevision:1,unitId:'NEI121',support:['own_good_only'],
  oppose:['independent_duty','independent_reason']}
];
const coverage=model.coverage.constructs.find(row=>row.id==='NE15');
assert.ok(coverage&&coverage.candidateItemIds.join(',')==='NEI100,NEI101,NEI102');
coverage.candidateItemIds.push(item.id);
coverage.auditDecision='versioned_exclusive_moral_self_priority_rule';
coverage.auditRationale='NEI100 and NEI101 are one authored own-good indicator; NEI121 separately asks whether another person’s need supplies an independent moral reason. NEI102 is not directional evidence for this conjunction.';
coverage.coverageGap='The if-and-only-if maximizing rightness thesis, rational egoism, psychological egoism, Stirnerian ownness, and Rand’s life-grounded ethics remain separate.';
model.coverage.version='0.15.0';
for(const comparison of model.comparisons.filter(row=>row.id==='compare-construct-NE15'||row.id==='ethical-egoism')){
 comparison.scope=proposition;
 comparison.limitations=[...new Set([...comparison.limitations,
  'This narrow proposition does not establish a maximizing ethical egoism theory or indifference to others.'])];
}
const objectivismComparison=model.comparisons.find(row=>row.id==='objectivism');
assert.ok(objectivismComparison);
objectivismComparison.limitations.push('NE15 is only partial evidence for Rand’s specific rational, life-grounded ethics; its support alone cannot establish the defining ethical criterion.');

const full=await read(old.full);assert.equal(full.policyVersion,'philosophy-pilot-1.10.0');
full.parentPolicyVersion=full.policyVersion;full.policyVersion='philosophy-pilot-1.11.0';
full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;
full.instrumentVersion=model.pilotInstrumentVersion;
const swap=refs=>{const position=refs.findIndex(ref=>ref.itemId==='NEI101'&&ref.itemRevision===1);
 assert.ok(position>=0&&!refs.some(ref=>ref.itemId===item.id));
 refs[position]={itemId:item.id,itemRevision:1};};
swap(full.frozenItems);assert.equal(full.frozenItems.length,243);
model.pilotRouteItemRefs=structuredClone(full.frozenItems);
const bundles=full.bundles.filter(row=>row.commitmentId==='construct-NE15');
assert.equal(bundles.length,2);assert.deepEqual(bundles.map(row=>row.itemIds),
 [['NEI100','NEI101'],['NEI101','NEI102']]);
bundles[0].itemIds=['NEI100','NEI121'];bundles[0].itemRevisions=[1,1];
bundles[0].evidenceUnits=['NE-S01','NEI121'];
full.bundles=full.bundles.filter(row=>row.id!==bundles[1].id);
await write(next.model,model);await write(next.full,full);

const depth=await read(old.depth);assert.equal(depth.policyVersion,'progressive-depth-2.1.0');
depth.policyVersion='progressive-depth-2.2.0';depth.bankVersion=bank.bankVersion;
depth.modelVersion=model.modelVersion;depth.instrumentVersion=model.pilotInstrumentVersion;
depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.2.0';
depth.selectionBasis='The authored 64/120/243 routes retain their lengths. Full replaces the redundant NEI101@1 with NEI121@1 to distinguish universal moral own-good priority from independent other-regarding moral reasons. Quick and Standard remain unchanged in content and cannot make this two-unit direct inference.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.2.0';
 if(route.id==='full')route.itemRefs=structuredClone(full.frozenItems);
 else assert.ok(!route.itemRefs.some(ref=>ref.itemId==='NEI101'||ref.itemId===item.id));}
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});

const research=await read('data/instruments/research-pool-0.14.json');
research.instrumentVersion='0.15.0-research';research.bankVersion=bank.bankVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.7.json');runtimePilot.pilotId='pilot-0.8';
runtimePilot.bankVersion=bank.bankVersion;runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.15 research pool includes NEI121@1; Full replaces NEI101@1 in a separately versioned public release.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.5.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.bankVersion=bank.bankVersion;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));
await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.6.0';
review.sourceFormPolicyVersion=full.policyVersion;
review.decisions.push({sourcePosition:review.decisions.length+1,itemId:item.id,itemRevision:1,
 domainId:'NE',targetConstructIds:['NE15'],mappedRuleIds:['construct-NE15'],
 nearbyRouteItemIds:['NEI100','NEI101','NEI102','NEI118','NEI119'],
 responseMethod:item.responseType,contribution:'independent_other_regarding_reason_discriminator',
 decision:'retain_for_pilot',issue:null,
 rationale:'Preserves a separate independent-duty, independent-reason, and exclusively own-good contrast. The second option opposes exclusive self-priority even though it denies a duty. The item cannot alone establish universal own-good priority or Rand’s ethics.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);

const catalog=await read(old.catalog);assert.equal(catalog.catalogVersion,'philosophical-affinity-2.1.0');
catalog.catalogVersion='philosophical-affinity-2.2.0';catalog.modelVersion=model.modelVersion;
catalog.instrumentVersion=model.pilotInstrumentVersion;
const ethical=catalog.traditions.find(row=>row.id==='ethical-egoism');
const objectivism=catalog.traditions.find(row=>row.id==='objectivism-rand');
assert.ok(ethical&&objectivism);
const ethicalClaim='SEP distinguishes normative ethical egoism from psychological and rational egoism and explains that helping others can have self-interested grounds while independent other-regarding moral weight remains a discriminator.';
const objectivismClaim='SEP places Rand’s rational self-interest within a broader life-grounded ethics and describes circumstances in which helping others is appropriate; generic self-priority alone does not establish her complete doctrine.';
ethical.sourceClaims=[{sourceId:'sep-egoism',relationship:'supports',claim:ethicalClaim}];
objectivism.sourceClaims=[{sourceId:'sep-rand',relationship:'supports',claim:objectivismClaim}];
const moralSelfInterest=ethical.commitments.find(row=>row.id==='moral-self-interest');
const maximizing=ethical.commitments.find(row=>row.id==='rightness-by-own-good');
assert.equal(moralSelfInterest.mapping.status,'direct');
assert.equal(maximizing.mapping.status,'not_measured');
moralSelfInterest.doctrine='Each person morally ought to make their own long-term good the ultimate end of their actions; another person’s need alone supplies no independent moral reason.';
moralSelfInterest.sourceClaims=[{sourceId:'sep-egoism',relationship:'supports',claim:ethicalClaim}];
moralSelfInterest.mapping.note='Directly assesses the narrow conjunction of universal moral own-good priority and denial that another person’s need alone supplies an independent moral reason. It does not assess the maximizing/if-and-only-if thesis.';
ethical.nonEntailments.push('Denying an independent need-based moral reason does not imply indifference, refusal to help, or inability to cooperate for self-interested reasons.');
const rationalSelfInterest=objectivism.commitments.find(row=>row.id==='rational-self-interest');
assert.equal(rationalSelfInterest.role,'defining');
assert.equal(rationalSelfInterest.mapping.status,'direct');
rationalSelfInterest.mapping.status='partial';
rationalSelfInterest.sourceClaims=[{sourceId:'sep-rand',relationship:'supports',claim:objectivismClaim}];
rationalSelfInterest.mapping.note='NE15 assesses universal long-term own-good moral priority and denial of an independent need-based moral reason, but not Rand’s specific rational and life-grounded account. A NEI121 response alone cannot establish this defining criterion.';
objectivism.discriminators.push('Generic exclusive moral self-priority does not establish Rand’s life-grounded rational ethics.');
await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.2.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundlesLocalized=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v13.json':locale.locale+'-draft-v13.json');
 const version='localization-'+locale.locale+(en?'-2.2.0':'-draft-13');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' NEI121@1 and the revised exclusive moral self-priority proposition require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundlesLocalized.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundlesLocalized.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.11.0';
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
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path),[old.sources]:await hash(old.sources)};
pilot.limitations.push('NE15 now requires one own-good priority unit and one independent other-regarding reason unit; their authored independence and respondent comprehension are not empirically established.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.14.json');academic.version='0.15.0';
academic.baseBankVersion='0.14.0';academic.reviewedOn='2026-09-30';
academic.itemCount=bank.items.length;academic.newItemCount=1;academic.newConstructCount=0;
academic.note='Revises the unreleased NEI121 draft’s fourth option to a context-dependent answer, replaces one redundant Full-route item, and narrows NE15 to exclusive moral self-priority. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),
 [pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.18.0';
for(const route of experience.routes)
 route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},
 {version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick, Standard, and Full remain 64/120/243 items. Full substitutes NEI121 for one overlapping own-good paraphrase and can assess the narrow NE15 conjunction; shorter routes do not ask the required pair.';
await write(next.experience,experience);
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-15.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.14.0';
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
updated.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:affinityManifest};
updated.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:localizationManifest};
updated.localizationBundles=bundlesLocalized;
updated.quizExperience={version:experience.experienceVersion,path:next.experience,
 entrypoint:'apps/quiz/index.html'};
updated.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared NEI121@1 and a versioned exclusive moral self-priority rule; 64/120/243 route lengths retained.');
