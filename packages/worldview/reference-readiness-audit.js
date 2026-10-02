export class ReferenceReadinessAuditError extends Error {
  constructor(message){super(message);this.name='ReferenceReadinessAuditError';}
}

const fail=(message)=>{throw new ReferenceReadinessAuditError(message);};
const requireValue=(condition,message)=>{if(!condition)fail(message);};
const claimRoles=new Set(['core','major','minor']);
const entityTypes=new Set(['philosopher','tradition']);
const evidenceBases=new Set(['primary_text','scholarly_reconstruction','editorial_hypothesis']);
const mappingAssessments=new Set(['exact','partial','recognized_unmeasured','missing_proposition','unsuitable','context_only']);
const expectedStates=new Set(['supported','opposed']);
const assessmentToStatus={
  partial:'PARTIAL',
  recognized_unmeasured:'UNMEASURED',
  missing_proposition:'MISSING_PROPOSITION',
  unsuitable:'UNSUITABLE',
  context_only:'CONTEXT_ONLY'
};

const revisionKey=(itemId,itemRevision)=>`${itemId}@${itemRevision}`;
const ruleMap=(model)=>new Map([
  ...(model.commitments??[]).map(rule=>[rule.id,{...rule,ruleKind:'direct'}]),
  ...(model.derivedRules??[]).map(rule=>[rule.id,{...rule,ruleKind:'derived'}])
]);

function validateTextArray(value,path,{minimum=1}={}){
  requireValue(Array.isArray(value)&&value.length>=minimum,`${path} must contain at least ${minimum} entries.`);
  value.forEach((entry,index)=>requireValue(typeof entry==='string'&&entry.trim().length>0,`${path}[${index}] must be non-empty text.`));
}

function validateSourceRegistry(spec,authoringPolicy){
  requireValue(Array.isArray(spec.sources)&&spec.sources.length>0,'Audit sources are required.');
  const ids=new Set();
  for(const source of spec.sources){
    requireValue(source&&typeof source==='object','Audit source must be an object.');
    requireValue(typeof source.id==='string'&&source.id.length>0&&!ids.has(source.id),`Duplicate or empty source id: ${source?.id}.`);
    ids.add(source.id);
    requireValue(typeof source.title==='string'&&source.title.trim().length>0,`Source ${source.id} needs a title.`);
    requireValue(typeof source.url==='string'&&source.url.startsWith('https://'),`Source ${source.id} needs an HTTPS URL.`);
    requireValue(authoringPolicy.allowedSourceClasses?.includes(source.sourceClass),`Source ${source.id} has a source class not allowed by the authoring policy.`);
  }
  return ids;
}

