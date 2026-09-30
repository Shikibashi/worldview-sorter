import {validateShareSnapshot,compareShareSnapshots} from '../../packages/experience/engagement.js';
const $=id=>document.getElementById(id);
const elem=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
let first=null,second=null;
const file=async input=>{if(!input.files?.[0])return null;if(input.files[0].size>256000)throw Error('The selected file is too large for a share snapshot.');
 return validateShareSnapshot(JSON.parse(await input.files[0].text()));};
function render(){
 const view=$('snapshot-view');view.replaceChildren();$('snapshot-comparison').replaceChildren();if(!first)return;
 view.lang=first.localization?.language??'en';view.dir=first.localization?.direction??'ltr';
 view.append(elem('h2',first.title),elem('p',first.qualification),elem('p',first.context.note));
 view.append(elem('p',`${first.context.mixedCount} mixed · ${first.context.insufficientCount} insufficient · ${first.context.notMeasuredCount} not measured in the source result.`));
 for(const row of first.rows){const section=elem('section');section.className='pattern';const statement=row.propositionBasis==='inherited_rule_scope'?
  'Authored rule scope: '+row.scope+' (no separately recorded proposition)':row.proposition;
  section.append(elem('h3',row.label),elem('p',row.statusLabel+' ('+row.inferenceStatus+'): '+statement),elem('p',row.explanation));
  if(row.boundary)section.append(elem('p','Limit: '+row.boundary));addSources(section,row.sources,true);view.append(section);}
 if(first.affinity){const a=first.affinity,section=elem('section');section.className='notice';section.append(elem('h3',a.name),elem('p','Affinity is comparison, not identity. '+a.context));
  if(a.presentationState==='legacy_scope_unresolved')section.append(elem('p','Doctrinal affinity unresolved: defining evidence uses inherited rule scopes.'));
  if(a.presentationState==='source_claim_unresolved')section.append(elem('p','Doctrinal affinity unresolved: a defining proposition lacks a linked supporting source claim.'));
  for(const c of a.criteria)section.append(elem('p',c.finding.replaceAll('_',' ')+': '+c.doctrine));
  if(a.nonEntailments.length)section.append(elem('p','Does not imply: '+a.nonEntailments.join(' · ')));addSources(section,a.sources);view.append(section);}
 if(first.activity)view.append(elem('p',`${first.activity.domainIds.length} domains explored · ${first.activity.traditionIds.length} traditions inspected · ${first.activity.sourceDomainIds.length+first.activity.sourceTraditionIds.length} source trails opened. This is activity, not a philosophical result.`));
 const p=first.provenance;view.append(elem('p',`Historical snapshot ${first.createdAt} · language ${first.localization?.locale??'historical English, unpinned'} · wording ${first.localization?.bundleVersion??'unpinned'} · model ${p.modelVersion} · semantics ${p.resultSemanticsVersion??'unspecified'} · instrument ${p.sourceAdministration.instrumentVersion} · route ${p.sourceAdministration.routeId} · affinity catalog ${p.affinityCatalogVersion??'none'}.`));
 if(second){const c=compareShareSnapshots(first,second),section=$('snapshot-comparison');section.append(elem('h2','Compare selected historical snapshots'),elem('p',c.note));
  if(c.routeChanged)section.append(elem('p','The route depth changed between these selected files.'));
  if(c.instrumentChanged)section.append(elem('p','The instrument version changed.'));
  if(c.catalogChanged)section.append(elem('p','The affinity catalog version changed.'));
  if(c.wordingChanged)section.append(elem('p','The language or wording release changed; translated labels are not treated as a change in worldview.'));
  for(const r of c.sharedPropositions)section.append(elem('p',`${r.label}: ${r.before.replaceAll('_',' ')} → ${r.after.replaceAll('_',' ')}.`));
  for(const r of c.sharedScopes)section.append(elem('p',`Authored rule scope · ${r.label}: ${r.before.replaceAll('_',' ')} → ${r.after.replaceAll('_',' ')}.`));
  if(!c.sharedPropositions.length&&!c.sharedScopes.length)section.append(elem('p','No directly comparable selected interpretations.'));}
}
function addSources(container,sources,resultSources=false){if(!sources.length)return;const details=elem('details'),title=elem('summary','Inspect sources');details.append(title);
 for(const source of sources){const entry=elem('div'),link=elem('a',source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';entry.append(link);
  if(resultSources){
   if(source.claimScope==='rule_linked'){
    for(const claim of source.claimLinks)entry.append(elem('p',`Rule-linked ${claim.relationship} claim: ${claim.claim}`));
    if(source.sourceRecordClaim)entry.append(elem('p','Broader source-record context: '+source.sourceRecordClaim));
   }else if(source.claimScope==='source_record')entry.append(elem('p','Source-record context, not linked to this result: '+source.sourceRecordClaim));
   else if(source.claimScope==='topic_only')entry.append(elem('p','Topic citation; claim-level relevance to this result was not recorded.'));
   else entry.append(elem('p','This historical snapshot did not retain claim-level source roles.'));
   if(source.locator)entry.append(elem('p','Locator: '+source.locator));
   if(source.validatesThisQuiz===false)entry.append(elem('p','This source does not validate the questionnaire.'));
  }
  details.append(entry);
 }container.append(details);}
async function changed(which){try{const result=await file($(which==='first'?'snapshot-file':'compare-file'));if(which==='first')first=result;else second=result;
 $('snapshot-status').textContent=result?'Opened a selected historical snapshot.':'No file selected.';render();}catch{$('snapshot-status').textContent='This is not a supported share snapshot. The file was not opened.';}}
$('snapshot-file').addEventListener('change',()=>changed('first'));
$('compare-file').addEventListener('change',()=>changed('second'));
