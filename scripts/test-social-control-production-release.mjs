import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {semanticDiff,validateProposal,validateReleaseTransition} from '../packages/governance/index.js';
import {captureRelease,currentFromManifest,loadSnapshot,readJson,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const currentRef=await read('data/current.json');
const currentManifest=await read('data/releases/model-release-v1.19.0.json');
const previousManifest=await read('data/releases/model-release-v1.18.0.json');
const current=currentFromManifest(currentManifest),previous=currentFromManifest(previousManifest);
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth,oldCatalog,draft,
 registry,proposal,sourceRegistry,ledger]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path),
 read(previous.candidateBank.path),read(previous.worldviewModel.path),read(previous.progressiveDepth.path),
 read(previous.affinityCatalog.path),read('data/items/affinity-gap-draft-v1.json'),
 read(current.registry.path),read('data/governance/proposals/MCP-2026-092.json'),
 read(current.sourceRegistry.path),read(current.worldviewSourceLedger.path)]);
const ruleId='reviewed-PL39-democratic-social-control-production';

assert.equal(currentManifest.releaseVersion,'model-release-1.19.0');
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,575);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,previous)).items,574);
assert.deepEqual(await captureRelease(root.pathname,previous,previousManifest.releaseVersion),previousManifest,
 'The previous model release remains byte-for-byte reproducible.');
assert.ok(!oldModel.commitments.some(rule=>rule.id===ruleId));
assert.equal(oldBank.items.find(item=>item.id==='PLI060').revision,1);
assert.ok(!oldBank.items.some(item=>item.id==='PLI123'));
assert.equal(oldDepth.routes.find(route=>route.id==='full').size,247);
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,249]);
assert.deepEqual(depth.routes.slice(0,2).map(route=>route.itemRefs),oldDepth.routes.slice(0,2).map(route=>route.itemRefs),
 'Quick and Standard preserve their exact items and order.');
assert.equal(registry.constructs.length,188);
assert.equal(registry.constructs.find(row=>row.id==='PL39').name,'Democratic and worker control over production (scoped preference)');
assert.equal(registry.constructs.find(row=>row.id==='PL39').candidateItemTarget,1,
 'The registry target counts primary candidates; PLI060 is complementary secondary evidence.');
assert.ok(!registry.constructs.some(row=>row.id==='PL35'),
 'PL35 stays reserved for the separate migration proposition in the draft registry.');
assert.equal(bank.items.find(item=>item.id==='PLI060').revision,2);
assert.equal(bank.items.find(item=>item.id==='PLI123').revision,2);
assert.equal(draft.items.find(item=>item.id==='PLI123').revision,1,
 'The unreleased PLI123@1 draft remains preserved.');
assert.ok(bank.items.find(item=>item.id==='PLI123').options.some(option=>option.id==='other'));
assert.equal(proposal.status,'approved');assert.equal(validateProposal(proposal),proposal);
assert.ok(proposal.affectedObjects.some(row=>row.id==='PL39'));

const rule=model.commitments.find(row=>row.id===ruleId);assert.ok(rule);
assert.equal(rule.minimumEvidenceUnits,2);
assert.equal(rule.proposition,rule.scope);
assert.ok(model.publicRuleIds.includes(ruleId));
assert.deepEqual(rule.evidence.map(row=>`${row.itemId}@${row.itemRevision}`),['PLI060@2','PLI123@2']);
assert.deepEqual(rule.evidence.map(row=>row.unitId),['PLI060','PLI123']);
assert.deepEqual(rule.evidence[0].support,[-2,-1]);assert.deepEqual(rule.evidence[0].oppose,[1,2]);
assert.deepEqual(rule.evidence[1].support,['worker_governed','social_governed']);
assert.deepEqual(rule.evidence[1].oppose,['state_only','private_owners']);
assert.ok(rule.nonEntailments.some(text=>/socialism/i.test(text)));
assert.ok(rule.nonEntailments.some(text=>/planning|market rejection/i.test(text)));
assert.ok(rule.falsePositives.some(text=>/redistribution/i.test(text)));
assert.ok(rule.falsePositives.some(text=>/state ownership/i.test(text)));
assert.equal(rule.affinityCriterion,false);
assert.deepEqual(rule.sourceIds.sort(),['iep-socialism-effective-ownership','sep-socialism-effective-control']);
for(const id of rule.sourceIds){
 assert.ok(sourceRegistry.sources.some(source=>source.id===id));
 assert.ok(ledger.sources.some(source=>source.id===id&&source.useByRules.includes(ruleId)&&source.validatesOurItems===false));
 assert.ok(rule.sourceClaims.some(claim=>claim.sourceId===id&&claim.relationship==='supports'));
}

