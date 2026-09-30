"""Original seamless multi-scale water normals, generated in Blender NumPy.

Loads the inventoried v004 waterfront, changes only the Water preview material,
and saves a versioned editable v005 master. Integer Fourier frequencies and a
periodic domain warp keep every sample mathematically periodic on both axes.
Run --build, --pilot, then --verify in separate Blender 5.2.1 processes.
"""
import bpy
import json
import math
import sys
from pathlib import Path

import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets-source' / 'blender'
PRIOR = SOURCE / 'masters' / 'waterfront-v004.blend'
MASTER = SOURCE / 'masters' / 'waterfront-v005.blend'
OUT = SOURCE / 'renders' / 'water-v005'
MAP = ROOT / 'public' / 'art' / 'water-normal-v005.png'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 512
SEED = 528319


def spectrum():
    rng = np.random.default_rng(SEED)
    waves = []
    used = set()
    # Broad gravity wavelets, crossing ripples, and small capillary texture.
    for count, low, high, gain in [(24, 2, 10, 1.0), (40, 9, 27, .58), (32, 24, 52, .24)]:
        accepted = 0
        while accepted < count:
            ky = int(rng.integers(low, high + 1))
            kx = int(rng.integers(-high, high + 1))
            # Broad waves have preferred wind direction but no dominant stripe.
            if accepted % 3:
                kx = int(round(kx * .55))
            if (kx, ky) in used:
                continue
            used.add((kx, ky))
            k = math.sqrt(kx * kx + ky * ky)
            amplitude = gain * rng.uniform(.65, 1.25) / k ** 1.28
            waves.append((kx, ky, amplitude, float(rng.uniform(0, math.tau))))
            accepted += 1
    warps = []
    for axis in range(2):
        terms = []
        for _ in range(8):
            kx = int(rng.integers(-4, 5))
            ky = int(rng.integers(1, 5))
            amplitude = float(rng.uniform(.0013, .0035))
            terms.append((kx, ky, amplitude, float(rng.uniform(0, math.tau))))
        warps.append(terms)
    return waves, warps


def height(u, v, waves, warps):
    wu = np.zeros(np.broadcast_shapes(u.shape, v.shape), dtype=np.float64)
    wv = np.zeros_like(wu)
    for destination, terms in [(wu, warps[0]), (wv, warps[1])]:
        for kx, ky, amplitude, phase in terms:
            destination += amplitude * np.sin(math.tau * (kx * u + ky * v) + phase)
    field = np.zeros_like(wu)
    for kx, ky, amplitude, phase in waves:
        field += amplitude * np.sin(math.tau * (kx * (u + wu) + ky * (v + wv)) + phase)
    return field


