// Publish three source-reviewed direct evidence paths. Historical releases stay immutable.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const write=async(file,value)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});
 await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const replace=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');

const old={bank:'data/items/candidate-v0.19.json',registry:'data/registries/constructs-v0.8.json',
 sources:'data/sources-v1.12.json',ledger:'data/generic/source-ledger-v0.20.json',
 model:'data/generic/model-v1.16-pilot.json',full:'data/philosophy/public-pilot-v1.16.json',
 depth:'data/experience/progressive-depth-v2.7.json',pilot:'data/pilots/pilot-candidate-v1.16.json',
 review:'data/pilots/content-review-v1.10.json',catalog:'data/affinities/catalog-v2.7.json',
 localization:'data/localization/catalog-v18.json',experience:'data/experience/policy-v1.23.json',
 channels:'data/releases/channels-v20.json',research:'data/instruments/research-pool-0.19.json',
 instrument:'data/instruments/worldview-pilot-v1.10.json',runtime:'data/pilots/pilot-0.12.json',
 academic:'data/academic/release-v0.19.json',reference:'data/reference/reference-profiles-v1.1.0.json',
 readiness:'data/reference/readiness-audit-v1.json'};
const next={bank:'data/items/candidate-v0.20.json',registry:'data/registries/constructs-v0.9.json',
 sources:'data/sources-v1.13.json',ledger:'data/generic/source-ledger-v0.21.json',
 model:'data/generic/model-v1.17-pilot.json',full:'data/philosophy/public-pilot-v1.17.json',
 depth:'data/experience/progressive-depth-v2.8.json',pilot:'data/pilots/pilot-candidate-v1.17.json',
 review:'data/pilots/content-review-v1.11.json',catalog:'data/affinities/catalog-v2.8.json',
 localization:'data/localization/catalog-v19.json',experience:'data/experience/policy-v1.24.json',
 channels:'data/releases/channels-v21.json',research:'data/instruments/research-pool-0.20.json',
 instrument:'data/instruments/worldview-pilot-v1.11.json',runtime:'data/pilots/pilot-0.13.json',
 academic:'data/academic/release-v0.20.json',reference:'data/reference/reference-profiles-v1.2.0.json',
 readiness:'data/reference/readiness-audit-v2.json'};
const depthManifest='data/experience/progressive-depth-v2.8.manifest.json';
const affinityManifest='data/affinities/manifest-v2.8.json';
const localizationManifest='data/localization/manifest-v2.8.json';
const localizationBundle='data/localization/en-US-v19.json';
const referenceManifest='data/reference/manifest-v1.2.0.json';
const referenceReport='docs/reference-profiles-v1.2.0.md';
const readinessPointer='data/reference/readiness-current.json';
const readinessReport='data/reference/readiness-report-v2.json';
const successors=[...Object.values(next),depthManifest,affinityManifest,localizationManifest,localizationBundle];
const current=await read('data/current.json');
if(current.candidateBank?.path===next.bank){
 for(const file of successors)await access(path.join(root,file));
 console.log('Evidence-gap successor already exists and active pointers resolve.');
 process.exit(0);
}
assert.equal(current.modelRelease.version,'model-release-1.19.0');
for(const file of successors){try{await access(path.join(root,file));throw Error('Successor exists: '+file);}
 catch(error){if(error.code!=='ENOENT')throw error;}}

const millProposition='General happiness is the ultimate moral standard: moral rules, duties, and judgments are ultimately justified or resolved by their relation to the general happiness, without requiring that standard to be applied directly to each individual act.';
const epProposition='Human inquiry can sometimes reach objectively correct answers to factual questions even when those answers remain fallible and open to revision.';
const ahProposition='Human beings sometimes act with genuine free will, without committing to a particular account of how free will is possible or whether determinism is compatible with it.';
const millRuleId='reviewed-NE26-general-happiness-ultimate-standard';
const epRuleId='reviewed-EP03-fallible-truth-attainability';
const ahRuleId='reviewed-AH01-some-human-free-will';

const millSources=[
 {id:'primary-mill-utilitarianism-ch2',kind:'primary_source',title:'John Stuart Mill, Utilitarianism, Chapter II',
  url:'https://www.gutenberg.org/files/11224/11224-h/11224-h.htm',
  use:'Chapter II: Greatest Happiness Principle, secondary principles, conflicts of obligation, and the ultimate standard.',
  evidenceType:'primary_text',access:'text_reviewed',reviewedOn:'2026-10-03',
  reuse:'Doctrinal source only; no questionnaire wording copied and no item validity inferred.'},
 {id:'sep-mill-moral-political',kind:'academic',title:"Stanford Encyclopedia of Philosophy: Mill's Moral and Political Philosophy",
  url:'https://plato.stanford.edu/entries/mill-moral-political/',
  use:'Sections 2.6–2.10 on the utilitarian first principle, decision procedure, secondary principles, and competing reconstructions.',
  evidenceType:'signed_scholarly_synthesis',access:'text_reviewed',reviewedOn:'2026-10-03',
  reuse:'Interpretive boundary only; no questionnaire wording copied and no item validity inferred.'},
 {id:'sep-utilitarianism-history',kind:'academic',title:'Stanford Encyclopedia of Philosophy: The History of Utilitarianism',
  url:'https://plato.stanford.edu/entries/utilitarianism-history/',
  use:'Mill section and act/rule interpretive history.',
  evidenceType:'signed_scholarly_synthesis',access:'text_reviewed',reviewedOn:'2026-10-03',
  reuse:'Historical context only; no questionnaire wording copied and no item validity inferred.'}
];
const millClaims=[
 {sourceId:'primary-mill-utilitarianism-ch2',relationship:'supports',
  claim:'Mill presents utility or the Greatest Happiness Principle as the foundation and ultimate standard of morality while allowing secondary principles.'},
 {sourceId:'sep-mill-moral-political',relationship:'supports',
  claim:'The scholarly account distinguishes Mill\'s utilitarian first principle from decision procedure and records competing direct, rule, and sanction reconstructions.'},
 {sourceId:'sep-utilitarianism-history',relationship:'context',
  claim:'Mill is a classical utilitarian, while the immediate act-versus-rule structure of his theory remains interpretively contested.'}
];

