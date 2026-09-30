import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {access,mkdir,readFile,realpath,rename,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createResearchContributionStore,RESEARCH_CONSENT_VERSION} from '../packages/collection/research.js';
import {researchExportEligibility} from '../packages/research/eligibility.js';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const args=process.argv.slice(2);
const flag=name=>{const index=args.indexOf(name);return index<0?null:args[index+1];};
const storePath=flag('--store'),outPath=flag('--out'),from=flag('--from'),through=flag('--through');
const date=/^\d{4}-\d{2}-\d{2}$/;
const validDate=value=>date.test(value)&&Number.isFinite(Date.parse(value))&&
 new Date(value).toISOString().slice(0,10)===value;
if(!storePath||!outPath||Boolean(from)!==Boolean(through)||args.length!==(from?8:4)||
 (from&&(!validDate(from)||!validDate(through)||from>through)))
 throw Error('Usage: node scripts/export-research-package.mjs --store PRIVATE_CONTRIBUTION_DIR --out NEW_OUTPUT_DIR [--from YYYY-MM-DD --through YYYY-MM-DD]');
const output=path.resolve(outPath),storeRoot=path.resolve(storePath);
if(output===root||output.startsWith(root+path.sep))throw Error('Place research exports outside the repository.');
if(output===storeRoot||output.startsWith(storeRoot+path.sep))throw Error('Research export cannot be inside the contribution store.');
let storeInfo;
try{storeInfo=await stat(storeRoot);}
catch(error){if(error.code==='ENOENT')throw Error('Research contribution store is unavailable; a missing store is not an empty dataset.');throw error;}
if(!storeInfo.isDirectory())throw Error('Research contribution store is not a directory.');
if(process.platform!=='win32'&&(storeInfo.mode&0o077))throw Error('Research contribution store must be private (mode 0700).');
const outputParent=await realpath(path.dirname(output));
const actualRoot=await realpath(root),actualStore=await realpath(storeRoot);
if(outputParent===actualRoot||outputParent.startsWith(actualRoot+path.sep))throw Error('Export parent resolves inside the repository.');
if(outputParent===actualStore||outputParent.startsWith(actualStore+path.sep))throw Error('Export parent resolves inside the contribution store.');
try{await access(output);throw Error('Output directory already exists. Choose a new path.');}catch(error){if(error.code!=='ENOENT')throw error;}
const read=async relative=>readFile(path.join(root,relative));
const json=async relative=>JSON.parse(await read(relative));
const current=await json('data/current.json');
const consentManifest=await json('data/research/consent-v1.manifest.json');
const consent=await json(consentManifest.path);
const [bank,form,model,registry,sourceLedger,catalog,pilotManifest,catalogManifest,scalesDoc]=await Promise.all([
 json(current.candidateBank.path),json(current.fullForm.path),json(current.worldviewModel.path),json('data/constructs.json'),
 json(current.worldviewSourceLedger.path),json(current.affinityCatalog.path),json(current.pilotCandidate.path),
 json(current.affinityCatalog.manifestPath),json('data/response-scales.json')]);
const instrument=await json(pilotManifest.route.instrumentManifestPath);
const localizationCatalogs=await Promise.all((current.localizationCatalogVersions??[current.localizationCatalog]).filter(Boolean).map(ref=>json(ref.path)));
const localizationBundles=await Promise.all((current.localizationBundles??[]).map(ref=>json(ref.path)));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(await read(catalogManifest.path)),catalogManifest.sha256,'Catalog definition changed in place.');
assert.equal(digest(await read(consentManifest.path)),consentManifest.sha256,'Consent terms changed in place.');
assert.equal(consent.consentVersion,RESEARCH_CONSENT_VERSION,'Consent terms version mismatch.');
for(const [file,expected] of Object.entries(pilotManifest.frozenArtifactHashes))assert.equal(digest(await read(file)),expected,'Frozen pilot artifact changed: '+file);
const store=createResearchContributionStore({directory:storeRoot});
const activeRecords=await store.active();
for(const record of activeRecords)assert.ok(typeof record.consentedAt==='string'&&
 Number.isFinite(Date.parse(record.consentedAt))&&new Date(record.consentedAt).toISOString()===record.consentedAt,
 'Active contribution has an invalid consent timestamp.');
const records=from?activeRecords.filter(record=>{
 const day=record.consentedAt.slice(0,10);return day>=from&&day<=through;
}):activeRecords;
const eligibilityContext={consentVersion:consent.consentVersion,bank,form,model,pilotManifest,catalog,
 localizationBundles,localizationCatalogs,modelReleaseVersions:(current.modelReleaseVersions??[]).map(ref=>ref.version)};
