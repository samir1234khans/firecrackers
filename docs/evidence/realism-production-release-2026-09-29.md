# Firecrackers realism refinement — production release

Build `2026-09-29.3` is live at [firecrackers.mainandmany.com](https://firecrackers.mainandmany.com/). The release refines the waterfront framing and broken reflections, selects the correct Blender smoke-atlas family, and replaces the terrace with the original textured v004 Blender export. The six transparent edge control groups, ten firework identities, and drag-to-burst remain in place. [The design and local comparison record](realism-refinement-2026-09-29.md) explains the image studies, editable source, and same-seed browser differences from `.2`.

## Source, deployment, and rollback

| Item | Verified identity |
| --- | --- |
| Canonical source | `main` merge commit `e1789db3e4c28cd8f8f55662d7b3e9ec7f6034f6`, [PR #7](https://github.com/samir1234khans/firecrackers/pull/7) |
| Build and source fingerprint | `2026-09-29.3`; SHA-256 `4ae7b48094bad269c0a47655d5d20e6839b71f593100aa052d90e4df63a6a40d` across 49 delivered modules and assets |
| Preview | [firecrackers-realism-preview.allygym-api.workers.dev](https://firecrackers-realism-preview.allygym-api.workers.dev/), Worker version `b5194e5e-1502-4980-b248-fa20d22bf4d1` |
| Production | Worker `firecrackers`, version `5c39c81a-6b79-49ae-bf50-007a93ee83f6`, custom domain `firecrackers.mainandmany.com` |
| Rollback reference | Previous production Worker version `204d3c26-6c11-485b-9137-2b59a647ad0e` for build `.2`; [previous release receipt](waterfront-delivery-2026-09-29.md) |

The [Wrangler deployment log](realism-production/realism-production-deploy.log) records the new terrace asset upload and the production Worker version. [Fresh HTTP checks](realism-production/http-checks.json) independently read `/release.json` from production and preview: both returned the `.3` fingerprint above. Production `HEAD` requests for `/`, `/sw.js`, `/manifest.webmanifest`, `/art/terrace-v004.glb`, and `/audio/report-01.wav` all returned 200.

## Validation

- [Main push Runtime validation](https://github.com/samir1234khans/firecrackers/actions/runs/36582787474) passed all four jobs for merge commit `e1789db3`: engine/build/soak/audit, desktop browser, mobile browser, and recovery. [Documentation push validation](https://github.com/samir1234khans/firecrackers/actions/runs/36582786671) also passed.
- The [public stage report](realism-production/stage-report.json) passed 22 checks with zero reported page errors. These include seven viewport layouts, central clearance and hit targets, drag-to-burst, pause/focus behavior, waterline/reflection budgets, and procedural fallback when the v004 terrace request is blocked. It records `physicalDevice: false`.
- Public Grand Collection runs passed in [desktop](realism-production/realism-production-grand-desktop.log) and [mobile](realism-production/realism-production-grand-mobile.log), exercising WebGL and Canvas. Public original-flow runs passed in [desktop](realism-production/video-desktop-report.json) and [mobile](realism-production/video-mobile-report.json); their [console logs](realism-production/realism-production-video-desktop.log) and [mobile log](realism-production/realism-production-video-mobile.log) are retained. Public [viewability/recovery](realism-production/viewability-report.json) passed 15 checks.
- The [public offline enhanced-asset check](realism-production/offline-enhanced.json) reloaded build `.3` offline with normal, flame, smoke, paper, rocket and terrace assets, loaded all three recordings after explicit sound activation, and launched one burst.
- The [public visual report](realism-production/visual-report.json) and actual Chromium captures at [1280 × 800](realism-production/saturn-production-1280x800.png) and [393 × 851](realism-production/saturn-production-393x851.png) show Sapphire Saturn on WebGL 2 Ultra: one burst, 6,205 particles, all six authored asset types loaded, and zero page errors. The portrait diagnostic waterline was 0.720 of viewport height; desktop was 0.485.

The public captures and browser suites show the website at these tested moments. They do not establish 60 fps on physical flagship phones, a 15-minute thermal run, Safari/iOS behavior, hardware WebGPU, or complete flash/accessibility qualification. Generated design images remain visual direction, separate from the production captures.
