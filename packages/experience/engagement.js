// This layer consumes completed result projections. It never reads raw answers,
// changes interpretation, or computes distances between philosophies.
export const SHARE_SCHEMA_VERSION='worldview-share-6';
const basisSnapshots=new Set(['worldview-share-5',SHARE_SCHEMA_VERSION]);
const states=new Set(['supported','opposed','leaned_toward','mixed','mixed_context_dependent','insufficient_evidence','not_measured']);
const formats=new Set(['overview','domain','affinity','exploration']);
const need=(ok,message)=>{if(!ok)throw new Error(message);};
const cleanText=value=>String(value??'').slice(0,1200);
const sources=items=>(items??[]).filter(s=>{try{return new URL(s.url).protocol==='https:';}catch{return false;}})
 .slice(0,8).map(s=>({title:cleanText(s.title),url:s.url}));
const rowSources=items=>(items??[]).filter(s=>{try{return new URL(s.url).protocol==='https:';}catch{return false;}})
 .slice(0,8).map(s=>{
  need(['rule_linked','source_record','topic_only'].includes(s.claimScope),'Missing result-source claim scope.');
  return {id:s.id,title:cleanText(s.title),url:s.url,locator:cleanText(s.locator),
   claimScope:s.claimScope,claimLinks:(s.claimLinks??[]).map(link=>({relationship:link.relationship,claim:cleanText(link.claim)})),
   sourceRecordClaim:s.claim==null?null:cleanText(s.claim),validatesThisQuiz:s.validatesThisQuiz??null};
 });
const rowProjection=row=>({id:row.id,domainId:row.domainId,inferenceStatus:row.inferenceStatus,label:cleanText(row.label),
 proposition:row.proposition==null?null:cleanText(row.proposition),scope:cleanText(row.scope),propositionBasis:row.propositionBasis,
 status:row.status,statusLabel:cleanText(row.statusLabel),
 explanation:cleanText((row.propositionBasis==='inherited_rule_scope'?'This phrase is an inherited rule scope rather than a separately recorded standalone proposition. ':'')+(row.explanation??'')),
 boundary:cleanText(row.boundary),sources:rowSources(row.sources)});
const shareableRow=(row,allowInsufficient=false)=>row&&states.has(row.status)&&row.status!=='not_measured'&&
 (allowInsufficient||row.status!=='insufficient_evidence')&&
 (row.inferenceStatus!=='derived'||row.presentationReview?.state==='eligible');
const contextFor=summary=>({mixedCount:summary.rows.filter(r=>['mixed','mixed_context_dependent'].includes(r.status)).length,
 insufficientCount:summary.rows.filter(r=>r.status==='insufficient_evidence').length,
 notMeasuredCount:summary.rows.filter(r=>r.status==='not_measured').length,
 note:'These are authored interpretations of answers to this route. Missing doctrine is not assumed agreement or disagreement.'});

