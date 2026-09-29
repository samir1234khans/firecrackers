# Original visual assets and recorded sound

## Original work

All runtime visual assets in `public/art/` are authored for this repository with Blender 5.2.1 LTS (build 9e2066aef7ef). The editable masters are in `assets-source/blender/masters/`. They are excluded from the public build. Reproducible generation and fresh-scene verification scripts accompany them.

| File | Content | Browser interpretation |
|---|---|---|
| smoke-density-light.png | 3 animated procedural volumes, 16 rendered frames each, 132-pixel padded cells | Linear density in R/A; signed density gradients in G/B; no sRGB conversion |
| ignition-flame.png | 16 frames of an original animated emissive flame | sRGB color and alpha |
| paper-color.png | Original indigo paper grain, printed gold curves and overlap seam | sRGB color |
| water-normal.png | Original seamless periodic wave normal field | Linear normal data |
| rocket.glb | Paper shell, foil cap/bands, guide stick and seam | Scoped geometry export; body/cap integrated with existing family proportions and attachment logic |
| terrace.glb | Beveled basalt stones and shoreline coping | PBR geometry, material adjusted for browser lighting |

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
