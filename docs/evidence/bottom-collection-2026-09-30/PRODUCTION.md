# Bottom collection and upper canopy: verified production

Verified 30 September 2026 UTC / 1 October IST. [Production](https://firecrackers.mainandmany.com/) · [isolated preview](https://firecrackers-redesign-preview.allygym-api.workers.dev/) · [matched before/after captures](comparison.html) · [PR #24](https://github.com/samir1234khans/firecrackers/pull/24).

## Source and deployment

- Build `2026-09-30.8`, final feature head `a57f4235bf02a5294d9d378fba3b28dd05e067e6`, branch `feat/bottom-tray-upper-canopy` retained. Final app changes are `2f5df91bb9552e743cf6e07cbc07b7339843503f`; the later feature commit changes only cadence test sampling.
- PR #24 merged to main `585d82e5aa135cf6f6ef7729b81a6f40f8798ef9`. [Merge receipt](merged-pr.json).
- Deployed from clean canonical main after exact-head PR and main push CI passed, using pinned Node 22.16.0 and `npm run cloudflare:deploy`.
- Production Worker `5a577d62-1deb-4770-b780-784d03574c7a`; [deployment output](production/deploy.txt). The Cloudflare domain and hosting remain unchanged.
- Preview Worker `8379ef0e-598b-4a50-a728-77eb9a96f996`. Both origins deliver the same 66-module source fingerprint: `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. [Public release manifest](https://firecrackers.mainandmany.com/release.json), [exact public bytes](production/http.json), [preview verification](PREVIEW.md).
- Previous production `.7` Worker `e167225e-e463-41f6-897d-e6f5b59aa03c` remains available in the [post-deployment version inventory](production/rollback.json). Its source `947f0c57e679a34d35e00b550aae625eba845672`, PR #23 and fingerprint `6186a504d1ccf20d90434ffe90b5771f075e33992765d9dbfa6d636e376c602b` are preserved in the [previous receipt](../waterfront-realism-2026-09-30/PRODUCTION.md). Operational rollback: `npx wrangler rollback e167225e-e463-41f6-897d-e6f5b59aa03c`, then verify assets and browser behavior against that receipt. Rollback was not invoked.

## Visible changes

All ten icons are on a transparent bottom tray in stable Classics/Grand order: two rows of five below 680px available width, otherwise one row with two separated groups. Artwork is 32px inside 48px targets, with small captions, names on hover/focus and a tiny gold selection marker. The Styles expander, side shelves, arrows, selected column and separate Launch button are removed. The launch prop and ground contact remain above the reserved tray.

Pause, Sound and Controls form a compact right rail. Controls opens Show mode, Position, Settings, Fullscreen and Help; shared translucent panels preserve focus, Escape, scrolling and pause ownership. Show choices apply and close. Settings displays its active section; Help contains optional catalog information. Reset uses Cancel/Reset actions.

Tap launches once when admission permits. An 8px drag threshold separates taps from drops: sky releases burst at the selected point; terrace releases run normal fuse/ascent from the projected horizontal position. Water, controls, tray, offscreen, Escape and pointercancel cancel. Denied attempts provide feedback without mutating selection or the committed rocket. No manual launch queue is added. Shortcuts 1–9/0 and keyboard launch remain.

GPU and Canvas resolve admission-time profiles into world heights targeting 34% of unobstructed scene height with seeded 31–37% variation and family canopy margins. Future profiles change on resize; committed trajectories do not. Fixed resize anchors preserve the waterfront horizon without camera tracking, per-launch zoom or scene translation. Assets, all ten identities, powered rise/coast, resource reservations, Ultra default, optional audio, saved preferences, offline/update/recovery and comfort controls remain.

## Passed verification

| Evidence | Result |
| --- | --- |
| Unit/type/lint/build, logical soak, audit |154 unit/engine tests;7200 logical seconds; zero audit vulnerabilities. Pinned clean CI installation. |
| [Exact PR runtime CI](https://github.com/samir1234khans/firecrackers/actions/runs/36754770532), [raw receipt](pr-ci.json) | All four jobs passed on final feature head. |
| [Source-main push CI](https://github.com/samir1234khans/firecrackers/actions/runs/36756850895), [raw receipt](main-ci.json) | All four jobs passed on deployed source main. |
| Documentation PR and push | [Final PR](pr-doc-ci.json), [feature docs push](feature-doc-push-ci.json), [source-main docs push](main-doc-ci.json) passed. |
| [Production stage/input](production/stage-hardware.json) |106 checks: native WebGPU non-fallback adapter, hardware forced WebGL and Canvas separately; all ten launches, upper profiles, duplicates, drag/cancel, terrace position, sky point, rotation, keyboard and sound. [Ten native upper-effect captures](production/effects). |
| [Production panels](production/panels.json) |201 checks: all sections, modal inertness, manual/overlay pause ownership, focus containment/restoration, Escape, reset, scroll, recovery/loading/update material and reflow. [Selected Canvas-backed panel captures](production/panels). |
| Grand/original/recovery/galactic | [42 Grand](production/grand.json), [28 original launch/offline/platform](production/original.json), [15 recovery](production/recovery.json), [35 galactic clock/input/comfort](production/galactic.json). No unexpected errors. |
| [Default startup and live Festival](production/startup.json) | Installed Chrome without backend override: native WebGPU, Ultra, all eight enhancements, sound off, Manual and zero initial launches. Phone 393×851 and desktop 1280×800 then ran 30s Festival each, six launches/five bursts, preserving backend/show. [Phone](production/default-393x851.png), [desktop](production/default-1280x800.png). Actual appearance reviewed. |
| [Production HTTP/assets](production/http.json) |29 files returned200 and matched clean-main build bytes exactly, including release/PWA assets. |
| [Before/after browser cadence](preview/performance.json) | Final preview source matches production; native WebGPU+Ultra, 10s warmup +20s Festival sample. Desktop and phone-viewport p95 about4.3ms before and after. No material regression in this PC sample. This measures rAF/submission cadence, not completed GPU or thermal performance. |

Browser checks cover 320×480,375×667,393×851,768×1024,844×390,1280×800 and1920×1080, plus 679/680 breakpoint checks. Safe-inset injection, browser-bar-size changes, rotation, 200% CSS reflow/DPR and doubled text are emulation. All 427 production core browser checks passed, plus 29 HTTP/assets checks and two default-startup/live-clock cases. CI separately passed progressive loading, embedded-map cleanup and overload recovery without weakening their gates.

Matched captures retain seed 20260916, time 0 reset, normal Gold Willow launch and 4.9 logical seconds for phone, tablet and desktop. JSON records actual origin, renderer and fingerprint. The after captures are the isolated preview of the exact deployed source, rather than generated comparison imagery.

## Failed history and remaining qualification

The [initial native startup timeout](failures/native-startup-timeout.json) had zero application errors; independent startup and full isolated rerun passed. The [first CI ambient sample](failures/ci-ambient-attempt1.json) failed its fixed 800ms interval under software rendering despite a visible/unpaused/motion-enabled scene. Test sampling now waits at most ten seconds for a resumed frame and applies the original 20/10fps cap to observed browser time; positive-frame and timeout gates remain. It accepts neither zero frames nor unlimited rendering. Final PR, main and production galactic checks passed. Superseded CI runs were canceled; no unresolved test failures remain.

Physical Android/iPhone, Safari, real phone safe-area/browser-bar behavior, native OS 200% zoom, thermal endurance and completed GPU-frame timing remain **NOT TESTED**. At 320×480 the fixed portrait horizon and 128px tray leave a shallow visible water/terrace band; the prop ground contact remains visible. Performance qualification is limited to the short PC browser sample, not physical mobile sustained performance. The next qualification work is physical-phone/Safari input, rotation, safe-area, zoom, audio/offline and sustained-performance testing; it is not a remaining implementation or deployment gate within the available evidence.
