"""CC0 weathered canoe hulls, original canopy/candles and preserved village.

Load versioned sources with Blender --disable-autoexec. Save editable packed
master before scoped export; preserve 2K lossless baked material masters and use
one shared compact 2K browser atlas. No water, lights, camera or cache exports.
"""
import bpy
import json
import math
import struct
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets-source' / 'blender'
MASTER = SOURCE / 'masters' / 'river-life-v007.blend'
OLD_MASTER = SOURCE / 'masters' / 'river-life-v006.blend'
CANOE_MASTER = SOURCE / 'masters' / 'canoe-materials-v007.blend'
OUT = SOURCE / 'renders' / 'river-v007'
GLB = ROOT / 'public' / 'art' / 'river-life-v007.glb'
ROOT_NAMES = ['Boat_A', 'Boat_B', 'Boat_C', 'Shore_Village']
OUT.mkdir(parents=True, exist_ok=True)

# Reuse original geometry and review helpers, without running v006 entry points.
original_helpers = {'__file__': str(SOURCE / 'build_river_life_v006.py')}
exec((SOURCE / 'build_river_life_v006.py').read_text().split("\nif '--build'")[0], original_helpers)
material = original_helpers['material']
box = original_helpers['box']
review_light = original_helpers['review_light']


def strip_data_png_profiles():
    """Remove exporter-added color metadata from embedded data PNGs.

    Preserve every IDAT byte and all existing buffer offsets. Unused image
    storage becomes zero padding; glTF bufferView length ends at the new IEND.
    """
    blob = GLB.read_bytes()
    json_length = struct.unpack_from('<I', blob, 12)[0]
    doc = json.loads(blob[20:20+json_length])
    bin_header = 20 + json_length
    bin_length = struct.unpack_from('<I', blob, bin_header)[0]
    binary = bytearray(blob[bin_header+8:bin_header+8+bin_length])
    stripped = {}
    for image in doc['images']:
        if image.get('mimeType') != 'image/png' or not any(label in image.get('name','') for label in ['normal','roughness']):
            continue
        view = doc['bufferViews'][image['bufferView']]
        start = view.get('byteOffset',0)
        length = view['byteLength']
        png = bytes(binary[start:start+length])
        assert png[:8] == b'\x89PNG\r\n\x1a\n'
        kept = bytearray(png[:8])
        removed = []
        offset = 8
        while offset < len(png):
            chunk_length = struct.unpack_from('>I',png,offset)[0]
            kind = png[offset+4:offset+8]
            end = offset+12+chunk_length
            if kind in [b'sRGB',b'gAMA',b'cHRM',b'iCCP']:
                removed.append(kind.decode('ascii'))
            else:
                kept.extend(png[offset:end])
            offset = end
        binary[start:start+length] = bytes(kept) + bytes(length-len(kept))
        view['byteLength'] = len(kept)
        stripped[image['name']] = {'removedChunks':removed,'originalBytes':length,'dataOnlyBytes':len(kept),'pixelPayloadUnchanged':True}
    encoded = json.dumps(doc,separators=(',',':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded))%4)
    binary += bytes((-len(binary))%4)
    total = 12+8+len(encoded)+8+len(binary)
    rebuilt = struct.pack('<4sII',b'glTF',2,total) + struct.pack('<I4s',len(encoded),b'JSON') + encoded + struct.pack('<I4s',len(binary),b'BIN\0') + binary
    GLB.write_bytes(rebuilt)
    (OUT/'data-profile-receipt.json').write_text(json.dumps(stripped,indent=2),encoding='utf-8')


def build():
    bpy.ops.wm.open_mainfile(filepath=str(OLD_MASTER))
    scene = bpy.context.scene
    scene.name = 'River life v007 | CC0 canoe with original candle canopy'
    for name in ROOT_NAMES[:3]:
        root = bpy.data.objects[name]
        for obj in list(root.children_recursive):
            if obj.type == 'EMPTY':
                continue
            keep = 'lantern' in obj.name.lower() if name != 'Boat_C' else ('canopy' in obj.name.lower() or 'candle' in obj.name.lower())
            if not keep:
                bpy.data.objects.remove(obj, do_unlink=True)
    with bpy.data.libraries.load(str(CANOE_MASTER), link=False) as (data_from, data_to):
        data_to.objects = ['CC0 Canoe | compact baked geometry']
    template = data_to.objects[0]
    assert template is not None
    low = Vector([min(v.co[i] for v in template.data.vertices) for i in range(3)])
    high = Vector([max(v.co[i] for v in template.data.vertices) for i in range(3)])
    center = (low + high) / 2
    for vertex in template.data.vertices:
        vertex.co.x -= center.x
        vertex.co.y -= center.y
        vertex.co.z -= low.z
    size = high - low
    for name in ROOT_NAMES[:3]:
        root = bpy.data.objects[name]
        boat = template.copy()
        boat.name = name + ' | CC0 weathered canoe hull and paddle'
        root.users_collection[0].objects.link(boat)
        boat.parent = root
        target_length, target_beam, target_height, draft = (9.5, 3.0, 1.1, -.30) if name == 'Boat_C' else (5.5, 1.75, .75, -.23)
        boat.scale = (target_length / size.x, target_beam / size.y, target_height / size.z)
        boat.location = (0, 0, draft)
        root['source'] = 'CC0 Wooden Canoe by OuterSpaceSimon; original texture mapping baked into shared 2K atlas'
        root['dimensions'] = [target_length, target_beam, target_height]
    bpy.data.objects.remove(template, do_unlink=True)
    # Source canoe narrows more evenly than the old hand-made hull. Keep each
    # exposed lantern on its real shoulder, outside the ±2.65 canopy ends.
    c = bpy.data.objects['Boat_C']
    canoe = next(obj for obj in c.children_recursive if 'CC0 weathered' in obj.name)
    bpy.context.view_layer.update()
    shoulder_widths = []
    for x in [-3.1, 3.1]:
        points = [canoe.matrix_local @ v.co for v in canoe.data.vertices]
        shoulder = [p for p in points if abs(p.x-x) < .30 and p.z > .45]
        width = max(abs(p.y) for p in shoulder)
        shoulder_widths.append(width)
    for number in range(1, 5):
        marker = bpy.data.objects['Boat_C_Candle_%02d' % number]
        previous = marker.location.copy()
        width = shoulder_widths[0 if number <= 2 else 1]
        beam = min(abs(previous.y), max(.52, width - .13))
        new = Vector((previous.x, math.copysign(beam, previous.y), 1.0))
        delta = new - previous
        for obj in c.children_recursive:
            if ('Boat_C | candle %02d ' % number) in obj.name:
                obj.location += delta
        marker.location = new
    bpy.data.objects['Boat_C_Lamp'].location = bpy.data.objects['Boat_C_Candle_01'].location
    scene['asset_license'] = 'Hull/paddle: OuterSpaceSimon CC0-1.0. Canopy, candles, village: original project work.'
    scene['atlas_contract'] = 'Three shared 2048-square maps: sRGB albedo, linear tangent normal, linear roughness; no metallic texture.'
    for im in bpy.data.images:
        if im.source == 'FILE' and not im.packed_file:
            im.pack()
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
    source_count = len(bpy.data.objects)
    source_children = {name: len(bpy.data.objects[name].children_recursive) for name in ROOT_NAMES}
    # These replacements exist in the export process only. The saved editable
    # master retains the full original lossless 2K baked maps.
    texdir = SOURCE / 'textures' / 'canoe-v007'
    mat = bpy.data.materials['CC0 Canoe | baked weathered wood and fittings PBR']
    for node in mat.node_tree.nodes:
        if node.type != 'TEX_IMAGE':
            continue
        label = next(label for label in ['color','roughness','normal'] if label in node.name)
        extension = 'jpg' if label == 'color' else 'png'
        im = bpy.data.images.load(str(texdir / ('canoe-'+label+'-web-2k.'+extension)), check_existing=True)
        im.colorspace_settings.name = 'sRGB' if label == 'color' else 'Non-Color'
        node.image = im
    # Make the original v006 exporter retain the web atlas UV and use our paths
    # and budget. Scoped duplicates still group by material within each root.
    code = (SOURCE / 'build_river_life_v006.py').read_text().split("\nif '--build'")[0]
    code = code.replace("            for layer in list(data.uv_layers):\n                data.uv_layers.remove(layer)", "            for layer in list(data.uv_layers):\n                if layer.name != 'UV_WebAtlas2K':\n                    data.uv_layers.remove(layer)")
    code = code.replace("assert GLB.stat().st_size <= 700 * 1024", "assert GLB.stat().st_size <= 10 * 1024 * 1024")
    export_helpers = {'__file__': str(SOURCE / 'build_river_life_v006.py')}
    exec(code, export_helpers)
    export_helpers['GLB'] = GLB
    count = export_helpers['export_grouped']([(bpy.data.objects[name].users_collection[0], bpy.data.objects[name]) for name in ROOT_NAMES])
    strip_data_png_profiles()
    receipt = {'blender': bpy.app.version_string, 'master': MASTER.name, 'export': GLB.name, 'bytes': GLB.stat().st_size, 'meshCount': count, 'sourceObjects': source_count, 'sourceChildCounts': source_children, 'rootNames': ROOT_NAMES, 'houseCount': 12, 'villageClusters': [4,3,5], 'windows': {'warm':4,'dark':20}, 'naukaCandles':4, 'canoeSourceLicense':'CC0-1.0', 'canoeSourceAuthor':'OuterSpaceSimon', 'threeShared2KMaps':True, 'coordinates':'Blender Z-up to browser Y-up; waterline localY0; lengthX; beamZ', 'externalTextures':False, 'glTFPointLights':False, 'measuredShoulderHalfWidths':shoulder_widths}
    (OUT/'build-receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
    print('RIVER_V007_READY', json.dumps(receipt), flush=True)


def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    missing = [im.filepath for im in bpy.data.images if im.source == 'FILE' and not im.packed_file and not Path(bpy.path.abspath(im.filepath)).exists()]
    assert not missing, missing
    source_count = len(bpy.data.objects)
    assert all(name in bpy.data.objects for name in ROOT_NAMES)
    assert all(bpy.data.objects[name].location.length == 0 for name in ROOT_NAMES)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    assert len(meshes) <= 28
    assert all(math.isfinite(value) for obj in meshes for v in obj.data.vertices for value in v.co)
    roots = {}
    for name in ROOT_NAMES:
        root = bpy.data.objects[name]
        points = [root.matrix_world.inverted() @ obj.matrix_world @ v.co for obj in root.children_recursive if obj.type == 'MESH' for v in obj.data.vertices]
        low = [min(p[i] for p in points) for i in range(3)]
        high = [max(p[i] for p in points) for i in range(3)]
        browser_low = [low[0],low[2],-high[1]]
        browser_high = [high[0],high[2],-low[1]]
        lamps = {}
        for obj in root.children_recursive:
            if obj.type == 'EMPTY' and ('_Lamp' in obj.name or '_Candle' in obj.name):
                p = root.matrix_world.inverted() @ obj.matrix_world.translation
                lamps[obj.name] = [p.x,p.z,-p.y]
        roots[name] = {'browserMin':browser_low,'browserMax':browser_high,'browserSize':[browser_high[i]-browser_low[i] for i in range(3)],'lampAnchors':lamps,'meshes':len([obj for obj in root.children_recursive if obj.type=='MESH'])}
    assert all(roots[name]['browserSize'][0] < 5.7 for name in ROOT_NAMES[:2])
    assert roots['Boat_C']['browserSize'][0] < 10
    assert all('Boat_C_Candle_%02d'%i in roots['Boat_C']['lampAnchors'] for i in range(1,5))
    assert not [obj for obj in bpy.data.objects if obj.type in ['LIGHT','CAMERA']]
    maps = [{'name':im.name,'size':list(im.size),'packed':bool(im.packed_file),'colorspace':im.colorspace_settings.name} for im in bpy.data.images]
    assert len(maps) == 3, maps
    assert all(m['size']==[2048,2048] for m in maps)
    result = {'blender':bpy.app.version_string,'masterReopened':True,'sourceObjects':source_count,'missingDependencies':missing,'freshGLBImport':True,'bytes':GLB.stat().st_size,'meshCount':len(meshes),'vertices':sum(len(obj.data.vertices) for obj in meshes),'materials':[mat.name for mat in bpy.data.materials],'images':maps,'roots':roots,'finite':True,'pointLightsExported':False}
    (OUT/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print('RIVER_V007_VERIFIED',json.dumps(result),flush=True)


def pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene = bpy.context.scene
    for name in ['Boat_A','Boat_B','Shore_Village']:
        for obj in bpy.data.objects[name].children_recursive:
            obj.hide_render = True
    collection = bpy.data.collections.new('River v007 | temporary material review')
    scene.collection.children.link(collection)
    floor_mat = material('temporary v007 review water',(.012,.028,.046),.19,.3)
    box(collection,None,'Temporary v007 review water',(0,0,-.035),(22,18,.07),floor_mat)
    data = bpy.data.cameras.new('Canoe night pilot lens')
    data.type = 'ORTHO'
    data.ortho_scale = 12.5
    camera = bpy.data.objects.new('Canoe night pilot camera',data)
    collection.objects.link(camera)
    camera.location = (7,-12,10)
    camera.rotation_euler = (Vector((0,0,.5))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.camera = camera
    review_light(collection,'V007 moon key',(0,-3,12),(0,0,.5),900,(.49,.65,1),8)
    review_light(collection,'V007 warm fill',(-5,2,7),(0,0,.5),700,(1,.68,.37),6)
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 800
    scene.render.resolution_y = 500
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(OUT/'canoe-night-pilot.png')
    bpy.ops.render.render(write_still=True)
    if '--poses' in sys.argv:
        c = bpy.data.objects['Boat_C']
        for frame in range(4):
            phase = frame / 4 * math.tau
            c.location.z = math.sin(phase) * .027
            c.rotation_euler.x = math.sin(phase + .5) * .008
            c.rotation_euler.y = math.cos(phase) * .005
            scene.render.filepath = str(OUT / ('canoe-pose-%02d.png' % frame))
            bpy.ops.render.render(write_still=True)
    print('RIVER_V007_PILOT_COMPLETE',flush=True)


if '--build' in sys.argv:
    build()
elif '--strip-data-profiles' in sys.argv:
    strip_data_png_profiles()
elif '--verify' in sys.argv:
    verify()
elif '--pilot' in sys.argv:
    pilot()
else:
    raise RuntimeError('Choose --build, --verify or --pilot')
