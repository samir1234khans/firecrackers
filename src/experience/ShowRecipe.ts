import { CONFIG_VERSION, FAMILIES, BUDGETS, familyReservation } from '../engine/catalog.js';
import type { FamilyId } from '../engine/catalog.js';
import type { LaunchProfile } from '../engine/LaunchProfile.js';
import { SHOW_THEMES, type ShowTheme } from '../engine/CinematicDirector.js';
import { FLIGHT_GRAVITY } from '../engine/LaunchGeometry.js';

export const RECIPE_LIMITS = Object.freeze({ cues: 12, bytes: 12000, link: 8192, saved: 20, history: 25 });
export const PHASES = ['Opening', 'Build-up', 'Finale'] as const;
export type ShowPhase = typeof PHASES[number];
export type ShowCue = { family: FamilyId; position: number; gap: number; phase: ShowPhase };
export type ShowRecipe = { schema: 1; engine: string; name: string; seed: number; kind: 'cues' | 'finale'; theme?: ShowTheme; cues: ShowCue[] };
const familySet = new Set<string>(FAMILIES.map(f => f.id));
const ownKeys = (v: object, allowed: readonly string[]) => Object.keys(v).every(k => allowed.includes(k));
const record = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const number = (v: unknown, low: number, high: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= low && v <= high;
/** A whitelist parser, never a settings merge. Imported data cannot change user comfort or fetch assets. */
export function inspectRecipe(input: string | unknown): ShowRecipe {
  if (typeof input === 'string' && new TextEncoder().encode(input).length > RECIPE_LIMITS.bytes) throw new Error('This show file is too large. Maximum 12 KB.');
  let value: unknown;
  try { value = typeof input === 'string' ? JSON.parse(input) : input; } catch { throw new Error('This is not a valid show file.'); }
  if (!record(value) || !ownKeys(value, ['schema','engine','name','seed','kind','cues','theme']) || value.schema !== 1) throw new Error('Unsupported show recipe format.');
  if (typeof value.engine !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]{1,4}$/.test(value.engine)) throw new Error('Invalid show engine version.');
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60 || /[\u0000-\u001f\u007f]/.test(value.name)) throw new Error('Give the show a name of 1–60 readable characters.');
  if (!number(value.seed, 0, 0xffffffff) || !Number.isInteger(value.seed)) throw new Error('The show seed must be an unsigned 32-bit integer.');
  if (!['cues','finale'].includes(String(value.kind)) || !Array.isArray(value.cues) || value.cues.length > RECIPE_LIMITS.cues) throw new Error('A show can contain at most twelve cues.');
  if (value.kind === 'cues' && !value.cues.length || value.kind === 'finale' && value.cues.length) throw new Error('The cue list does not match this show type.');
  if (value.theme !== undefined && (value.kind !== 'finale' || !SHOW_THEMES.includes(value.theme as ShowTheme))) throw new Error('Invalid show theme.');
  let phase = -1;
  const cues = value.cues.map((c: unknown): ShowCue => {
    if (!record(c) || !ownKeys(c,['family','position','gap','phase']) || typeof c.family !== 'string' || !familySet.has(c.family)) throw new Error('A cue names an unknown firework.');
    if (!number(c.position,0,1) || !number(c.gap,0,30) || !PHASES.includes(c.phase as ShowPhase)) throw new Error('A cue has an invalid position, gap or phase.');
    const next = PHASES.indexOf(c.phase as ShowPhase);
    if (next < phase) throw new Error('Keep Opening, Build-up and Finale in that order.');
    phase = next;
    return {family:c.family as FamilyId, position:c.position, gap:Math.round(c.gap*10)/10, phase:c.phase as ShowPhase};
  });
  return {schema:1,engine:value.engine,name:value.name.trim(),seed:value.seed,kind:value.kind as ShowRecipe['kind'],cues,...(value.theme !== undefined ? {theme:value.theme as ShowTheme} : {})};
}
/** Strict playback/import contract: preserving data is not a compatibility claim. */
export function parseRecipe(input: string | unknown): ShowRecipe {
  const recipe = inspectRecipe(input);
  if (recipe.engine !== CONFIG_VERSION) throw new Error(`This recipe uses engine ${recipe.engine}. This build supports ${CONFIG_VERSION}; it will not silently change your show.`);
  return recipe;
}
/** Call only for an explicit 'Adapt a copy' action, never on load or storage writes. */
export function adaptRecipeCopy(input: ShowRecipe): ShowRecipe {
  const original = inspectRecipe(input);
  return parseRecipe({...original, engine: CONFIG_VERSION, name: `${original.name.slice(0,51)} (copy)`});
}
export function newRecipe(name='My night', seed=731): ShowRecipe {
  return {schema:1,engine:CONFIG_VERSION,name,seed,kind:'cues',cues:[
    {family:'gold-willow',position:.32,gap:0,phase:'Opening'},
    {family:'multicolor-peony',position:.68,gap:12,phase:'Build-up'},
    {family:'grand-finale',position:.5,gap:18,phase:'Finale'},
  ]};
}
export const STARTER_NAMES = ['Golden river','Jewel garden','Royal night'] as const;
export function starterRecipe(index: number, seed=731): ShowRecipe {
  const result = newRecipe(STARTER_NAMES[index] ?? STARTER_NAMES[0], seed);
  if (index===1) result.cues = [
    {family:'sapphire-saturn',position:.35,gap:0,phase:'Opening'},
    {family:'ruby-dahlia',position:.65,gap:12,phase:'Build-up'},
    {family:'aurora-crown',position:.5,gap:12,phase:'Finale'},
  ];
  if (index===2) result.cues = [
    {family:'chrysanthemum',position:.4,gap:0,phase:'Opening'},
    {family:'silver-crossette-crackle',position:.65,gap:12,phase:'Build-up'},
    {family:'imperial-crown',position:.5,gap:20,phase:'Finale'},
  ];
  return result;
}
export type PlannedCue = ShowCue & { at: number; flight: number; reserve: number; until: number };
export type RecipePlan = { cues: PlannedCue[]; seconds: number; conflicts: string[] };
/** Conservative interval admission, bounded O(12²). Uses real viewport flight profiles when available.
 * Reservations use Ultra counts and Low active-unit capacity, preserving a recipe through adaptation. */
