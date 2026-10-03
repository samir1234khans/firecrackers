# Original visual assets and recorded sound

## Original work

The original project geometry, material and smoke assets in `public/art/` are authored for this repository with Blender 5.2.1 LTS (build 9e2066aef7ef). External CC0 canoe rights are recorded separately below. Editable masters are in `assets-source/blender/masters/` and versioned asset source directories. They are excluded from the public build. Reproducible generation and fresh-scene verification scripts accompany them.

| File | Content | Browser interpretation |
|---|---|---|
| smoke-density-light.png | 3 animated procedural volumes, 16 rendered frames each, 132-pixel padded cells | Linear density in R/A; signed density gradients in G/B; no sRGB conversion |
| ignition-flame.png | 16 frames of an original animated emissive flame | sRGB color and alpha |
| paper-color.png | Original indigo paper grain, printed gold curves and overlap seam | sRGB color |
| water-normal.png | Original seamless periodic wave normal field | Linear normal data |
| rocket.glb | Paper shell, foil cap/bands, guide stick and seam | Scoped geometry export; body/cap integrated with existing family proportions and attachment logic |
| terrace-v004.glb | 48 individually laid basalt/coping meshes with embedded color, roughness and normal maps | Scoped PBR terrace geometry; local wet glints and stone/joint variation, adjusted for browser lighting |
| terrace-v008.glb | Original irregular basalt, recessed joints, layered foundation and eight packed material variants | Three scoped material meshes with retained per-stone UVs; native source and fresh GLB reimport verified |

Smoke is a baked animated procedural volume rendered in Cycles CPU, not a fluid simulation. No external simulation cache is required. Browser lighting remains dynamic. Blender volume shaders themselves are not exported to glTF. Missing enhanced assets preserve the existing procedural materials and smoke.

The browser uses a selective screen-space reflection of the actual effect layer, rippled and compressed into the visible water band. This composition choice keeps reflections visible on narrow phones; it is not a physically exact ray-traced mirror. Ultra is capped at 512 pixels / 30 Hz, Standard at 256 / 15 Hz. Low and Canvas use event/particle-driven streaks. Foreground and UI are excluded; transparent presentation excludes the water.

## CC0 field recordings