export function validateReferenceReadinessSpec({spec,model,bank,routes,affinityCatalog,sourceLedger,authoringPolicy}){
  requireValue(spec?.schemaVersion==='1.0.0','Unsupported readiness-audit schema version.');
  requireValue(typeof spec.auditVersion==='string'&&spec.auditVersion.length>0,'Readiness audit version is required.');
  requireValue(spec.authoringBoundary==='independent_authoring','Audit must declare independent authoring.');
  requireValue(authoringPolicy?.thirdPartyProfileDatasetsAsContentSources===false,'Third-party profile datasets cannot be content sources.');
  requireValue(authoringPolicy?.publicComparison?.aggregateScoreAllowed===false,'Aggregate comparison output must remain disabled.');
  requireValue(authoringPolicy?.publicComparison?.identityAssignmentAllowed===false,'Identity assignment must remain disabled.');
  requireValue(Array.isArray(model.commitments)&&Array.isArray(model.publicRuleIds),'Active model commitments and public rules are required.');
  requireValue(Array.isArray(routes.routes)&&Array.isArray(spec.routeOrder),'Active public routes and an explicit route order are required.');
  const known=ruleMap(model),bankItems=new Set((bank.items??[]).map(item=>revisionKey(item.id,item.revision)));
  const routeIds=new Set(routes.routes.map(route=>route.id));
  requireValue(spec.routeOrder.length===routes.routes.length&&spec.routeOrder.every(id=>routeIds.has(id)),'Audit route order must enumerate each active route exactly once.');
  for(const route of routes.routes){
    requireValue(Array.isArray(route.itemRefs)&&route.itemRefs.length===route.size,`Route ${route.id} itemRefs do not match its declared size.`);
    const seen=new Set();
    for(const ref of route.itemRefs){
      const key=revisionKey(ref.itemId,ref.itemRevision);
      requireValue(bankItems.has(key),`Route ${route.id} references missing item revision ${key}.`);
      requireValue(!seen.has(key),`Route ${route.id} repeats item revision ${key}.`);
      seen.add(key);
    }
  }
  for(const ruleId of model.publicRuleIds){
    const rule=known.get(ruleId);
    requireValue(Boolean(rule),`Public model rule ${ruleId} does not resolve.`);
    if(rule.ruleKind==='direct')for(const ref of rule.evidence??[]){
      requireValue(bankItems.has(revisionKey(ref.itemId,ref.itemRevision)),`Public rule ${ruleId} references missing item revision ${revisionKey(ref.itemId,ref.itemRevision)}.`);
    }
  }
  const sourceIds=validateSourceRegistry(spec,authoringPolicy);
  const candidateIds=new Set(),claimIds=new Set();
  requireValue(Array.isArray(spec.candidates)&&spec.candidates.length>=8&&spec.candidates.length<=12,'The initial audit must cover between 8 and 12 candidates.');
  for(const candidate of spec.candidates){
    requireValue(candidate&&typeof candidate==='object','Candidate must be an object.');
    requireValue(typeof candidate.id==='string'&&candidate.id.length>0&&!candidateIds.has(candidate.id),`Duplicate or empty candidate id: ${candidate?.id}.`);
    candidateIds.add(candidate.id);
    requireValue(entityTypes.has(candidate.entityType),`Candidate ${candidate.id} has an invalid entity type.`);
    requireValue(typeof candidate.label==='string'&&candidate.label.trim().length>0,`Candidate ${candidate.id} needs a label.`);
    requireValue(typeof candidate.scope==='string'&&candidate.scope.trim().length>0,`Candidate ${candidate.id} needs a scope.`);
    validateTextArray(candidate.neighbors,`${candidate.id}.neighbors`);
    validateTextArray(candidate.nonEntailments,`${candidate.id}.nonEntailments`);
    validateTextArray(candidate.limitations,`${candidate.id}.limitations`);
    requireValue(Array.isArray(candidate.claims)&&candidate.claims.length>0,`Candidate ${candidate.id} needs claims.`);
    if(candidate.existingAffinityId){
      requireValue(affinityCatalog.traditions?.some(row=>row.id===candidate.existingAffinityId),`Candidate ${candidate.id} references unknown affinity ${candidate.existingAffinityId}.`);
    }
    for(const claim of candidate.claims){
      requireValue(claim&&typeof claim==='object',`Candidate ${candidate.id} has an invalid claim.`);
      requireValue(typeof claim.id==='string'&&claim.id.length>0&&!claimIds.has(claim.id),`Duplicate or empty claim id: ${claim?.id}.`);
      claimIds.add(claim.id);
      requireValue(claim.entityType===candidate.entityType,`Claim ${claim.id} entity type does not match its candidate.`);
      requireValue(typeof claim.proposition==='string'&&claim.proposition.trim().length>0,`Claim ${claim.id} needs a concise proposition.`);
      requireValue(claimRoles.has(claim.doctrinalRole),`Claim ${claim.id} has an invalid doctrinal role.`);
      requireValue(evidenceBases.has(claim.evidenceBasis),`Claim ${claim.id} has an invalid evidence basis.`);
      requireValue(Object.hasOwn(claim,'expectedPropositionState')&&(claim.expectedPropositionState===null||expectedStates.has(claim.expectedPropositionState)),`Claim ${claim.id} has an invalid expected proposition state.`);
      requireValue(mappingAssessments.has(claim.mappingAssessment),`Claim ${claim.id} has an invalid mapping assessment.`);
      const hasMap=['exact','partial','recognized_unmeasured'].includes(claim.mappingAssessment);
      if(hasMap)requireValue(typeof claim.propositionId==='string'&&known.has(claim.propositionId),`Claim ${claim.id} references unknown proposition ${claim.propositionId}.`);
      else requireValue(claim.propositionId===undefined,`Claim ${claim.id} cannot give an exact proposition reference for ${claim.mappingAssessment}.`);
      if(claim.mappingAssessment==='exact'||claim.mappingAssessment==='partial'){
        requireValue(expectedStates.has(claim.expectedPropositionState),`Mapped claim ${claim.id} needs an expected supported/opposed state.`);
      }
      if(claim.mappingAssessment==='missing_proposition'){
        requireValue(claim.propositionId===undefined,`Missing-proposition claim ${claim.id} cannot be mapped as if a proposition existed.`);
        requireValue(typeof claim.expectedPropositionState==='string'&&expectedStates.has(claim.expectedPropositionState),`Missing-proposition claim ${claim.id} must state the expected direction for a future proposition.`);
      }
      if(claim.mappingAssessment==='context_only'||claim.mappingAssessment==='unsuitable'){
        requireValue(claim.expectedPropositionState===null,`Non-comparison claim ${claim.id} must not state a respondent result direction.`);
      }
      if(claim.mappingAssessment==='recognized_unmeasured'){
        requireValue(expectedStates.has(claim.expectedPropositionState),`Unmeasured claim ${claim.id} must state its expected future direction.`);
      }
      if(claim.evidenceBasis==='editorial_hypothesis'&&claim.doctrinalRole==='core'){
        fail(`Core claim ${claim.id} cannot use editorial_hypothesis as comparison evidence.`);
      }
      if(claim.evidenceBasis==='editorial_hypothesis'){
        requireValue(['context_only','unsuitable'].includes(claim.mappingAssessment),`Editorial hypothesis ${claim.id} must be context-only or unsuitable.`);
      }
      if(claim.relatedPropositionIds){
        requireValue(Array.isArray(claim.relatedPropositionIds),`Claim ${claim.id} related proposition references must be an array.`);
        for(const id of claim.relatedPropositionIds)requireValue(known.has(id),`Claim ${claim.id} references unknown related proposition ${id}.`);
      }
      validateTextArray(claim.neighboringViews,`${claim.id}.neighboringViews`);
      validateTextArray(claim.nonEntailments,`${claim.id}.nonEntailments`);
      validateTextArray(claim.limitations,`${claim.id}.limitations`);
      requireValue(Array.isArray(claim.sourceClaims)&&claim.sourceClaims.length>0,`Claim ${claim.id} needs source claims.`);
      for(const sourceClaim of claim.sourceClaims){
        requireValue(sourceIds.has(sourceClaim.sourceId),`Claim ${claim.id} references unknown audit source ${sourceClaim.sourceId}.`);
        requireValue(typeof sourceClaim.claim==='string'&&sourceClaim.claim.trim().length>0,`Claim ${claim.id} has an empty source claim.`);
        requireValue(typeof sourceClaim.locator==='string'&&sourceClaim.locator.trim().length>0,`Claim ${claim.id} source ${sourceClaim.sourceId} needs a locator.`);
      }
    }
  }
  for(const lead of spec.existingItemLeads??[]){
    requireValue(candidateIds.has(lead.candidateId),`Item lead ${lead.id} references unknown candidate ${lead.candidateId}.`);
    requireValue(bankItems.has(revisionKey(lead.itemId,lead.itemRevision)),`Item lead ${lead.id} references missing item revision.`);
  }
  for(const gap of spec.futureDiscriminatorNeeds??[]){
    requireValue(candidateIds.has(gap.candidateId),`Future discriminator references unknown candidate ${gap.candidateId}.`);
  }
  for(const row of sourceLedger.sources??[]){
    requireValue(typeof row.id==='string','Source ledger contains a source without an id.');
  }
  return true;
}

