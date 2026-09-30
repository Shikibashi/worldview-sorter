import {randomUUID} from 'node:crypto';
import {compareWorldview} from '../worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../worldview/affinities.js';

const replayInferencePaths=['packages/runtime/index.js','packages/runtime/packet-ordering.js',
 'packages/worldview/index.js','packages/worldview/affinities.js','packages/localization/index.js'];

export function historicalEngineEquality({administrations,engineSources,releases,archiveManifests}){
 if(!administrations.length)return 'no_included_administrations';
 const byRelease=new Map(releases.map(release=>[release.releaseVersion,release]));
 const extracted=new Map(engineSources.map(source=>[source.sourcePath,source.sha256]));
 if(replayInferencePaths.some(sourcePath=>!extracted.has(sourcePath)))
  throw Error('Research replay lacks a required inference source.');
 let allPinned=true;
 for(const version of new Set(administrations.map(row=>row.modelReleaseVersion))){
  const release=byRelease.get(version);
  if(!release){
   if(version!==null&&version!==undefined)throw Error('Research replay lacks model release '+version);
   allPinned=false;continue;
  }
  const component=release.components.find(row=>row.key==='engine_source');
  if(!component){allPinned=false;continue;}
  const archive=archiveManifests.get(version);
  if(!archive||archive.engineSourceVersion!==component.version)
   throw Error('Research replay lacks the pinned engine archive for '+version);
  const pinned=new Map(archive.files.map(source=>[source.sourcePath,source.sha256]));
  for(const sourcePath of replayInferencePaths){
   if(pinned.get(sourcePath)!==extracted.get(sourcePath))
    throw Error('Historical inference engine differs from extraction-time source: '+version+' / '+sourcePath);
  }
 }
 return allPinned?'pinned_inference_modules_match_extraction':'not_proven_by_model_release_manifest';
}

const count=(rows,key)=>Object.fromEntries([...rows.reduce((map,row)=>{
 const value=String(key(row)??'null');map.set(value,(map.get(value)??0)+1);return map;
},new Map())].sort(([a],[b])=>a.localeCompare(b)));

