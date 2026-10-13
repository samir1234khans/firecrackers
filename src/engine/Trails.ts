/** A trail segment owns endpoint copies, never an index into the compacting head pool. */
export class Trails {
    count = 0;
    readonly ax: Float32Array;
    readonly ay: Float32Array;
    readonly az: Float32Array;
    readonly bx: Float32Array;
    readonly by: Float32Array;
    readonly bz: Float32Array;
    readonly age: Float32Array;
    readonly life: Float32Array;
    readonly width: Float32Array;
    readonly r: Float32Array;
    readonly g: Float32Array;
    readonly b: Float32Array;
    readonly owner: Uint32Array;
    readonly family: Uint8Array;
    /** Authored comet strokes hold their endpoints while cooling; ordinary trails still drift. */
    readonly anchored: Uint8Array;
    /** 0 ordinary, 1 authored invitation lettering, 2 temporary guest light. */
    readonly kind: Uint8Array;
    private readonly arrays: Float32Array[];
    constructor(readonly capacity = 24000) {
        const a = () => new Float32Array(capacity);
        this.ax = a();
        this.ay = a();
        this.az = a();
        this.bx = a();
        this.by = a();
        this.bz = a();
        this.age = a();
        this.life = a();
        this.width = a();
        this.r = a();
        this.g = a();
        this.b = a();
        this.owner = new Uint32Array(capacity);
        this.family = new Uint8Array(capacity);
        this.anchored = new Uint8Array(capacity);
        this.kind = new Uint8Array(capacity);
        this.arrays = [this.ax, this.ay, this.az, this.bx, this.by, this.bz, this.age, this.life, this.width, this.r, this.g, this.b];
    }
    add(ax: number, ay: number, az: number, bx: number, by: number, bz: number, life: number, width: number, r: number, g: number, b: number, owner: number, family: number, limit = this.capacity, anchored = false, hold = false, kind = 0) {
        if (this.count >= Math.min(limit, this.capacity) || life <= 0 || !Number.isFinite(ax + ay + az + bx + by + bz + life + width + r + g + b))
            return false;
        const i = this.count++;
        this.ax[i] = ax;
        this.ay[i] = ay;
        this.az[i] = az;
        this.bx[i] = bx;
        this.by[i] = by;
        this.bz[i] = bz;
        this.age[i] = 0;
        this.life[i] = life;
        this.width[i] = width;
        this.r[i] = r;
        this.g[i] = g;
        this.b[i] = b;
        this.owner[i] = owner;
        this.family[i] = family;
        this.anchored[i] = anchored ? (hold ? 2 : 1) : 0;
        this.kind[i] = kind;
        return true;
    }
    advance(dt: number, wind: number) {
        for (let i = this.count - 1; i >= 0; i--) {
            this.age[i] = this.anchored[i] === 2 ? Math.min(this.life[i] * .7, this.age[i] + dt) : this.age[i] + dt;
            if (this.age[i] >= this.life[i]) {
                this.remove(i);
                continue;
            }
            if (this.anchored[i]) continue;
            const dx = wind * dt * 0.035;
            this.ax[i] += dx;
            this.bx[i] += dx;
            this.ay[i] -= dt * 0.12;
            this.by[i] -= dt * 0.12;
        }
    }
    remove(i: number) {
        const last = --this.count;
        if (i !== last) {
            for (const a of this.arrays)
                a[i] = a[last];
            this.owner[i] = this.owner[last];
            this.family[i] = this.family[last];
            this.anchored[i] = this.anchored[last];
            this.kind[i] = this.kind[last];
        }
    }
    clear() { this.count = 0; }
}
