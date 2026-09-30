"""Refine the original smoke volumes and bake a compact scene-linear data atlas.

Run using Blender 5.2.1 LTS, never standalone bpy. The v003 master stays intact.
Modes: --build (save editable master), --pilot, --bake, --verify.
The three families keep 16 frames, a 128px inner cell, 2px padding, four columns.
R/A hold extinction density; G/B hold signed projected-density gradients.
No fluid solver, simulation cache, external dependency, or display transform.
"""
import bpy
import json
import math
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets-source' / 'blender'
MASTER = SOURCE / 'masters' / 'smoke-ignition-v005.blend'
PRIOR = SOURCE / 'masters' / 'smoke-ignition-v003.blend'
OUT = SOURCE / 'renders' / 'smoke-v005'
ATLAS = ROOT / 'public' / 'art' / 'smoke-density-light-v005.png'
OUT.mkdir(parents=True, exist_ok=True)
FAMILIES = ['Fuse wisps', 'Motor exhaust', 'Burst cloud']
CELL = 132
INNER = 128
PADDING = 2


def scalar(nodes, links, operation, first, second=None, label=None):
    node = nodes.new('ShaderNodeMath')
    node.operation = operation
    if label:
        node.name = node.label = label
    if hasattr(first, 'bl_idname'):
        links.new(first, node.inputs[0])
    else:
        node.inputs[0].default_value = first
    if second is not None:
        if hasattr(second, 'bl_idname'):
            links.new(second, node.inputs[1])
        else:
            node.inputs[1].default_value = second
    return node.outputs[0]


def noise(nodes, links, vector, name, scale, detail, roughness, start, travel):
    node = nodes.new('ShaderNodeTexNoise')
    node.name = node.label = name
    node.noise_dimensions = '4D'
    node.inputs['Scale'].default_value = scale
    node.inputs['Detail'].default_value = detail
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Lacunarity'].default_value = 2.15
    links.new(vector, node.inputs['Vector'])
    node.inputs['W'].default_value = start
    node.inputs['W'].keyframe_insert('default_value', frame=1)
    node.inputs['W'].default_value = start + travel
    node.inputs['W'].keyframe_insert('default_value', frame=48)
    return node


