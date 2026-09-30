import {validateResponseValue} from '../runtime/index.js';

export class ProfileEvidenceError extends Error {
  constructor(message) { super(message); this.name = 'ProfileEvidenceError'; }
}
const requireThat = (condition, message) => { if (!condition) throw new ProfileEvidenceError(message); };
const specialStates = new Set(['no_view','not_understood','not_applicable']);
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const included = (xs,x) => xs.some(v=>same(v,x));

// Compare exact responses to authored reference criteria. This is deliberately
// not a latent-trait estimator, a probability model, or an identity classifier.
export function validateProfileCatalog({catalog, policy, bank, scalesDoc}) {
  requireThat(catalog?.schemaVersion==='2.0.0','Use the typed-evidence catalog schema, not legacy coordinate profiles.');
  requireThat(catalog.bankVersion===bank.bankVersion,'Catalog/bank version mismatch.');
  requireThat(catalog.status==='prototype' && catalog.identityOutputAllowed===false && catalog.interpretationAllowed===false,
    'This engine only supports non-interpretable prototype comparisons. Calibration requires a separately validated engine.');
  requireThat(policy?.schemaVersion==='2.0.0' && policy.forceBestMatch===false && policy.allowAbstention===true &&
    policy.percentageMatchAllowed===false && policy.identityOutputAllowed===false && policy.scoredEvidenceAllowed===false,
    'Policy must prohibit forced identities, percentages and inferred coordinate evidence.');
  const items = new Map(bank.items.map(i=>[i.id,i]));
  const scales = new Map(scalesDoc.scales.map(s=>[s.id,s]));
  const profileIds = new Set();
  requireThat(Array.isArray(catalog.profiles),'Catalog profiles must be an array.');
  for (const p of catalog.profiles) {
    requireThat(typeof p.id==='string' && !profileIds.has(p.id),'Duplicate or invalid profile ID.');
    profileIds.add(p.id);
    requireThat(typeof p.scope==='string' && p.scope.length>0,'A profile must declare its comparison scope.');
    requireThat(Array.isArray(p.sourceIds) && p.sourceIds.length>0,'A profile must have academic source references.');
    requireThat(Array.isArray(p.criteria) && p.criteria.some(c=>c.essential===true),'A profile needs explicit defining criteria.');
    const criteria = new Set();
    for (const c of p.criteria) {
      requireThat(!criteria.has(c.id),'Duplicate criterion in '+p.id);
      criteria.add(c.id);
      requireThat(Number.isInteger(c.minimumIndependentItems) && c.minimumIndependentItems>=2,'Direct evidence requires multiple distinct items.');
      requireThat(Array.isArray(c.evidence) && c.evidence.length>=c.minimumIndependentItems,'Insufficient planned criterion evidence.');
      const ids = new Set();
      for (const e of c.evidence) {
        requireThat(!ids.has(e.itemId),'Duplicate evidence item within '+p.id+'/'+c.id);
        ids.add(e.itemId);
        const item = items.get(e.itemId);
        requireThat(item && item.revision===e.itemRevision,'Unknown or stale evidence item '+e.itemId);
        requireThat(Array.isArray(e.support) && e.support.length>0 && Array.isArray(e.oppose) && e.oppose.length>0,'Evidence must specify both substantive directions.');
        requireThat(!e.support.some(v=>included(e.oppose,v)),'Support and opposition overlap.');
        for (const value of [...e.support,...e.oppose]) {
          requireThat(value!==null && value!==0,'Missing states and neutral cannot be directional evidence.');
          validateResponseValue(item,scales.get(item.responseScaleId),'answered',value);
        }
      }
    }
  }
  return true;
}

function validateInput({input, bank, scalesDoc}) {
  requireThat(input && input.bankVersion===bank.bankVersion,'Raw-evidence bank version mismatch.');
  requireThat(Array.isArray(input.responses),'Provide raw responses, not an inferred ideology vector.');
  requireThat(input.constructEstimates===undefined && input.probeResponses===undefined,
    'Coordinate estimates and detached doctrinal probes cannot substitute for exact questionnaire responses.');
  const items = new Map(bank.items.map(i=>[i.id,i]));
  const scales = new Map(scalesDoc.scales.map(s=>[s.id,s]));
  const responses = new Map();
  for (const r of input.responses) {
    requireThat(r && typeof r.itemId==='string' && !responses.has(r.itemId),'Duplicate or malformed raw response.');
    const item = items.get(r.itemId);
    requireThat(item && item.revision===r.itemRevision,'Unknown or stale response revision: '+r.itemId);
    requireThat(r.state==='answered' || specialStates.has(r.state),'Unknown response state.');
    if (typeof r.value==='number') requireThat(Number.isFinite(r.value),'Nonfinite response value.');
    validateResponseValue(item,scales.get(item.responseScaleId),r.state,r.value);
    if (Array.isArray(input.presentedItems)) {
      const entry = input.presentedItems.find(e=>e.itemId===r.itemId);
      requireThat(entry?.presented===true && entry.skippedByBranch===false && entry.itemRevision===r.itemRevision,
        'Unpresented or branch-skipped item cannot supply evidence.');
    }
    responses.set(r.itemId,r);
  }
  const identities = input.selfReportedIdentities ?? [];
  requireThat(Array.isArray(identities) && identities.length<=20 && identities.every(x=>typeof x==='string' && x.length<=100),
    'Self-reported identities must be a small list of labels.');
  return {responses, identities:[...identities]};
}

