import { Simulation, FixedClock, QUALITIES } from './core.js';
import { createRenderer } from './renderer.js';
import { FireworkAudio } from './audio.js';
import { WakeLockManager } from '../platform/preferences.js';

/** Application lifecycle bridge. React receives four small snapshots per second, never particle buffers. */
export class Experience {
  constructor(host,{preferences,onSnapshot=(snapshot)=>{},onEvent=(event)=>{},onError=(message)=>{}}){
    this.host=host;this.preferences=preferences;this.onSnapshot=onSnapshot;this.onEvent=onEvent;this.onError=onError;
    this.sim=new Simulation({quality:preferences.quality==='auto'?'standard':preferences.quality,reduced:preferences.reduced});
    this.clock=new FixedClock();this.audio=new FireworkAudio();this.wake=new WakeLockManager();
    this.renderer=null;this.paused=false;this.disposed=false;this.frameId=0;this.lastSnapshot=0;
    this.lastFrame=0;this.ema=16.67;this.slowFrames=0;this.generation=0;this.observer=null;
    this.visibility=()=>{if(document.hidden)this.pause(true);};
    document.addEventListener('visibilitychange',this.visibility);
    this.audio.setPreferences({volume:preferences.volume,ambience:preferences.ambience,haptics:preferences.haptics});
  }
  async initialize(preference='auto'){
    const generation=++this.generation;
    cancelAnimationFrame(this.frameId);
    if(this.renderer){this.renderer.dispose();this.renderer=null;}
    this.observer?.disconnect();
    try{
      const renderer=await createRenderer(this.host,{preference,onLost:(message)=>{if(!this.disposed){this.pause(true);this.onError(message);}}});
      if(this.disposed||generation!==this.generation){renderer.dispose();return;}
      this.renderer=renderer;
      if(renderer.backend==='Canvas 2D'&&this.preferences.quality==='auto')this.sim.setQuality('low');
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);this.resize();
      this.paused=false;this.clock.reset();this.publish();this.frameId=requestAnimationFrame(this.loop);
    }catch(error){if(!this.disposed)this.onError(error instanceof Error?error.message:'Graphics could not start.');}
  }
  resize(){
    if(!this.renderer)return;
    const rect=this.host.getBoundingClientRect();
    this.sim.aspect=Math.max(.3,rect.width/Math.max(1,rect.height));
    this.renderer.resize(rect.width,rect.height,Math.min(window.devicePixelRatio||1,QUALITIES[this.sim.quality].dpr));
    this.renderer.render(this.sim);
  }
  loop=(now)=>{
    if(this.disposed||this.paused||!this.renderer)return;
    try{
      const delta=this.lastFrame?now-this.lastFrame:16.67;this.lastFrame=now;
      if(delta<200)this.ema=this.ema*.96+delta*.04;
      this.clock.advance(now,(dt)=>this.sim.tick(dt));
      for(const event of this.sim.drainEvents()){this.audio.handle(event,this.sim.aspect);this.onEvent(event);}
      this.renderer.render(this.sim);
      if(this.preferences.quality==='auto'){
        this.slowFrames=this.ema>28?this.slowFrames+1:Math.max(0,this.slowFrames-1);
        if(this.slowFrames>180&&this.sim.quality!=='low'){
          this.sim.setQuality(this.sim.quality==='ultra'?'standard':'low');this.slowFrames=0;this.resize();
        }
      }
      if(now-this.lastSnapshot>250){this.publish();this.lastSnapshot=now;}
      this.frameId=requestAnimationFrame(this.loop);
    }catch(error){this.pause(true);this.onError(error instanceof Error?error.message:'The show was paused after a graphics error.');}
  };
  publish(){this.onSnapshot({...this.sim.snapshot(),paused:this.paused,backend:this.renderer?.backend||'Starting',fps:Math.round(1000/this.ema)});}
  pause(hidden=false){
    if(this.disposed)return;
    this.paused=true;cancelAnimationFrame(this.frameId);this.clock.reset();this.lastFrame=0;
    void this.audio.suspend();void this.wake.set(false);this.publish();
    if(hidden)this.onEvent({type:'visibility.paused'});
  }
  async resume(){
    if(this.disposed||!this.renderer)return;
    await this.audio.unlock();
    if(this.disposed||document.hidden)return;
    this.paused=false;this.clock.reset();this.lastFrame=0;this.sim.nextCue=Math.max(this.sim.nextCue,this.sim.time+.6);
    if(this.preferences.keepAwake)void this.wake.set(true);
    cancelAnimationFrame(this.frameId);this.frameId=requestAnimationFrame(this.loop);this.publish();
  }
  applyPreferences(preferences){
    const qualityChanged=this.preferences.quality!==preferences.quality;
    this.preferences=preferences;this.sim.reduced=preferences.reduced;
    if(preferences.reduced)this.sim.tasks=this.sim.tasks.filter(task=>task.family==='gold-willow');
    if(qualityChanged){this.sim.setQuality(preferences.quality==='auto'?(this.renderer?.backend==='Canvas 2D'?'low':'standard'):preferences.quality);this.resize();}
    this.audio.setPreferences({volume:preferences.volume,ambience:preferences.ambience,haptics:preferences.haptics});this.publish();
  }
  clear(){this.sim.reset();this.audio.stopAll();this.clock.reset();this.renderer?.render(this.sim);this.publish();}
  dispose(){
    this.disposed=true;this.generation++;cancelAnimationFrame(this.frameId);this.observer?.disconnect();
    document.removeEventListener('visibilitychange',this.visibility);this.audio.dispose();this.wake.dispose();this.renderer?.dispose();this.renderer=null;
  }
}