for(const r of records){
 const result=researchExportEligibility(r,eligibilityContext);
 assert.ok(result.eligible,'Unsupported contribution for this export: '+result.reason);
}
const respondents=[...new Map(records.map(r=>[r.researchRespondentId,{researchRespondentId:r.researchRespondentId,linkageOptIn:r.linkageOptIn}])).values()];
const administrations=records.map(r=>({researchAdministrationId:r.researchAdministrationId,researchRespondentId:r.researchRespondentId,
 contributedDate:r.consentedAt.slice(0,10),
 completionStatus:r.completionStatus,assignedItems:r.assignedItems,recordedResponses:r.answeredItems,
 consentVersion:r.consentVersion,bankVersion:r.bankVersion,instrumentVersion:r.instrumentVersion,
 formPolicyVersion:r.formPolicyVersion,modelVersion:r.modelVersion,resultSemanticsVersion:r.resultSemanticsVersion,
 derivedInferenceVersion:r.derivedInferenceVersion,affinityCatalogVersion:r.affinityCatalogVersion,
 respondentLocale:r.respondentLocale??null,presentationLocale:r.presentationLocale??'en-US',
 interfaceLanguage:r.interfaceLanguage??null,localizationCatalogVersion:r.localizationCatalogVersion??null,
 localizationBundleVersion:r.localizationBundleVersion??null,modelReleaseVersion:r.modelReleaseVersion??null,
 releaseChannel:r.releaseChannel??null}));
const responses=records.flatMap(r=>r.responses.map(x=>({researchAdministrationId:r.researchAdministrationId,...x})));
const byItem=new Map(bank.items.map(i=>[i.id,i]));
const items=form.frozenItems.map((ref,position)=>{const item=byItem.get(ref.itemId);assert.ok(item&&item.revision===ref.itemRevision);
 return {position,itemId:item.id,itemRevision:item.revision,domainId:item.domainId,responseType:item.responseType,
  responseScaleId:item.responseScaleId,text:item.text,options:item.options??null,eligibility:item.eligibility??null};});
const versions={datasetSchemaVersion:'research-package-1.1.0',bankVersion:bank.bankVersion,instrumentVersion:model.pilotInstrumentVersion,
 consentVersion:consent.consentVersion,consentSha256:consentManifest.sha256,
 formPolicyVersion:form.policyVersion,modelVersion:model.modelVersion,resultSemanticsVersion:model.resultSemanticsVersion,
 derivedInferenceVersion:pilotManifest.derivedInference.version,affinityCatalogVersion:catalog.catalogVersion,
 catalogSha256:catalogManifest.sha256,pilotCandidateVersion:pilotManifest.pilotCandidateVersion,
 localizationCatalogVersions:localizationCatalogs.map(c=>c.catalogVersion),
 localizationBundleVersions:localizationBundles.map(b=>b.bundleVersion),
 modelReleaseVersions:(current.modelReleaseVersions??[]).map(ref=>ref.version),
 sampling:'Voluntary opt-in application users only; no representative sampling claim.',
 interpretation:'Authored public propositions and affinity definitions are snapshots, not research ground truth.'};
const temp=output+'.building-'+randomUUID();await mkdir(temp,{recursive:false,mode:0o700});
const written=[];
const put=async(name,value)=>{const bytes=Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
 await writeFile(path.join(temp,name),bytes,{flag:'wx',mode:0o600});written.push({path:name,sha256:digest(bytes),bytes:bytes.length});};
const ndjson=rows=>rows.map(row=>JSON.stringify(row)).join('\n')+(rows.length?'\n':'');
await put('respondents.ndjson',ndjson(respondents));
await put('administrations.ndjson',ndjson(administrations));
await put('responses.ndjson',ndjson(responses));
await put('items.ndjson',ndjson(items));
await put('versions.json',versions);
await put('consent-terms.json',consent);
await put('consent-manifest.json',consentManifest);
await put('item-bank.json',bank);
await put('construct-registry.json',registry);
await put('interpretation-model.json',model);
await put('affinity-catalog.json',catalog);
await put('source-ledger.json',sourceLedger);
await put('instrument-manifest.json',instrument);
await put('pilot-manifest.json',pilotManifest);
await put('form-policy.json',form);
await put('response-scales.json',scalesDoc);
for(const localized of localizationCatalogs)await put('localization-catalog-'+localized.catalogVersion+'.json',localized);
for(const localized of localizationBundles)await put('localization-bundle-'+localized.bundleVersion+'.json',localized);
for(const ref of current.modelReleaseVersions??[])await put('model-release-'+ref.version+'.json',await json(ref.path));
await put('research-export.schema.json',JSON.parse(await read('schemas/research-export.schema.json')));
await put('data-dictionary.md',(await read('docs/RESEARCH_DATA_DICTIONARY.md')).toString());
await put('research-guide.md',(await read('docs/RESEARCH_DATA.md')).toString());
await put('load-example.mjs',`import {readFile} from 'node:fs/promises';\nconst rows=async name=>(await readFile(new URL(name,import.meta.url),'utf8')).trim().split('\\n').filter(Boolean).map(JSON.parse);\nconst [administrations,responses]=await Promise.all([rows('administrations.ndjson'),rows('responses.ndjson')]);\nconsole.log({administrations:administrations.length,responses:responses.length});\n// Use rawValue and missingReason as observed; do not treat interpretation-model.json as ground truth.\n`);
await put('manifest.json',{datasetSchemaVersion:versions.datasetSchemaVersion,generatedAt:new Date().toISOString(),
 contributionDateWindow:from?{from,through}:null,
 activeContributions:records.length,respondentRows:respondents.length,administrationRows:administrations.length,
 responseRows:responses.length,itemRows:items.length,files:written});
await rename(temp,output);
await store.auditExport({count:records.length,output});
console.log(JSON.stringify({output,activeContributions:records.length,respondentRows:respondents.length,
 administrationRows:administrations.length,responseRows:responses.length,itemRows:items.length}));