def build():
    bpy.ops.wm.open_mainfile(filepath=str(PRIOR))
    scene = bpy.context.scene
    original_count = len(scene.objects)
    original_terrace = len(bpy.data.collections['Terrace v004 | hand laid stone'].objects)
    waves, warps = spectrum()
    axis = np.arange(SIZE, dtype=np.float64) / SIZE
    u, v = np.meshgrid(axis, axis)
    h = height(u, v, waves, warps)
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * .5
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * .5
    slopes = np.sqrt(dx * dx + dy * dy)
    slope_gain = .15 / float(np.percentile(slopes, 95))
    dx *= slope_gain
    dy *= slope_gain
    # Smooth saturation bounds rare slope peaks while preserving their shape.
    dx = .28 * np.tanh(dx / .28)
    dy = .28 * np.tanh(dy / .28)
    normals = np.stack([-dx, -dy, np.ones_like(dx)], axis=-1)
    normals /= np.linalg.norm(normals, axis=-1)[:, :, None]
    rgba = np.concatenate([normals * .5 + .5, np.ones((SIZE, SIZE, 1))], axis=-1).astype(np.float32)
    image = bpy.data.images.new('Water v005 | periodic gravity and capillary normal', width=SIZE, height=SIZE, alpha=True)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw = str(MAP)
    image.file_format = 'PNG'
    image.save()
    image.pack()
    image.use_fake_user = True
    water = bpy.data.objects['Water preview']
    mat = water.data.materials[0].copy()
    mat.name = 'Water v005 | dark multi-scale periodic surface'
    water.data.materials[0] = mat
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    texture = next(node for node in nodes if node.type == 'TEX_IMAGE')
    texture.name = texture.label = 'Original v005 bounded multi-scale water normals'
    texture.image = image
    texture.extension = 'REPEAT'
    mapping = nodes.new('ShaderNodeMapping')
    mapping.name = mapping.label = 'Editable water normal repeat'
    mapping.inputs['Scale'].default_value = (6, 3, 1)
    coordinates = nodes.new('ShaderNodeTexCoord')
    coordinates.name = 'Water UV coordinates'
    links.new(coordinates.outputs['UV'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], texture.inputs['Vector'])
    normal = next(node for node in nodes if node.type == 'NORMAL_MAP')
    normal.name = normal.label = 'Editable water normal strength'
    normal.inputs['Strength'].default_value = .8
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Roughness'].default_value = .19
    for index, node in enumerate(nodes):
        node.location = ((index % 4) * 240, -(index // 4) * 240)
    water['normal_asset'] = 'water-normal-v005.png'
    water['normal_seed'] = SEED
    water['normal_wave_count'] = len(waves)
    water['normal_slope95_target'] = .15
    scene['water_normal_version'] = 'v005'
    scene['water_normal_method'] = '96 original seeded integer Fourier components; 16 periodic domain warp components; bounded multi-scale slopes'
    scene['water_normal_dependencies'] = 'Packed original 512px normal; no external cache'
    scene['water_generation_script'] = 'assets-source/blender/build_water_v005.py'
    assert len(scene.objects) == original_count
    assert len(bpy.data.collections['Terrace v004 | hand laid stone'].objects) == original_terrace
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
    # Analytic periodicity checks evaluate the continuous field at the same
    # points one tile apart, rather than falsely requiring adjacent pixels equal.
    periodic_x = float(np.abs(height(np.zeros_like(axis), axis, waves, warps) - height(np.ones_like(axis), axis, waves, warps)).max())
    periodic_y = float(np.abs(height(axis, np.zeros_like(axis), waves, warps) - height(axis, np.ones_like(axis), waves, warps)).max())
    bounded = np.sqrt(dx * dx + dy * dy)
    receipt = {'blender': bpy.app.version_string, 'seed': SEED, 'size': [SIZE, SIZE], 'file': MAP.name, 'bytes': MAP.stat().st_size, 'waveCount': len(waves), 'warpComponents': sum(len(terms) for terms in warps), 'colorSpace': 'Non-Color; linear tangent-space normal', 'channels': 'RGB = normalized XYZ encoded from [-1,1] to [0,1]; A=1', 'originalObjectCount': original_count, 'originalTerraceObjects': original_terrace, 'slopeMagnitude': {'median': float(np.percentile(bounded, 50)), 'p95': float(np.percentile(bounded, 95)), 'maximum': float(bounded.max())}, 'normalZMinimum': float(normals[:, :, 2].min()), 'analyticPeriodicityError': {'x': periodic_x, 'y': periodic_y}, 'waves': waves, 'periodicWarp': warps}
    assert periodic_x < 1e-10 and periodic_y < 1e-10
    assert MAP.stat().st_size < 500 * 1024
    (OUT / 'generation-receipt.json').write_text(json.dumps(receipt, indent=2))
    print('WATER_BUILT', json.dumps({key: receipt[key] for key in ['blender', 'size', 'bytes', 'waveCount', 'slopeMagnitude', 'analyticPeriodicityError']}), flush=True)


def pilot():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 640
    scene.render.resolution_y = 420
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    # Review only: a tighter specular lobe reveals normals at this small size.
    # The saved master keeps its authored .19 roughness and .8 normal strength.
    material = bpy.data.objects['Water preview'].data.materials[0]
    next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED').inputs['Roughness'].default_value = .06
    next(node for node in material.node_tree.nodes if node.type == 'NORMAL_MAP').inputs['Strength'].default_value = 1.0
    # A temporary review camera and lights never save into the versioned master.
    collection = bpy.data.collections.new('Water v005 | temporary material review')
    scene.collection.children.link(collection)
    camera_data = bpy.data.cameras.new('Water material review lens')
    camera_data.type = 'PERSP'
    camera_data.lens = 48
    camera = bpy.data.objects.new('Water material review camera', camera_data)
    collection.objects.link(camera)
    camera.location = (3, 8, 8)
    camera.rotation_euler = (Vector((0, 31, -.55)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = camera
    for name, position, power, color, size in [('Warm reflected source', (-3, 35, 7), 900, (1, .65, .26), 1.7), ('Cool reflected source', (7, 27, 9), 700, (.23, .45, 1), 2.1)]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy = power
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((position[0], position[1] - 4, -.6)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / 'water-material-pilot.png')
    bpy.ops.render.render(write_still=True)
    print('WATER_PILOT', scene.render.filepath, flush=True)


def verify():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    missing = [im.filepath for im in bpy.data.images if im.source == 'FILE' and not im.packed_file and not Path(bpy.path.abspath(im.filepath)).exists()]
    assert not missing, missing
    water = bpy.data.objects['Water preview']
    material = water.data.materials[0]
    texture = next(node for node in material.node_tree.nodes if node.type == 'TEX_IMAGE')
    assert texture.image.packed_file
    assert texture.image.colorspace_settings.name == 'Non-Color'
    image = bpy.data.images.load(str(MAP), check_existing=False)
    image.colorspace_settings.name = 'Non-Color'
    assert tuple(image.size) == (SIZE, SIZE)
    rgba = np.asarray(image.pixels[:], dtype=np.float32).reshape((SIZE, SIZE, 4))
    assert np.isfinite(rgba).all()
    assert rgba.min() >= 0 and rgba.max() <= 1
    assert np.all(rgba[:, :, 3] == 1)
    normals = rgba[:, :, :3] * 2 - 1
    length = np.linalg.norm(normals, axis=-1)
    assert np.abs(length - 1).max() < .012
    assert normals[:, :, 2].min() > .94
    assert MAP.stat().st_size < 500 * 1024
    receipt = json.loads((OUT / 'generation-receipt.json').read_text())
    assert len(bpy.context.scene.objects) == receipt['originalObjectCount']
    assert len(bpy.data.collections['Terrace v004 | hand laid stone'].objects) == receipt['originalTerraceObjects']
    result = {'master': MASTER.name, 'originalPreserved': PRIOR.exists(), 'blender': bpy.app.version_string, 'missingDependencies': missing, 'packedImages': [im.name for im in bpy.data.images if im.packed_file], 'normalAsset': texture.image.name, 'mapSize': list(image.size), 'bytes': MAP.stat().st_size, 'objectCountPreserved': len(bpy.context.scene.objects), 'terraceObjectsPreserved': receipt['originalTerraceObjects'], 'maxQuantizedNormalLengthError': float(np.abs(length - 1).max()), 'minimumQuantizedNormalZ': float(normals[:, :, 2].min()), 'finite': True, 'linear': True}
    (OUT / 'verification.json').write_text(json.dumps(result, indent=2))
    print('WATER_VERIFIED', json.dumps(result), flush=True)


if '--build' in sys.argv:
    build()
elif '--pilot' in sys.argv:
    pilot()
elif '--verify' in sys.argv:
    verify()
else:
    raise RuntimeError('Choose --build, --pilot, or --verify')
