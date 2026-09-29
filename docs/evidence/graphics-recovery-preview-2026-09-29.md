# Graphics loading and overload recovery — preview evidence

Build `2026-09-29.6` is live at the [isolated Cloudflare preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/), Worker version `af4cd528-4a56-4efa-9028-a604d7e655a9`. Its `/release.json` reports the same 50-entry source and asset fingerprint as the tested local production bundle: `e05400864811cb02531e7dfa4a4de24c52106c6b92b4ec908392a6f5e7261534`. The preview has no production route. Production remained on `.5` while this candidate was verified.

## Diagnosis and change

The [public `.5` diagnosis](graphics-loading-diagnosis-2026-09-29.md) found all six authored art requests successful and active. Gold Willow did render, but five seconds of playback on Chromium's **software** WebGL renderer produced only 23 animation callbacks, with a 149.9 ms median and 1099.9 ms 95th-percentile callback interval. The Canvas comparison produced 303 callbacks with a 16.7 ms median. That could make the fireworks appear frozen on a similarly overloaded browser. It does not establish the cause on the owner's device.

Build `.6` lets each art asset load and activate independently. A delayed or failed file leaves the other assets and procedural fallback usable. Paper and rocket meshes wait for a body-free frame where possible; diagnostics record loading, ready, active, or failed for each file. During repeated severe active-frame stalls, the app switches to Canvas while keeping the same simulation, selected firework, show, manual pause behavior, drag coordinates, and saved quality choice. The notice identifies compatibility graphics when the switch occurs.

The existing particle, trail, smoke, and pixel ceilings were **not increased**. They do not limit file downloads, and increasing them would worsen the measured software-WebGL delay. Ultra remains the default and saved quality choices remain intact.

## Verification completed

| Gate | Result and scope |
| --- | --- |
| Build and code | Typecheck, lint, production build, and 128 unit/engine tests passed. `npm audit --audit-level=high` found zero vulnerabilities. |
| Logical soak | 7,200 simulated seconds; 1,317 launches, 2,875 bursts, bounded trails, smoke, heads, cues, and rockets. This is not a GPU or thermal soak. |
| Hosted release files | `/`, `/sw.js`, `/art/terrace-v004.glb`, and `/art/smoke-density-light.png` returned HTTP 200; the hosted fingerprint matched the local build. |
| Hosted stage and input | [34 checks](graphics-recovery-v6/preview-stage-report.json), zero errors, including seven viewport sizes, sky and terrace drag, 3D/Canvas art and reflection budgets, pause/focus, sound, and missing-asset fallback. |
| Hosted ten-effect collection | [19 desktop](graphics-recovery-v6/preview-grand-desktop-report.json) and [24 mobile](graphics-recovery-v6/preview-grand-mobile-report.json) checks, zero errors, across WebGL and Canvas. |
| Hosted original playback/platform | [13 desktop](graphics-recovery-v6/preview-flow-desktop-report.json) and [16 mobile](graphics-recovery-v6/preview-flow-mobile-report.json) checks, zero errors, including real input, offline reload, pause and show flows. |
| Hosted recovery/viewability | [15 checks](graphics-recovery-v6/preview-recovery-report.json), zero failures. |
| New asset regression | One hosted delayed/failed-asset scenario passed: other assets activated during a committed flight; paper and rocket activated after body clearance. |
| New overload regression | [Five hosted checks](graphics-recovery-v6/preview-overload-report.json), zero errors. Three injected 600 ms active-frame samples forced the real WebGL-to-Canvas handoff; the same rocket continued and burst, manual pause and saved Standard quality survived, sky/terrace drops still mapped, and a separate Festival/Ultra run continued. The injection is available only with `?qa=1`; it is deterministic functional evidence, not a performance measurement. |

The [desktop WebGL Saturn](graphics-recovery-v6/preview-desktop-webgl-saturn.png), [mobile WebGL Saturn](graphics-recovery-v6/preview-mobile-webgl-saturn.png), and [recovered Canvas sky burst](graphics-recovery-v6/preview-recovered-canvas.png) are captures from the hosted preview. They show different renderer paths and should not be treated as image-generation concepts or physical-device captures.

Physical Android/iPhone hardware, Safari, hardware WebGPU, sustained 60 fps, and thermal endurance remain untested. The owner's reported device/browser has not yet been identified. The separate preview verifies the exact build before production promotion; it does not by itself change the production domain.
