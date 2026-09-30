"""Original editable wet-basalt terrace. Run in a separate factory-startup Blender5.2 process.

The v004 master/export are untouched. Asset footprint stays at47x13.28 source
units; runtime composition remains the browser's responsibility. --verify reopens
the saved source and round-trips the exported GLB in a new empty scene.
"""
import bpy, math, random, json, sys, hashlib, struct
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'assets-source'/'blender'/'terrace-v008'
MASTER = OUT/'masters'/'terrace-v008.blend'
GLB = ROOT/'public'/'art'/'terrace-v008.glb'
for p in (OUT/'textures', OUT/'renders', MASTER.parent): p.mkdir(parents=True, exist_ok=True)
SEED = 880241

def data_png(png):
    """Blender adds color-profile metadata even to Non-Color image exports.
    Strip only those metadata chunks, keeping compressed pixels unchanged.
    """
    assert png[:8]==b'\x89PNG\r\n\x1a\n'
    offset=8;kept=bytearray(png[:8]);removed=[];pixels=[]
    while offset<len(png):
        n=struct.unpack_from('>I',png,offset)[0];kind=png[offset+4:offset+8];end=offset+n+12
        if kind in (b'sRGB',b'gAMA',b'cHRM',b'iCCP'):removed.append(kind.decode())
        else:kept.extend(png[offset:end])
        if kind==b'IDAT':pixels.append(png[offset+8:offset+8+n])
        offset=end
    assert offset==len(png)
    return bytes(kept),removed,hashlib.sha256(b''.join(pixels)).hexdigest()

def correct_embedded_data():
    blob=GLB.read_bytes();n=struct.unpack_from('<I',blob,12)[0];doc=json.loads(blob[20:20+n]);header=20+n;bn=struct.unpack_from('<I',blob,header)[0];binary=bytearray(blob[header+8:header+8+bn]);result={}
    for image in doc.get('images',[]):
        if image.get('mimeType')!='image/png' or not any(s in image.get('name','') for s in ('normal','roughness')):continue
        view=doc['bufferViews'][image['bufferView']];offset=view.get('byteOffset',0);length=view['byteLength'];original=bytes(binary[offset:offset+length]);clean,chunks,pixel_hash=data_png(original)
        assert data_png(clean)[2]==pixel_hash
        binary[offset:offset+length]=clean+bytes(length-len(clean));view['byteLength']=len(clean)
        result[image['name']]={'removedChunks':chunks,'pixelPayloadSha256':pixel_hash,'pixelPayloadUnchanged':True,'originalBytes':length,'dataOnlyBytes':len(clean)}
    assert len(result)==2, list(result)
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);binary+=bytes((-len(binary))%4);total=28+len(encoded)+len(binary)
    GLB.write_bytes(struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(binary),b'BIN\0')+binary)
    (OUT/'data-profile-receipt.json').write_text(json.dumps(result,indent=2))

def bounds(objects):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    points = [o.matrix_world@Vector(p) for obj in objects for o in [obj.evaluated_get(dg)] for p in o.bound_box]
    return [[min(p[i] for p in points), max(p[i] for p in points)] for i in range(3)]

