# 14 — Accessibility, privacy, and safety

## Accessibility target

Design controls toward WCAG 2.2 AA and validate the actual implementation. This documentation is not a conformance certificate. Fireworks are intrinsically dynamic and can contain flashes, so accessibility is part of rendering and choreography, not only semantic HTML.

Provide Pause, Sound, and Reduce flashes before the first burst. Honor the operating-system reduced-motion preference on startup, while allowing an explicit in-app choice. Reduced motion disables camera movement and decorative interface motion. Reduced flashes separately changes bright core area, bloom, simultaneous intensity, and crackle frequency. The user must be able to leave the scene quiet.

## Flash-risk gate

Assess the final rendered sequences, including concurrent manual launches and automatic finales, against the W3C guidance for flashing content. Frequency alone is insufficient: area, luminance change, and saturated red transitions matter. Source: [S11](19-research-and-reuse.md). Do not equate 'under three launches per second' with safe flashes, because each launch may contain many secondary transitions.

Build a shared intensity envelope and avoid full-frame white flashes, repeated large bright transitions, and random hard on/off sparkle flicker. Capture worst-case sequences at target screen sizes and analyze them with an appropriate documented method before claiming conformance. A warning or a reduced-flash switch alone does not establish safety. Do not deliberately expose a photosensitive person to an unassessed build as a test procedure. The product must not advertise itself as seizure-safe.

If the high-intensity sequence cannot meet the assessment gate, reduce its brightness/coverage/overlap or defer that sequence. Preserve the family silhouette rather than intense flashing. Automatic show intensity cannot override accessibility preferences.

## Operable controls

Provide single-pointer and keyboard alternatives to dragging, a no-hold ignition action, visible focus, and generous hit targets. The app's proposed minimum control target is 48 CSS pixels. Drag alternatives follow the direction of [S28](19-research-and-reuse.md); pause/stop discoverability follows [S29](19-research-and-reuse.md).

Buttons have names and state descriptions; selection does not rely on color alone. The fuse has a generously sized target even though its visible line is small. Settings overlays have proper dialog semantics, focus containment while open, and focus restoration. Tab, Escape, and browser navigation retain predictable behavior. Never trap a keyboard user in hidden controls or consume shortcuts while they are typing.

At 200% text zoom, settings/help remain readable and scrollable; controls do not overlap the close button. Test narrow portrait and short landscape. Avoid disabling user zoom globally. Decorative canvas content can be hidden from assistive technology while an adjacent concise state description and accessible controls represent the interaction. Do not announce every automated burst or particle.

## Sound and tactile accessibility

Audio is optional and off initially. All essential state changes have visual and semantic equivalents. Keep a mute control recoverable even in display mode. Vibration is opt-in, short, cancellable, and nonessential. Haptics availability does not determine whether ignition works.

Audio headroom targets are technical mixing goals, not statements about safe listening level. Users retain system volume control. Do not create startling first-load explosions or unexpectedly increase volume.

## Privacy boundary

The app needs no login, personal profile, geolocation, contacts, camera, microphone, advertising ID, or private wedding data. It stores only local preferences and asset caches by default. Diagnostics remain local unless a later explicitly approved telemetry design provides disclosure and minimization.

A proposed public notice should explain local preferences, cached media, how Reset/remove-offline-data work, and that the hosting provider may process ordinary request/access logs. Do not claim 'no data is ever processed' merely because the app has no database. Avoid third-party runtime fonts, trackers, or media/CDN dependencies that undermine the client-only privacy design.

The repository is public. Commit no credentials, tokens, emails/contact books, private family details, livestream keys, local machine paths, or unrelated project data. A future shareable show seed is not permission to include personal information in a URL.

## Application security

Validate all configuration and clamp numeric limits before allocation. URL parameters, if later added, use a strict allowlist and cannot inject HTML, fetch arbitrary remote scripts, or request unbounded particles. Pin dependencies at implementation, review license/security notices, and keep a reproducible lockfile.

Use a restrictive tested content-security policy, least-privilege browser permissions, and secure hosting. Do not disable browser security to make graphics work. Keep embedding blocked except approved same-origin behavior until an explicit host integration adds known origins. See deployment document and [S25–S26](19-research-and-reuse.md).

## Simulation-only boundary

The application depicts virtual fireworks. Do not add physical device controls, construction recipes, explosive materials, or instructions encouraging close handling of real display fireworks. The foreground ignition is a virtual interaction and must not be presented as a real-world safety demonstration.

## Required evidence

Keyboard-only manual launch and pause; screen-reader control/selection review; 200% zoom; reduced-motion startup; reduced-flash startup and all five effects; worst-case finale assessment; muted operation; haptics unavailable; focus recovery from hidden UI; no permission requests for unrelated APIs; and a network/privacy review of the production build. Record unresolved accessibility limitations clearly before public release.
