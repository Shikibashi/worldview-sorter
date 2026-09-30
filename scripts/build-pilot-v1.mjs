import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';
import {validateModel} from '../packages/worldview/index.js';

const root=new URL('../',import.meta.url);
const raw=p=>readFile(new URL(p,root),'utf8');
const read=async p=>JSON.parse(await raw(p));
const write=async(p,v)=>writeFile(new URL(p,root),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');
const sha=s=>createHash('sha256').update(s).digest('hex');
const paths={bank:'data/items/candidate-v0.9.json',priorModel:'data/generic/model-v0.4.json',priorForm:'data/philosophy/public-full-v1.2.json',
 priorExperience:'data/experience/policy-v1.3.json',audit:'data/academic/unmapped-audit-v2.json'};
const historical=Object.fromEntries(await Promise.all(Object.values(paths).map(async p=>[p,sha(await raw(p))])));
const [bank,pilot,scalesDoc,priorModel,priorForm,priorExperience,audit,registry]=await Promise.all([
 read(paths.bank),read('data/pilots/pilot-0.2.json'),read('data/response-scales.json'),read(paths.priorModel),
 read(paths.priorForm),read(paths.priorExperience),read(paths.audit),read('data/constructs.json')]);
const byItem=new Map(bank.items.map(i=>[i.id,i]));
const byConstruct=new Map(registry.constructs.map(c=>[c.id,c]));
const seed='pilot-v1-content';
const priorPacket=generatePhilosophyPacket({bank,pilot,policy:priorForm,seed,size:240});
const removed={
 NEI030:{pairedWith:'NEI005',issue:'near_duplicate_local_dependence',reason:'Both cases ask whether severe injury to one uninvolved person can save five. The second changes severity details without a cleanly isolated philosophical discriminator; retain the earlier case as contextual evidence.'},
 EXI017:{pairedWith:'EXI004',issue:'semantic_redundancy',reason:'Interesting possibilities worth exploring largely restates worthwhile possibilities worth discovering. It does not independently establish an existential orientation.'}
};
const cautions={
 AHI100:['near_duplicate_local_dependence','Broad universal egoism claim; compare with the helping example and altruistic-desire counterclaim before treating answers as a pattern.'],
 AHI101:['near_duplicate_local_dependence','The helping example parallels AHI100, but tests whether the broad thesis extends to apparently unrewarded helping.'],
 EPI042:['philosophical_jargon','The alternatives require distinguishing technical accounts of justification; pilot cognitive interviews should check comprehension.'],
 EPI034:['philosophical_jargon','Direct and indirect perception vocabulary may be interpreted differently by respondents; nearby world-existence questions limit inference.'],
 EPI105:['awkward_reverse_key','The absolute “always” and indirect negation may elicit disagreement without affirming a specific pragmatist view.'],
 EPI116:['wording_ambiguity','“Highly abstract factual claims” may invite different examples; compare with concrete-knowledge and pure-reason items.'],
 MSI018:['philosophy_knowledge_risk','The Twin Earth example may test familiarity with a philosophical thought experiment; retain only as a contextual case beside the plain-language item.'],
 OMI030:['philosophical_jargon','Possible-world options require technical understanding; keep research-only and check comprehension.'],
 OMI111:['awkward_reverse_key','The “separate deep metaphysical test is always required” wording risks acquiescence or broad disagreement unrelated to a precise metaontological view.'],
 NEI005:['local_dependence_risk','Its severe-injury rescue case is retained; the near-duplicate NEI030 is removed. One case does not establish a general theory of instrumental harm.'],
 EXI004:['local_dependence_risk','Retained as an outlook question after removing EXI017; one remaining item cannot establish its former direct pattern.'],
 VAI003:['parallel_indicator','Competence and achievement wording parallels VAI039; any interpretation stays limited to reported value importance.'],
 VAI039:['parallel_indicator','Ambitious-goal wording adds a concrete achievement manifestation but may share wording effects with VAI003.'],
 VAI009:['parallel_indicator','Authority wording parallels VAI023; no empirical independence is presumed.'],
 VAI023:['parallel_indicator','Directing others is a concrete expression of authority; no empirical independence is presumed.'],
 VAI005:['ranking_research_variable','Forced ranking is comparative and cannot be converted to separate absolute importance claims.'],
 PLI035:['policy_proxy_boundary','Market-versus-planning wording supports only a coordination preference, not a general ideology.'],
 PLI055:['policy_proxy_boundary','The equal-competence board scenario checks coordination preference without inferring a complete political economy.'],
 PLI067:['policy_proxy_boundary','Citizen-versus-foreigner policy choice is distinct from equal moral standing of persons.'],
 PLI076:['conditional_scenario','The reform-versus-break choice presupposes repeatedly defeated reform; infer only the stated conditional preference.'],
 PLI111:['awkward_reverse_key','The absolute denial of legitimate nonstate adjudication may be rejected for many reasons; interpret beside affirmative alternatives.'],
 SOI029:['social_desirability_risk','Equal-harm local-versus-distant choice may invite a socially favored answer; compare with general concern and policy distinction.'],
 SOI003:['double_barrel_risk','Relationships and social roles may affect identity differently; the paired vignette narrows what the response can support.'],
 SOI037:['empirical_generalization','Whether outcomes are deserved can be read as an empirical claim about the world; do not infer a full distributive principle.'],
 SOI105:['awkward_reverse_key','“Fully explained without any account” is absolute reverse wording; compare with positive individual-process items.'],
 AHI010:['double_barrel_risk','Inherited dispositions and biological differences are related but not identical causal claims; keep the result at a broad causal scope.'],
 AHI019:['double_barrel_risk','Institutions and learned environments may have distinct effects; the item supports only their broad causal relevance.'],
 AHI021:['awkward_reverse_key','The negative necessity wording may be rejected without a positive theory of unconscious causation.'],
 MEI100:['double_barrel_risk','Human needs and flourishing can ground standards in different ways; neighboring items constrain the interpretation.'],
 RCI013:['wording_comprehension','The fragment relies on the importance response instruction; check that respondents read it as personal importance rather than a truth claim.'],
 PLI073:['legal_jargon','Different meanings of legal validity require comprehension checking; the options are not a generic obedience scale.'],
 NEI004:['scope_boundary','Equal welfare weight is not the same as equal duties to every person.'],
 SOI004:['scope_boundary','Equal moral claims across distance do not imply equal institutional obligations.']
};
const selected=priorPacket.entries.filter(e=>!removed[e.itemId]);
assert.equal(selected.length,238);
const contribution=item=>item.mirrorGroup?'deliberate_counter_key':item.responseType==='vignette_choice'?'complementary_case':
 item.responseType==='paired_choice'?'method_diversity_tradeoff':item.responseType==='single_choice'?'alternative_discriminator':
 item.responseType==='ranking'?'comparative_research_variable':'parallel_or_complementary_proposition';
const ruleUses=new Map();for(const c of priorModel.commitments)for(const e of c.evidence){if(!ruleUses.has(e.itemId))ruleUses.set(e.itemId,[]);ruleUses.get(e.itemId).push(c.id);}
const contentReview={schemaVersion:'pilot-content-review-1',reviewVersion:'pilot-content-review-1.0.0',sourceFormPolicyVersion:priorForm.policyVersion,
 sourceSeed:seed,sourceAssignedItems:240,frozenAssignedItems:238,
 reviewLimit:'Authored content judgment before cognitive interviews and human data; parallel wording may be locally dependent and no item discrimination is estimated.',
 repeatedWordingAndDependenceGroups:[
  {id:'value-importance-parallels',itemIds:['VAI003','VAI039','VAI009','VAI023','VAI020','VAI036','VAI027','VAI041','VAI008','VAI042'],
   note:'Short value-importance stems repeat across paired facets. The different manifestations may help pilot review, but shared format and wording could create local dependence.'},
  {id:'egoism-general-and-helping',itemIds:['AHI100','AHI101','AHI102'],
   note:'A universal motive thesis, an apparent-helping case, and an altruistic-desire alternative must be kept conceptually distinct.'},
  {id:'rescue-near-duplicate',itemIds:['NEI005','NEI030'],
   note:'The two rescue scenarios share the same instrumental-harm structure; NEI030 is removed from the frozen route.'},
  {id:'existential-possibilities-near-duplicate',itemIds:['EXI004','EXI017'],
   note:'Interesting or worthwhile possibilities are too close to provide two cleanly distinct units; EXI017 is removed.'}
 ],
 contentGapsFromPriorAudit:audit.decisions.filter(d=>['unresolved','requires_new_discriminating_items','research_only'].includes(d.disposition)).map(d=>({constructId:d.constructId,disposition:d.disposition})),
 decisions:priorPacket.entries.map(e=>{const item=byItem.get(e.itemId),warning=cautions[item.id],drop=removed[item.id];
  const peers=priorPacket.entries.filter(p=>p.itemId!==item.id&&byItem.get(p.itemId).targets.some(t=>item.targets.some(x=>x.constructId===t.constructId))).map(p=>p.itemId);
  return {sourcePosition:e.index+1,itemId:item.id,itemRevision:item.revision,domainId:item.domainId,
   targetConstructIds:item.targets.map(t=>t.constructId),mappedRuleIds:ruleUses.get(item.id)??[],
   nearbyRouteItemIds:peers.slice(0,6),
   responseMethod:item.responseType,contribution:contribution(item),decision:drop?'remove_from_pilot':'retain_for_pilot',
   issue:drop?.issue??warning?.[0]??null,
   rationale:drop?.reason??warning?.[1]??`${item.responseType==='likert'?'A stated proposition':'A concrete case or selected alternative'} about ${item.targets.map(t=>byConstruct.get(t.constructId)?.name??t.constructId).join(' and ')}; compare with ${peers.slice(0,3).join(', ')||'its other-domain neighbors'} for convergence or divergence. Retention supplies content for cognitive review, not an independent factor indicator.`,
   ...(drop?{pairedWith:drop.pairedWith}:{}),
   resultUse:drop?'none_in_frozen_route':(ruleUses.get(item.id)?.length?'only_through_explicit_interpretation_rules':'research_variable_only')};
 })};
assert.equal(new Set(contentReview.decisions.map(d=>d.itemId)).size,240);
await write('data/pilots/content-review-v1.json',contentReview);

const model=structuredClone(priorModel);
model.parentModelVersion=priorModel.modelVersion;
model.modelVersion='generic-1.0.0-pilot';
model.engineVersion='generic-evidence-3';
model.resultSemanticsVersion='pilot-result-states-1.0.0';
model.pilotInstrumentVersion='worldview-pilot-1.0.0';
model.pilotRouteItemRefs=selected.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision}));
model.publicRuleIds=model.commitments.filter(c=>c.tier!=='research').map(c=>c.id).sort();
model.researchOnlyRuleIds=model.commitments.filter(c=>c.tier==='research').map(c=>c.id).sort();
model.derivedRules=[{
 id:'derived-RC11-agentic-divine-outlook',constructId:'RC11',domainId:'RC',facetId:'religious-claims',label:'Divine existence together with an agentic divine outlook',
 proposition:'The answers jointly favor the existence of some divine reality and, conditional on its existence, an intentional or personal character.',
 requires:[{ruleId:'divine-existence',state:'supported'},{ruleId:'audit2-RC02-agentic-divinity',state:'supported'}],
 directConflictAnswers:[{itemId:'RCI001',itemRevision:byItem.get('RCI001').revision,values:['impersonal_divine','probably_none','none']}],
 boundary:'This conjunction does not identify a religion, prove intervention or miracles, or settle a complete model of divinity.',
 sourceIds:[...new Set([...model.commitments.find(c=>c.id==='divine-existence').sourceIds,...model.commitments.find(c=>c.id==='audit2-RC02-agentic-divinity').sourceIds])]
}];
model.tensionPairs=[{id:'miracle-supernatural-conflict',domainId:'RC',leftRuleId:'audit2-RC05-miracles',leftState:'supported',
 rightRuleId:'ph-supernatural-reality',rightState:'opposed',
 explanation:'The answers favor genuinely miraculous action while rejecting supernatural reality. These claims need clarification; neither answer is erased.'}];
