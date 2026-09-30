import { readFile } from "node:fs/promises";
import {createHash} from 'node:crypto';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCollectionHttpServer } from "../../packages/collection/http.js";
import { createFileSessionStore } from "../../packages/collection/store.js";
import {createResearchContributionStore,RESEARCH_CONSENT_VERSION} from '../../packages/collection/research.js';
import {verifyProductionRelease} from '../../packages/runtime/release-validation.js';
import {selectReleaseChannel} from '../../packages/beta/release.js';
import {createFeedbackStore} from '../../packages/beta/feedback.js';
import {captureRelease,currentFromManifest,loadSnapshot,validateContentIntegrity} from '../../packages/governance/release.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const release=await verifyProductionRelease(repoRoot);
const production=process.env.NODE_ENV==='production';
if(production&&process.env.WORLDVIEW_ENABLE_LEGACY_COLLECTION==='true')throw Error('Legacy development collection cannot be enabled in production.');
if(production&&process.env.WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS==='true'&&!process.env.WORLDVIEW_RESEARCH_DIR)throw Error('Production research collection requires WORLDVIEW_RESEARCH_DIR.');
const load = async (relative) => JSON.parse(await readFile(path.join(repoRoot, relative), "utf8"));
const current = await load("data/current.json");
const feedbackRequested=process.env.WORLDVIEW_ENABLE_FEEDBACK==='true';
if(production&&feedbackRequested&&!process.env.WORLDVIEW_FEEDBACK_DIR)
 throw Error('Production feedback requires WORLDVIEW_FEEDBACK_DIR.');
const channelName=process.env.WORLDVIEW_RELEASE_CHANNEL??(production?'stable':'development');
const releaseChannel=selectReleaseChannel(await load(current.releaseChannels?.path??'data/releases/channels-v1.json'),current,channelName,
 {feedbackStoreAvailable:feedbackRequested});
const [bank, pilot, instrument, scalesDoc, formPolicy, model, catalog, pilotManifest] = await Promise.all([
  load(current.candidateBank.path), load(current.pilot.path), load(current.instrument.path), load("data/response-scales.json"),
  load(current.fullForm.path),load(current.worldviewModel.path),load(current.affinityCatalog.path),load(current.pilotCandidate.path)
]);
const localizationCatalogs=await Promise.all((current.localizationCatalogVersions??[current.localizationCatalog]).map(ref=>load(ref.path)));
const localizationBundles=await Promise.all(current.localizationBundles.map(ref=>load(ref.path)));
const modelReleases=await Promise.all((current.modelReleaseVersions??[current.modelRelease]).map(ref=>load(ref.path)));
const feedbackReleases=await Promise.all(modelReleases.map(async manifest=>{
 const historical=currentFromManifest(manifest);
 if(JSON.stringify(await captureRelease(repoRoot,historical,manifest.releaseVersion))!==JSON.stringify(manifest))
  throw Error('Historical feedback release changed in place: '+manifest.releaseVersion);
 const snapshot=await loadSnapshot(repoRoot,historical);validateContentIntegrity(snapshot);
 return {manifest,snapshot};
}));
const storageDirectory = process.env.WORLDVIEW_STORAGE_DIR ? path.resolve(process.env.WORLDVIEW_STORAGE_DIR) : path.join(repoRoot, ".data", "pilot-sessions");
const store = createFileSessionStore({ directory:storageDirectory });
const researchEnabled=process.env.WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS==='true';
const consentManifest=researchEnabled?await load('data/research/consent-v1.manifest.json'):null;
const consentBytes=researchEnabled?await readFile(path.join(repoRoot,consentManifest.path)):null;
if(researchEnabled&&createHash('sha256').update(consentBytes).digest('hex')!==consentManifest.sha256)throw Error('Research consent terms changed in place.');
const consent=consentBytes?JSON.parse(consentBytes):null;
if(researchEnabled&&consent.consentVersion!==RESEARCH_CONSENT_VERSION)throw Error('Research consent version mismatch.');
const researchDirectory=process.env.WORLDVIEW_RESEARCH_DIR?path.resolve(process.env.WORLDVIEW_RESEARCH_DIR):path.join(repoRoot,'.data','research-contributions');
const researchStore=createResearchContributionStore({directory:researchDirectory});
const feedbackDirectory=process.env.WORLDVIEW_FEEDBACK_DIR?path.resolve(process.env.WORLDVIEW_FEEDBACK_DIR):
 path.join(repoRoot,'.data','beta-feedback');
const feedbackStore=releaseChannel.features.feedback?createFeedbackStore({directory:feedbackDirectory}):null;
if(feedbackStore)await feedbackStore.init();
const server = createCollectionHttpServer({repoRoot,bank,pilot,instrument,scalesDoc,store,researchStore,
 researchContext:researchEnabled?{formPolicy,model,catalog,pilotManifest,consent,
  localizationBundles,localizationCatalogs,modelReleases}:null,
 researchContributionsEnabled:researchEnabled,
 productMetricsEnabled:process.env.WORLDVIEW_ENABLE_PRODUCT_METRICS==='true',
 releaseChannel,feedbackStore,feedbackReleases,
 legacyCollectionEnabled:process.env.WORLDVIEW_ENABLE_LEGACY_COLLECTION==='true',
 onEvent:event=>console.log(JSON.stringify({at:new Date().toISOString(),...event}))});
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT must be an integer from 0 to 65535.');
server.on('error',error=>{console.error(JSON.stringify({at:new Date().toISOString(),event:'server_start_failed',code:error.code??'unknown'}));process.exitCode=1;});
server.listen(port, host, () => {
  console.log(JSON.stringify({at:new Date().toISOString(),event:'server_started',host,port:server.address().port,
   ...release,releaseChannel:releaseChannel.channel,researchContributionEnabled:researchEnabled,
   feedbackEnabled:Boolean(feedbackStore),productMetricsEnabled:process.env.WORLDVIEW_ENABLE_PRODUCT_METRICS==='true',
   legacyCollectionEnabled:process.env.WORLDVIEW_ENABLE_LEGACY_COLLECTION==='true'}));
});
const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