function sourceQualificationForRule(rule,sourceLedger){
  const sources=new Map((sourceLedger.sources??[]).map(source=>[source.id,source]));
  const referenced=[...new Set([...(rule.sourceIds??[]),...(rule.sourceClaims??[]).map(claim=>claim.sourceId)])];
  if(!referenced.length)return {status:'unresolved',sourceIds:[],unresolvedSourceIds:[],itemValidityClaimed:false};
  const unresolved=referenced.filter(id=>!sources.has(id));
  const linked=Array.isArray(rule.sourceClaims)&&rule.sourceClaims.length>0;
  return {
    status:unresolved.length?'unresolved':linked?'claim_linked':'source_ids_only',
    sourceIds:referenced,
    unresolvedSourceIds:unresolved,
    sources:referenced.filter(id=>sources.has(id)).map(id=>{
      const source=sources.get(id);
      return {id:source.id,title:source.title,url:source.url,evidenceType:source.evidenceType??null,access:source.access??null,sourceRole:source.sourceRole??null,detailedUseLimit:source.detailedUseLimit??null,validatesOurItems:source.validatesOurItems??null};
    }),
    itemValidityClaimed:false,
    note:'Philosophical source support is separate from evidence that an item or response threshold is valid.'
  };
}

function routeRuleOpportunity({ruleId,route,model,rulesById,publicRuleIds,bankItemsByRevision,seen=[]}){
  if(seen.includes(ruleId))fail(`Circular route-evidence dependency at ${ruleId}.`);
  const rule=rulesById.get(ruleId);
  if(!rule)return {ruleId,routeId:route.id,capable:false,reason:'unknown_rule',eligibleEvidenceUnits:0,minimumEvidenceUnits:null,itemRevisions:[]};
  if(rule.ruleKind==='direct'&&!publicRuleIds.has(ruleId))return {ruleId,routeId:route.id,ruleKind:rule.ruleKind,capable:false,guaranteedCapable:false,reason:'not_active_public_rule',eligibleEvidenceUnits:0,guaranteedEvidenceUnits:0,minimumEvidenceUnits:rule.minimumEvidenceUnits??1,itemRevisions:[],conditionalDependencies:[]};
  const routeItems=new Set(route.itemRefs.map(ref=>revisionKey(ref.itemId,ref.itemRevision)));
  if(rule.ruleKind==='derived'){
    const requirements=(rule.requires??[]).map(required=>routeRuleOpportunity({ruleId:required.ruleId,route,model,rulesById,publicRuleIds,bankItemsByRevision,seen:[...seen,ruleId]}));
    const capable=requirements.length>0&&requirements.every(row=>row.capable);
    const guaranteedCapable=requirements.length>0&&requirements.every(row=>row.guaranteedCapable??row.capable);
    return {
      ruleId,
      routeId:route.id,
      ruleKind:'derived',
      capable,
      guaranteedCapable,
      reason:capable?(guaranteedCapable?'all_required_rule_paths_available':'conditional_required_rule_paths'):'one_or_more_required_rule_paths_unavailable',
      eligibleEvidenceUnits:requirements.reduce((sum,row)=>sum+row.eligibleEvidenceUnits,0),
      guaranteedEvidenceUnits:requirements.reduce((sum,row)=>sum+(row.guaranteedEvidenceUnits??row.eligibleEvidenceUnits),0),
      minimumEvidenceUnits:null,
      itemRevisions:[...new Set(requirements.flatMap(row=>row.itemRevisions))].sort(),
      requiredRulePaths:requirements,
      conditionalDependencies:requirements.flatMap(row=>row.conditionalDependencies??[])
    };
  }
  const evidence=Array.isArray(rule.evidence)?rule.evidence:[];
  const eligible=evidence.filter(ref=>routeItems.has(revisionKey(ref.itemId,ref.itemRevision))).map(ref=>({
    ref,
    item:bankItemsByRevision.get(revisionKey(ref.itemId,ref.itemRevision))
  }));
  const minimum=rule.minimumEvidenceUnits??1;
  const alwaysUnits=new Set();
  const conditionalItems=[];
  const routeRevisionByItemId=new Map(route.itemRefs.map(ref=>[ref.itemId,ref]));
  for(const {ref,item} of eligible){
    const mode=item?.eligibility?.mode??'always';
    const unit=ref.unitId??revisionKey(ref.itemId,ref.itemRevision);
    if(mode==='always')alwaysUnits.add(unit);
    else if(mode==='conditional'){
      const conditions=item.eligibility.all;
      if(!Array.isArray(conditions)||conditions.length===0)fail(`Conditional item ${item.id}@${item.revision} has no supported all-of branch conditions.`);
      const normalized=[];
      let routeCanShow=true;
      for(const condition of conditions){
        if(condition.kind!=='response_option_in'||typeof condition.itemId!=='string'||!Array.isArray(condition.optionIds))fail(`Unsupported eligibility condition on ${item.id}@${item.revision}.`);
        const parentRef=routeRevisionByItemId.get(condition.itemId);
        const parent=parentRef&&bankItemsByRevision.get(revisionKey(parentRef.itemId,parentRef.itemRevision));
        if(!parentRef||!parent){routeCanShow=false;normalized.push({itemId:condition.itemId,itemRevision:parentRef?.itemRevision??null,optionIds:condition.optionIds,available:false});continue;}
        const parentOptions=new Set((parent.options??[]).map(option=>option.id));
        const optionIds=condition.optionIds.filter(optionId=>parentOptions.has(optionId));
        if(optionIds.length===0)routeCanShow=false;
        normalized.push({itemId:condition.itemId,itemRevision:parentRef.itemRevision,optionIds,available:true});
      }
      conditionalItems.push({ref,item,unit,conditions:normalized,routeCanShow});
    }else fail(`Unknown item eligibility mode ${mode} on ${item?.id??ref.itemId}@${item?.revision??ref.itemRevision}.`);
  }
  const branchParents=new Map();
  for(const conditional of conditionalItems.filter(row=>row.routeCanShow))for(const condition of conditional.conditions){
    const options=branchParents.get(condition.itemId)??new Set();
    for(const optionId of condition.optionIds)options.add(optionId);
    options.add('__other_option__');
    options.add('__no_view__');
    options.add('__not_answered__');
    branchParents.set(condition.itemId,options);
  }
  let scenarios=[new Map()];
  for(const [parentId,options] of branchParents){
    const next=[];
    for(const scenario of scenarios)for(const option of options){
      const branch=new Map(scenario);branch.set(parentId,option);next.push(branch);
      if(next.length>4096)fail(`Branch scenario count exceeds the audit limit for ${ruleId}/${route.id}.`);
    }
    scenarios=next;
  }
  const unitCounts=scenarios.map(branch=>{
    const units=new Set(alwaysUnits);
    for(const conditional of conditionalItems){
      if(!conditional.routeCanShow)continue;
      const active=conditional.conditions.every(condition=>condition.available&&condition.optionIds.includes(branch.get(condition.itemId)));
      if(active)units.add(conditional.unit);
    }
    return units.size;
  });
  const maximumUnits=Math.max(0,...unitCounts);
  const guaranteedUnits=unitCounts.length?Math.min(...unitCounts):alwaysUnits.size;
  const capability=maximumUnits>=minimum;
  const guaranteedCapable=guaranteedUnits>=minimum;
  const conditionalDependencies=conditionalItems.map(row=>({
    itemRevision:revisionKey(row.item.id,row.item.revision),
    routeCanShow:row.routeCanShow,
    requires:row.conditions
  }));
  return {
    ruleId,
    routeId:route.id,
    ruleKind:'direct',
    capable:capability,
    guaranteedCapable,
    reason:!capability?'route_omits_or_lacks_required_evidence_units':guaranteedCapable?'minimum_authored_evidence_units_guaranteed':'minimum_authored_evidence_units_available_only_on_some_branches',
    eligibleEvidenceUnits:maximumUnits,
    guaranteedEvidenceUnits:guaranteedUnits,
    minimumEvidenceUnits:minimum,
    itemRevisions:eligible.map(ref=>revisionKey(ref.itemId,ref.itemRevision)).sort(),
    unavailableEvidenceRevisions:evidence.filter(ref=>!bankItemsByRevision.has(revisionKey(ref.itemId,ref.itemRevision))).map(ref=>revisionKey(ref.itemId,ref.itemRevision)),
    conditionalDependencies
  };
}