const draft=await read('data/items/unmapped-draft-v1.json');
const draftEpi=draft.items.find(row=>row.id==='EPI118'&&row.revision===1);
const draftAhi=draft.items.find(row=>row.id==='AHI106'&&row.revision===1);
assert.ok(draftEpi&&draftAhi);
const bank=await read(old.bank);assert.equal(bank.bankVersion,'0.19.0');assert.equal(bank.items.length,575);
for(const id of ['EPI118','AHI106','NEI134','NEI135'])assert.ok(!bank.items.some(row=>row.id===id));
const epi=structuredClone(draftEpi);
epi.provenance={...epi.provenance,sourceRefs:['acad-epistemology','iep-fallibilism']};
epi.notes='Promoted from the unreleased audit draft as the fallibilist discriminator for EP03. It separates possible objective knowledge from certainty and practical success; case_dependent is nondirectional.';
const ahi=structuredClone(draftAhi);
ahi.provenance={...ahi.provenance,sourceRefs:['free-will-inventory','gen-agency','audit2-freewill-sep']};
ahi.notes='Promoted from the unreleased audit draft as the existence discriminator for AH01. Only some_free_will directly supports existence; conditional_free_will and undecided are nondirectional.';
const nei134={id:'NEI134',revision:1,domainId:'NE',
 text:'When moral rules or duties conflict and no more specific principle settles the case, which standard should have final authority?',
 responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'contrast',
 targets:[{constructId:'NE26',relation:'diagnostic',role:'primary'}],
 options:[
  {id:'general_happiness',label:'The general happiness of everyone affected, whether applied directly or through rules justified by their effects on happiness.'},
  {id:'independent_authority',label:'A right or duty can have final authority independently of its effects on general happiness.'},
  {id:'plural_ultimate',label:'Several moral values can be ultimate, so no single standard always decides the conflict.'},
  {id:'other',label:'Another view or a view not listed.'}
 ],mirrorGroup:null,scenarioGroup:'general-happiness-ultimate-standard',eligibility:{mode:'always'},
 specialStates:['no_view','not_understood'],contentTags:['mill_general_happiness','ultimate_standard'],
 provenance:{origin:'original_project_research_design',sourceRefs:millSources.map(x=>x.id),license:{status:'undecided',spdx:null},copiedText:false},
 notes:'Interpretation-neutral first-principle discriminator. Does not select act, rule, sanction, total-welfare, or hedonist utilitarianism.'};
const nei135={id:'NEI135',revision:1,domainId:'NE',
 text:'A familiar moral rule is normally useful and deeply established. Suppose careful long-run evidence shows that revising the rule would better promote the general happiness, while the dispute is specifically about whether the old rule has moral authority independent of that happiness. Which view is closest to yours?',
 responseType:'single_choice',responseScaleId:'single_choice',status:'candidate',contentKind:'vignette',
 targets:[{constructId:'NE26',relation:'diagnostic',role:'primary'}],
 options:[
  {id:'happiness_controls',label:'General happiness ultimately controls which rule is justified, even if stable rules usually guide conduct without fresh calculation.'},
  {id:'independent_rule_authority',label:'The old rule can remain morally authoritative for a reason that does not ultimately depend on general happiness.'},
  {id:'plural_balance',label:'General happiness and independent moral considerations are both fundamental; neither has final authority in every such conflict.'},
  {id:'other',label:'Another view or a view not listed.'}
 ],mirrorGroup:null,scenarioGroup:'secondary-principle-ultimate-ground',eligibility:{mode:'always'},
 specialStates:['no_view','not_understood'],contentTags:['mill_general_happiness','secondary_principles'],
 provenance:{origin:'original_project_research_design',sourceRefs:millSources.map(x=>x.id),license:{status:'undecided',spdx:null},copiedText:false},
 notes:'Tests whether secondary rules ultimately derive authority from general happiness while remaining neutral on the immediate act-versus-rule criterion.'};
bank.bankVersion='0.20.0';bank.items.push(epi,ahi,nei134,nei135);await write(next.bank,bank);

