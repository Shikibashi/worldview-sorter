// Assemble a successor release from pinned 1.5 content. Never edit old artifacts.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');};
const sourceDefinitions=[
 {id:'iep-fallibilism',title:'Internet Encyclopedia of Philosophy: Fallibilism',url:'https://iep.utm.edu/fallibil/',
  use:'Formulating fallible knowledge and distinguishing it from skepticism and mere belief revision.',
  claim:'Fallibilistic knowledge can be knowledge even when its justification does not conclusively eliminate possible error; this need not imply skepticism.'},
 {id:'sep-rationalism-empiricism',title:'Stanford Encyclopedia of Philosophy: Rationalism vs. Empiricism',
  url:'https://plato.stanford.edu/entries/rationalism-empiricism/',
  use:'Sections 1.1–1.2: experience as the source of knowledge about the external world, with reasoning still able to organize it.',
  claim:'A subject-scoped empiricist thesis about the external world makes experiential evidence the ultimate source of knowledge of external facts, without excluding reasoning about that evidence.'}
];
const targets=[
 {ruleId:'construct-EP15',constructId:'EP15',sourceId:'iep-fallibilism',
  proposition:'A claim can count as knowledge even when its justification leaves open a possibility of error.',
  itemIds:['EPI100','EPI101','EPI102']},
 {ruleId:'construct-EP20',constructId:'EP20',sourceId:'sep-rationalism-empiricism',
  proposition:'Knowledge claims about concrete external reality ultimately require experiential evidence; reasoning alone cannot establish new external-world facts.',
  itemIds:['EPI115','EPI116','EPI117']}
];
const old={sources:'data/sources-v1.1.json',ledger:'data/generic/source-ledger-v0.7.json',
 model:'data/generic/model-v1.3-pilot.json',form:'data/philosophy/public-pilot-v1.3.json',
 routes:'data/experience/progressive-depth-v1.3.json',pilot:'data/pilots/pilot-candidate-v1.3.json',
 affinity:'data/affinities/catalog-v1.3.json',localization:'data/localization/catalog-v4.json',
 experience:'data/experience/policy-v1.9.json',channels:'data/releases/channels-v6.json'};
const next={sources:'data/sources-v1.2.json',ledger:'data/generic/source-ledger-v0.8.json',
 model:'data/generic/model-v1.4-pilot.json',form:'data/philosophy/public-pilot-v1.4.json',
 routes:'data/experience/progressive-depth-v1.4.json',pilot:'data/pilots/pilot-candidate-v1.4.json',
 affinity:'data/affinities/catalog-v1.4.json',localization:'data/localization/catalog-v5.json',
 experience:'data/experience/policy-v1.10.json',channels:'data/releases/channels-v7.json'};

const sources=await read(old.sources),ledger=await read(old.ledger),model=await read(old.model);
ledger.version='0.8.0';model.modelVersion='generic-1.4.0-pilot';model.parentModelVersion='generic-1.3.0-pilot';
for(const source of sourceDefinitions){
 const target=targets.find(row=>row.sourceId===source.id);
 const record={id:source.id,kind:'academic',title:source.title,url:source.url,use:source.use,
  evidenceType:'signed_scholarly_synthesis',access:'selected_sections_reviewed',reviewedOn:'2026-09-30',
  reuse:'Conceptual basis only; the original questions are not empirically validated.'};
 sources.sources.push(record);
 ledger.sources.push({...record,claim:source.claim,useByRules:[target.ruleId],
  useByConstructs:[target.constructId],useByItems:target.itemIds,
  permissionToCopyItems:false,validatesOurItems:false,sourceRole:'signed_scholarly_synthesis',
  detailedUseLimit:'Only the stated scope and conceptual contrast are relied on.'});
 model.sources.push({...record,claim:source.claim});
 const rule=model.commitments.find(row=>row.id===target.ruleId);
 if(!rule||rule.evidence.map(row=>row.itemId).sort().join()!==[...target.itemIds].sort().join())
  throw Error('Unexpected active evidence for '+target.ruleId);
 rule.proposition=target.proposition;
 rule.sourceIds=[...new Set([...rule.sourceIds,source.id])];
 rule.sourceClaims=[{sourceId:source.id,relationship:'supports',claim:source.claim}];
}
await write(next.sources,sources);await write(next.ledger,ledger);await write(next.model,model);