function propositionRoutes({propositionId,routeSet,routeOrder,model,rulesById,bankItemsByRevision}){
  return routeOrder.map(routeId=>routeRuleOpportunity({
    ruleId:propositionId,
    route:routeSet.get(routeId),
    model,
    rulesById,
    publicRuleIds:new Set(model.publicRuleIds??[]),
    bankItemsByRevision
  }));
}

function classifyClaim({claim,routeRows}){
  let status=assessmentToStatus[claim.mappingAssessment];
  const capableRoutes=routeRows.filter(row=>row.capable).map(row=>row.routeId);
  if(claim.mappingAssessment==='exact'){
    if(capableRoutes.length===routeRows.length&&routeRows.every(row=>row.guaranteedCapable??row.capable))status='DIRECT';
    else if(capableRoutes.length>0)status='ROUTE_LIMITED';
    else status='UNMEASURED';
  }
  if(claim.mappingAssessment==='recognized_unmeasured'&&capableRoutes.length>0){
    fail(`Claim ${claim.id} is marked recognized_unmeasured although a public route can assess its proposition.`);
  }
  const comparisonEligible=['DIRECT','ROUTE_LIMITED'].includes(status)&&claim.evidenceBasis!=='editorial_hypothesis';
  return {status,capableRoutes,comparisonEligible};
}

