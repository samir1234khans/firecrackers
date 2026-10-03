import { FAMILIES } from '../engine/catalog.js';
import type { FamilyId } from '../engine/catalog.js';
import { parseRecipe, RECIPE_LIMITS } from './ShowRecipe.js';
import type { ShowRecipe } from './ShowRecipe.js';
export const LIBRARY_KEY='firecrackers.nights.v1';
export const FAVOURITES_KEY='firecrackers.favourites.v1';
export type SavedNight={id:string;recipe:ShowRecipe};
export type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type LibraryRead={nights:SavedNight[];warning:string};
export function readNights(store:Store):LibraryRead {
  try {
    const raw=store.getItem(LIBRARY_KEY);if(!raw)return {nights:[],warning:''};
    if(raw.length>RECIPE_LIMITS.bytes*RECIPE_LIMITS.saved) throw new Error('Saved nights exceed the local size limit. Export or reset the library.');
    const data:unknown=JSON.parse(raw);
    if(!Array.isArray(data)||data.length>RECIPE_LIMITS.saved)throw new Error('Saved nights have an unsupported format. They have not been overwritten.');
    const ids=new Set<string>();
    const nights=data.map((item:unknown)=>{
      if(!item||typeof item!=='object'||!('id'in item)||!('recipe'in item)||typeof item.id!=='string'||!/^[a-z0-9-]{1,60}$/i.test(item.id)||ids.has(item.id))throw new Error('A saved night is invalid. The stored library has been left untouched.');
      ids.add(item.id);return {id:item.id,recipe:parseRecipe(item.recipe)};
    });
    return {nights,warning:''};
  }catch(error){return {nights:[],warning:error instanceof Error?error.message:'Local storage is unavailable. Export recipes to keep them.'};}
}
export function writeNights(store:Store,nights:SavedNight[]):void {
  if(nights.length>RECIPE_LIMITS.saved)throw new Error('Your local library is full (20 nights). Export or remove one first.');
  const ids=new Set<string>();
  const clean=nights.map(n=>{
    if(!/^[a-z0-9-]{1,60}$/i.test(n.id)||ids.has(n.id))throw new Error('Invalid or duplicate saved-night ID.');
    ids.add(n.id);return {id:n.id,recipe:parseRecipe(n.recipe)};
  });
  const text=JSON.stringify(clean);
  if(text.length>RECIPE_LIMITS.bytes*RECIPE_LIMITS.saved)throw new Error('The local library is too large.');
  try{store.setItem(LIBRARY_KEY,text);}catch{throw new Error('This browser could not save the night. Export its recipe file instead. Your existing library was not changed.');}
}
export function readFavourites(store:Store):FamilyId[] {
  try{const raw=store.getItem(FAVOURITES_KEY);if(!raw||raw.length>1024)return[];const data:unknown=JSON.parse(raw);return Array.isArray(data)?FAMILIES.filter(f=>data.includes(f.id)).map(f=>f.id):[];}catch{return[];}
}
export function writeFavourites(store:Store,ids:readonly FamilyId[]):void {
  const clean=FAMILIES.filter(f=>ids.includes(f.id)).map(f=>f.id);
  try{store.setItem(FAVOURITES_KEY,JSON.stringify(clean));}catch{throw new Error('Favourites work for this visit, but this browser could not save them.');}
}
export function browserStore():Store {
  // Accessing window.localStorage itself can throw in a sandbox/private context.
  try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');},removeItem:()=>{throw new Error('Storage unavailable');}};}
}
export function downloadBlob(blob:Blob,name:string):void {
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function exportRecipe(recipe:ShowRecipe):void {downloadBlob(new Blob([JSON.stringify(parseRecipe(recipe),null,2)],{type:'application/json'}),'firecrackers-night.json');}
