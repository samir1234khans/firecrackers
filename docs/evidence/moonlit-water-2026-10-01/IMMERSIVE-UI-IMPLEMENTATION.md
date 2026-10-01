# Immersive automated shows

Build `2026-10-01.6` extends the moonlit-water candidate in PR #31. Calm, Festival and Finale expose a 48px Hide controls / Show controls toggle. The session-local setting fades the ordinary interface over 220 ms and crossfades the eye glyph over 140 ms. App and OS reduced-motion preferences remove these transitions.

The hidden controls are inert immediately. One toggle remains; pointer movement and sky taps neither reveal controls nor launch a manual firework. Escape reveals controls. Manual mode, the finite Finale ending and graphics errors restore the normal interface. The toggle preserves simulation, pause, sound, placement and scene framing. Presentation/transparent output retains its existing behavior.

## Verification

The dedicated `tests/immersive-browser.mjs` harness uses installed headless Chrome, individually requested WebGPU, WebGL and Canvas, and seven viewport sizes from 320x480 through 1920x1080. It checks control inertness, toggle dimensions, stable hero framing, no sky-tap launch, keyboard reveal, Manual restoration, Calm progression, Finale completion and OS reduced motion. Phone viewports are emulated; physical devices remain unqualified.

The existing water performance qualification is still conditional. This UI feature does not remove the previously recorded timing failures. An updated isolated preview and current-source checks are recorded as they complete. Production has not been promoted.