model.limitations=[...model.limitations,'Pilot states are authored evidence summaries, not calibrated probabilities, latent-factor estimates, or reliability claims. A rule lacking two available directional units is not measured in this frozen route.'];
validateModel({model,bank,scalesDoc});
await write('data/generic/model-v1.0-pilot.json',model);

const form=structuredClone(priorForm);
form.parentPolicyVersion=priorForm.policyVersion;
form.policyVersion='philosophy-pilot-1.0.0';
form.administrationId='public-worldview-pilot-v1';
form.instrumentVersion=model.pilotInstrumentVersion;
form.modelVersion=model.modelVersion;
form.algorithm='frozen-packet-1';
form.sizes=[238];
form.frozenItems=model.pilotRouteItemRefs;
form.frozenPlannedFacets=priorPacket.plannedFacets.filter(x=>x.facetId!=='existential-outlook');
form.facets=form.facets.filter(x=>x.id!=='existential-outlook');
form.bundles=form.bundles.filter(x=>!x.itemIds.some(id=>removed[id]));
form.excludedItemIds=[...new Set([...form.excludedItemIds,...Object.keys(removed)])];
const check=generatePhilosophyPacket({bank,pilot,policy:form,seed:'replay-check',size:238});
assert.deepEqual(check.entries.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision})),form.frozenItems);
assert.ok(auditPhilosophyPacket(check,form).allRequired);
await write('data/philosophy/public-pilot-v1.json',form);
const priorInstrument=await read('data/instruments/research-pool-0.9.json');
const instrument={...structuredClone(priorInstrument),instrumentVersion:form.instrumentVersion,status:'pilot_candidate_unvalidated',
 purpose:'Fixed v1 content candidate for human piloting; no factor score, calibration or ideological identity is implied.',
 nominalPoolSize:form.frozenItems.length,ordering:{...priorInstrument.ordering,mode:'fixed'},
 entries:form.frozenItems.map((ref,index)=>({index,...ref}))};
