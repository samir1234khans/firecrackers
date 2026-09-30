# Open sky candidate — validation receipt

Build `2026-10-01.3`, branch `feat/open-sky-controls`. This is an isolated review candidate; production remains `2026-09-30.8`. Deployment and CI identifiers will be added after verification.

## Delivered behavior

The visible brand and collection headings are removed. Thirteen named, keyboard-accessible firework icons occupy a transparent left collection. Pause, Sound and Controls sit at lower right; the four-direction mode knob and precise fixed/random position track occupy the footer. The rocket is scaled to the available view and grounded on a subdued steel/brass support with a cached contact shadow. The moon, water, boats, authored terrace and thirteen effect identities are retained.

See [implementation contracts](IMPLEMENTATION.md) and the original [approved layout plan](PLAN.md). The new source fingerprint is `aa6353413eeccb04d4c014121890b197c4eb49d8221e101efd49bfc7c148775a`.

## Completed local checks

- Typecheck, unused-code lint, production build and 217 unit tests passed.
- Accelerated two-hour logical soak passed: 1,290 launches, 3,995 bursts; bounded maxima of 858 particle heads, 20,000 trail entries, 64 smoke entries, nine cues and four rockets. This is not physical-device endurance evidence.
- Native installed Chrome verified WebGPU, WebGL and Canvas independently. All thirteen props launched at each of 320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800 and 1920×1080. The same run passed mode selection/drag/cancel, modal focus, manual pause ownership, finite Finale, full-range and fine position adjustment, Random, preference reload/reset and immutable flight profiles through rotation. No console or runtime errors.

The browser and performance regression record is being completed. Only completed checks are listed above.

## Repairs found by validation

- New deterministic tests caught a missing reset of the independent Random placement stream; reset now restores it.
- The native mode dialog could let Tab escape into browser chrome. Explicit first/last focus wrapping now passes forward/reverse Tab and Escape restoration.
- Previous blank-scene test coordinates now occupied the left collection. Tests use clear sky instead and retain their accidental-launch assertions.
- Terrace checks now compare the requested position clamped to measured usable bounds, accounting for the complete prop, fuse and controls. They do not assume that the viewport edge is a usable launch location.

## Evidence boundaries

Captures use emulated CSS viewport sizes and a real desktop GPU, with seed `20260916` and matching relative burst times. They are not physical phones or Safari. Projected prop envelopes verify the geometry contract; visual inspection separately checks rendered ground contact and appearance. The support uses existing real-time materials and geometry, not a claim of universal 4K rendering. Physical phones, Safari, real browser/OS 200% zoom and sustained GPU/thermal performance remain untested.

The owner additionally requested a moon-led preparation screen. It is implemented and included in this candidate: actual progress, centered rotating moon, exact-position handover, reduced-motion bypass and explicit early entry/recovery. Final startup regression receipts follow below when complete.
