import { FAMILIES } from '../engine/catalog';
import type { FamilyId, Quality, ShowPreset } from '../engine/catalog';
export const STORAGE_KEY='firecrackers.preferences.v1';
export type Preferences={version:2;family:FamilyId;quality:Quality|'auto';sound:boolean;volume:number;haptics:boolean;ambience:boolean;reducedMotion:boolean;reducedFlashes:boolean;onboarded:boolean;preset:ShowPreset};
export function defaults():Preferences {
  return {version:2,family:'gold-willow',quality:'ultra',sound:false,volume:0.45,haptics:false,ambience:false,
    reducedMotion:typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    reducedFlashes:true,onboarded:false,preset:'festival'};
}
export function loadPreferences():Preferences {
  const safe=defaults();
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(!data || ![1,2].includes(data.version)) return safe;
    for(const key of ['sound','haptics','ambience','reducedMotion','reducedFlashes','onboarded'] as const) if(typeof data[key]==='boolean') safe[key]=data[key];
    if(FAMILIES.some(f=>f.id===data.family)) safe.family=data.family;
    if(['auto','low','standard','ultra'].includes(data.quality)) safe.quality=data.version===1&&data.quality==='auto'?'ultra':data.quality;
    if(['calm','festival','finale'].includes(data.preset)) safe.preset=data.version===1&&data.preset==='calm'?'festival':data.preset;
    if(typeof data.volume==='number' && Number.isFinite(data.volume)) safe.volume=Math.max(0,Math.min(0.8,data.volume));
  } catch { /* Private browsing and corrupt storage must not prevent play. */ }
  return safe;
}
export function savePreferences(p:Preferences) { try {localStorage.setItem(STORAGE_KEY,JSON.stringify(p));return true;} catch {return false;} }
