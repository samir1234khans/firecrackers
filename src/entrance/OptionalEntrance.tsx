import { useEffect, useRef } from 'react';
import { welcomeBackground } from './background';
import './entrance.css';
export function OptionalEntrance({enter}:{enter:(opening:boolean)=>void}) {
 const cover=useRef<HTMLElement>(null), calm=useRef<HTMLInputElement>(null);
 useEffect(()=>{const film=welcomeBackground(cover.current!,calm.current!,'en');return()=>film.destroy();},[]);
 return <main ref={cover} className="night-entrance" aria-label="Firecrackers night entrance"><div className="night-entrance-art" aria-hidden="true"><span className="entrance-moon"/><span className="entrance-water"/></div><section className="entrance-copy"><p className="entrance-kicker">A living waterfront</p><h1>Firecrackers</h1><p>A moonlit sky. A hundred possibilities.</p><div className="entrance-actions"><button type="button" onClick={()=>enter(true)}>Open the night ↗</button><button type="button" onClick={()=>enter(false)}>Skip to play</button></div><label><input ref={calm} type="checkbox"/>Still background</label><p className="entrance-note">Sound stays off until you enable it. Opening the scene prepares the actual graphics.</p></section></main>;
}
