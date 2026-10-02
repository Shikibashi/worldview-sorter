import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {currentFromManifest,readJson,verifyRelease} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const index=await readJson(root,'data/releases/current.json');
if(index.schemaVersion!=='model-release-index-1'||!index.versions.some(ref=>ref.version===index.current.version&&ref.path===index.current.path))
 throw Error('Invalid model release index.');
const channelIndex=await readJson(root,'data/releases/channels-current.json');
if(channelIndex.schemaVersion!=='worldview-release-channel-index-1'||
 !/^data\/releases\/channels-v[0-9]+\.json$/.test(channelIndex.current?.path))
 throw Error('Invalid release-channel index.');
const [current,manifest,channels]=await Promise.all([readJson(root,'data/current.json'),
 readJson(root,index.current.path),readJson(root,channelIndex.current.path)]);
if(channels.configVersion!==channelIndex.current.version||
 channels.channels?.stable?.modelReleaseVersion!==index.current.version)
 throw Error('Release channels do not target the active model release.');
const pinned=currentFromManifest(manifest);
Object.assign(current,pinned);
// The research-pool and academic-release pointers are operational companions
// to this bank. Historical pool artifacts remain at their original paths.
if(pinned.candidateBank.version==='0.10.0'){
 current.instrument={version:'0.10.0-research',path:'data/instruments/research-pool-0.10.json'};
 current.academicRelease={version:'0.10.0',path:'data/academic/release-v0.10.json'};
 current.pilot={version:'pilot-0.3',path:'data/pilots/pilot-0.3.json'};
}
if(pinned.candidateBank.version==='0.11.0'){
 current.instrument={version:'0.11.0-research',path:'data/instruments/research-pool-0.11.json'};
 current.academicRelease={version:'0.11.0',path:'data/academic/release-v0.11.json'};
 current.pilot={version:'pilot-0.4',path:'data/pilots/pilot-0.4.json'};
}
if(pinned.candidateBank.version==='0.12.0'){
 current.instrument={version:'0.12.0-research',path:'data/instruments/research-pool-0.12.json'};
 current.academicRelease={version:'0.12.0',path:'data/academic/release-v0.12.json'};
 current.pilot={version:'pilot-0.5',path:'data/pilots/pilot-0.5.json'};
}
if(pinned.candidateBank.version==='0.13.0'){
 current.instrument={version:'0.13.0-research',path:'data/instruments/research-pool-0.13.json'};
 current.academicRelease={version:'0.13.0',path:'data/academic/release-v0.13.json'};
 current.pilot={version:'pilot-0.6',path:'data/pilots/pilot-0.6.json'};
}
if(pinned.candidateBank.version==='0.14.0'){
 current.instrument={version:'0.14.0-research',path:'data/instruments/research-pool-0.14.json'};
 current.academicRelease={version:'0.14.0',path:'data/academic/release-v0.14.json'};
 current.pilot={version:'pilot-0.7',path:'data/pilots/pilot-0.7.json'};
}
if(pinned.candidateBank.version==='0.15.0'){
 current.instrument={version:'0.15.0-research',path:'data/instruments/research-pool-0.15.json'};
 current.academicRelease={version:'0.15.0',path:'data/academic/release-v0.15.json'};
 current.pilot={version:'pilot-0.8',path:'data/pilots/pilot-0.8.json'};
}
if(pinned.candidateBank.version==='0.16.0'){
 current.instrument={version:'0.16.0-research',path:'data/instruments/research-pool-0.16.json'};
 current.academicRelease={version:'0.16.0',path:'data/academic/release-v0.16.json'};
 current.pilot={version:'pilot-0.9',path:'data/pilots/pilot-0.9.json'};
}
if(pinned.candidateBank.version==='0.17.0'){
 current.instrument={version:'0.17.0-research',path:'data/instruments/research-pool-0.17.json'};
 current.academicRelease={version:'0.17.0',path:'data/academic/release-v0.17.json'};
 current.pilot={version:'pilot-0.10',path:'data/pilots/pilot-0.10.json'};
}
if(pinned.candidateBank.version==='0.18.0'){
 current.instrument={version:'0.18.0-research',path:'data/instruments/research-pool-0.18.json'};
 current.academicRelease={version:'0.18.0',path:'data/academic/release-v0.18.json'};
 current.pilot={version:'pilot-0.11',path:'data/pilots/pilot-0.11.json'};
}
if(pinned.candidateBank.version==='0.19.0'){
 current.instrument={version:'0.19.0-research',path:'data/instruments/research-pool-0.19.json'};
 current.academicRelease={version:'0.19.0',path:'data/academic/release-v0.19.json'};
 current.pilot={version:'pilot-0.12',path:'data/pilots/pilot-0.12.json'};
}
// Coverage is embedded in the pinned model. An older standalone audit snapshot
// must not be advertised as coverage for the active release.
delete current.worldviewCoverage;
const history=await Promise.all(index.versions.map(ref=>readJson(root,ref.path)));
const catalogHistory=(key,manifestKey)=>{
 const byVersion=new Map();
 for(const release of history){const artifact=release.components.find(component=>component.key===key),
  artifactManifest=release.components.find(component=>component.key===manifestKey);
  if(!artifact||!artifactManifest)throw Error('Historical release lacks '+key+' version tuple.');
  const ref={version:artifact.version,path:artifact.path,manifestPath:artifactManifest.path};
  const prior=byVersion.get(ref.version);
  if(prior&&JSON.stringify(prior)!==JSON.stringify(ref))throw Error('Conflicting historical '+key+' version: '+ref.version);
  byVersion.set(ref.version,ref);
 }
 return [...byVersion.values()];
};
current.affinityCatalogVersions=catalogHistory('affinity','affinity_manifest');
current.localizationCatalogVersions=catalogHistory('localization_catalog','localization_manifest');
const localizationBundleHistory=new Map();
for(const release of history)for(const component of release.components.filter(row=>row.key.startsWith('localization_bundle:'))){
 const ref={locale:component.key.slice('localization_bundle:'.length),version:component.version,path:component.path};
 const key=ref.locale+'@'+ref.version,prior=localizationBundleHistory.get(key);
 if(prior&&JSON.stringify(prior)!==JSON.stringify(ref))throw Error('Conflicting historical localization bundle: '+key);
 localizationBundleHistory.set(key,ref);
}
current.localizationBundleVersions=[...localizationBundleHistory.values()].filter(ref=>ref.locale==='en-US');
const experienceIndex=await readJson(root,'data/experience/current.json');
if(experienceIndex.schemaVersion!=='worldview-experience-index-1'||
 !/^data\/experience\/policy-v[0-9.]+\.json$/.test(experienceIndex.current?.path))
 throw Error('Invalid experience policy index.');
