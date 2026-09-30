import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {validateLocalizationCatalog,validateLocalizationBundle} from '../packages/localization/index.js';

const root=new URL('../',import.meta.url),raw=path=>readFile(new URL(path,root));
const json=async path=>JSON.parse(await raw(path));
const write=async(path,value)=>writeFile(new URL(path,root),JSON.stringify(value,null,2)+'\n');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const current=await json('data/current.json');
const [catalog,bank,scalesDoc,model,affinityCatalog,experience]=await Promise.all([
 json('data/localization/catalog-v1.json'),json(current.candidateBank.path),json('data/response-scales.json'),
 json(current.worldviewModel.path),json(current.affinityCatalog.path),json(current.quizExperience.path)]);
validateLocalizationCatalog(catalog,{bank,model,affinityCatalog});
const bundles=[];
for(const row of catalog.locales){const bundle=await json(row.path);
 validateLocalizationBundle(bundle,{catalog,bank,scalesDoc,model,affinityCatalog});bundles.push(bundle);}
const hashes=Object.fromEntries(await Promise.all(['data/localization/catalog-v1.json','data/localization/terminology-review-v1.json',...catalog.locales.map(row=>row.path)]
 .map(async path=>[path,sha(await raw(path))])));
const manifestPath='data/localization/manifest-v1.json';
const manifest={schemaVersion:'worldview-localization-manifest-1',catalogVersion:catalog.catalogVersion,hashes};
let previous=null;try{previous=await json(manifestPath);}catch(error){if(error.code!=='ENOENT')throw error;}
if(previous)assert.deepEqual(previous,manifest,'Localization release changed in place; create a new catalog and bundle version.');
else await write(manifestPath,manifest);
const nextExperience={...experience,experienceVersion:'quiz-1.7.0',localizationCatalogVersion:catalog.catalogVersion,
 localizationCatalogPath:'data/localization/catalog-v1.json'};
await write('data/experience/policy-v1.6.json',nextExperience);
current.quizExperience={version:nextExperience.experienceVersion,path:'data/experience/policy-v1.6.json',entrypoint:'apps/quiz/index.html'};
current.localizationCatalog={version:catalog.catalogVersion,path:'data/localization/catalog-v1.json',manifestPath};
current.localizationCatalogVersions=[...new Map([...(current.localizationCatalogVersions??[]),current.localizationCatalog]
 .map(ref=>[ref.version,ref])).values()];
current.localizationBundles=[...new Map([...(current.localizationBundles??[]),...catalog.locales.map(row=>({locale:row.locale,version:row.bundleVersion,path:row.path}))]
 .map(ref=>[ref.version,ref])).values()];
await write('data/current.json',current);
let guide=(await raw('docs/QUIZ_EXPERIENCE.md')).toString();
guide=guide.replace('the current interface is `quiz-1.6.0`','the current interface is `quiz-1.7.0`');
if(!guide.includes('LOCALIZATION.md'))guide+='\n## Localization release gate\n\nThe canonical English route is available; Spanish and Arabic are review targets. No unapproved translated philosophical question is served. See [localization architecture and review gaps](LOCALIZATION.md).\n';
await writeFile(new URL('docs/QUIZ_EXPERIENCE.md',root),guide);
let readme=(await raw('README.md')).toString();
if(!readme.includes('docs/LOCALIZATION.md'))readme+='\n[Localization architecture and review gates](docs/LOCALIZATION.md).\n';
await writeFile(new URL('README.md',root),readme);
console.log('Localization release:',catalog.catalogVersion,'approved locales:',bundles.filter(bundle=>bundle.status==='approved').map(bundle=>bundle.locale).join(', '));
