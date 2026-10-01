import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {createFileSessionStore} from '../packages/collection/store.js';
import {createResearchContributionStore} from '../packages/collection/research.js';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion,recordDepthCheckpoint} from '../packages/experience/quiz.js';
const root=fileURLToPath(new URL('../',import.meta.url)),read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const current=await read('data/current.json'),bank=await read(current.candidateBank.path),pilot=await read(current.pilot.path),instrument=await read(current.instrument.path),scalesDoc=await read('data/response-scales.json');
const formPolicy=await read(current.progressiveDepth.path),historicalDepthPolicy=await read('data/experience/progressive-depth-v1.json'),
 historicalBank=await read('data/items/candidate-v0.9.json'),historicalPilot=await read('data/pilots/pilot-0.2.json'),
 fullPolicy=await read(current.fullForm.path),affinityCatalog=await read(current.affinityCatalog.path);
const scaleMap=new Map(scalesDoc.scales.map(s=>[s.id,s]));
let seed;
for(let n=0;n<300;n++){
 const candidate='browser-experience-'+n,q=createQuiz({bank,pilot,scalesDoc,formPolicy,seed:candidate,size:64,sessionId:'synthetic-session'}),seen=new Set();seekQuestion(q,bank);
 while(q.index!==null){const i=currentItem(q,bank);seen.add(i.responseScaleId);const value=['likert','paired_choice'].includes(i.responseType)?scaleMap.get(i.responseScaleId).options[0].value:i.responseType==='ranking'?i.options.map(o=>o.id):i.options[0].id;answerQuestion(q,bank,scalesDoc,{state:'answered',value});nextQuestion(q,bank);}
 if(seen.size===7){seed=candidate;break;}
}
assert.ok(seed,'Find a real 64-item packet with all seven response scales.');
await mkdir(path.join(root,'artifacts/quiz'),{recursive:true});
// Put the synthetic store under a usually public path to exercise its exclusion.
const storePath=await mkdtemp(path.join(root,'data/quiz-private-test-'));
await writeFile(path.join(storePath,'secret.json'),'{"synthetic":"PRIVATE_SENTINEL"}');
const store=createFileSessionStore({directory:storePath});
const researchStore=createResearchContributionStore({directory:path.join(storePath,'research')});
const researchContext={formPolicy:fullPolicy,model:await read(current.worldviewModel.path),catalog:await read(current.affinityCatalog.path),
 consent:await read('data/research/consent-v1.json'),
 pilotManifest:await read(current.pilotCandidate.path),
 localizationCatalogs:await Promise.all((current.localizationCatalogVersions??[current.localizationCatalog]).map(ref=>read(ref.path))),
 localizationBundles:await Promise.all((current.localizationBundles??[]).map(ref=>read(ref.path))),
 modelReleases:await Promise.all((current.modelReleaseVersions??[current.modelRelease]).map(ref=>read(ref.path)))};
