import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {buildQuizSummary,qualifyAffinityPresentation} from '../packages/experience/summary.js';
import {initialExplorationV2,recordExplorationV2} from '../packages/experience/exploration.js';
import {buildShareSnapshot,validateShareSnapshot,shareSnapshotText,shareSnapshotSvg,compareShareSnapshots,
 readingTrailFor,compareTraditions,recommendExploration} from '../packages/experience/engagement.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const [bank,pilot,scalesDoc,model,policy,catalog,pilotManifest]=await Promise.all([
 read(current.candidateBank.path),read(current.pilot.path),read('data/response-scales.json'),read(current.worldviewModel.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path)]);
const quiz=createQuiz({bank,pilot,scalesDoc,formPolicy:policy,seed:'share-regression',size:64,sessionId:'PRIVATE_SESSION'});
const scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));seekQuestion(quiz,bank);
while(quiz.index!==null){const item=currentItem(quiz,bank),value=['likert','paired_choice'].includes(item.responseType)?scales.get(item.responseScaleId).options[0].value:
 item.responseType==='ranking'?item.options.map(o=>o.id):item.options[0].id;
 answerQuestion(quiz,bank,scalesDoc,{state:'answered',value});nextQuestion(quiz,bank);}
const summary=buildQuizSummary({model,bank,scalesDoc,session:quiz.session,routeManifest:policy,affinityCatalog:catalog,affinityPilot:pilotManifest});
assert.equal(summary.affinities.hasEstablishedAffinity,summary.affinities.traditions.some(t=>t.summaryState==='overlap_on_measured_core'));
assert.equal(summary.affinityPresentation.hasEstablishedAffinity,false,
 'Legacy scope mappings cannot establish a doctrinal affinity in respondent-facing presentation.');
const exactlySourced=new Set(['easy-ontology-scoped','fallibilism-about-knowledge',
 'sensory-empiricism-about-the-external-world','act-consequentialism-scoped',
 'rule-consequentialism-scoped','ethical-egoism','pragmatism']);
assert.ok(summary.affinityPresentation.traditions.filter(t=>!exactlySourced.has(t.traditionId))
 .every(t=>t.state==='legacy_scope_unresolved'&&t.legacyDefiningCriterionIds.length>0));
const easyOnQuick=summary.affinityPresentation.traditions.find(t=>t.traditionId==='easy-ontology-scoped');
assert.ok(easyOnQuick&&easyOnQuick.state!=='legacy_scope_unresolved',
 'An exact sourced proposition must not inherit the six older scope warnings.');
assert.ok([...exactlySourced].every(id=>summary.affinityPresentation.traditions.some(t=>
 t.traditionId===id&&t.state!=='legacy_scope_unresolved')),
 'Every exact sourced comparison must pass the respondent presentation guard.');
const authoredOverlap={traditions:[{id:'synthetic-tradition',summaryState:'overlap_on_measured_core',
 criteria:[{id:'synthetic-defining',role:'defining',mapping:{status:'direct',propositionId:'synthetic-rule'}}]}]};
assert.equal(qualifyAffinityPresentation({affinities:authoredOverlap,model:{commitments:[{id:'synthetic-rule',proposition:null}]}})
 .traditions[0].state,'legacy_scope_unresolved');
assert.equal(qualifyAffinityPresentation({affinities:authoredOverlap,model:{commitments:[{id:'synthetic-rule',proposition:'Synthetic exact target'}]}})
 .traditions[0].state,'source_claim_unresolved','An explicit target without a linked supporting source claim remains unresolved.');
assert.equal(qualifyAffinityPresentation({affinities:authoredOverlap,model:{commitments:[{id:'synthetic-rule',
 proposition:'Synthetic exact target',sourceIds:['synthetic-source'],
 sourceClaims:[{sourceId:'synthetic-source',relationship:'supports',claim:'Synthetic source claim'}]}]}})
 .hasEstablishedAffinity,true,'The presentation guard permits an authored overlap with an explicit, source-linked defining proposition.');
const id='550e8400-e29b-41d4-a716-446655440000',at='2026-09-29T15:00:00.000Z';
const selected=summary.rows.find(r=>!['insufficient_evidence','not_measured'].includes(r.status));assert.ok(selected);
const administration={completed:true,instrumentVersion:quiz.session.instrumentVersion,formPolicyVersion:quiz.packet.formPolicyVersion,
 routeId:quiz.depth.currentRouteId,routeVersion:quiz.packet.routeVersion};
