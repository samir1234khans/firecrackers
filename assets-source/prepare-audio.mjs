import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('public/audio',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/?backend=canvas');
for(const n of [1,2,3]){
 const bytes=await fs.readFile(`../../audio-source/recordings/fw_0${n}.ogg`);
 const samples=await page.evaluate(async base64=>{
   const a=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)); const context=new AudioContext(); const decoded=await context.decodeAudioData(a.buffer);
   const length=Math.min(6,decoded.duration), offline=new OfflineAudioContext(1,Math.ceil(length*22050),22050); const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const buffer=await offline.startRendering();await context.close();return [...buffer.getChannelData(0)];
 },bytes.toString('base64'));
 const peak=Math.max(...samples.map(Math.abs).filter((_,i)=>i%4===0));
 const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++){const fade=Math.min(1,i/220,(samples.length-i)/2200);wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]*.7/Math.max(.01,peak)*fade))*32767),44+i*2);}
 await fs.writeFile(`public/audio/report-0${n}.wav`,wav);console.log(n,samples.length/22050,wav.length,peak);
}
await browser.close();
