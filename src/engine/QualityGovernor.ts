import type { Quality } from './catalog';
/** Bounded samples and asymmetric hysteresis; decisions are based on actual render cadence. */
export class QualityGovernor {
    private readonly samples = new Float32Array(180);
    private count = 0;
    private cursor = 0;
    private bad = 0;
    private good = 0;
    median = 0;
    p95 = 0;
    fps = 0;
    add(ms: number) {
        if (!Number.isFinite(ms) || ms <= 0 || ms > 300)
            return;
        this.samples[this.cursor++ % this.samples.length] = ms;
        this.count = Math.min(this.count + 1, this.samples.length);
    }
    evaluate(current: Quality, targetFps: number, automatic: boolean): Quality {
        if (this.count < 30)
            return current;
        const values = Array.from(this.samples.subarray(0, this.count)).sort((a, b) => a - b);
        this.median = values[Math.floor(values.length * .5)];
        this.p95 = values[Math.floor(values.length * .95)];
        this.fps = 1000 / (values.reduce((a, b) => a + b, 0) / values.length);
        if (!automatic) {
            this.bad = 0;
            this.good = 0;
            return current;
        }
        const budget = 1000 / targetFps;
        this.bad = this.p95 > budget * 1.55 ? this.bad + 1 : 0;
        this.good = this.p95 < budget * 1.13 ? this.good + 1 : 0;
        if (current !== 'low' && this.bad >= 3) {
            this.bad = 0;
            this.good = 0;
            return 'low';
        }
        if (current === 'low' && this.good >= 20) {
            this.bad = 0;
            this.good = 0;
            return 'standard';
        }
        return current;
    }
}