const create=(format,extras={})=>buildShareSnapshot({summary,administration,format,snapshotId:id,createdAt:at,...extras});
const overview=create('overview',{selectedIds:[selected.id]});
assert.equal(validateShareSnapshot(overview),overview);
assert.equal(overview.schemaVersion,'worldview-share-6');
assert.deepEqual(overview.rows[0].sources.map(source=>source.claimScope),selected.sources
 .filter(source=>source.url.startsWith('https://')).slice(0,8).map(source=>source.claimScope));
assert.ok(overview.rows[0].sources.every(source=>source.id&&Array.isArray(source.claimLinks)));
assert.match(shareSnapshotText(overview),/Source basis: .*linked supporting claim/);
const historicalOverview5=structuredClone(overview);historicalOverview5.schemaVersion='worldview-share-5';
for(const row of historicalOverview5.rows)row.sources=row.sources.map(({title,url})=>({title,url}));
assert.equal(validateShareSnapshot(historicalOverview5),historicalOverview5);
assert.doesNotMatch(shareSnapshotText(historicalOverview5),/Source basis:/);
const scopedSourceCard=structuredClone(overview);
scopedSourceCard.rows[0].sources=[
 {id:'support',title:'Supporting source',url:'https://example.org/support',locator:'section 1',claimScope:'rule_linked',
  claimLinks:[{relationship:'supports',claim:'Exact premise supports this proposition.'}],sourceRecordClaim:null,validatesThisQuiz:false},
 {id:'challenge',title:'Challenging source',url:'https://example.org/challenge',locator:'',claimScope:'rule_linked',
  claimLinks:[{relationship:'challenges',claim:'Nearby view contests this premise.'}],sourceRecordClaim:null,validatesThisQuiz:null},
 {id:'context',title:'Context source',url:'https://example.org/context',locator:'',claimScope:'source_record',
  claimLinks:[],sourceRecordClaim:'Background context only.',validatesThisQuiz:null},
 {id:'topic',title:'Topic source',url:'https://example.org/topic',locator:'',claimScope:'topic_only',
  claimLinks:[],sourceRecordClaim:null,validatesThisQuiz:null}];
assert.equal(validateShareSnapshot(scopedSourceCard),scopedSourceCard);
assert.match(shareSnapshotText(scopedSourceCard),/1 linked supporting claim\(s\); 1 linked context\/challenge claim\(s\); 1 source-record context citation\(s\); 1 topic-only citation\(s\)/);
assert.throws(()=>validateShareSnapshot({...scopedSourceCard,rows:[{...scopedSourceCard.rows[0],sources:[
  {...scopedSourceCard.rows[0].sources[3],claimScope:'rule_linked'}]}]}),/Result-source claim scope is inconsistent/);
assert.deepEqual(overview.localization,{locale:'en-US',language:'en',direction:'ltr',bundleVersion:null,catalogVersion:null});
const pinned=create('overview',{selectedIds:[selected.id],administration:{...administration,
 localization:{locale:'en-US',language:'en',direction:'ltr',bundleVersion:'localization-en-US-1.0.0',catalogVersion:'localization-catalog-1.0.0'}}});
assert.equal(validateShareSnapshot(pinned).localization.bundleVersion,'localization-en-US-1.0.0');
assert.equal(compareShareSnapshots(overview,pinned).wordingChanged,true);
assert.match(shareSnapshotText(overview),/historical English, version unpinned/);
const historical={...structuredClone(overview),schemaVersion:'worldview-share-1'};delete historical.localization;
for(const row of historical.rows){row.proposition??=row.scope;delete row.scope;delete row.propositionBasis;
 row.sources=row.sources.map(({title,url})=>({title,url}));}
assert.equal(validateShareSnapshot(historical),historical);
assert.throws(()=>create('overview',{selectedIds:[selected.id],administration:{...administration,
 localization:{locale:'es-ES',language:'es',direction:'ltr',bundleVersion:'draft',catalogVersion:'draft'}}}));
assert.equal(overview.rows[0].status,selected.status);
assert.equal(overview.rows[0].statusLabel,selected.statusLabel);
assert.equal(overview.rows[0].proposition,selected.proposition);
const legacySelected=summary.rows.find(r=>r.propositionBasis==='inherited_rule_scope'&&
 !['insufficient_evidence','not_measured'].includes(r.status));