function renderClaim({claim,model,routeRows,sourceIds}){
  const classified=classifyClaim({claim,routeRows});
  const candidateSources=claim.sourceClaims.map(sourceClaim=>{
    const source=sourceIds.get(sourceClaim.sourceId);
    return {
      ...sourceClaim,
      sourceClass:source.sourceClass,
      sourceTitle:source.title,
      sourceUrl:source.url,
      qualifiedClass:source.sourceClass!=='publisher_metadata' || Boolean(sourceClaim.locator),
      itemValidityClaimed:false
    };
  });
  const rule=claim.propositionId?(model.commitments??[]).find(row=>row.id===claim.propositionId)||(model.derivedRules??[]).find(row=>row.id===claim.propositionId):null;
  const derivedRule=rule&&(model.derivedRules??[]).some(row=>row.id===rule.id);
  return {
    id:claim.id,
    entityType:claim.entityType,
    proposition:claim.proposition,
    doctrinalRole:claim.doctrinalRole,
    evidenceBasis:claim.evidenceBasis,
    expectedPropositionState:claim.expectedPropositionState,
    mappingStatus:classified.status,
    comparisonEligible:classified.comparisonEligible,
    propositionId:claim.propositionId??null,
    relatedPropositions:(claim.relatedPropositionIds??[]).map(id=>({
      id,
      routeAvailability:sourceIds.routeCoverageForRelated(id).map(row=>({routeId:row.routeId,capable:row.capable,guaranteedCapable:row.guaranteedCapable,reason:row.reason,eligibleEvidenceUnits:row.eligibleEvidenceUnits,guaranteedEvidenceUnits:row.guaranteedEvidenceUnits,minimumEvidenceUnits:row.minimumEvidenceUnits,conditionalDependencies:row.conditionalDependencies}))
    })),
    routeAvailability:routeRows.map(row=>({
      routeId:row.routeId,
      capable:row.capable,
      guaranteedCapable:row.guaranteedCapable,
      reason:row.reason,
      eligibleEvidenceUnits:row.eligibleEvidenceUnits,
      guaranteedEvidenceUnits:row.guaranteedEvidenceUnits,
      minimumEvidenceUnits:row.minimumEvidenceUnits,
      itemRevisions:row.itemRevisions,
      requiredRulePaths:row.requiredRulePaths,
      conditionalDependencies:row.conditionalDependencies
    })),
    capableRoutes:classified.capableRoutes,
    interpretationPath:rule?{kind:derivedRule?'derived':'direct',activePublicInterpretation:derivedRule||(model.publicRuleIds??[]).includes(rule.id),modelSourceQualification:sourceQualificationForRule(rule,sourceIds.ledger)}:null,
    sourceClaims:candidateSources,
    neighboringViews:claim.neighboringViews,
    nonEntailments:claim.nonEntailments,
    limitations:claim.limitations
  };
}

