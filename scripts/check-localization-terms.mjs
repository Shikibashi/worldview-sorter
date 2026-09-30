import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [catalog,glossary]=await Promise.all([read('data/localization/catalog-v1.json'),read('data/localization/terminology-review-v1.json')]);
const known=new Set(glossary.terms.map(term=>term.id)),flags=[];
for(const registration of catalog.locales){const bundle=await read(registration.path);
 const decisions=new Map();
 for(const decision of bundle.terminologyDecisions??[]){
  if(!known.has(decision.termId))flags.push({locale:bundle.locale,kind:'unknown_term',termId:decision.termId});
  const key=decision.termId+'|'+decision.context;
  if(decisions.has(key)&&decisions.get(key)!==decision.rendering)
   flags.push({locale:bundle.locale,kind:'conflicting_decisions',termId:decision.termId,context:decision.context});
  decisions.set(key,decision.rendering);
 }
 for(const row of bundle.itemRealizations??[])for(const choice of row.termChoices??[]){
  if(!known.has(choice.termId))flags.push({locale:bundle.locale,kind:'unknown_term',itemId:row.itemId,termId:choice.termId});
  const key=choice.termId+'|'+choice.context,expected=decisions.get(key);
  if(expected&&expected!==choice.rendering)flags.push({locale:bundle.locale,kind:'review_contextual_rendering',
   itemId:row.itemId,termId:choice.termId,context:choice.context,preferred:expected,actual:choice.rendering});
 }
}
console.log(JSON.stringify({glossaryVersion:glossary.version,reviewFlags:flags},null,2));
// Flags invite contextual review; they are not automatic errors or rewrite instructions.
