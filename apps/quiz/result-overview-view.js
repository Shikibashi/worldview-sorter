import {resultOverviewDescription} from '../../packages/experience/result-overview.js';

const element=(tag,text,cls)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=text;
 if(cls)node.className=cls;
 return node;
};

function domainLink(text,domainId,onDomainSelect){
 const link=element('a',text);
 link.href='#domain-'+domainId;
 link.addEventListener('click',()=>onDomainSelect(domainId));
 return link;
}

// Presentation only: this module renders an already-qualified projection and
// never reads answers or derives philosophical states.
export function renderResultHighlights({holder,overview,description,projection,domains,onDomainSelect=()=>{}}){
 holder.replaceChildren();
 if(!projection){overview.hidden=true;return;}
 overview.hidden=false;
 description.textContent=resultOverviewDescription(projection);
 const groups=[['Supported',projection.supported],['Opposed',projection.opposed],
  ['Mixed or context-dependent',projection.mixed],['Asked, still inconclusive',projection.insufficient]];
 for(const [title,rows] of groups){
  if(!rows.length)continue;
  const section=element('section',undefined,'highlight-group');
  section.dataset.state=title==='Supported'?'supported':
   title==='Opposed'?'opposed':title==='Mixed or context-dependent'?'mixed':'insufficient';
  section.append(element('h3',title));
  const list=element('ul');
  for(const row of rows){
   const item=element('li');
   item.append(domainLink(row.proposition,row.domainId,onDomainSelect));
   list.append(item);
  }
  section.append(list);holder.append(section);
 }
 if(!projection.supported.length&&!projection.opposed.length&&!projection.mixed.length&&projection.provisionalPatterns.length){
  const section=element('section',undefined,'highlight-group');section.dataset.state='review_required';
  section.append(element('h3','Provisional answer patterns'));
  const list=element('ul');
  for(const row of projection.provisionalPatterns){
   const label=row.status==='mixed_context_dependent'?'Mixed pattern':row.status==='opposed'?'Opposed pattern':'Supported pattern';
   const item=element('li');
   item.append(domainLink(label+' · '+row.label,row.domainId,onDomainSelect));
   list.append(item);
  }
  section.append(list);holder.append(section);
 }
 const unmeasured=element('section',undefined,'highlight-group');unmeasured.dataset.state='not_measured';
 unmeasured.append(element('h3','Not measured on this route'));
 if(projection.unmeasured.length){
  const list=element('ul');
  for(const domainState of projection.unmeasured){
   const domain=domains.find(row=>row.id===domainState.id),item=element('li');
   item.append(element('a',(domain?.title??domainState.id)+' · '+
    domainState.counts.not_measured+' of '+domainState.total+' interpretations not measured'));
   item.firstChild.href='#domain-'+domainState.id;list.append(item);
  }
  unmeasured.append(list);
 }else unmeasured.append(element('p',
  'No interpretation is marked not measured here; some may still be inconclusive or provisional.','small'));
 holder.append(unmeasured);
}

export function appendDomainEvidenceStrip(card,projection){
 if(!projection||!projection.total)return;
 const labels={supported:'supported',opposed:'opposed',leaned_toward:'leaned toward',
  mixed_context_dependent:'mixed',insufficient_evidence:'insufficient',not_measured:'not measured',review_required:'provisional'};
 const strip=element('span',undefined,'domain-strip');strip.setAttribute('aria-hidden','true');
 const description=[];
 for(const [state,label] of Object.entries(labels)){
  const count=projection.counts[state]??0;if(!count)continue;
  const segment=element('span',undefined,'domain-segment');segment.dataset.state=state;segment.style.flexGrow=String(count);
  strip.append(segment);description.push(count+' '+label);
 }
 card.append(strip,element('span',projection.assessed+' of '+projection.total+
  ' interpretations assessed · '+description.join(' · '),'domain-counts'));
}
