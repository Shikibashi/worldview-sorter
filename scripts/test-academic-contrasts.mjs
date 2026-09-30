import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {matchProfiles, planProfileFollowups, validateProfileCatalog, ProfileEvidenceError} from '../packages/profiles/matcher.js';

const root = new URL('../',import.meta.url);
const read = async p => JSON.parse(await readFile(new URL(p,root),'utf8'));
const current = await read('data/current.json');
const bank = await read('data/items/candidate-v0.9.json');
const catalog = await read(current.profileCatalog.path);
const policy = await read(current.profileMatchingPolicy.path);
const scalesDoc = await read('data/response-scales.json');
const evidence = (await read(current.profileProbeSet.path)).constructItems;
const release = await read('data/academic/release-v0.9.json');
const registry = await read('data/constructs.json');
const sources = await read('data/sources.json');
const args = {catalog,policy,bank,scalesDoc};
const tests = [];
const test = (name,fn) => { fn(); tests.push(name); console.log('PASS: '+name); };
const input = responses => ({bankVersion:bank.bankVersion,responses});
const record = (itemId,value,state='answered') => ({itemId,itemRevision:bank.items.find(i=>i.id===itemId).revision,state,value});
const forConstruct = (id,orientation=1) => evidence[id].map(e=>record(e.itemId,2*e.polarity*orientation));
const merge = (...groups) => [...new Map(groups.flat().map(r=>[r.itemId,r])).values()];
const run = raw => matchProfiles({...args,input:raw});
const candidate = (result,id) => result.candidates.find(c=>c.profileId===id);
const objectivistProfile = catalog.profiles.find(p=>p.id==='objectivism');
const objectivistResponses = merge(...objectivistProfile.criteria.map(c=>c.evidence.map(e=>record(e.itemId,e.support[0]))));

validateProfileCatalog(args);
test('Released bank contains original candidates with traceable academic provenance',()=>{
  assert.equal(release.itemCount,562);
  assert.equal(release.newItemCount,90);
  assert.equal(bank.items.length,release.itemCount);
  assert.equal(registry.constructs.length,182);
  assert.equal(release.newConstructCount,30);
  assert.equal(release.academicSourceCount,25);
  assert.equal(registry.constructs.find(c=>c.id==='OM03').measurementStatus,'deprecated');
  for (const [constructId,entries] of Object.entries(evidence)) {
    assert.equal(entries.length,3);
    for (const e of entries) {
      const item=bank.items.find(i=>i.id===e.itemId);
      assert.equal(item.revision,e.itemRevision);
      assert.ok(item.targets.some(t=>t.constructId===constructId && t.role==='primary'));
      assert.equal(item.status,'candidate');
      assert.equal(item.provenance.copiedText,false);
      assert.ok(item.provenance.sourceRefs.every(id=>sources.sources.some(s=>s.id===id)));
    }
  }
  assert.match(sources.sources.find(s=>s.id==='acad-promises').title,/Allen Habib/);
  assert.match(sources.sources.find(s=>s.id==='acad-nominalism').title,/Giberman/);
});
for (const [file,expected] of Object.entries(release.frozenSourceHashes)) {
  const actual = createHash('sha256').update(await readFile(new URL(file,root),'utf8')).digest('hex');
  test('Historical file remains byte-identical: '+file,()=>assert.equal(actual,expected));
}

