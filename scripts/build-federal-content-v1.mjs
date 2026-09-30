// Creates the reviewed 1.5 content candidate from the immutable 1.4 release.
// Only successor paths are written; the historical release is never edited.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const bytes=async p=>readFile(path.join(root,p));
const hash=async p=>createHash('sha256').update(await bytes(p)).digest('hex');
const write=async(p,o)=>{await mkdir(path.dirname(path.join(root,p)),{recursive:true});
 await writeFile(path.join(root,p),JSON.stringify(o,null,2)+'\n');};
const refs=rows=>rows.map(item=>({itemId:item.id,itemRevision:item.revision}));
const old={bank:'data/items/candidate-v0.9.json',registry:'data/constructs.json',
 sources:'data/sources.json',ledger:'data/generic/source-ledger-v0.6.json',
 model:'data/generic/model-v1.2-pilot.json',full:'data/philosophy/public-pilot-v1.2.json',
 depth:'data/experience/progressive-depth-v1.2.json',pilot:'data/pilots/pilot-candidate-v1.2.json',
 review:'data/pilots/content-review-v1.json',catalog:'data/affinities/catalog-v1.2.json',
 experience:'data/experience/policy-v1.8.json',localization:'data/localization/catalog-v3.json'};
const next={bank:'data/items/candidate-v0.10.json',registry:'data/registries/constructs-v0.3.json',
 sources:'data/sources-v1.1.json',ledger:'data/generic/source-ledger-v0.7.json',
 model:'data/generic/model-v1.3-pilot.json',full:'data/philosophy/public-pilot-v1.3.json',
 depth:'data/experience/progressive-depth-v1.3.json',pilot:'data/pilots/pilot-candidate-v1.3.json',
 review:'data/pilots/content-review-v1.1.json',catalog:'data/affinities/catalog-v1.3.json',
 experience:'data/experience/policy-v1.9.json',localization:'data/localization/catalog-v4.json'};
const draft=await read('data/items/dimension-gap-draft-v1.json');
const additions=['PLI126','PLI127'].map(id=>structuredClone(draft.items.find(item=>item.id===id)));
if(additions.some(item=>!item))throw Error('Federal distinction drafts are missing.');
for(const item of additions){
 delete item.draftAnswerMeanings;
 item.contentTags=item.contentTags.filter(tag=>tag!=='unreleased').concat('federal_division_reviewed');
 item.provenance.sourceRefs=['audit-federalism'];
 item.notes+=' This question is authored content, not a validated scale indicator.';
}
const bank=await read(old.bank);bank.bankVersion='0.10.0';bank.items.push(...additions);await write(next.bank,bank);
const registry=await read(old.registry);registry.registryVersion='0.3.0';registry.constructs.push({
 id:'PL34',domainId:'PL',name:'Constitutionally protected federal division',type:'categorical',tier:'diagnostic',
 description:'A normative preference for entrenched powers at both national and regional levels, with neither level able to withdraw the other’s assigned powers unilaterally. This is narrower than decentralization.',
 candidateItemTarget:2,outputMode:'branch_classification',evidenceBasis:['audit-federalism'],
 prerequisites:[],measurementStatus:'provisional',directlyScored:true});await write(next.registry,registry);
const sourceRegistry=await read(old.sources);sourceRegistry.sources.push({
 id:'audit-federalism',kind:'academic',title:'Federalism',url:'https://plato.stanford.edu/entries/federalism/',
 use:'Introduction and section 1: entrenched division in federations versus revocable unitary decentralization and member-controlled confederation.',
 evidenceType:'scholarly_reference',access:'selected_sections_reviewed',reviewedOn:'2026-09-30',
 reuse:'Conceptual basis only. New item text is original and has no empirical validation.'});await write(next.sources,sourceRegistry);
