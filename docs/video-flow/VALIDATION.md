# Video-flow validation contract

The new executable browser runner is `tests/video-flow-browser.mjs`; `npm run test:e2e` runs it against the production build. `VIDEO_FLOW_URL` selects an explicit hosted build for post-deployment verification. `VIDEO_FLOW_PROJECT` selects desktop or mobile for the existing matrix workflow.

The historical browser specs remain in `tests/browser` to preserve the previous release evidence, but their hold-to-ignite, Light once, circular HUD and automatic hide expectations are superseded. Do not report their historical pass counts as the new release result. The replacement runner covers actual pointer/touch launch, two consecutive real-time bursts, next-family immutability, duplicate rejection, rendered geometry at named phases, all five effects, pause/settings ownership, manual takeover, settings persistence, reset cancellation, responsive layouts, cold offline reload and returning from protected transparent display.

Frozen/advanced visual checkpoints are labeled separately from actual real-time input. They prove render/state consistency, not a frame-rate measurement. Physical Android, Safari/iOS, WebGPU hardware, device haptics/fullscreen/wake-lock support, listening quality, long-session thermals and OBS composition remain manual qualification gates unless separately recorded.

Before publication: typecheck, lint, all 51 existing unit tests and 10 new video-flow unit tests passed locally; the production build passed. Browser verification and live-source equality must be recorded after execution, not inferred from these results.