test('Politics alone supplies partial evidence, not an Objectivist identity',()=>{
  const political = objectivistProfile.criteria.find(c=>c.id==='market-coordination');
  const result = run(input(political.evidence.map(e=>record(e.itemId,e.support[0]))));
  assert.equal(candidate(result,'objectivism').state,'partial_evidence');
  assert.equal(result.publicIdentityLabel,null);
  assert.equal(result.selectedProfileId,null);
  assert.equal(result.percentageMatchAllowed,false);
});
test('Similar political answers with different ethical grounds and legal institutions remain distinct',()=>{
  const alternative=merge(objectivistResponses,forConstruct('NE15',-1),forConstruct('ME09',-1),forConstruct('PL29',-1),forConstruct('PL30'),forConstruct('NE17'),forConstruct('NE21'));
  const result=run(input(alternative));
  assert.equal(candidate(result,'objectivism').state,'material_divergence');
  assert.equal(candidate(result,'ownness-orientation').state,'compatible_on_measured_commitments');
  assert.equal(candidate(result,'nonstate-legal-pluralism').state,'compatible_on_measured_commitments');
  assert.equal(result.publicIdentityLabel,null);
});
test('Rand comparison is not excluded by fallible judgments, revisable concepts or rejection of universals',()=>{
  const compatible=merge(objectivistResponses,forConstruct('EP15'),forConstruct('EP17'),forConstruct('EP19'),forConstruct('OM12',-1),forConstruct('ME10'));
  const result=run(input(compatible));
  assert.equal(candidate(result,'objectivism').state,'compatible_on_measured_commitments');
  assert.equal(result.publicIdentityLabel,null);
  assert.equal(result.interpretationAllowed,false);
});
test('No generic unconditional moral-reasons gate is imposed on Rand',()=>{
  const r=run(input(merge(objectivistResponses,[record('MEI004',-2)],forConstruct('ME10'))));
  assert.equal(candidate(r,'objectivism').state,'compatible_on_measured_commitments');
});
test('Ownness and elective concern can coexist',()=>{
  const result=run(input(merge(forConstruct('NE17'),forConstruct('NE15',-1),forConstruct('NE21'),forConstruct('AH13',-1))));
  assert.equal(candidate(result,'ownness-orientation').state,'compatible_on_measured_commitments');
  assert.equal(candidate(result,'ethical-egoism').state,'material_divergence');
});
test('Ethical egoism does not require psychological egoism or establish Objectivism',()=>{
  const result=run(input(merge(forConstruct('NE15'),forConstruct('AH13',-1))));
  assert.equal(candidate(result,'ethical-egoism').state,'compatible_on_measured_commitments');
  assert.notEqual(candidate(result,'objectivism').state,'compatible_on_measured_commitments');
});
test('General-obligation skepticism does not require state abolition or rejection of voting',()=>{
  const c=catalog.profiles.find(p=>p.id==='philosophical-anarchism').criteria[0];
  const obligations=c.evidence.map(e=>record(e.itemId,e.support[0]));
  for (const abolition of [-1,1]) {
    const result=run(input(merge(obligations,forConstruct('PL31'),forConstruct('PL32',abolition),[record('PLI006',2)])));
    assert.equal(candidate(result,'philosophical-anarchism').state,'compatible_on_measured_commitments');
    assert.notEqual(candidate(result,'nonstate-legal-pluralism').state,'compatible_on_measured_commitments');
  }
});
test('Easy ontological method does not decide abstract-object existence',()=>{
  for (const objects of [-1,1]) {
    const result=run(input(merge(forConstruct('OM14'),forConstruct('OM11',objects),forConstruct('OM13'))));
    assert.equal(candidate(result,'easy-metaontology').state,'compatible_on_measured_commitments');
    assert.equal(result.selectedProfileId,null);
  }
});
test('Preinstitutional rights and institutional justification can both be supported',()=>{
  const result=run(input(merge(forConstruct('PL27'),forConstruct('PL28'))));
  assert.equal(candidate(result,'preinstitutional-rights').state,'compatible_on_measured_commitments');
  assert.equal(candidate(result,'institutional-rights').state,'compatible_on_measured_commitments');
});
test('Exit, reliance and remedies stay separate rather than becoming one anti-promise score',()=>{
  const combinations=merge(forConstruct('NE19'),forConstruct('NE20'),forConstruct('PL33'),forConstruct('NE18',-1));
  const result=run(input(combinations));
  assert.equal(result.publicIdentityLabel,null);
  const relationsSource = registry.constructs.filter(c=>['NE18','NE19','NE20','PL33'].includes(c.id));
  assert.equal(relationsSource.length,4);
  assert.equal(new Set(relationsSource.map(c=>c.description)).size,4);
});
test('Neutral is recorded separately and cannot become rejection of a doctrine',()=>{
  const neutral=objectivistResponses.map(r=>typeof r.value==='number'?{...r,value:0}:r);
  const result=run(input(neutral));
  assert.equal(candidate(result,'objectivism').state,'insufficient_evidence');
  assert.ok(candidate(result,'objectivism').criteria[0].observations.every(o=>o.state==='neutral'));
});
test('No-view and not-understood remain missing evidence, not an atheist or contrary response',()=>{
  for (const state of ['no_view','not_understood']) {
    const result=run(input(objectivistResponses.map(r=>({...r,state,value:null}))));
    assert.equal(candidate(result,'objectivism').state,'insufficient_evidence');
    assert.ok(candidate(result,'objectivism').criteria[0].observations.every(o=>o.state===state));
  }
});
test('A single agreeing item is not sufficient independent evidence',()=>{
  const result=run(input([forConstruct('NE15')[0]]));
  assert.equal(candidate(result,'ethical-egoism').state,'insufficient_evidence');
});
test('Contradictory responses are visible and are not averaged into a label',()=>{
  const mixed=merge(objectivistResponses,[forConstruct('NE15',-1)[0]]);
  const result=run(input(mixed));
  assert.equal(candidate(result,'objectivism').state,'mixed_evidence');
  assert.equal(candidate(result,'objectivism').criteria.find(c=>c.criterionId==='normative-self-interest').state,'mixed');
});
test('Self-identification is kept separate from supported commitments',()=>{
  const result=run({...input([]),selfReportedIdentities:['Objectivist']});
  assert.deepEqual(result.selfReportedIdentities,['Objectivist']);
  assert.equal(result.publicIdentityLabel,null);
  assert.equal(candidate(result,'objectivism').state,'insufficient_evidence');
});
test('A calibration flag cannot manufacture validation or turn on identity output',()=>{
  assert.throws(()=>matchProfiles({...args,catalog:{...catalog,status:'calibrated',identityOutputAllowed:true},input:input(objectivistResponses)}),ProfileEvidenceError);
});
test('Naked categorical coordinates and detached profile probes are refused',()=>{
  assert.throws(()=>run({...input([]),constructEstimates:{RC01:-1,OM01:-1}}),ProfileEvidenceError);
  assert.throws(()=>run({...input([]),probeResponses:{'OBJ-P01':2}}),ProfileEvidenceError);
});
test('Unknown items, stale revisions, duplicate responses, invalid states and nonfinite values are refused',()=>{
  const valid=forConstruct('NE15')[0];
  for (const responses of [
    [{...valid,itemId:'NEI999'}], [{...valid,itemRevision:999}], [valid,valid],
    [{...valid,value:NaN}], [{...valid,value:Infinity}], [{...valid,state:'maybe'}],
    [{...valid,state:'no_view',value:2}]
  ]) assert.throws(()=>run(input(responses)));
  assert.throws(()=>run({bankVersion:'0.8.0',responses:[]}),ProfileEvidenceError);
});
test('Unpresented items cannot supply evidence when presentation records are supplied',()=>{
  const r=forConstruct('NE15')[0];
  assert.throws(()=>run({...input([r]),presentedItems:[{itemId:r.itemId,itemRevision:r.itemRevision,presented:false,skippedByBranch:true}]}),ProfileEvidenceError);
});
test('Follow-ups are real, versioned bank questions and stay within their budget',()=>{
  const plan=planProfileFollowups({...args,input:input([]),profileIds:['objectivism'],maxItems:8});
  assert.equal(plan.status,'uncalibrated_evidence_plan');
  assert.ok(plan.entries.length>0 && plan.entries.length<=8);
  assert.equal(new Set(plan.entries.map(e=>e.itemId)).size,plan.entries.length);
  for (const e of plan.entries) assert.equal(bank.items.find(i=>i.id===e.itemId).revision,e.itemRevision);
  assert.throws(()=>planProfileFollowups({...args,input:input([]),profileIds:['invented']}),ProfileEvidenceError);
});
test('Published instruments are not falsely presented as validation of our original questions',()=>{
  assert.equal(release.publicInferenceAllowed,false);
  assert.equal((awaitNotNeeded=>catalog.status)(),'prototype');
  assert.ok(sources.sources.filter(s=>s.id.startsWith('acad-')).every(s=>s.access && s.evidenceType));
});
console.log('\nAcademic contrast regressions passed: '+tests.length+' cases. No respondent or calibration data were fabricated.');