export function diagnoseResearchRows({respondents,administrations,responses,items,model,consentAudit=null}){
 if(!model)throw Error('The frozen authored model is required to report rule-linked pair exposure.');
 const byAdministration=new Map(administrations.map(a=>[a.researchAdministrationId,[]]));
 const byItem=new Map(items.map(item=>[item.itemId+'@'+item.itemRevision,[]]));
 for(const row of responses){byAdministration.get(row.researchAdministrationId)?.push(row);
  byItem.get(row.itemId+'@'+row.itemRevision)?.push(row);}
 const linked=new Map();
 for(const row of administrations){
  if(typeof row.contributedDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.contributedDate)||
   !Number.isFinite(Date.parse(row.contributedDate))||
   new Date(row.contributedDate).toISOString().slice(0,10)!==row.contributedDate)
   throw Error('Research administration has no valid UTC contribution date.');
  if(!linked.has(row.researchRespondentId))linked.set(row.researchRespondentId,[]);
  linked.get(row.researchRespondentId).push(row);
 }
 const repeatGroups=[...linked.values()].filter(group=>group.length>1);
 const repeatDateGaps=[],repeatSharedRevisionCounts=[],repeatModelVersionCounts=[];
 let sameDayAdditionalAdministrations=0;
 for(const group of repeatGroups){
  const days=[...new Set(group.map(row=>row.contributedDate))].sort();
  sameDayAdditionalAdministrations+=group.length-days.length;
  for(let i=1;i<days.length;i++)repeatDateGaps.push((Date.parse(days[i])-Date.parse(days[i-1]))/86400000);
  const answeredCounts=new Map();
  for(const administration of group){
   const refs=new Set((byAdministration.get(administration.researchAdministrationId)??[])
    .filter(row=>row.responseState==='answered').map(row=>row.itemId+'@'+row.itemRevision));
   for(const ref of refs)answeredCounts.set(ref,(answeredCounts.get(ref)??0)+1);
  }
  repeatSharedRevisionCounts.push([...answeredCounts.values()].filter(value=>value>1).length);
  repeatModelVersionCounts.push(new Set(group.map(row=>row.modelVersion)).size);
 }
 const itemStats=items.map(item=>{
  const rows=byItem.get(item.itemId+'@'+item.itemRevision)??[];
  return {itemId:item.itemId,itemRevision:item.itemRevision,assigned:rows.length,
   presented:rows.filter(row=>row.presented).length,answered:rows.filter(row=>row.responseState==='answered').length,
   missingReasons:count(rows,row=>row.missingReason),
   answerCategories:count(rows.filter(row=>row.responseState==='answered'),row=>JSON.stringify(row.rawValue))};
 });
 const answeredByItem=new Map([...byItem].map(([ref,rows])=>[ref,new Set(rows
  .filter(row=>row.responseState==='answered').map(row=>row.researchAdministrationId))]));
 const coAnswered=(left,right)=>{
  const smaller=left.size<=right.size?left:right,larger=left.size<=right.size?right:left;
  let total=0;for(const id of smaller)if(larger.has(id))total++;return total;
 };
 const rulePairExposure=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id)).map(rule=>{
  const evidence=[...new Map(rule.evidence.filter(e=>byItem.has(e.itemId+'@'+e.itemRevision))
   .map(e=>[e.itemId+'@'+e.itemRevision,e])).values()];
  const pairs=[];
  for(let i=0;i<evidence.length;i++)for(let j=i+1;j<evidence.length;j++){
   const left=evidence[i],right=evidence[j];
   pairs.push({left:{itemId:left.itemId,itemRevision:left.itemRevision},
    right:{itemId:right.itemId,itemRevision:right.itemRevision},
    sameAuthoredUnit:left.unitId!=null&&left.unitId===right.unitId,
    coAnsweredAdministrations:coAnswered(answeredByItem.get(left.itemId+'@'+left.itemRevision),
     answeredByItem.get(right.itemId+'@'+right.itemRevision))});
  }
  return {ruleId:rule.id,pairs};
 }).filter(row=>row.pairs.length);
 return {schemaVersion:'research-diagnostics-1.2.0',unit:'consented administrations in this snapshot',
  administrations:administrations.length,respondentPseudonyms:respondents.length,
  linkedRespondentsWithRepeats:repeatGroups.length,
  repeatedAdministrationRows:repeatGroups.reduce((sum,group)=>sum+group.length-1,0),
  linkedRepeatContributionDateGapDays:count(repeatDateGaps,value=>value),
  linkedRepeatSameDayAdditionalAdministrations:sameDayAdditionalAdministrations,
  linkedRepeatSharedRevisionDistribution:count(repeatSharedRevisionCounts,value=>value),
  linkedRepeatModelVersionCountDistribution:count(repeatModelVersionCounts,value=>value),
  completionStatus:count(administrations,row=>row.completionStatus),
  recordedResponseDistribution:count(administrations,row=>row.recordedResponses),
  substantiveAnswerDistribution:count(administrations,row=>byAdministration.get(row.researchAdministrationId)
   .filter(response=>response.responseState==='answered').length),
  routeVersions:count(administrations,row=>row.instrumentVersion+' / '+row.formPolicyVersion),
  modelVersions:count(administrations,row=>row.modelVersion),
  modelReleaseVersions:count(administrations,row=>row.modelReleaseVersion),
  localeVersions:count(administrations,row=>row.presentationLocale+' / '+(row.localizationBundleVersion??'unpinned')),
  releaseChannels:count(administrations,row=>row.releaseChannel),
  responseFormats:count(responses.filter(row=>row.responseState==='answered'),row=>row.responseType),
  itemRevisions:count(responses,row=>row.itemId+'@'+row.itemRevision),
  missingReasons:count(responses,row=>row.missingReason),
  assignedButNotPresented:responses.filter(row=>!row.presented).length,
  administrationsWithUnreached:[...byAdministration.values()].filter(rows=>rows.some(row=>row.missingReason==='not_reached')).length,
  administrationsWithTwoAnswered:[...byAdministration.values()].filter(rows=>rows.filter(row=>row.responseState==='answered').length>=2).length,
  consentVersions:count(administrations,row=>row.consentVersion),consentAudit,
  itemStats,rulePairExposure};
}

