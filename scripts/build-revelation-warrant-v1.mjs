// Publish a narrower first-person revelation-warrant rule with a discriminator.
// Every predecessor artifact stays immutable for historical replay.
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
const old={bank:'data/items/candidate-v0.13.json',sources:'data/sources-v1.7.json',
 ledger:'data/generic/source-ledger-v0.13.json',model:'data/generic/model-v1.9-pilot.json',
 full:'data/philosophy/public-pilot-v1.9.json',depth:'data/experience/progressive-depth-v2.json',
 pilot:'data/pilots/pilot-candidate-v1.9.json',review:'data/pilots/content-review-v1.4.json',
 catalog:'data/affinities/catalog-v2.json',localization:'data/localization/catalog-v11.json',
 experience:'data/experience/policy-v1.16.json',channels:'data/releases/channels-v13.json'};
const next={bank:'data/items/candidate-v0.14.json',sources:'data/sources-v1.8.json',
 ledger:'data/generic/source-ledger-v0.14.json',model:'data/generic/model-v1.10-pilot.json',
 full:'data/philosophy/public-pilot-v1.10.json',depth:'data/experience/progressive-depth-v2.1.json',
 pilot:'data/pilots/pilot-candidate-v1.10.json',review:'data/pilots/content-review-v1.5.json',
 catalog:'data/affinities/catalog-v2.1.json',localization:'data/localization/catalog-v12.json',
 experience:'data/experience/policy-v1.17.json',channels:'data/releases/channels-v14.json',
 research:'data/instruments/research-pool-0.14.json',
 pilotInstrument:'data/instruments/worldview-pilot-v1.5.json',
 runtimePilot:'data/pilots/pilot-0.7.json',academic:'data/academic/release-v0.14.json'};
const newPaths=[...Object.values(next),
 'data/experience/progressive-depth-v2.1.manifest.json',
 'data/affinities/manifest-v2.1.json',
 'data/localization/manifest-v2.1.json',
 'data/localization/en-US-v12.json',
 'data/localization/es-ES-draft-v12.json',
 'data/localization/ar-draft-v12.json',
 'data/releases/model-release-v1.13.0.json'];
