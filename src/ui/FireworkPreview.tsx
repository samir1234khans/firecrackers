import { useEffect, useRef, useState } from 'react';
import { Simulation } from '../engine/Simulation';
import type { FamilyId } from '../engine/catalog';
import { familyIndex } from '../engine/catalog';
/** One explicitly started, silent preview simulation. Never touches the main world's selection or clock. */
export function FireworkPreview({id,reducedMotion,reducedFlashes}:{id:FamilyId;reducedMotion:boolean;reducedFlashes:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const [finished,setFinished]=useState(false);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!element||!ctx)return;
    setFinished(false);
    const sim=new Simulation(731);sim.quality='low';sim.reducedFlashes=reducedFlashes;
    sim.burstAt(id,0,45,familyIndex(id)>=10?.60:.75);
    let frame=0,last=0,drawn=0,stopped=false;
    const point=(x:number,y:number,z:number)=>{const p=170/Math.max(80,170+z);return [160+x*1.5*p,104-(y-45)*1.5*p] as const;};
    const render=()=>{
      ctx.clearRect(0,0,320,210);ctx.fillStyle='#050b14';ctx.fillRect(0,0,320,210);
      ctx.globalCompositeOperation='lighter';
      const t=sim.trails,stride=Math.max(1,Math.ceil(t.count/1000));
      for(let i=0;i<t.count;i+=stride){
        const a=point(t.ax[i],t.ay[i],t.az[i]),b=point(t.bx[i],t.by[i],t.bz[i]);
        ctx.strokeStyle=`rgba(${Math.round(t.r[i]*255)},${Math.round(t.g[i]*255)},${Math.round(t.b[i]*255)},${Math.max(0,1-t.age[i]/t.life[i])*.65})`;
        ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
      }
      const h=sim.heads;
      for(let i=0;i<h.count;i++){
        const [x,y]=point(h.x[i],h.y[i],h.z[i]),alpha=Math.max(0,1-h.age[i]/h.life[i]);
        ctx.fillStyle=`rgba(${Math.round(h.r[i]*255)},${Math.round(h.g[i]*255)},${Math.round(h.b[i]*255)},${alpha*.18})`;
        ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=`rgba(255,245,225,${alpha*.85})`;ctx.fillRect(x-.65,y-.65,1.3,1.3);
      }
      ctx.globalCompositeOperation='source-over';
    };
    const stop=()=>{stopped=true;cancelAnimationFrame(frame);setFinished(true);};
    const tick=(now:number)=>{if(stopped)return;if(last)sim.advance(Math.min(.05,(now-last)/1000));last=now;
      if(now-drawn>1000/24){render();drawn=now;}
      sim.drainEvents();if(sim.time>=16||sim.time>1&&!sim.heads.count&&!sim.cues.length&&!sim.trails.count){stop();return;}frame=requestAnimationFrame(tick);
    };
    const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);
    if(reducedMotion){for(let i=0;i<90;i++)sim.advance(1/60);render();setFinished(true);}else frame=requestAnimationFrame(tick);
    return()=>{stopped=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);sim.reset();};
  },[id,reducedMotion,reducedFlashes]);
  return <figure className='effect-preview'><canvas ref={canvas} width={320} height={210} aria-label='Silent preview of the selected firework'/><figcaption>{reducedMotion?'Still preview · reduced motion':finished?'Preview finished':'Preview only · no audio'}</figcaption></figure>;
}
