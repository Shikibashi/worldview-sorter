import {compareWorldview} from '../worldview/index.js';
import {EXPERIENCE_VERSION} from './quiz.js';

export const DOMAIN_COPY={
 ME:['Moral truth','What makes a moral claim true?'],NE:['Right action','What should guide our choices?'],
 MF:['Moral concerns','What catches your moral attention?'],VA:['What matters','Which priorities shape your life?'],
 EP:['Knowing','How do you decide what to believe?'],OM:['Reality','What kinds of things exist?'],
 MS:['Mind & self','What makes you, you?'],AH:['Choice & agency','What does it mean to choose freely?'],
 RC:['The bigger picture','What lies beyond ordinary experience?'],EX:['Meaning','What makes a life meaningful?'],
 SO:['Life together','How do people and institutions fit together?'],PL:['Rules & power','How should authority and cooperation work?']
};
const STATUS={supported:'Your answers support this',opposed:'Your answers lean against this',mixed:'Your answers differ here',insufficient_evidence:'Still taking shape'};
const LABELS={no_view:'No view',not_understood:'I do not understand this item',not_applicable:'Not applicable'};
const FRIENDLY={
 'legacy-objectivism-moral-truth-aptness':'Moral claims can be true or false',
 'legacy-objectivism-market-coordination':'Market coordination',
 'legacy-philosophical-anarchism-no-general-obedience':'No general duty to obey the law'
};
export function responseLabel(item,scale,response){
 if(response.state!=='answered')return LABELS[response.state]??response.state;
 if(Array.isArray(response.value))return response.value.map(id=>item.options.find(o=>o.id===id)?.label??id).join(' → ');
 return (typeof response.value==='number'?scale.options.find(o=>o.value===response.value):item.options.find(o=>o.id===response.value))?.label??String(response.value);
}
export function buildQuizSummary({model,bank,scalesDoc,session}){
 if(session.completionStatus!=='completed')throw new Error('Interpretive feedback is available after completion, not during answering.');
 const input=structuredClone(session);
 const report=compareWorldview({model,bank,scalesDoc,input});
 const items=new Map(bank.items.map(i=>[i.id,i])),scales=new Map(scalesDoc.scales.map(s=>[s.id,s]));
 const sources=new Map(model.sources.map(s=>[s.id,s]));
 const rows=report.commitments.map(c=>({
  id:c.commitmentId,domainId:c.domainId,label:FRIENDLY[c.commitmentId]??c.label,status:c.state,statusLabel:STATUS[c.state],scope:c.scope,
  // These inherited boundaries are lists of prohibited inferences. They must
  // never be presented as if they were positive claims about the respondent.
  boundary:c.commitmentId.startsWith('construct-')?'Do not infer: '+c.boundary:c.boundary,
  counts:{support:c.supportingUnits,oppose:c.opposingUnits,required:c.minimumEvidenceUnits},
  evidence:c.observations.filter(o=>o.rawResponse).map(o=>({itemId:o.itemId,itemRevision:o.itemRevision,text:items.get(o.itemId).text,
   answer:responseLabel(items.get(o.itemId),scales.get(items.get(o.itemId).responseScaleId),o.rawResponse),interpretation:o.state})),
  sources:c.sourceIds.map(id=>sources.get(id)).filter(Boolean).map(s=>({id:s.id,title:s.title,url:s.url,access:(s.access??'inherited reference; access not reverified').replaceAll('_',' '),locator:s.locator??s.use??'Conceptual reference'}))
 }));
 const domains=report.domains.map(d=>({id:d.id,title:DOMAIN_COPY[d.id]?.[0]??d.name,prompt:DOMAIN_COPY[d.id]?.[1]??'',academicTitle:d.name,
  responses:session.presentedItems.filter(e=>e.domainId===d.id&&session.responses.some(r=>r.itemId===e.itemId)).length,
  rows:rows.filter(r=>r.domainId===d.id&&r.evidence.length>0),
  unresolvedConstructCount:d.unresolvedConstructIds.length}));
 return {schemaVersion:'quiz-summary-1',experienceVersion:EXPERIENCE_VERSION,modelVersion:report.modelVersion,bankVersion:report.bankVersion,
  title:'Your worldview, in pieces',subtitle:'A map of the answers you gave, not a label you have to wear.',
  academicNotice:'Informed by philosophy and psychology research. These original questions and interpretation rules are exploratory, not a validated psychological assessment.',
  coverageNotice:'A shorter quiz leaves more open questions. A blank area means limited evidence or an unmapped topic, not a neutral or opposing belief.',
  resolvedPatterns:rows.filter(r=>['supported','opposed','mixed'].includes(r.status)).length,
  answeredItems:session.responses.filter(r=>r.state==='answered').length,
  specialResponses:session.responses.filter(r=>r.state!=='answered').length,
  domains,rows,identity:null,matchPercent:null,
  comparisons:report.comparisons.filter(p=>p.kind==='selected_tradition_commitments').map(p=>({id:p.id,label:p.label,scope:p.scope,state:p.state,limitations:p.limitations})),
  limitations:report.limitations};
}
export function createSharePreview(summary,selectedIds){
 if(!Array.isArray(selectedIds)||new Set(selectedIds).size!==selectedIds.length||selectedIds.length>6)throw new Error('Choose at most six different patterns.');
 const rows=selectedIds.map(id=>summary.rows.find(r=>r.id===id));
 if(rows.some(r=>!r||r.status==='insufficient_evidence'))throw new Error('Only visible evidence-backed patterns can be selected.');
 return ['Worldview Sorter — selected answer patterns',...rows.map(r=>r.statusLabel+': '+r.label),
  'Exploratory, research-informed quiz; not an ideology diagnosis or a percentage match.',
  'Question bank '+summary.bankVersion+' · interpretation '+summary.modelVersion].join('\n');
}
