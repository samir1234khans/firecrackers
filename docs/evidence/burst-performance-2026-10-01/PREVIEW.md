# Rocket-to-burst stall — isolated preview

Build `2026-10-01.4` is available at the [isolated Cloudflare preview](https://firecrackers-burst-preview.allygym-api.workers.dev/). The delivered 80-module source/artwork fingerprint is `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`; Worker version `bfd4c8a2-b394-40d2-a8bf-b81486a02af9`. Configuration `wrangler.burst-preview.jsonc` has no production route. The previous open-sky preview remains at `.3` for comparison.

The observed pause was a lighting-pipeline rebuild, not a larger burst simulation step. A Chrome CPU profile attributed about 1.0 seconds to WebGL `getProgramParameter` program-link checks during a baseline launch. Instrumenting the renderer located the long work in `post.render()` rather than particle preparation or the water-reflection pass. The scene's light hash changed when an individual rocket prop appeared or disappeared; this caused many lit shore, boat and terrace materials to link again at key moments. The fix uses one persistent scene fuse light, positioned at the currently glowing prop. Per-prop light objects no longer enter either rendering camera's light list. The number of visible scene lights now stays fixed through fuse, ascent and burst. Particle counts, effect choreography, waterfront, water reflections and Canvas rendering were left intact.

The same installed Chrome and 393×851 emulated CSS viewport were used for seed `20260916`, Ultra quality and two live Gold Willow launches. The diagnostic before/after runs used the same rAF sampler and fresh pages. These are browser-frame intervals, not completed GPU timings:

| Backend | Baseline worst frame, first / repeat | Fix worst frame, first / repeat |
| --- | ---: | ---: |
| WebGPU | 554 / 150 ms | 17 / 13 ms |
| WebGL 2 | 879 / 363 ms | 25 / 25 ms |

A separate run against the exact `.4` build recorded no frame above 33 ms in the two launches on WebGPU, WebGL 2 or Canvas. Worst observed intervals were WebGPU 8.2 / 16.8 ms, WebGL 16.7 / 12.5 ms and Canvas 16.7 / 16.7 ms. [Machine-readable timing and method](timing.json) and the reproducible `tests/burst-transition-performance.mjs` are included. Browser/GPU cache, refresh rate, power policy and hardware affect these measurements; the result establishes removal of this repeatable local stall, not a universal frame-rate guarantee.

Validation before PR CI: 217 engine tests, TypeScript lint and production build passed. The six native installed-Chrome flagship combinations (393×851 and 1280×800 on WebGPU, WebGL and Canvas) passed 47 interaction, stage, pause, reset and bounds checks with no runtime errors. The mobile Grand Collection regression passed 24 checks. Hosted preview verification passed 32 checks, including byte-for-byte parity for all 30 emitted files, fresh default no-QA WebGPU startup and real-time launch on phone and desktop viewports. The production fingerprint remained unchanged. [Hosted phone](captures/hosted-phone.png) and [desktop](captures/hosted-desktop.png) are actual preview screenshots; the earlier [same-seed visual gallery](../control-layout-2026-10-01/comparison.html) documents the unchanged firework and waterfront design.

Physical phones, Safari, browser-bar changes, actual 200% OS zoom and sustained GPU/thermal performance remain untested. Production still serves `2026-09-30.8`, fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`, Worker `5a577d62-1deb-4770-b780-784d03574c7a`; the preview deployment did not change that Worker.
