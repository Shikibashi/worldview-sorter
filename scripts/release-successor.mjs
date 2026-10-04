// Build a successor model release from authored inputs, deterministically.
//
//   node scripts/release-successor.mjs --plan data/releases/plans/model-release-1.20.0.json
//   node scripts/release-successor.mjs --plan ... --verify [--base origin/main]
//   node scripts/release-successor.mjs --plan data/releases/plans/model-release-1.21.0.json --regenerate --base origin/main --artifacts-only
//
// Stages (each is skipped when its output is already present and reproducible):
//   1. builder   authored delta -> successor component artifacts + current pointers
//   2. manifest  build-model-release: semantic diff, governance gate, release manifest, index
//   3. audit     audit-pilot-evidence --active --write: route evidence dispositions for the release
//   4. sync      npm run build:academic: derived pointers, companions, hashes, generated docs
//   5. verify    model-governance verify
//
// `--verify` proves a committed release is reproducible: it checks out `--base` in a
// temporary worktree, overlays only the plan's authored inputs and the tooling
// directories, runs stages 1-5 there, and fails on any byte difference from this tree.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {access, chmod, cp, lstat, mkdir, mkdtemp, readFile, readlink, readdir, rename, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const flag = name => args.includes(name) ? args[args.indexOf(name) + 1] : null;

const TOOLING = ['scripts', 'packages', 'schemas', 'apps', 'package.json', 'package-lock.json'];

const MUTABLE_GENERATED_OUTPUTS = new Set([
  'README.md',
  'data/academic/build-output.json',
  'data/current.json',
  'data/experience/current.json',
  'data/generic/build-output.json',
  'data/reference/catalog-index.json',
  'data/reference/current.json',
  'data/reference/readiness-current.json',
  'data/releases/channels-current.json',
  'data/releases/current.json',
  'docs/FULL_ROUTE.md',
  'docs/GENERIC_WORLDVIEW.md',
  'docs/METAETHICAL_MEASUREMENT_LIMITS.md',
  'docs/PHILOSOPHY_DOMAINS.md',
  'docs/QUIZ_EXPERIENCE.md',
  'docs/REFERENCE_READINESS_REPORT.md',
  'docs/UNMAPPED_AUDIT.md',
  'research/academic/CONSTRUCT_SOURCE_MATRIX.md',
  'research/academic/GENERIC_SOURCE_LEDGER.md',
  'research/academic/PHILOSOPHY_SOURCES.md'
]);

export async function readPlan(treeRoot, file) {
  const plan = JSON.parse(await readFile(path.join(treeRoot, file), 'utf8'));
  assert.equal(plan.schemaVersion, 'successor-release-plan-1');
  assert.match(plan.version, /^model-release-\d+\.\d+\.\d+$/, 'plan.version');
  assert.ok(plan.builder && plan.authoredInputs?.includes(plan.builder), 'plan.builder must be listed in authoredInputs');
  for (const input of plan.authoredInputs) assert.ok(!path.isAbsolute(input) && !input.split('/').includes('..'), 'Unsafe input ' + input);
  plan.manifestPath = `data/releases/model-release-v${plan.version.slice('model-release-'.length)}.json`;
  return plan;
}

function run(cwd, command, commandArgs, label) {
  console.log(`\n== ${label}: ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, {cwd, stdio: 'inherit', env: process.env});
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status} in ${cwd}`);
}

const readText = (treeRoot, file) => readFile(path.join(treeRoot, file), 'utf8');

