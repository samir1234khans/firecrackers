# Galactic sky concept and native art review

## Built-in image generation

- Tool: `image_gen.imagegen` through the imagegen skill, one reference edit.
- Model identifier: not exposed; no model selector was supplied.
- Original generated output preserved as `sky-only-concept-v001.png`.
- Reference inspected first: primary-repo `test-results/river-production-hardware/desktop-webgpu-idle.png`, actual production waterfront/boats/UI capture for build `2026-09-30.4`.
- Intended edit: upper sky only; retained scene and control layout as constraints.
- Generated concept was inspected: two upper-corner nebula regions, tiny stars, dark central canopy and one faint off-center spiral. The output scales the reference and approximates boat/river/UI pixels, so it is design direction rather than a pixel-identical website capture. It is never loaded into the app.
- The built-in output did not expose a model identifier. No API fallback was used.

### Exact prompt

```text
Use case: lighting-weather. Asset type: design concept only, for a native realtime fireworks webapp. Input image is the actual deployed Firecrackers desktop idle capture and is the edit target. Change ONLY the upper night sky above the mountain horizon. Preserve the actual waterfront, river, three wooden boats, candle lights, foreground terrace and rocket, and every edge UI icon, label and position exactly. Preserve the existing 1280x800 composition, the clear central firework viewing corridor, and quiet near-horizon clouds. Add a cinematic but restrained galactic sky: detailed coherent multiscale blue/indigo/violet nebula filaments with a little warm-gold dust, dark dust lanes, thousands of tiny faint stars and denser clusters toward the upper outer corners, one faint small off-center spiral cluster near the upper-left outer sky. Keep the middle of the sky significantly darker and uncluttered so future fireworks remain the hero. Stars must be tiny with only a few sparse fine glints. Subtle believable layered depth; no giant central glowing orb, no large planet, no large circles, no oversized starburst, no lens flare, no dashboard, no new controls, no new text, no fireworks added, no shoreline or boat redesign. This is a restrained original astronomical art direction enhancement, not an exaggerated promotional poster. Change only the sky, preserve all non-sky pixels as closely as possible.
```

## Native canvas implementation

`src/graphics/GalaxySky.ts` supplies original deterministic `stars`, `dust`, and `nearStars` canvases, each 2048 × 1024. The existing field seed6102026 and first star locations remain; new noise, cluster and near-layer streams derive independent seeds. The art bakes once per renderer, has no dependency or image fetch, and consumes no simulation randomness. Animated sampling and shared ambient time belong to the renderer/scheduler work, not this art function.

`metadata` records 5,200 field stars, 3,400 upper-cluster stars, 128 sparse near stars, 23,721 admitted fine dust specks, one faint spiral and the allocation estimate. Six periodic coherent noise scales produce blue/violet filaments, restrained warm-gold accents and dark dust lanes. Dense details sit around x.25/.315/.72/.785, y.085–.235, with nebula regions centered near x.27/.74 and a faint spiral at .27,.15. Central canopy attenuation is88%; all layers end before normalized horizon y.725. There are no large discs or large decorative starbursts.

Three CPU RGBA8 canvas buffers total25,165,824bytes (24MiB). If all three were uploaded as full RGBA8 textures with mipmaps, the upper-bound texture storage estimate is33,554,432bytes (32MiB). These estimates exclude browser copies, source artwork/other scenery and measured GPU allocation. Renderer integration may reuse/composite the far-star layer; no extra download is introduced.

## Standalone validation

`validate-native-art.mjs` runs actual browser Canvas2D on a blank page, without launching the app, a server, a renderer or the shared scheduler. Its bundled art module is a local evidence artifact, never a runtime asset. Native layer PNGs, composite and .60-width portrait study are preserved here; they are art previews, not live website proof.

`native-art-validation.json` records one desktop headless bake taking537ms, zero alpha at every outer edge and below y.725, zero RGB under fully transparent pixels, and bounded peak alpha. Dust mean alpha in the protected center is.0371/255 versus8.7821/255 in the upper cluster regions (about0.42%). Native composite and portrait study were visually inspected for continuous filaments, dark lanes, restrained stars, quiet center and horizon. A single bake duration is not a mobile startup or FPS claim.

Reproduce from the isolated repo:

```powershell
node node_modules/esbuild/bin/esbuild src/graphics/GalaxySky.ts --bundle --format=iife --global-name=GalaxyArt --outfile=docs/evidence/interactive-galactic-sky-2026-09-30/concepts/art-validation-bundle.js
node docs/evidence/interactive-galactic-sky-2026-09-30/concepts/validate-native-art.mjs
```

The initial whole-repository typecheck encountered only concurrent integration's not-yet-created `SkyState` module. The owned art module bundled successfully and the standalone art checks passed. Final integrated typechecking and native WebGPU/WebGL/Canvas browser evidence belong to the integration task.

