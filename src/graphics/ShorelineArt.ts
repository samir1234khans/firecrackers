import { SHORELINE_TOWN, SHORELINE_TERRAIN, TOWN_HEIGHT, TOWN_WIDTH, TOWN_PALETTE, WINDOW_PALETTE, bankHeight, shoreZ, roadPoint } from './ShorelineModel.js';
export const SHORELINE_ART_WIDTH=1536,SHORELINE_ART_HEIGHT=256,SHORELINE_ART_WORLD_HEIGHT=165;
/** Recovery-only perspective approximation of the same relief and mixed buildings. */
export function shorelineProjection(x:number,y:number,z:number){
  const perspective=1/(1-z*.00055);
  return{x:TOWN_WIDTH/2+x*perspective,y:TOWN_HEIGHT-(y-z*.008)*perspective};
}
export function makeShorelineArt():HTMLCanvasElement{
  const canvas=document.createElement('canvas');canvas.width=SHORELINE_ART_WIDTH;canvas.height=SHORELINE_ART_HEIGHT;
  const c=canvas.getContext('2d')!;c.scale(canvas.width/TOWN_WIDTH,canvas.height/SHORELINE_ART_WORLD_HEIGHT);
  const project=shorelineProjection;
  const polygon=(points:{x:number;y:number}[],color:string)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
  const display=(v:number)=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
  for(const surface of SHORELINE_TERRAIN){
    const triangles=[];
    for(let i=0;i<surface.indices.length;i+=3){const a=surface.indices.slice(i,i+3);triangles.push({a,z:a.reduce((sum,n)=>sum+surface.positions[n*3+2],0)/3});}
    triangles.sort((a,b)=>a.z-b.z);
    for(const {a} of triangles){
      const points=a.map(n=>project(surface.positions[n*3],surface.positions[n*3+1],surface.positions[n*3+2]));
      const color=[0,1,2].map(ch=>display(a.reduce((sum,n)=>sum+surface.colors[n*3+ch],0)/3));
      polygon(points,`rgb(${color.join(',')})`);
    }
  }
  const road:number[]=[];
  for(let i=0;i<=160;i++){const p=roadPoint(-800+i*10),s=project(p.x,p.y,p.z);road.push(s.x,s.y);}
  c.beginPath();for(let i=0;i<road.length;i+=2)i?c.lineTo(road[i],road[i+1]):c.moveTo(road[i],road[i+1]);c.strokeStyle='#1b262b';c.lineWidth=1.8;c.stroke();
  c.save();c.beginPath();c.moveTo(0,0);c.lineTo(TOWN_WIDTH,0);
  for(let i=160;i>=0;i--){const x=-800+i*10,p=project(x,bankHeight(x,shoreZ(x)),shoreZ(x));c.lineTo(p.x,p.y);}c.closePath();c.clip();
  for(const [i,x] of [-465,-405,-155,-103,120,184,461,522].entries()){
    const road=roadPoint(x),p=project(x,road.y,road.z);
    c.save();c.translate(p.x,p.y);c.scale(1,.28);const light=c.createRadialGradient(0,0,0,0,0,6+i%3);
    light.addColorStop(0,'rgba(181,154,114,.2)');light.addColorStop(1,'rgba(181,154,114,0)');c.fillStyle=light;c.fillRect(-10,-10,20,20);c.restore();
  }
  c.restore();
  const buildings=SHORELINE_TOWN.buildings.map((b,index)=>({...b,index})).sort((a,b)=>a.z-b.z);
  for(const b of buildings){
    const l=b.x-b.width/2,r=b.x+b.width/2,front=b.z+b.depth/2,back=b.z-b.depth/2,top=b.y+b.height;
    const lightFace=project(r,top,front),farFace=project(r,top,back);
    polygon([project(l,b.y,front),project(r,b.y,front),lightFace,project(l,top,front)],TOWN_PALETTE[b.tone]);
    c.globalAlpha=.66;polygon([project(r,b.y,front),project(r,b.y,back),farFace,lightFace],'#17232d');c.globalAlpha=1;
    if(b.roof){
      const peak=top+Math.min(6,b.width*.33);
      polygon([project(l,top,front),project(b.x,peak,front),project(r,top,front)],'#25313a');
      polygon([project(b.x,peak,front),project(b.x,peak,back),project(r,top,back),project(r,top,front)],'#283239');
      polygon([project(l,top,front),project(l,top,back),project(b.x,peak,back),project(b.x,peak,front)],'#17252e');
    }else polygon([project(l,top,front),project(l,top,back),project(r,top,back),project(r,top,front)],'#344047');
    for(const w of SHORELINE_TOWN.windows){if(w.building!==b.index||!w.lit)continue;
      const p=project(w.x,w.y,w.z);c.fillStyle=WINDOW_PALETTE[w.tone];c.globalAlpha=.67;
      c.fillRect(p.x-w.width*.5,p.y-w.height*.5,w.width,w.height);c.globalAlpha=1;
    }
    if(b.kind==='house'&&b.index%3===0){
      polygon([project(l+2,b.y+3.7,front),project(r-2,b.y+3.7,front),project(r-2,b.y+3.7,front+3),project(l+2,b.y+3.7,front+3)],'#303431');
    }
    if(b.kind==='house'&&b.z>-35&&b.index%4===0){const a=project(l,top,front),edge=project(r,top,front);c.strokeStyle='#52656d';c.lineWidth=.28;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(edge.x,edge.y);c.stroke();}
  }
  // Garden/slope trees vary in size and position; nearer shrubs obscure foundations.
  for(let i=0;i<82;i++){const x=-730+i*18.1+Math.sin(i*8.1)*8,z=shoreZ(x)-10-(i%5)*18,h=4.2+(i%7)*.65,y=bankHeight(x,z);
    polygon([project(x-2,y,z),project(x,y+h,z),project(x+2,y,z)],'#11231d');
  }
  for(let i=0;i<52;i++){const x=-705+i*28+Math.sin(i*3.9)*5,z=shoreZ(x)-1.5,p=project(x,bankHeight(x,z)+.8,z);
    c.fillStyle='#11211e';c.beginPath();c.ellipse(p.x,p.y,2.5+i%3,1.4+i%2,0,0,Math.PI*2);c.fill();
  }
  for(let i=0;i<6;i++){const x=[-545,-417,-212,107,296,509][i],z=shoreZ(x);
    polygon([project(x-4,.9,z),project(x+4,.9,z),project(x+4,.9,z+12),project(x-4,.9,z+12)],'#293333');
  }
  for(let i=0;i<26;i++){const x=[-465,-155,150,477][i%4]+Math.floor(i/4)*17-49,p=roadPoint(x),a=project(x,p.y,p.z),b=project(x,p.y+2.55,p.z);
    c.strokeStyle='#27332f';c.lineWidth=.2;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
    c.fillStyle=i%9?'#d5a675':'#b6c4c4';c.globalAlpha=.65;c.fillRect(b.x-.25,b.y-.25,.5,.5);c.globalAlpha=1;
  }
  const sx=-50,sz=shoreZ(sx)-7,sy=bankHeight(sx,sz);
  polygon([project(sx-8,sy+4.9,sz-5),project(sx+8,sy+4.9,sz-5),project(sx+8,sy+4.9,sz+5),project(sx-8,sy+4.9,sz+5)],'#35342e');
  return canvas;
}
