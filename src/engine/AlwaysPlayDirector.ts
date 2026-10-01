import { randomStream } from './catalog.js';

export type AlwaysPace = 1 | 2 | 3 | 4;
export const PACE_LABELS = ['Low', 'Medium', 'High', 'Super High'] as const;
export const paceValue = (value: unknown): AlwaysPace => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4 ? value as AlwaysPace : 2;
const INTERVALS = [7.2, 3.15, 1.35, .82];
const FEATURE_GAPS = [8, 6, 7, 6];
const HEAVY_GAPS = [20, 15, 10, 8];

/** Fixed-size, fixed-clock choreography. Admission owns the launch/placement RNGs. */
export class AlwaysPlayDirector {
    pace: AlwaysPace = 2;
    interval = INTERVALS[1];
    next = 0;
    family = -1;
    feature = false;
    admitted = 0;
    denied = 0;
    expired = 0;
    limited = false;
    pressure = 0;
    demand = 1;
    readonly counts = new Uint32Array(13);
    private readonly denialReasons = new Uint32Array(3);
    private readonly bag = new Uint8Array(13);
    private readonly samples = new Float32Array(120);
    private readonly sorted = new Float32Array(120);
    private sampleCount = 0;
    private sampleIndex = 0;
    private slowSince = -1;
    private healthySince = -1;
    private lastFeedback = -1;
    private cursor = 13;
    private nextFeature = 0;
    private lastHeavy = -100;
    private previous = -1;
    private phrase = 0;
    private nextRest = 0;
    private pendingSince = 0;
    private rand: () => number;
    constructor(private readonly seed: number) { this.rand = randomStream(seed ^ 0x73cf41b5); }
    reset(time: number) {
        this.rand = randomStream(this.seed ^ 0x73cf41b5);
        this.interval = INTERVALS[this.pace - 1];
        this.next = time + .5; this.nextFeature = time; this.nextRest = time + 30 + this.rand() * 15;
        this.cursor = 13; this.family = -1; this.lastHeavy = -100; this.previous = -1; this.phrase = 0;
        this.admitted = this.denied = this.expired = this.pressure = 0; this.counts.fill(0); this.denialReasons.fill(0);
        this.demand = 1; this.limited = false; this.sampleCount = this.sampleIndex = 0;
        this.slowSince = this.healthySince = this.lastFeedback = -1;
    }
    setPace(value: unknown) { this.pace = paceValue(value); }
    tick(dt: number) { this.interval += (INTERVALS[this.pace - 1] - this.interval) * (1 - Math.exp(-dt / 1.1)); }
    private refill() {
        for (let i = 0; i < 13; i++) this.bag[i] = i;
        for (let i = 12; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); const v = this.bag[i]; this.bag[i] = this.bag[j]; this.bag[j] = v; }
        if (this.bag[0] === this.previous) { const v = this.bag[0]; this.bag[0] = this.bag[1]; this.bag[1] = v; }
        this.cursor = 0;
    }
    choose(time: number): number {
        if (time < this.next) return -1;
        if (this.family >= 0) return this.family;
        this.feature = time >= this.nextFeature;
        if (this.feature) {
            if (this.cursor >= 13) this.refill();
            this.family = this.bag[this.cursor];
            if (this.family === this.previous || this.family >= 4 && time < this.lastHeavy + HEAVY_GAPS[this.pace - 1]) {
                this.feature = false;
                let connector = Math.floor(this.rand() * 4);
                if (connector === this.previous) connector = (connector + 1) % 4;
                this.family = connector;
            }
        } else {
            let pick = Math.floor(this.rand() * 4);
            if (pick === this.previous) pick = (pick + 1) % 4;
            this.family = pick;
        }
        this.pendingSince = time;
        return this.family;
    }
    result(time: number, admitted: boolean, pressure: number, reducedFlashes: boolean, denialReason: 0 | 1 | 2 = 0) {
        this.pressure = pressure;
        this.limited = reducedFlashes || this.demand > 1 || pressure >= .75 || !admitted;
        if (!admitted) {
            this.denied++; this.denialReasons[denialReason]++;
            if (!this.feature && time - this.pendingSince > 2) { this.expired++; this.family = -1; }
            this.next = time + .5 + this.rand() * .25;
            return;
        }
        this.admitted++; this.counts[this.family]++; this.previous = this.family;
        if (this.family >= 4) this.lastHeavy = time;
        if (this.feature) { this.cursor++; this.nextFeature = time + FEATURE_GAPS[this.pace - 1]; }
        this.family = -1;
        let spacing = Math.max(.75, this.interval * (.85 + this.rand() * .30) * this.demand);
        if (pressure >= .75) spacing *= 1.35;
        this.phrase = (this.phrase + 1) % (this.pace === 4 ? 3 : this.pace === 3 ? 2 : 1);
        if (this.pace >= 3) spacing *= this.phrase === 0 ? 1.12 : .94;
        if (time >= this.nextRest) { spacing *= 1.8; this.nextRest = time + 30 + this.rand() * 15; }
        this.next = time + Math.max(reducedFlashes ? 3 : .75, spacing);
    }
    /** Timestamped renderer feedback is replayable; no wall-clock or extra loop. */
    observe(time: number, ms: number, continuous: boolean) {
        if (!continuous || !Number.isFinite(ms) || ms <= 0 || ms >= 500 || this.lastFeedback >= 0 && time - this.lastFeedback > .5) {
            this.sampleCount = this.sampleIndex = 0; this.slowSince = this.healthySince = -1;
        }
        this.lastFeedback = time;
        if (!continuous || !Number.isFinite(ms) || ms <= 0 || ms >= 500) return;
        this.samples[this.sampleIndex] = ms; this.sampleIndex = (this.sampleIndex + 1) % 120;
        this.sampleCount = Math.min(120, this.sampleCount + 1);
        if (this.sampleCount < 60 || this.sampleIndex % 30 !== 0) return;
        this.sorted.fill(0); for (let i = 0; i < this.sampleCount; i++) this.sorted[i] = this.samples[i]; this.sorted.sort();
        const p95 = this.sorted[120 - this.sampleCount + Math.floor((this.sampleCount - 1) * .95)];
        if (p95 > 35) {
            this.healthySince = -1; if (this.slowSince < 0) this.slowSince = time;
            if (time - this.slowSince >= 2) { this.demand = Math.min(3, this.demand * 1.15); this.slowSince = time; }
        } else if (p95 < 34) {
            this.slowSince = -1; if (this.healthySince < 0) this.healthySince = time;
            if (time - this.healthySince >= 10) { this.demand = Math.max(1, this.demand / 1.15); this.healthySince = time; }
        } else { this.slowSince = this.healthySince = -1; }
    }
    snapshot() {
        return { pace: this.pace, interval: this.interval, demand: this.demand, next: this.next, pending: this.family,
            feature: this.feature, phrase: this.phrase, admitted: this.admitted, denied: this.denied, expired: this.expired,
            counts: Array.from(this.counts), deniedCapacity: this.denialReasons[0], deniedHeadroom: this.denialReasons[1], deniedPressure: this.denialReasons[2], limited: this.limited, pressure: this.pressure, bufferCapacity: 13, feedbackCapacity: 120 };
    }
}
