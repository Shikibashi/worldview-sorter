import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {buildReferenceReadinessReport,ReferenceReadinessAuditError,validateReferenceReadinessSpec} from '../packages/worldview/reference-readiness-audit.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const digest=async path=>createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
const spec=await read('data/reference/readiness-audit-v1.json');
const current=await read('data/current.json');
const model=await read(spec.baseline.worldviewModel.path);
const bank=await read(spec.baseline.candidateBank.path);
const routes=await read(spec.baseline.progressiveRoutes.path);
const affinityCatalog=await read(spec.baseline.affinityCatalog.path);
const sourceLedger=await read(spec.baseline.sourceLedger.path);
const authoringPolicy=await read(spec.baseline.authoringPolicy.path);
const context={spec,model,bank,routes,affinityCatalog,sourceLedger,authoringPolicy};
const build=(overrides={})=>buildReferenceReadinessReport({...context,...overrides});
const byCandidate=(report,id)=>report.candidates.find(candidate=>candidate.id===id);
const byClaim=(candidate,id)=>candidate.claims.find(claim=>claim.id===id);

validateReferenceReadinessSpec(context);
const report=build();
assert.equal(report.auditVersion,'reference-readiness-audit-1.0.0');
assert.equal(report.baseline.model.version,spec.baseline.worldviewModel.version);
assert.deepEqual(report.baseline.routeOrder.map(row=>[row.id,row.size]),[['quick',64],['standard',120],['full',249]]);
assert.deepEqual(report.summary.readinessStates,{READY_FOR_PROFILE_AUTHORING:5,PARTIAL_PROFILE_ONLY:3,RESEARCH_GAPS:3,CONTEXT_ONLY:1});

const badReference=structuredClone(spec);
badReference.candidates[0].claims[0].propositionId='unknown-proposition';
assert.throws(()=>build({spec:badReference}),ReferenceReadinessAuditError);

const duplicateId=structuredClone(spec);
duplicateId.candidates[1].claims[0].id=duplicateId.candidates[0].claims[0].id;
assert.throws(()=>build({spec:duplicateId}),/Duplicate or empty claim id/);

const editorialCore=structuredClone(spec);
editorialCore.candidates[0].claims[0].evidenceBasis='editorial_hypothesis';
assert.throws(()=>build({spec:editorialCore}),/Core claim .*editorial_hypothesis/);

const pragmatism=byCandidate(report,'tradition-pragmatism');
const pragMaxim=byClaim(pragmatism,'pragmatism-pragmatic-maxim');
assert.equal(pragMaxim.mappingStatus,'ROUTE_LIMITED');
assert.equal(pragMaxim.interpretationPath.kind,'direct');
assert.deepEqual(pragMaxim.routeAvailability.map(row=>row.capable),[false,false,true]);
assert.deepEqual(pragMaxim.routeAvailability.map(row=>row.guaranteedCapable),[false,false,true]);
assert.equal(pragMaxim.routeAvailability[0].reason,'route_omits_or_lacks_required_evidence_units');
assert.equal(pragMaxim.expectedPropositionState,'supported',"Route omission must not rewrite the candidate's expected proposition state.");
assert.ok(!pragMaxim.routeAvailability.some(row=>row.opposed===true||row.state==='opposed'));

const mill=byCandidate(report,'philosopher-mill-scoped');
assert.equal(byClaim(mill,'mill-greatest-happiness-principle').mappingStatus,'PARTIAL','A partial criterion cannot be silently promoted because its WVS rule is available on Full.');
assert.equal(byClaim(mill,'mill-act-consequence-reading').mappingStatus,'PARTIAL');

assert.equal(byCandidate(report,'philosopher-hume').readinessState,'RESEARCH_GAPS');
assert.equal(byClaim(byCandidate(report,'philosopher-hume'),'hume-induction').mappingStatus,'MISSING_PROPOSITION');
assert.equal(byCandidate(report,'tradition-early-confucian-ethics').readinessState,'RESEARCH_GAPS');
assert.equal(byClaim(byCandidate(report,'tradition-early-confucian-ethics'),'confucian-relational-self-overlap').mappingStatus,'PARTIAL');
const confucianRole=byClaim(byCandidate(report,'tradition-early-confucian-ethics'),'confucian-role-responsibilities');
assert.equal(confucianRole.mappingStatus,'MISSING_PROPOSITION');
assert.deepEqual(confucianRole.relatedPropositions.map(row=>row.id),['audit2-SO03-relational-self','moral-concern-authority']);
assert.deepEqual(confucianRole.relatedPropositions[1].routeAvailability.map(row=>row.guaranteedCapable),[true,true,true],
  'The general role-duty rule is visible as adjacent evidence on all routes without replacing the Confucian-specific missing claim.');
