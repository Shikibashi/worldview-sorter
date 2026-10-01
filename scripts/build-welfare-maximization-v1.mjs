// Publish a narrowly scoped total-welfare act-rightness proposition. Historical releases are immutable.
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

const old={bank:'data/items/candidate-v0.17.json',registry:'data/registries/constructs-v0.6.json',
 sources:'data/sources-v1.10.json',ledger:'data/generic/source-ledger-v0.18.json',
 model:'data/generic/model-v1.14-pilot.json',full:'data/philosophy/public-pilot-v1.14.json',
 depth:'data/experience/progressive-depth-v2.5.json',pilot:'data/pilots/pilot-candidate-v1.14.json',
 review:'data/pilots/content-review-v1.8.json',catalog:'data/affinities/catalog-v2.5.json',
 localization:'data/localization/catalog-v16.json',experience:'data/experience/policy-v1.21.json',
 channels:'data/releases/channels-v18.json',research:'data/instruments/research-pool-0.17.json',
 instrument:'data/instruments/worldview-pilot-v1.8.json',runtime:'data/pilots/pilot-0.10.json',
 academic:'data/academic/release-v0.17.json'};
const next={bank:'data/items/candidate-v0.18.json',registry:'data/registries/constructs-v0.7.json',
 sources:'data/sources-v1.11.json',ledger:'data/generic/source-ledger-v0.19.json',
 model:'data/generic/model-v1.15-pilot.json',full:'data/philosophy/public-pilot-v1.15.json',
 depth:'data/experience/progressive-depth-v2.6.json',pilot:'data/pilots/pilot-candidate-v1.15.json',
 review:'data/pilots/content-review-v1.9.json',catalog:'data/affinities/catalog-v2.6.json',
 localization:'data/localization/catalog-v17.json',experience:'data/experience/policy-v1.22.json',
 channels:'data/releases/channels-v19.json',research:'data/instruments/research-pool-0.18.json',
 instrument:'data/instruments/worldview-pilot-v1.9.json',runtime:'data/pilots/pilot-0.11.json',
 academic:'data/academic/release-v0.18.json'};
const depthManifest='data/experience/progressive-depth-v2.6.manifest.json';
const affinityManifest='data/affinities/manifest-v2.6.json';
const localizationManifest='data/localization/manifest-v2.6.json';
const localizationBundle='data/localization/en-US-v17.json';
const successors=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,localizationBundle];
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 assert.equal(current.worldviewModel?.path,next.model);
 for(const file of successors)await access(path.join(root,file));
 console.log('Welfare-maximization successor already exists and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.17.0');
