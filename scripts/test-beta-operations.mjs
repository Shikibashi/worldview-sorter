import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,stat,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuiz,restoreQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {createFileSessionStore} from '../packages/collection/store.js';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {createFeedbackStore,validateFeedback} from '../packages/beta/feedback.js';
import {selectReleaseChannel,validateReleaseChannels} from '../packages/beta/release.js';
import {loadSnapshot,readJson} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url)),current=await readJson(root,'data/current.json');
const channelIndex=await readJson(root,'data/releases/channels-current.json');
assert.deepEqual(current.releaseChannels,channelIndex.current,
 'A regenerated current.json must retain the active release-channel pointer.');
const [channels,manifest,snapshot,pilot,instrument]=await Promise.all([
 readJson(root,current.releaseChannels.path),readJson(root,current.modelRelease.path),loadSnapshot(root,current),
 readJson(root,current.pilot.path),readJson(root,current.instrument.path)]);
assert.equal(channels.configVersion,channelIndex.current.version);
validateReleaseChannels(channels,current);
const stable=selectReleaseChannel(channels,current,'stable'),beta=selectReleaseChannel(channels,current,'beta',
 {feedbackStoreAvailable:true});
assert.equal(stable.features.feedback,false);assert.equal(beta.features.feedback,true);
const staged=structuredClone(channels);staged.channels.beta.features.affinityDisplay=false;
staged.channels.beta.features.adaptiveClarification=false;
assert.equal(selectReleaseChannel(staged,current,'beta',{feedbackStoreAvailable:true}).features.affinityDisplay,false);
assert.equal(staged.channels.beta.modelReleaseVersion,beta.modelReleaseVersion,
 'Presentation flags must not silently change the pinned model release.');
assert.throws(()=>selectReleaseChannel(channels,{...current,modelRelease:{version:'missing'}},'beta'),/deployment content/);
const changed=structuredClone(channels);changed.channels.beta.modelReleaseVersion='model-release-9.0.0';
assert.throws(()=>validateReleaseChannels(changed,current),/unknown model release/);
const bundle=snapshot.localization.bundles.find(b=>b.locale==='en-US');
const quiz=createQuiz({bank:snapshot.bank,pilot,scalesDoc:snapshot.scalesDoc,formPolicy:snapshot.routes,
 seed:'beta-test',size:64,sessionId:'synthetic-beta-session',localizationBundle:bundle,
 localizationCatalogVersion:snapshot.localization.catalog.catalogVersion,
 modelReleaseVersion:manifest.releaseVersion,releaseChannel:'beta'});
assert.equal(quiz.session.releaseChannel,'beta');
assert.equal(restoreQuiz(quiz,{bank:snapshot.bank,pilot,scalesDoc:snapshot.scalesDoc,formPolicies:[snapshot.routes],
 localizationBundles:snapshot.localization.bundles,localizationCatalogs:[snapshot.localization.catalog],
 modelReleases:[manifest]}).session.releaseChannel,'beta');
const route=snapshot.routes.routes[0],itemRef=route.itemRefs[0];
const base={modelReleaseVersion:manifest.releaseVersion,administrationReleaseChannel:'beta',routeId:route.id,
 routeVersion:route.routeVersion,formPolicyVersion:snapshot.routes.policyVersion,
 instrumentVersion:snapshot.routes.instrumentVersion,modelVersion:snapshot.model.modelVersion,
 resultSemanticsVersion:snapshot.model.resultSemanticsVersion,affinityCatalogVersion:snapshot.affinity.catalogVersion,
 locale:'en-US',localizationBundleVersion:bundle.bundleVersion};
const context={releases:[{manifest,snapshot}],channel:'beta'};
const question={kind:'question',category:'wording_unclear',context:{...base,itemId:itemRef.itemId,
 itemRevision:itemRef.itemRevision},text:'Synthetic wording report.'};
const report=validateFeedback(question,context);
assert.equal(report.context.itemRevision,itemRef.itemRevision);
assert.equal(validateFeedback({...question,category:'localization_meaning'},context).category,'localization_meaning');
assert.ok(!JSON.stringify(report).includes('responses'));
assert.equal(quiz.session.responses.length,0,'Feedback cannot alter raw quiz responses.');
assert.throws(()=>validateFeedback({...question,rawAnswers:[1]},context),/Invalid feedback report/);
assert.throws(()=>validateFeedback({...question,context:{...question.context,itemRevision:999}},context),/Question is unavailable/);
assert.throws(()=>validateFeedback({...question,context:{...question.context,modelVersion:'wrong'}},context),/version tuple/);
assert.throws(()=>validateFeedback({...question,context:{...question.context,answerValue:5}},context),/Invalid feedback context/);
const result=validateFeedback({kind:'result',category:'unsupported_inference',context:{...base,
 propositionId:snapshot.model.publicRuleIds[0]},text:''},context);
assert.equal(result.kind,'result');
const product=validateFeedback({kind:'product',category:'accessibility',context:{modelReleaseVersion:manifest.releaseVersion,
 location:'question',administrationReleaseChannel:'beta'},text:'Keyboard focus was lost.'},context);
