// A presentation projection of interpreted results. No raw answers or scoring enter here.
const displayable=row=>row?.displayState!=='model_review_required'&&row?.presentationReview?.state==='eligible'&&
 row?.inferenceStatus==='direct'&&row?.propositionBasis==='explicit_rule_proposition';
const distinctDomains=(rows,limit)=>{
 const chosen=[];
 for(const row of rows)if(!chosen.some(other=>other.domainId===row.domainId)){chosen.push(row);if(chosen.length===limit)return chosen;}
 for(const row of rows)if(!chosen.includes(row)){chosen.push(row);if(chosen.length===limit)break;}
 return chosen;
};
const stateOf=row=>{
 if(row.status==='not_measured'||row.status==='insufficient_evidence')return row.status;
 if(row.displayState==='model_review_required'||row.presentationReview?.state!=='eligible')return 'review_required';
 return row.status==='mixed'?'mixed_context_dependent':row.status;
};

export function buildResultOverview(summary){
 if(summary?.schemaVersion!=='quiz-summary-3')return null;
 const rows=summary.rows??[];
 const direct=rows.filter(displayable);
 const byStatus=status=>direct.filter(row=>row.status===status);
 const domains=(summary.domains??[]).map(domain=>{
  const counts={supported:0,opposed:0,leaned_toward:0,mixed_context_dependent:0,
   insufficient_evidence:0,not_measured:0,review_required:0};
  for(const row of domain.rows??[])counts[stateOf(row)]=(counts[stateOf(row)]??0)+1;
  const total=(domain.rows??[]).length;
  return {id:domain.id,total,assessed:total-counts.not_measured,counts};
 });
 return {
  supported:distinctDomains(byStatus('supported'),4),
  opposed:distinctDomains(byStatus('opposed'),2),
  mixed:distinctDomains(byStatus('mixed_context_dependent'),2),
  insufficient:distinctDomains(byStatus('insufficient_evidence'),1),
  provisionalPatterns:distinctDomains(rows.filter(row=>row.inferenceStatus==='direct'&&
   ['supported','opposed','mixed_context_dependent'].includes(row.status)&&!displayable(row)),4),
  unmeasured:domains.filter(domain=>domain.counts.not_measured>0).sort((a,b)=>
   b.counts.not_measured-a.counts.not_measured||a.id.localeCompare(b.id)).slice(0,2),
  domains
 };
}
