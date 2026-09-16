import * as THREE from 'three/webgpu';
import { attribute, color, cos, mix, positionGeometry, sin, texture, uv, vec3 } from 'three/tsl';
import { BUDGETS, FAMILIES, randomStream } from './catalog';
import type { Quality } from './catalog';
import type { Simulation } from './Simulation';
import type { Pool } from './Pool';

type Kind='head'|'trail'|'smoke';
class ParticleLayer {
  readonly mesh:THREE.Mesh;
  private geometry=new THREE.InstancedBufferGeometry();
  private position:THREE.InstancedBufferAttribute;
  private tint:THREE.InstancedBufferAttribute;
  private scale:THREE.InstancedBufferAttribute;
  private alpha:THREE.InstancedBufferAttribute;
  private rotation:THREE.InstancedBufferAttribute;
  constructor(capacity:number,private kind:Kind,smokeTexture:THREE.DataTexture) {
    const plane=new THREE.PlaneGeometry(1,1);
    this.geometry.index=plane.index;
    this.geometry.setAttribute('position',plane.getAttribute('position'));
    this.geometry.setAttribute('uv',plane.getAttribute('uv'));
    const attr=(size:number) => new THREE.InstancedBufferAttribute(new Float32Array(capacity*size),size).setUsage(THREE.DynamicDrawUsage);
    this.position=attr(3); this.tint=attr(3); this.scale=attr(2); this.alpha=attr(1); this.rotation=attr(1);
    this.geometry.setAttribute('iPosition',this.position); this.geometry.setAttribute('iColor',this.tint);
    this.geometry.setAttribute('iScale',this.scale); this.geometry.setAttribute('iAlpha',this.alpha); this.geometry.setAttribute('iRotation',this.rotation);
    this.geometry.instanceCount=0;
    const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide});
    m.blending=kind==='smoke'?THREE.NormalBlending:THREE.AdditiveBlending;
    const p=positionGeometry.xy.mul(attribute('iScale','vec2'));
    const a=attribute('iRotation','float');
    m.positionNode=vec3(p.x.mul(cos(a)).sub(p.y.mul(sin(a))),p.x.mul(sin(a)).add(p.y.mul(cos(a))),0).add(attribute('iPosition','vec3'));
    const radial=uv().sub(0.5).length().mul(2).oneMinus().clamp(0,1);
    m.colorNode=attribute('iColor','vec3');
    m.opacityNode=attribute('iAlpha','float').mul(kind==='smoke'?texture(smokeTexture,uv()).r:radial.pow(kind==='head'?2.7:1.6));
    m.toneMapped=false;
    this.mesh=new THREE.Mesh(this.geometry,m);
    this.mesh.frustumCulled=false; this.mesh.renderOrder=kind==='smoke'?1:kind==='trail'?3:4;
  }
  update(pool:Pool,sim:Simulation) {
    const pos=this.position.array as Float32Array; const rgb=this.tint.array as Float32Array;
    const scale=this.scale.array as Float32Array; const alpha=this.alpha.array as Float32Array; const rotation=this.rotation.array as Float32Array;
    for(let i=0;i<pool.count;i++) {
      const i3=i*3,i2=i*2; const t=pool.age[i]/pool.life[i];
      pos[i3]=pool.x[i]; pos[i3+1]=pool.y[i]; pos[i3+2]=pool.z[i];
      rotation[i]=pool.angle[i];
      if(this.kind==='smoke') {
        let lr=0,lg=0,lb=0;
        for(const l of sim.lights) {
          const falloff=Math.max(0,1-Math.hypot(l.x-pool.x[i],l.y-pool.y[i])/(33*sim.smallScale));
          const power=falloff*falloff*Math.exp(-l.age*2.8)*l.strength*(sim.reducedFlashes?0.25:0.6);
          lr+=l.r*power; lg+=l.g*power; lb+=l.b*power;
        }
        rgb[i3]=0.055+lr; rgb[i3+1]=0.066+lg; rgb[i3+2]=0.083+lb;
        scale[i2]=pool.size[i]*2.5; scale[i2+1]=pool.size[i]*1.7;
        alpha[i]=Math.min(1,pool.age[i]*1.5)*Math.pow(1-t,1.3)*0.42*pool.gravity[i];
        rotation[i]=i*0.37;
      } else {
        const fade=Math.pow(Math.max(0,1-t),this.kind==='head'?0.5:1.1);
        const red=pool.family[i]===2?Math.min(0.87,Math.max(0,(t-0.4)*2)):0;
        const energy=this.kind==='head'?2.2:1.1;
        rgb[i3]=pool.r[i]*energy; rgb[i3+1]=pool.g[i]*(1-red)*energy; rgb[i3+2]=pool.b[i]*(1-red)*energy;
        const depth=1+pool.z[i]*0.006;
        scale[i2]=pool.size[i]*3.4*depth; scale[i2+1]=Math.max(pool.size[i]*3.4,pool.stretch[i]*1.25)*depth;
        alpha[i]=fade*(this.kind==='head'?(0.82+0.18*Math.sin(sim.time*25+i*2.33)):0.8);
      }
    }
    this.geometry.instanceCount=pool.count;
    for(const a of [this.position,this.tint,this.scale,this.alpha,this.rotation]) {
      a.clearUpdateRanges(); if(pool.count) a.addUpdateRange(0,pool.count*a.itemSize); a.needsUpdate=true;
    }
  }
  dispose() { this.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}