const server=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store,researchStore,researchContext});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{}).catch(async error=>{await rm(storePath,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));throw error;});let assertions=0;
const check=(name,ok)=>{assert.ok(ok,name);assertions++;console.log('PASS browser: '+name);};
const checkAccessibility=async(page,name)=>{
 const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 const violations=report.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
 if(violations.length)console.error('Accessibility violations in '+name+':',JSON.stringify(violations));
 check(name+' accessibility',violations.length===0);
};
const completeStage=async(page,max)=>{
 let count=0;
 while(await page.locator('#quiz').isVisible()){
  assert.ok(count++<max,'Depth stage must terminate.');
  if(await page.locator('#quiz').getAttribute('data-scale')==='ranking_all'){
   const selects=page.locator('#answer-options select');
   for(let n=0;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
   await page.locator('#confirm-ranking').click();
  }else await page.locator('#answer-options .answer').first().click();
  await page.locator('#next').click();
 }
 await page.locator('#results').waitFor({state:'visible'});return count;
};
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 const page=await context.newPage();const errors=[],consoleErrors=[];let submissions=0,nonCanonicalWordingRequests=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 page.on('request',r=>{if(r.method()==='POST')submissions++;if(/(?:ar-draft|es-ES-draft)-v\d+\.json/.test(r.url()))nonCanonicalWordingRequests++;});
 await page.addInitScript(seed=>{Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=>{const n=Number(sessionStorage.getItem('test-uuid-count')??0);sessionStorage.setItem('test-uuid-count',String(n+1));return n===0?seed:'550e8400-e29b-41d4-a716-'+String(n).padStart(12,'0');}});},seed);
 await page.goto(base+'/');await page.waitForSelector('body[data-ready="true"]').catch(async error=>{
 throw new Error('Quiz did not initialize: '+JSON.stringify({pageErrors:errors,consoleErrors,failure:await page.locator('#failure').innerText().catch(()=>null)}),{cause:error});
 });
 check('Runtime does not request noncanonical wording files',nonCanonicalWordingRequests===0);
 await checkAccessibility(page,'Landing');
 check('Root opens the quiz rather than research runner',page.url().endsWith('/apps/quiz/'));
 await page.screenshot({path:'artifacts/quiz/landing-desktop.png',fullPage:true});
 check('Three depth presets including the 249-question pilot route',await page.locator('.route').count()===3&&await page.locator('.route[data-size="249"]').count()===1);
 check('Questionnaire has no unsupported language-choice copy or control',
  !/translated questionnaire|language choice|español|العربية/i.test(await page.locator('#home').innerText())&&
  await page.locator('#locale-choice').count()===0&&
  await page.locator('.route[data-size="64"]').isEnabled());
 await page.setViewportSize({width:320,height:640});
 await page.setViewportSize({width:1280,height:900});
 await page.locator('.route[data-size="64"]').click();await page.locator('#quiz').waitFor({state:'visible'});
 check('Public route pins the active canonical wording',await page.evaluate(()=>
  JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')??'null')?.quiz?.session?.localization?.locale==='en-US'));
 await page.locator('#auto').uncheck();
 check('An unanswered question cannot be advanced',await page.locator('#next').isDisabled());
 await page.locator('#question-title').focus();await page.keyboard.press('Tab');
 const firstFocused=await page.evaluate(()=>document.activeElement?.matches('#answer-options button,#answer-options select'));
 check('Keyboard tab order reaches the first answer after the question',firstFocused);
 if(await page.locator('#answer-options .answer').count()){
  await page.keyboard.press('Space');
  check('Keyboard activation exposes the selected answer',await page.locator('#answer-options .answer[aria-pressed="true"]').count()===1);
 }
 await page.screenshot({path:'artifacts/quiz/question-desktop.png',fullPage:true});
 await checkAccessibility(page,'Question');
 await page.setViewportSize({width:320,height:640});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))console.log('Question zoom overflow:',await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth).slice(0,10).map(e=>({tag:e.tagName,id:e.id,className:String(e.className),right:e.getBoundingClientRect().right}))})));
 check('Question and controls fit a narrow viewport at doubled text size',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:1280,height:900});
 const observed=new Set();let neutral=false,noView=false,paused=false,interrupted=false,steps=0,rankingTested=false;
 while(await page.locator('#quiz').isVisible()){
  check('Bounded actual questionnaire flow',steps++<75);
  const scale=await page.locator('#quiz').getAttribute('data-scale');observed.add(scale);
  if(scale==='agreement5'&&!neutral){await page.locator('#answer-options button[data-value="0"]').click();neutral=true;}
  else if(!noView&&scale!=='ranking_all'){await page.locator('#special-options button[data-state="no_view"]').click();noView=true;}
  else if(scale==='ranking_all'){
   check('Ranking starts without a default answer',await page.locator('#confirm-ranking').isDisabled());
   await checkAccessibility(page,'Ranking question');
   const selects=page.locator('#answer-options select');
   await selects.first().focus();await page.keyboard.press('ArrowDown');
   check('Ranking supports keyboard selection',await selects.first().inputValue()==='1');
   for(let n=1;n<await selects.count();n++)await selects.nth(n).selectOption('1');
   check('Repeated ranking values explain the error',await page.locator('#confirm-ranking').isDisabled()&&/Use each rank only once/.test(await page.locator('#ranking-status').innerText()));
   for(let n=1;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
   await page.locator('#confirm-ranking').click();rankingTested=true;
  }else await page.locator('#answer-options .answer').first().click();
  await page.locator('#next').click();
  if(!paused&&steps===4&&await page.locator('#quiz').isVisible()){
   const id=await page.locator('#quiz').getAttribute('data-item-id');
   await page.locator('#pause').click();await page.reload();await page.waitForSelector('body[data-ready="true"]');
   await page.locator('#resume').click();await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
   check('Pause and reload restore the current item',await page.locator('#quiz').getAttribute('data-item-id')===id);paused=true;
  }
  if(paused&&!interrupted&&steps===5&&await page.locator('#quiz').isVisible()){
   await context.setOffline(true);
   const id=await page.locator('#quiz').getAttribute('data-item-id');
   await page.locator('#special-options button').first().click();
   check('A network interruption does not prevent local response persistence',await page.evaluate(itemId=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.responses.some(r=>r.itemId===itemId),id));
   await context.setOffline(false);interrupted=true;
  }
 }
 await page.locator('#results').waitFor({state:'visible'});
 await checkAccessibility(page,'Results');
 check('All seven formats reached in a real browser',observed.size===7&&rankingTested);
 check('Twelve result panels',await page.locator('#domain-map .domain').count()===12);
 check('Academic qualification visible',/not a validated|not been psychometrically validated/.test(await page.locator('#academic-notice').innerText()));
 check('No automatic POST of quiz answers',submissions===0);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session);
 check('Raw neutral and no-view remain different',stored.responses.some(r=>r.state==='answered'&&r.value===0)&&stored.responses.some(r=>r.state==='no_view'&&r.value===null));
 check('Actually completed raw session',stored.completionStatus==='completed');
 check('Public form has its own replayable instrument version',stored.instrumentVersion===formPolicy.instrumentVersion);
 check('Route-relevant academic subtopics appear in result panels',await page.locator('[data-facet-id]').count()>=17);
 check('Ontology and metaphysics remain an explicit topic',await page.locator('#domain-map .domain summary').filter({hasText:'Ontology & metaphysics'}).count()===1);
 const panel=page.locator('#domain-map .domain details').first();await panel.locator('summary').first().click();
 const why=panel.locator('.pattern details').first();if(await why.count()){await why.locator(':scope > summary').click();check('Sources exist in the explanation',await why.locator('a[href^="https:"]').count()>0);}
 await page.screenshot({path:'artifacts/quiz/summary-desktop.png',fullPage:true});
 await page.locator('#share-open').click();await page.locator('#sharing').waitFor({state:'visible'});
 check('Share disclosure receives keyboard focus',await page.evaluate(()=>document.activeElement?.id==='share-title'));
 check('Nothing preselected for sharing',await page.locator('#share-options input:checked').count()===0);
 check('Copy needs a deliberate selection',await page.locator('#copy-share').isDisabled());
 await page.locator('#share-options input').first().check();const preview=await page.locator('#share-preview').inputValue();
 check('Preview omits identifiers and raw response fields',!preview.includes(stored.sessionId)&&!preview.includes(stored.randomizationSeed)&&!preview.includes('responseTimeMs'));
 check('Preview retains qualification',/exploratory/i.test(preview));
 check('Share preview preserves route and model context',preview.includes('route quick')&&preview.includes('catalog '+affinityCatalog.catalogVersion));
 const snapshotEvent=page.waitForEvent('download');await page.locator('#download-share-json').click();const snapshotDownload=await snapshotEvent;
 const snapshotStream=await snapshotDownload.createReadStream(),snapshotChunks=[];for await(const chunk of snapshotStream)snapshotChunks.push(chunk);
 const snapshotBytes=Buffer.concat(snapshotChunks),snapshot=JSON.parse(snapshotBytes.toString());
 check('User-selected snapshot excludes raw answers and session metadata',snapshot.rows.length===1&&!JSON.stringify(snapshot).includes(stored.sessionId)&&!JSON.stringify(snapshot).includes('responseTimeMs'));
 check('Snapshot pins historic result, instrument, route and affinity versions',snapshot.provenance.modelVersion&&snapshot.provenance.sourceAdministration.instrumentVersion&&snapshot.provenance.sourceAdministration.routeId==='quick'&&snapshot.provenance.affinityCatalogVersion);
 check('Shared result retains source claim roles',snapshot.schemaVersion==='worldview-share-6'&&
  snapshot.rows[0].sources.length>0&&snapshot.rows[0].sources.every(s=>s.id&&s.claimScope&&Array.isArray(s.claimLinks)));
 await page.locator('#share-format').selectOption('affinity');
 check('Affinity card retains doctrine and missing defining commitments',/Affinity is comparison, not identity/.test(await page.locator('#share-preview').inputValue())&&/unmeasured/.test(await page.locator('#share-preview').inputValue()));
 await page.locator('#share-tradition').selectOption('philosophical-anarchism');
 check('Affinity share preview qualifies inherited rule scope',/inherited rule scope, not a separately recorded proposition/.test(await page.locator('#share-preview').inputValue()));
 await page.locator('#share-format').selectOption('exploration');
 check('Exploration card reports activity without answers',/Domains explored:/.test(await page.locator('#share-preview').inputValue()));
 const svgEvent=page.waitForEvent('download');await page.locator('#download-share-svg').click();const svgDownload=await svgEvent;
 check('Image card is an explicit download',svgDownload.suggestedFilename().endsWith('.svg'));
 const viewer=await context.newPage();await viewer.goto(base+'/apps/quiz/share.html');await viewer.locator('#snapshot-file').setInputFiles({name:'selected.json',mimeType:'application/json',buffer:snapshotBytes});
 await viewer.locator('#snapshot-view h2').waitFor();
 check('Accessible file viewer opens historical snapshot without publishing',/Selected answer patterns/.test(await viewer.locator('#snapshot-view').textContent()));
 await viewer.locator('#snapshot-view .pattern details summary').first().click();
 check('Snapshot viewer qualifies source citation roles',/Source-record context, not linked|Topic citation; claim-level relevance|Rule-linked/.test(
  await viewer.locator('#snapshot-view .pattern details').first().innerText()));
 const olderCard=structuredClone(snapshot);olderCard.schemaVersion='worldview-share-5';
 for(const row of olderCard.rows)row.sources=row.sources.map(({title,url})=>({title,url}));
 await viewer.locator('#snapshot-file').setInputFiles({name:'older-card.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(olderCard))});
 await viewer.locator('#snapshot-view .pattern details summary').first().click();
 check('Historical source links do not gain new claim roles',/did not retain claim-level source roles/.test(
  await viewer.locator('#snapshot-view .pattern details').first().innerText()));
 const changedModel=structuredClone(snapshot);changedModel.snapshotId='550e8400-e29b-41d4-a716-446655440088';changedModel.provenance.modelVersion='future-interpretation';
 await viewer.locator('#compare-file').setInputFiles({name:'changed-model.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changedModel))});
 await viewer.locator('#snapshot-comparison').getByText(/Interpretation versions differ/).waitFor({timeout:5000});
 check('Historical comparison separates model change from respondent change',/Interpretation versions differ/.test(await viewer.locator('#snapshot-comparison').innerText()));
 await viewer.locator('#compare-file').setInputFiles({name:'private.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...snapshot,responses:[{secret:'raw'}]}))});
 await viewer.locator('#snapshot-status').getByText(/not a supported share snapshot/).waitFor({timeout:5000});
 check('Snapshot viewer rejects injected raw responses',/not a supported share snapshot/.test(await viewer.locator('#snapshot-status').innerText()));
 await checkAccessibility(viewer,'Snapshot viewer');
 await viewer.setViewportSize({width:320,height:640});
 check('Snapshot viewer fits a narrow mobile viewport',await viewer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await viewer.close();
 check('Creating and viewing snapshots did not POST answers or results',submissions===0);
 await page.locator('#share-close').click();
 check('Exploration section offers source and doctrine navigation',await page.locator('#reading-section').isVisible()&&await page.locator('#tradition-compare-section').isVisible());
 check('Long reading and comparison detail stay closed until requested',await page.locator('#reading-trail').isHidden()&&await page.locator('#tradition-comparison').isHidden());
 await page.locator('#reading-choice').selectOption({index:1});
 check('Reading trail shows source-linked explanation',await page.locator('#reading-trail a[href^="https:"]').count()>0);
 await page.locator('#tradition-left').selectOption('stirnerian-ownness');
 await page.locator('#tradition-right').selectOption('philosophical-anarchism');
 await page.locator('#tradition-compare-open').click();
 check('Two-tradition comparison preserves defining doctrine',await page.locator('#tradition-comparison .compare-tradition').count()===2);
 check('Tradition comparison does not promote scope-only overlap into close affinity',
  (await page.locator('#tradition-comparison').innerText()).includes('Doctrinal affinity unresolved'));
 check('Optional activity milestones contain no philosophical outcome',!(await page.locator('#exploration-milestones').innerText()).includes('ideology score'));
 const downloadEvent=page.waitForEvent('download');await page.locator('#result-answers').click();const download=await downloadEvent;
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 check('Raw answer export preserves the completed session',JSON.parse(Buffer.concat(chunks).toString()).sessionId===stored.sessionId);
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.screenshot({path:'artifacts/quiz/summary-mobile.png',fullPage:true});
 check('No horizontal overflow on mobile',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:320,height:640});
 check('Results fit a narrow phone viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))console.log('Zoom overflow:',await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,bodyWidth:document.body.scrollWidth,scrollX,active:document.activeElement?.outerHTML.slice(0,250),offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth||e.scrollWidth>e.clientWidth+1}).slice(0,20).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,className:String(e.className),left:r.left,right:r.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,overflow:getComputedStyle(e).overflowX,outline:getComputedStyle(e).outline,outlineOffset:getComputedStyle(e).outlineOffset}})})));
 check('Results fit at doubled root text size',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 check('Reduced-motion preference is respected',await page.evaluate(()=>getComputedStyle(document.querySelector('.domain')).animationName==='none'));
 check('Quick results offer optional depth and expose unmeasured doctrine',await page.locator('#depth-section').isVisible()&&await page.locator('#unmeasured-section').isVisible()&&await page.locator('#affinity-section').isVisible());
 const quickSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('Quick stage pins 64 exact revisions and a completed checkpoint',quickSaved.packet.size===64&&quickSaved.depth.checkpoints.length===1);
 const metricsContext=await browser.newContext();
 const reopenedEvents=[];
 await metricsContext.addInitScript(envelope=>{
  if(location.hostname==='127.0.0.1')localStorage.setItem('worldview-sorter:quiz-experience:1',JSON.stringify(envelope));
 },{experienceVersion:'quiz-1.7.0',quiz:quickSaved});
 const metricsPage=await metricsContext.newPage();
 await metricsPage.route('**/api/product/config',route=>route.fulfill({json:{enabled:true,version:'route-product-events-1'}}));
 await metricsPage.route('**/api/product/events',route=>{
  reopenedEvents.push(route.request().postDataJSON());return route.fulfill({status:204});
 });
 await metricsPage.goto(base+'/');await metricsPage.waitForSelector('body[data-ready="true"]');
 await metricsPage.locator('#resume').click();await metricsPage.locator('#results').waitFor({state:'visible'});
 const stopped=metricsPage.waitForResponse(response=>response.url().endsWith('/api/product/events')&&
  response.request().postDataJSON()?.event==='route_stopped');
 await metricsPage.locator('#depth-stop').click();await stopped;
 check('Reopening completed answers does not emit another route completion',
  reopenedEvents.some(event=>event.event==='route_stopped')&&
  !reopenedEvents.some(event=>['route_completed','clarification_completed'].includes(event.event)));
 await metricsContext.close();
 const legacyQuiz=createQuiz({bank:historicalBank,pilot:historicalPilot,scalesDoc,formPolicy:historicalDepthPolicy,seed:'historical-completed',size:64,
  sessionId:'synthetic-historical-completed',modelReleaseVersion:'model-release-1.0.0',
  localizationBundle:await read('data/localization/en-US-v1.json'),localizationCatalogVersion:'localization-catalog-1.0.0'});
 seekQuestion(legacyQuiz,historicalBank);
 while(legacyQuiz.index!==null){answerQuestion(legacyQuiz,historicalBank,scalesDoc,{state:'no_view',value:null});nextQuestion(legacyQuiz,historicalBank);}
 legacyQuiz.affinityCatalogVersion='philosophical-affinity-1.0.0';recordDepthCheckpoint(legacyQuiz);
 const legacyEnvelope={experienceVersion:'quiz-1.7.0',quiz:legacyQuiz};
 const legacyContext=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 await legacyContext.addInitScript(envelope=>{
  if(location.hostname==='127.0.0.1')localStorage.setItem('worldview-sorter:quiz-experience:1',JSON.stringify(envelope));
 },legacyEnvelope);
 const legacyPage=await legacyContext.newPage();await legacyPage.goto(base+'/');
 await legacyPage.waitForSelector('body[data-ready="true"]');await legacyPage.locator('#resume').click();
 await legacyPage.locator('#results').waitFor({state:'visible'});
 check('Historical English wording bundle replays under its original release',
  legacyQuiz.session.localization.bundleVersion==='localization-en-US-1.0.0'&&
  (await legacyPage.locator('#result-replay-notice').isVisible()));
 check('Unpinned historical inference is shown as current reinterpretation',
  /Current reinterpretation of saved answers/.test(await legacyPage.locator('#result-replay-notice').innerText())&&
  /did not pin inference code/.test(await legacyPage.locator('#result-replay-notice').innerText()));
 check('Unverified historical result cannot be exported or shared as original',
  await legacyPage.locator('#summary-save').isDisabled()&&await legacyPage.locator('#share-open').isDisabled()&&
  await legacyPage.locator('#result-answers').isEnabled()&&await legacyPage.locator('#depth-section').isHidden());
 await checkAccessibility(legacyPage,'Historical reinterpretation notice');
 await legacyContext.close();
 const partialLegacyQuiz=createQuiz({bank:historicalBank,pilot:historicalPilot,scalesDoc,formPolicy:historicalDepthPolicy,seed:'historical-partial',size:64,
  sessionId:'synthetic-historical-partial',modelReleaseVersion:'model-release-1.0.0'});
 seekQuestion(partialLegacyQuiz,historicalBank);
 const partialLegacyEnvelope={experienceVersion:'quiz-1.7.0',quiz:partialLegacyQuiz};
 const partialContext=await browser.newContext();
 await partialContext.addInitScript(envelope=>{
  if(location.hostname==='127.0.0.1')localStorage.setItem('worldview-sorter:quiz-experience:1',JSON.stringify(envelope));
 },partialLegacyEnvelope);
 const partialPage=await partialContext.newPage();await partialPage.goto(base+'/');
 await partialPage.waitForSelector('body[data-ready="true"]');await partialPage.locator('#resume').click();
 check('Incomplete historical attempt fails closed while retaining its backup',
  await partialPage.locator('#home').isVisible()&&
  /cannot be continued in the current release/.test(await partialPage.locator('#message').innerText())&&
  await partialPage.locator('#backup-saved').isEnabled());
 await partialContext.close();
 await page.locator('#depth-stop').click();await page.locator('#home').waitFor({state:'visible'});
 await page.locator('#resume').click();await page.locator('#results').waitFor({state:'visible'});
 check('Stopping and returning preserves the same raw administration',await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.sessionId)===quickSaved.session.sessionId);
 const domains=await page.locator('#depth-domain option').evaluateAll(options=>options.map(o=>o.value));
 let clarifyDomain=null;
 for(const domain of domains){await page.locator('#depth-domain').selectOption(domain);if(await page.locator('#depth-clarify').isEnabled()){clarifyDomain=domain;break;}}
 check('Domain clarification is offered only when the planner has a justified item',Boolean(clarifyDomain));
 const clarifyCount=Number((await page.locator('#depth-clarify').innerText()).match(/\d+/)?.[0]);
 await checkAccessibility(page,'Quick depth controls');
 await page.locator('#depth-clarify').click();await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
 check('Clarification appends the displayed number of questions',await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.packet.size)===64+clarifyCount);
 await completeStage(page,clarifyCount+1);
 const clarified=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('Clarification records why it selected exact revisions',clarified.depth.events[1].kind==='clarification'&&clarified.depth.events[1].selected.every(e=>e.reason&&e.ruleId&&e.itemRevision));
 check('Clarification preserves all Quick answers',JSON.stringify(clarified.session.responses.slice(0,quickSaved.session.responses.length))===JSON.stringify(quickSaved.session.responses));
 await page.locator('#depth-next-standard').click();await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
 await completeStage(page,121);
 const standardSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('Quick to Standard adds only missing items and retains one administration',standardSaved.depth.currentRouteId==='standard'&&standardSaved.session.sessionId===quickSaved.session.sessionId&&new Set(standardSaved.packet.entries.map(e=>e.itemId)).size===standardSaved.packet.size);
 check('Standard retains Quick answers',JSON.stringify(standardSaved.session.responses.slice(0,quickSaved.session.responses.length))===JSON.stringify(quickSaved.session.responses));
 await page.reload();await page.waitForSelector('body[data-ready="true"]');await page.locator('#resume').click();await page.locator('#results').waitFor({state:'visible'});
 check('Adaptive stage and policy history survive reload',await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.depth.events.length)===3);
 await page.locator('#depth-next-full').click();await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
 await completeStage(page,249);
 const deepSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('Progressive Full reuses all frozen pilot items without duplicates',deepSaved.packet.size===249&&new Set(deepSaved.packet.entries.map(e=>e.itemId)).size===249&&deepSaved.depth.currentRouteId==='full');
 check('Progressive Full keeps historical checkpoints and is not mistaken for a fresh research pilot',deepSaved.depth.checkpoints.length===4&&!(await page.locator('#research-section').isVisible()));
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
 await fullPage.goto(base+'/');await fullPage.waitForSelector('body[data-ready="true"]');
 const initialLoadMs=await fullPage.evaluate(()=>Math.round(performance.getEntriesByType('navigation')[0]?.loadEventEnd??0));
 await fullPage.screenshot({path:'artifacts/quiz/full-route-landing-mobile.png',fullPage:true});
 await fullPage.locator('.route[data-size="249"]').click();await fullPage.locator('#quiz').waitFor({state:'visible'});await fullPage.locator('#auto').uncheck();
 check('Pilot route begins at question 1 of 249',/Question 1 of 249/.test(await fullPage.locator('#position').innerText()));
 await fullPage.screenshot({path:'artifacts/quiz/full-route-question-mobile.png',fullPage:true});
 let fullSteps=0;const fullScales=new Set(),transitionMs=[];let resultGenerationMs=null;
 while(await fullPage.locator('#quiz').isVisible()){
 assert.ok(fullSteps++<249,'Pilot browser loop must terminate');
  const currentId=await fullPage.locator('#quiz').getAttribute('data-item-id');
  if(['PLI126','PLI127'].includes(currentId)){
   check(currentId+' federal discriminator fits the mobile questionnaire',await fullPage.evaluate(()=>
    document.documentElement.scrollWidth<=innerWidth)&&await fullPage.locator('#answer-options .answer').count()===4);
   await fullPage.screenshot({path:'artifacts/quiz/'+currentId+'-mobile.png',fullPage:true});
  }
  if(currentId==='NEI122'){
   check('Act-versus-rule discriminator fits the mobile questionnaire',
    await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&
    await fullPage.locator('#answer-options .answer').count()===4&&
    /what ultimately determines/i.test(await fullPage.locator('#question-title').innerText()));
   await fullPage.screenshot({path:'artifacts/quiz/NEI122-mobile.png',fullPage:true});
  }
  if(currentId==='NEI123'){
   check('Rule-justification discriminator fits the mobile questionnaire',
    await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&
    await fullPage.locator('#answer-options .answer').count()===4&&
    /what ultimately justifies/i.test(await fullPage.locator('#question-title').innerText()));
   await fullPage.screenshot({path:'artifacts/quiz/NEI123-mobile.png',fullPage:true});
  }
  if(currentId==='AHI108'){
   check('Free-will compatibility case fits mobile and preserves an open answer',
    await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&
    await fullPage.locator('#answer-options .answer').count()===3&&
    /complete earlier state/i.test(await fullPage.locator('#question-title').innerText())&&
    /do not settle/i.test(await fullPage.locator('#answer-options').innerText()));
  }
  if(currentId==='EPI122'){
   check('Revelation warrant discriminator fits mobile and separates inquiry from factual reason',
    await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&
    await fullPage.locator('#answer-options .answer').count()===3&&
    /for that person/i.test(await fullPage.locator('#question-title').innerText())&&
    /prompt investigation/i.test(await fullPage.locator('#answer-options').innerText()));
  }
  if(currentId==='EPI123'){
   check('Pragmatic-maxim discriminator fits mobile and distinguishes a remaining conceptual difference',
    await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&
    await fullPage.locator('#answer-options .answer').count()===3&&
    /no conceivable experience or action/i.test(await fullPage.locator('#question-title').innerText())&&
    /do not settle whether the claims differ/i.test(await fullPage.locator('#answer-options').innerText()));
  }
  const scale=await fullPage.locator('#quiz').getAttribute('data-scale');fullScales.add(scale);
  if(scale==='ranking_all'){
   const selects=fullPage.locator('#answer-options select');
   for(let n=0;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
   await fullPage.locator('#confirm-ranking').click();
  }else await fullPage.locator('#answer-options .answer').first().click();
  const transitionStart=performance.now();await fullPage.locator('#next').click();
  const transitionElapsed=Math.round(performance.now()-transitionStart);
  if(await fullPage.locator('#results').isVisible())resultGenerationMs=transitionElapsed;else transitionMs.push(transitionElapsed);
  if(fullSteps===120&&await fullPage.locator('#quiz').isVisible()){
   const id=await fullPage.locator('#quiz').getAttribute('data-item-id');
   const before=await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.responses);
   await fullPage.locator('#pause').click();await fullPage.reload();await fullPage.waitForSelector('body[data-ready="true"]');await fullPage.locator('#resume').click();
   await fullPage.locator('#quiz').waitFor({state:'visible'});await fullPage.locator('#auto').uncheck();
   check('249 route resumes at the same mid-quiz item',await fullPage.locator('#quiz').getAttribute('data-item-id')===id);
   assert.deepEqual(await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session.responses),before);
   await fullPage.locator('#back').click();await fullPage.locator('#next').click();
   check('Full-route Back/Next preserves answers and restores position',await fullPage.locator('#quiz').getAttribute('data-item-id')===id);
  }
 }
 await fullPage.locator('#results').waitFor({state:'visible'});
 const fullSaved=await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz);
 check('Completed pilot backup pins the affinity catalog version',fullSaved.affinityCatalogVersion===affinityCatalog.catalogVersion);
 check('249 unique assigned items survive the pilot browser flow',fullSaved.packet.size===249&&new Set(fullSaved.packet.entries.map(e=>e.itemId)).size===249);
 check('Full administers the direct pragmatic-method pair without the superseded pair',
  ['EPI103','EPI123'].every(id=>fullSaved.packet.entries.some(entry=>entry.itemId===id))&&
  !fullSaved.packet.entries.some(entry=>['EPI104','EPI105'].includes(entry.itemId)));
 check('Full preserves the welfare-only outcome-value pair and exact revisions',
  fullSaved.packet.entries.some(entry=>entry.itemId==='NEI124'&&entry.itemRevision===2)&&
  fullSaved.packet.entries.some(entry=>entry.itemId==='NEI132'&&entry.itemRevision===1));
 check('Full preserves the total-well-being act criterion pair at reviewed revisions',
  fullSaved.packet.entries.some(entry=>entry.itemId==='NEI133'&&entry.itemRevision===1)&&
  fullSaved.packet.entries.some(entry=>entry.itemId==='NEI125'&&entry.itemRevision===2));
 check('All pilot positions are answered or legitimately branch-skipped',fullSaved.session.responses.length+fullSaved.session.presentedItems.filter(e=>e.skippedByBranch).length===249);
 check('Pilot results cover twelve panels and meaningful subfacets',await fullPage.locator('#domain-map .domain').count()===12&&await fullPage.locator('[data-facet-id]').count()>=31);
 check('Full results expose the scoped moral truth-claim rule without assigning a school',
  await fullPage.locator('#domain-map .pattern[data-commitment-id="reviewed-ME06-literal-truth-claim"]').count()===1&&
  !(await fullPage.locator('#affinity-section').innerText()).includes('Moral realist identity'));
 check('Full route exercised all seven response scales',fullScales.size===7);
 check('Full route has a distinct instrument and saved policy',fullSaved.session.instrumentVersion===fullPolicy.instrumentVersion&&fullSaved.packet.formPolicyVersion===fullPolicy.policyVersion);
 check('249 route never posts answers and has no browser errors',fullPosts===0&&fullErrors.length===0);
 check('Pilot research contribution is opt-in and initially unchecked',await fullPage.locator('#research-section').isVisible()&&!(await fullPage.locator('#research-optin').isChecked())&&await fullPage.locator('#research-submit').isDisabled());
 check('Pilot results expose overview and unmeasured content',await fullPage.locator('#overview-section').isVisible()&&await fullPage.locator('#unmeasured-section').isVisible());
 check('Overview does not call unreviewed answer patterns established commitments',
  await fullPage.locator('#overview-title').textContent()==='Selected answer patterns'&&
  /rule-linked supporting source claim/.test(await fullPage.locator('#overview-section > p').innerText())&&
  !(await fullPage.locator('#overview-section').innerText()).includes('Clearly evidenced commitments'));
 check('Pilot affinity section renders every scoped catalog comparison',await fullPage.locator('#affinity-section').isVisible()&&
  await fullPage.locator('[data-tradition-id]').count()===affinityCatalog.traditions.length);
 const legacyTraditions=['stirnerian-ownness',
  'philosophical-anarchism','objectivism-rand','ontological-naturalism'];
 check('Scope-only defining mappings cannot present a close doctrinal match',
  (await Promise.all(legacyTraditions.map(async id=>
   (await fullPage.locator(`[data-tradition-id="${id}"] .affinity-state`).textContent())
    .includes('Doctrinal affinity unresolved')))).every(Boolean));
 check('Narrow ethical-egoism criterion is no longer a scope-only placeholder',
  !(await fullPage.locator('[data-tradition-id="ethical-egoism"] .affinity-state').textContent())
   .includes('Doctrinal affinity unresolved'));
 check('Scoped Pragmatism criterion is no longer a scope-only placeholder',
  !(await fullPage.locator('[data-tradition-id="pragmatism"] .affinity-state').textContent())
   .includes('Doctrinal affinity unresolved'));
 const sacredDomain=fullPage.locator('#domain-map .domain').filter({has:
  fullPage.locator('.pattern[data-commitment-id="ph-sacred-value"]')}).first();
 await sacredDomain.locator('details > summary').first().click();
 const sacredRow=sacredDomain.locator('.pattern[data-commitment-id="ph-sacred-value"]').first();
 check('Sacred-status result states its narrower tradeoff scope before opening evidence',
  (await sacredRow.innerText()).includes('some moral weight in a community-object tradeoff')&&
  !(await sacredRow.innerText()).includes('Provisional authored scope'));
 check('Directional scope-only direct results use authored-pattern wording',await fullPage.locator('#domain-map .pattern').evaluateAll(nodes=>
  nodes.filter(node=>node.querySelector(':scope > p.small')?.textContent?.includes('Provisional authored scope')&&
   ['supported','opposed','leaned_toward','mixed_context_dependent'].includes(node.dataset.state))
   .some(node=>node.querySelector(':scope > .state')?.textContent?.includes('inherited rule scope under the authored rule'))));
 await sacredRow.locator('details > summary').first().click();
 check('Sacred-status sources distinguish philosophical claim from context-limited study',
  (await sacredRow.innerText()).includes('Rule-linked source claim (supports):')&&
  (await sacredRow.innerText()).includes('Rule-linked source claim (context):')&&
  (await sacredRow.innerText()).includes('This source does not validate this questionnaire.'));
 check('Sacred-status details state the exact proposition and connect answer to evidence meaning',
  (await sacredRow.innerText()).includes('Proposition considered: In the stated community-object')&&
  (await sacredRow.innerText()).includes('This result does not imply:')&&
  (await sacredRow.innerText()).includes('Your response:')&&
  (await sacredRow.innerText()).includes('Evidence meaning:'));
 check('Directional exact direct propositions flag missing supporting source linkage',await fullPage.locator('#domain-map .pattern').evaluateAll(nodes=>
  nodes.filter(node=>!node.querySelector(':scope > p.small')?.textContent?.includes('Provisional authored scope')&&
   ['supported','opposed','leaned_toward','mixed_context_dependent'].includes(node.dataset.state))
   .some(node=>node.querySelector(':scope > .state')?.textContent?.includes('supporting source link under review'))));
 const derivedRow=sacredDomain.locator('.pattern[data-commitment-id="derived-RC11-agentic-divine-outlook"]');
 await derivedRow.locator('details > summary').first().click();
 check('Derived result names its direct propositions and observed states',
  (await derivedRow.innerText()).includes('This conclusion uses these direct propositions:')&&
  (await derivedRow.innerText()).includes('Some divine reality probably exists')&&
  (await derivedRow.innerText()).includes('observed:'));
 await derivedRow.locator('details details > summary').first().click();
 check('Derived details distinguish the frozen engine state from current presentation review',
  (await derivedRow.innerText()).includes('Historical authored engine state:')&&
  (await derivedRow.innerText()).includes('Prerequisites without an approved exact public proposition: divine-existence.'));
 const pragmatism=fullPage.locator('.affinity[data-tradition-id="pragmatism"]');
 if(!await pragmatism.isVisible())await fullPage.locator('#affinity-other > summary').click();
 await pragmatism.locator('details > summary').first().click();
 check('Affinity criteria show doctrine-to-proposition mappings and unmeasured doctrine',
  (await pragmatism.innerText()).includes('Interpreted proposition: Disputed ideas should be clarified')&&
  (await pragmatism.innerText()).includes('Pilot mapping: direct')&&
  (await pragmatism.innerText()).includes('No pilot proposition currently measures this doctrine.'));
 check('A doctrinal criterion exposes its own academic and primary sources',
  await pragmatism.locator('.affinity-criterion').first().locator('a').count()===2&&
  (await pragmatism.locator('.affinity-criterion').first().innerText()).includes('Criterion sources:'));
 const pragmaticMaxim=pragmatism.locator('.affinity-criterion').filter({hasText:'Disputed ideas should be clarified'});
 const inquiryFallibilism=pragmatism.locator('.affinity-criterion').filter({hasText:'Inquiry can yield knowledge'});
 const inquiryPractice=pragmatism.locator('.affinity-criterion').filter({hasText:'Inquiry is an ongoing practice'});
 check('Mapped affinity criteria disclose their distinct proposition review states',
  (await pragmaticMaxim.innerText()).includes('Interpreted proposition: Disputed ideas should be clarified')&&
  !(await pragmaticMaxim.innerText()).includes('lacks a rule-linked supporting academic claim.')&&
  (await inquiryFallibilism.innerText()).includes('Interpreted proposition: A claim can count as knowledge')&&
  !(await inquiryFallibilism.innerText()).includes('lacks a rule-linked supporting academic claim.')&&
  (await inquiryPractice.innerText()).includes('lacks a rule-linked supporting academic claim.'));
 const pragmaticDomain=fullPage.locator('#domain-map .domain').filter({has:
  fullPage.locator('.pattern[data-commitment-id="construct-EP16"]')}).first();
 await pragmaticDomain.locator('details > summary').first().click();
 const pragmaticRow=pragmaticDomain.locator('.pattern[data-commitment-id="construct-EP16"]');
 await pragmaticRow.locator('details > summary').first().click();
 check('Pragmatic-maxim evidence exposes its scoped supporting claim',
  (await pragmaticRow.innerText()).includes('Rule-linked source claim (supports):')&&
  (await pragmaticRow.innerText()).includes('conceivable experiential or practical bearings'));
 await checkAccessibility(fullPage,'Pilot results and affinity');
 check('Affinity display identifies its frozen catalog and avoids identity language',(await fullPage.locator('#affinity-version').innerText()).includes(affinityCatalog.catalogVersion)&&!(await fullPage.locator('#affinity-section').innerText()).includes('You are a '));
 check('Pilot results have no invented percentage',!/(?:^|\s)\d{1,3}%\b/.test(await fullPage.locator('#results').innerText()));
 check('Full results do not misdescribe this as an old random sample',!(await fullPage.locator('#coverage-notice').innerText()).includes('historical sample'));
 check('Full-route mobile results have no horizontal overflow',await fullPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 transitionMs.sort((a,b)=>a-b);
 console.log('Local browser timing (synthetic, not a service SLO):',JSON.stringify({initialLoadMs,questionTransitionMedianMs:transitionMs[Math.floor(transitionMs.length/2)],questionTransitionP95Ms:transitionMs[Math.floor(transitionMs.length*.95)],resultGenerationMs}));
 await fullPage.screenshot({path:'artifacts/quiz/full-route-results-mobile.png',fullPage:true});
 let severedResponse=false;
 await fullPage.route('**/api/research/contributions',async route=>{
  if(route.request().method()==='POST'&&!severedResponse){severedResponse=true;await route.fetch();await route.abort('failed');}
  else await route.continue();
 });
 await fullPage.locator('#research-optin').check();await fullPage.locator('#research-submit').click();
 await fullPage.waitForFunction(()=>document.querySelector('#research-status')?.textContent?.includes('unconfirmed'));
 check('Lost contribution response keeps a private retry receipt',severedResponse&&(await researchStore.active()).length===1&&await fullPage.locator('#research-receipt-list button').count()===2);
 await fullPage.locator('#research-submit').click();
 await fullPage.waitForFunction(()=>document.querySelector('#research-status')?.textContent?.includes('Contribution received'));
 check('Retry confirms one existing contribution without duplicating it',(await researchStore.active()).length===1);
 await fullPage.unroute('**/api/research/contributions');
 check('Explicit action and retry produce one research contribution',fullPosts===2&&(await researchStore.active()).length===1);
 check('Withdrawal receipt is shown',await fullPage.locator('#research-receipt').isVisible()&&/withdrawalToken/.test(await fullPage.locator('#research-receipt-text').inputValue()));
 await fullPage.locator('#research-withdraw').click();
 await fullPage.waitForFunction(()=>document.querySelector('#research-status')?.textContent?.includes('withdrawn'));
 check('Withdrawal removes response record',!(await researchStore.active()).length);
 const fullDownloadEvent=fullPage.waitForEvent('download');await fullPage.locator('#result-answers').click();const fullDownload=await fullDownloadEvent;
 const fullStream=await fullDownload.createReadStream(),fullChunks=[];for await(const chunk of fullStream)fullChunks.push(chunk);
 assert.deepEqual(JSON.parse(Buffer.concat(fullChunks).toString()),fullSaved.session);
 check('Full 249-session export exactly preserves raw responses',true);
 await fullPage.reload();await fullPage.waitForSelector('body[data-ready="true"]');await fullPage.locator('#resume').click();await fullPage.locator('#results').waitFor({state:'visible'});
 assert.deepEqual(await fullPage.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session),fullSaved.session);
 check('Completed full-route backup reopens without changing answers',true);
 const replayContext=await browser.newContext();const replayPage=await replayContext.newPage();
 await replayPage.addInitScript(saved=>{saved.quiz.affinityCatalogVersion='unavailable-future-catalog';localStorage.setItem('worldview-sorter:quiz-experience:1',JSON.stringify(saved));},{experienceVersion:'quiz-1.5.0',quiz:fullSaved});
 await replayPage.goto(base+'/');await replayPage.waitForSelector('body[data-ready="true"]');await replayPage.locator('#resume').click();
 check('Unavailable historical affinity catalog fails closed without deleting backup',/saved affinity catalog release is unavailable/.test(await replayPage.locator('#message').innerText())&&await replayPage.evaluate(()=>Boolean(localStorage.getItem('worldview-sorter:quiz-experience:1'))));
 await replayContext.close();
 await fullPage.evaluate(()=>{window.originalReceiptSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='worldview-sorter:research-receipts:1')throw new DOMException('blocked','QuotaExceededError');return window.originalReceiptSetItem.call(this,key,value);};});
 await fullPage.locator('#research-optin').check();await fullPage.locator('#research-submit').click();
 check('Research submission stops when its withdrawal receipt cannot be saved',(await researchStore.active()).length===0&&fullPosts===2&&/not sent/.test(await fullPage.locator('#research-status').innerText()));
 await fullPage.evaluate(()=>{Storage.prototype.setItem=window.originalReceiptSetItem;delete window.originalReceiptSetItem;});
 await fullPage.locator('#research-submit').click();
 await fullPage.waitForFunction(()=>document.querySelector('#research-status')?.textContent?.includes('Contribution received'));
 await fullPage.locator('#restart').click();fullPage.once('dialog',dialog=>dialog.accept());await fullPage.locator('.route[data-size="64"]').click();
 await fullPage.locator('#pause').click();
 check('Research receipt remains accessible after a retake',await fullPage.locator('#privacy-controls').isVisible()&&await fullPage.locator('#research-receipt-list button').count()===2);
 await fullPage.locator('#research-receipt-list button').last().click();
 await fullPage.waitForFunction(()=>document.querySelector('#message')?.textContent?.includes('Contribution withdrawn'));
 check('Prior research contribution can be withdrawn after retake',!(await researchStore.active()).length);
 await fullContext.close();
 const tabContext=await browser.newContext();const tabA=await tabContext.newPage();await tabA.goto(base+'/');
 await tabA.waitForSelector('body[data-ready="true"]');await tabA.locator('.route[data-size="64"]').click();
 const tabB=await tabContext.newPage();await tabB.goto(base+'/');await tabB.waitForSelector('body[data-ready="true"]');
 await tabB.locator('#resume').click();await tabB.locator('#quiz').waitFor({state:'visible'});
 await tabB.locator('#auto').uncheck();
 await tabB.locator('#special-options button').nth(1).click();
 await tabA.waitForFunction(()=>document.querySelector('#message')?.textContent?.includes('Another tab changed'));
 const ownerSave=await tabB.evaluate(()=>localStorage.getItem('worldview-sorter:quiz-experience:1'));
 await tabA.locator('#special-options button').first().click();
 check('Stale quiz tab cannot overwrite a newer local save',await tabB.evaluate(()=>localStorage.getItem('worldview-sorter:quiz-experience:1'))===ownerSave);
 await tabB.locator('#special-options button').first().click();
 check('Current quiz tab continues saving after a conflict elsewhere',await tabB.evaluate(()=>localStorage.getItem('worldview-sorter:quiz-experience:1'))!==ownerSave);
 await tabB.locator('#pause').click();tabB.once('dialog',dialog=>dialog.accept());await tabB.locator('#discard').click();
 check('Deleting the browser save removes the stored quiz',await tabB.evaluate(()=>localStorage.getItem('worldview-sorter:quiz-experience:1')===null));
 await tabContext.close();
 const blocked=await browser.newContext();const fallback=await blocked.newPage();
 await fallback.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError');};});
 await fallback.goto(base+'/');await fallback.waitForSelector('body[data-ready="true"]');await fallback.locator('.route[data-size="64"]').click();await fallback.locator('#auto').uncheck();
 await fallback.locator('#special-options button[data-state="no_view"]').click();
 check('Storage failure is visible, not false autosave',/unavailable/.test(await fallback.locator('#message').innerText()));
 await fallback.locator('#next').click();check('Quiz remains usable without storage',await fallback.locator('#quiz').isVisible());
 await blocked.close();
 console.log('Actual Chromium experience checks passed: '+assertions+'; synthetic answers only.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(storePath,{recursive:true,force:true});}
