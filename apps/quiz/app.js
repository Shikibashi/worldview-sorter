import {createQuiz,restoreQuiz,currentItem,seekQuestion,answerQuestion,nextQuestion,previousQuestion,quizProgress,extendProgressiveQuiz,recordDepthCheckpoint,EXPERIENCE_VERSION,COMPATIBLE_EXPERIENCE_VERSIONS} from '../../packages/experience/quiz.js';
import {buildQuizSummary,DOMAIN_COPY} from '../../packages/experience/summary.js';
import {initialExploration,recordExploration,initialExplorationV2,recordExplorationV2} from '../../packages/experience/exploration.js';
import {buildShareSnapshot,shareSnapshotText,shareSnapshotSvg,readingTrailFor,compareTraditions,recommendExploration} from '../../packages/experience/engagement.js';
import {shuffleWithSeed} from '../../packages/runtime/index.js';
import {planWorldviewFollowups} from '../../packages/worldview/index.js';
import {validateLocalizationCatalog,validateLocalizationBundle,routeLocalizationAvailability,localizeItem,localizeSummary} from '../../packages/localization/index.js';

const $=id=>document.getElementById(id);
const staticRelease=document.querySelector('meta[name="worldview-static-release"]')?.content??null;
const storageKey='worldview-sorter:quiz-experience:1';
const researchReceiptKey='worldview-sorter:research-receipts:1',researchLinkKey='worldview-sorter:research-link:1';
const screens=['home','quiz','results','failure'];
const specialNames={no_view:'No view',not_understood:'I do not understand this item',not_applicable:'Not applicable'};
const instructions={agreement5:'Choose the response that fits your view.',importance5:'How important is this to you?',moral_relevance5:'How relevant is this to your moral judgment?',paired5:'Compare the two positions below.'};
let bank,pilot,scalesDoc,model,experiencePolicy,progressivePolicy=null,affinityCatalog=null,activeAffinityCatalog=null,affinityPilot=null,affinityCatalogVersions=[],formPolicies=[],models=new Map(),quiz=null,summary=null,loadedText=null,timer=null,shownAt=0,storageWorks=true;
let localizationCatalog=null,localizationCatalogs=[],localizationBundles=new Map(),localizationBundlesByVersion=new Map(),activeLocalizationBundle=null;
let modelReleases=[],activeModelReleaseVersion=null;
let resultReplayQualification=null;
let researchConfig={enabled:false},researchReceipts=[],currentResearchReceipt=null;
let productMetrics={enabled:false};
let betaConfig={channel:staticRelease?'stable':'development',modelReleaseVersion:staticRelease,
 features:{adaptiveClarification:true,affinityDisplay:true,sharing:true,feedback:false}};
