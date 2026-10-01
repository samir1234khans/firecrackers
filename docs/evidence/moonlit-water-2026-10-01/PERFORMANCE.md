# Moonlit water — performance qualification receipt

**Qualification remains conditional.** All 24 final runs completed with zero runtime errors or source/backend/quality/probe mismatches. All 18 pooled app-frame conditions and their applicable burst transitions pass the unchanged p95 allowance, using both percentile methods. However, three individual paired app-budget comparisons fail, four pooled secondary rAF condition groups fail, and the performance script exits **1**. This is not an unconditional performance or release pass.

Runtime source is `3f4b8bf8a729db44510b77b2a08c04a0b83bb851`. The held candidate fingerprint is `3875eec75b2ff8a4021eebbb32bc19845d89d0a68c82b3f58ac3ab669e0db7e2`; the production baseline is `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`. Deployment parity, Worker versions, final branch head and CI belong to the [preview receipt](PREVIEW.md).

## Method and limits

The [performance harness](../../../tests/moonlit-water-performance.mjs) runs installed headless Chrome `154.0.8037.59` sequentially on this Windows PC: native WebGPU, native WebGL and Canvas; `393×851` and `1280×800` viewports; production and local candidate; two counterbalanced AB/BA repetitions. These are **24 runs**, each with a 1,500 ms realtime warmup, 3,000 ms idle interval and two 7,500 ms Gold Willow launch intervals. Authored assets are active before reset; seed is `20260916`, quality Ultra, reduced flashes enabled, reduced motion disabled, placement `0.5`, sound/haptics disabled, and service workers blocked.

The primary metric is elapsed time between changes to the existing renderer frame counter. Active rendering is capped at 60 fps on WebGPU/WebGL and 30 fps on Canvas; idle retains its lower bounded cadence. Browser rAF observations can occur more frequently and remain a separate scheduling metric. CPU submission samples count only new rendered frames. None of these measures completed GPU work.

The [test-only scalar probe](../../../tests/moonlit-water-probe.mjs) binds existing Simulation and renderer metrics once through CDP Runtime closure scopes, identically for both sources. Structural discovery and full-QA checks before/after sampling verify exact values. Debugger is never enabled; there is no forced GC or production API/source change. Each interval preallocates an 8,192-row numeric buffer; diagnostic record objects are materialized afterward. Measurements observe realtime rendering rather than repeatedly driving a frozen QA scene.

The allowance remains `max(2 ms, baseline p95 × 20%)`, with transitions within ±1,200 ms of burst. The original p95 uses `sorted[min(N−1, floor(N×0.95))]`; nearest-rank uses `sorted[ceil(N×0.95)−1]`. Raw values are unrounded; tables below are rounded for readability.

## Final cadence results

All **18 pooled conditions**—six backend/viewport combinations, each with idle and two launches—and all **12 applicable pooled transitions** pass both p95 methods. The tests for new rendered-transition intervals over 50/100 ms recurring in both repetitions pass; the secondary recurring-over-100 ms indicator also passes. These recurrence checks do not assert that every individual long interval is absent.

| Backend / viewport | Launch 1 app p95, baseline → candidate ms | Launch 2 app p95, baseline → candidate ms |
| --- | ---: | ---: |
| WebGPU / 393×851 | 16.8 → 16.8 | 16.8 → 16.8 |
| WebGL / 393×851 | 16.8 → 16.8 | 16.8 → 16.8 |
| Canvas / 393×851 | 33.4 → 33.4 | 33.4 → 33.4 |
| WebGPU / 1280×800 | 16.8 → 16.8 | 16.8 → 16.8 |
| WebGL / 1280×800 | 25.0 → 16.8 | 20.9 → 16.8 |
| Canvas / 1280×800 | 58.2 → 45.8 | 50.0 → 58.3 |

