# Waterfront and immediate drag-to-burst delivery

Build **2026-09-29.2**, delivered 2026-09-29. Release status: preview verified; production promotion follows repository validation.

## Product changes

- Six transparent, compact edge groups and a measured clear central corridor shared by WebGL/WebGPU and Canvas framing.
- Accessible side panels with pause ownership, focus containment, Escape and focus restoration.
- Mouse and touch drag from a drawer tile to the burst canopy: one immediate burst at the release point, then natural fade and cleanup. Invalid drops cancel. Keyboard center-burst alternative; normal Launch preserves fuse/ascent.
- All ten seeded identities preserved, tapered trails, colored cores, three animated original Blender smoke families and flame, paper material, rocket and terrace geometry, dark water with selective rippled reflections.
- Opt-in CC0 recorded reports layered with original synthesis; progressive loading, procedural fallbacks, offline runtime caches and resource cleanup.
- Ultra remains default and saved settings are respected. Transparent presentation excludes the waterfront.

## Release identity

- Preview: https://firecrackers-waterfront-preview.allygym-api.workers.dev/
- Preview Worker version: `1e634b71-7207-4e9f-9189-0d6f31fbcd5c`.
- Source and asset SHA-256: `4bc2fee2b736c11edacd67ea5d573dac4dada9e8fcdc8613223efbff6795dc03` across 49 entries.
- Production rollback reference: Worker `firecrackers`, previous version `c2cbc9f9-e058-4220-9c27-dcd7d32bac9f`, build 2026-09-29.1.

## Verified evidence

- 116 unit/regression tests pass; type/lint and production build pass.
- 20 stage checks locally and 20 on the hosted preview. Seven requested viewport sizes, safe insets, actual CDP touch drag, cancellation, keyboard alternative, focus, pause ownership, rotation/committed-flight identity, silent startup/audio activation, and reflection budgets.
- 43 Grand Collection checks (19 desktop, 24 mobile emulation) and 28 original launch/platform checks pass with software WebGL and Canvas. Original suite includes offline reload and transparent presentation recovery.
- 15 viewability/recovery checks pass, including fault injection. The removed center renderer label is now verified inside Settings.
- Accelerated 7,200-second logical soak: 1,317 launches, 2,875 bursts; bounded pools. This is not GPU endurance.
- JSON reports: [waterfront evidence directory](waterfront/). Blender reopen/round-trip report: [verification](../../assets-source/blender/verification.json).
- Twelve image-generation concepts reviewed separately from browser evidence. No model identifier was exposed. Three Blender 5.2.1 LTS editable masters are in `assets-source/blender/masters`. Frames 5 and 14 and a short loop of all three smoke families and flame reviewed; source volumes are procedural animation, not fluid simulations.

## Budgets and limitations

- Visual assets: 1609515 bytes; optional audio: 161894 bytes. Initial built JS/CSS totals approximately 355 KB gzip, below the 1 MB compressed target. Enhanced assets load after initialization; recordings only after explicit sound activation.
- Reflections are a selective screen-space composition using the actual firework layer, not a physically exact ray-traced mirror. Ultra 512 px / 30 Hz; Standard 256 px / 15 Hz; Low/Canvas streak fallback.
- Chromium WebGPU probe returned no adapter and correctly selected WebGL 2. Actual WebGPU parity is **not tested**.
- Physical flagship Android/iPhone, Safari/iOS, 15-minute thermal/frame-time/GPU-resource qualification, complete accessibility/flash certification and OBS are **not tested**. No physical-device FPS claim is made.
- Visual improvements are implemented; conceptual photorealism is not evidence of browser appearance. Local captures and hosted functional checks remain distinct from image-generation/Blender studies.

## Reproduction and rollback

Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run test:soak`, documentation validation and the browser suites with the built preview server. `STAGE_URL`, `GRAND_URL`, `VIDEO_FLOW_URL` and `VIEWABILITY_URL` select hosted origins. CI repeats the gates on the PR.

Publish preview with `wrangler deploy --config wrangler.preview.jsonc`; production with `wrangler deploy` after the same build passes checks. Check `/release.json` against the source SHA above. To roll back, use `wrangler rollback c2cbc9f9-e058-4220-9c27-dcd7d32bac9f --name firecrackers` and verify the old build and domain.
