# Latest production reconciliation — 1 October 2026

The user authorized reconciliation, promotion to main and production deployment. Production now serves build **2026-10-01.4**, including the moon/water work, thirteen fireworks, open-sky controls, responsive launch support, moon startup sequence and burst-transition performance fix.

## Source and deployment

- Production: https://firecrackers.mainandmany.com/
- Isolated candidate: https://firecrackers-burst-preview.allygym-api.workers.dev/
- Runtime source on main: `8b491d2528b251d9e57d7326ba5ea42e36fbb271`, merged through PR #29.
- Cloudflare Worker version: `57796211-f2a8-4fc1-8381-4c9235bfb5bd`.
- Source/art/audio fingerprint: `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51` (80 entries).
- Deployment command: `npm run cloudflare:deploy`, using pinned Node 22.16.0 from the clean canonical main checkout.

The generated release manifest reproduced the candidate fingerprint. All 30 emitted files matched production HTTP bytes. Documentation added after deployment does not change this runtime fingerprint.

## Branch reconciliation

Fetched all remotes and audited 64 local/remote refs; see [refs.json](refs.json). Current feature, fix and documentation branches are already ancestors of main. This includes moon/water PR #25, signatures PR #26, open-sky/loading PR #27, promotion documentation PR #28 and performance PR #29.

The sole divergent historical branch, `origin/feat/fireworks-v1-implementation`, retains seven commits from an alternate five-effect JavaScript implementation (head `16d9d1d8056ff6cb1d47b7fff92c3731395efdce`). Its competing application and engine are not successors to the current thirteen-effect TypeScript runtime. Comparison found no missing current capability requiring promotion. The branch remains available; it was not merged over the current application. The old open PR #2 also has a head already contained in main.

Both the canonical checkout and the separate `firecrackers-galactic` documentation worktree were clean at reconciliation. Branches and worktrees were preserved. No reset, force push or branch deletion was used.

## Validation

PR #29 runtime CI [36803647067](https://github.com/samir1234khans/firecrackers/actions/runs/36803647067) and main runtime CI [36805233007](https://github.com/samir1234khans/firecrackers/actions/runs/36805233007) passed all four jobs. Main documentation CI [36805232477](https://github.com/samir1234khans/firecrackers/actions/runs/36805232477) passed. Source validation includes 217 unit tests, lint/build and the required browser and soak gates.

The following checks ran against the actual public production URL after deployment:

| Suite | Passed | Evidence |
| --- | ---: | --- |
| HTTP asset parity and fresh default startup | 32 | [http-startup.json](http-startup.json) |
| Signature stages, interactions and hardware backends | 47 | [flagship.json](flagship.json) |
| Grand Collection desktop/mobile regression | 42 | [grand.json](grand.json) |
| Original launch, platform and offline flows | 28 | [original.json](original.json) |
| Stage layout, interaction, panels, sound and rotation | 106 | [stage.json](stage.json) |
| Viewability, blocked loading and renderer recovery | 15 | [recovery.json](recovery.json) |
| **Total** | **270** | **No failed checks or unexpected runtime errors** |

Hardware coverage uses installed Chrome with native non-fallback WebGPU, forced hardware WebGL and Canvas. Other browser suites also exercise software WebGL. Viewports include 320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800, 1920×1080 and breakpoint widths 679/680. Default startup tests use fresh sessions without QA flags. Coverage includes tap, sky and terrace drag, cancellation, keyboard, pause ownership, focus, reset, simulated safe insets/browser-bar resize, CSS reflow at 200%, sound activation and offline reload.

## Performance and visual evidence

The performance fix preserves a stable scene-light count through rocket fade/reappearance, removing shader recompilation at launch/burst transitions. Paired local Chrome Ultra measurements reduced worst first/repeated frame gaps from 554/150 ms to 17/13 ms on WebGPU and 879/363 ms to 25/25 ms on WebGL. These are local paired measurements, not universal device guarantees. The source performance receipt and profiles remain in [burst-performance-2026-10-01](../burst-performance-2026-10-01/).

Actual production captures below use native WebGPU, seed 20260916 and emulated viewports. Both were visually inspected. They show the retained moon, waterfront, water, launch support and transparent collection alongside the new effects.

- [Desktop Imperial Crown, 1280×800, burst +4.2 s](captures/desktop-crown.png).
- [Phone Royal Phoenix, 393×851, burst +3.1 s](captures/phone-phoenix.png).
- Existing matched candidate captures remain in [flagships-2026-10-01](../flagships-2026-10-01/).

Physical phones, Safari, actual mobile browser chrome, OS-level 200% zoom, sustained thermal performance and completed GPU timing qualification remain untested. Emulated layouts and CPU/frame-gap measurements do not establish those results.

## Rollback

Previous production build `2026-09-30.8`, Worker version `5a577d62-1deb-4770-b780-784d03574c7a`, remains available. Its fingerprint is `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. See the sanitized [worker version inventory](worker-versions.json).

If rollback is required, use `npx wrangler rollback 5a577d62-1deb-4770-b780-784d03574c7a` from the canonical repository. Rollback was not invoked. Earlier production receipts retain their historical release facts.