assert.ok(legacySelected);
assert.equal(legacySelected.proposition,null);
const legacyCard=create('overview',{selectedIds:[legacySelected.id]});
assert.equal(legacyCard.rows[0].proposition,null);
assert.equal(legacyCard.rows[0].scope,legacySelected.scope);
assert.match(legacyCard.rows[0].explanation,/inherited rule scope/);
assert.match(legacyCard.rows[0].statusLabel,/inherited rule scope under the authored rule/);
assert.match(shareSnapshotText(legacyCard),/Authored rule scope:.*no separately recorded proposition/);
assert.throws(()=>validateShareSnapshot({...legacyCard,rows:[{...legacyCard.rows[0],proposition:legacySelected.scope}]}),
 /Invalid proposition projection/);
assert.throws(()=>validateShareSnapshot({...legacyCard,rows:[{...legacyCard.rows[0],inferenceStatus:'derived'}]}),
 /Invalid proposition projection/);
const historicalOverview4=structuredClone(legacyCard);historicalOverview4.schemaVersion='worldview-share-4';
historicalOverview4.rows[0].proposition=historicalOverview4.rows[0].scope;
delete historicalOverview4.rows[0].scope;delete historicalOverview4.rows[0].propositionBasis;
historicalOverview4.rows[0].sources=historicalOverview4.rows[0].sources.map(({title,url})=>({title,url}));
assert.equal(validateShareSnapshot(historicalOverview4),historicalOverview4);
assert.equal(overview.context.notMeasuredCount,summary.rows.filter(r=>r.status==='not_measured').length);
assert.equal(overview.provenance.modelVersion,summary.modelVersion);
assert.equal(overview.provenance.affinityCatalogVersion,catalog.catalogVersion);
assert.equal(overview.provenance.sourceAdministration.routeId,'quick');
assert.ok(!JSON.stringify(overview).includes('PRIVATE_SESSION'));
assert.ok(!JSON.stringify(overview).includes('responses'));
assert.match(shareSnapshotText(overview),/not-measured interpretations/);
assert.match(shareSnapshotSvg(overview),/Exploratory|exploratory/);
assert.doesNotMatch(shareSnapshotSvg(overview),/PRIVATE_SESSION|\d+%/);
assert.throws(()=>validateShareSnapshot({...overview,responses:quiz.session.responses}));
assert.throws(()=>validateShareSnapshot({...overview,rows:[{...overview.rows[0],answer:'secret'}]}));
assert.throws(()=>create('overview',{selectedIds:[summary.rows.find(r=>r.status==='not_measured').id]}));
const unreviewedDerived=summary.rows.find(r=>r.id==='derived-RC11-agentic-divine-outlook');
assert.equal(unreviewedDerived.presentationReview.state,'prerequisite_unresolved');
const syntheticDerivedSummary=structuredClone(summary);
const syntheticDerived=syntheticDerivedSummary.rows.find(r=>r.id===unreviewedDerived.id);
syntheticDerived.status='supported';syntheticDerived.displayState='model_review_required';
const syntheticDomain=syntheticDerivedSummary.domains.find(d=>d.id===syntheticDerived.domainId);
syntheticDomain.rows.find(r=>r.id===syntheticDerived.id).status='supported';
syntheticDomain.rows.find(r=>r.id===syntheticDerived.id).displayState='model_review_required';
assert.throws(()=>buildShareSnapshot({summary:syntheticDerivedSummary,administration,format:'overview',
 selectedIds:[syntheticDerived.id],snapshotId:id,createdAt:at}),/actual responses/);
const derivedDomainCard=buildShareSnapshot({summary:syntheticDerivedSummary,administration,format:'domain',
 domainId:syntheticDerived.domainId,snapshotId:id,createdAt:at});
assert.ok(!derivedDomainCard.rows.some(row=>row.id===syntheticDerived.id));
assert.equal(readingTrailFor(syntheticDerivedSummary,{kind:'proposition',id:syntheticDerived.id}).status,
 'model_review_required');
