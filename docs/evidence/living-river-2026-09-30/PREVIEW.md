# Licensed river preview qualification

Build `2026-09-30.4` combines the celestial sky, three textured boats, candlelit covered nauka, clustered far-bank homes and corrected water sampler. Production remains `.2` until promotion.

- Preview: https://firecrackers-river-preview.allygym-api.workers.dev/
- Worker version: `970ebd30-51e7-4c6a-9588-7a03b2908075`.
- Source/asset fingerprint: `1feaf76b036fca63d9fe6672cbbf60adb648961f368921bdf5fc8da73614c93a`, 56 entries.
- Boat GLB: `c63facc3e14b410da196a3b148ca10886b0aa75f1af02656d64ba09e6c72d258`, 7,620,280 bytes.

[Local report](local-report.json) and [hosted report](hosted-report.json) each pass **33 checks** with zero application/GPU errors. Installed headed Chrome exercises actual hardware WebGPU and WebGL on desktop, portrait emulation and short landscape, plus Canvas compatibility. All eight authored assets activate on Ultra. The downloaded canoe's one sRGB color map and two linear data maps are present, shared and correctly tagged. Estimated RGBA8/mipmap storage is approximately 64 MiB for the three 2K maps; this is not measured GPU allocation.

The reports retain seeded Willow, Saturn and Supernova captures, paused clocks/positions/frame counts, complete cleanup, static idle rendering, saved Standard, missing-sky/river fallback, reduced motion, forty-fragment Low reflections and transparent output. [Actual browser comparison](comparison.html) uses the final source above. Earlier original-boat reports remain in `intermediate/`; the interrupted first licensed-atlas run is retained under ignored local test results and is not counted as qualification.

[HTTP parity](preview-http.json) passes **17 checks**, including every fingerprinted public binary's byte hash/MIME and PWA files. The [upload receipt](preview-deploy.txt) records the applied Worker. [Budget estimates](budgets.json) report approximately 370 KB gzip for HTML plus compiled JS/CSS and 9.46 MB raw for all eight selected visual enhancements. The owner's quality request raises the former small-art ceiling; larger maps load progressively and share one set across the three boats. No particle or reflection pool becomes unbounded.

See [download rights and Blender verification](../../../assets-source/blender/RIVER-V007.md), [implementation](IMPLEMENTATION.md) and [plan](PLAN.md). Intel UHD 770 is the selected hardware adapter on this PC; the installed NVIDIA GPU was not selected in these runs. Portrait is browser emulation. Physical Android/iPhone, Safari, thermal endurance, completed GPU timing and photographic parity remain unqualified.

Rollback reference for promotion: `.2` Worker `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a`.
