import { clamp, random } from './core.js';

/** Original procedural sound design: no downloaded recordings or external audio services. */
export class FireworkAudio {
  constructor(){
    this.context=null;this.master=null;this.compressor=null;this.reverb=null;
    this.enabled=false;this.volume=.45;this.ambience=false;this.haptics=false;
    this.sources=new Set();this.timers=new Set();this.seen=new Set();this.noise=null;
    this.ambientSource=null;this.disposed=false;this.rng=random(45712);
  }
  async unlock(){
    if(this.disposed)return false;
    try{
      if(!this.context){
        const Context=window.AudioContext||window.webkitAudioContext;
        if(!Context)return false;
        const ctx=this.context=new Context();
        this.master=ctx.createGain();this.master.gain.value=this.enabled?this.volume:0;
        this.compressor=ctx.createDynamicsCompressor();
        this.compressor.threshold.value=-13;this.compressor.knee.value=15;this.compressor.ratio.value=8;
        this.compressor.attack.value=.003;this.compressor.release.value=.25;
        this.master.connect(this.compressor);this.compressor.connect(ctx.destination);
        this.reverb=ctx.createConvolver();
        const impulse=ctx.createBuffer(2,Math.round(ctx.sampleRate*1.6),ctx.sampleRate);
        for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(this.rng()*2-1)*Math.exp(-i/(ctx.sampleRate*.34))*.18;}
        this.reverb.buffer=impulse;this.reverb.connect(this.master);
        this.noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
        const n=this.noise.getChannelData(0);let previous=0;
        for(let i=0;i<n.length;i++){previous=(previous+(this.rng()*2-1)*.16)/1.02;n[i]=previous*2.2;}
      }
      if(this.context.state==='suspended')await this.context.resume();
      this.updateAmbience();
      return this.context.state==='running';
    }catch{return false;}
  }
  setPreferences({enabled=this.enabled,volume=this.volume,ambience=this.ambience,haptics=this.haptics}={}){
    this.enabled=enabled;this.volume=clamp(volume,0,1);this.ambience=ambience;this.haptics=haptics;
    if(this.master&&this.context){
      const t=this.context.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(enabled?this.volume:0,t,.035);
    }
    if(!enabled)this.stopAll();
    this.updateAmbience();
  }
  track(source,nodes=[]){
    this.sources.add(source);
    source.onended=()=>{this.sources.delete(source);source.disconnect();for(const node of nodes)try{node.disconnect();}catch{ /* Already disconnected. */ }};
  }
  noiseVoice(at,duration,volume,frequency,pan=0,decay=true){
    if(!this.context||!this.noise||this.sources.size>=30)return;
    const ctx=this.context,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
    source.buffer=this.noise;source.loop=true;source.playbackRate.value=.84+this.rng()*.3;
    filter.type='lowpass';filter.frequency.setValueAtTime(frequency,at);filter.Q.value=.7;
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);
    if(decay)gain.gain.exponentialRampToValueAtTime(.0001,at+duration);else{gain.gain.setValueAtTime(volume*.6,at+duration*.8);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);}
    panner.pan.value=clamp(pan,-.85,.85);
    source.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(this.master);
    if(frequency<1200)panner.connect(this.reverb);
    this.track(source,[filter,gain,panner]);source.start(at,this.rng()*.7);source.stop(at+duration+.025);
  }
  boom(at,scale,pan){
    this.noiseVoice(at,1.45,.68*scale,760,pan);
    this.noiseVoice(at,.12,.8*scale,2100,pan);
    const ctx=this.context;
    if(!ctx||this.sources.size>=30)return;
    const tone=ctx.createOscillator(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
    tone.frequency.setValueAtTime(92+this.rng()*22,at);tone.frequency.exponentialRampToValueAtTime(31,at+.5);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.48*scale,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+.85);
    panner.pan.value=pan;tone.connect(gain);gain.connect(panner);panner.connect(this.master);
    this.track(tone,[gain,panner]);tone.start(at);tone.stop(at+.9);
  }
  vibrate(pattern,delay=0){
    if(!this.haptics||!('vibrate'in navigator))return;
    const timer=setTimeout(()=>{this.timers.delete(timer);if(!document.hidden)try{navigator.vibrate(pattern);}catch{ /* Optional capability. */ }},delay);
    this.timers.add(timer);
  }
  handle(event,aspect=1.5){
    if(this.seen.has(event.id))return;
    this.seen.add(event.id);if(this.seen.size>256)this.seen.delete(this.seen.values().next().value);
    if(document.hidden)return;
    const pan=clamp(event.x/(aspect*500),-.8,.8);
    const audible=this.enabled&&this.context?.state==='running';
    const now=this.context?.currentTime||0;
    if(event.type==='fuse.started'){
      if(audible)this.noiseVoice(now,event.duration,.09,4300,pan,false);
      this.vibrate(12);
    }else if(event.type==='launch.started'){
      if(audible)this.noiseVoice(now,.7,.22,2200,pan,false);
      this.vibrate(16);
    }else if(event.type==='burst'){
      // Perceived distance is an artistic audio parameter, not a construction instruction.
      const delay=.22+event.y/1900;
      if(audible){
        this.boom(now+delay,.55+(event.scale||1)*.35,pan);
        if(event.family==='silver-crossette-crackle'||event.family==='gold-willow'){
          const number=event.family==='gold-willow'?4:9;
          for(let i=0;i<number;i++)this.noiseVoice(now+delay+.8+this.rng()*1.8,.07+this.rng()*.1,.055,5800,clamp(pan+(this.rng()-.5)*.3,-1,1));
        }
      }
      this.vibrate([18,20,8],delay*1000);
    }
  }
  updateAmbience(){
    if(this.ambientSource){try{this.ambientSource.stop();}catch{ /* Already ended. */ }this.ambientSource=null;}
    if(!this.enabled||!this.ambience||this.context?.state!=='running'||!this.noise||document.hidden)return;
    const ctx=this.context,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=this.noise;source.loop=true;filter.type='lowpass';filter.frequency.value=650;gain.gain.value=.017;
    source.connect(filter);filter.connect(gain);gain.connect(this.master);this.track(source,[filter,gain]);source.start();this.ambientSource=source;
  }
  stopAll(){
    for(const source of this.sources)try{source.stop();}catch{ /* A scheduled source can already have ended. */ }
    this.sources.clear();this.ambientSource=null;
    for(const timer of this.timers)clearTimeout(timer);this.timers.clear();
    if('vibrate'in navigator)try{navigator.vibrate(0);}catch{ /* Optional. */ }
  }
  async suspend(){this.stopAll();if(this.context?.state==='running')try{await this.context.suspend();}catch{ /* Controls remain functional. */ }}
  dispose(){this.disposed=true;this.stopAll();if(this.context)void this.context.close().catch(()=>{});this.context=null;}
}
