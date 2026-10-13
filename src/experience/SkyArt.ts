import type { Simulation } from '../engine/Simulation';
import { BUDGETS } from '../engine/catalog.js';

export type LightPoint = [number, number];
export type LightStroke = LightPoint[];
export const SKY_ART_LIMITS = Object.freeze({ characters: 24, lines: 2, strokes: 24, points: 256, seconds: 8 });
type Paths = readonly (readonly LightPoint[])[];
const circle: LightPoint[] = Array.from({ length: 13 }, (_, i) => [.5 + .48 * Math.cos(i * Math.PI / 6), .5 + .48 * Math.sin(i * Math.PI / 6)]);
/** Original centreline alphabet; distinct paths are pen lifts, never connecting bars. */
export const SKY_GLYPHS: Record<string, Paths> = {
 A:[[[0,1],[.5,0],[1,1]],[[.2,.6],[.8,.6]]], B:[[[0,1],[0,0],[.65,0],[1,.2],[.65,.5],[0,.5]],[[.65,.5],[1,.75],[.65,1],[0,1]]],
 C:[[[1,.1],[.7,0],[.2,.1],[0,.5],[.2,.9],[.7,1],[1,.9]]], D:[[[0,1],[0,0],[.6,0],[1,.3],[1,.7],[.6,1],[0,1]]],
 E:[[[1,0],[0,0],[0,1],[1,1]],[[0,.5],[.8,.5]]], F:[[[0,1],[0,0],[1,0]],[[0,.5],[.8,.5]]], G:[[[1,.1],[.2,0],[0,.5],[.2,1],[1,.9],[1,.5],[.55,.5]]],
 H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.5],[1,.5]]], I:[[[0,0],[1,0]],[[.5,0],[.5,1]],[[0,1],[1,1]]], J:[[[0,0],[1,0],[1,.8],[.7,1],[.2,1],[0,.7]]],
 K:[[[0,0],[0,1]],[[1,0],[0,.5],[1,1]]], L:[[[0,0],[0,1],[1,1]]], M:[[[0,1],[0,0],[.5,.55],[1,0],[1,1]]], N:[[[0,1],[0,0],[1,1],[1,0]]], O:[circle],
 P:[[[0,1],[0,0],[.7,0],[1,.25],[.7,.5],[0,.5]]], Q:[circle,[[.6,.7],[1.1,1.1]]], R:[[[0,1],[0,0],[.7,0],[1,.25],[.7,.5],[0,.5]],[[.5,.5],[1,1]]],
 S:[[[1,.1],[.7,0],[.2,0],[0,.2],[.2,.45],[.8,.55],[1,.8],[.8,1],[.2,1],[0,.9]]], T:[[[0,0],[1,0]],[[.5,0],[.5,1]]],
 U:[[[0,0],[0,.8],[.2,1],[.8,1],[1,.8],[1,0]]], V:[[[0,0],[.5,1],[1,0]]], W:[[[0,0],[.2,1],[.5,.5],[.8,1],[1,0]]], X:[[[0,0],[1,1]],[[1,0],[0,1]]],
 Y:[[[0,0],[.5,.5],[1,0]],[[.5,.5],[.5,1]]], Z:[[[0,0],[1,0],[0,1],[1,1]]],
 '0':[circle], '1':[[[.2,.25],[.5,0],[.5,1]],[[.1,1],[.9,1]]], '2':[[[0,.15],[.3,0],[.8,0],[1,.25],[0,1],[1,1]]],
 '3':[[[0,0],[1,0],[.5,.5],[1,.7],[.8,1],[0,1]]], '4':[[[.8,1],[.8,0],[0,.65],[1,.65]]], '5':[[[1,0],[0,0],[0,.5],[.7,.5],[1,.7],[.8,1],[0,1]]],
 '6':[[[1,0],[.3,0],[0,.5],[0,.85],[.3,1],[.8,1],[1,.75],[.8,.5],[0,.5]]], '7':[[[0,0],[1,0],[.35,1]]],
 '8':[circle,[[0,.5],[1,.5]]], '9':[[[1,.5],[.2,.5],[0,.25],[.2,0],[.8,0],[1,.25],[1,.8],[.7,1],[0,1]]],
 '.':[[[.45,.95],[.55,.95]]], ',':[[[.55,.9],[.35,1.1]]], '!':[[[.5,0],[.5,.7]],[[.45,.95],[.55,.95]]], '?':[[[0,.2],[.2,0],[.8,0],[1,.2],[.5,.55],[.5,.7]],[[.45,.95],[.55,.95]]],
 "'":[[[.55,0],[.4,.25]]], '-':[[[.15,.5],[.85,.5]]], '&':[[[1,1],[.15,.25],[.3,0],[.65,0],[.8,.25],[0,.75],[.2,1],[.6,1],[1,.55]]],
};
export function validateSkyText(value: unknown): string {
 if (typeof value !== 'string') throw new Error('Enter sky lettering.');
 const text = value.trim().toUpperCase();
 if (!text || text.length > 24 || text.split('\n').length > 2 || /[^A-Z0-9 .,!?'&\-\n]/.test(text)) throw new Error('Use up to 24 letters, digits or basic punctuation over two lines.');
 return text;
}
export function validateLightStrokes(value: unknown): LightStroke[] {
 if (!Array.isArray(value) || !value.length || value.length > 24) throw new Error('Use one to 24 light strokes.');
 let points = 0;
 const strokes = value.map(stroke => {
  if (!Array.isArray(stroke) || stroke.length < 2) throw new Error('Each stroke needs two points.');
  points += stroke.length;
  return stroke.map((p: unknown): LightPoint => {
   if (!Array.isArray(p) || p.length !== 2 || p.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('Drawing points must stay inside the sky.');
   return [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];
  });
 });
 if (points > 256) throw new Error('A drawing can contain at most 256 points.');
 return strokes;
}
export function skyTextPaths(value: string): LightStroke[] {
 const lines = validateSkyText(value).split('\n'), out: LightStroke[] = [];
 const cell = Math.min(.062, .78 / Math.max(...lines.map(l => l.length * 1.3)));
 lines.forEach((line, row) => [...line].forEach((letter, index) => {
  if (letter === ' ') return;
  const left = .5 - (line.length * 1.3 - .3) * cell / 2 + index * 1.3 * cell;
  for (const path of SKY_GLYPHS[letter]) out.push(path.map(([x,y]) => [left + x * cell, .20 + row * .16 + y * .11]));
 }));
 return out;
}
/** Admission is atomic; decoration never steals reserved secondary heads. */
export function emitSkyArt(sim: Simulation, paths: readonly LightStroke[], formation = true): boolean {
 if (sim.paused) return false;
 const budget = BUDGETS[sim.quality], limit = sim.quality === 'ultra' ? 640 : sim.quality === 'standard' ? 520 : 360;
 const edges=paths.reduce((n,p)=>n+Math.max(0,p.length-1),0);
 const totalLength=paths.reduce((n,p)=>n+p.slice(1).reduce((m,b,i)=>m+Math.hypot(b[0]-p[i][0],b[1]-p[i][1]),0),0);
 const density=Math.max(0,Math.min(140,(limit-edges)/Math.max(.001,totalLength)));
 const segments: [LightPoint,LightPoint][] = [];
 for (const path of paths) for (let i=1;i<path.length;i++) {
  const a=path[i-1],b=path[i], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*density));
  for(let j=0;j<n;j++) segments.push([[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n],[a[0]+(b[0]-a[0])*(j+1)/n,a[1]+(b[1]-a[1])*(j+1)/n]]);
 }
 if (!segments.length || segments.length > limit || sim.trails.count+segments.length>budget.trails || sim.heads.count+sim.reservedHeads+segments.length>sim.heads.capacity) return false;
 const project=(p:LightPoint):[number,number,number] | null => sim.artProjection ? sim.artProjection(p[0],p[1]) : [(p[0]-.5)*sim.width,sim.ground+(1-p[1])*120,0];
 const world=segments.map(([a,b])=>[project(a),project(b)] as const);
 if(world.some(([a,b])=>!a||!b)) return false;
 let index=0;
 const forms=formation&&!sim.reducedMotion, seconds=1.1, drag=4.4, integral=-Math.expm1(-drag*seconds)/drag;
 const centre=world.reduce((n,[,b])=>[n[0]+b![0]/world.length,n[1]+b![1]/world.length,n[2]+b![2]/world.length],[0,0,0]);
 for(const [a,b] of world) {
  const trail=sim.trails.count;sim.trails.add(...a!,...b!,forms?6.9:8,.055,1,.75,.32,0,0,budget.trails,true,false,2);
  if(forms)sim.trails.age[trail]=-seconds;
  const start=forms?[centre[0]+Math.sin(index*2.399)*6,centre[1]+Math.cos(index*1.73)*4,centre[2]]:b!;
  const i=sim.heads.add(start[0],start[1],start[2],forms?(b![0]-start[0])/integral:0,forms?(b![1]-start[1])/integral:0,forms?(b![2]-start[2])/integral:0,6.5,1,.8,.45,.06,0,0,0,0,0);
  if(i>=0)sim.heads.role[i]=-72;index++;
 }
 if(forms)sim.queueSceneEvent('letter-crack',centre[0],centre[1],.25);
 return true;
}
