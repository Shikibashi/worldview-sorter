import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createFeedbackStore} from '../packages/beta/feedback.js';

const args=process.argv.slice(2),flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const logPath=flag('--log'),storePath=flag('--store');
if(!logPath&&!storePath)throw Error('Use --log JSONL and/or --store ABSOLUTE_PRIVATE_DIRECTORY.');
let malformedLogLines=0;
const events=logPath?(await readFile(path.resolve(logPath),'utf8')).split('\n').filter(Boolean).flatMap(line=>{
 try{return [JSON.parse(line)];}catch{malformedLogLines++;return [];}}):[];
const count=(rows,key)=>Object.fromEntries([...new Set(rows.map(row=>row[key]).filter(Boolean))].sort().map(value=>
 [value,rows.filter(row=>row[key]===value).length]));
const failures=events.filter(e=>/failed|failure|error/.test(e.event??''));
const product=events.filter(e=>e.event==='product_route_event');
const completionMedian=Object.fromEntries([...new Set(product.filter(e=>e.productEvent==='route_completed').map(e=>e.routeId))]
 .sort().map(routeId=>{const counts=product.filter(e=>e.productEvent==='route_completed'&&e.routeId===routeId)
  .map(e=>e.itemCount).filter(Number.isInteger).sort((a,b)=>a-b);
  return [routeId,counts.length?counts[Math.floor((counts.length-1)/2)]:null];}));
const reports=storePath?await createFeedbackStore({directory:storePath}).list():[];
const reviews=storePath?await Promise.all(reports.map(r=>createFeedbackStore({directory:storePath}).getReview(r.feedbackId))):[];
console.log(JSON.stringify({schemaVersion:'worldview-beta-health-1',malformedLogLines,
 operationalFailures:count(failures,'event'),routeEvents:count(product,'productEvent'),
 clientFailures:count(product.filter(e=>['save_failed','result_generation_failed','route_failed'].includes(e.productEvent)),'productEvent'),
 routeStarts:count(product.filter(e=>e.productEvent==='route_started'),'routeId'),
 routeCompletions:count(product.filter(e=>e.productEvent==='route_completed'),'routeId'),
 completedItemCountMedianByRoute:completionMedian,
 clarificationRequests:product.filter(e=>e.productEvent==='clarification_requested').length,
 clarificationOffers:product.filter(e=>e.productEvent==='clarification_offered').length,
 clarificationCompletions:product.filter(e=>e.productEvent==='clarification_completed').length,
 feedbackByKind:count(reports,'kind'),feedbackByCategory:count(reports,'category'),
 accessibilityReports:reports.filter(r=>r.category.startsWith('accessibility')).length,
 localizationReports:reports.filter(r=>r.category.startsWith('localization')||r.category==='rtl_layout'||r.category==='cultural_example').length,
 unresolvedHighSeverity:reviews.filter(r=>['critical','high'].includes(r.severity)&&!['resolved','declined'].includes(r.status)).length,
 limits:'Operational counts only. No respondent linkage, philosophical prevalence, or psychometric inference.'},null,2));
