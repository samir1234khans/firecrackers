"""Original Firecrackers assets. Run with installed Blender 5.2, not standalone bpy.
Pilot creates three editable masters and small renders. Bake renders 3x16 smoke frames.
No fluid cache: animated procedural volume with editable density/noise parameters.
"""
import bpy, math, random, sys, json
from pathlib import Path
from mathutils import Vector
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT.parents[1]/'outputs'/'blender'
ART=ROOT/'public'/'art'
OUT.mkdir(parents=True,exist_ok=True); ART.mkdir(parents=True,exist_ok=True)

def fresh(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s=bpy.context.scene; s.name=name; s.render.engine='CYCLES';s.cycles.samples=16
    s.render.resolution_x=640;s.render.resolution_y=480;s.render.resolution_percentage=100
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
    s.render.film_transparent=False;s.view_settings.view_transform='AgX'
    s.world=bpy.data.worlds.new('Night world');s.world.use_nodes=True
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.025,.04,.07,1)
    s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
    s.render.fps=24;s.frame_start=1;s.frame_end=48
    c=bpy.data.collections.new(name+' | authored assets');s.collection.children.link(c)
    return s,c

def relocate(obj,c,name):
    obj.name=name
    for old in list(obj.users_collection):old.objects.unlink(obj)
    c.objects.link(obj)
    return obj

def material(name,color,rough=.7,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    return m

def cube(c,name,loc,scale,m,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=relocate(bpy.context.object,c,name);o.scale=scale;o.data.materials.append(m)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Editable edge wear','BEVEL');mod.width=bevel;mod.segments=2
        o.modifiers.new('Corner normals','WEIGHTED_NORMAL')
    return o

def camera(s,c,pos,target,ortho=9):
    d=bpy.data.cameras.new('Asset review lens');o=bpy.data.objects.new('Review camera',d);c.objects.link(o)
    o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=ortho;s.camera=o

def area(c,name,pos,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);c.objects.link(o);o.location=pos;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()

def save(s,name):
    s['Asset provenance']='Original work authored for Firecrackers with Blender 5.2.1 LTS'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'-v003.blend')))

def render(s,name):
    s.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)

def export(c,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in c.objects:
        if o.type=='MESH':o.select_set(True)
    # The v003 terrace remains reproducible without replacing the refined
    # runtime v004 asset. Rocket keeps its original browser output path.
    archive=ROOT/'assets-source'/'blender'/'exports'
    if name=='terrace':archive.mkdir(parents=True,exist_ok=True)
    destination=(archive/'terrace-v003.glb') if name=='terrace' else (ART/(name+'.glb'))
    bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,export_apply=True)

def texture(name,array,data=False):
    h,w,_=array.shape;im=bpy.data.images.new(name,width=w,height=h,alpha=True)
    im.colorspace_settings.name='Non-Color' if data else 'sRGB'
    im.pixels.foreach_set(array.astype(np.float32).ravel());im.filepath_raw=str(ART/(name+'.png'));im.file_format='PNG';im.save();im.pack();return im

