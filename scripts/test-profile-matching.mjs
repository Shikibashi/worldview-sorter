import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { matchProfiles } from "../packages/profiles/matcher.js";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const [catalog, policy] = await Promise.all([
  load(current.profileCatalog.path),
  load(current.profileMatchingPolicy.path)
]);

const politicallySimilarButNotObjectivist = {
  constructEstimates:{
    PL09:{estimate:0.9,coverage:1},
    PL11:{estimate:0.95,coverage:1},
    PL13:{estimate:1,coverage:1},
    EP10:{estimate:-1,coverage:1},
    RC01:{estimate:-1,coverage:1},
    OM01:{estimate:-0.9,coverage:1}
  },
  probeResponses:{
    "OBJ-P01":-1,
    "OBJ-P02":2,
    "OBJ-P03":-2,
    "OBJ-P04":2
  },
  identityConfirmations:{}
};

let result = matchProfiles({
  catalog,
  policy,
  input:politicallySimilarButNotObjectivist
});

const objectivism = result.candidates.find((candidate) => candidate.profileId === "objectivism");
assert.equal(objectivism.state, "excluded");
assert.equal(objectivism.publicIdentityLabel, null);
assert.equal(result.publicIdentityLabel, null);
assert.equal(result.state, "no_match");
assert.equal(result.percentageMatchAllowed, false);
assert.ok(objectivism.hardGates.failed.length >= 2);

const politicalOnly = {
  constructEstimates:politicallySimilarButNotObjectivist.constructEstimates,
  probeResponses:{},
  identityConfirmations:{}
};
result = matchProfiles({ catalog, policy, input:politicalOnly });
assert.equal(
  result.candidates.find((candidate) => candidate.profileId === "objectivism").state,
  "underdetermined",
  "political similarity alone must never establish Objectivism"
);
assert.equal(result.publicIdentityLabel, null);

const doctrineConsistent = {
  constructEstimates:politicallySimilarButNotObjectivist.constructEstimates,
  probeResponses:{
    "OBJ-P01":2,
    "OBJ-P02":2,
    "OBJ-P03":2,
    "OBJ-P04":2
  },
  identityConfirmations:{
    objectivism:"yes"
  }
};
result = matchProfiles({ catalog, policy, input:doctrineConsistent });
assert.equal(
  result.candidates.find((candidate) => candidate.profileId === "objectivism").state,
  "eligible_unconfirmed",
  "prototype catalog must still refuse a public identity label even with doctrinal consistency"
);
assert.equal(result.publicIdentityLabel, null);
assert.equal(result.state, "affinity_only");

const futureCalibratedCatalog = {
  ...catalog,
  status:"calibrated",
  identityOutputAllowed:true
};
result = matchProfiles({
  catalog:futureCalibratedCatalog,
  policy,
  input:doctrineConsistent
});
assert.equal(result.state, "confirmed_identity");
assert.equal(result.publicIdentityLabel, "Objectivist");

const noSelfIdentification = {
  ...doctrineConsistent,
  identityConfirmations:{}
};
result = matchProfiles({
  catalog:futureCalibratedCatalog,
  policy,
  input:noSelfIdentification
});
assert.equal(result.state, "affinity_only");
assert.equal(result.publicIdentityLabel, null);

console.log("Profile matching guardrail tests passed.");