export async function buildSuccessor(treeRoot, plan, {production = false, artifactsOnly = false} = {}) {
  assert.ok(!artifactsOnly || !production, '--artifacts-only cannot be combined with --production.');
  // `data/current.json` is rewritten by the generated chain, so release state is read from
  // the release index, which only the manifest stage writes.
  const index = JSON.parse(await readText(treeRoot, 'data/releases/current.json'));
  const manifestExists = await readText(treeRoot, plan.manifestPath).then(() => true, error => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
  if (index.current.version === plan.version) assert.ok(manifestExists, `Index names ${plan.version} but ${plan.manifestPath} is missing.`);
  const activated = index.current.version === plan.version;
  if (!activated) run(treeRoot, 'node', [plan.builder], 'builder');
  else console.log(`\n== builder: ${plan.version} is already active; skipping the one-shot builder`);
  run(treeRoot, 'node', ['scripts/build-model-release.mjs', '--new-version', plan.version, '--out', plan.manifestPath], 'manifest');
  run(treeRoot, 'node', ['scripts/audit-pilot-evidence.mjs', '--active', '--write'], 'audit');
  // build:academic regenerates data/current.json and relies on sync to restore the release
  // pointers; if it fails midway, put the pre-sync pointers back instead of leaving a broken tree.
  const pointers = await readText(treeRoot, 'data/current.json');
  try { run(treeRoot, 'npm', ['run', 'build:academic'], 'sync'); }
  catch (error) { await writeFile(path.join(treeRoot, 'data/current.json'), pointers); throw error; }
  run(treeRoot, 'node', ['scripts/build-reference-readiness-audit.mjs'], 'readiness');
  if (!artifactsOnly) run(treeRoot, 'node', ['scripts/model-governance.mjs', 'verify'], 'verify');
  if (production) run(treeRoot, 'npm', ['run', 'build:production'], 'production');
  const after = JSON.parse(await readText(treeRoot, 'data/current.json'));
  assert.equal(after.modelRelease?.version, plan.version, `Pipeline finished but the active release is ${after.modelRelease?.version}, not ${plan.version}.`);
}

const git = (cwd, gitArgs) => {
  const result = spawnSync('git', gitArgs, {cwd, encoding: 'utf8', maxBuffer: 1 << 28});
  assert.equal(result.status, 0, `git ${gitArgs.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
};
const listTree = cwd => git(cwd, ['ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean)
  .filter(file => !file.startsWith('node_modules/') && !file.startsWith('dist/') && !file.startsWith('.git/') &&
    !file.startsWith('.release-successor-backup-') && !file.startsWith('.release-successor-regenerate-')).sort();

const gitPaths = (cwd, gitArgs) => git(cwd, gitArgs).split('\0').filter(Boolean);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const posixPath = file => file.split(path.sep).join('/');

async function pathState(treeRoot, file) {
  const absolute = path.join(treeRoot, file);
  let info;
  try { info = await lstat(absolute); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (info.isSymbolicLink()) return {type: 'symlink', target: await readlink(absolute)};
  if (info.isFile()) return {type: 'file', mode: info.mode & 0o7777, sha256: digest(await readFile(absolute))};
  return {type: info.isDirectory() ? 'directory' : 'other', mode: info.mode & 0o7777};
}

async function fileStates(treeRoot) {
  const states = new Map();
  const visit = async relative => {
    const absolute = path.join(treeRoot, relative);
    for (const entry of await readdir(absolute, {withFileTypes: true})) {
      if (!relative && (['.git', 'node_modules', 'dist'].includes(entry.name) ||
        entry.name.startsWith('.release-successor-regenerate-') || entry.name.startsWith('.release-successor-backup-'))) continue;
      const file = posixPath(path.join(relative, entry.name));
      if (entry.isDirectory()) await visit(file);
      else states.set(file, await pathState(treeRoot, file));
    }
  };
  await visit('');
  return states;
}

const sameState = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
const isOverlayPath = (file, entries) => entries.some(entry => file === entry || file.startsWith(entry + '/'));

function resolveBase(cwd, base) {
  const commit = git(cwd, ['rev-parse', '--verify', `${base}^{commit}`]).trim();
  assert.match(commit, /^[0-9a-f]{40,64}$/i, `--base did not resolve to a commit: ${base}`);
  return commit;
}

function extractBase(cwd, base, archivePath, destination) {
  const archived = spawnSync('git', ['archive', '--format=tar', `--output=${archivePath}`, base], {cwd, encoding: 'utf8'});
  assert.equal(archived.status, 0, `git archive ${base} failed: ${archived.stderr}`);
  const extracted = spawnSync('tar', ['-xf', archivePath, '-C', destination], {cwd, encoding: 'utf8'});
  assert.equal(extracted.status, 0, `tar extraction of ${base} failed: ${extracted.stderr}`);
}

async function copyOverlay(treeRoot, entries) {
  for (const entry of entries) {
    const source = path.join(root, entry);
    await access(source);
    const destination = path.join(treeRoot, entry);
    await rm(destination, {recursive: true, force: true});
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(source, destination, {recursive: true});
  }
}

function generatedDelta(baseStates, stagedStates, baseTracked, overlays) {
  const delta = [];
  const blocked = [];
  for (const file of new Set([...baseStates.keys(), ...stagedStates.keys()])) {
    if (isOverlayPath(file, overlays)) continue;
    const before = baseStates.get(file) ?? null;
    const after = stagedStates.get(file) ?? null;
    if (sameState(before, after)) continue;
    if (baseTracked.has(file)) {
      if (!after) blocked.push(`${file} (baseline tracked file deleted)`);
      else if (!MUTABLE_GENERATED_OUTPUTS.has(file)) blocked.push(`${file} (baseline tracked artifact changed; not an approved mutable pointer/document output)`);
    }
    if (after && after.type !== 'file') blocked.push(`${file} (generated output is not a regular file)`);
    if (after) delta.push(file);
  }
  return {delta: delta.sort(), blocked: [...new Set(blocked)].sort()};
}

async function assertNoConcurrentChanges(preBuild, files) {
  const changed = [];
  for (const file of files) {
    if (!sameState(preBuild.get(file) ?? null, await pathState(root, file))) changed.push(file);
  }
  assert.deepEqual(changed, [], 'Concurrent local edits detected since regeneration started; no generated files copied back:\n  ' + changed.join('\n  '));
}

async function assertOverlayUnchanged(preBuild, overlays) {
  const afterBuild = await fileStates(root);
  const relevant = new Set([
    ...[...preBuild.keys()].filter(file => isOverlayPath(file, overlays)),
    ...[...afterBuild.keys()].filter(file => isOverlayPath(file, overlays))
  ]);
  await assertNoConcurrentChanges(preBuild, relevant);
}

async function ensureSafeParent(relative) {
  const parts = relative.split('/');
  let current = root;
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      assert.ok(info.isDirectory() && !info.isSymbolicLink(), `Unsafe generated-output parent: ${posixPath(path.relative(root, current))}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await mkdir(current);
    }
  }
}

