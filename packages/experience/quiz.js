import {generatePhilosophyPacket} from '../philosophy/forms.js';
import {generatePilotPacket,createPilotSession,isItemEligible,responseMapFor,markPresented,markBranchSkipped,recordResponse,finishSession,validateResponseValue} from '../runtime/index.js';

export const EXPERIENCE_VERSION='quiz-1.3.0';
export const COMPATIBLE_EXPERIENCE_VERSIONS=['quiz-1.0.0','quiz-1.1.0','quiz-1.2.0','quiz-1.3.0'];
const insist=(ok,message)=>{if(!ok)throw new Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// The controller has no achievement, profile, badge, score or reward input.
export function createQuiz({bank,pilot,scalesDoc,seed,size,sessionId,locale='en',formPolicy=null}){
 const packet=formPolicy?generatePhilosophyPacket({bank,pilot,policy:formPolicy,seed,size}):generatePilotPacket({bank,pilot,seed,size,packetId:pilot.pilotId+'-'+seed});
 const session=createPilotSession({pilot:{...pilot,pilotId:packet.pilotId},packet,locale,clientVersion:EXPERIENCE_VERSION,sessionId});
 return {packet,session,index:0};
}
export function currentItem(quiz,bank){return quiz.index===null?null:bank.items.find(i=>i.id===quiz.packet.entries[quiz.index].itemId);}

export function seekQuestion(quiz,bank,from=0,now=new Date().toISOString()){
 const items=new Map(bank.items.map(i=>[i.id,i]));
 for(let index=from;index<quiz.packet.entries.length;index++){
  const item=items.get(quiz.packet.entries[index].itemId);
  if(isItemEligible(item,responseMapFor(quiz.session))){quiz.index=index;markPresented(quiz.session,index,now);return item;}
  markBranchSkipped(quiz.session,index);
 }
 // A changed prerequisite may have made a previously skipped earlier item eligible.
 const responses=responseMapFor(quiz.session);
 const missing=quiz.packet.entries.find(e=>isItemEligible(items.get(e.itemId),responses)&&!responses.has(e.itemId));
 if(missing)return seekQuestion(quiz,bank,missing.index,now);
 quiz.index=null;
 if(quiz.session.completionStatus!=='completed')finishSession(quiz.session,now);
 return null;
}
export function answerQuestion(quiz,bank,scalesDoc,{state,value,responseTimeMs=null,answeredAt=new Date().toISOString()}){
 const item=currentItem(quiz,bank);insist(item,'No current question.');
 const scale=scalesDoc.scales.find(s=>s.id===item.responseScaleId);
 validateResponseValue(item,scale,state,value);
 insist(responseTimeMs===null||(Number.isInteger(responseTimeMs)&&responseTimeMs>=0),'Invalid timing.');
 const previous=quiz.session.responses.find(r=>r.itemId===item.id);
 const changed=previous&&(!same(previous.value,value)||previous.state!==state);
 if(!previous||changed)recordResponse(quiz.session,{itemId:item.id,itemRevision:item.revision,state,value,responseTimeMs,answeredAt});
 // Only descendants of this changed prerequisite are affected. Do not mark
 // unrelated future branches skipped merely because their parents are unasked.
 if(changed){
  quiz.session.completionStatus='in_progress';quiz.session.completedAt=null;
  const items=new Map(bank.items.map(i=>[i.id,i])),affected=new Set([item.id]);
  for(const entry of quiz.session.presentedItems){
   if(entry.index<=quiz.index)continue;
   const candidate=items.get(entry.itemId);
   if(candidate.eligibility.mode!=='conditional'||!candidate.eligibility.all.some(c=>affected.has(c.itemId)))continue;
   affected.add(candidate.id);
   const eligible=isItemEligible(candidate,responseMapFor(quiz.session));
   if(!eligible)markBranchSkipped(quiz.session,entry.index);
   else if(entry.skippedByBranch){entry.skippedByBranch=false;entry.presented=false;entry.presentedAt=null;}
  }
 }
 return {changed:Boolean(changed)};
}
export function nextQuestion(quiz,bank){
 insist(quiz.index!==null,'Quiz already completed.');
 insist(quiz.session.responses.some(r=>r.itemId===quiz.packet.entries[quiz.index].itemId),'Choose a response first.');
 return seekQuestion(quiz,bank,quiz.index+1);
}
export function previousQuestion(quiz,bank){
 insist(quiz.index!==null,'No question is open.');
 const responses=responseMapFor(quiz.session);
 for(let n=quiz.index-1;n>=0;n--){
  const entry=quiz.session.presentedItems[n],item=bank.items.find(i=>i.id===entry.itemId);
  if(entry.presented&&isItemEligible(item,responses))return seekQuestion(quiz,bank,n);
 }
 return currentItem(quiz,bank);
}
export function quizProgress(quiz){
 const entries=quiz.session.presentedItems;
 const answered=new Set(quiz.session.responses.map(r=>r.itemId));
 const skipped=entries.filter(e=>e.skippedByBranch).length;
 const done=entries.filter(e=>answered.has(e.itemId)||e.skippedByBranch).length;
 return {answered:answered.size,skipped,done,total:entries.length,percent:Math.floor(100*done/entries.length)};
}
export function restoreQuiz(saved,{bank,pilot,scalesDoc,formPolicy=null,formPolicies=[]}){
 insist(saved&&saved.packet&&saved.session,'The saved quiz is incomplete.');
 const quiz=structuredClone(saved),{session,packet}=quiz;
 const isBlueprint=packet.formPolicyVersion!==undefined;
 if(isBlueprint){
  const compatible=[formPolicy,...formPolicies].filter(p=>p&&p.policyVersion===packet.formPolicyVersion);
  insist(compatible.length>0,'Unknown public form version. Keep its backup for a compatible release.');
  insist(compatible.every(p=>same(p,compatible[0])),'Conflicting saved-form definitions.');
  formPolicy=compatible[0];
 }
 if(isBlueprint)insist(formPolicy&&packet.formPolicyVersion===formPolicy.policyVersion&&packet.evidenceModelVersion===formPolicy.modelVersion,'Unknown public form version. Keep its backup for a compatible release.');
 const administration=isBlueprint?formPolicy.administrationId:pilot.pilotId;
 const instrument=isBlueprint?formPolicy.instrumentVersion:pilot.sourceInstrumentVersion;
 insist(session.bankVersion===bank.bankVersion&&session.pilotId===administration&&session.instrumentVersion===instrument,'This saved quiz uses a different release. Keep its backup; do not reinterpret it with new questions.');
 insist(typeof session.randomizationSeed==='string'&&session.randomizationSeed.length<=200,'Invalid saved seed.');
 const expected=isBlueprint?generatePhilosophyPacket({bank,pilot,policy:formPolicy,seed:session.randomizationSeed,size:packet.size,packetId:session.packetId}):generatePilotPacket({bank,pilot,seed:session.randomizationSeed,size:packet.size,packetId:session.packetId});
 insist(same(expected,packet),'The saved question order or version is invalid.');
 insist(Array.isArray(session.presentedItems)&&session.presentedItems.length===packet.size,'Invalid saved presentation records.');
 insist(Array.isArray(session.responses),'Invalid saved responses.');
 insist(quiz.index===null||(Number.isInteger(quiz.index)&&quiz.index>=0&&quiz.index<packet.size),'Invalid saved position.');
 const items=new Map(bank.items.map(i=>[i.id,i])),scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));
 const ids=new Set();
 for(const r of session.responses){
  const item=items.get(r.itemId),entry=session.presentedItems.find(e=>e.itemId===r.itemId);
  insist(item&&!ids.has(r.itemId)&&item.revision===r.itemRevision,'Unknown, repeated or stale answer.');ids.add(r.itemId);
  insist(entry?.presented===true&&entry.skippedByBranch===false,'An unpresented item cannot have an answer.');
  validateResponseValue(item,scales.get(item.responseScaleId),r.state,r.value);
 }
 const responses=responseMapFor(session);
 for(let n=0;n<packet.entries.length;n++){
  const p=session.presentedItems[n],e=packet.entries[n];
  insist(p&&['index','itemId','itemRevision','domainId','responseScaleId'].every(k=>p[k]===e[k]),'Saved presentation mismatch.');
  insist(typeof p.presented==='boolean'&&typeof p.skippedByBranch==='boolean'&&!(p.presented&&p.skippedByBranch),'Invalid presentation flags.');
  const eligible=isItemEligible(items.get(e.itemId),responses);
  insist(!p.presented||eligible,'A branch answer is no longer applicable.');
  insist(!p.skippedByBranch||!eligible,'An eligible question was marked skipped.');
  if(session.completionStatus==='completed')insist(eligible?ids.has(e.itemId)&&p.presented:p.skippedByBranch,'The saved quiz is not actually complete.');
 }
 return quiz;
}