const ledger=await read(old.ledger);ledger.version='0.7.0';const federal=ledger.sources.find(s=>s.id==='audit-federalism');
federal.reviewedOn='2026-09-30';federal.claim='A federation ordinarily protects a territorial division of final authority at both levels so that neither can revoke the other’s powers unilaterally; this distinguishes it from revocable unitary decentralization and a weak, member-controlled confederation (section 1).';
federal.useByConstructs=[...(federal.useByConstructs??[]),'PL34'];
federal.useByItems.push(...additions.map(item=>item.id));federal.useByRules.push('reviewed-PL34-federal-division');
await write(next.ledger,ledger);
const model=await read(old.model);model.modelVersion='generic-1.3.0-pilot';model.bankVersion=bank.bankVersion;
model.registryVersion=registry.registryVersion;model.pilotInstrumentVersion='worldview-pilot-1.1.0';
model.parentModelVersion='generic-1.2.0-pilot';
const modelSource=model.sources.find(s=>s.id==='audit-federalism');
modelSource.reviewedOn='2026-09-30';modelSource.claim=federal.claim;
const proposition='National and regional governments should each have constitutionally protected powers that the other cannot withdraw unilaterally.';
const rule={id:'reviewed-PL34-federal-division',constructId:'PL34',label:proposition,
 sourceIds:['audit-federalism'],sourceClaims:[{sourceId:'audit-federalism',relationship:'supports',claim:federal.claim}],
 evidence:[{itemId:'PLI126',itemRevision:1,unitId:'PLI126',support:['entrenched'],oppose:['national_delegation']},
  {itemId:'PLI127',itemRevision:1,unitId:'PLI127',support:['respect_division'],oppose:['national_override']}],
 boundary:'A preference for decentralization, constitutional obedience, or regional veto alone does not establish this normative federal division. A preference in this hypothetical is not an identity label or a complete federal theory.',
 scope:proposition,proposition,layer:'reviewed_scoped_commitment',domainId:'PL',tier:'diagnostic',
 facetId:'political-authority',minimumEvidenceUnits:2,mappingStatus:'reviewed_new_content_v1',
 thresholdStatus:'authored_duplicate_control_not_psychometric',interpretationKind:'direct_interpretable_proposition',
 inferenceStatus:'direct',hypothesizedConstructId:'PL34',affinityCriterion:false,researchVariable:false,
 neighbors:['Revocable decentralization in a unitary state','Confederation with member-unit veto','General constitutional obedience'],
 nonEntailments:['Every decision should be local','The existing constitutional division is just','A specific country should adopt a federal constitution'],
 falsePositives:['Generic localism or dislike of central power cannot supply either direct answer.','Respect for the current constitution in one case cannot substitute for a normative choice of entrenched powers at both levels.'],
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward'}};
model.commitments.push(rule);model.publicRuleIds.push(rule.id);model.coverage.constructs.push({
 id:'PL34',name:registry.constructs.at(-1).name,domainId:'PL',type:'categorical',tier:'diagnostic',
 declaredSources:['audit-federalism'],ruleIds:[rule.id],candidateItemIds:additions.map(item=>item.id),
 status:'scoped_comparison_available',auditDecision:'new_reviewed_items',
 auditRationale:'The pair contrasts protected powers at both levels with revocable national delegation and member-unit veto. Two concordant direct responses are required.',
 disposition:'directly_interpretable',coverageGap:null});
model.coverage.version='0.10.0';
const full=await read(old.full);full.policyVersion='philosophy-pilot-1.3.0';full.parentPolicyVersion='philosophy-pilot-1.2.0';
full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;
full.sizes=[240];
const fullRefs=full.frozenItems;
const insert=(ref,index)=>{if(fullRefs.some(r=>r.itemId===ref.itemId))throw Error('Duplicate '+ref.itemId);fullRefs.splice(index,0,ref);};
insert({itemId:'PLI126',itemRevision:1},173);insert({itemId:'PLI127',itemRevision:1},219);
model.pilotRouteItemRefs=structuredClone(fullRefs);
full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:'PL',
 itemIds:additions.map(item=>item.id),itemRevisions:[1,1],evidenceUnits:['PLI126','PLI127']});
const facet=full.facets.find(f=>f.id==='political-authority');facet.ruleIds.push(rule.id);facet.bundleIds.push(rule.id+':full-route');
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);depth.policyVersion='progressive-depth-1.3.0';depth.bankVersion=bank.bankVersion;
depth.modelVersion=model.modelVersion;depth.instrumentVersion=model.pilotInstrumentVersion;
depth.pilotFormPolicyVersion=full.policyVersion;depth.selectionBasis='The 64 and 120 routes keep their exact items; the successor Full route adds two reviewed federal-division discriminators to the prior 238-item set. No shorter route inherits that proposition.';
for(const route of depth.routes){route.routeVersion=route.id+'-1.3.0';
 if(route.id==='full'){route.itemRefs=structuredClone(fullRefs);route.size=240;
  route.description='240 questions; the broadest authored coverage, including a scoped federal-division distinction.';
  route.assessableDirectRuleIds.push(rule.id);route.burden.items=240;}}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v1.3.manifest.json',{
 schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});
