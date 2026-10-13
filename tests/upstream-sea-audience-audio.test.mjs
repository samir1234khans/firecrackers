import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../.test-build/engine/Audio.js';
const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
const node=()=>({connect(){},disconnect(){},gain:parameter(),frequency:parameter(),pan:parameter(),playbackRate:parameter(),start(){this.started=true;},stop(){this.stopped=true;}});
test('audience sound uses consent, two voices inside global budget, silence on pause/mute and failed vocals',async()=>{
 globalThis.document={hidden:false};let sources=[];
 const context={state:'running',currentTime:10,suspend(){return Promise.resolve();},resume(){return Promise.resolve();},createBufferSource(){const s=node();sources.push(s);return s;},createBiquadFilter:node,createGain:node,createStereoPanner:node};
 const audio=new AudioEngine(undefined,true);audio.context=context;audio.master=node();audio.noise={duration:3};audio.audienceSample={duration:4.133};
 const cues=Array.from({length:5},(_,person)=>({boat:0,person,time:0,kind:person%2?'clap':'cheer',strength:1}));const boats=[{x:-20,z:-50}];
 audio.consumeAudience(cues,boats,100);assert.equal(sources.length,0,'no consent');audio.enabled=true;
 audio.consumeAudience(cues,boats,100);assert.equal(audio.audienceDiagnostics().voices,2);assert.equal(audio.diagnostics().audioVoices,2);
 audio.setSuspended(true);assert.equal(audio.diagnostics().audioVoices,0);audio.consumeAudience(cues,boats,100);assert.equal(audio.diagnostics().audioVoices,0);
 audio.setSuspended(false);audio.audienceSample=null;audio.audienceFailure=true;audio.consumeAudience([{...cues[0],kind:'cheer'},{...cues[1],kind:'clap'}],boats,100);assert.equal(audio.audienceDiagnostics().voices,1,'failed vocal leaves procedural clap');
 await audio.configure(false,.35,false,false);assert.equal(audio.diagnostics().audioVoices,0);
 audio.enabled=true;document.hidden=true;audio.consumeAudience(cues,boats,100);assert.equal(audio.diagnostics().audioVoices,0);document.hidden=false;
 audio.voices=new Set(Array.from({length:38},node));audio.consumeAudience(cues,boats,100);assert.equal(audio.diagnostics().audioVoices,38,'audience does not displace reports');audio.cancelScheduled();
});
