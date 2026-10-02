// Exploratory whole-frame screening, not a WCAG conformance analyzer.
// Decode recorded SDR video at 30Hz; compare 250ms-separated states at 1/4 size.
// Downsampling, compression and this state-difference test can miss fine or
// gradual opposing transitions. Never replace flash-pair analysis with this.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [out,...files]=process.argv.slice(2);
if(!out||!files.length)throw Error('Usage: node tests/always-play-frame-screening.mjs output.json video.webm ...');
const server=createServer(async(req,res)=>{const index=Number(req.url?.slice(1));if(!Number.isInteger(index)||!files[index]){res.writeHead(404).end();return;}const file=files[index],size=(await stat(file)).size;
 const range=req.headers.range;const match=range?.match(/bytes=(\d+)-(\d*)/);const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(size-1,Number(match[2])):size-1;
 res.writeHead(match?206:200,{'Content-Type':'video/webm','Accept-Ranges':'bytes','Content-Length':end-start+1,...(match?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});createReadStream(file,{start,end}).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true});const rows=[];
try{for(let index=0;index<files.length;index++){
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${port}/${index}`);
 const result=await page.evaluate(async()=>{
  const video=document.querySelector('video');if(video.readyState<1)await new Promise(resolve=>video.addEventListener('loadedmetadata',resolve,{once:true}));video.pause();
  const width=Math.round(video.videoWidth/4),height=Math.round(video.videoHeight/4),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const count=width*height,history=[],linear=Array.from({length:256},(_,v)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
  const windowWidth=Math.min(width,Math.round(341/4)),windowHeight=Math.min(height,64);
  function largest(mask){const stride=width+1,sum=new Uint32Array(stride*(height+1));for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y+1)*stride+x+1;sum[i]=mask[y*width+x]+sum[i-1]+sum[i-stride]-sum[i-stride-1];}
   let max=0;for(let y=windowHeight;y<=height;y++)for(let x=windowWidth;x<=width;x++){const a=y*stride+x,b=(y-windowHeight)*stride+x;max=Math.max(max,sum[a]-sum[a-windowWidth]-sum[b]+sum[b-windowWidth]);}return max/(windowWidth*windowHeight);
  }
  let maxGeneral=0,maxRed=0,atGeneral=0,atRed=0,samples=0;
  for(let t=.01;t<video.duration-.04;t+=1/30){await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=t;});ctx.drawImage(video,0,0,width,height);const rgba=ctx.getImageData(0,0,width,height).data,now=new Float32Array(count*4);
   for(let i=0;i<count;i++){const r=linear[rgba[i*4]],g=linear[rgba[i*4+1]],b=linear[rgba[i*4+2]],X=.4124564*r+.3575761*g+.1804375*b,Y=.2126729*r+.7151522*g+.072175*b,Z=.0193339*r+.119192*g+.9503041*b,d=X+15*Y+3*Z;now[i*4]=Y;now[i*4+1]=d?4*X/d:0;now[i*4+2]=d?9*Y/d:0;now[i*4+3]=r+g+b?r/(r+g+b):0;}
   if(history.length===8){const old=history.shift(),general=new Uint8Array(count),red=new Uint8Array(count);for(let i=0;i<count;i++){const k=i*4;general[i]=Math.abs(now[k]-old[k])>=.1&&Math.min(now[k],old[k])<.8?1:0;red[i]=Math.max(now[k+3],old[k+3])>=.8&&Math.hypot(now[k+1]-old[k+1],now[k+2]-old[k+2])>.2?1:0;}
    const g=largest(general),r=largest(red);if(g>maxGeneral){maxGeneral=g;atGeneral=t;}if(r>maxRed){maxRed=r;atRed=t;}samples++;
   }history.push(now);
  }return{duration:video.duration,sourceWidth:video.videoWidth,sourceHeight:video.videoHeight,samples,maxGeneralStateDifferenceArea:maxGeneral,maxRedStateDifferenceArea:maxRed,atGeneral,atRed,windowWidth,windowHeight};
 });rows.push({file:files[index],...result});console.log('SCREENED',files[index],JSON.stringify(result));await page.close();
}}finally{await browser.close();server.close();await writeFile(out,JSON.stringify({method:'Exploratory SDR 30Hz recorded whole-frame state differences, quarter resolution, 341x256 CSS pixel moving-window approximation; includes waterfront reflections and UI. No opposing-flash pair or frequency conformance result. Compression/downsampling/250ms differencing can miss fine, fast or gradual transitions. Formal WCAG flash conformance remains unqualified.',rows},null,2));}
