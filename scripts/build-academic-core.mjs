import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changed = new Set();
const raw = p => readFile(path.join(root, p), 'utf8');
const read = async p => JSON.parse(await raw(p));
const exists = async p => { try { await access(path.join(root,p)); return true; } catch { return false; } };
const write = async (p, text) => {
  await mkdir(path.dirname(path.join(root,p)), {recursive:true});
  if (!(await exists(p)) || await raw(p) !== text) await writeFile(path.join(root,p), text);
  changed.add(p);
};
const json = (p, value) => write(p, JSON.stringify(value,null,2)+'\n');
const hash = text => createHash('sha256').update(text).digest('hex');
const clone = value => structuredClone(value);

// Normalize verified author metadata in the first authored draft. This is
// idempotent; generated citations and the committed source module agree.
const specPath = 'data/academic/additions-v0.9.mjs';
const originalSpec = await raw(specPath);
const correctedSpec = originalSpec
  .replace('Michael R. James: Promises','Allen Habib: Promises')
  .replace('Sam Cowling: Nominalism in Metaphysics','Sam Cowling & Daniel Giberman: Nominalism in Metaphysics')
  .replace("'measurement_methodology', 'abstract_reviewed'", "'measurement_methodology', 'publisher_metadata_only'");
await write(specPath, correctedSpec);
const {release, sources, additions, antiInferences} = await import(pathToFileURL(path.join(root,specPath)));
const {referenceProfiles, unresolvedAudit} = await import(pathToFileURL(path.join(root,'data/academic/references-v0.9.mjs')));
assert.equal(additions.length,30);
assert.equal(sources.length,25);
const sourceMap = new Map(sources.map(s => [s.id,s]));
assert.equal(sourceMap.size,sources.length);
const baseBankPath = 'data/items/candidate-v0.8.json';
const baseInstrumentPath = 'data/instruments/research-pool-0.8.json';
const frozenBefore = {[baseBankPath]:hash(await raw(baseBankPath)), [baseInstrumentPath]:hash(await raw(baseInstrumentPath))};
const baseBank = await read(baseBankPath);
assert.equal(baseBank.bankVersion, '0.8.0');
assert.equal(baseBank.items.length,472);

async function archive(source, destination, expectedRegistry) {
  if (!(await exists(destination))) {
    const text = await raw(source);
    if (expectedRegistry) assert.equal(JSON.parse(text).registryVersion, expectedRegistry, 'Refusing to archive a changed registry as an older release');
    await write(destination,text);
  } else changed.add(destination);
  return read(destination);
}
const registry = await archive('data/constructs.json','data/registries/constructs-v0.1.json','0.1.0');
const relationships = await archive('data/relationships.json','data/registries/relationships-v0.1.json','0.1.0');
const domains = await archive('data/domains.json','data/registries/domains-v0.1.json','0.1.0');
const originalSources = await archive('data/sources.json','data/registries/sources-pre-academic.json');
const oldCurrent = await archive('data/current.json','data/registries/current-pre-academic.json');
const bank = clone(baseBank);
bank.bankVersion = release.version;
bank.purpose = 'Academic contrast bank: original unvalidated candidate items; no identity or population score follows from item counts.';
const edits = [];
const edit = (id, patch, reason) => {
  const item = bank.items.find(i=>i.id===id);
  assert.ok(item, 'Missing historical item '+id);
  const before = clone(item);
  Object.assign(item, patch);
  item.revision = before.revision + 1;
  item.provenance.sourceRefs = [...new Set([...item.provenance.sourceRefs,'acad-polzler-2018'])];
  edits.push({itemId:id,fromRevision:before.revision,toRevision:item.revision,reason,beforeHash:hash(JSON.stringify(before)),afterHash:hash(JSON.stringify(item))});
};
edit('MEI005', {
  text: 'Consider the claim that deceiving someone for amusement is morally wrong. Which description best fits your understanding of this kind of moral claim?',
  options:[
    {id:'independent_fact',label:'It can describe a moral fact independent of anyone’s approval.'},
    {id:'individual_relative',label:'It can be true or false relative to an individual’s standards.'},
    {id:'culture_relative',label:'It can be true or false relative to a cultural framework.'},
    {id:'error_theory',label:'It purports to state a fact, but affirmative claims of moral rightness or wrongness are systematically false.'},
    {id:'not_truth_apt',label:'It primarily expresses an attitude or prescription rather than asserting a literal truth.'},
    {id:'other',label:'None of these descriptions fits my view.'}
  ]
}, 'Separate truth-aptness, stance-independence, relative truth and error theory. Do not say both P and not-P are false.');
edit('MEI019', {
  text:'When someone calls an action morally wrong, can that claim be literally true or false even if its correctness depends on a person’s or group’s standards?',
  options:[
    {id:'yes',label:'Yes; depending on a standard does not prevent a claim from having a truth value.'},
    {id:'sometimes',label:'Some such claims have truth values, but others primarily express attitudes.'},
    {id:'no',label:'No; I understand such moral utterances as expressions or prescriptions, not literal factual claims.'},
    {id:'other',label:'None of these descriptions fits my view.'}
  ]
}, 'Truth-aptness must not be equated with stance-independent truth. This diagnostic distinction remains provisional.');
edit('OMI003', {
  text:'At least some numbers exist as abstract objects independently of anyone representing them.',
  targets:[{constructId:'OM11',relation:'diagnostic',role:'primary'}]
}, 'Remove the bundle of numbers, properties and universals; assess abstract objects separately.');
bank.items.find(i=>i.id==='OMI003').provenance.sourceRefs = ['acad-nominalism','acad-marschall'];