export function assessResearchReadiness(d){
 const any=d.administrations>0,repeat=d.linkedRespondentsWithRepeats>0;
 const answerCount=Object.values(d.responseFormats).reduce((a,b)=>a+b,0);
 const variedItems=d.itemStats.filter(item=>Object.keys(item.answerCategories).length>1).length;
 const joint=d.administrationsWithTwoAnswered>0;
 const observedRulePairs=(d.rulePairExposure??[]).flatMap(rule=>rule.pairs)
  .filter(pair=>pair.coAnsweredAdministrations>0).length;
 const languageGroups=new Set(Object.keys(d.localeVersions).map(key=>key.split(' / ')[0])
  .filter(locale=>locale!=='null'));
 const row=(status,reason)=>({status,reason});
 return {schemaVersion:'research-readiness-1',basis:'Structural screening only. An observed pair, varied category, or linked repeat does not establish adequate effective sample size, estimability, power, or validity; a researcher must assess those for a specified analysis.',
  analyses:{
   itemResponseDistributions:row(any&&answerCount?'feasible_with_important_limitations':'premature',
    any&&answerCount?'Observed category counts are available, but branch, partial completion, and self-selection must be modeled.':
     'No substantive answered response categories are available.'),
   constructExploration:row('premature',joint&&variedItems>0?
    'Joint raw answers and some category variation exist, but their amount and distribution have not been shown adequate for a specified construct analysis. Authored constructs remain hypotheses.':
    'Joint answered items or category variation are not established; authored constructs remain hypotheses.'),
   dimensionalAnalysis:row('premature','Requires overlap, category sparsity, planned-missingness, and effective sample assessment before estimation.'),
   localDependence:row('premature',observedRulePairs?
    `${observedRulePairs} rule-linked pair entries have at least one co-answer, but joint category cells and the proposed dependence model require assessment; authored units are not independence evidence.`:
    joint?'Some items were co-answered, but no co-answer is established for a pair linked by a public rule; inspect item pairs and joint category cells.':
     'No co-answered item pairs are established.'),
   reliability:row('premature','Requires a defensible target score or dimension and estimation plan; current rule thresholds are authored.'),
   testRetest:row('premature',repeat?
    'Linked repeats have contribution-date gaps and shared exact item-revision counts, but response times, sufficient comparable pairs, and consented linkage selection require assessment. Same-day order is unknown.':
    'No linked repeat administrations are present.'),
   routeComparison:row('impossible_with_current_collection','The consented collector accepts only the frozen Full pilot, not Quick, Standard, or adaptive stages.'),
   demographicDIF:row('impossible_with_current_collection','No demographic variables are collected.'),
   measurementInvariance:row('premature','Requires defensible comparison groups and sufficient compatible item overlap; none is assumed.'),
   crossLanguage:row(languageGroups.size>1?'premature':'impossible_with_current_collection',languageGroups.size>1?
    'Multiple locale groups require translation-equivalence review and sufficient comparable observations.':'The consented collector currently accepts approved English only.'),
   interpretationRuleEvaluation:row('premature',any?
    'Rule outputs can be reproduced for a software audit, but raw answer agreement is not an external criterion and cannot establish rule accuracy. Specify a defensible evaluation design first.':
    'No consented observations or external criterion are available.')
  }};
}

export function rekeyResearchRows({respondents,administrations,responses}){
 const respondentIds=new Map(respondents.map(r=>[r.researchRespondentId,'r-'+randomUUID()]));
 const administrationIds=new Map(administrations.map(a=>[a.researchAdministrationId,'a-'+randomUUID()]));
 return {respondents:respondents.map(r=>({...r,researchRespondentId:respondentIds.get(r.researchRespondentId)})),
  administrations:administrations.map(a=>({...a,researchAdministrationId:administrationIds.get(a.researchAdministrationId),
   researchRespondentId:respondentIds.get(a.researchRespondentId)})),
  responses:responses.map(r=>({...r,researchAdministrationId:administrationIds.get(r.researchAdministrationId)}))};
}

export function buildQualityFlags({administrations,responses}){
 const byAdministration=new Map(administrations.map(a=>[a.researchAdministrationId,[]]));
 const repeats=new Map();
 for(const a of administrations)repeats.set(a.researchRespondentId,(repeats.get(a.researchRespondentId)??0)+1);
 for(const r of responses)byAdministration.get(r.researchAdministrationId)?.push(r);
 return administrations.map(a=>{
  const rows=byAdministration.get(a.researchAdministrationId),flags=[];
  if(a.completionStatus==='in_progress')flags.push('partial_administration');
  if(rows.some(r=>r.missingReason==='not_reached'))flags.push('unreached_positions');
  if(rows.some(r=>r.missingReason==='branch_not_shown'))flags.push('branch_exclusions');
  if((repeats.get(a.researchRespondentId)??0)>1)flags.push('linked_repeat');
  if(a.localizationBundleVersion===null)flags.push('historical_wording_unpinned');
  if(a.modelReleaseVersion===null)flags.push('model_release_unpinned');
  return {researchAdministrationId:a.researchAdministrationId,flags};
 });
}

