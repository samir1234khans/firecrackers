# Qualified interactive galactic preview

Preview: [Firecrackers galactic sky](https://firecrackers-galactic-preview.allygym-api.workers.dev/). Build `2026-09-30.5`, Worker `47e85c05-2c70-4b5b-a606-788eca71536c`, 58-entry source fingerprint `81bf4e1160df0f21a10e29b04c9b1428128dc44be16216e1fe3a4352c06242c7`.

## Executed checks

- **56 hosted hardware/behavior checks passed**, no application or GPU validation errors. Installed Chrome `154.0.8037.59` used actual Intel `gen-12lp` WebGPU with `isFallbackAdapter=false` and hardware ANGLE Intel UHD Graphics 770 WebGL. Desktop 1280×800, portrait 393×851 and short landscape 844×390 were captured. Canvas comfort/fallback/transparent output was checked separately. [Exact hardware report](hosted-hardware.json).
- **17 hosted HTTP checks passed**, including exact normalized source entries, binary asset hashes, MIME, service worker and manifest. [HTTP receipt](intermediate/preview-http.json).
- **7 hosted cold-offline checks passed**, including all eight actual cached assets, exact v007 GLB with three embedded 2K maps, the three native sky layers, mouse response without page/service-worker fetches and a newly selected Saturn launch/burst. No console/page errors or offline request failures. [Offline receipt](intermediate/offline.json).
- **35 new local sky checks and 132 existing local regression checks passed**, with deliberate decoder/recovery fault diagnostics recorded separately. **144 unit tests**, typecheck, lint, build, audit and accelerated logical soak passed. [Implementation and exact boundaries](IMPLEMENTATION.md).

During idle the Ultra hardware samples rendered 15 frames in 750 ms, inside the 20 Hz cap. This proves the bounded redraw policy; it does not measure completed GPU frames or promise 60 fps during fireworks. Pause, freeze, Low and reduced motion retain static checks. Touch tests reproduced the original browser `pointercancel`, then passed after the scoped canvas `pinch-zoom` policy.

## Visual review

The coordinator inspected actual desktop WebGPU idle, portrait WebGPU idle and desktop Saturn peak captures. Original blue/violet nebula filaments and fine warm/cool stars remain toward the upper reaches; the center stays dark, horizon and boats retain their framing, and fireworks/reflections remain prominent. No generated concept is sampled by the live application.

The [matched comparison board](comparison.html) pairs `.4` production and `.5` preview at the same seed `20260916`, backend, viewport and deterministic logical capture time. Image-generation concepts and standalone native art studies are clearly separate evidence.

## Release boundary

This preview is qualified for the stated PC/browser behavior. Physical Android/iPhone/Safari, thermal endurance, measured GPU allocations and completed GPU-frame timing remain **NOT TESTED**. Promotion/deployment and their exact CI/Worker/source receipt are recorded separately in `PRODUCTION.md` after the production checks complete. The current rollback is `.4` Worker `534323b7-e2e8-4935-a161-b86bdfb3f2b0`.
