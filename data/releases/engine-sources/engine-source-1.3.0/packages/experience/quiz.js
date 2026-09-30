import {generatePhilosophyPacket} from '../philosophy/forms.js';
import {generatePilotPacket,createPilotSession,isItemEligible,responseMapFor,markPresented,markBranchSkipped,recordResponse,finishSession,validateResponseValue} from '../runtime/index.js';
import {itemLocalization,validateSavedLocalization} from '../localization/index.js';
import {RELEASE_CHANNELS} from '../beta/release.js';

export const EXPERIENCE_VERSION='quiz-1.9.0';
export const COMPATIBLE_EXPERIENCE_VERSIONS=['quiz-1.0.0','quiz-1.1.0','quiz-1.2.0','quiz-1.3.0','quiz-1.4.0','quiz-1.5.0','quiz-1.6.0','quiz-1.7.0','quiz-1.8.0','quiz-1.9.0'];
const insist=(ok,message)=>{if(!ok)throw new Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const CLARIFICATION_REASONS=new Set(['resolve_conflicting_evidence','check_weak_direction','supply_missing_direct_evidence',
 'clarify_insufficient_evidence','clarify_defining_doctrine','branch_prerequisite']);
function validClarificationTrace({entries,eligibleItemRefs,candidateItemRefs,priorEvidence,withheld},policy){
 const known=new Map(priorEvidence.map(e=>[e.ruleId,e.state]));
 return Array.isArray(candidateItemRefs)&&Array.isArray(withheld)&&
  same(eligibleItemRefs,policy.routes.at(-1).itemRefs)&&candidateItemRefs.every(ref=>
   eligibleItemRefs.some(allowed=>same(allowed,ref)))&&entries.every(e=>
  CLARIFICATION_REASONS.has(e.reason)&&known.get(e.ruleId)===e.priorEvidenceState&&
  eligibleItemRefs.some(ref=>ref.itemId===e.itemId&&ref.itemRevision===e.itemRevision)&&
  (e.reason==='branch_prerequisite'||candidateItemRefs.some(ref=>ref.itemId===e.itemId&&ref.itemRevision===e.itemRevision)));
}

// The controller has no achievement, profile, badge, score or reward input.
export function createQuiz({bank,pilot,scalesDoc,seed,size,sessionId,locale='en',formPolicy=null,localizationBundle=null,localizationCatalogVersion=null,modelReleaseVersion=null,releaseChannel=null}){
 if(localizationBundle)insist(localizationBundle.status==='approved'&&localizationCatalogVersion,
  'An approved, versioned localization release is required.');
 const packet=formPolicy?generatePhilosophyPacket({bank,pilot,policy:formPolicy,seed,size}):generatePilotPacket({bank,pilot,seed,size,packetId:pilot.pilotId+'-'+seed});
 const session=createPilotSession({pilot:{...pilot,pilotId:packet.pilotId},packet,locale:localizationBundle?.locale??locale,clientVersion:EXPERIENCE_VERSION,sessionId});
 if(modelReleaseVersion){insist(/^model-release-[0-9]+\.[0-9]+\.[0-9]+$/.test(modelReleaseVersion),'Invalid model release version.');
  session.modelReleaseVersion=modelReleaseVersion;}
 if(releaseChannel){insist(RELEASE_CHANNELS.includes(releaseChannel)&&modelReleaseVersion,
  'A release channel requires a pinned model release.');session.releaseChannel=releaseChannel;}
 if(localizationBundle){
  session.localization={locale:localizationBundle.locale,interfaceLanguage:localizationBundle.language,
   bundleVersion:localizationBundle.bundleVersion,catalogVersion:localizationCatalogVersion};
  const byItem=new Map(bank.items.map(item=>[item.id,item]));
  for(const entry of session.presentedItems){const realization=itemLocalization(localizationBundle,byItem.get(entry.itemId));
   insist(realization,'An assigned item has no approved localization: '+entry.itemId);Object.assign(entry,realization);}
 }
 const route=formPolicy?.algorithm==='progressive-fixed-1'?formPolicy.routes.find(r=>r.size===size):null;
 return {packet,session,index:0,...(route?{depth:{policyVersion:formPolicy.policyVersion,adaptivePolicyVersion:formPolicy.adaptivePolicyVersion,
  resultSemanticsVersion:formPolicy.resultSemanticsVersion,
  currentRouteId:route.id,events:[{kind:'route_start',routeId:route.id,routeVersion:route.routeVersion,
   entries:structuredClone(route.itemRefs)}],checkpoints:[]}}:{})};
}
export function recordDepthCheckpoint(quiz){
 if(!quiz.depth||quiz.session.completionStatus!=='completed')return;
 const eventIndex=quiz.depth.events.length-1;
 if(quiz.depth.checkpoints.some(c=>c.eventIndex===eventIndex))return;
 quiz.depth.checkpoints.push({eventIndex,routeId:quiz.depth.currentRouteId,formPolicyVersion:quiz.packet.formPolicyVersion,
  adaptivePolicyVersion:quiz.depth.adaptivePolicyVersion,modelVersion:quiz.packet.evidenceModelVersion,
  resultSemanticsVersion:quiz.depth.resultSemanticsVersion,
  affinityCatalogVersion:quiz.affinityCatalogVersion??null,session:structuredClone(quiz.session)});
}
export function extendProgressiveQuiz({quiz,bank,policy,routeId=null,plan=null,localizationBundle=null}){
 insist(quiz.depth&&quiz.depth.policyVersion===policy.policyVersion&&quiz.session.completionStatus==='completed',
  'Complete a compatible depth route before extending it.');
 insist(Boolean(routeId)!==Boolean(plan),'Choose a route continuation or a clarification plan.');
 const full=new Map(policy.routes.at(-1).itemRefs.map(ref=>[ref.itemId,ref.itemRevision]));
 const assigned=new Set(quiz.packet.entries.map(e=>e.itemId));
 let event,refs,target=null;
 if(routeId){
  const currentIndex=policy.routes.findIndex(r=>r.id===quiz.depth.currentRouteId);
  const targetIndex=policy.routes.findIndex(r=>r.id===routeId);
  insist(targetIndex>currentIndex,'Choose a deeper route.');
  target=policy.routes[targetIndex];refs=target.itemRefs.filter(ref=>!assigned.has(ref.itemId));
  event={kind:'route_escalation',fromRouteId:quiz.depth.currentRouteId,routeId:target.id,
   routeVersion:target.routeVersion,entries:structuredClone(refs)};
 }else{
  insist(plan.adaptivePolicyVersion===policy.adaptivePolicyVersion&&plan.entries.length>0&&
   plan.entries.length<=policy.clarificationBudget,'Invalid clarification plan.');
  insist(Array.isArray(plan.eligibleItemRefs)&&Array.isArray(plan.candidateItemRefs)&&Array.isArray(plan.priorEvidence)&&
   validClarificationTrace(plan,policy),'Invalid clarification evidence trace.');
  refs=plan.entries.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision}));
  event={kind:'clarification',routeId:quiz.depth.currentRouteId,adaptivePolicyVersion:policy.adaptivePolicyVersion,
   domainId:plan.domainId,eligibleItemRefs:structuredClone(plan.eligibleItemRefs),
   candidateItemRefs:structuredClone(plan.candidateItemRefs),withheld:structuredClone(plan.withheld),
   priorEvidence:structuredClone(plan.priorEvidence),selected:plan.entries.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,
    reason:e.reason,ruleId:e.ruleId,priorEvidenceState:e.priorEvidenceState})),entries:structuredClone(refs)};
 }
 const byItem=new Map(bank.items.map(i=>[i.id,i]));
 const pending=new Set();
 for(const ref of refs){
  const item=byItem.get(ref.itemId);
  insist(item&&full.get(ref.itemId)===ref.itemRevision&&!assigned.has(ref.itemId)&&!pending.has(ref.itemId),
   'Repeated or unreviewed depth item.');
  pending.add(ref.itemId);
 }
 recordDepthCheckpoint(quiz);
 if(target){quiz.depth.currentRouteId=target.id;quiz.packet.routeId=target.id;quiz.packet.routeVersion=target.routeVersion;
  quiz.packet.plannedFacets=target.assessableFacetIds;}
 for(const ref of refs){
  const item=byItem.get(ref.itemId);
  assigned.add(ref.itemId);
  const index=quiz.packet.entries.length;
  const entry={index,itemId:item.id,itemRevision:item.revision,domainId:item.domainId,responseScaleId:item.responseScaleId};
  quiz.packet.entries.push(entry);
  let localization={};
  if(quiz.session.localization){
   insist(localizationBundle?.bundleVersion===quiz.session.localization.bundleVersion,'Pinned localization bundle unavailable.');
   localization=itemLocalization(localizationBundle,item);insist(localization,'Added item lacks approved localized wording.');
  }
  quiz.session.presentedItems.push({...entry,...localization,presented:false,skippedByBranch:false,presentedAt:null});
 }
 quiz.packet.size=quiz.packet.entries.length;quiz.depth.events.push(event);
 if(refs.length){quiz.index=quiz.packet.size-refs.length;quiz.session.completionStatus='in_progress';quiz.session.completedAt=null;}
 return {added:refs.length,event};
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
function replayProgressivePacket({quiz,policy,bank,pilot,scalesDoc,localizationBundles=[],localizationCatalogs=[]}){
 const events=quiz.depth?.events;
 insist(quiz.depth?.policyVersion===policy.policyVersion&&quiz.depth.adaptivePolicyVersion===policy.adaptivePolicyVersion&&
  quiz.depth.resultSemanticsVersion===policy.resultSemanticsVersion&&
  Array.isArray(events)&&events.length>0,'Unknown saved depth policy or route history.');
 const first=events[0],route=policy.routes.find(r=>r.id===first.routeId);
 insist(first.kind==='route_start'&&route&&first.routeVersion===route.routeVersion&&same(first.entries,route.itemRefs),
  'Saved initial depth route changed.');
 const expected=generatePhilosophyPacket({bank,pilot,policy,seed:quiz.session.randomizationSeed,size:route.size,
  packetId:quiz.session.packetId});
 const byItem=new Map(bank.items.map(i=>[i.id,i]));
 const allowed=new Map(policy.routes.at(-1).itemRefs.map(ref=>[ref.itemId,ref.itemRevision]));
 const assigned=new Set(expected.entries.map(e=>e.itemId));
 const prefixLengths=[expected.entries.length];let currentRoute=route,routeIndex=policy.routes.indexOf(route);
 for(const event of events.slice(1)){
  let refs;
  if(event.kind==='route_escalation'){
   const targetIndex=policy.routes.findIndex(r=>r.id===event.routeId),target=policy.routes[targetIndex];
   insist(targetIndex>routeIndex&&event.fromRouteId===currentRoute.id&&event.routeVersion===target.routeVersion,
    'Invalid saved route escalation.');
   refs=target.itemRefs.filter(ref=>!assigned.has(ref.itemId));
   insist(same(event.entries,refs),'Saved escalation item list changed.');
   currentRoute=target;routeIndex=targetIndex;expected.routeId=target.id;expected.routeVersion=target.routeVersion;
   expected.plannedFacets=target.assessableFacetIds;
  }else if(event.kind==='clarification'){
   insist(event.routeId===currentRoute.id&&event.adaptivePolicyVersion===policy.adaptivePolicyVersion&&
    Array.isArray(event.eligibleItemRefs)&&Array.isArray(event.candidateItemRefs)&&Array.isArray(event.withheld)&&
    Array.isArray(event.priorEvidence)&&Array.isArray(event.selected)&&
    event.selected.length>0&&event.selected.length<=policy.clarificationBudget,
    'Invalid saved clarification trace.');
   insist(validClarificationTrace({entries:event.selected,eligibleItemRefs:event.eligibleItemRefs,
    candidateItemRefs:event.candidateItemRefs,priorEvidence:event.priorEvidence,withheld:event.withheld},policy),
    'Saved clarification has an invalid reason or evidence state.');
   refs=event.selected.map(s=>({itemId:s.itemId,itemRevision:s.itemRevision}));
   insist(same(refs,event.entries)&&refs.every(ref=>event.eligibleItemRefs.some(e=>same(e,ref))&&
    typeof event.selected.find(s=>s.itemId===ref.itemId)?.reason==='string'),
    'Clarification selection lacks eligibility or reasons.');
  }else throw new Error('Unknown saved depth event.');
  for(const ref of refs){
   const item=byItem.get(ref.itemId);
   insist(item&&allowed.get(ref.itemId)===ref.itemRevision&&!assigned.has(ref.itemId),'Repeated or stale depth item.');
   assigned.add(ref.itemId);
   expected.entries.push({index:expected.entries.length,itemId:item.id,itemRevision:item.revision,
    domainId:item.domainId,responseScaleId:item.responseScaleId});
  }
  expected.size=expected.entries.length;prefixLengths.push(expected.size);
 }
 insist(quiz.depth.currentRouteId===currentRoute.id,'Saved depth route mismatch.');
 const checkpoints=quiz.depth.checkpoints??[],seen=new Set();
 for(const checkpoint of checkpoints){
  const length=prefixLengths[checkpoint.eventIndex];
  insist(Number.isInteger(length)&&!seen.has(checkpoint.eventIndex)&&checkpoint.routeId&&
   checkpoint.routeId===events[checkpoint.eventIndex].routeId&&
   checkpoint.formPolicyVersion===policy.policyVersion&&checkpoint.modelVersion===policy.modelVersion&&
   checkpoint.resultSemanticsVersion===policy.resultSemanticsVersion&&
   checkpoint.adaptivePolicyVersion===policy.adaptivePolicyVersion&&
   checkpoint.session?.sessionId===quiz.session.sessionId&&checkpoint.session.completionStatus==='completed'&&
   checkpoint.session.pilotId===quiz.session.pilotId&&checkpoint.session.instrumentVersion===quiz.session.instrumentVersion&&
   checkpoint.session.randomizationSeed===quiz.session.randomizationSeed&&
   checkpoint.session.presentedItems?.length===length&&Array.isArray(checkpoint.session.responses),
   'Invalid historical depth checkpoint.');
  const snapshot=checkpoint.session,answered=new Set(),responseMap=responseMapFor(snapshot);
  insist(snapshot.modelReleaseVersion===quiz.session.modelReleaseVersion,'Historical model release checkpoint changed.');
  validateSavedLocalization(snapshot,{bank,bundles:localizationBundles,catalogs:localizationCatalogs});
  for(const r of snapshot.responses){
   const entry=expected.entries.find(e=>e.itemId===r.itemId&&e.index<length),item=byItem.get(r.itemId);
   insist(entry&&item&&r.itemRevision===entry.itemRevision&&!answered.has(r.itemId),'Invalid checkpoint answer revision.');
   validateResponseValue(item,scalesDoc.scales.find(s=>s.id===item.responseScaleId),r.state,r.value);
   answered.add(r.itemId);
  }
  for(let index=0;index<length;index++){
   const entry=expected.entries[index],p=snapshot.presentedItems[index],eligible=isItemEligible(byItem.get(entry.itemId),responseMap);
   insist(p&&['index','itemId','itemRevision','domainId','responseScaleId'].every(key=>p[key]===entry[key])&&
    (eligible?answered.has(entry.itemId)&&p.presented&&!p.skippedByBranch:p.skippedByBranch&&!p.presented),
    'Invalid checkpoint presentation or completion.');
  }
  seen.add(checkpoint.eventIndex);
 }
 return expected;
}
export function restoreQuiz(saved,{bank,pilot,scalesDoc,formPolicy=null,formPolicies=[],localizationBundles=[],localizationCatalogs=[],modelReleases=[]}){
 insist(saved&&saved.packet&&saved.session,'The saved quiz is incomplete.');
 const quiz=structuredClone(saved),{session,packet}=quiz;
 if(session.modelReleaseVersion){const release=modelReleases.find(x=>x.releaseVersion===session.modelReleaseVersion);
  insist(release,'Historical model release unavailable. Keep the backup.');
  insist(release.components.some(c=>c.key==='bank'&&c.version===session.bankVersion)&&
   release.components.some(c=>c.key==='model'&&c.version===packet.evidenceModelVersion)&&
   release.components.some(c=>['full_form','progressive_routes'].includes(c.key)&&c.version===packet.formPolicyVersion),
  'Historical model release is incompatible. Keep the backup.');
  insist(!quiz.affinityCatalogVersion||release.components.some(c=>c.key==='affinity'&&c.version===quiz.affinityCatalogVersion),
   'The saved affinity catalog release is unavailable in its model release. Keep the backup.');
  insist(!session.localization||release.components.some(c=>c.key==='localization_bundle:'+session.localization.locale&&
   c.version===session.localization.bundleVersion),'The saved wording release is unavailable in its model release. Keep the backup.');
 }
 if(session.releaseChannel)insist(RELEASE_CHANNELS.includes(session.releaseChannel)&&session.modelReleaseVersion,
  'Saved release channel is invalid. Keep the backup.');
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
 const expected=isBlueprint?(formPolicy.algorithm==='progressive-fixed-1'?
  replayProgressivePacket({quiz,policy:formPolicy,bank,pilot,scalesDoc,localizationBundles,localizationCatalogs}):
  generatePhilosophyPacket({bank,pilot,policy:formPolicy,seed:session.randomizationSeed,size:packet.size,packetId:session.packetId})):
  generatePilotPacket({bank,pilot,seed:session.randomizationSeed,size:packet.size,packetId:session.packetId});
 insist(same(expected,packet),'The saved question order or version is invalid.');
 insist(Array.isArray(session.presentedItems)&&session.presentedItems.length===packet.size,'Invalid saved presentation records.');
 validateSavedLocalization(session,{bank,bundles:localizationBundles,catalogs:localizationCatalogs});
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
