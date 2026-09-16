/** Deterministic, DOM-free fireworks simulation. All dimensions are virtual, never physical pyrotechnic specifications. */
export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function random(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const CATALOG = Object.freeze([
  { id: 'gold-willow', name: 'Gold Willow', short: 'Willow', color: '#edbc74', note: 'A slow cascade of golden embers', character: 'Long · golden · lingering', cost: 1, count: 190, life: 5.2, drag: .26, gravity: 17, trail: 1.85, speed: 1, palette: [[1,.75,.35],[1,.87,.56],[1,.65,.26]] },
  { id: 'multicolor-peony', name: 'Multicolor Peony', short: 'Peony', color: '#d582ad', note: 'A fleeting sphere of festival colour', character: 'Round · vivid · fleeting', cost: 1, count: 240, life: 1.7, drag: .7, gravity: 14, trail: .07, speed: 1.65, palette: [[1,.14,.28],[.33,.67,1],[.5,.25,1]] },
  { id: 'chrysanthemum', name: 'Chrysanthemum', short: 'Chrysanthemum', color: '#eea575', note: 'Radiant spokes, warming into red', character: 'Radiant · layered · warm', cost: 1, count: 210, life: 3.1, drag: .44, gravity: 12, trail: .95, speed: 1.25, palette: [[1,.69,.32],[1,.85,.62],[1,.55,.26]] },
  { id: 'silver-crossette-crackle', name: 'Silver Crossette Crackle', short: 'Crossette', color: '#b8d3dc', note: 'Silver stars that divide into little crosses', character: 'Silver · splitting · crackling', cost: 1, count: 28, life: .72, drag: .38, gravity: 12, trail: .48, speed: 1.35, palette: [[.8,.9,1],[1,.9,.68]] },
  { id: 'grand-finale', name: 'Grand Finale', short: 'Finale', color: '#c7ac77', note: 'A choreographed celebration in four acts', character: 'Layered · expansive · celebratory', cost: 3, count: 1, life: 8, drag: .3, gravity: 12, trail: 1.2, speed: 1, palette: [[1,.73,.3]] },
]);
export const QUALITIES = Object.freeze({
  low: { stars: 1300, trails: 10000, smoke: 32, scale: .55, dpr: 1, units: 4 },
  standard: { stars: 2600, trails: 26000, smoke: 64, scale: 1, dpr: 1.5, units: 6 },
  ultra: { stars: 4000, trails: 48000, smoke: 96, scale: 1.35, dpr: 2, units: 8 },
});
export const FAMILY = Object.fromEntries(CATALOG.map(f => [f.id, f]));

/** Dense fixed-capacity structure-of-arrays pool; removal never allocates. */
export class Pool {
  constructor(capacity, fields) {
    this.capacity = capacity;
    this.count = 0;
    this.fields = fields;
    this.data = Object.fromEntries(fields.map(k => [k, new Float32Array(capacity)]));
    this.dropped = 0;
  }
  add(values) {
    if (this.count >= this.capacity) { this.dropped++; return -1; }
    const i = this.count++;
    for (const k of this.fields) this.data[k][i] = values[k] || 0;
    return i;
  }
  remove(i) {
    const last = --this.count;
    if (i !== last) for (const k of this.fields) this.data[k][i] = this.data[k][last];
  }
  clear() { this.count = 0; }
}

export class Simulation {
  constructor({ seed = 20260916, quality = 'standard', reduced = false } = {}) {
    this.seed = seed >>> 0;
    this.rng = random(seed);
    this.showRng = random(seed ^ 0x5e71a9);
    this.quality = Object.hasOwn(QUALITIES, quality) ? quality : 'standard';
    this.budget = QUALITIES[this.quality];
    // Allocate hard maximum once. Quality changes alter emission, not live arrays.
    this.stars = new Pool(4000, ['x','y','z','vx','vy','vz','age','life','r','g','b','drag','gravity','trail','kind','seed']);
    this.trails = new Pool(48000, ['x','y','z','vx','vy','age','life','r','g','b','size','seed']);
    this.smoke = new Pool(96, ['x','y','z','vx','age','life','size','seed']);
    this.time = 0;
    this.aspect = 1.5;
    this.reduced = reduced;
    this.wind = 3.3;
    this.active = [];
    this.tasks = [];
    this.lights = [];
    this.events = [];
    this.nextId = 1;
    this.eventId = 1;
    this.show = false;
    this.mode = 'festival';
    this.nextCue = 0;
    this.quietUntil = 0;
    this.lastFamily = '';
    this.showStart = 0;
    this.launched = 0;
    this.completed = 0;
    this.frame = 0;
  }
  setQuality(q) { if (Object.hasOwn(QUALITIES, q)) { this.quality = q; this.budget = QUALITIES[q]; } }
  get units() { return this.active.reduce((n, a) => n + a.cost, 0); }
  get maxUnits() { return this.reduced ? Math.min(3, this.budget.units) : this.budget.units; }
  emit(type, effect, payload = {}) {
    if (this.events.length >= 256) this.events.shift();
    this.events.push({ id: this.eventId++, type, time: this.time, fireworkId: effect?.id, family: effect?.family, x: effect?.x || 0, y: effect?.y || 210, ...payload });
  }
  drainEvents() { return this.events.splice(0); }
  startShow(mode = 'festival') {
    this.mode = ['calm','festival','finale'].includes(mode) ? mode : 'festival';
    this.show = true;
    this.showStart = this.time;
    this.nextCue = this.time + .25;
    this.quietUntil = this.time;
  }
  stopShow() { this.show = false; }
  reset() {
    this.stopShow();
    this.active.length = this.tasks.length = this.lights.length = this.events.length = 0;
    this.stars.clear(); this.trails.clear(); this.smoke.clear();
    this.emit('reset');
  }
  ignite(familyId, normalizedX = .5, source = 'manual') {
    const f = FAMILY[familyId];
    if (!Object.hasOwn(FAMILY, familyId) || !Number.isFinite(normalizedX)) return { accepted: false, reason: 'Choose a firework first.' };
    if (this.units + f.cost > this.maxUnits) return { accepted: false, reason: 'Let this burst finish, then light another.' };
    if (source === 'manual') this.quietUntil = this.time + 8;
    const x = (clamp(normalizedX, .18, .82) - .5) * this.aspect * 1000;
    const a = {
      id: this.nextId++, family: familyId, cost: f.cost, source, x, y: 210,
      originX: x, age: 0, fuse: 1.5 + this.rng(), ascent: 1.65 + this.rng() * .6,
      height: 665 + this.rng() * 85, sway: (this.rng() - .5) * 22,
      stage: 'fuse', seed: Math.floor(this.rng() * 1e9), smokeClock: 0,
    };
    this.active.push(a);
    this.emit('fuse.started', a, { source, duration: a.fuse });
    return { accepted: true, id: a.id };
  }
  addTrail(x, y, z, r, g, b, life, size = 2.4, vx = 0, vy = 0) {
    if (this.trails.count >= this.budget.trails) return;
    this.trails.add({ x,y,z,r,g,b,life,size,vx,vy,age: 0,seed: this.rng() * 1000 });
  }
  addSmoke(x, y, z = 0, size = 16) {
    if (this.smoke.count >= this.budget.smoke) return;
    this.smoke.add({ x,y,z,size,age:0,life:12 + this.rng()*9,seed:this.rng()*1000,vx:this.wind*(.7+this.rng()*.5) });
  }
  burst(familyId, x, y, z = 0, scale = 1, parent = null) {
    const f = FAMILY[familyId];
    const r = this.rng;
    const minDim = Math.min(1000, this.aspect * 1000);
    const speed = minDim * .104 * f.speed * scale;
    if (familyId === 'grand-finale') {
      const groups = [
        [0, 'multicolor-peony', -.13, -.01], [.35, 'multicolor-peony', .13, .03],
        [.8, 'chrysanthemum', -.12, .06], [1.1, 'chrysanthemum', .12, -.035],
        [1.65, 'multicolor-peony', -.08, .04], [1.9, 'multicolor-peony', .08, .04],
        [2.65, 'gold-willow', 0, .06],
      ];
      for (let i = 0; i < groups.length; i++) {
        if ((this.reduced || this.quality === 'low') && [1,3,5].includes(i)) continue;
        const [delay, family, dx, dy] = groups[i];
        this.tasks.push({ at: this.time + delay, family, x: x + dx*minDim, y: y + dy*1000, z, scale: i === 6 ? .78 : .5, parent });
      }
      return;
    }
    const count = Math.min(Math.round(f.count * this.budget.scale * (this.reduced ? .72 : 1)), Math.max(0, this.budget.stars - this.stars.count));
    const palette = Math.floor(r() * 3);
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere plus small independent deviations: a 3D shell, not a flat ring.
      const uy = 1 - 2 * (i + .5) / count;
      const angle = i * 2.399963229728653 + (r() - .5) * .08;
      const rim = Math.sqrt(1 - uy*uy);
      const v = speed * (.84 + r()*.27);
      let rgb = f.palette[(i + palette) % f.palette.length];
      if (familyId === 'multicolor-peony') {
        const palettes = [ [[1,.1,.22],[1,.7,.25]], [[.1,1,.47],[.77,.89,1]], [[.52,.16,1],[1,.66,.25]] ];
        rgb = palettes[palette][i % 5 === 0 ? 1 : 0];
      }
      this.stars.add({ x,y,z, vx:Math.cos(angle)*rim*v,vy:uy*v,vz:Math.sin(angle)*rim*v,
        age:0,life:f.life*(.78+r()*.45),r:rgb[0],g:rgb[1],b:rgb[2],drag:f.drag,gravity:f.gravity,
        trail:f.trail,kind:familyId === 'silver-crossette-crackle' ? 1 : familyId === 'chrysanthemum' ? 3 : 0,seed:r()*1000 });
    }
    const lightColor = f.palette[0];
    this.lights.push({ x,y,z,age:0,life:1.5,r:lightColor[0],g:lightColor[1],b:lightColor[2],scale });
    if (this.lights.length > 8) this.lights.shift();
    const smokeCount = this.reduced ? 3 : Math.round(8 * scale);
    for (let j=0;j<smokeCount;j++) this.addSmoke(x+(r()-.5)*speed*.5,y+(r()-.5)*speed*.4,z,18+r()*22);
    this.emit('burst', { id: parent?.id, family: familyId,x,y }, { scale, secondary: !!parent?.secondary });
  }
  splitStar(i) {
    const d = this.stars.data;
    const angle = d.seed[i];
    for (let j=0;j<4;j++) {
      if (this.stars.count >= this.budget.stars) break;
      const a = angle + j * TAU / 4;
      this.stars.add({ x:d.x[i],y:d.y[i],z:d.z[i],vx:Math.cos(a)*38+d.vx[i]*.2,vy:Math.sin(a)*38+d.vy[i]*.2,vz:d.vz[i]*.15,
        life:1.4+this.rng()*.8,r:.83,g:.91,b:1,drag:.5,gravity:13,trail:.55,kind:2,seed:this.rng()*1000 });
    }
  }
  tick(dt = 1/60) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 1/30);
    this.time += dt;
    this.frame++;
    if (this.show && this.time >= this.nextCue && this.time >= this.quietUntil) {
      const rng = this.showRng;
      let index = Math.floor(rng()*4);
      if (CATALOG[index].id === this.lastFamily) index = (index+1)%4;
      const elapsed = this.time - this.showStart;
      if (this.mode !== 'calm' && !this.reduced && rng() < (this.mode === 'finale' ? .22 : .065)) index = 4;
      if (this.mode === 'finale' && elapsed > 32) { this.mode = 'festival'; this.emit('show.settled'); }
      const result = this.ignite(CATALOG[index].id, .25 + rng()*.5, 'auto');
      if (result.accepted) this.lastFamily = CATALOG[index].id;
      const interval = this.reduced || this.mode === 'calm' ? 5.5 + rng()*3 : this.mode === 'finale' ? 1.4 + rng()*1.1 : 2.6 + rng()*2.4;
      this.nextCue = this.time + (result.accepted ? interval : 1.2);
    }
    for (let i=this.active.length-1;i>=0;i--) {
      const a = this.active[i];
      a.age += dt;
      if (a.stage === 'fuse') {
        if (this.frame % 2 === 0) this.addTrail(a.x+7, 220, 0, 1,.6,.16,.17+this.rng()*.14,2.1,(this.rng()-.5)*30,15+this.rng()*18);
        if (a.age >= a.fuse) { a.stage='ascent'; this.launched++; this.emit('launch.started',a); }
      } else if (a.stage === 'ascent') {
        const p = clamp((a.age-a.fuse)/a.ascent,0,1);
        a.y = 210 + (a.height-210) * (1 - (1-p)**1.8);
        a.x = a.originX + a.sway*Math.sin(p*1.8) + this.wind*p*2;
        for(let n=0;n<(this.quality==='low'?2:3);n++) this.addTrail(a.x+(this.rng()-.5)*3,a.y-this.rng()*7,0,1,.72,.3,.45+this.rng()*.2,2.6,(this.rng()-.5)*8,-15-this.rng()*20);
        a.smokeClock += dt;
        if (a.smokeClock > .13) { this.addSmoke(a.x,a.y,0,5); a.smokeClock=0; }
        if(p>=1) { a.stage='afterglow'; this.burst(a.family,a.x,a.y,0,1,a); }
      } else if (a.age > a.fuse+a.ascent+(a.family==='grand-finale'?13:9.5)) {
        this.active.splice(i,1); this.completed++; this.emit('effect.completed',a);
      }
    }
    for(let i=this.tasks.length-1;i>=0;i--) {
      const t=this.tasks[i];
      if(t.at<=this.time) { this.tasks.splice(i,1); this.burst(t.family,t.x,t.y,t.z,t.scale,t.parent); }
    }
    const s=this.stars.data;
    // New split children are updated next step, so recursion is impossible.
    const initialCount=this.stars.count;
    for(let i=initialCount-1;i>=0;i--) {
      s.age[i]+=dt;
      if(s.age[i]>=s.life[i]) {
        if(s.kind[i]===1) this.splitStar(i);
        if(s.kind[i]===2 && !this.reduced) for(let n=0;n<5;n++) this.addTrail(s.x[i],s.y[i],s.z[i],1,.84,.55,.12+this.rng()*.22,2.2,(this.rng()-.5)*40,(this.rng()-.5)*40);
        this.stars.remove(i); continue;
      }
      const damping=Math.exp(-s.drag[i]*dt);
      s.vx[i]=(s.vx[i]+this.wind*.11*dt)*damping;
      s.vy[i]=(s.vy[i]-s.gravity[i]*dt)*damping;
      s.vz[i]*=damping;
      s.x[i]+=s.vx[i]*dt; s.y[i]+=s.vy[i]*dt; s.z[i]+=s.vz[i]*dt;
      const age=s.age[i]/s.life[i];
      const emitEvery=this.quality==='low'?3:2;
      if(this.frame%emitEvery===0 && s.trail[i]>.1) {
        const fade=Math.max(.08,1-age*.85);
        this.addTrail(s.x[i],s.y[i],s.z[i],s.r[i],s.g[i]*fade,s.b[i]*fade,s.trail[i]*(.65+this.rng()*.55),s.kind[i]===1?2.5:1.9,this.wind*.14,-1.2);
      }
    }
    const t=this.trails.data;
    for(let i=this.trails.count-1;i>=0;i--) {
      t.age[i]+=dt;
      if(t.age[i]>=t.life[i]) { this.trails.remove(i); continue; }
      t.x[i]+=(t.vx[i]+this.wind*.1)*dt;
      t.y[i]+=t.vy[i]*dt;
      t.vy[i]-=2.5*dt;
    }
    const m=this.smoke.data;
    for(let i=this.smoke.count-1;i>=0;i--) {
      m.age[i]+=dt;
      if(m.age[i]>=m.life[i]) { this.smoke.remove(i); continue; }
      m.x[i]+=m.vx[i]*dt; m.y[i]+=1.1*dt; m.size[i]+=1.25*dt;
    }
    for(let i=this.lights.length-1;i>=0;i--) { this.lights[i].age+=dt; if(this.lights[i].age>this.lights[i].life)this.lights.splice(i,1); }
  }
  snapshot() {
    return { time:this.time,quality:this.quality,units:this.units,maxUnits:this.maxUnits,active:this.active.length,
      stars:this.stars.count,trails:this.trails.count,smoke:this.smoke.count,show:this.show,mode:this.mode,launched:this.launched,completed:this.completed };
  }
}

/** Wall time is deliberately discarded after suspension. No hidden-tab catch-up. */
export class FixedClock {
  constructor() { this.last=null; this.accumulator=0; }
  reset() { this.last=null; this.accumulator=0; }
  advance(now, step) {
    if(this.last===null) { this.last=now; return 0; }
    const elapsed=(now-this.last)/1000;
    this.last=now;
    if(elapsed<0 || elapsed>.25) { this.accumulator=0; return 0; }
    this.accumulator+=Math.min(elapsed,.08);
    let n=0;
    while(this.accumulator>=1/60 && n<5) { step(1/60); this.accumulator-=1/60; n++; }
    return n;
  }
}