const registryIds = new Set(registry.constructs.map(c=>c.id));
const itemIds = new Set(bank.items.map(i=>i.id));
const counters = {};
const evidenceMap = {};
const outputModes = {monopolar:'independent_meter',affinity:'affinity_card',categorical:'branch_classification'};
for (const c of additions) {
  assert.ok(!registryIds.has(c.id),'Reused construct ID '+c.id);
  registryIds.add(c.id);
  assert.equal(c.items.length,3);
  assert.ok(c.sourceIds.every(id=>sourceMap.has(id)),c.id+' has an unresolved academic source');
  registry.constructs.push({id:c.id,domainId:c.domainId,name:c.name,type:c.type,tier:'primary',description:c.scope,candidateItemTarget:3,outputMode:outputModes[c.type],evidenceBasis:c.sourceIds,prerequisites:[],measurementStatus:'provisional',directlyScored:true});
  evidenceMap[c.id] = [];
  for (const [polarity,text] of c.items) {
    assert.ok(polarity===1 || polarity===-1);
    const n = counters[c.domainId] ?? 100;
    counters[c.domainId] = n+1;
    const id = c.domainId+'I'+String(n).padStart(3,'0');
    assert.ok(!itemIds.has(id),'Reused item ID '+id);
    itemIds.add(id);
    assert.ok(text.trim().split(/\s+/u).length<=45,id+' is too long');
    const relation = c.type==='categorical' ? 'diagnostic' : polarity===1 ? 'positive' : 'negative';
    bank.items.push({id,revision:1,domainId:c.domainId,text,responseType:'likert',responseScaleId:'agreement5',status:'candidate',contentKind:'principle',targets:[{constructId:c.id,relation,role:'primary'}],options:[],mirrorGroup:null,scenarioGroup:null,eligibility:{mode:'always'},specialStates:['no_view','not_understood'],contentTags:['academic_contrast',c.id.toLowerCase()],provenance:{origin:'original_project_draft',sourceRefs:c.sourceIds,license:{status:'undecided',spdx:null},copiedText:false},notes:'Original candidate indicator. Direction is theoretical metadata, not an estimated loading. '+c.scope});
    evidenceMap[c.id].push({itemId:id,itemRevision:1,polarity});
  }
}
assert.equal(bank.items.length,562);
registry.registryVersion = release.registryVersion;
const bundledOntology = registry.constructs.find(c=>c.id==='OM03');
assert.ok(bundledOntology);
bundledOntology.measurementStatus = 'deprecated'; // Preserve identity and historical definition.
const active = registry.constructs.filter(c=>c.measurementStatus!=='deprecated');
assert.equal(registry.constructs.length,182);
await json('data/registries/constructs-v0.2.json',registry);
await json('data/constructs.json',registry);
relationships.registryVersion = release.registryVersion;
for (const [a,b,rationale] of antiInferences) {
  assert.ok(registryIds.has(a)&&registryIds.has(b));
  relationships.rules.push({id:'ACA-'+String(relationships.rules.length+1).padStart(3,'0'),type:'anti_inference',constructs:[a,b],rationale});
}
await json('data/registries/relationships-v0.2.json',relationships);
await json('data/relationships.json',relationships);
domains.registryVersion = release.registryVersion;
await json('data/domains.json',domains);
const updatedSources = clone(originalSources);
for (const s of sources) {
  assert.ok(!updatedSources.sources.some(x=>x.id===s.id));
  updatedSources.sources.push({id:s.id,kind:'academic',title:s.title,url:s.url,use:s.locator,evidenceType:s.evidenceType,access:s.access,reviewedOn:release.reviewedOn,reuse:s.itemReuse});
}
await json('data/sources.json',updatedSources);
await json('data/items/candidate-v0.9.json',bank);
const instrument = await read(baseInstrumentPath);
Object.assign(instrument,{instrumentVersion:'0.9.0-research',registryVersion:'0.2.0',bankVersion:'0.9.0',nominalPoolSize:bank.items.length,purpose:bank.purpose,entries:bank.items.map((i,index)=>({index,itemId:i.id,itemRevision:i.revision}))});
await json('data/instruments/research-pool-0.9.json',instrument);
const pilot = await read('data/pilots/pilot-0.1.json');
Object.assign(pilot,{pilotId:'pilot-0.2',bankVersion:'0.9.0',sourceInstrumentVersion:'0.9.0-research'});
pilot.scoring.defaultEngineeringModelVersion = 'engineering-keyed-0.2';
await json('data/pilots/pilot-0.2.json',pilot);
const scoring = await read('data/scoring/engineering-keyed-v0.1.json');
Object.assign(scoring,{modelVersion:'engineering-keyed-0.2',compatibleBankVersions:['0.9.0'],compatibleInstrumentVersions:['0.9.0-research']});
scoring.limitations.push('Categorical, derived and deprecated constructs are not numeric scales. Profile comparisons use exact raw item evidence, never these engineering means.');
await json('data/scoring/engineering-keyed-v0.2.json',scoring);
const template = await read('data/calibration/item-parameters.template.json');
Object.assign(template,{calibrationVersion:'template-0.2',bankVersion:'0.9.0',items:bank.items.map(i=>({itemId:i.id,itemRevision:i.revision,informationScore:null,eligibleForShortForm:false,discrimination:null,thresholds:null,difFlags:[],localDependenceFlags:[],qualityFlags:[],notes:null}))});
await json('data/calibration/item-parameters-v0.9.template.json',template);
const shortPolicy = await read('data/short-forms/policy-v0.1.json');
Object.assign(shortPolicy,{policyVersion:'0.2.0',sourceBankVersion:'0.9.0'});
await json('data/short-forms/policy-v0.2.json',shortPolicy);
const example = await archive('examples/pilot-session.example.json','examples/archive/pilot-session-v0.8.example.json');
Object.assign(example,{pilotId:'pilot-0.2',bankVersion:'0.9.0',instrumentVersion:'0.9.0-research'});
for (const row of [...example.presentedItems,...example.responses]) row.itemRevision = bank.items.find(i=>i.id===row.itemId).revision;
await json('examples/pilot-session.example.json',example);