const registry=await read(old.registry);assert.equal(registry.registryVersion,'0.8.0');registry.registryVersion='0.9.0';
const epConstruct=registry.constructs.find(row=>row.id==='EP03'),ahConstruct=registry.constructs.find(row=>row.id==='AH01');
assert.ok(epConstruct&&ahConstruct&&!registry.constructs.some(row=>row.id==='NE26'));
epConstruct.description='Whether human inquiry can sometimes reach objectively correct factual answers while remaining fallible and revisable.';
epConstruct.evidenceBasis=['acad-epistemology','iep-fallibilism'];
ahConstruct.description='Whether human beings sometimes act with genuine free will, independently of which compatibility or metaphysical theory explains it.';
ahConstruct.evidenceBasis=['free-will-inventory','gen-agency','audit2-freewill-sep'];
registry.constructs.push({id:'NE26',domainId:'NE',name:'General happiness as ultimate moral standard',type:'categorical',tier:'diagnostic',
 description:'Whether general happiness has final justificatory authority when moral rules, duties, or judgments conflict, without selecting an act-versus-rule implementation.',
 candidateItemTarget:2,outputMode:'branch_classification',evidenceBasis:millSources.map(x=>x.id),prerequisites:[],measurementStatus:'provisional',directlyScored:true});
await write(next.registry,registry);

const sources=await read(old.sources);
for(const source of millSources)assert.ok(!sources.sources.some(row=>row.id===source.id));
sources.sources.push(...millSources);await write(next.sources,sources);

const ledger=await read(old.ledger);ledger.version='0.21.0';
const extendLedger=(id,ruleId,constructId,itemIds)=>{
 const source=ledger.sources.find(row=>row.id===id);assert.ok(source,'Missing source '+id);
 source.useByRules=[...new Set([...(source.useByRules??[]),ruleId])];
 source.useByConstructs=[...new Set([...(source.useByConstructs??[]),constructId])];
 source.useByItems=[...new Set([...(source.useByItems??[]),...itemIds])];
 source.permissionToCopyItems=false;source.validatesOurItems=false;
};
for(const id of ['acad-epistemology','iep-fallibilism'])extendLedger(id,epRuleId,'EP03',['EPI010','EPI118']);
for(const id of ['free-will-inventory','gen-agency','audit2-freewill-sep'])extendLedger(id,ahRuleId,'AH01',['AHI001','AHI106']);
for(const source of millSources)ledger.sources.push({...source,useByRules:[millRuleId],useByConstructs:['NE26'],useByItems:['NEI134','NEI135'],
 permissionToCopyItems:false,validatesOurItems:false,sourceRole:source.evidenceType==='primary_text'?'primary_text':'signed_scholarly_synthesis',
 detailedUseLimit:'Supports the stated philosophical distinction only; it does not validate item wording, thresholds, route placement, comprehension, or psychometrics.'});
await write(next.ledger,ledger);

const model=await read(old.model);model.parentModelVersion=model.modelVersion;model.modelVersion='generic-1.17.0-pilot';
model.bankVersion=bank.bankVersion;model.registryVersion=registry.registryVersion;model.pilotInstrumentVersion='worldview-pilot-1.11.0';
model.sources.push(...millSources);
const directBase={minimumEvidenceUnits:2,mappingStatus:'source_reviewed_authored_rule_not_calibrated',
 thresholdStatus:'authored_duplicate_control_not_psychometric',interpretationKind:'direct_interpretable_proposition',
 inferenceStatus:'direct',affinityCriterion:false,researchVariable:false,
 missingEvidenceBehavior:{notPresented:'not_measured',presentedButNonDirectional:'insufficient_evidence',singleDirectionalUnit:'leaned_toward',conflictingDirectionalUnits:'mixed_context_dependent'}};
const epRule={...directBase,id:epRuleId,constructId:'EP03',label:'Fallible attainability of objective factual answers',
 facetId:'epistemic-method',domainId:'EP',layer:'epistemic',tier:'primary',
 sourceIds:['acad-epistemology','iep-fallibilism'],sourceClaims:[
  {sourceId:'acad-epistemology',relationship:'supports',claim:'Knowledge, justification, certainty, and scope are distinct epistemological questions; certainty is not silently substituted for knowledge.'},
  {sourceId:'iep-fallibilism',relationship:'supports',claim:'Fallible knowledge can remain knowledge even when a possibility of error is not conclusively eliminated.'}
 ],evidence:[
  {itemId:'EPI010',itemRevision:1,unitId:'EPI010',support:[1,2],oppose:[-2,-1]},
  {itemId:'EPI118',itemRevision:1,unitId:'EPI118',support:['fallible_knowledge'],oppose:['support_only','practical_only']}
 ],boundary:'At least some objective factual answers may be attained while remaining fallible. This does not require certainty, universal knowability, or denial that some domains remain beyond human knowledge.',
 scope:epProposition,proposition:epProposition,hypothesizedConstructId:'EP03',
 neighbors:['Infallibilism','Global skepticism','Domain-limited skepticism','Pragmatic success without objective correctness','Conventionalism'],
 nonEntailments:['Certainty','Every question is knowable','No important question is permanently unknowable','Scientific infallibility','Realism about every domain'],
 falsePositives:['EPI015 agreement that some questions may remain unknowable does not oppose this proposition.','Approximation or low confidence does not by itself deny that some objectively correct answers are attainable.','Fallibilism is not skepticism.']};
