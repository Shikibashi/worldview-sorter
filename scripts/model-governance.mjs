import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {affinityLegacyScopeDependencies,analyzeImpact,buildDependencyGraph,claimLevelProvenance,explicitPropositionCoverage,releaseNotes,routeEvidenceOpportunities,semanticDiff,sourceQuality,traceBasis,validateProposal} from '../packages/governance/index.js';
import {captureRelease,currentFromManifest,loadSnapshot,readJson,validateContentIntegrity,verifyRelease} from '../packages/governance/release.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const [command,...args]=process.argv.slice(2),flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const current=await readJson(root,'data/current.json');
const snapshot=await loadSnapshot(root,current);
const graph=buildDependencyGraph(snapshot);
const fromRef=async reference=>reference==='current'?snapshot:loadSnapshot(root,currentFromManifest(await readJson(root,reference)));
const emit=value=>console.log(JSON.stringify(value,null,2));
if(command==='verify'){
 const manifest=await readJson(root,current.modelRelease.path);
 await verifyRelease(root,current,manifest);
 emit({releaseVersion:manifest.releaseVersion,integrity:validateContentIntegrity(snapshot)});
}else if(command==='impact'){
 const type=flag('--type'),id=flag('--id');if(!type||!id)throw Error('Usage: model-governance impact --type TYPE --id ID');
 emit(analyzeImpact(graph,type,id));
}else if(command==='trace'){
 const type=flag('--type'),id=flag('--id');if(!type||!id)throw Error('Usage: model-governance trace --type TYPE --id ID');
 emit(traceBasis(graph,type,id));
}else if(command==='diff'||command==='notes'){
 const from=flag('--from'),to=flag('--to')??'current';if(!from)throw Error('Usage: model-governance diff|notes --from MANIFEST --to MANIFEST|current');
 const changes=semanticDiff(await fromRef(from),await fromRef(to));
 const releaseRef=async reference=>reference==='current'?captureRelease(root,current,current.modelRelease.version):readJson(root,reference);
 const [beforeRelease,afterRelease]=await Promise.all([releaseRef(from),releaseRef(to)]);
 const oldEngine=beforeRelease.components.find(c=>c.key==='engine_source');
 const newEngine=afterRelease.components.find(c=>c.key==='engine_source');
 if(newEngine&&(!oldEngine||oldEngine.sha256!==newEngine.sha256))changes.push({
  objectType:'result_semantics',id:'engine-source',component:'engine_source',
  kind:oldEngine?'modified':'added',changedFields:['engine_source'],risk:'meaning_sensitive'});
 if(command==='diff')emit({changes});
 else {const notes=releaseNotes(changes);for(const [section,rows] of Object.entries(notes)){
   console.log('## '+section.replace(/[A-Z]/g,letter=>' '+letter.toLowerCase())+'\n');
   console.log(rows.length?rows.map(row=>'- '+row).join('\n'):'- None identified');console.log();}}
}else if(command==='report'){
 const {model,affinity,localization}=snapshot,
  allSources=[...snapshot.sources.sources,...snapshot.sourceLedger.sources,...model.sources,...affinity.sources];
 const sourceMap=new Map(allSources.map(s=>[s.id,s]));
 const limitedSourceClasses=new Set(['provisional_project_source','needs_source_type_review',
  'article_source_type_unverified','context_limited_empirical_research']);
 const weakSources=[...sourceMap.values()].filter(s=>limitedSourceClasses.has(sourceQuality(s)))
  .map(s=>({sourceId:s.id,sourceClass:sourceQuality(s),dependentCount:analyzeImpact(graph,'source',s.id).affected.length}));
 const publicRulesWithSoleLimitedSource=model.commitments.filter(rule=>model.publicRuleIds.includes(rule.id)&&
  rule.sourceIds.length>0&&rule.sourceIds.every(id=>limitedSourceClasses.has(sourceQuality(sourceMap.get(id)??{}))))
  .map(rule=>({ruleId:rule.id,sourceIds:rule.sourceIds,
   sourceClasses:rule.sourceIds.map(id=>sourceQuality(sourceMap.get(id)??{})),
   reviewNeeded:'Review whether these sources support the exact proposition and answer mapping; no automatic rule deletion.'}));
 const claimProvenance=claimLevelProvenance(model);
 const staleLocalizations=localization.bundles.filter(b=>!b.canonical).map(b=>({locale:b.locale,status:b.status,
  activeRouteItemsWithoutApprovedText:snapshot.routes.routes.at(-1).itemRefs.filter(ref=>
   !b.itemRealizations.some(r=>r.itemId===ref.itemId&&r.itemRevision===ref.itemRevision&&r.status==='approved')).length}));
 const unmeasuredAffinityCriteria=affinity.traditions.map(t=>({traditionId:t.id,unmeasured:t.commitments.filter(c=>
  ['unmeasured','not_measured','partial'].includes(c.mapping?.status)).map(c=>c.id)})).filter(x=>x.unmeasured.length);
 const proposalFiles=(await readdir(path.join(root,'data/governance/proposals')).catch(error=>{
  if(error.code==='ENOENT')return [];throw error;})).filter(x=>x.endsWith('.json'));
 const proposals=await Promise.all(proposalFiles.map(x=>readJson(root,'data/governance/proposals/'+x)));
 proposals.forEach(validateProposal);
 emit({releaseVersion:current.modelRelease.version,unreviewedProposals:proposals.filter(p=>!['approved','released'].includes(p.status)).map(p=>p.proposalId),
  weakSourceProvenance:weakSources,publicRulesWithSoleLimitedSource,claimLevelProvenance:claimProvenance,
  explicitPropositionCoverage:explicitPropositionCoverage(model),
  affinityLegacyScopeDependencies:affinityLegacyScopeDependencies({model,catalog:affinity}),
  routeEvidenceOpportunities:routeEvidenceOpportunities({model,routes:snapshot.routes,catalog:affinity}),
  activeItemsWithStaleTranslations:staleLocalizations,
  affinityUnmeasuredCriteria:unmeasuredAffinityCriteria,
  ruleFixtureIndex:'Existing regressions run; individual rule-to-fixture mapping is not yet recorded. A new rule proposal must name its positive, negative, mixed, missing, and false-positive fixtures.',
  integrity:validateContentIntegrity(snapshot)});
}else throw Error('Usage: node scripts/model-governance.mjs verify|impact|trace|diff|notes|report');