assert.equal(new Set(newPaths).size,newPaths.length,'Successor paths must be unique.');
const predecessor=await read('data/current.json');
assert.equal(predecessor.modelRelease?.version,'model-release-1.12.0');
for(const [key,file] of Object.entries(old)){
 const currentKey={bank:'candidateBank',sources:'sourceRegistry',ledger:'worldviewSourceLedger',
  model:'worldviewModel',full:'fullForm',depth:'progressiveDepth',pilot:'pilotCandidate',
  review:'contentReview',catalog:'affinityCatalog',localization:'localizationCatalog',
  experience:'quizExperience',channels:'releaseChannels'}[key];
 assert.equal(predecessor[currentKey]?.path,file,'Active predecessor changed for '+key);
}
for(const file of newPaths){
 try{await access(path.join(root,file));throw Error('Successor artifact already exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}
}
const proposition='An apparent divine revelation can sometimes give its experiencer an initial factual reason in favor of its content before independent verification, even if that reason may later be defeated.';
const sources=[
 {id:'sep-religious-experience-warrant',kind:'academic',
  title:'Stanford Encyclopedia of Philosophy: Religious Experience',
  url:'https://plato.stanford.edu/entries/religious-experience/',
  use:'Section 3 contrasts defeasible first-person experiential reasons with objections to the evidential value of religious experience.',
  claim:"A recognized account permits an apparent religious experience to give its subject defeasible initial grounds for a factual belief without independent verification; the subject's grounds and an outsider's testimonial grounds are distinct and disputed."},
 {id:'sep-divine-revelation-warrant',kind:'academic',
  title:'Stanford Encyclopedia of Philosophy: Divine Revelation',
  url:'https://plato.stanford.edu/entries/divine-revelation/',
  use:'Provides context for the epistemic status of putative divine revelation and distinctions among experiential, inferential, and testimonial accounts.',
  claim:'The epistemic status of putative revelation is disputed; revelation as an apparent communication is distinct from the truth of its content and from its authority for outsiders.'}
];
const record=s=>({...s,evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',
 reviewedOn:'2026-09-30',reuse:'Conceptual basis only; neither original question nor its evidence threshold is empirically validated.',
 validatesThisQuiz:false});
const item={id:'EPI122',revision:1,domainId:'EP',
 text:'A person has an experience that seems to them like a clear divine message about a factual matter. Before checking the claim independently, what weight should the experience itself have for that person?',
 responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'contrast',
 targets:[{constructId:'EP10',relation:'diagnostic',role:'primary'}],
 options:[
  {id:'initial_reason',label:'It can give the person an initial factual reason in favor of the message, even if later evidence could defeat it.'},
  {id:'investigation_only',label:'It can prompt investigation, but by itself gives the person no factual reason to think the message is true.'},
  {id:'depends_on_case',label:'That depends on further features of the experience or its context.'}
 ],mirrorGroup:null,scenarioGroup:'revelation-first-person-initial-warrant',eligibility:{mode:'always'},
 specialStates:['no_view','not_understood'],contentTags:['academic_contrast','ep10','first_person_warrant'],
 provenance:{origin:'original_project_draft',sourceRefs:sources.map(s=>s.id),
  license:{status:'undecided',spdx:null},copiedText:false},
 notes:'Asks only whether the experience can supply a defeasible initial factual reason to its subject. The contextual answer is nondirectional. No answer says the message is true, confers outsider/public warrant, or has moral or legal authority. Authored content; response processes and independence from EPI032 are untested.'};
const bank=await read(old.bank);
assert.equal(bank.bankVersion,'0.13.0');assert.equal(bank.items.length,567);
assert.ok(!bank.items.some(row=>row.id===item.id));
bank.bankVersion='0.14.0';bank.items.push(item);await write(next.bank,bank);
const sourceRegistry=await read(old.sources),ledger=await read(old.ledger);
ledger.version='0.14.0';
for(const s of sources){
 sourceRegistry.sources.push(record(s));
 ledger.sources.push({...record(s),useByRules:['audit2-EP10-revelation'],useByConstructs:['EP10'],
  useByItems:['EPI032','EPI122'],permissionToCopyItems:false,validatesOurItems:false,
  sourceRole:'signed_scholarly_synthesis',
  detailedUseLimit:'Supports the philosophical possibility of defeasible first-person warrant. It does not establish that any apparent revelation is veridical, public warrant follows, these items are independent, or the rule is empirically valid.'});
}
await write(next.sources,sourceRegistry);await write(next.ledger,ledger);
const model=await read(old.model),rule=model.commitments.find(row=>row.id==='audit2-EP10-revelation');
assert.equal(model.modelVersion,'generic-1.9.0-pilot');
assert.ok(rule&&rule.evidence.map(e=>e.itemId).join(',')==='EPI021,EPI032');
model.parentModelVersion=model.modelVersion;model.modelVersion='generic-1.10.0-pilot';
model.bankVersion=bank.bankVersion;model.pilotInstrumentVersion='worldview-pilot-1.5.0';
model.sources.push(...sources.map(record));
rule.scope=proposition;rule.proposition=proposition;rule.label='Defeasible first-person warrant from apparent revelation';
rule.sourceIds.push(...sources.map(s=>s.id));
rule.sourceClaims=sources.map(s=>({sourceId:s.id,
 relationship:s.id==='sep-religious-experience-warrant'?'supports':'context',claim:s.claim}));
rule.boundary='Only a possible defeasible initial factual reason for the experiencer is inferred. Neither the truth of the message nor substantial standalone justification, independent public or outsider warrant, religious identity, or moral/legal authority follows. EPI021 is excluded because its audience and threshold are ambiguous.';
rule.evidence=[
 {itemId:'EPI032',itemRevision:1,unitId:'EP-S05',support:['substantial','some'],oppose:['none']},
 {itemId:'EPI122',itemRevision:1,unitId:'EPI122',support:['initial_reason'],
  oppose:['investigation_only']}
];
rule.mappingStatus='source_reviewed_authored_rule_not_calibrated';
rule.interpretationKind='direct_interpretable_proposition';rule.inferenceStatus='direct';
rule.hypothesizedConstructId='EP10';rule.affinityCriterion=false;rule.researchVariable=false;
rule.neighbors=['Substantial standalone first-person justification','Outsider or public warrant',
 'Only a prompt to investigate','Context-dependent experiential warrant','Inferential or testimonial revelation'];
rule.nonEntailments=['An apparent message is actually divine or true','The respondent has had a revelation',
 'An outsider should believe the content','A revelation can ground public policy',
 'The message has moral or legal authority','Every religious experience provides warrant'];
rule.falsePositives=['EPI021 disagreement need not establish first-person initial warrant because the audience and sufficiency threshold are unspecified.',
 'EPI032 little justification is not a clean denial of all initial factual reasons.',
 'Accepting a reason to investigate is not the same as accepting a factual reason in favor of a message.',
 'Context-dependent warrant does not affirm or deny the unconditional case.'];
rule.missingEvidenceBehavior={notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',
 singleDirectionalUnit:'leaned_toward'};
const coverage=model.coverage.constructs.find(row=>row.id==='EP10');
assert.ok(coverage&&coverage.candidateItemIds.includes('EPI021'));
coverage.candidateItemIds.push('EPI122');coverage.declaredSources.push(...sources.map(s=>s.id));
coverage.auditDecision='versioned_defeasible_first_person_warrant_rule';
coverage.auditRationale='EPI021 has ambiguous audience and threshold. EPI032 and EPI122 ask for first-person factual reasons; some and substantial EPI032 responses support a modest initial warrant, while little and contextual answers stay nondirectional.';
coverage.coverageGap='Outsider/public warrant, substantial standalone justification, and inferential or testimonial revelation remain separate unmeasured or partially measured distinctions.';
model.coverage.version='0.14.0';
const comparison=model.comparisons.find(row=>row.id==='compare-audit2-EP10-revelation');
assert.ok(comparison);
comparison.label=proposition;comparison.scope=proposition;
comparison.sourceIds.push(...sources.map(s=>s.id));
comparison.limitations=[...rule.nonEntailments.map(value=>'Does not entail: '+value),
 'This is a narrow scoped proposition comparison, not a complete religious-epistemology identity.'];
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;
full.policyVersion='philosophy-pilot-1.10.0';full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;
full.instrumentVersion=model.pilotInstrumentVersion;
const swap=refs=>{const pos=refs.findIndex(ref=>ref.itemId==='EPI021'&&ref.itemRevision===1);
 assert.ok(pos>=0&&!refs.some(ref=>ref.itemId==='EPI122'));
 refs[pos]={itemId:'EPI122',itemRevision:1};};
swap(full.frozenItems);model.pilotRouteItemRefs=structuredClone(full.frozenItems);
const bundle=full.bundles.find(row=>row.commitmentId==='audit2-EP10-revelation');
assert.ok(bundle&&bundle.itemIds.join(',')==='EPI021,EPI032');
bundle.itemIds=['EPI032','EPI122'];bundle.itemRevisions=[1,1];bundle.evidenceUnits=['EP-S05','EPI122'];
const facet=full.facets.find(row=>row.ruleIds.includes('audit2-EP10-revelation'));
assert.ok(facet);facet.title=proposition;facet.question=proposition;
await write(next.model,model);await write(next.full,full);
const depth=await read(old.depth);assert.equal(depth.policyVersion,'progressive-depth-2.0.0');
depth.policyVersion='progressive-depth-2.1.0';
depth.bankVersion=bank.bankVersion;depth.modelVersion=model.modelVersion;
depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.1.0';
depth.selectionBasis='The 64/120/243 authored routes replace EPI021@1 with EPI122@1 while keeping EPI032@1. Historical routes remain pinned. The new choice separates defeasible first-person factual warrant from a mere prompt to investigate and context-dependent cases; public or outsider warrant remains unmeasured.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.1.0';
 if(route.id==='full')route.itemRefs=structuredClone(full.frozenItems);else swap(route.itemRefs);}
await write(next.depth,depth);
await write('data/experience/progressive-depth-v2.1.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});
const research=await read('data/instruments/research-pool-0.13.json');
research.instrumentVersion='0.14.0-research';research.bankVersion=bank.bankVersion;
research.nominalPoolSize=bank.items.length;
research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));
await write(next.research,research);
const runtimePilot=await read('data/pilots/pilot-0.6.json');runtimePilot.pilotId='pilot-0.7';
runtimePilot.bankVersion=bank.bankVersion;runtimePilot.sourceInstrumentVersion=research.instrumentVersion;
runtimePilot.administration.note+=' The 0.14 research pool includes EPI122@1; the public routes replace EPI021@1 in a separate versioned release.';
await write(next.runtimePilot,runtimePilot);
const instrument=await read('data/instruments/worldview-pilot-v1.4.json');
instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.bankVersion=bank.bankVersion;
instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));
await write(next.pilotInstrument,instrument);
const review=await read(old.review);review.reviewVersion='pilot-content-review-1.5.0';
review.sourceFormPolicyVersion=full.policyVersion;
review.decisions.push({sourcePosition:review.decisions.length+1,itemId:'EPI122',itemRevision:1,
 domainId:'EP',targetConstructIds:['EP10'],mappedRuleIds:['audit2-EP10-revelation'],
 nearbyRouteItemIds:['EPI021','EPI032','EPI120'],responseMethod:'single_choice',
 contribution:'first_person_initial_warrant_discriminator',decision:'retain_for_pilot',issue:null,
 rationale:'Tests whether an apparent divine message gives its experiencer a defeasible initial factual reason, no such reason, or depends on further features. EPI021 has ambiguous audience and threshold; EPI120 remains an unreleased stronger-warrant draft.',
 resultUse:'only_through_explicit_interpretation_rules'});