export function buildItemCodebook({items,bank,model,registry,localizationBundles,scalesDoc}){
 const byItem=new Map(bank.items.map(item=>[item.id,item]));
 const constructs=new Map(registry.constructs.map(c=>[c.id,c]));
 const scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));
 return items.map(ref=>{
  const item=byItem.get(ref.itemId);
  if(!item||item.revision!==ref.itemRevision)throw Error('Codebook item revision is unavailable: '+ref.itemId);
  const rules=model.commitments.filter(rule=>rule.evidence.some(e=>e.itemId===item.id&&e.itemRevision===item.revision));
  return {position:ref.position,itemId:item.id,itemRevision:item.revision,canonicalText:item.text,
   domainId:item.domainId,responseType:item.responseType,responseScaleId:item.responseScaleId,
   responseScale:scales.get(item.responseScaleId),options:item.options,specialStates:item.specialStates,
   eligibility:item.eligibility,targets:item.targets.map(t=>({...t,constructName:constructs.get(t.constructId)?.name??null})),
   authoredRuleUses:rules.map(rule=>({propositionId:rule.id,proposition:rule.proposition??null,
    scope:rule.scope??null,propositionBasis:rule.proposition?'explicit_rule_proposition':'inherited_rule_scope',
    use:model.publicRuleIds.includes(rule.id)?'public_direct':model.researchOnlyRuleIds.includes(rule.id)?'research_only':'other_authored',
    evidence:rule.evidence.filter(e=>e.itemId===item.id&&e.itemRevision===item.revision)})),
   localizedRealizations:localizationBundles.map(bundle=>({locale:bundle.locale,bundleVersion:bundle.bundleVersion,
    status:bundle.status,realization:bundle.itemRealizations.find(r=>r.itemId===item.id&&r.itemRevision===item.revision)??null})),
   sourceRefs:item.provenance.sourceRefs,provenance:item.provenance,status:item.status,
   wordingNotes:item.notes??null};
 });
}

export function buildAuthoredClaimIndex({model,catalog,items}){
 const assigned=new Set(items.map(item=>item.itemId+'@'+item.itemRevision));
 const sources=new Map(model.sources.map(source=>[source.id,source]));
 const affinityUses=new Map();
 for(const tradition of catalog.traditions)for(const criterion of tradition.commitments){
  const id=criterion.mapping?.propositionId;if(!id)continue;
  if(!affinityUses.has(id))affinityUses.set(id,[]);
  affinityUses.get(id).push({traditionId:tradition.id,criterionId:criterion.id,role:criterion.role,
   doctrine:criterion.doctrine,mappingStatus:criterion.mapping.status,
   expectedState:criterion.mapping.expectedState??null,criterionSourceIds:criterion.sourceIds});
 }
 const sourceLinks=rule=>rule.sourceIds.map(sourceId=>{
  const source=sources.get(sourceId);
  if(!source)throw Error('Authored rule cites an unavailable model source: '+sourceId);
  const linkedClaims=(rule.sourceClaims??[]).filter(claim=>claim.sourceId===sourceId)
   .map(claim=>({claim:claim.claim,relationship:claim.relationship}));
  const recordClaim=source.claim??source.implication??null;
  return {sourceId,title:source.title??null,url:source.url??null,
   claimStatus:linkedClaims.length?'rule_linked_claim':recordClaim?'source_record_claim':'topic_only',
   linkedClaims,sourceRecordClaim:recordClaim};
 });
 return {schemaVersion:'authored-claim-index-1',modelVersion:model.modelVersion,
  affinityCatalogVersion:catalog.catalogVersion,
  limitation:'This is a view over authored definitions. Source-link status describes provenance metadata, not whether a question validly supports a philosophical inference.',
  directRules:model.commitments.map(rule=>({id:rule.id,classification:model.publicRuleIds.includes(rule.id)?
   'public_direct':model.researchOnlyRuleIds.includes(rule.id)?'research_only':'other_authored',
   constructId:rule.constructId??null,domainId:rule.domainId??null,label:rule.label??null,
   proposition:rule.proposition??null,scope:rule.scope??null,
   propositionBasis:rule.proposition?'explicit_rule_proposition':'inherited_rule_scope',
   boundary:rule.boundary??null,minimumEvidenceUnits:rule.minimumEvidenceUnits??null,
   mappingStatus:rule.mappingStatus??null,thresholdStatus:rule.thresholdStatus??null,
   evidence:rule.evidence.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId,
    support:e.support,oppose:e.oppose,assignedInFrozenRoute:assigned.has(e.itemId+'@'+e.itemRevision)})),
   sourceLinks:sourceLinks(rule),affinityUses:affinityUses.get(rule.id)??[]})),
  derivedRules:model.derivedRules.map(rule=>({id:rule.id,constructId:rule.constructId??null,
   domainId:rule.domainId??null,proposition:rule.proposition,propositionBasis:'explicit_derived_proposition',
   dependencies:rule.requires,directConflictAnswers:rule.directConflictAnswers??[],
   boundary:rule.boundary??null,sourceLinks:sourceLinks(rule),affinityUses:affinityUses.get(rule.id)??[]}))};
}

