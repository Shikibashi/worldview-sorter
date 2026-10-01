import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist/pages');
const read=async file=>readFile(path.join(root,file),'utf8');
const json=async file=>JSON.parse(await read(file));
const copied=new Set();
const required=new Set();
const publicCurrentKeys=['candidateBank','pilot','worldviewModel','quizExperience','modelRelease',
 'modelReleaseVersions','affinityCatalog','affinityCatalogVersions','pilotCandidate',
 'localizationCatalog','localizationCatalogVersions','localizationBundles','localizationBundleVersions'];
const allowedModuleDirectories=['apps/quiz/','packages/experience/','packages/runtime/',
 'packages/worldview/','packages/philosophy/','packages/localization/','packages/beta/'];
const publicDocs=['docs/BETA_KNOWN_LIMITATIONS.md','docs/MODEL_CHANGELOG.md',
 'docs/QUIZ_EXPERIENCE.md','docs/RESEARCH_DATA.md'];

function safeFile(file){
 assert.equal(typeof file,'string');
 assert.ok(!path.isAbsolute(file)&&!file.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.')),
  'Unsafe production path: '+file);
 assert.ok(file.startsWith('data/')||file.startsWith('apps/quiz/')||file.startsWith('packages/')||file.startsWith('docs/'),
  'Production path outside public roots: '+file);
 return file;
}
async function copy(file){
 safeFile(file);if(copied.has(file))return;
 const source=path.join(root,file),destination=path.join(output,file);
 await mkdir(path.dirname(destination),{recursive:true});
 await cp(source,destination,{recursive:false,errorOnExist:true});
 copied.add(file);
}
function addRef(ref){
 assert.ok(ref&&typeof ref.path==='string','Missing runtime data reference.');
 assert.ok(ref.path.startsWith('data/')&&ref.path.endsWith('.json'),'Invalid runtime data reference: '+ref.path);
 required.add(safeFile(ref.path));
}
async function copyModule(file){
 safeFile(file);
 assert.ok(file.endsWith('.js')&&allowedModuleDirectories.some(prefix=>file.startsWith(prefix)),
  'Unexpected browser module: '+file);
 if(copied.has(file))return;
 const source=await read(file);
 assert.ok(!/\bimport\s*\(/.test(source),'Dynamic browser import needs explicit production review: '+file);
 await copy(file);
 for(const match of source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)){
  const specifier=match[1];
  assert.ok(specifier.startsWith('.'),'Nonlocal browser import needs explicit production review: '+specifier);
  const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),specifier));
  await copyModule(dependency);
 }
}
async function filesUnder(dir){
 const files=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const absolute=path.join(dir,entry.name);
  if(entry.isDirectory())files.push(...await filesUnder(absolute));
  else {assert.ok(entry.isFile(),'Production artifact contains a non-file: '+absolute);files.push(path.relative(output,absolute).split(path.sep).join('/'));}
 }
 return files.sort();
}
async function verify(expected){
 const actual=await filesUnder(output);
 assert.deepEqual(actual,[...expected].sort(),'Production artifact has missing or unexpected files.');
 for(const file of actual){
  assert.ok(!/(^|\/)(?:apps\/server|apps\/web|\.data|research|governance|scripts|examples|node_modules|artifacts)(\/|$)/.test(file),
   'Private or development surface in production artifact: '+file);
  assert.ok(!file.endsWith('.map')&&!file.endsWith('.env'),'Debug or secret file in production artifact: '+file);
  assert.ok(!/(?:^|\/)(?:ar-draft|es-ES-draft)-v\d+\.json$/.test(file),
   'Unapproved wording draft must not be published: '+file);
 }
 const deployedCurrent=JSON.parse(await readFile(path.join(output,'data/current.json'),'utf8'));
 for(const key of ['localizationBundles','localizationBundleVersions'])
  assert.ok(deployedCurrent[key].every(ref=>ref.locale==='en-US'),
   'Public runtime reference is outside the canonical wording set: '+key);
 const entry=await readFile(path.join(output,'index.html'),'utf8');
 assert.ok(entry.includes('Worldview Sorter')&&entry.includes('src="./apps/quiz/app.js"'),
  'The custom-domain root must open the public quiz.');
 assert.ok(!entry.includes('http://'),'Insecure URL in production entry.');
 const manifest=JSON.parse(await readFile(path.join(output,'deployment.json'),'utf8'));
 assert.equal(manifest.modelReleaseVersion,(await json('data/current.json')).modelRelease.version);
 return {files:actual.length,bytes:(await Promise.all(actual.map(async file=>(await readFile(path.join(output,file))).length))).reduce((a,b)=>a+b,0)};
}

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const current=await json('data/current.json');
const subset={schemaVersion:current.schemaVersion};
for(const key of publicCurrentKeys){assert.ok(current[key]!==undefined,'Missing active runtime reference: '+key);subset[key]=current[key];}
for(const key of ['localizationBundles','localizationBundleVersions'])
 subset[key]=subset[key].filter(ref=>ref.locale==='en-US');
