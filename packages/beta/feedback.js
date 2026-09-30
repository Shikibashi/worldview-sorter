import {randomUUID} from 'node:crypto';
import {link,mkdir,open,readFile,readdir,rename,stat,unlink} from 'node:fs/promises';
import path from 'node:path';
import {RELEASE_CHANNELS} from './release.js';

export const FEEDBACK_CATEGORIES=Object.freeze({
 question:['wording_unclear','terminology_unfamiliar','missing_answer_option','double_barreled','presupposition',
  'cultural_example','source_problem','localization_wording','localization_meaning','localization_scale','rtl_layout'],
 result:['explanation_unclear','unsupported_inference','missing_nuance','evidence_mismatch','affinity_overstated','affinity_divergence_missing','source_problem'],
 product:['accessibility','accessibility_keyboard','accessibility_screen_reader','accessibility_zoom','accessibility_motion',
  'technical_error','lost_progress','performance','navigation','localization','localization_wording',
  'localization_meaning','localization_scale','rtl_layout']
});
export const TRIAGE_CLASSES=Object.freeze(['software_defect','data_integrity_defect','accessibility_defect',
 'wording_comprehension','coverage_gap','interpretation_false_positive_candidate',
 'interpretation_false_negative_candidate','source_evidence_issue','affinity_model_issue',
 'philosophical_disagreement','feature_request']);
export const SEVERITIES=Object.freeze(['critical','high','medium','low']);
const states=['new','triaged','review_candidate','proposal_opened','resolved','declined'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(message,statusCode=400)=>{const error=Error(message);error.statusCode=statusCode;throw error;};
const exact=(value,keys,label)=>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))fail('Invalid '+label+'.');
};

export function validateFeedback(input,{releases,channel}){
 exact(input,['kind','category','context','text'],'feedback report');
 if(!Object.hasOwn(FEEDBACK_CATEGORIES,input.kind)||!FEEDBACK_CATEGORIES[input.kind].includes(input.category))fail('Invalid feedback category.');
 if(input.text!==undefined&&(typeof input.text!=='string'||input.text.length>1500))fail('Feedback text must be at most 1500 characters.');
 const c=input.context;
 exact(c,['modelReleaseVersion','administrationReleaseChannel','routeId','routeVersion','formPolicyVersion',
  'instrumentVersion','modelVersion','resultSemanticsVersion','affinityCatalogVersion','locale',
  'localizationBundleVersion','itemId','itemRevision','propositionId','traditionId','sourceId','location'],
 'feedback context');
 if(!RELEASE_CHANNELS.includes(c.administrationReleaseChannel??channel))fail('Unknown administration channel.');
 const release=releases.find(r=>r.manifest.releaseVersion===c.modelReleaseVersion);
 if(!release)fail('Unknown historical model release.');
 const {snapshot}=release;
 if(input.kind==='product'){
  if(!['home','question','results','sharing','sources','localization','failure'].includes(c.location))fail('Unknown product location.');
  if(Object.keys(c).some(k=>!['modelReleaseVersion','administrationReleaseChannel','location','locale'].includes(k)))
   fail('Product feedback has unnecessary philosophical context.');
 }else{
  const route=snapshot.routes.routes.find(r=>r.id===c.routeId&&r.routeVersion===c.routeVersion);
  if(!route||c.formPolicyVersion!==snapshot.routes.policyVersion||
   c.instrumentVersion!==snapshot.routes.instrumentVersion||c.modelVersion!==snapshot.model.modelVersion||
   c.resultSemanticsVersion!==snapshot.model.resultSemanticsVersion||
   c.affinityCatalogVersion!==snapshot.affinity.catalogVersion)fail('Feedback version tuple does not match its release.');
  const bundle=snapshot.localization.bundles.find(b=>b.locale===c.locale&&b.bundleVersion===c.localizationBundleVersion);
  if(!bundle||bundle.status!=='approved')fail('Unknown or unapproved wording release.');
  if(input.kind==='question'){
   const item=snapshot.bank.items.find(i=>i.id===c.itemId&&i.revision===c.itemRevision);
   if(!item||!snapshot.routes.routes.at(-1).itemRefs.some(ref=>ref.itemId===item.id&&ref.itemRevision===item.revision))
    fail('Question is unavailable in this release.');
   if(['propositionId','traditionId','location'].some(k=>Object.hasOwn(c,k)))fail('Question feedback contains unrelated result context.');
  }else{
   const proposition=c.propositionId&&snapshot.model.commitments.some(r=>r.id===c.propositionId&&
    snapshot.model.publicRuleIds.includes(r.id))||snapshot.model.derivedRules.some(r=>r.id===c.propositionId);
   const tradition=c.traditionId&&snapshot.affinity.traditions.some(t=>t.id===c.traditionId);
   if(!proposition&&!tradition)fail('Result feedback needs a known proposition or tradition.');
   if(['itemId','itemRevision','location'].some(k=>Object.hasOwn(c,k)))fail('Result feedback contains unrelated question context.');
  }
  if(c.sourceId){const ids=[...snapshot.sources.sources,...snapshot.sourceLedger.sources,
   ...snapshot.model.sources,...snapshot.affinity.sources].map(s=>s.id);
   if(!ids.includes(c.sourceId))fail('Unknown cited source.');}
 }
 return {schemaVersion:'worldview-feedback-1',feedbackId:randomUUID(),receivedAt:new Date().toISOString(),
  kind:input.kind,category:input.category,context:structuredClone(c),text:input.text?.trim()??'',
  receivedOnChannel:channel};
}

