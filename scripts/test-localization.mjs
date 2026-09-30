import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuiz,restoreQuiz} from '../packages/experience/quiz.js';
import {RESULT_STATES,validateLocalizationCatalog,validateLocalizationBundle,itemLocalization,localizeItem,localizeSummary,
 routeLocalizationAvailability,validateSavedLocalization} from '../packages/localization/index.js';

const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const [catalog,bank,scalesDoc,model,affinity,pilot,policy]=await Promise.all([
 read(current.localizationCatalog.path),read(current.candidateBank.path),read('data/response-scales.json'),
 read(current.worldviewModel.path),read(current.affinityCatalog.path),read(current.pilot.path),read(current.progressiveDepth.path)]);
assert.ok(validateLocalizationCatalog(catalog,{bank,model,affinityCatalog:affinity}));
const bundles=await Promise.all(catalog.locales.map(row=>read(row.path)));
for(const bundle of bundles)assert.ok(validateLocalizationBundle(bundle,{catalog,bank,scalesDoc,model,affinityCatalog:affinity}));
const english=bundles.find(b=>b.locale==='en-US'),spanish=bundles.find(b=>b.locale==='es-ES'),arabic=bundles.find(b=>b.locale==='ar');
for(const route of policy.routes){
 const en=routeLocalizationAvailability({bundle:english,route,bank,scalesDoc,model,affinityCatalog:affinity});
 assert.equal(en.available,true);assert.equal(en.affinityAvailable,true);
 for(const bundle of [spanish,arabic]){const unavailable=routeLocalizationAvailability({bundle,route,bank,scalesDoc,model,affinityCatalog:affinity});
  assert.equal(unavailable.available,false);assert.ok(unavailable.missingItems.length>0);
  assert.ok(unavailable.blockers.includes('interface_integration_pending'));
  assert.equal(unavailable.affinityAvailable,false);}
}
const quiz=createQuiz({bank,pilot,scalesDoc,formPolicy:policy,seed:'localization-regression',size:64,
 sessionId:'synthetic-localization-session',localizationBundle:english,localizationCatalogVersion:catalog.catalogVersion});
assert.equal(quiz.session.localization.bundleVersion,english.bundleVersion);
assert.equal(quiz.session.presentedItems.length,64);
assert.ok(quiz.session.presentedItems.every(entry=>entry.textVersion&&entry.variantId===null));
assert.ok(validateSavedLocalization(quiz.session,{bank,bundles,catalogs:[catalog]}));
assert.deepEqual(restoreQuiz(quiz,{bank,pilot,scalesDoc,formPolicies:[policy],localizationBundles:bundles,localizationCatalogs:[catalog]}),quiz);
assert.throws(()=>restoreQuiz(quiz,{bank,pilot,scalesDoc,formPolicies:[policy],localizationBundles:[],localizationCatalogs:[catalog]}),/bundle unavailable/);
const altered=structuredClone(quiz);altered.session.presentedItems[0].textVersion='silently-retranslated';
assert.throws(()=>restoreQuiz(altered,{bank,pilot,scalesDoc,formPolicies:[policy],localizationBundles:bundles,localizationCatalogs:[catalog]}),/wording version mismatch/);
const item=bank.items.find(i=>i.id==='RCI001'),scale=scalesDoc.scales.find(s=>s.id===item.responseScaleId);
const synthetic=structuredClone(spanish);synthetic.status='approved';synthetic.itemRealizations.push({itemId:item.id,itemRevision:item.revision,
 text:'[synthetic review fixture]',options:item.options.map(o=>({id:o.id,label:'[synthetic] '+o.id})),
 kind:'locale_variant',variantId:'synthetic-variant-1',evidenceCompatibility:'not_comparable',status:'approved',
 textVersion:'synthetic-text-1',producer:'synthetic test fixture',createdAt:'2026-09-29T00:00:00Z',sourceNote:'test',adaptationNote:'test',
 reviews:[{role:'linguistic',reviewer:'synthetic',at:'2026-09-29T00:00:00Z',note:'test'},
  {role:'philosophical',reviewer:'synthetic',at:'2026-09-29T00:00:00Z',note:'test'}]});
const syntheticCatalog=structuredClone(catalog);syntheticCatalog.locales.find(r=>r.locale==='es-ES').status='approved';
assert.throws(()=>validateLocalizationBundle(synthetic,{catalog:syntheticCatalog,bank,scalesDoc,model,affinityCatalog:affinity}),/incompatible adaptation/);
synthetic.itemRealizations[0].evidenceCompatibility='same_proposition_reviewed';
assert.ok(validateLocalizationBundle(synthetic,{catalog:syntheticCatalog,bank,scalesDoc,model,affinityCatalog:affinity}));
assert.deepEqual(itemLocalization(synthetic,item),{textVersion:'synthetic-text-1',variantId:'synthetic-variant-1'});
assert.throws(()=>localizeItem(synthetic,item,scale),/response scale is not approved/);
synthetic.itemRealizations[0].status='needs_revision';
assert.equal(itemLocalization(synthetic,item),null);
assert.equal(arabic.direction,'rtl');
assert.deepEqual(localizeSummary({schemaVersion:'quiz-summary-2',rows:[{id:'afterlife-belief',status:'supported'}]},spanish),
 {available:false,reason:'result_content_unavailable',missingPropositions:['afterlife-belief'],affinityAvailable:false});
const translationFixture={canonical:false,uiIntegrationStatus:'complete',
 propositionRealizations:[{propositionId:'legacy',status:'approved',label:'Legacy',proposition:'Translated scope',boundary:'Limit'},
  {propositionId:'explicit',status:'approved',label:'Explicit',proposition:'Translated proposition',boundary:'Limit'}],
 resultStates:Object.fromEntries(RESULT_STATES.map(state=>[state,{status:'approved',label:state,explanation:'Fixture'}])),
 affinityRealizations:[]};
const summaryV3={schemaVersion:'quiz-summary-3',rows:[
 {id:'legacy',status:'supported',proposition:null,scope:'English scope',propositionBasis:'inherited_rule_scope'},
 {id:'explicit',status:'supported',proposition:'English proposition',scope:'English proposition',propositionBasis:'explicit_rule_proposition'}],
 domains:[],overview:[],mixedOrUnresolved:[],unmeasured:[],affinities:null};
const translated=localizeSummary(summaryV3,translationFixture);
assert.equal(translated.available,true);
assert.equal(translated.summary.rows[0].proposition,null,'A translated legacy scope must remain a scope.');
assert.equal(translated.summary.rows[0].scope,'Translated scope');
assert.equal(translated.summary.rows[1].proposition,'Translated proposition');
const unreviewedDirect=structuredClone(summaryV3);
unreviewedDirect.rows[0].inferenceStatus='direct';
unreviewedDirect.rows[0].presentationReview={schemaVersion:'direct-presentation-1',state:'inherited_rule_scope'};
assert.equal(localizeSummary(unreviewedDirect,translationFixture).reason,'presentation_qualification_unavailable',
 'An approved translation of generic result states must not erase the direct-evidence qualification.');
synthetic.itemRealizations[0].status='approved';synthetic.itemRealizations[0].reviews=[];
assert.throws(()=>validateLocalizationBundle(synthetic,{catalog:syntheticCatalog,bank,scalesDoc,model,affinityCatalog:affinity}),/linguistic and philosophical review/);
console.log('Localization regressions passed: release gating, exact wording replay, variant compatibility, missing scale, and RTL metadata.');
