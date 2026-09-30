// Build a successor release from pinned 1.6 artifacts; never edit historical paths.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');};
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const old={bank:'data/items/candidate-v0.10.json',registry:'data/registries/constructs-v0.3.json',
 sources:'data/sources-v1.2.json',ledger:'data/generic/source-ledger-v0.8.json',
 model:'data/generic/model-v1.4-pilot.json',full:'data/philosophy/public-pilot-v1.4.json',
 depth:'data/experience/progressive-depth-v1.4.json',pilot:'data/pilots/pilot-candidate-v1.4.json',
 review:'data/pilots/content-review-v1.1.json',catalog:'data/affinities/catalog-v1.4.json',
 experience:'data/experience/policy-v1.10.json',localization:'data/localization/catalog-v5.json',
 channels:'data/releases/channels-v7.json'};
const next={bank:'data/items/candidate-v0.11.json',registry:'data/registries/constructs-v0.4.json',
 sources:'data/sources-v1.3.json',ledger:'data/generic/source-ledger-v0.9.json',
 model:'data/generic/model-v1.5-pilot.json',full:'data/philosophy/public-pilot-v1.5.json',
 depth:'data/experience/progressive-depth-v1.5.json',pilot:'data/pilots/pilot-candidate-v1.5.json',
 review:'data/pilots/content-review-v1.2.json',catalog:'data/affinities/catalog-v1.5.json',
 experience:'data/experience/policy-v1.11.json',localization:'data/localization/catalog-v6.json',
 channels:'data/releases/channels-v8.json',research:'data/instruments/research-pool-0.11.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.2.json',runtimePilot:'data/pilots/pilot-0.4.json',
 academic:'data/academic/release-v0.11.json'};
const claim='Act consequentialism applies the moral-rightness criterion directly to an act’s own consequences; in its maximizing form, an act is right only when its outcome is at least as good as the outcomes of available alternatives. This differs from full rule consequentialism, which makes wrongness depend on consequence-justified rules (sections 1, 2, and 5).';
const source={id:'sep-act-consequence-criterion',kind:'academic',title:'Stanford Encyclopedia of Philosophy: Consequentialism',
 url:'https://plato.stanford.edu/entries/consequentialism/',
 use:'Sections 1, 2, and 5: direct act criterion, maximizing requirement, and act-versus-rule distinction.',
 evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',reviewedOn:'2026-09-30',
 reuse:'Conceptual basis only. Neither question has an empirically validated interpretation.'};
const ruleId='reviewed-NE22-act-consequence-criterion';
const proposition='An act’s own consequences ultimately determine its moral rightness, and an available act with a better outcome for everyone affected rules out a worse act as permissible.';
const draft=await read('data/items/affinity-gap-draft-v1.json');
const item=structuredClone(draft.items.find(row=>row.id==='NEI122'));
if(!item||item.revision!==1)throw Error('Reviewed NEI122@1 draft is missing.');
delete item.draftAnswerMeanings;
item.targets=[{constructId:'NE22',relation:'diagnostic',role:'primary'}];
item.contentTags=item.contentTags.filter(tag=>tag!=='unreleased').concat('act_consequence_reviewed');
item.provenance.sourceRefs=[source.id];
item.notes+=' The act-outcome answer is a direct criterion in this specified case, not a complete utilitarian identity. Original authored wording has not been empirically tested.';
const bank=await read(old.bank);
if(bank.items.length!==564||bank.items.some(row=>row.id===item.id))throw Error('Unexpected source bank.');
bank.bankVersion='0.11.0';bank.items.push(item);await write(next.bank,bank);

const registry=await read(old.registry);registry.registryVersion='0.4.0';
registry.constructs.push({id:'NE22',domainId:'NE',name:'Direct act-consequence criterion',type:'categorical',tier:'diagnostic',
 description:'A scoped maximizing act-outcome criterion for moral rightness. This is distinct from generic attention to outcomes, rule consequentialism, and utilitarian welfare theory.',
 candidateItemTarget:1,outputMode:'branch_classification',evidenceBasis:[source.id],prerequisites:[],
 measurementStatus:'provisional',directlyScored:true});await write(next.registry,registry);
