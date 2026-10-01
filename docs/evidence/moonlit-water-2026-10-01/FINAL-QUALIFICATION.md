# Final water and immersion qualification

The owner authorized completing the remaining work, reconciling branches, promotion to main and production deployment after qualification. Build `2026-10-01.11` is implemented and hosted in isolation; production remains `.4` until the final performance and CI gates pass.

## Source and implementation

Runtime checkpoint: `c002dd073cac6b6895d9586ca99b51b25df7e05b`. Its 83-module normalized source/art/audio fingerprint is `b7687fa6f916f5b3dd391d17d9646888314001a728296313961275001f7b3d45`.

Four Ultra / two Standard deterministic geometric waves share height, slopes, boundary attenuation and integrated wind phase with boat sampling. Three / two normal scales, Fresnel and scene-derived moon illumination reveal broad dark swells and broken facets. Mirrored-camera planar reflections use backend-correct clipping and projective coordinates, excluding the water, contact overlays, launch props, terrace, smoke and screen-space sky. Boats sample four hull points; bounded disturbances, moving lantern anchors and a damp coping strip finish their contacts.

The water mesh follows the visible camera trapezoid with quadratic depth spacing: 6305 vertices wide and 3185 portrait. One bilinearly filtered reflection lookup preserves shared-wave distortion. Ultra uses a 512-pixel maximum edge at 15 Hz wide / 384 pixels at 12 Hz portrait; Standard uses 256 pixels at 15 / 10 Hz; Low and Canvas allocate no reflection target. These rates remain below the planned maximum. Scene transforms resolve once before depth; reflection and main passes share the pose and restore automatic updates in a finally block. Reflection materials warm before interaction.

Canvas retains bounded 96 moon/ambient fragment pairs, 80 practical-light fragments, 21 contacts and 12 broad swells. Up to 128 reflected firework source particles generate three marks each (maximum 384); main fireworks are unchanged. Height-only decorative sampling skips unused derivatives. The final Canvas change preallocates 2304 bytes for fragment positions and batches their two colours, preserving the same phase values, formulas and drawing counts.

Calm, Festival and Finale offer a 48px opt-in toggle. Ordinary chrome smoothly fades and becomes inert/aria-hidden; only Show controls remains. Escape, manual mode, show completion and errors restore controls. The active show keeps progressing. Native keyboard input, dragging cancellation and app/OS reduced-motion transitions are covered.

## Local and isolated hosted checks

244 unit tests, lint and production build passed. [53 native water checks](final/local-water-report.json) and [21 immersion backend/viewport cases](final/local-ui-report.json) passed locally. All three backends cover seven sizes from 320×480 to 1920×1080; additional cases verify pause, hidden-page freeze, quality tiers, reduced motion/flashes, transparency and missing normal assets. Canvas tests launch an actual Willow and verify its source/fragment limits.

The isolated [preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/) serves Worker `5ee76fcc-0ace-4ee2-8f5d-dc8e76e1cdc4` with no production route. Hosted verification passed [32 exact HTTP/asset checks](final/hosted-http-report.json), [53 native water checks](final/hosted-water-report.json) and [21 immersion cases](final/hosted-ui-report.json). Full emitted bytes and normalized fingerprint matched the local build.

[Thirty final captures](final/comparisons.html) show idle water, Willow, Saturn, Opal and Imperial Crown at phone/tablet/desktop sizes, with native WebGPU and Canvas explicitly labelled. Seed 20260916 and logical times match the existing `.4` baseline. Phone viewports are emulated.

## Performance provenance and retained failures

The budget remains the greater of 2 ms or 20% in unrounded p95 frame interval, with no new repeatable launch-transition hitch. A new >50 or >100 ms app interval in at least two paired repetitions is flagged. CPU submission and observer rAF are separate measurements; neither is completed GPU time.

Earlier complete `.7`, `.8`, `.9` and `.10` failures and raw archives remain under `final/`. The `.10` 48-run experiment passed every WebGPU/WebGL pooled cadence, transition and repeatable-hitch condition, but failed four Canvas scheduling/cadence conditions. It is retained as a globally failed experiment, not relabelled a complete pass.

The `.11` source differs only in Canvas rendering and CONFIG_VERSION display metadata. [Normalized source equality](final/gpu-source-equivalence.json) covers every source file, verifies all other catalog lines and establishes the unchanged GPU component. Full release fingerprints remain different. Passing `.10` GPU results may qualify that unchanged component; fresh `.11` native functional checks/captures above verify integration. The final [`.11` Canvas-only 16-run benchmark](final/canvas-11-performance.json) passed every cadence, transition and repeatable-hitch condition with zero runtime errors. [Component qualification](final/performance-qualified-components.json) records 18 primary/observer cadence groups and 12 transition groups passing across all three backends, with explicit measured-build provenance. No combined experiment is represented as one build or one run.

The PC is shared. One earlier native run lost its browser after 42 checks with no application errors, and approximately 472 MiB free RAM was observed. Its report is retained; a fresh browser passed. Other chats, apps and unattributed browser processes were preserved. A capture-harness Canvas readiness condition and a missing screenshot import were repaired; these were harness failures, not application fixes.

## CI and branch reconciliation

The GitHub engine job passed units, build, accelerated logical soak, docs and audit for `c002dd0`; browser and recovery jobs are pending. Browser job allowance is now 25 minutes following a confirmed 18-minute infrastructure timeout; recovery is 30 minutes after confirmed 15/20-minute timeouts. Functional assertions, per-check timeouts and performance budgets were not relaxed.

The 68-ref pre-promotion audit found all current feature/fix/documentation branches integrated in main except this delivery. The historical five-effect JavaScript alternate is preserved under AGENTS.md; it is not a missing upgrade to the canonical thirteen-effect app. A fresh audit and clean-main check are required before merge. PR #31 and main CI must pass before production promotion.

Production rollback remains Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd` / build `.4`. No completed GPU timing, physical phone, Safari or sustained thermal/endurance qualification is claimed.