export function replayAuthoredRows({administrations,responses,bank,model,scalesDoc,catalog,pilot}){
 const byAdministration=new Map(administrations.map(a=>[a.researchAdministrationId,[]]));
 const rules=new Map(model.commitments.map(rule=>[rule.id,rule]));
 for(const row of responses){if(!byAdministration.has(row.researchAdministrationId))throw Error('Orphan response.');
  byAdministration.get(row.researchAdministrationId).push(row);}
 return administrations.map(a=>{
  const rows=byAdministration.get(a.researchAdministrationId).sort((x,y)=>x.position-y.position);
  const input={bankVersion:a.bankVersion,instrumentVersion:a.instrumentVersion,
   presentedItems:rows.map(row=>({index:row.position,itemId:row.itemId,itemRevision:row.itemRevision,
    domainId:row.domainId,responseScaleId:row.responseScaleId,presented:row.presented,
    skippedByBranch:row.missingReason==='branch_not_shown'})),
   responses:rows.filter(row=>row.responseState!==null).map(row=>({itemId:row.itemId,itemRevision:row.itemRevision,
    state:row.responseState,value:row.rawValue,changedAnswerCount:row.changedAnswerCount}))};
  const report=compareWorldview({model,bank,scalesDoc,input});
  const affinity=evaluatePhilosophicalAffinities({catalog,report,model,pilot});
  return {researchAdministrationId:a.researchAdministrationId,modelVersion:a.modelVersion,
   resultSemanticsVersion:a.resultSemanticsVersion,affinityCatalogVersion:a.affinityCatalogVersion,
   propositions:report.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId))
    .map(c=>({id:c.commitmentId,domainId:c.domainId,constructId:c.constructId,
     proposition:rules.get(c.commitmentId).proposition??null,scope:c.scope,
     propositionBasis:rules.get(c.commitmentId).proposition?'explicit_rule_proposition':'inherited_rule_scope',
     state:c.state,leanDirection:c.leanDirection,supportingUnits:c.supportingUnits,
     opposingUnits:c.opposingUnits,measurementStatus:c.measurementStatus,
     evidence:c.observations.filter(o=>o.rawResponse).map(o=>({itemId:o.itemId,itemRevision:o.itemRevision,
      unitId:o.unitId,meaning:o.state})),sourceIds:c.sourceIds})),
   derived:report.derived.map(d=>({id:d.id,proposition:d.proposition,state:d.state,
    dependencies:d.dependencies,directConflictItemRefs:d.directConflicts.map(x=>({itemId:x.itemId,itemRevision:x.itemRevision})),
    sourceIds:d.sourceIds})),
   affinities:affinity.traditions.map(t=>({traditionId:t.id,summaryState:t.summaryState,
    criteria:t.criteria.map(c=>({criterionId:c.id,role:c.role,mappingStatus:c.mapping.status,
     mappedPropositionId:c.mapping.propositionId??null,finding:c.finding,observedState:c.observedState,
     sourceIds:c.sourceIds}))}))};
 });
}