const sources=await read(old.sources);sources.sources.push({...source,claim});await write(next.sources,sources);
const ledger=await read(old.ledger);ledger.version='0.9.0';ledger.sources.push({...source,claim,
 useByRules:[ruleId],useByConstructs:['NE22'],useByItems:['NEI014','NEI122'],
 permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
 detailedUseLimit:'This source supports the stated philosophical contrast, not question validity or a complete consequentialist identity.'});
await write(next.ledger,ledger);
const model=await read(old.model);model.modelVersion='generic-1.5.0-pilot';model.parentModelVersion='generic-1.4.0-pilot';
model.bankVersion=bank.bankVersion;model.registryVersion=registry.registryVersion;
model.pilotInstrumentVersion='worldview-pilot-1.2.0';model.sources.push({...source,claim});
const rule={id:ruleId,constructId:'NE22',label:proposition,facetId:'ethics-action',domainId:'NE',
 layer:'normative',tier:'diagnostic',sourceIds:[source.id],
 sourceClaims:[{sourceId:source.id,relationship:'supports',claim}],
 evidence:[{itemId:'NEI122',itemRevision:1,unitId:'NEI122',support:['act_outcome'],
  oppose:['rule_outcome','rule_independent']},
 {itemId:'NEI014',itemRevision:1,unitId:'NEI014',support:[-2,-1],oppose:[1,2]}],
 boundary:'The generic claim that outcomes matter is not decisive evidence. The rule-outcome option and the possibility of permitting a worse act prevent a direct maximizing-act inference. This does not identify utilitarianism or settle what counts as good.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',
 thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',
 hypothesizedConstructId:'NE22',affinityCriterion:false,researchVariable:false,
 neighbors:['Full rule consequentialism','Satisficing consequentialism','Deontological constraints','Generic outcome sensitivity'],
 nonEntailments:['Utilitarianism','Welfarism','Hedonism','An empirically calibrated moral type','A recommended everyday decision procedure'],
 falsePositives:['Taking consequences seriously does not say they exclusively determine rightness.',
  'Rejecting a rule in one case without rejecting permissible worse-outcome acts does not satisfy both evidence units.',
  'A rule chosen for its good consequences is still a rule criterion, not automatically a direct act criterion.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward'}};
model.commitments.push(rule);model.publicRuleIds.push(rule.id);
model.coverage.constructs.push({id:'NE22',name:registry.constructs.at(-1).name,domainId:'NE',
 type:'categorical',tier:'diagnostic',declaredSources:[source.id],ruleIds:[rule.id],
 candidateItemIds:['NEI014','NEI122'],status:'scoped_comparison_available',
 auditDecision:'one_reviewed_new_item_and_one_existing_item',
 auditRationale:'The new conceptual case asks direct act-versus-rule rightness; the existing maximization item checks whether a worse outcome can still be permissible.',
 disposition:'directly_interpretable',coverageGap:null});model.coverage.version='0.11.0';

const full=await read(old.full);full.policyVersion='philosophy-pilot-1.5.0';
full.parentPolicyVersion='philosophy-pilot-1.4.0';full.bankVersion=bank.bankVersion;
full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;full.sizes=[242];
const fullRefs=full.frozenItems;
for(const [ref,index] of [[{itemId:'NEI014',itemRevision:1},132],[{itemId:'NEI122',itemRevision:1},226]]){
 if(fullRefs.some(row=>row.itemId===ref.itemId))throw Error('Duplicate Full item '+ref.itemId);
 fullRefs.splice(index,0,ref);
}
model.pilotRouteItemRefs=structuredClone(fullRefs);
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'NE',
 itemIds:['NEI014','NEI122'],itemRevisions:[1,1],evidenceUnits:['NEI014','NEI122']});
const facet=full.facets.find(row=>row.id==='ethics-action');facet.ruleIds.push(rule.id);
facet.bundleIds.push(rule.id+':full-route');
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-1.5.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-1.5.0';
depth.selectionBasis='Quick and Standard retain all exact items. Full adds NEI014@1 and NEI122@1 to provide a direct, two-unit act-consequence criterion; earlier routes remain immutable.';
for(const route of depth.routes){route.routeVersion=route.id+'-1.5.0';
 if(route.id==='full'){route.itemRefs=structuredClone(fullRefs);route.size=242;
  route.description='242 questions; the broadest authored coverage, including a direct act-consequence distinction.';
  route.assessableDirectRuleIds.push(rule.id);route.burden.items=242;}}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v1.5.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});

