import assert from 'node:assert/strict';
import {readFile, writeFile, access} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const text = p => readFile(new URL(p, root), 'utf8');
const read = async p => JSON.parse(await text(p));
const write = (p,v) => writeFile(new URL(p, root), typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');
const outputs = await read('data/academic/build-output.json');
const paths = new Set(outputs.paths);

// New ordering is versioned through the new pilot configuration. Historical
// v0.8 packets retain the original algorithm for exact seed replay.
const pilotPath = 'data/pilots/pilot-0.2.json';
const pilot = await read(pilotPath);
pilot.administration.packetOrdering = 'constraint-search-v1';
pilot.administration.maxSameDomainConsecutive = 2;
await write(pilotPath,pilot);
paths.add(pilotPath);

const runtimePath = 'packages/runtime/index.js';
const legacyPath = 'packages/runtime/legacy-v0.8.js';
let runtime = await text(runtimePath);
try { await access(new URL(legacyPath,root)); }
catch {
  assert.ok(!runtime.includes('orderSelectedItems'), 'Cannot archive modified runtime as a historical implementation');
  await write(legacyPath,runtime);
}
paths.add(legacyPath);
if (!runtime.includes("import {orderSelectedItems}")) {
  runtime = "import {orderSelectedItems} from './packet-ordering.js';\n" + runtime;
  const marker = '  while (remaining.size) {';
  assert.equal(runtime.split(marker).length,2,'Expected one ordering loop');
  runtime = runtime.replace(marker,
    "  // New releases cannot silently relax the hard run constraint.\n"+
    "  if (pilot.administration.packetOrdering === 'constraint-search-v1') {\n"+
    "    ordered.push(...orderSelectedItems({items:[...selected.values()], seed, maxSameDomainConsecutive}));\n"+
    "    remaining.clear();\n"+
    "  }\n\n"+marker);
}
await write(runtimePath,runtime);
paths.add(runtimePath);

const supplement = {
  schemaVersion:'1.0.0', version:'0.9.0', reviewedOn:'2026-09-28',
  purpose:'Additional methodological criticism, not new validated items or participant data.',
  measurementClaim:'explicit_reported_endorsement_not_implicit_commitment',
  sources:[
    {id:'acad-bush-moss-2020', authors:['Lance S. Bush','David Moss'],
      title:'Misunderstanding Metaethics: Difficulties Measuring Folk Objectivism and Relativism',
      url:'https://doi.org/10.33392/diam.1495', year:2020,
      evidenceType:'peer_reviewed_methodological_critique', access:'publisher_abstract_reviewed',
      implication:'Selecting a response can reflect an unintended interpretation rather than the construct the author intended.'},
    {id:'acad-yang-2026', authors:['Qiongda Yang'],
      title:'Driving the Chariot North: How Experimental Metaethics Has Gone South with Error Theory and Non-Cognitivism',
      url:'https://doi.org/10.1007/s13164-026-00835-x', year:2026,
      evidenceType:'peer_reviewed_methodological_critique', access:'full_html_text_reviewed',
      locator:'Sections 4–7: explicit endorsement versus implicit commitment and expressivism versus truth-aptness',
      implication:'Do not infer that ordinary truth or disagreement language uniquely establishes realism; expressivists may accommodate such language. This is a critique, not a settled consensus.'}
  ],
  constraints:[
    'Evidence compares what respondents explicitly endorse under the actual wording; it does not diagnose an unconscious or implicit philosophy.',
    'Moral objectivity is not the named Randian system Objectivism.',
    'Truth-aptness alone cannot identify moral realism or rule out all forms of expressivism.',
    'No single answer, preferred identity, political result, or chat memory determines the result.',
    'Source-backed concepts do not establish validity, factor structure, reliability, or calibrated thresholds for new questionnaire items.'
  ]
};
const supplementPath='data/academic/methodology-supplement-v0.9.json';
await write(supplementPath,supplement); paths.add(supplementPath);
const current=await read('data/current.json');
current.academicSupplement={version:'0.9.0',path:supplementPath};
await write('data/current.json',current); paths.add('data/current.json');

const profilePath=current.profileCatalog.path;
const catalog=await read(profilePath);
for (const profile of catalog.profiles) {
  const caveat='This comparison concerns explicitly reported endorsements, not a diagnosis of implicit metaethical commitments.';
  if (!profile.limitations.includes(caveat)) profile.limitations.push(caveat);
}
await write(profilePath,catalog); paths.add(profilePath);

const docPath='docs/METAETHICAL_MEASUREMENT_LIMITS.md';
const doc=`# What the academic comparison does and does not measure\n\nThe instrument compares explicit endorsements of original propositions. It does not claim to uncover an implicit philosophical identity hidden behind ordinary moral speech. This distinction matters especially for error theory and modern expressivism.\n\nPölzler and Wright propose more differentiated response tasks to address gaps in earlier folk-metaethical measures ([2020, DOI](https://doi.org/10.1007/s13164-019-00447-8)). Bush and Moss challenge the assumption that participants understand such questions in the intended metaethical terms ([2020, DOI](https://doi.org/10.33392/diam.1495), publisher abstract reviewed). Yang argues that the predictions of traditional theories about ordinary speakers differ from those speakers explicitly endorsing the theories ([2026, sections 4–7](https://doi.org/10.1007/s13164-026-00835-x), full HTML text reviewed). These are live methodological disputes, not an established universal classifier.\n\nAccordingly, the matcher requires multiple distinct exact item responses, retains mixed evidence, and never derives identity from a political centroid. Agreeing that moral statements can be true does not uniquely establish realism or exclude sophisticated expressivism. In particular, lower-case moral objectivism is not the named philosophical system Objectivism.\n\nThe 25-entry source ledger supports the original construct definitions. The two additional critiques are recorded separately in the methodology supplement rather than being presented as validation of the item bank. No interview, pilot population, reliability coefficient, or empirical parameter has been fabricated.\n\n## Engineering corrections\n\nThe larger bank exposed a greedy ordering failure: a packet could end with too many items of the same domain. The new pilot uses versioned constraint-search ordering, including dependency checks and residual domain capacity, and fails explicitly if constraints cannot be satisfied. The old pilot keeps its original packet generator for reproducibility. Synthetic simulations test software behavior only; they are not participant validation.\n`;
await write(docPath,doc); paths.add(docPath);
let readme=await text('README.md');
if (!readme.includes('## Additional measurement limits')) {
  readme+='\n## Additional measurement limits\n\nSee [methodological disagreements and explicit-endorsement limits](docs/METAETHICAL_MEASUREMENT_LIMITS.md), including a 2026 critique of folk-metaethical classification. A new versioned packet-ordering algorithm fixes a regression exposed by the expanded bank while preserving historical v0.8 packet replay.\n';
}
await write('README.md',readme); paths.add('README.md');
outputs.paths=[...paths].sort();
await write('data/academic/build-output.json',outputs);
