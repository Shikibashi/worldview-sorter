import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {buildReferenceReadinessReport,validateReferenceReadinessSpec} from '../packages/worldview/reference-readiness-audit.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const digest=async path=>createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');

const pointer=await read('data/reference/readiness-current.json');
const spec=await read(pointer.specPath);
const current=await read('data/current.json');
const model=await read(spec.baseline.worldviewModel.path);
const bank=await read(spec.baseline.candidateBank.path);
const routes=await read(spec.baseline.progressiveRoutes.path);
const affinityCatalog=await read(spec.baseline.affinityCatalog.path);
const sourceLedger=await read(spec.baseline.sourceLedger.path);
const authoringPolicy=await read(spec.baseline.authoringPolicy.path);
const context={spec,model,bank,routes,affinityCatalog,sourceLedger,authoringPolicy};

validateReferenceReadinessSpec(context);
const report=buildReferenceReadinessReport(context);
const byCandidate=id=>report.candidates.find(candidate=>candidate.id===id);
const byClaim=(candidate,id)=>candidate.claims.find(claim=>claim.id===id);

assert.equal(pointer.auditVersion,'reference-readiness-audit-2.0.0');
assert.equal(spec.auditVersion,pointer.auditVersion);
assert.equal(report.auditVersion,pointer.auditVersion);
assert.equal(current.candidateBank.path,spec.baseline.candidateBank.path);
assert.equal(current.worldviewModel.path,spec.baseline.worldviewModel.path);
assert.equal(current.worldviewSourceLedger.path,spec.baseline.sourceLedger.path);
assert.equal(current.affinityCatalog.path,spec.baseline.affinityCatalog.path);
assert.equal(current.progressiveDepth.path,spec.baseline.progressiveRoutes.path);
assert.deepEqual(report.baseline.routeOrder.map(row=>[row.id,row.size]),
  [['quick',64],['standard',120],['full',255]]);

const mill=byCandidate('philosopher-mill-scoped');
const general=byClaim(mill,'mill-greatest-happiness-principle');
const actReading=byClaim(mill,'mill-act-consequence-reading');
assert.equal(general.mappingStatus,'ROUTE_LIMITED');
assert.equal(general.interpretationPath.kind,'direct');
assert.equal(general.interpretationPath.id,'reviewed-NE26-general-happiness-ultimate-standard');
assert.deepEqual(general.routeAvailability.map(row=>row.guaranteedCapable),[false,false,true]);
assert.equal(actReading.mappingStatus,'PARTIAL',
  'The disputed direct-act reconstruction must remain partial after NE26 becomes exact.');
assert.equal(mill.readinessState,'READY_FOR_PROFILE_AUTHORING',
  'Exact coverage of the scoped core may become authorable without promoting the disputed act reading.');

for(const pin of [
  spec.baseline.candidateBank,spec.baseline.worldviewModel,spec.baseline.sourceLedger,
  spec.baseline.affinityCatalog,spec.baseline.progressiveRoutes,spec.baseline.authoringPolicy
]) assert.equal(await digest(pin.path),pin.sha256,`${pin.path} changed from the v2 readiness baseline.`);

const serialized=JSON.stringify(report).toLowerCase();
for(const phrase of ['% match','nearest philosopher','assigned identity','similarity score','winner'])
  assert.ok(!serialized.includes(phrase),`Readiness output contains forbidden phrase: ${phrase}`);

console.log('Reference readiness v2: current pins, Full-only NE26, disputed act-reading boundary, and no-ranking semantics passed.');