for(const [key,file] of Object.entries(old)){
 const currentKey={bank:'candidateBank',registry:'registry',sources:'sourceRegistry',ledger:'worldviewSourceLedger',
  model:'worldviewModel',full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',review:'contentReview',
  catalog:'affinityCatalog',localization:'localizationCatalog',experience:'quizExperience',channels:'releaseChannels',
  research:'instrument',runtime:'pilot',academic:'academicRelease'}[key];
 if(currentKey)assert.equal(current[currentKey]?.path,file,'Unexpected active '+key+' source.');
}
for(const file of successors){try{await access(path.join(root,file));throw Error('Successor exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}

const ruleId='reviewed-NE25-total-welfare-maximization';
const proposition='In the general rule item and the specified promise case, the respondent treats choosing the available action with the greatest total well-being for everyone affected as decisive for individual-act moral rightness, even when keeping a valid promise favors the lower-well-being action.';
const sourceClaims=[
 {sourceId:'sep-act-consequence-criterion',relationship:'supports',
  claim:'In its maximizing form, act consequentialism makes the best outcome among available acts the criterion of moral rightness; this act-level criterion differs from evaluating general rules.'},
 {sourceId:'sep-promises-act-rule',relationship:'supports',
  claim:'Act-utilitarian accounts can explain promissory obligations through the welfare effects of promises and their breach, while rule-utilitarian accounts evaluate general promise-keeping practices; a promise conflict is a discriminator rather than a complete theory label.'},
 {sourceId:'sep-welfarism-outcome-value',relationship:'context',
  claim:'The criterion of rightness is distinct from the theory of outcome value and from total-versus-average aggregation; this release measures only the explicit total-well-being commitment tested in its authored items.'}
];
const promisesSource={id:'sep-promises-act-rule',kind:'academic',title:'Stanford Encyclopedia of Philosophy: Promises',
 url:'https://plato.stanford.edu/entries/promises/',
 locator:'Sections 6.3.1–6.3.2: act-utilitarian and rule-utilitarian accounts of promissory obligations.',
 claim:sourceClaims[1].claim,evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',
 reviewedOn:'2026-10-01',reuse:'Conceptual source only; no question wording copied or respondent validity inferred.'};
const items=[
 {id:'NEI133',revision:1,domainId:'NE',
  text:'For individual actions, the morally right option is the one that produces the greatest total well-being for everyone affected; a promise or other consideration matters to rightness only through its effects on well-being.',
  responseType:'likert',responseScaleId:'agreement5',status:'candidate',contentKind:'principle',
  targets:[{constructId:'NE25',relation:'diagnostic',role:'primary'}],options:[],mirrorGroup:null,
  scenarioGroup:'total-welfare-act-criterion',eligibility:{mode:'always'},specialStates:['no_view','not_understood'],
  contentTags:['moral_rightness_criterion','total_welfare','maximization'],
  provenance:{origin:'original_project_draft',sourceRefs:['sep-act-consequence-criterion','sep-welfarism-outcome-value'],
   license:{status:'undecided',spdx:null},copiedText:false},
  notes:'A general statement of the total-well-being act criterion. Agreement alone is not interpreted; the separate promise case must point in the same direction. This is authored wording, not a validated item.'},
 {id:'NEI125',revision:2,domainId:'NE',
  text:'After making a valid promise to do A, you learn that doing B would produce greater total well-being for everyone affected, counting all effects of keeping or breaking the promise, including effects on trust. No other consequences differ. Which view best matches yours?',
  responseType:'vignette_choice',responseScaleId:'vignette_choice',status:'candidate',contentKind:'vignette',
  targets:[{constructId:'NE25',relation:'diagnostic',role:'primary'}],options:[
   {id:'maximize_welfare',label:'Doing B is the morally right choice: the act with greater total well-being is right.'},
   {id:'promise_can_override',label:'Keeping the promise can be morally right even though it produces less total well-being.'},
   {id:'welfare_reason_only',label:'The well-being difference matters, but it does not settle which act is right.'},
   {id:'other',label:'None of these fits my view.'}],
  mirrorGroup:null,scenarioGroup:'welfare-maximization-promise-conflict',eligibility:{mode:'always'},
  specialStates:['no_view','not_understood'],contentTags:['maximization','promise_conflict','act_rule_discriminator'],
  provenance:{origin:'original_project_revision_of_unreleased_draft',sourceRefs:['sep-act-consequence-criterion','sep-promises-act-rule'],
   license:{status:'undecided',spdx:null},copiedText:false},
  notes:'Revision 2 clarifies that the well-being comparison includes effects on trust and other consequences, addressing the unreleased NEI125@1 ambiguity. The promise answer opposes this scoped criterion; a welfare-is-a-reason-only answer is nondirectional. This is not a utilitarian identity item or validated scale.'}
];

const bank=await read(old.bank);assert.equal(bank.bankVersion,'0.17.0');assert.equal(bank.items.length,572);
assert.ok(!bank.items.some(row=>row.id==='NEI125'||row.id==='NEI133'));
bank.bankVersion='0.18.0';bank.items.push(...items);await write(next.bank,bank);

const registry=await read(old.registry);assert.equal(registry.registryVersion,'0.6.0');
assert.ok(!registry.constructs.some(row=>row.id==='NE25'));registry.registryVersion='0.7.0';
registry.constructs.push({id:'NE25',domainId:'NE',name:'Total-well-being maximizing act criterion',type:'categorical',tier:'diagnostic',
 description:'Whether the best total-well-being outcome among available actions determines individual-act moral rightness, including in the specified valid-promise conflict. Distinct from generic consequence concern, act-versus-rule criterion, welfare-only outcome value, and a complete ethical theory.',
 candidateItemTarget:2,outputMode:'branch_classification',
 evidenceBasis:['sep-act-consequence-criterion','sep-promises-act-rule','sep-welfarism-outcome-value'],
 prerequisites:[],measurementStatus:'provisional',directlyScored:true});
await write(next.registry,registry);

const sources=await read(old.sources);assert.ok(!sources.sources.some(row=>row.id===promisesSource.id));
sources.sources.push(promisesSource);await write(next.sources,sources);
const ledger=await read(old.ledger);ledger.version='0.19.0';
for(const source of ledger.sources){
 if(['sep-act-consequence-criterion','sep-welfarism-outcome-value'].includes(source.id)){
  source.useByRules=[...new Set([...(source.useByRules??[]),ruleId])];
  source.useByConstructs=[...new Set([...(source.useByConstructs??[]),'NE25'])];
  const relevant=source.id==='sep-act-consequence-criterion'?['NEI125','NEI133']:['NEI133'];
  source.useByItems=[...new Set([...(source.useByItems??[]),...relevant])];
 }
}
ledger.sources.push({...promisesSource,useByRules:[ruleId],useByConstructs:['NE25'],useByItems:['NEI125'],
 permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
 detailedUseLimit:'Supports the act-versus-rule distinction in promise cases. It does not validate the original question, the two-unit threshold, respondent comprehension, or a whole utilitarian identity.'});
await write(next.ledger,ledger);

const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.15.0-pilot';model.bankVersion=bank.bankVersion;
model.registryVersion=registry.registryVersion;model.pilotInstrumentVersion='worldview-pilot-1.9.0';
model.sources.push(promisesSource);
const rule={id:ruleId,constructId:'NE25',label:'Total-well-being maximization in a promise conflict (scoped criterion)',
 facetId:'ethics-foundations',domainId:'NE',layer:'normative',tier:'diagnostic',
 sourceIds:sourceClaims.map(claim=>claim.sourceId),
 sourceClaims:sourceClaims.map(claim=>({...claim})),
 evidence:[
  {itemId:'NEI133',itemRevision:1,unitId:'NEI133',support:[1,2],oppose:[-1,-2]},
  {itemId:'NEI125',itemRevision:2,unitId:'NEI125',support:['maximize_welfare'],oppose:['promise_can_override']}
 ],
 boundary:'This is limited to explicit endorsement of the general rule wording and its application to one specified valid-promise conflict. It describes an expressed criterion, not behavior or a decision procedure.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',hypothesizedConstructId:'NE25',
 affinityCriterion:false,researchVariable:false,
 neighbors:['Generic consequence responsiveness without a maximizing criterion','A direct act-consequence criterion with a different account of outcome value',
  'Rule consequentialism and promise-keeping practices','Promise-based or rights-based duties that can favor a lower-welfare act',
  'Welfare as an important reason without welfare maximization','Pluralist, prioritarian, egalitarian, total, or average outcome theories'],
 nonEntailments:['Utilitarianism or any complete ethical identity','Hedonism or a particular theory of well-being',
  'Welfare as the only ultimate outcome value','A general theory of promises or rights','A universal distribution or population-ethics rule',
  'A real-world decision procedure or actual respondent behavior','A political or policy position'],
 falsePositives:['Generic agreement that consequences matter does not establish maximization or total welfare.',
  'NE22 act-consequence evidence alone does not identify welfare as the maximizing value.',
  'NE24 welfare-only outcome value does not establish that action must maximize it.',
  'A welfare-maximizing answer in one vignette could reflect a case-specific reason; this is why NEI133 must also align.',
  'Agreement with NEI133 without selecting the higher-welfare act in the specified promise case is not support.',
  'NEI125@1 is an unreleased draft with less explicit treatment of trust effects and is never substituted for revision 2.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
  singleDirectionalUnit:'leaned_toward',conflictingDirectionalUnits:'mixed_context_dependent'}};
model.commitments.push(rule);model.commitments.sort((a,b)=>a.id.localeCompare(b.id));
model.publicRuleIds=[...new Set([...model.publicRuleIds,ruleId])].sort();
model.coverage.version='0.18.0';
model.coverage.constructs.push({id:'NE25',name:'Total-well-being maximizing act criterion',domainId:'NE',type:'categorical',tier:'diagnostic',
 declaredSources:['sep-act-consequence-criterion','sep-promises-act-rule','sep-welfarism-outcome-value'],ruleIds:[ruleId],
 candidateItemIds:['NEI125','NEI133'],status:'scoped_comparison_available',auditDecision:'two_complementary_direct_items',
 auditRationale:'A plain-language general criterion and a distinct promise-conflict application jointly test whether maximizing total well-being is treated as decisive. They are authored evidence units, not empirically independent indicators.',
 disposition:'directly_interpretable',coverageGap:'No full utilitarian theory, account of welfare, distribution rule, broad promise theory, or behavior is inferred.'});
model.coverage.constructs.sort((a,b)=>a.id.localeCompare(b.id));
const ruleByItem=new Map();for(const propositionRow of model.commitments)for(const evidence of propositionRow.evidence??[]){
 const list=ruleByItem.get(evidence.itemId)??[];list.push(propositionRow.id);ruleByItem.set(evidence.itemId,list);}
const publicRefs=new Set(model.pilotRouteItemRefs?.map(ref=>ref.itemId+'@'+ref.itemRevision)??[]);
model.coverage.items=bank.items.map(item=>({itemId:item.id,itemRevision:item.revision,sourceIds:item.provenance?.sourceRefs??[],
 ruleIds:(ruleByItem.get(item.id)??[]).sort(),status:(ruleByItem.get(item.id)??[]).length?'explicit_mapping_only':'not_used_for_profile_inference',
 sourceValidationTransferred:false,publicFormExcluded:!publicRefs.has(item.id+'@'+item.revision)}));
const insertAfter=(refs,anchor,itemRef)=>{const at=refs.findIndex(ref=>ref.itemId===anchor);assert.ok(at>=0,'Missing route ordering anchor '+anchor);
 refs.splice(at+1,0,itemRef);};
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.15.0';full.bankVersion=bank.bankVersion;
full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;
insertAfter(full.frozenItems,'MFI018',{itemId:'NEI133',itemRevision:1});
insertAfter(full.frozenItems,'PLI067',{itemId:'NEI125',itemRevision:2});
assert.equal(full.frozenItems.length,247);full.sizes=[247];
model.pilotRouteItemRefs=structuredClone(full.frozenItems);
model.coverage.items=bank.items.map(item=>({itemId:item.id,itemRevision:item.revision,sourceIds:item.provenance?.sourceRefs??[],
 ruleIds:(ruleByItem.get(item.id)??[]).sort(),status:(ruleByItem.get(item.id)??[]).length?'explicit_mapping_only':'not_used_for_profile_inference',
 sourceValidationTransferred:false,publicFormExcluded:!new Set(full.frozenItems.map(ref=>ref.itemId+'@'+ref.itemRevision)).has(item.id+'@'+item.revision)}));
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'NE',
 itemIds:['NEI133','NEI125'],itemRevisions:[1,2],evidenceUnits:['NEI133','NEI125']});
const facet=full.facets.find(row=>row.id===rule.facetId);assert.ok(facet);
facet.ruleIds.push(rule.id);facet.ruleIds.sort();facet.bundleIds.push(rule.id+':full-route');facet.bundleIds.sort();
await write(next.model,model);await write(next.full,full);

const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.6.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.6.0';
depth.selectionBasis='Quick and Standard retain their exact 64/120 item references. Full adds NEI133@1 and NEI125@2 as a general total-well-being criterion and a distinct valid-promise application, reaching 247 items. These are authored evidence units, not calibrated information or empirically independent indicators.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.6.0';
 if(route.id==='full'){route.itemRefs=structuredClone(full.frozenItems);route.size=247;
  route.description='247 questions; the broadest authored coverage, including a scoped total-well-being act-rightness criterion.';
  route.assessableDirectRuleIds=[...new Set([...route.assessableDirectRuleIds,rule.id])].sort();
  route.burden.items=247;route.burden.vignettes+=1;}}
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});

