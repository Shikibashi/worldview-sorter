import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareReferenceProfile,validateReferenceProfile,ReferenceProfileError} from '../packages/worldview/reference-profiles.js';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const current=await read('data/current.json');
const model=await read(current.worldviewModel.path);

const profile={
  schemaVersion:'1.0.0',profileVersion:'example-1.0.0',modelVersion:model.modelVersion,
  id:'example-reference',label:'Example reference',entityType:'tradition',origin:'independent_authoring',
  coverageStatus:'partial',identityOutputAllowed:false,percentageMatchAllowed:false,
  claims:[{
    id:'fallible-knowledge',propositionId:'construct-EP15',expectedState:'supported',importance:'core',
    evidenceBasis:'scholarly_reconstruction',publicUse:'comparison',
    sourceClaims:[{sourceId:'iep-fallibilism',relationship:'supports_profile_claim',claim:'Fallible knowledge is part of this synthetic example only.'}]
  },{
    id:'hypothesis',propositionId:'construct-EP19',expectedState:'supported',importance:'minor',
    evidenceBasis:'editorial_hypothesis',publicUse:'context_only',
    sourceClaims:[{sourceId:'acad-rand-epistemology',relationship:'supports_profile_claim',claim:'Synthetic context-only example.'}]
  }],
  limitations:['Synthetic fixture; not a public philosopher or tradition profile.']
};

assert.equal(validateReferenceProfile({profile,model}),true);
const report={modelVersion:model.modelVersion,commitments:[
  {commitmentId:'construct-EP15',state:'supported'},
  {commitmentId:'construct-EP19',state:'opposed'}
],derived:[]};
const compared=compareReferenceProfile({profile,model,report});
assert.equal(compared.percentageMatchAllowed,false);
assert.equal(compared.aggregateScore,null);
assert.equal(compared.publicIdentityLabel,null);
assert.equal(compared.coverage.overlap,1);
assert.equal(compared.coverage.divergence,0,'Context-only hypotheses do not count toward comparison coverage.');

const forbidden=structuredClone(profile);forbidden.matchPercentage=91;
assert.throws(()=>validateReferenceProfile({profile:forbidden,model}),ReferenceProfileError);

const badHypothesis=structuredClone(profile);badHypothesis.claims[1].publicUse='comparison';
assert.throws(()=>validateReferenceProfile({profile:badHypothesis,model}),/hypotheses cannot participate/);

const foreignCoordinate=structuredClone(profile);foreignCoordinate.vector=[0.1,0.2];
assert.throws(()=>validateReferenceProfile({profile:foreignCoordinate,model}),/cannot contain vector/);

console.log('Independent reference profiles: proposition mapping, source provenance, and no-classifier boundary passed.');
