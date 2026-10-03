# Richer night experience — implementation and review

## Source and release boundary

PR #45 combines the main-compatible parts of issues #37–#44 with the actual ancestry of PR #36's fuller shells and shell-coloured waterfront. Candidate configuration: `2026-10-03.2`. The owner authorised implementation, reconciliation and promotion after verification; this document alone is not a merge or deployment receipt. Read PR #45 for exact final commit and check results.

Draft PR #33 and its release hold are separate and unchanged. Its three original 90-second musical scores are **not** included here. This branch preserves main's 32-second finite Finale and the existing Calm, Festival and Always Play modes. The last recorded production remains `2026-10-02.3`; source promotion does not deploy a Worker or update the supplied cinematic preview.

## Implemented experience

| Issue | Main-compatible implementation | Qualification / dependent follow-up |
|---|---|---|
| #37 | Three coherent smoke depth layers; existing seeded wind and atlases; smooth formation/dissipation and hue-preserving relighting from up to twelve sources; native and Canvas | Sustained real-device pass cost and formal combined-flash assessment remain unqualified. |
| #38 | Thirteen data-driven sound profiles, virtual-distance calibration, bounded priority voice mixing and opt-in headphone HRTF with stereo fallback | Matched headphone/speaker/mono listening assessment is not yet qualified. Mixing/ducking against #33's held score engine must be integrated on that separate reviewed branch. |
| #39 | Lazy Browse panel, all thirteen descriptions and thumbnails, one isolated silent preview, explicit Select/Launch and bounded local favourites | Preview respects motion/flash preferences, pauses with visibility and never changes the active show's clock. |
| #40 | Descriptive current show choices, shared-clock phase/progress, falling-tail state and explicit Replay/Another night/Always Play actions | #33's music theme cards, queued phrase-boundary theme state and 90-second progress remain dependent on its held contract; no fake theme or score is claimed. |
| #41 | Three-phase, twelve-cue composer, starters, placement/gap controls, keyboard-accessible reordering, bounded undo/redo, preflight validation, in-session draft retention | Explicit playback restarts a cleared sky; all unborn children still reserve capacity. This is not a music workstation or real firing-system exporter. |
| #42 | Twenty locally saved recipes, rename/duplicate/delete/reset, strict versioned JSON import/export, bounded share fragments and explicit recipient review | Recipe replay, not an unrecorded manual interaction history. Unsupported versions reject; recipients retain their own audio/comfort/quality settings. |
| #43 | Clean scene PNG and capability-detected 15/30-second clip capture, maximum 1280-pixel edge/24 MB, optional enabled app audio, preview/download/share | Format/backend support is detected, not promised universally. No microphone, screen permission, remote upload or hidden recorder. Physical Safari and native WebGPU capture still require device qualification. |
| #44 | Drawing-resolution-only adaptation with hysteresis, protected halos/reflections, truthful backend/effective-scale reporting, opt-in local 60-second diagnostics | This does not establish a phone frame-rate or thermal claim. Plan and authorise a bounded isolated physical-device session before qualification. |

## Safety and state contracts

Sound and haptics remain opt-in; saved comfort choices remain authoritative. A preview never advances the real scene, a share link never launches or unmutes, and imports cannot supply settings, scripts or asset URLs. Personal shows use simulation time and existing admission. Capacity pressure is visible rather than a silent dropped key cue. Pause, dialog ownership, backgrounding and renderer recovery do not create catch-up launches.

Capture owns at most one bounded encoder/copy canvas. Photo/clip concurrency is rejected; stop, resize, hidden tab, errors and disposal release tracks, audio taps and object URLs. Diagnostics stop after sixty wall-clock seconds even with no rendered frames; their render-interval/Long Animation Frame samples are explicitly not GPU completion, temperature or hardware qualification.

Local recipes are not a backup service: browser storage can be cleared or blocked. Export before resetting. Only a user-requested share action leaves the device.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `python3 scripts/validate_docs.py`, the existing runtime/security matrix, `npm run test:full-night` and `npm run test:experience` against the exact final branch. The first source checkpoint passed 328 unit tests; later lifecycle regressions extend this suite. Final counts and browser PNG/JSON artifacts belong in PR #45's exact-source receipt, not an optimistic static claim here.

Browser evidence uses GitHub-runner Chromium software WebGL/Canvas and emulated viewports. The local browser is managed-blocked; its policy was not changed. Keep failed runs in history. Distinguish machine pixel/decode checks, manual screenshot review, actual listening review and physical-device qualification.

## Dependencies and reconciliation

Do not force-push, delete historical branches, merge an unreconciled alternate runtime or silently move PR #33's release hold. PR #36's ancestry is integrated; #33's held branch is not. Temporary source-transfer files/writable integration workflows must be absent from the final promoted tree. Retain read-only regression workflows and the complete evidence history.