const ahRule={...directBase,id:ahRuleId,constructId:'AH01',label:'Some human action involves genuine free will',
 facetId:'agency-freedom',domainId:'AH',layer:'conceptual_agency',tier:'headline',
 sourceIds:['free-will-inventory','gen-agency','audit2-freewill-sep'],sourceClaims:[
  {sourceId:'free-will-inventory',relationship:'supports',claim:'The Free Will Inventory separates free-will belief from determinism and dualism rather than using a determinism answer as a proxy.'},
  {sourceId:'gen-agency',relationship:'supports',claim:'Compatibilist and incompatibilist analyses concern conditions for freedom and do not by themselves settle whether any actual human action is free.'},
  {sourceId:'audit2-freewill-sep',relationship:'context',claim:'The prior audit records that existence, analysis, and moral significance of free will are distinct.'}
 ],evidence:[
  {itemId:'AHI001',itemRevision:2,unitId:'AHI001',support:[1,2],oppose:[-2,-1]},
  {itemId:'AHI106',itemRevision:1,unitId:'AHI106',support:['some_free_will'],oppose:['no_free_will']}
 ],boundary:'A direct existence belief about some human free action. Conditional compatibility, belief that determinism is true, dualism, and moral responsibility are separate questions.',
 scope:ahProposition,proposition:ahProposition,hypothesizedConstructId:'AH01',
 neighbors:['Compatibilism','Incompatibilism','Libertarian agency','Hard determinism','Free-will skepticism'],
 nonEntailments:['Determinism is true','Determinism is false','Compatibilism','Incompatibilism','Libertarian agency','Dualism','Moral responsibility'],
 falsePositives:['AHI106 conditional_free_will is nondirectional because a condition may be possible without ever being satisfied.','AH14 compatibility evidence does not establish whether free will actually exists.','Belief that determinism is true or false does not substitute for AH01 evidence.']};
const millRule={...directBase,id:millRuleId,constructId:'NE26',label:'General happiness as ultimate moral standard',
 facetId:'ethics-foundations',domainId:'NE',layer:'normative',tier:'diagnostic',sourceIds:millClaims.map(x=>x.sourceId),sourceClaims:millClaims,
 evidence:[
  {itemId:'NEI134',itemRevision:1,unitId:'NEI134',support:['general_happiness'],oppose:['independent_authority','plural_ultimate']},
  {itemId:'NEI135',itemRevision:1,unitId:'NEI135',support:['happiness_controls'],oppose:['independent_rule_authority','plural_balance']}
 ],boundary:'A first-principle moral-justification claim. It does not select act utilitarianism, rule utilitarianism, sanction utilitarianism, total aggregation, hedonism, or a complete Mill identity.',
 scope:millProposition,proposition:millProposition,hypothesizedConstructId:'NE26',
 neighbors:['Act consequentialism','Rule consequentialism','Sanction or other indirect utilitarianism','Welfarist outcome-value theories','Pluralist moral theories','Rights- or duty-first theories'],
 nonEntailments:['Act-utilitarian classification','Rule-utilitarian classification','Sanction-utilitarian classification','NE25 total-welfare act maximization','Welfare as the only intrinsic outcome value','Hedonism','A complete Mill profile or utilitarian identity'],
 falsePositives:['NE22, NE23, NE24, and NE25 are neighboring propositions and never substitute for direct NE26 evidence.','Treating happiness as one important value among several does not support a single ultimate standard.','Using stable useful rules does not support NE26 unless their final authority is grounded in general happiness.']};
for(const rule of [epRule,ahRule,millRule]){assert.ok(!model.commitments.some(row=>row.id===rule.id));model.commitments.push(rule);}
model.commitments.sort((a,b)=>a.id.localeCompare(b.id));model.publicRuleIds=[...new Set([...model.publicRuleIds,epRuleId,ahRuleId,millRuleId])].sort();
model.coverage.version='0.20.0';
const epCoverage=model.coverage.constructs.find(row=>row.id==='EP03'),ahCoverage=model.coverage.constructs.find(row=>row.id==='AH01');
assert.ok(epCoverage&&ahCoverage);
Object.assign(epCoverage,{declaredSources:['acad-epistemology','iep-fallibilism'],ruleIds:[epRuleId],candidateItemIds:['EPI010','EPI118'],
 status:'scoped_direct_interpretation_available',auditDecision:'two_complementary_direct_items',
 auditRationale:'A direct attainability principle and a separate fallibilist knowledge case jointly distinguish objective attainability from certainty and practical success.',
 disposition:'directly_interpretable_scoped_proposition',coverageGap:'No universal knowability, certainty, or global realism is inferred.'});
Object.assign(ahCoverage,{declaredSources:['free-will-inventory','gen-agency','audit2-freewill-sep'],ruleIds:[ahRuleId],candidateItemIds:['AHI001','AHI106'],
 status:'scoped_direct_interpretation_available',auditDecision:'existence_belief_separated_from_compatibility',
 auditRationale:'A direct genuine-control statement and an explicit free-will existence choice jointly measure existence belief without importing determinism or compatibility theory.',
 disposition:'directly_interpretable_scoped_proposition',coverageGap:'No compatibility, determinism, dualism, or responsibility theory is inferred.'});
