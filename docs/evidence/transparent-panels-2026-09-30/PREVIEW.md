# Transparent panels: qualified preview

## Candidate

- [Open the preview](https://firecrackers-panels-preview.allygym-api.workers.dev/).
- Build `2026-09-30.6`; Worker `1bbbcebb-8126-4da0-a3fb-2ad98c939629`.
- App source commit `9073379e30dc6623cbe9cd2f3bc2415744bb5fe6`; test-only correction commit `83aaefd94bc46157abd1e840e8699fed025cca6b`; [PR #22](https://github.com/samir1234khans/firecrackers/pull/22).
- Delivered source fingerprint `1249e82e8ab6604c52d7c32002a939792e3a9724bcd4fb7fe34e5d0d183fafe0`, all 60 entries. Source is unchanged by test/documentation corrections.
- [Per-surface plan](PLAN.md), [implementation](IMPLEMENTATION.md), [22 original capture gallery](review.html).

## Qualification

| Evidence | Result | Method |
| --- | --- | --- |
| [Panel report](intermediate/final-local-panel-report.json) | 195 passed; zero failures/unexpected errors; 137 original screenshots | Bundled Chromium, software WebGL/Canvas. Seven required viewports, reflow equivalent and doubled text; full panels, drag, focus, pause and fault recovery. |
| [Existing regressions](preview/regressions-report.json) | 167 passed | Grand 42, original 28, stage 34, recovery 15, assets 1, lifecycle 7, overload 5, sky 35. Controlled missing/corrupt assets and recovery faults are recorded separately. |
| [Native hardware report](preview/hardware-report.json) | 56 passed; zero application/GPU errors | Installed Chrome 154.0.8037.59, headless, no software GPU flags. Nonfallback Intel gen-12lp WebGPU and hardware ANGLE Intel UHD 770 WebGL asserted. Eight authored assets active on both GPU backends; sky, river, sample fireworks, comfort, missing-asset fallback and transparent output. |
| [Public HTTP/source/assets](intermediate/final-preview-http-report.json) | 17 passed | Exact fingerprint/inventory and hashed authored assets; MIME/SPA-fallback checks. |

The first PR CI failed because the original Sound checkbox locator also matched the new Sound tabpanel, and the new panel harness looked only in ignored `public/release.json` after CI downloaded `dist`. Test commit 83aaefd selects the actual checkbox role and falls back to the exact compiled release file only on ENOENT. Assertions remain unchanged. Final CI is reported separately from these completed local/preview checks.

## Preserved unsuccessful runs

The intermediate reports retain the first 84-check/11-failure panel attempt, text-selection drag failure and initial 10-check hardware attempt. App fixes addressed observed focus escape, selectable picker text and the boot-shell flex direction. The [last headed hardware attempt](intermediate/final-headed-hardware-failed-report.json) observed Settings opening during a no-input static-idle interval: `panelOpen` and `paused` changed to true and active focus became Close panel. Its input cause is unestablished; no renderer source was altered. The final headless installed-Chrome run isolates desktop input and still requires actual hardware adapters; it passed all 56 checks.

## Evidence boundaries

The gallery's healthy scenes use Canvas compatibility and show actual native panels. Hardware scene captures are recorded separately in the hardware report. Phone/tablet/landscape and touch are viewport emulation on this PC, not physical Android/iPhone Safari. Reflow emulates a 200% CSS viewport/DPR relationship; it does not claim that Chrome's menu zoom was operated. Local software browser fixtures block service workers, explaining their truthful offline-unavailable notice. Physical-device thermal endurance, completed GPU-frame rates and photographic parity are not qualified by this release.

Production is unchanged at this preview checkpoint; main promotion and the production Worker are recorded in a later receipt.
