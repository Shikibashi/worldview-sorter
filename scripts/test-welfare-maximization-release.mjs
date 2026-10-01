import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {semanticDiff,validateProposal,validateReleaseTransition} from '../packages/governance/index.js';
import {currentFromManifest,loadSnapshot,readJson,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.18.0.json'));
const previous=currentFromManifest(await read('data/releases/model-release-v1.17.0.json'));
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth,oldCatalog,draft]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path),
 read(previous.candidateBank.path),read(previous.worldviewModel.path),read(previous.progressiveDepth.path),
 read(previous.affinityCatalog.path),read('data/items/affinity-gap-draft-v1.json')]);

assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,574);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,previous)).items,572);
const currentRelease=await read('data/releases/model-release-v1.18.0.json');
const historicalRelease=await read('data/releases/model-release-v1.17.0.json');
const oldLocaleComponents=historicalRelease.components.filter(row=>row.key==='localization_bundle:ar'||row.key==='localization_bundle:es-ES');
assert.equal(oldLocaleComponents.length,2,'The prior release retains both pinned draft artifacts for replay.');
assert.deepEqual(currentRelease.components.filter(row=>row.key.startsWith('localization_bundle:')).map(row=>row.key),
 ['localization_bundle:en-US'],'The current release contains only its supported English wording.');
const activeCatalog=await read(current.localizationCatalog.path);
assert.deepEqual(activeCatalog.locales.map(row=>row.locale),['en-US']);
assert.match(activeCatalog.note,/sole supported respondent-facing language/i);
const localizationManifest=await read(current.localizationCatalog.manifestPath);
assert.deepEqual(Object.keys(localizationManifest.hashes).sort(),
 [current.localizationCatalog.path,current.localizationBundles[0].path].sort(),
 'The current manifest must not pin archived untranslated drafts or locale-review scaffolding.');
const retirement=await read('data/governance/proposals/MCP-2026-091.json');
assert.equal(validateProposal(retirement),retirement);
const proposalNames=(await readdir(new URL('../data/governance/proposals/',import.meta.url))).filter(name=>name.endsWith('.json'));
const proposals=await Promise.all(proposalNames.map(name=>read('data/governance/proposals/'+name)));
const previousSnapshot=await loadSnapshot(root.pathname,previous),currentSnapshot=await loadSnapshot(root.pathname,current);
const transition=validateReleaseTransition({previousManifest:historicalRelease,nextManifest:currentRelease,
 changes:semanticDiff(previousSnapshot,currentSnapshot),proposals,nextSnapshot:currentSnapshot});
assert.ok(transition.approvedProposalIds.includes('MCP-2026-091'));
assert.throws(()=>validateReleaseTransition({previousManifest:historicalRelease,nextManifest:currentRelease,
 changes:semanticDiff(previousSnapshot,currentSnapshot),proposals:proposals.filter(row=>row.proposalId!=='MCP-2026-091'),
 nextSnapshot:currentSnapshot}),/release removed component localization_bundle:/,
 'Removing an archived locale from the successor still requires an explicit approved deprecation.');
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,247]);
assert.deepEqual(depth.routes.slice(0,2).map(route=>route.itemRefs),oldDepth.routes.slice(0,2).map(route=>route.itemRefs),
 'Quick and Standard preserve their exact historical item references and order.');
assert.equal(oldDepth.routes.find(route=>route.id==='full').size,245);
assert.equal(oldModel.commitments.some(rule=>rule.id==='reviewed-NE25-total-welfare-maximization'),false);
assert.ok(!oldBank.items.some(item=>item.id==='NEI125'||item.id==='NEI133'));
assert.equal(bank.items.find(item=>item.id==='NEI125').revision,2);
assert.equal(bank.items.find(item=>item.id==='NEI133').revision,1);
assert.deepEqual(draft.items.find(item=>item.id==='NEI125').revision,1);
assert.ok(!bank.items.some(item=>item.id==='NEI125'&&item.revision===1),
 'The unreleased NEI125@1 wording remains only in the draft pool.');

const route=id=>depth.routes.find(row=>row.id===id);
const refs=route('full').itemRefs;
const position=id=>refs.findIndex(ref=>ref.itemId===id);
assert.ok(position('NEI133')>=0&&position('NEI125')>=0);
assert.ok(Math.abs(position('NEI133')-position('NEI125'))>80,
 'The complementary items are separated in Full route order.');
