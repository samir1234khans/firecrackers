# Cinematic realism candidate — 30 September 2026

The candidate moves the live renderer toward the earlier photographic studies through original distant scenery, stronger continuous firework traces, refined smoke data and rippled colored reflections. [Matched browser comparisons](comparison.html) show the actual result. The generated studies remain art direction; photographic parity has not been established.

## Source and deployment

| Item | Recorded value |
|---|---|
| Candidate version | `2026-09-30.2` |
| Runtime fingerprint | `27d5a802c1521a7589c0094e0cc296c57bd6098c4fcc226a7018a541e71b7040` |
| Isolated preview | [Firecrackers cinematic preview](https://firecrackers-cinematic-preview.allygym-api.workers.dev/) |
| Preview Worker version | `16c07955-e647-4ec0-9308-c22b3facdf51` |
| Previous production | `2026-09-30.1`, fingerprint `1e9598a54640f443c26d2846f43467ccfdce8a99bafdb98662049cb2c71bbd51` |
| Production rollback Worker | `d5143fe3-0290-44b2-ac2d-bff384963d33` |

The preview `/release.json` returned the candidate version and fingerprint, with all 53 source entries verified. The four-project comparisons below ran against the same fingerprint on local port 4182; separate hosted checks are recorded below. This report records a published candidate and the previous production rollback reference. Production promotion and its live verification require a separate release receipt.

## Implemented graphics

- TSL traces bridge moving heads to retained samples, overlap soft segment caps, preserve a bright core, and taper width and color as the trace ages. This strengthens Willow strands and makes Saturn and Supernova travel easier to read while keeping seeded physics and bounded pools.
- Smoke uses interpolated original density/gradient frames, directional local-light shading, darker interiors and rim scattering. The camera-facing Z basis was corrected during refinement.
- A progressively loaded original night panorama supplies quiet sky, distant clouds, hills and sparse shoreline lights. The native water and fireworks remain dynamic; scenery loading preserves the procedural fallback.
- Water uses the new Blender normal field to disturb actual reflected effect colors, with fragmented highlights and distance-dependent blur. The existing selective reflection resolution and update limits remain bounded. The first candidate showed conspicuous regular bands; inspection led to removal of high-frequency sinusoidal color from unlit water. The final captures show that moire resolved.
- The existing Blender terrace remains the foreground geometry, with adjusted material response and burst-linked lighting. Small transparent edge controls and drag/launch behavior retain their current architecture.

## Original asset production

| Asset | Browser export | Editable source and evidence |
|---|---|---|
| Night scenery | `waterfront-night-v005.webp`, 36,060 bytes | Built-in `image_gen.imagegen`; no model identifier exposed. [Exact prompt and review](PROMPTS.md), original 1776 × 888 PNG in `assets-source/scenery/`, and `assets-source/prepare-scenery.mjs` encoder. |
| Animated smoke | `smoke-density-light-v005.png`, 528 × 1584, 555,389 bytes | Blender 5.2.1 LTS, Cycles CPU; three procedural volume families with 16 frames each. [Production guide](../../../assets-source/blender/SMOKE-V005.md), `build_smoke_v005.py`, `review_smoke_v005.py`, and `masters/smoke-ignition-v005.blend`. |
| Water normals | `water-normal-v005.png`, 512 × 512, 230,518 bytes | Blender 5.2.1 LTS; 96 seeded periodic waves with 16 warp components. [Production guide](../../../assets-source/blender/WATER-V005.md), `build_water_v005.py`, and `masters/waterfront-v005.blend`. |

The Blender masters were reopened and exported data reloaded independently. [Smoke verification](../../../assets-source/blender/renders/smoke-v005/verification.json) records finite data, transparent padding and no missing dependencies. Representative frames, all 48 frames and GIF playback were retained for animation review. [Water verification](../../../assets-source/blender/renders/water-v005/verification.json) records finite bounded normals, packed maps, preserved 77 scene objects and 48 terrace objects, and no missing dependencies. Raw masters and review renders stay outside the public bundle. Smoke is a baked evolving volume sprite with browser lighting, not a live fluid solver. [Provenance](../../../assets-source/PROVENANCE.md) records these assets.

## Hardware comparison evidence

Installed Chrome `154.0.8037.59` ran headed without software-GPU flags. Actual WebGPU used Intel `gen-12lp`, with `isFallbackAdapter=false`; actual WebGL2 used ANGLE on Intel UHD Graphics 770 with Direct3D11. NVIDIA rendering was not demonstrated.

Four projects passed: desktop 1280 × 800 and portrait 393 × 851, each on forced WebGPU and WebGL2. Seed `20260916`, device scale factor 1, Ultra and a world clock reset to zero were identical. Independent first launches of Gold Willow, Sapphire Saturn and Opal Supernova were captured at early, peak and late phases. Peak checkpoints are 4.9 seconds for Willow/Saturn and 7.8 seconds for Supernova. All seven candidate assets activated, requested backends remained active, effect cleanup completed, and no application or GPU validation errors were captured.

The [baseline report](captures/baseline/report.json) and [final candidate report](captures/candidate/report.json) include source, hardware, snapshots, warnings and timings. Six matched peak pairs are retained beside the viewer. Complete 40-image sets remain locally in `test-results/cinematic-baseline` and `test-results/cinematic-final`; the initial candidate pass is preserved in `test-results/cinematic-candidate`.

| Short real-time Gold Willow sample | Baseline renderer submissions/s | Final candidate submissions/s | Final maximum rAF gap |
|---|---:|---:|---:|
| Desktop WebGPU | 57.29 | 57.49 | 291.7 ms |
| Desktop WebGL2 | 55.50 | 55.87 | 475.1 ms |
| Portrait WebGPU | 56.33 | 57.42 | 287.6 ms |
| Portrait WebGL2 | 56.83 | 57.86 | 279.3 ms |

Each sample covers approximately 12 seconds including a real launch and burst. Browser rAF median/p95 were approximately 4.2/4.3 ms on this high-refresh PC display; the renderer submits at its own cadence. Submission counts and rAF gaps are CPU/browser measurements, not GPU completion times or displayed-frame guarantees. The large maximum gaps remain visible in the evidence and warrant shader-startup/warm-up profiling. The short samples show no material submission-rate regression; they do not qualify 15-minute Festival or thermal targets. Portrait is desktop Chrome touch/viewport emulation, not physical-phone evidence.

## Remaining visual and release work

Hosted preview validation passed all six checks in `tests/webgpu-browser.mjs`: actual Intel `gen-12lp` hardware with `isFallbackAdapter=false`, all assets activated, a real-time Willow launch stayed on WebGPU, three seeded effects rendered and cleaned up, and forced overload recovered to WebGL while retaining the committed rocket and Ultra. No application or GPU errors were captured. `tests/assets-browser.mjs` also passed independent missing-sky, missing-terrace and delayed-paper/rocket loading and fallback checks with zero errors. Documentation validation passed 461 checks, and `git diff --check` passed. Release CI is pending at this checkpoint.

Review against the three earlier [Saturn](../realism-refinement/concepts/01-saturn-water-desktop.png), [Willow](../realism-refinement/concepts/02-willow-smoke-mobile.png) and [Supernova](../realism-refinement/concepts/03-supernova-smoke-desktop.png) studies confirms stronger traces and atmospheric depth. Wet irregular stone, contact light, illuminated smoke billows and varied water highlights remain less convincing than those references. Some long traces still read as clean curves. Portrait bursts remain low with substantial empty upper sky.

Complete release CI and hosted-preview checks before production promotion, then retain the deployment receipt and rollback reference. Physical Android/iPhone and GPU/thermal endurance evidence remain separate qualification work.