- Author: **rubberduck**.
- Source: [25 CC0 bang / firework SFX](https://opengameart.org/node/92774), published 2019-01-05; page and license verified 2026-09-29.
- Download: [Original ZIP](https://opengameart.org/sites/default/files/25-CC0-bang-sfx.zip).
- License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Redistribution and modification permitted. The source author states these were recorded from fireworks.
- `fw_01.ogg`, `fw_02.ogg`, `fw_03.ogg` become `public/audio/report-01.wav`, `report-02.wav`, `report-03.wav`.
- Processing: mono PCM16 / 22,050 Hz, normalized to 0.7 sampled peak, short attack/release fades. Reproducible browser decoding script: `assets-source/prepare-audio.mjs`.
- Original sound design supplies fuse hiss, launch motor, low boom, echo, crackle and quiet ambience. Recordings are layered with that synthesis, loaded only after explicit Sound activation. No runtime third-party audio requests.

`public/release.json` fingerprints every delivered audio and visual asset, as well as the implementation modules. Asset requests use versioned service-worker caches. Completed optional downloads remain available offline; missing files retain synthesis/procedural fallbacks.

## Terrace v004 refinement

The editable `assets-source/blender/masters/waterfront-v004.blend` preserves the v003 waterfront master. `assets-source/blender/refine_terrace.py` creates four seeded basalt surface variants, cut edges, recessed joints and a contact-scale stone layout. Its three original 256 × 256 atlases are retained as source files in `assets-source/blender/textures/` and packed into the `.blend`; the browser receives them embedded in `public/art/terrace-v004.glb`. Water, shoreline silhouettes and lights remain browser effects and are excluded from this GLB.

`assets-source/blender/verify_terrace.py` reopens the final master and imports the GLB into a fresh Blender scene. [The v004 receipt](blender/verification-v004.json) records 48 source/imported meshes, three packed/embedded texture channels, finite export bounds and the 547,136-byte output. The v003 terrace GLB is retained in `assets-source/blender/exports/terrace-v003.glb` as source history; it is no longer a public runtime asset. No external photographs, material libraries or paid textures were used for the v004 stone.

The three [generated realism studies](../docs/evidence/realism-refinement-2026-09-29.md) are concept art, not material maps or claims about the live browser image. The newer reflection and portrait-framing behavior are browser code, not baked into the terrace asset.


## Cinematic v005 scenery

`public/art/waterfront-night-v005.webp` is original scenery generated with the built-in ChatGPT image-generation tool, then encoded with `assets-source/prepare-scenery.mjs`. [Exact prompt and review](../docs/evidence/cinematic-realism-2026-09-30/PROMPTS.md). Original PNG: `assets-source/scenery/waterfront-night-v005.png`. No model identifier was exposed. It contains sky, hills and sparse village lights; water and firework reflections remain dynamic browser rendering. It loads independently and preserves the procedural sky on failure.

## Blender smoke v005

The refined three-family atlas `public/art/smoke-density-light-v005.png` replaces the selected runtime smoke enhancement and keeps the v003 asset as history. It is 555,389 bytes, 528 × 1584 linear density/gradient data, baked in Blender 5.2.1 Cycles CPU. [Editable source, reproduction and animation review](blender/SMOKE-V005.md). The final source was reopened, the atlas independently reloaded, and representative plus all 48 frame contact sheets inspected. Runtime lights remain dynamic TSL shading; smoke is an evolving baked volume sprite rather than a live fluid solver.

## Blender water v005

`public/art/water-normal-v005.png` is an original linear normal map generated in Blender from 96 seeded periodic waves and 16 periodic warp components. The 512 × 512 map is 230,518 bytes, packed into `blender/masters/waterfront-v005.blend`; original 77 scene objects and 48 terrace objects are preserved. [Verification](blender/renders/water-v005/verification.json) records finite bounded normals, no missing dependencies and preserved source. Browser water uses this map to disturb actual reflection colors; unlit albedo avoids high-frequency sinusoidal bands.

## Original procedural celestial sky

Build `2026-09-30.3` adds `src/graphics/GalaxySky.ts`: original seeded fine-star and curved-dust artwork generated locally into two cached 1024 × 512 canvases. The star canvas is composited into the existing fixed-size sky allocation; the dust uses one additional sRGB texture with bounded shared-clock motion. The same art serves Canvas. No promotional image, video or unpublished OpenAI code is shipped. [Reference and primary-source research](../docs/evidence/galaxy-sky-2026-09-30/RESEARCH.md) records visual inspiration and MIT Three.js source references. The code is original rather than a copied GLSL port; the existing Three.js notices remain included. Cached art has no runtime remote requests and stays available offline with the bundled code.

## Original living river v006

The preserved `blender/renders/river-v006/exposed-lantern-export.glb` is original procedural geometry and PBR material work authored for Firecrackers in Blender 5.2.1 LTS. It was replaced in public delivery by v007. It contains two small wooden fishing boats, a larger dark-timber nauka with an arched woven canopy and four glass candle lanterns, and a twelve-house shore village with a stone quay, four restrained warm windows, and twenty dark windows. Village homes form three unequal clusters with depth staggering, individual yaw, dark gaps and original muted vertex colors. Hull strakes, bent gunwales, benches, stowed oars, coiled rope, fittings, lantern glass/wax/wicks/steady flame geometry, canopy ribs, roof overhangs and window frames are geometry. No photograph, external model, material library, paid asset, or third-party texture was used for v006.

The editable [river-life master](blender/masters/river-life-v006.blend) retains 443 source objects. [The generation script](blender/build_river_life_v006.py) saves that master before evaluating export duplicates, reduces only the duplicate geometry, and groups it by shared material under `Boat_A`, `Boat_B`, `Boat_C`, and `Shore_Village`. The revised GLB is 486,964 bytes, with 24 mesh nodes, 14,690 imported vertices and thirteen embedded PBR materials. It contains no external image dependencies, point-light nodes, cameras, sky or water. The preceding 346-object small-skiff source and 388,936-byte GLB are preserved in `blender/renders/river-v006/pre-nauka-river-life-v006.blend` and `.glb`. The first larger-nauka master/export are preserved as `blender/renders/river-v006/nauka-canopy-lanterns-source.blend` and `nauka-canopy-lanterns-export.glb`. [Fresh-scene verification](blender/renders/river-v006/verification.json) records exact browser bounds, candle/lamp anchors and village color meshes after reopening the master and reimporting the revised GLB.

[Source documentation and render review](blender/RIVER-V006.md) distinguish Blender night pilots and four illustrative bobbing poses from live browser evidence. Runtime activates the two fishing boats and larger nauka, derives light/reflection positions from ten named active anchors, and uses the shared simulation clock for bounded motion. Four candle markers attach to actual flame centers; `Boat_C_Lamp` is a non-rendering compatibility marker that coincides with candle 01. Browser placement, dynamic lighting, reflections and motion are original application code rather than baked water or a video.

A desktop browser review found the initial candle geometry obscured by the canopy. The final geometry and markers move together onto exposed bow/stern shoulders, with short timber posts and brackets inside the calculated hull width. The separate `nauka-exposed-candles-pilot.png` is an inspected 800 × 500 Cycles CPU geometry preview; it does not establish live browser visibility or device performance.

These v006 assets are original project work and have no external asset-license requirement. This record does not assign a new public license to the application or original visual assets. External source rights for the newer v007 hull are recorded below.

## CC0 textured wooden canoe and living river v007

The new [river-life-v007.glb](../public/art/river-life-v007.glb) uses downloadable **Wooden Canoe by OuterSpaceSimon**, with original real wood material maps and hull/paddle geometry, under **CC0 1.0 Universal**. The official [source page](https://www.blendkit.com/asset-gallery-detail/a6a39894-5474-47c4-a657-dc8b7a1a5a44/) and [license documentation](https://www.blendkit.com/docs/licenses/) were verified 2026-09-30. Official metadata for asset `289b6189-9a22-4f31-8f0b-5fabf64e5d81` declares `isFree: true`, `license: cc_zero`; its standard official public download endpoint supplied the 2K source without authentication. Creator attribution is retained voluntarily.

The immutable downloaded source is `downloads/wooden-canoe-cc0/source-2k.blend`, 23,449,491 bytes, SHA256 `9bc96ba75b58a51e3cb86943522e2a7e76e7a51aae28efcb7d38df221dc903fd`. Adjacent saved metadata, official license HTML and `download-receipt.json` record the durable source endpoint and hash. Signed download URL query tokens are excluded from tracked receipts. The source was inspected with Blender `--disable-autoexec`; sixteen packed images had no missing external dependencies.

[The material bake](blender/bake_canoe_v007.py) pins original render UVs and per-object Generated coordinates before joining, then bakes a three-map 2K atlas. Lossless PNG source maps and [the packed material master](blender/masters/canoe-materials-v007.blend) remain editable. [Browser encoding](blender/prepare_canoe_web_v007.py) retains 2048 × 2048 resolution: sRGB color JPEG quality94 without chroma subsampling, linear lossless normal PNG and lossless grayscale roughness. glTF shares all three maps across the canoe instances and packs roughness in G; B255 multiplied by metallicFactor0 produces zero effective metalness. Exporter-added color-profile chunks are stripped from the linear data PNG without changing the compressed pixel payload. Texture filenames identify the main planks with Poly Haven's CC0 `weathered_brown_planks` and one leather material with ambientCG CC0 `Leather032`; those are filename-based supporting provenance, not verified texture hashes. The creator's complete-source CC0 grant is the selected asset's redistribution basis.

The [v007 river master](blender/masters/river-life-v007.blend) has 314 editable objects. Original canopy, exposed glass candle lanterns, nav lamps and clustered twelve-house village remain from v006. The larger hull is proportioned to 9.5 metres long and 3 metres beam; original UV appearance survives through the bake. The output is 7,620,280 bytes, 21 mesh nodes, 16,266 imported vertices, fourteen materials and three embedded 2K images. [Fresh-scene verification](blender/renders/river-v007/verification.json) records reopened packed source, exact named roots and all ten active anchors, finite bounds, image color spaces, no external texture dependencies and no exported lights/cameras. Browser motion, candle lighting and water reflections remain runtime code.

[Source, reproduction, bounds and actual night/pose review](blender/RIVER-V007.md) separate inspected Blender geometry/material evidence from live browser backend, visual and performance evidence. The final v006 GLB is preserved as `blender/renders/river-v006/exposed-lantern-export.glb` and removed from public delivery. The unselected Dutch Ship Medium CC0 inspection is retained locally under `downloads/polyhaven-dutch-ship-medium-v007/`; its raw binaries are not needed for the selected asset or public build. CC0 applies to the downloaded canoe source and its material adaptation; it does not relicense the application or original canopy, candles, village and other project assets.

## Original basalt terrace v008

The new [terrace-v008.glb](../public/art/terrace-v008.glb) is original geometry and material work authored for this repository; no external stone scan, photograph, paid library or downloaded material was used. The original v004 master/export are preserved. Its 47 editable pieces include staggered stone slabs, recessed mortar, water-facing coping and a layered frontage. Three consolidated browser meshes retain eight independently varied basalt patches with color, normal and roughness maps. The final GLB is 2,229,768 bytes, SHA256 `5e230ddfa0d74729c096e47023483b68f4a1abd8b25c67bece9c4f485ff9ca0f`; it has 20,026 exported vertices and 19,460 triangles and contains no water, boats, cameras or lights.

[Editable source, production corrections and scope](blender/terrace-v008/README.md) document the inspected Blender pilots and real-browser feedback. The builder explicitly encodes linear-authored color to sRGB, reloads the actual file before packing, and preserves lossless linear data maps. [Data metadata receipt](blender/terrace-v008/data-profile-receipt.json) confirms color-profile metadata removal with compressed pixels unchanged. [Native reopen and fresh-scene reimport](blender/terrace-v008/verification.json) confirm packed texture dependencies, material color spaces and matching evaluated bounds. Runtime exposure, lighting, composition and live performance are separately qualified by the release owner. This original work does not introduce a third-party license or assign a new public license to the application.

## Living waterfront v008: retained CC0 canoe and original scenery

The new [river-life-v008.glb](../public/art/river-life-v008.glb) preserves the same CC0 Wooden Canoe by OuterSpaceSimon, original baked hull UVs and three shared 2K material maps described above. No new external download or license was introduced. Original additions comprise a curved woven-reed shelter with three shared 512-square maps, two small seated human silhouettes, proportion/depth adjustments to the twelve preserved houses, a sheltered bank with eight tree silhouettes, landing posts, quay steps and mooring rope. All ten named active light attachments, including four exposed candles, are preserved.

[The v008 source and reproduction guide](blender/RIVER-V008.md) records 361 editable objects, 28 exported mesh nodes, 20,022 imported vertices, seventeen materials and six embedded shared maps. The export is 8,006,212 bytes, SHA256 `0b0dc5a585747a2effe6bce778d7b3b8287a72eacd573eddf9babd0f4a7afcb5`. [Fresh-scene verification](blender/renders/river-v008/verification.json) records the reopened packed master, finite bounds, unchanged root/anchor names and no external texture dependencies. Color uses sRGB; normal/roughness data use lossless linear PNG with the established exporter metadata correction. Inspected Cycles boat, pose and village renders establish geometry/material evidence; browser lighting, positioning, reflections, native GPU rendering and performance remain separate evidence.

CC0 applies to the downloaded canoe and its adaptation. Original canopy, figures, foliage, shore buildings, terrace and application code remain original project work under the owner's existing licensing decisions. Voluntary creator attribution and source/CC0 links remain in the generated public third-party notice; the v008 additions do not replace or weaken that notice.

## Reconciled original musical scores

The eighteen original, unchanged FLAC assets and their manifest are retained from held PR #33. See [music provenance](music/PROVENANCE.md). Their inclusion on this candidate does not clear the release hold.
