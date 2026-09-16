import { clamp, random } from './core.js';

const CAPACITY = 52200;
const FLOATS = 12;
const VERTEX_GL = `#version 300 es
precision highp float;
layout(location=0) in vec4 positionSize;
layout(location=1) in vec4 colorOpacity;
layout(location=2) in vec4 shape;
uniform vec4 viewport;
out vec2 uv;
out vec4 tint;
flat out float kind;
flat out float seed;
void main(){
 vec2 corners[6]=vec2[6](vec2(-1.,-1.),vec2(1.,-1.),vec2(-1.,1.),vec2(-1.,1.),vec2(1.,-1.),vec2(1.,1.));
 uv=corners[gl_VertexID]; tint=colorOpacity; kind=shape.z; seed=shape.w;
 float p=1000./(1000.+positionSize.z);
 vec2 q=uv*vec2(shape.x,1.)*positionSize.w;
 float c=cos(shape.y),s=sin(shape.y); q=mat2(c,s,-s,c)*q;
 vec2 center=vec2(positionSize.x*p,(positionSize.y-180.)*p+180.);
 vec2 world=center+q*p;
 gl_Position=vec4(world.x/(500.*viewport.x),world.y/500.-1.,0.,1.);
}`;
const FRAGMENT_GL = `#version 300 es
precision highp float;
in vec2 uv;
in vec4 tint;
flat in float kind;
flat in float seed;
out vec4 outColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 float d=dot(uv,uv);
 if(d>1.) discard;
 if(kind>.5){
  float n=noise(uv*3.1+seed)+.5*noise(uv*7.7+seed*.71)+.22*noise(uv*16.+seed*.4);
  float density=pow(max(0.,1.-d),2.)*(.18+n*.7);
  outColor=vec4(tint.rgb,tint.a*density);
 }else{
  float core=exp(-d*34.);
  float halo=exp(-d*5.)*.12;
  outColor=vec4(tint.rgb,tint.a*(core+halo));
 }
}`;
const WGSL = `
struct Uniforms { viewport: vec4f };
@group(0) @binding(0) var<uniform> u: Uniforms;
struct In { @location(0) pos: vec4f, @location(1) color: vec4f, @location(2) shape: vec4f };
struct Out { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) tint: vec4f, @location(2) @interpolate(flat) kind: f32, @location(3) @interpolate(flat) seed: f32 };
@vertex fn vs(input:In,@builtin(vertex_index) id:u32)->Out {
 var corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 var o:Out; o.uv=corners[id]; o.tint=input.color; o.kind=input.shape.z; o.seed=input.shape.w;
 let p=1000./(1000.+input.pos.z);
 let q=o.uv*vec2f(input.shape.x,1)*input.pos.w;
 let c=cos(input.shape.y);let s=sin(input.shape.y);
 let rotated=vec2f(c*q.x-s*q.y,s*q.x+c*q.y);
 let center=vec2f(input.pos.x*p,(input.pos.y-180.)*p+180.);
 let world=center+rotated*p;
 o.pos=vec4f(world.x/(500.*u.viewport.x),world.y/500.-1.,0,1); return o;
}
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32{let i=floor(p);var f=fract(p);f=f*f*(vec2f(3.)-2.*f);return mix(mix(hash(i),hash(i+vec2f(1,0)),f.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),f.x),f.y);}
@fragment fn fs(i:Out)->@location(0) vec4f {
 let d=dot(i.uv,i.uv);if(d>1.){discard;}
 if(i.kind>.5){let n=noise(i.uv*3.1+vec2f(i.seed))+.5*noise(i.uv*7.7+vec2f(i.seed*.71))+.22*noise(i.uv*16.+vec2f(i.seed*.4));let a=pow(max(0.,1.-d),2.)*(.18+n*.7);return vec4f(i.tint.rgb,i.tint.a*a);}
 return vec4f(i.tint.rgb,i.tint.a*(exp(-d*34.)+exp(-d*5.)*.12));
}`;

