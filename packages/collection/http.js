import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {validateSubmittedSession,SessionValidationError} from './session-validation.js';
import {SessionConflictError,sanitizeSessionForResearchExport} from './store.js';
const json=(res,status,body,headers={})=>{const bytes=Buffer.from(JSON.stringify(body)+'\n');res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(bytes);};
const readBody=async(req,max)=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(Error('Request body too large.'),{statusCode:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(Error('Invalid JSON body.'),{statusCode:400});}};
const tokenMatches=(header,token)=>{const a=Buffer.from(header??''),b=Buffer.from('Bearer '+token);return a.length===b.length&&timingSafeEqual(a,b);};
const inside=(file,dir)=>file===dir||file.startsWith(dir+path.sep);
const contentType=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)];
const staticAllowed=name=>{
 if(name.split('/').some(segment=>segment.startsWith('.')))return false;
 if(name==='/docs/QUIZ_EXPERIENCE.md')return true;
 if(name.startsWith('/data/'))return path.extname(name)==='.json';
 return ['/apps/web/','/apps/quiz/','/packages/runtime/','/packages/worldview/','/packages/experience/'].some(prefix=>name.startsWith(prefix))&&['.html','.css','.js','.svg'].includes(path.extname(name));
};
export function createCollectionHttpServer({repoRoot,bank,pilot,instrument,scalesDoc,store,adminToken=null,maxBodyBytes=2_000_000}){
 const root=path.resolve(repoRoot);
 return createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),method=req.method??'GET';
  if(method==='GET'&&url.pathname==='/api/health'){json(res,200,{status:'ok',pilotId:pilot.pilotId,bankVersion:bank.bankVersion,instrumentVersion:instrument.instrumentVersion});return;}
  if(method==='GET'&&url.pathname==='/api/pilot/config'){json(res,200,{pilotId:pilot.pilotId,bankVersion:bank.bankVersion,instrumentVersion:instrument.instrumentVersion,allowedPacketSize:pilot.administration.allowedPacketSize,defaultPacketSize:pilot.administration.defaultPacketSize});return;}
  if(method==='POST'&&url.pathname==='/api/pilot/sessions'){
   if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']??''))){json(res,415,{error:'content_type',message:'Content-Type must be application/json'});return;}
   const session=await readBody(req,maxBodyBytes);
   const summary=validateSubmittedSession({session,bank,pilot,instrument,scalesDoc});
   const saved=await store.save(session);
   json(res,saved.created?201:200,{accepted:true,duplicate:saved.duplicate,sessionId:saved.sessionId,completionStatus:summary.completionStatus,packetSize:summary.packetSize,responseCount:summary.responseCount});return;
  }
  if(method==='GET'&&url.pathname==='/api/research/export'){
   if(!adminToken){json(res,503,{error:'export_disabled',message:'Research export is disabled.'});return;}
   if(!tokenMatches(req.headers.authorization,adminToken)){json(res,401,{error:'unauthorized',message:'Valid Bearer token required.'});return;}
   const sessions=await store.list();res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
   for(const session of sessions)res.write(JSON.stringify(sanitizeSessionForResearchExport(session))+'\n');res.end();return;
  }
  if(!['GET','HEAD'].includes(method)){json(res,405,{error:'method_not_allowed'},{Allow:'GET, HEAD'});return;}
  if(url.pathname==='/'){res.writeHead(302,{Location:'/apps/quiz/','Cache-Control':'no-store'});res.end();return;}
  let name;try{name=decodeURIComponent(url.pathname);}catch{json(res,400,{error:'invalid_path'});return;}
  if(name.endsWith('/'))name+='index.html';
  if(!staticAllowed(name)){json(res,404,{error:'not_found'});return;}
  const file=path.resolve(root,'.'+name);
  if(!inside(file,root)){json(res,404,{error:'not_found'});return;}
  const resolved=await realpath(file),resolvedRoot=await realpath(root);
  // Never serve private store contents, even if a deployment places the store
  // under an otherwise public directory. Reject symlink escape as well.
  const storeRoot=store.root?path.resolve(store.root):null;
  const resolvedStore=storeRoot?await realpath(storeRoot).catch(()=>storeRoot):null;
  if(!inside(resolved,resolvedRoot)||(resolvedStore&&inside(resolved,resolvedStore))){json(res,404,{error:'not_found'});return;}
  const relative='/'+path.relative(resolvedRoot,resolved).split(path.sep).join('/');
  if(!staticAllowed(relative)||!(await stat(resolved)).isFile()){json(res,404,{error:'not_found'});return;}
  const bytes=await readFile(resolved);
  res.writeHead(200,{'Content-Type':contentType(resolved),'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(method==='HEAD'?undefined:bytes);
 }catch(error){
  if(res.headersSent){res.end();return;}
  if(error instanceof SessionValidationError){json(res,400,{error:'invalid_session',message:error.message,details:error.details});return;}
  if(error instanceof SessionConflictError){json(res,409,{error:'session_conflict',message:error.message});return;}
  if(['ENOENT','ENOTDIR'].includes(error.code)){json(res,404,{error:'not_found'});return;}
  const status=error.statusCode??500;json(res,status,{error:status>=500?'internal_error':'request_error',message:status>=500?'Internal server error.':error.message});
 }});
}