for(const id of ['NEI133','NEI125'])assert.ok(!['quick','standard'].some(routeId=>
 route(routeId).itemRefs.some(ref=>ref.itemId===id)),id+' stays Full-only.');

const ruleId='reviewed-NE25-total-welfare-maximization';
const rule=model.commitments.find(row=>row.id===ruleId);
assert.ok(rule);
assert.equal(rule.minimumEvidenceUnits,2);
assert.equal(rule.proposition,rule.scope);
assert.deepEqual(rule.evidence.map(row=>`${row.itemId}@${row.itemRevision}`),['NEI133@1','NEI125@2']);
assert.deepEqual(rule.evidence.map(row=>row.unitId),['NEI133','NEI125']);
assert.ok(rule.nonEntailments.some(text=>/utilitarianism/i.test(text)));
assert.ok(rule.nonEntailments.some(text=>/political or policy/i.test(text)));
assert.ok(rule.falsePositives.some(text=>/NE22/i.test(text)));
assert.ok(rule.falsePositives.some(text=>/NE24/i.test(text)));
assert.ok(rule.sourceClaims.some(row=>row.sourceId==='sep-promises-act-rule'&&row.relationship==='supports'));
assert.ok(!catalog.traditions.some(tradition=>tradition.commitments.some(commitment=>
 commitment.mapping.propositionId===ruleId||commitment.mapping.propositionId==='NE25')));
assert.deepEqual(catalog.traditions.map(row=>row.commitments),oldCatalog.traditions.map(row=>row.commitments),
 'The catalog version advances without adding or changing doctrinal criteria.');

const ref=itemId=>({itemId,itemRevision:bank.items.find(item=>item.id===itemId).revision});
const input=(routeId,answers)=>({pilotId:depth.administrationId,bankVersion:bank.bankVersion,
 instrumentVersion:depth.instrumentVersion,
 presentedItems:route(routeId).itemRefs.map(row=>({...row,presented:true,skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({...ref(itemId),
  state:value===null?'no_view':'answered',value}))});
const report=(routeId,answers)=>compareWorldview({model,bank,scalesDoc:scales,
 input:input(routeId,answers),routeManifest:depth});
const state=(routeId,answers)=>report(routeId,answers).commitments.find(row=>row.commitmentId===ruleId).state;

assert.equal(state('full',{NEI133:1,NEI125:'maximize_welfare'}),'supported');
assert.equal(state('full',{NEI133:-2,NEI125:'promise_can_override'}),'opposed');
assert.equal(state('full',{NEI133:1,NEI125:'promise_can_override'}),'mixed_context_dependent');
assert.equal(state('full',{NEI133:0,NEI125:'welfare_reason_only'}),'insufficient_evidence');
assert.equal(state('full',{NEI133:null,NEI125:null}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
assert.equal(state('full',{NEI133:1}),'leaned_toward');
assert.equal(state('full',{NEI125:'maximize_welfare'}),'leaned_toward');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
assert.equal(state('full',{NEI014:-2,NEI122:'act_outcome',NEI124:'welfare_only',NEI132:'no_welfare_change'}),
 'insufficient_evidence','Nearby act-consequence and welfare-value answers cannot substitute for direct evidence.');

const positive=report('full',{NEI133:2,NEI125:'maximize_welfare'});
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input('full',{NEI133:2,NEI125:'maximize_welfare'}),completionStatus:'completed'},
 routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const result=summary.rows.find(row=>row.id===ruleId);
assert.equal(result.status,'supported');
assert.ok(result.sources.some(source=>source.id==='sep-promises-act-rule'&&source.claimScope==='rule_linked'));
assert.ok(!summary.affinities.traditions.some(tradition=>tradition.criteria.some(criterion=>
 criterion.mapping.propositionId===ruleId)));
assert.deepEqual(positive.commitments.find(row=>row.commitmentId===ruleId).observations.map(row=>
 `${row.itemId}@${row.itemRevision}`),['NEI133@1','NEI125@2']);

console.log('Welfare-maximization release: source-scoped direct evidence, route omission, mixed/missing states, false-positive neighbors, catalog boundary, and historical replay passed.');
