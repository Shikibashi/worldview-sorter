export class ReferenceProfileError extends Error {
  constructor(message){super(message);this.name='ReferenceProfileError';}
}

const need=(ok,message)=>{if(!ok)throw new ReferenceProfileError(message);};
const importance=new Set(['core','major','minor']);
const basis=new Set(['primary_text','scholarly_reconstruction','editorial_hypothesis']);
const uses=new Set(['comparison','context_only']);
const expectedStates=new Set(['supported','opposed']);

function knownPropositions(model){
  return new Set([
    ...(model.commitments??[]).map(row=>row.id),
    ...(model.derivedRules??[]).map(row=>row.id)
  ]);
}

export function validateReferenceProfile({profile,model}){
  need(profile&&typeof profile==='object','Reference profile is required.');
  need(profile.schemaVersion==='1.0.0','Unsupported reference profile schema.');
  need(profile.modelVersion===model?.modelVersion,'Reference profile/model mismatch.');
  need(profile.origin==='independent_authoring','Reference profiles must declare independent authoring.');
  need(profile.identityOutputAllowed===false&&profile.percentageMatchAllowed===false,
    'Reference profiles cannot enable identity or percentage output.');
  need(['philosopher','tradition'].includes(profile.entityType),'Reference profile entity type is invalid.');
  need(['stub','partial','reviewed'].includes(profile.coverageStatus),'Reference profile coverage status is invalid.');
  need(typeof profile.id==='string'&&profile.id.length>0&&typeof profile.label==='string'&&profile.label.length>0,
    'Reference profile requires id and label.');
  need(Array.isArray(profile.claims),'Reference profile requires claims.');

  for(const forbidden of ['vector','coordinates','axisValues','score','matchPercentage','nearestProfile']){
    need(profile[forbidden]===undefined,'Reference profile cannot contain '+forbidden+'.');
  }

  const known=knownPropositions(model),sourceIds=new Set((model.sources??[]).map(row=>row.id)),claimIds=new Set();
  for(const claim of profile.claims){
    need(claim&&typeof claim==='object','Profile claim must be an object.');
    need(typeof claim.id==='string'&&claim.id.length>0&&!claimIds.has(claim.id),'Profile claim ids must be unique.');claimIds.add(claim.id);
    need(known.has(claim.propositionId),'Profile claim references unknown proposition '+claim.propositionId+'.');
    need(expectedStates.has(claim.expectedState),'Profile claim expected state is invalid.');
    need(importance.has(claim.importance),'Profile claim importance is invalid.');
    need(basis.has(claim.evidenceBasis),'Profile claim evidence basis is invalid.');
    need(uses.has(claim.publicUse),'Profile claim public use is invalid.');
    if(claim.evidenceBasis==='editorial_hypothesis')need(claim.publicUse==='context_only',
      'Editorial hypotheses cannot participate in comparison.');
    need(Array.isArray(claim.sourceClaims)&&claim.sourceClaims.length>0,'Profile claim requires source claims.');
    for(const sourceClaim of claim.sourceClaims){
      need(sourceClaim&&sourceIds.has(sourceClaim.sourceId),'Profile claim references unknown source '+sourceClaim?.sourceId+'.');
      need(sourceClaim.relationship==='supports_profile_claim','Profile source claims require supports_profile_claim.');
      need(typeof sourceClaim.claim==='string'&&sourceClaim.claim.trim().length>0,'Profile source claim must be explicit.');
    }
  }

  need(Array.isArray(profile.limitations)&&profile.limitations.length>0,'Reference profile requires explicit limitations.');
  return true;
}

function reportStates(report){
  const map=new Map();
  for(const row of report.commitments??[])map.set(row.commitmentId,row.state);
  for(const row of report.derived??[])map.set(row.id,row.state);
  return map;
}

export function compareReferenceProfile({profile,model,report}){
  validateReferenceProfile({profile,model});
  need(report?.modelVersion===model.modelVersion,'Reference comparison requires the same model version.');
  const states=reportStates(report);
  const claims=profile.claims.map(claim=>{
    const observedState=states.get(claim.propositionId)??'not_measured';
    let relation='unresolved';
    if(observedState===claim.expectedState)relation='overlap';
    else if(['supported','opposed'].includes(observedState))relation='divergence';
    else if(['mixed','mixed_context_dependent'].includes(observedState))relation='mixed';
    else if(observedState==='not_measured')relation='not_measured';
    else relation='insufficient_evidence';
    return {...claim,observedState,relation};
  });
  const comparable=claims.filter(claim=>claim.publicUse==='comparison');
  return {
    schemaVersion:'1.0.0',
    profileId:profile.id,
    label:profile.label,
    modelVersion:model.modelVersion,
    publicIdentityLabel:null,
    percentageMatchAllowed:false,
    aggregateScore:null,
    claims,
    coverage:{
      comparisonClaims:comparable.length,
      overlap:comparable.filter(claim=>claim.relation==='overlap').length,
      divergence:comparable.filter(claim=>claim.relation==='divergence').length,
      mixed:comparable.filter(claim=>claim.relation==='mixed').length,
      notMeasured:comparable.filter(claim=>claim.relation==='not_measured').length,
      insufficient:comparable.filter(claim=>claim.relation==='insufficient_evidence').length
    },
    limitations:[...profile.limitations]
  };
}
