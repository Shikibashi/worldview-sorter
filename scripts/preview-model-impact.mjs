import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,readJson} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const [from,to,fixture]=[flag('--from'),flag('--to')??'current',flag('--session')];
if(!from||!fixture)throw Error('Usage: node scripts/preview-model-impact.mjs --from MANIFEST --to MANIFEST|current --session SYNTHETIC_SESSION.json');
const current=await readJson(root,'data/current.json');
const load=async ref=>loadSnapshot(root,ref==='current'?current:currentFromManifest(await readJson(root,ref)));
const before=await load(from),after=await load(to),loaded=JSON.parse(await readFile(path.resolve(fixture),'utf8'));
const session=loaded.quiz?.session??loaded.session??loaded;
const summarize=snapshot=>{
 try{const route=session.pilotId===snapshot.routes.administrationId?snapshot.routes:null;
  const report=compareWorldview({model:snapshot.model,bank:snapshot.bank,scalesDoc:snapshot.scalesDoc,input:session,routeManifest:route});
  const affinities=evaluatePhilosophicalAffinities({catalog:snapshot.affinity,report,model:snapshot.model,pilot:snapshot.pilotManifest});
  return {ok:true,propositions:Object.fromEntries(report.commitments.map(c=>[c.commitmentId,c.state])),
   derived:Object.fromEntries((report.derived??[]).map(c=>[c.id,c.state])),
   affinities:Object.fromEntries(affinities.traditions.map(t=>[t.id,t.summaryState])),
   domainSummaries:Object.fromEntries(report.domains.map(domain=>[domain.id,
    Object.fromEntries([...new Set(report.commitments.filter(c=>c.domainId===domain.id).map(c=>c.state))].sort().map(state=>
     [state,report.commitments.filter(c=>c.domainId===domain.id&&c.state===state).length]))])),
   routeCoverage:Object.fromEntries(snapshot.routes.routes.map(route=>[route.id,
    {routeVersion:route.routeVersion,itemRefs:route.itemRefs.map(ref=>ref.itemId+'@'+ref.itemRevision)}]))};
 }catch(error){return {ok:false,reason:error.message};}
};
const left=summarize(before),right=summarize(after);
if(!left.ok||!right.ok){console.log(JSON.stringify({comparable:false,reason:'The exact saved item revisions or route cannot be evaluated under both releases.',before:left,after:right},null,2));
 process.exitCode=2;
}else{
 const delta=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].filter(id=>a[id]!==b[id]).map(id=>({id,before:a[id]??null,after:b[id]??null}));
 const complexDelta=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])]
  .filter(id=>JSON.stringify(a[id])!==JSON.stringify(b[id])).map(id=>({id,before:a[id]??null,after:b[id]??null}));
 console.log(JSON.stringify({comparable:true,fixture:'synthetic software regression only',
  propositionChanges:delta(left.propositions,right.propositions),derivedChanges:delta(left.derived,right.derived),
  affinityChanges:delta(left.affinities,right.affinities),
  domainSummaryChanges:complexDelta(left.domainSummaries,right.domainSummaries),
  routeCoverageChanges:complexDelta(left.routeCoverage,right.routeCoverage)},null,2));
}