const domain=create('domain',{domainId:selected.domainId});
assert.ok(domain.rows.every(r=>r.domainId===selected.domainId));
const legacyTradition=summary.affinityPresentation.traditions.find(t=>t.state==='legacy_scope_unresolved');
assert.ok(legacyTradition,'The legacy-scope share fixture requires an unresolved defining criterion.');
const affinity=create('affinity',{traditionId:legacyTradition.traditionId});
assert.ok(affinity.affinity.criteria.every(c=>c.role==='defining'));
assert.match(shareSnapshotText(affinity),/Affinity is comparison, not identity/);
assert.equal(affinity.affinity.presentationState,'legacy_scope_unresolved');
assert.match(shareSnapshotText(affinity),/doctrinal affinity unresolved because defining evidence uses inherited rule scopes/);
const sourceGapCard=structuredClone(affinity);
sourceGapCard.affinity.presentationState='source_claim_unresolved';
sourceGapCard.affinity.legacyDefiningCriterionIds=[];
const sourceGapCriterion=sourceGapCard.affinity.criteria.find(c=>c.evidenceBasis==='inherited_rule_scope');
sourceGapCard.affinity.criteria=[{...sourceGapCriterion,evidenceBasis:'explicit_rule_proposition',
 mappedProposition:'Synthetic explicit proposition',mappedScope:'Synthetic explicit proposition'}];
sourceGapCard.affinity.claimUnlinkedDefiningCriterionIds=[sourceGapCriterion.id];
assert.equal(validateShareSnapshot(sourceGapCard),sourceGapCard);
assert.match(shareSnapshotText(sourceGapCard),/lacks a linked supporting source claim/);
assert.throws(()=>validateShareSnapshot({...sourceGapCard,affinity:{...sourceGapCard.affinity,
 claimUnlinkedDefiningCriterionIds:[]}}),/Affinity presentation qualification is inconsistent/);
assert.ok(affinity.affinity.criteria.some(c=>c.finding==='unmeasured'));
assert.ok(affinity.affinity.criteria.some(c=>c.evidenceBasis==='inherited_rule_scope'&&c.mappedProposition===null&&c.mappedScope));
assert.match(shareSnapshotText(affinity),/inherited rule scope, not a separately recorded proposition/);
assert.ok(affinity.affinity.criteria.every(c=>c.evidenceBasis==='unmapped'?c.observedState===null:typeof c.observedState==='string'));
assert.ok(shareSnapshotSvg(affinity).includes('inherited rule scope, not a separately')&&
 shareSnapshotSvg(affinity).includes('recorded proposition'));
assert.throws(()=>validateShareSnapshot({...affinity,affinity:{...affinity.affinity,
 criteria:affinity.affinity.criteria.map(c=>({...c,mappedScope:null}))}}),
 /Affinity mapped proposition and scope are inconsistent/);
const historicalAffinity4=structuredClone(affinity);historicalAffinity4.schemaVersion='worldview-share-4';
delete historicalAffinity4.affinity.presentationState;delete historicalAffinity4.affinity.legacyDefiningCriterionIds;
delete historicalAffinity4.affinity.claimUnlinkedDefiningCriterionIds;
for(const criterion of historicalAffinity4.affinity.criteria){
 criterion.mappedText=criterion.mappedProposition??criterion.mappedScope;
 delete criterion.mappedProposition;delete criterion.mappedScope;
}
assert.equal(validateShareSnapshot(historicalAffinity4),historicalAffinity4);
const historicalAffinity3=structuredClone(historicalAffinity4);historicalAffinity3.schemaVersion='worldview-share-3';
for(const criterion of historicalAffinity3.affinity.criteria)delete criterion.observedState;
assert.equal(validateShareSnapshot(historicalAffinity3),historicalAffinity3);
const historicalAffinity2=structuredClone(historicalAffinity3);historicalAffinity2.schemaVersion='worldview-share-2';
for(const criterion of historicalAffinity2.affinity.criteria){delete criterion.mappingStatus;delete criterion.evidenceBasis;delete criterion.mappedText;}
assert.equal(validateShareSnapshot(historicalAffinity2),historicalAffinity2);
const partialSummary=structuredClone(summary);
const partialTradition=partialSummary.affinities.traditions.find(t=>t.criteria.some(c=>c.role==='defining'&&c.mapping.status==='partial'));
const partialCriterion=partialTradition.criteria.find(c=>c.role==='defining'&&c.mapping.status==='partial');
partialCriterion.finding='partial';partialCriterion.observedState='opposed';
partialSummary.rows.find(r=>r.id===partialCriterion.mapping.propositionId).status='opposed';
const partialCard=buildShareSnapshot({summary:partialSummary,administration,format:'affinity',traditionId:partialTradition.id,
 snapshotId:id,createdAt:at});
