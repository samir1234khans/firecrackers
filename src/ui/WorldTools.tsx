import { useEffect, useRef, useState } from 'react';
const NAMES = ['Canoe family', 'Covered longboat family', 'Family launch', 'Family ferry'];
export function WorldTools({focus,nearBoats,watch,depth,setDepth,hidden,crowd,setCrowd,ambient,setAmbient,lively,toggleLively,cadence,setCadence,effects,setEffects,canReplay}:{focus:number|null;nearBoats:readonly number[];watch:(i:number|null)=>void;depth:'near'|'far';setDepth:(d:'near'|'far')=>void;hidden:boolean;crowd:boolean;setCrowd:(v:boolean)=>void;ambient:boolean;setAmbient:(v:boolean)=>void;lively:boolean;toggleLively:()=>void;cadence:number;setCadence:(v:number)=>void;effects:boolean;setEffects:(v:boolean)=>void;canReplay:boolean}) {
 const [open,setOpen]=useState(false);
 const watchButton=useRef<HTMLButtonElement>(null),familySelect=useRef<HTMLSelectElement>(null),previous=useRef<number|null>(null);
 useEffect(()=>{if(!hidden&&focus!==previous.current){if(focus===null)watchButton.current?.focus({preventScroll:true});else familySelect.current?.focus({preventScroll:true});}previous.current=focus;},[focus,hidden]);
 const index=Math.max(0,nearBoats.indexOf(focus??nearBoats[0]));
 return <section className={`world-tools chrome${open?' expanded':''}`} data-stage-control data-world-glass inert={hidden||undefined} aria-hidden={hidden} aria-label="Waterfront tools">
  <button type="button" aria-label="Explore the waterfront" aria-expanded={open} onClick={()=>setOpen(!open)}><span className="world-tools-label">Explore the waterfront <span aria-hidden="true">⌄</span></span><span className="world-tools-compact" aria-hidden="true">≈</span></button>
  {open&&<div className="world-tool-content">{focus===null&&<div className="world-tabs" role="group" aria-label="Launch distance"><button type="button" aria-pressed={depth==='near'} onClick={()=>{watch(null);setDepth('near');}}>Near launch</button><button type="button" aria-pressed={depth==='far'} onClick={()=>{watch(null);setDepth('far');}}>Far shore</button></div>}
   {focus===null?<button ref={watchButton} type="button" onClick={()=>watch(nearBoats[0])}>Watch boats</button>:<><label>Boat view<select ref={familySelect} aria-label="Choose a family" value={focus} onChange={e=>watch(Number(e.target.value))}>{nearBoats.map((id,i)=><option key={id} value={id}>{NAMES[i]}</option>)}</select></label><div className="world-tabs"><button type="button" aria-label="Previous boat" onClick={()=>watch(nearBoats[(index+3)%4])}>←</button><button type="button" aria-label="Next boat" onClick={()=>watch(nearBoats[(index+1)%4])}>→</button><button type="button" onClick={()=>watch(null)}>Return to sky</button></div></>}
   {focus===null&&<><div className="world-tabs" role="group" aria-label="Sky activity"><button type="button" onClick={toggleLively} aria-pressed={lively}>Lively Celebration</button><button type="button" disabled={!canReplay} onClick={()=>window.dispatchEvent(new Event('firecrackers:entrance'))}>Replay opening</button></div>
   <label>Celebration cadence<select value={cadence} onChange={e=>setCadence(Number(e.target.value))}>{['Unhurried','Flowing','Lively','Festival'].map((s,i)=><option key={i} value={i}>{s}</option>)}</select></label>
   <label className="world-check"><input type="checkbox" checked={effects} onChange={e=>setEffects(e.target.checked)}/>Fireworks sound</label>
   <label className="world-check"><input type="checkbox" checked={ambient} onChange={e=>setAmbient(e.target.checked)}/>Instrumental ambience</label>
   <label className="world-check"><input type="checkbox" checked={crowd} onChange={e=>setCrowd(e.target.checked)}/>Audience reactions sound</label><p>Touch the moon, sky or water. Sound follows master mute.</p></>}
  </div>}
 </section>;
}
