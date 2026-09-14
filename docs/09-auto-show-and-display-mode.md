# 09 — Show director and decorative display

## Two separate concepts

**Grand Finale** is one of the five selectable fireworks: a bounded multibreak composition. **Finale mode** is a show-level pacing preset. Keeping their IDs separate avoids recursive finales and accidental exponential spawning.

Manual mode is the initial state. Auto starts only through an explicit action. Decorative display is a presentation of the same scene with chrome hidden; it is not permission to run indefinitely in a hidden browser tab.

## Director model

Use a seeded scheduler that maintains short phrases, recent family/color/position history, active reservations, and an intensity envelope. A phrase contains quiet lead-in, individual launches, optional overlap, one accent, and a breathing interval. The director decides desired **burst** time, then subtracts the selected firework's seeded fuse and ascent durations to obtain an ignition time. A desired time already in the past is rescheduled; never compress a fuse to catch up.

The director uses the same validation, admission, lifecycle, and event pipeline as manual ignition. It may automate the virtual fuse, but it does not bypass resource caps, flash reduction, or pause. Keep future reservations short and bounded; do not generate an infinite event list.

## Proposed presets

| Preset | Burst spacing target | Phrase | Overlap / character |
|---|---|---|---|
| Calm | 5–9 seconds | 45–70 seconds | Usually one primary burst at a time; Willow and Peony emphasized; long afterglow and quiet gaps. |
| Festival | 2.5–5 seconds | 50–80 seconds | Alternating singles and pairs, occasional Chrysanthemum/Crossette, rare multibreak accent; budget-limited. |
| Finale | 0.8–1.8 seconds within a phrase | 12–18 seconds, then at least 12 seconds of cooldown | Short intentional crescendo, then visible darkness and falling gold; never an endless strobe wall. |

These spacing values express desired primary/composition burst cadence, not an unconditional timer interval. Capacity and safety constraints may lengthen spacing. Low quality uses fewer concurrent layers and longer staggering. Reduced-flash mode extends spacing and suppresses bright crackle clusters while preserving structure.

## Variety rules

Avoid more than two consecutive uses of the same family. Avoid the same palette group twice in succession when another safe option exists. Rotate left/center/right burst regions with bounded jitter. Avoid placing simultaneous burst centers on top of each other. Long tails may overlap, but a new report should not always happen at the same point in an existing canopy.

Use a weighted choice or shuffle bag, not uniform random choices every frame. In Calm, set Grand Finale's weight to zero by default. Festival permits no more than one Grand Finale per 60 seconds. Finale mode can use one Grand Finale as a closing accent; it must not recursively select another Finale preset. The scheduler uses a shared intensity/capacity model so separately scheduled families do not jointly violate the planned envelope.

## Resource arbitration

Reserve before lighting, using family peak requirements and launch-cost units. Manual intent has priority for **future** scheduling; accepted virtual fuses and active bursts are not deleted to make space. If the director cannot reserve a launch, move it into a later permissible window or drop the optional accent. It never creates a hidden backlog. Limit pending planned cue count to 32 and maximum planning horizon to 20 simulated seconds in the initial design.

When capacity changes because of performance adaptation, existing reservations remain valid within the old allocation until they drain. New launches use the new tier. Do not shrink a live GPU buffer while it is referenced by an active effect.

## Manual takeover and stop

Selecting a manual firework changes `running` to `pausedByManual`, discards uncommitted automatic cues, and retains current effects. Resume show is explicit. Stop Auto drains existing effects but prevents new ones; Pause freezes the entire simulation and stops audio. These are different actions and have distinct accessible names.

A user may leave auto running while opening the main controls, but Settings/Help should pause new activity for readability. Closing an overlay does not silently restart a deliberately paused show.

## Clean display presentation

A Start display action selects a preset, hides chrome after a short cue, and optionally requests keep-awake. Default to Calm, sound off, haptics off, and stable exposure. Tap or Escape restores controls. Cursor hiding is permitted after inactivity on desktop but reverses on movement. No permanent watermark, performance counter, or oversized brand label covers the sky.

Keep-awake is opt-in, capability-detected, and revocable; indicate its actual status in Settings. Return from background must offer Resume rather than releasing accumulated bursts. Browser throttling and wake-lock limitations are documented in [S07–S08](19-research-and-reuse.md). The app does not promise to bypass device sleep or thermal policy.

A local sleep timer of Off / 15 / 30 / 60 minutes is a proposed low-cost display setting, not a required extra page. It ends the show, releases wake lock, and returns to a quiet scene. It may be deferred behind core V1 gates if it adds lifecycle risk; the default Off still has explicit pause/stop controls.

## Wedding-stream / host-site extension boundary

V1 provides a clean **opaque** full-scene display that can later be captured externally. Transparent canvas export, OBS-specific browser-source presets, host-page postMessage commands, safe-area masks for video overlays, and synchronized guest launches are deferred. They require separate testing of transparency, post-processing alpha, embedding permissions, lifecycle, and resource sharing with video. Do not assume a transparent CSS background makes an HDR/bloom pipeline correctly compositable.

Preserve a ScenePresentation configuration boundary now so later host integration does not require rebuilding the simulation. No wedding identities, contact details, stream keys, or account credentials belong in this public repository.

## Test scenarios

Run a fixed-seed 10-minute sequence for each preset and assert reservation limits, no recursive finale, repetition constraints, planned-window bounds, and complete cleanup. Then test manual takeover during a pending cue, stop during a burning fuse, pause before a delayed report, and background at the climax. Finally inspect a two-hour visible display soak for monotony, haze accumulation, memory growth, and recurring UI distractions.