export function planRecipe(recipe: ShowRecipe, profiles?: readonly (LaunchProfile | undefined)[]): RecipePlan {
  if (recipe.kind==='finale') return {cues:[],seconds:120,conflicts:[]};
  let at=0;
  const cues=recipe.cues.map((cue,i): PlannedCue => {
    at += cue.gap;
    const f=FAMILIES.findIndex(f=>f.id===cue.family), family=FAMILIES[f], profile=profiles?.[i];
    const ground=profile?.ground ?? 16, top=Math.max(ground+10, profile?.apexMax ?? 78);
    const fraction=f>=10?[.28,.22,.31][f-10]:.24;
    const flight=.76+Math.sqrt(2*(top-ground)/(FLIGHT_GRAVITY*(1-fraction)));
    const tail=f>=10?26:f===9?23:f===4?21:family.life*1.08+family.trail+2;
    return {...cue,at,flight,reserve:familyReservation(f),until:at+flight+tail};
  });
  const conflicts:string[]=[];
  for(let i=0;i<cues.length;i++) {
    const cue=cues[i], occupied=cues.slice(0,i).filter(c=>c.until>cue.at);
    const units=FAMILIES.find(f=>f.id===cue.family)!.cost+occupied.filter(c=>c.at+c.flight>cue.at).reduce((n,c)=>n+FAMILIES.find(f=>f.id===c.family)!.cost,0);
    if(units>BUDGETS.low.units) conflicts.push(`Cue ${i+1}: earlier rockets are still in flight. Increase its gap.`);
    if(occupied.reduce((n,c)=>n+c.reserve,0)+cue.reserve>3072) conflicts.push(`Cue ${i+1}: leave more room for the preceding shells and their secondary breaks.`);
    if(i && cue.gap<3) conflicts.push(`Cue ${i+1}: use at least a 3-second gap to preserve the reduced-flash launch spacing.`);
  }
  return {cues,seconds:Math.ceil(Math.max(0,...cues.map(c=>c.until))+6),conflicts};
}
export function spaceRecipe(recipe: ShowRecipe): ShowRecipe {
  return {...recipe,cues:recipe.cues.map((c,i)=>({...c,gap:i?30:0}))};
}
export function recipeLink(recipe: ShowRecipe, origin: string): string {
  const bytes=new TextEncoder().encode(JSON.stringify(parseRecipe(recipe)));
  const payload=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if(payload.length>RECIPE_LIMITS.link) throw new Error('This show is too large for a link. Export its recipe file instead.');
  const url=new URL(origin);url.search='';url.hash=`night=${payload}`;return url.href;
}
export function recipeFromHash(hash: string): ShowRecipe | null {
  if(!hash.startsWith('#night=')) return null;
  const input=hash.slice(7);
  if(input.length>RECIPE_LIMITS.link || !/^[A-Za-z0-9_-]+$/.test(input)) throw new Error('Invalid or oversized show link.');
  try { return parseRecipe(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(input.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))); }
  catch(error) { throw error instanceof Error ? error : new Error('Invalid show link.'); }
}
export function formatDuration(seconds: number) { const s=Math.max(0,Math.floor(seconds));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
