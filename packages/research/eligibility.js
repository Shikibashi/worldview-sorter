// Shared fail-closed eligibility for the currently supported frozen pilot export.
// A future multi-version exporter must replace this tuple with explicit per-release replay.
import {itemLocalization} from '../localization/index.js';

export function researchExportEligibility(record,{consentVersion,bank,form,model,pilotManifest,catalog,
 localizationBundles,localizationCatalogs,modelReleaseVersions}){
 if(record.consentVersion!==consentVersion)return {eligible:false,reason:'unsupported_consent'};
 if(!Array.isArray(record.responses))return {eligible:false,reason:'missing_responses'};
 if(!['en','en-US',null].includes(record.respondentLocale)||record.presentationLocale!=='en-US'||
  !['en',null].includes(record.interfaceLanguage))
  return {eligible:false,reason:'unsupported_locale_metadata'};
 if(record.bankVersion!==bank.bankVersion||record.instrumentVersion!==model.pilotInstrumentVersion||
  record.formPolicyVersion!==form.policyVersion||record.modelVersion!==model.modelVersion||
  record.resultSemanticsVersion!==model.resultSemanticsVersion||
  record.derivedInferenceVersion!==pilotManifest.derivedInference.version||
  record.affinityCatalogVersion!==catalog.catalogVersion)
  return {eligible:false,reason:'unsupported_model_tuple'};
 if(record.localizationBundleVersion){
  const bundle=localizationBundles.find(b=>b.bundleVersion===record.localizationBundleVersion&&
   b.locale===record.presentationLocale);
  if(!bundle||!localizationCatalogs.some(c=>c.catalogVersion===record.localizationCatalogVersion&&
   c.locales.some(entry=>entry.locale===bundle.locale&&entry.bundleVersion===bundle.bundleVersion)))
   return {eligible:false,reason:'unsupported_localization'};
  const byItem=new Map(bank.items.map(item=>[item.id,item]));
  if(!record.responses.every(response=>{
   const item=byItem.get(response.itemId),expected=itemLocalization(bundle,item);
   return item?.revision===response.itemRevision&&expected&&response.translationStatus==='approved'&&
    response.textVersion===expected.textVersion&&response.variantId===expected.variantId;
  }))return {eligible:false,reason:'incomplete_wording_metadata'};
 }else if(!record.responses.every(response=>response.translationStatus==='historical_canonical_unpinned'&&
  response.textVersion==null&&response.variantId==null))
  return {eligible:false,reason:'incomplete_wording_metadata'};
 if(record.modelReleaseVersion&&!modelReleaseVersions.includes(record.modelReleaseVersion))
  return {eligible:false,reason:'unavailable_model_release'};
 if(record.releaseChannel&&!['development','internal','preview','beta','stable'].includes(record.releaseChannel))
  return {eligible:false,reason:'unknown_release_channel'};
 return {eligible:true,reason:null};
}
