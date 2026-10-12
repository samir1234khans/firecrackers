/** Original fictional lakeside geography and settlements; no actual destination. */
export const SHORELINE_SEED = 6110426;
export const TOWN_WIDTH = 1200, TOWN_HEIGHT = 160, SHORE_WATER_Y = 4.65;
export const SHORELINE_HEIGHT_SCALE = .8;
export const TOWN_PALETTE = ['#42423b', '#35434a', '#463b34', '#35433d', '#4a433b', '#384454'] as const;
export const WINDOW_PALETTE = ['#d9ae79', '#e0be8d', '#c0cbd0', '#a8bbb6', '#ebcfa3'] as const;
export type TownBuilding = { x: number; y: number; z: number; width: number; height: number; depth: number; tone: number; roof: boolean; seed: number; kind: 'house' | 'apartment' | 'warehouse' | 'boathouse' };
export type TownWindow = { building: number; x: number; y: number; z: number; width: number; height: number; tone: number; lit: boolean; side?: boolean };
export type TerrainSurface = { positions: number[]; colors: number[]; indices: number[]; name: string };
function random(seed: number) { let value = seed >>> 0; return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; }; }
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + SHORELINE_SEED) * 43758.5453; return n - Math.floor(n); };
export function landNoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), sx), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), sx), sy);
}
const fractal = (x: number, y: number) => landNoise(x, y) * .55 + landNoise(x * 2.1 + 17, y * 2.1) * .27 + landNoise(x * 4.4, y * 4.4 + 9) * .13 + landNoise(x * 9.2, y * 9.2) * .05;
const anchors = [
  [[-800,55],[-640,83],[-535,109],[-405,151],[-300,104],[-180,46],[-45,28],[105,53],[255,105],[355,127],[450,88],[610,82],[800,49]],
  [[-800,44],[-610,67],[-470,101],[-345,75],[-200,32],[-20,15],[155,34],[310,80],[435,66],[600,43],[800,36]],
  [[-800,21],[-650,31],[-490,55],[-340,30],[-190,16],[-30,7],[130,21],[290,43],[410,30],[600,28],[800,18]],
];
function ridge(x: number, layer: number) {
  const points = anchors[layer]; let i = 0;
  while (i < points.length - 2 && x > points[i + 1][0]) i++;
  const a = points[i], b = points[i + 1], t = Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0])));
  const prior = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 2)];
  const m0 = (b[1] - prior[1]) / (b[0] - prior[0]), m1 = (next[1] - a[1]) / (next[0] - a[0]);
  const base = (2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*(b[0]-a[0])*m0+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*(b[0]-a[0])*m1;
  return Math.max(5, base + (fractal(x * .024, layer * 7) - .5) * (layer === 0 ? 14 : 8));
}
export const shoreZ = (x: number) => -4 - 24 * Math.exp(-(((x - 35) / 155) ** 2)) + (landNoise(x * .026, 4) - .5) * 5;
export const bankHeight = (x: number, z: number) => .8 + Math.max(0, shoreZ(x) - z) * .12
  + 4 * Math.exp(-(((x + 400) / 180) ** 2)) + 2.3 * Math.exp(-(((x - 365) / 120) ** 2));
