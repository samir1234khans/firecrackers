import { BUDGETS, FAMILIES, clamp, familyIndex, randomStream } from './catalog.js';
import type { FamilyId, Quality, ShowPreset } from './catalog.js';
import { Pool } from './Pool.js';
export type SimEvent = { id:number; time:number; type:'fuse'|'launch'|'burst'|'crackle'; x:number; y:number; family:number; strength:number };
type Rocket = { family:number; x:number; y:number; z:number; ground:number; top:number; age:number; fuse:number; ascent:number; stage:'fuse'|'ascent'|'afterglow'; burstAt:number; cost:number; seed:number; drift:number };
type Cue = { at:number; family:number; x:number; y:number; z:number; scale:number; seed:number };
export type Light = { x:number; y:number; age:number; r:number; g:number; b:number; strength:number };
export class Simulation {
  readonly heads=new Pool(3072);
  readonly trails=new Pool(24000);
  readonly smoke=new Pool(160);
  rockets:Rocket[]=[]; cues:Cue[]=[]; lights:Light[]=[]; events:SimEvent[]=[];
  time=0; paused=false; selected:FamilyId='gold-willow'; placement=0.5; prepared=true;
  holding=false; holdProgress=0; show:ShowPreset|null=null; launched=0; bursts=0;
  quality:Quality='standard'; reducedFlashes=true; width=160; ground=22;
  message='Choose a firework. Make the night yours.';
  private accumulator=0; private nextCue=0; private showStart=0; private previousFamily=-1;
  private sequence=0; private rng:()=>number; private showRng:()=>number;
  constructor(readonly seed=20260916) { this.rng=randomStream(seed); this.showRng=randomStream(seed ^ 0x5bf03635); }
  get activeUnits() { return this.rockets.reduce((n,r)=>n+r.cost,0); }
  get ready() { return this.prepared && !this.paused && !this.rockets.some(r=>r.stage==='fuse'); }
  get smallScale() { return Math.min(1,this.width/100); }
  setViewport(width:number, ground:number) { this.width=clamp(width,35,360); this.ground=clamp(ground,12,46); }
  setPlacement(value:number) { if(!this.holding && this.ready) this.placement=clamp(value,0.2,0.8); }
  select(id:FamilyId) {
    this.stopShow(false);
    if(this.rockets.some(r=>r.stage==='fuse')) { this.message='Let this fuse finish.'; return false; }
    this.cancelHold(); this.selected=FAMILIES[familyIndex(id)].id; this.prepared=true;
    this.message=FAMILIES[familyIndex(id)].note; return true;
  }
  beginHold() { if(!this.ready) return false; this.stopShow(false); this.holding=true; this.holdProgress=0; return true; }
  cancelHold() { this.holding=false; this.holdProgress=0; }
  ignite(source:'manual'|'auto'='manual', family=familyIndex(this.selected), placement=this.placement) {
    if(source==='manual') this.stopShow(false);
    if(this.paused || (source==='manual' && !this.ready)) return false;
    const f=FAMILIES[family];
    if(!f || this.activeUnits+f.cost>BUDGETS[this.quality].units || this.heads.count>2300) {
      this.cancelHold(); this.message='Let this burst finish, then light another.'; return false;
    }
    const x=(clamp(placement,0.2,0.8)-0.5)*this.width;
    const rocket:Rocket={ family, x, y:this.ground, z:0, ground:this.ground, top:69+this.rng()*9,
      age:0, fuse:1.5+this.rng(), ascent:f.ascent+(this.rng()-0.5)*0.28, stage:'fuse', burstAt:0,
      cost:f.cost, seed:Math.floor(this.rng()*0xffffffff), drift:(this.rng()-0.5)*2.5*this.smallScale };
    this.rockets.push(rocket); this.emit('fuse',x,this.ground,family,0.5);
    if(source==='manual') { this.prepared=false; this.message='Fuse lit. Watch the sky.'; }
    this.cancelHold(); return true;
  }
  setPaused(value:boolean) { this.paused=value; this.accumulator=0; this.cancelHold(); if(value) this.events=[]; }
  startShow(preset:ShowPreset) {
    this.cancelHold(); this.paused=false; this.show=preset; this.showStart=this.time;
    this.nextCue=this.time+0.5; this.message=preset==='finale'?'A finale, then a quiet sky.':'The night is in good hands.';
  }
  stopShow(announce=true) { if(this.show && announce) this.message='Automatic show stopped. The sky is yours.'; this.show=null; }
  reset() {
    this.heads.clear(); this.trails.clear(); this.smoke.clear(); this.rockets=[]; this.cues=[]; this.lights=[]; this.events=[];
    this.time=0; this.accumulator=0; this.paused=false; this.show=null; this.launched=0; this.bursts=0; this.sequence=0;
    this.rng=randomStream(this.seed); this.showRng=randomStream(this.seed ^ 0x5bf03635);
    this.selected='gold-willow'; this.placement=0.5; this.prepared=true; this.cancelHold(); this.message='A fresh, quiet sky.';
  }
  advance(seconds:number) {
    if(this.paused || !Number.isFinite(seconds) || seconds<=0) return;
    this.accumulator+=Math.min(seconds,0.1);
    for(let steps=0;this.accumulator>=1/60 && steps<6;steps++) { this.step(1/60); this.accumulator-=1/60; }
  }
  drainEvents() { const e=this.events; this.events=[]; return e; }
  snapshot() { return { ready:this.ready, paused:this.paused, selected:this.selected, placement:this.placement,
    holding:this.holding, holdProgress:this.holdProgress, show:this.show, launched:this.launched, bursts:this.bursts,
    active:this.rockets.length, particles:this.heads.count+this.trails.count, smoke:this.smoke.count, quality:this.quality,
    message:this.message, time:this.time, fuse:this.rockets.some(r=>r.stage==='fuse') }; }
  private emit(type:SimEvent['type'],x:number,y:number,family:number,strength=1) {
    if(this.events.length<128) this.events.push({id:++this.sequence,time:this.time,type,x,y,family,strength});
  }
  private step(dt:number) {
    this.time+=dt;
    if(this.holding) { this.holdProgress+=dt/0.65; if(this.holdProgress>=1) this.ignite(); }
    if(this.show) this.directShow();
    this.moveTrails(dt); this.moveHeads(dt); this.moveSmoke(dt);
    for(let i=this.lights.length-1;i>=0;i--) { this.lights[i].age+=dt; if(this.lights[i].age>1.8) this.lights.splice(i,1); }
    for(let i=this.rockets.length-1;i>=0;i--) {
      const r=this.rockets[i]; r.age+=dt;
      if(r.stage==='fuse') {
        if(this.rng()<0.7) this.trails.add(r.x+0.7,r.ground+0.6,1,(this.rng()-0.5)*4,this.rng()*3,0,0.35,1,0.65,0.2,0.16,1,5);
        if(r.age>=r.fuse) { r.age=0; r.stage='ascent'; this.launched++; this.emit('launch',r.x,r.y,r.family); if(!this.show) this.message='Rising into the night.'; }
      } else if(r.stage==='ascent') {
        const t=clamp(r.age/r.ascent,0,1); const oldY=r.y;
        r.y=r.ground+(r.top-r.ground)*(1-Math.pow(1-t,1.4));
        const x=r.x+r.drift*t; const tail=this.trails.add(x,r.y,0,0,-0.4,0,0.75,1,0.65,0.3,0.20,0.3,1.6);
        if(tail>=0) { this.trails.stretch[tail]=Math.max(0.4,r.y-oldY+0.4); }
        if(this.rng()<0.23) this.addSmoke(x,r.y,2.2,0.25);
        if(t>=1) { r.x=x; r.stage='afterglow'; r.age=0; r.burstAt=this.time; this.primary(r); }
      } else if(r.age>15) this.rockets.splice(i,1);
    }
    for(let i=this.cues.length-1;i>=0;i--) if(this.cues[i].at<=this.time) {
      const c=this.cues.splice(i,1)[0]; this.burst(c.family,c.x,c.y,c.z,c.scale,c.seed);
    }
  }
  private directShow() {
    if(this.show==='finale' && this.time-this.showStart>=32) { this.stopShow(false); this.message='Finale complete. Stay for the embers.'; return; }
    if(this.time<this.nextCue) return;
    const mode=this.show; let f=Math.floor(this.showRng()*4);
    if(f===this.previousFamily) f=(f+1)%4;
    if(mode!=='calm' && this.showRng()<0.10 && !this.reducedFlashes) f=4;
    const admitted=this.ignite('auto',f,0.30+this.showRng()*0.4);
    if(admitted) this.previousFamily=f;
    const spacing=mode==='calm'?7+this.showRng()*4:mode==='festival'?3+this.showRng()*2:1.1+this.showRng()*1.1;
    this.nextCue=this.time+(admitted?Math.max(spacing,this.reducedFlashes?2.6:0):1.1);
  }
  private primary(r:Rocket) {
    if(r.family!==4) { this.burst(r.family,r.x,r.y,r.z,1,r.seed); return; }
    const rand=randomStream(r.seed); const spread=13*this.smallScale;
    const groups=[{at:0,f:1},{at:0.75,f:2},{at:1.5,f:1},{at:2.5,f:0}];
    for(const [g,item] of groups.entries()) {
      const count=g===3||this.quality==='low'?1:2;
      for(let j=0;j<count;j++) this.cues.push({at:this.time+item.at,family:item.f,
        x:r.x+(count===1?0:(j===0?-1:1)*spread*(0.6+rand()*0.4)),
        y:r.y+(g===3?4:(rand()-0.5)*10),z:0,scale:g===3?0.9:0.52,seed:Math.floor(rand()*0xffffffff)});
    }
  }
  private burst(family:number,x:number,y:number,z:number,scale:number,seed:number) {
    const f=FAMILIES[family]; const rand=randomStream(seed); const n=Math.round(f.count*BUDGETS[this.quality].scale*(scale<1?0.65:1));
    const factor=this.smallScale*scale; const palette=rand();
    for(let i=0;i<n;i++) {
      const theta=i*2.399963229728653+(rand()-0.5)*0.13; const vertical=1-2*(i+0.5)/n;
      const radial=Math.sqrt(1-vertical*vertical); const speed=f.speed*factor*(0.85+rand()*0.23);
      let color:[number,number,number]=[1,0.68+rand()*0.14,0.24];
      if(family===1) color=i%4===0?[1,0.73,0.29]:palette<0.34?[1,0.045,0.12]:palette<0.67?[0.11,0.86,0.37]:[0.56,0.19,1];
      if(family===3) color=[0.8,0.91,1];
      this.heads.add(x,y,z,Math.cos(theta)*radial*speed,vertical*speed,Math.sin(theta)*radial*speed,
        f.life*(0.78+rand()*0.35),...color,(family===3?0.43:0.28)*Math.max(0.65,this.smallScale),f.drag,
        f.gravity*this.smallScale,f.trail,family===3?0.45+rand()*0.3:0,family);
    }
    this.bursts++; this.emit('burst',x,y,family,scale);
    if(this.lights.length<12) this.lights.push({x,y,age:0,r:1,g:family===3?0.85:0.58,b:family===3?0.75:0.2,strength:scale});
    for(let i=0;i<Math.min(12,6+scale*5);i++) this.addSmoke(x+(rand()-0.5)*10*factor,y+(rand()-0.5)*8*factor,(5+rand()*7)*factor,0.6+rand()*0.4);
    if(!this.show) this.message='Stay for the falling embers.';
  }
  private moveHeads(dt:number) {
    const p=this.heads; const rate=BUDGETS[this.quality].trailRate*(this.trails.count>18000?0.5:1);
    for(let i=p.count-1;i>=0;i--) {
      p.age[i]+=dt;
      if(p.age[i]>=p.life[i] || p.y[i]<-10) { p.remove(i); continue; }
      const drag=Math.exp(-p.drag[i]*dt);
      p.vx[i]=p.vx[i]*drag+0.14*dt; p.vy[i]=p.vy[i]*drag-p.gravity[i]*dt; p.vz[i]*=drag;
      p.x[i]+=p.vx[i]*dt; p.y[i]+=p.vy[i]*dt; p.z[i]+=p.vz[i]*dt;
      if(p.split[i]>0 && p.age[i]>=p.split[i]) {
        const angle=this.rng()*Math.PI;
        for(let k=0;k<4;k++) { const a=angle+k*Math.PI/2; this.heads.add(p.x[i],p.y[i],p.z[i],p.vx[i]*0.25+Math.cos(a)*8*this.smallScale,p.vy[i]*0.25+Math.sin(a)*8*this.smallScale,0,1.25+this.rng()*0.8,0.87,0.93,1,0.23,0.8,2*this.smallScale,0.8,0,3); }
        if(i%7===0) this.emit('crackle',p.x[i],p.y[i],3,0.35);
        p.remove(i); continue;
      }
      p.carry[i]+=dt;
      if(p.trail[i]>0 && p.carry[i]>=1/rate) {
        const elapsed=p.carry[i]; p.carry[i]=0;
        const age=p.age[i]/p.life[i]; const redness=p.family[i]===2?clamp((age-0.45)*2,0,0.85):0;
        const j=this.trails.add(p.x[i],p.y[i],p.z[i],0.2,-0.2,0,p.trail[i]*(0.68+this.rng()*0.32),p.r[i],p.g[i]*(1-redness),p.b[i]*(1-redness),p.size[i]*(0.7+this.rng()*0.4),0.8,0.1*this.smallScale);
        if(j>=0) { this.trails.stretch[j]=Math.max(p.size[i],Math.hypot(p.vx[i],p.vy[i])*elapsed*1.3); this.trails.angle[j]=Math.atan2(p.vy[i],p.vx[i])-Math.PI/2; }
      }
    }
  }
  private moveTrails(dt:number) {
    const p=this.trails;
    for(let i=p.count-1;i>=0;i--) {
      p.age[i]+=dt;
      if(p.age[i]>=p.life[i] || p.y[i]<-10) { p.remove(i); continue; }
      p.vy[i]-=p.gravity[i]*dt; p.x[i]+=p.vx[i]*dt; p.y[i]+=p.vy[i]*dt;
    }
  }
  private addSmoke(x:number,y:number,size:number,opacity:number) {
    if(this.smoke.count>=BUDGETS[this.quality].smoke) return;
    this.smoke.add(x,y,-4,0.55,0.18,0,9+this.rng()*9,0.14,0.16,0.20,size,0,opacity);
  }
  private moveSmoke(dt:number) {
    const p=this.smoke;
    for(let i=p.count-1;i>=0;i--) {
      p.age[i]+=dt; if(p.age[i]>=p.life[i]) { p.remove(i); continue; }
      p.x[i]+=p.vx[i]*dt; p.y[i]+=p.vy[i]*dt; p.size[i]+=0.55*dt;
    }
  }
}
