import './build-academic-core.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const write=async(p,v)=>writeFile(new URL(p,root),JSON.stringify(v,null,2)+'\n');
const bank=await read('data/items/candidate-v0.9.json');
const audit=await read('data/academic/contrast-audit-v0.9.json');
// Hash final records after all provenance and target normalizations.
for(const e of audit.itemRevisionChanges) {
  e.afterHash=createHash('sha256').update(JSON.stringify(bank.items.find(i=>i.id===e.itemId))).digest('hex');
}
await write('data/academic/contrast-audit-v0.9.json',audit);
const report=await read('data/academic/release-v0.9.json');
const outputs=await read('data/academic/build-output.json');
const appPath='apps/web/app.js';
let app=await readFile(new URL(appPath,root),'utf8');
// The existing runner rendered a question but left its screen hidden.
app=app.replace('  questionShownAt = performance.now();\n  renderQuestion();\n  saveLocal();',
  '  questionShownAt = performance.now();\n  renderQuestion();\n  show("question-screen");\n  saveLocal();');
await writeFile(new URL(appPath,root),app);
const readme=`# Worldview Sorter\n\nTwelve interface domains, not twelve forced bipolar latent traits.\n\n## Current release\n\nCandidate bank **${report.version}** contains **${report.itemCount} original candidate items**. The registry has **${report.registryEntries} permanent entries**, of which **${report.activeConstructCount} are active**. One bundled legacy ontology construct is deprecated, not silently redefined.\n\nThis academic update adds ${report.newConstructCount} distinctions and ${report.newItemCount} items. Its ${report.academicSourceCount}-entry source ledger distinguishes reviewed scholarly text, abstracts, and metadata-only references. These sources support conceptual distinctions; they do not validate the new questionnaire.\n\nSee [academic rationale](docs/ACADEMIC_GROUNDING.md), [item/source matrix](research/academic/CONSTRUCT_SOURCE_MATRIX.md), and [matching contract](docs/PROFILE_MATCHING.md).\n\n## Run\n\n\`\`\`bash\nnpm run build:academic\nnpm test\nnpm run server:start\n\`\`\`\n\nThe development runner is served at http://127.0.0.1:4173/apps/web/. Do not expose a research-data deployment publicly without a deployment/security review.\n\n## Evidence, not identity guessing\n\nThe nine reference comparisons consume exact item IDs, revisions and raw response states. No political centroid, categorical numeric proxy, chat memory, preferred identity, or personality/country resemblance supplies missing answers. Neutral, no view, disagreement and mixed evidence remain distinct. There is no forced winner, match percentage, or automatically assigned identity.\n\nThe comparisons and engineering scores remain **unvalidated and non-interpretable**. The browser does not display them as worldview results. The follow-up planner identifies missing real questionnaire items; it is not calibrated adaptive testing and is not yet wired into the public interface.\n\n## History\n\nThe 0.8 bank and instrument remain byte-for-byte frozen. New wording or targeting receives a new item revision. The 0.1 registry is archived; new observations use registry 0.2. Sources, release manifests, reference criteria and resulting comparisons are versioned independently.\n\n## Commands\n\n- \`npm run test:profiles\`: academic contrast and evidence-integrity regressions.\n- \`npm run test:collection\`: collector integration tests.\n- \`npm run test:12axes\`: packet and interaction-contract tests, not visual browser verification.\n- \`npm run test:ui-smoke\`: executes the app against a small DOM harness; not a real-browser accessibility/layout audit.\n- \`npm run pilot:packet -- --seed example --size 120\`: administration packet.\n\nNo participant responses or empirical item parameters were fabricated. Published MFQ-2, PVQ-RR, Free Will Inventory and Oxford Utilitarianism Scale validation does not transfer to this project's original items.\n`;
await writeFile(new URL('README.md',root),readme);
outputs.paths=[...new Set([...outputs.paths,'README.md',appPath])].sort();
await write('data/academic/build-output.json',outputs);
