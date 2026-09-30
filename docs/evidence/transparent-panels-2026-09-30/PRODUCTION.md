# Transparent panels: production release

## Delivered build

- [Production](https://firecrackers.mainandmany.com/): build `2026-09-30.6`.
- App source commit `9073379e30dc6623cbe9cd2f3bc2415744bb5fe6`; [PR #22](https://github.com/samir1234khans/firecrackers/pull/22) merged as main `ed54fe640945fa7de0f4ba3546b3445348bde78b` on 30 September 2026.
- Worker version `d04c14f1-f219-45dd-989e-97569693ac4b`, deployed through `npm run cloudflare:deploy` from the clean fast-forwarded main checkout.
- Exact 60-entry delivered-source fingerprint: `1249e82e8ab6604c52d7c32002a939792e3a9724bcd4fb7fe34e5d0d183fafe0`. Local, CI build artifact, isolated preview and public production match.
- Rollback: previous `.5` galactic Worker `a79b4a3d-89ac-418e-b487-60433885219d`, main `1648786955a3af10e60f99807236d1676bad6284`, fingerprint `81bf4e1160df0f21a10e29b04c9b1428128dc44be16216e1fe3a4352c06242c7` / 58 entries.

[Wrangler version inventory](production/rollback.json) confirms that both the current and rollback versions remain available. Operational rollback from this repository uses `npx wrangler rollback a79b4a3d-89ac-418e-b487-60433885219d`, followed by source/asset and browser verification against the retained `.5` receipt. It has not been invoked during this release.

## What changed

Picker, Position, Shows, all four Settings panes, Help, reset, renderer loading/recovery, application failure, static startup and presentation controls now share compact translucent styling. Desktop sheets anchor to the left/right edges. Phone and short-landscape sheets occupy at most 60 dynamic viewport percent and scroll internally. Fixed headers, close buttons and Settings tabs remain reachable. Giant serif headings, decorative borders, nested cards, long repeated introductions and solid gold action slabs are removed.

All ten styles, scene-coordinate drag/drop, sky burst versus terrace launch, saved preferences, separate renderer/quality choices, sound activation, presentation and recovery remain. Dialog focus wraps with Tab/Shift+Tab; Escape and close restore the invoking control. Panel pause ownership preserves manual pause. The picker disables native text selection so repeated text-origin drag is reliable. Resting playback layout, graphics engine and the authored sky/river/boat assets remain from the qualified galactic release.

[Per-surface plan](PLAN.md), [implementation details](IMPLEMENTATION.md), [qualified preview](PREVIEW.md), [22 original software UI captures](review.html), and [four actual WebGPU panel captures](hardware-captures/README.md) provide reviewable evidence.

## Verification

| Gate | Result |
| --- | --- |
| [Final PR runtime CI](https://github.com/samir1234khans/firecrackers/actions/runs/36723155776) | All four jobs passed: engine, desktop, mobile and recovery. Includes 144 units, build, logical simulation soak, audit and the new full panel suite. |
| [Final PR documentation CI](https://github.com/samir1234khans/firecrackers/actions/runs/36723155322) | Passed. |
| [Source-main runtime CI](https://github.com/samir1234khans/firecrackers/actions/runs/36725774279) | All four jobs passed: engine, desktop, mobile and recovery, against source-main ed54fe6. |
| [Source-main documentation CI](https://github.com/samir1234khans/firecrackers/actions/runs/36725772946) | Passed. |
| Local / isolated preview | 195 new panel, 167 existing regression, 56 native hardware and 17 HTTP checks passed. [Raw evidence and unsuccessful attempts](PREVIEW.md). |
| [Production HTTP/source/assets](production/http.json) | 17 passed; exact version/fingerprint/inventory and hashed assets match, no SPA asset fallbacks. |
| [Production hardware](production/hardware.json) | 56 passed; installed Chrome 154.0.8037.59 headless, no software GPU flags, nonfallback Intel WebGPU and hardware ANGLE WebGL asserted; zero application/GPU errors. |
| [Production browser suites](production/browser-suites.json) | 280 passed: new panels 195, Grand 42, original launch/offline/platform 28 and recovery 15. Exact 60-entry source asserted before and after every suite; zero unexpected errors. Bundled software graphics, viewport/touch emulation. |
| [Fresh automatic startup and real-time Festival](production/default-realtime.json) | Default automatic renderer selected WebGPU and Ultra; all eight authored assets active. Twelve 5-second samples over 60 seconds remained unpaused, WebGPU and Ultra; 10 launches/17 bursts, 3330 submitted render frames; no application errors. No freeze/advance calls or forced renderer parameter. This does not measure completed GPU frames. |

**353 production checks passed**, plus the separate 60-second live-clock observation. [Original raw reports and hashes](production/REPORTS.json), [exact-head PR CI metadata](production/ci-pr.json), [source-main CI metadata](production/ci-main.json). The panel suite records 17 deliberate startup/React/WebGL failure diagnostics separately; recovery retains its intentional fault injections. The native hardware suite deliberately removes the authored river to verify its playable fallback. These controlled cases are not unexpected production errors.

The initial PR CI failure and unsuccessful UI/hardware attempts are retained. Subsequent source fixes addressed demonstrated UI issues; fixture corrections preserved acceptance assertions. Headless installed Chrome isolates desktop input while still asserting nonfallback WebGPU and hardware ANGLE WebGL. No renderer or resource-budget change was used to pass these panel checks.

## Boundaries

Phone/tablet/touch, landscape, enlarged-text and zoom-equivalent checks are browser emulation on this PC. Physical Android/iPhone/Safari, thermal endurance, 95th-percentile GPU frame timing and photographic parity remain NOT TESTED. The screenshot gallery's Canvas scenes are UI evidence; actual WebGPU evidence is separately identified. Submitted render counts and deterministic stepped captures do not prove completed GPU frame rates. Intentional missing assets/context loss/React failures are recorded separately from unexpected errors.

Raw report manifests use LF-preserved JSON files; original PNGs are copied byte-for-byte. These evidence files and original asset masters remain outside the public web bundle.
