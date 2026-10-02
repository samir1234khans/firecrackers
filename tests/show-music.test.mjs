import test from 'node:test';
import assert from 'node:assert/strict';
import { ShowMusic } from '../.test-build/engine/ShowMusic.js';
import { CinematicDirector } from '../.test-build/engine/CinematicDirector.js';
class Param {value=0;check(t){assert.ok(Number.isFinite(t)&&t>=0,'AudioParam times must be nonnegative');}setValueAtTime(v,t){this.check(t);this.value=v;}setTargetAtTime(v,t){this.check(t);this.value=v;}linearRampToValueAtTime(v,t){this.check(t);this.value=v;}cancelScheduledValues(t){this.check(t);}}
class Context {
 currentTime=0;state='running';sampleRate=48000;sources=[];
 createGain(){return {gain:new Param(),connect(){},disconnect(){}};}
 createBufferSource(){const c=this;const s={buffer:null,onended:null,connect(){},disconnect(){},start(at,offset){s.at=at;s.offset=offset;},stop(at=c.currentTime){s.end=at;}};this.sources.push(s);return s;}
 async decodeAudioData(){return {duration:15.15,length:727200,numberOfChannels:2};}
 step(t){this.currentTime=t;for(const s of this.sources)if(s.end<=t&&!s.ended){s.ended=true;s.onended?.();}}
}
const flush=()=>new Promise(r=>setImmediate(r));
const setup=()=>{const c=new Context(),m=new ShowMusic(c,c.createGain(),'/'),d=new CinematicDirector();d.reset(0,'cycle');return {c,m,d};};
test('music makes no requests or voices until separately enabled',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 const {m,d}=setup();m.update('festival',d,0);await flush();assert.equal(calls,0);assert.equal(m.diagnostics().musicVoices,0);
 m.options(true,.3);m.update('festival',d,0);await flush();m.update('festival',d,0);assert.equal(calls,2);assert.equal(m.diagnostics().musicVoices,1);assert.ok(m.diagnostics().musicBytes<=24*1024*1024);m.dispose();
});
test('recorded transport follows phrase boundaries, resume offsets and bounded voices',async()=>{
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 const {c,m,d}=setup();m.options(true,.3);m.update('festival',d,0);await flush();m.update('festival',d,0);
 c.step(14.85);d.update(14.85);m.update('festival',d,14.85);assert.equal(m.diagnostics().musicVoices,2);
 c.step(15.2);d.update(15.2);m.update('festival',d,15.2);await flush();assert.ok(m.diagnostics().musicVoices<=2);
 m.suspend(true);c.step(16);const count=c.sources.length;m.update('festival',d,15.2);assert.equal(c.sources.length,count);
 m.suspend(false);m.update('festival',d,15.2);await flush();m.update('festival',d,15.2);assert.ok(c.sources.at(-1).offset>=.275-1e-8);
 m.update(null,d,15.2);c.step(16.3);assert.equal(m.diagnostics().musicVoices,0);m.dispose();
});
test('theme choice joins matching phrase and never restarts the opening',async()=>{
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 const {c,m,d}=setup();m.options(true,.3);d.update(12);c.step(12);m.update('festival',d,12);await flush();m.update('festival',d,12);
 d.request('golden');m.update('festival',d,12);await flush();c.step(15.2);d.update(15.2);m.update('festival',d,15.2);await flush();m.update('festival',d,15.2);
 assert.equal(d.theme,'golden');assert.ok(c.sources.at(-1).offset>=.275-1e-8);assert.equal(m.diagnostics().musicResyncs,0);m.dispose();
});
test('missing assets give one quiet failure, never interrupt the score or retry indefinitely',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return {ok:false,status:404};};
 const {m,d}=setup();m.options(true,.3);m.update('finale',d,0);await flush();for(let i=0;i<100;i++)m.update('finale',d,0);
 assert.equal(calls,2);assert.equal(m.diagnostics().musicVoices,0);assert.match(m.diagnostics().musicFailure,/visual show continues/);assert.equal(d.phase,0);m.dispose();
});
test('oversized decoded buffers are rejected; unsupported audio keeps silent visuals',async()=>{
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 const {c,m,d}=setup();c.decodeAudioData=async()=>({duration:15.15,length:10_000_000,numberOfChannels:2});m.options(true,.3);m.update('festival',d,0);await flush();assert.equal(m.diagnostics().musicBuffers,0);assert.equal(m.diagnostics().musicVoices,0);m.dispose();
});
