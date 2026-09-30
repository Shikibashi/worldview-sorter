import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),
 flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const stable=flag('--stable'),beta=flag('--beta'),fixtures=flag('--fixtures');
if(!stable||!beta||!fixtures)throw Error('Use --stable MANIFEST --beta MANIFEST --fixtures SYNTHETIC_DIRECTORY.');
const names=(await readdir(fixtures)).filter(name=>name.endsWith('.json')).sort();
if(!names.length)throw Error('No synthetic session fixtures found.');
const results=[];
for(const name of names){const processResult=spawnSync(process.execPath,['scripts/preview-model-impact.mjs',
 '--from',stable,'--to',beta,'--session',path.join(fixtures,name)],{cwd:root,encoding:'utf8'});
 if(![0,2].includes(processResult.status))throw Error(name+': '+processResult.stderr);
 const result=JSON.parse(processResult.stdout);
 results.push({fixture:name,...result});}
console.log(JSON.stringify({schemaVersion:'worldview-release-comparison-1',stable,beta,
 note:'Synthetic software regression only. Differences require explanation; this is not empirical validation.',results},null,2));
if(results.some(result=>!result.comparable))process.exitCode=2;