def build_smoke():
    s,c=fresh('Smoke and ignition');s.render.resolution_x=s.render.resolution_y=132;s.render.film_transparent=True;s.cycles.samples=32
    s.view_settings.view_transform='Standard';s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0
    for variant,name in enumerate(['Fuse wisps','Motor exhaust','Burst cloud']):
        m=bpy.data.materials.new(name+' | animated density');m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links
        out=n.new('ShaderNodeOutputMaterial');vol=n.new('ShaderNodeVolumePrincipled');vol.inputs['Color'].default_value=(.5,.55,.62,1)
        coord=n.new('ShaderNodeTexCoord');dist=n.new('ShaderNodeVectorMath');dist.operation='DISTANCE';dist.inputs[1].default_value=(.5,.5,.5);l.new(coord.outputs['Generated'],dist.inputs[0])
        fall=n.new('ShaderNodeMapRange');fall.clamp=True;fall.inputs['From Min'].default_value=.15;fall.inputs['From Max'].default_value=.49;fall.inputs['To Min'].default_value=1;fall.inputs['To Max'].default_value=0;l.new(dist.outputs['Value'],fall.inputs['Value'])
        noise=n.new('ShaderNodeTexNoise');noise.name='Editable animated turbulence';noise.noise_dimensions='4D';noise.inputs['Scale'].default_value=4+variant;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.72;l.new(coord.outputs['Generated'],noise.inputs['Vector'])
        noise.inputs['W'].default_value=variant*7;noise.inputs['W'].keyframe_insert('default_value',frame=1);noise.inputs['W'].default_value=variant*7+1.5;noise.inputs['W'].keyframe_insert('default_value',frame=48)
        cutoff=n.new('ShaderNodeMath');cutoff.operation='SUBTRACT';cutoff.inputs[1].default_value=.51;l.new(noise.outputs['Fac'],cutoff.inputs[0])
        mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';l.new(cutoff.outputs[0],mul.inputs[0]);l.new(fall.outputs[0],mul.inputs[1])
        density=n.new('ShaderNodeMath');density.name='Density strength';density.operation='MULTIPLY';density.inputs[1].default_value=7+variant*2;l.new(mul.outputs[0],density.inputs[0]);l.new(density.outputs[0],vol.inputs['Density']);l.new(vol.outputs['Volume'],out.inputs['Volume'])
        o=cube(c,name,(0,0,0),((2.2,2.2,4) if variant==0 else (3,3,4) if variant==1 else (4,4,3.3)),m);o['family_index']=variant;o['density_strength']=16+variant*4;o.hide_render=variant!=2
    camera(s,c,(0,-8,0),(0,0,0),4.4);area(c,'Directional smoke rim',(-3,-4,5),400,3,(1,.7,.35))
    flame_mat=material('Ignition flame emission',(1,.22,.01),.8)
    principal=flame_mat.node_tree.nodes['Principled BSDF'];principal.inputs['Emission Color'].default_value=(1,.15,.005,1);principal.inputs['Emission Strength'].default_value=4
    verts=[];faces=[]
    for j in range(9):
        z=-1+j*.25;radius=.34*math.sin(math.pi*j/8)**.65
        for i in range(12):
            angle=i/12*math.tau;verts.append((math.cos(angle)*radius+max(0,z)*.17,math.sin(angle)*radius,z))
    for j in range(8):
        for i in range(12):
            a=j*12+i;b=j*12+(i+1)%12;faces.append((a,b,b+12,a+12))
    mesh=bpy.data.meshes.new('Editable flame profile');mesh.from_pydata(verts,[],faces);mesh.update()
    flame=bpy.data.objects.new('Ignition flame',mesh);c.objects.link(flame);mesh.materials.append(flame_mat);flame.hide_render=True
    for poly in mesh.polygons:poly.use_smooth=True
    for frame in range(1,49,3):
        flame.scale=(.8+math.sin(frame*1.3)*.1,1,1+math.sin(frame*.9)*.12);flame.rotation_euler.y=math.sin(frame*.47)*.12
        flame.keyframe_insert('scale',frame=frame);flame.keyframe_insert('rotation_euler',frame=frame)
    save(s,'smoke-ignition');s.frame_set(1);render(s,'smoke-pilot-01');s.frame_set(25);render(s,'smoke-pilot-25')

def build_rocket():
    s,c=fresh('Rocket and materials')
    rng=np.random.default_rng(7419);y,x=np.mgrid[0:512,0:256]
    grain=rng.random((512,256))*.035
    rgb=np.stack([.12+grain,.17+grain,.24+grain,np.ones_like(grain)],axis=-1)
    foil=(np.abs(np.sin(x*.04+y*.035))>.996)|(y<3)|(y>508)
    rgb[foil,:3]=(.64,.43,.20);rgb[:,1:3,:3]*=.65
    im=texture('paper-color',rgb)
    paper=material('Printed indigo paper',(.22,.30,.4),.82);n=paper.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;paper.node_tree.links.new(n.outputs['Color'],paper.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    gold=material('Brushed champagne foil',(.68,.46,.22),.32,.72);wood=material('Unvarnished wood',(.25,.12,.045),.95)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.5,depth=3.25,location=(0,0,3.25));o=relocate(bpy.context.object,c,'Paper shell');o.data.materials.append(paper)
    for poly in o.data.polygons: poly.use_smooth=True
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.61,radius2=0,depth=1.22,location=(0,0,5.48));o=relocate(bpy.context.object,c,'Foil cap');o.data.materials.append(gold)
    for poly in o.data.polygons: poly.use_smooth=True
    cube(c,'Wooden guide',(-.29,.07,.28),(.115,.115,6),wood,.02)
    for z in [1.88,2.03,4.4,4.55]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.512,depth=.14,location=(0,0,z));o=relocate(bpy.context.object,c,'Foil band %.2f'%z);o.data.materials.append(gold)
    cube(c,'Paper overlap seam',(.01,-.503,3.25),(.035,.013,3.22),paper,.006)
    cord=bpy.data.curves.new('Editable braided fuse path','CURVE');cord.dimensions='3D';cord.bevel_depth=.044;cord.bevel_resolution=2
    spline=cord.splines.new('BEZIER');spline.bezier_points.add(3)
    for point,co in zip(spline.bezier_points,[(.5,0,1.72),(.9,0,1.35),(1.6,0,.95),(2.05,0,1.04)]):point.co=co;point.handle_left_type=point.handle_right_type='AUTO'
    fuse=bpy.data.objects.new('Braided paper fuse',cord);c.objects.link(fuse);cord.materials.append(material('Cotton fuse',(.32,.26,.13),1))
    camera(s,c,(9,-14,8),(0,0,1.7),13);area(c,'Warm key',(-4,-4,8),600,5,(1,.79,.52));area(c,'Cool rim',(4,3,5),800,4,(.36,.56,1))
    save(s,'rocket-materials');export(c,'rocket');render(s,'rocket-pilot')

