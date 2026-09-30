// Language realizations never define a new philosophical proposition or score.
// A non-English route is unavailable until every required realization is approved.
export const LOCALIZATION_SCHEMA='worldview-localization-bundle-1';
export const TRANSLATION_STATES=Object.freeze(['untranslated','machine_assisted_draft','human_draft','philosophical_review',
 'linguistic_review','cultural_review','approved','deprecated','needs_revision']);
export const RESULT_STATES=Object.freeze(['supported','leaned_toward','mixed_context_dependent','opposed','insufficient_evidence','not_measured']);
const statuses=new Set(TRANSLATION_STATES),roles=new Set(['linguistic','philosophical','cultural']);
const fail=message=>{throw Error('Localization: '+message);};
const requireValue=(condition,message)=>{if(!condition)fail(message);};
const distinct=values=>new Set(values).size===values.length;
const exactKeys=(object,keys)=>object&&typeof object==='object'&&!Array.isArray(object)&&
 Object.keys(object).every(key=>keys.includes(key));
const text=value=>typeof value==='string'&&value.trim().length>0;
const idsEqual=(left,right)=>Array.isArray(left)&&left.length===right.length&&
 left.every((id,index)=>id===right[index]);

export function validateLocalizationCatalog(catalog,{bank,model,affinityCatalog}={}){
 requireValue(catalog?.schemaVersion==='worldview-localization-catalog-1','unknown catalog schema');
 requireValue(text(catalog.catalogVersion)&&Array.isArray(catalog.locales)&&catalog.locales.length>0,'missing catalog version or locales');
 if(bank)requireValue(catalog.canonicalBankVersion===bank.bankVersion,'bank version mismatch');
 if(model)requireValue(catalog.modelVersion===model.modelVersion,'model version mismatch');
 if(affinityCatalog)requireValue(catalog.affinityCatalogVersion===affinityCatalog.catalogVersion,'affinity catalog mismatch');
 requireValue(distinct(catalog.locales.map(row=>row.locale)),'duplicate locale');
 for(const row of catalog.locales){
  requireValue(exactKeys(row,['locale','language','direction','bundleVersion','path','status'])&&
   /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(row.locale)&&['ltr','rtl'].includes(row.direction)&&
   statuses.has(row.status)&&text(row.bundleVersion)&&/^data\/localization\/[A-Za-z0-9-]+\.json$/.test(row.path),
  'invalid locale registry entry');
 }
 return true;
}

function validateReviews(record,label){
 requireValue(Array.isArray(record.reviews),'missing review history: '+label);
 for(const review of record.reviews)requireValue(roles.has(review.role)&&text(review.reviewer)&&
  !Number.isNaN(Date.parse(review.at))&&text(review.note),'invalid review record: '+label);
 if(record.status==='approved')requireValue(['linguistic','philosophical'].every(role=>record.reviews.some(r=>r.role===role)),
  'approved content needs linguistic and philosophical review: '+label);
}
function validateRealization(record,label){
 requireValue(statuses.has(record.status)&&text(record.textVersion)&&text(record.producer)&&
  !Number.isNaN(Date.parse(record.createdAt))&&text(record.sourceNote)&&text(record.adaptationNote),
  'missing translation provenance: '+label);
 validateReviews(record,label);
}

