// Bind two reviewed criterion comparisons to the existing 1.8 proposition layer.
// Historical definitions remain at their original versioned paths.
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const old={catalog:'data/affinities/catalog-v1.6.json',routes:'data/experience/progressive-depth-v1.6.json',
 localization:'data/localization/catalog-v7.json',experience:'data/experience/policy-v1.12.json',
 channels:'data/releases/channels-v9.json'};
const next={catalog:'data/affinities/catalog-v1.7.json',routes:'data/experience/progressive-depth-v1.7.json',
 localization:'data/localization/catalog-v8.json',experience:'data/experience/policy-v1.13.json',
 channels:'data/releases/channels-v10.json'};
const model=await read('data/generic/model-v1.6-pilot.json');
const claims=[
 {id:'sep-act-consequence-criterion',title:'Stanford Encyclopedia of Philosophy: Consequentialism',
  url:'https://plato.stanford.edu/entries/consequentialism/',
  claim:model.commitments.find(row=>row.id==='reviewed-NE22-act-consequence-criterion')?.sourceClaims?.[0]?.claim},
 {id:'sep-rule-consequence-criterion',title:'Stanford Encyclopedia of Philosophy: Rule Consequentialism',
  url:'https://plato.stanford.edu/entries/consequentialism-rule/',
  claim:model.commitments.find(row=>row.id==='reviewed-NE23-rule-consequence-criterion')?.sourceClaims?.[0]?.claim}
];
if(claims.some(row=>!row.claim))throw Error('Pinned public consequence claims are unavailable.');
const link=source=>({sourceId:source.id,relationship:'supports',claim:source.claim});
const catalog=await read(old.catalog);
if(catalog.traditions.length!==9)throw Error('Unexpected predecessor catalog.');
catalog.catalogVersion='philosophical-affinity-1.7.0';
catalog.sources.push(...claims.map(({id,title,url})=>({id,type:'academic_secondary',title,url})));
catalog.traditions.push({
 id:'act-consequentialism-scoped',name:'Act consequentialism (scoped criterion)',scope:'ethical_theory',
 context:'A comparison with a direct, maximizing act-rightness criterion in the administered cases. It is not an attribution of a complete consequentialist or utilitarian ethical theory.',
 identityClaimAllowed:false,primarySourceIds:[],secondarySourceIds:[claims[0].id],
 sourceNotes:'SEP separates direct act assessment, maximization, value theory, aggregation, and decision procedure. The pilot bears only on the stated criterion in two cases.',
 sourceClaims:[link(claims[0])],
 neighbors:['rule consequentialism','satisficing consequentialism','deontological constraints','generic concern for outcomes'],
 discriminators:['A consequence-justified rule may guide decisions while the act itself remains the rightness criterion; a rule as the criterion is different.',
  'Concern for consequences does not establish that they alone determine rightness or that a dominated act is impermissible.'],
 nonEntailments:['This overlap does not establish utilitarianism, welfarism, hedonism, or impartial aggregation.',
  'It does not prescribe calculating consequences before each decision or identify the respondent as an act consequentialist.'],
 commitments:[
  {id:'direct-maximizing-act-criterion',role:'defining',
   doctrine:model.commitments.find(row=>row.id==='reviewed-NE22-act-consequence-criterion').proposition,
   sourceIds:[claims[0].id],sourceClaims:[link(claims[0])],
   mapping:{status:'direct',propositionId:'reviewed-NE22-act-consequence-criterion',expectedState:'supported',
    note:'NEI122@1 contrasts the act with a rule criterion; NEI014@1 checks whether a worse outcome for everyone can be permissible. Both evidence units are required.'}},
  {id:'goods-promoted-by-acts',role:'characteristic',
   doctrine:'Different act-consequentialist theories identify different goods and ways of comparing outcomes.',
   sourceIds:[claims[0].id],sourceClaims:[link(claims[0])],
   mapping:{status:'not_measured',note:'The reviewed act criterion does not settle welfare, plural goods, aggregation, or distribution.'}},
  {id:'actual-expected-and-deliberation',role:'disputed',
   doctrine:'Act consequentialists differ over actual versus expected consequences and the appropriate decision procedure.',
   sourceIds:[claims[0].id],sourceClaims:[link(claims[0])],
   mapping:{status:'not_measured',note:'The pilot does not settle these internal variations.'}}
 ]});
