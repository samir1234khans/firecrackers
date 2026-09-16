const KEY='firecrackers.preferences.v1';
export const DEFAULTS=Object.freeze({selected:'gold-willow',volume:.45,ambience:false,haptics:false,quality:'auto',reduced:false,tapIgnition:false,keepAwake:false,mode:'festival',onboarded:false});
const IDS=['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'];
export function sanitizePreferences(value,reduceMotion=false){
  const p=value&&typeof value==='object'?value:{};
  return {selected:IDS.includes(p.selected)?p.selected:DEFAULTS.selected,
    volume:Number.isFinite(p.volume)?Math.min(1,Math.max(0,p.volume)):DEFAULTS.volume,
    quality:['auto','low','standard','ultra'].includes(p.quality)?p.quality:'auto',
    mode:['calm','festival','finale'].includes(p.mode)?p.mode:'festival',
    reduced:reduceMotion||p.reduced===true,ambience:p.ambience===true,haptics:p.haptics===true,
    tapIgnition:p.tapIgnition===true,keepAwake:p.keepAwake===true,onboarded:p.onboarded===true};
}
export function loadPreferences(){
  const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{return sanitizePreferences(JSON.parse(localStorage.getItem(KEY)||'null'),reduce);}catch{return sanitizePreferences(null,reduce);}
}
export function savePreferences(p){try{localStorage.setItem(KEY,JSON.stringify(sanitizePreferences(p)));return true;}catch{return false;}}

export class WakeLockManager {
  constructor(){this.enabled=false;this.lock=null;this.generation=0;}
  async set(enabled){
    this.enabled=enabled;const generation=++this.generation;
    if(this.lock){try{await this.lock.release();}catch{ /* It may already be released. */ }this.lock=null;}
    if(!enabled)return {ok:true};
    if(!('wakeLock'in navigator))return {ok:false,reason:'Keeping the screen awake is not supported in this browser.'};
    if(document.hidden)return {ok:false,reason:'The screen can stay awake only while this tab is visible.'};
    try{
      const lock=await navigator.wakeLock.request('screen');
      if(generation!==this.generation||!this.enabled){await lock.release();return {ok:false};}
      this.lock=lock;return {ok:true};
    }catch{return {ok:false,reason:'Screen wake lock was declined. Check your device’s power settings.'};}
  }
  dispose(){void this.set(false);}
}
export async function toggleFullscreen(element){
  try{
    if(document.fullscreenElement){await document.exitFullscreen();return {ok:true,active:false};}
    if(!element.requestFullscreen)return {ok:false,reason:'Fullscreen is not available here. An installed app can use the whole screen.'};
    await element.requestFullscreen();return {ok:true,active:true};
  }catch{return {ok:false,reason:'Fullscreen was declined by the browser.'};}
}
