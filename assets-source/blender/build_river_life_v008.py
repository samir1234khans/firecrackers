"""Versioned v007 edit: preserved CC0 canoe PBR, original woven shelter and life.

No external downloads, replacement hulls, solver, or source-file overwrites.
Run Blender --disable-autoexec --python-exit-code 1 --python this-file -- --build.
"""
import bpy, json, math, struct, sys
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[1]
MASTER = BASE / 'masters/river-life-v008.blend'
GLB = ROOT / 'public/art/river-life-v008.glb'
OUT = BASE / 'renders/river-v008'
TEX = BASE / 'textures/canopy-v008'
OUT.mkdir(parents=True, exist_ok=True)
TEX.mkdir(parents=True, exist_ok=True)
NAMES = ['Boat_A', 'Boat_B', 'Boat_C', 'Shore_Village']
helpers = {'__file__': str(BASE / 'build_river_life_v006.py')}
exec((BASE / 'build_river_life_v006.py').read_text().split("\nif '--build'")[0], helpers)
box, curve, attach, review_light = [helpers[k] for k in ['box', 'curve', 'attach', 'review_light']]

def canopy_maps():
    # Original repeating reed weave. Tile periods are integral, including the
    # slower reed-color variation: no edge seam and no photographic source.
    n = 512
    maps = {}
    for label in ['color', 'normal', 'roughness']:
        im = bpy.data.images.new('V008 woven reed '+label, width=n, height=n)
        values = []
        for y in range(n):
            v = y / n
            for x in range(n):
                u = x / n
                a, b = math.tau*u*32, math.tau*v*48
                weave = math.sin(a)*math.sin(b)
                shade = .90 + .08*math.sin(a) + .035*math.cos(math.tau*u*7) + .025*weave
                if label == 'color':
                    rgb = (.38*shade, .315*shade, .218*shade)
                elif label == 'normal':
                    dx, dy = .17*math.cos(a)*math.sin(b), .11*math.sin(a)*math.cos(b)
                    length = math.sqrt(dx*dx+dy*dy+1)
                    rgb = (.5-dx/length*.5, .5-dy/length*.5, .5+.5/length)
                else:
                    r = .89 + .035*weave
                    rgb = (r,r,r)
                values.extend((*rgb, 1))
        im.colorspace_settings.name = 'sRGB' if label == 'color' else 'Non-Color'
        im.pixels.foreach_set(values)
        im.filepath_raw = str(TEX / ('canopy-'+label+'-512.png'))
        im.file_format = 'PNG'
        im.save(); im.pack()
        maps[label] = im
    return maps