assert.equal(byCandidate(report,'tradition-stoic-ethics').readinessState,'RESEARCH_GAPS');
assert.equal(byCandidate(report,'tradition-analytic-philosophy-context').readinessState,'CONTEXT_ONLY');

const unrelatedModel=structuredClone(model);
unrelatedModel.commitments.push({id:'test-only-unrelated-unused-rule',label:'Unrelated test-only proposition',evidence:[],minimumEvidenceUnits:1});
const unrelatedReport=build({model:unrelatedModel});
assert.deepEqual(unrelatedReport.candidates.map(row=>({id:row.id,readiness:row.readinessState,claims:row.claims})),report.candidates.map(row=>({id:row.id,readiness:row.readinessState,claims:row.claims})),
  'An unrelated unused proposition must not alter any candidate readiness or claim mapping.');

const minorChange=structuredClone(spec);
const hume=minorChange.candidates.find(row=>row.id==='philosopher-hume');
const minor=hume.claims.find(row=>row.id==='hume-mitigated-skepticism-context');
minor.mappingAssessment='exact';
minor.propositionId='construct-EP15';
minor.expectedPropositionState='supported';
const minorChangeReport=build({spec:minorChange});
assert.equal(byCandidate(minorChangeReport,'philosopher-hume').readinessState,'RESEARCH_GAPS',
  'Changing a minor/context claim cannot repair unavailable core claims.');
assert.equal(byCandidate(minorChangeReport,'philosopher-hume').claimSummary.coreClaimsUnavailable,2);

for(const candidate of report.candidates){
  assert.ok(candidate.limitations.length>0,`${candidate.id} must expose limitations.`);
  for(const claim of candidate.claims){
    assert.ok(claim.limitations.length>0,`${claim.id} must expose claim-level limitations.`);
    for(const sourceClaim of claim.sourceClaims){
      assert.ok(sourceClaim.locator.length>0,`${claim.id} source locator must be explicit.`);
      assert.equal(sourceClaim.itemValidityClaimed,false,'A doctrine source must not be represented as item validation.');
    }
  }
}

const forbiddenKey=/(^|_)(score|match.?percentage|percentage.?match|nearest.?profile|winner|assigned.?identity|similarity.?aggregate)(_|$)/i;
const scan=(value,path='report')=>{
  if(Array.isArray(value)){value.forEach((row,index)=>scan(row,`${path}[${index}]`));return;}
  if(!value||typeof value!=='object')return;
  for(const [key,row] of Object.entries(value)){
    assert.ok(!forbiddenKey.test(key),`${path} contains forbidden comparison field ${key}.`);
    scan(row,`${path}.${key}`);
  }
};
scan(report);
const serialized=JSON.stringify(report).toLowerCase();
for(const phrase of ['% match','nearest philosopher','assigned identity','similarity score','winner'])assert.ok(!serialized.includes(phrase),`Audit output contains forbidden phrase: ${phrase}`);

assert.deepEqual(build(),report,'Rerunning from the same pinned inputs must produce identical output.');

const pins=[
  spec.baseline.candidateBank,
  spec.baseline.worldviewModel,
  spec.baseline.sourceLedger,
  spec.baseline.affinityCatalog,
  spec.baseline.progressiveRoutes
];
for(const auditPin of pins)
  assert.equal(await digest(auditPin.path),auditPin.sha256,`${auditPin.path} changed from the immutable audit baseline.`);
assert.equal(await digest(spec.baseline.authoringPolicy.path),spec.baseline.authoringPolicy.sha256);

const leads=new Map(report.existingItemLeads.map(row=>[row.itemRevision,row]));
assert.ok(leads.get('VAI027@1').routesPresent.includes('full'));
assert.ok(leads.get('NEI103@1').activeInterpretationRuleIds.includes('construct-NE16'));
assert.ok(!leads.get('NEI103@1').routesPresent.length);
assert.deepEqual(leads.get('NEI121@1').routesPresent,['full']);
assert.deepEqual(leads.get('NEI121@1').activeInterpretationRuleIds,['construct-NE15']);
assert.deepEqual(leads.get('MFI017@1').routesPresent,['quick','standard','full']);
assert.ok(leads.get('MFI017@1').activeInterpretationRuleIds.includes('moral-concern-authority'));
assert.deepEqual(leads.get('EPI104@1').routesPresent,[]);
assert.deepEqual(leads.get('EPI105@1').routesPresent,[]);

console.log('Reference readiness audit: pinned coverage, route omissions, source boundaries, gap states, adversarial readiness invariants, and deterministic output passed.');