model.coverage.constructs.push({id:'NE26',name:'General happiness as ultimate moral standard',domainId:'NE',type:'categorical',tier:'diagnostic',
 declaredSources:millSources.map(x=>x.id),ruleIds:[millRuleId],candidateItemIds:['NEI134','NEI135'],status:'scoped_direct_interpretation_available',
 auditDecision:'two_complementary_direct_items',auditRationale:'A first-principle conflict question and a secondary-rule revision case test final justificatory authority without selecting an act-versus-rule implementation.',
 disposition:'directly_interpretable_scoped_proposition',coverageGap:'No complete utilitarian or Mill identity, act/rule reconstruction, welfare theory, or aggregation rule is inferred.'});
model.coverage.constructs.sort((a,b)=>a.id.localeCompare(b.id));

const insertAfter=(refs,anchor,itemRef)=>{const at=refs.findIndex(ref=>ref.itemId===anchor);assert.ok(at>=0,'Missing route anchor '+anchor);refs.splice(at+1,0,itemRef);};
const full=await read(old.full);full.parentPolicyVersion=full.policyVersion;full.policyVersion='philosophy-pilot-1.17.0';
full.bankVersion=bank.bankVersion;full.modelVersion=model.modelVersion;full.instrumentVersion=model.pilotInstrumentVersion;
for(const id of ['EPI010','EPI118','AHI001','AHI106','NEI134','NEI135'])assert.ok(!full.frozenItems.some(ref=>ref.itemId===id));
insertAfter(full.frozenItems,'NEI001',{itemId:'EPI010',itemRevision:1});
insertAfter(full.frozenItems,'MFI018',{itemId:'AHI001',itemRevision:2});
insertAfter(full.frozenItems,'VAI020',{itemId:'NEI134',itemRevision:1});
insertAfter(full.frozenItems,'VAI036',{itemId:'NEI135',itemRevision:1});
insertAfter(full.frozenItems,'EXI010',{itemId:'AHI106',itemRevision:1});
insertAfter(full.frozenItems,'RCI030',{itemId:'EPI118',itemRevision:1});
assert.equal(full.frozenItems.length,255);full.sizes=[255];model.pilotRouteItemRefs=structuredClone(full.frozenItems);
const ruleByItem=new Map();for(const rule of model.commitments)for(const evidence of rule.evidence??[]){
 const list=ruleByItem.get(evidence.itemId)??[];list.push(rule.id);ruleByItem.set(evidence.itemId,list);}
model.coverage.items=bank.items.map(item=>({itemId:item.id,itemRevision:item.revision,sourceIds:item.provenance?.sourceRefs??[],
 ruleIds:(ruleByItem.get(item.id)??[]).sort(),status:(ruleByItem.get(item.id)??[]).length?'explicit_mapping_only':'not_used_for_profile_inference',
 sourceValidationTransferred:false,publicFormExcluded:!full.frozenItems.some(ref=>ref.itemId===item.id&&ref.itemRevision===item.revision)}));
for(const rule of [epRule,ahRule,millRule]){
 full.bundles.push({id:rule.id+':full-route',commitmentId:rule.id,domainId:rule.domainId,
  itemIds:rule.evidence.map(x=>x.itemId),itemRevisions:rule.evidence.map(x=>x.itemRevision),evidenceUnits:rule.evidence.map(x=>x.unitId)});
 const facet=full.facets.find(row=>row.id===rule.facetId);assert.ok(facet,'Missing facet '+rule.facetId);
 facet.ruleIds=[...new Set([...facet.ruleIds,rule.id])].sort();facet.bundleIds=[...new Set([...(facet.bundleIds??[]),rule.id+':full-route'])].sort();
}
await write(next.model,model);await write(next.full,full);

const depth=await read(old.depth);depth.policyVersion='progressive-depth-2.8.0';depth.bankVersion=bank.bankVersion;
depth.modelVersion=model.modelVersion;depth.instrumentVersion=model.pilotInstrumentVersion;depth.pilotFormPolicyVersion=full.policyVersion;
depth.affinityCatalogVersion='philosophical-affinity-2.8.0';
depth.selectionBasis='Quick and Standard retain their exact 64/120 item references. Full adds six widely separated references for three two-unit evidence paths: fallible truth attainability, some human free will, and general happiness as ultimate moral standard.';
for(const route of depth.routes){route.routeVersion=route.id+'-2.8.0';if(route.id==='full'){route.itemRefs=structuredClone(full.frozenItems);route.size=255;
 route.description='255 questions; the broadest authored coverage, adding three source-reviewed two-unit evidence paths.';
 route.assessableDirectRuleIds=[...new Set([...route.assessableDirectRuleIds,epRuleId,ahRuleId,millRuleId])].sort();route.burden.items=255;route.burden.vignettes=(route.burden.vignettes??0)+1;}}
await write(next.depth,depth);await write(depthManifest,{schemaVersion:'immutable-content-manifest-1',policyVersion:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)});

const research=await read(old.research);research.instrumentVersion='0.20.0-research';research.bankVersion=bank.bankVersion;research.registryVersion=registry.registryVersion;
research.nominalPoolSize=bank.items.length;research.entries=bank.items.map((row,index)=>({index,itemId:row.id,itemRevision:row.revision}));await write(next.research,research);
const runtime=await read(old.runtime);runtime.pilotId='pilot-0.13';runtime.bankVersion=bank.bankVersion;runtime.sourceInstrumentVersion=research.instrumentVersion;
runtime.administration.note+=' The 0.20 research pool adds EPI118@1, AHI106@1, NEI134@1, and NEI135@1; the three direct evidence paths are Full-only.';
await write(next.runtime,runtime);
const instrument=await read(old.instrument);instrument.instrumentVersion=model.pilotInstrumentVersion;instrument.bankVersion=bank.bankVersion;instrument.registryVersion=registry.registryVersion;
instrument.nominalPoolSize=255;instrument.entries=full.frozenItems.map((ref,index)=>({index,...ref}));await write(next.instrument,instrument);

