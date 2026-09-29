# Branch reconciliation and Cloudflare republish — 30 September 2026 IST

The owner asked to promote all useful branch work to `main` and publish the latest application at [firecrackers.mainandmany.com](https://firecrackers.mainandmany.com/). The audit fetched and compared every remote branch with `origin/main` at `5353c7100ea813ee8f83e6c72acc5fe207acc8f7`. The canonical checkout was clean, and Git listed no other worktrees before this isolated validation checkout was created.

## Branch disposition

- **15 of 16 remote topic branches are ancestors of main**, including the Cloudflare deployment, Grand Collection, waterfront, realism, direct shelves, placed drag launch, graphics recovery, their production receipts, and the earlier ignition and viewability fixes. PRs #1 and #3–#13 supplied those changes to main. No cherry-pick or merge was needed.
- The only non-ancestor branch, `feat/fireworks-v1-implementation` (`16d9d1d`), has seven commits from the early five-effect implementation. Its unique tree adds the older `src/App.tsx`, five JavaScript engine/platform files, and `src/ui/components.tsx` from base `7603a2c`. Current main already provides the relevant simulation, graphics fallback, audio, settings, recovery, fullscreen, wake lock, and preferences through its newer ten-effect TypeScript modules. Its older hold-oriented runtime is a historical alternative, so it was preserved without importing it over the current app.
- Open PR #2 targets the older `feat/fireworks-v1` branch. Its head `fix/ignition-reliability` is already an ancestor of main; its open state does not represent missing application code.

The result of reconciliation is **no missing feature commit to promote**. Main remains the latest reviewed application source; branches remain available for history.

## Clean-main validation and deployment

An isolated checkout at main `5353c71` avoided a Windows file lock held by pre-existing local Vite processes. `npm ci`, typecheck, lint, all **128** unit/engine tests, build, **431** documentation checks, and `npm audit --audit-level=high` (zero vulnerabilities) passed. The 7,200-second accelerated logical soak passed with 1,317 launches and 2,875 bursts; it is not physical GPU endurance evidence. Wrangler 4.143.0 dry run passed.

The build generated version `2026-09-29.6` and 50-entry SHA-256 fingerprint `e05400864811cb02531e7dfa4a4de24c52106c6b92b4ec908392a6f5e7261534`. `npm run cloudflare:deploy` published that clean-main build to the configured `firecrackers` Worker and custom domain on 29 September 2026 UTC. **Current Worker version:** `9d06f53e-0584-415d-8d4d-41beedfa4a04`. Wrangler reported no changed asset files to upload, consistent with the unchanged application fingerprint. The preceding `.6` Worker version `e5691b68-1c68-4392-b749-22c5f9f5e6bc` remains the immediate rollback reference; the `.5` version is recorded in the [previous release receipt](graphics-recovery-production-release-2026-09-29.md).

The public HTML, release manifest, web manifest, service worker, rocket GLB, terrace GLB, and smoke atlas each returned HTTP 200. Public `/release.json` matched the local 50-entry fingerprint. Browser checks against the actual custom domain passed with zero unexpected application errors:

| Suite | Passed | Report |
| --- | ---: | --- |
| Six-zone stage, drag, authored assets, reflection and controls | 34 | [stage](branch-reconciliation-2026-09-30/stage-report.json) |
| Ten-effect Grand Collection on desktop/mobile WebGL and Canvas | 42 | [collection](branch-reconciliation-2026-09-30/grand-report.json) |
| Original launch, shows, offline reload and platform behavior | 28 | [playback](branch-reconciliation-2026-09-30/flow-report.json) |
| Viewability and recovery | 15 | [recovery](branch-reconciliation-2026-09-30/recovery-report.json) |

The independent art-loading test and five graphics-overload recovery checks also passed against the public site. These browser runs use Chromium with software graphics and mobile emulation. They do not establish iPhone Safari, physical flagship frame rate, WebGPU hardware behavior, or thermal endurance.
