# 07 — Design system, screen composition, and motion

## Principles

The night sky is the interface's background, not a decorative section inside a website. The dock should resemble a small tactile tray resting above the ground. Use layered dark glass sparingly: one primary dock, one compact controls cluster, and one settings/help surface when needed. Avoid dashboards, oversized labels, repeated cards, gradients on every button, and permanently glowing borders.

Tokens are proposed defaults in `design/tokens.json`. They are a handoff specification, not generated CSS or a rendered design. Preserve semantic names so future art tuning does not require editing individual components.

## Layout and responsive rules

Use a fixed full-viewport scene with a separately composited DOM interaction layer. Prefer dynamic viewport units with safe-area padding; do not hide content under a phone's home indicator. The visual scene may fill the viewport while readable overlays retain normal zoom and scrolling.

Below 600 CSS pixels, the dock is compact and horizontally scrollable only when five comfortable targets do not fit. At 600–1023 pixels, show all five options when possible; keep the dock around 440–520 pixels wide. On desktop, center a 480–560-pixel dock with generous surrounding sky. These are layout thresholds, not device-detection rules. In short landscape viewports, reduce decorative padding before reducing touch targets.

The foreground launch strip sits above the dock's expanded area. Its default horizontal placement range is 20–80% of the interactive stage. The sky-burst safe area excludes the open settings panel and preserves at least a small border around the projected burst envelope. Opening settings pauses new activity rather than continuously moving the sky camera to make room.

## Components and states

**SceneHost:** owns a canvas placeholder, loading/error/static presentation, and renderer lifecycle mount point. It is not itself the keyboard-accessible control system.

**RocketDock:** five semantic selection buttons in a named group. Each has original prop thumbnail, accessible family name, selected state, and optional short text revealed on selection/focus. Family identity is not color-only. Selection lifts the thumbnail modestly and increases local contrast; never resizes the whole dock.

**PlacementControls:** subtle left/center/right actions plus an optional drag surface. The selected object remains visible when the dock collapses.

**IgnitionTarget:** a generous invisible hit area around the visible fuse plus a small progress ring. States: unavailable, ready, holding, canceled, committed. A separate Light selected firework button supplies the no-hold alternative.

**ControlCluster:** pause/resume, sound, auto-show, fullscreen, and settings. Haptics, quality, reduced flashes, reduced motion, ambience, keep-awake, help replay, and reset belong in Settings rather than the main sky.

**ShowControls:** preset selection and Start/Stop/Resume state. Grand Finale in the dock remains distinct from Finale in this preset selector.

**SettingsSheet / HelpSheet:** one overlay at a time; named heading, close button, visible focus, keyboard escape, focus return. Contents scroll independently when text is zoomed. The scrim dims the sky enough to make glass text readable.

**StatusNotice:** short, actionable, low-frequency messages for capacity, offline readiness, wake lock, or recovery. Do not use recurring celebratory toasts.

## Visual tokens

Proposed palette: sky zenith `#03050B`, horizon `#111B2C`, glass surface `rgba(14,20,32,0.78)`, opaque fallback `#141C2A`, primary text `#F1F4FA`, secondary text `#BCC6D6`, restrained warm accent `#EAC17A`. Accent is for selection/focus, not a permanent neon frame. Use a thin low-opacity border and a soft shadow; slight grain may prevent sterile flatness, but it must not obscure text.

Use system UI fonts for the baseline, with readable 14–16-pixel labels and 16-pixel or larger body copy. A tiny icon can sit inside a 48-pixel hit target; the visual size and the interactive area are different. Text contrast must be checked over the **composited** background and peak burst state, not just against a nominal transparent color. Opaque surfaces are an acceptable accessibility/performance fallback.

## Motion contract

Selection response begins within 100 ms as a proposed responsiveness target. Press scale is approximately 0.97; selected lift is 4–6 px. Dock entrance is 220–300 ms, overlay entrance 180–240 ms, small feedback 120–160 ms. Use a damped spring or a restrained ease-out, not elastic bouncing. Auto-hide starts after three seconds of true inactivity only when no focus, pointer capture, overlay, hover tooltip, or unacknowledged error needs the controls.

Hiding translates the dock down by around 8 px and fades it. Showing controls does not move the firework world. The lighter may have 40–70 ms of visual smoothing, but the ignition hit test remains immediate. The fuse burn is driven by simulation progress, not a UI animation callback. Light-reactive glass uses a capped CSS custom property updated imperatively at a low rate or a short event animation; particle frames never pass through React state.

Reduced motion removes spring overshoot, decorative preview loops, drift in UI elements, and any camera impulse. It shortens transitions without disabling critical feedback. Reduced flashes is separate and changes the simulation's light envelope.

## Hidden controls and accessibility

Manual idle retains a discreet reveal affordance. Tapping background, moving a pointer, or focusing by keyboard reveals controls. Hidden DOM controls are not left invisibly focusable: focus first reveals their container. Once a keyboard user is navigating, do not auto-hide until focus returns to the scene. The first reveal interaction is consumed, avoiding accidental placement or ignition.

Help contains the control names and shortcuts. Display presentation may fully hide chrome, but one tap or Escape always restores it. Do not disable pinch zoom globally, trap screen readers in the canvas, rely only on swipes, or flash the whole screen to confirm selection.

## Content examples

Use 'Hold to light', 'Release to cancel', 'Let this burst finish', 'Show paused', 'Resume show', 'Sound off', 'Keep screen awake', and 'Graphics unavailable — try lower quality'. Avoid technical jargon in user-facing errors. Accessibility labels may be longer than visible text. Keep strings centralized for later translation.

## Design review deliverables

Implementation must supply portrait and landscape captures of idle, dock expanded, placement, holding, fuse burning, peak burst, afterglow, settings, help, paused, capacity-limited, and error states. This documentation delivery does not include those rendered assets. Validate the actual app before describing the design as finished.
