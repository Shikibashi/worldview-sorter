// Publish a narrow production-control proposition. Prior releases remain immutable.
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

const old={bank:'data/items/candidate-v0.18.json',registry:'data/registries/constructs-v0.7.json',
 sources:'data/sources-v1.11.json',ledger:'data/generic/source-ledger-v0.19.json',
 model:'data/generic/model-v1.15-pilot.json',full:'data/philosophy/public-pilot-v1.15.json',
 depth:'data/experience/progressive-depth-v2.6.json',pilot:'data/pilots/pilot-candidate-v1.15.json',
 review:'data/pilots/content-review-v1.9.json',catalog:'data/affinities/catalog-v2.6.json',
 localization:'data/localization/catalog-v17.json',experience:'data/experience/policy-v1.22.json',
 channels:'data/releases/channels-v19.json',research:'data/instruments/research-pool-0.18.json',
 instrument:'data/instruments/worldview-pilot-v1.9.json',runtime:'data/pilots/pilot-0.11.json',
 academic:'data/academic/release-v0.18.json'};
const next={bank:'data/items/candidate-v0.19.json',registry:'data/registries/constructs-v0.8.json',
 sources:'data/sources-v1.12.json',ledger:'data/generic/source-ledger-v0.20.json',
 model:'data/generic/model-v1.16-pilot.json',full:'data/philosophy/public-pilot-v1.16.json',
 depth:'data/experience/progressive-depth-v2.7.json',pilot:'data/pilots/pilot-candidate-v1.16.json',
 review:'data/pilots/content-review-v1.10.json',catalog:'data/affinities/catalog-v2.7.json',
 localization:'data/localization/catalog-v18.json',experience:'data/experience/policy-v1.23.json',
 channels:'data/releases/channels-v20.json',research:'data/instruments/research-pool-0.19.json',
 instrument:'data/instruments/worldview-pilot-v1.10.json',runtime:'data/pilots/pilot-0.12.json',
 academic:'data/academic/release-v0.19.json'};
const depthManifest='data/experience/progressive-depth-v2.7.manifest.json';
const affinityManifest='data/affinities/manifest-v2.7.json';
const localizationManifest='data/localization/manifest-v2.7.json';
const localizationBundle='data/localization/en-US-v18.json';
const successors=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,localizationBundle];
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 assert.equal(current.worldviewModel?.path,next.model);
 for(const file of successors)await access(path.join(root,file));
 console.log('Social-control successor already exists and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.18.0');
const expected={candidateBank:old.bank,registry:old.registry,sourceRegistry:old.sources,
 worldviewSourceLedger:old.ledger,worldviewModel:old.model,fullForm:old.full,
 progressiveDepth:old.depth,pilotCandidate:old.pilot,contentReview:old.review,
 affinityCatalog:old.catalog,localizationCatalog:old.localization,quizExperience:old.experience,
 releaseChannels:old.channels,instrument:old.research,pilot:old.runtime,academicRelease:old.academic};
