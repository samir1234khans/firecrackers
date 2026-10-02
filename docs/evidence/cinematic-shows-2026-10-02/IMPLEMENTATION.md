# Cinematic shows implementation

Candidate `2026-10-02.4`, starting from verified main `61c4116`. Production remains `2026-10-02.3` until the explicitly approved release gates pass. [Approved contract](../../plans/CINEMATIC-SHOWS.md).

## Delivered behavior

Three original 90-second themed scores upgrade Finale and Festival; Always Play consumes their phrase/density/formation grammar while preserving all thirteen bag entries and four admitted-quantity bands. Six 15-second phrases, safe launch formations, solved primary-impact timing, phrase-boundary theme changes, saved Manual placement, resource reservations and independent random streams share the existing fixed clock.

Show controls contain separate finite/endless theme choices. Show music starts off, is independent from sound effects and is controlled by the existing master mute. Preference schema 4 migrates earlier settings without restoring a running session or granting sound consent. Explicit presentation links carry visual themes only.

The reproducible original bell/pluck/pad/percussion generator delivers 18 stereo FLAC chunks, 5,319,164 bytes total. Hashes, notation, seeds and format are in [the music manifest](../../../assets-source/music/manifest.json), with [provenance](../../../assets-source/music/PROVENANCE.md). The official development encoder archive was SHA256-verified as `53f1500f0d6e7c61379d7fee50d4a9f7f504c650009506d9ba015530d76c0dde`. Encoder binaries and WAV previews are not shipped. Runtime checks two retained decoded buffers/two sources, a 24 MiB retained-memory cap and bounded fetch/cache behavior. Acoustic boom delay stays intact.

Shared brightest burst lights supply coherent world-space colour and decay to existing smoke gradients, rough water facets, boat lighting/contact fragments, damp stone and distant architecture. Quality caps are 4/2/1 contributors; Canvas uses one. No new particle pool, reflection target, fog pass or global exposure pulse is introduced. Main-camera smoke remains excluded from mirrored reflections.

Recovery diagnostics distinguish overload samples, backend history, device-loss reason/message and bounded GPU validation errors. Genuine severe overload still recovers to compatibility graphics with the same simulation and show phase. No guard threshold was weakened and no backend label was forced.

## Executed checks before PR qualification

- 279 unit tests pass; TypeScript/lint/build pass.
- Two-hour accelerated Festival simulation passed resource bounds. This is logical time, not physical/GPU endurance.
- Native Chrome WebGPU, WebGL and Canvas each passed 21 theme/viewport cases, covering all seven existing viewport sizes and three shows. The original recording decoder verified all eighteen durations, peak headroom and identical overlap samples. Music playback, master mute, pause/resume and immersion passed.
- Focused lifecycle checks passed explicit visual themes with sound off, mid-show music activation, hidden-page freeze/explicit resume, offline app and consent-cached score chunks, missing-music fallback and genuine overload recovery preserving music/show phase.
- These pre-qualification browser passes precede the final small phase-boundary/contact refinements. Final-source native checks, matched captures, clean hardware timing, complete PR/main CI and deployment remain separate gates; their results must be recorded before promotion.

## Findings retained

Initial units caught reduced High/Super High density after beat quantization; scheduling was repaired while retaining the original quantity assertions. Older tests' finite-duration/placement/schema expectations were updated only for the owner's approved behavioral changes. Reflection fixtures now supply the shared light frame without removing state-restoration assertions.

The first browser pass reached all theme/viewport and recording checks, then failed on a test-only `Pause` selector; the actual control is `Pause scene`. Lifecycle validation found a real negative fade timestamp when music was enabled late; envelope times were corrected and the mock now rejects negative AudioParam timestamps. The next hidden-resume attempt failed because Space acted on the focused Settings button; the test now blurs before exercising the global shortcut. Both repairs are covered by the subsequent passing lifecycle run.

A fractional fixed-clock boundary could reset a looping score cursor at 89.999999999 seconds rather than its next opening. Cycle and phase now share the same epsilon calculation; a regression check covers three successive endless shows. No historical failed evidence was presented as a pass.

## Release gate and limitations

The owner capped final local real-time qualification at 20 minutes. Unexpected WebGPU fallback or contaminated shared-PC timing holds main promotion/production at the reviewed preview and PR until a valid short check is available. Required CI remains complete. p95 allowance is the larger of 2 ms or 20%; no new repeatable launch-transition hitch.

Browser frame intervals and CPU submission are distinct from GPU completion. Physical phones, Safari devices, thermal endurance and formal flash conformance remain unqualified. Offline music is available for consent-cached chunks; uncached music can fail quietly while visuals continue. Rollback retains production Worker `12eb0650-dc48-4609-812d-0511a489a960`; rolling back to preference schema 3 may restore defaults.