Desktop Canvas launch 2 rises 8.3 ms within its 10.0 ms pooled allowance. Its absolute cadence remains slower and variable. [The comparison CSV](measurements/comparison.csv) records pooled cadence, transition and CPU values.

Pooling does not erase the following **three paired app-budget misses**; each also fails nearest-rank p95:

| Backend / viewport | Paired assessment | Baseline → candidate ms | Delta / allowance ms |
| --- | --- | ---: | ---: |
| WebGPU / 1280×800 | Repeat 2, launch 1 transition | 16.7 → 20.8 | +4.1 / 3.34 |
| Canvas / 1280×800 | Repeat 1, launch 2 overall | 37.5 → 58.3 | +20.8 / 7.50 |
| Canvas / 1280×800 | Repeat 2, launch 1 overall | 33.4 → 45.9 | +12.5 / 6.68 |

The retained **four pooled secondary rAF condition groups** contain five failing metrics:

| Backend / viewport / launch | Failing overall rAF p95 ms | Failing transition rAF p95 ms | Allowance ms |
| --- | ---: | ---: | ---: |
| Canvas / 393×851 / 2 | 8.4 → 12.5 | 4.3 → 8.3 | 2.00 each |
| WebGPU / 1280×800 / 1 | — | 4.3 → 12.6 | 2.00 |
| Canvas / 1280×800 / 1 | 12.5 → 16.7 | — | 2.50 |
| Canvas / 1280×800 / 2 | 16.7 → 24.9 | — | 3.34 |

These assertions remain in the script's exit status. Separately, desktop WebGPU launch 1 CPU-submission p95 increases **6.2 → 12.6 ms** (+6.4 ms), reducing CPU headroom. Its BA paired repeat reaches 6.4 → 15.4 ms; this is retained rather than dismissed as noise. Phone-viewport WebGL idle CPU p95 also rises 4.1 → 6.5 ms. CPU results do not substitute for cadence or GPU measurements. [The complete final report](measurements/performance-final.json) preserves all pairs, intervals and acceptance fields.

## Earlier failures, attribution and renderer review

The [initial failed experiment](measurements/performance-initial-failed.json) and [first optimization failure](measurements/performance-first-optimization-failed.json) remain evidence. Their earlier phone-viewport WebGL second-launch app gaps of 124.9 and 262.5 ms do not recur in the final scalar experiment: candidate maxima are 25.0 ms in AB and 16.8 ms in BA.

A [reviewed-candidate diagnostic trace](measurements/profile-reviewed.json), on an earlier fingerprint, reproduces a 170.8 ms WebGL app gap with a **150.135 ms V8 MajorGC** on the renderer main thread; current synchronous total submission is 17.3 ms and water update 2.5 ms. That trace supports attribution of that reproduced gap to scheduled collection. It cannot retrospectively attribute each untraced historical gap. Full QA graphs sampled every rAF incurred allocation debt, but no allocation-stack profile measured their share. The [held-source scalar trace](measurements/profile-scalar.json) still records a baseline 66.349 ms MajorGC, so collection is not proven entirely observer-caused. Trace runs diagnose behavior; they do not replace acceptance runs.

Source review verified main-camera sky projection, perspective-correct projective division, normal-texture repeat wrapping before compilation, backend-specific clipping/target orientation, and restored renderer state. Bounded work includes one cropped water-band target, four instanced scenery-proxy draws and twelve conservatively culled particle batches. Ultra/Standard edge caps remain 512/256 px; desktop rates are 30/15 Hz and portrait rates 15/10 Hz. Material variants warm before launches. The [implementation guide](IMPLEMENTATION.md) links the source and resource contract. Observer, scheduling and projection corrections changed together; these experiments do not isolate each contribution.

Full reports, traces, scalar frames and failed history are retained in [raw experiments](measurements/raw-experiments.zip). Physical-phone performance, thermal endurance and completed GPU timing remain **unqualified**. These measurements support an isolated preview with explicit remaining failures; they do not establish a fully green release gate.
