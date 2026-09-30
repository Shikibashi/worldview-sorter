import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {restoreQuiz} from '../packages/experience/quiz.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {buildDependencyGraph,traceBasis,analyzeImpact} from '../packages/governance/index.js';
import {currentFromManifest,loadSnapshot,readJson} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),
 flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const file=flag('--session'),target=flag('--target');
if(!file||!target)throw Error('Use --session EXPLICIT_USER_SUPPLIED_BACKUP.json --target proposition:ID|tradition:ID. Local authorized reviewers only.');
const current=await readJson(root,'data/current.json'),raw=JSON.parse(await readFile(path.resolve(file),'utf8')),
 quiz=raw.quiz??raw;
if(!quiz?.session?.modelReleaseVersion)throw Error('A pinned model release is required for evidence review.');
const ref=(current.modelReleaseVersions??[]).find(x=>x.version===quiz.session.modelReleaseVersion);
if(!ref)throw Error('Historical model release is unavailable.');
const manifest=await readJson(root,ref.path),snapshot=await loadSnapshot(root,currentFromManifest(manifest));
const pilot=await readJson(root,current.pilot.path);
const restored=restoreQuiz(quiz,{bank:snapshot.bank,pilot,scalesDoc:snapshot.scalesDoc,
 formPolicies:[snapshot.routes],localizationBundles:snapshot.localization.bundles,
 localizationCatalogs:[snapshot.localization.catalog],modelReleases:[manifest]});
if(restored.session.completionStatus!=='completed')throw Error('A completed administration is required for a result complaint.');
const summary=buildQuizSummary({model:snapshot.model,bank:snapshot.bank,scalesDoc:snapshot.scalesDoc,
 session:restored.session,affinityCatalog:snapshot.affinity,affinityPilot:snapshot.pilotManifest,
 routeManifest:snapshot.routes});
const graph=buildDependencyGraph(snapshot),[type,id]=target.split(':');
let review;
if(type==='proposition'){
 const row=summary.rows.find(x=>x.id===id);if(!row)throw Error('Unknown interpreted proposition.');
 review={proposition:id,state:row.status,exactProposition:row.proposition,interpretationRule:row.interpretationRule,
  evidence:row.evidence,sources:row.sources,dependencies:row.dependencies??[],
  sourceTrail:traceBasis(graph,row.inferenceStatus==='derived'?'derived_rule':'proposition',id),
  affectedDoctrine:analyzeImpact(graph,row.inferenceStatus==='derived'?'derived_rule':'proposition',id).affected
   .filter(x=>x.to.startsWith('criterion:')||x.to.startsWith('tradition:'))};
}else if(type==='tradition'){
 const row=summary.affinities?.traditions.find(x=>x.id===id);if(!row)throw Error('Unknown tradition.');
 review={tradition:id,comparison:row,sourceTrail:traceBasis(graph,'tradition',id)};
}else throw Error('Choose proposition:ID or tradition:ID.');
console.log(JSON.stringify({schemaVersion:'worldview-private-evidence-review-1',
 warning:'Contains sensitive answers. Keep this output in a private reviewer environment; do not attach it to a public ticket.',
 administration:{modelReleaseVersion:manifest.releaseVersion,releaseChannel:restored.session.releaseChannel??null,
  instrumentVersion:restored.session.instrumentVersion,routeId:restored.packet.routeId,
  routeVersion:restored.packet.routeVersion,localization:restored.session.localization??null},review},null,2));
