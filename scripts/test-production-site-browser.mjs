import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createQuiz,seekQuestion,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),site=path.join(root,'dist/pages');
const contentType={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8',
 '.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
  if(!/^[A-Za-z0-9_./-]+$/.test(name)||name.split('/').some(part=>part==='..'))throw Error('path');
  const body=await readFile(path.join(site,name));
  res.writeHead(200,{'Content-Type':contentType[path.extname(name)]??'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});
let checks=0;
const check=(description,condition)=>{assert.ok(condition,description);checks++;};
const accessible=async(page,description)=>{
 const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 if(report.violations.length)console.error(JSON.stringify(report.violations.map(({id,impact,help,nodes})=>({id,impact,help,nodes:nodes.map(node=>({target:node.target,summary:node.failureSummary}))})),null,2));
 check(description+' accessibility',report.violations.length===0);
};
async function answerCurrent(page){
 if(await page.locator('#quiz').getAttribute('data-scale')==='ranking_all'){
  const selects=page.locator('#answer-options select');
  for(let n=0;n<await selects.count();n++)await selects.nth(n).selectOption(String(n+1));
  await page.locator('#confirm-ranking').click();
 }else await page.locator('#answer-options .answer').first().click();
 await page.locator('#next').click();
}
async function runRoute(size,{pause=false,detail=false}={}){
 const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],badResponses=[],posts=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)badResponses.push(response.url()+' '+response.status());});
 page.on('request',request=>{if(request.method()==='POST')posts.push(request.url());});
 await page.goto(base+'/');await page.waitForSelector('body[data-ready="true"]');
 check('Domain root loads the public quiz',new URL(page.url()).pathname==='/');
 check('The landing flow opens the depth chooser',await page.locator('#choose-route').isVisible());
 check('Landing previews a clearly fictional result',await page.locator('.example-result').innerText().then(text=>{
  const visible=text.toLowerCase();
  return visible.includes('illustrative example with fictional answers')&&visible.includes('not measured');
 }));
 check('Static hosting exposes no research or feedback control',await page.locator('#privacy-controls').isHidden()&&
  await page.locator('#research-section').isHidden()&&await page.locator('#product-feedback').isHidden());
 if(detail)await accessible(page,'Production landing');
 await page.locator('#choose-route').click();
 await page.locator('#route-chooser').waitFor({state:'visible'});
 check('The 12Axes-style route screen exposes the three active WVS depths',await page.locator('.route[data-size]').count()===3);
 if(detail)await accessible(page,'Production route chooser');
 await page.locator(`.route[data-size="${size}"]`).click();
 await page.locator('#quiz').waitFor({state:'visible'});await page.locator('#auto').uncheck();
 check('Route selection starts at its assigned length',await page.locator('#progress-caption').innerText().then(text=>text.includes(String(size))));
 let answered=0;
 while(await page.locator('#quiz').isVisible()){
  assert.ok(answered++<size+1,'Production route did not complete.');
  await answerCurrent(page);
  if(pause&&answered===3&&await page.locator('#quiz').isVisible()){
   const item=await page.locator('#quiz').getAttribute('data-item-id');
   await page.locator('#pause').click();await page.reload();await page.waitForSelector('body[data-ready="true"]');
   await page.locator('#resume').click();await page.locator('#quiz').waitFor({state:'visible'});
   await page.locator('#auto').uncheck();
   check('Pause, refresh and resume preserve the exact item',await page.locator('#quiz').getAttribute('data-item-id')===item);
  }
 }
 await page.locator('#results').waitFor({state:'visible'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('worldview-sorter:quiz-experience:1')).quiz.session);
 check(`${size}-item route reaches results with preserved raw answers`,saved.completionStatus==='completed'&&saved.responses.length>0);
 check('Current route uses AHI108 and omits the historical alternative-possibilities item',
  saved.presentedItems.some(row=>row.itemId==='AHI108')&&
  !saved.presentedItems.some(row=>row.itemId==='AHI104'));
 check('Current route uses first-person revelation warrant instead of the audience-ambiguous item',
  saved.presentedItems.some(row=>row.itemId==='EPI122')&&
  !saved.presentedItems.some(row=>row.itemId==='EPI021'));
 check('Welfarist outcome-value questions appear only in Full at their reviewed revisions',size===249?
  saved.presentedItems.some(row=>row.itemId==='NEI124'&&row.itemRevision===2)&&
  saved.presentedItems.some(row=>row.itemId==='NEI132'&&row.itemRevision===1):
  !saved.presentedItems.some(row=>['NEI124','NEI132'].includes(row.itemId)));
 if(size===249)check('Conflicting answers remain a mixed welfarist result',
  await page.locator('[data-commitment-id="reviewed-NE24-welfarist-outcome-value"]').count()>=1&&
  await page.locator('[data-commitment-id="reviewed-NE24-welfarist-outcome-value"]').evaluateAll(nodes=>
   nodes.every(node=>node.dataset.state==='mixed_context_dependent')));
 check('Self-interest discriminator appears only on the Full route',size===249?
  saved.presentedItems.some(row=>row.itemId==='NEI121')&&
  !saved.presentedItems.some(row=>row.itemId==='NEI101'):
  !saved.presentedItems.some(row=>row.itemId==='NEI121'));
 check('Total-well-being criterion items appear only in Full at their reviewed revisions',size===249?
  saved.presentedItems.some(row=>row.itemId==='NEI133'&&row.itemRevision===1)&&
  saved.presentedItems.some(row=>row.itemId==='NEI125'&&row.itemRevision===2):
  !saved.presentedItems.some(row=>['NEI125','NEI133'].includes(row.itemId)));
 check('Production-control evidence appears only in Full at its reviewed revisions',size===249?
  saved.presentedItems.some(row=>row.itemId==='PLI060'&&row.itemRevision===2)&&
  saved.presentedItems.some(row=>row.itemId==='PLI123'&&row.itemRevision===2):
  !saved.presentedItems.some(row=>['PLI060','PLI123'].includes(row.itemId)));
 if(size===249)check('Aligned workplace and enterprise answers support only the scoped control proposition',
  await page.locator('[data-commitment-id="reviewed-PL39-democratic-social-control-production"]')
   .evaluateAll(nodes=>nodes.some(node=>node.dataset.state==='supported')));
 check('Twelve worldview domains remain navigable',await page.locator('#domain-map .domain').count()===12);
 check('Results open with an evidence-qualified overview',await page.locator('#result-at-a-glance').isVisible());
 check('Every domain has a categorical evidence strip',await page.locator('#domain-map .domain-strip').count()===12);
 check('Results do not present an ideology match percentage',!(await page.locator('#results').innerText()).match(/\d+% (?:match|compatible)/i));
 check('No automatic response submission occurs',posts.length===0);
 if(detail){
  await accessible(page,'Production results');
  check('Result section navigation remains available',await page.locator('#result-nav').evaluate(node=>getComputedStyle(node).position==='sticky'));
  await page.locator('#result-nav a[href="#domains-title"]').click();
  check('Result navigation reaches the domain map',await page.evaluate(()=>location.hash==='#domains-title'));
  const domain=page.locator('#domain-map details.domain').first();await domain.locator(':scope > summary').click();
  const source=domain.locator('.pattern details').first();if(await source.count()){
   await source.locator(':scope > summary').click();
   check('Source navigation retains secure citation links',await source.locator('a[href^="https:"]').count()>0);
  }
  const rawEvent=page.waitForEvent('download');await page.locator('#result-answers').click();
  const raw=await rawEvent;check('Raw answers can be exported',raw.suggestedFilename().endsWith('.json'));
  const summaryEvent=page.waitForEvent('download');await page.locator('#summary-save').click();
  const summary=await summaryEvent;check('Result summary can be exported',summary.suggestedFilename().endsWith('.json'));
  await page.locator('#share-open').click();await page.locator('#share-options input').first().check();
  check('Sharing preview retains uncertainty and version context',/exploratory/i.test(await page.locator('#share-preview').inputValue())&&
   (await page.locator('#share-preview').inputValue()).includes('catalog '));
  const cardEvent=page.waitForEvent('download');await page.locator('#download-share-svg').click();
  const card=await cardEvent,cardText=await readFile(await card.path(),'utf8');
  check('Social image uses a fixed portrait canvas and preserves uncertainty',cardText.includes('viewBox="0 0 1080 1350"')&&
   cardText.includes('not measured')&&!cardText.includes('PRIVATE_SESSION'));
  const cardPage=await context.newPage();await cardPage.goto('data:image/svg+xml,'+encodeURIComponent(cardText));
  check('Social image text fits its designed canvas',await cardPage.locator('text').evaluateAll(nodes=>nodes.every(node=>{
   const box=node.getBBox();return box.x>=80&&box.x+box.width<=995&&box.y>=45&&box.y+box.height<=1280;
  })));
  await cardPage.close();
  for(const format of ['domain','affinity','exploration']){
   await page.locator('#share-format').selectOption(format);
   const event=page.waitForEvent('download');await page.locator('#download-share-svg').click();
   const image=await event,xml=await readFile(await image.path(),'utf8');
   const view=await context.newPage();await view.goto('data:image/svg+xml,'+encodeURIComponent(xml));
   check(format+' image keeps text inside the card',await view.locator('text').evaluateAll(nodes=>nodes.every(node=>{
    const box=node.getBBox();return box.x>=80&&box.x+box.width<=995&&box.y>=45&&box.y+box.height<=1280;
   })));
   await view.close();
  }
  await page.setViewportSize({width:320,height:640});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  check('Mobile results fit doubled text size',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('Reduced motion is respected',await page.evaluate(()=>getComputedStyle(document.querySelector('.domain')).animationName==='none'));
  const viewer=await context.newPage();await viewer.goto(base+'/apps/quiz/share.html');
  check('Snapshot viewer loads as a public static page',await viewer.locator('h1').innerText()==='Open a selected snapshot');
  await viewer.close();
 }
 check('Production browser has no console or network errors',errors.length===0&&badResponses.length===0);
 await context.close();
}
try{
 const deployment=JSON.parse(await readFile(path.join(site,'deployment.json'),'utf8'));
 check('Deployment metadata pins a commit and model release',/^[0-9a-f]{40}$/.test(deployment.gitCommit)&&deployment.modelReleaseVersion);
 const keyboardContext=await browser.newContext(),keyboardPage=await keyboardContext.newPage();
 await keyboardPage.goto(base+'/');await keyboardPage.waitForSelector('body[data-ready="true"]');
 await keyboardPage.locator('#choose-route').focus();await keyboardPage.keyboard.press('Enter');
 await keyboardPage.locator('#route-chooser').waitFor({state:'visible'});
 await keyboardPage.locator('.route[data-size="64"]').focus();await keyboardPage.keyboard.press('Enter');
 await keyboardPage.locator('#quiz').waitFor({state:'visible'});
 await keyboardPage.locator('#auto').focus();await keyboardPage.keyboard.press('Space');
 await keyboardPage.locator('#answer-options .answer').first().focus();await keyboardPage.keyboard.press('Enter');
 check('Route and answer can be selected with the keyboard',
  await keyboardPage.locator('#answer-options .answer').first().getAttribute('aria-pressed')==='true');
 await keyboardPage.locator('#next').focus();await keyboardPage.keyboard.press('Enter');
 check('Keyboard navigation advances after an answer',await keyboardPage.locator('#position').innerText().then(text=>text.includes('Question 2 of 64')));
 await keyboardContext.close();
 await runRoute(64,{pause:true,detail:true});
 await runRoute(120);
 await runRoute(249);
 const historicalBank=JSON.parse(await readFile(path.join(root,'data/items/candidate-v0.9.json'),'utf8'));
 const historicalPilot=JSON.parse(await readFile(path.join(root,'data/pilots/pilot-0.2.json'),'utf8'));
 const historicalPolicy=JSON.parse(await readFile(path.join(root,'data/experience/progressive-depth-v1.2.json'),'utf8'));
 const historicalScales=JSON.parse(await readFile(path.join(root,'data/response-scales.json'),'utf8'));
 const historicalQuiz=createQuiz({bank:historicalBank,pilot:historicalPilot,scalesDoc:historicalScales,
  formPolicy:historicalPolicy,size:64,seed:'historical-static-browser',sessionId:'historical-static-browser',
  modelReleaseVersion:'model-release-1.4.0'});
 seekQuestion(historicalQuiz,historicalBank);
 while(historicalQuiz.index!==null){answerQuestion(historicalQuiz,historicalBank,historicalScales,{state:'no_view',value:null});nextQuestion(historicalQuiz,historicalBank);}
 historicalQuiz.affinityCatalogVersion='philosophical-affinity-1.2.0';
 const historicalContext=await browser.newContext({acceptDownloads:true}),historicalPage=await historicalContext.newPage();
 await historicalPage.addInitScript(saved=>localStorage.setItem('worldview-sorter:quiz-experience:1',JSON.stringify(saved)),
  {experienceVersion:'quiz-1.8.0',quiz:historicalQuiz});
 await historicalPage.goto(base+'/');await historicalPage.waitForSelector('body[data-ready="true"]');
 await historicalPage.locator('#resume').click();await historicalPage.locator('#results').waitFor({state:'visible'});
 check('A 1.4 saved administration loads its pinned bank and route',
  await historicalPage.locator('#result-replay-notice').isVisible()&&
  /Current reinterpretation/.test(await historicalPage.locator('#result-replay-notice').innerText()));
 check('Historical reinterpretation cannot be silently shared as the original result',
  await historicalPage.locator('#summary-save').isDisabled()&&await historicalPage.locator('#share-open').isDisabled());
 const historicalRaw=historicalPage.waitForEvent('download');await historicalPage.locator('#result-answers').click();
 check('Historical raw answers remain exportable',(await historicalRaw).suggestedFilename().endsWith('.json'));
 await historicalContext.close();
 const context=await browser.newContext(),page=await context.newPage();
 for(const target of ['/apps/server/server.mjs','/.data/sessions.json','/scripts/test-quiz-browser.mjs','/api/research/config'])
  check('Private or collector path is absent: '+target,(await page.request.get(base+target)).status()===404);
 await context.close();
 console.log(`Production static browser flow passed: ${checks} checks across Quick, Standard and Full; synthetic answers only.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
