import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {createFileSessionStore} from '../packages/collection/store.js';
import {createFeedbackStore} from '../packages/beta/feedback.js';
import {selectReleaseChannel} from '../packages/beta/release.js';
import {loadSnapshot,readJson} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url)),current=await readJson(root,'data/current.json');
const [snapshot,manifest,pilot,instrument,channels]=await Promise.all([loadSnapshot(root,current),
 readJson(root,current.modelRelease.path),readJson(root,current.pilot.path),readJson(root,current.instrument.path),
 readJson(root,current.releaseChannels?.path??'data/releases/channels-v1.json')]);
const temp=await mkdtemp(path.join(os.tmpdir(),'worldview-beta-browser-'));
const feedbackStore=createFeedbackStore({directory:path.join(temp,'feedback')});
const server=createCollectionHttpServer({repoRoot:root,bank:snapshot.bank,pilot,instrument,
 scalesDoc:snapshot.scalesDoc,store:createFileSessionStore({directory:path.join(temp,'legacy')}),
 releaseChannel:selectReleaseChannel(channels,current,'beta',{feedbackStoreAvailable:true}),
 feedbackStore,feedbackReleases:[{manifest,snapshot}]});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?
  {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});
 const browserContext=await browser.newContext({viewport:{width:390,height:844}});
 const page=await browserContext.newPage(),posts=[];
 page.on('pageerror',error=>console.error('Beta browser page error:',error.message));
 page.on('request',request=>{if(request.url().endsWith('/api/feedback'))posts.push(JSON.parse(request.postData()));});
 await page.goto('http://127.0.0.1:'+server.address().port+'/apps/quiz/');
 await page.waitForSelector('body[data-ready="true"],#failure:not([hidden])');
 assert.equal(await page.locator('#failure').isVisible(),false,await page.locator('#failure-message').textContent());
 assert.equal(await page.locator('#product-feedback').isVisible(),true);
 await page.locator('#product-feedback summary').click();
 const checkAxe=async()=>{const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  assert.deepEqual(report.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);};
 await checkAxe();
 await page.locator('#product-feedback-category').selectOption('accessibility');
 await page.locator('#product-feedback-text').fill('Synthetic keyboard report.');
 await page.locator('#product-feedback-send').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('#product-feedback-status')?.textContent.includes('saved for review'));
 assert.equal(posts[0].kind,'product');assert.equal(posts[0].context.location,'home');
 await page.locator('.route[data-size="64"]').click();
 await page.locator('#auto').uncheck();
 await page.locator('#question-feedback summary').click();
 await page.locator('#question-feedback-category').selectOption('missing_answer_option');
 await page.locator('#question-feedback-send').click();
 await page.waitForFunction(()=>document.querySelector('#question-feedback-status')?.textContent.includes('saved for review'));
 assert.equal(posts[1].kind,'question');assert.equal(posts[1].context.itemRevision,
  snapshot.bank.items.find(i=>i.id===posts[1].context.itemId).revision);
 assert.equal(posts[1].context.routeId,'quick');
 assert.ok(!JSON.stringify(posts).includes('responses'));
 await checkAxe();
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 let steps=0;
 while(await page.locator('#quiz').isVisible()){
  assert.ok(steps++<70,'Quick route must terminate.');
  if(await page.locator('#quiz').getAttribute('data-scale')==='ranking_all'){
   const selectors=page.locator('#answer-options select');
   for(let n=0;n<await selectors.count();n++)await selectors.nth(n).selectOption(String(n+1));
   await page.locator('#confirm-ranking').click();
  }else await page.locator('#answer-options .answer').first().click();
  if(await page.locator('#quiz').isVisible())await page.locator('#next').click();
 }
 await page.locator('#results').waitFor({state:'visible'});
 assert.equal(await page.locator('#result-feedback').isVisible(),true);
 await page.locator('#result-feedback summary').click();
 await page.locator('#result-feedback-category').selectOption('evidence_mismatch');
 await page.locator('#result-feedback-send').click();
 await page.waitForFunction(()=>document.querySelector('#result-feedback-status')?.textContent.includes('saved for review'));
 assert.equal(posts[2].kind,'result');assert.ok(posts[2].context.propositionId||posts[2].context.traditionId);
 assert.ok(!posts.some(p=>Object.hasOwn(p,'quiz')||Object.hasOwn(p,'sessionId')||Object.hasOwn(p,'rawAnswers')));
 await checkAxe();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal((await feedbackStore.list()).length,3);
 const failedPage=await browserContext.newPage(),failurePosts=[];
 failedPage.on('request',request=>{if(request.url().endsWith('/api/feedback'))failurePosts.push(JSON.parse(request.postData()));});
 await failedPage.route('**/data/current.json',route=>route.abort());
 await failedPage.goto('http://127.0.0.1:'+server.address().port+'/apps/quiz/');
 await failedPage.locator('#failure').waitFor({state:'visible'});
 assert.equal(await failedPage.locator('#product-feedback').isVisible(),true);
 await failedPage.locator('#product-feedback summary').click();
 await failedPage.locator('#product-feedback-category').selectOption('technical_error');
 await failedPage.locator('#product-feedback-send').click();
 await failedPage.waitForFunction(()=>document.querySelector('#product-feedback-status')?.textContent.includes('saved for review'));
 assert.equal(failurePosts[0].context.location,'failure');
 assert.equal((await feedbackStore.list()).length,4);
 const stagedContext=await browser.newContext({viewport:{width:390,height:844}});
 const stagedPage=await stagedContext.newPage();
 await stagedPage.route('**/api/beta/config',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  schemaVersion:'worldview-beta-config-1',channel:'beta',modelReleaseVersion:manifest.releaseVersion,
  features:{adaptiveClarification:false,affinityDisplay:false,sharing:false,feedback:false}})}));
 await stagedPage.goto('http://127.0.0.1:'+server.address().port+'/apps/quiz/');
 await stagedPage.locator('body[data-ready="true"]').waitFor();
 assert.equal(await stagedPage.locator('#product-feedback').isVisible(),false);
 await stagedPage.locator('.route[data-size="64"]').click();await stagedPage.locator('#auto').uncheck();
 let stagedSteps=0;
 while(await stagedPage.locator('#quiz').isVisible()){
  assert.ok(stagedSteps++<70);
  if(await stagedPage.locator('#quiz').getAttribute('data-scale')==='ranking_all'){
   const selectors=stagedPage.locator('#answer-options select');
   for(let n=0;n<await selectors.count();n++)await selectors.nth(n).selectOption(String(n+1));
   await stagedPage.locator('#confirm-ranking').click();
  }else await stagedPage.locator('#answer-options .answer').first().click();
  if(await stagedPage.locator('#quiz').isVisible())await stagedPage.locator('#next').click();
 }
 await stagedPage.locator('#results').waitFor({state:'visible'});
 for(const selector of ['#share-open','#affinity-section','#tradition-compare-section','#depth-clarify','#result-feedback'])
  assert.equal(await stagedPage.locator(selector).isVisible(),false,selector+' must honor its presentation flag');
 console.log('Beta browser checks passed: contextual privacy, keyboard submission, failure feedback, staged flags, results, axe, mobile zoom.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
 await rm(temp,{recursive:true,force:true});}
