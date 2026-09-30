# Cinematic realism production release — 30 September 2026

## Release receipt

| Item | Applied value |
|---|---|
| Production | [firecrackers.mainandmany.com](https://firecrackers.mainandmany.com/) |
| Build | `2026-09-30.2` |
| Application main commit | `9debc8914a6428b0d2ef005674de0214526ed9ca`, [PR #17](https://github.com/samir1234khans/firecrackers/pull/17) |
| Production Worker | `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a` |
| Release fingerprint | `33b9adcc18a310caad61077fd479dbee09ac77fad98fb48c11534c1af90b57a0`, 53 entries |
| Retained preview | [Cinematic preview](https://firecrackers-cinematic-preview.allygym-api.workers.dev/) |
| Preview Worker | `772e9e2e-7708-49a7-8ce3-4b3f338762bc` |
| Previous Worker / rollback | `d5143fe3-0290-44b2-ac2d-bff384963d33`, build `2026-09-30.1` |
| Deployment path | `npm run cloudflare:deploy` from clean canonical main |

[Release PR CI](https://github.com/samir1234khans/firecrackers/actions/runs/36684827369) and [main push CI](https://github.com/samir1234khans/firecrackers/actions/runs/36685590953) both passed engine, desktop, mobile and recovery jobs. The engine includes 128 unit tests, type/lint/build, audit, documentation and accelerated logical soak. Browser jobs include all-ten WebGL/Canvas collection tests, original launch/offline/platform flows, edge layout and drag, independent assets, overload and recovery fault injection. Documentation push and PR validation also passed.

## Preview and capture fingerprints

The earlier captures and first preview retain fingerprint `27d5a802c1521a7589c0094e0cc296c57bd6098c4fcc226a7018a541e71b7040`. Before commit, `git diff --check` found a redundant blank line at the end of `src/graphics/NightEnvironment.ts`; removing that one newline changed its exact source hash. The final main source has 11,182 normalized characters and SHA-256 `ab4cd5accfcc4b9a6fc3a010881a0619ce52b2bd8caf79645b3a07a4e47c5e60`. Appending one newline reproduces the earlier 11,183-character hash `992a2d01abbd3ff2e08d4244ba761902cdc7fd0c2eb9ca7c93e757873f392e0c`. Every other fingerprint entry is identical.

The compiled application assets were unchanged: refreshing the preview from the clean main build uploaded only `/release.json`. Its [final HTTP receipt](preview-http.json) now matches production exactly. Capture metadata remains tied to the original fingerprint; no simulation, shader or visual change is inferred from the whitespace correction.

## Public verification

| Evidence | Result |
|---|---|
| [Hardware WebGPU](public-webgpu.json) | Six checks, zero application/GPU errors; actual Intel `gen-12lp`, fallback adapter false. All seven assets activate at default Ultra, real-time Willow stays on WebGPU, three seeded effects render and clean up, overload preserves the active rocket and Ultra through WebGL recovery. |
| [Grand Collection](public-grand.json) | 42 checks, zero errors/warnings; desktop and mobile viewport emulation, each on software WebGL and Canvas. All ten identities, input/browsing and cleanup remain functional. |
| [Original flows](public-flow.json) | 28 checks, zero application errors/warnings; launch admission, immutable selection, pause ownership, manual takeover, saved quality, muted startup, transparent output and responsive behavior. Production service-worker readiness and cold offline reload pass. Two aborted Cloudflare `/cdn-cgi/rum` requests are recorded; no application asset failure. |
| [Recovery](public-recovery.json) | 15 checks, zero failures, including injected faults and seven viewport sizes. |
| [HTTP/source/assets](public-http.json) | 16 checks: release metadata matches clean main, every delivered public binary matches its source SHA-256, and HTML/manifest/service worker have correct MIME types. This rejects missing binaries served as a 200 HTML SPA fallback. |

## What changed and remaining limits

Original generated night scenery, Blender smoke and water atlases, continuous TSL trails, directional smoke light response, richer fragmented reflections and material tuning are live. Small transparent controls, fast next launch, sky-drop burst and terrace-drop launch remain available. Ultra defaults and saved choices are preserved.

[Implementation and same-seed evidence](IMPLEMENTATION.md) and the [comparison viewer](comparison.html) distinguish the actual browser result from the photographic concepts. The final water bands are resolved. Wet irregular stone, contact lighting, larger illuminated smoke billows, varied water highlights and portrait burst framing still have room for refinement; photographic parity is not claimed.

Hardware qualification used installed Chrome on Intel UHD Graphics 770. NVIDIA rendering, physical iPhone/Android, Safari, sustained GPU completion timing and 15-minute thermal endurance are not established. The short real-time sample remains approximately 56–58 renderer submissions/s across the four backend/viewport combinations, with large startup rAF gaps documented separately. No physical-device guarantee follows from viewport emulation.

## Review and rollback

Open [WebGPU](https://firecrackers.mainandmany.com/?backend=webgpu) and confirm **Active renderer: WebGPU** in Settings. A saved lower quality remains selected; choose Ultra for maximum authored detail. Unsupported devices may recover through WebGL or Canvas and report the actual renderer. An older offline installation can use **Update & restart** in Settings.

If a release regression requires rollback, use the documented Worker command from this repository:

```sh
npx wrangler rollback d5143fe3-0290-44b2-ac2d-bff384963d33 --message "Rollback cinematic realism release"
```

The previous Worker version was verified available before deployment. Rollback was retained, not executed.
