import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {mkdir,open,readFile,readdir,rename,stat,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {restoreQuiz} from '../experience/quiz.js';
import {compareWorldview} from '../worldview/index.js';

export const RESEARCH_CONSENT_VERSION='research-consent-1.0.0';
export class ResearchContributionError extends Error{
 constructor(message,statusCode=400){super(message);this.name='ResearchContributionError';this.statusCode=statusCode;}
}
const requireValue=(value,message)=>{if(!value)throw new ResearchContributionError(message);};
const allowed=(object,keys,label)=>{
 requireValue(object&&typeof object==='object'&&!Array.isArray(object),label+' must be an object.');
 for(const key of Object.keys(object))requireValue(keys.includes(key),label+' contains an unsupported field: '+key);
};
const sessionKeys=['schemaVersion','pilotId','instrumentVersion','bankVersion','packetId','sessionId','respondentKey','locale','localization','modelReleaseVersion','releaseChannel','clientVersion','randomizationSeed','startedAt','completedAt','completionStatus','presentedItems','responses','resultSnapshotRefs'];
const presentationKeys=['index','itemId','itemRevision','domainId','responseScaleId','textVersion','variantId','presented','skippedByBranch','presentedAt'];
const responseKeys=['itemId','itemRevision','state','value','responseTimeMs','changedAnswerCount','answeredAt'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash=value=>createHash('sha256').update(value).digest('hex');

export function projectResearchContribution({body,bank,pilot,scalesDoc,formPolicy,model,catalog,pilotManifest,
 localizationBundles=[],localizationCatalogs=[],modelReleases=[]}){
 allowed(body,['consentVersion','affirmed','quiz','linkId','contributionId','withdrawalToken'],'contribution');
 requireValue(body.consentVersion===RESEARCH_CONSENT_VERSION&&body.affirmed===true,'Explicit current research consent is required.');
 requireValue(body.linkId===undefined||uuid.test(body.linkId),'Optional longitudinal link must be a random version-4 identifier.');
 requireValue((body.contributionId===undefined&&body.withdrawalToken===undefined)||
  (uuid.test(body.contributionId)&&/^[0-9a-f]{64}$/i.test(body.withdrawalToken)),
 'A client receipt must contain a random contribution ID and private token together.');
 allowed(body.quiz,['packet','session','index','affinityCatalogVersion'],'quiz');
 allowed(body.quiz.session,sessionKeys,'session');
 requireValue(body.quiz.session.respondentKey===null,'Account or respondent keys are not accepted.');
 requireValue(Array.isArray(body.quiz.session.presentedItems)&&Array.isArray(body.quiz.session.responses),'Raw presentation and response arrays are required.');
 for(const p of body.quiz.session.presentedItems)allowed(p,presentationKeys,'presentation');
 for(const r of body.quiz.session.responses)allowed(r,responseKeys,'response');
 requireValue(body.quiz.affinityCatalogVersion===catalog.catalogVersion,'Pinned affinity catalog version mismatch.');
 let restored;
 try{restored=restoreQuiz(body.quiz,{bank,pilot,scalesDoc,formPolicies:[formPolicy],localizationBundles,localizationCatalogs,modelReleases});}
 catch(error){throw new ResearchContributionError('Invalid saved quiz: '+error.message);}
 const session=restored.session;
 requireValue(!session.localization||session.localization.locale==='en-US',
  'Research contribution currently requires the approved English instrument and consent.');
 requireValue(['en','en-US'].includes(session.locale),
  'Research contribution requires a supported English locale.');
 if(!session.localization)requireValue(session.presentedItems.every(p=>
  p.textVersion==null&&p.variantId==null),
 'An unlocalized research attempt cannot supply wording or variant metadata.');
 requireValue(session.instrumentVersion===model.pilotInstrumentVersion&&restored.packet.formPolicyVersion===formPolicy.policyVersion,'Only the frozen pilot route is eligible.');
 requireValue(['completed','in_progress'].includes(session.completionStatus)&&session.responses.length>0,'Only a started pilot attempt can be contributed.');
 try{compareWorldview({model,bank,scalesDoc,input:session});}
 catch(error){throw new ResearchContributionError('Invalid pilot evidence: '+error.message);}
  const itemMap=new Map(bank.items.map(item=>[item.id,item]));
 const responseMap=new Map(session.responses.map(r=>[r.itemId,r]));
  requireValue(uuid.test(session.sessionId),'Session identifier must be a random version-4 identifier.');
  const responses=restored.packet.entries.map(entry=>{
  const item=itemMap.get(entry.itemId),presentation=session.presentedItems[entry.index],response=responseMap.get(entry.itemId);
  const missingReason=response?.state==='answered'?null:response?response.state:presentation.skippedByBranch?'branch_not_shown':'not_reached';
  return {position:entry.index,itemId:entry.itemId,itemRevision:entry.itemRevision,domainId:item.domainId,
   textVersion:presentation.textVersion??null,variantId:presentation.variantId??null,
   translationStatus:session.localization?'approved':'historical_canonical_unpinned',
   responseType:item.responseType,responseScaleId:item.responseScaleId,presented:presentation.presented,
   responseState:response?.state??null,missingReason,rawValue:response?.state==='answered'?structuredClone(response.value):null,
   changedAnswerCount:response?.changedAnswerCount??0};
 });
 return {sourceSessionFingerprint:hash(session.sessionId),researchRespondentId:body.linkId?'r-'+hash(body.linkId):'r-'+randomUUID(),
  researchAdministrationId:'a-'+randomUUID(),consentVersion:body.consentVersion,
  linkageOptIn:Boolean(body.linkId),
  bankVersion:session.bankVersion,instrumentVersion:session.instrumentVersion,formPolicyVersion:formPolicy.policyVersion,
  respondentLocale:session.locale,presentationLocale:session.localization?.locale??'en-US',
  interfaceLanguage:session.localization?.interfaceLanguage??'en',
  localizationCatalogVersion:session.localization?.catalogVersion??null,
  localizationBundleVersion:session.localization?.bundleVersion??null,
  modelReleaseVersion:session.modelReleaseVersion??null,
  releaseChannel:session.releaseChannel??null,
  modelVersion:model.modelVersion,resultSemanticsVersion:model.resultSemanticsVersion,
  derivedInferenceVersion:pilotManifest.derivedInference.version,affinityCatalogVersion:catalog.catalogVersion,
  completionStatus:session.completionStatus,assignedItems:responses.length,answeredItems:session.responses.length,
  responses};
}

export function createResearchContributionStore({directory}){
 const root=path.resolve(directory);
 let ready=null;
 const init=()=>ready??=(async()=>{
  await mkdir(root,{recursive:true,mode:0o700});
  if(process.platform!=='win32'&&((await stat(root)).mode&0o077))
   throw new ResearchContributionError('Research store directory must be private (mode 0700).',500);
  // A prior process can stop before a temporary write is published. The
  // single-process store discards only its precisely named unpublished files.
  for(const name of await readdir(root))
   if(/^\.?[0-9a-f-]{36}\.(?:creating|withdraw)-[0-9a-f-]{36}$/i.test(name))await unlink(path.join(root,name));
 })().catch(error=>{ready=null;throw error;});
 const fileFor=id=>{
  if(!uuid.test(id))throw new ResearchContributionError('Invalid contribution identifier.');
  return path.join(root,id+'.json');
 };
 const read=async id=>JSON.parse(await readFile(fileFor(id),'utf8'));
 const list=async()=>{
  await init();const names=(await readdir(root)).filter(n=>/^[0-9a-f-]{36}\.json$/i.test(n)).sort();
  return Promise.all(names.map(name=>read(name.slice(0,-5))));
 };
 let pending=Promise.resolve();
 const serialize=operation=>{const task=pending.then(operation);pending=task.catch(()=>{});return task;};
 const save=(projected,clientReceipt={})=>serialize(async()=>{
  await init();
  const all=await list();
  const contributionId=clientReceipt.contributionId??randomUUID();
  const withdrawalToken=clientReceipt.withdrawalToken??randomBytes(32).toString('base64url');
  const existing=all.find(r=>r.contributionId===contributionId);
  if(existing){
   if(existing.status==='active'&&existing.sourceSessionFingerprint===projected.sourceSessionFingerprint&&
    timingSafeEqual(Buffer.from(existing.withdrawalTokenHash,'hex'),Buffer.from(hash(withdrawalToken),'hex')))
    return {contributionId,withdrawalToken,researchAdministrationId:existing.researchAdministrationId,duplicate:true};
   throw new ResearchContributionError('Contribution identifier is already in use.',409);
  }
  if(all.some(r=>r.status==='active'&&r.sourceSessionFingerprint===projected.sourceSessionFingerprint))
   throw new ResearchContributionError('This attempt is already contributed.',409);
  const record={...projected,contributionId,status:'active',consentedAt:new Date().toISOString(),withdrawalTokenHash:hash(withdrawalToken)};
  const temp=path.join(root,'.'+contributionId+'.creating-'+randomUUID());
  const handle=await open(temp,'wx',0o600);
  try{await handle.writeFile(JSON.stringify(record)+'\n');await handle.sync();}
  catch(error){await handle.close();await unlink(temp).catch(()=>{});throw error;}
  await handle.close();
  try{await rename(temp,fileFor(contributionId));}
  catch(error){await unlink(temp).catch(()=>{});throw error;}
  return {contributionId,withdrawalToken,researchAdministrationId:record.researchAdministrationId,duplicate:false};
 });
 const withdraw=(id,token)=>serialize(async()=>{
  if(typeof token!=='string'||token.length<20)throw new ResearchContributionError('A withdrawal token is required.',401);
  let record;try{record=await read(id);}catch(error){if(error.code==='ENOENT')throw new ResearchContributionError('Contribution not found.',404);throw error;}
  const candidate=Buffer.from(hash(token),'hex'),expected=Buffer.from(record.withdrawalTokenHash,'hex');
  if(candidate.length!==expected.length||!timingSafeEqual(candidate,expected))throw new ResearchContributionError('Invalid withdrawal token.',401);
  if(record.status==='withdrawn')return {withdrawn:true,alreadyWithdrawn:true};
  const tombstone={contributionId:id,status:'withdrawn',consentVersion:record.consentVersion,
   withdrawnAt:new Date().toISOString(),withdrawalTokenHash:record.withdrawalTokenHash};
  const temp=path.join(root,id+'.withdraw-'+randomUUID());
  const handle=await open(temp,'wx',0o600);
  try{await handle.writeFile(JSON.stringify(tombstone)+'\n');await handle.sync();}
  catch(error){await handle.close();await unlink(temp).catch(()=>{});throw error;}
  await handle.close();
  try{await rename(temp,fileFor(id));}catch(error){await unlink(temp).catch(()=>{});throw error;}
  return {withdrawn:true,alreadyWithdrawn:false};
 });
 const active=async()=>(await list()).filter(r=>r.status==='active');
 const auditExport=async({count,output})=>{
  await init();const handle=await open(path.join(root,'export-audit.ndjson'),'a',0o600);
  try{await handle.writeFile(JSON.stringify({at:new Date().toISOString(),activeContributions:count,output})+'\n');}finally{await handle.close();}
 };
 return {root,init,save,withdraw,active,auditExport};
}