assert.equal(product.category,'accessibility');
const temp=await mkdtemp(path.join(os.tmpdir(),'worldview-beta-'));
try{
 const fixtureDirectory=path.join(temp,'synthetic-fixtures');await mkdir(fixtureDirectory);
 const complete=structuredClone(quiz);seekQuestion(complete,snapshot.bank);
 while(complete.index!==null){const item=currentItem(complete,snapshot.bank);
  answerQuestion(complete,snapshot.bank,snapshot.scalesDoc,{state:item.specialStates.includes('no_view')?'no_view':'not_understood',value:null});
  nextQuestion(complete,snapshot.bank);}
 await writeFile(path.join(fixtureDirectory,'mostly-uncertain.json'),JSON.stringify({quiz:complete}));
 const comparison=spawnSync(process.execPath,['scripts/compare-beta-release.mjs','--stable',current.modelRelease.path,
  '--beta',current.modelRelease.path,'--fixtures',fixtureDirectory],{cwd:root,encoding:'utf8'});
 assert.equal(comparison.status,0,comparison.stderr);
 assert.deepEqual(JSON.parse(comparison.stdout).results[0].propositionChanges,[]);
 const evidence=spawnSync(process.execPath,['scripts/review-result-complaint.mjs','--session',
  path.join(fixtureDirectory,'mostly-uncertain.json'),'--target','proposition:'+snapshot.model.publicRuleIds[0]],
  {cwd:root,encoding:'utf8'});
 assert.equal(evidence.status,0,evidence.stderr);
 assert.equal(JSON.parse(evidence.stdout).administration.modelReleaseVersion,manifest.releaseVersion);
 const localization=spawnSync(process.execPath,['scripts/review-localization.mjs','--item',itemRef.itemId,
  '--locale','en-US','--manifest',current.modelRelease.path],{cwd:root,encoding:'utf8'});
 assert.equal(localization.status,0,localization.stderr);
 assert.equal(JSON.parse(localization.stdout).canonical.itemRevision,itemRef.itemRevision);
 const feedbackStore=createFeedbackStore({directory:path.join(temp,'feedback')});
 await feedbackStore.save(report);await feedbackStore.save(product);
 assert.equal((await feedbackStore.list()).length,2);
 assert.equal((await stat(path.join(temp,'feedback','reports',report.feedbackId+'.json'))).mode&0o777,0o600);
 assert.equal((await feedbackStore.getReview(report.feedbackId)).status,'new');
 await feedbackStore.review({id:report.feedbackId,status:'triaged',triageClass:'wording_comprehension',
  severity:'medium',note:'Check canonical wording and nearby views.'});
 await feedbackStore.review({id:report.feedbackId,status:'review_candidate',triageClass:'wording_comprehension',
  severity:'medium',note:'Requires editorial consideration.'});
 await assert.rejects(()=>feedbackStore.review({id:report.feedbackId,status:'proposal_opened',
  triageClass:'wording_comprehension',severity:'medium',note:'No proposal yet.'}),/Proposal link required/);
 const reviewed=await feedbackStore.getReview(report.feedbackId);
 assert.equal(reviewed.status,'review_candidate');assert.equal(reviewed.history.length,2);
 const logFile=path.join(temp,'events.jsonl');
 await writeFile(logFile,[{event:'server_request_failed',status:500},
  {event:'product_route_event',productEvent:'route_started',routeId:'quick'},
  {event:'product_route_event',productEvent:'clarification_requested',routeId:'quick'}]
  .map(row=>JSON.stringify(row)).join('\n')+'\n');
 const health=spawnSync(process.execPath,['scripts/beta-health.mjs','--log',logFile,
  '--store',path.join(temp,'feedback')],{cwd:root,encoding:'utf8'});
 assert.equal(health.status,0,health.stderr);
 assert.equal(JSON.parse(health.stdout).operationalFailures.server_request_failed,1);
 assert.equal(JSON.parse(health.stdout).unresolvedHighSeverity,0);
 const hotspots=spawnSync(process.execPath,['scripts/beta-feedback.mjs','hotspots','--store',
  path.join(temp,'feedback')],{cwd:root,encoding:'utf8'});
 assert.equal(hotspots.status,0,hotspots.stderr);
 assert.equal(JSON.parse(hotspots.stdout).hotspots.length,2);
 const server=createCollectionHttpServer({repoRoot:root,bank:snapshot.bank,pilot,instrument,
  scalesDoc:snapshot.scalesDoc,store:createFileSessionStore({directory:path.join(temp,'legacy')}),
  releaseChannel:beta,feedbackStore,feedbackReleases:context.releases});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const baseUrl='http://127.0.0.1:'+server.address().port;
  const config=await (await fetch(baseUrl+'/api/beta/config')).json();
  assert.equal(config.channel,'beta');assert.equal(config.modelReleaseVersion,manifest.releaseVersion);
  assert.equal(config.features.feedback,true);
  const send=body=>fetch(baseUrl+'/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await send(question)).status,201);
  assert.equal((await send({...question,sessionId:'private'})).status,400);
  assert.equal((await send({kind:'product',category:'accessibility',context:product.context,text:'Synthetic accessibility report.'})).status,201);
  assert.equal((await fetch(baseUrl+'/.data/beta-feedback/reports/'+report.feedbackId+'.json')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
 const disabled=createCollectionHttpServer({repoRoot:root,bank:snapshot.bank,pilot,instrument,
  scalesDoc:snapshot.scalesDoc,store:createFileSessionStore({directory:path.join(temp,'legacy-disabled')}),
  releaseChannel:stable,feedbackStore:null,feedbackReleases:context.releases});
 await new Promise(resolve=>disabled.listen(0,'127.0.0.1',resolve));
 try{const response=await fetch('http://127.0.0.1:'+disabled.address().port+'/api/feedback',
  {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(question)});
  assert.equal(response.status,404);}finally{await new Promise(resolve=>disabled.close(resolve));}
}finally{await rm(temp,{recursive:true,force:true});}
console.log('Beta operations regressions passed: channel pinning, feedback privacy/versioning, triage, and HTTP gating.');
