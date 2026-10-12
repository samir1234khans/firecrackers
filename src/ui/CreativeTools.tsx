import { useRef, useState } from 'react';
import type { ShowCue } from '../experience/ShowRecipe';
import { SKY_ART_LIMITS, skyTextPaths, validateSkyText } from '../experience/SkyArt';
import type { LightPoint, LightStroke } from '../experience/SkyArt';

export function CreativeTools({add,preview}:{add:(cue:ShowCue)=>void;preview:(cue:ShowCue)=>void}) {
 const [text,setText]=useState('FIRECRACKERS'),[strokes,setStrokes]=useState<LightStroke[]>([]),[error,setError]=useState('');
 const active=useRef<LightStroke|null>(null),[cursor,setCursor]=useState<LightPoint>([.5,.25]);
 const [drawing,setDrawing]=useState(false);
 const points=strokes.reduce((n,s)=>n+s.length,0);
 const cue=(type:'text'|'drawing'):ShowCue=>({type,family:'gold-willow',position:.5,gap:0,phase:'Opening',...(type==='text'?{text:validateSkyText(text)}:{strokes:strokes.map(s=>s.map(p=>[...p] as LightPoint))})});
 const act=(type:'text'|'drawing',play:boolean)=>{try{setError('');const c=cue(type);if(type==='drawing'&&!strokes.some(s=>s.length>1))throw new Error('Draw a stroke first.');(play?preview:add)(c);}catch(e){setError((e as Error).message);}};
 let textPaths:LightStroke[]=[];try{textPaths=skyTextPaths(text);}catch{/* Validation is reported by the action. */}
 const push=(p:LightPoint,begin=false)=>{
  if(begin){if(strokes.length>=24)return;active.current=[p];setStrokes(s=>[...s,active.current!]);}
  else if(active.current && points<256 && Math.hypot(p[0]-active.current.at(-1)![0],p[1]-active.current.at(-1)![1])>.008){active.current.push(p);setStrokes(s=>[...s]);}
 };
 return <details className="creative-tools"><summary>Sky writing & draw with light</summary>
  <label className="studio-field">Sky lettering<textarea aria-label="Sky lettering" value={text} rows={2} maxLength={24} onChange={e=>setText(e.target.value)} aria-describedby="sky-text-help"/></label>
  <p id="sky-text-help" className="fine-print">24 characters, two lines. Letters, digits and basic punctuation. Preview uses real light in the sky.</p>
  <svg className="sky-art-preview" viewBox="0 0 1000 450" role="img" aria-label={`Lettering preview: ${text}`}><title>{text}</title>{textPaths.map((p,i)=><polyline key={i} points={p.map(([x,y])=>`${x*1000},${y*1000}`).join(' ')} />)}</svg>
  <div className="button-row"><button className="secondary-button" type="button" onClick={()=>act('text',true)}>Preview lettering</button><button className="text-button" type="button" onClick={()=>act('text',false)}>Add lettering cue</button></div>
  <p id="drawing-help" className="fine-print">Draw below. Keyboard: arrows move, Space starts a stroke, Enter ends it, Escape cancels the current stroke. {points}/{SKY_ART_LIMITS.points} points.</p>
  <svg className="sky-art-preview drawing-pad" viewBox="0 0 1000 450" tabIndex={0} role="application" aria-label="Draw with light" aria-describedby="drawing-help"
   onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();push([.08+.84*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),.1+.3*Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))],true);setDrawing(true);}}
   onPointerMove={e=>{if(!drawing)return;e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();push([.08+.84*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),.1+.3*Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]);}}
   onPointerUp={()=>{active.current=null;setDrawing(false);setStrokes(s=>s.filter(p=>p.length>1));}}
   onPointerCancel={()=>{active.current=null;setDrawing(false);setStrokes(s=>s.filter(p=>p.length>1));}}
   onKeyDown={e=>{e.stopPropagation();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','Escape'].includes(e.key))e.preventDefault();
    if(e.key===' '){push(cursor,true);setDrawing(true);}else if(e.key==='Enter'){active.current=null;setDrawing(false);setStrokes(s=>s.filter(p=>p.length>1));}
    else if(e.key==='Escape'){if(active.current)setStrokes(s=>s.filter(p=>p!==active.current));active.current=null;setDrawing(false);}
    else if(e.key.startsWith('Arrow')){const p:LightPoint=[Math.max(.08,Math.min(.92,cursor[0]+(e.key==='ArrowRight'?.01:e.key==='ArrowLeft'?-.01:0))),Math.max(.1,Math.min(.4,cursor[1]+(e.key==='ArrowDown'?.01:e.key==='ArrowUp'?-.01:0)))];setCursor(p);if(drawing)push(p);}}}>
   {strokes.map((s,i)=><polyline key={i} points={s.map(([x,y])=>`${x*1000},${y*1000}`).join(' ')}/>)}<circle cx={cursor[0]*1000} cy={cursor[1]*1000} r={5} fill="white"/>
  </svg>
  <div className="button-row"><button className="text-button" type="button" disabled={!strokes.length} onClick={()=>{active.current=null;setDrawing(false);setStrokes(s=>s.slice(0,-1));}}>Undo stroke</button><button className="text-button" type="button" onClick={()=>{active.current=null;setDrawing(false);setStrokes([]);}}>Clear drawing</button><button className="secondary-button" type="button" onClick={()=>act('drawing',true)}>Preview drawing</button><button className="text-button" type="button" onClick={()=>act('drawing',false)}>Add drawing cue</button></div>
  <button className="text-button" type="button" onClick={()=>add({type:'group',group:['gold-willow','multicolor-peony','gold-willow'],family:'gold-willow',position:.5,gap:0,phase:'Opening'})}>Add mirrored round</button>
  {error&&<p role="alert">{error}</p>}
 </details>;
}
