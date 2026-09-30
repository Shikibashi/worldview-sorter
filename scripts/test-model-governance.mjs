import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {affinityLegacyScopeDependencies,analyzeImpact,buildDependencyGraph,claimLevelProvenance,releaseNotes,semanticDiff,sourceQuality,traceBasis,validateProposal,
 validateReleaseTransition} from '../packages/governance/index.js';
import {captureRelease,currentFromManifest,loadSnapshot,readJson,validateContentIntegrity,verifyRelease} from '../packages/governance/release.js';
import {describeEngineSource,ENGINE_SOURCE_PATHS,verifyEngineSource} from '../packages/governance/engine-source.js';

const root=fileURLToPath(new URL('../',import.meta.url)),current=await readJson(root,'data/current.json');
const activeManifest=await readJson(root,current.modelRelease.path);
const baselineManifest=await readJson(root,'data/releases/model-release-v1.1.0.json');
const manifest=await readJson(root,'data/releases/model-release-v1.json');
const historical={...currentFromManifest(manifest),modelRelease:{version:manifest.releaseVersion,path:'data/releases/model-release-v1.json'}};
const snapshot=await loadSnapshot(root,currentFromManifest(baselineManifest));
const activeSnapshot=await loadSnapshot(root,current);
const externalWorldProposal=await readJson(root,'data/governance/proposals/MCP-2026-004.json');
assert.equal(validateProposal(externalWorldProposal),externalWorldProposal);
assert.equal(externalWorldProposal.status,'draft');
assert.deepEqual(await verifyRelease(root,current,activeManifest),activeManifest);
assert.deepEqual(await verifyRelease(root,historical,manifest),manifest);
const counts=validateContentIntegrity(snapshot);assert.equal(counts.items,562);assert.equal(counts.routes,3);
assert.equal(validateContentIntegrity(activeSnapshot).publicRules,144);
assert.deepEqual(await captureRelease(root,historical,manifest.releaseVersion),manifest);
assert.deepEqual(await captureRelease(root,current,activeManifest.releaseVersion),activeManifest);
await assert.rejects(captureRelease(root,historical,'model-release-1.1.0'),/engine-source archive/);
assert.equal(activeManifest.components.find(c=>c.key==='engine_source')?.version,current.engineSource.version);
assert.equal((await readJson(root,'data/releases/model-release-v1.5.0.json')).components.find(c=>c.key==='engine_source')?.version,
 'engine-source-1.3.0','The preceding executable snapshot remains pinned.');
const previousManifest=await readJson(root,'data/releases/model-release-v1.2.0.json');
const opportunityManifest=await readJson(root,'data/releases/model-release-v1.3.0.json');
assert.equal(previousManifest.components.find(c=>c.key==='engine_source')?.version,'engine-source-1.0.0');
assert.equal(opportunityManifest.components.find(c=>c.key==='engine_source')?.version,'engine-source-1.1.0');
const opportunityProposal=await readJson(root,'data/governance/proposals/MCP-2026-008.json');
const earlierEngineProposal=await readJson(root,'data/governance/proposals/MCP-2026-006.json');
assert.deepEqual(validateReleaseTransition({previousManifest,nextManifest:opportunityManifest,
 changes:[{objectType:'result_semantics',id:'engine-source',component:'engine_source',kind:'modified',
  changedFields:['engine_source'],risk:'meaning_sensitive'}],
 proposals:[earlierEngineProposal,opportunityProposal],nextSnapshot:activeSnapshot}).approvedProposalIds,['MCP-2026-008']);
await verifyEngineSource(root,current.engineSource,{checkLive:true});
assert.deepEqual(semanticDiff(snapshot,snapshot),[]);
const graph=buildDependencyGraph(snapshot),itemId=snapshot.routes.routes.at(-1).itemRefs[0].itemId;
assert.ok(analyzeImpact(graph,'item',itemId).affected.some(x=>x.to==='route:full'));
const sacredImpact=analyzeImpact(graph,'proposition','ph-sacred-value');
for(const target of ['comparison:compare-ph-sacred-value','coverage:RC09','result_domain:RC','route:full'])
 assert.ok(sacredImpact.affected.some(edge=>edge.to===target),`Sacred-value impact misses ${target}`);
assert.ok(!sacredImpact.affected.some(edge=>edge.to==='route:quick'||edge.to==='route:standard'),
 'A rule must not be reported on a route without any exact evidence item revision.');
assert.ok(sacredImpact.affected.some(edge=>edge.to==='route:full'&&edge.relation==='interpreted_on_route'&&
 edge.itemRefs.some(ref=>ref.itemId==='RCI029'&&ref.itemRevision===1)));
const sacredSourceImpact=analyzeImpact(graph,'source','domain-sacred');
assert.ok(sacredSourceImpact.affected.some(edge=>edge.to==='route:full'&&edge.depth===2),
 'Transitive impact depth must reflect source to rule to route.');
