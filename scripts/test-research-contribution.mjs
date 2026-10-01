import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {cp,mkdir,mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {createCollectionHttpServer} from '../packages/collection/http.js';
import {createResearchContributionStore,projectResearchContribution,RESEARCH_CONSENT_VERSION} from '../packages/collection/research.js';
import {researchExportEligibility} from '../packages/research/eligibility.js';
import {assessResearchReadiness,diagnoseResearchRows,historicalEngineEquality} from '../packages/research/handoff.js';
import {createFileSessionStore} from '../packages/collection/store.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const load=async name=>JSON.parse(await readFile(path.join(root,name),'utf8'));
const current=await load('data/current.json');
const [bank,pilot,instrument,scalesDoc,formPolicy,model,catalog,pilotManifest]=await Promise.all([
 load(current.candidateBank.path),load(current.pilot.path),load(current.instrument.path),load('data/response-scales.json'),
 load(current.fullForm.path),load(current.worldviewModel.path),load(current.affinityCatalog.path),load(current.pilotCandidate.path)]);
const localizationCatalog=await load(current.localizationCatalog.path);
const localizationBundles=await Promise.all(current.localizationBundles.map(ref=>load(ref.path)));
const modelReleases=await Promise.all(current.modelReleaseVersions.map(ref=>load(ref.path)));
const archivedEngine=await load(current.engineSource.path);
const replaySources=archivedEngine.files.map(file=>({sourcePath:file.sourcePath,sha256:file.sha256}));
const replayArchives=new Map([[current.modelRelease.version,archivedEngine]]);
const equalityFor=administrations=>historicalEngineEquality({administrations,engineSources:replaySources,
 releases:modelReleases,archiveManifests:replayArchives});
assert.equal(equalityFor([]),'no_included_administrations');
assert.equal(equalityFor([{modelReleaseVersion:current.modelRelease.version}]),'pinned_inference_modules_match_extraction');
assert.equal(equalityFor([{modelReleaseVersion:'model-release-1.0.0'}]),'not_proven_by_model_release_manifest');
assert.equal(equalityFor([{modelReleaseVersion:'model-release-1.0.0'},
 {modelReleaseVersion:current.modelRelease.version}]),'not_proven_by_model_release_manifest');
assert.equal(equalityFor([{modelReleaseVersion:null}]),'not_proven_by_model_release_manifest');
assert.throws(()=>equalityFor([{modelReleaseVersion:'model-release-unknown'}]),/lacks model release/);
assert.throws(()=>historicalEngineEquality({administrations:[{modelReleaseVersion:current.modelRelease.version}],
 engineSources:replaySources.map((source,index)=>index?source:{...source,sha256:'0'.repeat(64)}),
 releases:modelReleases,archiveManifests:replayArchives}),/Historical inference engine differs/);
const researchContext={formPolicy,model,catalog,pilotManifest,consent:await load('data/research/consent-v1.json'),
 localizationCatalogs:[localizationCatalog],localizationBundles,modelReleases};
const scaleMap=new Map(scalesDoc.scales.map(s=>[s.id,s]));
function attempt({complete=false,seed=randomUUID(),localized=false}={}){
 const quiz=createQuiz({bank,pilot,scalesDoc,formPolicy,seed,size:formPolicy.sizes[0],sessionId:randomUUID(),
  ...(localized?{localizationBundle:localizationBundles.find(b=>b.locale==='en-US'),localizationCatalogVersion:localizationCatalog.catalogVersion,
   modelReleaseVersion:current.modelRelease.version,releaseChannel:'beta'}:{})});
 quiz.affinityCatalogVersion=catalog.catalogVersion;seekQuestion(quiz,bank);
 const answer=()=>{const item=currentItem(quiz,bank),scale=scaleMap.get(item.responseScaleId);
  const value=item.id==='RCI001'?'none':['likert','paired_choice'].includes(item.responseType)?scale.options[0].value:item.responseType==='ranking'?item.options.map(o=>o.id):item.options[0].id;
  answerQuestion(quiz,bank,scalesDoc,{state:'answered',value});};
 answer();if(complete){while(quiz.index!==null){nextQuestion(quiz,bank);if(quiz.index!==null)answer();}}
 return quiz;
}
const body=(quiz,other={})=>({consentVersion:RESEARCH_CONSENT_VERSION,affirmed:true,quiz,...other});
const temp=await mkdtemp(path.join(os.tmpdir(),'worldview-research-test-'));
const researchStore=createResearchContributionStore({directory:path.join(temp,'research')});
const legacyStore=createFileSessionStore({directory:path.join(temp,'legacy')});
const events=[];
const server=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store:legacyStore,researchStore,researchContext,
 onEvent:event=>events.push(event)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const post=async value=>fetch(base+'/api/research/contributions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
const rows=async(dir,name)=>(await readFile(path.join(dir,name),'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
try{
 const partial=attempt(),complete=attempt({complete:true});
 const config=await fetch(base+'/api/research/config').then(r=>r.json());
 assert.equal(config.enabled,true);assert.deepEqual(config.consent,researchContext.consent);
 assert.equal((await fetch(base+'/api/pilot/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,503);
 assert.equal((await fetch(base+'/api/research/export')).status,410);
 assert.equal((await post({...body(partial),affirmed:false})).status,400);
 assert.equal((await post({...body(partial),email:'example@example.org'})).status,400);
 assert.equal((await post({...body(partial),quiz:{...partial,session:{...partial.session,ip:'127.0.0.1'}}})).status,400);
 const privateLocale=structuredClone(partial);privateLocale.session.locale='person@example.org';
 assert.equal((await post(body(privateLocale))).status,400,'Client locale must not become an arbitrary research field.');
 const privateVariant=structuredClone(partial);privateVariant.session.presentedItems[0].variantId='person@example.org';
 assert.equal((await post(body(privateVariant))).status,400,'Unlocalized variant metadata must not carry arbitrary client text.');
 const privateWording=structuredClone(partial);privateWording.session.presentedItems[0].textVersion='person@example.org';
 assert.equal((await post(body(privateWording))).status,400,'Unlocalized wording metadata must not carry arbitrary client text.');
 const bad=structuredClone(partial);bad.session.responses[0].value='fabricated';assert.equal((await post(body(bad))).status,400);
 const old=structuredClone(partial);old.packet.formPolicyVersion='older';assert.equal((await post(body(old))).status,400);
 const projected=projectResearchContribution({body:body(partial),bank,pilot,scalesDoc,...researchContext});
 const pinned=projectResearchContribution({body:body(attempt({localized:true})),bank,pilot,scalesDoc,...researchContext});
 assert.equal(pinned.localizationBundleVersion,current.localizationBundles.find(b=>b.locale==='en-US').version);
 assert.equal(pinned.modelReleaseVersion,current.modelRelease.version);
 assert.equal(pinned.releaseChannel,'beta');
 assert.ok(pinned.responses.every(r=>r.translationStatus==='approved'&&
  r.textVersion?.startsWith(current.localizationBundles.find(b=>b.locale==='en-US').version+':')));
 assert.equal(projected.responses.length,formPolicy.sizes[0]);assert.equal(projected.responses[0].responseState,'answered');
 assert.equal(projected.presentationLocale,'en-US');
 assert.equal(projected.responses[0].translationStatus,'historical_canonical_unpinned');
 assert.ok(projected.responses.some(r=>r.missingReason==='not_reached'));
 assert.ok(projected.responses.every(r=>r.rawValue===null||r.responseState==='answered'));
 assert.ok(!JSON.stringify(projected).includes(partial.session.sessionId));
 const first=await post(body(partial));assert.equal(first.status,201,await first.text());
 // Re-read is impossible after body consumption; retain a fresh receipt from the active store test below.
 assert.equal((await post(body(partial))).status,409);
 const retryQuiz=attempt(),clientReceipt={contributionId:randomUUID(),withdrawalToken:randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','')};
 const firstAttempt=await post(body(retryQuiz,clientReceipt));assert.equal(firstAttempt.status,201);
 const retryAttempt=await post(body(retryQuiz,clientReceipt));assert.equal(retryAttempt.status,200);
 assert.deepEqual(await retryAttempt.json(),{...(await firstAttempt.json()),duplicate:true});
 assert.equal((await post(body(retryQuiz,{...clientReceipt,withdrawalToken:'a'.repeat(64)}))).status,409);
 const linkId=randomUUID();
 const linked1=await post(body(complete,{linkId}));assert.equal(linked1.status,201);const receipt1=await linked1.json();
 const linked2=await post(body(attempt(),{linkId}));assert.equal(linked2.status,201);const receipt2=await linked2.json();
 let active=await researchStore.active();assert.equal(active.length,4);
 assert.equal(active.filter(r=>r.linkageOptIn).length,2);
 assert.equal(new Set(active.filter(r=>r.linkageOptIn).map(r=>r.researchRespondentId)).size,1);
 assert.ok(active.some(r=>r.responses.some(x=>x.missingReason==='branch_not_shown')));
 const racing=attempt();const raceBody=body(racing);
 const [raceA,raceB]=await Promise.all([post(raceBody),post(raceBody)]);
 assert.deepEqual([raceA.status,raceB.status].sort(),[201,409]);
 const raceReceipt=await (raceA.status===201?raceA:raceB).json();
 assert.equal((await researchStore.active()).length,5);
 assert.equal((await fetch(base+'/api/research/contributions/'+raceReceipt.contributionId,{method:'DELETE',headers:{Authorization:'Bearer '+raceReceipt.withdrawalToken}})).status,200);
 assert.equal((await fetch(base+'/api/research/contributions/'+receipt1.contributionId,{method:'DELETE',headers:{Authorization:'Bearer wrong-token-with-length'}})).status,401);
 const withdrawal=await fetch(base+'/api/research/contributions/'+receipt1.contributionId,{method:'DELETE',headers:{Authorization:'Bearer '+receipt1.withdrawalToken}});
 assert.equal(withdrawal.status,200);assert.equal((await withdrawal.json()).withdrawn,true);
 assert.equal((await researchStore.active()).length,3);
 const tombstone=JSON.parse(await readFile(path.join(researchStore.root,receipt1.contributionId+'.json'),'utf8'));
 assert.equal(tombstone.status,'withdrawn');assert.ok(!('responses' in tombstone));
 const missingStore=path.join(temp,'not-mounted-research-store');
 const missingExport=path.join(temp,'missing-store-export');
 const missingCommand=spawnSync(process.execPath,['scripts/export-research-package.mjs',
  '--store',missingStore,'--out',missingExport],{cwd:root,encoding:'utf8'});
 assert.notEqual(missingCommand.status,0,'A missing production store cannot become a zero-record export.');
 assert.match(missingCommand.stderr,/missing store is not an empty dataset/);
 await assert.rejects(stat(missingStore),{code:'ENOENT'});
 await assert.rejects(stat(missingExport),{code:'ENOENT'});
 const out=path.join(temp,'export');
 const command=spawnSync(process.execPath,['scripts/export-research-package.mjs','--store',researchStore.root,'--out',out],{cwd:root,encoding:'utf8'});
 assert.equal(command.status,0,command.stderr);
 const loaded=spawnSync(process.execPath,[path.join(out,'load-example.mjs')],{cwd:out,encoding:'utf8'});
 assert.equal(loaded.status,0,loaded.stderr);
 assert.match(loaded.stdout,new RegExp(`administrations: 3, responses: ${3*formPolicy.sizes[0]}`));
 const [respondents,administrations,responses,items,versions,manifest]=await Promise.all([
  rows(out,'respondents.ndjson'),rows(out,'administrations.ndjson'),rows(out,'responses.ndjson'),rows(out,'items.ndjson'),
  readFile(path.join(out,'versions.json'),'utf8').then(JSON.parse),readFile(path.join(out,'manifest.json'),'utf8').then(JSON.parse)]);
 assert.equal(administrations.length,3);assert.equal(responses.length,3*formPolicy.sizes[0]);assert.equal(items.length,formPolicy.sizes[0]);
 assert.equal(respondents.length,3);assert.equal(versions.instrumentVersion,formPolicy.instrumentVersion);
 assert.equal(versions.consentVersion,RESEARCH_CONSENT_VERSION);
 assert.equal(versions.datasetSchemaVersion,'research-package-1.1.0');
 assert.ok(versions.localizationCatalogVersions.includes(current.localizationCatalog.version));
 assert.ok(versions.localizationBundleVersions.includes(current.localizationBundles[0].version));
 assert.ok(administrations.every(r=>r.presentationLocale==='en-US'&&r.localizationBundleVersion===null));
 assert.ok(responses.every(r=>r.textVersion===null&&r.variantId===null&&r.translationStatus==='historical_canonical_unpinned'));
 assert.ok((await readdir(out)).some(name=>name.startsWith('localization-bundle-')));
 assert.deepEqual(JSON.parse(await readFile(path.join(out,'consent-terms.json'),'utf8')),researchContext.consent);
 assert.ok(administrations.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.contributedDate)));
 assert.equal(manifest.responseRows,responses.length);
 assert.ok(!administrations.some(r=>r.researchAdministrationId===receipt1.researchAdministrationId));
 assert.ok(responses.every(r=>r.itemRevision===items[r.position].itemRevision));
 const exportedText=(await Promise.all((await readdir(out)).filter(n=>n.endsWith('.ndjson')).map(n=>readFile(path.join(out,n),'utf8')))).join('');
 assert.ok(!exportedText.includes(partial.session.sessionId));
 assert.ok(!exportedText.includes(receipt1.withdrawalToken));
 assert.ok(!exportedText.includes('respondentKey'));
 for(const file of manifest.files)assert.equal(createHash('sha256').update(await readFile(path.join(out,file.path))).digest('hex'),file.sha256);
 assert.equal((await readFile(path.join(researchStore.root,'export-audit.ndjson'),'utf8')).trim().split('\n').length,1);
 assert.ok(events.some(e=>e.event==='research_contribution_saved'));
 assert.ok(events.some(e=>e.event==='research_contribution_withdrawn'));
 assert.ok(!JSON.stringify(events).includes('rawValue')&&!JSON.stringify(events).includes(partial.session.sessionId));
 const now=await fetch(base+'/api/research/contributions/'+receipt2.contributionId,{method:'DELETE',headers:{Authorization:'Bearer '+receipt2.withdrawalToken}});assert.equal(now.status,200);
 if(process.platform!=='win32'){
  const loose=path.join(temp,'loose');await mkdir(loose,{mode:0o755});
  await assert.rejects(createResearchContributionStore({directory:loose}).active(),/must be private/);
 }
 const last=await post(body(attempt()));assert.equal(last.status,201);const lastReceipt=await last.json();
 const disabled=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store:legacyStore,
  researchStore,researchContributionsEnabled:false});
 await new Promise(resolve=>disabled.listen(0,'127.0.0.1',resolve));
 try{const endpoint='http://127.0.0.1:'+disabled.address().port;
  assert.equal((await fetch(endpoint+'/api/research/config').then(r=>r.json())).enabled,false);
  assert.equal((await fetch(endpoint+'/api/research/contributions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body(attempt()))})).status,503);
  assert.equal((await fetch(endpoint+'/api/research/contributions/'+lastReceipt.contributionId,{method:'DELETE',headers:{Authorization:'Bearer '+lastReceipt.withdrawalToken}})).status,200);
 }finally{await new Promise(resolve=>disabled.close(resolve));}
 const limited=createCollectionHttpServer({repoRoot:root,bank,pilot,instrument,scalesDoc,store:legacyStore,researchStore,researchContext,
  maxResearchPostsPerWindow:1});
 await new Promise(resolve=>limited.listen(0,'127.0.0.1',resolve));
 try{const endpoint='http://127.0.0.1:'+limited.address().port;
  const send=()=>fetch(endpoint+'/api/research/contributions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal((await send()).status,400);
  const blocked=await send();assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
 }finally{await new Promise(resolve=>limited.close(resolve));}
 const unfinished=['.'+randomUUID()+'.creating-'+randomUUID(),randomUUID()+'.withdraw-'+randomUUID()];
 for(const name of unfinished)await writeFile(path.join(researchStore.root,name),'interrupted synthetic write',{mode:0o600});
 assert.deepEqual(await createResearchContributionStore({directory:researchStore.root}).active(),await researchStore.active());
 const afterRecovery=await readdir(researchStore.root);assert.ok(unfinished.every(name=>!afterRecovery.includes(name)));
 const backupPath=path.join(temp,'backup'),restoredPath=path.join(temp,'restored');
 const recovery=(...args)=>spawnSync(process.execPath,['scripts/research-store-recovery.mjs',...args],{cwd:root,encoding:'utf8'});
 const backup=recovery('backup','--store',researchStore.root,'--out',backupPath);
 assert.equal(backup.status,0,backup.stderr);
 const restore=recovery('restore','--backup',backupPath,'--out',restoredPath);
 assert.equal(restore.status,0,restore.stderr);
 assert.deepEqual(await createResearchContributionStore({directory:restoredPath}).active(),await researchStore.active());
 const backupRecords=(await readdir(backupPath)).filter(name=>name.endsWith('.json')&&name!=='backup-manifest.json');
 await writeFile(path.join(backupPath,backupRecords[0]),'corrupted test backup');
 assert.notEqual(recovery('restore','--backup',backupPath,'--out',path.join(temp,'invalid-restore')).status,0);
 await researchStore.save(pinned);
 const localizedOut=path.join(temp,'localized-export');
 const localizedExport=spawnSync(process.execPath,['scripts/export-research-package.mjs','--store',researchStore.root,'--out',localizedOut],{cwd:root,encoding:'utf8'});
 assert.equal(localizedExport.status,0,localizedExport.stderr);
 const localizedAdmin=(await rows(localizedOut,'administrations.ndjson')).find(r=>r.researchAdministrationId===pinned.researchAdministrationId);
 assert.equal(localizedAdmin.presentationLocale,'en-US');
 assert.equal(localizedAdmin.localizationBundleVersion,pinned.localizationBundleVersion);
 assert.equal(localizedAdmin.modelReleaseVersion,current.modelRelease.version);
 assert.equal(localizedAdmin.releaseChannel,'beta');
 const localizedResponses=(await rows(localizedOut,'responses.ndjson')).filter(r=>r.researchAdministrationId===pinned.researchAdministrationId);
 assert.ok(localizedResponses.length===formPolicy.sizes[0]&&localizedResponses.every(r=>r.textVersion&&r.translationStatus==='approved'));
 const today=new Date().toISOString().slice(0,10),snapshotOut=path.join(temp,'wvs-research-synthetic-v1');
 const exclusions=path.join(temp,'reviewed-exclusions.json');
 await writeFile(exclusions,JSON.stringify([{researchAdministrationId:pinned.researchAdministrationId,reason:'known_test'}]),{mode:0o600});
 const snapshot=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',snapshotOut,'--id','wvs-research-synthetic-v1','--from',today,'--through',today,
  '--quiesced','--exclusions',exclusions],{cwd:root,encoding:'utf8'});
 assert.equal(snapshot.status,0,snapshot.stderr);
 const released=JSON.parse(await readFile(path.join(snapshotOut,'snapshot.json'),'utf8'));
 assert.equal(released.snapshotId,'wvs-research-synthetic-v1');
 assert.equal(released.schemaVersion,'research-snapshot-1.3.0');
 assert.equal(released.engineReplay.historicalSourceEquality,'not_proven_by_model_release_manifest',
  'A mixed snapshot containing older unpinned administrations cannot claim exact historical engine equality.');
 assert.equal(released.engineReplay.sources.length,6);
 assert.equal(released.excludedKnownTestRecords,1);
 assert.equal(released.includedAdministrationCount,(await researchStore.active()).length-1);
 if(process.platform!=='win32'){
  assert.equal((await stat(snapshotOut)).mode&0o777,0o700);
  assert.equal((await stat(path.join(snapshotOut,'responses.ndjson'))).mode&0o777,0o600);
 }
 const snapshotManifest=JSON.parse(await readFile(path.join(snapshotOut,'manifest.json'),'utf8'));
 assert.ok(snapshotManifest.files.some(f=>f.path.startsWith('model-components/data/experience/')));
 const linkagePath=path.join(researchStore.root,'release-linkage-'+released.snapshotId+'.json');
 const linkage=JSON.parse(await readFile(linkagePath,'utf8'));
 assert.equal(linkage.schemaVersion,'research-release-linkage-1');
 assert.equal(linkage.snapshotId,released.snapshotId);
 assert.equal(linkage.snapshotManifestSha256,createHash('sha256').update(await readFile(path.join(snapshotOut,'manifest.json'))).digest('hex'));
 assert.equal(linkage.mappings.length,released.includedAdministrationCount);
 assert.ok(!snapshotManifest.files.some(file=>file.path.includes('release-linkage')));
 assert.ok(!JSON.stringify(snapshotManifest).includes(clientReceipt.contributionId));
 assert.ok(!linkage.mappings.some(row=>row.contributionId===receipt1.contributionId));
 if(process.platform!=='win32')assert.equal((await stat(linkagePath)).mode&0o777,0o600);
 const linkedRelease=linkage.mappings.find(row=>row.contributionId===clientReceipt.contributionId);
 assert.ok(linkedRelease,'An active receipt must have one private released-row link.');
 const linkageBackup=path.join(temp,'linkage-backup'),linkageRestored=path.join(temp,'linkage-restored');
 assert.equal(recovery('backup','--store',researchStore.root,'--out',linkageBackup).status,0);
 assert.equal(recovery('restore','--backup',linkageBackup,'--out',linkageRestored).status,0);
 assert.deepEqual(JSON.parse(await readFile(path.join(linkageRestored,path.basename(linkagePath)),'utf8')),linkage);
 const authoredRows=await rows(snapshotOut,'derived.ndjson');
 assert.ok(authoredRows.length>0);
 const releasedResponses=await rows(snapshotOut,'responses.ndjson');
 const explicitPublicPropositions=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id)&&rule.proposition).length;
 const inheritedPublicScopes=model.publicRuleIds.length-explicitPublicPropositions;
 const rawByAdministration=new Map();for(const response of releasedResponses){
  if(!rawByAdministration.has(response.researchAdministrationId))rawByAdministration.set(response.researchAdministrationId,new Set());
  if(response.responseState!==null)rawByAdministration.get(response.researchAdministrationId).add(response.itemId+'@'+response.itemRevision);
 }
 for(const authored of authoredRows){
  assert.ok(authored.propositions.every(p=>model.publicRuleIds.includes(p.id)&&p.sourceIds.length>0));
  assert.equal(authored.propositions.filter(p=>p.propositionBasis==='explicit_rule_proposition').length,explicitPublicPropositions);
  assert.equal(authored.propositions.filter(p=>p.propositionBasis==='inherited_rule_scope'&&
   p.proposition===null&&typeof p.scope==='string').length,inheritedPublicScopes);
  assert.ok(authored.propositions.every(p=>p.evidence.every(e=>
   rawByAdministration.get(authored.researchAdministrationId).has(e.itemId+'@'+e.itemRevision)&&
   !Object.hasOwn(e,'rawValue'))),'Authored evidence must join to raw rows without copying answer values.');
  assert.ok(authored.derived.every(d=>d.sourceIds.length>0));
  assert.ok(authored.affinities.every(t=>t.criteria.every(c=>c.sourceIds.length>0&&
   (c.mappedPropositionId!==null||['not_measured','unsuitable'].includes(c.mappingStatus)))));
 }
 const codebook=await rows(snapshotOut,'item-codebook.ndjson');
 assert.equal(codebook.length,formPolicy.sizes[0]);
 const claimIndex=JSON.parse(await readFile(path.join(snapshotOut,'authored-claim-index.json'),'utf8'));
 assert.equal(claimIndex.schemaVersion,'authored-claim-index-1');
 assert.equal(claimIndex.directRules.filter(rule=>rule.classification==='public_direct').length,model.publicRuleIds.length);
 assert.equal(claimIndex.directRules.filter(rule=>rule.classification==='public_direct'&&
  rule.propositionBasis==='inherited_rule_scope').length,inheritedPublicScopes);
 assert.ok(!claimIndex.directRules.some(rule=>rule.id==='audit2-SO09-moral-scope'),
  'A retired rule must not reappear in a new authored research snapshot.');
 const selfInterestEvidence=claimIndex.directRules.find(rule=>rule.id==='construct-NE15').evidence;
 assert.ok(selfInterestEvidence.some(e=>e.itemId==='NEI121'&&e.itemRevision===1&&
  e.assignedInFrozenRoute===true),'The release codebook must include the administered moral-reason discriminator.');
 assert.ok(selfInterestEvidence.some(e=>e.itemId==='NEI101'&&e.itemRevision===1&&
  e.assignedInFrozenRoute===false),'The near-parallel historical item remains reconstructible.');
 assert.ok(!selfInterestEvidence.some(e=>e.itemId==='NEI102'),
  'Ambiguous reverse evidence must not leak into the successor rule.');
 assert.ok(claimIndex.directRules.find(rule=>rule.id==='construct-EP16').sourceLinks.some(link=>
  link.sourceId==='acad-pragmatism'&&link.claimStatus==='topic_only'));
 assert.equal(claimIndex.derivedRules.length,1);
 assert.ok(codebook.flatMap(item=>item.authoredRuleUses).some(use=>use.propositionBasis==='inherited_rule_scope'&&
  use.proposition===null&&typeof use.scope==='string'));
 assert.equal((await rows(snapshotOut,'quality-flags.ndjson')).length,released.includedAdministrationCount);
 const releasedAdmins=await rows(snapshotOut,'administrations.ndjson');
 assert.ok(releasedAdmins.some(row=>row.researchAdministrationId===linkedRelease.releasedResearchAdministrationId));
 const sourceIds=new Set((await researchStore.active()).map(r=>r.researchAdministrationId));
 assert.ok(releasedAdmins.every(a=>!sourceIds.has(a.researchAdministrationId)),'Release pseudonyms are snapshot-specific.');
 assert.ok(!JSON.stringify(releasedAdmins).includes(receipt1.researchAdministrationId),'Withdrawn data stay out.');
 assert.ok((await rows(snapshotOut,'responses.ndjson')).some(r=>r.missingReason==='not_reached'));
 const verify=spawnSync(process.execPath,[path.join(snapshotOut,'verify_snapshot.mjs'),snapshotOut],{cwd:root,encoding:'utf8'});
 assert.equal(verify.status,0,verify.stderr);
 const pinnedStore=createResearchContributionStore({directory:path.join(temp,'pinned-research')});
 await pinnedStore.save(pinned);
 const pinnedSnapshotOut=path.join(temp,'wvs-research-pinned-v1');
 const pinnedSnapshot=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',pinnedStore.root,
  '--out',pinnedSnapshotOut,'--id','wvs-research-pinned-v1','--from',today,'--through',today,'--quiesced'],
  {cwd:root,encoding:'utf8'});
 assert.equal(pinnedSnapshot.status,0,pinnedSnapshot.stderr);
 const pinnedMetadata=JSON.parse(await readFile(path.join(pinnedSnapshotOut,'snapshot.json'),'utf8'));
 assert.equal(pinnedMetadata.includedAdministrationCount,1);
 assert.equal(pinnedMetadata.engineReplay.historicalSourceEquality,'pinned_inference_modules_match_extraction');
 const verifyPinned=spawnSync(process.execPath,[path.join(pinnedSnapshotOut,'verify_snapshot.mjs'),pinnedSnapshotOut],
  {cwd:root,encoding:'utf8'});
 assert.equal(verifyPinned.status,0,verifyPinned.stderr);
 const rehashedInvalidRow=async(label,file,change)=>{
  const target=path.join(temp,label);await cp(snapshotOut,target,{recursive:true});
  const entries=await rows(target,file);change(entries[0]);
  const bytes=Buffer.from(entries.map(row=>JSON.stringify(row)).join('\n')+'\n');
  await writeFile(path.join(target,file),bytes);
  const releaseManifest=JSON.parse(await readFile(path.join(target,'manifest.json'),'utf8'));
  const entry=releaseManifest.files.find(candidate=>candidate.path===file);
  entry.sha256=createHash('sha256').update(bytes).digest('hex');entry.bytes=bytes.length;
  await writeFile(path.join(target,'manifest.json'),JSON.stringify(releaseManifest)+'\n');
  return spawnSync(process.execPath,[path.join(target,'verify_snapshot.mjs'),target],{cwd:root,encoding:'utf8'});
 };
 const falseChannel=await rehashedInvalidRow('false-channel-snapshot','administrations.ndjson',
  row=>{row.releaseChannel='private-email';});
 assert.notEqual(falseChannel.status,0,'Rehashing cannot authorize an undocumented release channel.');
 assert.match(falseChannel.stderr,/Invalid category at administration.releaseChannel/);
 const falseAnswerChange=await rehashedInvalidRow('false-answer-change-snapshot','responses.ndjson',
  row=>{row.changedAnswerCount=-1;});
 assert.notEqual(falseAnswerChange.status,0,'Rehashing cannot authorize an invalid response-change count.');
 assert.match(falseAnswerChange.stderr,/Value below minimum at response.changedAnswerCount/);
 const falseLinkage=await rehashedInvalidRow('false-linkage-snapshot','respondents.ndjson',
  row=>{row.linkageOptIn='yes';});
 assert.notEqual(falseLinkage.status,0,'Rehashing cannot turn linkage consent into arbitrary text.');
 assert.match(falseLinkage.stderr,/Invalid type at respondent.linkageOptIn/);
 const tampered=path.join(temp,'tampered-snapshot');await cp(snapshotOut,tampered,{recursive:true});
 await writeFile(path.join(tampered,'derived.ndjson'),'changed\n');
 const rejected=spawnSync(process.execPath,[path.join(tampered,'verify_snapshot.mjs'),tampered],{cwd:root,encoding:'utf8'});
 assert.notEqual(rejected.status,0,'Tampered authored output must fail integrity verification.');
 const falseEngine=path.join(temp,'false-engine-snapshot');await cp(snapshotOut,falseEngine,{recursive:true});
 const falseSnapshot=JSON.parse(await readFile(path.join(falseEngine,'snapshot.json'),'utf8'));
 falseSnapshot.engineReplay.sources[0].sha256='0'.repeat(64);
 const falseSnapshotBytes=Buffer.from(JSON.stringify(falseSnapshot)+'\n');
 await writeFile(path.join(falseEngine,'snapshot.json'),falseSnapshotBytes);
 const falseManifest=JSON.parse(await readFile(path.join(falseEngine,'manifest.json'),'utf8'));
 const snapshotEntry=falseManifest.files.find(f=>f.path==='snapshot.json');
 snapshotEntry.sha256=createHash('sha256').update(falseSnapshotBytes).digest('hex');snapshotEntry.bytes=falseSnapshotBytes.length;
 await writeFile(path.join(falseEngine,'manifest.json'),JSON.stringify(falseManifest)+'\n');
 const falseReplay=spawnSync(process.execPath,[path.join(falseEngine,'verify_snapshot.mjs'),falseEngine],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(falseReplay.status,0,'A self-consistent file manifest cannot conceal a false replay-engine claim.');
 const falseLocale=path.join(temp,'false-locale-snapshot');await cp(snapshotOut,falseLocale,{recursive:true});
 const falseLocaleRows=await rows(falseLocale,'administrations.ndjson');
 falseLocaleRows[0].respondentLocale='person@example.org';
 const falseLocaleBytes=Buffer.from(falseLocaleRows.map(row=>JSON.stringify(row)).join('\n')+'\n');
 await writeFile(path.join(falseLocale,'administrations.ndjson'),falseLocaleBytes);
 const falseLocaleManifest=JSON.parse(await readFile(path.join(falseLocale,'manifest.json'),'utf8'));
 const administrationEntry=falseLocaleManifest.files.find(f=>f.path==='administrations.ndjson');
 administrationEntry.sha256=createHash('sha256').update(falseLocaleBytes).digest('hex');
 administrationEntry.bytes=falseLocaleBytes.length;
 await writeFile(path.join(falseLocale,'manifest.json'),JSON.stringify(falseLocaleManifest)+'\n');
 const rejectedLocale=spawnSync(process.execPath,[path.join(falseLocale,'verify_snapshot.mjs'),falseLocale],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedLocale.status,0,'A self-consistent manifest cannot authorize client text in locale metadata.');
 assert.match(rejectedLocale.stderr,/Invalid category at administration.respondentLocale/);
 const falseDiagnostic=path.join(temp,'false-diagnostic-snapshot');await cp(snapshotOut,falseDiagnostic,{recursive:true});
 const diagnosticFile=JSON.parse(await readFile(path.join(falseDiagnostic,'diagnostics.json'),'utf8'));
 diagnosticFile.administrations++;
 const diagnosticBytes=Buffer.from(JSON.stringify(diagnosticFile)+'\n');
 await writeFile(path.join(falseDiagnostic,'diagnostics.json'),diagnosticBytes);
 const diagnosticManifest=JSON.parse(await readFile(path.join(falseDiagnostic,'manifest.json'),'utf8'));
 const diagnosticEntry=diagnosticManifest.files.find(f=>f.path==='diagnostics.json');
 diagnosticEntry.sha256=createHash('sha256').update(diagnosticBytes).digest('hex');
 diagnosticEntry.bytes=diagnosticBytes.length;
 await writeFile(path.join(falseDiagnostic,'manifest.json'),JSON.stringify(diagnosticManifest)+'\n');
 const rejectedDiagnostic=spawnSync(process.execPath,[path.join(falseDiagnostic,'verify_snapshot.mjs'),falseDiagnostic],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedDiagnostic.status,0,'Rehashed diagnostic counts must not replace raw-row reproduction.');
 assert.match(rejectedDiagnostic.stderr,/Diagnostics cannot be reproduced/);
 const falseCodebook=path.join(temp,'false-codebook-snapshot');await cp(snapshotOut,falseCodebook,{recursive:true});
 const falseCodebookRows=await rows(falseCodebook,'item-codebook.ndjson');
 falseCodebookRows[0].canonicalText+=' [synthetic alteration]';
 const codebookBytes=Buffer.from(falseCodebookRows.map(row=>JSON.stringify(row)).join('\n')+'\n');
 await writeFile(path.join(falseCodebook,'item-codebook.ndjson'),codebookBytes);
 const codebookManifest=JSON.parse(await readFile(path.join(falseCodebook,'manifest.json'),'utf8'));
 const codebookEntry=codebookManifest.files.find(f=>f.path==='item-codebook.ndjson');
 codebookEntry.sha256=createHash('sha256').update(codebookBytes).digest('hex');
 codebookEntry.bytes=codebookBytes.length;
 await writeFile(path.join(falseCodebook,'manifest.json'),JSON.stringify(codebookManifest)+'\n');
 const rejectedCodebook=spawnSync(process.execPath,[path.join(falseCodebook,'verify_snapshot.mjs'),falseCodebook],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedCodebook.status,0,'Rehashed codebook content must match the frozen authored sources.');
 assert.match(rejectedCodebook.stderr,/Item codebook cannot be reproduced/);
 const falseClaimIndex=path.join(temp,'false-claim-index-snapshot');await cp(snapshotOut,falseClaimIndex,{recursive:true});
 const falseClaims=JSON.parse(await readFile(path.join(falseClaimIndex,'authored-claim-index.json'),'utf8'));
 falseClaims.directRules[0].proposition='Synthetic unsupported target.';
 const claimBytes=Buffer.from(JSON.stringify(falseClaims)+'\n');
 await writeFile(path.join(falseClaimIndex,'authored-claim-index.json'),claimBytes);
 const claimManifest=JSON.parse(await readFile(path.join(falseClaimIndex,'manifest.json'),'utf8'));
 const claimEntry=claimManifest.files.find(f=>f.path==='authored-claim-index.json');
 claimEntry.sha256=createHash('sha256').update(claimBytes).digest('hex');claimEntry.bytes=claimBytes.length;
 await writeFile(path.join(falseClaimIndex,'manifest.json'),JSON.stringify(claimManifest)+'\n');
 const rejectedClaims=spawnSync(process.execPath,[path.join(falseClaimIndex,'verify_snapshot.mjs'),falseClaimIndex],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedClaims.status,0,'Rehashed authored claims must match the frozen model.');
 assert.match(rejectedClaims.stderr,/Authored claim index cannot be reproduced/);
 const falseConsent=path.join(temp,'false-consent-snapshot');await cp(snapshotOut,falseConsent,{recursive:true});
 const falseTerms=JSON.parse(await readFile(path.join(falseConsent,'consent-terms.json'),'utf8'));
 falseTerms.purpose+=' [synthetic alteration]';
 const consentBytes=Buffer.from(JSON.stringify(falseTerms)+'\n');
 await writeFile(path.join(falseConsent,'consent-terms.json'),consentBytes);
 const falseConsentManifest=JSON.parse(await readFile(path.join(falseConsent,'manifest.json'),'utf8'));
 const consentEntry=falseConsentManifest.files.find(f=>f.path==='consent-terms.json');
 consentEntry.sha256=createHash('sha256').update(consentBytes).digest('hex');
 consentEntry.bytes=consentBytes.length;
 await writeFile(path.join(falseConsent,'manifest.json'),JSON.stringify(falseConsentManifest)+'\n');
 const rejectedConsent=spawnSync(process.execPath,[path.join(falseConsent,'verify_snapshot.mjs'),falseConsent],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedConsent.status,0,'Rehashed consent text must still match the pinned disclosure.');
 assert.match(rejectedConsent.stderr,/Consent terms do not match their pin/);
 const python=spawnSync('python3',[path.join(snapshotOut,'load_snapshot.py'),snapshotOut],{cwd:root,encoding:'utf8'});
 assert.equal(python.status,0,python.stderr);
 assert.equal(JSON.parse(python.stdout).snapshotId,released.snapshotId);
 const rAvailable=spawnSync('Rscript',['-e','quit(status=if (requireNamespace("jsonlite", quietly=TRUE)) 0 else 1)'],
  {cwd:root,encoding:'utf8'});
 if(rAvailable.status===0){const rLoad=spawnSync('Rscript',[path.join(snapshotOut,'load_snapshot.R'),snapshotOut],
  {cwd:root,encoding:'utf8'});assert.equal(rLoad.status,0,rLoad.stderr);assert.match(rLoad.stdout,/wvs-research-synthetic-v1/);}
 const inventoryPath=path.join(temp,'private-inventory.json');
 const inventory=spawnSync(process.execPath,['scripts/research-inventory.mjs','--store',researchStore.root,
  '--out',inventoryPath],
  {cwd:root,encoding:'utf8'});
 assert.equal(inventory.status,0,inventory.stderr);
 assert.ok(JSON.parse(inventory.stdout).snapshotExportableAdministrations>0);
 assert.ok(!inventory.stdout.includes('rawValue'));
 const detailedInventory=JSON.parse(await readFile(inventoryPath,'utf8'));
 assert.equal(detailedInventory.diagnostic.administrations,JSON.parse(inventory.stdout).snapshotExportableAdministrations);
 assert.equal(detailedInventory.readiness.analyses.routeComparison.status,'impossible_with_current_collection');
 const emptyOut=path.join(temp,'wvs-research-empty-v1');
 const empty=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',emptyOut,'--id','wvs-research-empty-v1','--from','1990-01-01','--through','1990-12-31','--quiesced'],
  {cwd:root,encoding:'utf8'});
 assert.equal(empty.status,0,empty.stderr);
 assert.equal((await rows(emptyOut,'administrations.ndjson')).length,0);
 assert.equal((await readFile(path.join(emptyOut,'readiness.json'),'utf8').then(JSON.parse)).analyses.itemResponseDistributions.status,'premature');
 const correctedOut=path.join(temp,'wvs-research-empty-v2');
 const corrected=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',correctedOut,'--id','wvs-research-empty-v2','--from','1990-01-01','--through','1990-12-31',
  '--quiesced','--supersedes','wvs-research-empty-v1','--correction-note','Synthetic correction test.'],
  {cwd:root,encoding:'utf8'});
 assert.equal(corrected.status,0,corrected.stderr);
 assert.equal((await readFile(path.join(correctedOut,'snapshot.json'),'utf8').then(JSON.parse)).supersedes,'wvs-research-empty-v1');
 const overwrite=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',snapshotOut,'--id','wvs-research-synthetic-v1','--from',today,'--through',today,'--quiesced'],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(overwrite.status,0,'A released snapshot cannot be overwritten.');
 const eligibilityContext={consentVersion:RESEARCH_CONSENT_VERSION,bank,form:formPolicy,model,pilotManifest,catalog,
  localizationBundles,localizationCatalogs:[localizationCatalog],modelReleaseVersions:current.modelReleaseVersions.map(ref=>ref.version)};
 assert.equal(researchExportEligibility(pinned,eligibilityContext).eligible,true);
 assert.equal(researchExportEligibility({...pinned,derivedInferenceVersion:'synthetic-unsupported'},eligibilityContext).reason,
  'unsupported_model_tuple');
 assert.equal(researchExportEligibility({...pinned,modelReleaseVersion:'missing-release'},eligibilityContext).reason,
  'unavailable_model_release');
 assert.equal(researchExportEligibility({...pinned,respondentLocale:'person@example.org'},eligibilityContext).reason,
  'unsupported_locale_metadata');
 assert.equal(researchExportEligibility({...pinned,presentationLocale:'unreviewed'},eligibilityContext).reason,
  'unsupported_locale_metadata');
 assert.equal(researchExportEligibility({...pinned,responses:pinned.responses.map((row,index)=>index===0?
  {...row,textVersion:'person@example.org'}:row)},eligibilityContext).reason,'incomplete_wording_metadata');
 assert.equal(researchExportEligibility({...projected,responses:projected.responses.map((row,index)=>index===0?
  {...row,variantId:'person@example.org'}:row)},eligibilityContext).reason,'incomplete_wording_metadata');
 const validBeforeIncompatible=(await researchStore.active()).length;
 const incompatible=projectResearchContribution({body:body(attempt()),bank,pilot,scalesDoc,...researchContext});
 const incompatibleReceipt=await researchStore.save({...incompatible,derivedInferenceVersion:'synthetic-unsupported'});
 const incompatiblePath=path.join(researchStore.root,incompatibleReceipt.contributionId+'.json');
 const historicalIncompatible=JSON.parse(await readFile(incompatiblePath,'utf8'));
 historicalIncompatible.consentedAt='1990-06-15T12:00:00.000Z';
 await writeFile(incompatiblePath,JSON.stringify(historicalIncompatible)+'\n');
 const blockedInventory=spawnSync(process.execPath,['scripts/research-inventory.mjs','--store',researchStore.root],
  {cwd:root,encoding:'utf8'});
 assert.equal(blockedInventory.status,0,blockedInventory.stderr);
 const blockedSummary=JSON.parse(blockedInventory.stdout);
 assert.equal(blockedSummary.exporterAcceptsWholeStore,false);
 assert.equal(blockedSummary.snapshotExportableAdministrations,0);
 assert.ok(blockedSummary.eligibilityCompatibleAdministrations>0);
 const blockedExport=spawnSync(process.execPath,['scripts/export-research-package.mjs','--store',researchStore.root,
  '--out',path.join(temp,'blocked-export')],{cwd:root,encoding:'utf8'});
 assert.notEqual(blockedExport.status,0,'Inventory and exporter must agree that this store cannot be exported.');
 const windowInventory=spawnSync(process.execPath,['scripts/research-inventory.mjs','--store',researchStore.root,
  '--from',today,'--through',today],{cwd:root,encoding:'utf8'});
 assert.equal(windowInventory.status,0,windowInventory.stderr);
 const windowSummary=JSON.parse(windowInventory.stdout);
 assert.equal(windowSummary.snapshotExportableAdministrations,validBeforeIncompatible);
 assert.equal(windowSummary.exporterAcceptsSelection,true);
 assert.equal(windowSummary.exporterAcceptsWholeStore,null);
 assert.equal(windowSummary.sourceStatusCounts.active,validBeforeIncompatible+1);
 const incompatibleInventory=spawnSync(process.execPath,['scripts/research-inventory.mjs','--store',researchStore.root,
  '--from','1990-01-01','--through','1990-12-31'],{cwd:root,encoding:'utf8'});
 assert.equal(incompatibleInventory.status,0,incompatibleInventory.stderr);
 assert.equal(JSON.parse(incompatibleInventory.stdout).snapshotExportableAdministrations,0);
 const windowedOut=path.join(temp,'wvs-research-windowed-v1');
 const windowed=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',windowedOut,'--id','wvs-research-windowed-v1','--from',today,'--through',today,'--quiesced'],
  {cwd:root,encoding:'utf8'});
 assert.equal(windowed.status,0,windowed.stderr);
 const windowedMetadata=JSON.parse(await readFile(path.join(windowedOut,'snapshot.json'),'utf8'));
 assert.equal(windowedMetadata.includedAdministrationCount,validBeforeIncompatible);
 assert.equal(windowedMetadata.excludedCounts.outside_contribution_window,1);
 assert.equal(windowedMetadata.extractionLogicVersion,'research-snapshot-extractor-1.3.3');
 const falseWording=path.join(temp,'false-wording-snapshot');await cp(windowedOut,falseWording,{recursive:true});
 const windowedAdministrations=await rows(falseWording,'administrations.ndjson');
 const localizedAdministration=windowedAdministrations.find(row=>row.localizationBundleVersion);
 assert.ok(localizedAdministration,'The wording fixture requires one approved localized administration.');
 const falseWordingRows=await rows(falseWording,'responses.ndjson');
 const wordingRow=falseWordingRows.find(row=>row.researchAdministrationId===localizedAdministration.researchAdministrationId);
 wordingRow.textVersion='synthetic-other-wording';
 const wordingBytes=Buffer.from(falseWordingRows.map(row=>JSON.stringify(row)).join('\n')+'\n');
 await writeFile(path.join(falseWording,'responses.ndjson'),wordingBytes);
 const falseWordingManifest=JSON.parse(await readFile(path.join(falseWording,'manifest.json'),'utf8'));
 const wordingEntry=falseWordingManifest.files.find(file=>file.path==='responses.ndjson');
 wordingEntry.sha256=createHash('sha256').update(wordingBytes).digest('hex');
 wordingEntry.bytes=wordingBytes.length;
 await writeFile(path.join(falseWording,'manifest.json'),JSON.stringify(falseWordingManifest)+'\n');
 const rejectedWording=spawnSync(process.execPath,[path.join(falseWording,'verify_snapshot.mjs'),falseWording],
  {cwd:root,encoding:'utf8'});
 assert.notEqual(rejectedWording.status,0,'Rehashed response wording must match its pinned localization.');
 assert.match(rejectedWording.stderr,/Pinned response text version mismatch/);
 const blockedWindow=spawnSync(process.execPath,['scripts/create-research-snapshot.mjs','--store',researchStore.root,
  '--out',path.join(temp,'wvs-research-unsupported-window-v1'),'--id','wvs-research-unsupported-window-v1',
  '--from','1990-01-01','--through','1990-12-31','--quiesced'],{cwd:root,encoding:'utf8'});
 assert.notEqual(blockedWindow.status,0,'An incompatible in-window contribution must still block extraction.');
 const pairAdministrations=['a-1','a-2'].map((researchAdministrationId,index)=>({researchAdministrationId,
  researchRespondentId:'r-'+index,contributedDate:'2026-01-01',completionStatus:'completed',recordedResponses:2,
  instrumentVersion:'fixture',formPolicyVersion:'fixture',modelVersion:model.modelVersion,
  modelReleaseVersion:null,presentationLocale:'en-US',localizationBundleVersion:null,
  releaseChannel:null,consentVersion:RESEARCH_CONSENT_VERSION}));
 const pairResponses=[
  {researchAdministrationId:'a-1',itemId:'NEI100',itemRevision:1,responseState:'answered',rawValue:4,
   presented:true,missingReason:null,responseType:'likert'},
  {researchAdministrationId:'a-1',itemId:'NEI101',itemRevision:1,responseState:'answered',rawValue:4,
   presented:true,missingReason:null,responseType:'likert'},
  {researchAdministrationId:'a-2',itemId:'NEI100',itemRevision:1,responseState:'answered',rawValue:3,
   presented:true,missingReason:null,responseType:'likert'},
  {researchAdministrationId:'a-2',itemId:'NEI101',itemRevision:1,responseState:'no_view',rawValue:null,
   presented:true,missingReason:'no_view',responseType:'likert'}];
 const pairDiagnostic=diagnoseResearchRows({respondents:[{researchRespondentId:'r-0'},
  {researchRespondentId:'r-1'}],administrations:pairAdministrations,responses:pairResponses,
  items:[{itemId:'NEI100',itemRevision:1},{itemId:'NEI101',itemRevision:1}],model});
 assert.equal(pairDiagnostic.schemaVersion,'research-diagnostics-1.2.0');
 assert.deepEqual(pairDiagnostic.substantiveAnswerDistribution,{'1':1,'2':1});
 assert.equal(pairDiagnostic.rulePairExposure.find(row=>row.ruleId==='construct-NE15').pairs[0]
  .coAnsweredAdministrations,1,'Pair exposure requires two substantive answers to exact revisions.');
 const repeatDiagnostic=diagnoseResearchRows({respondents:[{researchRespondentId:'r-linked'}],
  administrations:[...pairAdministrations.map((administration,index)=>({...administration,
   researchRespondentId:'r-linked',contributedDate:index?'2026-01-08':'2026-01-01'})),
   {...pairAdministrations[1],researchAdministrationId:'a-3',researchRespondentId:'r-linked',
    contributedDate:'2026-01-08',recordedResponses:1}],
  responses:[...pairResponses,{...pairResponses[2],researchAdministrationId:'a-3'}],
  items:[{itemId:'NEI100',itemRevision:1},{itemId:'NEI101',itemRevision:1}],model});
 assert.equal(repeatDiagnostic.linkedRespondentsWithRepeats,1);
 assert.deepEqual(repeatDiagnostic.linkedRepeatContributionDateGapDays,{'7':1});
 assert.equal(repeatDiagnostic.linkedRepeatSameDayAdditionalAdministrations,1);
 assert.deepEqual(repeatDiagnostic.linkedRepeatSharedRevisionDistribution,{'1':1});
 assert.deepEqual(repeatDiagnostic.linkedRepeatModelVersionCountDistribution,{'1':1});
 const sparseScreen=assessResearchReadiness({administrations:2,linkedRespondentsWithRepeats:1,
  administrationsWithTwoAnswered:2,responseFormats:{likert:4},localeVersions:{'en-US / unpinned':2},
  itemStats:[{answerCategories:{'1':1,'2':1}},{answerCategories:{'1':1,'2':1}}]});
 for(const analysis of ['constructExploration','dimensionalAnalysis','localDependence','reliability',
  'testRetest','interpretationRuleEvaluation'])assert.equal(sparseScreen.analyses[analysis].status,'premature',
   'Sparse structural opportunity must not be reported as analytical adequacy: '+analysis);
 const sameLanguageVersions=assessResearchReadiness({administrations:2,linkedRespondentsWithRepeats:0,
  administrationsWithTwoAnswered:0,responseFormats:{},
  localeVersions:{'en-US / bundle-v1':1,'en-US / bundle-v2':1},itemStats:[]});
 assert.equal(sameLanguageVersions.analyses.crossLanguage.status,'impossible_with_current_collection',
  'Multiple wording versions in one language are not cross-language observations.');
 const postReleaseWithdrawal=await fetch(base+'/api/research/contributions/'+clientReceipt.contributionId,
  {method:'DELETE',headers:{Authorization:'Bearer '+clientReceipt.withdrawalToken}});
 assert.equal(postReleaseWithdrawal.status,200);
 const withdrawnRecord=JSON.parse(await readFile(path.join(researchStore.root,clientReceipt.contributionId+'.json'),'utf8'));
 assert.equal(withdrawnRecord.status,'withdrawn');
 assert.ok(!Object.hasOwn(withdrawnRecord,'researchAdministrationId'));
 assert.equal(JSON.parse(await readFile(linkagePath,'utf8')).mappings.find(row=>
  row.contributionId===withdrawnRecord.contributionId).releasedResearchAdministrationId,
  linkedRelease.releasedResearchAdministrationId,'The private escrow must identify a released row after withdrawal.');
 const impact=spawnSync(process.execPath,['scripts/research-withdrawal-impact.mjs','--store',researchStore.root,
  '--contribution',clientReceipt.contributionId],{cwd:root,encoding:'utf8'});
 assert.equal(impact.status,0,impact.stderr);
 const affected=JSON.parse(impact.stdout).affected;
 assert.ok(affected.some(row=>row.snapshotId===released.snapshotId&&
  row.releasedResearchAdministrationId===linkedRelease.releasedResearchAdministrationId));
 assert.ok(affected.some(row=>row.snapshotId==='wvs-research-windowed-v1'),
  'A withdrawal lookup must find every included release version.');
 assert.ok(!impact.stdout.includes(clientReceipt.contributionId),'The console summary need not repeat a private receipt.');
 console.log('Research contribution, withdrawal, export, and version tests passed.');
}finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