export function createFeedbackStore({directory}){
 const root=path.resolve(directory),reports=path.join(root,'reports'),reviews=path.join(root,'reviews');
 const init=async()=>{
  for(const dir of [root,reports,reviews]){await mkdir(dir,{recursive:true,mode:0o700});
   if(process.platform!=='win32'&&((await stat(dir)).mode&0o077))fail('Feedback store must be private.',500);}
 };
 const file=(dir,id)=>{if(!uuid.test(id))fail('Invalid feedback ID.');return path.join(dir,id+'.json');};
 const save=async report=>{await init();const destination=file(reports,report.feedbackId),
  temporary=destination+'.creating-'+randomUUID();
  const handle=await open(temporary,'wx',0o600);
  try{await handle.writeFile(JSON.stringify(report)+'\n');await handle.sync();}finally{await handle.close();}
  try{await link(temporary,destination);}finally{await unlink(temporary);}
  return {feedbackId:report.feedbackId};};
 const list=async()=>{await init();return Promise.all((await readdir(reports)).filter(n=>uuid.test(n.slice(0,-5))&&n.endsWith('.json'))
  .map(n=>readFile(path.join(reports,n),'utf8').then(JSON.parse)));};
 const get=async id=>{await init();return JSON.parse(await readFile(file(reports,id),'utf8'));};
 const getReview=async id=>{await init();try{return JSON.parse(await readFile(file(reviews,id),'utf8'));}
  catch(error){if(error.code==='ENOENT')return {feedbackId:id,status:'new',history:[]};throw error;}};
 const review=async({id,status,triageClass,severity,note,proposalId=null})=>{
  await get(id);if(!states.includes(status)||!TRIAGE_CLASSES.includes(triageClass)||!SEVERITIES.includes(severity)||
   typeof note!=='string'||!note.trim()||note.length>1500)fail('Invalid triage decision.');
  if(status==='proposal_opened'&&!/^MCP-[0-9]{4}-[0-9]{3,}$/.test(proposalId??''))fail('Proposal link required.');
  const destination=file(reviews,id),lockPath=destination+'.lock';
  let lock;try{lock=await open(lockPath,'wx',0o600);}catch(error){if(error.code==='EEXIST')fail('Another reviewer is updating this report.',409);throw error;}
  try{
  const previous=await getReview(id);
  if(!({new:['triaged'],triaged:['triaged','review_candidate','resolved','declined'],
   review_candidate:['review_candidate','proposal_opened','resolved','declined'],proposal_opened:['proposal_opened','resolved'],
   resolved:[],declined:[]})[previous.status].includes(status))fail('Invalid triage transition.');
  const next={feedbackId:id,status,triageClass,severity,proposalId,history:[...previous.history,
   {at:new Date().toISOString(),status,triageClass,severity,note:note.trim(),proposalId}]};
  const temporary=destination+'.tmp-'+randomUUID();
  const handle=await open(temporary,'wx',0o600);
  try{await handle.writeFile(JSON.stringify(next)+'\n');await handle.sync();}finally{await handle.close();}
  await rename(temporary,destination);return next;
  }finally{await lock.close();await unlink(lockPath);}
 };
 return {root,init,save,list,get,getReview,review};
}
