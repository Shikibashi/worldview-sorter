// Publish a scoped outcome-value distinction from two original question revisions.
// All previously released artifacts remain immutable.
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
const old={bank:'data/items/candidate-v0.16.json',registry:'data/registries/constructs-v0.5.json',
 sources:'data/sources-v1.9.json',ledger:'data/generic/source-ledger-v0.17.json',
 model:'data/generic/model-v1.13-pilot.json',full:'data/philosophy/public-pilot-v1.13.json',
 depth:'data/experience/progressive-depth-v2.4.json',pilot:'data/pilots/pilot-candidate-v1.13.json',
 review:'data/pilots/content-review-v1.7.json',catalog:'data/affinities/catalog-v2.4.json',
 localization:'data/localization/catalog-v15.json',experience:'data/experience/policy-v1.20.json',
 channels:'data/releases/channels-v17.json',research:'data/instruments/research-pool-0.16.json',
 instrument:'data/instruments/worldview-pilot-v1.7.json',runtime:'data/pilots/pilot-0.9.json',
 academic:'data/academic/release-v0.16.json'};
const next={bank:'data/items/candidate-v0.17.json',registry:'data/registries/constructs-v0.6.json',
 sources:'data/sources-v1.10.json',ledger:'data/generic/source-ledger-v0.18.json',
 model:'data/generic/model-v1.14-pilot.json',full:'data/philosophy/public-pilot-v1.14.json',
 depth:'data/experience/progressive-depth-v2.5.json',pilot:'data/pilots/pilot-candidate-v1.14.json',
 review:'data/pilots/content-review-v1.8.json',catalog:'data/affinities/catalog-v2.5.json',
 localization:'data/localization/catalog-v16.json',experience:'data/experience/policy-v1.21.json',
 channels:'data/releases/channels-v18.json',research:'data/instruments/research-pool-0.17.json',
 instrument:'data/instruments/worldview-pilot-v1.8.json',runtime:'data/pilots/pilot-0.10.json',
 academic:'data/academic/release-v0.17.json'};
const depthManifest='data/experience/progressive-depth-v2.5.manifest.json';
const affinityManifest='data/affinities/manifest-v2.5.json';
const localizationManifest='data/localization/manifest-v2.5.json';
const locales=['data/localization/ar-draft-v16.json','data/localization/en-US-v16.json',
 'data/localization/es-ES-draft-v16.json'];
const successors=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,...locales];
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 assert.equal(current.worldviewModel?.path,next.model);
 for(const file of successors)await access(path.join(root,file));
 console.log('Welfarist outcome-value successor already exists and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.16.0');
const keys={bank:'candidateBank',registry:'registry',sources:'sourceRegistry',ledger:'worldviewSourceLedger',
 model:'worldviewModel',full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',
 review:'contentReview',catalog:'affinityCatalog',localization:'localizationCatalog',
 experience:'quizExperience',channels:'releaseChannels',research:'instrument',instrument:null,
 runtime:'pilot',academic:'academicRelease'};