function makeSmokeTexture() {
  const size=96, data=new Uint8Array(size*size*4), rand=randomStream(47219);
  const grid=new Float32Array(16*16); for(let i=0;i<grid.length;i++) grid[i]=rand();
  const noise=(x:number,y:number) => {
    const ix=Math.floor(x),iy=Math.floor(y); const fx=x-ix,fy=y-iy;
    const at=(a:number,b:number) => grid[((b%16+16)%16)*16+(a%16+16)%16];
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    return (at(ix,iy)*(1-sx)+at(ix+1,iy)*sx)*(1-sy)+(at(ix,iy+1)*(1-sx)+at(ix+1,iy+1)*sx)*sy;
  };
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const d=Math.hypot((x-size/2)/(size/2),(y-size/2)/(size/2));
    const n=noise(x/18,y/18)*0.6+noise(x/8,y/8)*0.3+noise(x/3,y/3)*0.1;
    const value=Math.round(Math.pow(Math.max(0,1-d),1.1)*(0.35+n*0.9)*255);
    const i=(y*size+x)*4; data[i]=value; data[i+1]=value; data[i+2]=value; data[i+3]=255;
  }
  const t=new THREE.DataTexture(data,size,size); t.needsUpdate=true; return t;
}
function makeHorizon() {
  const canvas=document.createElement('canvas'); canvas.width=1536; canvas.height=256;
  const ctx=canvas.getContext('2d')!; const rand=randomStream(8291);
  ctx.fillStyle='#03060a'; ctx.beginPath(); ctx.moveTo(0,256);
  for(let x=0;x<1540;x+=3) ctx.lineTo(x,98+Math.sin(x*0.006)*9+Math.sin(x*0.035)*5+rand()*7);
  ctx.lineTo(1536,256); ctx.fill();
  for(let x=0;x<1536;x+=9+rand()*24) {
    const h=10+rand()*42,y=107; ctx.fillRect(x-1,y-h,2,h);
    ctx.beginPath(); ctx.ellipse(x,y-h*0.6,4+rand()*8,h*0.5,0,0,Math.PI*2); ctx.fill();
  }
  for(let i=0;i<26;i++) {
    ctx.fillStyle=`rgba(225,172,93,${0.08+rand()*0.2})`;
    ctx.fillRect(rand()*1536,116+rand()*16,1+rand()*1.4,1);
  }
  const t=new THREE.CanvasTexture(canvas); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeRocket() {
  const group=new THREE.Group();
  const paper=new THREE.MeshStandardMaterial({color:0xeac17a,roughness:0.6,metalness:0.17});
  const nose=new THREE.MeshStandardMaterial({color:0xac8260,roughness:0.4,metalness:0.35});
  const stickMaterial=new THREE.MeshStandardMaterial({color:0x705139,roughness:1});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.48,0.48,3.1,16),paper); body.position.y=2.8;
  const cap=new THREE.Mesh(new THREE.ConeGeometry(0.59,1.1,16),nose); cap.position.y=4.9;
  const band=new THREE.Mesh(new THREE.CylinderGeometry(0.49,0.49,0.22,16),new THREE.MeshStandardMaterial({color:0xd3b481,metalness:0.6,roughness:0.35})); band.position.y=1.65;
  const stick=new THREE.Mesh(new THREE.BoxGeometry(0.1,5.4,0.1),stickMaterial); stick.position.set(-0.23,-0.35,0);
  const fuseCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0.4,1.4,0),new THREE.Vector3(0.9,1.2,0),new THREE.Vector3(1.2,0.75,0)]);
  const fuse=new THREE.Mesh(new THREE.TubeGeometry(fuseCurve,10,0.05,5,false),new THREE.MeshBasicMaterial({color:0xb0a282}));
  group.add(body,cap,band,stick,fuse); group.userData.paper=paper; return group;
}
export class FireworkRenderer {
  readonly renderer:THREE.WebGPURenderer;
  readonly scene=new THREE.Scene();
  private camera=new THREE.OrthographicCamera(-80,80,100,0,0.1,2000);
  private smokeTexture=makeSmokeTexture();
  private horizonTexture=makeHorizon();
  private heads=new ParticleLayer(3072,'head',this.smokeTexture);
  private trails=new ParticleLayer(24000,'trail',this.smokeTexture);
  private smoke=new ParticleLayer(160,'smoke',this.smokeTexture);
  private rocketModels=Array.from({length:8},makeRocket);
  private sky:THREE.Mesh;
  private horizon:THREE.Mesh;
  private disposed=false;
  private lossHandler:(event:Event)=>void;
  backend='Starting';
  constructor(private host:HTMLDivElement,private sim:Simulation,private onFailure:(message:string)=>void,forceWebGL=false) {
    this.renderer=new THREE.WebGPURenderer({antialias:false,alpha:false,forceWebGL});
    this.renderer.setClearColor(0x03050b,1); this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.camera.position.set(0,0,1000);
    const skyMaterial=new THREE.MeshBasicNodeMaterial();
    skyMaterial.colorNode=mix(color('#03050b'),color('#152236'),uv().y.oneMinus().pow(2.8));
    this.sky=new THREE.Mesh(new THREE.PlaneGeometry(1,1),skyMaterial); this.sky.position.set(0,50,-100);
    this.horizon=new THREE.Mesh(new THREE.PlaneGeometry(1,20),new THREE.MeshBasicMaterial({map:this.horizonTexture,transparent:true,depthWrite:false}));
    this.horizon.position.set(0,10,-90);
    this.scene.add(this.sky,this.horizon,this.smoke.mesh,this.trails.mesh,this.heads.mesh);
    this.scene.add(new THREE.AmbientLight(0x9cabc9,1.25));
    const key=new THREE.DirectionalLight(0xffd5a0,2.8); key.position.set(-8,30,50); this.scene.add(key);
    for(const rocket of this.rocketModels) { rocket.visible=false; this.scene.add(rocket); }
    this.lossHandler=(event:Event) => { event.preventDefault(); if(!this.disposed) this.onFailure('Graphics were interrupted. Retry to return to a fresh sky.'); };
    this.renderer.domElement.addEventListener('webglcontextlost',this.lossHandler);
  }
  async init() {
    await this.renderer.init(); if(this.disposed) return;
    this.backend=(this.renderer.backend as unknown as {isWebGPUBackend?:boolean}).isWebGPUBackend?'WebGPU':'WebGL 2';
    const device=(this.renderer.backend as unknown as {device?:{lost:Promise<unknown>}}).device;
    device?.lost.then(()=>{if(!this.disposed) this.onFailure('Graphics were interrupted. Retry with lower quality.');});
    this.host.replaceChildren(this.renderer.domElement); this.resize();
    await this.renderer.compileAsync(this.scene,this.camera);
    this.render();
  }
  resize() {
    if(this.disposed) return;
    const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight),aspect=w/h;
    const world=100*aspect; this.camera.left=-world/2; this.camera.right=world/2; this.camera.updateProjectionMatrix();
    this.sky.scale.set(world,100,1); this.horizon.scale.x=world;
    this.renderer.setSize(w,h); this.setQuality(this.sim.quality);
    const groundPixels=h<460?142:w<600?220:250;
    this.sim.setViewport(world,groundPixels/h*100);
    this.host.parentElement?.style.setProperty('--ground-px',`${groundPixels}px`);
  }
  setQuality(q:Quality) { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,BUDGETS[q].ratio)); }
  render() {
    if(this.disposed) return;
    this.heads.update(this.sim.heads,this.sim); this.trails.update(this.sim.trails,this.sim); this.smoke.update(this.sim.smoke,this.sim);
    for(const m of this.rocketModels) m.visible=false;
    let index=0;
    const place=(family:number,x:number,y:number,glow=false)=> {
      const m=this.rocketModels[index++]; if(!m) return;
      m.visible=true; m.position.set(x,y,4); m.scale.setScalar(Math.max(0.8,this.sim.smallScale));
      const material=m.userData.paper as THREE.MeshStandardMaterial;
      material.color.set(FAMILIES[family].color); material.emissive.set(glow?0x48270c:0x000000);
    };
    if(this.sim.prepared && !this.sim.rockets.some(r=>r.stage==='fuse')) place(FAMILIES.findIndex(f=>f.id===this.sim.selected),(this.sim.placement-0.5)*this.sim.width,this.sim.ground,this.sim.holding);
    for(const r of this.sim.rockets) if(r.stage!=='afterglow') place(r.family,r.x+(r.stage==='ascent'?r.drift*Math.min(1,r.age/r.ascent):0),r.y,r.stage==='fuse');
    this.renderer.render(this.scene,this.camera);
  }
  dispose() {
    if(this.disposed) return; this.disposed=true;
    this.renderer.domElement.removeEventListener('webglcontextlost',this.lossHandler);
    this.heads.dispose(); this.trails.dispose(); this.smoke.dispose();
    this.scene.traverse(object=> { if(object instanceof THREE.Mesh && ![this.heads.mesh,this.trails.mesh,this.smoke.mesh].includes(object)) {
      object.geometry.dispose(); const mats=Array.isArray(object.material)?object.material:[object.material]; mats.forEach(m=>m.dispose());
    }});
    this.smokeTexture.dispose(); this.horizonTexture.dispose(); this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
