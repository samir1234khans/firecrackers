# Terrace v008: wet basalt waterfront

## Direction and scope

Original geometry and deterministic material maps made for the Firecrackers
waterfront, guided by the previously approved photographic concept
`docs/evidence/realism-refinement/concepts/01-saturn-water-desktop.png`.
The old v004 terrace, master, and maps are retained unchanged.

This replaces uniform flat paving with 47 editable pieces: a recessed mortar
foundation, three staggered walking courses, raised water-facing coping, and a
lower frontage course. The slabs have varied widths, irregular perimeter wear,
small surface undulations, two-segment bevels, recessed joints and eight material
variants. Dark basalt uses original grain, mineral variation, pores, fissures and
restrained damp regions. Warm and moonlight glints are calibrated in the review
rig rather than painted as fixed illumination into the color map.

No paid assets, downloads, external libraries or textures were introduced.
The work is original, authored for this project, and may be redistributed with
the website under its existing license. No additional third-party attribution
is required for this asset.

## Editable delivery

- [Current master](masters/terrace-v008.blend): 47 individual named pieces with
  editable bevels and weighted normals, named collection and packed maps.
- [Builder](../build_terrace_v008.py): deterministic seed `880241`, independent
  authored scene, scoped temporary export consolidation, review rig and
  verification mode. The builder starts from a separate factory scene and does
  not load or rewrite user masters.
- [Native source inventory](v004-source-inventory.json): inventory of the
  unchanged v004 before production. Original v004 has 48 meshes and 256-pixel
  maps; its approximate surface footprint is preserved.
- [Verification](verification.json): exact hashes/bytes, native reopen,
  packed-image checks, evaluated bounds and fresh-scene GLB reimport.
- Pilot masters and the first pilot render remain versioned as production
  history; the first pilot's wet blotches were too abrupt and the stone too
  smooth. Color storage was compacted to JPEG without lossy data maps. A real
  GPU browser pilot then exposed excessive large blue/black cloudy regions;
  broad albedo and roughness variation were reduced in favor of fine mineral
  grain. A subsequent pilot exposed a color-transfer error: linear albedo was
  being written directly as encoded sRGB. The final explicitly encodes the
  piecewise sRGB transfer and reloads the saved file before packing. Actual
  JPEG RGB means are 63.735/65.703/64.719 with range 52–77, instead of the earlier
  mean of about 13. These intermediate pilots are retained as evidence, not
  successful browser qualification. Native and actual reimported final detail
  renders were inspected after the corrections.

## Browser contract

Web export: `public/art/terrace-v008.glb`, **2,229,768 bytes**, SHA256
`5e230ddfa0d74729c096e47023483b68f4a1abd8b25c67bece9c4f485ff9ca0f`.
It contains three consolidated mesh/material primitives, 20,026 exported vertices
and 19,460 triangles. No cameras, lights, water, boats or shoreline are exported.
There is no Draco or Meshopt decoder dependency.

Evaluated native and reimported Blender coordinates match within 0.001 units:

| Axis | Minimum | Maximum |
| --- | ---: | ---: |
| X, width | -23.537621 | 23.523111 |
| Y, source depth | -6.436636 | 6.932359 |
| Z, source height | -0.750000 | 0.128982 |

Nominal footprint is 47 by 13.28 units, centered close to the origin, with less
than 0.05-unit edge wear. Walking top is approximately Z=0. Source is Blender
Z-up; exported glTF is Y-up: browser X=source X, Y=source Z, Z=-source Y. Runtime
placement should keep launch-body contact at its existing walking-plane datum.
The slightly raised coping remains behind the walking courses.

Materials are opaque glTF PBR with metallic=0:

| Channel | Encoding | Size | Purpose |
| --- | --- | --- | --- |
| Color | JPEG, sRGB | 1024 by 512 | Original eight variants, 256 pixels per patch |
| Normal | PNG, Non-Color | 1024 by 512 | Tangent-space fine pores/fractures |
| Roughness | PNG, Non-Color | 1024 by 512 | Restrained damp-to-dry fine-grain variation; approximately 0.75–0.96 |

All maps are packed into the source and embedded into the GLB. The eight-patch UV
atlas assigns one patch per individual slab with mirrored UV variation and
filtering margins. **Retain the imported per-stone UVs and material maps.** A
whole-terrace repeated texture or blanket normal-map replacement would destroy
the authored variation. The source Normal Map strength is 0.65, also represented
by the exported material. Mortar and footing use separate restrained materials.

[Color encoding](color-encoding-receipt.json) records the intended linear
reflectance and explicit sRGB encoding. [Data profile correction](data-profile-receipt.json)
removes Blender/exporter-added sRGB/gAMA/cHRM/iCCP metadata from data PNGs while
preserving every compressed pixel byte. This prevents browser image color
conversion from changing normal/roughness samples. The native source loads its
actual saved textures before packing; GLB reimport checks three embedded maps
with their correct color/data spaces.

Filling the screen foreground requires runtime camera/layout sizing: the export
preserves world dimensions rather than introducing an arbitrary hidden scale.
The browser still owns shadows, environment/exposure, effect illumination and
quality choices. This asset does not prove browser composition or frame rate;
root integration and live browser review are separate gates.

## Inspected renders and reproduction

- [First pilot](renders/terrace-v008-pilot.png)
- [Final whole asset](renders/terrace-v008-final.png)
- [Final native contact detail](renders/terrace-v008-contact-detail.png)
- [Actual imported GLB contact detail](renders/terrace-v008-roundtrip-detail.png)

Blender **5.2.1 LTS**, Cycles CPU, 32 samples, 1000 by 560 pixels, AgX, exposure
1.6. The review rig has a soft blue moon fill, restrained warm waterfront key,
and blue firework glint. Render transparency is enabled; lights are review-only.
These are material review renders, not captures of the website.

From the repository root in PowerShell:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_terrace_v008.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_terrace_v008.py -- --verify
```

The first command writes only the task-owned v008 outputs; preserve a desired
earlier v008 master before rebuilding. The second reopens the saved native file,
checks packed maps and scoped bounds, imports the GLB into a fresh scene, checks
scope/materials/bounds, then renders the imported asset and writes the receipt.
Raw masters, scripts and review renders must remain outside the public bundle.
