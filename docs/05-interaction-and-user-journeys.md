# 05 — Interaction model and user journeys

## Three independent state domains

The app lifecycle is `loading → ready ↔ paused → recovering/error`. The manual controller is `empty → selected → positioned → igniting → fuseBurning → launched`, then returns to `empty`; launched fireworks continue in the simulation independently. The show director is `off / running / pausedByUser / pausedByManual / suspended`. Keeping these domains separate prevents opening Settings from losing an in-flight effect.

Use a monotonic simulation clock. Neither React render timing nor scattered wall-clock timers may determine whether a firework has ignited.

## First visit

Show the sky and a small readable panel offering **Start**, **Sound off/on**, and **Reduce flashes**; honor system reduced-motion preferences immediately. Sound starts off by proposed default. Do not launch an unsolicited firework before the user can choose reduced flashes or mute.

After Start, a short illustrative hint points to the dock: 'Choose a firework'. Selecting the default Gold Willow reveals the object in the placement strip. Next hint: 'Place it, then hold to light'. Let the person actually perform the gesture; do not force completion in three seconds. The progress indicator belongs to the fuse, not a large central loading spinner. After their first successful launch, show 'Tap the sky to show controls' briefly and save completion. Skip and Replay help are available. There is no compulsory sound, vibration, installation, or account step.

## Pick and place

The dock exposes all five choices on a sufficiently wide screen; narrow screens may scroll horizontally with visible edge affordance and keyboard equivalents. Selection changes the unlit preview only. It never replaces an already burning or airborne firework.

The proposed allowed x-range is 20–80% of the interactive stage; y is constrained to its ground strip. Drag the unlit object, or choose Left / Center / Right. The object snaps gently to the allowed range, not toward a moving target. A selected object can be canceled or replaced before ignition. The dock collapses after placement, leaving a recoverable handle.

Pointer hit areas follow the **current screen projection** after resize and orientation change. The visible lighter may follow with slight visual lag, but hit testing uses actual pointer coordinates. Reserve a generous fuse target so fingers do not need to touch a one-pixel line.

## Light

A primary pointer held on the fuse target for 650 ms fills a subtle local progress arc. Use Pointer Events and capture; `pointercancel`, loss of capture, Escape, early release, page hiding, or opening an overlay cancels the unfinished hold. A second finger cannot ignite a second copy. Source: [S12](19-research-and-reuse.md); exact gesture policy is this product's design.

At the hold threshold, check critical assets, available capacity, paused state, and duplicate event ID. If admitted, commit `fuseBurning`, lock placement, and reserve the full firework cost. The fuse then burns for its seeded 1.5–2.5 seconds. Releasing after commitment does not cancel a lit virtual fuse. Pause can suspend it; Reset can remove it. No natural-language safety instructions for physical fireworks are displayed.

For accessible operation, a clearly named **Light selected firework** button starts the same fuse sequence with one activation, and left/center/right buttons replace dragging. These controls may live in an accessible-controls panel but must not require precision gestures to open.

## Launch and watch

At fuse completion, emit `launch.started` exactly once and transfer the item to the simulation. The placement slot becomes available for another selection, subject to capacity. The camera remains fixed; do not chase the object or zoom every burst. The light flash precedes the distance-delayed report. The UI can hide only when no pointer interaction, focus, tooltip, error, or open overlay requires it.

A background tap used to reveal controls is consumed as a reveal, never forwarded to placement or ignition. A control click is never forwarded to the canvas. Keyboard shortcuts only run while the scene context is active and no editable field has focus.

## Automatic-show takeover

Starting Auto clears an unlit preview after an explicit UI action. Beginning a new manual selection pauses future automatic launches immediately; already lit/airborne fireworks complete. The person sees a quiet 'Show paused — Resume' status in the recovered controls. No automatic resumption after an arbitrary idle timeout. An optional later setting may change this only with explicit owner approval.

## Pause, background, and interruption

Pause freezes simulation time and choreography, cancels scheduled audio, stops current sound/haptics with a short fade, and retains the scene. Resume advances from the frozen state, not from elapsed wall time. Do not replay an old boom merely because it had not yet sounded at pause; new future events resume normally.

On page hide, apply a lifecycle suspension even when the show was running. Returning displays Resume; a cached stale touch or key must not restart ignition. Settings and Help suspend new ignition; an existing show can be paused behind them for readable controls. Escape closes overlays first and then pauses/reveals the scene; browser-owned fullscreen exit is respected.

## Keyboard and assistive operation

Tab reaches the dock, placement controls, light, pause, mute, auto, fullscreen, and settings in a sensible order. Left/right arrows move within the focused picker. Enter/Space activate the focused control. Optional scene shortcuts are `1–5` select, `M` mute, `P` pause, `A` auto, and `F` fullscreen; show them in Help and ignore key repeat for toggles. Do not steal browser shortcuts. A concise live region announces selection, ignition, pause, and errors, not every spark or automated burst.

## Required exceptional cases

- Capacity full: keep the unlit preview and show 'Let this burst finish' until admission is possible; no hidden delayed launch.
- Asset still loading: the ignition control explains readiness; use a cancellable loading state, not a fake fuse.
- Resize mid-hold: cancel the hold, recompute placement, and keep the selection.
- Storage blocked: continue in memory and note only in Settings that preferences may not persist.
- Graphics context/device loss: stop simulation/audio, keep React controls alive, attempt one controlled recovery, then offer lower quality or a static scene.
- Navigation/unmount: release pointer capture, listeners, RAF loop, render resources, audio nodes, and wake lock exactly once.

These exceptional paths are part of the first hero slice, not polish to postpone until launch.