export function buildReferenceReadinessReport({spec,model,bank,routes,affinityCatalog,sourceLedger,authoringPolicy}){
  validateReferenceReadinessSpec({spec,model,bank,routes,affinityCatalog,sourceLedger,authoringPolicy});
  const rulesById=ruleMap(model);
  const routeSet=new Map(routes.routes.map(route=>[route.id,route]));
  const routeOrder=spec.routeOrder;
  const bankItemsByRevision=new Map((bank.items??[]).map(item=>[revisionKey(item.id,item.revision),item]));
  const sourceIds=new Map(spec.sources.map(source=>[source.id,source]));
  sourceIds.ledger=sourceLedger;
  const routeRowsForRelated=(id)=>propositionRoutes({propositionId:id,routeSet,routeOrder,model,rulesById,bankItemsByRevision});
  sourceIds.routeCoverageForRelated=routeRowsForRelated;

  const candidates=spec.candidates.map(candidate=>{
    const claims=candidate.claims.map(claim=>{
      const routeRows=claim.propositionId?propositionRoutes({propositionId:claim.propositionId,routeSet,routeOrder,model,rulesById,bankItemsByRevision}):[];
      return renderClaim({claim,model,routeRows,sourceIds});
    });
    const core=claims.filter(claim=>claim.doctrinalRole==='core');
    const directCore=core.filter(claim=>['DIRECT','ROUTE_LIMITED'].includes(claim.mappingStatus)&&claim.capableRoutes.length>0);
    const coreMissing=core.filter(claim=>!['DIRECT','ROUTE_LIMITED'].includes(claim.mappingStatus)||claim.capableRoutes.length===0);
    const allCoreCovered=core.length>0&&coreMissing.length===0;
    let readinessState;
    if(core.length===0||core.every(claim=>['CONTEXT_ONLY','UNSUITABLE'].includes(claim.mappingStatus)))readinessState='CONTEXT_ONLY';
    else if(allCoreCovered)readinessState='READY_FOR_PROFILE_AUTHORING';
    else if(directCore.length>0||core.some(claim=>claim.mappingStatus==='PARTIAL'))readinessState='PARTIAL_PROFILE_ONLY';
    else readinessState='RESEARCH_GAPS';
    const counts={};
    for(const claim of claims)counts[claim.mappingStatus]=(counts[claim.mappingStatus]??0)+1;
    const affinity=candidate.existingAffinityId?affinityCatalog.traditions.find(row=>row.id===candidate.existingAffinityId):null;
    return {
      id:candidate.id,
      label:candidate.label,
      entityType:candidate.entityType,
      scope:candidate.scope,
      readinessState,
      existingAffinity:affinity?{
        id:affinity.id,
        name:affinity.name,
        catalogVersion:affinityCatalog.catalogVersion,
        scope:affinity.scope,
        context:affinity.context,
        neighbors:affinity.neighbors,
        discriminators:affinity.discriminators,
        nonEntailments:affinity.nonEntailments,
        criteria:(affinity.commitments??[]).map(row=>({
          id:row.id,
          role:row.role,
          doctrine:row.doctrine,
          authoredMappingStatus:row.mapping?.status??'not_mapped',
          propositionId:row.mapping?.propositionId??null,
          expectedState:row.mapping?.expectedState??null,
          routeAvailability:row.mapping?.propositionId?routeRowsForRelated(row.mapping.propositionId):[]
        }))
      }:null,
      claimSummary:{
        claimCount:claims.length,
        comparisonEligibleClaims:claims.filter(claim=>claim.comparisonEligible).length,
        directClaims:claims.filter(claim=>claim.mappingStatus==='DIRECT').length,
        directInterpretationPathClaims:claims.filter(claim=>claim.interpretationPath?.kind==='direct'&&['DIRECT','ROUTE_LIMITED'].includes(claim.mappingStatus)).length,
        derivedInterpretationPathClaims:claims.filter(claim=>claim.interpretationPath?.kind==='derived'&&['DIRECT','ROUTE_LIMITED'].includes(claim.mappingStatus)).length,
        partialClaims:claims.filter(claim=>claim.mappingStatus==='PARTIAL').length,
        routeLimitedClaims:claims.filter(claim=>claim.mappingStatus==='ROUTE_LIMITED').length,
        unmeasuredClaims:claims.filter(claim=>claim.mappingStatus==='UNMEASURED').length,
        missingPropositionClaims:claims.filter(claim=>claim.mappingStatus==='MISSING_PROPOSITION').length,
        unsuitableClaims:claims.filter(claim=>claim.mappingStatus==='UNSUITABLE').length,
        contextOnlyClaims:claims.filter(claim=>claim.mappingStatus==='CONTEXT_ONLY').length,
        coreClaimsDirectlyMeasurable:directCore.length,
        coreClaimsUnavailable:coreMissing.length,
        statuses:counts
      },
      blockingCoreGaps:coreMissing.map(claim=>({id:claim.id,status:claim.mappingStatus,proposition:claim.proposition,propositionId:claim.propositionId})),
      neighbors:candidate.neighbors,
      nonEntailments:candidate.nonEntailments,
      limitations:candidate.limitations,
      claims
    };
  });

  const itemLeads=(spec.existingItemLeads??[]).map(lead=>{
    const item=bank.items.find(row=>row.id===lead.itemId&&row.revision===lead.itemRevision);
    const revision=revisionKey(lead.itemId,lead.itemRevision);
    const modelRuleReferences=(model.commitments??[]).filter(rule=>rule.evidence?.some(ref=>revisionKey(ref.itemId,ref.itemRevision)===revision)).map(rule=>rule.id);
    const publicRuleIds=new Set(model.publicRuleIds??[]);
    const activeRules=modelRuleReferences.filter(ruleId=>publicRuleIds.has(ruleId));
    const routePresence=routeOrder.filter(routeId=>routeSet.get(routeId).itemRefs.some(ref=>revisionKey(ref.itemId,ref.itemRevision)===revision));
    return {
      id:lead.id,
      candidateId:lead.candidateId,
      itemRevision:revision,
      itemStatus:item.status,
      itemText:item.text,
      distinction:lead.distinction,
      disposition:lead.disposition,
      modelRuleReferenceIds:modelRuleReferences,
      activeInterpretationRuleIds:activeRules,
      routesPresent:routePresence,
      conclusion:lead.reason
    };
  });

  const summary={candidateCount:candidates.length,readinessStates:{},mappingStatuses:{}};
  for(const candidate of candidates)summary.readinessStates[candidate.readinessState]=(summary.readinessStates[candidate.readinessState]??0)+1;
  for(const candidate of candidates)for(const [status,count] of Object.entries(candidate.claimSummary.statuses))summary.mappingStatuses[status]=(summary.mappingStatuses[status]??0)+count;
  return {
    schemaVersion:'1.0.0',
    auditVersion:spec.auditVersion,
    origin:spec.origin,
    title:spec.title,
    baseline:{
      candidateBank:{version:spec.baseline.candidateBank.version,path:spec.baseline.candidateBank.path,sha256:spec.baseline.candidateBank.sha256},
      model:{version:spec.baseline.worldviewModel.version,path:spec.baseline.worldviewModel.path,sha256:spec.baseline.worldviewModel.sha256},
      sourceLedger:{version:spec.baseline.sourceLedger.version,path:spec.baseline.sourceLedger.path,sha256:spec.baseline.sourceLedger.sha256},
      affinityCatalog:{version:spec.baseline.affinityCatalog.version,path:spec.baseline.affinityCatalog.path,sha256:spec.baseline.affinityCatalog.sha256},
      routes:{version:spec.baseline.progressiveRoutes.version,path:spec.baseline.progressiveRoutes.path,sha256:spec.baseline.progressiveRoutes.sha256},
      authoringPolicy:{version:spec.baseline.authoringPolicy.version,path:spec.baseline.authoringPolicy.path,sha256:spec.baseline.authoringPolicy.sha256},
      routeOrder:routeOrder.map(routeId=>({id:routeId,version:routeSet.get(routeId).routeVersion,size:routeSet.get(routeId).size}))
    },
    methodology:{
      routeCoverageMeaning:'A route is capable of assessing a mapped proposition only when it includes the exact item revisions referenced by an active public rule and meets that authored rule’s distinct evidence-unit minimum. These are authored evidence opportunities, not empirical item information.',
      missingness:'Route omission is reported as unavailable or not measured. It is never treated as opposition, neutrality, or support.',
      partialMappings:'PARTIAL never satisfies an exact core claim. Related propositions are shown only as adjacent coverage and cannot substitute for the missing distinction.',
      sourceBoundary:'Candidate doctrine sources support the candidate claim only. Model rule sources are reported separately and do not validate item wording, response processes, thresholds, or model validity.',
      noClassification:'This audit creates no respondent profile assignment and no overall similarity calculation.'
    },
    summary,
    candidates,
    existingItemLeads:itemLeads,
    futureDiscriminatorNeeds:spec.futureDiscriminatorNeeds
  };
}