await write('data/instruments/worldview-pilot-v1.json',instrument);

const experience=structuredClone(priorExperience);
experience.experienceVersion='quiz-1.5.0';
experience.routes=experience.routes.map(r=>r.size===240?{...r,size:238,label:'Pilot exploration',
 description:'238 reviewed questions across all twelve topics. Pause whenever you like.',formPolicyVersion:form.policyVersion}:r);
experience.formPolicies.push({version:form.policyVersion,path:'data/philosophy/public-pilot-v1.json'});
experience.modelPolicies.push({version:model.modelVersion,path:'data/generic/model-v1.0-pilot.json'});
experience.routeLengthMeaning='The v1 pilot candidate fixes 238 exact item revisions; inapplicable conditional follow-ups are recorded as branch skips. Historical 240-question forms remain reproducible.';
experience.pilotCandidate={version:'pilot-candidate-1.0.0',path:'data/pilots/pilot-candidate-v1.json'};
await write('data/experience/policy-v1.4.json',experience);

const decisionGroups={};
for(const decision of audit.decisions)(decisionGroups[decision.disposition]??=[]).push(decision);
const routeIds=new Set(form.frozenItems.map(x=>x.itemId));
const routeCanMeasure=c=>['support','oppose'].every(direction=>new Set(c.evidence.filter(e=>routeIds.has(e.itemId)&&e[direction].length).map(e=>e.unitId)).size>=c.minimumEvidenceUnits);
const measuredDirectRuleIds=model.commitments.filter(c=>model.publicRuleIds.includes(c.id)&&routeCanMeasure(c)).map(c=>c.id).sort();
const notMeasuredDirectRuleIds=model.publicRuleIds.filter(id=>!measuredDirectRuleIds.includes(id));
const pilotManifest={schemaVersion:'pilot-candidate-1',pilotCandidateVersion:'pilot-candidate-1.0.0',status:'candidate_for_human_piloting',
 itemBank:{version:bank.bankVersion,path:paths.bank},constructRegistry:{version:priorModel.registryVersion,path:'data/constructs.json'},
 sourceRoute:{version:priorForm.policyVersion,assignedItems:240,selectionSeed:seed},
 route:{version:form.policyVersion,path:'data/philosophy/public-pilot-v1.json',instrumentVersion:form.instrumentVersion,
  instrumentManifestPath:'data/instruments/worldview-pilot-v1.json',assignedItems:238,
  exactItemRevisions:form.frozenItems,domainCounts:Object.fromEntries(model.domains.map(d=>[d.id,selected.filter(e=>e.domainId===d.id).length])),
  removedItemIds:Object.keys(removed)},
 interpretationRules:{version:model.modelVersion,path:'data/generic/model-v1.0-pilot.json',directRuleIds:model.publicRuleIds,
  routeMeasuredDirectRuleIds:measuredDirectRuleIds,routeNotMeasuredDirectRuleIds:notMeasuredDirectRuleIds,
  researchOnlyRuleIds:model.researchOnlyRuleIds},
 derivedInference:{version:'pilot-derived-1.0.0',ruleIds:model.derivedRules.map(r=>r.id),
  retainedUninferredConstructIds:(decisionGroups.derived_only??[]).map(d=>d.constructId).filter(id=>!model.derivedRules.some(r=>r.constructId===id))},
 resultSemantics:{version:model.resultSemanticsVersion,engineVersion:model.engineVersion},
 evidenceThresholds:{kind:'authored_duplicate_control',version:'pilot-evidence-units-1.0.0',minimumUnitsFromRule:true,psychometricallyCalibrated:false},
 unresolvedConstructIds:audit.decisions.filter(d=>['unresolved','requires_new_discriminating_items'].includes(d.disposition)).map(d=>d.constructId),
 researchOnlyConstructIds:(decisionGroups.research_only??[]).map(d=>d.constructId),
 splitConstructIds:(decisionGroups.split??[]).map(d=>d.constructId),
 previousAuditDispositions:Object.fromEntries(Object.entries(decisionGroups).map(([status,decisions])=>[status,decisions.map(d=>d.constructId)])),
 deprecatedConstructIds:registry.constructs.filter(c=>c.measurementStatus==='deprecated').map(c=>c.id),
 contentReview:{version:contentReview.reviewVersion,path:'data/pilots/content-review-v1.json'},
 sourceHashes:historical,
 frozenArtifactHashes:Object.fromEntries(await Promise.all([
  'data/pilots/content-review-v1.json','data/generic/model-v1.0-pilot.json','data/philosophy/public-pilot-v1.json',
  'data/experience/policy-v1.4.json','data/instruments/worldview-pilot-v1.json'].map(async p=>[p,sha(await raw(p))]))),
 limitations:['No participant testing, reliability, factor structure, item discrimination, calibrated thresholds, or normative distribution has been established.',
  'The route includes theoretically motivated research questions that do not generate respondent-facing propositions.',
  'A not-measured proposition reflects insufficient appropriate route content, even when one relevant response is present.']};