function criterionEvidence(criterion,responses) {
  const observations = criterion.evidence.map(e=>{
    const r = responses.get(e.itemId);
    let state = 'not_answered';
    if (r) {
      if (r.state!=='answered') state = r.state;
      else if (r.value===0) state = 'neutral';
      else if (included(e.support,r.value)) state = 'support';
      else if (included(e.oppose,r.value)) state = 'oppose';
      else state = 'non_directional_answer';
    }
    return {itemId:e.itemId,itemRevision:e.itemRevision,state,rawResponse:r?{state:r.state,value:r.value}:null};
  });
  const support = observations.filter(o=>o.state==='support').length;
  const oppose = observations.filter(o=>o.state==='oppose').length;
  let state = 'unresolved';
  // Never average away an explicit disagreement; seek clarification instead.
  if (support>0 && oppose>0) state='mixed';
  else if (support>=criterion.minimumIndependentItems) state='supported';
  else if (oppose>=criterion.minimumIndependentItems) state='opposed';
  return {criterionId:criterion.id,constructId:criterion.constructId,essential:criterion.essential,state,
    minimumIndependentItems:criterion.minimumIndependentItems,supportingItems:support,opposingItems:oppose,
    observations,sourceIds:criterion.sourceIds};
}

export function matchProfiles({catalog,policy,bank,scalesDoc,input}) {
  validateProfileCatalog({catalog,policy,bank,scalesDoc});
  const {responses,identities} = validateInput({input,bank,scalesDoc});
  const candidates = catalog.profiles.map(p=>{
    const criteria = p.criteria.map(c=>criterionEvidence(c,responses));
    const required = criteria.filter(c=>c.essential);
    let state;
    if (required.some(c=>c.state==='opposed')) state='material_divergence';
    else if (required.some(c=>c.state==='mixed')) state='mixed_evidence';
    else if (required.every(c=>c.state==='supported')) state='compatible_on_measured_commitments';
    else if (criteria.some(c=>c.state==='supported')) state='partial_evidence';
    else state='insufficient_evidence';
    return {profileId:p.id,label:p.label,scope:p.scope,state,criteria,
      divergences:criteria.filter(c=>c.state==='opposed').map(c=>c.criterionId),
      unresolved:criteria.filter(c=>c.state==='unresolved' || c.state==='mixed').map(c=>c.criterionId),
      limitations:p.limitations,sourceIds:p.sourceIds,publicIdentityLabel:null};
  });
  return {schemaVersion:'2.0.0',catalogVersion:catalog.catalogVersion,policyVersion:policy.policyVersion,
    bankVersion:bank.bankVersion,status:'prototype_comparison_not_validated',interpretationAllowed:false,
    state:responses.size?'comparisons_available':'insufficient_evidence',
    selectedProfileId:null,publicIdentityLabel:null,percentageMatchAllowed:false,
    selfReportedIdentities:identities,candidates};
}

// Deterministic missing-evidence planning, NOT psychometrically calibrated CAT.
// All proposed questions are existing bank items and preserve branch prerequisites.
export function planProfileFollowups({catalog,policy,bank,scalesDoc,input,profileIds,maxItems=12}) {
  requireThat(Number.isInteger(maxItems) && maxItems>=0 && maxItems<=100,'Invalid follow-up budget.');
  const result = matchProfiles({catalog,policy,bank,scalesDoc,input});
  const requested = profileIds ?? catalog.profiles.map(p=>p.id);
  requireThat(Array.isArray(requested) && requested.every(id=>catalog.profiles.some(p=>p.id===id)),'Unknown requested profile.');
  const already = new Set(input.responses.map(r=>r.itemId));
  const byItem = new Map(bank.items.map(i=>[i.id,i]));
  const selected = new Map();
  const add = (id,reason,stack=new Set()) => {
    if (already.has(id) || selected.has(id)) return true;
    requireThat(!stack.has(id),'Cyclic follow-up prerequisites.');
    const item = byItem.get(id);
    requireThat(item,'Missing follow-up item '+id);
    const pending = new Map();
    const visit = (itemId,ancestors) => {
      if (already.has(itemId) || selected.has(itemId) || pending.has(itemId)) return;
      requireThat(!ancestors.has(itemId),'Cyclic follow-up prerequisites.');
      const question = byItem.get(itemId);
      requireThat(question,'Missing prerequisite '+itemId);
      const next = new Set([...ancestors,itemId]);
      if (question.eligibility?.mode==='conditional') {
        for (const c of question.eligibility.all) visit(c.itemId,next);
      }
      pending.set(itemId,{itemId,itemRevision:question.revision,reason:itemId===id?reason:'branch_prerequisite'});
    };
    visit(id,stack);
    if (selected.size+pending.size>maxItems) return false;
    for (const [key,value] of pending) selected.set(key,value);
    return true;
  };
  for (const profileId of requested) {
    const profile = catalog.profiles.find(p=>p.id===profileId);
    const comparison = result.candidates.find(p=>p.profileId===profileId);
    for (const c of profile.criteria.filter(c=>c.essential)) {
      const observed = comparison.criteria.find(r=>r.criterionId===c.id);
      if (observed.state==='supported' || observed.state==='opposed') continue;
      for (const e of c.evidence) {
        if (selected.size>=maxItems) break;
        add(e.itemId,observed.state==='mixed'?'clarify_mixed_evidence':'missing_direct_evidence');
      }
    }
  }
  return {schemaVersion:'2.0.0',bankVersion:bank.bankVersion,status:'uncalibrated_evidence_plan',
    profileIds:requested,entries:[...selected.values()]};
}
