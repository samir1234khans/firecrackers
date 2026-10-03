# V4 promotion and remaining release gates

**4 October 2026 update:** The owner authorized current-work reconciliation and main promotion. [PR #47](https://github.com/samir1234khans/firecrackers/pull/47) is merged as `e60d46443836d1f60bfb65f026dfc36eb5ba509c`, incorporating the musical scores with V4 and capture fixes. [Current main receipt](evidence/reconciliation-2026-10-04/MAIN.md). The earlier musical hold is lifted for main promotion only; production deployment and hardware/performance qualification remain held. The earlier V4/candidate history below is retained, not a claim that #47 is still unmerged.

## Promoted source

PR #46 was merged with a normal merge commit, preserving complete V4 and richer-night history. V4 promotion commit: `207fdc78a62129295e32876574809dd3f9fe4fdb`; reviewed candidate head: `5f49229d16ffe39f4cf9beb947b126ba96d6a994`; configuration `2026-10-03.3`. Later operational/documentation commits do not imply a new application version or deployment.

All five exact-candidate workflows passed: Runtime validation `37142964711`, Full night `37142964509`, richer experience `37142964608`, Cinematic V4 `37142964520`, documentation `37142964528`. This includes 342 unit tests and the desktop/phone-emulated Chromium software-WebGL/Canvas browser matrices. The six V4 journeys passed with no page/console errors. Matched and phone PNGs were inspected separately from machine assertions. Evidence artifact `11280634954`, ZIP SHA-256 `74378c1e1f1dab57851991fdf124fcb6c6c1da0019bc03a4dc169e4d6757b3d3`.

Push checks on the actual main merge are separate; consult the latest main Actions results before deploying. This document is not a public-site or physical-device qualification.

## Musical integration remains separately held

Draft PR #47 continues `reconcile/cinematic-shows-v4`. It retains V4 and the original PR #33 ancestry, 18 original music assets, the shared show clock, themed Encore and current composer/capture interfaces. The obsolete writable integration workflow was removed. Initial cleaned candidate `facf280b9a7464c06d373c5e7a9de1c945096d12` passed 354 units, TypeScript/lint/build, 1,117 documentation checks, a zero-vulnerability audit and four combined theme/consent/pause/capture browser journeys in run `37145137988`. Subsequent stronger exported-media checks and their exact final results are tracked in PR #47; earlier green checks must not be attributed to a newer untested commit.

Original PR #33, `codex/cinematic-shows`, and its explicit release hold are unchanged. Do not merge PR #47 by ancestry as a workaround for that hold. Physical Android/iPhone/Safari, native GPU/thermal, matched listening and formal flash qualification remain distinct from software-runner CI. The bounded device plan is in [CINEMATIC-V4.md](CINEMATIC-V4.md).

## Cloudflare release attempt: blocked, not deployed

Guard run `37145450847` checked the exact V4 main commit. Its receipt reports that both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` bindings were unavailable. Main runtime validation was still in progress at that preflight. The public `/release.json` request returned HTTP 403 from the runner, so current public bytes were not verified.

The guard job succeeded in recording the blocker, but its build, authentication, deploy and public browser steps were skipped. No Cloudflare Worker, production route or domain was changed. Receipt artifact `11281529361`, ZIP SHA-256 `0e550987a82feaa7f97bd09affd698402e8f747b183f394a896844df05d7bee4`. Historical documentation's last observed public version is `2026-10-02.3`, not a freshly verified live version.

## Ready-to-use manual release path

The `Verified Cloudflare release` workflow is manual-only on main. There is no timer, push deployment, automatic retry or scheduled background work. It fails a requested deployment when its gates are unresolved and always retains a receipt.

1. Configure the scoped `CLOUDFLARE_API_TOKEN` repository Actions secret and `CLOUDFLARE_ACCOUNT_ID` secret or repository variable using authorized settings. Never paste token values into chat, source or evidence.
2. Resolve authorized access for the runner to read the existing production `/release.json`; do not bypass an access policy. Complete applicable device/visual release review separately.
3. Verify main's full Runtime and Documentation push checks. Run the workflow from main with the current full 40-character main SHA and `deploy=false` for a non-mutating preflight.
4. With explicit release authorization, run the same exact SHA with `deploy=true`. The workflow rechecks main, builds that source, authenticates, records prior Worker deployment/version IDs, publishes to the existing configured Worker, then verifies version/fingerprint/modules and public browser flows. A changed main or unresolved check stops publication.
5. Inspect the receipt: `preflight.json` is not a release success. A deployment log/source marker proves publication was attempted/completed; `SUCCESS.txt` plus the matching public fingerprint and browser evidence proves those post-deploy checks passed. Keep rollback IDs and failures. No automatic rollback is performed.

Workflow availability does not remove the credential/access/device gates or clear PR #33's hold. A Vercel build status is not proof that the Cloudflare custom-domain site has been updated.