const research=await read('data/instruments/research-pool-0.9.json');research.instrumentVersion='0.10.0-research';
research.registryVersion=registry.registryVersion;research.bankVersion=bank.bankVersion;
research.nominalPoolSize=bank.items.length;research.entries=bank.items.map((item,index)=>({index,itemId:item.id,itemRevision:item.revision}));
await write('data/instruments/research-pool-0.10.json',research);
const runtimePilot=await read('data/pilots/pilot-0.2.json');
runtimePilot.pilotId='pilot-0.3';runtimePilot.bankVersion=bank.bankVersion;
runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.scoring.defaultEngineeringModelVersion=null;
runtimePilot.administration.note+=' No engineering scoring model is assigned to the successor bank.';
await write('data/pilots/pilot-0.3.json',runtimePilot);
const pilotInstrument=await read('data/instruments/worldview-pilot-v1.json');
pilotInstrument.instrumentVersion=model.pilotInstrumentVersion;pilotInstrument.registryVersion=registry.registryVersion;
pilotInstrument.bankVersion=bank.bankVersion;pilotInstrument.nominalPoolSize=240;
pilotInstrument.entries=fullRefs.map((ref,index)=>({index,...ref}));
await write('data/instruments/worldview-pilot-v1.1.json',pilotInstrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.1.0';
review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=240;
for(const item of additions)review.decisions.push({sourcePosition:review.decisions.length+1,itemId:item.id,itemRevision:1,
 domainId:'PL',targetConstructIds:['PL34'],mappedRuleIds:[rule.id],nearbyRouteItemIds:item.id==='PLI126'?['PLI003','PLI004']:['PLI126'],
 responseMethod:'single_choice',contribution:'independent_discriminator',decision:'retain_for_pilot',issue:null,
 rationale:item.id==='PLI126'?'States the protected-division choice against revocable delegation and member-unit control.':'Applies the two-level division in a rights-held-constant case; constitutional deference alone is guarded by the first item.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-1.3.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.3.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:model.modelVersion,instrumentVersion:model.pilotInstrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.3.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const prior=await read(locale.path),name=locale.locale==='en-US'?'en-US-v4.json':locale.locale+'-draft-v4.json';
 const newPath='data/localization/'+name,bundleVersion='localization-'+locale.locale+(locale.locale==='en-US'?'-1.3.0':'-draft-4');
 prior.bundleVersion=bundleVersion;prior.bankVersion=bank.bankVersion;prior.modelVersion=model.modelVersion;
 prior.affinityCatalogVersion=catalog.catalogVersion;
 if(locale.locale!=='en-US')prior.sourceNotes+=' PLI126/PLI127 and the PL34 proposition require translation and contextual review before activation.';
 await write(newPath,prior);locale.path=newPath;locale.bundleVersion=bundleVersion;
 bundles.push({locale:locale.locale,version:bundleVersion,path:newPath});}
await write(next.localization,localization);
const localizationHashes={};
for(const p of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[p]=await hash(p);
await write('data/localization/manifest-v1.3.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.3.0';
pilot.itemBank={version:bank.bankVersion,path:next.bank};pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;pilot.route.instrumentVersion=model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath='data/instruments/worldview-pilot-v1.1.json';pilot.route.assignedItems=240;
pilot.route.exactItemRevisions=structuredClone(fullRefs);pilot.route.domainCounts.PL+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds.push(rule.id);
pilot.interpretationRules.routeMeasuredDirectRuleIds.push(rule.id);
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),
 'data/instruments/worldview-pilot-v1.1.json':await hash('data/instruments/worldview-pilot-v1.1.json'),
 [next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),[next.sources]:await hash(next.sources)};
pilot.limitations.push('The federal-division pair is authored and source-backed; its wording and response behavior have not been empirically tested.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.9.json');academic.version='0.10.0';
academic.baseBankVersion='0.9.0';academic.reviewedOn='2026-09-30';academic.itemCount=bank.items.length;
academic.newItemCount=2;academic.registryEntries=registry.constructs.length;
academic.activeConstructCount=registry.constructs.filter(c=>c.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;academic.note='Two reviewed federal-division candidate items. Source-backed content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};
await write('data/academic/release-v0.10.json',academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.9.0';
experience.routes.find(r=>r.id==='full').size=240;
experience.routes.find(r=>r.id==='full').description='240 questions, including a new federal-division distinction; the broadest authored coverage.';
experience.routes.find(r=>r.id==='full').formPolicyVersion=full.policyVersion;
for(const r of experience.routes.filter(r=>r.id!=='full'))r.formPolicyVersion=depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:'data/experience/progressive-depth-v1.3.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The successor Full route extends the frozen 238-item pilot by two exact federal-division items; prior 238 and 240 releases remain reproducible.';
await write(next.experience,experience);
await write('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',current:{
 version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read('data/releases/channels-v5.json');channels.configVersion='worldview-release-channels-6.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.5.0';
await write('data/releases/channels-v6.json',channels);
await write('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:'data/releases/channels-v6.json'}});
const current=await read('data/current.json');
current.registryVersion=registry.registryVersion;
current.candidateBank={version:bank.bankVersion,path:next.bank};
current.registry={version:registry.registryVersion,path:next.registry};
current.sourceRegistry={version:'source-registry-1.1.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,manifestPath:'data/experience/progressive-depth-v1.3.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.contentReview={version:review.reviewVersion,path:next.review};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,manifestPath:'data/affinities/manifest-v1.3.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,manifestPath:'data/localization/manifest-v1.3.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.instrument={version:research.instrumentVersion,path:'data/instruments/research-pool-0.10.json'};
current.pilot={version:runtimePilot.pilotId,path:'data/pilots/pilot-0.3.json'};
current.academicRelease={version:academic.version,path:'data/academic/release-v0.10.json'};
current.releaseChannels={version:channels.configVersion,path:'data/releases/channels-v6.json'};
await write('data/current.json',current);
console.log('Built successor 564-item bank and 64/120/240 routes. Review and approve before release.');
