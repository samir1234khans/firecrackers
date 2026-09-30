# Original visual assets and recorded sound

## Original work

The original geometry, material and smoke assets in `public/art/` are authored for this repository with Blender 5.2.1 LTS (build 9e2066aef7ef). The editable masters are in `assets-source/blender/masters/`. They are excluded from the public build. Reproducible generation and fresh-scene verification scripts accompany them.

| File | Content | Browser interpretation |
|---|---|---|
| smoke-density-light.png | 3 animated procedural volumes, 16 rendered frames each, 132-pixel padded cells | Linear density in R/A; signed density gradients in G/B; no sRGB conversion |
| ignition-flame.png | 16 frames of an original animated emissive flame | sRGB color and alpha |
| paper-color.png | Original indigo paper grain, printed gold curves and overlap seam | sRGB color |
| water-normal.png | Original seamless periodic wave normal field | Linear normal data |
| rocket.glb | Paper shell, foil cap/bands, guide stick and seam | Scoped geometry export; body/cap integrated with existing family proportions and attachment logic |
| terrace-v004.glb | 48 individually laid basalt/coping meshes with embedded color, roughness and normal maps | Scoped PBR terrace geometry; local wet glints and stone/joint variation, adjusted for browser lighting |

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