for(const [key,file] of Object.entries(expected))assert.equal(current[key]?.path,file,'Unexpected active '+key+' source.');
for(const file of successors){try{await access(path.join(root,file));throw Error('Successor exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}

const ruleId='reviewed-PL39-democratic-social-control-production';
const proposition='Across the two stated production settings, the respondent favors meaningful worker or democratically accountable public control over owner-appointed managerial, private-owner, or unaccountable state control.';
const sourceClaims=[
 {sourceId:'sep-socialism-effective-control',relationship:'supports',
  claim:'The SEP describes the institutional contrast with capitalism as bringing the bulk of productive assets under social, democratic control, while distinguishing socialism from statism and treating markets and institutional designs as contested. This supports a scoped control distinction, not a complete ideology inference.'},
 {sourceId:'iep-socialism-effective-ownership',relationship:'supports',
  claim:'The IEP distinguishes legal from effective ownership and private, state, and social control. It explains that state ownership is a socializing arrangement only when people exercise control, while worker participation and markets vary across proposals.'}
];
const sourceRecords=[
 {id:'sep-socialism-effective-control',kind:'academic',title:'Stanford Encyclopedia of Philosophy: Socialism',
  authors:['Pablo Gilabert','Martin O’Neill'],url:'https://plato.stanford.edu/entries/socialism/',
  use:'§1 on social and democratic control, worker control, the distinction from statism, and contested relations to markets; §4.2 on market-socialist institutional variation.',
  evidenceType:'signed_scholarly_synthesis',access:'text_reviewed',reviewedOn:'2026-10-01',
  reuse:'Conceptual source only; no question wording copied and no item or psychometric validity inferred.'},
 {id:'iep-socialism-effective-ownership',kind:'academic',title:'Internet Encyclopedia of Philosophy: Socialism',
  authors:['Samuel Arnold'],url:'https://iep.utm.edu/socialis/',
  use:'§§1.a–1.b on effective versus legal ownership and private, state, and social ownership/control; §8 on democratic control, workplace participation, and market-socialist variation.',
  evidenceType:'signed_scholarly_synthesis',access:'text_reviewed',reviewedOn:'2026-10-01',
  reuse:'Conceptual source only; no question wording copied and no item or psychometric validity inferred.'}
];
const sources=await read(old.sources);
for(const source of sourceRecords)assert.ok(!sources.sources.some(row=>row.id===source.id),'Duplicate source '+source.id);
sources.sources.push(...sourceRecords);await write(next.sources,sources);

const bank=await read(old.bank);assert.equal(bank.bankVersion,'0.18.0');assert.equal(bank.items.length,574);
const workplace=bank.items.find(row=>row.id==='PLI060');assert.ok(workplace);assert.equal(workplace.revision,1);
assert.ok(!bank.items.some(row=>row.id==='PLI123'||row.id==='PLI060'&&row.revision===2));
workplace.revision=2;
workplace.targets=[...workplace.targets,{constructId:'PL39',relation:'diagnostic',role:'secondary'}];
workplace.provenance={...workplace.provenance,sourceRefs:[...new Set([...(workplace.provenance?.sourceRefs??[]),...sourceRecords.map(x=>x.id)])]};
workplace.contentTags=[...new Set([...(workplace.contentTags??[]),'productive_control_discriminator'])];
workplace.notes='Revision 2 retains the original workplace decision-rights wording and PL14 target, and explicitly maps it as one of two direct settings for a scoped production-control proposition. It is not statistically independent from PLI123.';
const draft=await read('data/items/affinity-gap-draft-v1.json');
const draftItem=draft.items.find(row=>row.id==='PLI123');assert.ok(draftItem);assert.equal(draftItem.revision,1);
const productive=structuredClone(draftItem);productive.revision=2;
productive.targets=[{constructId:'PL39',relation:'diagnostic',role:'primary'},
 {constructId:'PL12',relation:'diagnostic',role:'secondary'},
 {constructId:'PL14',relation:'diagnostic',role:'secondary'}];
productive.options=[...productive.options,{id:'other',label:'Another arrangement or a view not listed.'}];
productive.provenance={origin:'original_project_revision_of_unreleased_draft',
 sourceRefs:sourceRecords.map(x=>x.id),license:{status:'undecided',spdx:null},copiedText:false};
productive.contentTags=[...new Set([...(productive.contentTags??[]),'effective_control','productive_assets'])];
productive.notes='Revision 2 adds a non-forced other response and source-linked targets. It asks about effective control over productive assets, not ownership title alone. Worker self-management and democratically accountable public control remain distinct options; neither settles markets or planning. PLI123@1 remains preserved in the unreleased draft.';
bank.bankVersion='0.19.0';bank.items.push(productive);await write(next.bank,bank);

const registry=await read(old.registry);assert.equal(registry.registryVersion,'0.7.0');
assert.ok(!registry.constructs.some(row=>row.id==='PL39'));
registry.registryVersion='0.8.0';
registry.constructs.push({id:'PL39',domainId:'PL',name:'Democratic and worker control over production (scoped preference)',
 type:'categorical',tier:'diagnostic',description:'Whether the respondent favors effective worker or democratically accountable public control over production decisions in two stated settings. Distinct from common ownership of selected resources, workplace voting alone, redistribution, market coordination, formal legal title, and a complete economic-system identity.',
 candidateItemTarget:1,outputMode:'branch_classification',
 evidenceBasis:sourceRecords.map(x=>x.id),prerequisites:[],measurementStatus:'provisional',directlyScored:true});
await write(next.registry,registry);

const ledger=await read(old.ledger);ledger.version='0.20.0';
for(const source of sourceRecords)ledger.sources.push({...source,useByRules:[ruleId],useByConstructs:['PL39'],
 useByItems:['PLI060','PLI123'],permissionToCopyItems:false,validatesOurItems:false,
 sourceRole:'signed_scholarly_synthesis',
 detailedUseLimit:'Supports the conceptual distinction and neighboring institutional forms only. Does not validate wording, responses, route, evidence thresholds, respondent comprehension, or psychometric properties.'});
await write(next.ledger,ledger);

const model=await read(old.model);model.parentModelVersion=model.modelVersion;
model.modelVersion='generic-1.16.0-pilot';model.bankVersion=bank.bankVersion;
model.registryVersion=registry.registryVersion;model.pilotInstrumentVersion='worldview-pilot-1.10.0';
model.sources.push(...sourceRecords);
const rule={id:ruleId,constructId:'PL39',label:'Democratic and worker control over production in two stated settings',
 facetId:'political-economy',domainId:'PL',layer:'normative',tier:'diagnostic',
 sourceIds:sourceClaims.map(row=>row.sourceId),sourceClaims:sourceClaims.map(row=>({...row})),
 evidence:[
  {itemId:'PLI060',itemRevision:2,unitId:'PLI060',support:[-2,-1],oppose:[1,2]},
  {itemId:'PLI123',itemRevision:2,unitId:'PLI123',support:['worker_governed','social_governed'],oppose:['state_only','private_owners']}
 ],
 boundary:'A scoped preference across two authored production settings. Worker self-management and democratically accountable public control are grouped as alternatives to owner-appointed or unaccountable control for this limited comparison, not asserted to be identical doctrines.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',hypothesizedConstructId:'PL39',
 affinityCriterion:false,researchVariable:false,
 neighbors:['Common ownership of selected resources without a general production-control preference',
  'Workplace voting without a preference about control of major productive assets',
  'Private ownership combined with redistribution, social insurance, or public services',
  'Democratic public control, worker self-management, and unaccountable state control',
  'Market coordination and social control of ownership, which may coexist in market-socialist proposals',
  'Planning versus market allocation and questions of transition or reform'],
 nonEntailments:['Socialism, democratic socialism, communism, anti-capitalism, or a complete economic-system identity',
  'A specific legal ownership title or one required institutional form of social ownership',
  'Abolition of personal property, all private property, or markets',
  'Central planning, market rejection, redistribution, welfare-state support, or political democracy in every domain',
  'State expansion, state abolition, or any empirical claim about an existing economy'],
 falsePositives:['Support for public services, welfare, or redistribution without answers to these exact items is not evidence for this proposition.',
  'Approval of common ownership in a limited resource case does not establish control of major productive enterprises.',
  'Market coordination preferences neither support nor oppose worker/public control; markets and social control may coexist.',
  'A workplace-voting answer alone does not establish a preference about major productive assets.',
  'State ownership alone is not evidence of social control when workers or the public cannot meaningfully govern it.',
  'Democratic-authority, property-rights, affinity, or unrelated political answers do not substitute for these exact revisions.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
  singleDirectionalUnit:'leaned_toward',conflictingDirectionalUnits:'mixed_context_dependent'}};
model.commitments.push(rule);model.commitments.sort((a,b)=>a.id.localeCompare(b.id));
model.publicRuleIds=[...new Set([...model.publicRuleIds,ruleId])].sort();
model.coverage.version='0.19.0';
model.coverage.constructs.push({id:'PL39',name:'Democratic and worker control over production (scoped preference)',domainId:'PL',
 type:'categorical',tier:'diagnostic',declaredSources:sourceClaims.map(row=>row.sourceId),ruleIds:[ruleId],
 candidateItemIds:['PLI060','PLI123'],status:'scoped_direct_interpretation_available',
 auditDecision:'two_complementary_direct_items_across_settings',
 auditRationale:'The existing workplace-decision item and revised major-enterprise control item ask related but distinct institutional questions. They are authored evidence units, not empirically independent indicators.',
 disposition:'directly_interpretable_scoped_proposition',
 coverageGap:'No socialism identity, market/planning view, legal ownership theory, or complete economic system is inferred.'});
model.coverage.constructs.sort((a,b)=>a.id.localeCompare(b.id));
const insertAfter=(refs,anchor,itemRef)=>{const at=refs.findIndex(ref=>ref.itemId===anchor);assert.ok(at>=0,'Missing route ordering anchor '+anchor);
 refs.splice(at+1,0,itemRef);};
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.16.0';full.bankVersion=bank.bankVersion;
full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;
assert.ok(!full.frozenItems.some(ref=>['PLI060','PLI123'].includes(ref.itemId)));
insertAfter(full.frozenItems,'NEI001',{itemId:'PLI060',itemRevision:2});
insertAfter(full.frozenItems,'VAI036',{itemId:'PLI123',itemRevision:2});
assert.equal(full.frozenItems.length,249);full.sizes=[249];
model.pilotRouteItemRefs=structuredClone(full.frozenItems);
const ruleByItem=new Map();
for(const propositionRow of model.commitments)for(const evidence of propositionRow.evidence??[]){
 const list=ruleByItem.get(evidence.itemId)??[];list.push(propositionRow.id);ruleByItem.set(evidence.itemId,list);}
model.coverage.items=bank.items.map(item=>({itemId:item.id,itemRevision:item.revision,
 sourceIds:item.provenance?.sourceRefs??[],ruleIds:(ruleByItem.get(item.id)??[]).sort(),
 status:(ruleByItem.get(item.id)??[]).length?'explicit_mapping_only':'not_used_for_profile_inference',
 sourceValidationTransferred:false,publicFormExcluded:!full.frozenItems.some(ref=>ref.itemId===item.id&&ref.itemRevision===item.revision)}));
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'PL',
 itemIds:['PLI060','PLI123'],itemRevisions:[2,2],evidenceUnits:['PLI060','PLI123']});
const facet=full.facets.find(row=>row.id==='political-economy');assert.ok(facet);
facet.ruleIds=[...new Set([...facet.ruleIds,rule.id])].sort();
facet.bundleIds=[...new Set([...(facet.bundleIds??[]),rule.id+':full-route'])].sort();
await write(next.model,model);await write(next.full,full);

const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.7.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.7.0';
depth.selectionBasis='Quick and Standard retain their exact 64/120 item references. Full adds PLI060@2 on workplace decision rights and PLI123@2 on effective control of major productive enterprises, reaching 249 questions. The two items are complementary authored settings, not empirically independent indicators or calibrated information.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.7.0';
 if(route.id==='full'){route.itemRefs=structuredClone(full.frozenItems);route.size=249;
  route.description='249 questions; the broadest authored coverage, including a scoped two-setting production-control proposition.';
  route.assessableDirectRuleIds=[...new Set([...route.assessableDirectRuleIds,rule.id])].sort();
  route.burden.items=249;}}
