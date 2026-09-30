# CC0 textured canoe and original living river v007

The browser asset [river-life-v007.glb](../../public/art/river-life-v007.glb)
replaces the original procedural v006 boat hulls with actual downloadable
wooden-canoe geometry and baked PBR materials. Original canopy, exposed candle
lanterns, nav lamps and twelve-house village remain from the preserved v006
source. It is a 7,620,280-byte GLB with 21 mesh nodes, 16,266 imported vertices,
14 materials and three shared embedded 2048 × 2048 maps.

## Source, rights and immutable download

- Source: [Wooden Canoe by OuterSpaceSimon](https://www.blendkit.com/asset-gallery-detail/a6a39894-5474-47c4-a657-dc8b7a1a5a44/).
- Official metadata declares `isFree: true` and `license: cc_zero` for asset
  `289b6189-9a22-4f31-8f0b-5fabf64e5d81`.
- Primary rights: [Blendkit license documentation](https://www.blendkit.com/docs/licenses/)
  and [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
  CC0 allows modification and redistribution; creator credit is retained voluntarily.
- Durable public download endpoint:
  `https://www.blendkit.com/api/v1/downloads/d0fa7720-2bdf-4b34-b319-de856777ff0c/`.
  The official service supplied an unauthenticated signed file URL. Its ephemeral
  query is deliberately excluded from tracked receipts.
- Immutable downloaded master: `../downloads/wooden-canoe-cc0/source-2k.blend`,
  23,449,491 bytes. SHA256:
  `9bc96ba75b58a51e3cb86943522e2a7e76e7a51aae28efcb7d38df221dc903fd`.
- Saved official metadata, hash and source receipt are adjacent to the immutable
  source. A local unmodified license-page HTML snapshot remains preserved there
  outside Git; the publisher's website/navigation is not redistributed. The
  source was opened with `--disable-autoexec`.

The source contains a hull/fittings mesh and paddle mesh, 16 packed images and
five material graphs. Main weathered planks have original 2K albedo, roughness,
normal and displacement maps; smaller leather and wood materials are packed.
Names identify the main weathered-plank set with
[Poly Haven weathered brown planks](https://polyhaven.com/a/weathered_brown_planks)
and one leather set with [ambientCG Leather032](https://ambientcg.com/view?id=Leather032),
both CC0 libraries. These filename-based identifications are supporting provenance,
not hash verification. The entire chosen asset carries its creator's CC0 grant.

## Material and geometry adaptation

`bake_canoe_v007.py` evaluates the hull and paddle into 2,146 vertices and 4,332
triangles, preserving the source material mapping before making a browser atlas.
The original render UV layer `automap` is explicitly pinned in every source
texture and normal graph. Per-object Generated coordinates are captured into a
point attribute before joining, preserving the procedural paddle mapping.
Original raw source UVs remain in the immutable download. A new
`UV_WebAtlas2K` receives CPU Cycles bakes: diffuse color only, roughness and
tangent-space normal, eight samples, 12-pixel dilation.

The packed editable [canoe-materials-v007.blend](masters/canoe-materials-v007.blend)
and three lossless 2K PNG bake files preserve that material stage.
`prepare_canoe_web_v007.py` creates browser copies: color JPEG quality 94 with
no chroma subsampling, RGB lossless normal PNG and grayscale lossless roughness
PNG. The original roughness RGB channels were verified identical before the
lossless grayscale conversion. glTF packs roughness into G; its B=255 is
multiplied by `metallicFactor: 0`, producing zero effective metalness. Albedo
remains sRGB; normal and roughness remain linear data. Exporter-added sRGB,
gamma and chromaticity metadata is stripped from the data PNG without changing
any compressed pixel payload; `data-profile-receipt.json` records this step.

[river-life-v007.blend](masters/river-life-v007.blend) has 314 editable source
objects and the full packed lossless 2K maps. It preserves individually editable
canopy ribs, supports, candle glass/wax/wicks/steady flame geometry, nav lamps,
house roofs, quay and windows. Three canoe instances share the same source mesh
and PBR material; scoped export duplicates apply their independent proportions.
The primary canoe material is `CC0 Canoe | baked weathered wood and fittings PBR`.
Texture grain, seams and hull curvature come from the real source asset. The
larger canopy boat is an adaptation, not a claim to be a documented historical nauka.

## Runtime contract

Four named empty roots have local waterline origins. Blender Z-up exports to
glTF/browser Y-up, with boat length X and beam Z. No camera, light, water, sky,
animation, external texture request or simulation cache is exported.

| Root | Browser size X × Y × Z | Browser Y bounds | Mesh nodes |
| --- | --- | --- | --- |
| `Boat_A` | 5.5 × 1.620 × 1.75 | −.23…1.39 | 3 |
| `Boat_B` | 5.5 × 1.550 × 1.75 | −.23…1.32 | 3 |
| `Boat_C` | 9.5 × 2.588 × 3.0 | −.30…2.288 | 9 |
| `Shore_Village` | 90 × 4.842 × 13.011 | −.56…4.282 | 6 |

All three boats are visible runtime instances. Ten active lamp/candle/window
anchors drive bounded runtime flames and water fragments. A/B lamp and four
village marker coordinates remain unchanged from v006. C candles stay beyond
the canopy ends at X=±2.65 and are moved inwards to attach to the actual source
hull shoulders. Measured hull half-widths near X=−3.1/+3.1 are .906/.886 metres.

| Marker | Browser local X, Y, Z |
| --- | --- |
| `Boat_C_Candle_01` | −3.1, 1, .775675 |
| `Boat_C_Candle_02` | −3.1, 1, −.775675 |
| `Boat_C_Candle_03` | 3.1, 1, .755811 |
| `Boat_C_Candle_04` | 3.1, 1, −.755811 |

`Boat_C_Lamp` remains a non-active compatibility marker at candle 01. Full exact
float bounds and all anchor coordinates are in
[verification.json](renders/river-v007/verification.json). Village homes remain
in three uneven clusters of 4/3/5 with depth staggering, muted vertex colors,
four warm and twenty dark windows.

The final GLB SHA256 is
`c63facc3e14b410da196a3b148ca10886b0aa75f1af02656d64ba09e6c72d258`.

## Reproduction and evidence

```powershell
$riverBlenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/bake_canoe_v007.py
python assets-source/blender/prepare_canoe_web_v007.py
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v007.py -- --build
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v007.py -- --verify
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python assets-source/blender/build_river_life_v007.py -- --pilot --poses
```

Blender 5.2.1 LTS reopens the final master, confirms packed dependencies, imports
the GLB into a fresh scene, and verifies finite geometry, exact roots/markers,
bounded file/mesh cost and three embedded 2K images. JSON receipts and logs are
under `renders/river-v007/`. The modest actual night pilot uses Cycles CPU,
32 samples and 800 × 500 pixels; it was inspected for original wood grain,
continuous hull silhouette, canopy support contact and exposed candle placement.
Four additional poses use .027 vertical bob, .008 roll and .005 pitch radians.
These are illustrative animation review poses, not a fluid simulation.

The source render is separate evidence from browser PBR lighting, native WebGPU
or WebGL activation, candle glow, water reflections and device performance.
Those require the runtime worker's actual browser verification.

## Preserved alternatives

All v006 masters, pilots and historical exports are preserved. Its final exposed
lantern export moved from public delivery to
`renders/river-v006/exposed-lantern-export.glb`, avoiding shipping an unused boat
asset. The inspected Poly Haven Dutch Ship Medium source remains locally under
`../downloads/polyhaven-dutch-ship-medium-v007/`; it was not selected because its
large sailing-ship hull was a poorer riverboat fit. Its raw binaries are not
needed in the public bundle or selected-asset commit.