export function buildShareSnapshot({summary,administration,format,selectedIds=[],domainId=null,traditionId=null,exploration=null,snapshotId,createdAt}){
 need(summary?.schemaVersion==='quiz-summary-3'&&administration?.completed===true&&
  administration.instrumentVersion===summary.instrumentVersion,'Completed pilot result required.');
 need(Object.keys(administration).every(key=>['completed','instrumentVersion','formPolicyVersion','routeId','routeVersion','localization','modelReleaseVersion'].includes(key)),
  'Only administration version metadata may enter a share snapshot.');
 const localization=administration.localization??{locale:'en-US',language:'en',direction:'ltr',bundleVersion:null,catalogVersion:null};
 need(localization.locale==='en-US'&&localization.language==='en'&&localization.direction==='ltr'&&
  Object.keys(localization).every(key=>['locale','language','direction','bundleVersion','catalogVersion'].includes(key)),
 'Share copy is currently approved only in English.');
 need(formats.has(format),'Unknown share format.');
 need(typeof snapshotId==='string'&&/^[a-f0-9-]{36}$/i.test(snapshotId),'A new opaque snapshot ID is required.');
 need(!Number.isNaN(Date.parse(createdAt)),'Valid snapshot time required.');
 const byId=new Map(summary.rows.map(r=>[r.id,r]));
 let rows=[],affinity=null,activity=null,title='';
 if(format==='overview'){
  need(Array.isArray(selectedIds)&&selectedIds.length>0&&selectedIds.length<=4&&new Set(selectedIds).size===selectedIds.length,
   'Choose one to four distinct interpreted areas.');
  rows=selectedIds.map(id=>{const row=byId.get(id);need(shareableRow(row),
   'Choose an interpreted answer pattern grounded in actual responses.');return rowProjection(row);});
  title='Selected answer patterns';
 }else if(format==='domain'){
  const domain=summary.domains.find(d=>d.id===domainId);need(domain,'Choose a result domain.');
  rows=domain.rows.filter(row=>shareableRow(row,true)).slice(0,6).map(rowProjection);
  title=domain.title+' · a worldview topic';
 }else if(format==='affinity'){
  const found=summary.affinities?.traditions.find(t=>t.id===traditionId);need(found,'Choose a catalog tradition.');
  const presentation=summary.affinityPresentation?.traditions.find(row=>row.traditionId===traditionId);
  need(presentation,'Affinity presentation qualification is unavailable.');
  affinity={id:found.id,name:cleanText(found.name),scope:found.scope,summaryState:found.summaryState,
   presentationState:presentation.state,legacyDefiningCriterionIds:[...presentation.legacyDefiningCriterionIds],
   claimUnlinkedDefiningCriterionIds:[...presentation.claimUnlinkedDefiningCriterionIds],
   context:cleanText(found.context),criteria:found.criteria.filter(c=>c.role==='defining').map(c=>{
    const mapped=c.mapping.propositionId?byId.get(c.mapping.propositionId):null;
    need(!c.mapping.propositionId||mapped,'Mapped affinity proposition is unavailable.');
    return {id:c.id,role:c.role,doctrine:cleanText(c.doctrine),finding:c.finding,
     mappingNote:cleanText(c.mapping.note),mappingStatus:c.mapping.status,
     evidenceBasis:mapped?.propositionBasis??'unmapped',mappedProposition:mapped?.proposition==null?null:cleanText(mapped.proposition),
     mappedScope:mapped?cleanText(mapped.scope):null,
     observedState:c.observedState};
   }),
   nonEntailments:found.nonEntailments.map(cleanText),neighbors:found.neighbors.map(cleanText),sources:sources(found.sources)};
  title=found.name+' · doctrinal comparison';
 }else{
  need(exploration?.version==='exploration-2'&&exploration.finished,'Completed exploration state required.');
  activity={domainIds:[...exploration.domains],traditionIds:[...exploration.traditions],sourceDomainIds:[...exploration.sourceDomains],
   sourceTraditionIds:[...exploration.sourceTraditions],
   completedRouteIds:[...exploration.routes]};
  title='Worldview exploration record';
 }
 const sourceAdministration={instrumentVersion:administration.instrumentVersion,formPolicyVersion:administration.formPolicyVersion??null,
  routeId:administration.routeId,routeVersion:administration.routeVersion??null,
  ...(administration.modelReleaseVersion?{modelReleaseVersion:administration.modelReleaseVersion}:{})};
 return {schemaVersion:SHARE_SCHEMA_VERSION,snapshotId,createdAt,format,title,localization,
  qualification:'Selected exploratory evidence, not an ideology, diagnosis, percentage, or complete account of a person.',
  provenance:{bankVersion:summary.bankVersion,modelVersion:summary.modelVersion,resultSemanticsVersion:summary.resultSemanticsVersion??null,
   affinityCatalogVersion:summary.affinityCatalogVersion??null,sourceAdministration},
  context:contextFor(summary),rows,affinity,activity};
}