for(const [key,file] of Object.entries(old))if(keys[key])assert.equal(current[keys[key]]?.path,file);
for(const file of successors){try{await access(path.join(root,file));throw Error('Successor exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}

const ruleId='reviewed-NE24-welfarist-outcome-value';
const proposition='Only how well affected beings fare ultimately makes an outcome better or worse in itself; beauty does not add independent outcome value when no being’s well-being changes.';
const sourceClaims=[
 {id:'sep-welfarism-outcome-value',title:'Stanford Encyclopedia of Philosophy: Well-Being',
  url:'https://plato.stanford.edu/entries/well-being/',locator:'Sections 1 and 5.1: welfare as good for a being, welfarism, and disputed rights or equality implications.',
  claim:'Welfarism makes well-being the only ultimate value; accepting this value thesis does not by itself settle rights, equality, or a criterion of right action.',relationship:'supports'},
 {id:'sep-plural-outcome-value',title:'Stanford Encyclopedia of Philosophy: Consequentialism',
  url:'https://plato.stanford.edu/entries/consequentialism/',locator:'Section 2: theories of value, welfare-only value, and plural values including beauty and truth.',
  claim:'A welfarist theory of outcome value differs from plural theories that recognize beauty, truth, justice, or other goods independently of individual welfare.',relationship:'supports'},
 {id:'sep-environment-intrinsic',title:'Stanford Encyclopedia of Philosophy: Environmental Ethics',
  url:'https://plato.stanford.edu/entries/ethics-environmental/',locator:'Section 2: non-instrumental value of nonhuman nature and last-person thought experiments.',
  claim:'The possible independent value of nonhuman nature provides a genuine counterexample to welfare-only outcome value, but this one question does not identify an environmental theory.',relationship:'context'}
];
const items=[
 {id:'NEI124',revision:2,domainId:'NE',text:'When comparing how good two outcomes are in themselves, apart from whether the action producing either is permitted, which is closest to your view?',
  responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'contrast',
  targets:[{constructId:'NE24',relation:'diagnostic',role:'primary'}],options:[
   {id:'welfare_only',label:'Only how well affected beings fare ultimately makes an outcome better or worse; other features matter through their effects on well-being.'},
   {id:'other_good',label:'Well-being matters, but another feature can improve an outcome even when no being’s well-being changes.'},
   {id:'context',label:'Neither general claim fits; it depends on the kind of outcome.'}],
  mirrorGroup:null,scenarioGroup:'welfarist-outcome-value',eligibility:{mode:'always'},
  specialStates:['no_view','not_understood'],contentTags:['outcome_value','welfarism_discriminator'],
  provenance:{origin:'original_project_revision_of_unreleased_draft',sourceRefs:['sep-welfarism-outcome-value','sep-plural-outcome-value'],
   license:{status:'undecided',spdx:null},copiedText:false},
  notes:'Revision 2 of the historical unreleased NEI124@1 draft removes a rights-priority option that could coexist with welfarist outcome value. This asks about outcome value, not whether a right constrains action. Original wording has not been comprehension-tested.'},
 {id:'NEI132',revision:1,domainId:'NE',text:'Imagine two otherwise identical worlds. In one, an uninhabited valley has striking natural beauty. Nobody will ever see it, and no living being is affected. Can that alone make this world better in itself?',
  responseType:'vignette_choice',responseScaleId:'vignette_choice',status:'candidate',contentKind:'vignette',
  targets:[{constructId:'NE24',relation:'diagnostic',role:'primary'}],options:[
   {id:'independent_beauty',label:'Yes. Its beauty can make the world better even though no being benefits.'},
   {id:'no_welfare_change',label:'No. Without changing any being’s well-being, it does not make the world better.'},
   {id:'unclear_case',label:'I cannot tell from this case whether the world is better.'}],
  mirrorGroup:null,scenarioGroup:'unseen-beauty-value',eligibility:{mode:'always'},
  specialStates:['no_view','not_understood'],contentTags:['outcome_value','nonwelfare_counterexample'],
  provenance:{origin:'original_project_draft',sourceRefs:['sep-plural-outcome-value','sep-environment-intrinsic'],
   license:{status:'undecided',spdx:null},copiedText:false},
  notes:'A concrete independent-beauty counterexample. Rejecting this particular value is not enough to establish general welfarism; it must be read with NEI124@2. This is not a copy of a source thought experiment or a validated scale item.'}
];
const bank=await read(old.bank);assert.equal(bank.bankVersion,'0.16.0');assert.equal(bank.items.length,570);
for(const item of items)assert.ok(!bank.items.some(row=>row.id===item.id));
bank.bankVersion='0.17.0';bank.items.push(...items);await write(next.bank,bank);
const registry=await read(old.registry);assert.equal(registry.registryVersion,'0.5.0');
assert.ok(!registry.constructs.some(row=>row.id==='NE24'));registry.registryVersion='0.6.0';
registry.constructs.push({id:'NE24',domainId:'NE',name:'Welfarist outcome value',type:'categorical',tier:'diagnostic',
 description:'Whether only the well-being of affected beings ultimately makes an outcome better or worse, distinct from a theory of personal well-being, aggregation, and moral rightness.',
 candidateItemTarget:2,outputMode:'branch_classification',evidenceBasis:sourceClaims.slice(0,2).map(row=>row.id),
 prerequisites:[],measurementStatus:'provisional',directlyScored:true});await write(next.registry,registry);
const sources=await read(old.sources),ledger=await read(old.ledger);ledger.version='0.18.0';
for(const claim of sourceClaims){
 const base={id:claim.id,kind:'academic',title:claim.title,url:claim.url,locator:claim.locator,
  claim:claim.claim,evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',
  reviewedOn:'2026-10-01',reuse:'Conceptual source; no wording copied or respondent validity inferred.'};
 sources.sources.push(base);ledger.sources.push({...base,useByRules:[ruleId],useByConstructs:['NE24'],
  useByItems:claim.id==='sep-environment-intrinsic'?['NEI132']:items.map(row=>row.id),
  permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
  detailedUseLimit:'Defines the welfare-only outcome-value distinction and one nonwelfare neighbor. It does not validate question comprehension, unit independence, or thresholds.'});
}
await write(next.sources,sources);await write(next.ledger,ledger);
const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.14.0-pilot';model.bankVersion=bank.bankVersion;
model.registryVersion=registry.registryVersion;model.pilotInstrumentVersion='worldview-pilot-1.8.0';
for(const claim of sourceClaims)model.sources.push(sources.sources.find(row=>row.id===claim.id));
const rule={id:ruleId,constructId:'NE24',label:'Welfare as the only ultimate outcome good',
 facetId:'ethics-foundations',domainId:'NE',layer:'normative',tier:'diagnostic',
 sourceIds:sourceClaims.map(row=>row.id),sourceClaims:sourceClaims.map(row=>({sourceId:row.id,relationship:row.relationship,claim:row.claim})),
 evidence:[{itemId:'NEI124',itemRevision:2,unitId:'NEI124',support:['welfare_only'],oppose:['other_good']},
  {itemId:'NEI132',itemRevision:1,unitId:'NEI132',support:['no_welfare_change'],oppose:['independent_beauty']}],
 boundary:'This is about ultimate outcome value. It neither says that the right act maximizes welfare nor that rights, promises, fairness, or other duties cannot constrain action. One denial of unseen beauty alone does not establish the general thesis.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',
 hypothesizedConstructId:'NE24',affinityCriterion:false,researchVariable:false,
 neighbors:['Plural outcome value including independent beauty, truth, or justice','Deontology with welfare-only outcome value',
  'Act or rule consequentialism with plural outcome value','Distribution-sensitive welfarism'],
 nonEntailments:['Utilitarianism or any philosophical identity','A duty to maximize aggregate welfare',
  'A particular account of well-being such as hedonism','A ban on rights or promises as independent constraints',
  'Equal weighting, a simple total, or any population aggregation rule','The absence of independent value in every untested case'],
 falsePositives:['NEI124@1’s rights-priority draft alternative could coexist with welfare-only outcome value and is not used.',
  'Someone may reject value in unseen beauty while recognizing another nonwelfare good; NEI132 alone cannot support.',
  'A rights-based respondent can support this outcome-value thesis while denying act consequentialism.',
  'A respondent can believe beauty benefits someone; NEI132 explicitly removes that pathway.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward'}};
model.commitments.push(rule);model.publicRuleIds.push(rule.id);model.coverage.version='0.17.0';
model.coverage.constructs.push({id:'NE24',name:'Welfarist outcome value',domainId:'NE',type:'categorical',tier:'diagnostic',
 declaredSources:sourceClaims.map(row=>row.id),ruleIds:[rule.id],candidateItemIds:items.map(row=>row.id),
 status:'scoped_comparison_available',auditDecision:'two_complementary_direct_items',
 auditRationale:'A general outcome-value choice and an unseen-beauty counterexample jointly distinguish welfare-only value from one major pluralist neighbor while separating act permissions.',
 disposition:'directly_interpretable',coverageGap:'Aggregation, theories of well-being, full value pluralism, and moral rightness remain separate.'});
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.14.0';full.bankVersion=bank.bankVersion;
full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;
full.frozenItems.splice(64,0,{itemId:'NEI124',itemRevision:2});
full.frozenItems.splice(157,0,{itemId:'NEI132',itemRevision:1});
assert.equal(full.frozenItems.length,245);full.sizes=[245];
model.pilotRouteItemRefs=structuredClone(full.frozenItems);
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'NE',
 itemIds:items.map(row=>row.id),itemRevisions:[2,1],evidenceUnits:items.map(row=>row.id)});
const facet=full.facets.find(row=>row.id===rule.facetId);assert.ok(facet);
facet.ruleIds.push(rule.id);facet.bundleIds.push(rule.id+':full-route');
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.5.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.5.0';
depth.selectionBasis='Quick and Standard retain 64/120 exact items. Full adds NEI124@2 and NEI132@1 as separate general and concrete evidence for scoped welfare-only outcome value, reaching 245 items; no previous route changes in place.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.5.0';
 if(route.id==='full'){route.itemRefs=structuredClone(full.frozenItems);route.size=245;
  route.description='245 questions; the broadest authored coverage, including scoped welfare-only outcome value.';
  route.assessableDirectRuleIds.push(rule.id);route.burden.items=245;route.burden.vignettes+=1;}}
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});
const research=await read(old.research);research.instrumentVersion='0.17.0-research';
research.bankVersion=bank.bankVersion;research.registryVersion=registry.registryVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtime=await read(old.runtime);runtime.pilotId='pilot-0.10';
runtime.bankVersion=bank.bankVersion;runtime.sourceInstrumentVersion=research.instrumentVersion;
runtime.administration.note+=' The 0.17 research pool includes NEI124@2 and NEI132@1; only the successor Full route administers both.';
await write(next.runtime,runtime);
const instrument=await read(old.instrument);instrument.instrumentVersion=model.pilotInstrumentVersion;
instrument.bankVersion=bank.bankVersion;instrument.registryVersion=registry.registryVersion;
instrument.nominalPoolSize=245;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));await write(next.instrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.8.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=245;
for(const [index,item] of items.entries())review.decisions.push({sourcePosition:review.decisions.length+1,
 itemId:item.id,itemRevision:item.revision,domainId:'NE',targetConstructIds:['NE24'],mappedRuleIds:[rule.id],
 nearbyRouteItemIds:index?['NEI124','VAI061']:['NEI132','NEI122','VAI054'],responseMethod:item.responseType,
 contribution:index?'nonwelfare_beauty_counterexample':'general_welfare_only_value_principle',
 decision:'retain_for_pilot',issue:null,
 rationale:index?'Checks one nonwelfare counterexample while withholding support from a single landscape answer.':'Separates outcome value from action permission and supersedes the ambiguous rights option in the unreleased first draft.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.5.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',catalogVersion:catalog.catalogVersion,
 path:next.catalog,sha256:await hash(next.catalog),modelVersion:catalog.modelVersion,
 instrumentVersion:catalog.instrumentVersion,affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.5.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;const bundles=[];
for(const locale of localization.locales){const en=locale.locale==='en-US',bundle=await read(locale.path);
 const file='data/localization/'+(en?'en-US-v16.json':locale.locale+'-draft-v16.json');
 const version='localization-'+locale.locale+(en?'-2.5.0':'-draft-16');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' NEI124@2, NEI132@1, and their scoped proposition require linguistic review before any public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.14.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};
pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.route.instrumentVersion=model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath=next.instrument;pilot.route.assignedItems=245;
pilot.route.exactItemRevisions=structuredClone(full.frozenItems);pilot.route.domainCounts.NE+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds.push(rule.id);
pilot.interpretationRules.routeMeasuredDirectRuleIds.push(rule.id);
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.instrument]:await hash(next.instrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),
 [next.sources]:await hash(next.sources)};
pilot.limitations.push('Welfare-only outcome value is a scoped authored two-item proposition, not a validated welfarism or utilitarianism classification.');
await write(next.pilot,pilot);
const academic=await read(old.academic);academic.version='0.17.0';
academic.registryVersion=registry.registryVersion;academic.baseBankVersion='0.16.0';
academic.reviewedOn='2026-10-01';academic.itemCount=bank.items.length;
academic.newItemCount=2;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;
academic.note='Two original complementary questions for scoped welfare-only outcome value; no theory of right action or philosophical identity inferred. Authored, not empirically validated.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.21.0';
experience.routes.find(row=>row.id==='full').size=245;
experience.routes.find(row=>row.id==='full').description='245 questions, adding a scoped welfare-only outcome-value distinction.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard remain 64/120. Full adds two complementary welfare-only outcome-value items to the previous 243-item route. This is authored coverage, not calibrated information.';
await write(next.experience,experience);
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-18.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.17.0';
await write(next.channels,channels);
const updated=await read('data/current.json');
const refs={candidateBank:[bank.bankVersion,next.bank],registry:[registry.registryVersion,next.registry],
 sourceRegistry:['source-registry-1.10.0',next.sources],worldviewSourceLedger:[ledger.version,next.ledger],
 worldviewModel:[model.modelVersion,next.model],fullForm:[full.policyVersion,next.full],
 progressiveDepth:[depth.policyVersion,next.depth],pilotCandidate:[pilot.pilotCandidateVersion,next.pilot],
 contentReview:[review.reviewVersion,next.review],affinityCatalog:[catalog.catalogVersion,next.catalog],
 localizationCatalog:[localization.catalogVersion,next.localization],quizExperience:[experience.experienceVersion,next.experience],
 releaseChannels:[channels.configVersion,next.channels],instrument:[research.instrumentVersion,next.research],
 pilot:[runtime.pilotId,next.runtime],academicRelease:[academic.version,next.academic]};
for(const [key,[version,file]] of Object.entries(refs))updated[key]={version,path:file};
updated.registryVersion=registry.registryVersion;
updated.progressiveDepth.manifestPath=depthManifest;
updated.affinityCatalog.manifestPath=affinityManifest;
updated.localizationCatalog.manifestPath=localizationManifest;
updated.localizationBundles=bundles;
updated.quizExperience.entrypoint='apps/quiz/index.html';
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared NEI124@2 and NEI132@1; successor Full has 245 questions.');