await write('data/pilots/pilot-candidate-v1.json',pilotManifest);

const current=await read('data/current.json');
current.worldviewModel={version:model.modelVersion,path:'data/generic/model-v1.0-pilot.json'};
current.fullForm={version:form.policyVersion,path:'data/philosophy/public-pilot-v1.json'};
current.quizExperience={version:experience.experienceVersion,path:'data/experience/policy-v1.4.json',entrypoint:'apps/quiz/index.html'};
current.pilotCandidate={version:pilotManifest.pilotCandidateVersion,path:'data/pilots/pilot-candidate-v1.json'};
await write('data/current.json',current);
await write('docs/FULL_ROUTE.md',`# Full route releases\n\nThe active pilot candidate is \`${form.policyVersion}\` with interpretation model \`${model.modelVersion}\`. It fixes ${selected.length} distinct questions and exact revisions across twelve domains. The earlier \`${priorForm.policyVersion}\` route remains at its versioned path and still assigns 240 questions by seed. The 80, 120, and 160-question releases remain available.\n\nThe pre-pilot review removed \`NEI030\` and \`EXI017\` for the reasons recorded in [the 240-item content review](../data/pilots/content-review-v1.json). No released item text or historical interpretation rule was rewritten. The active route has ${measuredDirectRuleIds.length} public direct rules with enough authored directional content and ${notMeasuredDirectRuleIds.length} public direct rules that this route cannot measure. Actual respondent evidence can still be insufficient or mixed.\n\nSee [the pilot contract](PILOT_V1.md) and [the prior 49-construct audit](UNMAPPED_AUDIT.md). A two-unit rule is an editorial threshold, not a reliability estimate.\n`);
let quizGuide=await raw('docs/QUIZ_EXPERIENCE.md');
quizGuide=quizGuide.replace('80/120/160/240 questions','80/120/160/238 questions').replace('quiz-1.4.0','quiz-1.5.0');
quizGuide=quizGuide.replace('Finishing produces an actual twelve-topic summary.','Finishing produces an evidence-backed twelve-topic summary. The pilot route presents a short overview, domain and subfacet groups, mixed or insufficient evidence, not-measured areas, and inspectable answer and source provenance.');
await write('docs/QUIZ_EXPERIENCE.md',quizGuide);
let readme=await raw('README.md');
readme=readme.split('\n## V1 pilot candidate\n')[0];
await write('README.md',readme+'\n## V1 pilot candidate\n\nThe active full-depth route is the frozen 238-item `pilot-candidate-1.0.0`. It keeps the earlier 240-question full form and all historical models at their versioned paths. Results separate route content gaps from respondent-level insufficient evidence and expose direct/derived provenance without percentages or assigned identities. See [the pilot contract](docs/PILOT_V1.md).\n\n## Data and optional research contribution\n\nThe public quiz has no account, analytics tracker, or automatic answer submission. Optional research contribution is disabled on the server by default; when enabled, it requires explicit per-attempt consent and supports receipt-based withdrawal. The private, consent-filtered package preserves raw answers and exact version snapshots. See [data boundaries and research handoff](docs/RESEARCH_DATA.md), [the data dictionary](docs/RESEARCH_DATA_DICTIONARY.md), and [public operations](docs/OPERATIONS.md).\n');
const buildOut=await read('data/academic/build-output.json');
buildOut.paths=[...new Set([...buildOut.paths,'data/pilots/content-review-v1.json','data/pilots/pilot-candidate-v1.json',
 'data/generic/model-v1.0-pilot.json','data/philosophy/public-pilot-v1.json','data/experience/policy-v1.4.json',
 'data/instruments/worldview-pilot-v1.json'])].sort();
await write('data/academic/build-output.json',buildOut);
for(const [p,hash] of Object.entries(historical))assert.equal(sha(await raw(p)),hash,'Historical artifact changed: '+p);
console.log(JSON.stringify({pilotCandidateVersion:pilotManifest.pilotCandidateVersion,assignedItems:selected.length,
 publicRules:model.publicRuleIds.length,researchRules:model.researchOnlyRuleIds.length,removedItemIds:Object.keys(removed)},null,2));