def build():
    bpy.ops.wm.open_mainfile(filepath=str(BASE / 'masters/river-life-v007.blend'))
    scene = bpy.context.scene
    scene.name = 'River life v008 | immersed weathered canoe, reed shelter, quiet quay'
    root = bpy.data.objects['Boat_C']
    cover = bpy.data.objects['Boat_C | low arched woven canopy']
    data = bpy.data.meshes.new('V008 curved woven canopy | UV and editable sag')
    verts, faces = [], []
    rows, sections = 24, 48
    for row in range(rows+1):
        x = -2.65 + 5.3*row/rows
        # A very small sag between five structural ribs; subtle worn fabric.
        sag = .032*math.sin(row/rows*math.pi*4)**2
        for i in range(sections+1):
            t = i/sections*math.pi
            verts.append((x, math.cos(t)*1.23, 1.045+math.sin(t)*(1.19-sag)))
    for row in range(rows):
        for i in range(sections):
            a = row*(sections+1)+i
            faces.append((a,a+1,a+sections+2,a+sections+1))
    data.from_pydata(verts,[],faces); data.update()
    uv = data.uv_layers.new(name='UV_WebAtlas2K')
    for poly in data.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices:
            vi = data.loops[li].vertex_index
            uv.data[li].uv = (vi//(sections+1)/rows*2,vi%(sections+1)/sections)
    cover.data = data
    mat = helpers['material']('v008 finely woven weathered reed shelter',(.38,.315,.218),.93)
    data.materials.append(mat)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (1,1,1,1)
    for label, im in canopy_maps().items():
        node = nodes.new('ShaderNodeTexImage'); node.image=im; node.name='V008 canopy '+label
        if label == 'normal':
            normal = nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=.65
            links.new(node.outputs['Color'],normal.inputs['Color']); links.new(normal.outputs['Normal'],bsdf.inputs['Normal'])
        else:
            links.new(node.outputs['Color'],bsdf.inputs['Base Color' if label=='color' else 'Roughness'])
    # Fine cords no longer read as contrasting broad toy panel seams.
    for obj in root.children_recursive:
        if 'weave seam' in obj.name:
            obj.data = obj.data.copy(); obj.data.bevel_depth=.0038
    root['canopy_sections'] = sections
    root['canopy_sag_m'] = .032
    cloth = helpers['material']('v008 quiet indigo clothing',(.019,.027,.037),.98)
    skin = helpers['material']('v008 muted human silhouette',(.067,.049,.035),.95)
    for boat_name,x in [('Boat_A',1.4),('Boat_C',3.35)]:
        boat=bpy.data.objects[boat_name]; col=boat.users_collection[0]
        # Seated, unanimated human at plausible scale; head only .20m wide.
        for label, pos, scales, material in [
            ('seated torso',(x,0,.91),(.18,.16,.30),cloth),
            ('quiet head',(x,0,1.32),(.105,.10,.125),skin)]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=pos)
            obj=attach(bpy.context.object,col,boat,boat_name+' | '+label,material)
            obj.scale=scales
            for poly in obj.data.polygons: poly.use_smooth=True
        for side in [-1,1]:
            curve(col,boat,boat_name+' | resting arm '+str(side),[(x,side*.14,1.05),(x+.18,side*.20,.84)],.043,cloth)
            curve(col,boat,boat_name+' | bent seated leg '+str(side),[(x,side*.11,.70),(x+.22,side*.13,.58),(x+.32,side*.13,.37)],.057,cloth)
    village=bpy.data.objects['Shore_Village']; col=village.users_collection[0]
    wood=bpy.data.materials['RiverLife | weathered warm timber']
    stone=bpy.data.materials['RiverLife | old quay granite']
    # The legacy twelve roofs were almost equal in height. Keep their actual
    # architecture, but restore a varied bank silhouette with rear-set homes,
    # taller narrow houses and a few quiet uneven trees between the clusters.
    for i in range(12):
        house=bpy.data.objects['Shore village | house %02d editable group'%i]
        house.scale=(.90 if i%3==0 else 1, 1, [1.0,.90,1.38,.85,.98,1.22,.83,1.48,.91,1.06,1.27,.88][i])
        if i in [2,7,10]:house.location.y+=2.3
    foliage=helpers['material']('v008 muted far-bank foliage',(.026,.043,.041),.98)
    bankverts=[(-46,-1,.05),(-25,-.2,.10),(-5,.4,.10),(22,.1,.06),(46,-.4,.05),(-48,20,.4),(-25,22,.8),(0,20,.45),(24,22,.70),(48,20,.5)]
    helpers['mesh'](col,village,'V008 uneven sheltered bank',bankverts,[(0,1,6,5),(1,2,7,6),(2,3,8,7),(3,4,9,8)],foliage)
    for i,(x,y,h) in enumerate([(-43,8,4.3),(-30,11,5.0),(-13,8,4.7),(-10,12,5.4),(12,9,4.4),(15,13,5.7),(29,14,4.6),(43,10,4.8)]):
        curve(col,village,'V008 irregular tree trunk %02d'%i,[(x,y,.15),(x-.1,y,h*.72)],.10,bpy.data.materials['RiverLife | pitch and dark worn timber'])
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(x,y,h*.76))
        obj=attach(bpy.context.object,col,village,'V008 irregular tree crown %02d'%i,foliage)
        obj.scale=(1.15+i%3*.17,1.18,h*.34)
        for poly in obj.data.polygons:poly.use_smooth=True
    # Short irregular fishing landing: signs of human use, without a new light.
    for j in range(9):
        box(col,village,'V008 landing weathered board %02d'%j,(-17+j*.51,-5.6,.22),( .47,4.2,.15),wood,.025)
    for x in [-17,-13]:
        for y in [-4.4,-7.3]:
            helpers['cylinder'](col,village,'V008 landing mooring post', (x,y,.10),.14,1.05,wood,8)
    for i in range(4):
        box(col,village,'V008 uneven quay descent %02d'%i,(8,-3.7-i*.38,.07-i*.10),(3.5,.47,.20),stone,.035)
    curve(col,village,'V008 coiled mooring rope',[(-16+.30*math.cos(i/32*math.tau*2),-5+.30*math.sin(i/32*math.tau*2),.34+i*.001) for i in range(33)],.035,bpy.data.materials['RiverLife | undyed mooring rope'])
    scene['v008_review'] = 'Preserved CC0 PBR hull, original three512 reed maps, two tiny seated figures, fishing landing. No water/light export.'
    scene['v008_source'] = 'Versioned v007 edit; unchanged OuterSpaceSimon CC0 hull and shared2K texture source.'
    for im in bpy.data.images:
        if im.source=='FILE' and not im.packed_file: im.pack()
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER),relative_remap=True)
    source_count=len(bpy.data.objects)
    # Keep original maps at full 2K master quality, use unchanged existing web
    # copies only in scoped export. All six maps stay shared across instances.
    canoe=bpy.data.materials['CC0 Canoe | baked weathered wood and fittings PBR']
    for node in canoe.node_tree.nodes:
        if node.type=='TEX_IMAGE':
            label=next(k for k in ['color','normal','roughness'] if k in node.name)
            node.image=bpy.data.images.load(str(BASE/'textures/canoe-v007'/('canoe-'+label+'-web-2k.'+('jpg' if label=='color' else 'png'))),check_existing=True)
            node.image.colorspace_settings.name='sRGB' if label=='color' else 'Non-Color'
    code=(BASE/'build_river_life_v006.py').read_text().split("\nif '--build'")[0]
    code=code.replace("            for layer in list(data.uv_layers):\n                data.uv_layers.remove(layer)","            for layer in list(data.uv_layers):\n                if layer.name != 'UV_WebAtlas2K':\n                    data.uv_layers.remove(layer)")
    code=code.replace('assert mesh_count <= 28','assert mesh_count <= 32').replace('assert GLB.stat().st_size <= 700 * 1024','assert GLB.stat().st_size <= 10 * 1024 * 1024')
    exp={'__file__':str(BASE/'build_river_life_v006.py')};exec(code,exp);exp['GLB']=GLB
    count=exp['export_grouped']([(bpy.data.objects[n].users_collection[0],bpy.data.objects[n]) for n in NAMES])
    # Reuse lossless PNG data metadata correction with scoped new path.
    old={'__file__':str(BASE/'build_river_life_v007.py')}
    exec((BASE/'build_river_life_v007.py').read_text().split("\nif '--build'")[0],old)
    old['GLB']=GLB;old['OUT']=OUT;old['strip_data_png_profiles']()
    receipt={'blender':bpy.app.version_string,'sourceObjects':source_count,'meshCount':count,'bytes':GLB.stat().st_size,'roots':NAMES,'houseCount':12,'quietBankTrees':8,'seatedFigures':2,'originalShared512Maps':3,'preservedShared2KMaps':3,'externalTextures':False,'exportedLights':False}
    (OUT/'build-receipt.json').write_text(json.dumps(receipt,indent=2))
    print('RIVER_V008_READY',json.dumps(receipt),flush=True)

