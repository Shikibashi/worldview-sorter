// Build a successor release from pinned 1.7 artifacts; never edit historical paths.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');};
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const old={bank:'data/items/candidate-v0.11.json',registry:'data/registries/constructs-v0.4.json',
 sources:'data/sources-v1.3.json',ledger:'data/generic/source-ledger-v0.9.json',
 model:'data/generic/model-v1.5-pilot.json',full:'data/philosophy/public-pilot-v1.5.json',
 depth:'data/experience/progressive-depth-v1.5.json',pilot:'data/pilots/pilot-candidate-v1.5.json',
 review:'data/pilots/content-review-v1.2.json',catalog:'data/affinities/catalog-v1.5.json',
 experience:'data/experience/policy-v1.11.json',localization:'data/localization/catalog-v6.json',
 channels:'data/releases/channels-v8.json'};
const next={bank:'data/items/candidate-v0.12.json',registry:'data/registries/constructs-v0.5.json',
 sources:'data/sources-v1.4.json',ledger:'data/generic/source-ledger-v0.10.json',
 model:'data/generic/model-v1.6-pilot.json',full:'data/philosophy/public-pilot-v1.6.json',
 depth:'data/experience/progressive-depth-v1.6.json',pilot:'data/pilots/pilot-candidate-v1.6.json',
 review:'data/pilots/content-review-v1.3.json',catalog:'data/affinities/catalog-v1.6.json',
 experience:'data/experience/policy-v1.12.json',localization:'data/localization/catalog-v7.json',
 channels:'data/releases/channels-v9.json',research:'data/instruments/research-pool-0.12.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.3.json',runtimePilot:'data/pilots/pilot-0.5.json',
 academic:'data/academic/release-v0.12.json'};
const claim='For a full rule-consequentialist criterion of wrongness, acts are wrong when forbidden by rules justified by their consequences. This differs from using consequence-justified rules merely as a decision procedure while direct act outcomes determine wrongness (sections 4 and 8).';
const source={id:'sep-rule-consequence-criterion',kind:'academic',title:'Stanford Encyclopedia of Philosophy: Rule Consequentialism',
 url:'https://plato.stanford.edu/entries/consequentialism-rule/',
 use:'Sections 4 and 8: rule-based criterion of wrongness, act-versus-rule distinction, and the separate decision-procedure issue.',
 evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',reviewedOn:'2026-09-30',
 reuse:'Conceptual basis only. Neither question has an empirically validated interpretation.'};
const ruleId='reviewed-NE23-rule-consequence-criterion';
const proposition='An act’s moral rightness depends on conformity to rules ultimately justified by their consequences, even when that act alone would produce a better outcome.';
const draft=await read('data/items/affinity-gap-draft-v1.json');
const item=structuredClone(draft.items.find(row=>row.id==='NEI123'));
if(!item||item.revision!==1)throw Error('Reviewed NEI123@1 draft is missing.');
delete item.draftAnswerMeanings;
item.targets=[{constructId:'NE23',relation:'diagnostic',role:'primary'}];
item.contentTags=item.contentTags.filter(tag=>tag!=='unreleased').concat('rule_consequence_reviewed');
item.provenance.sourceRefs=[source.id];
item.notes+=' This asks what ultimately justifies one kind of moral rule. Only the separate act-criterion question can establish whether a consequence-justified rule also determines this act’s rightness. Original wording has not been empirically tested.';
const bank=await read(old.bank);
if(bank.items.length!==565||bank.items.some(row=>row.id===item.id))throw Error('Unexpected source bank.');
bank.bankVersion='0.12.0';bank.items.push(item);await write(next.bank,bank);

const registry=await read(old.registry);registry.registryVersion='0.5.0';
registry.constructs.push({id:'NE23',domainId:'NE',name:'Consequence-justified rule criterion',type:'categorical',tier:'diagnostic',
 description:'A scoped rule-based moral rightness criterion. Consequences ultimately justify the rule, and conformity to it can determine an act’s rightness even when that act alone has a better outcome. This is distinct from a useful rule of thumb and an independent duty.',
 candidateItemTarget:1,outputMode:'branch_classification',evidenceBasis:[source.id],prerequisites:[],
 measurementStatus:'provisional',directlyScored:true});await write(next.registry,registry);
