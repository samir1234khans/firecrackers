import { hash01 } from './catalog.js';
import { BURST_LIGHT_CAPACITY, burstLightEnergy, limitBurstRadiance } from './BurstLighting.js';
import type { BurstSource } from './BurstLighting.js';
/** Stable depth/eddy variation uses hashes, not any launch or show random stream. */
export function smokeLayer(id:number):number{return Math.floor(hash01(id,5813)*3);}
export function canopyAlpha(age:number,life:number,opacity:number,kind:number):number {
  const t=Math.max(0,Math.min(1,age/Math.max(.01,life)));
  const attack=1-Math.exp(-age*(kind===2?1.9:3));
  return attack*Math.pow(1-t,kind===2?1.65:1.4)*opacity*(kind===2?.72:.86);
}
export function canopyStretch(id:number,age:number):number{return 1+.11*Math.sin(age*.38+hash01(id,854)*Math.PI*2);}
/** Caller-owned RGB and world light direction: at most 12 sources, no allocations. */
export function illuminateSmoke(lights:readonly BurstSource[],x:number,y:number,z:number,reduced:boolean,out:Float32Array):void {
  out.fill(0);
  for(let i=0;i<Math.min(lights.length,BURST_LIGHT_CAPACITY);i++){
    const light=lights[i],lx=light.x-x,ly=light.y-y,lz=light.z-z;
    const d2=lx*lx+ly*ly+lz*lz;
    const power=burstLightEnergy(light,reduced)*Math.exp(-d2/(2*48*48));
    out[0]+=light.r*power;out[1]+=light.g*power;out[2]+=light.b*power;
    const gain=power/Math.max(1,Math.sqrt(d2));out[3]+=lx*gain;out[4]+=ly*gain;out[5]+=lz*gain;
  }
  limitBurstRadiance(out,1.3);
}
