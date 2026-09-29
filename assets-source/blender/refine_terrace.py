"""Refine the Firecrackers waterfront terrace without touching the v003 master.

Run with Blender 5.2 from the repository root:
  blender --background --factory-startup --disable-autoexec \
    assets-source/blender/masters/waterfront-v003.blend \
    --python-exit-code 1 --python assets-source/blender/refine_terrace.py

The output GLB contains the terrace only. Water and shore remain browser effects.
"""

import math
import random
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets-source" / "blender" / "masters" / "waterfront-v003.blend"
MASTER = ROOT / "assets-source" / "blender" / "masters" / "waterfront-v004.blend"
TEXTURES = ROOT / "assets-source" / "blender" / "textures"
EXPORT = ROOT / "public" / "art" / "terrace-v004.glb"
PREVIEWS = ROOT.parents[1] / "outputs" / "blender"
TEXTURES.mkdir(parents=True, exist_ok=True)
PREVIEWS.mkdir(parents=True, exist_ok=True)

if Path(bpy.data.filepath).resolve() != SOURCE.resolve():
    raise RuntimeError(f"Load the exact v003 master first: {SOURCE}")
scene = bpy.context.scene
if scene.name != "Waterfront":
    raise RuntimeError("Expected the editable Waterfront scene")


def fractal(rng, n, grid_sizes):
    """Small, deterministic broad-to-fine variation without external images."""
    field = np.zeros((n, n), np.float32)
    for size, weight in grid_sizes:
        grid = rng.random((size + 1, size + 1), dtype=np.float32) - .5
        gx = np.linspace(0, size, n, endpoint=False)
        gy = np.linspace(0, size, n, endpoint=False)
        ix = gx.astype(np.int32)
        iy = gy.astype(np.int32)
        fx = gx - ix
        fy = gy - iy
        fx = fx * fx * (3 - 2 * fx)
        fy = fy * fy * (3 - 2 * fy)
        low = grid[iy[:, None], ix[None, :]]
        high_x = grid[iy[:, None], (ix + 1)[None, :]]
        high_y = grid[(iy + 1)[:, None], ix[None, :]]
        corner = grid[(iy + 1)[:, None], (ix + 1)[None, :]]
        field += ((low * (1 - fx)[None, :] + high_x * fx[None, :]) * (1 - fy)[:, None]
                  + (high_y * (1 - fx)[None, :] + corner * fx[None, :]) * fy[:, None]) * weight
    return field