const research=await read(old.research);research.instrumentVersion='0.18.0-research';
research.bankVersion=bank.bankVersion;research.registryVersion=registry.registryVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtime=await read(old.runtime);runtime.pilotId='pilot-0.11';
runtime.bankVersion=bank.bankVersion;runtime.sourceInstrumentVersion=research.instrumentVersion;
runtime.administration.note+=' The 0.18 research pool includes NEI133@1 and NEI125@2; the direct total-well-being criterion is on Full only.';
await write(next.runtime,runtime);
const instrument=await read(old.instrument);instrument.instrumentVersion=model.pilotInstrumentVersion;
instrument.bankVersion=bank.bankVersion;instrument.registryVersion=registry.registryVersion;
instrument.nominalPoolSize=247;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));await write(next.instrument,instrument);

const review=await read(old.review);review.reviewVersion='pilot-content-review-1.9.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=247;
for(const item of items){const position=full.frozenItems.findIndex(ref=>ref.itemId===item.id)+1;
 review.decisions.push({sourcePosition:position,itemId:item.id,itemRevision:item.revision,domainId:'NE',
  targetConstructIds:['NE25'],mappedRuleIds:[rule.id],nearbyRouteItemIds:item.id==='NEI133'?['MFI018','OMI004','NEI025']:['PLI067','NEI034','SOI101'],
  responseMethod:item.responseType,contribution:item.id==='NEI133'?'general_total_wellbeing_act_criterion':'promise_conflict_application',
  decision:'retain_for_pilot',issue:null,
  rationale:item.id==='NEI133'?'Adds the missing general commitment: total well-being itself must determine the right individual act. It complements rather than paraphrases the promise vignette.':
   'Revision 2 of an unreleased draft makes trust and other effects part of the stated welfare comparison, so a promise answer tests a nonwelfare constraint rather than an omitted welfare consequence.',
  resultUse:'only_through_explicit_interpretation_rules'});}
