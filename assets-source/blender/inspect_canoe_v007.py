"""Read-only detailed geometry/material probe of the downloaded CC0 canoe."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / "downloads" / "wooden-canoe-cc0"
def graph(tree):
    return {"nodes": [{"name": n.name, "type": n.bl_idname, "image": n.image.name if n.type == "TEX_IMAGE" and n.image else None, "group": n.node_tree.name if n.type == "GROUP" and n.node_tree else None, "inputs": {s.name: list(s.default_value) if hasattr(s.default_value, '__len__') else s.default_value for s in n.inputs if hasattr(s,'default_value') and not isinstance(s.default_value, bpy.types.ID)}} for n in tree.nodes], "links": [{"from": [l.from_node.name,l.from_socket.name], "to": [l.to_node.name,l.to_socket.name]} for l in tree.links]}
objects=[]
for obj in bpy.data.objects:
    if obj.type == "MESH":
        points=[obj.matrix_world @ Vector(v) for v in obj.bound_box]
        material_counts={m.name: sum(p.material_index==i for p in obj.data.polygons) for i,m in enumerate(obj.data.materials)}
        objects.append({"name":obj.name,"boundsMin":[min(v[i] for v in points) for i in range(3)],"boundsMax":[max(v[i] for v in points) for i in range(3)],"polys":len(obj.data.polygons),"materials":material_counts,"uvActive":obj.data.uv_layers.active.name})
images=[{"name":im.name,"size":list(im.size),"colorspace":im.colorspace_settings.name,"format":im.file_format,"packed":bool(im.packed_file)} for im in bpy.data.images]
result={"objects":objects,"images":images,"materials":{m.name:graph(m.node_tree) for m in bpy.data.materials if m.node_tree},"nodeGroups":{g.name:graph(g) for g in bpy.data.node_groups if g.bl_idname=="ShaderNodeTree"}}
(OUT/'material-geometry-report.json').write_text(json.dumps(result,indent=2,default=str),encoding='utf-8')
print(json.dumps({"objects":objects,"images":images},indent=2),flush=True)