const sources=await read(old.sources);sources.sources.push({...source,claim});await write(next.sources,sources);
const ledger=await read(old.ledger);ledger.version='0.10.0';ledger.sources.push({...source,claim,
 useByRules:[ruleId],useByConstructs:['NE23'],useByItems:['NEI122','NEI123'],
 permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
 detailedUseLimit:'This source supports the act-versus-rule criterion contrast, not question validity, moral sanctions, or a complete ethical identity.'});
await write(next.ledger,ledger);
const model=await read(old.model);model.modelVersion='generic-1.6.0-pilot';model.parentModelVersion='generic-1.5.0-pilot';
model.bankVersion=bank.bankVersion;model.registryVersion=registry.registryVersion;
model.pilotInstrumentVersion='worldview-pilot-1.3.0';model.sources.push({...source,claim});
const rule={id:ruleId,constructId:'NE23',label:proposition,facetId:'ethics-action',domainId:'NE',
 layer:'normative',tier:'diagnostic',sourceIds:[source.id],
 sourceClaims:[{sourceId:source.id,relationship:'supports',claim}],
 evidence:[{itemId:'NEI122',itemRevision:1,unitId:'NEI122',support:['rule_outcome'],
  oppose:['act_outcome','rule_independent']},
 {itemId:'NEI123',itemRevision:1,unitId:'NEI123',support:['general_consequences'],oppose:['person_constraint']}],
 boundary:'Consequences that make a rule useful do not alone make that rule the criterion of an act’s rightness. Selecting reasonable agreement is not treated as opposition because contractualist and consequence-based justifications can overlap. This does not measure rules for blame or a full rule-consequentialist identity.',
 scope:proposition,proposition,minimumEvidenceUnits:2,
 mappingStatus:'source_reviewed_authored_rule_not_calibrated',
 thresholdStatus:'authored_duplicate_control_not_psychometric',
 interpretationKind:'direct_interpretable_proposition',inferenceStatus:'direct',
 hypothesizedConstructId:'NE23',affinityCriterion:false,researchVariable:false,
 neighbors:['Direct act consequentialism','Deontological rule constraints','Contractualist rule justification','Rule-guided decision procedure'],
 nonEntailments:['Utilitarianism','Welfarism','Hedonism','Rules for moral sanctions','An empirically calibrated moral type'],
 falsePositives:['A useful rule of thumb can be endorsed by someone who judges rightness directly from each act’s outcome.',
  'An independent duty can protect a rule without its ultimate justification resting on consequences.',
  'Reasonable agreement can be a competing or compatible justification; the agreement answer is not automatically opposition.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward'}};
model.commitments.push(rule);model.publicRuleIds.push(rule.id);
model.coverage.constructs.push({id:'NE23',name:registry.constructs.at(-1).name,domainId:'NE',
 type:'categorical',tier:'diagnostic',declaredSources:[source.id],ruleIds:[rule.id],
 candidateItemIds:['NEI122','NEI123'],status:'scoped_comparison_available',
 auditDecision:'one_reviewed_new_item_and_one_existing_item',
 auditRationale:'The existing case contrasts act outcome with a consequence-justified rule as criterion; the new question asks what ultimately justifies a rule against harm.',
 disposition:'directly_interpretable',coverageGap:null});model.coverage.version='0.12.0';

const full=await read(old.full);full.policyVersion='philosophy-pilot-1.6.0';
full.parentPolicyVersion='philosophy-pilot-1.5.0';full.bankVersion=bank.bankVersion;
full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;full.sizes=[243];
const fullRefs=full.frozenItems;
if(fullRefs.some(row=>row.itemId==='NEI123'))throw Error('Duplicate Full item NEI123');
fullRefs.splice(231,0,{itemId:'NEI123',itemRevision:1});
model.pilotRouteItemRefs=structuredClone(fullRefs);
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'NE',
 itemIds:['NEI122','NEI123'],itemRevisions:[1,1],evidenceUnits:['NEI122','NEI123']});
