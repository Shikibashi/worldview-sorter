import {createQuiz,restoreQuiz,currentItem,seekQuestion,answerQuestion,nextQuestion,previousQuestion,quizProgress,EXPERIENCE_VERSION,COMPATIBLE_EXPERIENCE_VERSIONS} from '../../packages/experience/quiz.js';
import {buildQuizSummary,createSharePreview,DOMAIN_COPY} from '../../packages/experience/summary.js';
import {initialExploration,recordExploration} from '../../packages/experience/exploration.js';
import {shuffleWithSeed} from '../../packages/runtime/index.js';

const $=id=>document.getElementById(id);
const storageKey='worldview-sorter:quiz-experience:1';
const screens=['home','quiz','results','failure'];
const specialNames={no_view:'No view',not_understood:'I do not understand this item',not_applicable:'Not applicable'};
const instructions={agreement5:'Choose the response that fits your view.',importance5:'How important is this to you?',moral_relevance5:'How relevant is this to your moral judgment?',paired5:'Compare the two positions below.'};
let bank,pilot,scalesDoc,model,formPolicy,quiz=null,summary=null,loadedText=null,timer=null,shownAt=0,storageWorks=true;
let exploration=initialExploration();
const gameOptions=Object.freeze({enabled:false}); // Future post-result opt-in, never a score input.
const elem=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const show=id=>screens.forEach(s=>{$(s).hidden=s!==id;});
const announce=message=>{$('message').textContent=message;};
const fetchJSON=async path=>{const r=await fetch(new URL('../../'+path,import.meta.url),{cache:'no-store'});if(!r.ok)throw Error('Could not load '+path);return r.json();};
function cancelAdvance(){if(timer!==null)clearTimeout(timer);timer=null;}
function save(){
 if(!quiz)return;
 const value=JSON.stringify({experienceVersion:EXPERIENCE_VERSION,quiz});
 try{localStorage.setItem(storageKey,value);loadedText=value;storageWorks=true;}
 catch{storageWorks=false;announce('Browser storage is unavailable. You can continue, but save your answers before leaving.');}
 $('storage-status').textContent=storageWorks?'Saved on this device':'Not saved: use Save answers';
}
function download(value,name){
 const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
 const a=elem('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportAnswers(){if(quiz)download(quiz.session,'worldview-answers.json');}
function resultEvent(type,domainId){
 const event=type==='topic_opened'?{type,domainId}:{type};
 exploration=recordExploration(exploration,event,gameOptions);
}
function renderSaved(){
 $('saved').hidden=!loadedText;
 if(!loadedText)return;
 try{const s=JSON.parse(loadedText).quiz.session;$('saved-description').textContent=s.completionStatus==='completed'?'Your previous summary is saved on this device.':'You have a quiz in progress. Continue without starting over.';}
 catch{$('saved-description').textContent='A saved file could not be read. Back it up before deleting it.';}
}
function enterQuestion(){
 cancelAdvance();
 if(quiz.index===null){finish();return;}
 shownAt=performance.now();renderQuestion();show('quiz');$('question-title').focus();save();
}
function respond(state,value){
 if(timer!==null)return;
 answerQuestion(quiz,bank,scalesDoc,{state,value,responseTimeMs:Math.max(0,Math.round(performance.now()-shownAt))});
 save();renderQuestion();
 if($('auto').checked){
  $('next').disabled=true;$('back').disabled=true;
  timer=setTimeout(()=>{timer=null;nextQuestion(quiz,bank);enterQuestion();},200);
 }else document.querySelector('[aria-pressed="true"]')?.focus();
}
function renderQuestion(){
 const item=currentItem(quiz,bank);if(!item)return;
 const scale=scalesDoc.scales.find(s=>s.id===item.responseScaleId);
 const prior=quiz.session.responses.find(r=>r.itemId===item.id);
 const progress=quizProgress(quiz);
 $('quiz').dataset.itemId=item.id;
 $('quiz').dataset.responseType=item.responseType;
 $('quiz').dataset.scale=item.responseScaleId;
 $('topic').textContent=DOMAIN_COPY[item.domainId]?.[0]??item.domainId;
 $('position').textContent='Question '+(quiz.index+1)+' of '+quiz.packet.size;
 $('progress').value=progress.percent;
 $('progress-caption').textContent=progress.done+' of '+progress.total+' positions complete'+(progress.skipped?' · '+progress.skipped+' not applicable by branch':'');
 $('question-title').textContent=item.text;
 $('instruction').textContent=instructions[item.responseScaleId]??(item.responseType==='ranking'?'Rank every option, with 1 first. No order is selected for you.':'Choose the option closest to your view.');
 $('context').replaceChildren();
 if(item.responseType==='paired_choice')item.options.forEach(o=>$('context').append(elem('p',o.label)));
 const area=$('answer-options');area.replaceChildren();
 if(item.responseType==='ranking'){
  const ranks=new Map();
  if(prior?.state==='answered')prior.value.forEach((id,n)=>ranks.set(id,n+1));
  const order=shuffleWithSeed(item.options,quiz.session.randomizationSeed+':'+item.id+':rank-display');
  const confirm=elem('button','Confirm ranking','primary');confirm.id='confirm-ranking';
  const ready=()=>ranks.size===item.options.length&&new Set(ranks.values()).size===item.options.length;
  for(const option of order){
   const row=elem('div',undefined,'rank-row'),id='rank-'+option.id;
   const label=elem('label',option.label);label.htmlFor=id;
   const select=elem('select');select.id=id;select.setAttribute('aria-label','Rank: '+option.label);
   const none=elem('option','Choose rank');none.value='';select.append(none);
   for(let n=1;n<=order.length;n++){const op=elem('option',String(n));op.value=String(n);select.append(op);}
   select.value=ranks.has(option.id)?String(ranks.get(option.id)):'';
   select.addEventListener('change',()=>{
    if(select.value)ranks.set(option.id,Number(select.value));else ranks.delete(option.id);
    confirm.disabled=!ready();$('next').disabled=true;
   });
   row.append(label,select);area.append(row);
  }
  confirm.disabled=!ready();confirm.addEventListener('click',()=>{if(ready())respond('answered',[...ranks].sort((a,b)=>a[1]-b[1]).map(e=>e[0]));});area.append(confirm);
 }else{
  const options=['likert','paired_choice'].includes(item.responseType)?scale.options.map(o=>({label:o.label,value:o.value})):item.options.map(o=>({label:o.label,value:o.id}));
  for(const option of options){
   const button=elem('button',option.label,'answer');button.type='button';button.dataset.value=JSON.stringify(option.value);
   button.setAttribute('aria-pressed',String(prior?.state==='answered'&&JSON.stringify(prior.value)===JSON.stringify(option.value)));
   button.addEventListener('click',()=>respond('answered',option.value));area.append(button);
  }
 }
 $('special-options').replaceChildren();
 for(const state of item.specialStates){
  const button=elem('button',specialNames[state]??state);button.type='button';button.dataset.state=state;button.setAttribute('aria-pressed',String(prior?.state===state));
  button.addEventListener('click',()=>respond(state,null));$('special-options').append(button);
 }
 $('back').disabled=!quiz.session.presentedItems.some(e=>e.index<quiz.index&&e.presented&&!e.skippedByBranch);
 $('next').disabled=!prior;
}
function evidenceDetails(row){
 const details=elem('details'),heading=elem('summary','Why this appears · answers & sources');details.append(heading);
 details.append(elem('p',row.scope));details.append(elem('p',row.boundary,'small'));
 if(row.status==='mixed')details.append(elem('p','These answers differ. Context, wording, changing views or a genuine tension may explain this; it is not a consistency grade.','small'));
 for(const e of row.evidence){const block=elem('div',undefined,'evidence');block.append(elem('small',e.itemId+' · revision '+e.itemRevision),elem('p',e.text),elem('p','Your response: '+e.answer));details.append(block);}
 details.append(elem('p','This pattern uses authored rules, not a calibrated probability or population percentile.','small'));
 for(const source of row.sources){
  const block=elem('div',undefined,'source');
  let url;try{url=new URL(source.url);}catch{url=null;}
  if(url?.protocol==='https:'){const a=elem('a',source.title);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.addEventListener('click',()=>resultEvent('source_opened'));block.append(a);}else block.append(elem('span',source.title));
  block.append(elem('small',source.locator+' · Source access: '+source.access));details.append(block);
 }
 return details;
}
function finish(){
 cancelAdvance();save();
 summary=buildQuizSummary({model,bank,scalesDoc,session:quiz.session});
 resultEvent('quiz_finished');
 $('result-counts').textContent=summary.resolvedPatterns+' answer patterns · '+summary.answeredItems+' substantive responses · '+summary.specialResponses+' no-view, unclear or not-applicable responses';
 $('academic-notice').textContent=summary.academicNotice;$('coverage-notice').textContent=summary.coverageNotice;
 $('domain-map').replaceChildren();
 for(const domain of summary.domains){
  const card=elem('section',undefined,'domain'),details=elem('details'),head=elem('summary');
  head.append(elem('strong',domain.title),elem('span',domain.prompt),elem('span',domain.responses+' responses in this topic'));
  details.append(head);
  const facets=elem('div',undefined,'facet-coverage');
  for(const f of domain.facets??[]){const line=elem('p');line.dataset.facetId=f.id;line.append(elem('strong',f.title),elem('span',' · '+f.answeredItems+' responses'));facets.append(line);}
  details.append(facets);
  details.addEventListener('toggle',()=>{if(details.open)resultEvent('topic_opened',domain.id);});
  const known=domain.rows.filter(r=>r.status!=='insufficient_evidence'),partial=domain.rows.filter(r=>r.status==='insufficient_evidence');
  if(!known.length)details.append(elem('p','Still taking shape. Your responses do not yet support a broader pattern here.','small'));
  for(const row of [...known,...partial]){
   const block=elem('article',undefined,'pattern');block.dataset.state=row.status;block.dataset.commitmentId=row.id;
   block.append(elem('span',row.statusLabel,'state'),elem('h3',row.label),evidenceDetails(row));details.append(block);
  }
  if(!domain.rows.length)details.append(elem('p','Some answers may be recorded without a reviewed interpretation rule. They have not been discarded or turned into an assumed belief.','small'));
  if(domain.unresolvedConstructCount)details.append(elem('p',domain.unresolvedConstructCount+' constructs in this topic currently have no comparison rule.','small'));
  card.append(details);$('domain-map').append(card);
 }
 $('comparison-list').replaceChildren();
 const states={supported_on_specified_commitments:'Support on the commitments asked about',material_divergence:'Important differences in your answers',mixed_evidence:'Mixed answers',partial_evidence:'Partial evidence',insufficient_evidence:'Not enough evidence'};
 for(const c of summary.comparisons){const row=elem('div',undefined,'comparison');row.append(elem('h3',c.label),elem('p',states[c.state]??c.state,'small'),elem('p',c.scope,'small'));$('comparison-list').append(row);}
 $('sharing').hidden=true;show('results');$('results-title').focus();
}
function openShare(){
 $('share-options').replaceChildren();
 const candidates=summary.rows.filter(r=>r.status!=='insufficient_evidence');
 if(!candidates.length){announce('There are not enough interpreted answers to share a pattern yet. You can save your answers instead.');return;}
 const update=()=>{
  const selected=[...$('share-options').querySelectorAll('input:checked')].map(e=>e.value);
  $('share-preview').value=createSharePreview(summary,selected);$('copy-share').disabled=!selected.length;
 };
 for(const row of candidates){
  const label=elem('label'),check=elem('input');check.type='checkbox';check.value=row.id;
  check.addEventListener('change',()=>{if($('share-options').querySelectorAll('input:checked').length>6){check.checked=false;announce('Choose up to six patterns.');}update();});
  label.append(check,elem('span',row.statusLabel+': '+row.label));$('share-options').append(label);
 }
 update();$('sharing').hidden=false;$('share-title').scrollIntoView({block:'start'});
}
function start(size){
 if(loadedText&&!confirm('Starting another quiz replaces the locally saved quiz. Save a backup first to keep it. Continue?'))return;
 announce('');const seed=crypto.randomUUID();quiz=createQuiz({bank,pilot,scalesDoc,formPolicy,seed,size,sessionId:crypto.randomUUID(),locale:navigator.language||'en'});
 exploration=initialExploration();seekQuestion(quiz,bank,0);enterQuestion();
}
async function bootstrap(){
 const current=await fetchJSON('data/current.json');
 [bank,pilot,scalesDoc,model,formPolicy]=await Promise.all([fetchJSON(current.candidateBank.path),fetchJSON(current.pilot.path),fetchJSON('data/response-scales.json'),fetchJSON(current.worldviewModel.path),fetchJSON(current.publicForm.path)]);
 const names=[['A first look',80,'All core topics, with more distinctions left open.'],['A wider view',120,'All core topics, with more complete answer patterns.'],['A deep dive',160,'The widest selection of perspectives. No time limit.']];
 names.forEach(([name,size,description],index)=>{const button=elem('button',undefined,'route');button.dataset.size=String(size);button.append(elem('span','ROUTE 0'+(index+1),'route-number'),elem('strong',name),elem('span',size+' questions'),elem('span',description));button.addEventListener('click',()=>start(size));$('routes').append(button);});
 try{loadedText=localStorage.getItem(storageKey);}catch{storageWorks=false;announce('Local saving is unavailable. You can still take the quiz and export your answers.');}
 renderSaved();
 $('resume').addEventListener('click',()=>{try{
  const envelope=JSON.parse(loadedText);if(!COMPATIBLE_EXPERIENCE_VERSIONS.includes(envelope.experienceVersion))throw Error('This backup uses another interface version. Keep it for a compatible version.');
  quiz=restoreQuiz(envelope.quiz,{bank,pilot,scalesDoc,formPolicy});announce('');
  if(quiz.session.completionStatus==='completed')finish();else{seekQuestion(quiz,bank,quiz.index??0);enterQuestion();}
 }catch(e){announce(e.message+' Your saved data was not deleted.');}});
 $('backup-saved').addEventListener('click',()=>{if(loadedText)download(loadedText,'worldview-local-backup.json');});
 $('discard').addEventListener('click',()=>{if(!confirm('Delete the quiz saved on this device?'))return;try{localStorage.removeItem(storageKey);}catch{}loadedText=null;quiz=null;renderSaved();});
 $('back').addEventListener('click',()=>{cancelAdvance();previousQuestion(quiz,bank);enterQuestion();});
 $('next').addEventListener('click',()=>{cancelAdvance();nextQuestion(quiz,bank);enterQuestion();});
 $('auto').addEventListener('change',()=>{cancelAdvance();renderQuestion();});
 $('pause').addEventListener('click',()=>{cancelAdvance();save();renderSaved();show('home');$('resume').focus();});
 $('save-answers').addEventListener('click',exportAnswers);$('result-answers').addEventListener('click',exportAnswers);
 $('summary-save').addEventListener('click',()=>download(summary,'worldview-summary.json'));
 $('restart').addEventListener('click',()=>{cancelAdvance();renderSaved();show('home');});
 $('share-open').addEventListener('click',openShare);$('share-close').addEventListener('click',()=>{$('sharing').hidden=true;$('share-open').focus();});
 $('copy-share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share-preview').value);announce('The preview was copied. Nothing was posted.');}catch{$('share-preview').focus();$('share-preview').select();announce('Clipboard access is unavailable. The preview is selected for you to copy manually.');}});
 window.addEventListener('pagehide',()=>{cancelAdvance();save();});
 document.body.dataset.ready='true';show('home');
}
bootstrap().catch(e=>{$('failure-message').textContent=e.message;show('failure');});
