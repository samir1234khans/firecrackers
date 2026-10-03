import { downloadBlob } from './NightLibrary.js';
export type CaptureResult={kind:'photo'|'video';url:string;blob:Blob;width:number;height:number;seconds:number;audio:boolean;reason:string};
export type CaptureSnapshot={recording:boolean;seconds:number;limit:number;result:CaptureResult|null;error:string};
const MAX_BYTES=24*1024*1024;
const MAX_EDGE=1280;
export function captureSize(width:number,height:number):[number,number]{const scale=Math.min(1,MAX_EDGE/Math.max(width,height));return [Math.max(1,Math.floor(width*scale)),Math.max(1,Math.floor(height*scale))];}
export function chooseRecordingType(supports:(mime:string)=>boolean):string|null {return ['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/mp4','video/webm'].find(supports)??null;}
/** Copies only presented scene pixels into one bounded 2D canvas. Never captures the screen or microphone. */
export class SceneCapture {
  snapshot:CaptureSnapshot={recording:false,seconds:0,limit:15,result:null,error:''};
  onChange:()=>void=()=>{};
  private copy:HTMLCanvasElement|null=null;
  private context:CanvasRenderingContext2D|null=null;
  private recorder:MediaRecorder|null=null;
  private stream:MediaStream|null=null;
  private chunks:Blob[]=[];
  private bytes=0;
  private source:HTMLCanvasElement|null=null;
  private frameTime=-Infinity;
  private started=0;
  private timer:ReturnType<typeof setTimeout>|null=null;
  private releaseAudio:(()=>void)|null=null;
  private disposed=false;
  private generation=0;
  private audio=false;
  private reason='';
  private createCopy(canvas:HTMLCanvasElement){
    const [w,h]=captureSize(canvas.width,canvas.height);
    if(w<=1||h<=1)throw new Error('The scene has not drawn a usable frame yet.');
    this.copy=document.createElement('canvas');this.copy.width=w;this.copy.height=h;this.context=this.copy.getContext('2d');
    if(!this.context)throw new Error('Image capture is unavailable in this browser.');
    this.source=canvas;this.context.drawImage(canvas,0,0,w,h);
    // A small probe detects common black/cleared GPU buffers without reading the full frame each time.
    const probe=document.createElement('canvas');probe.width=32;probe.height=32;
    const p=probe.getContext('2d')!;p.drawImage(this.copy,0,0,32,32);
    const values=p.getImageData(0,0,32,32).data;
    let visible=false;for(let i=0;i<values.length;i+=4)if(values[i]+values[i+1]+values[i+2]>24&&values[i+3]>0){visible=true;break;}
    if(!visible)throw new Error('This renderer did not expose a usable image. Try capturing after a burst, or use WebGL/Canvas graphics.');
  }
  async photo(canvas:HTMLCanvasElement,render:()=>void):Promise<void>{
    if(this.snapshot.recording)throw new Error('Stop the clip before taking a photo.');
    const token=++this.generation;this.snapshot.error='';
    try{
      render();this.createCopy(canvas);const copy=this.copy!;
      const blob=await new Promise<Blob>((resolve,reject)=>copy.toBlob(b=>b?resolve(b):reject(new Error('This browser could not encode the image.')),'image/png'));
      if(this.disposed||token!==this.generation)return;
      this.setResult({kind:'photo',url:'',blob,width:copy.width,height:copy.height,seconds:0,audio:false,reason:''});
    }catch(error){this.fail(error);throw error;}finally{this.releaseCopy();}
  }
  start(canvas:HTMLCanvasElement,render:()=>void,limit:number,audio?:{stream:MediaStream;release:()=>void}):void{
    if(this.snapshot.recording) {audio?.release();throw new Error('A clip is already recording.');}
    this.snapshot.error='';this.reason='';this.bytes=0;this.chunks=[];
    this.releaseAudio=audio?.release??null;this.audio=Boolean(audio);
    try{
      if(typeof MediaRecorder==='undefined'||typeof canvas.captureStream!=='function')throw new Error('Video recording is unavailable here. Capture a photo instead.');
      const mime=chooseRecordingType(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw new Error('No supported recording format. Capture a photo instead.');
      render();this.createCopy(canvas);this.stream=this.copy!.captureStream(24);
      if(audio)for(const track of audio.stream.getAudioTracks())this.stream.addTrack(track);
      const recorder=new MediaRecorder(this.stream,{mimeType:mime,videoBitsPerSecond:4000000,audioBitsPerSecond:128000});
      this.recorder=recorder;this.started=performance.now();this.frameTime=-Infinity;
      this.snapshot={...this.snapshot,recording:true,seconds:0,limit:limit===30?30:15};
      recorder.ondataavailable=e=>{if(!e.data.size)return;if(this.bytes+e.data.size>MAX_BYTES){this.snapshot.error='The 24 MB clip limit was reached. The incomplete clip was discarded; try 15 seconds.';this.stop(this.snapshot.error);return;}this.bytes+=e.data.size;this.chunks.push(e.data);};
      recorder.onerror=()=>{this.snapshot.error='The browser encoder failed. The incomplete clip was discarded.';this.reason=this.snapshot.error;this.stop(this.reason);};
      recorder.onstop=()=>{
        const copy=this.copy,elapsed=this.snapshot.seconds,blobs=this.chunks;
        if(!this.disposed&&!this.snapshot.error&&copy&&blobs.length){const blob=new Blob(blobs,{type:recorder.mimeType});this.setResult({kind:'video',url:'',blob,width:copy.width,height:copy.height,seconds:elapsed,audio:this.audio,reason:this.reason});}
        this.release();this.snapshot.recording=false;this.onChange();
      };
      recorder.start(250);
      this.timer=setTimeout(()=>this.stop('Clip complete.'),this.snapshot.limit*1000);
      this.onChange();
    }catch(error){this.release();this.snapshot.recording=false;this.fail(error);throw error;}
  }
  /** Called immediately after the application's real render, never a second animation loop. */
  frame(canvas:HTMLCanvasElement|null,simTime:number){
    if(!this.snapshot.recording)return;
    if(!canvas||canvas!==this.source){this.stop('Recording finished because the renderer changed.');return;}
    if(simTime-this.frameTime<1/24)return;
    this.frameTime=simTime;
    const elapsed=(performance.now()-this.started)/1000;
    this.snapshot.seconds=Math.min(this.snapshot.limit,Math.round(elapsed*10)/10);
    try{this.context?.drawImage(canvas,0,0,this.copy!.width,this.copy!.height);}catch{this.stop('Recording finished because the scene became unavailable.');}
    if(elapsed>=this.snapshot.limit)this.stop('Clip complete.');
  }
  stop(reason='Recording stopped.'){
    if(!this.snapshot.recording)return;this.reason=reason;
    this.snapshot.seconds=Math.min(this.snapshot.limit,Math.round((performance.now()-this.started)/100)/10);
    if(this.timer)clearTimeout(this.timer);this.timer=null;
    if(this.recorder?.state!=='inactive'){try{this.recorder?.stop();}catch{this.release();this.snapshot.recording=false;}}
    this.onChange();
  }
  private fail(error:unknown){this.snapshot.error=error instanceof Error?error.message:'Capture failed. Try a photo instead.';this.onChange();}
  private setResult(result:CaptureResult){this.discard();result.url=URL.createObjectURL(result.blob);this.snapshot.result=result;this.onChange();}
  discard(){if(this.snapshot.result)URL.revokeObjectURL(this.snapshot.result.url);this.snapshot.result=null;}
  download(){const r=this.snapshot.result;if(r)downloadBlob(r.blob,r.kind==='photo'?'firecrackers.png':r.blob.type.includes('mp4')?'firecrackers.mp4':'firecrackers.webm');}
  async share():Promise<string>{
    const r=this.snapshot.result;if(!r)throw new Error('Capture a moment first.');
    const name=r.kind==='photo'?'firecrackers.png':r.blob.type.includes('mp4')?'firecrackers.mp4':'firecrackers.webm';
    const file=new File([r.blob],name,{type:r.blob.type});
    if(!navigator.canShare?.({files:[file]})||!navigator.share){this.download();return 'Native sharing is unavailable; download requested.';}
    try{await navigator.share({files:[file],title:'A night of fireworks'});return 'Share action completed.';}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return 'Sharing cancelled.';throw error;}
  }
  private releaseCopy(){if(this.copy){this.copy.width=this.copy.height=1;}this.copy=null;this.context=null;this.source=null;}
  private release(){if(this.timer)clearTimeout(this.timer);this.timer=null;this.stream?.getTracks().forEach(t=>t.stop());this.releaseAudio?.();this.releaseAudio=null;this.stream=null;if(this.recorder){this.recorder.ondataavailable=null;this.recorder.onstop=null;this.recorder.onerror=null;}this.recorder=null;this.chunks=[];this.bytes=0;this.releaseCopy();}
  dispose(){this.disposed=true;this.generation++;if(this.recorder?.state==='recording')this.recorder.stop();this.release();this.discard();this.snapshot.recording=false;this.onChange=()=>{};}
}