assert.ok(analyzeImpact(graph,'source','project-theory').affected.length>0);
assert.ok(traceBasis(graph,'proposition','ph-stance-independence').sources.length>0);
const traditionTrace=traceBasis(graph,'tradition','pragmatism');
assert.ok(traditionTrace.basis.some(edge=>edge.relation==='doctrine'&&edge.role==='defining'&&edge.doctrine));
assert.ok(traditionTrace.basis.some(edge=>edge.relation==='criterion_mapping'&&
 edge.from==='proposition:construct-EP16'&&edge.mappingStatus==='direct'&&edge.expectedState==='supported'));
const derivedTrace=traceBasis(graph,'derived_rule','derived-RC11-agentic-divine-outlook');
assert.ok(derivedTrace.basis.some(edge=>edge.relation==='derives_from'&&edge.requiredState==='supported'));
const legacyTrace=traceBasis(graph,'proposition','construct-EP16');
assert.ok(legacyTrace.basis.some(edge=>edge.relation==='rule_basis'&&edge.claimStatus==='topic_only'));
assert.ok(legacyTrace.directSourceLinks.some(edge=>edge.from==='source:acad-pragmatism'&&edge.claimStatus==='topic_only'));
assert.ok(legacyTrace.basis.some(edge=>edge.relation==='evidence'&&Number.isInteger(edge.itemRevision)&&
 Array.isArray(edge.support)&&Array.isArray(edge.oppose)&&edge.unitId));
const linkedLedgerSource=snapshot.sourceLedger.sources.find(s=>s.useByRules?.length||s.useByConstructs?.length||s.useByItems?.length);
assert.ok(analyzeImpact(graph,'source',linkedLedgerSource.id).affected.length>0);
assert.equal(sourceQuality(snapshot.sources.sources.find(s=>s.id==='project-theory')),'provisional_project_source');
assert.equal(sourceQuality(snapshot.model.sources.find(s=>s.id==='domain-sacred')),'context_limited_empirical_research');
assert.equal(sourceQuality(snapshot.model.sources.find(s=>s.id==='gen-values')),'academic_author_overview');
const provenanceReport=spawnSync(process.execPath,['scripts/model-governance.mjs','report'],{cwd:root,encoding:'utf8'});
assert.equal(provenanceReport.status,0,provenanceReport.stderr);
const provenance=JSON.parse(provenanceReport.stdout);
assert.ok(provenance.publicRulesWithSoleLimitedSource.some(r=>r.ruleId==='ph-sacred-value'&&
 r.sourceClasses.includes('context_limited_empirical_research')));
assert.ok(provenance.claimLevelProvenance.referencesWithoutExplicitClaim>0);
assert.equal(provenance.claimLevelProvenance.ruleLinkedClaimReferences,8);
assert.equal(provenance.claimLevelProvenance.ruleLinkedSupportingClaimReferences,8);
assert.equal(provenance.claimLevelProvenance.rulesWithoutRuleLinkedSupportingClaim.length,136);
for (const ruleId of ['construct-EP15','construct-EP20','audit2-EP06-testability']) {
 assert.ok(!provenance.claimLevelProvenance.rulesWithoutRuleLinkedSupportingClaim.includes(ruleId));
}
assert.equal(provenance.claimLevelProvenance.totalPublicRuleSourceReferences,
 provenance.claimLevelProvenance.ruleLinkedClaimReferences+
 provenance.claimLevelProvenance.sourceRecordClaimOnlyReferences+
 provenance.claimLevelProvenance.referencesWithoutExplicitClaim);
assert.ok(provenance.claimLevelProvenance.rulesWithNoExplicitSourceClaim.some(r=>r.ruleId==='construct-EP16'&&
 r.sourceIds.includes('acad-pragmatism')));
assert.ok(!provenance.claimLevelProvenance.rulesWithNoExplicitSourceClaim.some(r=>r.ruleId==='ph-sacred-value'));
assert.equal(provenance.explicitPropositionCoverage.publicRuleCount,144);
assert.equal(provenance.explicitPropositionCoverage.withExplicitProposition,21);
assert.equal(provenance.explicitPropositionCoverage.withoutExplicitProposition.length,123);
assert.ok(provenance.explicitPropositionCoverage.withoutExplicitProposition.some(r=>r.ruleId==='construct-EP16'));
assert.equal(provenance.affinityLegacyScopeDependencies.mappedCriterionCount,23);
assert.equal(provenance.affinityLegacyScopeDependencies.criteriaWithoutExplicitRuleProposition.length,14);
assert.equal(provenance.affinityLegacyScopeDependencies.criteriaWithoutLinkedSupportingClaim.length,15);
assert.ok(!provenance.affinityLegacyScopeDependencies.criteriaWithoutLinkedSupportingClaim.some(row=>
 row.propositionId==='audit2-EP06-testability'));
assert.ok(provenance.affinityLegacyScopeDependencies.criteriaWithoutLinkedSupportingClaim.some(row=>
 row.propositionId==='audit2-EP02-complex-knowledge'&&row.ruleProposition));