await write(next.review,review);

const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.6.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',catalogVersion:catalog.catalogVersion,
 path:next.catalog,sha256:await hash(next.catalog),modelVersion:catalog.modelVersion,
 instrumentVersion:catalog.instrumentVersion,affinitySemanticsVersion:catalog.affinitySemanticsVersion});

// The successor is intentionally English-only. Older locale artifacts stay pinned by their historical releases.
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.6.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
localization.locales=localization.locales.filter(row=>row.locale==='en-US');
assert.equal(localization.locales.length,1,'The active localization catalog must remain monolingual.');
localization.note='English (en-US) is the sole supported respondent-facing language in this release.';
const enBundle=await read(localization.locales[0].path);
enBundle.bundleVersion='localization-en-US-2.6.0';enBundle.bankVersion=bank.bankVersion;
enBundle.modelVersion=model.modelVersion;enBundle.affinityCatalogVersion=catalog.catalogVersion;
localization.locales[0]={...localization.locales[0],bundleVersion:enBundle.bundleVersion,path:localizationBundle};
await write(localizationBundle,enBundle);await write(next.localization,localization);
const localizationHashes={};
 for(const file of [next.localization,localizationBundle])
 localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',catalogVersion:localization.catalogVersion,
 hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.15.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;pilot.route.instrumentVersion=model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath=next.instrument;pilot.route.assignedItems=247;
