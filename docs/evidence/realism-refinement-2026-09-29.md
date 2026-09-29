# Waterfront realism refinement — local candidate evidence

**Status at capture:** The public custom domain was serving build `2026-09-29.2`. The final local build `2026-09-29.3` was recaptured for the 12 before/after images below after the last scene retune. This comparison predates production promotion.

The final local `public/release.json` fingerprints 49 delivered modules and assets with SHA-256 `4ae7b48094bad269c0a47655d5d20e6839b71f593100aa052d90e4df63a6a40d`. The previous production release and its rollback reference are recorded in [the waterfront release receipt](waterfront-delivery-2026-09-29.md).

## Design inputs and source assets

Three new built-in ChatGPT image-generation studies use actual website screenshots as edit targets: [Saturn waterfront](realism-refinement/concepts/01-saturn-water-desktop.png), [portrait Willow smoke](realism-refinement/concepts/02-willow-smoke-mobile.png), and [Supernova child lighting](realism-refinement/concepts/03-supernova-smoke-desktop.png). The tool exposed no model identifier. [Exact prompts](realism-refinement/PROMPTS.md) and [visual review](realism-refinement/REVIEW.md) record inputs, useful cues and specific image-model inaccuracies. These stills are visual direction only and are not browser proof.

The original Blender 5.2.1 source `assets-source/blender/masters/waterfront-v004.blend` refines the terrace into 48 editable hand-laid meshes with packed 256 × 256 color, roughness, and normal atlases. `assets-source/blender/refine_terrace.py` generates the new source/export while preserving the v003 master. `assets-source/blender/verify_terrace.py` reopened the v004 master and reimported the 547,136-byte `public/art/terrace-v004.glb` into a fresh scene: 48 meshes, embedded three texture channels, finite bounds, and no water or shore geometry in the export. See [the verification receipt](../../assets-source/blender/verification-v004.json) and [asset provenance](../../assets-source/PROVENANCE.md). The atlases and `.blend` remain outside the runtime bundle; the scoped GLB is the browser asset.

## Same-seed browser comparisons — final local candidate

The [machine-readable report](realism-refinement/report.json) contains 12 WebGL 2 screenshots: production `.2` and final local `.3` for each of Gold Willow, Sapphire Saturn, and Opal Supernova at 1280 × 800 and 393 × 851. Each pair uses seed `20260916` and the same logical capture time: 4.9 seconds for Willow/Saturn and 7.8 seconds for Supernova. The report records no page errors. Burst and particle counts match within each before/after pair: Willow 1 / 13,954, Saturn 1 / 6,205, Supernova 7 / 19,406. These matching counts support a composition/material comparison; they do not establish frame-time parity.

| Effect | Desktop production `.2` | Desktop final `.3` | Portrait production `.2` | Portrait final `.3` |
| --- | --- | --- | --- | --- |
| Gold Willow | [before](realism-refinement/before-willow-1280x800.png) | [after](realism-refinement/after-willow-1280x800.png) | [before](realism-refinement/before-willow-393x851.png) | [after](realism-refinement/after-willow-393x851.png) |
| Sapphire Saturn | [before](realism-refinement/before-saturn-1280x800.png) | [after](realism-refinement/after-saturn-1280x800.png) | [before](realism-refinement/before-saturn-393x851.png) | [after](realism-refinement/after-saturn-393x851.png) |
| Opal Supernova | [before](realism-refinement/before-supernova-1280x800.png) | [after](realism-refinement/after-supernova-1280x800.png) | [before](realism-refinement/before-supernova-393x851.png) | [after](realism-refinement/after-supernova-393x851.png) |

Observed in the final captures: the replacement terrace has varied stone color and joint detail; reflected firework color is more visible in broken water patches; the portrait burst occupies more of the clear center with the waterline lower on screen. The local `.3` diagnostic reports a waterline at approximately 0.485 of desktop height and 0.720 of 393 × 851 height. The production `.2` diagnostic did not expose that value, so the numeric waterline is not a before/after measurement. The six compact transparent edge groups remain visible.

The browser images are still visibly simpler than the generated references, particularly in smoke volume, shore detail, and reflection richness. One captured instant cannot verify trail continuity, smoke relighting, or choreography through time. The comparison screenshots are evidence of this implementation pass, not a claim of photographic parity.

## Additional viewport spot checks

Saturn was also captured from the current `4ae7b480...` source at [1280 × 800](realism-refinement/final-saturn-1280x800.png), [393 × 851](realism-refinement/final-saturn-393x851.png), [320 × 480](realism-refinement/final-saturn-320x480.png), [375 × 667](realism-refinement/final-saturn-375x667.png), and [844 × 390](realism-refinement/final-saturn-844x390.png). These separate browser stills show the compact controls, lower portrait waterline, and textured terrace at additional sizes.

## Local checks and qualification

- [Final-source `npm test`](realism-refinement/unit-final.log): 116 passed, zero failed.
- [Final-source lint](realism-refinement/lint-final.log): completed successfully.
- [Final-source TypeScript and Vite build](realism-refinement/build-final.log): passed and emitted the 49-module fingerprint `4ae7b480...`.
- [Final-source stage browser run](realism-refinement/stage-final.json): 22 checks passed, no reported page errors. They cover seven viewports, safe insets, focus/pause ownership, touch drag, audio activation, three reflection budget settings, projected portrait/desktop waterlines, and a blocked `terrace-v004.glb` request falling back to the procedural stage. The measured portrait waterline range was 0.700–0.720 and desktop was 0.485.
- [Desktop original-flow browser run](realism-refinement/video-desktop-final.json): 13 checks with no failure or console error.
- [Mobile original-flow browser run](realism-refinement/video-mobile-final.json): 16 checks with no failure or console error.
- [Viewability and recovery browser run](realism-refinement/viewability-final.json): 15 checks with no failure.
- [Accelerated logical soak](realism-refinement/soak-final.log): 7,200 simulated seconds, 1,317 launches, 2,875 bursts and bounded pools; this is not a GPU or thermal soak.
- [Production dependency audit](realism-refinement/audit-production-final.json): zero reported vulnerabilities at the audit time.
- [Blender verification](../../assets-source/blender/verification-v004.json): editable source, packed maps, and scoped GLB round-trip checked.

## Hosted preview

The separate [Cloudflare preview](https://firecrackers-realism-preview.allygym-api.workers.dev/) serves build `2026-09-29.3` with the same `4ae7b480...` release fingerprint. Wrangler 4.143.0 deployed Worker version `b5194e5e-1502-4980-b248-fa20d22bf4d1`. A live HTTP check returned the expected `/release.json` fingerprint and HTTP 200 for `/art/terrace-v004.glb`. The [hosted stage report](realism-refinement/stage-hosted-preview.json) passed all 22 checks with no page errors; its [Ultra Saturn capture](realism-refinement/saturn-hosted-preview-ultra.png) is a hosted Chromium/WebGL result. The preview is separate from the production custom domain.

The comparison report SHA-256 is `9649a03ab48841c25a8d0aff3e167248b02c9af159e90b1be7d4f806be0dc39c`; its metadata stayed identical when the final PNGs were recaptured because the seed, viewport, count, and logical times stayed fixed. [The capture manifest](realism-refinement/capture-hashes.json) records each final PNG's distinct SHA-256 and the local source fingerprint. All comparison captures used Chromium with WebGL 2, including software rendering where the host selected it. These runs do not establish physical iPhone/Android frame time, thermal endurance, Safari behavior, hardware WebGPU, or full flash qualification. PR/CI and production verification require separate release receipts.