assert.ok(provenance.affinityLegacyScopeDependencies.criteriaWithoutExplicitRuleProposition.some(row=>
 row.traditionId==='pragmatism'&&row.criterionId==='pragmatic-maxim'&&row.role==='defining'&&
 row.propositionId==='construct-EP16'&&row.legacyScope&&row.criterionSourceIds.includes('sep-pragmatism')));
const opportunities=provenance.routeEvidenceOpportunities;
assert.deepEqual(opportunities.routes.map(route=>[route.routeId,route.thresholdReachablePublicRuleCount,
 route.belowThresholdPublicRuleCount]),[['quick',30,114],['standard',56,88],['full',94,50]]);
const fullOpportunity=opportunities.routes.find(route=>route.routeId==='full');
const selfInterestOpportunity=fullOpportunity.mappedAffinityCriteria.find(criterion=>
 criterion.traditionId==='ethical-egoism'&&criterion.criterionId==='moral-self-interest');
assert.equal(selfInterestOpportunity.thresholdReachable,true);
assert.deepEqual(selfInterestOpportunity.availableSupportUnitIds,['NEI100','NEI101']);
assert.deepEqual(selfInterestOpportunity.availableOpposeUnitIds,['NEI100','NEI101']);
assert.deepEqual(selfInterestOpportunity.administeredItemRefs.map(ref=>ref.itemId+'@'+ref.itemRevision),
 ['NEI100@1','NEI101@1']);
assert.deepEqual(selfInterestOpportunity.omittedMappedItemRefs.map(ref=>ref.itemId+'@'+ref.itemRevision),
 ['NEI102@1']);
assert.ok(fullOpportunity.rulesAtMinimumBothDirections.includes('construct-NE15'));
assert.equal(opportunities.routes.find(route=>route.routeId==='standard').mappedAffinityCriteria.find(criterion=>
 criterion.criterionId==='moral-self-interest').thresholdReachable,false);
const withReviewedTarget=structuredClone(snapshot.model);
withReviewedTarget.commitments.find(rule=>rule.id==='construct-EP16').proposition='Synthetic exact target.';
assert.equal(affinityLegacyScopeDependencies({model:withReviewedTarget,catalog:snapshot.affinity})
 .criteriaWithoutExplicitRuleProposition.length,15);
assert.equal(affinityLegacyScopeDependencies({model:withReviewedTarget,catalog:snapshot.affinity})
 .criteriaWithoutLinkedSupportingClaim.length,18);
const reviewedAffinityRule=withReviewedTarget.commitments.find(rule=>rule.id==='construct-EP16');
reviewedAffinityRule.sourceClaims=[{sourceId:'unlisted-source',relationship:'supports',claim:'Synthetic claim.'}];
assert.equal(affinityLegacyScopeDependencies({model:withReviewedTarget,catalog:snapshot.affinity})
 .criteriaWithoutLinkedSupportingClaim.length,18,'An undeclared source cannot qualify a doctrinal mapping.');
reviewedAffinityRule.sourceClaims=[{sourceId:reviewedAffinityRule.sourceIds[0],relationship:'supports',claim:'Synthetic claim.'}];
assert.equal(affinityLegacyScopeDependencies({model:withReviewedTarget,catalog:snapshot.affinity})
 .criteriaWithoutLinkedSupportingClaim.length,17);
const changed=structuredClone(snapshot);changed.bank.items.find(x=>x.id===itemId).text+=' [synthetic wording change]';
changed.bank.items.find(x=>x.id===itemId).revision++;
const diff=semanticDiff(snapshot,changed);
assert.deepEqual(diff.map(x=>[x.objectType,x.id,x.component,x.risk]),[['item',itemId,'bank','meaning_sensitive']]);
assert.ok(releaseNotes(diff).userVisible[0].includes(itemId));
const routeChange=structuredClone(snapshot);routeChange.routes.routes[0].itemRefs.pop();
assert.ok(semanticDiff(snapshot,routeChange).some(x=>x.objectType==='route'&&x.component==='routes'&&x.risk==='meaning_sensitive'));
const routeBinding=structuredClone(snapshot);routeBinding.routes.modelVersion='synthetic-successor-model';
assert.ok(semanticDiff(snapshot,routeBinding).some(x=>x.objectType==='route'&&x.id==='route-policy'&&
 x.changedFields.includes('modelVersion')),'A route model rebinding must appear in the semantic diff.');
const affinityBinding=structuredClone(snapshot);affinityBinding.affinity.modelVersion='synthetic-successor-model';
assert.ok(semanticDiff(snapshot,affinityBinding).some(x=>x.objectType==='result_semantics'&&x.id==='affinity-catalog-policy'&&
 x.changedFields.includes('modelVersion')),'An affinity model rebinding must appear in the semantic diff.');
const localizationBinding=structuredClone(snapshot);localizationBinding.localization.catalog.modelVersion='synthetic-successor-model';
assert.ok(semanticDiff(snapshot,localizationBinding).some(x=>x.objectType==='localization'&&
 x.id==='catalog/model-binding'&&x.changedFields.includes('modelVersion')),
 'A localization model rebinding must appear in the semantic diff.');