const route=id=>depth.routes.find(row=>row.id===id);
const fullRefs=route('full').itemRefs,position=id=>fullRefs.findIndex(ref=>ref.itemId===id);
assert.ok(position('PLI060')>=0&&position('PLI123')>=0);
assert.ok(Math.abs(position('PLI060')-position('PLI123'))>80,
 'The complementary items are separated in Full route order.');
for(const id of ['PLI060','PLI123'])assert.ok(!['quick','standard'].some(routeId=>
 route(routeId).itemRefs.some(ref=>ref.itemId===id)),id+' stays Full-only.');
assert.ok(route('full').assessableDirectRuleIds.includes(ruleId));
assert.ok(current.fullForm.path===currentManifest.components.find(row=>row.key==='full_form').path);
assert.ok(pilot.interpretationRules.routeMeasuredDirectRuleIds.includes(ruleId));
assert.ok(['data/reviews/pilot-evidence-dispositions-v17.json','data/reviews/pilot-evidence-dispositions-v18.json'].includes(currentRef.pilotEvidenceAudit.path));
assert.equal(catalog.modelVersion,model.modelVersion);
assert.deepEqual(catalog.traditions.map(row=>row.commitments),oldCatalog.traditions.map(row=>row.commitments),
 'The catalog only rebinds to the successor model; it adds no production-control affinity.');
assert.ok(!catalog.traditions.some(tradition=>tradition.commitments.some(commitment=>
 commitment.mapping.propositionId===ruleId||commitment.mapping.propositionId==='PL39')));

const ref=itemId=>({itemId,itemRevision:bank.items.find(item=>item.id===itemId).revision});
const makeInput=(routeId,answers)=>({pilotId:depth.administrationId,bankVersion:bank.bankVersion,
 instrumentVersion:depth.instrumentVersion,
 presentedItems:route(routeId).itemRefs.map(row=>({...row,presented:true,skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({...ref(itemId),state:value===null?'no_view':'answered',value}))});
const report=(routeId,answers)=>compareWorldview({model,bank,scalesDoc:scales,
 input:makeInput(routeId,answers),routeManifest:depth});
const state=(routeId,answers)=>report(routeId,answers).commitments.find(row=>row.commitmentId===ruleId).state;
assert.equal(state('full',{PLI060:-2,PLI123:'worker_governed'}),'supported');
assert.equal(state('full',{PLI060:-1,PLI123:'social_governed'}),'supported');
assert.equal(state('full',{PLI060:2,PLI123:'private_owners'}),'opposed');
assert.equal(state('full',{PLI060:1,PLI123:'state_only'}),'opposed');
assert.equal(state('full',{PLI060:-2,PLI123:'private_owners'}),'mixed_context_dependent');
assert.equal(state('full',{PLI060:2,PLI123:'worker_governed'}),'mixed_context_dependent');
assert.equal(state('full',{PLI060:-2}),'leaned_toward');
assert.equal(state('full',{PLI123:'social_governed'}),'leaned_toward');
assert.equal(state('full',{PLI060:0,PLI123:'mixed'}),'insufficient_evidence');
assert.equal(state('full',{PLI060:null,PLI123:'other'}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
assert.equal(state('full',{PLI035:2,PLI054:'owner_controls',PLI055:2,PLI067:2}),
 'insufficient_evidence','Market coordination, property, and adjacent political preferences cannot substitute for direct production-control evidence.');

const positiveInput=makeInput('full',{PLI060:-2,PLI123:'worker_governed'});
const positive=report('full',{PLI060:-2,PLI123:'worker_governed'});
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...positiveInput,completionStatus:'completed'},routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const result=summary.rows.find(row=>row.id===ruleId);assert.equal(result.status,'supported');
assert.ok(result.sources.some(source=>source.id==='iep-socialism-effective-ownership'&&source.claimScope==='rule_linked'));
assert.ok(!summary.affinities.traditions.some(tradition=>tradition.criteria.some(criterion=>
 criterion.mapping.propositionId===ruleId)));
assert.deepEqual(positive.commitments.find(row=>row.commitmentId===ruleId).observations.map(row=>
 `${row.itemId}@${row.itemRevision}`),['PLI060@2','PLI123@2']);

const currentSnapshot=await loadSnapshot(root.pathname,current),previousSnapshot=await loadSnapshot(root.pathname,previous);
const proposalFiles=(await readdir(new URL('../data/governance/proposals/',import.meta.url))).filter(name=>name.endsWith('.json'));
const proposals=await Promise.all(proposalFiles.map(name=>read('data/governance/proposals/'+name)));
proposals.forEach(validateProposal);
const transition=validateReleaseTransition({previousManifest,nextManifest:currentManifest,
 changes:semanticDiff(previousSnapshot,currentSnapshot),proposals,nextSnapshot:currentSnapshot});
assert.ok(transition.approvedProposalIds.includes('MCP-2026-092'));

console.log('Social-control release: direct cross-setting evidence, mixed/missing states, nearby false positives, affinity boundary, sources, release governance, route scope, and historical replay passed.');