def make_atlases():
    rng = np.random.default_rng(44127)
    # Each stone covers a small part of the final screen; 128 px per variant
    # retains visible pore detail while keeping the optional GLB lightweight.
    n = 256
    color = np.zeros((n, n, 4), np.float32)
    rough = np.zeros_like(color)
    normals = np.zeros_like(color)
    for variant in range(4):
        cy, cx = divmod(variant, 2)
        tile = n // 2
        broad = fractal(rng, tile, [(3, 1), (8, .42), (26, .13)])
        grit = fractal(rng, tile, [(32, .4), (80, .17)])
        speck = rng.normal(0, .38, (tile, tile)).astype(np.float32)
        veins = np.sin(np.arange(tile, dtype=np.float32)[None, :] * .13
                       + broad * 11 + np.arange(tile, dtype=np.float32)[:, None] * .055)
        veins = (veins > .983).astype(np.float32)
        height = broad * .62 + grit * .25 + speck * .045 + veins * .025
        shade = broad * .28 + grit * .10 + speck * .018 - veins * .012
        # Cool charcoal basalt with local warm iron traces. Distinct tiles avoid
        # repeating the same mottling on every paver while retaining one material.
        base = np.array(((.385, .382, .365), (.33, .355, .362),
                         (.365, .37, .365), (.36, .35, .33))[variant], np.float32)
        iron = np.maximum(0, broad + .17)[:, :, None] * np.array([.065, .021, -.018], np.float32)
        rgb = np.clip(base[None, None, :] + shade[:, :, None] + iron, .12, .63)
        # Reflected highlights sit on less rough, slightly warmer patches.
        r = np.clip(.74 - broad * .21 + grit * .08 + speck * .025, .54, .92)
        dy, dx = np.gradient(height)
        nx = np.clip(-dx * 2.1, -.7, .7)
        ny = np.clip(-dy * 2.1, -.7, .7)
        nz = np.ones_like(nx)
        length = np.sqrt(nx * nx + ny * ny + nz * nz)
        normal = np.stack([(nx / length + 1) / 2,
                           (ny / length + 1) / 2,
                           (nz / length + 1) / 2], axis=-1)
        ys = slice(cy * tile, (cy + 1) * tile)
        xs = slice(cx * tile, (cx + 1) * tile)
        color[ys, xs, :3] = rgb
        color[ys, xs, 3] = 1
        rough[ys, xs, :3] = r[:, :, None]
        rough[ys, xs, 3] = 1
        normals[ys, xs, :3] = normal
        normals[ys, xs, 3] = 1
    result = {}
    for name, values, data in (("basalt-color", color, False),
                               ("basalt-roughness", rough, True),
                               ("basalt-normal", normals, True)):
        im = bpy.data.images.new(f"Terrace v004 | {name}", width=n, height=n, alpha=True)
        im.colorspace_settings.name = "Non-Color" if data else "sRGB"
        im.pixels.foreach_set(values.ravel())
        im.file_format = "PNG"
        im.filepath_raw = str(TEXTURES / f"terrace-{name}-v004.png")
        im.save()
        im.pack()
        result[name] = im
    return result


def principal(name, rgb, roughness=1):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*rgb, 1)
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    return mat, shader


def material_from_atlas(images):
    mat, shader = principal("Terrace v004 | wet weathered basalt", (.37, .37, .36), .76)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    albedo = nodes.new("ShaderNodeTexImage")
    albedo.name = "Authored basalt color"
    albedo.image = images["basalt-color"]
    links.new(albedo.outputs["Color"], shader.inputs["Base Color"])
    rough = nodes.new("ShaderNodeTexImage")
    rough.name = "Authored pore roughness"
    rough.image = images["basalt-roughness"]
    links.new(rough.outputs["Color"], shader.inputs["Roughness"])
    normtex = nodes.new("ShaderNodeTexImage")
    normtex.name = "Authored chipped surface normal"
    normtex.image = images["basalt-normal"]
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = .46
    links.new(normtex.outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], shader.inputs["Normal"])
    return mat


