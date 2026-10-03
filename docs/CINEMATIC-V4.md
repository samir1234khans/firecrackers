# Cinematic Light & Atmosphere V4

Candidate source, based on main `a1202af5fa1955eab844988a1f1ff32299fb8579`.
Configuration `2026-10-03.3`. This is not a deployment or hardware qualification receipt.

## Implemented candidate

- A shared fixed-clock, bounded exposure response attenuates bright passages by at most 0.10 from the 0.95 baseline, with slower recovery. Reduced flashes reduces the response further. It does not brighten the night, change cadence, remove stars or claim to be a photometric eye model.
- Independent deterministic hashes add subtle shell asymmetry and drag variation within existing envelopes. Wind shear is shared by smoke and falling particles. Metal tails warm, whereas blue/green chemical emitters retain their palette identity.
- Twelve bounded analytic smoke volumes attenuate particles behind intervening smoke. Existing depth-bucket compositing remains; this is a soft approximation, not fluid ray marching. Distance haze and forward-scattered smoke rim light add depth without a new render target.
- Highlight-gated bloom, exactly one native output color transform and static sub-LSB dither preserve black levels. Ultra rough-water reflections add two narrow taps; Low/Standard retain the cheaper one-tap path and real Low mirror. The analytic moon path is unchanged.
- Optional native-camera motion for large shells is capped at 0.35 CSS pixels per axis. It is off by default, disabled by reduced motion, absent in transparent output, and honestly unavailable in flat Canvas rendering. No arcade shake or automatic motion opt-in.
- “Just watch” starts the existing finite show and enters immersion, without enabling sound. It remains available through Controls after the short startup hint disappears.
- Older saved recipes stay readable/exportable across engine versions. Playback remains version-strict; “Adapt a copy” is explicit and preserves the original. This prevents a version bump from making the entire local library inaccessible.
- Release fingerprints now enumerate all client source, build inputs and public assets, rather than omitting new feature directories. Format 3 states its exact source/config/assets scope; it is not a claim about unmeasured deployed bytes.

## Boundaries and remaining work

Main's 32-second Finale remains here. PR #33's 90-second music/choreography is a separate reconciliation target with its release hold intact. This PR does not silently include or release that held contract.

The authorized exact-main Cloudflare deployment attempt was blocked: existing `CLOUDFLARE_API_TOKEN` and account binding were unavailable to Actions. Production remains the observed `2026-10-02.3`; a successful guard workflow is not a successful deployment. Run `37140441096` preserves the receipt. No credentials, domains or production routes were changed.

The local managed browser rejected loopback navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; its policy was not changed. Browser validation uses the repository's GitHub Actions Chromium software-WebGL/Canvas environment, labelled separately from hardware/native WebGPU. Exact results belong in the PR receipt.

## Bounded physical-device qualification plan (unrun)

Use one physical Android phone and one iPhone/Safari, plus one desktop hardware WebGPU/WebGL device. Record model, OS/browser, exact release fingerprint, viewport, power state and initial thermal condition. Run on each device in isolation with no build or other benchmark concurrently: cold start, one Peony/Crossette/Finale, a two-minute highest-quantity show, pause/background/resume, rotation, and capture cleanup. End early on excessive heat, loss of responsiveness or user discomfort. No automatic retry or open-ended endurance run.

Record frame interval percentiles, input response, resource counts and visible quality/backend transitions against a matched baseline. Browser render submission time is not GPU completion, and emulated phone viewports are not physical-phone evidence. Agree device budgets before optimization; report misses rather than lowering targets after measurement. Formal combined-flash assessment, actual listening review and long thermal endurance remain separate.

## Verification

Run the complete `npm test`, typecheck/lint/build/docs and existing runtime matrix. The new nine focused unit tests cover exposure bounds, reduced-flash behavior, camera cleanup, fixed-clock pause/replay, seeded physics, family color preservation, intervening smoke, historical recipes and fingerprint discovery. `test:cinematic-v4` checks real UI actions at desktop and two phone sizes in forced WebGL/Canvas, and produces matched before/after captures from the exact previous main.