def build():
    bpy.ops.wm.open_mainfile(filepath=str(PRIOR))
    scene = bpy.context.scene
    scene.name = 'Smoke and ignition | coherent billows v005'
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 20
    scene.cycles.use_denoising = False
    scene.render.resolution_x = scene.render.resolution_y = INNER
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.camera.data.ortho_scale = 4.65
    scene.camera.data.lens = 50
    scene['asset_version'] = 'v005'
    scene['atlas_contract'] = '528x1584; 3 families x16; 128 inner +2 pad; linear R density, GB gradients, A opacity'
    scene['volume_method'] = 'Original animated procedural volume; coarse domain warp, coherent billows, medium eddies, fine breakup'
    scene['generation_script'] = 'assets-source/blender/build_smoke_v005.py'
    scene['dependencies'] = 'None: fully procedural; no fluid cache'
    # Small ellipsoidal silhouettes leave empty space at every cell boundary.
    radii = [(.26, .40, .44), (.36, .40, .44), (.445, .44, .425)]
    strengths = [7.5, 8.5, 10.5]
    for family, name in enumerate(FAMILIES):
        obj = bpy.data.objects[name]
        mat = obj.data.materials[0]
        mat.name = name + ' | editable coherent billows v005'
        nodes = mat.node_tree.nodes
        nodes.clear()
        links = mat.node_tree.links
        coord = nodes.new('ShaderNodeTexCoord')
        coord.name = 'Bounded generated volume coordinates'
        coarse = noise(nodes, links, coord.outputs['Generated'], 'Slow rolling domain warp', 2.35 + family * .3, 2.2, .6, family * 7.3, .72)
        centered = nodes.new('ShaderNodeVectorMath')
        centered.operation = 'SUBTRACT'
        centered.inputs[1].default_value = (.5, .5, .5)
        links.new(coarse.outputs['Color'], centered.inputs[0])
        warp = nodes.new('ShaderNodeVectorMath')
        warp.operation = 'SCALE'
        warp.inputs['Scale'].default_value = .13 + family * .04
        links.new(centered.outputs['Vector'], warp.inputs[0])
        warped = nodes.new('ShaderNodeVectorMath')
        warped.operation = 'ADD'
        links.new(coord.outputs['Generated'], warped.inputs[0])
        links.new(warp.outputs['Vector'], warped.inputs[1])
        center = nodes.new('ShaderNodeVectorMath')
        center.operation = 'SUBTRACT'
        center.inputs[1].default_value = (.5, .5, .5)
        links.new(warped.outputs['Vector'], center.inputs[0])
        normalized = nodes.new('ShaderNodeVectorMath')
        normalized.operation = 'DIVIDE'
        normalized.name = normalized.label = 'Editable family ellipsoid'
        normalized.inputs[1].default_value = radii[family]
        links.new(center.outputs['Vector'], normalized.inputs[0])
        distance = nodes.new('ShaderNodeVectorMath')
        distance.operation = 'LENGTH'
        links.new(normalized.outputs['Vector'], distance.inputs[0])
        envelope = nodes.new('ShaderNodeMapRange')
        envelope.name = envelope.label = 'Feathered empty-cell boundary'
        envelope.clamp = True
        envelope.interpolation_type = 'SMOOTHSTEP'
        envelope.inputs['From Min'].default_value = .38
        envelope.inputs['From Max'].default_value = .99
        envelope.inputs['To Min'].default_value = 1
        envelope.inputs['To Max'].default_value = 0
        links.new(distance.outputs['Value'], envelope.inputs['Value'])
        # Mix an irregular set of partially overlapping lobes into the core.
        # Generated coords remain fixed as the 4D noise rolls through them.
        lobe_sets = [
            [((.46, .5, .28), (.17, .32, .20)), ((.52, .5, .53), (.20, .34, .24)), ((.47, .5, .73), (.14, .29, .17))],
            [((.46, .5, .27), (.20, .33, .21)), ((.55, .5, .50), (.28, .34, .26)), ((.43, .5, .71), (.25, .34, .21))],
            [((.30, .48, .40), (.25, .36, .24)), ((.61, .50, .33), (.28, .35, .24)), ((.40, .5, .67), (.29, .35, .26)), ((.68, .5, .59), (.23, .35, .26))],
        ]
        billow_envelope = None
        for lobe_index, (lobe_center, lobe_radius) in enumerate(lobe_sets[family]):
            lobe_offset = nodes.new('ShaderNodeVectorMath')
            lobe_offset.name = 'Editable billow center %d' % lobe_index
            lobe_offset.operation = 'SUBTRACT'
            lobe_offset.inputs[1].default_value = lobe_center
            links.new(warped.outputs['Vector'], lobe_offset.inputs[0])
            lobe_scale = nodes.new('ShaderNodeVectorMath')
            lobe_scale.operation = 'DIVIDE'
            lobe_scale.inputs[1].default_value = lobe_radius
            links.new(lobe_offset.outputs['Vector'], lobe_scale.inputs[0])
            lobe_distance = nodes.new('ShaderNodeVectorMath')
            lobe_distance.operation = 'LENGTH'
            links.new(lobe_scale.outputs['Vector'], lobe_distance.inputs[0])
            lobe_fade = nodes.new('ShaderNodeMapRange')
            lobe_fade.name = 'Smooth billow density %d' % lobe_index
            lobe_fade.clamp = True
            lobe_fade.interpolation_type = 'SMOOTHSTEP'
            lobe_fade.inputs['From Min'].default_value = .22
            lobe_fade.inputs['From Max'].default_value = 1
            lobe_fade.inputs['To Min'].default_value = 1
            lobe_fade.inputs['To Max'].default_value = 0
            links.new(lobe_distance.outputs['Value'], lobe_fade.inputs['Value'])
            billow_envelope = lobe_fade.outputs['Result'] if billow_envelope is None else scalar(nodes, links, 'MAXIMUM', billow_envelope, lobe_fade.outputs['Result'])
        billow_envelope = scalar(nodes, links, 'MAXIMUM', billow_envelope, scalar(nodes, links, 'MULTIPLY', envelope.outputs['Result'], .32))
        billow_envelope = scalar(nodes, links, 'MULTIPLY', billow_envelope, envelope.outputs['Result'])
        billow = noise(nodes, links, warped.outputs['Vector'], 'Coherent large billows', 4.5 + family * .6, 2.4, .67, family * 9.1, .93)
        eddy = noise(nodes, links, warped.outputs['Vector'], 'Medium evolving eddies', 10.5, 3, .72, 13 + family * 3, 1.15)
        fine = noise(nodes, links, warped.outputs['Vector'], 'Fine turbulence breakup', 22, 2, .65, 22 + family * 5, 1.45)
        coarse_density = scalar(nodes, links, 'MULTIPLY', billow.outputs['Fac'], .72)
        medium_density = scalar(nodes, links, 'MULTIPLY', eddy.outputs['Fac'], .21)
        fine_density = scalar(nodes, links, 'MULTIPLY', fine.outputs['Fac'], .07)
        combined = scalar(nodes, links, 'ADD', scalar(nodes, links, 'ADD', coarse_density, medium_density), fine_density)
        thresholded = scalar(nodes, links, 'MAXIMUM', scalar(nodes, links, 'SUBTRACT', combined, .37), 0)
        optical = scalar(nodes, links, 'MULTIPLY', thresholded, billow_envelope)
        density = scalar(nodes, links, 'MULTIPLY', optical, strengths[family], 'Editable optical density')
        volume = nodes.new('ShaderNodeVolumePrincipled')
        volume.name = 'Neutral smoke with preserved dark interior'
        volume.inputs['Color'].default_value = (.45, .48, .53, 1)
        volume.inputs['Anisotropy'].default_value = .12
        links.new(density, volume.inputs['Density'])
        output = nodes.new('ShaderNodeOutputMaterial')
        links.new(volume.outputs['Volume'], output.inputs['Volume'])
        # Group graph spatially so the master remains practical to edit.
        for index, node in enumerate(nodes):
            node.location = ((index % 5) * 245, -(index // 5) * 250)
        obj['density_strength'] = strengths[family]
        obj['family_radius'] = radii[family]
        obj['version'] = 'v005'
        obj.hide_render = family != 2
    scene.frame_set(1)
    scene.render.filepath = '//../renders/smoke-v005/review.png'
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
    print('Saved editable smoke master:', MASTER, flush=True)


def prepare():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene = bpy.context.scene
    scene.render.resolution_x = scene.render.resolution_y = INNER
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 20
    return scene


def render_frame(scene, family, frame):
    for index, name in enumerate(FAMILIES):
        bpy.data.objects[name].hide_render = family != index
    scene.frame_set(1 + round(frame * 47 / 15))
    destination = OUT / ('family-%d-frame-%02d.png' % (family, frame))
    scene.render.filepath = str(destination)
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(str(destination), check_existing=False)
    rgba = np.asarray(image.pixels[:], dtype=np.float32).reshape((INNER, INNER, 4))
    bpy.data.images.remove(image)
    return rgba


def save_image(name, rgba, path, linear=True):
    height, width, _ = rgba.shape
    image = bpy.data.images.new(name, width=width, height=height, alpha=True)
    image.colorspace_settings.name = 'Non-Color' if linear else 'sRGB'
    image.pixels.foreach_set(rgba.astype(np.float32).ravel())
    image.filepath_raw = str(path)
    image.file_format = 'PNG'
    image.save()
    return image


def pilot():
    scene = prepare()
    frames = [0, 7, 15]
    sheet = np.zeros((INNER * 3, INNER * 3, 4), dtype=np.float32)
    sheet[:, :, 3] = 1
    for family in range(3):
        for column, frame in enumerate(frames):
            rgba = render_frame(scene, family, frame)
            # A dark-sky neutral smoke review uses the actual Blender alpha.
            alpha = rgba[:, :, 3:4]
            rgb = np.array([.14, .18, .23], np.float32) + alpha * np.array([.55, .55, .55], np.float32)
            sheet[family * INNER:(family + 1) * INNER, column * INNER:(column + 1) * INNER, :3] = rgb
    save_image('v005 pilot contact sheet', sheet, OUT / 'pilot-contact-sheet.png', linear=False)
    print('PILOT_COMPLETE', flush=True)


def bake():
    scene = prepare()
    started = time.time()
    atlas = np.zeros((CELL * 12, CELL * 4, 4), dtype=np.float32)
    atlas[:, :, 1:3] = .5
    contact = np.zeros((INNER * 3, INNER * 16, 4), dtype=np.float32)
    contact[:, :, 3] = 1
    metrics = []
    for family in range(3):
        previous = None
        for frame in range(16):
            rgba = render_frame(scene, family, frame)
            alpha = rgba[:, :, 3]
            # Modest symmetric filtering removes sample noise and avoids unstable
            # edge normals. Zero padding rather than roll prevents wraparound.
            padded = np.pad(alpha, ((1, 1), (1, 1)), mode='constant')
            alpha = (padded[:-2, 1:-1] + 2 * alpha + padded[2:, 1:-1]) * .25
            padded = np.pad(alpha, ((1, 1), (1, 1)), mode='constant')
            alpha = (padded[1:-1, :-2] + 2 * alpha + padded[1:-1, 2:]) * .25
            dx = np.gradient(alpha, axis=1)
            dy = np.gradient(alpha, axis=0)
            data = np.stack([alpha, np.clip(.5 - dx * 3.2, 0, 1), np.clip(.5 - dy * 3.2, 0, 1), alpha], axis=-1)
            ox = (frame % 4) * CELL + PADDING
            oy = (family * 4 + frame // 4) * CELL + PADDING
            atlas[oy:oy + INNER, ox:ox + INNER] = data
            review = .018 + alpha[:, :, None] * np.array([.57, .61, .65], np.float32)
            contact[family * INNER:(family + 1) * INNER, frame * INNER:(frame + 1) * INNER, :3] = review
            metrics.append({'family': family, 'frame': frame, 'maxOpacity': float(alpha.max()), 'meanOpacity': float(alpha.mean()), 'edgeOpacity': float(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max())), 'nextFrameMeanDelta': None if previous is None else float(np.abs(alpha - previous).mean())})
            previous = alpha
            print('BAKED family=%d frame=%02d elapsed=%.1fs' % (family, frame, time.time() - started), flush=True)
    image = save_image('Smoke v005 | density and projected light gradients', atlas, ATLAS)
    image.pack()
    image.use_fake_user = True
    save_image('Smoke v005 | full motion contact sheet', contact, OUT / 'motion-contact-sheet.png', linear=False)
    scene['baked_atlas'] = '//../../../public/art/smoke-density-light-v005.png'
    scene['baked_frame_count'] = 48
    scene['bake_elapsed_seconds'] = round(time.time() - started, 2)
    scene.frame_set(25)
    for family, name in enumerate(FAMILIES):
        bpy.data.objects[name].hide_render = family != 2
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)
    receipt = {'blender': bpy.app.version_string, 'renderer': 'Cycles CPU', 'samples': 20, 'procedural': True, 'fluidSimulation': False, 'framesPerFamily': 16, 'families': FAMILIES, 'atlas': {'file': ATLAS.name, 'width': 528, 'height': 1584, 'innerCell': 128, 'padding': 2, 'bytes': ATLAS.stat().st_size, 'colorSpace': 'Non-Color; linear data', 'channels': 'R extinction density; GB signed projected-density gradients; A opacity'}, 'seconds': round(time.time() - started, 2), 'metrics': metrics}
    (OUT / 'bake-receipt.json').write_text(json.dumps(receipt, indent=2))
    print('BAKE_COMPLETE', json.dumps({key: receipt[key] for key in ['blender', 'atlas', 'seconds']}), flush=True)


def verify():
    scene = prepare()
    missing = [image.filepath for image in bpy.data.images if image.source == 'FILE' and not image.packed_file and not Path(bpy.path.abspath(image.filepath)).exists()]
    assert not missing, missing
    assert all(name in bpy.data.objects for name in FAMILIES)
    assert 'Ignition flame' in bpy.data.objects
    assert len([obj for obj in bpy.data.objects if 'family_index' in obj]) == 3
    image = bpy.data.images.load(str(ATLAS), check_existing=False)
    assert tuple(image.size) == (528, 1584), tuple(image.size)
    image.colorspace_settings.name = 'Non-Color'
    data = np.asarray(image.pixels[:], dtype=np.float32).reshape((1584, 528, 4))
    assert np.isfinite(data).all()
    assert np.allclose(data[:, :, 0], data[:, :, 3], atol=1 / 255)
    assert ATLAS.stat().st_size <= 1024 * 1024
    paddings = []
    for row in range(12):
        for column in range(4):
            cell = data[row * CELL:(row + 1) * CELL, column * CELL:(column + 1) * CELL]
            padding = max(cell[:2, :, 3].max(), cell[-2:, :, 3].max(), cell[:, :2, 3].max(), cell[:, -2:, 3].max())
            paddings.append(float(padding))
    assert max(paddings) == 0
    result = {'blender': bpy.app.version_string, 'master': MASTER.name, 'sourcePreserved': PRIOR.exists(), 'objects': [obj.name for obj in scene.objects], 'missingDependencies': missing, 'packedImages': [im.name for im in bpy.data.images if im.packed_file], 'materials': [bpy.data.objects[name].data.materials[0].name for name in FAMILIES], 'atlasSize': list(image.size), 'atlasBytes': ATLAS.stat().st_size, 'paddingOpacityMax': max(paddings), 'finite': True, 'redMatchesAlpha': True}
    (OUT / 'verification.json').write_text(json.dumps(result, indent=2))
    print('VERIFIED', json.dumps(result), flush=True)


def pack_export():
    """Repair/export-only packaging without repeating the volume render."""
    prepare()
    image = bpy.data.images.load(str(ATLAS), check_existing=True)
    image.name = 'Smoke v005 | density and projected light gradients'
    image.colorspace_settings.name = 'Non-Color'
    image.pack()
    image.use_fake_user = True
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), relative_remap=True)


if '--build' in sys.argv:
    build()
elif '--pilot' in sys.argv:
    pilot()
elif '--bake' in sys.argv:
    bake()
elif '--verify' in sys.argv:
    verify()
elif '--pack-export' in sys.argv:
    pack_export()
else:
    raise RuntimeError('Choose --build, --pilot, --bake, or --verify')
