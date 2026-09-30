"""Preserved Poly Haven import and bounded CPU hull feasibility study.

Run in Blender with --disable-autoexec. Source textures remain unchanged.
"""
import argparse
import json
from pathlib import Path
import sys
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1] / "downloads" / "polyhaven-dutch-ship-medium-v007"
STUDY = ROOT / "inspection"
MASTER = STUDY / "dutch-ship-medium-import-v007.blend"

def bounds(obj):
    points = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    return {"min": [min(v[i] for v in points) for i in range(3)], "max": [max(v[i] for v in points) for i in range(3)], "size": [max(v[i] for v in points)-min(v[i] for v in points) for i in range(3)]}

def components(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00001)
    bm.verts.ensure_lookup_table()
    seen = set()
    rows = []
    for start in bm.verts:
        if start in seen:
            continue
        stack = [start]
        seen.add(start)
        vertices = []
        faces = set()
        while stack:
            v = stack.pop()
            vertices.append(obj.matrix_world @ v.co)
            faces.update(v.link_faces)
            for edge in v.link_edges:
                other = edge.other_vert(v)
                if other not in seen:
                    seen.add(other)
                    stack.append(other)
        rows.append({"verts": len(vertices), "triangles": sum(len(face.verts)-2 for face in faces), "min": [min(v[i] for v in vertices) for i in range(3)], "max": [max(v[i] for v in vertices) for i in range(3)]})
    bm.free()
    return sorted(rows, key=lambda row: row["triangles"], reverse=True)

def import_source():
    STUDY.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / "dutch_ship_medium_1k.gltf"))
    bpy.context.view_layer.update()
    rows = []
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            rows.append({"name": obj.name, "vertices": len(obj.data.vertices), "triangles": len(obj.data.loop_triangles), "bounds": bounds(obj), "materials": [m.name for m in obj.data.materials], "components": components(obj)})
    images = [{"name": img.name, "size": list(img.size), "filepath": img.filepath, "colorspace": img.colorspace_settings.name} for img in bpy.data.images]
    materials = [{"name": mat.name, "image_nodes": [{"name": node.image.name, "colorspace": node.image.colorspace_settings.name} for node in mat.node_tree.nodes if node.type == "TEX_IMAGE" and node.image]} for mat in bpy.data.materials if mat.use_nodes]
    (STUDY / "import-report.json").write_text(json.dumps({"blender": bpy.app.version_string, "objects": rows, "images": images, "materials": materials, "no_source_mutation": True, "source": "https://polyhaven.com/a/dutch_ship_medium", "license": "CC0-1.0"}, indent=2), encoding="utf-8")
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER))
    print(json.dumps({"master": str(MASTER), "meshes": [{k: v for k, v in row.items() if k != "components"} for row in rows], "images": images}, indent=2), flush=True)

def point_at(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z', 'Y').to_euler()

def area(name, location, target, energy, size, color):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = energy
    light.shape = "DISK"
    light.size = size
    light.color = color
    obj = bpy.data.objects.new(name, light)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    point_at(obj, target)

def pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    hull = bpy.data.objects.get("dutch_ship_medium_hull")
    if hull is None:
        raise RuntimeError("Expected named source hull missing")
    for obj in bpy.data.objects:
        obj.hide_render = obj != hull
    b = bounds(hull)
    center = Vector([(a+z)/2 for a, z in zip(b["min"],b["max"])])
    extent = max(b["size"])
    camera = bpy.data.objects.new("Inspection | hull camera", bpy.data.cameras.new("Inspection | hull camera"))
    bpy.context.scene.collection.objects.link(camera)
    camera.location = center + Vector((extent*.92, -extent*.88, extent*.67))
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = extent*1.15
    point_at(camera, center)
    scene = bpy.context.scene
    scene.camera = camera
    world = bpy.data.worlds.new("Inspection | neutral world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (.16,.19,.24,1)
    world.node_tree.nodes["Background"].inputs[1].default_value = .45
    scene.world = world
    area("Inspection | key", center+Vector((extent*.1,-extent*.5,extent*.8)), center, extent*extent*75, extent*.6, (1,.86,.70))
    area("Inspection | rim", center+Vector((-extent*.35,extent*.55,extent*.45)), center, extent*extent*35, extent*.5, (.64,.78,1))
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 20
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "AgX"
    bpy.ops.wm.save_as_mainfile(filepath=str(STUDY / "dutch-ship-hull-study-v007.blend"))
    scene.render.filepath = str(STUDY / "hull-only-pilot.png")
    bpy.ops.render.render(write_still=True)
    print("PILOT_READY", scene.render.filepath, flush=True)

def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    missing = [image.filepath for image in bpy.data.images if image.source == "FILE" and not image.packed_file and not Path(bpy.path.abspath(image.filepath)).is_file()]
    row = {"reopened": str(MASTER), "objects": len(bpy.data.objects), "images": len(bpy.data.images), "packed_images": sum(bool(img.packed_file) for img in bpy.data.images), "missing_dependencies": missing}
    if missing:
        raise RuntimeError(str(row))
    (STUDY / "reopen-verification.json").write_text(json.dumps(row, indent=2), encoding="utf-8")
    print(json.dumps(row), flush=True)

parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=["import", "pilot", "verify"])
args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
{"import": import_source, "pilot": pilot, "verify": verify}[args.mode]()
