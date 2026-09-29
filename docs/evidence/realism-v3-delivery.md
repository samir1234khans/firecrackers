# Realism V3 / UI V3 — verified preview delivery

Delivery date: 19 September 2026. Build: `2026-09-19.4`.

## Outcome

The unfinished Realism V3 implementation has been repaired, validated and deployed together with UI V3. The working preview is https://firecrackers-a93nle.v2.appdeploy.ai/ . Settings → Graphics details identifies `Realism V3 / UI V3` and `2026-09-19.4`. An older cached installation may expose an explicit Update app and restart action.

Runtime checkpoint: `dabd00c8358f65e961ac4c67eea89043016e9165`, branch `feat/fireworks-v1`. Delivery tooling checkpoint: `ac942c0b321722dd12b1987c70d6e5b723c671e3`. The later tooling commits did not change the tested runtime modules. Main and the divergent alternate implementation branch were preserved; no main promotion or permanent-domain change occurred.

Applied AppDeploy snapshot: `1789815911305`. The service reported ready with empty frontend/backend error arrays after deployment. It did not return a separate completed host-side QA run, so no host-side end-to-end pass is claimed. The full browser evidence below comes from GitHub Actions.

## What this delivers

The live app now includes the dimensional ringed launch stage, printed-paper rocket with trim, layered observatory environment, shared fuse curve, fuse wisps and launch exhaust, perspective flight, continuous owned trail segments, spatial crossette children, visible finale carriers, detached cooling embers, extended Willow falloff and locally illuminated retained smoke.

The new command deck, family previews, desktop effect inspector, radial ignition and coordinated help/show/settings panels are delivered rather than remaining only in the repository. Phone and short-landscape controls, keyboard alternatives, single-action lighting, cancellation, pause, manual takeover, protected display areas, transparent output and offline caching are retained.

Ultra is the default graphics quality; Festival is the preferred show preset; 60 fps is a presentation target, not a measured guarantee. Reduced flashes remains enabled. Sound and haptics remain off at startup, and explicitly saved lower quality settings remain respected.

## Repairs completed for delivery

The prior browser failures were not dismissed as an environmental inconvenience. Slow rendering was causing the caller to discard visible elapsed time, stretching the fuse/flight unnecessarily. `VisibleFrame.ts` now consumes at most half a second through bounded 60 Hz simulation slices. Paused and hidden scenes still reset the clock instead of fast-forwarding missed events.

The empty observatory now renders on demand, with selection/placement changes and resize producing a new frame. An independent opaque-depth proxy scene avoids repeating expensive material shading merely to get smoke depth. Its proxies share geometry but do not own or dispose the source geometry. The broad floor uses authored stone tone and a burst wash while the hero stage and rocket retain PBR shading.

Selecting a new family while a fuse burns now changes the next selection without cancelling or mutating the already-committed rocket. The second ignition remains unavailable until the fuse finishes. Manual takeover stops future automatic launches immediately. These behaviors have dedicated engine and browser regression tests.

## Completed runtime validation

