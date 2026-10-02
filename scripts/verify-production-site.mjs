import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'dist/pages');
const read=async file=>readFile(path.join(site,file),'utf8');
const json=async file=>JSON.parse(await read(file));
async function inventory(dir){
 const output=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const absolute=path.join(dir,entry.name),stat=await lstat(absolute);
  assert.ok(!stat.isSymbolicLink(),'Symlink in Pages artifact: '+absolute);
  if(stat.isDirectory())output.push(...await inventory(absolute));
  else {assert.ok(stat.isFile(),'Non-file in Pages artifact: '+absolute);output.push(path.relative(site,absolute).split(path.sep).join('/'));}
 }
 return output;
}
const files=await inventory(site),fileSet=new Set(files);
for(const file of ['index.html','apps/quiz/share-viewer.js','apps/quiz/share.html','apps/quiz/style.css',
 'data/current.json','data/response-scales.json','deployment.json','.nojekyll'])
 assert.ok(fileSet.has(file),'Missing public asset: '+file);
assert.ok(files.some(file=>/^assets\/[A-Za-z0-9_-]+\.js$/.test(file)),'Missing the bundled public application module.');
assert.ok(files.some(file=>/^assets\/[A-Za-z0-9_-]+\.css$/.test(file)),'Missing the bundled public application stylesheet.');
for(const file of files){
 assert.ok(file==='.nojekyll'||/^(?:index\.html|deployment\.json|assets\/[A-Za-z0-9_-]+\.(?:js|css|woff2|woff)|apps\/quiz\/|packages\/(?:runtime|experience|worldview|philosophy|localization|beta)\/|data\/(?:current\.json|response-scales\.json|items\/|pilots\/|generic\/|philosophy\/|experience\/|affinities\/|localization\/|releases\/)|docs\/)/.test(file),
  'Unapproved Pages path: '+file);
 assert.ok(!/(?:^|\/)(?:apps\/server|apps\/web|\.data|research|governance|scripts|examples|node_modules|artifacts)(?:\/|$)/.test(file),
  'Private or development path in Pages artifact: '+file);
 assert.ok(!/\.(?:env|map|toml|sqlite|db)$/.test(file),'Private or debug file in Pages artifact: '+file);
}
const current=await json('data/current.json'),experience=await json(current.quizExperience.path);
for(const ref of current.modelReleaseVersions??[current.modelRelease]){
 const release=await json(ref.path);
 for(const key of ['bank','pilot']){
  const component=release.components.find(row=>row.key===key);
  assert.ok(component&&fileSet.has(component.path),'Missing historical '+key+' for '+ref.version);
 }
}
for(const value of Object.values(current))for(const ref of Array.isArray(value)?value:[value])
 if(ref&&typeof ref==='object'&&typeof ref.path==='string')assert.ok(fileSet.has(ref.path),'Missing current release data: '+ref.path);
for(const ref of [...experience.formPolicies,...(experience.modelPolicies??[])])
 assert.ok(fileSet.has(ref.path),'Missing historical route or model: '+ref.path);
const rootHtml=await read('index.html');
assert.ok(rootHtml.includes('<div id="root"></div>')&&
 /<script[^>]+type="module"[^>]+src="\.\/assets\/[^\"]+\.js"/.test(rootHtml)&&
 rootHtml.includes('Worldview Sorter'),'Root does not open the bundled quiz.');
assert.ok(rootHtml.includes(`name="worldview-static-release" content="${current.modelRelease.version}"`),'Static release marker missing.');
assert.ok(!fileSet.has('apps/quiz/index.html')&&!fileSet.has('apps/quiz/app.js'),
 'The legacy public application entry leaked into Pages.');
assert.ok(!rootHtml.includes('http://'),'Insecure production link.');
const deployment=await json('deployment.json');
assert.equal(deployment.modelReleaseVersion,current.modelRelease.version);
assert.equal(deployment.worldviewModelVersion,current.worldviewModel.version);
assert.equal(deployment.itemBankVersion,current.candidateBank.version);
assert.equal(deployment.affinityCatalogVersion,current.affinityCatalog.version);
if(process.env.GITHUB_SHA)assert.equal(deployment.gitCommit,process.env.GITHUB_SHA,'Artifact commit differs from checked-out commit.');
console.log(`Verified static Pages artifact: ${files.length} approved files, commit ${deployment.gitCommit}.`);
