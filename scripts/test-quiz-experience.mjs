import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createQuiz,restoreQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion,previousQuestion,quizProgress} from '../packages/experience/quiz.js';
import {buildQuizSummary,createSharePreview} from '../packages/experience/summary.js';
import {initialExploration,recordExploration} from '../packages/experience/exploration.js';
import {generatePilotPacket} from '../packages/runtime/index.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json'),bank=await read(current.candidateBank.path),pilot=await read(current.pilot.path),scalesDoc=await read('data/response-scales.json'),model=await read('data/generic/model-v0.4.json');
const args={bank,pilot,scalesDoc},scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));let count=0;
const check=(name,fn)=>{fn();count++;console.log('PASS experience: '+name);};
const create=(size=80,seed='experience-test')=>createQuiz({...args,size,seed,sessionId:'synthetic-experience-session'});
const choose=item=>['likert','paired_choice'].includes(item.responseType)?scales.get(item.responseScaleId).options[0].value:item.responseType==='ranking'?item.options.map(o=>o.id):item.options[0].id;
const finish=quiz=>{seekQuestion(quiz,bank,0);let safety=0;while(quiz.index!==null){assert.ok(safety++<=quiz.packet.size);answerQuestion(quiz,bank,scalesDoc,{state:'answered',value:choose(currentItem(quiz,bank)),responseTimeMs:1234});nextQuestion(quiz,bank);}return quiz;};
check('The same seed uses the existing packet algorithm, not a game-specific form',()=>{const q=create();assert.deepEqual(q.packet,generatePilotPacket({bank,pilot,size:80,seed:'experience-test',packetId:pilot.pilotId+'-experience-test'}));});
check('No result feedback before completion',()=>assert.throws(()=>buildQuizSummary({model,bank,scalesDoc,session:create().session}),/after completion/));
check('No preselected substantive answer',()=>assert.equal(create().session.responses.length,0));
check('Next requires a response and never silently chooses neutral',()=>{const q=create();seekQuestion(q,bank);assert.throws(()=>nextQuestion(q,bank));assert.equal(q.session.responses.length,0);});
check('Neutral and no-view earn the same completion progress but remain different raw data',()=>{
 const q=create();seekQuestion(q,bank);const item=currentItem(q,bank);
 answerQuestion(q,bank,scalesDoc,{state:'no_view',value:null});const a=quizProgress(q);
 answerQuestion(q,bank,scalesDoc,{state:'answered',value:choose(item)});assert.deepEqual(quizProgress(q),a);
 assert.notEqual(q.session.responses[0].state,'no_view');
});
let complete;
for(const size of [80,120,160])check('Complete and restore the '+size+'-question route',()=>{
 const q=finish(create(size,'route-'+size));assert.equal(q.session.completionStatus,'completed');assert.equal(quizProgress(q).percent,100);
 assert.deepEqual(restoreQuiz(q,args),q);if(size===160)complete=q;
});
check('Restore rejects stale versions and altered packet entries',()=>{
 const q=structuredClone(complete);q.packet.entries[0].itemRevision=999;assert.throws(()=>restoreQuiz(q,args));
 const stale=structuredClone(complete);stale.session.bankVersion='unknown';assert.throws(()=>restoreQuiz(stale,args));
});
check('Back and unchanged responses preserve raw timing and answer-change counts',()=>{
 const q=create();seekQuestion(q,bank);const first=currentItem(q,bank);answerQuestion(q,bank,scalesDoc,{state:'answered',value:choose(first),responseTimeMs:1200});nextQuestion(q,bank);previousQuestion(q,bank);
 answerQuestion(q,bank,scalesDoc,{state:'answered',value:choose(first),responseTimeMs:1});assert.equal(q.session.responses[0].responseTimeMs,1200);assert.equal(q.session.responses[0].changedAnswerCount,0);
});
check('Changed branches invalidate dependent answers without erasing unrelated answers',()=>{
 let q;for(let n=0;n<50;n++){const trial=create(160,'branch-'+n);if(trial.packet.entries.some(e=>e.itemId==='RCI002')){q=finish(trial);break;}}
 assert.ok(q,'Find a packet with the divinity branch');
 const parent=q.packet.entries.find(e=>e.itemId==='RCI001');assert.ok(q.session.responses.some(r=>r.itemId==='RCI002'));
 const always=q.session.responses.filter(r=>r.itemId!=='RCI001'&&bank.items.find(i=>i.id===r.itemId).eligibility.mode==='always');
 seekQuestion(q,bank,parent.index);answerQuestion(q,bank,scalesDoc,{state:'answered',value:'none'});
 assert.ok(!q.session.responses.some(r=>r.itemId==='RCI002'));for(const r of always)assert.ok(q.session.responses.some(x=>JSON.stringify(x)===JSON.stringify(r)));
 seekQuestion(q,bank,q.packet.size);assert.equal(q.session.completionStatus,'completed');
 seekQuestion(q,bank,parent.index);answerQuestion(q,bank,scalesDoc,{state:'answered',value:'personal_divine'});seekQuestion(q,bank,q.packet.size);assert.notEqual(q.index,null);
});
let summary;
check('Summary reuses evidence, preserves answers and provides twelve domains',()=>{
 const before=JSON.stringify(complete.session);summary=buildQuizSummary({model,bank,scalesDoc,session:complete.session});assert.equal(JSON.stringify(complete.session),before);
 assert.equal(summary.domains.length,12);assert.equal(summary.identity,null);assert.equal(summary.matchPercent,null);
 assert.ok(summary.rows.some(r=>r.evidence.length));assert.ok(summary.rows.every(r=>r.sources.length>0));
 assert.match(summary.academicNotice,/not a validated/);
});
check('Share preview requires selection and excludes raw session metadata',()=>{
 const row=summary.rows.find(r=>!['insufficient_evidence','not_measured'].includes(r.status));assert.ok(row);
 const preview=createSharePreview(summary,[row.id]);assert.ok(preview.includes(row.label));
 for(const value of [complete.session.sessionId,complete.session.randomizationSeed,'responseTimeMs','itemRevision'])assert.ok(!preview.includes(value));
 assert.throws(()=>createSharePreview(summary,['invented']));assert.throws(()=>createSharePreview(summary,Array(7).fill(row.id)));
});
check('Gamification is off by default',()=>assert.deepEqual(recordExploration(initialExploration(),{type:'quiz_finished'}),initialExploration()));
check('Exploration awards are post-completion and idempotent',()=>{
 const enabled={enabled:true};assert.throws(()=>recordExploration(initialExploration(),{type:'source_opened'},enabled));
 let s=recordExploration(initialExploration(),{type:'quiz_finished'},enabled);s=recordExploration(s,{type:'topic_opened',domainId:'ME'},enabled);
 const again=recordExploration(s,{type:'topic_opened',domainId:'ME'},enabled);assert.deepEqual(again,s);
 s=recordExploration(s,{type:'topic_opened',domainId:'NE'},enabled);s=recordExploration(s,{type:'topic_opened',domainId:'PL'},enabled);s=recordExploration(s,{type:'source_opened'},enabled);
 assert.deepEqual(s.awards,['map-opened','three-topics-explored','source-reader']);
});
check('Reward input refuses beliefs, timing, identity, scores and consistency',()=>{
 for(const key of ['answers','value','scores','ideology','speed','responseTimeMs','consistency','sessionId'])assert.throws(()=>recordExploration(initialExploration(),{type:'quiz_finished',[key]:'injected'},{enabled:true}));
});
check('Enabling or disabling the separate reward reducer cannot change results',()=>{
 const before=JSON.stringify(complete.session);for(const enabled of [false,true]){let game=initialExploration();game=recordExploration(game,{type:'quiz_finished'},{enabled});game=recordExploration(game,{type:'source_opened'},{enabled});assert.deepEqual(buildQuizSummary({model,bank,scalesDoc,session:complete.session}),summary);}assert.equal(JSON.stringify(complete.session),before);
});
check('The public app has no automatic answer submission; product metrics are disabled by default',()=>{});
const app=await readFile(new URL('apps/quiz/app.js',root),'utf8');
assert.ok(!/\/api\/pilot\/sessions|sendBeacon/.test(app));
assert.match(app,/if\(!quiz\|\|!\$\('research-optin'\)\.checked\|\|currentResearchReceipt\)return/);
assert.match(app,/\$\('research-submit'\)\.addEventListener\('click',contributeResearch\)/);
const policy=await read('data/experience/policy-v1.json');assert.equal(policy.gamification.enabled,false);assert.equal(policy.questionnairePolicy.rewriteItemText,false);
const hashes=(await read('data/generic/release-v0.1.json')).frozenSourceHashes;
for(const [file,hash] of Object.entries(hashes)){assert.equal(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex'),hash);count++;}
console.log('Experience regressions passed: '+count+'. Synthetic fixtures test software only, not enjoyment or measurement validity.');
