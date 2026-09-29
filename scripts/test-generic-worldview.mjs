import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compareWorldview,planWorldviewFollowups,validateModel} from '../packages/worldview/index.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json'),bank=await read(current.candidateBank.path),model=await read(current.worldviewModel.path),scalesDoc=await read('data/response-scales.json');
const release=await read('data/generic/release-v0.1.json'),ledger=await read(current.worldviewSourceLedger.path);
const args={model,bank,scalesDoc};let tests=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS generic: '+name);};
const input=responses=>({bankVersion:bank.bankVersion,responses});
const rule=id=>{const c=model.commitments.find(x=>x.id===id);assert.ok(c,id);return c;};
const answers=(id,dir='support')=>rule(id).evidence.filter(e=>e[dir].length).map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,state:'answered',value:e[dir][0]}));
const merge=(...rs)=>[...new Map(rs.flat().map(r=>[r.itemId,r])).values()];
const run=responses=>compareWorldview({...args,input:input(responses)});
const state=(result,id)=>result.commitments.find(c=>c.commitmentId===id).state;
const normalized=result=>result.commitments.map(c=>[c.commitmentId,c.state]);
validateModel(args);
test('All 12 domains have neutral reusable commitments',()=>assert.equal(new Set(model.commitments.map(c=>c.domainId)).size,12));
test('Every current item and active construct has an audit disposition, including gaps',()=>{
 assert.equal(model.coverage.items.length,bank.items.length);
 assert.equal(model.coverage.constructs.length,release.activeConstructCount);
 assert.ok(model.coverage.constructs.some(c=>c.ruleIds.length===0));
 assert.ok(model.coverage.items.every(i=>i.sourceValidationTransferred===false));
});
test('All references and critiques are inventoried without transferring validation',()=>{
 for(const id of ['acad-rand','acad-stirner','acad-mfq2','acad-ous','acad-bush-moss-2020','acad-yang-2026','gen-values','gen-care','gen-law'])assert.ok(ledger.sources.some(s=>s.id===id),id);
 assert.ok(ledger.sources.every(s=>s.access&&s.validatesOurItems===false&&s.permissionToCopyItems===false));
 assert.ok(ledger.sources.some(s=>/metadata/.test(s.access)));
});
for(const c of model.commitments){
 test(c.id+' has recoverable support without an identity',()=>{
  const r=run(answers(c.id));assert.equal(state(r,c.id),'supported');
  assert.equal(r.selectedProfileId,null);assert.equal(r.publicIdentityLabel,null);assert.equal(r.percentageMatchAllowed,false);
 });
 const oppositionUnits=new Set(c.evidence.filter(e=>e.oppose.length).map(e=>e.unitId));
 if(oppositionUnits.size>=2)test(c.id+' opposition remains opposition rather than a different identity',()=>assert.equal(state(run(answers(c.id,'oppose')),c.id),'opposed'));
 test(c.id+' cannot be decided by one item',()=>assert.equal(state(run(answers(c.id).slice(0,1)),c.id),'insufficient_evidence'));
}
test('Normative, practical-rational, descriptive and methodological layers are distinct',()=>{
 assert.equal(rule('construct-NE15').layer,'normative');
 assert.equal(rule('construct-NE16').layer,'practical_rationality');
 assert.equal(rule('construct-AH13').layer,'descriptive');
 assert.equal(rule('construct-AH14').layer,'conceptual_agency');
 assert.equal(rule('construct-SO14').layer,'social_ontological');
 assert.equal(rule('construct-SO15').layer,'explanatory_method');
 assert.equal(rule('construct-OM14').layer,'metaontological_method');
});
test('Conditional raw answers require actual satisfying prerequisite answers',()=>{
 const child=bank.items.find(i=>i.id==='RCI002'),parent=bank.items.find(i=>i.id==='RCI001');
 const c={itemId:child.id,itemRevision:child.revision,state:'answered',value:1};
 const p={itemId:parent.id,itemRevision:parent.revision,state:'answered',value:'none'};
 assert.throws(()=>run([c]));assert.throws(()=>run([p,c]));
 assert.doesNotThrow(()=>run([{...p,value:'personal_divine'},c]));
});
test('Empty or missing responses never assign positions',()=>assert.ok(run([]).commitments.every(c=>c.state==='insufficient_evidence')));
test('Unrelated high priorities do not fill doctrinal gaps',()=>{
 const r=run(answers('priority-VA04'));
 assert.equal(state(r,'priority-VA04'),'supported');
 assert.equal(state(r,'construct-NE15'),'insufficient_evidence');
 assert.equal(r.comparisons.find(p=>p.id==='objectivism').state,'insufficient_evidence');
});
test('Consequence sensitivity and constraints coexist',()=>{
 const r=run(merge(answers('outcomes-count'),answers('moral-constraints')));
 assert.equal(state(r,'outcomes-count'),'supported');assert.equal(state(r,'moral-constraints'),'supported');
 assert.equal(state(r,'instrumental-harm'),'insufficient_evidence');
});
test('Relational care does not manufacture foundation answers',()=>{
 const r=run(answers('relational-care'));assert.equal(state(r,'moral-concern-care'),'insufficient_evidence');
});
test('Private religious belief does not supply public-law views or physicalism',()=>{
 const r=run(answers('divine-existence'));assert.equal(state(r,'physical-reality'),'insufficient_evidence');
 assert.equal(state(r,'source-based-validity'),'insufficient_evidence');
});
test('Theological uncertainty is a substantive response, not no-view or atheism',()=>{
 const r=run(answers('theological-suspension'));assert.equal(state(r,'theological-suspension'),'supported');
 assert.equal(state(r,'divine-existence'),'insufficient_evidence');
});
test('Objective meaning and constructed meaning can both be reported',()=>{
 const r=run(merge(answers('constructed-meaning'),answers('objective-meaning')));
 assert.equal(state(r,'constructed-meaning'),'supported');assert.equal(state(r,'objective-meaning'),'supported');
});
test('Procedural and substantive justice are not forced complements',()=>{
 const r=run(merge(answers('procedural-justice'),answers('substantive-justice')));
 assert.equal(state(r,'procedural-justice'),'supported');assert.equal(state(r,'substantive-justice'),'supported');
});
test('Deterministic world answers do not imply incompatibilism',()=>{
 const r=run(answers('deterministic-world'));assert.equal(state(r,'construct-AH14'),'insufficient_evidence');
});
test('Scale midpoint meaning is preserved rather than treating every zero as neutral',()=>{
 const rs=answers('priority-VA04').map(r=>({...r,value:0})),r=run(rs);
 const c=r.commitments.find(c=>c.commitmentId==='priority-VA04');
 assert.equal(c.state,'insufficient_evidence');assert.ok(c.observations.every(o=>o.state==='qualified_or_non_directional'));
 const a=run(answers('construct-NE15').map(r=>({...r,value:0})));
 assert.ok(a.commitments.find(c=>c.commitmentId==='construct-NE15').observations.every(o=>o.state==='neutral'));
});
for(const s of ['no_view','not_understood'])test(s+' never becomes support or opposition',()=>{
 const r=run(answers('construct-NE15').map(a=>({...a,state:s,value:null})));assert.equal(state(r,'construct-NE15'),'insufficient_evidence');
});
test('Mixed evidence is not averaged into a supported label',()=>{
 const a=answers('construct-NE15');a[0]={...a[0],value:rule('construct-NE15').evidence[0].oppose[0]};assert.equal(state(run(a),'construct-NE15'),'mixed');
});
test('Repeated or mirrored evidence units cannot double-count',()=>{
 const clone=structuredClone(model),c=clone.commitments.find(c=>c.id==='construct-NE15');
 c.evidence[1].unitId=c.evidence[0].unitId;
 const r=compareWorldview({...args,model:clone,input:input(answers(c.id).slice(0,2))});assert.equal(state(r,c.id),'insufficient_evidence');
});
test('Self-identification cannot change commitment outcomes',()=>{
 const raw=answers('construct-NE15');
 const a=compareWorldview({...args,input:{...input(raw),selfReportedIdentities:['Stirnerian','Objectivist']}});
 assert.deepEqual(normalized(a),normalized(run(raw)));assert.equal(a.publicIdentityLabel,null);
});
for(const field of ['constructEstimates','probeResponses','memories','userProfile','preferredResult','countryMatches','figureMatches'])test('Refuse prior injection: '+field,()=>assert.throws(()=>compareWorldview({...args,input:{...input([]),[field]:{}}})));
test('Stale, duplicate, nonfinite and unpresented answers are rejected',()=>{
 const r=answers('construct-NE15')[0];
 for(const rs of [[r,r],[{...r,itemRevision:999}],[{...r,value:Infinity}],[{...r,state:'no_view',value:1}]])assert.throws(()=>run(rs));
 assert.throws(()=>compareWorldview({...args,input:{...input([r]),presentedItems:[]}}));
});
test('Catalog order and labels are irrelevant to evidence',()=>{
 const changed=structuredClone(model);changed.comparisons.reverse();changed.commitments.reverse();
 for(const p of changed.comparisons)p.label='Blind comparator '+p.id;
 assert.deepEqual(normalized(compareWorldview({...args,model:changed,input:input(answers('construct-NE15'))})),normalized(run(answers('construct-NE15'))));
});
test('Adding copies of a philosophical comparison cannot increase evidence or follow-up priority',()=>{
 const changed=structuredClone(model);changed.comparisons.push({...structuredClone(changed.comparisons[0]),id:'duplicate-display-only'});
 const a=planWorldviewFollowups({...args,input:input([]),maxItems:12});
 const b=planWorldviewFollowups({...args,model:changed,input:input([]),maxItems:12});assert.deepEqual(a,b);
});
test('Follow-ups balance all domains rather than starting with a favored philosophy',()=>{
 const p=planWorldviewFollowups({...args,input:input([]),maxItems:12});
 assert.equal(p.entries.length,12);assert.equal(new Set(p.entries.map(e=>e.domainId)).size,12);
 assert.equal(planWorldviewFollowups({...args,input:input([]),maxItems:0}).entries.length,0);
});
test('The same evidence rules apply to every comparison, including competing traditions',()=>{
 for(const p of model.comparisons){
  const rs=merge(...p.criteria.filter(c=>c.role==='defining').map(c=>answers(c.commitmentId,c.expected==='support'?'support':'oppose')));
  const result=run(rs).comparisons.find(c=>c.id===p.id);
  assert.equal(result.state,'supported_on_specified_commitments',p.id);
 }
});
for(const [p,h] of Object.entries(release.frozenSourceHashes)){
 const actual=createHash('sha256').update(await readFile(new URL(p,root))).digest('hex');
 test('Historical release frozen: '+p,()=>assert.equal(actual,h));
}
console.log('Generic worldview regressions passed: '+tests+' cases; no participant data or empirical validity claimed.');