def cube(collection, name, location, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    for existing in tuple(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Editable worn edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        obj.modifiers.new("Corner normals", "WEIGHTED_NORMAL")
    return obj


def atlas_uv(obj, variant):
    v = variant // 2
    u = variant % 2
    # Keep away from the adjacent tile despite linear filtering and mipmaps.
    for item in obj.data.uv_layers.active.data:
        item.uv = ((u * .5) + .006 + item.uv[0] * .488,
                   (v * .5) + .006 + item.uv[1] * .488)
    obj["stone_variant"] = variant


# Replace only the old terrace geometry in this *new* source file. The water,
# shoreline, camera, authored materials and original v003 file stay available.
legacy = bpy.data.collections["Waterfront | authored assets"]
for obj in tuple(legacy.objects):
    if obj.name.startswith(("Terrace stone", "Shore coping")):
        bpy.data.objects.remove(obj, do_unlink=True)
terrace = bpy.data.collections.new("Terrace v004 | hand laid stone")
scene.collection.children.link(terrace)
terrace["material_direction"] = "dark, subtly wet basalt under warm waterfront light"
terrace["seed"] = 44127
images = make_atlases()
stone = material_from_atlas(images)
mortar, _ = principal("Terrace v004 | recessed dark joints", (.022, .026, .03), 1)
fascia_mat, _ = principal("Terrace v004 | cut edge", (.08, .087, .09), .88)

# Recessed mortar remains visible through real uneven gaps. Three staggered
# courses retain the footprint and launch position of the old web export.
cube(terrace, "Mortar bed", (0, 0, -.385), (47, 12.45, .67), mortar, .04)
rng = random.Random(1574)
x_min, x_max = -23.35, 23.35
for row, y in enumerate((-4.1, 0, 4.1)):
    x = x_min
    index = 0
    if row == 1:
        target_width = 2.6
    else:
        target_width = 4.7
    while x < x_max - .15:
        width = target_width if index == 0 else 4.0 + rng.random() * 2.2
        width = min(width, x_max - x)
        if x_max - (x + width) < 1.8:
            width = x_max - x
        gap = .11 + rng.random() * .08
        actual = width - gap
        if actual <= .25:
            break
        z = -.24 + (rng.random() - .5) * .032
        dy = 3.93 - rng.random() * .085
        obj = cube(terrace, f"Laid basalt | course {row+1:02d} stone {index+1:02d}",
                   (x + width / 2, y + (rng.random() - .5) * .025, z),
                   (actual, dy, .55), stone, .075 + rng.random() * .025)
        atlas_uv(obj, (index * 7 + row * 3) % 4)
        x += width
        index += 1

# Low water-side coping creates a visible dark silhouette and worn rim without
# stealing space from the rocket or hiding the view across the water.
x = x_min
index = 0
while x < x_max - .15:
    width = min(4.5 + rng.random() * 2.1, x_max - x)
    if x_max - (x + width) < 1.8:
        width = x_max - x
    obj = cube(terrace, f"Water edge coping | block {index+1:02d}",
               (x + width / 2, 6.45, -.12), (width - .12, .88, .66),
               stone, .095)
    atlas_uv(obj, (index + 2) % 4)
    x += width
    index += 1

# Thin individual fascia stones show thickness at the near edge in the live
# camera. They remain below the walking surface and do not cover launch props.
x = x_min
index = 0
while x < x_max - .15:
    width = min(5.2 + rng.random() * 2.1, x_max - x)
    if x_max - (x + width) < 1.8:
        width = x_max - x
    obj = cube(terrace, f"Front cut edge | block {index+1:02d}",
               (x + width / 2, -6.20, -.38), (width - .14, .38, .75),
               fascia_mat, .045)
    x += width
    index += 1

scene.camera = bpy.data.objects.get("Review camera")
detail_camera_data = bpy.data.cameras.new("Terrace detail | orthographic review")
detail_camera_data.type = "ORTHO"
detail_camera_data.ortho_scale = 33
detail_camera = bpy.data.objects.new("Terrace detail review camera", detail_camera_data)
legacy.objects.link(detail_camera)
detail_camera.location = (11, -20, 10)
detail_camera.rotation_euler = (Vector((0, .1, 0)) - detail_camera.location).to_track_quat("-Z", "Y").to_euler()
scene["terrace_export_version"] = "v004"
scene["terrace_export_scope"] = "Terrace v004 | hand laid stone"
scene.cycles.samples = 20
scene.render.resolution_x = 800
scene.render.resolution_y = 560
scene.render.resolution_percentage = 100
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)

# Scope the GLB to only the terrace collection. This keeps browser bundle and
# draw calls bounded; water and shore have independent authored implementations.
bpy.ops.object.select_all(action="DESELECT")
for obj in terrace.objects:
    if obj.type == "MESH":
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(EXPORT), export_format="GLB",
                          use_selection=True, export_apply=True)

scene.camera = detail_camera
scene.render.filepath = str(PREVIEWS / "waterfront-terrace-v004-pilot.png")
bpy.ops.render.render(write_still=True)
print(f"TERRACE_V004_MASTER={MASTER}")
print(f"TERRACE_V004_EXPORT={EXPORT}")
print(f"TERRACE_V004_PREVIEW={scene.render.filepath}")