const criterionChange=structuredClone(snapshot);criterionChange.affinity.traditions[0].commitments[0].mapping.status='not_measured';
assert.ok(semanticDiff(snapshot,criterionChange).some(x=>x.objectType==='criterion'&&x.component==='affinity'&&x.risk==='meaning_sensitive'));
const translationChange=structuredClone(snapshot);translationChange.localization.bundles.find(b=>b.locale==='es-ES').status='approved';
assert.ok(semanticDiff(snapshot,translationChange).some(x=>x.objectType==='localization'&&x.component==='localization'&&x.risk==='meaning_sensitive'));
const resultChange=structuredClone(snapshot);resultChange.model.publicRuleIds.pop();
assert.ok(semanticDiff(snapshot,resultChange).some(x=>x.objectType==='result_semantics'&&x.id==='model-policy'));
assert.ok(semanticDiff(snapshot,resultChange).some(x=>x.objectType==='research_classification'&&
 x.id===snapshot.model.publicRuleIds.at(-1)&&x.kind==='removed'));
const next=structuredClone(manifest);next.releaseVersion='model-release-1.1.0';
const nextBank=next.components.find(c=>c.key==='bank');nextBank.version='0.10.0';nextBank.path='data/items/candidate-v0.10.json';nextBank.sha256='synthetic-changed-digest';
const proposal={schemaVersion:'model-change-proposal-1',proposalId:'MCP-2026-001',title:'Synthetic item revision',author:'test',
 objectType:'item',changeClass:'substantive_revision',status:'approved',affectedObjects:[{type:'item',id:itemId}],
 currentBehavior:'Old wording.',proposedBehavior:'New wording.',rationale:'Checks governance contract.',
 philosophicalBasis:{proposition:'Exact target.',neighboringViews:['Nearby position.'],nonEntailments:['No whole-worldview identity.'],
  existingGap:'Current question can miss distinction.',scholarlyDisagreement:'No relevant disagreement in this synthetic fixture.'},
 sourceClaims:[{sourceId:'philpapers-2020',claim:'Taxonomy context.',relationship:'context'}],
 alternatives:['Keep old wording; rejected for this test.'],respondentImpact:'Results may change.',
 historicalCompatibility:'Keep old revision and release.',
 tests:{required:['positive','negative','mixed','missing','false_positive_neighbor','historical'],paths:['scripts/test-model-governance.mjs']},
 review:{approvals:[{role:'philosophical',reviewer:'synthetic test',at:'2026-09-29T00:00:00Z',note:'fixture'},
  {role:'engineering',reviewer:'synthetic test',at:'2026-09-29T00:00:00Z',note:'fixture'}]},
 release:{components:['bank'],migration:'No raw response rewrite.'},implementationRefs:['synthetic fixture']};
assert.equal(validateProposal(proposal),proposal);
assert.equal(validateReleaseTransition({previousManifest:manifest,nextManifest:next,changes:diff,proposals:[proposal]}).changedObjects,1);
const bindingManifest=structuredClone(baselineManifest);bindingManifest.releaseVersion='model-release-1.2.0';
const boundCatalog=bindingManifest.components.find(component=>component.key==='affinity');
boundCatalog.version='philosophical-affinity-1.1.0';boundCatalog.path='data/affinities/catalog-v2.json';
boundCatalog.sha256='synthetic-affinity-binding-digest';
const bindingChanges=semanticDiff(snapshot,affinityBinding);
assert.throws(()=>validateReleaseTransition({previousManifest:baselineManifest,nextManifest:bindingManifest,
 changes:bindingChanges,proposals:[]}),/missing approved proposal for result_semantics:affinity-catalog-policy/,
 'Changing the catalog model binding must not bypass review because the doctrines are unchanged.');
const bindingProposal={...proposal,proposalId:'MCP-2099-008',objectType:'result_semantics',
 affectedObjects:[{type:'result_semantics',id:'affinity-catalog-policy'}],
 release:{components:['affinity'],migration:'Keep the previous catalog bound to its original model release.'}};
assert.equal(validateReleaseTransition({previousManifest:baselineManifest,nextManifest:bindingManifest,
 changes:bindingChanges,proposals:[bindingProposal]}).changedObjects,1);
const propositionId='construct-EP16',claimText='Synthetic philosophical basis for this revised proposition.';
const propositionProposal={...proposal,proposalId:'MCP-2099-003',objectType:'proposition',
 affectedObjects:[{type:'proposition',id:propositionId}],sourceClaims:[{sourceId:'acad-pragmatism',
  claim:claimText,relationship:'supports'}],release:{components:['model'],migration:'Preserve old model.'}};