pilot.route.exactItemRevisions=structuredClone(full.frozenItems);pilot.route.domainCounts.NE+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds=[...new Set([...pilot.interpretationRules.directRuleIds,rule.id])].sort();
pilot.interpretationRules.routeMeasuredDirectRuleIds=[...new Set([...pilot.interpretationRules.routeMeasuredDirectRuleIds,rule.id])].sort();
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.instrument]:await hash(next.instrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),
 [next.sources]:await hash(next.sources)};
pilot.limitations.push('The total-well-being maximizing act criterion is a scoped two-item authored proposition; it is not a utilitarian identity or empirically validated construct.');
await write(next.pilot,pilot);

const academic=await read(old.academic);academic.version='0.18.0';academic.registryVersion=registry.registryVersion;
academic.baseBankVersion=bank.bankVersion;academic.reviewedOn='2026-10-01';academic.itemCount=bank.items.length;
academic.newItemCount=2;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;
academic.note='Adds two original, complementary questions and one scoped direct proposition about total-well-being maximization in act rightness. No utilitarian identity, broader promise theory, or affinity mapping is inferred. Authored content, not empirically validated.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write(next.academic,academic);

const experience=await read(old.experience);experience.experienceVersion='quiz-1.22.0';
const fullRoute=experience.routes.find(row=>row.id==='full');fullRoute.size=247;
fullRoute.description='247 questions, including a scoped total-well-being act-rightness criterion.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard retain their exact 64/120 item references. Full adds two complementary authored items for the scoped total-well-being act-rightness criterion, reaching 247 questions. This is coverage policy, not calibrated information.';
await write(next.experience,experience);

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-19.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.18.0';
await write(next.channels,channels);

