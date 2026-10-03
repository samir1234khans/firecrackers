import { useRef, useState, useEffect } from 'react';
import { Camera, Download, Share2, Square, Video } from 'lucide-react';
import type { CaptureSnapshot } from '../experience/SceneCapture';
import { Toggle } from './Dialog';
type Props={capture:CaptureSnapshot;sound:boolean;onPhoto:()=>Promise<void>;onStart:(seconds:number,audio:boolean)=>void;onStop:()=>void;onDownload:()=>void;onShare:()=>Promise<string>|undefined;onDiscard:()=>void;onWatch:()=>void};
export default function CapturePanel(p:Props){
  const [duration,setDuration]=useState(15),[audio,setAudio]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const supported=typeof MediaRecorder!=='undefined'&&typeof HTMLCanvasElement.prototype.captureStream==='function';
  const photo=async()=>{setBusy(true);setMessage('');try{await p.onPhoto();}catch(e){if(mounted.current)setMessage((e as Error).message);}finally{if(mounted.current)setBusy(false);}};
  const start=()=>{try{p.onStart(duration,audio&&p.sound);p.onWatch();}catch(e){setMessage((e as Error).message);}};
  const result=p.capture.result;
  return <div className='capture-panel'>
    <p className='panel-note'>Keep the sky and waterfront, without controls. Everything stays on this device until you choose to share.</p>
    <div className='studio-actions'><button type='button' className='primary-button' disabled={busy||p.capture.recording} onClick={()=>void photo()}><Camera size={17}/>{busy?'Preparing photo…':'Take photo'}</button>{p.capture.recording?<button type='button' className='secondary-button' onClick={p.onStop}><Square size={17}/>Stop recording</button>:<button type='button' className='secondary-button' disabled={!supported||busy} onClick={start}><Video size={17}/>Record clip</button>}</div>
    {!supported&&<p className='studio-status'>This browser does not offer video recording. Photos remain available.</p>}
    <label className='setting-row'><span>Maximum clip length</span><select aria-label='Maximum clip length' value={duration} onChange={e=>setDuration(Number(e.target.value))} disabled={p.capture.recording}><option value={15}>15 seconds</option><option value={30}>30 seconds</option></select></label>
    <Toggle label='Include app audio' detail={p.sound?'Only the sound you enabled in this app. No microphone.':'Enable sound from the scene first; silent capture remains available.'} checked={audio&&p.sound} disabled={!p.sound||p.capture.recording} onChange={setAudio}/>
    <p className='fine-print'>Up to 1280 pixels on the longest edge; no upscaling. Format depends on your browser. Pause, opening a panel, hiding the page or rotating the device finishes a clip. Flashing effects remain in exported media.</p>
    {(message||p.capture.error)&&<p className='studio-status' role='status'>{message||p.capture.error}</p>}
    {result&&<section className='capture-result' aria-label='Capture preview'>
      <h3>{result.kind==='photo'?'Your photo':'Your clip'}</h3>
      {result.kind==='photo'?<img src={result.url} alt='Captured fireworks and waterfront'/>:<video src={result.url} controls playsInline preload='metadata' aria-label='Captured fireworks clip'/>}
      <p>{result.width} × {result.height} · {result.kind==='photo'?'PNG':`${result.blob.type.split(';')[0]} · ${result.seconds.toFixed(1)} seconds · ${result.audio?'app audio':'silent'}`} · {(result.blob.size/1024/1024).toFixed(1)} MB</p>
      {result.reason&&<p className='fine-print'>{result.reason}</p>}
      <div className='studio-actions'><button className='primary-button' type='button' onClick={p.onDownload}><Download size={16}/>Download</button><button className='secondary-button' type='button' onClick={()=>{void p.onShare()?.then(text=>{if(mounted.current)setMessage(text);},e=>{if(mounted.current)setMessage(e.message||'Sharing was unavailable. Download instead.');});}}><Share2 size={16}/>Share</button><button className='text-button' type='button' onClick={p.onDiscard}>Discard</button></div>
    </section>}
  </div>;
}
