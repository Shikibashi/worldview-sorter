const channels=['development','internal','preview','beta','stable'];
const flagNames=['adaptiveClarification','affinityDisplay','sharing','feedback'];
const insist=(condition,message)=>{if(!condition)throw Error('Release channel: '+message);};

export function validateReleaseChannels(config,current){
 insist(config?.schemaVersion==='worldview-release-channels-1','unknown configuration');
 insist(config.channels&&Object.keys(config.channels).length===channels.length&&
  channels.every(name=>Object.hasOwn(config.channels,name)),'all five named channels are required');
 const known=new Set((current.modelReleaseVersions??[]).map(ref=>ref.version));
 for(const [name,entry] of Object.entries(config.channels)){
  insist(known.has(entry.modelReleaseVersion),'unknown model release on '+name);
  insist(entry.features&&Object.keys(entry.features).length===flagNames.length&&
   flagNames.every(flag=>typeof entry.features[flag]==='boolean'),'invalid feature flags on '+name);
 }
 return config;
}
export function selectReleaseChannel(config,current,channel,{feedbackStoreAvailable=false}={}){
 validateReleaseChannels(config,current);
 insist(channels.includes(channel),'unknown channel '+channel);
 const entry=config.channels[channel];
 // A channel is a deployment boundary: all server and browser artifacts must be from its selected manifest.
 insist(entry.modelReleaseVersion===current.modelRelease.version,
  'deployment content does not match '+channel+' manifest; deploy the complete versioned bundle');
 return {channel,modelReleaseVersion:entry.modelReleaseVersion,
  features:{...entry.features,feedback:entry.features.feedback&&feedbackStoreAvailable}};
}
export const RELEASE_CHANNELS=Object.freeze(channels);