const updated=await read('data/current.json');
const refs={candidateBank:[bank.bankVersion,next.bank],registry:[registry.registryVersion,next.registry],
 sourceRegistry:['source-registry-1.11.0',next.sources],worldviewSourceLedger:[ledger.version,next.ledger],
 worldviewModel:[model.modelVersion,next.model],fullForm:[full.policyVersion,next.full],
 progressiveDepth:[depth.policyVersion,next.depth],pilotCandidate:[pilot.pilotCandidateVersion,next.pilot],
 contentReview:[review.reviewVersion,next.review],affinityCatalog:[catalog.catalogVersion,next.catalog],
 localizationCatalog:[localization.catalogVersion,next.localization],quizExperience:[experience.experienceVersion,next.experience],
 releaseChannels:[channels.configVersion,next.channels],instrument:[research.instrumentVersion,next.research],
 pilot:[runtime.pilotId,next.runtime],academicRelease:[academic.version,next.academic]};
for(const [key,[version,file]] of Object.entries(refs))updated[key]={...updated[key],version,path:file,sha256:await hash(file)};
updated.registryVersion=registry.registryVersion;
updated.progressiveDepth.manifestPath=depthManifest;
updated.affinityCatalog.manifestPath=affinityManifest;
updated.localizationCatalog.manifestPath=localizationManifest;
updated.localizationBundles=[{locale:'en-US',version:enBundle.bundleVersion,path:localizationBundle}];
updated.pilotEvidenceAudit={version:'pilot-evidence-dispositions-1.15.0',path:'data/reviews/pilot-evidence-dispositions-v16.json'};
updated.quizExperience.entrypoint='apps/quiz/index.html';
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared NEI133@1 and NEI125@2; Quick/Standard remain 64/120 and successor Full has 247 items.');
