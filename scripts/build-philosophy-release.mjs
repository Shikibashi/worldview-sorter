import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sources,rules,exclusions} from '../data/philosophy/research-v1.mjs';
import {facets,panelNames,upgradePolicy} from '../data/philosophy/syllabus-v1.mjs';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';
const root=new URL('../',import.meta.url),raw=p=>readFile(new URL(p,root),'utf8'),read=async p=>JSON.parse(await raw(p));
const out=new Set(),hash=s=>createHash('sha256').update(s).digest('hex');
const write=async(p,v)=>{await mkdir(new URL(p.slice(0,p.lastIndexOf('/')+1),root),{recursive:true});await writeFile(new URL(p,root),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');out.add(p);};
const current=await read('data/current.json');
const bank=await read(current.candidateBank.path),pilot=await read(current.pilot.path),scalesDoc=await read('data/response-scales.json');
const registry=await read('data/constructs.json');
const base=await read('data/generic/model-v0.1.json');
const frozenPaths=['data/items/candidate-v0.8.json','data/items/candidate-v0.9.json','data/instruments/research-pool-0.8.json','data/instruments/research-pool-0.9.json','data/generic/model-v0.1.json'];
const frozen=Object.fromEntries(await Promise.all(frozenPaths.map(async p=>[p,hash(await raw(p))])));
assert.equal(bank.bankVersion,'0.9.0');
const items=new Map(bank.items.map(i=>[i.id,i])),constructs=new Map(registry.constructs.map(c=>[c.id,c]));
const model=structuredClone(base);model.modelVersion='generic-0.2.0';model.parentModelVersion=base.modelVersion;
model.sources.push(...sources);assert.equal(new Set(model.sources.map(s=>s.id)).size,model.sources.length);
for(const c of rules){
 const d=constructs.get(c.constructId);assert.ok(d,'Unknown construct '+c.constructId);
 model.commitments.push({...c,domainId:d.domainId,tier:d.tier,layer:d.domainId==='ME'?'metaethical':d.domainId==='EP'?'epistemic':d.domainId==='NE'?'normative':'domain_specific_reported_commitment',
  scope:c.label+'. Interpreted only in the contexts of these questions.',minimumEvidenceUnits:2,
  mappingStatus:'source_reviewed_authored_rule_not_calibrated',thresholdStatus:'engineering_minimum_not_psychometric',
  evidence:c.evidence.map(e=>{const i=items.get(e.itemId);assert.ok(i,'Unknown item '+e.itemId);return {...e,itemRevision:i.revision,unitId:i.mirrorGroup??i.scenarioGroup??i.id};})});
 model.comparisons.push({id:'compare-'+c.id,label:c.label,scope:c.label,kind:'specified_commitment',sourceIds:c.sourceIds,
  criteria:[{commitmentId:c.id,expected:'support',role:'defining'}],limitations:[c.boundary,'This is a scoped interpretation, not a full philosophical identity.']});
}
// Reused criteria need generic scope and sources when shown outside a tradition.
const truthRule=model.commitments.find(c=>c.id==='legacy-objectivism-moral-truth-aptness');
truthRule.scope='Your explicit answers about whether moral sentences can be true or false.';
truthRule.sourceIds=['domain-polzler','gen-noncognitivism'];
truthRule.boundary='Truth-aptness does not establish stance-independent moral truth or an Objectivist identity. Expressivist and quasi-realist accounts can accommodate truth-talk; expressing an attitude need not deny every kind of truth-aptness.';
truthRule.evidence.find(e=>e.itemId==='MEI018').oppose=[];
truthRule.mappingStatus='source_reviewed_explicit_truth_talk_not_identity';
const marketRule=model.commitments.find(c=>c.id==='legacy-objectivism-market-coordination');
marketRule.scope='Your preferences between voluntary exchange, prices and deliberate allocation in the stated coordination cases.';
marketRule.sourceIds=['acad-ostrom','domain-property'];
marketRule.boundary='Coordination preferences do not establish Objectivism, an ethical code or a universal case for one institution. Markets, states and commons can be evaluated differently by activity.';
marketRule.mappingStatus='source_reviewed_contextual_coordination_not_identity';
const excludeIds=new Set(exclusions.map(e=>e.itemId));
for(const c of rules)for(const e of c.evidence)assert.ok(!excludeIds.has(e.itemId),'Excluded evidence in active new mapping.');
model.commitments.sort((a,b)=>a.id.localeCompare(b.id,'en'));model.comparisons.sort((a,b)=>a.id.localeCompare(b.id,'en'));
model.facets=facets;model.panelNames=panelNames;model.academicUpgradePolicy=upgradePolicy;
model.limitations=[...base.limitations,
 'The public form is content-balanced by authored evidence bundles, not selected with empirical item information.',
 'Facets separate kinds of questions within overlapping philosophical fields; ontology is not claimed to be disjoint from metaphysics.',
 'No expert-frequency prior, speed reward, partisan target or personality stereotype is used to choose questions or infer answers.',
 'Presentism, growing-block theory, dispositional laws, abstract modal worlds and several metaethical variants still need better independent discriminants.'];
for(const c of model.coverage.constructs){c.ruleIds=model.commitments.filter(r=>r.constructId===c.id).map(r=>r.id);c.status=c.ruleIds.length?'scoped_comparison_available':'candidate_or_reference_only_no_inference_rule';}
for(const i of model.coverage.items){i.ruleIds=model.commitments.filter(r=>r.evidence.some(e=>e.itemId===i.itemId)).map(r=>r.id);i.status=i.ruleIds.length?'explicit_mapping_only':'not_used_for_profile_inference';i.publicFormExcluded=excludeIds.has(i.itemId);}
validateModel({model,bank,scalesDoc});
// An attitude/prescription answer is not automatic opposition to truth-talk.
const truthCheck=compareWorldview({model,bank,scalesDoc,input:{bankVersion:bank.bankVersion,responses:[
 {itemId:'MEI017',itemRevision:items.get('MEI017').revision,state:'answered',value:2},
 {itemId:'MEI018',itemRevision:items.get('MEI018').revision,state:'answered',value:'attitude'}]}});
assert.equal(truthCheck.commitments.find(c=>c.commitmentId===truthRule.id).state,'insufficient_evidence');
assert.ok(!truthRule.sourceIds.some(id=>id.startsWith('acad-rand')));
assert.ok(!marketRule.sourceIds.some(id=>id.startsWith('acad-rand')));
const bundleById=new Map();
for(const c of model.commitments){
 if(c.evidence.some(e=>excludeIds.has(e.itemId)))continue;
 const byUnit=new Map();for(const e of c.evidence)if(!byUnit.has(e.unitId))byUnit.set(e.unitId,e);
 const ev=[...byUnit.values()];if(ev.length<2)continue;
 // Fixed pairs are part of the versioned specification. New pairs require a new policy.
 for(let n=0;n<ev.length-1;n++){
  const pair=[ev[n],ev[n+1]];const b={id:c.id+':'+n,commitmentId:c.id,domainId:c.domainId,
   itemIds:pair.map(e=>e.itemId),itemRevisions:pair.map(e=>e.itemRevision),evidenceUnits:pair.map(e=>e.unitId)};bundleById.set(b.id,b);
 }
}
const policy={schemaVersion:'1.0.0',policyVersion:'philosophy-blueprint-1.0.0',algorithm:'facet-bundles-1',bankVersion:bank.bankVersion,modelVersion:model.modelVersion,
 administrationId:'public-worldview-1',instrumentVersion:'worldview-public-1.0.0',sizes:[80,120,160],
 domains:model.domains.map(d=>d.id),responseScaleIds:scalesDoc.scales.map(s=>s.id),excludedItemIds:[...excludeIds],
 facets:facets.map(f=>({...f,bundleIds:[...bundleById.values()].filter(b=>f.ruleIds.includes(b.commitmentId)).map(b=>b.id)})),
 bundles:[...bundleById.values()],scoringStatus:'authored_content_blueprint_not_validated_short_form'};
for(const f of policy.facets)assert.ok(new Set(f.bundleIds.map(id=>bundleById.get(id).commitmentId)).size>=f.minimumBundles,'Missing facet '+f.id);
for(const size of policy.sizes){const p=generatePhilosophyPacket({bank,pilot,policy,seed:'build-check',size});assert.ok(auditPhilosophyPacket(p,policy).allRequired);}
const oldLedger=await read('data/generic/source-ledger-v0.1.json');
const ledger=structuredClone(oldLedger);ledger.version='0.2.0';ledger.sources.push(...sources.map(s=>({...s,permissionToCopyItems:false,validatesOurItems:false})));
for(const s of ledger.sources){s.useByRules=model.commitments.filter(r=>r.sourceIds.includes(s.id)).map(r=>r.id);s.useByItems=bank.items.filter(i=>model.commitments.some(r=>r.sourceIds.includes(s.id)&&r.evidence.some(e=>e.itemId===i.id))).map(i=>i.id);}
const used=new Set(model.commitments.flatMap(c=>c.evidence.map(e=>e.itemId)));
const report={version:'philosophy-release-1',bankVersion:bank.bankVersion,modelVersion:model.modelVersion,formPolicyVersion:policy.policyVersion,
 itemCount:bank.items.length,newItems:0,inheritedRulesClarified:2,newCommitmentRules:rules.length,totalCommitmentRules:model.commitments.length,totalComparisons:model.comparisons.length,
 totalSources:model.sources.length,newSourceRecords:sources.length,facets:facets.length,
 mappedConstructs:model.coverage.constructs.filter(c=>c.ruleIds.length).length,remainingConstructGaps:model.coverage.constructs.filter(c=>!c.ruleIds.length).length,
 mappedItems:used.size,publicExclusions:exclusions.length,frozenSourceHashes:frozen,
 empiricalValidation:false,cognitiveReviewRequired:false,
 domains:model.domains.map(d=>({id:d.id,name:panelNames[d.id],facets:facets.filter(f=>f.domainId===d.id).map(f=>f.id),
  beforeRules:base.commitments.filter(c=>c.domainId===d.id).length,afterRules:model.commitments.filter(c=>c.domainId===d.id).length}))};
await write('data/generic/model-v0.2.json',model);await write('data/generic/coverage-v0.2.json',model.coverage);
await write('data/generic/source-ledger-v0.2.json',ledger);await write('data/philosophy/public-form-v1.json',policy);
await write('data/philosophy/release-v1.json',report);await write('data/philosophy/exclusions-v1.json',{version:'1.0.0',bankVersion:bank.bankVersion,items:exclusions});
await write('data/philosophy/upgrade-policy-v1.json',upgradePolicy);
current.worldviewModel={version:model.modelVersion,path:'data/generic/model-v0.2.json'};
current.worldviewCoverage={version:'0.2.0',path:'data/generic/coverage-v0.2.json'};
current.worldviewSourceLedger={version:'0.2.0',path:'data/generic/source-ledger-v0.2.json'};
current.publicForm={version:policy.policyVersion,path:'data/philosophy/public-form-v1.json'};
await write('data/current.json',current);
const sourceMap=new Map(model.sources.map(s=>[s.id,s]));
const link=id=>{const s=sourceMap.get(id);return `[${s.title}](${s.url})`;};
const md=['# Philosophy-domain upgrade','',
 '> Historical milestone for the 140-rule release with 49 open mapping gaps. The subsequent [49-construct audit](UNMAPPED_AUDIT.md) and [PR #1 content baseline](CONTENT_EFFICIENCY_AUDIT.md) supersede these current-state counts.','',
 'This release makes domain coverage a property of question selection and evidence, not just twelve headings. The fields overlap: ontology asks about existence and categories within a broader metaphysical inquiry. The organizational split does not assert separate empirical factors. '+link('domain-metaphysics'),'',
 '## Actual coverage', '',`The ${bank.items.length}-item bank is unchanged. ${rules.length} new source-reviewed interpretation rules bring the model to ${model.commitments.length}. ${report.mappedConstructs} active constructs have mappings; ${report.remainingConstructGaps} remain explicit gaps.`,
 '', '## Topic structure', '',...facets.map(f=>`- **${f.title}**: ${f.question}`),
 '', '## Selection change', '',
 'Every route contains complete two-evidence-group bundles for each listed facet. One facet may have several alternative bundles; a seed chooses among them without using answers or identities. Formats are represented and remaining slots add balanced bundles. This is an authored coverage guarantee, not an empirically optimized short form. '+link('domain-philpapers-design'),
 '', 'The new local public form uses a distinct instrument version and packet-policy version. Research pilot packet generation is unchanged. Existing backups without a public-form marker use the historical generator; unknown versions fail closed. The collector does not mistake a new public form for a research packet.',
 '', '## Generic scope of inherited criteria', '', 'The truth-aptness and market-coordination criteria retain their historical internal IDs but now use topic-specific academic sources and explanations. Attitude or prescription answers no longer count automatically as rejecting all truth-aptness. The earlier model is preserved.', '', '## Exact academic rules', '',...rules.flatMap(c=>[`### ${c.label}`,`Construct ${c.constructId}; facet ${c.facetId}. `+c.sourceIds.map(link).join('; '),`Evidence: ${c.evidence.map(e=>e.itemId+'@'+items.get(e.itemId).revision).join(', ')}.`,c.boundary,'']),
 '## Items not used in new public forms','',...exclusions.map(x=>`- **${x.itemId}**: ${x.reason} ${link(x.sourceId)}`),
 '', '## Academic upgrades','',...upgradePolicy.requirements.map(x=>'- '+x),'',...upgradePolicy.caveats.map(x=>'- '+x),
 '', 'The unchanged previous model is retained as generic-0.1.0. This release is generic-0.2.0. The generic runtime never supplies missing answers from philosophical names, demographics, memories or figures. Existing interface safeguards and post-completion game isolation remain.',''].join('\n');
await write('docs/PHILOSOPHY_DOMAINS.md',md);
await write('research/academic/PHILOSOPHY_SOURCES.md',['# New source-review ledger','',...sources.flatMap(s=>[`## ${s.title}`,`[Source](${s.url}); reviewed ${s.reviewedOn}; access: ${s.access}; ${s.evidenceType}.`,s.locator,s.claim,'No validity, norms or item-reuse permission is transferred to the quiz.',''])].join('\n'));
for(const [p,h] of Object.entries(frozen))assert.equal(hash(await raw(p)),h,'Historical data changed: '+p);
let readme=await raw('README.md');const marker='\n## Philosophy-domain content coverage\n';readme=readme.split(marker)[0]+marker+'\nThe public quiz uses a versioned content blueprint with separate ontology, metaphysics, metaethical, ethical, epistemic, and political/legal/economic facets. Every route asks multiple relevant questions for each facet rather than hoping proportional random sampling does so. Original item text is unchanged; academic citations explain conceptual scope, not scientific validation of custom items. See [the domain/source/evidence specification](docs/PHILOSOPHY_DOMAINS.md).\n';await write('README.md',readme);
const build=await read('data/academic/build-output.json');build.paths=[...new Set([...build.paths,...out])].sort();await write('data/academic/build-output.json',build);
console.log(JSON.stringify(report,null,2));