await write(next.depth,depth);
await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,
 path:next.depth,sha256:await hash(next.depth)});

const research=await read(old.research);research.instrumentVersion='0.19.0-research';
research.bankVersion=bank.bankVersion;research.registryVersion=registry.registryVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtime=await read(old.runtime);runtime.pilotId='pilot-0.12';runtime.bankVersion=bank.bankVersion;
runtime.sourceInstrumentVersion=research.instrumentVersion;
runtime.administration.note+=' The 0.19 research pool includes PLI060@2 and PLI123@2; the scoped production-control proposition is on Full only.';
await write(next.runtime,runtime);
const instrument=await read(old.instrument);instrument.instrumentVersion=model.pilotInstrumentVersion;
instrument.bankVersion=bank.bankVersion;instrument.registryVersion=registry.registryVersion;
instrument.nominalPoolSize=full.frozenItems.length;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));await write(next.instrument,instrument);

const review=await read(old.review);review.reviewVersion='pilot-content-review-1.10.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=full.frozenItems.length;
review.repeatedWordingAndDependenceGroups.push({id:'productive-control-cross-setting',itemIds:['PLI060','PLI123'],
 note:'The workplace-decision and major-enterprise-control items are complementary settings for one scoped proposition. Their related framing may create local dependence; they are not treated as empirically independent and require response-process review.'});
