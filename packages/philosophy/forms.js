import {shuffleWithSeed} from '../runtime/index.js';
import {orderSelectedItems} from '../runtime/packet-ordering.js';
const need=(p,m)=>{if(!p)throw new Error(m);};

/** A content blueprint, not a psychometrically calibrated short form.
 * It samples complete authored evidence bundles before filling remaining slots.
 * Selection takes no answers, identities, game state, or normative target. */
export function generatePhilosophyPacket({bank,pilot,policy,seed,size,packetId}){
 need(['facet-bundles-1','frozen-packet-1','progressive-fixed-1'].includes(policy?.algorithm),'Unsupported content blueprint.');
 need(bank.bankVersion===policy.bankVersion,'Blueprint/bank version mismatch.');
 need(typeof seed==='string'&&seed.length>0&&seed.length<=200,'Seed must be 1–200 characters.');
 need(policy.algorithm==='progressive-fixed-1'?policy.routes.some(r=>r.size===size):policy.sizes.includes(size),'Unsupported public route length.');
 const byId=new Map(bank.items.map(i=>[i.id,i]));
 if(['frozen-packet-1','progressive-fixed-1'].includes(policy.algorithm)){
  const route=policy.algorithm==='progressive-fixed-1'?policy.routes.find(r=>r.size===size):null;
  const frozenItems=route?.itemRefs??policy.frozenItems;
  need(frozenItems?.length===size,'Frozen route length mismatch.');
  const seen=new Set(),positions=new Map();
  const entries=frozenItems.map((ref,index)=>{
   const item=byId.get(ref.itemId);
   need(item&&item.revision===ref.itemRevision&&!seen.has(ref.itemId),'Unknown, stale or repeated frozen item '+ref.itemId);
   need(!(policy.excludedItemIds??[]).includes(item.id),'Excluded frozen item '+item.id);
   if(item.eligibility?.mode==='conditional')for(const condition of item.eligibility.all)need(positions.has(condition.itemId),'Frozen branch prerequisite must precede '+item.id);
   seen.add(item.id);positions.set(item.id,index);
   return {index,itemId:item.id,itemRevision:item.revision,domainId:item.domainId,responseScaleId:item.responseScaleId};
  });
  return {schemaVersion:'public-packet-1',pilotId:policy.administrationId,packetId:packetId??policy.administrationId+'-'+seed,seed,
   bankVersion:bank.bankVersion,sourceInstrumentVersion:policy.instrumentVersion,size,selectionMethod:policy.algorithm,
   formPolicyVersion:policy.policyVersion,evidenceModelVersion:policy.modelVersion,
   ...(route?{routeId:route.id,routeVersion:route.routeVersion,adaptivePolicyVersion:policy.adaptivePolicyVersion}:{}),
   plannedFacets:route?.assessableFacetIds??policy.frozenPlannedFacets,entries};
 }
 const excluded=new Set(policy.excludedItemIds),selected=new Set(),chosen=new Set(),planned=[];
 const groups=new Map(policy.bundles.map(b=>[b.id,b]));
 function closure(ids){
  const pending=new Set(),visiting=new Set();
  function visit(id){
   if(selected.has(id)||pending.has(id))return;
   need(!visiting.has(id),'Cyclic prerequisites.');need(!excluded.has(id),'Excluded item in prerequisite closure.');
   const item=byId.get(id);need(item,'Missing item '+id);visiting.add(id);
   if(item.eligibility?.mode==='conditional')for(const c of item.eligibility.all)visit(c.itemId);
   visiting.delete(id);pending.add(id);
  }
  for(const id of ids)visit(id);return pending;
 }
 function addBundle(b){
  if(chosen.has(b.id))return true;
  const pending=closure(b.itemIds);
  if(selected.size+pending.size>size)return false;
  for(const id of pending)selected.add(id);
  chosen.add(b.id);return true;
 }
 // Content requirements precede random tie-breaking. A facet can never silently disappear.
 for(const facet of policy.facets){
  const candidates=shuffleWithSeed(facet.bundleIds,seed+':facet:'+facet.id);
  let n=0;
  for(const id of candidates){if(n===facet.minimumBundles)break;if(addBundle(groups.get(id))){planned.push({facetId:facet.id,bundleId:id});n++;}}
  need(n===facet.minimumBundles,'Route cannot fit required facet '+facet.id);
 }
 // Format coverage is an engineering requirement, not evidence of construct validity.
 for(const scaleId of policy.responseScaleIds){
  if([...selected].some(id=>byId.get(id).responseScaleId===scaleId))continue;
  const candidates=shuffleWithSeed(bank.items.filter(i=>i.responseScaleId===scaleId&&!excluded.has(i.id)),seed+':format:'+scaleId);
  let found=false;
  for(const i of candidates){const pending=closure([i.id]);if(selected.size+pending.size>size)continue;for(const id of pending)selected.add(id);found=true;break;}
  need(found,'Route cannot include response format '+scaleId);
 }
 // Add further complete bundles evenly across topic panels before single-item enrichment.
 const queues=new Map(policy.domains.map(id=>[id,shuffleWithSeed(policy.bundles.filter(b=>b.domainId===id&&!chosen.has(b.id)),seed+':extra:'+id)]));
 let progress=true;
 while(selected.size<size&&progress){
  progress=false;
  for(const id of shuffleWithSeed(policy.domains,seed+':domain-cycle')){
   const q=queues.get(id);
   while(q.length){const b=q.shift();if(addBundle(b)){progress=true;break;}}
  }
 }
 // Any final unfilled slot adds breadth without fabricating another complete pattern.
 const filling=shuffleWithSeed(bank.items.filter(i=>!excluded.has(i.id)),seed+':fill');
 for(const item of filling){
  if(selected.size===size)break;
  const pending=closure([item.id]);if(selected.size+pending.size>size)continue;
  for(const id of pending)selected.add(id);
 }
 need(selected.size===size,'Could not fill exact route size.');
 const ordered=orderSelectedItems({items:[...selected].map(id=>byId.get(id)),seed:seed+':'+policy.policyVersion,maxSameDomainConsecutive:2,separateRelatedGroups:true});
 return {schemaVersion:'public-packet-1',pilotId:policy.administrationId,
 packetId:packetId??policy.administrationId+'-'+seed,seed,bankVersion:bank.bankVersion,
 sourceInstrumentVersion:policy.instrumentVersion,size,selectionMethod:policy.algorithm,
 formPolicyVersion:policy.policyVersion,evidenceModelVersion:policy.modelVersion,
 plannedFacets:planned,entries:ordered.map((id,index)=>{const i=byId.get(id);return {index,itemId:id,itemRevision:i.revision,domainId:i.domainId,responseScaleId:i.responseScaleId};})};
}

export function auditPhilosophyPacket(packet,policy){
 const ids=new Set(packet.entries.map(e=>e.itemId));
 const facets=policy.facets.map(f=>({id:f.id,title:f.title,domainId:f.domainId,minimumBundles:f.minimumBundles,
 completeBundles:f.bundleIds.filter(id=>policy.bundles.find(b=>b.id===id).itemIds.every(itemId=>ids.has(itemId)))}));
 return {policyVersion:policy.policyVersion,facets,allRequired:facets.every(f=>f.completeBundles.length>=f.minimumBundles),
 scope:'Planned opportunity for evidence, not actual certainty, completeness or validated short-form performance.'};
}