const experience=await readJson(root,experienceIndex.current.path);
if(experience.experienceVersion!==experienceIndex.current.version||
 experience.progressivePolicy?.version!==pinned.progressiveDepth.version||
 experience.localizationCatalogVersion!==pinned.localizationCatalog.version||
 experience.routes?.find(route=>route.id==='full')?.formPolicyVersion!==pinned.fullForm.version||
 !experience.modelPolicies?.some(ref=>ref.version===pinned.worldviewModel.version&&ref.path===pinned.worldviewModel.path))
 throw Error('Experience policy is not bound to the active model release.');
current.quizExperience=experienceIndex.current;
current.modelRelease=index.current;
current.modelReleaseVersions=index.versions;
current.releaseChannels=channelIndex.current;
await verifyRelease(root,current,manifest);
const reviewFiles=(await readdir(path.join(root,'data/reviews')))
 .filter(file=>/^pilot-evidence-dispositions-v[0-9]+\.json$/.test(file)).sort((a,b)=>
  Number(b.match(/v([0-9]+)/)[1])-Number(a.match(/v([0-9]+)/)[1]));
let auditRef=current.pilotEvidenceAudit;
if(auditRef){
 const candidate=await readJson(root,auditRef.path).catch(()=>null);
 if(!candidate||candidate.release.modelVersion!==pinned.worldviewModel.version||
  candidate.release.routePolicyVersion!==pinned.progressiveDepth.version)auditRef=null;
}
if(!auditRef){
 for(const file of reviewFiles){const candidate=await readJson(root,'data/reviews/'+file);
  if(candidate.release.modelVersion===pinned.worldviewModel.version&&
   candidate.release.routePolicyVersion===pinned.progressiveDepth.version){
   auditRef={version:candidate.auditVersion,path:'data/reviews/'+file};break;
  }}
}
if(!auditRef)throw Error('No pilot evidence audit matches the active model and route policy.');
current.pilotEvidenceAudit=auditRef;
const evidenceAudit=await readJson(root,auditRef.path);
const activeAffinity=await readJson(root,pinned.affinityCatalog.path);
if(evidenceAudit.release.modelVersion!==pinned.worldviewModel.version||
 evidenceAudit.release.routePolicyVersion!==pinned.progressiveDepth.version)
 throw Error('Current-facing route documentation needs an evidence audit for the active release.');
