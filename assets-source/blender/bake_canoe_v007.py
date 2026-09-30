"""Compact faithful PBR bake from OuterSpaceSimon's CC0 Wooden Canoe.

Source file stays immutable. Pin original render UVs and per-object Generated
coordinates before joining so material mappings survive a new export atlas.
"""
import json
from pathlib import Path
import bpy
from mathutils import Vector

SOURCE = Path(__file__).resolve().parents[1]
RAW = SOURCE / 'downloads' / 'wooden-canoe-cc0' / 'source-2k.blend'
OUT = SOURCE / 'blender' / 'renders' / 'river-v007'
TEXTURES = SOURCE / 'blender' / 'textures' / 'canoe-v007'
MASTER = SOURCE / 'blender' / 'masters' / 'canoe-materials-v007.blend'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURES.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(RAW))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 8
scene.render.bake.margin = 12
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.normal_space = 'TANGENT'
scene.render.bake.normal_r = 'POS_X'
scene.render.bake.normal_g = 'POS_Y'
scene.render.bake.normal_b = 'POS_Z'
materials = [mat for mat in bpy.data.materials if mat.node_tree]
for mat in materials:
    tree = mat.node_tree
    uv = tree.nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'automap'
    uv.name = 'Pinned original source render UV'
    generated = tree.nodes.new('ShaderNodeAttribute')
    generated.attribute_name = 'OriginalGenerated'
    generated.name = 'Pinned original per-object Generated coordinates'
    for node in list(tree.nodes):
        if node.type == 'TEX_COORD':
            for link in list(node.outputs['UV'].links):
                tree.links.new(uv.outputs['UV'], link.to_socket)
            for link in list(node.outputs['Generated'].links):
                tree.links.new(generated.outputs['Vector'], link.to_socket)
        elif node.type == 'TEX_IMAGE' and not node.inputs['Vector'].is_linked:
            tree.links.new(uv.outputs['UV'], node.inputs['Vector'])
        elif node.type == 'NORMAL_MAP':
            node.uv_map = 'automap'

originals = [obj for obj in bpy.data.objects if obj.type == 'MESH']
evaluated_objects = []
depsgraph = bpy.context.evaluated_depsgraph_get()
for obj in originals:
    for modifier in obj.modifiers:
        if modifier.type == 'DYNAMIC_PAINT':
            modifier.show_viewport = False
            modifier.show_render = False
    bpy.context.view_layer.update()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    low = Vector([min(v.co[i] for v in mesh.vertices) for i in range(3)])
    high = Vector([max(v.co[i] for v in mesh.vertices) for i in range(3)])
    generated = mesh.attributes.new('OriginalGenerated', 'FLOAT_VECTOR', 'POINT')
    for vertex, attr in zip(mesh.vertices, generated.data):
        attr.vector = tuple((vertex.co[i]-low[i])/max(high[i]-low[i],1e-6) for i in range(3))
    copy = bpy.data.objects.new('Bake source | '+obj.name, mesh)
    scene.collection.objects.link(copy)
    copy.matrix_world = obj.matrix_world.copy()
    evaluated_objects.append(copy)
for obj in originals:
    obj.hide_render = True
    obj.hide_viewport = True
bpy.ops.object.select_all(action='DESELECT')
for obj in evaluated_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = evaluated_objects[0]
bpy.ops.object.join()
boat = bpy.context.object
boat.name = 'CC0 Canoe | compact baked geometry'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
web_uv = boat.data.uv_layers.new(name='UV_WebAtlas2K')
boat.data.uv_layers.active = web_uv
web_uv.active_render = True
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=.012, area_weight=.0, correct_aspect=True, scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)

targets = []
for mat in boat.data.materials:
    target = mat.node_tree.nodes.new('ShaderNodeTexImage')
    target.name = 'Web atlas bake target'
    mat.node_tree.nodes.active = target
    targets.append(target)
images = {}
for label, kind, noncolor in [('color','DIFFUSE',False),('roughness','ROUGHNESS',True),('normal','NORMAL',True)]:
    image = bpy.data.images.new('Canoe v007 | '+label+' 2K', width=2048, height=2048, alpha=False, float_buffer=False)
    image.colorspace_settings.name = 'Non-Color' if noncolor else 'sRGB'
    for target in targets:
        target.image = image
        target.id_data.nodes.active = target
    print('BAKE_START',label,flush=True)
    bpy.ops.object.bake(type=kind, use_clear=True)
    image.filepath_raw = str(TEXTURES / ('canoe-'+label+'-2k.png'))
    image.file_format = 'PNG'
    image.save()
    image.pack()
    images[label] = image
    print('BAKE_READY',label,Path(image.filepath_raw).stat().st_size,flush=True)

# Standard glTF-compatible browser graph; native original graphs remain in RAW.
mat = bpy.data.materials.new('CC0 Canoe | baked weathered wood and fittings PBR')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
shader = nodes.get('Principled BSDF')
shader.inputs['Metallic'].default_value = 0
shader.inputs['Roughness'].default_value = .8
for label in ['color','roughness','normal']:
    texture = nodes.new('ShaderNodeTexImage')
    texture.name = 'Original CC0 canoe baked '+label
    texture.image = images[label]
    if label == 'normal':
        normal = nodes.new('ShaderNodeNormalMap')
        normal.uv_map = 'UV_WebAtlas2K'
        links.new(texture.outputs['Color'], normal.inputs['Color'])
        links.new(normal.outputs['Normal'],shader.inputs['Normal'])
    else:
        links.new(texture.outputs['Color'],shader.inputs['Base Color' if label=='color' else 'Roughness'])
boat.data.materials.clear()
boat.data.materials.append(mat)
for poly in boat.data.polygons:
    poly.material_index = 0
    poly.use_smooth = True
for obj in list(bpy.data.objects):
    if obj != boat:
        bpy.data.objects.remove(obj, do_unlink=True)
for source_mat in list(bpy.data.materials):
    if source_mat != mat and source_mat.users == 0:
        bpy.data.materials.remove(source_mat)
for source_image in list(bpy.data.images):
    if source_image not in images.values() and source_image.users == 0:
        bpy.data.images.remove(source_image)
scene['source'] = 'Wooden Canoe by OuterSpaceSimon; BlenderKit/Blendkit asset289b6189 CC0'
scene['bake_contract'] = '2K Diffuse color/roughness/tangentnormal; original UV automap pinned; source per-object Generated preserved before join'
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
boat.data.calc_loop_triangles()
receipt={'master':MASTER.name,'source':str(RAW),'sourceLicense':'CC0-1.0','bakedVertices':len(boat.data.vertices),'bakedTriangles':len(boat.data.loop_triangles),'uvLayers':[uv.name for uv in boat.data.uv_layers],'bakeSamples':8,'renderer':'Cycles CPU','maps':{label:{'name':image.name,'size':list(image.size),'bytes':Path(image.filepath_raw).stat().st_size,'colorspace':image.colorspace_settings.name} for label,image in images.items()}}
(OUT/'canoe-bake-receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print('CANOE_BAKE_READY',json.dumps(receipt),flush=True)