assert.throws(()=>validateProposal({...propositionProposal,sourceClaims:proposal.sourceClaims}),/context alone is insufficient/);
const propositionSnapshot=structuredClone(snapshot),revisedProposition=propositionSnapshot.model.commitments.find(x=>x.id===propositionId);
revisedProposition.scope+=' [synthetic clarification]';
revisedProposition.proposition=propositionProposal.philosophicalBasis.proposition;
revisedProposition.sourceClaims=propositionProposal.sourceClaims;
const updatedProvenance=claimLevelProvenance(propositionSnapshot.model);
const baselineProvenance=claimLevelProvenance(snapshot.model);
assert.equal(updatedProvenance.ruleLinkedClaimReferences,baselineProvenance.ruleLinkedClaimReferences+1);
assert.equal(updatedProvenance.ruleLinkedSupportingClaimReferences,1);
assert.ok(!updatedProvenance.rulesWithoutRuleLinkedSupportingClaim.includes(propositionId));
const challengedSnapshot=structuredClone(propositionSnapshot);
challengedSnapshot.model.commitments.find(x=>x.id===propositionId).sourceClaims[0].relationship='challenges';
const challengedProvenance=claimLevelProvenance(challengedSnapshot.model);
assert.equal(challengedProvenance.ruleLinkedClaimReferences,1);
assert.equal(challengedProvenance.ruleLinkedSupportingClaimReferences,0,
 'A linked challenge cannot be counted as supporting academic basis.');
assert.ok(challengedProvenance.rulesWithoutRuleLinkedSupportingClaim.includes(propositionId));
assert.equal(updatedProvenance.referencesWithoutExplicitClaim,
 baselineProvenance.referencesWithoutExplicitClaim-1);
const reviewedTrace=traceBasis(buildDependencyGraph(propositionSnapshot),'proposition',propositionId);
assert.ok(reviewedTrace.basis.some(edge=>edge.relation==='claim_supports'&&edge.from==='source:acad-pragmatism'&&
 edge.claim===claimText));
assert.ok(reviewedTrace.directSourceLinks.some(edge=>edge.relation==='claim_supports'&&edge.claim===claimText));
const propositionDiff=semanticDiff(snapshot,propositionSnapshot);
assert.equal(propositionDiff.length,1);
const propositionNext=structuredClone(manifest);propositionNext.releaseVersion='model-release-1.1.0';
const nextModel=propositionNext.components.find(c=>c.key==='model');
nextModel.version='pilot-model-1.1.0';nextModel.path='data/generic/model-v1.1.0.json';nextModel.sha256='synthetic-model-digest';
const propositionRelease=()=>validateReleaseTransition({previousManifest:manifest,nextManifest:propositionNext,
 changes:propositionDiff,proposals:[propositionProposal],nextSnapshot:propositionSnapshot});
assert.equal(propositionRelease().changedObjects,1);
delete revisedProposition.proposition;
assert.throws(propositionRelease,/exact reviewed proposition/);
revisedProposition.proposition='Different target.';
assert.throws(propositionRelease,/exact reviewed proposition/);
revisedProposition.proposition=propositionProposal.philosophicalBasis.proposition;
delete revisedProposition.sourceClaims;
assert.throws(propositionRelease,/retain sourceClaims/);
revisedProposition.sourceClaims=[{...propositionProposal.sourceClaims[0],sourceId:'uncited-source'}];
assert.throws(propositionRelease,/source declared/);
revisedProposition.sourceClaims=[{...propositionProposal.sourceClaims[0],claim:'Unreviewed claim text.'}];
assert.throws(propositionRelease,/matching reviewed supporting source claim/);
const promotedId='audit2-SO13-just-world',promotionSnapshot=structuredClone(snapshot);
promotionSnapshot.model.publicRuleIds.push(promotedId);
promotionSnapshot.model.researchOnlyRuleIds=promotionSnapshot.model.researchOnlyRuleIds.filter(id=>id!==promotedId);
const promotedRule=promotionSnapshot.model.commitments.find(rule=>rule.id===promotedId);
const promotionClaim={sourceId:promotedRule.sourceIds[0],claim:'Synthetic reviewed basis for public use.',relationship:'supports'};
const promotionProposal={...proposal,proposalId:'MCP-2026-005',objectType:'research_classification',
 changeClass:'reclassification',affectedObjects:[{type:'research_classification',id:promotedId},
  {type:'research_classification',id:'research_classification'},
  {type:'result_semantics',id:'model-policy'},{type:'proposition',id:promotedId}],
 philosophicalBasis:{...proposal.philosophicalBasis,proposition:promotedRule.proposition},
 sourceClaims:[promotionClaim],release:{components:['model'],migration:'Keep old classification in the prior model.'}};
const promotionChanges=()=>semanticDiff(snapshot,promotionSnapshot);
assert.ok(promotionChanges().some(change=>change.objectType==='research_classification'&&
 change.id===promotedId&&change.kind==='added'));
assert.ok(releaseNotes(promotionChanges()).userVisible.some(note=>note.includes(promotedId)));
const promotionRelease=()=>validateReleaseTransition({previousManifest:manifest,nextManifest:propositionNext,
 changes:promotionChanges(),proposals:[promotionProposal],nextSnapshot:promotionSnapshot});
assert.throws(promotionRelease,/matching reviewed supporting source claim/,
 'Unchanged research-only rule bytes must not bypass public source review.');