[Runtime validation run 35437161311](https://github.com/samir1234khans/firecrackers/actions/runs/35437161311) passed against runtime head `dabd00c8358f65e961ac4c67eea89043016e9165`. The PR merge tested was `307992f6c86740fda5afa17b41b1d70f17def67d`.

| Gate | Result and scope |
|---|---|
| Engine/lifecycle/configuration tests | 51 passed |
| Desktop browser suite | 22 passed; no unexpected, flaky or skipped cases |
| Mobile browser suite | 22 passed; no unexpected, flaky or skipped cases |
| TypeScript and lint | Passed |
| Production build | Passed |
| Dependency security-review job | Passed |
| Documentation structural validation | 258 checks passed |
| Accelerated logical soak | 7,200 simulated seconds passed with bounded resources |

The final README/status/evidence update was additionally checked locally after writing this record: 256 current documentation/configuration checks passed. This is a structural check, not an extra browser run.

Desktop job: `105881706031`. Mobile job: `105881706128`. Browser tests used Chromium with the repository's software WebGL/SwiftShader configuration and mobile emulation. This is not hardware WebGPU parity, physical Android or Safari evidence.

The browser suite exercises all five families, actual timed ignition and bursts, early hold cancellation, keyboard alternatives, manual pause and takeover, preferences, cold offline reload, transparent-canvas pixels, protected presentation links, responsive panels, idle rendering and resize. Deterministic QA advancement is also used for repeatable rendered checkpoints; those captures are not FPS measurements.

The separate local logical run completed 7,200 virtual seconds in approximately 40.8 wall seconds, with 1,451 launches, 1,699 bursts, maximum 760 heads, 20,000 trail segments, 64 smoke instances, five pending carriers and six rocket records at Standard. It does not establish two hours of GPU, power or thermal endurance.

## Actual visual evidence

The desktop and mobile artifacts contain rendered captures, not generated concept art. The reviewed sequence covers idle stage, traveling fuse, launch, break, late canopy and a second effect through retained smoke. Additional captures cover the short-landscape scene and responsive settings.

- Desktop artifact `10583096018`: https://github.com/samir1234khans/firecrackers/actions/runs/35437161311/artifacts/10583096018
- Mobile artifact `10582831939`: https://github.com/samir1234khans/firecrackers/actions/runs/35437161311/artifacts/10582831939

The recordings/screenshots remain evidence of the tested browser conditions only. Their visual inspection does not substitute for the owner's final approval or prove photorealism. Actions artifacts have limited retention; retain relevant files before expiry when preparing a later release review.

## Published source verification — passed

[Public source verification run 35439359156](https://github.com/samir1234khans/firecrackers/actions/runs/35439359156), job `105887384652`, completed successfully. It fetched the actual public `/release.json` at **2026-09-19T11:10:21.040Z**, compared the repository and deployed upgrade modules, and found **zero mismatched modules**.

Expected and actual SHA-256:

```text
6cdf68fd5b8615384b5dc8ebff369278b132136de917886f33b71b6ca6a20109
```

Receipt scope: `delivered-upgrade-modules`, 21 listed modules. Format version: 2. Normalization: `typescript-5.9.2-printer-static-appdeploy-source-id-only`.

Initial raw-byte comparison correctly failed. Inspection of the public compiled bundle established that the host injects static `data-appdeploy-source-id="src_<32 hex characters>"` attributes before building. The receipt now records raw hashes and the number of these labels while calculating an additional normalized application-source fingerprint. The live output contained 49 diagnostic attributes across five TSX files. Those labels remain in the runtime; they are excluded only from the comparison.

The pinned TypeScript parser canonicalizes JSX formatting and string representation. Only that exact static metadata attribute is excluded. Executable expressions under the metadata key are rejected. Event handlers, ordinary attributes, visible copy and CSS are not excluded. Non-JSX module bytes are checked exactly after line-ending normalization. Four dedicated tests cover metadata equivalence, meaningful-code changes, expression rejection and non-JSX exactness; all four passed locally and in the public verification workflow.

The matched receipt is evidence for those 21 upgrade modules. It is not a claim that the entire host wrapper, third-party scripts, original platform files, deployment configuration or whole repository is byte-identical. The receipt-enabled local build produced the same four JS/CSS assets as the verified CI runtime build before the host's diagnostic transform.

Machine-readable result: [deployed source parity](realism-v3-source-parity.json). Original result artifact: https://github.com/samir1234khans/firecrackers/actions/runs/35439359156/artifacts/10583037785 . Earlier failed raw-comparison runs remain in history rather than being represented as successful.

## Remaining qualification and fidelity work

This preview delivery closes the previously unfinished implementation, build, browser validation, GitHub synchronization and preview-publication gap. It does not complete every future ambition in the realism research roadmap.

Physical Android/tablet sessions, Safari/iOS, actual hardware WebGPU/WebGL comparison, OBS Browser Source composition, long-session GPU/thermal/power behavior, comprehensive context-loss and service-worker update/rollback scenarios, flash-risk/accessibility assessment, listening review and owner visual/audio approval remain open. Do not present software-emulated browser results or an accelerated logical soak as substitutes for these gates.

Smoke, props and environment assets remain original procedural work. There are no Blender fluid bakes, imported production GLBs or professionally recorded audio library in this delivery. There is no live volumetric-fluid solver or GPU-compute particle simulation. Further smoke, trail and material art direction can improve fidelity without invalidating this working delivery.

## Next engineering handoff

Start from the latest remote `feat/fireworks-v1`, read this record and `PROJECT_STATUS.md`, and preserve the verified runtime behavior. Reproduce the reported build before making another fidelity pass. Do not reapply an old patch, rebuild the app from scratch or overwrite later work from a saved transcript. A later production promotion requires its own evidence and owner approval. Keep the current tested revision and prior preview snapshot available as rollback references.
