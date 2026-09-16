import { useCallback, useEffect, useRef, useState } from 'react';
import { Simulation } from './Simulation';
import { AudioEngine } from './Audio';
import { familyIndex } from './catalog';
import type { Quality, ShowPreset } from './catalog';
import type { Preferences } from '../platform/preferences';
import type { FireworkRenderer } from './Renderer';

export function useWorld(host:React.RefObject<HTMLDivElement|null>,preferences:Preferences,epoch:number,notice:(text:string)=>void) {
  const prefs=useRef(preferences); prefs.current=preferences;
  const [initialSimulation]=useState(()=>new Simulation());
  const sim=useRef(initialSimulation),audio=useRef<AudioEngine|null>(null),renderer=useRef<FireworkRenderer|null>(null);
  const [snapshot,setSnapshot]=useState(()=>sim.current.snapshot());
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[backend,setBackend]=useState('Starting');
  const [soundActive,setSoundActive]=useState(false);
  const alive=useRef(true),soundWanted=useRef(false);
  const refresh=useCallback(()=>setSnapshot(sim.current.snapshot()),[]);
  useEffect(()=> {
    let cancelled=false,frame=0,last=0,lastReport=0,qualityTime=0,slow=0;
    alive.current=true;setReady(false);setError('');setBackend('Starting');
    const state=new Simulation();sim.current=state;
    state.selected=prefs.current.family;state.reducedFlashes=prefs.current.reducedFlashes;
    state.quality=prefs.current.quality==='auto'?'standard':prefs.current.quality;
    const sound=new AudioEngine();audio.current=sound;
    let graphics:FireworkRenderer|null=null;
    const fail=(message:string)=> { if(cancelled)return;state.setPaused(true);sound.stop();setError(message);setReady(false);refresh(); };
    const tick=(now:number)=> {
      if(cancelled)return;
      const dt=last?Math.min(0.1,(now-last)/1000):0;last=now;
      if(!document.hidden && !state.paused) {
        state.advance(dt); sound.consume(state.drainEvents(),state.width);
        try { graphics?.render(); } catch { fail('Graphics were interrupted. Try a lower quality or restart the scene.'); }
        if(prefs.current.quality==='auto' && dt>0) {
          slow=slow*0.97+dt*0.03;
          if(now-qualityTime>5000) {
            qualityTime=now;
            const next:Quality=slow>0.029?'low':'standard';
            if(next!==state.quality) { state.quality=next;graphics?.setQuality(next); }
          }
        }
      }
      if(now-lastReport>100) { lastReport=now;refresh(); }
      frame=requestAnimationFrame(tick);
    };
    const resize=()=>{graphics?.resize();if(state.paused) {try{graphics?.render();}catch{}}};
    const hidden=()=> {last=0;if(document.hidden){state.setPaused(true);state.message='Paused while you were away. Resume when you are ready.';sound.stop();refresh();}};
    window.addEventListener('resize',resize);document.addEventListener('visibilitychange',hidden);
    void import('./Renderer').then(async module=> {
      if(cancelled || !host.current)return;
      const forced=new URLSearchParams(location.search).get('backend')==='webgl';
      graphics=new module.FireworkRenderer(host.current,state,fail,forced);renderer.current=graphics;
      await graphics.init();
      if(cancelled){graphics.dispose();return;}
      setBackend(graphics.backend);setReady(true);refresh();frame=requestAnimationFrame(tick);
    }).catch(()=>fail('Graphics are unavailable. Try lower quality, another browser, or a fresh scene.'));
    return ()=> {cancelled=true;alive.current=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',hidden);sound.dispose();graphics?.dispose();renderer.current=null;};
  },[epoch,host,refresh]);
  useEffect(()=> {
    sim.current.reducedFlashes=preferences.reducedFlashes;
    if(preferences.quality!=='auto') {sim.current.quality=preferences.quality;renderer.current?.setQuality(preferences.quality);}
    if(soundWanted.current) void audio.current?.configure(true,preferences.volume,preferences.haptics,preferences.ambience).then(()=>{if(sim.current.paused||document.hidden)audio.current?.stop();});
    else void audio.current?.configure(false,preferences.volume,preferences.haptics,preferences.ambience);
  },[preferences.quality,preferences.reducedFlashes,preferences.volume,preferences.haptics,preferences.ambience]);
  const configureSound=async(enabled:boolean)=> {
    soundWanted.current=enabled;
    const p=prefs.current;const success=await audio.current?.configure(enabled,p.volume,p.haptics,p.ambience);
    if(sim.current.paused||document.hidden)audio.current?.stop();
    if(alive.current)setSoundActive(Boolean(success));
    if(enabled && !success) {soundWanted.current=false;notice('Sound could not start. Tap the sound control to try again.');}
    return Boolean(success);
  };
  const pause=(value:boolean)=> {
    if(!value && (!ready||error))return;
    sim.current.setPaused(value);if(value)audio.current?.stop();else if(soundWanted.current)void configureSound(true);refresh();
  };
  const start=(preset:ShowPreset)=>{sim.current.startShow(preset);if(soundWanted.current)void configureSound(true);refresh();};
  const ignite=()=>{if(ready&&!error){sim.current.ignite('manual',familyIndex(sim.current.selected));refresh();}};
  const reset=()=>{audio.current?.stop();sim.current.reset();refresh();try{renderer.current?.render();}catch{}};
  return {sim,ready,error,backend,snapshot,soundActive,configureSound,pause,start,ignite,reset,refresh};
}