const facet=full.facets.find(row=>row.id==='ethics-action');facet.ruleIds.push(rule.id);
facet.bundleIds.push(rule.id+':full-route');
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-1.6.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-1.6.0';
depth.selectionBasis='Quick and Standard retain all exact items. Full adds NEI123@1 to distinguish a consequence-justified rule as a criterion of rightness from a useful decision rule; earlier routes remain immutable.';
for(const route of depth.routes){route.routeVersion=route.id+'-1.6.0';
 if(route.id==='full'){route.itemRefs=structuredClone(fullRefs);route.size=243;
  route.description='243 questions; the broadest authored coverage, including separate act and rule consequence criteria.';
  route.assessableDirectRuleIds.push(rule.id);route.burden.items=243;}}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v1.6.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});

const research=await read('data/instruments/research-pool-0.11.json');
research.instrumentVersion='0.12.0-research';research.registryVersion=registry.registryVersion;
research.bankVersion=bank.bankVersion;research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.4.json');runtimePilot.pilotId='pilot-0.5';
runtimePilot.bankVersion=bank.bankVersion;runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.12 research pool includes NEI123; the public Full route also administers the prior NEI122@1 criterion question.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.2.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.registryVersion=registry.registryVersion;
instrument.bankVersion=bank.bankVersion;instrument.nominalPoolSize=243;
instrument.entries=fullRefs.map((ref,index)=>({index,...ref}));await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.3.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=243;
review.decisions.push({sourcePosition:review.decisions.length+1,
 itemId:'NEI123',itemRevision:1,domainId:'NE',targetConstructIds:['NE23'],mappedRuleIds:[rule.id],
 nearbyRouteItemIds:['NEI122','NEI037','NEI040'],
 responseMethod:'single_choice',contribution:'independent_discriminator',
 decision:'retain_for_pilot',issue:null,
 rationale:'Asks for the ultimate justification of a harm rule, separate from whether rule conformity determines an act’s rightness in NEI122.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-1.6.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.6.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:model.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.6.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v7.json':locale.locale+'-draft-v7.json');
 const version='localization-'+locale.locale+(en?'-1.6.0':'-draft-7');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' NEI123 and the scoped NE23 proposition require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.6.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.6.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};
pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;
pilot.route.instrumentVersion=model.pilotInstrumentVersion;pilot.route.instrumentManifestPath=next.pilotInstrument;
pilot.route.assignedItems=243;pilot.route.exactItemRevisions=structuredClone(fullRefs);pilot.route.domainCounts.NE+=1;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds.push(rule.id);
pilot.interpretationRules.routeMeasuredDirectRuleIds.push(rule.id);
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.pilotInstrument]:await hash(next.pilotInstrument),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),
 [next.sources]:await hash(next.sources)};
pilot.limitations.push('The consequence-justified rule criterion is source-backed authored content, not an empirically validated rule-consequentialism scale.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.11.json');academic.version='0.12.0';
academic.baseBankVersion='0.11.0';academic.reviewedOn='2026-09-30';academic.itemCount=bank.items.length;
academic.newItemCount=1;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;academic.note='One new rule-justification discriminator; an existing item supplies a separate act-rightness criterion case. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.12.0';
experience.routes.find(row=>row.id==='full').size=243;
experience.routes.find(row=>row.id==='full').description='243 questions, including distinct act and consequence-justified rule criteria; the broadest authored coverage.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.6.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard remain 64/120; the successor Full adds one rule-justification question to the prior 242-item route. Historical routes remain pinned.';
await write(next.experience,experience);
await write('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-9.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.8.0';
await write(next.channels,channels);
await write('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');current.registryVersion=registry.registryVersion;
current.candidateBank={version:bank.bankVersion,path:next.bank};
current.instrument={version:research.instrumentVersion,path:next.research};
current.pilot={version:runtimePilot.pilotId,path:next.runtimePilot};
current.academicRelease={version:academic.version,path:next.academic};
current.registry={version:registry.registryVersion,path:next.registry};
current.sourceRegistry={version:'source-registry-1.4.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v1.6.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.contentReview={version:review.reviewVersion,path:next.review};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v1.6.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v1.6.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
current.engineSource={version:'engine-source-1.6.0',
 path:'data/releases/engine-sources/engine-source-1.6.0/manifest.json'};
await write('data/current.json',current);
console.log('Prepared successor 566-item bank and 64/120/243 routes with one new direct proposition.');