export function validateShareSnapshot(snapshot){
 const only=(value,keys)=>need(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k)),'Unexpected snapshot content.');
 need(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot),'Invalid snapshot.');
 only(snapshot,['schemaVersion','snapshotId','createdAt','format','title','qualification','provenance','context','rows','affinity','activity','localization']);
 need(['worldview-share-1','worldview-share-2','worldview-share-3','worldview-share-4',...basisSnapshots].includes(snapshot.schemaVersion)&&formats.has(snapshot.format),'Unknown snapshot format.');
 if(snapshot.schemaVersion!=='worldview-share-1'){
  only(snapshot.localization,['locale','language','direction','bundleVersion','catalogVersion']);
  need(snapshot.localization.locale==='en-US'&&snapshot.localization.language==='en'&&snapshot.localization.direction==='ltr',
   'Unreviewed localized share copy.');
 }
 need(typeof snapshot.title==='string'&&typeof snapshot.qualification==='string'&&/^[a-f0-9-]{36}$/i.test(snapshot.snapshotId)&&
  !Number.isNaN(Date.parse(snapshot.createdAt)),
  'Incomplete snapshot.');
 only(snapshot.provenance,['bankVersion','modelVersion','resultSemanticsVersion','affinityCatalogVersion','sourceAdministration']);
 only(snapshot.provenance.sourceAdministration,['instrumentVersion','formPolicyVersion','routeId','routeVersion','modelReleaseVersion']);
 only(snapshot.context,['mixedCount','insufficientCount','notMeasuredCount','note']);
 need(snapshot.provenance?.modelVersion&&snapshot.provenance?.sourceAdministration?.instrumentVersion&&
  snapshot.provenance?.bankVersion&&snapshot.context&&Array.isArray(snapshot.rows),'Missing historical context.');
 need(snapshot.rows.length<=6&&snapshot.rows.every(r=>states.has(r.status)&&
  (basisSnapshots.has(snapshot.schemaVersion)?
   ((r.inferenceStatus==='direct'&&r.propositionBasis==='inherited_rule_scope'&&r.proposition===null&&typeof r.scope==='string'&&r.scope.length>0)||
    (((r.inferenceStatus==='direct'&&r.propositionBasis==='explicit_rule_proposition')||
      (r.inferenceStatus==='derived'&&r.propositionBasis==='explicit_derived_proposition'))&&
     typeof r.proposition==='string'&&r.proposition.length>0&&typeof r.scope==='string')):
   typeof r.proposition==='string')&&
  Array.isArray(r.sources)&&r.sources.every(s=>{try{return new URL(s.url).protocol==='https:';}catch{return false;}})),
  'Invalid proposition projection.');
 for(const row of snapshot.rows){only(row,['id','domainId','inferenceStatus','label','proposition',
  ...(basisSnapshots.has(snapshot.schemaVersion)?['scope','propositionBasis']:[]),
  'status','statusLabel','explanation','boundary','sources']);
  need(['direct','derived'].includes(row.inferenceStatus),'Missing direct or derived status.');
  for(const source of row.sources){
   if(snapshot.schemaVersion!==SHARE_SCHEMA_VERSION){only(source,['title','url']);continue;}
   only(source,['id','title','url','locator','claimScope','claimLinks','sourceRecordClaim','validatesThisQuiz']);
   need(typeof source.id==='string'&&source.id.length>0&&typeof source.title==='string'&&source.title.length>0&&
    typeof source.locator==='string'&&['rule_linked','source_record','topic_only'].includes(source.claimScope)&&
    Array.isArray(source.claimLinks)&&(source.sourceRecordClaim===null||typeof source.sourceRecordClaim==='string')&&
    [null,true,false].includes(source.validatesThisQuiz),
    'Invalid result-source provenance.');
   for(const link of source.claimLinks){only(link,['relationship','claim']);need(
    ['supports','context','challenges'].includes(link.relationship)&&typeof link.claim==='string'&&link.claim.length>0,
    'Invalid result-source claim link.');}
   need(source.claimScope==='rule_linked'?source.claimLinks.length>0:
    source.claimScope==='source_record'?source.claimLinks.length===0&&typeof source.sourceRecordClaim==='string'&&source.sourceRecordClaim.length>0:
     source.claimLinks.length===0&&source.sourceRecordClaim===null,
    'Result-source claim scope is inconsistent.');
  }}
 if(snapshot.format==='affinity')need(snapshot.affinity?.id&&Array.isArray(snapshot.affinity.criteria)&&
  Array.isArray(snapshot.affinity.nonEntailments),'Invalid affinity projection.');
 if(snapshot.affinity){only(snapshot.affinity,['id','name','scope','summaryState',
  ...(basisSnapshots.has(snapshot.schemaVersion)?['presentationState','legacyDefiningCriterionIds','claimUnlinkedDefiningCriterionIds']:[]),
  'context','criteria','nonEntailments','neighbors','sources']);
  if(basisSnapshots.has(snapshot.schemaVersion))need(
   (Array.isArray(snapshot.affinity.legacyDefiningCriterionIds)&&
    Array.isArray(snapshot.affinity.claimUnlinkedDefiningCriterionIds)&&(
     (snapshot.affinity.presentationState==='legacy_scope_unresolved'&&snapshot.affinity.legacyDefiningCriterionIds.length>0)||
     (snapshot.affinity.presentationState==='source_claim_unresolved'&&snapshot.affinity.legacyDefiningCriterionIds.length===0&&
      snapshot.affinity.claimUnlinkedDefiningCriterionIds.length>0)||
     (snapshot.affinity.presentationState===snapshot.affinity.summaryState&&
      snapshot.affinity.legacyDefiningCriterionIds.length===0&&snapshot.affinity.claimUnlinkedDefiningCriterionIds.length===0))),
   'Affinity presentation qualification is inconsistent.');
  for(const c of snapshot.affinity.criteria){
   const withBasis=['worldview-share-3','worldview-share-4',...basisSnapshots].includes(snapshot.schemaVersion);
   only(c,withBasis?['id','role','doctrine','finding','mappingNote','mappingStatus','evidenceBasis',
    ...(basisSnapshots.has(snapshot.schemaVersion)?['mappedProposition','mappedScope']:['mappedText']),
    ...(['worldview-share-4',...basisSnapshots].includes(snapshot.schemaVersion)?['observedState']:[])]:
    ['id','role','doctrine','finding','mappingNote']);
   if(withBasis){
    need(['direct','derived','partial','not_measured','unsuitable'].includes(c.mappingStatus),
     'Affinity mapping status is missing.');
    need(['explicit_rule_proposition','inherited_rule_scope','explicit_derived_proposition','unmapped'].includes(c.evidenceBasis),
     'Affinity evidence basis is missing.');
    if(basisSnapshots.has(snapshot.schemaVersion))need(
     c.evidenceBasis==='unmapped'?(c.mappedProposition===null&&c.mappedScope===null):
      c.evidenceBasis==='inherited_rule_scope'?(c.mappedProposition===null&&typeof c.mappedScope==='string'&&c.mappedScope.length>0):
      (typeof c.mappedProposition==='string'&&c.mappedProposition.length>0&&typeof c.mappedScope==='string'),
     'Affinity mapped proposition and scope are inconsistent.');
    else need(c.evidenceBasis==='unmapped'?c.mappedText===null:typeof c.mappedText==='string'&&c.mappedText.length>0,
     'Affinity mapped text is inconsistent.');
    if(['worldview-share-4',...basisSnapshots].includes(snapshot.schemaVersion))need(
     c.evidenceBasis==='unmapped'?c.observedState===null:states.has(c.observedState),
     'Affinity linked proposition state is inconsistent.');
   }
  }
  if(basisSnapshots.has(snapshot.schemaVersion)){
   const actualLegacy=snapshot.affinity.criteria.filter(c=>c.role==='defining'&&
    ['direct','partial'].includes(c.mappingStatus)&&c.evidenceBasis==='inherited_rule_scope').map(c=>c.id).sort();
   need(JSON.stringify([...snapshot.affinity.legacyDefiningCriterionIds].sort())===JSON.stringify(actualLegacy),
    'Affinity legacy-scope criterion references are inconsistent.');
   need(snapshot.affinity.claimUnlinkedDefiningCriterionIds.every(id=>snapshot.affinity.criteria.some(c=>
    c.id===id&&c.role==='defining'&&['direct','partial'].includes(c.mappingStatus)&&
    c.evidenceBasis==='explicit_rule_proposition')),
    'Affinity source-claim criterion references are inconsistent.');
  }
  for(const source of snapshot.affinity.sources){only(source,['title','url']);need(new URL(source.url).protocol==='https:','Invalid source URL.');}}
 if(snapshot.format==='exploration')need(snapshot.activity&&Array.isArray(snapshot.activity.domainIds),'Invalid exploration projection.');
 if(snapshot.activity)only(snapshot.activity,['domainIds','traditionIds','sourceDomainIds','sourceTraditionIds','completedRouteIds']);
 for(const secret of ['"sessionId"','"responses"','"randomizationSeed"','"responseTimeMs"','"withdrawalToken"','"consentVersion"'])
  need(!JSON.stringify(snapshot).includes(secret),'Private administration field in snapshot.');
 return snapshot;
}

