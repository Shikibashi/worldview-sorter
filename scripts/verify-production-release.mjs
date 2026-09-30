import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProductionRelease} from '../packages/runtime/release-validation.js';
const repoRoot=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
console.log(JSON.stringify(await verifyProductionRelease(repoRoot)));
