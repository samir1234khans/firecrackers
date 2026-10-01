# Immersive controls for automated shows

**Owner-requested addition; planning only.** Continue the current moonlit-water implementation and qualification. This UI feature is a subsequent reviewable change and is not present in the water preview.

## Intent and verified source constraints

While an automated show runs, the viewer can explicitly hide the interface and watch the waterfront and fireworks. Exactly one small control remains visible to restore the interface. The same control hides it again, so there is a deliberate choice in both directions.

The current [show knob](../../../src/ui/ShowModeKnob.tsx) offers Manual, Calm, Festival and Finale. The owner's “Auto” refers to automated playback; eligibility should follow the existing non-null show preset rather than introduce a separate mode or rename these choices. [App](../../../src/App.tsx) already has a `hidden` state, but interactive play deliberately keeps its command deck visible. Its legacy reveal branch retains three buttons and reveals on a sky tap; those behaviors do not satisfy the requested single-control experience. [CinematicHUD](../../../src/ui/CinematicHUD.tsx) and lower controls already use inert chrome containers. [StageLayout](../../../src/engine/StageLayout.ts) measures their reserved regions and affects the camera, so removing their layout boxes would risk a visible framing jump.

## Interaction contract

- Offer the control during Calm, Festival and Finale after scene preparation. Start with the UI visible; entering a show never hides it without a press.
- Keep one 48-pixel control in a stable safe-area position, outside the hideable chrome. Reuse the app's restrained glass styling, with an eye/eye-off glyph and a clear “Hide controls” / “Show controls” accessible name. Its visible hit area and focus indicator remain intact when the rest disappears.
- Hide the collection, scene-control rail, mode knob, position controls, ground preview, routine launch feedback and ordinary hints. Do not leave the current separate pause and sound buttons visible. The surviving toggle is the sole visible control during normal immersion.
- A press only changes interface visibility. It must not restart the show, pause it, alter the committed rocket, change placement, reset water phase or activate audio. Returning to Manual, finishing the finite Finale, resetting, or encountering a graphics error restores the UI. Recovery must remain operable.
- Restore through the toggle or Escape. Pointer movement and ordinary sky taps do not reveal controls or unexpectedly launch a firework. Existing pause/mute keyboard commands remain available; a pause command can restore controls so the paused state is clear. No new undocumented keyboard shortcut is required.
- Move focus to the surviving button before hiding anything that contains focus. Enter/Space operate that button. Close open control popups before entering immersion while preserving existing independent pause ownership. On restoration, keep focus on the toggle; do not jump focus into the collection.
- Keep this choice session-local initially. There is no extra settings panel, backend or preference migration. Retain explicit presentation-link behavior; the new automated-show choice must not silently change existing transparent/presentation modes.

## Smooth visual treatment

Fade the chrome as one coordinated group over approximately **220 ms** with a gentle ease; optionally translate by no more than **4 CSS pixels**. These are initial design values. Preserve its measured layout boxes, safe insets, camera, waterline and launch coordinates throughout the transition. Animate opacity/transform, avoiding layout animation or a renderer resize. Reverse cleanly from the current visual state when the viewer toggles rapidly.

Give the surviving button a subtle background/outline transition and a **120–160 ms** glyph crossfade, without spinning, pulsing or changing its position. It stays readable against bright bursts and moonlit water. Respect both the app's reduced-motion setting and OS preference: use an immediate visibility change or a very short opacity-only treatment, with no translation. Reduced-flash settings continue to control fireworks independently.

Hidden chrome becomes `inert` at the start of hiding so fading buttons cannot still launch or receive Tab focus. On reveal, restore interaction once visibility is established. Opacity alone is insufficient: [MDN's inert reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) confirms that inert descendants cannot receive clicks or focus and leave the accessibility tree. The surviving button stays outside that subtree. Follow the [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) for keyboard activation and naming; use either a changing action label or a stable labelled pressed-state toggle consistently. The [reduced-motion media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) supplies the OS-level motion signal.

## Implementation sequence and qualification

1. Add an explicit App visibility policy derived from the active show, preparation, modal and failure states. Separate the single immersive toggle from legacy presentation reveal controls. Keep the simulation and rendering APIs unchanged.
2. Apply a coordinated chrome class and inertness policy to HUD, lower controls and routine notices. Ensure the stage continues to reserve the same measured rectangles while visually hidden. Add the minimal opacity/transform and glyph transitions with both reduced-motion inputs.
3. Exercise all three automated presets through normal controls, hide/show during a fuse, flight and burst, then return to Manual and finish Finale. Verify no admission, choreography, phase, sound or pause ownership changes from visibility alone.
4. Test Tab/Enter/Space/Escape, focus before hiding, a modal being open, rapid repeated toggles, bright-burst contrast, OS/app reduced motion, portrait rotation, hidden-page return, renderer recovery, and transparent/presentation links. Use the existing seven viewports and WebGPU, WebGL and Canvas. Capture matched visible/hidden/restored frames and transitions; verify exactly one visible control while hidden, no invisible hit targets and unchanged camera/terrace geometry.

Completion means the owner can watch an uninterrupted automated show with only the restore button visible, then recover every control with one press and no scene jump. Water delivery evidence remains separate in [the preview receipt](PREVIEW.md).