catalog.traditions.push({
 id:'rule-consequentialism-scoped',name:'Rule consequentialism (scoped criterion)',scope:'ethical_theory',
 context:'A comparison with the conjunction of a consequence-justified rule and a rule-based criterion of act rightness. The item pair does not specify a complete code or every formulation of rule consequentialism.',
 identityClaimAllowed:false,primarySourceIds:[],secondarySourceIds:[claims[1].id],
 sourceNotes:'SEP distinguishes full rule-based wrongness from rule-guided decision procedures with an act criterion, and separates wrongness from deliberation and sanctions.',
 sourceClaims:[link(claims[1])],
 neighbors:['act consequentialism','deontological rule constraints','contractualist rule justification','rule-guided decision procedure'],
 discriminators:['A useful consequence-justified rule does not establish that conformity to it determines an act’s rightness.',
  'An independent duty can support the same rule without making its ultimate justification consequential.'],
 nonEntailments:['This overlap does not establish utilitarianism, welfarism, or a particular theory of value.',
  'It does not settle the optimal code, exceptions, sanctions, or the respondent’s philosophical identity.'],
 commitments:[
  {id:'consequence-justified-rule-criterion',role:'defining',
   doctrine:model.commitments.find(row=>row.id==='reviewed-NE23-rule-consequence-criterion').proposition,
   sourceIds:[claims[1].id],sourceClaims:[link(claims[1])],
   mapping:{status:'direct',propositionId:'reviewed-NE23-rule-consequence-criterion',expectedState:'supported',
    note:'NEI122@1 asks whether the rule determines this act’s rightness; NEI123@1 asks whether consequences ultimately justify the rule. Both evidence units are required.'}},
  {id:'which-rules-and-which-goods',role:'characteristic',
   doctrine:'A full account specifies how consequences select a code of rules and what goods the code promotes.',
   sourceIds:[claims[1].id],sourceClaims:[link(claims[1])],
   mapping:{status:'not_measured',note:'One harm-rule question does not select a general code or theory of value.'}},
  {id:'compliance-acceptance-and-sanctions',role:'disputed',
   doctrine:'Rule consequentialists dispute compliance versus acceptance formulations, exceptions, and the role of sanctions.',
   sourceIds:[claims[1].id],sourceClaims:[link(claims[1])],
   mapping:{status:'not_measured',note:'The pilot does not distinguish these versions.'}}
 ]});
await write(next.catalog,catalog);
await write('data/affinities/manifest-v1.7.json',{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog),
 modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,
 affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const routes=await read(old.routes);routes.policyVersion='progressive-depth-1.7.0';
routes.affinityCatalogVersion=catalog.catalogVersion;
routes.selectionBasis='All 64/120/243 exact item revisions and order remain unchanged. The successor policy binds two scoped consequence-criterion comparisons to already interpreted propositions.';
for(const route of routes.routes)route.routeVersion=route.id+'-1.7.0';
await write(next.routes,routes);
await write('data/experience/progressive-depth-v1.7.manifest.json',{schemaVersion:'immutable-content-manifest-1',
 policyVersion:routes.policyVersion,path:next.routes,sha256:await hash(next.routes)});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-1.7.0';
localization.affinityCatalogVersion=catalog.catalogVersion;
const bundles=[];
for(const locale of localization.locales){
 const bundle=await read(locale.path),en=locale.locale==='en-US';
 const file='data/localization/'+(en?'en-US-v8.json':locale.locale+'-draft-v8.json');
 const version='localization-'+locale.locale+(en?'-1.7.0':'-draft-8');
 bundle.bundleVersion=version;bundle.affinityCatalogVersion=catalog.catalogVersion;
 if(!en)bundle.sourceNotes+=' The two scoped consequence-criterion comparisons require linguistic and philosophical review before public use.';
 await write(file,bundle);locale.path=file;locale.bundleVersion=version;
 bundles.push({locale:locale.locale,version,path:file});
}
await write(next.localization,localization);
const localizationHashes={};
for(const file of [next.localization,'data/localization/terminology-review-v1.json',...bundles.map(row=>row.path)])
 localizationHashes[file]=await hash(file);
await write('data/localization/manifest-v1.7.json',{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:localization.catalogVersion,hashes:localizationHashes});

const experience=await read(old.experience);experience.experienceVersion='quiz-1.13.0';
experience.formPolicies.push({version:routes.policyVersion,path:next.routes});
for(const route of experience.routes)if(route.id!=='full')route.formPolicyVersion=routes.policyVersion;
experience.progressivePolicy={version:routes.policyVersion,path:next.routes,
 manifestPath:'data/experience/progressive-depth-v1.7.manifest.json'};
experience.localizationCatalogVersion=localization.catalogVersion;
experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='The authored 64/120/243 item sets are unchanged. Only Full can support the new scoped consequence-criterion comparisons; Quick and Standard leave them not measured.';
await write(next.experience,experience);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',
 current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-10.0.0';
for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.9.0';
await write(next.channels,channels);
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',
 current:{version:channels.configVersion,path:next.channels}});

const current=await read('data/current.json');
current.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,manifestPath:'data/affinities/manifest-v1.7.json'};
current.progressiveDepth={version:routes.policyVersion,path:next.routes,manifestPath:'data/experience/progressive-depth-v1.7.manifest.json'};
current.localizationCatalog={version:localization.catalogVersion,path:next.localization,manifestPath:'data/localization/manifest-v1.7.json'};
current.localizationBundles=bundles;
current.quizExperience={version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'};
current.releaseChannels={version:channels.configVersion,path:next.channels};
await replace('data/current.json',current);
console.log('Prepared two scoped consequence-criterion comparisons with unchanged items, rules, and 64/120/243 route content.');
