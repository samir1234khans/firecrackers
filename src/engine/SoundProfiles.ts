import { FAMILIES } from './catalog.js';
export type SoundProfile={body:number;decay:number;snap:number;pitch:number;echo:number;grains:number;whistle:number;sample:number};
/** Authored virtual sound colour, not physical shell specifications. Stable catalog order. */
export const SOUND_PROFILES:readonly SoundProfile[]=Object.freeze([
  {body:230,decay:2.0,snap:1100,pitch:64,echo:.32,grains:5,whistle:0,sample:0},
  {body:410,decay:1.2,snap:2400,pitch:85,echo:.21,grains:0,whistle:940,sample:1},
  {body:330,decay:1.6,snap:1900,pitch:76,echo:.26,grains:3,whistle:0,sample:2},
  {body:480,decay:1.0,snap:2900,pitch:91,echo:.18,grains:2,whistle:720,sample:1},
  {body:190,decay:2.2,snap:1450,pitch:58,echo:.38,grains:4,whistle:0,sample:0},
  {body:270,decay:1.8,snap:1650,pitch:70,echo:.31,grains:2,whistle:640,sample:2},
  {body:370,decay:1.35,snap:2300,pitch:82,echo:.23,grains:1,whistle:0,sample:1},
  {body:300,decay:1.5,snap:2050,pitch:78,echo:.27,grains:0,whistle:880,sample:2},
  {body:250,decay:1.9,snap:1300,pitch:66,echo:.34,grains:4,whistle:570,sample:0},
  {body:205,decay:2.1,snap:1800,pitch:60,echo:.40,grains:3,whistle:0,sample:2},
  {body:180,decay:2.4,snap:1200,pitch:53,echo:.43,grains:5,whistle:0,sample:0},
  {body:350,decay:1.7,snap:2550,pitch:87,echo:.35,grains:2,whistle:1050,sample:1},
  {body:220,decay:2.15,snap:1500,pitch:61,echo:.37,grains:4,whistle:620,sample:2},
]);
if(SOUND_PROFILES.length!==FAMILIES.length)throw new Error('Every catalog family needs a sound profile.');
export function soundGeometry(x:number,y:number,z:number,width:number){
  const distance=Math.hypot(x,y-16,z);
  return {distance,pan:Math.max(-.85,Math.min(.85,x/Math.max(1,width/2))),delay:Math.min(1.2,.12+distance/190),gain:1/(1+distance/180)};
}
