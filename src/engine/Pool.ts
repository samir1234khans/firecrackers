/** Dense bounded arrays. Stable IDs and previous sample positions move with compaction. */
export class Pool {
    count = 0;
    private nextId = 1;
    readonly id: Uint32Array;
    readonly x: Float32Array;
    readonly y: Float32Array;
    readonly z: Float32Array;
    readonly px: Float32Array;
    readonly py: Float32Array;
    readonly pz: Float32Array;
    readonly vx: Float32Array;
    readonly vy: Float32Array;
    readonly vz: Float32Array;
    readonly age: Float32Array;
    readonly life: Float32Array;
    readonly r: Float32Array;
    readonly g: Float32Array;
    readonly b: Float32Array;
    readonly size: Float32Array;
    readonly stretch: Float32Array;
    readonly angle: Float32Array;
    readonly drag: Float32Array;
    readonly gravity: Float32Array;
    readonly trail: Float32Array;
    readonly carry: Float32Array;
    readonly split: Float32Array;
    readonly family: Float32Array;
    private readonly arrays: Float32Array[];
    constructor(readonly capacity: number) {
        const a = () => new Float32Array(capacity);
        this.id = new Uint32Array(capacity);
        this.x = a();
        this.y = a();
        this.z = a();
        this.px = a();
        this.py = a();
        this.pz = a();
        this.vx = a();
        this.vy = a();
        this.vz = a();
        this.age = a();
        this.life = a();
        this.r = a();
        this.g = a();
        this.b = a();
        this.size = a();
        this.stretch = a();
        this.angle = a();
        this.drag = a();
        this.gravity = a();
        this.trail = a();
        this.carry = a();
        this.split = a();
        this.family = a();
        this.arrays = [this.x, this.y, this.z, this.px, this.py, this.pz, this.vx, this.vy, this.vz, this.age, this.life, this.r, this.g, this.b, this.size, this.stretch, this.angle, this.drag, this.gravity, this.trail, this.carry, this.split, this.family];
    }
    add(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, r: number, g: number, b: number, size: number, drag = 0.4, gravity = 2, trail = 0, split = 0, family = 0) {
        if (this.count >= this.capacity || !Number.isFinite(x + y + z + vx + vy + vz + life + r + g + b + size + drag + gravity + trail + split + family) || life <= 0)
            return -1;
        const i = this.count++;
        this.id[i] = this.nextId++;
        this.x[i] = this.px[i] = x;
        this.y[i] = this.py[i] = y;
        this.z[i] = this.pz[i] = z;
        this.vx[i] = vx;
        this.vy[i] = vy;
        this.vz[i] = vz;
        this.age[i] = 0;
        this.life[i] = life;
        this.r[i] = r;
        this.g[i] = g;
        this.b[i] = b;
        this.size[i] = size;
        this.stretch[i] = size;
        this.angle[i] = 0;
        this.drag[i] = drag;
        this.gravity[i] = gravity;
        this.trail[i] = trail;
        this.carry[i] = 0;
        this.split[i] = split;
        this.family[i] = family;
        return i;
    }
    remove(i: number) {
        if (!Number.isInteger(i) || i < 0 || i >= this.count)
            return;
        const last = --this.count;
        if (i !== last) {
            for (const a of this.arrays)
                a[i] = a[last];
            this.id[i] = this.id[last];
        }
    }
    clear() { this.count = 0; this.nextId = 1; }
}
