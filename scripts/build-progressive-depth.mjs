import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {generatePhilosophyPacket} from '../packages/philosophy/forms.js';

const root=new URL('../',import.meta.url);
const raw=path=>readFile(new URL(path,root));
const read=async path=>JSON.parse(await raw(path));
const write=(path,value)=>writeFile(new URL(path,root),JSON.stringify(value,null,2)+'\n');
const [manifest,bank,pilot,model,full,affinity,prior,current]=await Promise.all([
 read('data/experience/progressive-depth-v1.manifest.json'),read('data/items/candidate-v0.9.json'),
 read('data/pilots/pilot-0.2.json'),read('data/generic/model-v1.0-pilot.json'),
 read('data/philosophy/public-pilot-v1.json'),read('data/affinities/catalog-v1.json'),
 read('data/experience/policy-v1.4.json'),read('data/current.json')]);
const bytes=await raw(manifest.path),policy=JSON.parse(bytes);
assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256,'Progressive route definitions changed in place.');
assert.equal(policy.policyVersion,manifest.policyVersion);
assert.equal(policy.bankVersion,bank.bankVersion);
assert.equal(policy.modelVersion,model.modelVersion);
assert.equal(policy.resultSemanticsVersion,model.resultSemanticsVersion);
assert.equal(policy.instrumentVersion,model.pilotInstrumentVersion);
assert.equal(policy.affinityCatalogVersion,affinity.catalogVersion);
assert.equal(policy.pilotFormPolicyVersion,full.policyVersion);
const frozen=new Map(full.frozenItems.map(ref=>[ref.itemId,ref.itemRevision]));
const routeIds=new Set();let earlier=new Set();
for(const route of policy.routes){
 assert.ok(!routeIds.has(route.id));routeIds.add(route.id);
 assert.equal(route.size,route.itemRefs.length);
 const ids=new Set(route.itemRefs.map(ref=>ref.itemId));assert.equal(ids.size,route.size);
 for(const ref of route.itemRefs)assert.equal(frozen.get(ref.itemId),ref.itemRevision,'Route must use an exact frozen pilot revision.');
 for(const id of earlier)assert.ok(ids.has(id),'Depth routes must be nested: '+id);
 earlier=ids;
 const packet=generatePhilosophyPacket({bank,pilot,policy,seed:'progressive-validation',size:route.size});
 assert.equal(packet.routeId,route.id);
}
assert.deepEqual([...earlier].sort(),[...frozen.keys()].sort(),'Full route must contain the frozen pilot set.');
assert.deepEqual(policy.routes.at(-1).itemRefs,full.frozenItems,'Progressive Full must preserve the frozen pilot order.');
assert.deepEqual(policy.routes.map(r=>r.size),[64,120,238]);
const experience={...prior,experienceVersion:'quiz-1.6.0',routes:[
 {id:'quick',size:64,label:'Quick exploration',description:'64 questions across twelve topics. Many distinctions stay unmeasured.',formPolicyVersion:policy.policyVersion},
 {id:'standard',size:120,label:'Standard exploration',description:'Recommended · 120 questions with broader evidence; deepen later.',formPolicyVersion:policy.policyVersion,recommended:true},
 {id:'full',size:238,label:'Full pilot',description:'238 frozen questions, with the broadest pilot coverage and optional research contribution.',formPolicyVersion:full.policyVersion}
 ],progressivePolicy:{version:policy.policyVersion,path:manifest.path,manifestPath:'data/experience/progressive-depth-v1.manifest.json'},
 formPolicies:[...prior.formPolicies,{version:policy.policyVersion,path:manifest.path}]};
await write('data/experience/policy-v1.5.json',experience);
current.quizExperience={version:experience.experienceVersion,path:'data/experience/policy-v1.5.json',entrypoint:'apps/quiz/index.html'};
current.progressiveDepth={version:policy.policyVersion,path:manifest.path,manifestPath:'data/experience/progressive-depth-v1.manifest.json'};
await write('data/current.json',current);
let readme=await readFile(new URL('README.md',root),'utf8');
readme=readme.replace('80/120/160/238-question routes','64/120/238-question depth routes');
readme=readme.replace('The follow-up planner identifies missing real questionnaire items; it is not calibrated adaptive testing and is not yet wired into the public interface.',
 'The follow-up planner identifies missing reviewed items and is available as optional domain clarification; it is not calibrated adaptive testing.');