const review=await read(old.review);review.reviewVersion='pilot-content-review-1.11.0';review.sourceFormPolicyVersion=full.policyVersion;review.frozenAssignedItems=255;
review.repeatedWordingAndDependenceGroups.push(
 {id:'ep03-attainability-fallibilism',itemIds:['EPI010','EPI118'],note:'Distinct principle and tested-claim judgment tasks; authored complementarity only, not empirical independence.'},
 {id:'ah01-free-will-existence',itemIds:['AHI001','AHI106'],note:'Distinct control statement and explicit existence choice; compatibility answers remain outside the evidence path.'},
 {id:'ne26-general-happiness-standard',itemIds:['NEI134','NEI135'],note:'Distinct first-principle conflict and secondary-rule revision tasks; no psychometric independence claimed.'});
const additions=[
 ['EPI010',1,'EP',['EP03'],[epRuleId],'truth_attainability_principle'],
 ['EPI118',1,'EP',['EP03'],[epRuleId],'fallible_objective_knowledge_case'],
 ['AHI001',2,'AH',['AH01'],[ahRuleId],'genuine_control_statement'],
 ['AHI106',1,'AH',['AH01'],[ahRuleId],'free_will_existence_choice'],
 ['NEI134',1,'NE',['NE26'],[millRuleId],'ultimate_standard_conflict'],
 ['NEI135',1,'NE',['NE26'],[millRuleId],'secondary_principle_revision']
];
for(const [id,revision,domainId,targetConstructIds,mappedRuleIds,contribution] of additions){
 const position=full.frozenItems.findIndex(ref=>ref.itemId===id)+1;
 review.decisions.push({sourcePosition:position,itemId:id,itemRevision:revision,domainId,targetConstructIds,mappedRuleIds,nearbyRouteItemIds:[],
  responseMethod:bank.items.find(row=>row.id===id).responseType,contribution,decision:'retain_for_pilot',issue:null,
  rationale:'Adds one governed unit for a source-reviewed two-unit direct proposition; neighboring constructs and theory labels cannot substitute for this exact evidence.',
  resultUse:'only_through_explicit_interpretation_rules'});
}
await write(next.review,review);

const catalog=await read(old.catalog);catalog.catalogVersion='philosophical-affinity-2.8.0';catalog.modelVersion=model.modelVersion;catalog.instrumentVersion=model.pilotInstrumentVersion;
await write(next.catalog,catalog);await write(affinityManifest,{manifestVersion:'philosophical-affinity-manifest-1.0.0',catalogVersion:catalog.catalogVersion,
 path:next.catalog,sha256:await hash(next.catalog),modelVersion:catalog.modelVersion,instrumentVersion:catalog.instrumentVersion,affinitySemanticsVersion:catalog.affinitySemanticsVersion});

const localization=await read(old.localization);localization.catalogVersion='localization-catalog-2.8.0';localization.canonicalBankVersion=bank.bankVersion;
localization.modelVersion=model.modelVersion;localization.affinityCatalogVersion=catalog.catalogVersion;localization.locales=localization.locales.filter(row=>row.locale==='en-US');
assert.equal(localization.locales.length,1);localization.note='English (en-US) is the sole supported respondent-facing language in this release.';
const enBundle=await read(localization.locales[0].path);enBundle.bundleVersion='localization-en-US-2.8.0';enBundle.bankVersion=bank.bankVersion;
enBundle.modelVersion=model.modelVersion;enBundle.affinityCatalogVersion=catalog.catalogVersion;localization.locales[0]={...localization.locales[0],bundleVersion:enBundle.bundleVersion,path:localizationBundle};
await write(localizationBundle,enBundle);await write(next.localization,localization);
await write(localizationManifest,{schemaVersion:'worldview-localization-manifest-1',catalogVersion:localization.catalogVersion,
 hashes:{[next.localization]:await hash(next.localization),[localizationBundle]:await hash(localizationBundle)}});

const pilot=await read(old.pilot);pilot.pilotCandidateVersion='pilot-candidate-1.17.0';pilot.itemBank={version:bank.bankVersion,path:next.bank};pilot.constructRegistry={version:registry.registryVersion,path:next.registry};
pilot.route.version=full.policyVersion;pilot.route.path=next.full;pilot.route.instrumentVersion=model.pilotInstrumentVersion;pilot.route.instrumentManifestPath=next.instrument;
pilot.route.assignedItems=255;pilot.route.exactItemRevisions=structuredClone(full.frozenItems);pilot.route.domainCounts.EP+=2;pilot.route.domainCounts.AH+=2;pilot.route.domainCounts.NE+=2;
pilot.interpretationRules.version=model.modelVersion;pilot.interpretationRules.path=next.model;
pilot.interpretationRules.directRuleIds=[...new Set([...pilot.interpretationRules.directRuleIds,epRuleId,ahRuleId,millRuleId])].sort();
pilot.interpretationRules.routeMeasuredDirectRuleIds=[...new Set([...pilot.interpretationRules.routeMeasuredDirectRuleIds,epRuleId,ahRuleId,millRuleId])].sort();
pilot.contentReview={version:review.reviewVersion,path:next.review};
pilot.frozenArtifactHashes={[next.review]:await hash(next.review),[next.instrument]:await hash(next.instrument),[next.model]:await hash(next.model),[next.full]:await hash(next.full)};
pilot.sourceHashes={[next.bank]:await hash(next.bank),[next.registry]:await hash(next.registry),[next.sources]:await hash(next.sources)};
pilot.limitations.push('EP03, AH01, and NE26 are source-reviewed authored propositions with two evidence units each; none is psychometrically validated, and no neighboring worldview identity is inferred.');
await write(next.pilot,pilot);