assert.ok(subset.localizationBundles.every(ref=>ref.locale==='en-US')&&
 subset.localizationBundleVersions.every(ref=>ref.locale==='en-US'),
 'The public artifact may include only the canonical wording set.');
for(const key of publicCurrentKeys){
 const value=subset[key];
 for(const ref of Array.isArray(value)?value:[value])addRef(ref);
}
required.add('data/response-scales.json');
for(const ref of current.modelReleaseVersions??[current.modelRelease]){
 const historical=await json(ref.path);
 for(const key of ['bank','pilot']){
  const component=historical.components.find(row=>row.key===key);
  assert.ok(component,'Historical release missing '+key+': '+ref.version);
  addRef(component);
 }
}
const experience=await json(current.quizExperience.path);
for(const ref of [...experience.formPolicies,...(experience.modelPolicies??[])])addRef(ref);
for(const file of required)await copy(file);
await mkdir(path.join(output,'data'),{recursive:true});
await writeFile(path.join(output,'data/current.json'),JSON.stringify(subset,null,2)+'\n');
copied.add('data/current.json');
for(const file of ['apps/quiz/style.css',...publicDocs])await copy(file);
await copyModule('apps/quiz/app.js');
await copyModule('apps/quiz/share-viewer.js');

const release=current.modelRelease.version;
const original=await read('apps/quiz/index.html');
const staticMeta=`<meta name="worldview-static-release" content="${release}">`;
const staticCopy=original.replace('<head>','<head>\n '+staticMeta)
 .replace('Answers stay in this browser unless you export them or explicitly contribute a completed pilot attempt to future research.',
  'Answers stay in this browser unless you export or deliberately share them. This static site does not accept research contributions.');
assert.notEqual(staticCopy,original,'Static entry was not generated.');
const rootEntry=staticCopy.replace('href="./style.css"','href="./apps/quiz/style.css"')
 .replace('src="./app.js"','src="./apps/quiz/app.js"')
 .replace('href="./share.html"','href="./apps/quiz/share.html"');
await mkdir(path.join(output,'apps/quiz'),{recursive:true});
await writeFile(path.join(output,'index.html'),rootEntry);
await writeFile(path.join(output,'apps/quiz/index.html'),staticCopy);
await copy('apps/quiz/share.html');
copied.add('index.html');copied.add('apps/quiz/index.html');
await writeFile(path.join(output,'.nojekyll'),'');
copied.add('.nojekyll');
const model=await json(current.worldviewModel.path);
const deployment={schemaVersion:'worldview-pages-deployment-1',
 gitCommit:process.env.GITHUB_SHA??execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 applicationVersion:(await json('package.json')).version,
 modelReleaseVersion:release,itemBankVersion:current.candidateBank.version,
 worldviewModelVersion:current.worldviewModel.version,routePolicyVersion:current.progressiveDepth.version,
 fullRoutePolicyVersion:current.fullForm.version,instrumentVersion:current.pilotCandidate.version,
 resultContractVersion:model.resultSemanticsVersion,affinityCatalogVersion:current.affinityCatalog.version,
 hosting:'github-pages-static'};
await writeFile(path.join(output,'deployment.json'),JSON.stringify(deployment,null,2)+'\n');
copied.add('deployment.json');
const report=await verify(copied);
console.log(`Production Pages artifact: ${report.files} files, ${report.bytes} bytes at ${path.relative(root,output)}; release ${release}.`);
