import {access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFeedbackStore} from '../packages/beta/feedback.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const [command,...args]=process.argv.slice(2),flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const directory=flag('--store')??process.env.WORLDVIEW_FEEDBACK_DIR;
if(!directory||!path.isAbsolute(directory))throw Error('Use --store ABSOLUTE_PRIVATE_DIRECTORY or WORLDVIEW_FEEDBACK_DIR.');
const store=createFeedbackStore({directory});
const output=value=>console.log(JSON.stringify(value,null,2));
if(command==='list'){
 const reports=await store.list();const rows=[];
 for(const report of reports){const review=await store.getReview(report.feedbackId);
  rows.push({feedbackId:report.feedbackId,receivedAt:report.receivedAt,kind:report.kind,category:report.category,
   target:report.context.itemId??report.context.propositionId??report.context.traditionId??report.context.location,
   modelReleaseVersion:report.context.modelReleaseVersion,status:review.status,severity:review.severity??null,
   triageClass:review.triageClass??null});}
 output(rows.sort((a,b)=>a.receivedAt.localeCompare(b.receivedAt)));
}else if(command==='show'){
 const id=flag('--id');if(!id)throw Error('Use show --id FEEDBACK_ID.');
 output({report:await store.get(id),review:await store.getReview(id)});
}else if(command==='triage'){
 const id=flag('--id'),status=flag('--status'),triageClass=flag('--class'),severity=flag('--severity'),
  note=flag('--note'),proposalId=flag('--proposal');
 if(!id||!status||!triageClass||!severity||!note)throw Error('Use triage --id ID --status STATUS --class CLASS --severity SEVERITY --note TEXT.');
 if(status==='proposal_opened')await access(path.join(root,'data/governance/proposals',proposalId+'.json'));
 output(await store.review({id,status,triageClass,severity,note,proposalId}));
}else if(command==='hotspots'){
 const reports=await store.list(),groups=new Map();
 for(const report of reports){const c=report.context,target=c.itemId??c.propositionId??c.traditionId??c.location;
  const key=[report.kind,report.category,target,c.modelReleaseVersion,c.localizationBundleVersion??''].join('|');
  const row=groups.get(key)??{kind:report.kind,category:report.category,target,
   modelReleaseVersion:c.modelReleaseVersion,localizationBundleVersion:c.localizationBundleVersion??null,count:0};
  row.count++;groups.set(key,row);}
 output({note:'Report volume prioritizes review; it does not establish philosophical truth.',
  hotspots:[...groups.values()].sort((a,b)=>b.count-a.count||a.target.localeCompare(b.target))});
}else throw Error('Use list, show, triage, or hotspots. Local filesystem access is the reviewer boundary.');