def build_water():
    s,c=fresh('Waterfront')
    stone=material('Weathered basalt',(.095,.12,.15),.9)
    n=stone.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=8;n.inputs['Detail'].default_value=3
    bump=stone.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.25;bump.inputs['Distance'].default_value=.08
    stone.node_tree.links.new(n.outputs['Fac'],bump.inputs['Height']);stone.node_tree.links.new(bump.outputs[0],stone.node_tree.nodes['Principled BSDF'].inputs['Normal'])
    for iy in range(3):
        for ix in range(9):cube(c,'Terrace stone %d %d'%(ix,iy),((ix-4)*5.2,(iy-1)*4.2,-.35),(5.15,4.15,.7),stone,.1)
    for ix in range(9):cube(c,'Shore coping %d'%ix,((ix-4)*5.2,6.2,.05),(5.15,.7,.6),stone,.12)
    export(c,'terrace')
    water=material('Dark water',(.008,.018,.027),.21,.65)
    cube(c,'Water preview',(0,35,-.6),(160,65,.08),water)
    y,x=np.mgrid[0:256,0:256];u=x/256*2*math.pi;v=y/256*2*math.pi
    h=.6*np.sin(u*3+np.sin(v*2)*.3)+.25*np.sin(v*11+u*2)+.15*np.sin(v*23-u*5)
    dx=np.roll(h,-1,axis=1)-np.roll(h,1,axis=1);dy=np.roll(h,-1,axis=0)-np.roll(h,1,axis=0)
    normals=np.stack([-dx*2,-dy*2,np.ones_like(dx)],axis=-1);normals/=np.linalg.norm(normals,axis=-1)[...,None]
    im=texture('water-normal',np.concatenate([normals*.5+.5,np.ones((256,256,1))],axis=-1),True)
    tex=water.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;normal=water.node_tree.nodes.new('ShaderNodeNormalMap');water.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);water.node_tree.links.new(normal.outputs['Normal'],water.node_tree.nodes['Principled BSDF'].inputs['Normal'])
    rng=random.Random(831)
    distant=material('Shoreline silhouette',(.012,.02,.03),1)
    for i in range(24):cube(c,'Distant shore %02d'%i,((i-12)*6,66,rng.random()*2),(6,3,2+rng.random()*4),distant)
    camera(s,c,(24,-35,22),(0,18,0),68);area(c,'Moon fill',(-15,10,30),2200,20,(.35,.5,.8));area(c,'Terrace warm',(-12,-2,8),1700,10,(1,.61,.28))
    save(s,'waterfront');render(s,'waterfront-pilot')

def bake():
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'smoke-ignition-v003.blend'))
    s=bpy.context.scene;s.render.resolution_x=s.render.resolution_y=128
    atlas=np.zeros((132*12,132*4,4),np.float32);atlas[:,:,1:3]=.5
    objs=[o for o in s.objects if 'family_index' in o]
    for v in range(3):
        for o in objs:o.hide_render=o['family_index']!=v
        for f in range(16):
            s.frame_set(1+round(f*47/15));path=OUT/('smoke-%d-%02d.png'%(v,f));s.render.filepath=str(path);bpy.ops.render.render(write_still=True)
            im=bpy.data.images.load(str(path),check_existing=False);a=np.array(im.pixels[:],np.float32).reshape((128,128,4))[:,:,3];bpy.data.images.remove(im)
            a=(np.roll(a,1,axis=0)+2*a+np.roll(a,-1,axis=0))/4; a=(np.roll(a,1,axis=1)+2*a+np.roll(a,-1,axis=1))/4
            dx=np.gradient(a,axis=1);dy=np.gradient(a,axis=0)
            data=np.stack([a,np.clip(.5-dx*2.5,0,1),np.clip(.5-dy*2.5,0,1),a],axis=-1)
            oy=(v*4+f//4)*132+2;ox=(f%4)*132+2;atlas[oy:oy+128,ox:ox+128]=data
    texture('smoke-density-light',atlas,True)
    for o in objs:o.hide_render=True
    flame=bpy.data.objects['Ignition flame'];flame.hide_render=False;s.camera.data.ortho_scale=2.5;s.render.resolution_x=s.render.resolution_y=64
    sheet=np.zeros((64*4,64*4,4),np.float32)
    for f in range(16):
        s.frame_set(1+f*3);path=OUT/('flame-%02d.png'%f);s.render.filepath=str(path);bpy.ops.render.render(write_still=True)
        im=bpy.data.images.load(str(path),check_existing=False);data=np.array(im.pixels[:],np.float32).reshape((64,64,4));bpy.data.images.remove(im)
        sheet[(f//4)*64:(f//4+1)*64,(f%4)*64:(f%4+1)*64]=data
    texture('ignition-flame',sheet)

    (OUT/'bake-receipt.json').write_text(json.dumps({'blender':bpy.app.version_string,'families':['fuse','motor','burst'],'framesPerFamily':16,'frameCell':132,'inner':128,'channels':'R density, GB density gradients, A opacity','type':'animated procedural volume rendered in Cycles CPU, not fluid simulation','colorSpace':'Non-Color'},indent=2))

if '--bake' in sys.argv:bake()
else:build_smoke();build_rocket();build_water()
