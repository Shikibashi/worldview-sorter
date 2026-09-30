import {readFile} from 'node:fs/promises';
import {currentFromManifest} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
if(!args.includes('--item')||!args.includes('--locale'))throw Error('Usage: node scripts/review-localization.mjs --item ITEM_ID --locale LOCALE');
const [active,terms]=await Promise.all([read('data/current.json'),read('data/localization/terminology-review-v1.json')]);
const current=args.includes('--manifest')?currentFromManifest(await read(option('--manifest'))):active;
const [bank,model,affinity,scales,catalog]=await Promise.all([read(current.candidateBank.path),read(current.worldviewModel.path),
 read(current.affinityCatalog.path),read('data/response-scales.json'),read(current.localizationCatalog.path)]);
const item=bank.items.find(row=>row.id===option('--item'));
const registration=catalog.locales.find(row=>row.locale===option('--locale'));
if(!item||!registration)throw Error('Unknown item or locale.');
const bundle=await read(registration.path),realization=bundle.itemRealizations.find(row=>row.itemId===item.id&&row.itemRevision===item.revision)??null;
const scale=scales.scales.find(row=>row.id===item.responseScaleId);
const matchingRules=model.commitments.filter(rule=>rule.evidence?.some(e=>e.itemId===item.id&&e.itemRevision===item.revision));
const relatedConstructs=model.coverage.constructs.filter(row=>row.candidateItemIds?.includes(item.id));
const neighboringRules=model.commitments.filter(rule=>!matchingRules.includes(rule)&&
 relatedConstructs.some(construct=>construct.id===rule.constructId)).slice(0,24);
const sources=new Map([...model.sources,...(affinity.sources??[])].map(source=>[source.id,source]));
const sourceIds=new Set([...item.provenance.sourceRefs,...matchingRules.flatMap(rule=>rule.sourceIds??[])]);
const termFlags=terms.terms.filter(term=>term.englishPatterns.some(pattern=>
 new RegExp('\\b'+pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(item.text+' '+item.options.map(o=>o.label).join(' '))));
const report={locale:registration.locale,status:registration.status,canonical:{itemId:item.id,itemRevision:item.revision,
 text:item.text,responseType:item.responseType,options:item.options,responseScale:scale,specialStates:item.specialStates,
 eligibility:item.eligibility,provenance:item.provenance},
 realization,targets:item.targets,relatedConstructs:relatedConstructs.map(row=>({id:row.id,name:row.name,domainId:row.domainId,
 disposition:row.disposition,coverageGap:row.coverageGap})),
 directRules:matchingRules.map(rule=>({id:rule.id,label:rule.label,boundary:rule.boundary,evidence:rule.evidence,
  minEvidence:rule.minEvidence,sourceIds:rule.sourceIds})),
 neighboringRules:neighboringRules.map(rule=>({id:rule.id,label:rule.label,boundary:rule.boundary})),
 sources:[...sourceIds].map(id=>sources.get(id)??{id,missing:true}),
 terminologyFlags:termFlags.map(term=>({id:term.id,reviewQuestion:term.reviewQuestion})),
 reviewChecklist:['Preserve the proposition and nearest-view discriminator.','Confirm every response option and special state retains its distinct meaning.',
  'Record source language, literal versus adapted wording, variant compatibility, and reasons for adaptation.',
  'Record linguistic and philosophical reviews; add cultural review when context requires it.','If meaning changes, require a new revision or non-comparable locale variant.']};
console.log(JSON.stringify(report,null,2));
