# Canvas touch policy: source and observed browser evidence

Research date: 30 September 2026. This note supplements the retained [galaxy source/reference research](../galaxy-sky-2026-09-30/RESEARCH.md). It records a narrow interaction decision, not a change of graphics engine or a physical-phone qualification.

## Primary reference

[MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) was opened during this documentation task. It explains that a browser taking over a touch gesture sends `pointercancel`; the CSS policy declares which gestures the browser handles before a gesture begins. `pinch-zoom` permits native multi-finger page panning/zooming. Effective behavior also depends on ancestors; changing the property after a gesture starts does not change that gesture.

## Application evidence and selected scope

The corrected local fixture passed its mouse checks but stopped at the native touch brush. The [diagnostic trace](intermediate/debug-touch.txt) records a primary touch `pointerdown` at (235, 136), a `pointermove` to (255, 145), and then a `pointercancel`, all targeting the canvas. Engagement was about `.946` after contact and `.207` following cancellation. This is an observed cancellation consistent with the browser gesture behavior documented by MDN; it does not establish behavior on every browser or physical device.

The selected declaration is `.scene-host canvas { touch-action: pinch-zoom; }`. It is scoped to the drawing canvas, keeps single-finger sky brushes active, and permits native multi-finger zoom by policy. Expanded panels retain their own scrolling and firework drag/placement controls retain their existing scoped policies. Sky event listeners remain passive and do not capture a pointer or call `preventDefault`.

The [final local interaction report](intermediate/final-interaction.json) passes a CDP native single-finger brush and release on portrait WebGL and Canvas without launching a firework. Multi-finger zoom and physical-phone/Safari behavior remain unqualified here. [Implementation receipt](IMPLEMENTATION.md) retains both failed reports and separates the initial frozen-input fixture issue from the later observed touch cancellation.