for(const item of [workplace,productive]){const position=full.frozenItems.findIndex(ref=>ref.itemId===item.id)+1;
 review.decisions.push({sourcePosition:position,itemId:item.id,itemRevision:item.revision,domainId:'PL',
  targetConstructIds:['PL39'],mappedRuleIds:[rule.id],
  nearbyRouteItemIds:item.id==='PLI060'?['PLI050','NEI001','VAI008','OMI018']:['OMI029','VAI036','MSI001','RCI029'],
  responseMethod:item.responseType,contribution:item.id==='PLI060'?'workplace_decision_rights_context':'major_enterprise_effective_control_context',
  decision:'retain_for_pilot',issue:null,
  rationale:item.id==='PLI060'?'A distinct workplace-level choice complements asset-level enterprise control; one response alone may only lean and cannot yield the scoped supported/opposed state.':
   'Adds the absent direct question about effective control of major productive enterprises and distinguishes accountable public, worker, unaccountable state, private-owner, mixed, and other responses.',
  resultUse:'only_through_explicit_interpretation_rules'});}
await write(next.review,review);

const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.7.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',catalogVersion:catalog.catalogVersion,
 path:next.catalog,sha256:await hash(next.catalog),modelVersion:catalog.modelVersion,
 instrumentVersion:catalog.instrumentVersion,affinitySemanticsVersion:catalog.affinitySemanticsVersion});