export function shareSnapshotText(snapshot){
 validateShareSnapshot(snapshot);
 const lines=['Worldview Sorter · '+snapshot.title,snapshot.qualification];
 for(const row of snapshot.rows){
  lines.push(row.statusLabel+' ('+row.inferenceStatus+'): '+
   (basisSnapshots.has(snapshot.schemaVersion)&&row.propositionBasis==='inherited_rule_scope'?
    'Authored rule scope: '+row.scope+' (no separately recorded proposition)':row.proposition));
  if(snapshot.schemaVersion===SHARE_SCHEMA_VERSION&&row.sources.length){
   const linked=row.sources.flatMap(s=>s.claimLinks),supports=linked.filter(c=>c.relationship==='supports').length;
   const contextual=linked.length-supports,records=row.sources.filter(s=>s.claimScope==='source_record').length;
   const topical=row.sources.filter(s=>s.claimScope==='topic_only').length;
   lines.push(`Source basis: ${supports} linked supporting claim(s); ${contextual} linked context/challenge claim(s); ${records} source-record context citation(s); ${topical} topic-only citation(s).`);
  }
 }
 if(snapshot.affinity){
  lines.push('Affinity is comparison, not identity: '+snapshot.affinity.name+' · '+
   (snapshot.affinity.presentationState==='legacy_scope_unresolved'?
    'doctrinal affinity unresolved because defining evidence uses inherited rule scopes':
    snapshot.affinity.presentationState==='source_claim_unresolved'?
    'doctrinal affinity unresolved because a defining proposition lacks a linked supporting source claim':
    (snapshot.affinity.presentationState??snapshot.affinity.summaryState).replaceAll('_',' ')));
  for(const c of snapshot.affinity.criteria){
   if(['worldview-share-4',...basisSnapshots].includes(snapshot.schemaVersion)){
    const notes=[];
    if(c.mappingStatus==='partial')notes.push('partial doctrinal mapping; doctrine unresolved');
    if(c.evidenceBasis==='inherited_rule_scope')notes.push('mapped from an inherited rule scope, not a separately recorded proposition');
    if(c.observedState!==null)notes.push((basisSnapshots.has(snapshot.schemaVersion)&&c.evidenceBasis==='inherited_rule_scope'?
     'linked interpretation state: ':'linked proposition: ')+c.observedState.replaceAll('_',' '));
    lines.push(c.finding+(notes.length?' ('+notes.join('; ')+')':'')+': '+c.doctrine);
   }else{
    const basis=c.evidenceBasis==='inherited_rule_scope'?' (mapped from an inherited rule scope, not a separately recorded proposition)':
     c.mappingStatus==='partial'?' (partial doctrinal mapping)':'';
    lines.push(c.finding+basis+': '+c.doctrine);
   }
   if(basisSnapshots.has(snapshot.schemaVersion)){
    if(c.mappedProposition)lines.push('Mapped proposition: '+c.mappedProposition);
    else if(c.mappedScope)lines.push('Mapped rule scope: '+c.mappedScope);
   }else if(c.mappedText)lines.push('Pilot evidence text: '+c.mappedText);
  }
  if(snapshot.affinity.nonEntailments.length)lines.push('Does not imply: '+snapshot.affinity.nonEntailments[0]);
 }
 if(snapshot.activity)lines.push('Domains explored: '+snapshot.activity.domainIds.length+' of 12; traditions inspected: '+snapshot.activity.traditionIds.length+
  '; source trails opened: '+(snapshot.activity.sourceDomainIds.length+snapshot.activity.sourceTraditionIds.length)+'.');
 lines.push('Context: '+snapshot.context.mixedCount+' mixed, '+snapshot.context.insufficientCount+' insufficient, '+snapshot.context.notMeasuredCount+' not-measured interpretations in the source result.');
 lines.push('Model '+snapshot.provenance.modelVersion+' · instrument '+snapshot.provenance.sourceAdministration.instrumentVersion+
  ' · route '+snapshot.provenance.sourceAdministration.routeId+' · catalog '+(snapshot.provenance.affinityCatalogVersion??'none'));
 if(snapshot.localization)lines.push('Wording release '+(snapshot.localization.bundleVersion??'historical wording, version unpinned'));
 lines.push('Snapshot '+snapshot.snapshotId+' · '+snapshot.createdAt);
 return lines.join('\n');
}

