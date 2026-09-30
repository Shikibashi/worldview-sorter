import {readFile} from 'node:fs/promises';
import {routeLocalizationAvailability} from '../packages/localization/index.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const [catalog,bank,scalesDoc,model,affinity,policy]=await Promise.all([
 read(current.localizationCatalog.path),read(current.candidateBank.path),read('data/response-scales.json'),
 read(current.worldviewModel.path),read(current.affinityCatalog.path),read(current.progressiveDepth.path)]);
const report=[];
for(const registration of catalog.locales){const bundle=await read(registration.path);
 for(const route of policy.routes){const availability=routeLocalizationAvailability({bundle,route,bank,scalesDoc,model,affinityCatalog:affinity});
  report.push({locale:bundle.locale,routeId:route.id,assignedItems:route.itemRefs.length,available:availability.available,
   blockers:availability.blockers,missingItemCount:availability.missingItems.length,
   missingScaleCount:availability.missingScales.length,missingPropositionCount:availability.missingPropositions.length,
   missingAffinityCount:availability.missingAffinities.length,affinityAvailable:availability.affinityAvailable});}}
console.log(JSON.stringify({catalogVersion:catalog.catalogVersion,routes:report},null,2));
