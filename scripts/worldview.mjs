import {readFile} from 'node:fs/promises';
import {compareWorldview,planWorldviewFollowups} from '../packages/worldview/index.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
try{
 const [command,file,budget]=process.argv.slice(2);
 if(!['compare','followups'].includes(command)||!file)throw Error('Usage: node scripts/worldview.mjs compare|followups <raw-responses.json> [budget]');
 const current=await read('data/current.json');
 if(!current.worldviewModel)throw Error('Run npm run build:academic first.');
 const args={model:await read(current.worldviewModel.path),bank:await read(current.candidateBank.path),scalesDoc:await read('data/response-scales.json'),input:JSON.parse(await readFile(file,'utf8'))};
 const result=command==='compare'?compareWorldview(args):planWorldviewFollowups({...args,maxItems:budget===undefined?12:Number(budget)});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch(e){process.stderr.write(e.name+': '+e.message+'\n');process.exitCode=1;}