const byItem = new Map(bank.items.map(i=>[i.id,i]));
const profiles = referenceProfiles.map(p=>({
  ...p,
  criteria:p.criteria.map(q=>{
    let evidence;
    let sourceIds;
    if (q.constructId) {
      const c = additions.find(c=>c.id===q.constructId);
      assert.ok(c,'Unknown profile construct '+q.constructId);
      sourceIds = c.sourceIds;
      evidence = evidenceMap[q.constructId].map(e=>{
        const sign = e.polarity*(q.expected==='endorse'?1:-1);
        return {itemId:e.itemId,itemRevision:e.itemRevision,support:sign===1?[1,2]:[-2,-1],oppose:sign===1?[-2,-1]:[1,2]};
      });
    } else {
      sourceIds = p.sourceIds;
      evidence = q.existingItems.map(e=>{
        assert.ok(byItem.has(e.itemId));
        return {...e,itemRevision:byItem.get(e.itemId).revision};
      });
    }
    return {id:q.id,constructId:q.constructId??null,expected:q.expected??'specified_responses',essential:q.essential,minimumIndependentItems:2,sourceIds,evidence};
  })
}));
const catalog = {schemaVersion:'2.0.0',catalogVersion:'0.2.0',bankVersion:'0.9.0',registryVersion:'0.2.0',status:'prototype',identityOutputAllowed:false,interpretationAllowed:false,profiles};
await json('data/profiles/catalog-v0.2.json',catalog);
await json('data/profiles/evidence-map-v0.2.json',{schemaVersion:'2.0.0',probeSetVersion:'0.2.0',bankVersion:'0.9.0',status:'original_candidates_not_validated',constructItems:evidenceMap});
await json('data/profiles/matching-policy-v0.2.json',{schemaVersion:'2.0.0',policyVersion:'0.2.0',forceBestMatch:false,allowAbstention:true,percentageMatchAllowed:false,identityOutputAllowed:false,scoredEvidenceAllowed:false,neutralHandling:'recorded_but_not_directional',missingHandling:'unresolved',conflictingHandling:'mixed_without_averaging',referenceScope:'only_explicitly_measured_commitments',thresholdStatus:'authored_engineering_rule_not_calibrated'});
await json('data/academic/contrast-audit-v0.9.json',{...release,unresolvedAudit,supersessions:[{legacyConstructId:'OM03',replacementConstructIds:['OM11','OM12'],historicalScoresConvertible:false}],itemRevisionChanges:edits});
const current = clone(oldCurrent);
Object.assign(current,{
  registryVersion:'0.2.0',candidateBank:{version:'0.9.0',path:'data/items/candidate-v0.9.json'},
  instrument:{version:'0.9.0-research',path:'data/instruments/research-pool-0.9.json'},
  pilot:{version:'pilot-0.2',path:'data/pilots/pilot-0.2.json'},
  engineeringScoringModel:{version:'engineering-keyed-0.2',path:'data/scoring/engineering-keyed-v0.2.json'},
  calibrationTemplate:{version:'template-0.2',path:'data/calibration/item-parameters-v0.9.template.json'},
  shortFormPolicy:{version:'0.2.0',path:'data/short-forms/policy-v0.2.json'},
  profileCatalog:{version:'0.2.0',path:'data/profiles/catalog-v0.2.json'},
  profileProbeSet:{version:'0.2.0',path:'data/profiles/evidence-map-v0.2.json'},
  profileMatchingPolicy:{version:'0.2.0',path:'data/profiles/matching-policy-v0.2.json'},
  academicRelease:{version:'0.9.0',path:'data/academic/release-v0.9.json'}
});
delete current.expansionBatch; // The academic release supersedes the old equal-count writing milestone.
await json('data/current.json',current);

