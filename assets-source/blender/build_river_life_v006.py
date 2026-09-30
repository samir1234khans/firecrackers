"""Original editable boats and a sparse village for the living river.

Blender 5.2.1 LTS: --build / --pilot / --verify. The web export contains only
the four named asset roots, grouped geometry, and lamp anchors. Blender Z=0 is
the waterline and glTF converts it to browser Y=0. No water, sky, lights, camera,
simulation cache, or external texture is exported.
"""
import bpy
import json
import math
import random
import sys
from pathlib import Path

from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets-source' / 'blender'
MASTER = SOURCE / 'masters' / 'river-life-v006.blend'
OUT = SOURCE / 'renders' / 'river-v006'
GLB = ROOT / 'public' / 'art' / 'river-life-v006.glb'
OUT.mkdir(parents=True, exist_ok=True)
SEED = 630427
ROOT_NAMES = ['Boat_A', 'Boat_B', 'Boat_C', 'Shore_Village']


def material(name, color, roughness, metallic=0, emission=False):
    mat = bpy.data.materials.new('RiverLife | ' + name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if emission:
        shader.inputs['Emission Color'].default_value = (1, .43, .12, 1)
        shader.inputs['Emission Strength'].default_value = .48
    mat.diffuse_color = (*color, 1)
    return mat


def attach(obj, collection, parent, name, mat=None):
    obj.name = name
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    obj.parent = parent
    if mat:
        obj.data.materials.append(mat)
    return obj


def mesh(collection, parent, name, vertices, faces, mat):
    data = bpy.data.meshes.new(name + ' | editable geometry')
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.parent = parent
    data.materials.append(mat)
    return obj


def box(collection, parent, name, position, dimensions, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = attach(bpy.context.object, collection, parent, name, mat)
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Editable worn edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    return obj


def curve(collection, parent, name, points, radius, mat, closed=False):
    data = bpy.data.curves.new(name + ' | editable path', 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 2
    data.bevel_depth = radius
    data.bevel_resolution = 2
    spline = data.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (*co, 1)
    spline.use_cyclic_u = closed
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.parent = parent
    data.materials.append(mat)
    return obj


def anchor(collection, parent, name, position):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.parent = parent
    obj.location = position
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = .15
    obj['runtime_role'] = 'restrained warm light attachment; no built-in glTF light'
    return obj


def cylinder(collection, parent, name, position, radius, depth, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=position)
    return attach(bpy.context.object, collection, parent, name, mat)


def vertex_tint(obj, color):
    tint = obj.data.color_attributes.new(name='VillageTint', type='FLOAT_COLOR', domain='POINT')
    for item in tint.data:
        item.color = (*color, 1)


def make_root(name):
    collection = bpy.data.collections.new(name + ' | individually editable source')
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new(name, None)
    collection.objects.link(root)
    root['asset_id'] = name
    root['coordinate_contract'] = 'Blender Z waterline 0; glTF browser Y waterline 0'
    return collection, root


def hull_width(t):
    return .855 * math.sin(math.pi * t) ** .69 + .40 * (1 - t) ** 4


def hull_height(t):
    return .50 + .16 * t ** 3 + .065 * (1 - t) ** 3


def boat(name, variant, mats):
    collection, root = make_root(name)
    intervals = 20
    # Each strake is its own editable plank mesh. Curved sheer and varying beam
    # give the boats a real open hull, rather than a floating extruded oval.
    for side in [-1, 1]:
        for row in range(6):
            vertices = []
            for index in range(intervals + 1):
                t = index / intervals
                x = -2.75 + t * 5.5
                width = hull_width(t)
                sheer = hull_height(t)
                for end in [row / 6, (row + 1) / 6]:
                    z = -.35 + end * (sheer + .35)
                    y = side * width * (.27 + .73 * math.sin(end * math.pi / 2))
                    vertices.append((x, y, z))
            faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(intervals)]
            obj = mesh(collection, root, name + ' | %s hull strake %02d' % ('port' if side < 0 else 'starboard', row + 1), vertices, faces, mats['wood'])
            solid = obj.modifiers.new('Editable plank thickness', 'SOLIDIFY')
            solid.thickness = .048
            bevel = obj.modifiers.new('Editable softened plank edges', 'BEVEL')
            bevel.width = .008
            bevel.segments = 1
            for poly in obj.data.polygons:
                poly.use_smooth = True
        points = [(-2.75 + i / intervals * 5.5, side * hull_width(i / intervals), hull_height(i / intervals)) for i in range(intervals + 1)]
        curve(collection, root, name + ' | bent sheer gunwale %d' % side, points, .043, mats['dark'])
        # Restrained geometric seams remain visible without adding another map.
        for row in [2, 4]:
            level = row / 6
            points = [(-2.75 + i / intervals * 5.5, side * hull_width(i / intervals) * (.27 + .73 * math.sin(level * math.pi / 2)), -.35 + level * (hull_height(i / intervals) + .35)) for i in range(intervals + 1)]
            curve(collection, root, name + ' | dark plank seam %d-%d' % (side, row), points, .0055, mats['dark'])
    # Stern transom and a narrower interior floor make the hull read as hollow.
    mesh(collection, root, name + ' | fitted stern transom', [(-2.745, -.11, -.33), (-2.745, .11, -.33), (-2.745, .40, .56), (-2.745, -.40, .56)], [(0, 1, 2, 3)], mats['wood']).modifiers.new('Editable transom thickness', 'SOLIDIFY').thickness = .045
    for strip in range(5):
        y = (strip - 2) * .13
        box(collection, root, name + ' | interior floor slat %02d' % strip, (-.25, y, -.235), (3.65, .121, .07), mats['wood'], .007)
    for bench, x in enumerate([-.95, .58]):
        width = hull_width((x + 2.75) / 5.5) * 1.72
        box(collection, root, name + ' | fitted thwart bench %02d' % bench, (x, 0, .355), (.29, width, .075), mats['wood'], .014)
        for side in [-1, 1]:
            box(collection, root, name + ' | bench support %02d-%d' % (bench, side), (x, side * width * .37, .08), (.08, .08, .53), mats['dark'], .004)
    # Long slender oar and blade sit inside the boat, preserving the target beam.
    curve(collection, root, name + ' | stowed oar shaft', [(-1.68, -.46, .425), (1.45, -.54, .47)], .028, mats['wood'])
    box(collection, root, name + ' | oar blade', (-1.83, -.46, .425), (.47, .19, .052), mats['wood'], .012)
    for ring in range(4):
        points = [(1.44 + math.cos(i / 32 * math.tau) * (.19 + ring * .025), .04 + math.sin(i / 32 * math.tau) * (.17 + ring * .022), .34 + ring * .018) for i in range(32)]
        curve(collection, root, name + ' | coiled mooring rope %02d' % ring, points, .013, mats['rope'], True)
    curve(collection, root, name + ' | bow mooring line', [(2.43, 0, .52), (2.63, -.08, .43), (2.52, -.32, .22)], .012, mats['rope'])
    for x in [-2.23, 1.94]:
        box(collection, root, name + ' | small cleat %.2f' % x, (x, .05, .46), (.13, .11, .07), mats['metal'], .009)
    lamp_position = [(.18, .24, 1.22), (-.30, -.21, 1.15), (.46, .13, 1.25)][variant]
    lx, ly, lz = lamp_position
    curve(collection, root, name + ' | lantern post', [(lx, ly, .35), (lx, ly, lz + .17)], .018, mats['metal'])
    box(collection, root, name + ' | lantern luminous glass', (lx, ly, lz), (.10, .10, .15), mats['glow'], .015)
    for z in [lz - .09, lz + .09]:
        box(collection, root, name + ' | lantern cap %.2f' % z, (lx, ly, z), (.145, .145, .025), mats['metal'], .01)
    for dx in [-.057, .057]:
        for dy in [-.057, .057]:
            box(collection, root, name + ' | lantern frame %.2f %.2f' % (dx, dy), (lx + dx, ly + dy, lz), (.012, .012, .16), mats['metal'])
    anchor(collection, root, name + '_Lamp', lamp_position)
    if variant == 0:
        # Tackle crate, open top with slatted sides.
        for side in [-1, 1]:
            for row in range(3):
                box(collection, root, name + ' | tackle crate plank %d-%d' % (side, row), (-1.70, side * .23, .15 + row * .085), (.52, .035, .062), mats['wood'], .004)
        box(collection, root, name + ' | tackle crate base', (-1.70, 0, .11), (.52, .48, .065), mats['dark'])
    elif variant == 1:
        # A simple folded net is restrained and opaque, avoiding transparent load.
        for strand in range(7):
            y = -.12 + strand * .04
            points = [(-1.92 + i * .11, y, .28 + .08 * math.sin(i * .6 + strand * .4)) for i in range(11)]
            curve(collection, root, name + ' | folded fishing net %02d' % strand, points, .012, mats['rope'])
    else:
        box(collection, root, name + ' | bow storage cover', (1.48, 0, .385), (.77, .66, .055), mats['dark'], .016)
        enhance_nauka(collection, root, mats)
    root['variant'] = ['working fishing boat', 'net fishing boat', 'moored wooden skiff'][variant]
    root['nominal_length_m'] = 9.46 if variant == 2 else 5.5
    root['nominal_beam_m'] = 3.0 if variant == 2 else 1.8
    if variant == 2:
        root['variant'] = 'larger traditional dark-timber nauka with arched woven canopy and four candle lanterns'
    return collection, root


def enhance_nauka(collection, root, mats):
    # Enlarge only C's editable local geometry; A/B stay unchanged. Keep the
    # original pitch/beam proportions while giving the larger nauka real space.
    stretch = Vector((1.72, 1.62, 1.30))
    for obj in list(root.children):
        if 'lantern' in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        obj.location = Vector((obj.location.x * stretch.x, obj.location.y * stretch.y, obj.location.z * stretch.z))
        if obj.type in ['MESH', 'CURVE']:
            obj.scale = Vector((obj.scale.x * stretch.x, obj.scale.y * stretch.y, obj.scale.z * stretch.z))
            if obj.data.materials and obj.data.materials[0] == mats['wood']:
                obj.data.materials[0] = mats['nauka_wood']
    # A low woven canopy covers the middle, leaving the bow/stern open.
    sections = 16
    xs = [-2.65, -1.5, -.2, 1.15, 2.65]
    vertices = [(x, math.cos(i / sections * math.pi) * 1.23, 1.045 + math.sin(i / sections * math.pi) * 1.19) for x in xs for i in range(sections + 1)]
    faces = []
    for row in range(len(xs) - 1):
        for i in range(sections):
            a = row * (sections + 1) + i
            faces.append((a, a + 1, a + sections + 2, a + sections + 1))
    cover = mesh(collection, root, 'Boat_C | low arched woven canopy', vertices, faces, mats['canopy'])
    cover.modifiers.new('Editable woven canopy thickness', 'SOLIDIFY').thickness = .022
    for polygon in cover.data.polygons:
        polygon.use_smooth = True
    for row, x in enumerate(xs):
        points = [(x, math.cos(i / sections * math.pi) * 1.255, 1.055 + math.sin(i / sections * math.pi) * 1.205) for i in range(sections + 1)]
        curve(collection, root, 'Boat_C | bent canopy rib %02d' % row, points, .028, mats['nauka_wood'])
        for side in [-1, 1]:
            curve(collection, root, 'Boat_C | canopy rail support %02d-%d' % (row, side), [(x, side * 1.20, .61), (x, side * 1.255, 1.08)], .025, mats['nauka_wood'])
    for band in range(1, 12):
        angle = band / 12 * math.pi
        points = [(x, math.cos(angle) * 1.245, 1.052 + math.sin(angle) * 1.20) for x in xs]
        curve(collection, root, 'Boat_C | fine canopy weave seam %02d' % band, points, .0055, mats['rope'])
    for side in [-1, 1]:
        curve(collection, root, 'Boat_C | canopy edge cord %d' % side, [(x, side * 1.25, 1.064) for x in xs], .016, mats['rope'])
    # Exposed shoulder positions beyond the canopy ends. The bow is narrower
    # than the stern, so the lanterns follow the actual beam rather than floating
    # at a symmetric +/-1.35 offset outside the hull.
    candle_positions = [(-3.1, -1.04, 1.00), (-3.1, 1.04, 1.00), (3.1, -.76, 1.00), (3.1, .76, 1.00)]
    for number, position in enumerate(candle_positions, 1):
        x, y, z = position
        anchor(collection, root, 'Boat_C_Candle_%02d' % number, position)
        cylinder(collection, root, 'Boat_C | candle %02d wax body' % number, (x, y, z - .11), .046, .13, mats['wax'])
        curve(collection, root, 'Boat_C | candle %02d wick' % number, [(x, y, z - .043), (x, y, z - .015)], .005, mats['dark'])
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.021, radius2=.003, depth=.064, location=(x, y, z))
        attach(bpy.context.object, collection, root, 'Boat_C | candle %02d steady flame' % number, mats['glow'])
        # Four thin panes provide warm glass while avoiding a transparent volume.
        for side in [-1, 1]:
            box(collection, root, 'Boat_C | candle %02d glass X%d' % (number, side), (x + side * .095, y, z - .06), (.006, .18, .30), mats['lantern_glass'])
            box(collection, root, 'Boat_C | candle %02d glass Y%d' % (number, side), (x, y + side * .095, z - .06), (.18, .006, .30), mats['lantern_glass'])
        for dz in [-.225, .10]:
            box(collection, root, 'Boat_C | candle %02d lantern cap %.3f' % (number, dz), (x, y, z + dz), (.23, .23, .026), mats['metal'], .006)
        for dx in [-.108, .108]:
            for dy in [-.108, .108]:
                box(collection, root, 'Boat_C | candle %02d lantern corner %.3f %.3f' % (number, dx, dy), (x + dx, y + dy, z - .06), (.015, .015, .325), mats['metal'])
        t = (x / 1.72 + 2.75) / 5.5
        sheer = hull_height(t) * 1.30
        curve(collection, root, 'Boat_C | candle %02d short lantern post' % number, [(x, y, sheer - .08), (x, y, z - .237)], .028, mats['nauka_wood'])
        box(collection, root, 'Boat_C | candle %02d shoulder bracket' % number, (x, y, sheer - .025), (.26, .31, .045), mats['nauka_wood'], .006)
    # Compatibility attachment is a non-rendering marker at candle 01.
    bpy.data.objects['Boat_C_Lamp'].location = candle_positions[0]
    root['candle_count'] = 4


def village(mats):
    collection, root = make_root('Shore_Village')
    rng = random.Random(SEED)
    box(collection, root, 'Shore village | old stone quay', (0, -1.4, -.28), (90, 4.6, .56), mats['stone'], .11)
    for block in range(18):
        box(collection, root, 'Shore village | worn quay coping %02d' % block, (-42.5 + block * 5, -3.64, .025), (4.87, .36, .29), mats['stone'], .055)
    warm_count = 0
    centers = [-40, -33.5, -26, -20.5, -7.5, -.2, 6.2, 19, 24.5, 30.2, 35.7, 41]
    depths = [2.5, -.8, 4.7, 1.2, 3.8, -.4, 2.2, 5.4, 1.9, -.5, 4.1, 1.4]
    wall_colors = [(.13, .153, .16), (.17, .155, .125), (.145, .16, .152), (.11, .135, .15)]
    roof_colors = [(.045, .055, .066), (.064, .058, .047), (.035, .046, .055)]
    for house in range(12):
        x = centers[house] + rng.uniform(-.45, .45)
        y = depths[house] + rng.uniform(-.3, .3)
        house_root = bpy.data.objects.new('Shore village | house %02d editable group' % house, None)
        collection.objects.link(house_root)
        house_root.parent = root
        house_root.location = (x, y, 0)
        house_root.rotation_euler.z = rng.uniform(-.23, .23)
        width = rng.uniform(4.3, 6.6)
        depth = rng.uniform(3.8, 5.9)
        height = rng.uniform(2.25, 3.35)
        rise = rng.uniform(.83, 1.48)
        walls = box(collection, house_root, 'Shore village | house %02d plaster walls' % house, (0, 0, height / 2), (width, depth, height), mats['wall'], .045)
        vertex_tint(walls, wall_colors[house % len(wall_colors)])
        # Pitched roof includes gable caps and real overhang, no broad billboard.
        w = width / 2 + .18
        d = depth / 2 + .22
        vertices = [(-w, -d, height), (w, -d, height), (w, d, height), (-w, d, height), (0, -d, height + rise), (0, d, height + rise)]
        roof = mesh(collection, house_root, 'Shore village | house %02d pitched roof' % house, vertices, [(0, 1, 4), (2, 3, 5), (0, 4, 5, 3), (4, 1, 2, 5)], mats['roof'])
        vertex_tint(roof, roof_colors[house % len(roof_colors)])
        if house % 3 == 0:
            box(collection, house_root, 'Shore village | house %02d chimney' % house, (width * .24, .3, height + rise * .65), (.38, .43, .9), mats['stone'], .015)
        # Four warm windows among 24 windows: 83% remain dark.
        for window in range(2):
            wx = (-.24 if window == 0 else .24) * width
            wy = -depth / 2 - .035
            wz = 1.22 + (house % 2) * .11
            warm = house in [1, 4, 7, 10] and window == 1
            mat = mats['glow'] if warm else mats['glass']
            box(collection, house_root, 'Shore village | house %02d window %d' % (house, window), (wx, wy, wz), (.63, .055, .74), mat)
            for dx in [-.36, .36]:
                box(collection, house_root, 'Shore village | window jamb %02d-%d-%.2f' % (house, window, dx), (wx + dx, wy - .02, wz), (.065, .09, .85), mats['wood'])
            for dz in [-.405, .405]:
                box(collection, house_root, 'Shore village | window lintel %02d-%d-%.2f' % (house, window, dz), (wx, wy - .02, wz + dz), (.77, .09, .065), mats['wood'])
            if warm:
                warm_count += 1
                anchor(collection, house_root, 'Shore_Village_Warm_Lamp_%02d' % warm_count, (wx, wy - .07, wz))
        box(collection, house_root, 'Shore village | house %02d quiet door' % house, (0, -depth / 2 - .055, .9), (.70, .08, 1.8), mats['wood'])
    root['warm_window_count'] = warm_count
    root['dark_window_count'] = 24 - warm_count
    root['house_count'] = 12
    root['nominal_width_m'] = 90
    root['cluster_sizes'] = '4,3,5 with unequal dark gaps, substantial depth staggering and individual yaw'
    return collection, root


def export_grouped(roots):
    # Convert evaluated duplicates only. The editable master is already saved.
    export_collection = bpy.data.collections.new('RiverLife | scoped export duplicates')
    bpy.context.scene.collection.children.link(export_collection)
    original_roots = {}
    for collection, root in roots:
        original_roots[root.name] = root
        root.name += ' | editable source'
    exported_roots = []
    mesh_count = 0
    # Small background geometry retains the silhouette, plank thickness and
    # details, while avoiding subdivision and UV storage that have no effect at
    # its browser size. These in-memory edits happen after saving the master.
    for original in original_roots.values():
        for obj in original.children_recursive:
            if obj.type == 'CURVE':
                obj.data.bevel_resolution = 0
            for modifier in obj.modifiers:
                if modifier.type == 'BEVEL':
                    modifier.show_viewport = False
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for original_name, original in original_roots.items():
        exp_root = bpy.data.objects.new(original_name, None)
        export_collection.objects.link(exp_root)
        exported_roots.append(exp_root)
        groups = {}
        for obj in list(original.children_recursive):
            if obj.type == 'EMPTY':
                if '_Lamp' not in obj.name and '_Candle' not in obj.name:
                    continue
                name = obj.name
                obj.name += ' | editable source'
                anchor_copy = obj.copy()
                anchor_copy.name = name
                export_collection.objects.link(anchor_copy)
                anchor_copy.parent = exp_root
                anchor_copy.matrix_world = obj.matrix_world.copy()
                continue
            if obj.type not in ['MESH', 'CURVE']:
                continue
            evaluated = obj.evaluated_get(depsgraph)
            data = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
            for layer in list(data.uv_layers):
                data.uv_layers.remove(layer)
            copy = bpy.data.objects.new(original_name + ' | export component', data)
            export_collection.objects.link(copy)
            copy.matrix_world = obj.matrix_world.copy()
            copy.parent = exp_root
            mat_name = data.materials[0].name if data.materials else 'unassigned'
            groups.setdefault(mat_name, []).append(copy)
        for index, (mat_name, components) in enumerate(groups.items()):
            bpy.ops.object.select_all(action='DESELECT')
            for obj in components:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = components[0]
            bpy.ops.object.join()
            joined = bpy.context.object
            joined.name = original_name + ' | ' + mat_name.split('|')[-1].strip()
            mesh_count += 1
    bpy.ops.object.select_all(action='DESELECT')
    for obj in export_collection.objects:
        obj.select_set(True)
    assert mesh_count <= 28, mesh_count
    bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    assert GLB.stat().st_size <= 700 * 1024, GLB.stat().st_size
    return mesh_count


def build():
    # A deliberately separate new project: no prior .blend is loaded or changed.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = 'River life v006 | original boats and far homes'
    mats = {'wood': material('weathered warm timber', (.23, .12, .057), .82), 'dark': material('pitch and dark worn timber', (.035, .043, .046), .87), 'rope': material('undyed mooring rope', (.30, .25, .15), .96), 'metal': material('aged dark fittings', (.13, .14, .12), .42, .56), 'glow': material('restrained amber emission', (.48, .22, .061), .5, emission=True), 'stone': material('old quay granite', (.14, .16, .18), .92), 'wall': material('quiet weathered plaster', (.15, .17, .17), .96), 'roof': material('charcoal pitched roofs', (.055, .063, .075), .91), 'glass': material('dark inactive windows', (.015, .021, .026), .4), 'nauka_wood': material('nauka weathered dark timber', (.13, .093, .065), .87), 'canopy': material('woven muted flax canopy', (.13, .112, .080), .97), 'wax': material('quiet ivory candle wax', (.53, .47, .34), .95), 'lantern_glass': material('thin amber candle glass', (.31, .17, .069), .22)}
    glass_shader = mats['lantern_glass'].node_tree.nodes.get('Principled BSDF')
    glass_shader.inputs['Alpha'].default_value = .22
    mats['lantern_glass'].surface_render_method = 'DITHERED'
    mats['lantern_glass'].use_transparency_overlap = False
    for key in ['wall', 'roof']:
        mat = mats[key]
        vertex = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        vertex.layer_name = 'VillageTint'
        vertex.name = 'Original per-house muted surface tone'
        mat.node_tree.links.new(vertex.outputs['Color'], mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    roots = [boat(name, index, mats) for index, name in enumerate(ROOT_NAMES[:3])]
    roots.append(village(mats))
    scene['provenance'] = 'Original Firecrackers procedural geometry in Blender 5.2.1 LTS'
    scene['seed'] = SEED
    scene['waterline'] = 'Blender Z=0 → glTF browser Y=0'
    scene['export_roots'] = ', '.join(ROOT_NAMES)
    scene['export_rule'] = 'Evaluated duplicates grouped by shared material; editable source untouched'
    scene['lighting'] = 'Sparse static emissive surfaces; no point-light nodes exported'
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.render.resolution_x = 800
    scene.render.resolution_y = 500
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.world = bpy.data.worlds.new('River life | night review world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.045, .070, .12, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .2
    source_counts = {root.name: len(root.children_recursive) for _, root in roots}
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
    mesh_count = export_grouped(roots)
    receipt = {'blender': bpy.app.version_string, 'seed': SEED, 'master': MASTER.name, 'export': GLB.name, 'bytes': GLB.stat().st_size, 'meshCount': mesh_count, 'rootNames': ROOT_NAMES, 'sourceChildCounts': source_counts, 'coordinates': 'Blender Z-up to glTF Y-up; waterline browserY0; boat lengthX; beamZ', 'houseCount': 12, 'villageClusters': [4, 3, 5], 'windows': {'warm': 4, 'dark': 20}, 'naukaCandles': 4, 'externalTextures': False, 'glTFPointLights': False}
    (OUT / 'build-receipt.json').write_text(json.dumps(receipt, indent=2))
    print('RIVER_READY', json.dumps(receipt), flush=True)


def review_light(collection, name, position, target, energy, color, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.color = color
    data.size = size
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene = bpy.context.scene
    # Review arrangement is temporary: all roots in the master retain local origin.
    review_x = [-9, -2, 8]
    for index, name in enumerate(ROOT_NAMES[:3]):
        bpy.data.objects[name].location = (review_x[index], -4, 0)
    bpy.data.objects['Shore_Village'].location = (0, 14, 0)
    collection = bpy.data.collections.new('River life | temporary review lighting')
    scene.collection.children.link(collection)
    floor_mat = material('temporary review water', (.012, .028, .046), .19, .3)
    box(collection, None, 'Temporary review river surface', (0, 1, -.035), (110, 50, .07), floor_mat)
    camera_data = bpy.data.cameras.new('River life | review camera lens')
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = 31
    camera = bpy.data.objects.new('River life | review camera', camera_data)
    collection.objects.link(camera)
    camera.location = (9, -21, 12)
    camera.rotation_euler = (Vector((0, -1, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = camera
    review_light(collection, 'River life | moon key', (0, -4, 15), (0, -3, 0), 1700, (.49, .65, 1), 10)
    review_light(collection, 'River life | warm quay fill', (-8, 3, 9), (0, -3, 0), 1400, (1, .68, .37), 8)
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.filepath = str(OUT / 'boats-night-pilot.png')
    bpy.ops.render.render(write_still=True)
    for frame in range(4):
        for index, name in enumerate(ROOT_NAMES[:3]):
            phase = frame / 4 * math.tau + index * 1.1
            obj = bpy.data.objects[name]
            obj.location.z = math.sin(phase) * .027
            obj.rotation_euler.x = math.sin(phase + .5) * .008
            obj.rotation_euler.y = math.cos(phase) * .005
        scene.render.filepath = str(OUT / ('boat-pose-%02d.png' % frame))
        bpy.ops.render.render(write_still=True)
    for index, name in enumerate(ROOT_NAMES[:3]):
        obj = bpy.data.objects[name]
        obj.location.z = 0
        obj.rotation_euler = (0, 0, 0)
    camera_data.ortho_scale = 103
    camera.location = (0, -38, 21)
    camera.rotation_euler = (Vector((0, 14, 1.2)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    review_light(collection, 'River life | village soft fill', (0, 6, 15), (0, 14, 1), 1800, (.52, .66, 1), 24)
    scene.render.filepath = str(OUT / 'village-night-pilot.png')
    bpy.ops.render.render(write_still=True)
    print('RIVER_PILOT_COMPLETE', flush=True)


def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    missing = [im.filepath for im in bpy.data.images if im.source == 'FILE' and not im.packed_file and not Path(bpy.path.abspath(im.filepath)).exists()]
    assert not missing, missing
    assert all(name in bpy.data.objects for name in ROOT_NAMES)
    assert all(bpy.data.objects[name].location.length == 0 for name in ROOT_NAMES)
    source_objects = len(bpy.data.objects)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    assert all(name in bpy.data.objects for name in ROOT_NAMES)
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    assert len(meshes) <= 28
    assert all(math.isfinite(value) for obj in meshes for vertex in obj.data.vertices for value in vertex.co)
    roots = {}
    for name in ROOT_NAMES:
        root = bpy.data.objects[name]
        coords = [root.matrix_world.inverted() @ obj.matrix_world @ vertex.co for obj in root.children_recursive if obj.type == 'MESH' for vertex in obj.data.vertices]
        low = [min(point[axis] for point in coords) for axis in range(3)]
        high = [max(point[axis] for point in coords) for axis in range(3)]
        # glTF reimport converts its Y-up coordinates back into Blender Z-up.
        browser_low = [low[0], low[2], -high[1]]
        browser_high = [high[0], high[2], -low[1]]
        lamps = {}
        for obj in root.children_recursive:
            if obj.type == 'EMPTY' and ('_Lamp' in obj.name or '_Candle' in obj.name):
                point = root.matrix_world.inverted() @ obj.matrix_world.translation
                lamps[obj.name] = [point.x, point.z, -point.y]
        roots[name] = {'browserMin': browser_low, 'browserMax': browser_high, 'browserSize': [browser_high[axis] - browser_low[axis] for axis in range(3)], 'lampAnchors': lamps, 'meshes': len([obj for obj in root.children_recursive if obj.type == 'MESH'])}
        assert lamps
    assert all(roots[name]['browserSize'][0] < 5.7 for name in ROOT_NAMES[:2])
    assert all(roots[name]['browserSize'][2] < 2 for name in ROOT_NAMES[:2])
    assert roots['Boat_C']['browserSize'][0] < 10
    assert roots['Boat_C']['browserSize'][2] < 3.2
    assert all('Boat_C_Candle_%02d' % i in roots['Boat_C']['lampAnchors'] for i in range(1, 5))
    assert roots['Shore_Village']['browserSize'][0] <= 91
    assert roots['Shore_Village']['browserMax'][1] <= 5
    assert not [obj for obj in bpy.data.objects if obj.type in ['LIGHT', 'CAMERA']]
    color_meshes = [obj.name for obj in meshes if len(obj.data.color_attributes)]
    result = {'blender': bpy.app.version_string, 'masterReopened': True, 'sourceObjects': source_objects, 'missingDependencies': missing, 'freshGLBImport': True, 'bytes': GLB.stat().st_size, 'meshCount': len(meshes), 'materials': [mat.name for mat in bpy.data.materials], 'imageCount': len(bpy.data.images), 'vertices': sum(len(obj.data.vertices) for obj in meshes), 'mutedVillageColorMeshes': color_meshes, 'roots': roots, 'finite': True, 'pointLightsExported': False}
    (OUT / 'verification.json').write_text(json.dumps(result, indent=2))
    print('RIVER_VERIFIED', json.dumps(result), flush=True)


def candle_pilot():
    """One modest review image of the exposed lantern placements, never saved."""
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene = bpy.context.scene
    for name in ['Boat_A', 'Boat_B', 'Shore_Village']:
        for obj in bpy.data.objects[name].children_recursive:
            obj.hide_render = True
    collection = bpy.data.collections.new('River life | temporary candle placement review')
    scene.collection.children.link(collection)
    floor_mat = material('temporary candle review water', (.012, .028, .046), .19, .3)
    box(collection, None, 'Temporary candle review water', (0, 0, -.035), (22, 18, .07), floor_mat)
    camera_data = bpy.data.cameras.new('Nauka exposed candle review lens')
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = 12.5
    camera = bpy.data.objects.new('Nauka exposed candle review camera', camera_data)
    collection.objects.link(camera)
    camera.location = (7, -12, 10)
    camera.rotation_euler = (Vector((0, 0, .5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = camera
    review_light(collection, 'Nauka placement moon key', (0, -3, 12), (0, 0, .5), 900, (.49, .65, 1), 8)
    review_light(collection, 'Nauka placement warm fill', (-5, 2, 7), (0, 0, .5), 700, (1, .68, .37), 6)
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 800
    scene.render.resolution_y = 500
    scene.render.filepath = str(OUT / 'nauka-exposed-candles-pilot.png')
    bpy.ops.render.render(write_still=True)
    print('NAUKA_CANDLE_PILOT_COMPLETE', flush=True)


if '--build' in sys.argv:
    build()
elif '--pilot' in sys.argv:
    pilot()
elif '--verify' in sys.argv:
    verify()
elif '--candle-pilot' in sys.argv:
    candle_pilot()
else:
    raise RuntimeError('Choose --build, --pilot, or --verify')
