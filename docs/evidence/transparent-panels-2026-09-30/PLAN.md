# Transparent panels: complete interaction redesign

## Scope and source

The owner's four phone captures show an inconsistency: compact borderless playback controls open the older opaque, oversized card interface. This plan replaces every opened application surface with one native translucent design system. It extends the galactic-sky release; it does not replace its sky, river, ten fireworks, original assets, saved preferences or bounded simulation.

Implementation starts from main `1648786955a3af10e60f99807236d1676bad6284`, on `feat/transparent-edge-panels`. The galactic sky build `2026-09-30.5` is the runtime baseline. Its production release is qualified separately. This document is a plan, not evidence that the following gates passed.

## Design foundation

- Keep the cinematic scene as the focal point. Opened panels use a dark translucent material with readable foreground text, a subtle local shadow and no full-screen blur or dimming curtain.
- Remove large serif panel headings, nested cards, visible decorative borders, tall empty header bands, gold gradient slabs and introductory prose that repeats the control's purpose.
- Native controls use shared material, text, muted text, accent, spacing and focus tokens. Gold identifies a chosen value, a purposeful primary action and keyboard focus. Firework glyphs retain their own colors. The proposed material is 76% dark tint: calculated sRGB contrast over a pure-white held burst is at least 4.62:1 for muted text even inside the selected/hover tint, without relying on backdrop dimming. This is a color-token calculation; actual rendered state inspection remains a separate gate.
- Panel titles are compact, approximately 16–18 px; body text approximately 14 px. Secondary explanations may be smaller, but essential controls and choices remain legible.
- Desktop panels use narrow 320–360 px edge sheets, anchored to the invoking side. Phone panels use the available width with safe margins, remain near the bottom and normally occupy at most approximately 60 dynamic viewport percent; long content scrolls inside them. Short landscape and enlarged text permit more height while keeping the close control visible.
- Preserve minimum 44 × 44 px desktop and 48 × 48 px coarse-pointer control targets. Small visual icons keep full hit areas. Text wraps instead of shrinking targets.
- Native modal semantics retain keyboard focus containment, Escape, a visible close control, backdrop dismissal and focus restoration. Opening a panel pauses by overlay ownership; dismissal removes only that reason.
- The resting six edge groups and mobile expandable dock keep their existing clear-stage layout. A user-opened panel may occupy the paused stage; its size and material should still reveal the waterfront and sky around and through it.

## Individual surface plans

| Surface | New composition | Behavior and information preserved |
| --- | --- | --- |
| Firework picker | Short heading, compact two-collection switch, five unboxed glyph/name rows, small selected-burst action and one concise drag instruction | All ten stable catalog entries, chosen state, selection closes, next selection cannot mutate a committed rocket, accessible center-burst alternative, pointer drag with material disappearing during the drag |
| Position | Short heading, one full-width slider, three lightweight presets with chosen state, compact confirmation | Existing `.2–.8` placement range, draft changes while paused, explicit commit after overlay close, keyboard placement, Help entry and no accidental launch |
| Show modes | Manual action plus three compact icon/radio rows, concise pacing descriptions and one small Start action | Calm, Festival, finite 32-second Finale, saved preset, explicit start/stop, manual priority and correct pause ownership |
| Settings shell | Compact title and four real tabs: Sound, Graphics, Display, Device | One section visible at a time, tab keyboard navigation and correct selected/controlled panel semantics; Graphics opens initially to make renderer/quality troubleshooting immediately available |
| Sound tab | Four compact rows for activation, volume, ambience and haptics | Muted startup, explicit sound activation, bounded volume, saved choices, truthful device capability state and existing audio cancellation |
| Graphics tab | One active renderer line, lightweight renderer choices, quality selector and independent comfort toggles | Automatic, WebGPU, WebGL and Canvas links retain quality preference; Ultra remains default; saved quality, reduced flashes and reduced interface motion remain independent |
| Display tab | Compact selects for output/pacing/fps, a clear-area toggle, optional area editor, small Start/Copy actions | Interactive/scene/transparent output, protected rectangle constraints, seed/layout display link, clipboard fallback, return to interactive view, explicit audio-off and streaming guidance |
| Device tab | Compact capability/status rows plus optional diagnostics and utilities | Wake lock, offline status, install/help, fullscreen, explicit update/restart disabled during committed flight, build/version, render diagnostics, Help, replay introduction, privacy explanation and reset entry |
| Help | Three concise task rows, comfort toggles, optional keyboard disclosure, small close/skip actions | Desktop side rails, phone dock, sky burst versus terrace launch, single press, shortcuts, pause/sound/flash guidance and introduction state |
| Reset | Small confirmation sheet with clear concise copy and two actions | Stops the display, clears only this device's saved preferences and introduction, sound-off reset, cancel returns to Settings |
| Loading | Compact transparent status near an edge | Actual preparation status and reachable compatibility entry; it cannot create a persistent central decorative block |
| Renderer recovery | Compact readable translucent error sheet and grouped recovery actions | Retry current quality, forced WebGL, lower quality, Canvas, reload and Settings all remain reachable; errors do not obscure the ability to recover |
| Fatal application boundary | Matching compact recovery material and typography | Reload and compatibility link, truthful saved-preference message, keyboard accessibility and readable errors independent of a healthy renderer |
| Presentation reveal controls | Small matching icon controls | Explicit reveal, Pause/Resume and Sound; presentation/transparent canvas behavior unchanged |

## Implementation responsibilities

Parallel work separates (1) the dialog/material/style foundation, (2) all panel content and Settings navigation, and (3) browser test adaptation and new cross-surface checks. The root owns integration, release version/fingerprint, per-surface evidence, previews, CI and production. Workers preserve each other's changes and do not publish competing builds.

Replace obsolete panel rules in the previous cascade where practical. New panel styling loads after the existing scene/HUD styles and is scoped to panels/recovery. Do not change scene composition or renderer budgets to make a UI test pass. No new dependencies, APIs, generated-image text or browser interaction layer over blank sky.

## Verification and release gates

1. Typecheck, lint, meaningful existing unit tests, build and complete existing Grand/original/stage/recovery/lifecycle/offline regressions. Update test navigation to the new tabs; preserve all assertions about actual behavior.
2. Exercise every surface at 320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800 and 1920×1080. Check panel bounds, contained scroll, visible close, control hit areas, text wrapping, selected states and no horizontal overflow.
3. Verify keyboard tab navigation, native dialog focus containment, Escape, focus restoration, manually paused versus previously running scenes, reset cancellation and no launch after dismissal. Verify picker drag from an open dialog as well as existing edge/dock drags.
4. Check 200% zoom/enlarged text and short landscape. Check readable contrast over the actual dark sky and bright fireworks; screenshots establish appearance, not a formal accessibility conformance certification.
5. Record seeded desktop and phone captures for picker, position, shows, all four Settings tabs, Help, reset and recovery. Inspect actual browser output and refine demonstrated issues.
6. Publish a separate Cloudflare preview and verify its source fingerprint, actual WebGPU, forced WebGL and Canvas. New UI is HTML/CSS; renderer changes are outside this task.
7. Require PR and main CI, merge through the normal branch workflow, publish the documented Cloudflare build, verify public source/assets and browser journeys, and retain the `.5` Worker rollback reference. Record exact Worker, commit, fingerprint, checks and untested physical-device limits.

Physical Android/iPhone/Safari, thermal endurance and completed GPU-frame performance remain separate from desktop browser emulation. Prior galactic and boat evidence remains valid for its own source, not automatic proof of this later UI release.