// Replace a size quota with an exact versioned-release invariant. Do not relax
// unique IDs, source references, item revisions or minimum coverage checks.
let validator = await raw('scripts/validate-item-bank.mjs');
validator = validator.replace('const constructs = (await load("data/constructs.json")).constructs;',
  'const constructs = (await load("data/constructs.json")).constructs.filter(c => c.measurementStatus !== "deprecated");');
// Legacy IDs still resolve for historical exploratory items, even when no
// current estimate may be produced for a deprecated construct.
validator = validator.replace('const constructIds = new Set(constructs.map((construct) => construct.id));',
  'const constructIds = new Set((await load("data/constructs.json")).constructs.map(c => c.id));');
const sizeStart = validator.indexOf('if (items.length !== 472) {');
if (sizeStart>=0) {
  const sizeEnd = validator.indexOf('\nconst specialtyConstructs',sizeStart);
  assert.ok(sizeEnd>sizeStart);
  validator = validator.slice(0,sizeStart) + 'const academicRelease = await load(current.academicRelease.path);\nif (items.length !== academicRelease.itemCount) fail("Academic release item count mismatch");\nelse pass("Versioned academic release item count verified");\n' + validator.slice(sizeEnd);
}
await write('scripts/validate-item-bank.mjs',validator);
let scorer = await raw('scripts/score-session.mjs');
if (!scorer.includes('const constructDefinitions =')) {
  scorer = scorer.replace('const eligibleByConstruct = new Map();',
    'const constructDefinitions = new Map((await loadRepo("data/constructs.json")).constructs.map(c => [c.id,c]));\nconst eligibleByConstruct = new Map();');
  scorer = scorer.replace('  for (const target of item.targets) {',
    '  for (const target of item.targets) {\n    const definition = constructDefinitions.get(target.constructId);\n    if (!definition || definition.measurementStatus === "deprecated" || ["categorical","derived","hierarchical"].includes(definition.type)) continue;');
}
await write('scripts/score-session.mjs',scorer);
const citation = ids => ids.map(id=>`[${id}](${sourceMap.get(id).url})`).join('; ');
const matrix = ['# Academic construct-to-item matrix', '',
  'These are original candidate operationalizations, not published validated subscales. Counts are engineering coverage requirements, not reliability evidence.', '',
  ...additions.flatMap(c=>[
    `## ${c.id}: ${c.name}`,
    `${c.scope} ${citation(c.sourceIds)}`, '',
    `Type: ${c.type}. Evidence items: ${evidenceMap[c.id].map(e=>e.itemId+'@'+e.itemRevision).join(', ')}.`,
    'Do not infer: '+c.doNotInfer.join('; ')+'.', '',
    ...c.items.map((entry,index)=>`- ${evidenceMap[c.id][index].itemId}: ${entry[1]}`), ''
  ]), '# Source access and reuse ledger', '',
  ...sources.map(s=>`- **${s.id}**: [${s.title}](${s.url}). Locator: ${s.locator}. Access: ${s.access}. Evidence: ${s.evidenceType}. ${s.itemReuse}`), '',
  'Metadata-only and abstract-only entries are explicitly marked. They do not imply that a paywalled book or article was read in full. New items remain original project text with an undecided content license.', ''
].join('\n');
await write('research/academic/CONSTRUCT_SOURCE_MATRIX.md',matrix);
for (const [p,before] of Object.entries(frozenBefore)) assert.equal(hash(await raw(p)),before,'Historical release mutated: '+p);
const report = {...release,itemCount:bank.items.length,newItemCount:90,registryEntries:registry.constructs.length,activeConstructCount:active.length,newConstructCount:additions.length,referenceProfileCount:profiles.length,academicSourceCount:sources.length,antiInferenceRulesAdded:antiInferences.length,frozenSourceHashes:frozenBefore,publicInferenceAllowed:false};
await json('data/academic/release-v0.9.json',report);
const commitPaths = [...changed,'data/academic/build-output.json'].sort();
await json('data/academic/build-output.json',{schemaVersion:'1.0.0',releaseVersion:release.version,paths:commitPaths});
console.log(JSON.stringify(report,null,2));
