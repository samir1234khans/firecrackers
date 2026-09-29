"""Reopen the v004 native terrace master and round-trip its scoped GLB."""

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
MASTER = ROOT / "assets-source" / "blender" / "masters" / "waterfront-v004.blend"
EXPORT = ROOT / "public" / "art" / "terrace-v004.glb"
RECEIPT = ROOT / "assets-source" / "blender" / "verification-v004.json"

if Path(bpy.data.filepath).resolve() != MASTER.resolve():
    raise RuntimeError(f"Load {MASTER} before running verification")

terrace = bpy.data.collections.get("Terrace v004 | hand laid stone")
if not terrace:
    raise RuntimeError("Missing editable v004 terrace collection")
source_meshes = [obj for obj in terrace.objects if obj.type == "MESH"]
source_images = []
for name in ("basalt-color", "basalt-roughness", "basalt-normal"):
    image = bpy.data.images.get(f"Terrace v004 | {name}")
    if image is None or not image.packed_file or tuple(image.size) != (256, 256):
        raise RuntimeError(f"Missing packed source image {name}")
    source_images.append({"name": name, "size": list(image.size), "packed": True})
if len(source_meshes) < 35:
    raise RuntimeError(f"Unexpectedly sparse native terrace: {len(source_meshes)} meshes")
if not bpy.data.objects.get("Review camera") or not bpy.data.objects.get("Terrace detail review camera"):
    raise RuntimeError("Native review cameras missing")

source = {"blend": str(MASTER), "meshCount": len(source_meshes),
          "collection": terrace.name, "packedImages": source_images,
          "legacyMasterStillExists": (ROOT / "assets-source" / "blender" / "masters" / "waterfront-v003.blend").exists()}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(EXPORT))
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
if len(meshes) != len(source_meshes):
    raise RuntimeError(f"GLB mesh count {len(meshes)} differs from source {len(source_meshes)}")
if any(obj.name.startswith(("Distant shore", "Water preview")) for obj in meshes):
    raise RuntimeError("Scope leaked water or shoreline into terrace GLB")

material_info = []
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    nodes = mat.node_tree.nodes
    images = sorted({node.image.name for node in nodes if node.type == "TEX_IMAGE" and node.image})
    material_info.append({"name": mat.name, "images": images})
stone = next((m for m in material_info if "wet weathered basalt" in m["name"]), None)
if stone is None or len(stone["images"]) < 3:
    raise RuntimeError(f"GLB lost embedded texture channels: {material_info}")

points = []
for obj in meshes:
    points.extend([obj.matrix_world @ Vector(corner) for corner in obj.bound_box])
if not all(math.isfinite(value) for p in points for value in p):
    raise RuntimeError("Imported terrace has invalid bounds")
bounds = [[min(p[i] for p in points), max(p[i] for p in points)] for i in range(3)]
if bounds[0][1] - bounds[0][0] > 50 or bounds[1][1] - bounds[1][0] > 15:
    raise RuntimeError(f"Imported terrace exceeds expected footprint: {bounds}")

receipt = {"blender": bpy.app.version_string, "source": source,
           "glb": str(EXPORT), "glbBytes": EXPORT.stat().st_size,
           "importedMeshCount": len(meshes), "materials": material_info,
           "boundsXYZ": bounds, "scope": "Terrace geometry only; no water, shoreline, or lights"}
RECEIPT.write_text(json.dumps(receipt, indent=2))
print("TERRACE_V004_VERIFIED=" + str(RECEIPT))
