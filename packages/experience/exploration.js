// Post-quiz exploration only. No imports, response values, speed, ideological
// labels, score vectors, consistency judgments, or questionnaire mutations.
export const GAME_POLICY_VERSION='post-quiz-1';
const domains=new Set(['ME','NE','MF','VA','EP','OM','MS','AH','RC','EX','SO','PL']);
const empty=()=>({version:GAME_POLICY_VERSION,finished:false,topics:[],sourceOpened:false,awards:[]});
export function initialExploration(){return empty();}
export function recordExploration(state,event,{enabled=false}={}){
 if(!event||typeof event!=='object'||Array.isArray(event))throw new Error('Expected an exploration event.');
 const allowed=event.type==='topic_opened'?['type','domainId']:['type'];
 if(Object.keys(event).some(k=>!allowed.includes(k)))throw new Error('Game events must not contain answers, scores, identifiers or timing.');
 if(!['quiz_finished','topic_opened','source_opened'].includes(event.type))throw new Error('Unsupported exploration event.');
 if(event.type==='topic_opened'&&!domains.has(event.domainId))throw new Error('Unknown topic.');
 if(state?.version!==GAME_POLICY_VERSION)throw new Error('Unsupported exploration state.');
 if(!enabled)return structuredClone(state);
 const next=structuredClone(state);
 if(event.type==='quiz_finished')next.finished=true;
 else if(!next.finished)throw new Error('Exploration awards are unavailable during the quiz.');
 else if(event.type==='topic_opened')next.topics=[...new Set([...next.topics,event.domainId])].sort();
 else next.sourceOpened=true;
 next.awards=[...(next.finished?['map-opened']:[]),...(next.topics.length>=3?['three-topics-explored']:[]),...(next.sourceOpened?['source-reader']:[])];
 return next;
}

// Optional activity record. This is deliberately separate from quiz/session
// state and accepts no answer, score, elapsed time, or philosophical result.
export const EXPLORATION_VERSION='exploration-2';
const activityTypes={completed:['routeId'],domain_opened:['domainId'],tradition_opened:['traditionId'],
 source_opened:['domainId'],tradition_source_opened:['traditionId'],unresolved_opened:['domainId'],reading_opened:['domainId']};
const slug=value=>typeof value==='string'&&/^[a-z0-9_-]{2,80}$/i.test(value);
export function initialExplorationV2(){return {version:EXPLORATION_VERSION,finished:false,domains:[],traditions:[],
 sourceDomains:[],sourceTraditions:[],unresolvedDomains:[],readingDomains:[],routes:[],milestones:[]};}
export function recordExplorationV2(state,event){
 if(state?.version!==EXPLORATION_VERSION||!event||!Object.hasOwn(activityTypes,event.type))throw Error('Unsupported exploration event or state.');
 const allowed=['type',...activityTypes[event.type]];
 if(Object.keys(event).some(key=>!allowed.includes(key))||activityTypes[event.type].some(key=>!slug(event[key])))
  throw Error('Exploration events contain activity only.');
 if(event.domainId&&!domains.has(event.domainId))throw Error('Unknown domain.');
 if(event.routeId&&!['quick','standard','full'].includes(event.routeId))throw Error('Unknown route.');
 if(event.type!=='completed'&&!state.finished)throw Error('Complete a route before recording exploration.');
 const next=structuredClone(state),add=(key,value)=>{next[key]=[...new Set([...next[key],value])].sort();};
 if(event.type==='completed'){next.finished=true;add('routes',event.routeId);}
 if(event.type==='domain_opened')add('domains',event.domainId);
 if(event.type==='tradition_opened')add('traditions',event.traditionId);
 if(event.type==='source_opened')add('sourceDomains',event.domainId);
 if(event.type==='tradition_source_opened')add('sourceTraditions',event.traditionId);
 if(event.type==='unresolved_opened')add('unresolvedDomains',event.domainId);
 if(event.type==='reading_opened')add('readingDomains',event.domainId);
 next.milestones=[...(next.domains.length===domains.size?['all-domains-explored']:[]),
  ...(next.sourceDomains.length||next.sourceTraditions.length?['source-trail-opened']:[]),
  ...(next.traditions.length>=2?['two-traditions-inspected']:[]),
  ...(next.unresolvedDomains.length?['open-question-inspected']:[]),
  ...(next.routes.length>=2?['multiple-depths-explored']:[])];
 return next;
}
