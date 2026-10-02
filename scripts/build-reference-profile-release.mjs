import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReferenceCatalog } from '../packages/worldview/reference-profiles.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readText = async path => readFile(resolve(root, path), 'utf8');
const readJson = async path => JSON.parse(await readText(path));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const writeJson = async (path, value) => {
  const absolute = resolve(root, path);
  await mkdir(dirname(absolute), { recursive: true });
  const content = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const previous = await readFile(absolute, 'utf8');
    if (previous !== content) throw new Error(`Refusing to mutate released reference-profile artifact: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(absolute, content);
  }
};
const writeMutableJson = async (path, value) => {
  const absolute = resolve(root, path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`);
};
const assertRepoPath = path => {
  const absolute = resolve(root, path);
  if (!absolute.startsWith(`${root}/`)) throw new Error(`Release path escapes repository: ${path}`);
  return absolute;
};

const index = await readJson('data/reference/catalog-index.json');
if (index.schemaVersion !== '1.0.0') throw new Error('Unsupported reference profile catalog index.');
assertRepoPath(index.catalogPath);
const catalogText = await readText(index.catalogPath);
const catalog = JSON.parse(catalogText);
if (catalog.catalogVersion !== index.currentCatalogVersion) throw new Error('Catalog index version does not match the selected catalog.');

const current = await readJson('data/current.json');
const modelPath = current.worldviewModel.path;
const routePath = current.progressiveDepth.path;
const modelText = await readText(modelPath);
const routeText = await readText(routePath);
const model = JSON.parse(modelText);
const routes = JSON.parse(routeText);
validateReferenceCatalog({ catalog, model, routes });

const modelRelease = current.modelRelease?.version ?? null;
const manifest = {
  schemaVersion: '1.0.0',
  manifestVersion: `reference-profile-manifest-${catalog.catalogVersion.replace('reference-profile-catalog-', '')}`,
  catalogVersion: catalog.catalogVersion,
  profileModelVersion: catalog.profileModelVersion,
  sourceLedgerVersion: catalog.sourceLedgerVersion,
  modelReleaseVersion: modelRelease,
  components: {
    profileCatalog: { version: catalog.catalogVersion, path: index.catalogPath, sha256: sha256(catalogText) },
    worldviewModel: { version: model.modelVersion, path: modelPath, sha256: sha256(modelText) },
    progressiveRoutes: { version: routes.policyVersion, path: routePath, sha256: sha256(routeText) }
  },
  profileIds: catalog.profiles.map(profile => profile.id),
  externalSourceIds: catalog.sources.map(source => source.id).sort()
};

const currentPointer = {
  schemaVersion: '1.0.0',
  catalogVersion: catalog.catalogVersion,
  profileModelVersion: catalog.profileModelVersion,
  sourceLedgerVersion: catalog.sourceLedgerVersion,
  catalogPath: index.catalogPath,
  manifestPath: index.manifestPath,
  reportPath: index.reportPath
};

const activeSourceMap = new Map([...(model.sources ?? []).map(source => [source.id, source]), ...catalog.sources.map(source => [source.id, source])]);
const reportLines = [
  `# Reference-profile catalog ${catalog.catalogVersion.replace('reference-profile-catalog-', '')}`,
  '',
  '> Internal comparison material only. These entries are not public result cards, identity assignments, empirical classifications, or complete reconstructions of philosophers and traditions.',
  '',
  `- Profile-model version: \`${catalog.profileModelVersion}\``,
  `- Worldview model: \`${model.modelVersion}\``,
  `- Route policy: \`${routes.policyVersion}\``,
  `- Model release context: \`${modelRelease ?? 'not recorded'}\``,
  `- Candidate profiles: ${catalog.profiles.length}`,
  ''
];

for (const profile of catalog.profiles) {
  reportLines.push(`## ${profile.label}`, '', `**Entity:** ${profile.entityType}`,
    `**Status:** ${profile.coverageStatus}; internal only`, `**Scope:** ${profile.scope}`, '',
    '### Mapped claims', '', '| Claim | WVS target | Route status | Evidence basis |', '|---|---|---|---|');
  for (const claim of profile.claims) {
    reportLines.push(`| ${claim.id} | \`${claim.propositionId}\` (${claim.targetKind}) — ${claim.targetText} | ${claim.mappingStatus}: ${claim.routeAvailability.join(', ') || 'none'} | ${claim.evidenceBasis} |`);
  }
  reportLines.push('', '### Neighbors and non-entailments', '', '**Nearby views:**', '');
  for (const item of profile.neighbors) reportLines.push(`- ${item}`);
  reportLines.push('', '**This comparison does not establish:**', '');
  for (const item of profile.nonEntailments) reportLines.push(`- ${item}`);
  reportLines.push('', '### Deliberately unmeasured areas', '');
  for (const item of profile.unmeasuredAreas) reportLines.push(`- ${item}`);
  reportLines.push('', '### Source trail', '');
  for (const claim of profile.claims) {
    reportLines.push(`**${claim.id}**`);
    for (const reference of claim.sourceClaims) {
      const source = activeSourceMap.get(reference.sourceId);
      const locator = reference.locator.replace(/[.]+$/, '');
      reportLines.push(`- [${source.title}](${source.url}) — ${locator}. ${reference.claim}`);
    }
  }
  reportLines.push('', '### Limitations', '');
  for (const item of profile.limitations) reportLines.push(`- ${item}`);
  reportLines.push('');
}

assertRepoPath(index.manifestPath);
await writeJson(index.manifestPath, manifest);
await writeMutableJson('data/reference/current.json', currentPointer);
const reportAbsolute = assertRepoPath(index.reportPath);
await mkdir(dirname(reportAbsolute), { recursive: true });
const reportContent = `${reportLines.join('\n').trimEnd()}\n`;
try {
  const previous = await readFile(reportAbsolute, 'utf8');
  if (previous !== reportContent) throw new Error(`Refusing to mutate released reference-profile report: ${index.reportPath}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await writeFile(reportAbsolute, reportContent);
}
console.log(`Reference profile release ${catalog.catalogVersion} validated; wrote manifest, pointer, and report.`);