export function shareSnapshotSvg(snapshot){
 const fullText=shareSnapshotText(snapshot);
 const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
 const wrap=(value,max=45)=>{
  const words=String(value??'').split(/\s+/),out=[];let line='';
  for(const word of words){if((line+' '+word).length>max&&line){out.push(line);line='';}
   if(word.length>max){if(line){out.push(line);line='';}for(let i=0;i<word.length;i+=max)out.push(word.slice(i,i+max));}
   else line+=(line?' ':'')+word;}
  if(line)out.push(line);return out;
 };
 const entries=[];
 const add=(heading,value)=>entries.push({heading,lines:wrap(value).slice(0,3)});
 if(snapshot.rows.length){
  for(const row of snapshot.rows){
   const status=row.status==='mixed_context_dependent'?'Mixed / context-dependent':row.status.replaceAll('_',' ');
   const caveat=row.propositionBasis==='inherited_rule_scope'?'provisional; no exact proposition':
    /supporting source link not recorded/i.test(row.statusLabel)?'provisional; source link not recorded':row.inferenceStatus;
   add(status+' · '+caveat,
   row.propositionBasis==='inherited_rule_scope'?'Authored rule scope: '+row.scope+' (no separately recorded proposition)':row.proposition);
  }
 }else if(snapshot.affinity){
  add('Doctrinal comparison · not an identity',snapshot.affinity.name+' · '+
   (snapshot.affinity.presentationState??snapshot.affinity.summaryState).replaceAll('_',' '));
  for(const criterion of snapshot.affinity.criteria.filter(c=>c.role==='defining').slice(0,4))
   add(criterion.finding+' · defining',criterion.doctrine);
 }else if(snapshot.activity){
  add('Exploration activity',snapshot.activity.domainIds.length+' of 12 topics opened; '+
   snapshot.activity.traditionIds.length+' traditions inspected; '+
   (snapshot.activity.sourceDomainIds.length+snapshot.activity.sourceTraditionIds.length)+' source trails opened.');
 }
 const shown=entries.slice(0,6),lineHeight=33;
 let y=402;const panels=[];
 for(const entry of shown){
  const height=42+entry.lines.length*lineHeight;
  if(y+height>1055)break;
  panels.push(`<rect x="88" y="${y}" width="904" height="${height}" fill="#fff" stroke="#383f78" stroke-width="2"/>`+
   `<text x="110" y="${y+30}" font-family="Courier New,monospace" font-size="21" font-weight="700" fill="#5530a3">${esc(entry.heading.toUpperCase())}</text>`+
   entry.lines.map((line,index)=>`<text x="110" y="${y+65+index*lineHeight}" font-family="Verdana,Arial,sans-serif" font-size="24" fill="#11132d">${esc(line)}</text>`).join(''));
  y+=height+12;
 }
 const titleLines=wrap(snapshot.title,36).slice(0,2);
 const qualification=wrap(snapshot.qualification,69).slice(0,3);
 const context=`${snapshot.context.mixedCount} mixed · ${snapshot.context.insufficientCount} insufficient · ${snapshot.context.notMeasuredCount} not measured in the source result`;
 const model=`Model ${snapshot.provenance.modelVersion} · route ${snapshot.provenance.sourceAdministration.routeId} · catalog ${snapshot.provenance.affinityCatalogVersion??'none'}`;
 const contextBlock=y<790?`<rect x="88" y="820" width="904" height="202" fill="#e1e3ee" stroke="#383f78" stroke-width="2"/><text x="110" y="860" font-family="Courier New,monospace" font-size="22" font-weight="700" fill="#5530a3">OTHER INTERPRETATIONS IN THE SOURCE RESULT</text>${[['MIXED',snapshot.context.mixedCount],['INSUFFICIENT',snapshot.context.insufficientCount],['NOT MEASURED',snapshot.context.notMeasuredCount]].map(([label,count],index)=>`<text x="${118+index*295}" y="932" font-family="Georgia,serif" font-size="52" font-weight="700" fill="#11132d">${esc(count)}</text><text x="${118+index*295}" y="970" font-family="Courier New,monospace" font-size="20" font-weight="700" fill="#383f78">${label}</text>`).join('')}`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" lang="en" dir="ltr" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-labelledby="card-title card-description"><title id="card-title">Worldview Sorter selected ${esc(snapshot.format)} snapshot</title><desc id="card-description">${esc(fullText)}</desc><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#9da2bd" stroke-width="2"/></pattern></defs><rect width="1080" height="1350" fill="#d6d9e8"/><rect width="1080" height="1350" fill="url(#grid)"/><rect x="62" y="65" width="970" height="1234" fill="#11132d" opacity="0.43"/><rect x="48" y="48" width="970" height="1234" fill="#f4f3eb" stroke="#383f78" stroke-width="4"/><rect x="48" y="48" width="970" height="72" fill="#e1e3ee" stroke="#383f78" stroke-width="4"/><text x="84" y="93" font-family="Courier New,monospace" font-size="25" font-weight="700" fill="#5530a3">WORLDVIEW SORTER / SELECTED SNAPSHOT</text>${titleLines.map((line,index)=>`<text x="84" y="${168+index*47}" font-family="Georgia,serif" font-size="42" font-weight="700" fill="#11132d">${esc(line)}</text>`).join('')}${qualification.map((line,index)=>`<text x="88" y="${263+index*31}" font-family="Verdana,Arial,sans-serif" font-size="22" fill="#383f78">${esc(line)}</text>`).join('')}<line x1="88" y1="370" x2="992" y2="370" stroke="#383f78" stroke-width="3"/>${panels.join('')}${contextBlock}<rect x="88" y="1080" width="904" height="122" fill="#e1e3ee" stroke="#383f78" stroke-width="2"/>${wrap(context,76).slice(0,2).map((line,index)=>`<text x="108" y="${1113+index*25}" font-family="Courier New,monospace" font-size="18" font-weight="700" fill="#11132d">${esc(line)}</text>`).join('')}${wrap(model,76).slice(0,2).map((line,index)=>`<text x="108" y="${1164+index*23}" font-family="Courier New,monospace" font-size="18" fill="#383f78">${esc(line)}</text>`).join('')}<text x="88" y="1240" font-family="Courier New,monospace" font-size="19" fill="#383f78">Selected evidence only · full context in the snapshot text/JSON</text></svg>`;
}

export function compareShareSnapshots(first,second){
 validateShareSnapshot(first);validateShareSnapshot(second);
 const sameModel=first.provenance.modelVersion===second.provenance.modelVersion&&
  first.provenance.resultSemanticsVersion===second.provenance.resultSemanticsVersion;
 const a=new Map(first.rows.map(r=>[r.id,r])),b=new Map(second.rows.map(r=>[r.id,r]));
 return {sameModel,routeChanged:first.provenance.sourceAdministration.routeId!==second.provenance.sourceAdministration.routeId,
  instrumentChanged:first.provenance.sourceAdministration.instrumentVersion!==second.provenance.sourceAdministration.instrumentVersion,
  catalogChanged:first.provenance.affinityCatalogVersion!==second.provenance.affinityCatalogVersion,
  wordingChanged:(first.localization?.bundleVersion??null)!==(second.localization?.bundleVersion??null),
  sharedPropositions:sameModel?[...a.keys()].filter(id=>b.has(id)&&
   a.get(id).proposition!==null&&b.get(id).proposition!==null).map(id=>({id,label:a.get(id).label,before:a.get(id).status,after:b.get(id).status})):[],
  sharedScopes:sameModel?[...a.keys()].filter(id=>b.has(id)&&
   (a.get(id).propositionBasis==='inherited_rule_scope'||b.get(id).propositionBasis==='inherited_rule_scope'))
   .map(id=>({id,label:a.get(id).label,before:a.get(id).status,after:b.get(id).status})):[],
  note:sameModel?'A different state can reflect more questions, different answers, or both; these selected snapshots do not identify the cause.':
   'Interpretation versions differ. State labels are not treated as respondent change.'};
}

export function readingTrailFor(summary,{kind,id}){
 need(summary?.schemaVersion==='quiz-summary-3','Pilot summary required.');
 if(kind==='proposition'){
  const row=summary.rows.find(r=>r.id===id);need(row,'Unknown proposition.');
  return {kind,id,title:row.label,question:row.proposition??row.scope,questionBasis:row.propositionBasis,
   status:row.displayState??row.status,
   why:row.explanation,alternatives:row.interpretationRule?.neighbors??[],nonEntailments:row.interpretationRule?.nonEntailments??[],
   sources:sources(row.sources)};
 }
 const tradition=summary.affinities?.traditions.find(t=>t.id===id);need(kind==='tradition'&&tradition,'Unknown tradition.');
 const presentation=summary.affinityPresentation?.traditions.find(row=>row.traditionId===id);
 return {kind,id,title:tradition.name,question:tradition.context,status:presentation?.state??tradition.summaryState,
  why:'Compare defining doctrine, divergences, and unmeasured criteria before drawing any resemblance.',
  alternatives:tradition.neighbors,nonEntailments:tradition.nonEntailments,sources:sources(tradition.sources)};
}

export function compareTraditions(affinities,leftId,rightId){
 need(leftId!==rightId,'Choose two distinct traditions.');
 const left=affinities?.traditions.find(t=>t.id===leftId),right=affinities?.traditions.find(t=>t.id===rightId);
 need(left&&right,'Unknown catalog tradition.');
 const mapped=t=>new Map(t.criteria.filter(c=>c.mapping.propositionId).map(c=>[c.mapping.propositionId,c]));
 const l=mapped(left),r=mapped(right);
 return {left,right,sharedPropositionMappings:[...l.keys()].filter(id=>r.has(id)).map(id=>({propositionId:id,
  leftDoctrine:l.get(id).doctrine,rightDoctrine:r.get(id).doctrine,leftFinding:l.get(id).finding,rightFinding:r.get(id).finding})),
  note:'Shared mapping means these catalog criteria reference the same public interpretation rule; it does not make the traditions identical or rank them.'};
}

export function recommendExploration({summary,clarificationPlans=[]}){
 need(summary?.schemaVersion==='quiz-summary-3','Pilot summary required.');
 const actions=[];
 for(const {domainId,entries} of clarificationPlans){
  if(!entries?.length)continue;
  const domain=summary.domains.find(d=>d.id===domainId);if(!domain)continue;
  const direct=domain.rows.filter(r=>r.inferenceStatus==='direct');
  const mixed=direct.filter(r=>['mixed','mixed_context_dependent'].includes(r.status)).length;
  const weak=direct.filter(r=>['insufficient_evidence','leaned_toward'].includes(r.status)).length;
  const missing=direct.filter(r=>r.status==='not_measured').length;
  const reason=mixed?'mixed_evidence':weak?'weak_or_insufficient_evidence':missing?'unmeasured_direct_content':null;
  if(reason)actions.push({kind:'clarify_domain',domainId,count:entries.length,reason,
   label:'Explore '+domain.title+' with up to '+entries.length+' additional question'+(entries.length===1?'':'s')});
 }
 const order={mixed_evidence:0,weak_or_insufficient_evidence:1,unmeasured_direct_content:2};
 return actions.sort((a,b)=>order[a.reason]-order[b.reason]||a.domainId.localeCompare(b.domainId)).slice(0,3);
}