async function regenerateArtifacts(plan, base) {
  const baseCommit = resolveBase(root, base);
  const preBuild = await fileStates(root);
  const overlays = [...new Set([...TOOLING, ...plan.authoredInputs])];
  const scratch = await mkdtemp(path.join(root, '.release-successor-regenerate-'));
  const tree = path.join(scratch, 'tree');
  const archive = path.join(scratch, 'base.tar');
  await mkdir(tree);
  try {
    extractBase(root, baseCommit, archive, tree);
    const baseStates = await fileStates(tree);
    const baseTracked = new Set(gitPaths(root, ['ls-tree', '-r', '--name-only', '-z', baseCommit]));
    await copyOverlay(tree, overlays);
    const modules = path.join(root, 'node_modules');
    await access(modules);
    await symlink(modules, path.join(tree, 'node_modules'), 'dir');

    console.log(`\n== Regenerating ${plan.version} in clean ${base} staging inside this worktree (artifacts only).`);
    await buildSuccessor(tree, plan, {artifactsOnly: true});

    const stagedStates = await fileStates(tree);
    const {delta, blocked} = generatedDelta(baseStates, stagedStates, baseTracked, overlays);
    if (blocked.length) throw new Error(`Regeneration blocked; no generated files copied back. Baseline tracked paths changed outside the allowed mutable outputs:\n  ${blocked.join('\n  ')}`);
    await assertOverlayUnchanged(preBuild, overlays);
    await assertNoConcurrentChanges(preBuild, delta);
    const stagedPaths = new Set(gitPaths(root, ['diff', '--cached', '--name-only', '-z']));
    const stagedConflicts = delta.filter(file => stagedPaths.has(file));
    assert.deepEqual(stagedConflicts, [], 'Regeneration blocked; destination paths have staged local changes:\n  ' + stagedConflicts.join('\n  '));
    const locallyTracked = new Set(gitPaths(root, ['ls-files', '-z']));
    const historicalConflicts = delta.filter(file => locallyTracked.has(file) && !baseTracked.has(file));
    assert.deepEqual(historicalConflicts, [], 'Regeneration cannot replace successor artifacts already tracked in this checkout:\n  ' + historicalConflicts.join('\n  '));

    const replacements = [];
    for (const file of delta) {
      const local = await pathState(root, file);
      const staged = stagedStates.get(file);
      if (sameState(local, staged)) continue;
      if (local && local.type !== 'file') throw new Error(`Regeneration blocked; destination is not a regular file: ${file}`);
      replacements.push({file, local, staged});
    }

    const backupDir = await mkdtemp(path.join(root, `.release-successor-backup-${plan.version.slice('model-release-'.length)}-`));
    const backups = replacements.filter(({local}) => local).map(({file, local}) => ({
      path: file,
      backupPath: path.posix.join(path.basename(backupDir), file),
      sha256: local.sha256,
      mode: local.mode,
      reason: baseTracked.has(file) ? 'local bytes differ from regenerated output' : 'existing untracked successor artifact replaced'
    }));
    const manifestPath = path.join(backupDir, 'manifest.json');
    const manifest = {
      schemaVersion: 'successor-regeneration-backup-1',
      release: plan.version,
      base: {ref: base, commit: baseCommit},
      status: 'preparing',
      backups
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
    console.log(`\nBackup manifest: ${path.relative(root, manifestPath)} (status: preparing).`);
    for (const record of backups) {
      const destination = path.join(backupDir, record.path);
      await mkdir(path.dirname(destination), {recursive: true});
      await cp(path.join(root, record.path), destination);
      assert.equal((await pathState(backupDir, record.path))?.sha256, record.sha256, `Backup bytes differ from prebuild bytes for ${record.path}`);
    }
    manifest.status = 'complete';
    const temporaryManifest = `${manifestPath}.tmp`;
    await writeFile(temporaryManifest, JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
    await rename(temporaryManifest, manifestPath);

    for (const {file} of replacements) {
      await ensureSafeParent(file);
      await assertNoConcurrentChanges(preBuild, [file]);
      const destination = path.join(root, file);
      const temporary = `${destination}.release-successor-${process.pid}-${Math.random().toString(16).slice(2)}`;
      try {
        await cp(path.join(tree, file), temporary);
        await chmod(temporary, stagedStates.get(file).mode);
        await assertNoConcurrentChanges(preBuild, [file]);
        await rename(temporary, destination);
      } catch (error) {
        await rm(temporary, {force: true});
        throw error;
      }
    }
    console.log(`\nCopied ${replacements.length} generated artifacts from ${base}; backups: ${path.relative(root, backupDir)} (manifest: ${path.relative(root, manifestPath)}).`);
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
}

export async function verifyReproducible(plan, base) {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'worldview-successor-'));
  const clean = path.join(parent, 'tree');
  git(root, ['worktree', 'add', '--detach', clean, base]);
  try {
    await symlink(path.join(root, 'node_modules'), path.join(clean, 'node_modules'));
    for (const entry of [...TOOLING, ...plan.authoredInputs]) {
      await rm(path.join(clean, entry), {recursive: true, force: true});
      await cp(path.join(root, entry), path.join(clean, entry), {recursive: true});
    }
    await buildSuccessor(clean, plan);
    const mine = listTree(root), theirs = listTree(clean);
    const differences = [];
    for (const file of new Set([...mine, ...theirs])) {
      if (!mine.includes(file)) differences.push('only in clean rebuild: ' + file);
      else if (!theirs.includes(file)) differences.push('only in this tree: ' + file);
      else if (!(await readFile(path.join(root, file))).equals(await readFile(path.join(clean, file)))) differences.push('bytes differ: ' + file);
    }
    assert.deepEqual(differences, [], `${plan.version} is not reproducible from ${base} plus authored inputs:\n  ` + differences.join('\n  '));
    console.log(`\n${plan.version} reproduces byte-for-byte from ${base} plus ${plan.authoredInputs.length} authored inputs.`);
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', clean], {cwd: root});
    await rm(parent, {recursive: true, force: true});
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const planPath = flag('--plan');
  const regenerate = args.includes('--regenerate');
  const artifactsOnly = args.includes('--artifacts-only');
  assert.ok(planPath, 'Usage: release-successor.mjs --plan data/releases/plans/model-release-X.Y.Z.json [--verify [--base REF] | --regenerate --base REF --artifacts-only] [--production]');
  assert.ok(regenerate === artifactsOnly, '--regenerate and --artifacts-only must be supplied together.');
  assert.ok(!(regenerate && args.includes('--verify')), '--regenerate cannot be combined with --verify.');
  assert.ok(!(artifactsOnly && args.includes('--production')), '--artifacts-only cannot be combined with --production.');
  const plan = await readPlan(root, planPath);
  if (regenerate) {
    const base = flag('--base');
    assert.ok(base, '--regenerate requires --base REF.');
    await regenerateArtifacts(plan, base);
  }
  else if (args.includes('--verify')) await verifyReproducible(plan, flag('--base') ?? 'origin/main');
  else {
    await buildSuccessor(root, plan, {production: args.includes('--production')});
    console.log(`\n${plan.version} built. Commit the generated artifacts with the authored inputs, then run with --verify.`);
  }
}
