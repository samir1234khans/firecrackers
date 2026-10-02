import { paceValue, type AlwaysPace } from '../engine/AlwaysPlayDirector.js';
import { themeValue, endlessThemeValue, type ShowTheme, type EndlessTheme } from '../engine/CinematicDirector.js';
import { FAMILIES } from '../engine/catalog.js';
import type { FamilyId, Quality, ShowPreset } from '../engine/catalog.js';
export const STORAGE_KEY='firecrackers.preferences.v1';
export type Preferences={version:4;finaleTheme:ShowTheme;endlessTheme:EndlessTheme;showMusic:boolean;musicVolume:number;alwaysPace:AlwaysPace;family:FamilyId;quality:Quality|'auto';sound:boolean;volume:number;haptics:boolean;ambience:boolean;reducedMotion:boolean;reducedFlashes:boolean;onboarded:boolean;preset:ShowPreset;placement:number;placementMode:'fixed'|'random'};
export function defaults():Preferences {
  return {version:4,finaleTheme:'prismatic',endlessTheme:'cycle',showMusic:false,musicVolume:.30,alwaysPace:2,family:'gold-willow',quality:'ultra',sound:false,volume:0.45,haptics:false,ambience:false,
    reducedMotion:typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    reducedFlashes:true,onboarded:false,preset:'festival',placement:.5,placementMode:'fixed'};
}
export function loadPreferences():Preferences {
  const safe=defaults();
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(!data || ![1,2,3,4].includes(data.version)) return safe;
    for(const key of ['sound','haptics','ambience','reducedMotion','reducedFlashes','onboarded'] as const) if(typeof data[key]==='boolean') safe[key]=data[key];
    if(FAMILIES.some(f=>f.id===data.family)) safe.family=data.family;
    if(['auto','low','standard','ultra'].includes(data.quality)) safe.quality=data.version===1&&data.quality==='auto'?'ultra':data.quality;
    safe.alwaysPace=paceValue(data.alwaysPace);
    if(data.version===4) {
      safe.finaleTheme=themeValue(data.finaleTheme);
      safe.endlessTheme=data.endlessTheme===undefined?'cycle':endlessThemeValue(data.endlessTheme);
      safe.showMusic=data.showMusic===true;
      if(typeof data.musicVolume==='number'&&Number.isFinite(data.musicVolume))safe.musicVolume=Math.max(0,Math.min(.8,data.musicVolume));
    }
    if(['calm','festival','finale','always'].includes(data.preset)) safe.preset=data.version===1&&data.preset==='calm'?'festival':data.preset;
    if(typeof data.volume==='number' && Number.isFinite(data.volume)) safe.volume=Math.max(0,Math.min(0.8,data.volume));
    if(typeof data.placement==='number' && Number.isFinite(data.placement)) safe.placement=Math.max(0,Math.min(1,data.placement));
    if(data.placementMode==='random') safe.placementMode='random';
  } catch { /* Private browsing and corrupt storage must not prevent play. */ }
  return safe;
}
export function savePreferences(p:Preferences) { try {localStorage.setItem(STORAGE_KEY,JSON.stringify(p));return true;} catch {return false;} }
