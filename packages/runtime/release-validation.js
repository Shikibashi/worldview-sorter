import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {loadSnapshot,validateContentIntegrity,verifyRelease} from '../governance/release.js';
import {verifyEngineSource} from '../governance/engine-source.js';

export async function verifyProductionRelease(repoRoot){
 const read=relative=>readFile(path.join(repoRoot,relative));
 const json=async relative=>JSON.parse(await read(relative));
 const current=await json('data/current.json');
 const modelRelease=await json(current.modelRelease.path);
 await verifyRelease(repoRoot,current,modelRelease);
 if(current.engineSource)await verifyEngineSource(repoRoot,current.engineSource,{checkLive:true});
 validateContentIntegrity(await loadSnapshot(repoRoot,current));
 const [bank,form,model,catalog,pilot,experience,catalogManifest,consentManifest,depthManifest,localizationManifest]=await Promise.all([
  json(current.candidateBank.path),json(current.fullForm.path),json(current.worldviewModel.path),json(current.affinityCatalog.path),
  json(current.pilotCandidate.path),json(current.quizExperience.path),json(current.affinityCatalog.manifestPath),
  json('data/research/consent-v1.manifest.json'),json(current.progressiveDepth.manifestPath),json(current.localizationCatalog.manifestPath)]);
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const [file,expected] of Object.entries(pilot.frozenArtifactHashes))
  assert.equal(sha(await read(file)),expected,'Frozen pilot artifact changed: '+file);
 assert.equal(sha(await read(catalogManifest.path)),catalogManifest.sha256,'Pinned affinity catalog changed.');
 assert.equal(sha(await read(consentManifest.path)),consentManifest.sha256,'Pinned research consent changed.');
 assert.equal(sha(await read(depthManifest.path)),depthManifest.sha256,'Pinned progressive routes changed.');
 assert.equal(localizationManifest.catalogVersion,current.localizationCatalog.version,'Localization catalog version mismatch.');
 for(const [file,digest] of Object.entries(localizationManifest.hashes))assert.equal(sha(await read(file)),digest,'Pinned localization content changed: '+file);
 for(const ref of current.localizationCatalogVersions??[]){const manifest=await json(ref.manifestPath);
  assert.equal(manifest.catalogVersion,ref.version,'Historical localization catalog version mismatch.');
  for(const [file,digest] of Object.entries(manifest.hashes))assert.equal(sha(await read(file)),digest,'Historical localization content changed: '+file);}
 assert.equal(depthManifest.policyVersion,current.progressiveDepth.version);
 assert.equal(bank.bankVersion,current.candidateBank.version);
 assert.equal(form.policyVersion,pilot.route.version);
 assert.equal(form.instrumentVersion,model.pilotInstrumentVersion);
 assert.equal(model.modelVersion,pilot.interpretationRules.version);
 assert.equal(model.resultSemanticsVersion,catalog.resultSemanticsVersion);
 assert.equal(catalog.catalogVersion,catalogManifest.catalogVersion);
 assert.equal(catalog.modelVersion,model.modelVersion);
 assert.equal(catalog.instrumentVersion,form.instrumentVersion);
 for(const ref of [...experience.formPolicies,...(experience.modelPolicies??[]),...(current.affinityCatalogVersions??[])])await read(ref.path);
 return {pilotCandidateVersion:pilot.pilotCandidateVersion,instrumentVersion:form.instrumentVersion,
  modelVersion:model.modelVersion,affinityCatalogVersion:catalog.catalogVersion};
}
