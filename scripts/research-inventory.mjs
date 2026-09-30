import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessResearchReadiness,diagnoseResearchRows} from '../packages/research/handoff.js';
import {researchExportEligibility} from '../packages/research/eligibility.js';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const store=flag('--store'),output=flag('--out'),from=flag('--from'),through=flag('--through');
const date=/^\d{4}-\d{2}-\d{2}$/;
const validDate=value=>date.test(value)&&Number.isFinite(Date.parse(value))&&
 new Date(value).toISOString().slice(0,10)===value;
if(!store||Boolean(from)!==Boolean(through)||args.length!==2+(output?2:0)+(from?4:0)||
 (from&&(!validDate(from)||!validDate(through)||from>through)))
 throw Error('Usage: node scripts/research-inventory.mjs --store PRIVATE_STORE [--out PRIVATE_REPORT_JSON] [--from YYYY-MM-DD --through YYYY-MM-DD]');
const dir=path.resolve(store),meta=await stat(dir);
if(!meta.isDirectory())throw Error('Research store path is not a directory.');
if(process.platform!=='win32'&&(meta.mode&0o077))throw Error('Research store directory is not private.');
const files=(await readdir(dir)).filter(name=>/^[0-9a-f-]{36}\.json$/i.test(name)).sort();
const records=await Promise.all(files.map(name=>readFile(path.join(dir,name),'utf8').then(JSON.parse)));
const allActive=records.filter(r=>r.status==='active'),withdrawn=records.filter(r=>r.status==='withdrawn');
if(allActive.length+withdrawn.length!==records.length)throw Error('Unknown contribution status.');
for(const record of allActive)if(typeof record.consentedAt!=='string'||
 !Number.isFinite(Date.parse(record.consentedAt))||new Date(record.consentedAt).toISOString()!==record.consentedAt)
 throw Error('Active contribution has an invalid consent timestamp.');
const active=from?allActive.filter(record=>{
 const day=record.consentedAt.slice(0,10);return day>=from&&day<=through;
}):allActive;
const current=JSON.parse(await readFile(path.join(root,'data/current.json'),'utf8'));
const form=JSON.parse(await readFile(path.join(root,current.fullForm.path),'utf8'));
const bank=JSON.parse(await readFile(path.join(root,current.candidateBank.path),'utf8'));
const model=JSON.parse(await readFile(path.join(root,current.worldviewModel.path),'utf8'));
const catalog=JSON.parse(await readFile(path.join(root,current.affinityCatalog.path),'utf8'));
const pilotManifest=JSON.parse(await readFile(path.join(root,current.pilotCandidate.path),'utf8'));
const localizationCatalogs=await Promise.all((current.localizationCatalogVersions??[current.localizationCatalog]).filter(Boolean)
 .map(ref=>readFile(path.join(root,ref.path),'utf8').then(JSON.parse)));
const localizationBundles=await Promise.all((current.localizationBundles??[])
 .map(ref=>readFile(path.join(root,ref.path),'utf8').then(JSON.parse)));
const byId=new Map(bank.items.map(item=>[item.id,item]));
const items=form.frozenItems.map((ref,position)=>{
 const item=byId.get(ref.itemId);if(!item||item.revision!==ref.itemRevision)throw Error('Unavailable frozen item revision.');
 return {position,itemId:item.id,itemRevision:item.revision};
});
const eligibilityContext={consentVersion:'research-consent-1.0.0',bank,form,model,pilotManifest,catalog,
 localizationBundles,localizationCatalogs,modelReleaseVersions:(current.modelReleaseVersions??[]).map(ref=>ref.version)};
const evaluations=active.map(record=>({record,result:researchExportEligibility(record,eligibilityContext)}));
const eligible=evaluations.filter(x=>x.result.eligible).map(x=>x.record);
const reasonCounts={};for(const {result} of evaluations)if(!result.eligible)
 reasonCounts[result.reason]=(reasonCounts[result.reason]??0)+1;
const consented=active.filter(r=>r.consentVersion===eligibilityContext.consentVersion&&Array.isArray(r.responses));
const exportBlocked=eligible.length!==active.length;
const administrations=eligible.map(r=>({researchAdministrationId:r.researchAdministrationId,
 researchRespondentId:r.researchRespondentId,contributedDate:r.consentedAt.slice(0,10),completionStatus:r.completionStatus,
 recordedResponses:r.answeredItems,instrumentVersion:r.instrumentVersion,formPolicyVersion:r.formPolicyVersion,
 modelVersion:r.modelVersion,modelReleaseVersion:r.modelReleaseVersion??null,
 presentationLocale:r.presentationLocale,localizationBundleVersion:r.localizationBundleVersion??null,
 releaseChannel:r.releaseChannel??null,consentVersion:r.consentVersion}));
const respondents=[...new Set(eligible.map(r=>r.researchRespondentId))].map(researchRespondentId=>({researchRespondentId}));
const responses=eligible.flatMap(r=>r.responses.map(row=>({researchAdministrationId:r.researchAdministrationId,...row})));
const diagnostic=diagnoseResearchRows({respondents,administrations,responses,items,model,
 consentAudit:{active:active.length,activeOutsideWindow:allActive.length-active.length,
  withdrawnTotal:withdrawn.length,consentedActive:consented.length,
  eligibilityCompatibleActive:eligible.length,snapshotExportableActive:exportBlocked?0:eligible.length,
  exportBlockedByUnsupportedActive:exportBlocked,
  unsupportedConsent:reasonCounts.unsupported_consent??0,
  missingResponses:reasonCounts.missing_responses??0,
  incompatibleConsented:consented.length-eligible.length,unsupportedReasons:reasonCounts}});
const readiness=assessResearchReadiness(diagnostic);
const report={schemaVersion:'research-inventory-1.1',dataSource:'private_contribution_store',
 extractionTime:new Date().toISOString(),contributionDateWindow:from?{from,through}:null,
 sourceStatusCounts:{active:allActive.length,withdrawn:withdrawn.length},
 eligibility:'The frozen-pilot exporter requires every selected active record to pass the complete consent, model, localization, and release tuple.',
 qualityCaveats:['Recruitment and nonconsent denominator unavailable.','No demographics, exact answering time, or known-bot marker.',
  'Quick, Standard, and adaptive administrations are not accepted by this collector.',
  'Operator incident and test-record registers must be reviewed separately.'],diagnostic,readiness};
if(output){
 const parent=await stat(path.dirname(path.resolve(output)));
 if(process.platform!=='win32'&&(parent.mode&0o077))throw Error('Detailed report parent directory must be private.');
 await writeFile(path.resolve(output),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
}
console.log(JSON.stringify({dataSource:report.dataSource,
 contributionDateWindow:report.contributionDateWindow,
 snapshotExportableAdministrations:exportBlocked?0:diagnostic.administrations,
 eligibilityCompatibleAdministrations:diagnostic.administrations,
 consentedActiveAdministrations:consented.length,exportBlockedByUnsupportedActive:exportBlocked,
 exporterAcceptsSelection:!exportBlocked,exporterAcceptsWholeStore:from?null:!exportBlocked,
 respondentPseudonyms:diagnostic.respondentPseudonyms,completionStatus:diagnostic.completionStatus,
 routeVersions:diagnostic.routeVersions,localeVersions:diagnostic.localeVersions,
 linkedRespondentsWithRepeats:diagnostic.linkedRespondentsWithRepeats,
 sourceStatusCounts:report.sourceStatusCounts,detailedReport:output?path.resolve(output):null}));