const academic=await read(old.academic);academic.version='0.20.0';academic.registryVersion=registry.registryVersion;academic.baseBankVersion=bank.bankVersion;academic.reviewedOn='2026-10-03';
academic.itemCount=bank.items.length;academic.newItemCount=4;academic.registryEntries=registry.constructs.length;academic.activeConstructCount=registry.constructs.filter(row=>row.measurementStatus!=='deprecated').length;
academic.newConstructCount=1;academic.academicSourceCount+=3;
academic.note='Adds four original source-informed items and three scoped direct propositions: fallible truth attainability, some human free will, and general happiness as ultimate moral standard. Existing EPI010@1 and AHI001@2 join the new Full-only evidence paths. No psychometric validity or complete worldview identity is inferred.';
academic.frozenSourceHashes={[old.bank]:await hash(old.bank),[old.registry]:await hash(old.registry)};await write(next.academic,academic);

const experience=await read(old.experience);experience.experienceVersion='quiz-1.24.0';const fullRoute=experience.routes.find(row=>row.id==='full');fullRoute.size=255;
fullRoute.description='255 questions, including three new source-reviewed two-unit evidence paths.';
for(const route of experience.routes)route.formPolicyVersion=route.id==='full'?full.policyVersion:depth.policyVersion;
experience.formPolicies.push({version:full.policyVersion,path:next.full},{version:depth.policyVersion,path:next.depth});experience.modelPolicies.push({version:model.modelVersion,path:next.model});
experience.pilotCandidate={version:pilot.pilotCandidateVersion,path:next.pilot};experience.progressivePolicy={version:depth.policyVersion,path:next.depth,manifestPath:depthManifest};
experience.localizationCatalogVersion=localization.catalogVersion;experience.localizationCatalogPath=next.localization;
experience.routeLengthMeaning='Quick and Standard preserve their exact 64/120 references. Full adds six widely separated references for three new two-unit direct propositions, reaching 255 questions. This is authored coverage, not calibrated information.';
await write(next.experience,experience);

const channels=await read(old.channels);channels.configVersion='worldview-release-channels-21.0.0';for(const channel of Object.values(channels.channels))channel.modelReleaseVersion='model-release-1.20.0';
await write(next.channels,channels);

const ref=await read(old.reference);ref.catalogVersion='reference-profile-catalog-1.2.0';ref.profileModelVersion='reference-profile-model-1.2.0';ref.sourceLedgerVersion='reference-profile-sources-1.2.0';
ref.modelVersion=model.modelVersion;ref.routePolicyVersion=depth.policyVersion;
for(const profile of ref.profiles){profile.schemaVersion='1.2.0';profile.modelVersion=model.modelVersion;profile.routePolicyVersion=depth.policyVersion;}
ref.sources.push({id:'primary-mill-utilitarianism-ch2',sourceType:'primary_text',authors:['John Stuart Mill'],title:'Utilitarianism, Chapter II',year:1861,
 url:'https://www.gutenberg.org/files/11224/11224-h/11224-h.htm',accessNote:'Primary text used only for the stated greatest-happiness first-principle claim; WVS wording remains independently authored.'});
ref.profiles.push({schemaVersion:'1.2.0',profileVersion:'reference-profile-1.0.0',modelVersion:model.modelVersion,routePolicyVersion:depth.policyVersion,
 id:'john-stuart-mill-general-happiness-scoped',label:'John Stuart Mill — general happiness as ultimate moral standard (scoped)',entityType:'philosopher',origin:'independent_authoring',
 coverageStatus:'partial',publicationStatus:'internal_only',
 scope:'One selected commitment: general happiness as the ultimate moral standard. This remains neutral among disputed act, rule, sanction, and other indirect reconstructions of Mill.',
 identityOutputAllowed:false,percentageMatchAllowed:false,
 neighbors:['Act utilitarianism','Rule utilitarianism','Sanction utilitarianism','Pluralist moral theories'],
 nonEntailments:['A settled act-utilitarian classification','A settled rule-utilitarian classification','NE25 total-welfare act maximization','Simple quantitative hedonism','Mill\'s complete ethical or political philosophy'],
 unmeasuredAreas:['The immediate criterion of duty','Higher and lower pleasures','Justice, rights, liberty, political economy, and the rest of Mill\'s system'],
 claims:[{id:'general-happiness-ultimate-standard',propositionId:millRuleId,targetKind:'proposition',targetText:millProposition,expectedState:'supported',importance:'core',
  evidenceBasis:'primary_text',mappingStatus:'ROUTE_LIMITED',routeAvailability:['full'],publicUse:'comparison',
  sourceClaims:[
   {sourceId:'primary-mill-utilitarianism-ch2',relationship:'supports_profile_claim',locator:'Chapter II, opening statement of the Greatest Happiness Principle and later discussion of secondary principles and an ultimate standard.',claim:'Mill presents utility/general happiness as the foundation and ultimate standard of morality while allowing subordinate principles.'},
   {sourceId:'sep-mill-moral-political',relationship:'supports_profile_claim',locator:'Sections 2.6–2.10.',claim:'The scholarly reconstruction distinguishes the first principle from decision procedure and records competing direct, rule, and sanction interpretations.'}
  ],neighbors:['Act consequentialism','Rule consequentialism','Indirect utilitarianism','Pluralist ethics'],
  nonEntailments:['Act utilitarianism','Rule utilitarianism','NE25 total-welfare maximization','A complete Mill identity'],
  limitations:['Only NE26 is mapped. NE22–NE25 remain neighboring propositions and are not required Mill commitments.']}],
 limitations:['This is a one-criterion internal comparison, not a complete Mill profile.','Only Full can assess NE26; omission on shorter routes remains not measured.']});