await write(next.review,review);
const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.1.0';
catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);
await write('data/affinities/manifest-v2.1.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});
const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.1.0';
localization.canonicalBankVersion=bank.bankVersion;localization.modelVersion=model.modelVersion;
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v12.json':locale.locale+'-draft-v12.json');
 const version='localization-'+locale.locale+(en?'-2.1.0':'-draft-12');
 bundle.bundleVersion=version;bundle.bankVersion=bank.bankVersion;
 bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' EPI122@1 and the revised first-person revelation-warrant proposition require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v2.1.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.10.0';
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
pilot.limitations.push('EP10 now concerns possible defeasible first-person initial warrant only; EPI032 and EPI122 are not empirically independent or calibrated, and outsider/public warrant remains unmeasured.');
await write(next.pilot,pilot);
const academic=await read('data/academic/release-v0.13.json');academic.version='0.14.0';
academic.baseBankVersion='0.13.0';academic.reviewedOn='2026-09-30';academic.itemCount=bank.items.length;
academic.newItemCount=1;academic.newConstructCount=0;
academic.note='One first-person revelation-warrant discriminator; versioned route substitution and a narrower evidence rule. Authored content, not empirical validation.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[pilot.constructRegistry.path]:await hash(pilot.constructRegistry.path)};
await write(next.academic,academic);
const experience=await read(old.experience);experience.experienceVersion='quiz-1.17.0';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v2.1.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The authored 64/120/243 route lengths stay fixed. Each route substitutes a first-person initial revelation-warrant discriminator for an audience-ambiguous item.';
await write(next.experience,experience);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-14.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.13.0';
await write(next.channels,channels);
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});
const current=await read('data/current.json');
current.candidateBank={version:bank.bankVersion,path:next.bank};
current.instrument={version:research.instrumentVersion,path:next.research};
current.pilot={version:runtimePilot.pilotId,path:next.runtimePilot};
current.academicRelease={version:academic.version,path:next.academic};
current.sourceRegistry={version:'source-registry-1.8.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:full.policyVersion,path:next.full};
current.progressiveDepth={version:depth.policyVersion,path:next.depth,
 manifestPath:'data/experience/progressive-depth-v2.1.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.contentReview={version:review.reviewVersion,path:next.review};
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,
 manifestPath:'data/affinities/manifest-v2.1.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v2.1.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',current);
console.log('Prepared EPI122@1 and a versioned first-person revelation-warrant rule on 64/120/243 routes.');
