# Waterfront candidate preview

Build `2026-09-30.7`, source/asset fingerprint `6186a504d1ccf20d90434ffe90b5771f075e33992765d9dbfa6d636e376c602b`, 62 entries.

[Isolated Cloudflare preview](https://firecrackers-waterfront-preview.allygym-api.workers.dev/), Worker `19ad2e64-77cb-4b5d-b56b-b1f6830bd5ee`. Preview uses its own Worker with no production domain route.

Local 144 unit tests, build, lint, logical simulation soak and documentation checks passed. [Final local composition report](local/composition.json) records 13 checks across seven actual-backend projects: WebGPU desktop/tablet/portrait, forced hardware WebGL and Canvas. Same-seed idle/Saturn captures are in the [comparison viewer](comparison.html). Houses touch the measured water edge, quay covers the foreground, and all eight enhancements activate in GPU modes. No unexpected browser/GPU errors occurred.

The earlier material-review hardware suite passed 61 checks, but predates the final shared-material isolation fix and is not claimed as exact-release qualification. Hosted hardware, regressions and CI are recorded in the production receipt only after completion. The unsuccessful [portrait coverage assertion](pilots/portrait-edge-failure.json) and [initial scene pilot](pilots/initial.json) remain available; failures were corrected in source rather than weakening acceptance checks.

Phone/tablet sizes are emulation on this PC. Physical phones, Safari, thermal endurance, completed GPU-frame timing and photographic parity are not established by these checks. The prior .6 Worker `d04c14f1-f219-45dd-989e-97569693ac4b` remains the intended rollback reference.
