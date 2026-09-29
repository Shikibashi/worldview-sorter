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