const summary=evidenceAudit.summary;
const fullGuide=`# Full route releases

The active pilot candidate is \`${pinned.pilotCandidate.version}\`, using form policy \`${pinned.fullForm.version}\` and interpretation model \`${pinned.worldviewModel.version}\` in [model release ${manifest.releaseVersion.replace('model-release-','')}](../${index.current.path}). It fixes ${summary.fullRouteItems} distinct question revisions across twelve domains. The prior 238-item pilot and earlier 240-item and 80/120/160 forms remain at their versioned paths for historical replay. The current chooser offers authored 64/120/${summary.fullRouteItems} depth routes.

The pre-pilot review removed \`NEI030\` and \`EXI017\` for the reasons recorded in [the 240-item content review](../data/pilots/content-review-v1.json). No released item text or historical interpretation rule was rewritten. The active Full route has **${summary.fullRouteAssessableRules} of ${summary.publicRules}** public direct rules with enough authored content in both directions and **${summary.fullRouteNotMeasuredRules}** that remain \`not_measured\` by this route. Actual respondent evidence can still be insufficient or mixed. The [current evidence-disposition audit](PILOT_EVIDENCE_DISPOSITIONS.md) lists every gap and reconciles the earlier 35 bundled-path gaps without treating narrower successor rules as equivalent.

See the [pilot-era historical contract](PILOT_V1.md), [progressive route contract](PROGRESSIVE_DEPTH.md), and [prior 49-construct audit](UNMAPPED_AUDIT.md). A two-unit rule is an editorial threshold, not a reliability estimate.
`;
await writeFile(new URL('docs/FULL_ROUTE.md',new URL('../',import.meta.url)),fullGuide);
const readmePath=new URL('README.md',new URL('../',import.meta.url));
let readme=await readFile(readmePath,'utf8');
const oldComparison='Reference comparisons consume exact item IDs, revisions and raw response states.';
const newComparison=`The active public result uses ${activeAffinity.traditions.length} versioned philosophical comparisons over interpreted propositions.`;
const successorComparison=/The active public result uses [0-9]+ versioned philosophical comparisons over interpreted propositions\./;
if(!readme.includes(oldComparison)&&!successorComparison.test(readme))throw Error('README comparison summary changed; update the release documentation sync.');
readme=readme.replace(oldComparison,newComparison).replace(successorComparison,newComparison);
readme=readme.replace('The comparisons and engineering scores remain **unvalidated and non-interpretable**.',
 'The nine prototype comparisons and engineering scores remain **unvalidated and non-interpretable**. The public catalog offers qualitative, evidence-scoped comparison rather than a validated classification.');
readme=readme.replace(/The active full-depth route is the (?:frozen )?[0-9]+-item `pilot-candidate-[0-9.]+`(?: in `model-release-[0-9.]+`)?\./,
 `The active full-depth route is the ${summary.fullRouteItems}-item \`${pinned.pilotCandidate.version}\` in \`${manifest.releaseVersion}\`.`);
readme=readme.replace(/Candidate bank \*\*[0-9.]+\*\* contains \*\*[0-9]+ (?:original |authored )?candidate items\*\*\.(?: The registry has \*\*[0-9]+ permanent entries\*\*, of which \*\*[0-9]+ are active\*\*\.| The active registry includes \*\*[0-9]+ permanent entries\*\*\. The public model has \*\*[0-9]+ direct interpretation rules\*\*, of which \*\*[0-9]+\*\* have a two-direction authored evidence path on Full\.)/,
 `Candidate bank **${pinned.candidateBank.version}** contains **${summary.bankItems} authored candidate items**. The active registry includes **${(await readJson(root,pinned.registry.path)).constructs.length} permanent entries**. The public model has **${summary.publicRules} direct interpretation rules**, of which **${summary.fullRouteAssessableRules}** have a two-direction authored evidence path on Full.`);
readme=readme.replace('This academic update adds 30 distinctions and 90 items. Its 25-entry source ledger distinguishes reviewed scholarly text, abstracts, and metadata-only references. These sources support conceptual distinctions; they do not validate the new questionnaire.',
 'The historical 0.9.0 academic expansion added 30 distinctions and 90 items. The current source ledger adds claim-level links for subsequent reviewed releases. Sources support conceptual distinctions; they do not validate the questionnaire.');
readme=readme.replace('It keeps the earlier 240-question full form and all historical models at their versioned paths.',
 'It keeps the earlier 242- and 240-question full forms and all historical models at their versioned paths.');
readme=readme.replace('See [the pilot contract](docs/PILOT_V1.md).',
 'See the [current Full-route contract](docs/FULL_ROUTE.md) and [historical pilot contract](docs/PILOT_V1.md).');
readme=readme.replace(/with 64\/120\/\d+-question depth routes/,
 `with 64/120/${summary.fullRouteItems}-question depth routes`);
readme=readme.replace(/The active Full route uses the frozen 238-question pilot\. Earlier 240-item and 80\/120\/160-item releases remain available for replaying saved quizzes\./,
 `The active Full route uses the versioned ${summary.fullRouteItems}-question successor pilot. The earlier frozen 238-question pilot and older 240-item and 80/120/160-item releases remain available for historical replay.`);
await writeFile(readmePath,readme);
await writeFile(new URL('data/current.json',new URL('../',import.meta.url)),JSON.stringify(current,null,2)+'\n');
console.log('Model release index:',manifest.releaseVersion);