promotedRule.sourceClaims=[promotionClaim];
assert.equal(promotionRelease().changedObjects,promotionChanges().length);
const scopePromotion=structuredClone(snapshot),scopeId='ph-aesthetic-objectivity';
scopePromotion.model.publicRuleIds.push(scopeId);
scopePromotion.model.researchOnlyRuleIds=scopePromotion.model.researchOnlyRuleIds.filter(id=>id!==scopeId);
const scopeProposal={...promotionProposal,affectedObjects:promotionProposal.affectedObjects.map(object=>
 object.id===promotedId?{...object,id:scopeId}:object)};
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:propositionNext,
 changes:semanticDiff(snapshot,scopePromotion),proposals:[scopeProposal],nextSnapshot:scopePromotion}),
 /exact reviewed proposition/,'A legacy scope cannot become a public standalone proposition by list edit.');
assert.throws(()=>validateProposal({...promotionProposal,tests:{required:['positive'],paths:promotionProposal.tests.paths}}),
 /positive, negative, mixed/);
const derivedId='derived-RC11-agentic-divine-outlook',derivedSnapshot=structuredClone(snapshot);
const reviewedDerived=derivedSnapshot.model.derivedRules.find(rule=>rule.id===derivedId);
const derivedClaim={sourceId:reviewedDerived.sourceIds[0],claim:'Synthetic reviewed derived-conjunction basis.',relationship:'supports'};
reviewedDerived.sourceClaims=[derivedClaim];
const derivedProposal={...proposal,proposalId:'MCP-2026-006',objectType:'derived_rule',
 affectedObjects:[{type:'derived_rule',id:derivedId}],
 philosophicalBasis:{...proposal.philosophicalBasis,proposition:reviewedDerived.proposition},
 sourceClaims:[derivedClaim],release:{components:['model'],migration:'Keep the earlier derived rule in the frozen model.'}};
const derivedChanges=()=>semanticDiff(snapshot,derivedSnapshot);
const derivedRelease=(otherProposals=[])=>validateReleaseTransition({previousManifest:manifest,nextManifest:propositionNext,
 changes:derivedChanges(),proposals:[derivedProposal,...otherProposals],nextSnapshot:derivedSnapshot});
assert.throws(()=>derivedRelease(),/derived rule depends on a public exact proposition/,
 'A changed derived rule cannot promote a legacy scope into an exact prerequisite.');
const dependencyProposals=[];
for(const dependency of reviewedDerived.requires){
 const direct=derivedSnapshot.model.commitments.find(rule=>rule.id===dependency.ruleId);
 direct.proposition??='Synthetic reviewed exact prerequisite for '+dependency.ruleId+'.';
 const claim={sourceId:direct.sourceIds[0],claim:'Synthetic reviewed direct prerequisite basis for '+dependency.ruleId+'.',relationship:'supports'};
 direct.sourceClaims=[claim];
 dependencyProposals.push({...proposal,proposalId:'MCP-2026-00'+(7+dependencyProposals.length),
  objectType:'proposition',affectedObjects:[{type:'proposition',id:direct.id}],
  philosophicalBasis:{...proposal.philosophicalBasis,proposition:direct.proposition},
  sourceClaims:[claim],release:{components:['model'],migration:'Retain frozen direct evidence.'}});
}
assert.equal(derivedRelease(dependencyProposals).changedObjects,derivedChanges().length);
delete derivedSnapshot.model.commitments.find(rule=>rule.id===reviewedDerived.requires[1].ruleId).sourceClaims;
assert.throws(()=>derivedRelease(dependencyProposals),/prerequisite lacks a rule-linked supporting source claim/);
const criterionId='pragmatism/pragmatic-maxim';
const criterionProposal={...proposal,proposalId:'MCP-2099-004',objectType:'criterion',
 affectedObjects:[{type:'criterion',id:criterionId}],
 philosophicalBasis:{...proposal.philosophicalBasis,proposition:'Synthetic reviewed pragmatic-maxim doctrine.'},
 sourceClaims:[{sourceId:'sep-pragmatism',claim:'Synthetic reviewed criterion basis.',relationship:'supports'}],
 release:{components:['affinity'],migration:'Preserve old catalog.'}};
const criterionSnapshot=structuredClone(snapshot);
const criterion=criterionSnapshot.affinity.traditions.find(t=>t.id==='pragmatism').commitments.find(c=>c.id==='pragmatic-maxim');
criterion.doctrine=criterionProposal.philosophicalBasis.proposition;
criterion.sourceClaims=criterionProposal.sourceClaims;
const criterionDiff=semanticDiff(snapshot,criterionSnapshot);
assert.deepEqual(criterionDiff.map(change=>[change.objectType,change.id]),[['criterion',criterionId]]);
const affinityNext=structuredClone(manifest);affinityNext.releaseVersion='model-release-1.1.0';
for(const key of ['affinity','affinity_manifest']){
 const component=affinityNext.components.find(c=>c.key===key);
 component.version='philosophical-affinity-1.1.0';component.path=component.path.replace('v1','v1.1');
 component.sha256='synthetic-'+key+'-digest';
}
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:affinityNext,
 changes:criterionDiff,proposals:[criterionProposal],nextSnapshot:criterionSnapshot}),/explicit public proposition/);
