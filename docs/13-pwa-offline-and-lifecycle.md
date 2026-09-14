# 13 — PWA, offline assets, and application lifecycle

## Installation is optional

The standard HTTPS URL is the primary entry. PWA installation should improve repeat access without becoming a gate. Prepare a manifest with stable ID, name/short name, start URL/scope, standalone presentation, theme/background colors, and original regular/maskable icons. Keep install UI capability-specific and user initiated. Do not promise an identical install prompt in every browser. Sources: [S13–S14](19-research-and-reuse.md).

The documentation baseline does not include a generated icon pack or working service worker. These are implementation deliverables.

## Cache plan

Use the Vite PWA/Workbox ecosystem as a proposed integration, with exact versions selected in the scaffold. Precache the application shell, versioned configuration, essential shaders/code, and required low/standard visual assets. Cache the complete approved sound set for offline use when downloaded. Never make a runtime CDN or third-party media host essential to a manual launch. Reference: [S16](19-research-and-reuse.md).

Provide explicit states: online/not cached, downloading offline package, offline ready, partially cached, and update available. 'Offline ready' means a manifest-listed set of assets has been checked in the expected cache version, not merely that a service worker registered. A first-ever visit with no network cannot load an uncached app; do not imply otherwise.

Cache quotas and eviction are browser controlled. Treat persistent storage requests as optional and revocable. Catch quota failures, retain a usable online/silent mode when possible, and offer retry/remove offline media. Reference: [S24](19-research-and-reuse.md).

## Asset readiness and loading order

First load: shell/controls, minimal sky, selected Gold Willow materials/prop, then critical family data. Warm shaders and reserve pools before enabling ignition. Fetch other family assets progressively with a clear unavailable/loading state. To claim complete offline support, all five families and the chosen audio pack must be available before showing ready.

Hash/version static assets and validate their MIME types in production. Decode audio off the critical ignition path once enabled. A missing ambience loop is noncritical; missing selected-firework visual assets block ignition with an honest retry. Do not silently substitute Peony for Willow.

## Safe service-worker updates

Prefer a prompt-style update policy, not forced reload/activation in the middle of a display. A new worker may install and wait; show a small update indication only when controls are visible. Apply the update at an explicit restart or safe idle point after all active reservations drain. Preserve version-compatible preferences; do not preserve burning fuses across a build update.

Plan cache cleanup so a still-open old client does not lose assets it still needs. Use versioned asset names, a documented old-client transition, and tests for two tabs on different builds. Avoid a casual skipWaiting/clientsClaim combination that produces mixed app/assets versions. A service-worker rollback needs explicit cache/update recovery; rolling back only static HTML may not update an already-controlled client.

## Visibility and wake lock

The app renders continuously while visible and active. Page hiding suspends simulation/choreography, cancels future audio, stops haptics, and releases the requested wake lock. Browsers may throttle hidden timers/animation callbacks; this is why a background queue must not serve as the time source. Sources: [S07–S08](19-research-and-reuse.md).

Returning to the app restores the frozen visual state and offers Resume. Reacquire wake lock only if the person still intends display mode and the page is visible. Handle denial/revocation and reflect actual status. Never keep the screen awake without a user choice, or promise that an OS lock, low battery policy, or browser decision can be bypassed.

Fullscreen is similarly requested, not guaranteed. The viewport-filling layout remains useful without it. Store desired presentation separately from whether the browser currently granted fullscreen; listen for actual changes. Source: [S14](19-research-and-reuse.md).

## Preference schema and recovery

Store a small namespaced JSON object with `schemaVersion`, safe preferences, and onboarding completion. Validate on read, migrate only known prior versions, clamp numeric values, and ignore unknown fields. A parse/storage exception falls back to in-memory defaults. Audio intent never overrides the need for an actual activation gesture. Fullscreen and wake-lock handles never persist.

Reset options distinguish resetting preferences from removing downloaded assets. Either action should be explicit, local, and reversible by using the app again. A factory reset does not touch unrelated origin data outside this app's cache/storage namespace.

## Error states

When offline and essential assets are missing, retain a clear message with Retry and available controls. Renderer failure presents Lower quality / Retry / Static scene. Repeated reload is not the recovery strategy. A static night scene must be honestly labeled as non-animated when the engine cannot run.

During installation/update failures, the ordinary online app should remain usable where possible. The app may record a local technical error for troubleshooting but must not upload personal/device information by default.

## Release checks

Validate manifest and icon appearance, secure hosting, standalone launch, correct scope, asset base paths, update prompt, an installed offline cold start, cache quota denial, asset deletion/eviction, two-tab version mismatch, and a real rollback. Repeat lifecycle tests in a normal tab and installed mode. Record unsupported or unrun platforms without treating installation alone as proof of complete PWA behavior.