let saveConflict=false;
let proposedClarification=null;
let exploration=initialExploration();
let activity=initialExplorationV2(),shareSnapshot=null;
const gameOptions=Object.freeze({enabled:false}); // Future post-result opt-in, never a score input.
const elem=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const show=id=>screens.forEach(s=>{$(s).hidden=s!==id;});
const announce=message=>{$('message').textContent=message;};
const fetchJSON=async path=>{const r=await fetch(new URL('../../'+path,import.meta.url),{cache:'no-store'});if(!r.ok)throw Error('Could not load '+path);return r.json();};
function cancelAdvance(){if(timer!==null)clearTimeout(timer);timer=null;}
function save(){
 if(!quiz)return;
 const value=JSON.stringify({experienceVersion:EXPERIENCE_VERSION,quiz});
 if(saveConflict){announce('Another tab changed the saved quiz. This tab is not saving. Save your raw answers, then reload to see the latest saved quiz.');$('storage-status').textContent='Not saved: another tab changed this quiz';return false;}
 try{
  if(localStorage.getItem(storageKey)!==loadedText){saveConflict=true;return save();}
  localStorage.setItem(storageKey,value);loadedText=value;storageWorks=true;
 }
 catch{storageWorks=false;recordProductEvent('save_failed',null,true);announce('Browser storage is unavailable. You can continue, but save your answers before leaving.');}
 $('storage-status').textContent=storageWorks?'Saved on this device':'Not saved: use Save answers';
 return storageWorks;
}
function download(value,name){
 const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
 const a=elem('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadSvg(value,name){const url=URL.createObjectURL(new Blob([value],{type:'image/svg+xml'}));
 const a=elem('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportAnswers(){if(quiz)download(quiz.session,'worldview-answers.json');}
function resultEvent(type,domainId){
 const event=type==='topic_opened'?{type,domainId}:{type};
 exploration=recordExploration(exploration,event,gameOptions);
}
function activityEvent(type,field,value){
 try{activity=recordExplorationV2(activity,{type,[field]:value});
  if(quiz)localStorage.setItem('worldview-sorter:exploration:2:'+quiz.session.sessionId,JSON.stringify(activity));
  renderExplorationProgress();
 }catch{}
}
function loadActivity(){
 activity=initialExplorationV2();
 try{const saved=JSON.parse(localStorage.getItem('worldview-sorter:exploration:2:'+quiz.session.sessionId));
  if(saved?.version===activity.version&&typeof saved.finished==='boolean'&&
   ['domains','traditions','sourceDomains','sourceTraditions','unresolvedDomains','readingDomains','routes','milestones'].every(key=>Array.isArray(saved[key])&&saved[key].every(x=>typeof x==='string')))
   activity=saved;
 }catch{}
}
function renderExplorationProgress(){
 if(!$('exploration-progress'))return;
 const assessed=summary?.rows.filter(r=>['supported','opposed','mixed_context_dependent','mixed'].includes(r.status)).length??0;
 $('exploration-progress').textContent=activity.domains.length+' of '+summary?.domains.length+' domains opened · '+assessed+' interpreted areas assessed by this route · '+activity.traditions.length+' traditions inspected · '+(activity.sourceDomains.length+activity.sourceTraditions.length)+' source trails opened.';
 const names={'all-domains-explored':'Opened every domain','source-trail-opened':'Opened a philosophical source',
  'two-traditions-inspected':'Inspected two traditions','open-question-inspected':'Inspected an open question',
  'multiple-depths-explored':'Completed more than one depth on this administration'};
 $('milestone-list').replaceChildren(...activity.milestones.map(id=>elem('li',names[id])));
 if(!activity.milestones.length)$('milestone-list').append(elem('li','No milestones recorded yet.'));
}
function recordProductEvent(event,domainId=null,once=false,shareFormat=null){
 if(!productMetrics.enabled||!quiz)return;
 const routeId=quiz.depth?.currentRouteId??'full';
 const itemCount=quiz.session.responses.length;
 const marker='worldview-sorter:product-event:'+quiz.session.sessionId+':'+event+':'+quiz.packet.size+':'+(domainId??'');
 try{if(once&&sessionStorage.getItem(marker))return;if(once)sessionStorage.setItem(marker,'1');}catch{}
 const payload={version:'route-product-events-1',event,routeId,itemCount,...(domainId?{domainId}:{}),...(shareFormat?{shareFormat}:{})};
 try{fetch('/api/product/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});}catch{}
}
function feedbackContext(kind){
 const release=quiz?.session.modelReleaseVersion??activeModelReleaseVersion;
 if(kind==='product')return {modelReleaseVersion:release,administrationReleaseChannel:quiz?.session.releaseChannel??betaConfig.channel,
  location:!$('failure').hidden?'failure':$('quiz').hidden?$('results').hidden?'home':'results':'question',
  locale:quiz?.session.localization?.locale??'en-US'};
 const routeId=quiz.depth?.currentRouteId??quiz.packet.routeId??'full';
 const route=progressivePolicy?.routes.find(r=>r.id===routeId);
 const context={modelReleaseVersion:release,administrationReleaseChannel:quiz.session.releaseChannel??betaConfig.channel,
  routeId,routeVersion:quiz.packet.routeVersion??route?.routeVersion,
  formPolicyVersion:quiz.packet.formPolicyVersion,instrumentVersion:quiz.session.instrumentVersion,
  modelVersion:model.modelVersion,resultSemanticsVersion:model.resultSemanticsVersion,
  affinityCatalogVersion:affinityCatalog.catalogVersion,locale:quiz.session.localization?.locale??'en-US',
  localizationBundleVersion:quiz.session.localization?.bundleVersion};
 if(kind==='question'){const item=currentItem(quiz,bank);context.itemId=item.id;context.itemRevision=item.revision;}
 if(kind==='result'){const [type,id]=$('result-feedback-target').value.split(':');
  if(type==='proposition')context.propositionId=id;else context.traditionId=id;}
 return context;
}
async function submitFeedback(kind){
 const button=$(kind+'-feedback-send'),status=$(kind+'-feedback-status');
 button.disabled=true;status.textContent='Sending feedback…';
 try{const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({kind,category:$(kind+'-feedback-category').value,context:feedbackContext(kind),
   text:$(kind+'-feedback-text').value})});
  if(!response.ok)throw Error('Feedback could not be saved. Your quiz remains available.');
  const receipt=await response.json();
  $(kind+'-feedback-text').value='';status.textContent='Thank you. Your report was saved for review. Reference: '+receipt.feedbackId+'.';
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
}
function prepareResultFeedback(){
 const options=[...summary.rows.map(row=>({type:'proposition',id:row.id,label:row.label})),
  ...(betaConfig.features.affinityDisplay?summary.affinities?.traditions??[]:[]).map(row=>({type:'tradition',id:row.id,label:row.name}))];
 $('result-feedback-target').replaceChildren(...options.map(row=>{const option=elem('option',row.label);
  option.value=row.type+':'+row.id;return option;}));
 $('result-feedback').hidden=!betaConfig.features.feedback||!quiz.session.localization||!options.length;
}
function renderSaved(){
 $('saved').hidden=!loadedText;
 if(!loadedText){renderResearchReceipts();return;}
 try{const s=JSON.parse(loadedText).quiz.session;$('saved-description').textContent=s.completionStatus==='completed'?'Your previous answers are saved on this device. Reopen them to rebuild the summary with their pinned model.':'You have a quiz in progress. Continue without starting over.';}
 catch{$('saved-description').textContent='A saved file could not be read. Back it up before deleting it.';}
 renderResearchReceipts();
}
function renderResearchReceipts(){
 if(staticRelease){$('privacy-controls').hidden=true;return;}
 const active=researchReceipts.filter(r=>['active','pending'].includes(r?.status)&&r.contributionId&&r.withdrawalToken);
 let linked=false;try{linked=Boolean(localStorage.getItem(researchLinkKey));}catch{}
 $('privacy-controls').hidden=!active.length&&!linked;
 $('forget-research-link').hidden=!linked;
 const list=$('research-receipt-list');list.replaceChildren();
 for(const receipt of active){
  const row=elem('div',undefined,'receipt-row');
  row.append(elem('p',(receipt.status==='pending'?'Unconfirmed contribution ':'Contribution ')+receipt.contributionId.slice(0,8)+'…'));
  const saveButton=elem('button','Save withdrawal receipt');saveButton.type='button';
  saveButton.addEventListener('click',()=>download({contributionId:receipt.contributionId,withdrawalToken:receipt.withdrawalToken,
   consentVersion:receipt.consentVersion},'worldview-research-withdrawal.json'));
  const withdrawButton=elem('button',receipt.status==='pending'?'Check and withdraw if received':'Withdraw this contribution');withdrawButton.type='button';
  withdrawButton.addEventListener('click',()=>withdrawReceipt(receipt,withdrawButton));
  row.append(saveButton,withdrawButton);list.append(row);
 }
}
function enterQuestion(){
 cancelAdvance();
 if(quiz.index===null){tryFinish(true);return;}
 shownAt=performance.now();renderQuestion();show('quiz');
 // Keep the question frame at one viewport position while moving keyboard focus to its heading.
 $('question-title').focus({preventScroll:true});
 const top=$('quiz').getBoundingClientRect().top+window.scrollY;
 window.scrollTo(0,Math.max(0,top-16));
 save();
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
 const canonicalItem=currentItem(quiz,bank);if(!canonicalItem)return;
 const canonicalScale=scalesDoc.scales.find(s=>s.id===canonicalItem.responseScaleId);
 const realization=activeLocalizationBundle?localizeItem(activeLocalizationBundle,canonicalItem,canonicalScale):null;
 const item=realization?.item??canonicalItem,scale=realization?.scale??canonicalScale;
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
 $('instruction').textContent=instructions[item.responseScaleId]??(item.responseType==='ranking'?'Rank every option once, using each number only once. No order is selected for you.':'Choose the option closest to your view.');
 $('context').replaceChildren();
 if(item.responseType==='paired_choice')item.options.forEach(o=>$('context').append(elem('p',o.label)));
 const area=$('answer-options');area.replaceChildren();
 if(item.responseType==='ranking'){
  const ranks=new Map();
  if(prior?.state==='answered')prior.value.forEach((id,n)=>ranks.set(id,n+1));
  const order=shuffleWithSeed(item.options,quiz.session.randomizationSeed+':'+item.id+':rank-display');
  const confirm=elem('button','Confirm ranking','primary');confirm.id='confirm-ranking';
  const ready=()=>ranks.size===item.options.length&&new Set(ranks.values()).size===item.options.length;
  const status=elem('p','', 'small');status.id='ranking-status';status.setAttribute('role','status');
  const update=()=>{confirm.disabled=!ready();status.textContent=ranks.size===0||ready()?'':
   ranks.size<item.options.length?'Choose a rank for every option.':'Use each rank only once.';};
  for(const option of order){
   const row=elem('div',undefined,'rank-row'),id='rank-'+option.id;
   const label=elem('label',option.label);label.htmlFor=id;
   const select=elem('select');select.id=id;select.setAttribute('aria-label','Rank: '+option.label);
   const none=elem('option','Choose rank');none.value='';select.append(none);
   for(let n=1;n<=order.length;n++){const op=elem('option',String(n));op.value=String(n);select.append(op);}
   select.value=ranks.has(option.id)?String(ranks.get(option.id)):'';
   select.addEventListener('change',()=>{
    if(select.value)ranks.set(option.id,Number(select.value));else ranks.delete(option.id);
    update();$('next').disabled=true;
   });
   row.append(label,select);area.append(row);
  }
  update();confirm.addEventListener('click',()=>{if(ready())respond('answered',[...ranks].sort((a,b)=>a[1]-b[1]).map(e=>e[0]));});area.append(status,confirm);
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
  const button=elem('button',realization?.specialStates?.[state]??specialNames[state]??state);button.type='button';button.dataset.state=state;button.setAttribute('aria-pressed',String(prior?.state===state));
  button.addEventListener('click',()=>respond(state,null));$('special-options').append(button);
 }
 $('back').disabled=!quiz.session.presentedItems.some(e=>e.index<quiz.index&&e.presented&&!e.skippedByBranch);
 $('next').disabled=!prior;
}
function evidenceDetails(row){
 const details=elem('details'),heading=elem('summary','Why this appears · answers & sources');details.append(heading);
 const proposition=row.proposition??row.scope;
 const scopeOnly=!['explicit_rule_proposition','explicit_derived_proposition'].includes(row.propositionBasis);
 details.append(elem('p',(scopeOnly?'Authored interpretation scope: ':'Proposition considered: ')+proposition));
 if(scopeOnly)details.append(elem('p','This inherited rule has no separately recorded standalone proposition. Read its scope with the answer evidence and limits below.','small'));
 if(row.scope&&row.scope!==proposition)details.append(elem('p','Scope: '+row.scope,'small'));
 details.append(elem('p',row.boundary,'small'));
 if(row.explanation)details.append(elem('p',row.explanation,'small'));
 if(row.dependencies?.length){
  details.append(elem('p','This conclusion uses these direct propositions:'));
  const list=elem('ul');
  for(const dependency of row.dependencies){
   const direct=summary?.rows.find(candidate=>candidate.id===dependency.ruleId&&candidate.inferenceStatus==='direct');
   const proposition=direct?.proposition??direct?.scope??dependency.ruleId;
   list.append(elem('li',proposition+(direct?.propositionBasis==='inherited_rule_scope'?' (inherited rule scope)':'')+' · observed: '+dependency.observedState.replaceAll('_',' ')+
    '; required: '+dependency.requiredState.replaceAll('_',' ')));
  }
  details.append(list,elem('p','Inspect each direct result in the topic map for its question evidence.','small'));
 }
 if(row.interpretationRule?.neighbors?.length)details.append(elem('p','Nearby views this result does not settle: '+row.interpretationRule.neighbors.join(' · '),'small'));
 if(row.interpretationRule?.nonEntailments?.length)details.append(elem('p','This result does not imply: '+row.interpretationRule.nonEntailments.join(' · '),'small'));
 if(row.interpretationRule?.falsePositives?.length)details.append(elem('p','Similar answers can also reflect: '+row.interpretationRule.falsePositives.join(' · '),'small'));
 const technical=elem('details'),technicalHeading=elem('summary','Technical provenance');technical.append(technicalHeading);
 if(row.interpretationRule)technical.append(elem('p','Interpretation '+row.interpretationRule.version+' · '+row.interpretationRule.kind+' rule '+row.interpretationRule.id,'small'));
 if(row.inferenceStatus==='direct'&&row.presentationReview?.state!=='eligible'){
  technical.append(elem('p','Direct presentation review: '+row.presentationReview.state.replaceAll('_',' ')+
   '. Historical authored evidence state: '+row.status.replaceAll('_',' ')+'.','small'));
 }
 if(row.presentationReview?.state!=='eligible'&&row.inferenceStatus==='derived'){
  technical.append(elem('p','Historical authored engine state: '+row.status.replaceAll('_',' ')+'. Presentation review: '+row.presentationReview.state.replaceAll('_',' ')+'.','small'));
  if(row.presentationReview.unresolvedPrerequisiteRuleIds.length)
   technical.append(elem('p','Prerequisites without an approved exact public proposition: '+row.presentationReview.unresolvedPrerequisiteRuleIds.join(', ')+'.','small'));
  if(row.presentationReview.claimUnlinkedPrerequisiteRuleIds.length||row.presentationReview.derivedClaimUnlinked)
   technical.append(elem('p','Rule-linked supporting source claims remain to be reviewed for this derived rule or its prerequisites.','small'));
 }
 for(const dependency of row.dependencies??[])technical.append(elem('p','Uses '+dependency.ruleId+': '+dependency.observedState+' (requires '+dependency.requiredState+').','small'));
 if(['mixed','mixed_context_dependent'].includes(row.status))details.append(elem('p','These answers differ. Context, wording, changing views or a genuine tension may explain this; it is not a consistency grade.','small'));
 const target=scopeOnly?'this inherited rule scope':'this exact proposition';
 const meanings={support:'Supports '+target,oppose:'Opposes '+target,neutral:'Neither supports nor opposes it',
  qualified_or_non_directional:'Not directional evidence for '+target,no_view:'No view recorded',
  not_understood:'Question not understood',not_applicable:'Not applicable',direct_conflict:'Conflicts with this derived conclusion'};
 for(const e of row.evidence){const block=elem('div',undefined,'evidence');
  const meaning=meanings[e.meaning??e.interpretation]??'No directional evidence meaning recorded';
  block.append(elem('p',e.text),elem('p','Your response: '+e.answer),elem('p','Evidence meaning: '+meaning,'small'));
  technical.append(elem('small',e.itemId+' · revision '+e.itemRevision));details.append(block);}
 details.append(technical);
 details.append(elem('p','This pattern uses authored rules, not a calibrated probability or population percentile.','small'));
 for(const source of row.sources){
  const block=elem('div',undefined,'source');
  let url;try{url=new URL(source.url);}catch{url=null;}
  if(url?.protocol==='https:'){const a=elem('a',source.title);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.addEventListener('click',()=>{resultEvent('source_opened');activityEvent('source_opened','domainId',row.domainId);recordProductEvent('source_opened',row.domainId);});block.append(a);}else block.append(elem('span',source.title));
  block.append(elem('small',source.locator+' · Source access: '+source.access));
  if(source.claimScope==='rule_linked')for(const link of source.claimLinks)
   block.append(elem('p','Rule-linked source claim ('+link.relationship+'): '+link.claim,'small'));
  else if(source.claim)block.append(elem('p','Source record context; relevance to '+target+' needs review: '+source.claim,'small'));
  else block.append(elem('p','Claim-level relevance to '+target+' is not recorded for this source. Its citation does not validate these questions.','small'));
  if(source.validatesThisQuiz===false)block.append(elem('p','This source does not validate this questionnaire.','small'));
  details.append(block);
 }
 return details;
}
function patternBlock(row){
 const block=elem('article',undefined,'pattern');block.dataset.state=row.displayState??row.status;block.dataset.commitmentId=row.id;
 block.append(elem('span',row.statusLabel,'state'),elem('h3',row.label));
 if(row.propositionBasis==='inherited_rule_scope')
  block.append(elem('p','Provisional authored scope: this historical rule has no separately recorded exact proposition.','small'));
 if(row.explanation)block.append(elem('p',row.explanation,'small'));
 block.append(evidenceDetails(row));return block;
}
const affinityStateLabel={overlap_on_measured_core:'Overlap on the measured core',overlap_with_unmeasured_core:'Overlap, with defining doctrine unmeasured',overlap_with_unresolved_core:'Overlap, with defining doctrine unresolved',material_divergence:'A defining divergence',no_sufficiently_established_affinity:'No sufficiently established affinity',legacy_scope_unresolved:'Doctrinal affinity unresolved: defining evidence uses inherited rule scopes',source_claim_unresolved:'Doctrinal affinity unresolved: a defining proposition lacks a linked supporting source claim'};
const affinityFindingLabel={overlap:'Overlap',divergence:'Divergence',unresolved:'Insufficient or leaning evidence',contradictory:'Mixed evidence',partial:'Partial mapping; doctrine unresolved',unmeasured:'Not measured by this pilot'};
function affinityBlock(tradition,presentation){
 const card=elem('article',undefined,'affinity');card.dataset.traditionId=tradition.id;card.dataset.state=presentation?.state??tradition.summaryState;
 const sourceById=new Map(tradition.sources.map(source=>[source.id,source]));
 const sourceLink=source=>{let url;try{url=new URL(source.url);}catch{url=null;}
  if(url?.protocol!=='https:')return elem('span',source.title);
  const a=elem('a',source.title);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';
  a.addEventListener('click',()=>{resultEvent('source_opened');activityEvent('tradition_source_opened','traditionId',tradition.id);recordProductEvent('source_opened');});
  return a;};
 card.append(elem('span',tradition.scope.replaceAll('_',' '),'eyebrow'),elem('h3',tradition.name),
  elem('p',affinityStateLabel[presentation?.state??tradition.summaryState],'affinity-state'));
 const highlights=tradition.overlap.filter(c=>c.role==='defining').slice(0,2);
 if(highlights.length){
  card.append(elem('p',(['legacy_scope_unresolved','source_claim_unresolved'].includes(presentation?.state)?
   'Authored criterion overlap under review: ':'Where your interpreted answers overlap with catalog doctrine: ')+highlights.map(c=>c.doctrine).join(' '),'small'));
  if(highlights.some(c=>summary?.rows.find(row=>row.id===c.mapping.propositionId)?.propositionBasis==='inherited_rule_scope'))
   card.append(elem('p','Some overlap uses an inherited rule scope rather than a separately recorded proposition. Inspect the evidence and limits below.','small'));
 }
 if(tradition.divergence.some(c=>c.role==='defining'))card.append(elem('p',
  ['legacy_scope_unresolved','source_claim_unresolved'].includes(presentation?.state)?
  'An authored defining criterion diverges, but its doctrinal evidence basis still needs review.':
  'A defining commitment diverges; inspect the detail before drawing any further comparison.','small'));
 if(tradition.unmeasuredDefining.length)card.append(elem('p',tradition.unmeasuredDefining.length+' defining commitment'+(tradition.unmeasuredDefining.length===1?' is':'s are')+' unmeasured.','small'));
 const detail=elem('details'),head=elem('summary','Inspect doctrine, gaps & sources');detail.append(head,elem('p',tradition.context));
 for(const c of tradition.criteria){const row=elem('div',undefined,'affinity-criterion');row.dataset.finding=c.finding;
  const mapped=c.mapping.propositionId?summary?.rows.find(result=>result.id===c.mapping.propositionId):null;
  const unreviewedMapping=mapped?.presentationReview?.state!=='eligible'&&mapped?.presentationReview?.state!=null;
  row.append(elem('strong',(c.finding==='overlap'&&unreviewedMapping?'Authored overlap under review':affinityFindingLabel[c.finding])+' · '+c.role),
   elem('p',c.doctrine),elem('p',c.mapping.note,'small'));
  if(c.mapping.propositionId){
   row.append(elem('p','Pilot mapping: '+c.mapping.status.replaceAll('_',' '),'small'));
   row.append(elem('p',mapped?(mapped.propositionBasis==='inherited_rule_scope'?'Interpreted rule scope: '+mapped.scope:'Interpreted proposition: '+mapped.proposition):
    'Mapped proposition unavailable in this result version.','small'));
   if(mapped?.presentationReview?.state==='inherited_rule_scope')
    row.append(elem('p','This mapped rule has no separately reviewed exact proposition.','small'));
   else if(mapped?.presentationReview?.state==='source_claim_unresolved')
    row.append(elem('p','This mapped proposition lacks a rule-linked supporting academic claim.','small'));
   else if(unreviewedMapping)
    row.append(elem('p','This mapped interpretation awaits model review; its authored engine state is retained for historical context.','small'));
   row.append(elem('p','Evidence state: '+(c.observedState??'not observed').replaceAll('_',' ')+
    (c.leanDirection?' ('+c.leanDirection+')':''),'small'));
   row.append(elem('small','Proposition reference: '+c.mapping.propositionId));
  }else row.append(elem('p',c.mapping.status==='unsuitable'?'This doctrine is unsuitable for questionnaire inference.':
   'No pilot proposition currently measures this doctrine.','small'));
  const criterionSources=elem('p',undefined,'small');criterionSources.append(elem('span','Criterion sources: '));
  for(const [index,id] of c.sourceIds.entries()){
   if(index)criterionSources.append(elem('span',' · '));
   const source=sourceById.get(id);criterionSources.append(source?sourceLink(source):elem('span','Unavailable source record '+id));
  }
  row.append(criterionSources);
  detail.append(row);
 }
 detail.append(elem('h4','Important non-entailments'));
 for(const note of tradition.nonEntailments)detail.append(elem('p',note,'small'));
 detail.append(elem('h4','Nearby views and discriminators'),elem('p',tradition.neighbors.join(' · '),'small'));
 for(const note of tradition.discriminators)detail.append(elem('p',note,'small'));
 detail.append(elem('p',tradition.sourceNotes,'small'),elem('h4','Academic and primary sources'));
 for(const source of tradition.sources)detail.append(sourceLink(source));
 card.append(detail);return card;
}
function renderAffinities(affinities,presentation){
 $('affinity-section').hidden=!affinities;
 $('affinity-list').replaceChildren();$('affinity-other-list').replaceChildren();
 if(!affinities)return;
 $('affinity-empty').hidden=presentation?.hasEstablishedAffinity??affinities.hasEstablishedAffinity;
 const featured=affinities.traditions.filter(t=>t.overlap.some(c=>c.role==='defining'));
 const other=affinities.traditions.filter(t=>!featured.includes(t));
 const presentationById=new Map(presentation?.traditions.map(row=>[row.traditionId,row])??[]);
 $('affinity-list').replaceChildren(...featured.map(t=>affinityBlock(t,presentationById.get(t.id))));
 $('affinity-other-list').replaceChildren(...other.map(t=>affinityBlock(t,presentationById.get(t.id))));
 $('affinity-other').hidden=!other.length;
 $('affinity-version').textContent='Catalog '+affinities.catalogVersion+' · pilot interpretation '+affinities.modelVersion+' · source: public interpretations';
}
function renderResearch(){
 const terms=researchConfig.consent;
 const eligible=researchConfig.enabled&&terms?.consentVersion===researchConfig.consentVersion&&model.engineVersion==='generic-evidence-3'&&
  quiz.packet.selectionMethod==='frozen-packet-1';
 $('research-section').hidden=!eligible;if(!eligible)return;
 for(const [id,key] of [['research-title','title'],['research-purpose','purpose'],['research-data-use','dataUse'],
  ['research-privacy','privacy'],['research-withdrawal','withdrawal'],['research-affirmation-label','affirmationLabel'],
  ['research-linkage-label','linkageLabel']])$(id).textContent=terms[key];
 currentResearchReceipt=researchReceipts.find(r=>r.sessionId===quiz.session.sessionId&&r.status==='active')??null;
 const pendingReceipt=researchReceipts.find(r=>r.sessionId===quiz.session.sessionId&&r.status==='pending');
 $('research-optin').checked=false;$('research-link').checked=false;
 $('research-submit').disabled=true;
 $('research-receipt').hidden=!currentResearchReceipt;
 $('research-receipt-text').value=currentResearchReceipt?JSON.stringify({contributionId:currentResearchReceipt.contributionId,withdrawalToken:currentResearchReceipt.withdrawalToken,consentVersion:currentResearchReceipt.consentVersion},null,2):'';
 $('research-status').textContent=currentResearchReceipt?'This attempt was contributed. Keep the private receipt to withdraw it.':pendingReceipt?'The previous submission could not be confirmed. Reaffirm consent and retry; the same receipt and link choice will be used.':'';
}
function planClarification(domainId){
 return planWorldviewFollowups({model,bank,scalesDoc,input:quiz.session,routeManifest:progressivePolicy,
  allowedItemRefs:progressivePolicy.routes.at(-1).itemRefs,domainId,maxItems:progressivePolicy.clarificationBudget,
  affinityCatalog});
}
function updateClarificationChoice(){
 if(!quiz?.depth)return;
 proposedClarification=planClarification($('depth-domain').value);
 const count=proposedClarification.entries.length;
 $('depth-clarify').disabled=!count;
 $('depth-clarify').textContent=count?'Explore up to '+count+' clarifying question'+(count===1?'':'s'):'No useful questions here';
 $('depth-status').textContent=count?'These questions target weak, mixed, or unmeasured direct evidence in this topic. You can stop after any completed stage.':
  'This route has no additional reviewed question for this topic that the planner can justify.';
 if(count&&betaConfig.features.adaptiveClarification)recordProductEvent('clarification_offered',$('depth-domain').value,true);
}
function renderDepthActions(){
 $('depth-section').hidden=!quiz?.depth||Boolean(resultReplayQualification);
 if(!quiz?.depth||resultReplayQualification){proposedClarification=null;return;}
 const current=progressivePolicy.routes.findIndex(r=>r.id===quiz.depth.currentRouteId);
 const assigned=new Set(quiz.packet.entries.map(e=>e.itemId));
 for(const [button,id] of [['depth-next-standard','standard'],['depth-next-full','full']]){
  const target=progressivePolicy.routes.find(r=>r.id===id),index=progressivePolicy.routes.indexOf(target);
  const count=target.itemRefs.filter(ref=>!assigned.has(ref.itemId)).length;
  $(button).hidden=index<=current||count===0;
  $(button).textContent='Continue to '+(id==='standard'?'Standard':'Full')+' · up to '+count+' new questions';
 }
 const select=$('depth-domain');select.replaceChildren(...summary.domains.map(d=>{
  const option=elem('option',d.title);option.value=d.id;return option;
 }));
 $('depth-description').textContent='You have completed '+quiz.depth.currentRouteId+' depth. These results use only questions assigned so far. Continuing keeps compatible answers and leaves other areas unmeasured until asked.';
 updateClarificationChoice();
}
function continueDepth({routeId=null,clarify=false}){
 if(!quiz?.depth||!progressivePolicy||resultReplayQualification)return;
 const plan=clarify?proposedClarification:null;
 if(clarify&&!plan?.entries.length)return;
 if(clarify)recordProductEvent('clarification_requested',$('depth-domain').value);
 const before=structuredClone(quiz);let outcome;
 try{outcome=extendProgressiveQuiz({quiz,bank,policy:progressivePolicy,routeId,plan,localizationBundle:activeLocalizationBundle});}
 catch{quiz=before;recordProductEvent('route_failed');announce('This continuation could not start. Your completed answers are still saved. Reload before trying again.');return;}
 if(!outcome.added){renderDepthActions();announce('You have already answered the reviewed questions in that continuation.');return;}
 proposedClarification=null;announce('Optional depth started. Your earlier answers are kept.');
 recordProductEvent('route_extended');
 seekQuestion(quiz,bank,quiz.index);enterQuestion();
}
async function contributeResearch(){
 if(!quiz||!$('research-optin').checked||currentResearchReceipt)return;
 $('research-submit').disabled=true;$('research-status').textContent='Sending the chosen contribution…';
 try{
  let receipt=researchReceipts.find(r=>r.sessionId===quiz.session.sessionId&&r.status==='pending');
  if(!receipt){
   let linkId;
   if($('research-link').checked){
    linkId=localStorage.getItem(researchLinkKey)??crypto.randomUUID();localStorage.setItem(researchLinkKey,linkId);
   }
   receipt={sessionId:quiz.session.sessionId,contributionId:crypto.randomUUID(),
    withdrawalToken:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),
    consentVersion:researchConfig.consentVersion,status:'pending',...(linkId?{linkId}:{})};
   const updated=[...researchReceipts,receipt];
   localStorage.setItem(researchReceiptKey,JSON.stringify(updated));
   researchReceipts=updated;renderResearchReceipts();
  }
  const response=await fetch('/api/research/contributions',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({consentVersion:researchConfig.consentVersion,affirmed:true,quiz,contributionId:receipt.contributionId,
    withdrawalToken:receipt.withdrawalToken,...(receipt.linkId?{linkId:receipt.linkId}:{})})});
  const body=await response.json();if(!response.ok)throw Error(body.message??'Contribution failed.');
  receipt.status='active';currentResearchReceipt=receipt;
  try{localStorage.setItem(researchReceiptKey,JSON.stringify(researchReceipts));}catch{}
  renderResearchReceipts();
  $('research-receipt-text').value=JSON.stringify({contributionId:body.contributionId,withdrawalToken:body.withdrawalToken,consentVersion:body.consentVersion},null,2);
  $('research-receipt').hidden=false;$('research-status').textContent='Contribution received. Save the private withdrawal receipt.';
 }catch(error){$('research-status').textContent=researchReceipts.some(r=>r.sessionId===quiz.session.sessionId&&r.status==='pending')?
   'Contribution status is unconfirmed. Your private receipt is saved here. You can retry with the same receipt. '+error.message:
   'Contribution was not sent because a private withdrawal receipt could not be saved on this device.';
  $('research-submit').disabled=false;renderResearchReceipts();}
}
async function withdrawReceipt(receipt,button){
 if(!receipt||!['active','pending'].includes(receipt.status))return;
 button.disabled=true;
 try{
  const response=await fetch('/api/research/contributions/'+receipt.contributionId,
   {method:'DELETE',headers:{Authorization:'Bearer '+receipt.withdrawalToken}});
  const body=await response.json();if(!response.ok)throw Error(body.message??'Withdrawal failed.');
  receipt.status='withdrawn';receipt.withdrawalToken=null;
  try{localStorage.setItem(researchReceiptKey,JSON.stringify(researchReceipts));}catch{}
  if(currentResearchReceipt===receipt){currentResearchReceipt=null;$('research-receipt').hidden=true;$('research-submit').disabled=true;
   $('research-status').textContent='This contribution was withdrawn and its stored responses were removed.';}
  renderResearchReceipts();announce('Contribution withdrawn. Its stored response record was removed.');
 }catch(error){announce(error.message);button.disabled=false;}
}
function withdrawResearch(){return withdrawReceipt(currentResearchReceipt,$('research-withdraw'));}
function renderEngagement(){
 $('exploration-section').hidden=summary.schemaVersion!=='quiz-summary-3';
 $('reading-section').hidden=summary.schemaVersion!=='quiz-summary-3';
 $('tradition-compare-section').hidden=!betaConfig.features.affinityDisplay||!summary.affinities?.traditions?.length;
 if(summary.schemaVersion!=='quiz-summary-3')return;
 renderExplorationProgress();
 const plans=betaConfig.features.adaptiveClarification&&quiz.depth?
  summary.domains.map(d=>({domainId:d.id,entries:planClarification(d.id).entries})):[];
 $('exploration-actions').replaceChildren();
 for(const action of betaConfig.features.adaptiveClarification?recommendExploration({summary,clarificationPlans:plans}):[]){
  const button=elem('button',action.label);button.type='button';
  button.addEventListener('click',()=>{$('depth-domain').value=action.domainId;updateClarificationChoice();
   $('depth-section').scrollIntoView();$('depth-clarify').focus();recordProductEvent('exploration_opened',action.domainId);});
  const block=elem('div',undefined,'exploration-action');block.append(button,elem('p',action.reason.replaceAll('_',' ')+' · Suggested from your interpreted evidence.','small'));
  $('exploration-actions').append(block);
 }
 if(!$('exploration-actions').childElementCount)$('exploration-actions').append(elem('p','No targeted clarification is currently proposed. You can stop here or continue to a deeper route.','small'));
 const options=[...summary.rows.filter(r=>r.sources?.length).map(r=>({value:'proposition:'+r.id,label:r.label+' · '+r.statusLabel})),
  ...(betaConfig.features.affinityDisplay?summary.affinities?.traditions??[]:[]).map(t=>({value:'tradition:'+t.id,label:t.name+' · tradition'}))];
 const placeholder=elem('option','Choose a question or tradition');placeholder.value='';
 $('reading-choice').replaceChildren(placeholder,...options.map(o=>{const option=elem('option',o.label);option.value=o.value;return option;}));
 $('reading-trail').hidden=true;
 const traditions=betaConfig.features.affinityDisplay?summary.affinities?.traditions??[]:[];
 for(const id of ['tradition-left','tradition-right'])$(id).replaceChildren(...traditions.map(t=>{const option=elem('option',t.name);option.value=t.id;return option;}));
 if(traditions.length>1)$('tradition-right').selectedIndex=1;
 $('tradition-comparison').hidden=true;
}
function renderReadingTrail(record=false){
 const [kind,id]=$('reading-choice').value.split(':');if(!kind||!id)return;
 const trail=readingTrailFor(summary,{kind,id}),container=$('reading-trail');container.hidden=false;container.replaceChildren();
 container.append(elem('h3',trail.title),elem('p',(trail.questionBasis==='inherited_rule_scope'?'Authored rule scope: ':'')+trail.question),
  elem('p','Current evidence: '+trail.status.replaceAll('_',' '),'small'),elem('p',trail.why));
 if(trail.alternatives.length)container.append(elem('h4','Nearby views'),elem('p',trail.alternatives.join(' · ')));
 if(trail.nonEntailments.length)container.append(elem('h4','Does not imply'),elem('p',trail.nonEntailments.join(' · ')));
 container.append(elem('h4','Read the sources'));
 for(const source of trail.sources){const a=elem('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.addEventListener('click',()=>{
  if(kind==='proposition'){const row=summary.rows.find(r=>r.id===id);activityEvent('source_opened','domainId',row.domainId);recordProductEvent('source_opened',row.domainId);}
  else{activityEvent('tradition_source_opened','traditionId',id);recordProductEvent('source_opened');}
 });container.append(a);}
 const domainId=kind==='proposition'?summary.rows.find(r=>r.id===id)?.domainId:null;
 if(record){if(domainId)activityEvent('reading_opened','domainId',domainId);
 else activityEvent('tradition_opened','traditionId',id);}
}
function renderTraditionComparison(record=false){
 const container=$('tradition-comparison');container.hidden=false;container.replaceChildren();const leftId=$('tradition-left').value,rightId=$('tradition-right').value;
 if(!leftId||!rightId||leftId===rightId){container.append(elem('p','Choose two different traditions.'));return;}
 const comparison=compareTraditions(summary.affinities,leftId,rightId);
 container.append(elem('p',comparison.note,'small'));
 const presentationById=new Map(summary.affinityPresentation?.traditions.map(row=>[row.traditionId,row])??[]);
 for(const tradition of [comparison.left,comparison.right]){
  const state=presentationById.get(tradition.id)?.state??tradition.summaryState;
  const section=elem('section',undefined,'compare-tradition');section.append(elem('h3',tradition.name),elem('p',affinityStateLabel[state]??state),elem('p',tradition.context));
  for(const c of tradition.criteria.filter(c=>c.role==='defining'))section.append(elem('p',(affinityFindingLabel[c.finding]??c.finding)+': '+c.doctrine,'small'));
  if(tradition.nonEntailments.length)section.append(elem('p','Does not imply: '+tradition.nonEntailments.join(' · '),'small'));
  container.append(section);
 }
 if(comparison.sharedPropositionMappings.length)container.append(elem('p','Shared public interpretation rule references: '+comparison.sharedPropositionMappings.map(m=>m.propositionId).join(', '),'small'));
 if(record){activityEvent('tradition_opened','traditionId',leftId);activityEvent('tradition_opened','traditionId',rightId);}
}
function historicalReplayQualification(session){
 const historicalVersion=session.modelReleaseVersion??null;
 if(historicalVersion===activeModelReleaseVersion)return null;
 const historicalRelease=modelReleases.find(release=>release.releaseVersion===historicalVersion);
 const activeRelease=modelReleases.find(release=>release.releaseVersion===activeModelReleaseVersion);
 const historicalEngine=historicalRelease?.components.find(component=>component.key==='engine_source');
 const activeEngine=activeRelease?.components.find(component=>component.key==='engine_source');
 if(historicalEngine&&activeEngine&&historicalEngine.sha256===activeEngine.sha256)return null;
 return historicalEngine?'different_inference_code':'historical_inference_code_unpinned';
}
function finish(newlyCompleted=false){
 cancelAdvance();
 if(model.engineVersion==='generic-evidence-3'){
  if(!affinityCatalog)throw Error('The saved affinity catalog is unavailable.');
  if(quiz.affinityCatalogVersion&&quiz.affinityCatalogVersion!==affinityCatalog.catalogVersion)throw Error('The saved affinity catalog version does not match the loaded definition.');
  quiz.affinityCatalogVersion=affinityCatalog.catalogVersion;
 }
 recordDepthCheckpoint(quiz);
 save();
 if(newlyCompleted)recordProductEvent('route_completed',null,true);
 if(newlyCompleted&&quiz.depth?.events.at(-1)?.kind==='clarification')
  recordProductEvent('clarification_completed',quiz.depth.events.at(-1).domainId,true);
 summary=buildQuizSummary({model,bank,scalesDoc,session:quiz.session,affinityCatalog:model.engineVersion==='generic-evidence-3'?affinityCatalog:null,
  affinityPilot,routeManifest:quiz.depth?progressivePolicy:null});
 if(activeLocalizationBundle){const localized=localizeSummary(summary,activeLocalizationBundle);
  if(!localized.available)throw Error('The saved locale lacks approved result wording.');
  summary=localized.summary;}
 resultReplayQualification=historicalReplayQualification(quiz.session);
 const replayNotice=$('result-replay-notice');replayNotice.hidden=!resultReplayQualification;
 replayNotice.textContent=resultReplayQualification?
  'Current reinterpretation of saved answers. '+(resultReplayQualification==='different_inference_code'?
   'The historical release pinned different inference code.':'The historical release did not pin inference code.')+
   ' Its original result cannot be verified here. You can save the raw answers; further questions, summary export, and sharing are unavailable for this reinterpretation.':'';
 $('summary-save').disabled=Boolean(resultReplayQualification);
 $('share-open').disabled=Boolean(resultReplayQualification);
 loadActivity();if(newlyCompleted){activityEvent('completed','routeId',quiz.depth?.currentRouteId??'full');
  resultEvent('quiz_finished');}
 $('result-counts').textContent=summary.resolvedPatterns+' answer patterns · '+summary.answeredItems+' substantive responses · '+summary.specialResponses+' no-view, unclear or not-applicable responses';
 $('academic-notice').textContent=summary.academicNotice;$('coverage-notice').textContent=summary.coverageNotice;
 const pilotResult=summary.schemaVersion==='quiz-summary-3';
 for(const [section,list,rows] of [
  ['overview-section','overview-list',summary.overview??[]],
  ['open-section','open-list',summary.mixedOrUnresolved??[]],
  ['unmeasured-section','unmeasured-list',summary.unmeasured??[]]]){
  $(section).hidden=!pilotResult||!rows.length;$(list).replaceChildren(...rows.map(patternBlock));
 }
 $('open-count').textContent=(summary.mixedOrUnresolved?.length??0)+' mixed or insufficient interpretations';
 $('unmeasured-count').textContent=(summary.unmeasured?.length??0)+' interpretations not assessed in this administration';
 $('coverage-gap-count').textContent=(summary.coverageGaps?.length??0)+' additional theoretical distinctions have no approved respondent interpretation rule in this model.';
 $('tension-section').hidden=!pilotResult||!summary.tensions?.length;
 $('tension-count').textContent=(summary.tensions?.length??0)+' answer patterns to inspect';
 $('tension-list').replaceChildren(...(summary.tensions??[]).map(t=>{
  const block=elem('article',undefined,'tension');block.append(elem('h3',summary.domains.find(d=>d.id===t.domainId)?.title??'A topic to revisit'),elem('p',t.explanation));return block;
 }));
 $('domain-map').replaceChildren();
 const opportunityLabels={not_measured:'Not measured in this administration',
  partially_assessed:'Partially assessed',assessed_unresolved:'Asked, but unresolved',
  meaningfully_assessed:'Some propositions assessed'};
 for(const domain of summary.domains){
  const card=elem('section',undefined,'domain'),details=elem('details'),head=elem('summary');
  head.append(elem('strong',domain.title),elem('span',domain.prompt),
   elem('span',pilotResult?(opportunityLabels[domain.measurementStatus]??'Assessment status unavailable'):
    domain.responses+' responses in this topic'));
  details.append(head);
  if(pilotResult){
   for(const f of domain.facets??[]){
    if(!f.rows?.length)continue;
    const facet=elem('section',undefined,'facet-group');facet.dataset.facetId=f.id;
    facet.append(elem('h3',f.title));
    facet.append(elem('p',opportunityLabels[f.measurementStatus]??'Assessment status unavailable','small'));
    if(f.question)facet.append(elem('p',f.question,'small'));
    for(const row of f.rows)facet.append(patternBlock(row));
    details.append(facet);
   }
  }else{
   const facets=elem('div',undefined,'facet-coverage');
   for(const f of domain.facets??[]){const line=elem('p');line.dataset.facetId=f.id;line.append(elem('strong',f.title),elem('span',' · '+f.answeredItems+' responses'));facets.append(line);}
   details.append(facets);
  }
  details.addEventListener('toggle',()=>{if(details.open){resultEvent('topic_opened',domain.id);activityEvent('domain_opened','domainId',domain.id);
   if(domain.rows.some(r=>['mixed','mixed_context_dependent','insufficient_evidence'].includes(r.status)))activityEvent('unresolved_opened','domainId',domain.id);}});
  const known=domain.rows.filter(r=>r.status!=='insufficient_evidence'),partial=domain.rows.filter(r=>r.status==='insufficient_evidence');
  if(!known.length)details.append(elem('p','Still taking shape. Your responses do not yet support a broader pattern here.','small'));
  if(!pilotResult)for(const row of [...known,...partial])details.append(patternBlock(row));
  if(!domain.rows.length)details.append(elem('p','Some answers may be recorded without a reviewed interpretation rule. They have not been discarded or turned into an assumed belief.','small'));
  if(domain.unresolvedConstructCount)details.append(elem('p',domain.unresolvedConstructCount+' constructs in this topic currently have no comparison rule.','small'));
  card.append(details);$('domain-map').append(card);
 }
 $('comparison-list').replaceChildren();
 $('comparisons').hidden=!summary.comparisons.length;
 const states={supported_on_specified_commitments:'Support on the commitments asked about',material_divergence:'Important differences in your answers',mixed_evidence:'Mixed answers',partial_evidence:'Partial evidence',insufficient_evidence:'Not enough evidence',not_measured:'Not measured here'};
 for(const c of summary.comparisons){const row=elem('div',undefined,'comparison');row.append(elem('h3',c.label),elem('p',states[c.state]??c.state,'small'),elem('p',c.scope,'small'));$('comparison-list').append(row);}
 renderAffinities(summary.affinities,summary.affinityPresentation);
 if(!betaConfig.features.affinityDisplay)$('affinity-section').hidden=true;
 renderDepthActions();
 $('depth-clarify').hidden=!betaConfig.features.adaptiveClarification;
 renderEngagement();
 renderResearch();
 prepareResultFeedback();
 $('sharing').hidden=true;show('results');$('results-title').focus();
}
function tryFinish(newlyCompleted=false){
 try{finish(newlyCompleted);}
 catch{
  recordProductEvent('result_generation_failed');
  save();$('failure-title').textContent='We could not build your results.';
  $('failure-message').textContent='Your raw answers are still available in this tab. Save a copy, then reload to try again.';
  $('failure-export').hidden=!quiz;show('failure');$('failure-title').focus();
 }
}
function openShare(){
 if(resultReplayQualification){announce('Sharing is unavailable for a current reinterpretation of historical answers. Save the raw answers instead.');return;}
 $('share-options').replaceChildren();
 const candidates=summary.rows.filter(r=>!['insufficient_evidence','not_measured'].includes(r.status)&&
  (r.inferenceStatus!=='derived'||r.presentationReview?.state==='eligible'));
 if(summary.schemaVersion!=='quiz-summary-3'){announce('Selected snapshot cards require the current interpreted result model.');return;}
 $('share-domain').replaceChildren(...summary.domains.map(d=>{const option=elem('option',d.title);option.value=d.id;return option;}));
 $('share-tradition').replaceChildren(...(summary.affinities?.traditions??[]).map(t=>{const option=elem('option',t.name);option.value=t.id;return option;}));
 for(const row of candidates){
  const label=elem('label'),check=elem('input');check.type='checkbox';check.value=row.id;
  check.addEventListener('change',()=>{if($('share-options').querySelectorAll('input:checked').length>4){check.checked=false;announce('Choose up to four patterns.');}updateShare();});
  label.append(check,elem('span',row.statusLabel+': '+row.label));$('share-options').append(label);
 }
 $('share-format').value='overview';updateShare();$('sharing').hidden=false;$('share-title').focus();
}
function updateShare(){
 const format=$('share-format').value,selectedIds=[...$('share-options').querySelectorAll('input:checked')].map(e=>e.value);
 $('share-options').hidden=format!=='overview';
 $('share-domain').hidden=format!=='domain';$('share-domain').previousElementSibling.hidden=format!=='domain';
 $('share-tradition').hidden=format!=='affinity';$('share-tradition').previousElementSibling.hidden=format!=='affinity';
 const administration={completed:quiz.session.completionStatus==='completed',instrumentVersion:quiz.session.instrumentVersion,
  formPolicyVersion:quiz.packet.formPolicyVersion,routeId:quiz.depth?.currentRouteId??'full',routeVersion:quiz.packet.routeVersion??null,
  modelReleaseVersion:quiz.session.modelReleaseVersion??null,
  localization:{locale:quiz.session.localization?.locale??'en-US',language:activeLocalizationBundle?.language??'en',
   direction:activeLocalizationBundle?.direction??'ltr',bundleVersion:quiz.session.localization?.bundleVersion??null,
   catalogVersion:quiz.session.localization?.catalogVersion??null}};
 try{shareSnapshot=buildShareSnapshot({summary,administration,format,selectedIds,domainId:$('share-domain').value,
  traditionId:$('share-tradition').value,exploration:activity,snapshotId:crypto.randomUUID(),createdAt:new Date().toISOString()});
  $('share-preview').value=shareSnapshotText(shareSnapshot);
 }catch{shareSnapshot=null;$('share-preview').value='Select evidence for this format.';}
 for(const id of ['copy-share','download-share-json','download-share-svg'])$(id).disabled=!shareSnapshot;
}
function start(size){
 if(saveConflict){announce('Another tab changed the saved quiz. Reload before starting a new route.');return;}
 const selected=localizationBundles.get($('locale-choice').value);
 if(!selected||selected.status!=='approved'){announce('This questionnaire language is awaiting philosophical and linguistic review. Choose an available language.');return;}
 if(loadedText&&!confirm('Starting another quiz replaces the locally saved quiz. Save a backup first to keep it. Continue?'))return;
 announce('');const seed=crypto.randomUUID();const route=experiencePolicy.routes.find(r=>r.size===size);const chosenPolicy=formPolicies.find(p=>p.policyVersion===route?.formPolicyVersion);if(!chosenPolicy)throw Error('Unknown quiz route.');model=models.get(chosenPolicy.modelVersion);if(!model)throw Error('Unknown interpretation release.');if(chosenPolicy.algorithm==='progressive-fixed-1')progressivePolicy=chosenPolicy;affinityCatalog=activeAffinityCatalog;
 const refs=chosenPolicy.routes?.find(r=>r.size===size)?.itemRefs??chosenPolicy.frozenItems;
 const availability=routeLocalizationAvailability({bundle:selected,route:{itemRefs:refs},bank,scalesDoc,model});
 if(!availability.available){announce('This route has no approved wording for the selected language.');return;}
 activeLocalizationBundle=selected;document.documentElement.lang=selected.language;document.documentElement.dir=selected.direction;
 quiz=createQuiz({bank,pilot,scalesDoc,formPolicy:chosenPolicy,seed,size,sessionId:crypto.randomUUID(),
  localizationBundle:selected,localizationCatalogVersion:localizationCatalog.catalogVersion,
  modelReleaseVersion:activeModelReleaseVersion,releaseChannel:betaConfig.channel});
 exploration=initialExploration();seekQuestion(quiz,bank,0);enterQuestion();
 recordProductEvent('route_started');
}
async function bootstrap(){
 if(!staticRelease)try{const response=await fetch('/api/beta/config',{cache:'no-store'});
  if(response.ok)betaConfig=await response.json();}catch{}
 activeModelReleaseVersion=betaConfig.modelReleaseVersion;
 $('product-feedback').hidden=!betaConfig.features.feedback;
 $('product-feedback-send').addEventListener('click',()=>submitFeedback('product'));
 const current=await fetchJSON('data/current.json');
 if(betaConfig.modelReleaseVersion&&betaConfig.modelReleaseVersion!==current.modelRelease.version)
  throw Error('The deployed channel and model release do not match.');
 if(!staticRelease){
  try{researchConfig=await (await fetch('/api/research/config',{cache:'no-store'})).json();}catch{researchConfig={enabled:false};}
  try{productMetrics=await (await fetch('/api/product/config',{cache:'no-store'})).json();}catch{productMetrics={enabled:false};}
 }
 $('product-metrics-note').textContent=productMetrics.enabled?'Anonymous route-use events are sent to this site for product operation. They include route, answered-item count and a chosen clarification topic, never answers or a session ID.':'No product analytics are sent by this app.';
 [bank,pilot,scalesDoc,model,experiencePolicy]=await Promise.all([fetchJSON(current.candidateBank.path),fetchJSON(current.pilot.path),fetchJSON('data/response-scales.json'),fetchJSON(current.worldviewModel.path),fetchJSON(current.quizExperience.path)]);
 modelReleases=await Promise.all((current.modelReleaseVersions??[current.modelRelease]).map(ref=>fetchJSON(ref.path)));
 activeModelReleaseVersion=current.modelRelease.version;
 $('question-feedback').hidden=!betaConfig.features.feedback;
 $('share-open').hidden=!betaConfig.features.sharing;
 affinityCatalogVersions=current.affinityCatalogVersions??(current.affinityCatalog?[current.affinityCatalog]:[]);
 if(current.affinityCatalog)[activeAffinityCatalog,affinityPilot]=await Promise.all([fetchJSON(current.affinityCatalog.path),fetchJSON(current.pilotCandidate.path)]);
 affinityCatalog=activeAffinityCatalog;
 if(experiencePolicy.modelPolicies){const loaded=await Promise.all(experiencePolicy.modelPolicies.map(p=>fetchJSON(p.path)));models=new Map(loaded.map(m=>[m.modelVersion,m]));}
 else models=new Map([[model.modelVersion,model]]);
 const loadedAffinityCatalogs=await Promise.all(affinityCatalogVersions.map(ref=>fetchJSON(ref.path)));
 const affinitiesByVersion=new Map(loadedAffinityCatalogs.map(value=>[value.catalogVersion,value]));
 localizationCatalogs=await Promise.all((current.localizationCatalogVersions??[current.localizationCatalog]).map(ref=>fetchJSON(ref.path)));
 localizationCatalog=localizationCatalogs.find(c=>c.catalogVersion===current.localizationCatalog.version);
 if(!localizationCatalog)throw Error('Current localization catalog is unavailable.');
 for(const catalogVersion of localizationCatalogs){const boundModel=models.get(catalogVersion.modelVersion),boundAffinity=affinitiesByVersion.get(catalogVersion.affinityCatalogVersion);
  if(!boundModel||!boundAffinity)throw Error('Historical wording dependencies are unavailable: '+catalogVersion.catalogVersion);
  validateLocalizationCatalog(catalogVersion,{bank,model:boundModel,affinityCatalog:boundAffinity});}
 const loadedBundles=await Promise.all((current.localizationBundleVersions??current.localizationBundles??[]).map(ref=>fetchJSON(ref.path)));
 for(const bundle of loadedBundles){const catalogVersion=localizationCatalogs.find(c=>c.locales.some(r=>r.locale===bundle.locale&&r.bundleVersion===bundle.bundleVersion));
  if(!catalogVersion)throw Error('Historical wording catalog is unavailable: '+bundle.bundleVersion);
  validateLocalizationBundle(bundle,{catalog:catalogVersion,bank,scalesDoc,
   model:models.get(catalogVersion.modelVersion),affinityCatalog:affinitiesByVersion.get(catalogVersion.affinityCatalogVersion)});
  localizationBundlesByVersion.set(bundle.bundleVersion,bundle);}
 for(const row of localizationCatalog.locales){const bundle=localizationBundlesByVersion.get(row.bundleVersion);
  if(!bundle)throw Error('Current wording bundle is unavailable: '+row.bundleVersion);
  localizationBundles.set(bundle.locale,bundle);}
 formPolicies=await Promise.all(experiencePolicy.formPolicies.map(p=>fetchJSON(p.path)));
 progressivePolicy=formPolicies.find(p=>p.policyVersion===experiencePolicy.progressivePolicy?.version)??null;
 $('locale-choice').replaceChildren(...localizationCatalog.locales.map(row=>{const option=elem('option',
  ({'en-US':'English (US)','es-ES':'Español (España)','ar':'العربية'})[row.locale]??row.locale);
  option.value=row.locale;return option;}));
 const renderLocaleChoice=()=>{const selected=localizationBundles.get($('locale-choice').value);
  const available=selected?.canonical===true&&selected.status==='approved';
  $('locale-status').textContent=available?'Approved canonical wording is available for this language.':
   'Review pending: no translated philosophical questions will be shown. Choose English to begin.';
  for(const button of $('routes').querySelectorAll('.route'))button.disabled=!available;
 };
 $('locale-choice').addEventListener('change',renderLocaleChoice);
 for(const [index,route] of experiencePolicy.routes.entries()){
  const button=elem('button',undefined,'route');button.dataset.size=String(route.size);
  const description=staticRelease?route.description.replace(' and optional research contribution',''):route.description;
  button.append(elem('span',route.recommended?'RECOMMENDED':'ROUTE 0'+(index+1),'route-number'),elem('strong',route.label),elem('span',route.size+' questions'),elem('span',description));
  button.addEventListener('click',()=>start(route.size));$('routes').append(button);
 }
 renderLocaleChoice();
 try{loadedText=localStorage.getItem(storageKey);}catch{storageWorks=false;announce('Local saving is unavailable. You can still take the quiz and export your answers.');}
 try{researchReceipts=JSON.parse(localStorage.getItem(researchReceiptKey)??'[]');if(!Array.isArray(researchReceipts))researchReceipts=[];}catch{researchReceipts=[];}
 renderSaved();
 $('resume').addEventListener('click',async()=>{try{
  const envelope=JSON.parse(loadedText);if(!COMPATIBLE_EXPERIENCE_VERSIONS.includes(envelope.experienceVersion))throw Error('This backup uses another interface version. Keep it for a compatible version.');
  quiz=restoreQuiz(envelope.quiz,{bank,pilot,scalesDoc,formPolicies,
   localizationBundles:[...localizationBundlesByVersion.values()],localizationCatalogs,modelReleases});
  if(quiz.session.completionStatus!=='completed'&&historicalReplayQualification(quiz.session))
   throw Error('This saved attempt uses unverified historical inference code and cannot be continued in the current release. Save its backup and start a new administration.');
  activeLocalizationBundle=quiz.session.localization?localizationBundlesByVersion.get(quiz.session.localization.bundleVersion):null;
  document.documentElement.lang=activeLocalizationBundle?.language??'en';
  document.documentElement.dir=activeLocalizationBundle?.direction??'ltr';
  if(quiz.depth){progressivePolicy=formPolicies.find(p=>p.policyVersion===quiz.depth.policyVersion);if(!progressivePolicy)throw Error('The saved depth route release is unavailable. Keep its backup.');}
  if(quiz.packet.evidenceModelVersion){model=models.get(quiz.packet.evidenceModelVersion);if(!model)throw Error('The saved interpretation release is unavailable. Keep its backup.');}
  if(model.engineVersion==='generic-evidence-3'){
   const version=quiz.affinityCatalogVersion??activeAffinityCatalog?.catalogVersion;
   const ref=affinityCatalogVersions.find(x=>x.version===version);
   if(!ref)throw Error('The saved affinity catalog release is unavailable. Keep its backup.');
   affinityCatalog=version===activeAffinityCatalog.catalogVersion?activeAffinityCatalog:await fetchJSON(ref.path);
  }
  announce('');
  if(quiz.session.completionStatus==='completed')tryFinish();else{seekQuestion(quiz,bank,quiz.index??0);enterQuestion();}
 }catch(e){announce(e.message+' Your saved data was not deleted.');}});
 $('backup-saved').addEventListener('click',()=>{if(loadedText)download(loadedText,'worldview-local-backup.json');});
 $('failure-export').addEventListener('click',exportAnswers);
 $('discard').addEventListener('click',()=>{if(saveConflict){announce('Another tab changed the saved quiz. Reload before deleting it.');return;}if(!confirm('Delete the quiz saved on this device?'))return;try{if(localStorage.getItem(storageKey)!==loadedText){saveConflict=true;announce('Another tab changed the saved quiz. Reload before deleting it.');return;}localStorage.removeItem(storageKey);}catch{announce('Could not delete browser storage.');return;}loadedText=null;quiz=null;renderSaved();});
 $('back').addEventListener('click',()=>{cancelAdvance();previousQuestion(quiz,bank);enterQuestion();});
 $('next').addEventListener('click',()=>{cancelAdvance();nextQuestion(quiz,bank);enterQuestion();});
 $('auto').addEventListener('change',()=>{cancelAdvance();renderQuestion();});
 $('pause').addEventListener('click',()=>{cancelAdvance();save();recordProductEvent('route_paused');renderSaved();show('home');$('resume').focus();});
 $('save-answers').addEventListener('click',exportAnswers);$('result-answers').addEventListener('click',exportAnswers);
 $('summary-save').addEventListener('click',()=>{if(!resultReplayQualification)download(summary,'worldview-summary.json');});
 $('depth-next-standard').addEventListener('click',()=>continueDepth({routeId:'standard'}));
 $('depth-next-full').addEventListener('click',()=>continueDepth({routeId:'full'}));
 $('depth-domain').addEventListener('change',updateClarificationChoice);
 $('depth-clarify').addEventListener('click',()=>continueDepth({clarify:true}));
 $('depth-stop').addEventListener('click',()=>{recordProductEvent('route_stopped');renderSaved();show('home');$('resume').focus();});
 $('reading-choice').addEventListener('change',()=>{renderReadingTrail(true);recordProductEvent('reading_opened');});
 $('tradition-compare-open').addEventListener('click',()=>{renderTraditionComparison(true);recordProductEvent('tradition_compared');});
 for(const id of ['tradition-left','tradition-right'])$(id).addEventListener('change',()=>{if(!$('tradition-comparison').hidden){renderTraditionComparison(true);recordProductEvent('tradition_compared');}});
 $('research-optin').addEventListener('change',()=>{$('research-submit').disabled=!$('research-optin').checked||Boolean(currentResearchReceipt);});
 $('research-submit').addEventListener('click',contributeResearch);
 $('research-withdraw').addEventListener('click',withdrawResearch);
 $('research-receipt-save').addEventListener('click',()=>{if(currentResearchReceipt)download({contributionId:currentResearchReceipt.contributionId,
  withdrawalToken:currentResearchReceipt.withdrawalToken,consentVersion:currentResearchReceipt.consentVersion},'worldview-research-withdrawal.json');});
 $('forget-research-link').addEventListener('click',()=>{try{localStorage.removeItem(researchLinkKey);announce('Future research contributions from this browser will not share the previous link. Existing contributions are unchanged.');renderResearchReceipts();}catch{announce('Browser storage could not be changed.');}});
 $('restart').addEventListener('click',()=>{cancelAdvance();renderSaved();show('home');});
 $('share-open').addEventListener('click',openShare);$('share-close').addEventListener('click',()=>{$('sharing').hidden=true;$('share-open').focus();});
 for(const kind of ['question','result'])$(kind+'-feedback-send').addEventListener('click',()=>submitFeedback(kind));
 for(const id of ['share-format','share-domain','share-tradition'])$(id).addEventListener('change',updateShare);
 $('download-share-json').addEventListener('click',()=>{if(shareSnapshot){download(shareSnapshot,'worldview-'+shareSnapshot.format+'-'+shareSnapshot.snapshotId+'.json');recordProductEvent('share_exported',null,false,shareSnapshot.format);}});
 $('download-share-svg').addEventListener('click',()=>{if(shareSnapshot){downloadSvg(shareSnapshotSvg(shareSnapshot),'worldview-'+shareSnapshot.format+'-'+shareSnapshot.snapshotId+'.svg');recordProductEvent('share_exported',null,false,shareSnapshot.format);}});
 $('copy-share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share-preview').value);recordProductEvent('share_exported',null,false,shareSnapshot?.format);announce('The preview was copied. Nothing was posted.');}catch{$('share-preview').focus();$('share-preview').select();announce('Clipboard access is unavailable. The preview is selected for you to copy manually.');}});
 window.addEventListener('pagehide',()=>{cancelAdvance();save();if(quiz?.session.completionStatus!=='completed')recordProductEvent('page_left');});
 window.addEventListener('storage',event=>{if((event.key===storageKey||event.key===null)&&event.newValue!==loadedText){saveConflict=true;announce('Another tab changed the saved quiz. This tab is not saving. Save your raw answers, then reload to see the latest saved quiz.');if(!$('quiz').hidden)$('storage-status').textContent='Not saved: another tab changed this quiz';}});
 document.body.dataset.ready='true';show('home');
}
bootstrap().catch(error=>{console.error('Quiz startup failed:',error.message);$('failure-message').textContent='The app could not load its current instrument or model. Reload when the connection is available; browser-saved answers have not been deleted.';show('failure');$('failure-title').focus();});
