# Interactive galactic sky: production release

## Applied source

- Public application: [Firecrackers](https://firecrackers.mainandmany.com/).
- Main application commit: `1648786955a3af10e60f99807236d1676bad6284`, merged [PR #21](https://github.com/samir1234khans/firecrackers/pull/21).
- Build: `2026-09-30.5`; **58** normalized delivered source/asset entries; SHA-256 `81bf4e1160df0f21a10e29b04c9b1428128dc44be16216e1fe3a4352c06242c7`.
- Production Worker: `a79b4a3d-89ac-418e-b487-60433885219d`, deployed with `npm run cloudflare:deploy` from clean canonical main. The command rebuilt the production bundle before publishing.
- Rollback: prior living-river `.4` Worker `534323b7-e2e8-4935-a161-b86bdfb3f2b0`.
- Final PR runtime CI `36712448955` and main runtime CI `36713664345`: engine, desktop, mobile and recovery **all passed**. Main documentation CI `36713664018` passed.

## Public verification

**56 actual hardware-browser checks passed**, including WebGPU on the non-fallback Intel `gen-12lp` adapter and hardware WebGL via ANGLE Intel UHD Graphics 770. Installed Chrome `154.0.8037.59` captured desktop, portrait emulation and short landscape. Eight authored assets, the three original native sky layers, interaction, bounded idle rendering, paused/frozen state, OS/app comfort policies, meteor lifecycle, firework cleanup and transparent Canvas exclusions passed with **zero application or GPU validation errors**. [Exact hardware report](production/hardware.json).

**17 public HTTP/source/asset checks passed**, including full release entry parity, binary hashes, MIME, manifest and service worker. [Exact HTTP report](production/http.json).

**42 public Grand Collection checks, 28 original launch/offline/platform checks and 15 recovery checks passed.** Reports identify the public URL and retain deliberate injected errors separately from unexpected application failures. [Grand report](production/grand.json), [original workflows](production/original.json), [recovery report](production/recovery.json). Together with hardware and HTTP, **158 public checks passed**.

## Additional preview and local evidence

The qualified [preview receipt](PREVIEW.md) records 35 new sky interactions, 132 unchanged regression checks, 7 real cold-offline checks, 144 unit tests, build/lint/typecheck/audit and the accelerated logical soak. The [matched comparison viewer](comparison.html) shows eight same-seed pairs, with optional pointer/meteor captures. Concepts are separate from website evidence.

A fresh installed-Chrome preview context, with no forced backend or quality, automatically selected **WebGPU + Ultra** and retained both through a real-time 60-second Festival run: 11 launches, 3,377 submitted frames, zero application/GPU errors, three native sky textures and at most one meteor. [Exact real-time receipt](production/default-realtime.json). Submitted frames are not completed GPU timing or physical-phone endurance evidence.

## Scope and retained failures

The original layered sky art, shared simulation time, gentle pointer/touch parallax and faint scheduled meteor are delivered. Firework admission, renderer recovery, original river/boat geometry, audio events and source asset bytes remain unchanged. Ultra stays the default and saved quality is honored.

The [implementation receipt](IMPLEMENTATION.md) retains failed test attempts and the browser touch-cancellation correction. The first OS-motion CI check failed without an exact failure snapshot; the later policy-settle fixture keeps every static-motion assertion and passed all four final CI jobs. No assertion was removed, and that fixture-only fix did not change the release fingerprint.

Physical Android/iPhone, Safari, thermal endurance, measured GPU allocation and completed GPU-frame performance remain **NOT TESTED**. Portrait and touch viewports here are emulation on this PC.