for(const status of ['direct','partial']){
 const unsourcedCriterionSnapshot=structuredClone(criterionSnapshot);
 const unsourcedCriterion=unsourcedCriterionSnapshot.affinity.traditions.find(t=>t.id==='pragmatism')
  .commitments.find(c=>c.id==='pragmatic-maxim');
 unsourcedCriterion.mapping={...unsourcedCriterion.mapping,status,
  propositionId:'audit2-EP11-external-world'};
 assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:affinityNext,
  changes:semanticDiff(snapshot,unsourcedCriterionSnapshot),proposals:[criterionProposal],
  nextSnapshot:unsourcedCriterionSnapshot}),/rule-linked supporting source claim on its public proposition/,
  'An exact but unsourced public rule cannot support a new '+status+' affinity mapping.');
}
const derivedCriterionSnapshot=structuredClone(criterionSnapshot);
const derivedCriterion=derivedCriterionSnapshot.affinity.traditions.find(t=>t.id==='pragmatism')
 .commitments.find(c=>c.id==='pragmatic-maxim');
derivedCriterion.mapping={...derivedCriterion.mapping,status:'derived',propositionId:derivedId};
const derivedCriterionRelease=()=>validateReleaseTransition({previousManifest:manifest,nextManifest:affinityNext,
 changes:semanticDiff(snapshot,derivedCriterionSnapshot),proposals:[criterionProposal],nextSnapshot:derivedCriterionSnapshot});
assert.throws(derivedCriterionRelease,/exact sourced derived conclusion/,
 'A new affinity criterion cannot map to the frozen source-unlinked derived rule.');
const candidateDerived=derivedCriterionSnapshot.model.derivedRules.find(rule=>rule.id===derivedId);
candidateDerived.sourceClaims=[{sourceId:candidateDerived.sourceIds[0],relationship:'supports',claim:'Synthetic derived basis.'}];
assert.throws(derivedCriterionRelease,/exact sourced derived prerequisites/,
 'A claim on the derived rule cannot substitute for its direct prerequisites.');
criterion.doctrine='Unreviewed replacement doctrine.';
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:affinityNext,
 changes:criterionDiff,proposals:[criterionProposal],nextSnapshot:criterionSnapshot}),/exact reviewed doctrine/);
criterion.doctrine=criterionProposal.philosophicalBasis.proposition;
const reviewedCriterionSnapshot=structuredClone(criterionSnapshot);
const reviewedMappedRule=reviewedCriterionSnapshot.model.commitments.find(rule=>rule.id===propositionId);
reviewedMappedRule.scope+=' [synthetic clarification]';
reviewedMappedRule.proposition=propositionProposal.philosophicalBasis.proposition;
reviewedMappedRule.sourceClaims=propositionProposal.sourceClaims;
const reviewedCriterionNext=structuredClone(affinityNext),reviewedModel=reviewedCriterionNext.components.find(c=>c.key==='model');
reviewedModel.version=nextModel.version;reviewedModel.path=nextModel.path;reviewedModel.sha256=nextModel.sha256;
assert.equal(validateReleaseTransition({previousManifest:manifest,nextManifest:reviewedCriterionNext,
 changes:semanticDiff(snapshot,reviewedCriterionSnapshot),proposals:[criterionProposal,propositionProposal],
 nextSnapshot:reviewedCriterionSnapshot}).changedObjects,2);
const engineChange={objectType:'result_semantics',id:'engine-source',component:'engine_source',kind:'added',
 changedFields:['engine_source'],risk:'meaning_sensitive'};
const engineNext=structuredClone(next);
engineNext.components.push({key:'engine_source',version:'engine-source-1.1.0',
 path:'data/releases/engine-sources/engine-source-1.1.0/manifest.json',sha256:'synthetic-engine-digest'});
const engineProposal={...proposal,proposalId:'MCP-2026-002',objectType:'result_semantics',
 affectedObjects:[{type:'result_semantics',id:'engine-source'}],release:{components:['engine_source'],migration:'Preserve archived source.'}};