// Keep only the currently supported English respondent bundle; archived bundles remain version-pinned.
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.7.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
localization.locales=localization.locales.filter(row=>row.locale==='en-US');
assert.equal(localization.locales.length,1,'The active localization catalog must remain English-only.');
localization.note='English (en-US) is the sole supported respondent-facing language in this release.';
const enBundle=await read(localization.locales[0].path);enBundle.bundleVersion='localization-en-US-2.7.0';
enBundle.bankVersion=bank.bankVersion;enBundle.modelVersion=model.modelVersion;
enBundle.affinityCatalogVersion=catalog.catalogVersion;
localization.locales[0]={...localization.locales[0],bundleVersion:enBundle.bundleVersion,path:localizationBundle};
await write(localizationBundle,enBundle);await write(next.localization,localization);
const localizationHashes={};for(const file of [next.localization,localizationBundle])localizationHashes[file]=await hash(file);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',catalogVersion:localization.catalogVersion,
 hashes:localizationHashes});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.16.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;pilot.route.instrumentVersion=model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath=next.instrument;pilot.route.assignedItems=full.frozenItems.length;
pilot.route.exactItemRevisions=structuredClone(full.frozenItems);pilot.route.domainCounts.PL+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds=[...new Set([...pilot.interpretationRules.directRuleIds,rule.id])].sort();
pilot.interpretationRules.routeMeasuredDirectRuleIds=[...new Set([...pilot.interpretationRules.routeMeasuredDirectRuleIds,rule.id])].sort();
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.instrument]:await hash(next.instrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),[next.sources]:await hash(next.sources)};
pilot.limitations.push('The production-control result is a scoped two-setting authored proposition, not a socialist identity or an empirically validated construct. The items may be locally dependent.');
await write(next.pilot,pilot);

const academic=await read(old.academic);academic.version='0.19.0';academic.registryVersion=registry.registryVersion;
academic.baseBankVersion=bank.bankVersion;academic.reviewedOn='2026-10-01';academic.itemCount=bank.items.length;
academic.newItemCount=2;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;academic.academicSourceCount+=2;
academic.note='Adds two complementary production-control questions and one scoped direct proposition about worker or democratically accountable public control across two stated settings. No socialist identity, market/planning view, legal ownership theory, or complete economic system is inferred. Authored, source-informed content, not empirically validated.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write(next.academic,academic);

const experience=await read(old.experience);experience.experienceVersion='quiz-1.23.0';
const fullRoute=experience.routes.find(row=>row.id==='full');fullRoute.size=249;
fullRoute.description='249 questions, including a scoped two-setting production-control proposition.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard retain their exact 64/120 item references. Full adds two complementary direct production-control items, reaching 249 questions. The additions create a scoped authored evidence path, not calibrated information or empirically independent indicators.';
await write(next.experience,experience);

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-20.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.19.0';
await write(next.channels,channels);

const updated=await read('data/current.json');
const refs={candidateBank:[bank.bankVersion,next.bank],registry:[registry.registryVersion,next.registry],
 sourceRegistry:['source-registry-1.12.0',next.sources],worldviewSourceLedger:[ledger.version,next.ledger],
 worldviewModel:[model.modelVersion,next.model],fullForm:[full.policyVersion,next.full],
 progressiveDepth:[depth.policyVersion,next.depth],pilotCandidate:[pilot.pilotCandidateVersion,next.pilot],
 contentReview:[review.reviewVersion,next.review],affinityCatalog:[catalog.catalogVersion,next.catalog],
 localizationCatalog:[localization.catalogVersion,next.localization],quizExperience:[experience.experienceVersion,next.experience],
 releaseChannels:[channels.configVersion,next.channels],instrument:[research.instrumentVersion,next.research],
 pilot:[runtime.pilotId,next.runtime],academicRelease:[academic.version,next.academic]};
for(const [key,[version,file]] of Object.entries(refs))updated[key]={...updated[key],version,path:file,sha256:await hash(file)};
updated.registryVersion=registry.registryVersion;updated.progressiveDepth.manifestPath=depthManifest;
updated.affinityCatalog.manifestPath=affinityManifest;updated.localizationCatalog.manifestPath=localizationManifest;
updated.localizationBundles=[{locale:'en-US',version:enBundle.bundleVersion,path:localizationBundle}];
updated.pilotEvidenceAudit={version:'pilot-evidence-dispositions-1.16.0',path:'data/reviews/pilot-evidence-dispositions-v17.json'};
updated.quizExperience.entrypoint='apps/quiz/index.html';
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared PLI060@2 and PLI123@2; Quick/Standard remain 64/120 and successor Full has 249 items.');