def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    assert all(n in bpy.data.objects for n in NAMES)
    missing=[im.filepath for im in bpy.data.images if im.source=='FILE' and not im.packed_file and not Path(bpy.path.abspath(im.filepath)).exists()]
    assert not missing,missing
    source_count=len(bpy.data.objects)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    roots={}
    for name in NAMES:
        root=bpy.data.objects[name]
        points=[root.matrix_world.inverted()@obj.matrix_world@v.co for obj in root.children_recursive if obj.type=='MESH' for v in obj.data.vertices]
        low=[min(p[i] for p in points) for i in range(3)];high=[max(p[i] for p in points) for i in range(3)]
        roots[name]={'sourceMin':low,'sourceMax':high,'meshes':sum(o.type=='MESH' for o in root.children_recursive)}
    for n in ['Boat_A_Lamp','Boat_B_Lamp']+['Boat_C_Candle_%02d'%i for i in range(1,5)]+['Shore_Village_Warm_Lamp_%02d'%i for i in range(1,5)]:assert n in bpy.data.objects,n
    images=[{'name':im.name,'size':list(im.size),'colorspace':im.colorspace_settings.name} for im in bpy.data.images]
    assert len(images)==6,images
    meshes=[obj for obj in bpy.data.objects if obj.type=='MESH']
    assert all(math.isfinite(c) for obj in meshes for v in obj.data.vertices for c in v.co)
    assert not [obj for obj in bpy.data.objects if obj.type in ['CAMERA','LIGHT']]
    result={'blender':bpy.app.version_string,'masterReopened':True,'freshGLBImport':True,'missingDependencies':missing,'sourceObjects':source_count,'bytes':GLB.stat().st_size,'meshes':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),'materials':[m.name for m in bpy.data.materials],'images':images,'roots':roots,'finite':True}
    (OUT/'verification.json').write_text(json.dumps(result,indent=2))
    print('RIVER_V008_VERIFIED',json.dumps(result),flush=True)

def pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene=bpy.context.scene
    col=bpy.data.collections.new('V008 temporary review lighting');scene.collection.children.link(col)
    for n in ['Boat_A','Boat_B','Shore_Village']:
        for obj in bpy.data.objects[n].children_recursive:obj.hide_render=True
    water=helpers['material']('temporary v008 review water',(.012,.028,.046),.26,.15)
    box(col,None,'Temporary v008 water',(0,0,-.08),(26,20,.16),water)
    camera=bpy.data.objects.new('V008 night pilot camera',bpy.data.cameras.new('V008 pilot lens'));col.objects.link(camera)
    camera.data.type='ORTHO';camera.data.ortho_scale=12.5
    camera.location=(7,-12,6.5);camera.rotation_euler=(Vector((0,0,.65))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
    review_light(col,'V008 moon',(0,-4,10),(0,0,.5),560,(.48,.62,1),8)
    review_light(col,'V008 lantern fill',(-3,1,4),(0,0,.5),130,(1,.69,.39),4)
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=800;scene.render.resolution_y=500;scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/'canoe-night-pilot.png');bpy.ops.render.render(write_still=True)
    if '--poses' in sys.argv:
        c=bpy.data.objects['Boat_C']
        for f in range(4):
            phase=f/4*math.tau;c.location.z=math.sin(phase)*.015;c.rotation_euler.x=math.sin(phase+.5)*.006;c.rotation_euler.y=math.cos(phase)*.004
            scene.render.filepath=str(OUT/('canoe-pose-%02d.png'%f));bpy.ops.render.render(write_still=True)
    print('RIVER_V008_PILOT_COMPLETE',flush=True)

def village_pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene=bpy.context.scene
    for n in NAMES[:3]:
        for obj in bpy.data.objects[n].children_recursive:obj.hide_render=True
    col=bpy.data.collections.new('V008 temporary village review');scene.collection.children.link(col)
    camera=bpy.data.objects.new('V008 distant bank camera',bpy.data.cameras.new('V008 bank lens'));col.objects.link(camera)
    camera.data.type='ORTHO';camera.data.ortho_scale=102
    camera.location=(4,-65,13);camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
    water=helpers['material']('temporary v008 bank water',(.012,.028,.046),.23,.12)
    box(col,None,'Temporary v008 bank water',(0,-30,-.18),(125,65,.15),water)
    review_light(col,'V008 distant moon',(0,-10,25),(0,0,1),3800,(.48,.62,1),55)
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1000;scene.render.resolution_y=340;scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/'village-night-pilot.png');bpy.ops.render.render(write_still=True)
    print('RIVER_V008_VILLAGE_PILOT_COMPLETE',flush=True)

if '--build' in sys.argv:build()
elif '--verify' in sys.argv:verify()
elif '--pilot' in sys.argv:pilot()
elif '--village-pilot' in sys.argv:village_pilot()
else:raise RuntimeError('Choose --build, --verify or --pilot')
