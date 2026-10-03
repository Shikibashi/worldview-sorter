import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {buildReferenceReadinessReport,renderReferenceReadinessMarkdown} from '../packages/worldview/reference-readiness-audit.js';

const root=new URL('../',import.meta.url);
const readJson=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const bytes=async path=>readFile(new URL(path,root));
const fail=message=>{throw new Error(`Reference readiness audit: ${message}`);};

let pointer=null;
try{pointer=await readJson('data/reference/readiness-current.json');}catch{}
const specPath=pointer?.specPath??'data/reference/readiness-audit-v1.json';
const reportPath=pointer?.reportPath??'data/reference/readiness-report-v1.json';
const markdownPath=pointer?.markdownPath??'docs/REFERENCE_READINESS_REPORT.md';
const spec=await readJson(specPath);
const current=await readJson('data/current.json');
const authoringPolicy=await readJson(spec.baseline.authoringPolicy.path);

const manifestPins=[
  ['candidateBank',current.candidateBank,spec.baseline.candidateBank,'bankVersion'],
  ['worldviewModel',current.worldviewModel,spec.baseline.worldviewModel,'modelVersion'],
  ['sourceLedger',current.worldviewSourceLedger,spec.baseline.sourceLedger,'version'],
  ['affinityCatalog',current.affinityCatalog,spec.baseline.affinityCatalog,'catalogVersion'],
  ['progressiveRoutes',current.progressiveDepth,spec.baseline.progressiveRoutes,'policyVersion']
];
const loaded={};
for(const [name,manifestPin,auditPin,versionField] of manifestPins){
  if(!manifestPin)fail(`data/current.json has no ${name} pin.`);
  if(manifestPin.path!==auditPin.path||manifestPin.version!==auditPin.version)fail(`${name} no longer matches the version-pinned audit baseline; review and version the audit spec before regeneration.`);
  if(manifestPin.sha256&&manifestPin.sha256!==auditPin.sha256)fail(`${name} hash in data/current.json differs from the audit baseline.`);
  const raw=await bytes(auditPin.path);
  if(digest(raw)!==auditPin.sha256)fail(`${name} file hash differs from the audit baseline.`);
  loaded[name]=JSON.parse(raw.toString('utf8'));
  if(loaded[name][versionField]!==auditPin.version)fail(`${name} file version does not match the audit baseline.`);
}
const authoringBytes=await bytes(spec.baseline.authoringPolicy.path);
if(digest(authoringBytes)!==spec.baseline.authoringPolicy.sha256)fail('authoring policy hash differs from the audit baseline.');
if(authoringPolicy.policyVersion!==spec.baseline.authoringPolicy.version)fail('authoring policy version differs from the audit baseline.');

const report=buildReferenceReadinessReport({
  spec,
  model:loaded.worldviewModel,
  bank:loaded.candidateBank,
  routes:loaded.progressiveRoutes,
  affinityCatalog:loaded.affinityCatalog,
  sourceLedger:loaded.sourceLedger,
  authoringPolicy
});
const outputs=[
  [reportPath,JSON.stringify(report,null,2)+'\n'],
  [markdownPath,renderReferenceReadinessMarkdown(report)]
];
const check=process.argv.includes('--check');
for(const [path,content] of outputs){
  let existing;
  try{existing=await readFile(new URL(path,root),'utf8');}catch{}
  if(check){
    if(existing!==content)fail(`${path} is stale. Run npm run reference:readiness to regenerate it.`);
  }else await writeFile(new URL(path,root),content);
}
console.log(`Reference readiness audit ${check?'verified':'generated'}: ${report.summary.candidateCount} candidates; ${Object.entries(report.summary.readinessStates).map(([state,count])=>`${state} ${count}`).join(', ')}.`);