function createCanvas(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fireworks-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  return canvas;
}
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${message}`);
  }
  return shader;
}
class WebGLAdapter {
  constructor(canvas, onLost) {
    this.canvas = canvas; this.backend = 'WebGL 2';
    const gl = canvas.getContext('webgl2', { alpha:true, antialias:false, premultipliedAlpha:true, powerPreference:'high-performance', preserveDrawingBuffer:false });
    if (!gl) throw new Error('WebGL 2 is not available. Try another browser or enable hardware acceleration.');
    this.gl = gl;
    const vs=compile(gl,gl.VERTEX_SHADER,VERTEX_GL), fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT_GL);
    const program=gl.createProgram(); gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    this.program=program; this.uniform=gl.getUniformLocation(program,'viewport');
    this.buffer=gl.createBuffer(); this.vao=gl.createVertexArray();
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,CAPACITY*FLOATS*4,gl.DYNAMIC_DRAW);
    for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,i*16);gl.vertexAttribDivisor(i,1);}
    this.onLost=e=>{e.preventDefault();onLost('Graphics were interrupted. Your show has been paused.');};
    canvas.addEventListener('webglcontextlost',this.onLost);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  }
  resize(width,height){this.canvas.width=width;this.canvas.height=height;this.gl.viewport(0,0,width,height);}
  render(data,count,smokeCount,aspect,time){
    const gl=this.gl;
    if(gl.isContextLost())return;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,count*FLOATS));gl.uniform4f(this.uniform,aspect,time,0,0);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,smokeCount);
    // Move instance attributes to the bright-particle portion without reallocating.
    for(let i=0;i<3;i++)gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,smokeCount*48+i*16);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,count-smokeCount);
    for(let i=0;i<3;i++)gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,i*16);
  }
  dispose(){
    this.canvas.removeEventListener('webglcontextlost',this.onLost);
    this.gl.deleteBuffer(this.buffer);this.gl.deleteVertexArray(this.vao);this.gl.deleteProgram(this.program);
    this.canvas.remove();
  }
}
class WebGPUAdapter {
  static async create(canvas,onLost){
    const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
    if(!adapter)throw new Error('No WebGPU adapter.');
    const device=await adapter.requestDevice();
    device.pushErrorScope('validation');
    try{
      const renderer=new WebGPUAdapter(canvas,device,onLost);
      const error=await device.popErrorScope();
      if(error){renderer.dispose();throw new Error(error.message);}
      return renderer;
    }catch(error){device.destroy();throw error;}
  }
  constructor(canvas,device,onLost){
    this.canvas=canvas;this.device=device;this.backend='WebGPU';this.disposed=false;
    this.context=canvas.getContext('webgpu');
    if(!this.context)throw new Error('No WebGPU context.');
    this.format=navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({device,format:this.format,alphaMode:'premultiplied'});
    this.buffer=device.createBuffer({size:CAPACITY*FLOATS*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
    this.uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const module=device.createShaderModule({code:WGSL});
    const layout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:'uniform'}}]});
    const pipelineLayout=device.createPipelineLayout({bindGroupLayouts:[layout]});
    this.bindGroup=device.createBindGroup({layout,entries:[{binding:0,resource:{buffer:this.uniform}}]});
    const makePipeline=(additive)=>device.createRenderPipeline({layout:pipelineLayout,
      vertex:{module,entryPoint:'vs',buffers:[{arrayStride:48,stepMode:'instance',attributes:[{shaderLocation:0,offset:0,format:'float32x4'},{shaderLocation:1,offset:16,format:'float32x4'},{shaderLocation:2,offset:32,format:'float32x4'}]}]},
      fragment:{module,entryPoint:'fs',targets:[{format:this.format,blend:{color:{srcFactor:'src-alpha',dstFactor:additive?'one':'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:additive?'one':'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'triangle-list'}});
    this.smokePipeline=makePipeline(false);this.sparkPipeline=makePipeline(true);
    this.uniformData=new Float32Array(4);
    device.lost.then(()=>{if(!this.disposed)onLost('The graphics device was lost. Your show has been paused.');});
    device.addEventListener('uncapturederror',event=>{if(!this.disposed)onLost(`Graphics error: ${event.error.message}`);});
  }
  resize(width,height){this.canvas.width=width;this.canvas.height=height;}
  render(data,count,smokeCount,aspect,time){
    const device=this.device;
    this.uniformData[0]=aspect;this.uniformData[1]=time;
    device.queue.writeBuffer(this.uniform,0,this.uniformData);
    if(count)device.queue.writeBuffer(this.buffer,0,data.buffer,0,count*FLOATS*4);
    const encoder=device.createCommandEncoder();
    const pass=encoder.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});
    pass.setBindGroup(0,this.bindGroup);pass.setVertexBuffer(0,this.buffer);
    pass.setPipeline(this.smokePipeline);pass.draw(6,smokeCount,0,0);
    pass.setPipeline(this.sparkPipeline);pass.draw(6,count-smokeCount,0,smokeCount);
    pass.end();device.queue.submit([encoder.finish()]);
  }
  dispose(){this.disposed=true;this.buffer.destroy();this.uniform.destroy();this.context.unconfigure();this.device.destroy();this.canvas.remove();}
}

/** Explicit compatibility path; same physics, lower fidelity than the GPU renderers. */
class CanvasAdapter {
  constructor(canvas){
    this.canvas=canvas;this.backend='Canvas 2D';this.ctx=canvas.getContext('2d',{alpha:true});
    if(!this.ctx)throw new Error('No supported graphics context.');
    this.sprites=new Map();
  }
  resize(width,height){this.canvas.width=width;this.canvas.height=height;}
  sprite(r,g,b,smoke){
    const rgb=[r,g,b].map(c=>Math.round(clamp(c,0,1)*10)*25.5);
    const key=rgb.join(',')+(smoke?'s':'p');
    if(this.sprites.has(key))return this.sprites.get(key);
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
    const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    const color=`${rgb[0]},${rgb[1]},${rgb[2]}`;
    if(smoke){gradient.addColorStop(0,`rgba(${color},.75)`);gradient.addColorStop(.4,`rgba(${color},.35)`);gradient.addColorStop(1,`rgba(${color},0)`);}
    else{gradient.addColorStop(0,`rgba(${color},1)`);gradient.addColorStop(.12,`rgba(${color},.75)`);gradient.addColorStop(.3,`rgba(${color},.14)`);gradient.addColorStop(1,`rgba(${color},0)`);}
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    if(this.sprites.size>256)this.sprites.delete(this.sprites.keys().next().value);
    this.sprites.set(key,c);return c;
  }
  render(data,count,smokeCount,aspect){
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,unit=h/1000;
    ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
    for(let i=0;i<count;i++){
      if(i===smokeCount)ctx.globalCompositeOperation='lighter';
      const o=i*12,p=1000/(1000+data[o+2]);
      const x=w*.5+data[o]*p*unit,y=h-((data[o+1]-180)*p+180)*unit;
      const size=data[o+3]*p*unit,smoke=data[o+10]>.5;
      if(x+size<0||x-size>w||y+size<0||y-size>h)continue;
      const a=clamp(data[o+7],0,1);if(a<.008)continue;
      const sprite=this.sprite(data[o+4],data[o+5],data[o+6],smoke);
      ctx.globalAlpha=a;
      if(smoke){ctx.drawImage(sprite,x-size*data[o+8],y-size,size*2*data[o+8],size*2);}
      else{ctx.drawImage(sprite,x-size,y-size,size*2,size*2);}
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  dispose(){this.sprites.clear();this.canvas.remove();}
}

/** Shared packing guarantees identical simulation and draw semantics on both backends. */
export class ParticleRenderer {
  constructor(adapter,host){
    this.adapter=adapter;this.host=host;this.backend=adapter.backend;
    this.data=new Float32Array(CAPACITY*FLOATS);this.width=1;this.height=1;
    this.environment=document.createElement('canvas');this.environment.className='environment-canvas';this.environment.setAttribute('aria-hidden','true');
    host.prepend(this.environment);
    this.glow=document.createElement('div');this.glow.className='atmosphere-glow';host.appendChild(this.glow);
  }
  resize(width,height,dpr=1){
    this.width=Math.max(1,width);this.height=Math.max(1,height);
    const bounded=Math.min(dpr,Math.sqrt(2400000/(this.width*this.height)));
    this.adapter.resize(Math.max(1,Math.round(width*bounded)),Math.max(1,Math.round(height*bounded)));
    this.paintEnvironment(Math.round(width),Math.round(height));
  }
  paintEnvironment(w,h){
    const c=this.environment;c.width=w;c.height=h;const ctx=c.getContext('2d');
    if(!ctx)return;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#050910');sky.addColorStop(.52,'#0b1420');sky.addColorStop(.81,'#19212b');sky.addColorStop(1,'#080c10');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const r=random(8187);
    for(let i=0;i<95;i++){const x=r()*w,y=r()*h*.71,opacity=.12+r()*.35;ctx.fillStyle=`rgba(186,198,216,${opacity})`;ctx.beginPath();ctx.arc(x,y,r()*.6+.15,0,Math.PI*2);ctx.fill();}
    const horizon=h*.804;
    const haze=ctx.createRadialGradient(w*.5,horizon,0,w*.5,horizon,w*.55);haze.addColorStop(0,'rgba(118,103,84,.075)');haze.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
    // Two distant tree lines, then an unlit open festival ground. Original procedural art.
    for(let layer=0;layer<2;layer++){
      ctx.fillStyle=layer?'#080d12':'#101820';
      const y0=horizon+layer*9;
      ctx.beginPath();ctx.moveTo(0,h);
      for(let x=0;x<=w+4;x+=3){const n=Math.sin(x*.023)*3+Math.sin(x*.079)*2+r()*5;ctx.lineTo(x,y0-n);}
      ctx.lineTo(w,h);ctx.closePath();ctx.fill();
      for(let i=0;i<60;i++){const x=r()*w,size=(5+r()*12)*(h/900);for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+(r()-.5)*size,y0-size*.25-r()*size*.25,size*(.5+r()*.35),size*(.45+r()*.4),0,0,Math.PI*2);ctx.fill();}}
    }
    for(let i=0;i<14;i++){
      const x=r()*w,y=horizon+3+r()*8;
      const light=ctx.createRadialGradient(x,y,0,x,y,5);light.addColorStop(0,'rgba(223,171,100,.38)');light.addColorStop(1,'rgba(223,171,100,0)');ctx.fillStyle=light;ctx.fillRect(x-5,y-5,10,10);
    }
    const ground=ctx.createLinearGradient(0,horizon,0,h);ground.addColorStop(0,'rgba(8,13,18,0)');ground.addColorStop(1,'#06090d');ctx.fillStyle=ground;ctx.fillRect(0,horizon,w,h-horizon);
    for(let i=0;i<300;i++){const x=r()*w,y=horizon+r()*(h-horizon);ctx.fillStyle=`rgba(84,84,72,${r()*.045})`;ctx.fillRect(x,y,1+r()*3,1);}
  }
  render(sim){
    const out=this.data;let n=0;
    const add=(x,y,z,size,r,g,b,a,stretch=1,angle=0,kind=0,seed=0)=>{
      if(n>=CAPACITY)return;
      const o=n++*FLOATS;out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=size;
      out[o+4]=r;out[o+5]=g;out[o+6]=b;out[o+7]=a;out[o+8]=stretch;out[o+9]=angle;out[o+10]=kind;out[o+11]=seed;
    };
    const lightAt=(x,y)=>{
      let r=0,g=0,b=0;
      for(const l of sim.lights){const d=((x-l.x)**2+(y-l.y)**2)/55000;const v=Math.exp(-l.age*2.4)/(1+d)*l.scale*(sim.reduced?.4:1);r+=l.r*v;g+=l.g*v;b+=l.b*v;}
      return [r,g,b];
    };
    for(let i=0;i<5;i++){
      const x=(i-2)*320+Math.sin(sim.time*.005+i)*35,y=720+Math.sin(i*2)*100;
      const l=lightAt(x,y);add(x,y,250,160,.1+l[0]*.3,.12+l[1]*.3,.16+l[2]*.3,.08,2.8,-.05,1,i*311);
    }
    const smoke=sim.smoke.data;
    for(let i=0;i<sim.smoke.count;i++){
      const life=smoke.age[i]/smoke.life[i],a=Math.min(1,smoke.age[i]*2)*(1-life)**1.4;
      const l=lightAt(smoke.x[i],smoke.y[i]);
      add(smoke.x[i],smoke.y[i],smoke.z[i],smoke.size[i],.11+l[0]*.62,.12+l[1]*.62,.14+l[2]*.62,a*.23,1.7,smoke.seed[i]*.01,1,smoke.seed[i]);
    }
    const smokeCount=n;
    const pixel=clamp(1000/this.height,.7,1.8);
    const t=sim.trails.data;
    for(let i=0;i<sim.trails.count;i++){
      const age=t.age[i]/t.life[i],fade=(1-age)**1.65;
      const flicker=sim.reduced?1:.83+.17*Math.sin(t.seed[i]+sim.time*13);
      add(t.x[i],t.y[i],t.z[i],t.size[i]*pixel,t.r[i],t.g[i]*(1-age*.55),t.b[i]*(1-age*.8),fade*flicker*1.35);
    }
    const s=sim.stars.data;
    for(let i=0;i<sim.stars.count;i++){
      const age=s.age[i]/s.life[i],fade=Math.min(1,(1-age)*3);
      let r=s.r[i],g=s.g[i],b=s.b[i];
      if(s.kind[i]===3){g*=1-age*.83;b*=1-age*.94;}
      const flicker=sim.reduced?1:.9+.1*Math.sin(s.seed[i]+sim.time*19);
      add(s.x[i],s.y[i],s.z[i],3.1*pixel,r,g,b,fade*flicker*1.6,1.15,Math.atan2(s.vy[i],s.vx[i]));
    }
    for(const a of sim.active)if(a.stage==='ascent')add(a.x,a.y,0,4*pixel,1,.88,.6,2,2.2,Math.PI/2);
    this.adapter.render(out,n,smokeCount,sim.aspect,sim.time);
    let r=0,g=0,b=0;
    for(const l of sim.lights){const a=Math.exp(-l.age*3)*l.scale;r+=l.r*a;g+=l.g*a;b+=l.b*a;}
    this.glow.style.background=`radial-gradient(ellipse at 50% 65%,rgba(${Math.round(clamp(r,0,1)*210)},${Math.round(clamp(g,0,1)*210)},${Math.round(clamp(b,0,1)*210)},${sim.reduced?.022:.075}),transparent 75%)`;
  }
  dispose(){this.adapter.dispose();this.environment.remove();this.glow.remove();}
}

export async function createRenderer(host,{preference='auto',onLost=()=>{}}={}){
  if(preference==='canvas')return new ParticleRenderer(new CanvasAdapter(createCanvas(host)),host);
  if(preference==='webgpu'&&(!navigator.gpu||!window.isSecureContext))throw new Error('WebGPU is unavailable in this browser. Use automatic or compatibility graphics.');
  if(preference!=='webgl' && navigator.gpu && window.isSecureContext){
    const canvas=createCanvas(host);
    try{
      const adapter=await WebGPUAdapter.create(canvas,onLost);
      return new ParticleRenderer(adapter,host);
    }catch(error){canvas.remove();if(preference==='webgpu')throw error;}
  }
  const canvas=createCanvas(host);
  try{return new ParticleRenderer(new WebGLAdapter(canvas,onLost),host);}catch(error){
    canvas.remove();if(preference==='webgl')throw error;
    return new ParticleRenderer(new CanvasAdapter(createCanvas(host)),host);
  }
}