assert.equal(validateReleaseTransition({previousManifest:manifest,nextManifest:engineNext,
 changes:[...diff,engineChange],proposals:[proposal,engineProposal]}).changedObjects,2);
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:engineNext,
 changes:[...diff,engineChange],proposals:[proposal]}),/missing approved proposal for result_semantics:engine-source/);
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:next,changes:diff,proposals:[]}),/missing approved proposal/);
const editorial=structuredClone(snapshot);editorial.bank.items.find(x=>x.id===itemId).notes='Editorial metadata cleanup.';
const editorialDiff=semanticDiff(snapshot,editorial);assert.equal(editorialDiff[0].risk,'editorial_only');
assert.equal(validateReleaseTransition({previousManifest:manifest,nextManifest:next,changes:editorialDiff,proposals:[]}).changedObjects,1);
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:{...next,releaseVersion:manifest.releaseVersion},changes:diff,proposals:[proposal]}),/new model release version/);
const samePath=structuredClone(next);samePath.components.find(c=>c.key==='bank').path=manifest.components.find(c=>c.key==='bank').path;
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:samePath,changes:diff,proposals:[proposal]}),/new path and version/);
const unreviewed={...proposal,status:'draft',review:{approvals:[]}};
assert.throws(()=>validateReleaseTransition({previousManifest:manifest,nextManifest:next,changes:diff,proposals:[unreviewed]}),/missing approved proposal/);
assert.throws(()=>validateProposal({...proposal,tests:{required:['positive'],paths:['scripts/test-model-governance.mjs']}}),/positive, negative, mixed/);
assert.throws(()=>validateProposal({...proposal,review:{approvals:[proposal.review.approvals[0]]}}),/required review roles/);
const sameRevision=structuredClone(snapshot);sameRevision.routes.routes.at(-1).itemRefs[0].itemRevision++;
assert.throws(()=>validateContentIntegrity(sameRevision),/Stale route item revision/);
const cycle=structuredClone(snapshot);cycle.model.derivedRules[0].requires.push({ruleId:cycle.model.derivedRules[0].id,state:'supported'});
assert.throws(()=>validateContentIntegrity(cycle),/Circular derived dependency/);
const wrongSource=structuredClone(snapshot);wrongSource.model.commitments[0].sourceIds.push('missing-synthetic-source');
assert.throws(()=>validateContentIntegrity(wrongSource),/missing source/);
const wrongLedger=structuredClone(snapshot);wrongLedger.sourceLedger.sources[0].useByItems.push('missing-synthetic-item');
assert.throws(()=>validateContentIntegrity(wrongLedger),/Ledger source .* missing item/);
const wrongAffinity=structuredClone(snapshot);wrongAffinity.affinity.traditions[0].commitments[0].mapping.propositionId='missing-synthetic-rule';
assert.throws(()=>validateContentIntegrity(wrongAffinity),/unavailable proposition/);
const temp=await mkdtemp(path.join(os.tmpdir(),'worldview-governance-'));
try{
 const archiveRelative='data/releases/engine-sources/engine-source-1.1.0';
 for(const source of ENGINE_SOURCE_PATHS){for(const target of [source,archiveRelative+'/'+source]){
  await mkdir(path.dirname(path.join(temp,target)),{recursive:true});
  await copyFile(path.join(root,source),path.join(temp,target));}}
 const engineManifest=await describeEngineSource(temp,'engine-source-1.1.0',archiveRelative);
 const engineRef={version:'engine-source-1.1.0',path:archiveRelative+'/manifest.json'};
 await writeFile(path.join(temp,engineRef.path),JSON.stringify(engineManifest));
 await verifyEngineSource(temp,engineRef,{checkLive:true});
 const livePath=path.join(temp,ENGINE_SOURCE_PATHS[0]);
 await writeFile(livePath,(await readFile(livePath,'utf8'))+'\n// synthetic drift\n');
 await verifyEngineSource(temp,engineRef);
 await assert.rejects(verifyEngineSource(temp,engineRef,{checkLive:true}),/Active engine code differs/);
 const archivedPath=path.join(temp,archiveRelative,ENGINE_SOURCE_PATHS[0]);
 await writeFile(archivedPath,(await readFile(archivedPath,'utf8'))+'\n// synthetic tamper\n');
 await assert.rejects(verifyEngineSource(temp,engineRef),/Archived engine source changed/);
 const pilot=await readJson(root,current.pilot.path),quiz=createQuiz({bank:activeSnapshot.bank,pilot,scalesDoc:activeSnapshot.scalesDoc,
 formPolicy:activeSnapshot.routes,seed:'governance-preview',size:64,sessionId:'synthetic-governance'});
 const scales=new Map(activeSnapshot.scalesDoc.scales.map(s=>[s.id,s]));seekQuestion(quiz,activeSnapshot.bank);
 while(quiz.index!==null){const item=currentItem(quiz,activeSnapshot.bank),scale=scales.get(item.responseScaleId);
  const value=['likert','paired_choice'].includes(item.responseType)?scale.options[0].value:
   item.responseType==='ranking'?item.options.map(o=>o.id):item.options[0].id;
  answerQuestion(quiz,activeSnapshot.bank,activeSnapshot.scalesDoc,{state:'answered',value});nextQuestion(quiz,activeSnapshot.bank);}
 const file=path.join(temp,'synthetic-session.json');await writeFile(file,JSON.stringify(quiz.session));
 const preview=spawnSync(process.execPath,['scripts/preview-model-impact.mjs','--from',current.modelRelease.path,
  '--to','current','--session',file],{cwd:root,encoding:'utf8'});
 assert.equal(preview.status,0,preview.stderr);const result=JSON.parse(preview.stdout);
 assert.equal(result.comparable,true);assert.deepEqual(result.propositionChanges,[]);assert.deepEqual(result.affinityChanges,[]);
}finally{await rm(temp,{recursive:true,force:true});}
console.log('Model governance regressions passed: immutable release, semantic diff, impact, approval, stale route, cycle, source, affinity.');
