// Build a successor model release from authored inputs, deterministically.
//
//   node scripts/release-successor.mjs --plan data/releases/plans/model-release-1.20.0.json
//   node scripts/release-successor.mjs --plan ... --verify [--base origin/main]
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
import {spawnSync} from 'node:child_process';
import {cp, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const flag = name => args.includes(name) ? args[args.indexOf(name) + 1] : null;

const TOOLING = ['scripts', 'packages', 'schemas', 'apps', 'package.json', 'package-lock.json'];

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

export async function buildSuccessor(treeRoot, plan, {production = false} = {}) {
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
  run(treeRoot, 'node', ['scripts/model-governance.mjs', 'verify'], 'verify');
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
  .filter(file => !file.startsWith('node_modules/') && !file.startsWith('dist/') && !file.startsWith('.git/')).sort();

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
  assert.ok(planPath, 'Usage: release-successor.mjs --plan data/releases/plans/model-release-X.Y.Z.json [--verify [--base REF]] [--production]');
  const plan = await readPlan(root, planPath);
  if (args.includes('--verify')) await verifyReproducible(plan, flag('--base') ?? 'origin/main');
  else {
    await buildSuccessor(root, plan, {production: args.includes('--production')});
    console.log(`\n${plan.version} built. Commit the generated artifacts with the authored inputs, then run with --verify.`);
  }
}
