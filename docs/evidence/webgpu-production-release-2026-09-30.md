# WebGPU production release — 30 September 2026

- Domain: https://firecrackers.mainandmany.com/
- Build: `2026-09-30.1`.
- Application main commit: `f10a441896fc5f41f1965759f3d5e9e2bdee900b`, [PR #15](https://github.com/samir1234khans/firecrackers/pull/15).
- Production Worker: `d5143fe3-0290-44b2-ac2d-bff384963d33`.
- Previous Worker for rollback: `9d06f53e-0584-415d-8d4d-41beedfa4a04`.
- Public release fingerprint: `1e9598a54640f443c26d2846f43467ccfdce8a99bafdb98662049cb2c71bbd51`, 50 entries, matches local and Cloudflare preview.
- Deployment command: `npm run cloudflare:deploy` from clean main.
- [Release CI](https://github.com/samir1234khans/firecrackers/actions/runs/36641349140): engine, desktop, mobile and recovery jobs all passed. Includes 128 unit tests, build, audit, documentation and accelerated logical soak.
- [Public hardware WebGPU report](webgpu-startup-2026-09-30/production-report.json): six checks pass, zero application/GPU errors. All assets active, real-time launch, three deterministic composition captures, cleanup and same-quality recovery.

The hardware adapter reported by installed Chrome was Intel gen-12lp, fallback false. NVIDIA and 15-minute thermal endurance remain unqualified. Mobile CI is emulation, not physical-phone evidence. [Diagnosis and next graphics roadmap](webgpu-startup-2026-09-30.md).

Open [WebGPU](https://firecrackers.mainandmany.com/?backend=webgpu), then confirm Active renderer: WebGPU in Settings. Saved Low quality is preserved; select Ultra to restore maximum quality. WebGPU requests may fall back on unsupported devices, and Settings reports the renderer actually used. [WebGL](https://firecrackers.mainandmany.com/?backend=webgl) remains available with the same quality choices.

## Public regression evidence

[Grand Collection](webgpu-startup-2026-09-30/public-grand.json): 42 checks. [Original flow](webgpu-startup-2026-09-30/public-flow.json): 28 checks. [Recovery](webgpu-startup-2026-09-30/public-recovery.json): 15 checks. All passed. These suites use software graphics/emulated viewports and are separate from the hardware WebGPU report above.
