import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),read=async p=>JSON.parse(await readFile(new URL(p,new URL('../',import.meta.url)),'utf8'));
const current=await read('data/current.json');
const [bank,pilot,instrument,scalesDoc]=await Promise.all([read(current.candidateBank.path),read(current.pilot.path),read(current.instrument.path),read('data/response-scales.json')]);
const events=[];const server=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store:{},productMetricsEnabled:true,onEvent:e=>events.push(e)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const post=body=>fetch(base+'/api/product/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
try{
 assert.deepEqual(await fetch(base+'/api/product/config').then(r=>r.json()),{enabled:true,version:'route-product-events-1'});
 assert.equal((await fetch(base+'/docs/PROGRESSIVE_DEPTH.md')).status,200);
 const clean={version:'route-product-events-1',event:'clarification_requested',routeId:'quick',itemCount:64,domainId:'ME'};
 assert.equal((await post(clean)).status,204);
 assert.deepEqual(events,[{event:'product_route_event',productEvent:'clarification_requested',routeId:'quick',itemCount:64,domainId:'ME'}]);
 const share={version:'route-product-events-1',event:'share_exported',routeId:'quick',itemCount:64,shareFormat:'affinity'};
 assert.equal((await post(share)).status,204);
 assert.deepEqual(events[1],{event:'product_route_event',productEvent:'share_exported',routeId:'quick',itemCount:64,shareFormat:'affinity'});
 const failedSave={version:'route-product-events-1',event:'save_failed',routeId:'quick',itemCount:12};
 assert.equal((await post(failedSave)).status,204);
 assert.deepEqual(events[2],{event:'product_route_event',productEvent:'save_failed',routeId:'quick',itemCount:12});
 assert.equal((await post({...failedSave,event:'route_failed'})).status,204);
 for(const bad of [{...clean,answers:[1,2]}, {...clean,sessionId:'secret'}, {...clean,routeId:'unknown'}, {...clean,itemCount:999}, {...clean,domainId:'INVALID'},
  {...clean,shareFormat:'overview'}, {...share,shareFormat:'ideology'}, {...share,traditionId:'private-belief'}, null])assert.equal((await post(bad)).status,400);
 assert.equal((await fetch(base+'/api/product/events',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:JSON.stringify(clean)})).status,403);
 assert.equal(events.length,4,'No invalid payload reaches operational logs.');
 let limited=false;
 for(let n=0;n<125;n++){const response=await post(clean);if(response.status===429){limited=true;break;}assert.equal(response.status,204);}
 assert.ok(limited,'A burst of route events must be rate limited.');
 assert.ok(events.length<=120);
}finally{await new Promise(resolve=>server.close(resolve));}
const disabled=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store:{}});
await new Promise(resolve=>disabled.listen(0,'127.0.0.1',resolve));
try{const base='http://127.0.0.1:'+disabled.address().port;assert.equal((await fetch(base+'/api/product/config').then(r=>r.json())).enabled,false);assert.equal((await fetch(base+'/api/product/events',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,404);}finally{await new Promise(resolve=>disabled.close(resolve));}
console.log('Privacy-limited route product events pass validation; disabled by default.');