def receipt(path):
    return {'path': str(path.relative_to(ROOT)).replace('\\','/'), 'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER), load_ui=False, use_scripts=False)
    col=bpy.data.collections['Terrace v008 | editable stonework']
    source=bounds(list(col.objects))
    assert len(col.objects)>40
    authored=[i for i in bpy.data.images if i.name.startswith('v008 | basalt ')]
    assert len(authored)==3 and all(i.packed_file for i in authored)
    master_info={'objects':len(col.objects),'boundsBlenderXYZ':source,'packedImages':[{'name':i.name,'size':list(i.size),'space':i.colorspace_settings.name} for i in authored]}
    rig=[{'name':o.name,'location':list(o.location),'rotation':list(o.rotation_euler),'energy':o.data.energy,'size':o.data.size,'color':list(o.data.color)} for o in bpy.context.scene.objects if o.type=='LIGHT']
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    assert len(meshes)==3, [o.name for o in meshes]
    assert all(o.type in ('MESH','EMPTY') for o in bpy.context.scene.objects)
    imported=bounds(meshes)
    assert max(abs(imported[i][j]-source[i][j]) for i in range(3) for j in range(2))<.001
    mats=[]
    for m in bpy.data.materials:
        images=[{'name':n.image.name,'space':n.image.colorspace_settings.name} for n in m.node_tree.nodes if n.type=='TEX_IMAGE']
        mats.append({'name':m.name,'images':images})
    assert any(len(m['images'])==3 for m in mats)
    result={'blender':bpy.app.version_string,'nativeReopened':True,'source':master_info,'roundTrip':{'meshes':len(meshes),'boundsBlenderXYZ':imported,'materials':mats,'vertices':sum(len(o.data.vertices) for o in meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'scope':'Geometry only; no cameras/lights/water'},'files':[receipt(p) for p in [MASTER, GLB]+sorted(p for p in (OUT/'textures').iterdir() if p.suffix in ('.png','.jpg'))]}
    # Review the actual freshly imported web geometry/materials, not the source.
    scene=bpy.context.scene
    for spec in rig:
        data=bpy.data.lights.new(spec['name'],'AREA');data.energy=spec['energy'];data.size=spec['size'];data.color=spec['color'];data.shape='DISK'
        obj=bpy.data.objects.new(spec['name'],data);scene.collection.objects.link(obj);obj.location=spec['location'];obj.rotation_euler=spec['rotation']
    camera=bpy.data.cameras.new('Roundtrip contact camera');obj=bpy.data.objects.new(camera.name,camera);scene.collection.objects.link(obj);obj.location=(1,-11,6);obj.rotation_euler=(Vector((0,-.5,-.1))-obj.location).to_track_quat('-Z','Y').to_euler();camera.type='ORTHO';camera.ortho_scale=17;scene.camera=obj
    scene.world=bpy.data.worlds.new('Roundtrip moonlight environment');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.026,.033,.053,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
    scene.render.film_transparent=True;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=1.6;scene.render.resolution_x=1000;scene.render.resolution_y=560;scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/'renders'/'terrace-v008-roundtrip-detail.png');bpy.ops.render.render(write_still=True)
    result['roundTrip']['actualImportedRender']=receipt(Path(scene.render.filepath))
    (OUT/'verification.json').write_text(json.dumps(result,indent=2))
    print('TERRACE_V008_VERIFIED '+json.dumps(result['roundTrip']))

def field(rng,n,terms):
    a=np.zeros((n,n),np.float32)
    for cells,w in terms:
        g=rng.random((cells+1,cells+1),dtype=np.float32)-.5
        coord=np.linspace(0,cells,n,endpoint=False); index=coord.astype(int); f=coord-index; f=f*f*(3-2*f)
        a+=w*((g[index[:,None],index[None,:]]*(1-f)[None,:]+g[index[:,None],(index+1)[None,:]]*f[None,:])*(1-f)[:,None]+(g[(index+1)[:,None],index[None,:]]*(1-f)[None,:]+g[(index+1)[:,None],(index+1)[None,:]]*f[None,:])*f[:,None])
    return a

def textures():
    n=1024; t=256; rng=np.random.default_rng(SEED)
    maps={s:np.ones((512,n,4),np.float32) for s in ('color','normal','roughness')}
    for v in range(8):
        broad=field(rng,t,[(3,1),(9,.42),(23,.16)])
        mineral=field(rng,t,[(32,.5),(77,.25),(126,.15)])
        grit=rng.random((t,t),dtype=np.float32)-.5
        yy,xx=np.mgrid[:t,:t]
        fissure=np.exp(-((np.sin(xx*.043+yy*.009+broad*2.7))/.022)**2)
        pores=(rng.random((t,t))>.97).astype(np.float32)
        # The initial browser pilot magnified broad blue/black wet patches.
        # Basalt reads through fine mineral grain; broad color/roughness contrast
        # is deliberately tiny so environment lighting cannot turn it to paint.
        h=broad*.025+mineral*.085+grit*.018-pores*.045-fissure*.018
        damp=np.clip((broad+.1)*2.8,0,1);damp=damp*damp*(3-2*damp)
        shade=.053+broad*.003+mineral*.032+grit*.009
        color=np.stack((shade*.98,shade,shade*1.012),axis=-1)*(1-damp[:,:,None]*.025)
        color+=np.maximum(0,mineral-.16)[:,:,None]*np.array([.012,.005,.001])
        color-=fissure[:,:,None]*.002
        rough=np.clip(.84-damp*.025+mineral*.075+grit*.035+pores*.09,.75,.96)
        dy,dx=np.gradient(h); nx=-dx*4.0; ny=-dy*4.0; l=np.sqrt(nx*nx+ny*ny+1)
        norm=np.stack(((nx/l+1)*.5,(ny/l+1)*.5,(1/l+1)*.5),axis=-1)
        ys=slice((v//4)*t,(v//4+1)*t); xs=slice((v%4)*t,(v%4+1)*t)
        maps['color'][ys,xs,:3]=np.clip(color,.012,.17)
        maps['roughness'][ys,xs,:3]=rough[:,:,None]
        maps['normal'][ys,xs,:3]=norm
    images={}
    for name,data in maps.items():
        if name=='color':
            # Image.save writes these assigned values as encoded file samples.
            # Authoring math above is linear reflectance; encode exactly once.
            linear=data[:,:,:3].copy()
            data[:,:,:3]=np.where(linear<=.0031308,12.92*linear,1.055*np.power(linear,1/2.4)-.055)
            (OUT/'color-encoding-receipt.json').write_text(json.dumps({'authoredSpace':'linear reflectance','fileSpace':'sRGB','encoding':'IEC61966-2-1 piecewise transfer','authoredMeanLinear':linear.mean(axis=(0,1)).tolist(),'encodedMeanByte':(data[:,:,:3].mean(axis=(0,1))*255).tolist(),'encodedMinimumByte':float(data[:,:,:3].min()*255),'encodedMaximumByte':float(data[:,:,:3].max()*255)},indent=2))
        im=bpy.data.images.new('v008 | basalt '+name,width=n,height=512,alpha=True)
        im.colorspace_settings.name='sRGB' if name=='color' else 'Non-Color'
        im.pixels.foreach_set(data.ravel());im.file_format='JPEG' if name=='color' else 'PNG'
        im.filepath_raw=str(OUT/'textures'/('basalt-'+name+'-v008'+('.jpg' if name=='color' else '.png')));im.save()
        if name!='color':
            path=Path(im.filepath_raw);clean,_,_=data_png(path.read_bytes());path.write_bytes(clean)
        # Reload from the actual file: native shader and GLB receive the same
        # color-decoded file pixels rather than unreloaded generated floats.
        im.source='FILE';im.reload();im.pack();images[name]=im
    return images

def material(name,color,roughness):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
    return m,p

def build():
    # A separate authored scene; no user master is loaded or reset.
    for o in tuple(bpy.context.scene.objects): bpy.data.objects.remove(o,do_unlink=True)
    scene=bpy.context.scene;scene.name='Terrace v008 | material review'
    col=bpy.data.collections.new('Terrace v008 | editable stonework');scene.collection.children.link(col)
    review=bpy.data.collections.new('Review only | cameras and lighting');scene.collection.children.link(review)
    col['seed']=SEED;col['sourceFootprint']='47x13.28; BlenderZup; glTFYup';col['provenance']='Original geometry and original deterministic PBR maps'
    images=textures();stone,p=material('v008 | damp fractured basalt',(.062,.069,.074),.72)
    for label,socket in [('color','Base Color'),('roughness','Roughness')]:
        n=stone.node_tree.nodes.new('ShaderNodeTexImage');n.image=images[label];stone.node_tree.links.new(n.outputs['Color'],p.inputs[socket])
    n=stone.node_tree.nodes.new('ShaderNodeTexImage');n.image=images['normal'];nm=stone.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.65
    stone.node_tree.links.new(n.outputs['Color'],nm.inputs['Color']);stone.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
    mortar,_=material('v008 | damp recessed lime joints',(.017,.020,.020),.95)
    fascia,_=material('v008 | weathered footing stone',(.047,.052,.052),.81)
    rng=random.Random(SEED)

    def slab(name,x,y,w,d,top,thickness,mat,variant,rough=True):
        nx,ny=7,5;verts=[];faces=[]
        # Undulation remains restrained; center launch datum is not a large ridge.
        for iy in range(ny+1):
            for ix in range(nx+1):
                px=x-w/2+w*ix/nx;py=y-d/2+d*iy/ny
                dx=rng.uniform(-.048,.048) if ix in (0,nx) else 0
                dy=rng.uniform(-.048,.048) if iy in (0,ny) else 0
                z=top+(rng.uniform(-.009,.009) if rough else 0)
                verts.append((px+dx,py+dy,z))
        for iy in range(ny):
            for ix in range(nx):
                a=iy*(nx+1)+ix;faces.append((a,a+1,a+nx+2,a+nx+1))
        edge=list(range(nx+1))+[iy*(nx+1)+nx for iy in range(1,ny+1)]+[ny*(nx+1)+ix for ix in range(nx-1,-1,-1)]+[iy*(nx+1) for iy in range(ny-1,0,-1)]
        bottom=[]
        for a in edge: bottom.append(len(verts));verts.append((verts[a][0],verts[a][1],top-thickness))
        for i,a in enumerate(edge): j=(i+1)%len(edge);faces.append((a,bottom[i],bottom[j],edge[j]))
        faces.append(tuple(reversed(bottom)))
        mesh=bpy.data.meshes.new(name+' mesh');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);col.objects.link(o);mesh.materials.append(mat)
        uv=mesh.uv_layers.new(name='PBR atlas | per-stone variant')
        # Each stone selects one of8 unique atlas patches, with mirror/rotation.
        flipx=rng.choice([-1,1]);flipy=rng.choice([-1,1])
        for loop in mesh.loops:
            v=mesh.vertices[loop.vertex_index].co
            u=(v.x-x)/w+.5; vv=(v.y-y)/d+.5
            if flipx<0:u=1-u
            if flipy<0:vv=1-vv
            uv.data[loop.index].uv=((variant%4+(.016+u*.968))*.25,(variant//4+(.016+vv*.968))*.5)
        bevel=o.modifiers.new('Editable small worn arris','BEVEL');bevel.width=.055 if rough else .035;bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=.52
        o.modifiers.new('Stone weighted contact normals','WEIGHTED_NORMAL');o['atlasVariant']=variant
        return o

    slab('Continuous recessed mortar foundation',0,.25,47,13.28,-.14,.61,mortar,0,False)
    for row,y in enumerate([-4.15,-.10,3.95]):
        x=-23.35;index=0
        while x<23.34:
            width=min(rng.uniform(3.8,6.1),23.35-x)
            if 23.35-x-width<2:width=23.35-x
            gap=rng.uniform(.085,.13)
            slab('Walking basalt | course%02d slab%02d'%(row+1,index+1),x+width/2,y,width-gap,3.89+rng.uniform(-.025,.025),rng.uniform(-.024,.020),.47,stone,(index*3+row*5)%8)
            x+=width;index+=1
    for y,top,d,prefix in [(6.43,.12,.86,'Water-facing coping'),(-6.17,-.34,.38,'Front foundation course')]:
        x=-23.35;index=0
        while x<23.34:
            width=min(rng.uniform(3.7,6.2),23.35-x)
            if 23.35-x-width<1.8:width=23.35-x
            slab(prefix+' | block%02d'%(index+1),x+width/2,y,width-.09,d,top,.41,stone if y>0 else fascia,index%8)
            x+=width;index+=1
    # Editable review cameras/light rigs stay out of web export.
    def light(name,loc,power,size,color):
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);review.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
    light('Moon fill',(0,8,18),2100,15,(.32,.47,.75))
    light('Warm reflected waterfront key',(-14,2,11),1550,7,(1,.65,.28))
    light('Firework glint',(13,3,13),1200,6,(.45,.62,1))
    camera=bpy.data.cameras.new('Review camera');o=bpy.data.objects.new('Review camera',camera);review.objects.link(o);o.location=(3,-25,18);o.rotation_euler=(Vector((0,.8,-.15))-o.location).to_track_quat('-Z','Y').to_euler();camera.type='ORTHO';camera.ortho_scale=51;scene.camera=o
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.026,.033,.053,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
    scene.render.film_transparent=True;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=1.6
    scene.render.resolution_x=1000;scene.render.resolution_y=560;scene.render.resolution_percentage=100
    scene['editableParameters']='Seed, individual slab mesh and bevel modifiers, atlas variants, review rig';scene['exportScope']='3 consolidated material meshes; cameras/lights excluded'
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER),relative_remap=True)
    # Export evaluated geometry by material; retain the individual editable master.
    ex=bpy.data.collections.new('Temporary consolidated export');scene.collection.children.link(ex)
    for mat in (stone,mortar,fascia):
        parts=[];dg=bpy.context.evaluated_depsgraph_get()
        for obj in col.objects:
            if obj.data.materials[0]!=mat:continue
            e=obj.evaluated_get(dg);mesh=bpy.data.meshes.new_from_object(e,preserve_all_data_layers=True,depsgraph=dg);dup=bpy.data.objects.new(obj.name+' export',mesh);ex.objects.link(dup);parts.append(dup)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in parts:obj.select_set(True)
        bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name=mat.name+' consolidated'
    bpy.ops.object.select_all(action='DESELECT')
    for obj in ex.objects:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,export_apply=False,export_cameras=False,export_lights=False,export_animations=False)
    correct_embedded_data()
    for obj in tuple(ex.objects):bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.collections.remove(ex)
    scene.render.filepath=str(OUT/'renders'/'terrace-v008-final.png');bpy.ops.render.render(write_still=True)
    camera.ortho_scale=17;o.location=(1,-11,6);o.rotation_euler=(Vector((0,-.5,-.1))-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/'renders'/'terrace-v008-contact-detail.png');bpy.ops.render.render(write_still=True)
    print('TERRACE_V008_CREATED',GLB.stat().st_size)

if '--verify' in sys.argv:verify()
else:build()
