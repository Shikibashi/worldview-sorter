import {
  validateLocalizationBundle,
  validateLocalizationCatalog
} from '../../../packages/localization/index.js';

const fetchJSON = async (file) => {
  const response = await fetch(new URL(`./${file}`, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load the current instrument file: ${file}`);
  return response.json();
};

export async function loadRuntime() {
  const current = await fetchJSON('data/current.json');
  const experience = await fetchJSON(current.quizExperience.path);
  const [bank, pilot, scalesDoc, model, affinityCatalog, affinityPilot] = await Promise.all([
    fetchJSON(current.candidateBank.path),
    fetchJSON(current.pilot.path),
    fetchJSON('data/response-scales.json'),
    fetchJSON(current.worldviewModel.path),
    fetchJSON(current.affinityCatalog.path),
    fetchJSON(current.pilotCandidate.path)
  ]);
  const modelReleases = await Promise.all((current.modelReleaseVersions ?? [current.modelRelease]).map(ref => fetchJSON(ref.path)));
  const historicalBankRefs = [...new Map(modelReleases.map(release => {
    const component = release.components.find(row => row.key === 'bank');
    return [component.version, component];
  })).values()];
  const loadedBanks = await Promise.all(historicalBankRefs.map(ref => fetchJSON(ref.path)));
  const banks = new Map(loadedBanks.map(value => [value.bankVersion, value]));
  banks.set(bank.bankVersion, bank);
  const historicalPilots = await Promise.all(modelReleases.map(async release => {
    const modelRef = release.components.find(component => component.key === 'model');
    const pilotRef = release.components.find(component => component.key === 'pilot');
    return [modelRef.version, await fetchJSON(pilotRef.path)];
  }));
  const pilotsByModel = new Map(historicalPilots);
  const loadedModels = await Promise.all((experience.modelPolicies ?? []).map(ref => fetchJSON(ref.path)));
  const models = new Map(loadedModels.map(value => [value.modelVersion, value]));
  models.set(model.modelVersion, model);
  const formPolicies = await Promise.all(experience.formPolicies.map(ref => fetchJSON(ref.path)));
  const progressivePolicy = formPolicies.find(value => value.policyVersion === experience.progressivePolicy.version);
  if (!progressivePolicy) throw new Error('The active progressive route release is unavailable.');
  const affinityCatalogRefs = current.affinityCatalogVersions ?? [current.affinityCatalog];
  const loadedAffinities = await Promise.all(affinityCatalogRefs.map(ref => fetchJSON(ref.path)));
  const affinitiesByVersion = new Map(loadedAffinities.map(value => [value.catalogVersion, value]));
  affinitiesByVersion.set(affinityCatalog.catalogVersion, affinityCatalog);
  const localizationCatalogRefs = current.localizationCatalogVersions ?? [current.localizationCatalog];
  const localizationCatalogs = await Promise.all(localizationCatalogRefs.map(ref => fetchJSON(ref.path)));
  const catalogsByVersion = new Map(localizationCatalogs.map(value => [value.catalogVersion, value]));
  const localizationBundles = new Map();
  const localizationBundlesByVersion = new Map();
  const bundleRefs = (current.localizationBundleVersions ?? current.localizationBundles ?? [])
    .filter(ref => ref.locale === 'en-US');
  const loadedBundles = await Promise.all(bundleRefs.map(ref => fetchJSON(ref.path)));
  for (const bundle of loadedBundles) {
    const catalog = localizationCatalogs.find(value => value.locales.some(row =>
      row.locale === bundle.locale && row.bundleVersion === bundle.bundleVersion));
    if (!catalog) throw new Error(`The English wording catalog is unavailable: ${bundle.bundleVersion}`);
    validateLocalizationBundle(bundle, {
      catalog,
      bank: banks.get(catalog.canonicalBankVersion),
      scalesDoc,
      model: models.get(catalog.modelVersion),
      affinityCatalog: affinitiesByVersion.get(catalog.affinityCatalogVersion)
    });
    localizationBundlesByVersion.set(bundle.bundleVersion, bundle);
  }
  const activeCatalog = localizationCatalogs.find(value => value.catalogVersion === current.localizationCatalog.version);
  if (!activeCatalog || activeCatalog.locales.some(row => row.locale !== 'en-US')) {
    throw new Error('The active public wording release is not the approved English-only release.');
  }
  for (const catalog of localizationCatalogs) {
    const boundModel = models.get(catalog.modelVersion);
    const boundAffinity = affinitiesByVersion.get(catalog.affinityCatalogVersion);
    const boundBank = banks.get(catalog.canonicalBankVersion);
    if (!boundModel || !boundAffinity || !boundBank) throw new Error(`Historical wording dependencies are unavailable: ${catalog.catalogVersion}`);
    validateLocalizationCatalog(catalog, { bank: boundBank, model: boundModel, affinityCatalog: boundAffinity });
  }
  for (const row of activeCatalog.locales.filter(value => value.locale === 'en-US')) {
    const bundle = localizationBundlesByVersion.get(row.bundleVersion);
    if (!bundle || bundle.status !== 'approved' || bundle.canonical !== true) {
      throw new Error('The approved English questionnaire wording is unavailable.');
    }
    localizationBundles.set(bundle.locale, bundle);
  }
  const activeModelReleaseVersion = current.modelRelease.version;
  if (!experience.routes?.length || !models.has(model.modelVersion)) throw new Error('The active quiz configuration is incomplete.');
  return {
    current, experience, bank, pilot, scalesDoc, model, models, banks, pilotsByModel,
    modelReleases, formPolicies, progressivePolicy, affinityCatalog, affinityPilot,
    affinityCatalogRefs, affinitiesByVersion, localizationCatalogs, catalogsByVersion,
    localizationBundles, localizationBundlesByVersion, activeModelReleaseVersion
  };
}
