import { CONFIG_VERSION } from '../engine/catalog.js';
import { downloadBlob } from './NightLibrary.js';
/** Explicit, local, bounded diagnostics. No network transport and no hardware/thermal inference. */
export class SessionDiagnostics {
  private intervals=new Float32Array(1800);
  private count=0;
  private cursor=0;
  private observer:PerformanceObserver|null=null;
  private changes:{at:number;backend:string;quality:string;scale:number}[]=[];
  private lastState='';
  private started=0;
  private lastFrame=0;
  private longFrames=0;
  private maxLongFrame=0;
  private loaf=false;
  active=false;
  start(){this.stop();this.count=this.cursor=this.longFrames=this.maxLongFrame=0;this.changes=[];this.lastState='';this.lastFrame=0;this.started=performance.now();this.active=true;
    this.loaf=typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('long-animation-frame');
    if(this.loaf){try{this.observer=new PerformanceObserver(list=>{for(const e of list.getEntries()){this.longFrames++;this.maxLongFrame=Math.max(this.maxLongFrame,e.duration);}});this.observer.observe({type:'long-animation-frame',buffered:false});}catch{this.loaf=false;}}
  }
  frame(now:number,backend:string,quality:string,scale:number){
    if(!this.active)return;
    if(now-this.started>60000){this.stop();return;}
    const interval=now-this.lastFrame;
    if(this.lastFrame&&interval>0&&interval<5000){this.intervals[this.cursor++%this.intervals.length]=interval;this.count=Math.min(this.count+1,this.intervals.length);}
    this.lastFrame=now;
    const state=`${backend}:${quality}:${scale}`;
    if(state!==this.lastState&&this.changes.length<32){this.changes.push({at:Math.round(now-this.started),backend,quality,scale});this.lastState=state;}
  }
  pause(){this.lastFrame=0;}
  stop(){this.active=false;this.observer?.disconnect();this.observer=null;this.lastFrame=0;}
  report(){const values=Array.from(this.intervals.subarray(0,this.count)).sort((a,b)=>a-b);return {
    config:CONFIG_VERSION,method:'Opt-in local render-interval samples; not GPU completion or thermal measurements',samples:values.length,
    p50Ms:values.length?values[Math.floor((values.length-1)*.5)]:null,p95Ms:values.length?values[Math.floor((values.length-1)*.95)]:null,
    longAnimationFrames:this.loaf?{count:this.longFrames,maximumMs:this.maxLongFrame}:'unavailable',changes:this.changes,
    physicalDeviceQualified:false,gpuCompletionTiming:'not collected',temperature:'not available',
  };}
  download(){downloadBlob(new Blob([JSON.stringify(this.report(),null,2)],{type:'application/json'}),'firecrackers-session-diagnostics.json');}
}
