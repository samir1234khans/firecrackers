# Living waterfront v008: quiet boats and a readable bank

This is a versioned edit of the inspected [v007 source](RIVER-V007.md), retaining
the actual CC0 weathered canoe, paddle, geometry, original baked UV mapping and
all three shared 2048-square PBR maps. It does not replace the canoe with a
procedural hull. The prior v007 master and exported asset remain unchanged.

## Original asset additions

- A smooth curved woven reed shelter with a small sag between structural ribs,
  existing curved supports and thinner seam cords. Three original repeating
  512-square maps provide subtle reed color, tangent normal and roughness.
- Two small seated, unanimated human silhouettes, one in the uncovered canoe
  and one beyond the larger shelter; approximately .2 m wide heads. No detailed
  face, copied person, animation solver or extra light is introduced.
- Twelve preserved pitched-roof houses with more varied proportions and rear
  placement, a dark sheltered bank, eight restrained tree silhouettes, a short
  weathered fishing landing, posts, descending quay steps and coiled rope.
- The original four village warm-window anchors, both navigation-light anchors
  and four candle anchors retain their exact names and geometry attachments.

All additions are original project work. The canoe rights and immutable source
hash remain documented in [RIVER-V007.md](RIVER-V007.md), including the creator
OuterSpaceSimon, Blendkit's CC0 declaration and the embedded material sources.
No new external download or asset license was introduced.

## Scope and size

| Measurement | Final v008 |
| --- | --- |
| GLB bytes | 8,006,212 |
| Increase over v007 | 385,932 bytes, about 5.1% |
| Packed editable master | 11,757,729 bytes |
| Editable source objects | 361 |
| Exported mesh nodes | 28 |
| Imported vertices | 20,022 |
| Materials | 17 |
| Embedded shared maps | Three 2048-square + three 512-square |
| Active lamp anchors / candle anchors | 10 / 4 |
| Exported camera, light, water or solver cache | None |

Final GLB SHA256:
`0b0dc5a585747a2effe6bce778d7b3b8287a72eacd573eddf9babd0f4a7afcb5`.
The preserved v007 hash is
`c63facc3e14b410da196a3b148ca10886b0aa75f1af02656d64ba09e6c72d258`.

Color maps use sRGB; normal and roughness maps use Non-Color/linear data.
The export reuses the v007 PNG metadata correction: it removes exporter-added
color metadata from data PNGs while preserving all compressed pixel payloads.
The original hull maps stay full 2K, and the saved master packs the lossless
source maps. All six maps are embedded once and shared across instances.

## Runtime changes

[RiverLife.ts](../../src/graphics/RiverLife.ts) places the village at desktop
Z=-982 / scale4.0 and phone Z=-178 / scale1.4. The previous desktop Z=-970 was
almost fully lost to exponential fog; this nearer secondary bank retains
atmospheric distance ahead of the distant hills. The larger canopy boat uses
scale4.1 and Z=-85 instead of scale5.5 and Z=-65. Phone scale is3.1. The other
boats retain depth and yaw variation. The scaled hulls keep their submerged
local draft (canoe −.23 m, shelter boat −.30 m).

Gentle roll, pitch and vertical displacement derive exclusively from the shared
simulation clock and wind. Low quality, motion-off and OS reduced-motion use a
static pose. A single additional instanced draw contains three dark waterline
footprints and eighteen very quiet elongated displacement fragments, bounded at
21 instances. Scratch matrices/quaternions/colors/vectors are reused; no new
per-frame allocation is introduced. The original lamp reflections stay bounded
at80, candle flames at4 and dynamic point lights at1. The existing fallback and
transparent-output visibility contract remain. Resource disposal includes the
new geometry and material while the radial texture remains shared.

Runtime diagnostics report exact texture counts/color spaces and a decoded
RGBA8+mipmap storage estimate. This is an estimate, not a measured GPU allocation.
The six maps total approximately68 MiB of that uncompressed estimate, depending
on generated mipmaps. These assets are progressively loaded and do not replace
the user's quality choice.

## Reproduction and evidence

```powershell
$riverBlenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v008.py -- --build
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v008.py -- --verify
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v008.py -- --pilot --poses
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v008.py -- --village-pilot
```

Blender5.2.1 LTS was verified locally. Before the edit, the skill's scene reporter
inventoried the v007 master. The saved v008 master was reopened with no missing
dependencies; a fresh scene imported the final GLB and verified finite geometry,
six embedded images, four roots and all ten active light attachments. See
[verification.json](renders/river-v008/verification.json) and
[build-receipt.json](renders/river-v008/build-receipt.json).

The actual Cycles CPU boat pilot uses800×500,24samples. The
[night pilot](renders/river-v008/canoe-night-pilot.png) and four separate pose
renders were inspected for continuous hull silhouette, grain, support contact,
weave, exposed lanterns and tiny seated-person scale. Pose amplitudes are
.015 m vertical, .006 and .004 rad roll/pitch; these modest illustrations do not
claim a fluid simulation. The final
[village pilot](renders/river-v008/village-night-pilot.png) was inspected for
unequal rooflines, warm-window restraint and landing/shore relationships.

These Blender renders demonstrate editable geometry and material direction.
Actual web lighting, fog, scale, water interaction, native WebGPU/WebGL and
performance require independent browser qualification by the release owner.
The far-bank tree/person detail is intentionally a small silhouette treatment;
this asset package does not claim photographic characters or live wildlife.

Browser composition refinement: wide view village sits at z=-982 against the actual water edge (-1000), scale 4.0. Its architecture uses a restrained .24 color multiplier with local fog disabled; boat fog remains unchanged. This corrects the tested floating-island pilot without removing scene-wide atmospheric depth.