await write(next.reference,ref);
await replace('data/reference/catalog-index.json',{schemaVersion:'1.0.0',currentCatalogVersion:ref.catalogVersion,catalogPath:next.reference,manifestPath:referenceManifest,reportPath:referenceReport});

const readiness=await read(old.readiness);readiness.auditVersion='reference-readiness-audit-2.0.0';
readiness.baseline.candidateBank={version:bank.bankVersion,path:next.bank,sha256:await hash(next.bank)};
readiness.baseline.worldviewModel={version:model.modelVersion,path:next.model,sha256:await hash(next.model)};
readiness.baseline.sourceLedger={version:ledger.version,path:next.ledger,sha256:await hash(next.ledger)};
readiness.baseline.affinityCatalog={version:catalog.catalogVersion,path:next.catalog,sha256:await hash(next.catalog)};
readiness.baseline.progressiveRoutes={version:depth.policyVersion,path:next.depth,sha256:await hash(next.depth)};
const millCandidate=readiness.candidates.find(row=>row.id==='philosopher-mill-scoped');assert.ok(millCandidate);
const millCore=millCandidate.claims.find(row=>row.id==='mill-greatest-happiness-principle');assert.ok(millCore);
millCore.mappingAssessment='exact';millCore.propositionId=millRuleId;millCore.limitations=['NE26 measures only the interpretation-neutral first-principle claim and does not settle the immediate act-versus-rule criterion.'];
millCandidate.limitations=['Mill\'s account is interpreted in multiple ways; this audit maps only the general-happiness first principle exactly.','The exact NE26 evidence path appears on Full only; the disputed act-consequence reconstruction remains partial context rather than a required profile claim.'];
await write(next.readiness,readiness);
await replace(readinessPointer,{schemaVersion:'reference-readiness-index-1',auditVersion:readiness.auditVersion,specPath:next.readiness,reportPath:readinessReport,markdownPath:'docs/REFERENCE_READINESS_REPORT.md'});

const updated=await read('data/current.json');
const refs={candidateBank:[bank.bankVersion,next.bank],registry:[registry.registryVersion,next.registry],sourceRegistry:['source-registry-1.13.0',next.sources],
 worldviewSourceLedger:[ledger.version,next.ledger],worldviewModel:[model.modelVersion,next.model],fullForm:[full.policyVersion,next.full],
 progressiveDepth:[depth.policyVersion,next.depth],pilotCandidate:[pilot.pilotCandidateVersion,next.pilot],contentReview:[review.reviewVersion,next.review],
 affinityCatalog:[catalog.catalogVersion,next.catalog],localizationCatalog:[localization.catalogVersion,next.localization],quizExperience:[experience.experienceVersion,next.experience],
 releaseChannels:[channels.configVersion,next.channels],instrument:[research.instrumentVersion,next.research],pilot:[runtime.pilotId,next.runtime],academicRelease:[academic.version,next.academic]};
for(const [key,[version,file]] of Object.entries(refs))updated[key]={...updated[key],version,path:file,sha256:await hash(file)};
updated.registryVersion=registry.registryVersion;updated.progressiveDepth.manifestPath=depthManifest;updated.affinityCatalog.manifestPath=affinityManifest;
updated.localizationCatalog.manifestPath=localizationManifest;updated.localizationBundles=[{locale:'en-US',version:enBundle.bundleVersion,path:localizationBundle}];
updated.pilotEvidenceAudit={version:'pilot-evidence-dispositions-1.17.0',path:'data/reviews/pilot-evidence-dispositions-v18.json'};
updated.quizExperience.entrypoint='apps/quiz/index.html';
await replace('data/current.json',updated);
await replace('data/experience/current.json',{schemaVersion:'worldview-experience-index-1',current:{version:experience.experienceVersion,path:next.experience,entrypoint:'apps/quiz/index.html'}});
await replace('data/releases/channels-current.json',{schemaVersion:'worldview-release-channel-index-1',current:{version:channels.configVersion,path:next.channels}});
console.log('Prepared evidence-gap release: bank 0.20, model 1.17, Full 255; Quick/Standard unchanged.');
