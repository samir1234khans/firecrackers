import { useEffect, useState } from 'react';
import { Play, Star, X } from 'lucide-react';
import { FAMILIES, familyIndex } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { browserStore, readFavourites, writeFavourites } from '../experience/NightLibrary';
import { FireworkGlyph } from './FireworkGlyph';
import { FireworkPreview } from './FireworkPreview';
export function FireworkBrowser({selected,onSelect,onLaunch,reducedMotion,reducedFlashes}:{selected:FamilyId;onSelect:(id:FamilyId)=>void;onLaunch:(id:FamilyId)=>void;reducedMotion:boolean;reducedFlashes:boolean}){
  const [collection,setCollection]=useState(Math.floor(familyIndex(selected)/5));
  const [favourites,setFavourites]=useState(()=>readFavourites(browserStore()));
  const [preview,setPreview]=useState<FamilyId|null>(null);
  const [message,setMessage]=useState('');
  useEffect(()=>{const sync=()=>setFavourites(readFavourites(browserStore()));window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  const toggle=(id:FamilyId)=>{const next=favourites.includes(id)?favourites.filter(v=>v!==id):[...favourites,id];setFavourites(next);try{writeFavourites(browserStore(),next);setMessage(favourites.includes(id)?'Removed from favourites.':'Pinned to favourites.');}catch(error){setMessage((error as Error).message);}};
  const effects=collection===3?FAMILIES.filter(f=>favourites.includes(f.id)):FAMILIES.slice(collection*5,collection*5+5);
  return <div className='night-browser'>
    <p className='panel-note'>See what each shell becomes. Preview is silent; Select and Launch are separate actions.</p>
    <div className='studio-tabs' role='group' aria-label='Browse collections'>{['Classics','Grand','Signature','Favourites'].map((name,i)=><button key={name} type='button' aria-pressed={collection===i} onClick={()=>{setCollection(i);setPreview(null);}}>{name}</button>)}</div>
    {message&&<p className='studio-status' role='status'>{message}</p>}
    {!effects.length&&<p className='studio-empty'>Your quick shelf is empty. Pin an effect from any collection to keep it here.</p>}
    {effects.map(f=><article key={f.id} className='effect-card' data-effect-card={f.id}>
      <div className='effect-card-heading'><span className='effect-thumbnail'><FireworkGlyph family={f.id} color={f.color}/></span><div><h3>{f.name}</h3><p>{f.note}</p>{selected===f.id&&<small className='selected-label'>Selected for the next launch</small>}</div><button type='button' className='studio-icon' aria-label={`${favourites.includes(f.id)?'Unpin':'Pin'} ${f.name}`} aria-pressed={favourites.includes(f.id)} onClick={()=>toggle(f.id)}><Star size={18} fill={favourites.includes(f.id)?'currentColor':'none'}/></button></div>
      <div className='effect-actions'><button type='button' className='secondary-button' aria-expanded={preview===f.id} onClick={()=>setPreview(preview===f.id?null:f.id)}>{preview===f.id?<X size={14}/>:<Play size={14}/>} {preview===f.id?'Stop preview':'Preview'}</button><button type='button' className='secondary-button' aria-label={`Select ${f.name}`} onClick={()=>onSelect(f.id)}>Select</button><button type='button' className='primary-button' aria-label={`Launch ${f.name}`} onClick={()=>onLaunch(f.id)}>Launch</button></div>
      {preview===f.id&&<FireworkPreview id={f.id} reducedMotion={reducedMotion} reducedFlashes={reducedFlashes}/>}
    </article>)}
  </div>;
}
