# Living river production release — 30 September 2026

## Applied release

| Item | Verified value |
| --- | --- |
| Public production | [firecrackers.mainandmany.com](https://firecrackers.mainandmany.com/) |
| Build | `2026-09-30.4` |
| Main application commit | `edbc0acc4024e334b05334d978baeb51dc0a7045` |
| Merged release | [PR #19](https://github.com/samir1234khans/firecrackers/pull/19), merged 2026-09-30 10:57:34 UTC |
| Production Worker | `534323b7-e2e8-4935-a161-b86bdfb3f2b0` |
| Delivered source/asset fingerprint | `dc781d21e50e6fe2680e55b1fbf3a47ec8e72b605e349b876beeecaf388b5609`, 56 modules |
| Frozen canoe GLB | `c63facc3e14b410da196a3b148ca10886b0aa75f1af02656d64ba09e6c72d258`, 7,620,280 bytes |
| Rollback reference | Build `2026-09-30.2`, Worker `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a` |
| Deployment path | Existing `npm run cloudflare:deploy` from canonical main; [deployment output](production/deploy.txt) |

[Machine-readable receipt](production/receipt.json), [public fingerprint](production/release.json)
and [merged PR record](production/pr-19.json) retain the applied identifiers.
The 56-entry fingerprint covers delivered implementation modules and authored
assets. It is scoped, and does not assert that every hosting wrapper file is identical.

[Main push CI](https://github.com/samir1234khans/firecrackers/actions/runs/36705577730)
passed all four jobs: engine, desktop browser, mobile browser and recovery.
[Documentation CI](https://github.com/samir1234khans/firecrackers/actions/runs/36705577354)
also passed. Both runs identify the exact main commit above; compact official
[main CI](production/main-ci.json) and [documentation CI](production/docs-ci.json)
records were retrieved independently. Engine CI includes type/lint/build, unit
tests, dependency audit, documentation and accelerated logical soak. Browser CI
covers collection/original workflows, loading, embedded-map decode lifecycle,
layout/drag, overload and recovery; it is separate from physical-device evidence.

## Public verification

The successful post-deployment runs total **135 checks**. Earlier local, preview,
CI and the incomplete first hardware attempt are not added to this total.

| Exact report | Checks | Result and evidence type |
| --- | ---: | --- |
| [Hardware retry](production/hardware.json) | 33 | Actual installed headed Chrome 154.0.8037.59, no software GPU flags. WebGPU adapter Intel `gen-12lp`, fallback false; WebGL reports Intel UHD Graphics 770 through ANGLE/D3D11. Default Ultra and eight active enhancements; three textured boats, three shared PBR maps with correct color spaces, ten lamp anchors, four candle flames/glows, one bounded point light and at most eighty river fragments. Seeded Willow/Saturn/Supernova, pause/cleanup/static idle, missing-sky/river fallbacks, saved quality, comfort and transparent Canvas pass. Zero application/GPU errors. |
| [Grand Collection](production/grand.json) | 42 | Headless software WebGL and Canvas, desktop and mobile viewport/touch emulation. Five Grand styles each render and clean up in four device/backend cases; duplicate rejection, immutable committed style, pause ownership, persistence, keyboard navigation and smaller/landscape layouts pass. Zero errors/warnings; 49 captures. |
| [Original workflows](production/original.json) | 28 | Headless/software workflow checks, including launch admission, pause, manual takeover, muted startup, saved preferences, responsive/transparent behavior, service-worker readiness and cold offline reload. Zero application console errors/warnings. Two aborted analytics requests are recorded separately below. |
| [Recovery](production/recovery.json) | 15 | Software/headless fault-injection and responsive recovery checks; zero failures. Desktop, tablet and mobile sizes are emulation on the PC. |
| [HTTP/source/assets](production/http.json) | 17 | Public release fingerprint, expected MIME/bytes/hashes for delivered art/audio and public application documents. Zero errors; 56-module fingerprint matches the reviewed main source. |
| **Successful public total** | **135** | **33 + 42 + 28 + 15 + 17** |

Reports were copied as compact JSON without removing fields or changing decoded
values. [The copy manifest](production/copy-manifest.json) records original and
compact byte counts, SHA256 values and verified JSON equality. The original raw
reports remain under `test-results/river-production-*`. This tracked record
preserves their results, while the raw local capture directories retain images.

The hardware report deliberately injects missing scenery/river requests. Those
two expected `ERR_FAILED` requests prove independent fallback and are not
application-loading regressions. The original workflow records exactly two
`/cdn-cgi/rum?` requests with `net::ERR_ABORTED`, both Cloudflare analytics;
there is no unexpected application asset failure. [Behavior summary](production/behavior-summary.json)
retains this distinction.

## First hardware attempt and unchanged retry

[The first hardware report](production/hardware-first-attempt.json) is preserved
separately. It passed the first asset/Ultra check, then timed out after 30 seconds
inside screenshot capture, after fonts reported loaded. Its application-error
array is empty. Software suites were running concurrently at the time, but the
record does **not** establish the cause of the screenshot timeout. The unchanged
retry subsequently passed all 33 hardware checks. The first partial check is
not counted again in the successful 135-check total.

## Delivered scene and boundaries

[Implementation](IMPLEMENTATION.md), [preview qualification](PREVIEW.md),
[actual same-seed comparison viewer](comparison.html) and
[asset provenance](../../../assets-source/PROVENANCE.md) retain the scene's history.
The river uses the downloaded CC0 Wooden Canoe by OuterSpaceSimon with real
weathered-wood PBR appearance, adapted into two small boats and a larger covered
candle boat. Original canopy, candles, clustered twelve-house shore village,
bounded motion/reflections, native celestial art and both renderer fallbacks
remain repository-backed. Previous Blender masters and procedural boat exports
remain preserved. Concept images and Blender pilots are separate from actual
public browser evidence.

Hardware Chrome is verified on this PC. Portrait/landscape touch and tablet
results are viewport emulation, not physical Android/iPhone or Safari evidence.
Seeded diagnostic stepping is not FPS proof. Submission timestamps and the
reported decoded-texture storage estimate are not completed GPU-frame timing
or measured GPU memory. Thermal/endurance and the physical flagship-phone
performance targets remain unqualified; no photographic-parity claim is made.

## Rollback and next work

The preceding cinematic `.2` Worker above is retained for rollback through the
documented Cloudflare deployment/version path. Its
[historical production receipt](../cinematic-realism-2026-09-30/PRODUCTION.md)
remains intact.

Interactive galactic sky build `.5` is in progress in an isolated
`feat/interactive-galactic-sky` worktree. It is **not shipped** and is not covered
by this `.4` production receipt. Main and the public domain remain the qualified
living-river baseline until a separate release is verified and promoted.
