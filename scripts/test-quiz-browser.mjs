import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {createFileSessionStore} from '../packages/collection/store.js';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
const root=fileURLToPath(new URL('../',import.meta.url)),read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const current=await read('data/current.json'),bank=await read(current.candidateBank.path),pilot=await read(current.pilot.path),instrument=await read(current.instrument.path),scalesDoc=await read('data/response-scales.json');
const formPolicy=await read(current.publicForm.path),fullPolicy=await read(current.fullForm.path);
const scaleMap=new Map(scalesDoc.scales.map(s=>[s.id,s]));
let seed;
for(let n=0;n<300;n++){
 const candidate='browser-experience-'+n,q=createQuiz({bank,pilot,scalesDoc,formPolicy,seed:candidate,size:80,sessionId:'synthetic-session'}),seen=new Set();seekQuestion(q,bank);
 while(q.index!==null){const i=currentItem(q,bank);seen.add(i.responseScaleId);const value=['likert','paired_choice'].includes(i.responseType)?scaleMap.get(i.responseScaleId).options[0].value:i.responseType==='ranking'?i.options.map(o=>o.id):i.options[0].id;answerQuestion(q,bank,scalesDoc,{state:'answered',value});nextQuestion(q,bank);}
 if(seen.size===7){seed=candidate;break;}
}
assert.ok(seed,'Find a real 80-item packet with all seven response scales.');
await mkdir(path.join(root,'artifacts/quiz'),{recursive:true});
// Put the synthetic store under a usually public path to exercise its exclusion.
const storePath=await mkdtemp(path.join(root,'data/quiz-private-test-'));
await writeFile(path.join(storePath,'secret.json'),'{"synthetic":"PRIVATE_SENTINEL"}');
const store=createFileSessionStore({directory:storePath});
const server=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});let assertions=0;
const check=(name,ok)=>{assert.ok(ok,name);assertions++;console.log('PASS browser: '+name);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 const page=await context.newPage();const errors=[];let submissions=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')submissions++;});
 await page.addInitScript(seed=>{let n=0;Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>n++===0?seed:'synthetic-browser-session-'+n});},seed);
 await page.goto(base+'/');await page.waitForSelector('body[data-ready="true"]');
 check('Root opens the quiz rather than research runner',page.url().endsWith('/apps/quiz/'));
 await page.screenshot({path:'artifacts/quiz/landing-desktop.png',fullPage:true});
 check('Four length presets including the 240-question full route',await page.locator('.route').count()===4&&await page.locator('.route[data-size="240"]').count()===1);
 await page.locator('.route[data-size="80"]').click();await page.locator('#quiz').waitFor({state:'visible'});
 await page.locator('#auto').uncheck();
 check('An unanswered question cannot be advanced',await page.locator('#next').isDisabled());
 await page.screenshot({path:'artifacts/quiz/question-desktop.png',fullPage:true});
 const observed=new Set();let neutral=false,noView=false,paused=false,steps=0,rankingTested=false;
 while(await page.locator('#quiz').isVisible()){
  check('Bounded actual questionnaire flow',steps++<90);
  const scale=await page.locator('#quiz').getAttribute('data-scale');observed.add(scale);
  if(scale==='agreement5'&&!neutral){await page.locator('#answer-options button[data-value="0"]').click();neutral=true;}
  else if(!noView&&scale!=='ranking_all'){await page.locator('#special-options button[data-state="no_view"]').click();noView=true;}
  else if(scale==='ranking_all'){
   check('Ranking starts without a default answer',await page.locator('#confirm-ranking').isDisabled());
   const selects=page.locator('#answer-options select');for(let n=0;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
   await page.locator('#confirm-ranking').click();rankingTested=true;
  }else await page.locator('#answer-options .answer').first().click();
  await page.locator('#next').click();
  if(!paused&&steps===4&&await page.locator('#quiz').isVisible()){
   const id=await page.locator('#quiz').getAttribute('data-item-id');
   await page.locator('#pause').click();await page.reload();await page.waitForSelector('body[data-ready="true"]');
   await page.locator('#resume').click();await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
   check('Pause and reload restore the current item',await page.locator('#quiz').getAttribute('data-item-id')===id);paused=true;
  }
 }
 await page.locator('#results').waitFor({state:'visible'});
 check('All seven formats reached in a real browser',observed.size===7&&rankingTested);
 check('Twelve result panels',await page.locator('#domain-map .domain').count()===12);
 check('Academic qualification visible',/not a validated/.test(await page.locator('#academic-notice').innerText()));
 check('No automatic POST of quiz answers',submissions===0);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session);
 check('Raw neutral and no-view remain different',stored.responses.some(r=>r.state==='answered'&&r.value===0)&&stored.responses.some(r=>r.state==='no_view'&&r.value===null));
 check('Actually completed raw session',stored.completionStatus==='completed');
 check('Public form has its own replayable instrument version',stored.instrumentVersion===formPolicy.instrumentVersion);
 check('All 31 academic subtopics appear in result panels',await page.locator('[data-facet-id]').count()===31);
 check('Ontology and metaphysics are explicit, distinct subtopics',await page.locator('[data-facet-id="ontology"]').count()===1&&await page.locator('[data-facet-id="laws-causation"]').count()===1);
 const panel=page.locator('#domain-map .domain details').first();await panel.locator('summary').first().click();
 const why=panel.locator('.pattern details').first();if(await why.count()){await why.locator('summary').click();check('Sources exist in the explanation',await why.locator('a[href^="https:"]').count()>0);}
 await page.screenshot({path:'artifacts/quiz/summary-desktop.png',fullPage:true});
 await page.locator('#share-open').click();await page.locator('#sharing').waitFor({state:'visible'});
 check('Nothing preselected for sharing',await page.locator('#share-options input:checked').count()===0);
 check('Copy needs a deliberate selection',await page.locator('#copy-share').isDisabled());
 await page.locator('#share-options input').first().check();const preview=await page.locator('#share-preview').inputValue();
 check('Preview omits identifiers and raw response fields',!preview.includes(stored.sessionId)&&!preview.includes(stored.randomizationSeed)&&!preview.includes('responseTimeMs'));
 check('Preview retains qualification',preview.includes('Exploratory'));
 await page.locator('#share-close').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('#result-answers').click();const download=await downloadEvent;
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 check('Raw answer export preserves the completed session',JSON.parse(Buffer.concat(chunks).toString()).sessionId===stored.sessionId);
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.screenshot({path:'artifacts/quiz/summary-mobile.png',fullPage:true});
 check('No horizontal overflow on mobile',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 check('Reduced-motion preference is respected',await page.evaluate(()=>getComputedStyle(document.querySelector('.domain')).animationName==='none'));
 for(const name of ['/.git/config','/.data/pilot-sessions/anything.json','/packages/collection/store.js','/data/'+path.basename(storePath)+'/secret.json','/unlisted.txt']){
  const response=await context.request.get(base+name);check('Private or unlisted path rejected: '+name,response.status()===404);
 }
 check('No browser JavaScript errors',errors.length===0);
 await context.close();
 // Run the new full route in an actual mobile-sized browser. All answers below
 // are synthetic interaction fixtures, not respondent data or expected beliefs.
 const fullContext=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'});
 const fullPage=await fullContext.newPage();const fullErrors=[];let fullPosts=0;
 fullPage.on('pageerror',e=>fullErrors.push(e.message));fullPage.on('request',r=>{if(r.method()==='POST')fullPosts++;});
 await fullPage.addInitScript(()=>{let n=0;Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>n++===0?'browser-full-240':'synthetic-full-browser-'+n});});
 await fullPage.goto(base+'/');await fullPage.waitForSelector('body[data-ready="true"]');
 await fullPage.screenshot({path:'artifacts/quiz/full-route-landing-mobile.png',fullPage:true});
 await fullPage.locator('.route[data-size="240"]').click();await fullPage.locator('#quiz').waitFor({state:'visible'});await fullPage.locator('#auto').uncheck();
 check('Full route begins at question 1 of 240',/Question 1 of 240/.test(await fullPage.locator('#position').innerText()));
 await fullPage.screenshot({path:'artifacts/quiz/full-route-question-mobile.png',fullPage:true});
 let fullSteps=0;const fullScales=new Set();
 while(await fullPage.locator('#quiz').isVisible()){
  assert.ok(fullSteps++<241,'Full-route browser loop must terminate');
  const scale=await fullPage.locator('#quiz').getAttribute('data-scale');fullScales.add(scale);
  if(scale==='ranking_all'){
   const selects=fullPage.locator('#answer-options select');
   for(let n=0;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
   await fullPage.locator('#confirm-ranking').click();
  }else await fullPage.locator('#answer-options .answer').first().click();
  await fullPage.locator('#next').click();
  if(fullSteps===120&&await fullPage.locator('#quiz').isVisible()){
   const id=await fullPage.locator('#quiz').getAttribute('data-item-id');
   const before=await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.responses);
   await fullPage.locator('#pause').click();await fullPage.reload();await fullPage.waitForSelector('body[data-ready="true"]');await fullPage.locator('#resume').click();
   await fullPage.locator('#quiz').waitFor({state:'visible'});await fullPage.locator('#auto').uncheck();
   check('240 route resumes at the same mid-quiz item',await fullPage.locator('#quiz').getAttribute('data-item-id')===id);
   assert.deepEqual(await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.responses),before);
   await fullPage.locator('#back').click();await fullPage.locator('#next').click();
   check('Full-route Back/Next preserves answers and restores position',await fullPage.locator('#quiz').getAttribute('data-item-id')===id);
  }
 }
 await fullPage.locator('#results').waitFor({state:'visible'});
 const fullSaved=await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('240 unique assigned items survive the full browser flow',fullSaved.packet.size===240&&new Set(fullSaved.packet.entries.map(e=>e.itemId)).size===240);
 check('All full-route positions are answered or legitimately branch-skipped',fullSaved.session.responses.length+fullSaved.session.presentedItems.filter(e=>e.skippedByBranch).length===240);
 check('Full-route results cover twelve panels and 31 facets',await fullPage.locator('#domain-map .domain').count()===12&&await fullPage.locator('[data-facet-id]').count()===31);
 check('Full route exercised all seven response scales',fullScales.size===7);
 check('Full route has a distinct instrument and saved policy',fullSaved.session.instrumentVersion===fullPolicy.instrumentVersion&&fullSaved.packet.formPolicyVersion===fullPolicy.policyVersion);
 check('240 route never posts answers and has no browser errors',fullPosts===0&&fullErrors.length===0);
 check('Full results do not misdescribe this as an old random sample',!(await fullPage.locator('#coverage-notice').innerText()).includes('historical sample'));
 check('Full-route mobile results have no horizontal overflow',await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await fullPage.screenshot({path:'artifacts/quiz/full-route-results-mobile.png',fullPage:true});
 const fullDownloadEvent=fullPage.waitForEvent('download');await fullPage.locator('#result-answers').click();const fullDownload=await fullDownloadEvent;
 const fullStream=await fullDownload.createReadStream(),fullChunks=[];for await(const chunk of fullStream)fullChunks.push(chunk);
 assert.deepEqual(JSON.parse(Buffer.concat(fullChunks).toString()),fullSaved.session);
 check('Full 240-session export exactly preserves raw responses',true);
 await fullPage.reload();await fullPage.waitForSelector('body[data-ready="true"]');await fullPage.locator('#resume').click();await fullPage.locator('#results').waitFor({state:'visible'});
 assert.deepEqual(await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session),fullSaved.session);
 check('Completed full-route backup reopens without changing answers',true);
 await fullContext.close();
 const blocked=await browser.newContext();const fallback=await blocked.newPage();
 await fallback.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError');};});
 await fallback.goto(base+'/');await fallback.waitForSelector('body[data-ready="true"]');await fallback.locator('.route[data-size="80"]').click();await fallback.locator('#auto').uncheck();
 await fallback.locator('#special-options button[data-state="no_view"]').click();
 check('Storage failure is visible, not false autosave',/unavailable/.test(await fallback.locator('#message').innerText()));
 await fallback.locator('#next').click();check('Quiz remains usable without storage',await fallback.locator('#quiz').isVisible());
 await blocked.close();
 console.log('Actual Chromium experience checks passed: '+assertions+'; synthetic answers only.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(storePath,{recursive:true,force:true});}
