import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {validateSubmittedSession,SessionValidationError} from './session-validation.js';
import {SessionConflictError} from './store.js';
import {projectResearchContribution,ResearchContributionError,RESEARCH_CONSENT_VERSION} from './research.js';
import {validateFeedback} from '../beta/feedback.js';
const json=(res,status,body,headers={})=>{const bytes=Buffer.from(JSON.stringify(body)+'\n');res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(bytes);};
const readBody=async(req,max)=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(Error('Request body too large.'),{statusCode:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(Error('Invalid JSON body.'),{statusCode:400});}};
const inside=(file,dir)=>file===dir||file.startsWith(dir+path.sep);
const contentType=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)];
const publicDataPathsFor=root=>{
 const current=JSON.parse(readFileSync(path.join(root,'data/current.json'),'utf8'));
 const experience=JSON.parse(readFileSync(path.join(root,current.quizExperience.path),'utf8'));
 const paths=['data/current.json','data/response-scales.json','data/domains.json'];
 for(const ref of Object.values(current)){
  if(ref&&typeof ref==='object'&&!Array.isArray(ref)&&typeof ref.path==='string')paths.push(ref.path);
 }
 for(const ref of [...(current.affinityCatalogVersions??[]),...(current.localizationCatalogVersions??[]),...(current.localizationBundleVersions??current.localizationBundles??[]),...(current.modelReleaseVersions??[]),...(experience.formPolicies??[]),...(experience.modelPolicies??[])])
  if(typeof ref.path==='string')paths.push(ref.path);
 return new Set(paths.filter(p=>p.startsWith('data/')&&!p.split('/').some(s=>s==='.'||s==='..')).map(p=>'/'+p));
};
const staticAllowed=(name,publicDataPaths)=>{
 if(name.split('/').some(segment=>segment.startsWith('.')))return false;
 if(['/docs/QUIZ_EXPERIENCE.md','/docs/PROGRESSIVE_DEPTH.md','/docs/RESEARCH_DATA.md',
  '/docs/BETA_KNOWN_LIMITATIONS.md','/docs/MODEL_CHANGELOG.md'].includes(name))return true;
 if(name.startsWith('/data/'))return publicDataPaths.has(name);
 return name==='/packages/beta/release.js'||(
  ['/apps/web/','/apps/quiz/','/packages/runtime/','/packages/worldview/','/packages/experience/',
   '/packages/philosophy/','/packages/localization/'].some(prefix=>name.startsWith(prefix))&&
  ['.html','.css','.js','.svg'].includes(path.extname(name)));
};
export function createCollectionHttpServer({repoRoot,bank,pilot,instrument,scalesDoc,store,
 researchStore=null,researchContext=null,researchContributionsEnabled=null,legacyCollectionEnabled=false,maxBodyBytes=2_000_000,
 researchRateWindowMs=600_000,maxResearchPostsPerWindow=30,productMetricsEnabled=false,
 releaseChannel={channel:'development',modelReleaseVersion:null,features:{adaptiveClarification:true,affinityDisplay:true,sharing:true,feedback:false}},
 feedbackStore=null,feedbackReleases=[],onEvent=()=>{}}){
 const root=path.resolve(repoRoot);
 const publicDataPaths=publicDataPathsFor(root);
 const contributionEnabled=researchContributionsEnabled??Boolean(researchStore&&researchContext);
 const researchRate=new Map(),productRate=new Map(),feedbackRate=new Map();let rateChecks=0;
 const emit=event=>{try{onEvent(event);}catch{}};
 const researchPostAllowance=req=>{
  const now=Date.now();if(++rateChecks%100===0)for(const [key,row] of researchRate)if(row.resetAt<=now)researchRate.delete(key);
  const key=req.socket.remoteAddress??'unknown';let row=researchRate.get(key);
  if(!row||row.resetAt<=now){if(researchRate.size>=10_000)return 60;
   row={count:0,resetAt:now+researchRateWindowMs};researchRate.set(key,row);}
  row.count++;return row.count>maxResearchPostsPerWindow?Math.max(1,Math.ceil((row.resetAt-now)/1000)):0;
 };
 const productAllowance=req=>{
  const now=Date.now(),key=req.socket.remoteAddress??'unknown';
  if(productRate.size>=10_000&&!productRate.has(key))return 60;
  let row=productRate.get(key);
  if(!row||row.resetAt<=now){row={count:0,resetAt:now+researchRateWindowMs};productRate.set(key,row);}
  if(productRate.size>1000)for(const [k,r] of productRate)if(r.resetAt<=now)productRate.delete(k);
  return ++row.count>120?Math.max(1,Math.ceil((row.resetAt-now)/1000)):0;
 };
 const feedbackAllowance=req=>{
  const now=Date.now(),key=req.socket.remoteAddress??'unknown';
  if(feedbackRate.size>=10_000&&!feedbackRate.has(key))return 60;
  let row=feedbackRate.get(key);
  if(!row||row.resetAt<=now){row={count:0,resetAt:now+researchRateWindowMs};feedbackRate.set(key,row);}
  if(feedbackRate.size>1000)for(const [k,r] of feedbackRate)if(r.resetAt<=now)feedbackRate.delete(k);
  return ++row.count>15?Math.max(1,Math.ceil((row.resetAt-now)/1000)):0;
 };
 const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),method=req.method??'GET';
  if(method==='GET'&&url.pathname==='/api/health'){json(res,200,{status:'ok',pilotId:pilot.pilotId,bankVersion:bank.bankVersion,instrumentVersion:instrument.instrumentVersion});return;}
  if(method==='GET'&&url.pathname==='/api/pilot/config'){json(res,200,{pilotId:pilot.pilotId,bankVersion:bank.bankVersion,instrumentVersion:instrument.instrumentVersion,allowedPacketSize:pilot.administration.allowedPacketSize,defaultPacketSize:pilot.administration.defaultPacketSize});return;}
  if(method==='GET'&&url.pathname==='/api/research/config'){
   json(res,200,{enabled:contributionEnabled,consentVersion:RESEARCH_CONSENT_VERSION,
    eligibleInstrumentVersion:contributionEnabled?researchContext?.model.pilotInstrumentVersion??null:null,
    consent:contributionEnabled?researchContext?.consent??null:null});return;
  }
  if(method==='GET'&&url.pathname==='/api/product/config'){json(res,200,{enabled:productMetricsEnabled,version:'route-product-events-1'});return;}
  if(method==='GET'&&url.pathname==='/api/beta/config'){
   json(res,200,{schemaVersion:'worldview-beta-config-1',channel:releaseChannel.channel,
    modelReleaseVersion:releaseChannel.modelReleaseVersion,
    features:{...releaseChannel.features,feedback:Boolean(feedbackStore&&releaseChannel.features.feedback)}});return;
  }
  if(method==='POST'&&url.pathname==='/api/feedback'){
   if(!feedbackStore||!releaseChannel.features.feedback){json(res,404,{error:'not_found'});return;}
   const retryAfter=feedbackAllowance(req);
   if(retryAfter){emit({event:'feedback_rate_limited',status:429});json(res,429,{error:'rate_limited'},
    {'Retry-After':String(retryAfter)});return;}
   if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']??''))){json(res,415,{error:'content_type'});return;}
   const origin=req.headers.origin;
   if(origin){let allowed=false;try{allowed=new URL(origin).host===req.headers.host;}catch{}if(!allowed){json(res,403,{error:'origin'});return;}}
   const body=await readBody(req,4096);
   const report=validateFeedback(body,{releases:feedbackReleases,channel:releaseChannel.channel});
   try{await feedbackStore.save(report);}catch(error){emit({event:'feedback_save_failed',status:500});throw error;}
   emit({event:'feedback_received',kind:report.kind,category:report.category,modelReleaseVersion:report.context.modelReleaseVersion});
   json(res,201,{accepted:true,feedbackId:report.feedbackId});return;
  }
  if(method==='POST'&&url.pathname==='/api/product/events'){
   if(!productMetricsEnabled){json(res,404,{error:'not_found'});return;}
   const retryAfter=productAllowance(req);
   if(retryAfter){json(res,429,{error:'rate_limited'},{'Retry-After':String(retryAfter)});return;}
   if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']??''))){json(res,415,{error:'content_type'});return;}
   const origin=req.headers.origin;
   if(origin){let allowed=false;try{allowed=new URL(origin).host===req.headers.host;}catch{}if(!allowed){json(res,403,{error:'origin'});return;}}
   const body=await readBody(req,512),keys=Object.keys(body??{}).sort();
   if(!body||typeof body!=='object'||Array.isArray(body)||!keys.every(k=>['domainId','event','itemCount','routeId','shareFormat','version'].includes(k))||
    body.version!=='route-product-events-1'||
    !['route_started','route_completed','route_extended','clarification_requested','route_stopped','route_paused','page_left',
     'exploration_opened','reading_opened','tradition_compared','source_opened','share_exported',
     'save_failed','result_generation_failed','route_failed','clarification_offered','clarification_completed'].includes(body.event)||
    !['quick','standard','full'].includes(body.routeId)||!Number.isInteger(body.itemCount)||body.itemCount<0||body.itemCount>238||
    (body.domainId!==undefined&&!['ME','NE','MF','VA','EP','OM','MS','AH','RC','EX','SO','PL'].includes(body.domainId))||
    (body.shareFormat!==undefined&&(body.event!=='share_exported'||!['overview','domain','affinity','exploration'].includes(body.shareFormat)))){
    json(res,400,{error:'invalid_product_event'});return;
   }
   emit({event:'product_route_event',productEvent:body.event,routeId:body.routeId,itemCount:body.itemCount,
    ...(body.domainId?{domainId:body.domainId}:{}),...(body.shareFormat?{shareFormat:body.shareFormat}:{})});
   res.writeHead(204,{'Cache-Control':'no-store'});res.end();return;
  }
  if(method==='POST'&&url.pathname==='/api/research/contributions'){
   if(!contributionEnabled||!researchStore||!researchContext){json(res,503,{error:'contribution_disabled'});return;}
   const retryAfter=researchPostAllowance(req);
   if(retryAfter){emit({event:'research_post_rate_limited',status:429});json(res,429,{error:'rate_limited',message:'Too many contribution attempts. Please try later.'},{'Retry-After':String(retryAfter)});return;}
   if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']??''))){json(res,415,{error:'content_type'});return;}
   const body=await readBody(req,maxBodyBytes);
   const projected=projectResearchContribution({body,bank,pilot,scalesDoc,...researchContext});
   const receipt=await researchStore.save(projected,{contributionId:body.contributionId,withdrawalToken:body.withdrawalToken});
   const status=receipt.duplicate?200:201;
   emit({event:receipt.duplicate?'research_contribution_replayed':'research_contribution_saved',status,instrumentVersion:projected.instrumentVersion});
   json(res,status,{accepted:true,consentVersion:RESEARCH_CONSENT_VERSION,...receipt});return;
  }
  const withdrawal=/^\/api\/research\/contributions\/([0-9a-f-]{36})$/i.exec(url.pathname);
  if(method==='DELETE'&&withdrawal){
   if(!researchStore){json(res,503,{error:'contribution_disabled'});return;}
   const token=String(req.headers.authorization??'').replace(/^Bearer /i,'');
   const result=await researchStore.withdraw(withdrawal[1],token);
   emit({event:'research_contribution_withdrawn',status:200,alreadyWithdrawn:result.alreadyWithdrawn});
   json(res,200,result);return;
  }
  if(method==='POST'&&url.pathname==='/api/pilot/sessions'){
   if(!legacyCollectionEnabled){json(res,503,{error:'legacy_collection_disabled'});return;}
   if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']??''))){json(res,415,{error:'content_type',message:'Content-Type must be application/json'});return;}
   const session=await readBody(req,maxBodyBytes);
   const summary=validateSubmittedSession({session,bank,pilot,instrument,scalesDoc});
   const saved=await store.save(session);
   json(res,saved.created?201:200,{accepted:true,duplicate:saved.duplicate,sessionId:saved.sessionId,completionStatus:summary.completionStatus,packetSize:summary.packetSize,responseCount:summary.responseCount});return;
  }
  if(method==='GET'&&url.pathname==='/api/research/export'){
   json(res,410,{error:'export_moved_offline',message:'Use the audited, consent-filtered research package command on the server.'});return;
  }
  if(!['GET','HEAD'].includes(method)){json(res,405,{error:'method_not_allowed'},{Allow:'GET, HEAD'});return;}
  if(url.pathname==='/'){res.writeHead(302,{Location:'/apps/quiz/','Cache-Control':'no-store'});res.end();return;}
  if(!legacyCollectionEnabled&&url.pathname.startsWith('/apps/web/')){json(res,404,{error:'not_found'});return;}
  let name;try{name=decodeURIComponent(url.pathname);}catch{json(res,400,{error:'invalid_path'});return;}
  if(name.endsWith('/'))name+='index.html';
  if(!staticAllowed(name,publicDataPaths)){json(res,404,{error:'not_found'});return;}
  const file=path.resolve(root,'.'+name);
  if(!inside(file,root)){json(res,404,{error:'not_found'});return;}
  const resolved=await realpath(file),resolvedRoot=await realpath(root);
  // Never serve private store contents, even if a deployment places the store
  // under an otherwise public directory. Reject symlink escape as well.
  const storeRoot=store.root?path.resolve(store.root):null;
  const resolvedStore=storeRoot?await realpath(storeRoot).catch(()=>storeRoot):null;
  const researchRoot=researchStore?.root?path.resolve(researchStore.root):null;
  const resolvedResearch=researchRoot?await realpath(researchRoot).catch(()=>researchRoot):null;
  if(!inside(resolved,resolvedRoot)||(resolvedStore&&inside(resolved,resolvedStore))||(resolvedResearch&&inside(resolved,resolvedResearch))){json(res,404,{error:'not_found'});return;}
  const relative='/'+path.relative(resolvedRoot,resolved).split(path.sep).join('/');
  if(!staticAllowed(relative,publicDataPaths)||!(await stat(resolved)).isFile()){json(res,404,{error:'not_found'});return;}
  const bytes=await readFile(resolved);
  res.writeHead(200,{'Content-Type':contentType(resolved),'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(method==='HEAD'?undefined:bytes);
 }catch(error){
  if(res.headersSent){res.end();return;}
  if(error instanceof SessionValidationError){json(res,400,{error:'invalid_session',message:error.message,details:error.details});return;}
  if(error instanceof SessionConflictError){json(res,409,{error:'session_conflict',message:error.message});return;}
  if(error instanceof ResearchContributionError){emit({event:'research_request_failed',status:error.statusCode});json(res,error.statusCode,{error:'research_contribution',message:error.statusCode>=500?'Research storage is temporarily unavailable.':error.message});return;}
  if(['ENOENT','ENOTDIR'].includes(error.code)){json(res,404,{error:'not_found'});return;}
  const status=error.statusCode??500;if(status>=500)emit({event:'server_request_failed',status});
  json(res,status,{error:status>=500?'internal_error':'request_error',message:status>=500?'Internal server error.':error.message});
 }});
 server.requestTimeout=60_000;server.headersTimeout=15_000;server.keepAliveTimeout=5_000;
 return server;
}