readme=readme.replace('Every route asks multiple relevant questions for each facet rather than hoping proportional random sampling does so.',
 'The active routes state their exact authored evidence opportunities; shorter routes leave many facets and propositions unmeasured.');
readme=readme.replace('## 240-question full route\n\nChoose **The full exploration** for 240 assigned questions from the existing academic bank. Shorter routes remain available and saved quizzes retain their original versions.',
 '## Full and historical routes\n\nThe active Full route uses the frozen 238-question pilot. Earlier 240-item and 80/120/160-item releases remain available for replaying saved quizzes.');
readme=readme.replace('unless the user exports them or explicitly opts into a future research contribution.',
 'unless the user exports them or explicitly opts into an eligible fresh Full-pilot research contribution.');
if(!readme.includes('docs/PROGRESSIVE_DEPTH.md'))readme+='\n[Progressive depth route purposes and limits](docs/PROGRESSIVE_DEPTH.md).\n';
if(!readme.includes('docs/ENGAGEMENT_SHARING.md'))readme+='\n[Optional exploration, sharing, and historical snapshot limits](docs/ENGAGEMENT_SHARING.md).\n';
await writeFile(new URL('README.md',root),readme);
let guide=await readFile(new URL('docs/QUIZ_EXPERIENCE.md',root),'utf8');
guide=guide.replace('four clearly labeled routes (80/120/160/238 questions)',
 'three clearly labeled depth routes (64/120/238 questions)');
guide=guide.replace('The shorter route is a smaller sample, not a validated short form.',
 'Quick and Standard are authored subsets of the frozen pilot, not validated short forms. They intentionally leave more propositions unmeasured; users can keep their result, clarify a domain, or continue without repeating compatible answers. See [the depth-route contract](PROGRESSIVE_DEPTH.md).');
guide=guide.replace('the current interface is `quiz-1.5.0`','the current interface is `quiz-1.6.0`');
guide=guide.replace('Sharing is opt-in. The user selects up to six resolved/mixed patterns, sees the exact text, and separately presses Copy. The preview omits raw questions/answers, timings, session IDs, seeds and game state. Its research-informed/exploratory qualification and bank/model versions remain attached. A shared pattern can still reveal a personal belief, so nothing is selected automatically. Summary export and raw-answer export are separate, deliberate actions.',
 'Sharing is opt-in. The user chooses an overview, domain, affinity or exploration snapshot, inspects its exact text, then deliberately copies or downloads it. Versioned snapshot JSON has an accessible local file viewer and SVG has a text equivalent. No result is automatically published. The projection excludes raw answers, session IDs, research consent and account data. The recipient may still learn sensitive beliefs from the selected text. See [engagement and sharing boundaries](ENGAGEMENT_SHARING.md).');
guide=guide.replace('Possible later additions include collectible topic cards, an optional reading trail, cosmetic themes and user-initiated comparison of selected patterns.',
 'The public client now provides optional source trails, neutral activity milestones, and user-initiated doctrine comparisons. Possible later additions include cosmetic themes and selected-pattern comparison.');
await writeFile(new URL('docs/QUIZ_EXPERIENCE.md',root),guide);
let fullGuide=await readFile(new URL('docs/FULL_ROUTE.md',root),'utf8');
fullGuide=fullGuide.replace('The 80, 120, and 160-question releases remain available.',
 'The earlier 80, 120, and 160-question releases remain available for historical replay; the current chooser offers authored 64/120 and frozen 238 depth routes.');
await writeFile(new URL('docs/FULL_ROUTE.md',root),fullGuide);
console.log('Historical progressive-depth 1.0 routes:',policy.routes.map(r=>r.id+' '+r.size).join(', '));