export function validateLocalizationBundle(bundle,{catalog,bank,scalesDoc,model,affinityCatalog}){
 validateLocalizationCatalog(catalog,{bank,model,affinityCatalog});
 requireValue(bundle?.schemaVersion===LOCALIZATION_SCHEMA,'unknown bundle schema');
 const registered=catalog.locales.find(row=>row.locale===bundle.locale);
 requireValue(registered&&bundle.bundleVersion===registered.bundleVersion&&bundle.language===registered.language&&
  bundle.direction===registered.direction&&bundle.status===registered.status,'bundle does not match registered locale/version');
 requireValue(bundle.bankVersion===bank.bankVersion&&bundle.modelVersion===model.modelVersion&&
  bundle.affinityCatalogVersion===affinityCatalog.catalogVersion,'bundle content release mismatch');
 for(const key of ['itemRealizations','scaleRealizations','propositionRealizations','affinityRealizations','sourceRealizations','terminologyDecisions'])
  requireValue(Array.isArray(bundle[key]),'missing '+key);
 for(const decision of bundle.terminologyDecisions)requireValue(text(decision.termId)&&text(decision.rendering)&&
  text(decision.context)&&text(decision.rationale)&&statuses.has(decision.status),
 'incomplete terminology decision');
 requireValue(bundle.resultStates&&typeof bundle.resultStates==='object'&&!Array.isArray(bundle.resultStates)&&
  bundle.uiStrings&&typeof bundle.uiStrings==='object'&&!Array.isArray(bundle.uiStrings),'missing result or interface text map');
 if(bundle.canonical){
  requireValue(bundle.locale==='en-US'&&bundle.status==='approved'&&
   ['itemRealizations','scaleRealizations','propositionRealizations','affinityRealizations','sourceRealizations','terminologyDecisions'].every(key=>bundle[key].length===0),
   'canonical English realization must use the frozen source artifacts');
  return true;
 }
 const items=new Map(bank.items.map(item=>[item.id,item]));
 requireValue(distinct(bundle.itemRealizations.map(r=>r.itemId+'@'+r.itemRevision)),'duplicate item realization');
 for(const row of bundle.itemRealizations){
  const item=items.get(row.itemId),label=row.itemId+'@'+row.itemRevision;
  requireValue(item&&item.revision===row.itemRevision&&text(row.text)&&
   idsEqual((row.options??[]).map(o=>o.id),(item.options??[]).map(o=>o.id))&&
   (row.options??[]).every(o=>text(o.label)),'item or option mapping changed: '+label);
  requireValue(['translation','adapted_analogue','locale_variant'].includes(row.kind)&&
   ['same_proposition_reviewed','not_comparable','requires_new_revision'].includes(row.evidenceCompatibility)&&
   (row.kind==='translation'||text(row.variantId)),'missing adaptation/compatibility decision: '+label);
  requireValue(row.termChoices===undefined||Array.isArray(row.termChoices)&&row.termChoices.every(choice=>
   text(choice.termId)&&text(choice.rendering)&&text(choice.context)),
  'invalid terminology choices: '+label);
  validateRealization(row,label);
  if(row.status==='approved')requireValue(row.evidenceCompatibility==='same_proposition_reviewed',
   'an incompatible adaptation cannot enter the existing evidence rule: '+label);
 }
 const scales=new Map(scalesDoc.scales.map(scale=>[scale.id,scale]));
 requireValue(distinct(bundle.scaleRealizations.map(r=>r.scaleId)),'duplicate response scale realization');
 for(const row of bundle.scaleRealizations){
  const scale=scales.get(row.scaleId);
  requireValue(scale&&idsEqual(row.options.map(o=>o.id),scale.options.map(o=>o.id))&&
   row.options.every(o=>text(o.label))&&
   idsEqual(Object.keys(row.specialStates??{}).sort(),[...scale.allowedSpecialStates].sort()),
   'response meaning or option identity changed: '+row.scaleId);
  validateRealization(row,row.scaleId);
 }
 requireValue(distinct(bundle.propositionRealizations.map(r=>r.propositionId)),'duplicate proposition realization');
 const propositionIds=new Set([...model.publicRuleIds,...model.derivedRules.map(r=>r.id)]);
 for(const row of bundle.propositionRealizations){
  requireValue(propositionIds.has(row.propositionId)&&text(row.label)&&text(row.proposition)&&text(row.boundary),
   'unknown or incomplete proposition realization: '+row.propositionId);
  validateRealization(row,row.propositionId);
 }
 requireValue(distinct(bundle.affinityRealizations.map(r=>r.traditionId)),'duplicate affinity realization');
 const traditions=new Map(affinityCatalog.traditions.map(t=>[t.id,t]));
 for(const row of bundle.affinityRealizations){
  const original=traditions.get(row.traditionId);
  requireValue(original&&text(row.name)&&text(row.context)&&
   idsEqual(row.commitments.map(c=>c.id),original.commitments.map(c=>c.id))&&
   row.commitments.every(c=>text(c.doctrine))&&Array.isArray(row.nonEntailments)&&
   row.nonEntailments.length===original.nonEntailments.length&&row.nonEntailments.every(text),
   'incomplete doctrinal realization: '+row.traditionId);
  requireValue(row.originalTerms===undefined||Array.isArray(row.originalTerms)&&row.originalTerms.every(term=>
   text(term.term)&&text(term.language)&&text(term.gloss)&&
   (term.transliteration===null||term.transliteration===undefined||text(term.transliteration))),
  'invalid original terminology: '+row.traditionId);
  validateRealization(row,row.traditionId);
 }
 const sourceIds=new Set([...model.sources.map(s=>s.id),...(affinityCatalog.sources??[]).map(s=>s.id)]);
 requireValue(distinct(bundle.sourceRealizations.map(r=>r.sourceId+'@'+r.textVersion)),'duplicate source realization');
 for(const row of bundle.sourceRealizations){
  requireValue(sourceIds.has(row.sourceId)&&text(row.title)&&text(row.sourceLanguage)&&
   ['primary','scholarly_translation','academic_secondary','reference'].includes(row.sourceType)&&
   ['original_title','reviewed_translation','explanatory_gloss'].includes(row.titleKind)&&
   (row.url===null||/^https:\/\//.test(row.url))&&
   ['originalTerm','transliteration','gloss','citationNote'].every(key=>row[key]===undefined||row[key]===null||text(row[key])),
   'invalid source realization: '+row.sourceId);
  validateRealization(row,row.sourceId);
 }
 for(const [state,copy] of Object.entries(bundle.resultStates)){
  requireValue(RESULT_STATES.includes(state)&&text(copy.label)&&text(copy.explanation),
   'result state meaning is missing: '+state);
  validateRealization(copy,'result '+state);
 }
 return true;
}

const itemRecord=(bundle,item)=>item&&bundle.itemRealizations.find(r=>r.itemId===item.id&&r.itemRevision===item.revision);
export function itemLocalization(bundle,item){
 if(!item)return null;
 if(bundle.canonical)return {textVersion:bundle.bundleVersion+':'+item.id+'@'+item.revision,variantId:null};
 const row=itemRecord(bundle,item);
 if(!row||row.status!=='approved'||row.evidenceCompatibility!=='same_proposition_reviewed')return null;
 return {textVersion:row.textVersion,variantId:row.variantId??null};
}
export function localizeItem(bundle,item,scale){
 const version=itemLocalization(bundle,item);if(!version)fail('item is not approved for '+bundle.locale+': '+item.id);
 if(bundle.canonical)return {item,scale,...version};
 const row=itemRecord(bundle,item),scaleRow=bundle.scaleRealizations.find(r=>r.scaleId===scale.id&&r.status==='approved');
 requireValue(scaleRow,'response scale is not approved: '+scale.id);
 return {item:{...item,text:row.text,options:item.options.map((option,index)=>({...option,label:row.options[index].label}))},
  scale:{...scale,options:scale.options.map((option,index)=>({...option,label:scaleRow.options[index].label}))},
  specialStates:scaleRow.specialStates,...version};
}

export function routeLocalizationAvailability({bundle,route,bank,scalesDoc,model,affinityCatalog=null}){
 const blockers=[];
 if(bundle.status!=='approved')blockers.push('locale_not_approved');
 if(bundle.canonical)return {available:!blockers.length,blockers,missingItems:[],missingScales:[],missingPropositions:[],missingAffinities:[],affinityAvailable:true};
 const items=new Map(bank.items.map(item=>[item.id,item]));
 const missingItems=route.itemRefs.filter(ref=>!itemLocalization(bundle,items.get(ref.itemId))).map(ref=>ref.itemId);
 const scaleIds=new Set(route.itemRefs.map(ref=>items.get(ref.itemId)?.responseScaleId));
 const missingScales=[...scaleIds].filter(id=>!bundle.scaleRealizations.some(r=>r.scaleId===id&&r.status==='approved'));
 const required=new Set([...model.publicRuleIds,...model.derivedRules.map(r=>r.id)]);
 const missingPropositions=[...required].filter(id=>!bundle.propositionRealizations.some(r=>r.propositionId===id&&r.status==='approved'));
 for(const state of RESULT_STATES)if(bundle.resultStates[state]?.status!=='approved')blockers.push('result_state_'+state);
 if(!Object.values(bundle.uiStrings).length)blockers.push('interface_not_reviewed');
 // The current interface still contains generated English copy; a future
 // reviewed locale must wire every respondent-facing string before release.
 blockers.push('interface_integration_pending');
 if(missingItems.length)blockers.push('items_unavailable');
 if(missingScales.length)blockers.push('response_meanings_unavailable');
 if(missingPropositions.length)blockers.push('propositions_unavailable');
 const missingAffinities=(affinityCatalog?.traditions??[]).filter(t=>
  !bundle.affinityRealizations.some(r=>r.traditionId===t.id&&r.status==='approved')).map(t=>t.id);
 const affinityAvailable=affinityCatalog!==null&&missingAffinities.length===0;
 return {available:!blockers.length,blockers,missingItems,missingScales,missingPropositions,missingAffinities,affinityAvailable};
}

export function validateSavedLocalization(session,{bank,bundles=[],catalogs=[]}){
 if(!session.localization)return true; // Historical pre-localization sessions retain canonical bank wording.
 const metadata=session.localization;
 requireValue(exactKeys(metadata,['locale','interfaceLanguage','bundleVersion','catalogVersion'])&&
  metadata.locale===session.locale&&text(metadata.interfaceLanguage)&&text(metadata.bundleVersion)&&text(metadata.catalogVersion),
  'invalid saved localization metadata');
 const bundle=bundles.find(x=>x.bundleVersion===metadata.bundleVersion&&x.locale===metadata.locale);
 requireValue(bundle,'historical localization bundle unavailable');
 requireValue(catalogs.some(catalog=>catalog.catalogVersion===metadata.catalogVersion&&
  catalog.locales.some(row=>row.locale===metadata.locale&&row.bundleVersion===metadata.bundleVersion)),
 'historical localization catalog unavailable');
 const items=new Map(bank.items.map(item=>[item.id,item]));
 for(const entry of session.presentedItems){
  const expected=itemLocalization(bundle,items.get(entry.itemId));
  requireValue(expected&&entry.textVersion===expected.textVersion&&entry.variantId===expected.variantId,
   'historical item wording version mismatch: '+entry.itemId);
 }
 return true;
}

export function localizeSummary(summary,bundle){
 requireValue(['quiz-summary-2','quiz-summary-3'].includes(summary?.schemaVersion),'pilot result required');
 if(bundle.canonical)return {available:true,summary,affinityAvailable:true};
 if(summary.schemaVersion==='quiz-summary-3'&&summary.rows.some(row=>
  row.inferenceStatus==='direct'&&row.presentationReview?.state!=='eligible'))
  return {available:false,reason:'presentation_qualification_unavailable',missingPropositions:[],affinityAvailable:false};
 const rows=new Map(bundle.propositionRealizations.filter(r=>r.status==='approved').map(r=>[r.propositionId,r]));
 const missing=summary.rows.filter(row=>!rows.has(row.id)).map(row=>row.id);
 if(missing.length||RESULT_STATES.some(state=>bundle.resultStates[state]?.status!=='approved'))
  return {available:false,reason:'result_content_unavailable',missingPropositions:missing,affinityAvailable:false};
 if(bundle.uiIntegrationStatus!=='complete')
  return {available:false,reason:'interface_integration_pending',missingPropositions:[],affinityAvailable:false};
 const translated=structuredClone(summary);
 translated.rows=translated.rows.map(row=>({...row,label:rows.get(row.id).label,
  proposition:summary.schemaVersion==='quiz-summary-3'&&row.propositionBasis==='inherited_rule_scope'?null:rows.get(row.id).proposition,
  ...(summary.schemaVersion==='quiz-summary-3'?{scope:rows.get(row.id).proposition}:{}),
  boundary:rows.get(row.id).boundary,statusLabel:bundle.resultStates[row.status]?.label??row.status,
  explanation:bundle.resultStates[row.status]?.explanation??''}));
 const byId=new Map(translated.rows.map(row=>[row.id,row]));
 for(const domain of translated.domains){domain.rows=domain.rows.map(row=>byId.get(row.id));
  for(const facet of domain.facets)facet.rows=facet.rows.map(row=>byId.get(row.id));}
 for(const key of ['overview','mixedOrUnresolved','unmeasured'])translated[key]=translated[key].map(row=>byId.get(row.id));
 const affinityById=new Map(bundle.affinityRealizations.filter(r=>r.status==='approved').map(r=>[r.traditionId,r]));
 const affinityAvailable=translated.affinities?.traditions.every(t=>affinityById.has(t.id))??false;
 if(affinityAvailable)for(const tradition of translated.affinities.traditions){
  const realization=affinityById.get(tradition.id),doctrine=new Map(realization.commitments.map(c=>[c.id,c.doctrine]));
  tradition.name=realization.name;tradition.context=realization.context;
  tradition.criteria=tradition.criteria.map(c=>({...c,doctrine:doctrine.get(c.id)}));
  tradition.nonEntailments=realization.nonEntailments;
 }else translated.affinities=null;
 return {available:true,summary:translated,affinityAvailable};
}