const catalog=await read(old.affinity);
catalog.catalogVersion='philosophical-affinity-1.4.0';catalog.modelVersion=model.modelVersion;
catalog.sources.push(...sourceDefinitions.map(source=>({id:source.id,type:'academic_secondary',title:source.title,url:source.url})));
catalog.traditions.push({
 id:'fallibilism-about-knowledge',name:'Fallible knowledge',scope:'epistemological_tradition',
 context:'A scoped comparison concerning whether knowledge can rest on justification that leaves a possibility of error. This does not attribute a complete epistemology or claim that every belief is fallible.',
 identityClaimAllowed:false,primarySourceIds:[],secondarySourceIds:['iep-fallibilism'],
 sourceNotes:'IEP distinguishes fallibilistic knowledge from skepticism. The pilot asks whether fallible justification can sometimes suffice; it does not test a universal thesis that no belief can be conclusively justified.',
 sourceClaims:[{sourceId:'iep-fallibilism',relationship:'supports',claim:sourceDefinitions[0].claim}],
 neighbors:['infallibilism about knowledge','skepticism','pragmatism','ordinary willingness to revise'],
 discriminators:['Willingness to revise an opinion does not answer whether fallible justification can count as knowledge.',
  'Pragmatism also requires a method of clarifying ideas through conceivable consequences.'],
 nonEntailments:['Fallible knowledge does not entail skepticism or that usefulness makes a belief true.',
  'It does not entail pragmatism or the impossibility of any infallible belief.'],
 commitments:[
  {id:'fallible-knowledge-can-count',role:'defining',doctrine:targets[0].proposition,
   sourceIds:['iep-fallibilism'],sourceClaims:[{sourceId:'iep-fallibilism',relationship:'supports',claim:sourceDefinitions[0].claim}],
   mapping:{status:'direct',propositionId:'construct-EP15',expectedState:'supported',
    note:'EPI100–102 bear on fallible justification and knowledge, not just personal openness to changing opinions.'}},
  {id:'revisable-inquiry',role:'characteristic',doctrine:'Inquiry can improve by revisiting claims when new evidence arrives.',
   sourceIds:['iep-fallibilism'],sourceClaims:[{sourceId:'iep-fallibilism',relationship:'supports',claim:'Belief revision is a common practice compatible with fallibilism, but not its defining knowledge thesis.'}],
   mapping:{status:'not_measured',note:'The public fallibilism criterion must not be filled from generic belief revision.'}},
  {id:'scope-of-infallibility',role:'disputed',doctrine:'Which, if any, kinds of belief can enjoy infallible justification is debated.',
   sourceIds:['iep-fallibilism'],sourceClaims:[{sourceId:'iep-fallibilism',relationship:'supports',claim:'The scope of the no-conclusive-justification thesis is disputed across versions of fallibilism.'}],
   mapping:{status:'not_measured',note:'The pilot does not classify all domains of belief by possible infallibility.'}}
 ]
});
catalog.traditions.push({
 id:'sensory-empiricism-about-the-external-world',name:'Experience grounded external-world knowledge',
 scope:'epistemological_tradition',
 context:'A subject-scoped empiricist comparison about factual knowledge of the concrete external world. It is not a claim that all knowledge, concepts, mathematics, or moral truths arise from the senses.',
 identityClaimAllowed:false,primarySourceIds:[],secondarySourceIds:['sep-rationalism-empiricism'],
 sourceNotes:'SEP treats empiricism and rationalism as subject-relative and warns against treating historical thinkers as pure types. The item bundle asks about external facts, not every possible subject.',
 sourceClaims:[{sourceId:'sep-rationalism-empiricism',relationship:'supports',claim:sourceDefinitions[1].claim}],
 neighbors:['a priori rationalism about external facts','trust in scientific institutions','Objectivist reason and perception','global empiricism'],
 discriminators:['Trust in science does not establish that experience is the ultimate source of external-world knowledge.',
  'Reasoning from experience remains compatible; a claim to know new external facts by pure reason is the key counterposition.'],
 nonEntailments:['This position does not entail atheism, physicalism, or that mathematics has no a priori warrant.',
  'It does not entail that observation alone is sufficient without reasoning or that every historical empiricist holds the same view.'],
 commitments:[
  {id:'experience-grounds-external-facts',role:'defining',doctrine:targets[1].proposition,
   sourceIds:['sep-rationalism-empiricism'],sourceClaims:[{sourceId:'sep-rationalism-empiricism',relationship:'supports',claim:sourceDefinitions[1].claim}],
   mapping:{status:'direct',propositionId:'construct-EP20',expectedState:'supported',
    note:'EPI115–117 address experiential grounding and directly oppose pure-reason knowledge of new external facts.'}},
  {id:'origin-of-all-concepts',role:'characteristic',doctrine:'Experience is the ultimate source of concepts used to describe the external world.',
   sourceIds:['sep-rationalism-empiricism'],sourceClaims:[{sourceId:'sep-rationalism-empiricism',relationship:'supports',claim:'The SEP Empiricism Thesis includes subject-relative claims about concepts as well as knowledge.'}],
   mapping:{status:'not_measured',note:'The pilot asks about factual warrant, not the origin of all external-world concepts.'}},
  {id:'experience-beyond-external-facts',role:'disputed',doctrine:'Empiricists differ about how far experience constrains mathematics, morality, and other domains.',
   sourceIds:['sep-rationalism-empiricism'],sourceClaims:[{sourceId:'sep-rationalism-empiricism',relationship:'supports',claim:'The SEP discussion distinguishes subject areas and notes that historical figures need not fit one pure camp.'}],
   mapping:{status:'not_measured',note:'These wider subject areas are outside this scoped comparison.'}}
 ]
});
await write(next.affinity,catalog);
await write('data/affinities/manifest-v1.4.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.affinity,sha256:await hash(next.affinity),
 modelVersion:model.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const form=await read(old.form);form.policyVersion='philosophy-pilot-1.4.0';form.parentPolicyVersion='philosophy-pilot-1.3.0';
form.modelVersion=model.modelVersion;await write(next.form,form);
const routes=await read(old.routes);routes.policyVersion='progressive-depth-1.4.0';routes.modelVersion=model.modelVersion;
routes.affinityCatalogVersion=catalog.catalogVersion;routes.pilotFormPolicyVersion=form.policyVersion;
routes.selectionBasis='Exact 64/120/240 item revisions and order are preserved. This successor binds the reviewed epistemic comparisons to their source-backed propositions; no item was added.';
for(const route of routes.routes)route.routeVersion=route.id+'-1.4.0';
await write(next.routes,routes);
await write('data/experience/progressive-depth-v1.4.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:routes.policyVersion,path:next.routes,sha256:await hash(next.routes)});
const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.4.0';
pilot.route.version=form.policyVersion;pilot.route.path=next.form;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.frozenArtifactHashes={...pilot.frozenArtifactHashes,[next.model]:await hash(next.model),[next.form]:await hash(next.form)};
delete pilot.frozenArtifactHashes[old.model];delete pilot.frozenArtifactHashes[old.form];
pilot.sourceHashes={...pilot.sourceHashes,[next.sources]:await hash(next.sources)};delete pilot.sourceHashes[old.sources];
pilot.limitations.push('The two scoped epistemic comparisons use authored direct propositions; they do not establish philosophical identity or empirical validity.');
await write(next.pilot,pilot);

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.4.0';
localization.modelVersion=model.modelVersion;localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){
 const bundle=await read(locale.path),isEnglish=locale.locale==='en-US';
 const version='localization-'+locale.locale+(isEnglish?'-1.4.0':'-draft-5');
 const file='data/localization/'+(isEnglish?'en-US-v5.json':locale.locale+'-draft-v5.json');
 bundle.bundleVersion=version;bundle.modelVersion=model.modelVersion;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!isEnglish)bundle.sourceNotes+=' The two new epistemic comparison entries need linguistic and philosophical review before use.';
 await write(file,bundle);locale.bundleVersion=version;locale.path=file;
 bundles.push({locale:locale.locale,version,path:file});
}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(b=>b.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.4.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const experience=await read(old.experience);experience.experienceVersion='quiz-1.10.0';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?form.policyVersion:routes.policyVersion;
experience.formPolicies.push({version:form.policyVersion,path:next.form},{version:routes.policyVersion,path:next.routes});
experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
experience.progressivePolicy={version:routes.policyVersion,path:next.routes,
 manifestPath:'data/experience/progressive-depth-v1.4.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The same authored 64/120/240 item sets remain. The new catalog is scoped to direct epistemic propositions and does not increase questionnaire burden.';
await write(next.experience,experience);
await write('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
const channels=await read(old.channels);channels.configVersion='worldview-release-channels-7.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.6.0';
await write(next.channels,channels);
await write('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});

const current=await read('data/current.json');
current.sourceRegistry={version:'source-registry-1.2.0',path:next.sources};
current.worldviewSourceLedger={version:ledger.version,path:next.ledger};
current.worldviewModel={version:model.modelVersion,path:next.model};
current.fullForm={version:form.policyVersion,path:next.form};
current.progressiveDepth={version:routes.policyVersion,path:next.routes,
 manifestPath:'data/experience/progressive-depth-v1.4.manifest.json'};
current.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};
current.affinityCatalog={version:catalog.catalogVersion,path:next.affinity,manifestPath:'data/affinities/manifest-v1.4.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,
 manifestPath:'data/localization/manifest-v1.4.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
current.engineSource={version:'engine-source-1.4.0',
 path:'data/releases/engine-sources/engine-source-1.4.0/manifest.json'};
await write('data/current.json',current);
console.log('Prepared two scoped epistemic comparisons from six existing item revisions; no item set changed.');