export function renderReferenceReadinessMarkdown(report){
  const lines=[
    '# Reference-profile readiness audit',
    '',
    `Audit: \`${report.auditVersion}\``,
    '',
    '## Baseline',
    '',
    `- Model: \`${report.baseline.model.version}\``,
    `- Affinity catalog: \`${report.baseline.affinityCatalog.version}\``,
    `- Routes: ${report.baseline.routeOrder.map(row=>`${row.id} ${row.size} (${row.version})`).join('; ')}`,
    `- Candidate bank: \`${report.baseline.candidateBank.version}\``,
    `- Source ledger: \`${report.baseline.sourceLedger.version}\``,
    '',
    'This is an authored coverage audit. Its route counts are available evidence opportunities, not empirical item information or validation.',
    '',
    '## Readiness summary',
    '',
    '| Candidate | Readiness | Direct on all routes | Exact direct path | Partial | Route-limited | Unmeasured | Missing proposition | Context / unsuitable |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'
  ];
  for(const candidate of report.candidates){
    const s=candidate.claimSummary;
    lines.push(`| ${candidate.label} | \`${candidate.readinessState}\` | ${s.directClaims} | ${s.directInterpretationPathClaims} | ${s.partialClaims} | ${s.routeLimitedClaims} | ${s.unmeasuredClaims} | ${s.missingPropositionClaims} | ${s.contextOnlyClaims+s.unsuitableClaims} |`);
  }
  lines.push('','## Candidate findings','');
  for(const candidate of report.candidates){
    lines.push(`### ${candidate.label}`,'',`**Readiness:** \`${candidate.readinessState}\``, '',candidate.scope,'');
    if(candidate.blockingCoreGaps.length){
      lines.push('**Core gaps**:');
      for(const gap of candidate.blockingCoreGaps)lines.push(`- \`${gap.status}\` — ${gap.proposition}`);
      lines.push('');
    }
    lines.push('| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |', '|---|---|---|---|---|---|---|---|---|---|');
    for(const claim of candidate.claims){
      const routeCell=routeId=>{
        const row=claim.routeAvailability.find(entry=>entry.routeId===routeId);
        if(!row)return '—';
        const threshold=row.minimumEvidenceUnits===null?`${row.eligibleEvidenceUnits} units`:`${row.eligibleEvidenceUnits}/${row.minimumEvidenceUnits} units`;
        const guaranteed=row.guaranteedEvidenceUnits===row.eligibleEvidenceUnits?'guaranteed':`${row.guaranteedEvidenceUnits} guaranteed`;
        return `${row.capable?'capable':'not available'} (${threshold}; ${guaranteed})`;
      };
      const adjacent=claim.relatedPropositions.map(row=>row.id).join(', ')||'—';
      const path=claim.interpretationPath?.kind??'none';
      lines.push(`| ${claim.proposition} | ${claim.doctrinalRole} | \`${claim.mappingStatus}\` | ${path} | ${claim.propositionId??'—'} | ${adjacent} | ${routeCell('quick')} | ${routeCell('standard')} | ${routeCell('full')} |`);
      for(const sourceClaim of claim.sourceClaims){
        lines.push(`| ↳ Source | | | | [${sourceClaim.sourceTitle}](${sourceClaim.sourceUrl}) | ${sourceClaim.claim.replaceAll('|','\\|')} (${sourceClaim.locator}; ${sourceClaim.sourceClass}; does not validate the WVS item) | | | |`);
      }
      if(claim.interpretationPath){
        const qualification=claim.interpretationPath.modelSourceQualification;
        lines.push(`| ↳ WVS source path | | | | ${qualification.status} | ${qualification.sourceIds.join(', ')||'no source references'}; item validity is assessed separately | | | |`);
      }
      for(const limitation of claim.limitations)lines.push(`| ↳ Limitation | | | | | ${limitation.replaceAll('|','\\|')} | | | |`);
    }
    lines.push('', '**False-positive boundaries and non-entailments**:');
    for(const row of candidate.nonEntailments)lines.push(`- ${row}`);
    lines.push('', '**Candidate limitations**:');
    for(const row of candidate.limitations)lines.push(`- ${row}`);
    if(candidate.existingAffinity){
      lines.push('',`**Existing affinity entry:** \`${candidate.existingAffinity.id}\` in \`${candidate.existingAffinity.catalogVersion}\`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.`);
    }
    lines.push('');
  }
  lines.push('## Existing item leads reviewed','','These items are not active evidence for the listed candidate claim unless an active rule and route explicitly provide that path. A candidate item by itself does not make a proposition measurable.','');
  for(const lead of report.existingItemLeads){
    const modelOnly=lead.modelRuleReferenceIds.filter(ruleId=>!lead.activeInterpretationRuleIds.includes(ruleId));
    const modelOnlyText=modelOnly.length?`; non-public model refs: ${modelOnly.join(', ')}`:'';
    lines.push(`- \`${lead.itemRevision}\` (${lead.itemStatus}; present on ${lead.routesPresent.join(', ')||'no public route'}; active public rule refs: ${lead.activeInterpretationRuleIds.join(', ')||'none'}${modelOnlyText}): ${lead.conclusion}`);
  }
  lines.push('','## Distinctions that would require future review','','These are content-gap descriptions, not proposed item wording or an instruction to expand the bank. A new item is justified only if existing administered items and governed interpretations cannot distinguish the named alternatives.','');
  for(const gap of report.futureDiscriminatorNeeds)lines.push(`- **${gap.candidateId}:** ${gap.distinction} ${gap.reason}`);
  lines.push('','## Interpretation limits','','- `DIRECT` means the exact authored rule path has enough guaranteed distinct evidence units on all three routes. `ROUTE_LIMITED` means an exact active rule path can be used on some routes but not all. Neither means the claim has been empirically validated.','- Direct versus derived describes the rule path; `PARTIAL` is not a substitute for the full candidate claim.','- Conditional evidence is reported separately as possible versus guaranteed route opportunity. A branch prerequisite is never silently counted as available to every respondent.','- `UNMEASURED` refers to a distinction recognized by the current model but unavailable through active public routes.','- `MISSING_PROPOSITION` means the current proposition model does not adequately represent the distinction.','- `CONTEXT_ONLY` and `UNSUITABLE` are not respondent comparison criteria.','- Several reference profiles can overlap; this audit selects no single tradition or person.','');
  return lines.join('\n');
}