assert.match(shareSnapshotText(partialCard),/partial doctrinal mapping; doctrine unresolved/);
assert.match(shareSnapshotText(partialCard),/linked interpretation state: opposed/);
let activity=initialExplorationV2();activity=recordExplorationV2(activity,{type:'completed',routeId:'quick'});
activity=recordExplorationV2(activity,{type:'domain_opened',domainId:'ME'});
activity=recordExplorationV2(activity,{type:'tradition_opened',traditionId:'pragmatism'});
activity=recordExplorationV2(activity,{type:'source_opened',domainId:'ME'});
assert.deepEqual(activity.milestones,['source-trail-opened']);
const exploration=create('exploration',{exploration:activity});
assert.deepEqual(exploration.activity.domainIds,['ME']);
assert.ok(!JSON.stringify(exploration).includes('PRIVATE_SESSION'));
assert.throws(()=>recordExplorationV2(activity,{type:'domain_opened',domainId:'ME',answer:'supported'}));
assert.throws(()=>recordExplorationV2(activity,{type:'completed',routeId:'quick',elapsedMs:2}));
assert.throws(()=>recordExplorationV2(initialExplorationV2(),{type:'source_opened',domainId:'ME'}));
assert.deepEqual(activity,recordExplorationV2(activity,{type:'source_opened',domainId:'ME'}));
let allActivity=activity;
for(const domain of ['NE','MF','VA','EP','OM','MS','AH','RC','EX','SO','PL'])allActivity=recordExplorationV2(allActivity,{type:'domain_opened',domainId:domain});
allActivity=recordExplorationV2(allActivity,{type:'tradition_opened',traditionId:'philosophical-anarchism'});
allActivity=recordExplorationV2(allActivity,{type:'completed',routeId:'standard'});
assert.deepEqual(allActivity.milestones,['all-domains-explored','source-trail-opened','two-traditions-inspected','multiple-depths-explored']);
assert.throws(()=>recordExplorationV2(allActivity,{type:'completed',routeId:'objectivism'}));
assert.deepEqual(buildQuizSummary({model,bank,scalesDoc,session:quiz.session,routeManifest:policy,affinityCatalog:catalog,affinityPilot:pilotManifest}),summary,
 'Exploration activity cannot alter interpretation or affinity results.');
const modelChange=compareShareSnapshots(overview,{...structuredClone(overview),provenance:{...overview.provenance,modelVersion:'future'}});
assert.equal(modelChange.sameModel,false);assert.equal(modelChange.sharedPropositions.length,0);
const same=compareShareSnapshots(overview,{...structuredClone(overview),snapshotId:'550e8400-e29b-41d4-a716-446655440001'});
if(selected.proposition)assert.equal(same.sharedPropositions[0].before,selected.status);
else assert.equal(same.sharedScopes[0].before,selected.status);
const legacyComparison=compareShareSnapshots(legacyCard,{...structuredClone(legacyCard),snapshotId:'550e8400-e29b-41d4-a716-446655440002'});
assert.equal(legacyComparison.sharedPropositions.length,0);
assert.equal(legacyComparison.sharedScopes[0].before,legacySelected.status);
const trail=readingTrailFor(summary,{kind:'proposition',id:selected.id});
assert.equal(trail.status,selected.status);assert.ok(trail.sources.every(s=>s.url.startsWith('https://')));
const traditions=summary.affinities.traditions;
assert.equal(readingTrailFor(summary,{kind:'tradition',id:legacyTradition.traditionId}).status,'legacy_scope_unresolved');
const comparison=compareTraditions(summary.affinities,traditions[0].id,traditions[1].id);
assert.ok(comparison.left.criteria.length&&comparison.right.criteria.length);
assert.match(comparison.note,/does not make the traditions identical or rank them/);
const plans=[{domainId:selected.domainId,entries:[{itemId:'synthetic'}]}];
const actions=recommendExploration({summary,clarificationPlans:plans});
assert.ok(actions.length<=1);assert.ok(actions.every(a=>a.count===1&&a.reason));
assert.throws(()=>buildShareSnapshot({summary:{responses:quiz.session.responses},administration,format:'overview',selectedIds:[selected.id],snapshotId:id,createdAt:at}));
assert.throws(()=>buildShareSnapshot({summary,administration:{...administration,responses:quiz.session.responses},format:'overview',selectedIds:[selected.id],snapshotId:id,createdAt:at}));
console.log('Engagement regressions passed: versioned evidence projections, privacy, uncertainty, activity isolation, comparison, reading, and recommendations.');