export const roadPoint = (x: number) => { const z = shoreZ(x) - 6 - 2 * landNoise(x * .025, 2); return { x, y: bankHeight(x, z) + .12, z }; };
export function roadLife(time: number) {
  return [0,1].map(i => roadPoint((i ? 115 : -520) + ((time * (i ? .48 : .65) + i * 63) % (i ? 120 : 155))));
}
function srgbLinear(v: number) { return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }
export function makeTerrain(): TerrainSurface[] {
  const surfaces: TerrainSurface[] = [];
  const cols = 144, rows = 14;
  for (let layer = 0; layer < 3; layer++) {
    const positions: number[] = [], colors: number[] = [], indices: number[] = [];
    const front = [-220,-125,-34][layer], depth = [290,220,150][layer];
    const heightAt = (x: number, t: number) => {
      const envelope = Math.sin(Math.max(.001,Math.min(.999,t)) * Math.PI * .94) ** .86;
      const folds = fractal(x * .035 + t * 3, t * 8 + layer * 23);
      // Correlated erosion-like folds, with an irregular crest instead of repeated sine bands.
      return Math.max(.3, ridge(x + (landNoise(t*5,layer)-.5)*19,layer) * envelope * (.78 + .38*folds));
    };
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= cols; col++) {
      const x = -800 + col / cols * 1600, t = row / rows, z = front - t * depth, y = heightAt(x,t);
      const dx = (heightAt(x+3,t)-heightAt(x-3,t))/6;
      const dz = (heightAt(x,Math.min(1,t+.015))-heightAt(x,Math.max(0,t-.015)))/(-depth*.03);
      const len = Math.hypot(dx,1,dz), facing = Math.max(0,(-dx*.62+.58-dz*.53)/len);
      const grain = fractal(x*.085,t*35+layer), shade = .50 + facing * .50 + (grain-.5)*.12;
      const rock = Math.max(0,y/ridge(x,layer)-.59)*.23;
      const ambient = [[.095,.13,.18],[.06,.115,.13],[.049,.103,.087]][layer];
      const haze = [1.0,.89,.85][layer];
      positions.push(x,y,z);
      for (let channel = 0; channel < 3; channel++) colors.push(srgbLinear(Math.min(1,(ambient[channel]*shade + rock*(channel===2?.52:.58))*haze)));
      if (row < rows && col < cols) { const a=row*(cols+1)+col,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1); }
    }
    surfaces.push({ positions,colors,indices,name: ['Distant asymmetric mountain massif','Middle ravines and saddle','Wooded overlapping foothills'][layer] });
  }
  // A physical bank beneath the houses, and a sloped shoreline face down to water contact.
  const positions: number[] = [], colors: number[] = [], indices: number[] = [], bankRows=4;
  for (let row=0;row<=bankRows;row++) for(let col=0;col<=cols;col++){
    const x=-800+col/cols*1600,z=shoreZ(x)-row/bankRows*112,y=bankHeight(x,z);
    positions.push(x,y,z);const grain=landNoise(x*.06,z*.07);
    colors.push(srgbLinear(.039+grain*.024),srgbLinear(.073+grain*.034),srgbLinear(.071+grain*.029));
    if(row<bankRows&&col<cols){const a=row*(cols+1)+col,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
  }
  const edgeStart=positions.length/3;
  for(let col=0;col<=cols;col++){const x=-800+col/cols*1600;positions.push(x,-1.3,shoreZ(x)+.6);colors.push(srgbLinear(.024),srgbLinear(.033),srgbLinear(.038));if(col<cols)indices.push(col,edgeStart+col,col+1,col+1,edgeStart+col,edgeStart+col+1);}
  surfaces.push({positions,colors,indices,name:'Irregular wooded land terraces and stone bank'});
  return surfaces;
}
export function makeTown(seed = SHORELINE_SEED) {
  const rand=random(seed),buildings:TownBuilding[]=[],windows:TownWindow[]=[];
  const districts=[{center:-465,cols:8,rows:3},{center:-155,cols:6,rows:2},{center:150,cols:7,rows:3},{center:477,cols:7,rows:2}];
  for(const [district,d] of districts.entries())for(let row=0;row<d.rows;row++)for(let col=0;col<d.cols;col++){
    if(row>0&&rand()<.19)continue;
    const x=d.center+(col-(d.cols-1)/2)*23+(rand()-.5)*7+row*6;
    const z=shoreZ(x)-12-row*28-(rand()*6);
    const width=11+rand()*6,depth=8+rand()*6,height=10+Math.floor(rand()*2)*6+rand()*2;
    const b:TownBuilding={x,y:bankHeight(x,z),z,width,depth,height,tone:Math.floor(rand()*6),roof:rand()>.13,seed:district*100+row*10+col,kind:'house'};
    buildings.push(b);
  }
  for(const [i,s] of [[-510,30,21],[-175,27,26],[196,28,29],[520,33,25],[-326,39,12],[295,42,10]].entries()){
    const [x,width,height]=s,z=shoreZ(x)-(i<4?40:8);
    buildings.push({x,y:bankHeight(x,z),z,width,height,depth:i<4?18:22,tone:i%6,roof:i>=4,seed:500+i,kind:i<4?'apartment':i===4?'warehouse':'boathouse'});
  }
  buildings.forEach((b,index)=>{
    const cols=Math.max(2,Math.floor(b.width/6.5)),floors=Math.max(1,Math.floor(b.height/5));
    for(let floor=0;floor<floors;floor++)for(let col=0;col<cols;col++){
      windows.push({building:index,x:b.x-b.width/2+(col+.5)*b.width/cols,y:b.y+2.7+floor*4.7,z:b.z+b.depth/2+.08,width:b.kind==='house'?1:1.25,height:1.35,tone:Math.floor(rand()*5),lit:rand()<.38});
    }
    if(rand()<.55)windows.push({building:index,x:b.x+b.width/2+.08,y:b.y+3.2,z:b.z,width:.85,height:1.25,tone:0,lit:rand()<.52,side:true});
  });
  const mountains=Array.from({length:3},(_,layer)=>Array.from({length:145},(_,i)=>({x:-800+i/144*1600,y:ridge(-800+i/144*1600,layer),z:-220-layer*100})));
  return {buildings,windows,mountains};
}
export const SHORELINE_TOWN = makeTown(), SHORELINE_TERRAIN=makeTerrain();
export const townExposure=(x:number)=>.62+.38*Math.min(1,Math.abs(x)/240);
export function shorelineBand(horizon:number,width:number,height:number){const span=(width/height<.72?.135:.17)*SHORELINE_HEIGHT_SCALE;return{top:horizon-span,bottom:horizon+.014,horizon,span};}
export function inShoreline(x:number,y:number,horizon:number,width:number,height:number){const band=shorelineBand(horizon,width,height);return Number.isFinite(x+y)&&x>=.018&&x<=.982&&y>=band.top&&y<=band.bottom;}
