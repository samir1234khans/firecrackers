import * as THREE from 'three/webgpu';
import { SHORELINE_TOWN, SHORELINE_TERRAIN, SHORE_WATER_Y, TOWN_HEIGHT, TOWN_WIDTH, SHORELINE_HEIGHT_SCALE, shorelineBand, townExposure, bankHeight, shoreZ, roadPoint, roadLife } from './ShorelineModel.js';

/** Bounded native relief and shallow architecture; no imported city assets or PBR room lights. */
export class ShorelineCity {
  readonly group = new THREE.Group();
  private readonly materials: THREE.MeshBasicMaterial[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly walls: THREE.MeshBasicMaterial;
  private readonly traffic: THREE.InstancedMesh;
  private readonly matrix = new THREE.Matrix4();
  private readonly point = new THREE.Vector3();
  private readonly ray = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));
  private readonly ndc = new THREE.Vector2();
  private sceneTime = 0;
  private far = -1000;
  constructor() {
    this.group.name = 'Spark | natural mountain cove and inhabited far shore';
    const material = (color: string, vertexColors = false) => {
      const m = new THREE.MeshBasicMaterial({ color, vertexColors, fog:false, toneMapped:false, side:THREE.DoubleSide });
      this.materials.push(m); return m;
    };
    this.walls=material('#ffffff',true);
    const roofMaterial=material('#293237',true), detailMaterial=material('#26302f',true), treeMaterial=material('#12241f',true), warm=material('#ffffff');
    const shade = (g:THREE.BufferGeometry) => {
      g.computeVertexNormals(); const normals=g.getAttribute('normal'), colors=new Float32Array(normals.count*3);
      for(let i=0;i<normals.count;i++){const k=.34+.52*Math.max(0,normals.getX(i)*.62+normals.getY(i)*.58+normals.getZ(i)*.53);colors.set([k,k,k],i*3);}
      g.setAttribute('color',new THREE.BufferAttribute(colors,3));this.geometries.push(g);return g;
    };
    const cube=shade(new THREE.BoxGeometry(1,1,1)), foliage=shade(new THREE.ConeGeometry(1,1,5)), bush=shade(new THREE.IcosahedronGeometry(1,0));
    const roof=shade(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([
      -.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,.5,0,.5,0,1,.5],3)).setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]));
    const window=new THREE.PlaneGeometry(1,1);this.geometries.push(window);
    const instances=(name:string,g:THREE.BufferGeometry,m:THREE.Material,count:number)=>{
      const mesh=new THREE.InstancedMesh(g,m,count);mesh.name=name;mesh.layers.enable(3);this.group.add(mesh);return mesh;
    };
    const color=new THREE.Color();
    const put=(mesh:THREE.InstancedMesh,index:number,x:number,y:number,z:number,w:number,h:number,d:number,tint?:string,side=false)=>{
      this.matrix.makeRotationY(side?Math.PI/2:0);this.matrix.scale(new THREE.Vector3(w,h,d));this.matrix.setPosition(x,y,z);mesh.setMatrixAt(index,this.matrix);
      if(tint)mesh.setColorAt(index,color.set(tint));
    };
    for(const surface of SHORELINE_TERRAIN){
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(surface.positions,3));
      g.setAttribute('color',new THREE.Float32BufferAttribute(surface.colors,3));g.setIndex(surface.indices);
      this.geometries.push(g);const mesh=new THREE.Mesh(g,material('#ffffff',true));mesh.name=surface.name;mesh.layers.enable(3);this.group.add(mesh);
    }
    const town=SHORELINE_TOWN, bodies=instances('Mostly low houses with a few apartments and harbour forms',cube,this.walls,town.buildings.length);
    const pitched=town.buildings.filter(b=>b.roof), roofs=instances('Original gabled house and boathouse roofs',roof,roofMaterial,pitched.length);
    let ri=0;
    const palette=['#42423b','#35434a','#463b34','#35433d','#4a433b','#384454'];
    for(const [i,b] of town.buildings.entries()){
      put(bodies,i,b.x,b.y+b.height/2,b.z,b.width,b.height,b.depth,palette[b.tone]);
      bodies.setColorAt(i,color.set(b.kind==='boathouse'?'#56616a':palette[b.tone]).multiplyScalar(townExposure(b.x)*(b.z>-35?1.14:1)));
      if(b.roof)put(roofs,ri++,b.x,b.y+b.height,b.z,b.width*1.08,Math.min(6,b.width*.33),b.depth*1.08);
    }
    const lit=town.windows.filter(w=>w.lit), windows=instances('Sparse occupied rooms on front and side faces',window,warm,lit.length);
    const windowPalette=['#d9ae79','#e0be8d','#c0cbd0','#a8bbb6','#ebcfa3'];
    lit.forEach((w,i)=>{put(windows,i,w.x,w.y,w.z,w.width,w.height,1,windowPalette[w.tone],w.side);windows.setColorAt(i,color.set(windowPalette[w.tone]).multiplyScalar(townExposure(w.x)*.72));});
    const flat=town.buildings.filter(b=>!b.roof), porches=town.buildings.filter((b,i)=>b.kind==='house'&&i%3===0);
    const eaves=town.buildings.filter((b,i)=>b.kind==='house'&&b.z>-35&&i%4===0);
    const details=instances('Porches, moonlit eaves, quay steps and a small shelter',cube,detailMaterial,flat.length*2+porches.length+24+eaves.length);
    let di=0;
    for(const b of flat){put(details,di++,b.x,b.y+b.height+.45,b.z,b.width*1.06,.9,b.depth*1.06);put(details,di++,b.x+b.width*.17,b.y+b.height+1.1,b.z,b.width*.25,1.3,b.depth*.3);}
    for(const b of porches)put(details,di++,b.x,b.y+3.8,b.z+b.depth*.5+1.1,b.width*.65,.45,3.5,'#343631');
    for(const b of eaves)put(details,di++,b.x,b.y+b.height,b.z+b.depth*.5+.15,b.width*.88,.3,.35,'#65757d');
    for(let i=0;i<6;i++){const x=[-545,-417,-212,107,296,509][i],z=shoreZ(x);
      put(details,di++,x,.65,z+6,8,.9,12,i===4?'#596269':'#343d40');put(details,di++,x+2.8,-.2,z+11,.5,2,.5);}
    // One open quay shelter, not another tall landmark.
    const shelterX=-50,shelterZ=shoreZ(shelterX)-7,sy=bankHeight(shelterX,shelterZ);
    for(let i=0;i<4;i++)put(details,di++,shelterX+(i%2?7:-7),sy+2.4,shelterZ+(i<2?-4:4),.55,4.8,.55);
    put(details,di++,shelterX,sy+4.9,shelterZ,17,.8,11,'#3d3931');
    for(let i=0;i<7;i++){const x=-440+i*145,z=shoreZ(x)-2;put(details,di++,x,bankHeight(x,z)-.2,z,18,.65,2.8);}
    const positions:number[]=[],indices:number[]=[],roadColors:number[]=[];
    color.set('#1f292c');
    for(let i=0;i<=160;i++){const p=roadPoint(-800+i*10);positions.push(p.x,p.y,p.z-1.25,p.x,p.y,p.z+1.25);roadColors.push(color.r,color.g,color.b,1,color.r,color.g,color.b,1);if(i<160){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
    // Feathered vertex-alpha fans sit on the actual sloping land, not glow billboards.
    color.set('#b59a72');
    for(const [i,x] of [-465,-405,-155,-103,120,184,461,522].entries()){
      const p=roadPoint(x),start=positions.length/3;
      positions.push(x,p.y+.13,p.z);roadColors.push(color.r,color.g,color.b,.20);
      for(let segment=0;segment<=16;segment++){
        const angle=segment/16*Math.PI*2,px=x+Math.cos(angle)*(6+i%3),pz=p.z+Math.sin(angle)*3.1;
        positions.push(px,bankHeight(px,pz)+.25,pz);roadColors.push(color.r,color.g,color.b,0);
        if(segment<16)indices.push(start,start+segment+1,start+segment+2);
      }
    }
    const rg=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)).setAttribute('color',new THREE.Float32BufferAttribute(roadColors,4)).setIndex(indices);this.geometries.push(rg);
    const roadMaterial=material('#ffffff',true);roadMaterial.transparent=true;roadMaterial.depthWrite=false;
    const road=new THREE.Mesh(rg,roadMaterial);road.name='Quiet bank road with eight feathered practical light pools';road.layers.enable(3);this.group.add(road);
    const trees=instances('Wooded gardens and slope pines',foliage,treeMaterial,82),shrubs=instances('Low rounded bushes hiding house feet',bush,treeMaterial,52);
    for(let i=0;i<82;i++){
      const x=-730+i*18.1+Math.sin(i*8.1)*8,z=shoreZ(x)-10-(i%5)*18,h=4.2+(i%7)*.65;
      put(trees,i,x,bankHeight(x,z)+h*.5,z,1.7+(i%3)*.5,h,1.7,'#17281f');
    }
    for(let i=0;i<52;i++){const x=-705+i*28+Math.sin(i*3.9)*5,z=shoreZ(x)-1.5;
      put(shrubs,i,x,bankHeight(x,z)+.9,z,2.1+(i%3),1.5+i%2,2.0,'#15241e');
    }
    const poles=instances('Shielded lamps along inhabited quays',cube,detailMaterial,26),lamps=instances('Small warm practical lights',window,warm,26);
    for(let i=0;i<26;i++){
      const x=[-465,-155,150,477][i%4]+Math.floor(i/4)*17-49,p=roadPoint(x);
      put(poles,i,x,p.y+1.3,p.z,.18,2.6,.18);
      put(lamps,i,x,p.y+2.55,p.z+.15,.45,.45,1,i%9?'#d5a675':'#b6c4c4');
    }
    this.traffic=instances('Two slow pairs of road headlights',window,warm,4);
    for(let i=0;i<4;i++)this.traffic.setColorAt(i,color.set(i<2?'#e2caa2':'#d0b38b'));
    this.update(0,0,0,0,0,false);
    this.group.updateMatrixWorld(true);
  }
  frame(camera:THREE.PerspectiveCamera,horizon:number,width:number,height:number){
    this.far=camera.aspect<.72?-180:-1000;this.plane.constant=-this.far;
    const at=(x:number,y:number)=>{this.ndc.set(x*2-1,1-y*2);this.ray.setFromCamera(this.ndc,camera);return this.ray.ray.intersectPlane(this.plane,new THREE.Vector3())!;};
    this.point.set(0,SHORE_WATER_Y,this.far).project(camera);
    const base=(1-this.point.y)/2,band=shorelineBand(horizon,width,height),left=at(0,base),right=at(1,base),top=at(.5,base-band.span);
    this.group.position.set(0,SHORE_WATER_Y,this.far+2);const crop=camera.aspect<.72?.48:1;
    this.group.scale.set((right.x-left.x)/TOWN_WIDTH/crop,(top.y-SHORE_WATER_Y)/TOWN_HEIGHT,Math.min(1,(right.x-left.x)/TOWN_WIDTH)*.65);
    if(camera.aspect<.72)this.group.position.x=150*this.group.scale.x;
    this.group.updateMatrixWorld(true);
  }
  update(r:number,g:number,b:number,energy:number,time:number,motion:boolean){
    this.walls.color.setRGB(1+r*.045/(1+energy),1+g*.045/(1+energy),1+b*.045/(1+energy));
    if(motion)this.sceneTime=time;
    roadLife(this.sceneTime).forEach((p,i)=>{for(let side=0;side<2;side++){
      this.matrix.makeScale(.8,.6,1).setPosition(p.x+side*1.0,p.y+.85,p.z+.1);this.traffic.setMatrixAt(i*2+side,this.matrix);
    }});this.traffic.instanceMatrix.needsUpdate=true;
  }
  diagnostics(){
    let triangles=0;this.group.traverse(o=>{if(o instanceof THREE.Mesh)triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3*(o instanceof THREE.InstancedMesh?o.count:1);});
    return{shorelineBuildings:SHORELINE_TOWN.buildings.length,shorelineHouses:SHORELINE_TOWN.buildings.filter(b=>b.kind==='house').length,
      shorelineWindows:SHORELINE_TOWN.windows.filter(w=>w.lit).length,shorelineLayers:3,shorelineLiveGeometry:true,shorelineCutoutBoards:0,
      shorelineTriangles:triangles,shorelineMeshes:this.group.children.length,shorelineTextureBytes:0,shorelineHeightScale:SHORELINE_HEIGHT_SCALE,
      shorelineLifeTime:this.sceneTime,shorelineDepth:this.far,shorelineSeed:6110426};
  }
  dispose(){this.group.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.group.clear();}
}