const research=await read('data/instruments/research-pool-0.10.json');
research.instrumentVersion='0.11.0-research';research.registryVersion=registry.registryVersion;
research.bankVersion=bank.bankVersion;research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.3.json');runtimePilot.pilotId='pilot-0.4';
runtimePilot.bankVersion=bank.bankVersion;runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.11 research pool includes NEI122; the public Full route separately administers NEI014@1.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.1.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.registryVersion=registry.registryVersion;
instrument.bankVersion=bank.bankVersion;instrument.nominalPoolSize=242;
instrument.entries=fullRefs.map((ref,index)=>({index,...ref}));await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.2.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=242;
for(const id of ['NEI014','NEI122'])review.decisions.push({sourcePosition:review.decisions.length+1,
 itemId:id,itemRevision:1,domainId:'NE',targetConstructIds:['NE22'],mappedRuleIds:[rule.id],
 nearbyRouteItemIds:id==='NEI014'?['NEI001','NEI122']:['NEI037','NEI040','NEI014'],
 responseMethod:id==='NEI014'?'likert':'single_choice',contribution:'independent_discriminator',
 decision:'retain_for_pilot',issue:null,
 rationale:id==='NEI014'?'An existing item checks whether a clearly worse result can remain permissible; disagreement alone is not act consequentialism.':'A new direct criterion question separates an act’s consequences from a consequence-justified rule and an independent duty.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-1.5.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.5.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:model.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.5.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v6.json':locale.locale+'-draft-v6.json');
 const version='localization-'+locale.locale+(en?'-1.5.0':'-draft-6');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' NEI122 and the scoped NE22 proposition require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.5.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.5.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};
pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.route.instrumentVersion=model.pilotInstrumentVersion;pilot.route.instrumentManifestPath=next.pilotInstrument;
pilot.route.assignedItems=242;pilot.route.exactItemRevisions=structuredClone(fullRefs);pilot.route.domainCounts.NE+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds.push(rule.id);
pilot.interpretationRules.routeMeasuredDirectRuleIds.push(rule.id);
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.pilotInstrument]:await hash(next.pilotInstrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),
 [next.sources]:await hash(next.sources)};
pilot.limitations.push('The direct act-consequence rule is source-backed authored content, not an empirically validated act-consequentialism scale.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.10.json');academic.version='0.11.0';
academic.baseBankVersion='0.10.0';academic.reviewedOn='2026-09-30';academic.itemCount=bank.items.length;
academic.newItemCount=1;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;academic.note='One new act-versus-rule discriminator; an existing item supplies a separate maximization check. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.11.0';
experience.routes.find(row=>row.id==='full').size=242;
experience.routes.find(row=>row.id==='full').description='242 questions, including a direct act-consequence distinction; the broadest authored coverage.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.5.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard remain 64/120; the successor Full adds two independently framed questions to the prior 240-item route. Historical routes remain pinned.';
await write(next.experience,experience);
await write('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-8.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.7.0';
await write(next.channels,channels);
await write('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');current.registryVersion=registry.registryVersion;
current.candidateBank={version:bank.bankVersion,path:next.bank};
current.instrument={version:research.instrumentVersion,path:next.research};
current.pilot={version:runtimePilot.pilotId,path:next.runtimePilot};
current.academicRelease={version:academic.version,path:next.academic};
current.registry={version:registry.registryVersion,path:next.registry};
current.sourceRegistry={version:'source-registry-1.3.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.5.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.contentReview={version:review.reviewVersion,path:next.review};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v1.5.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v1.5.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
current.engineSource={version:'engine-source-1.5.0',
 path:'data/releases/engine-sources/engine-source-1.5.0/manifest.json'};
await write('data/current.json',current);
console.log('Prepared successor 565-item bank and 64/120/242 routes with one new direct proposition.');
