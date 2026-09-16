import { BUDGETS, FAMILIES, clamp, familyIndex, hash01, randomStream } from './catalog.js';
import type { FamilyId, Quality, ShowPreset } from './catalog.js';
import { Pool } from './Pool.js';
import { Trails } from './Trails.js';
export type SimEvent = {
    id: number;
    time: number;
    type: 'fuse' | 'launch' | 'burst' | 'crackle';
    x: number;
    y: number;
    z: number;
    family: number;
    strength: number;
    duration?: number;
};
export type Rocket = {
    id: number;
    family: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    px: number;
    py: number;
    pz: number;
    ground: number;
    top: number;
    age: number;
    fuse: number;
    ascent: number;
    thrust: number;
    acceleration: number;
    phase: 'fuse' | 'thrust' | 'coast' | 'afterglow';
    stage: 'fuse' | 'ascent' | 'afterglow';
    cost: number;
    seed: number;
    reserve: number;
};
export type Carrier = {
    id: number;
    at: number;
    family: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    scale: number;
    seed: number;
    reserve: number;
};
export type Light = {
    x: number;
    y: number;
    z: number;
    age: number;
    r: number;
    g: number;
    b: number;
    strength: number;
};
/** One bounded 60 Hz virtual-world clock. The viewport never changes airborne physics. */
export class Simulation {
    readonly heads = new Pool(3072);
    readonly trails = new Trails(24000);
    readonly smoke = new Pool(96);
    rockets: Rocket[] = [];
    cues: Carrier[] = [];
    lights: Light[] = [];
    events: SimEvent[] = [];
    time = 0;
    paused = false;
    selected: FamilyId = 'gold-willow';
    placement = 0.5;
    prepared = true;
    holding = false;
    holdProgress = 0;
    show: ShowPreset | null = null;
    launched = 0;
    bursts = 0;
    quality: Quality = 'standard';
    reducedFlashes = true;
    width = 160;
    ground = 16;
    protectCenter = false;
    safeRect: [
        number,
        number,
        number,
        number
    ] = [.32, .25, .68, .72];
    message = 'Choose a firework. Make the night yours.';
    launchSpan = 110;
    private accumulator = 0;
    private nextCue = 0;
    private showStart = 0;
    private previousFamily = -1;
    private sequence = 0;
    private nextObjectId = 1;
    private launchRng: () => number;
    private showRng: () => number;
    private smokeRng: () => number;
    constructor(readonly seed = 20260916) {
        this.launchRng = randomStream(seed);
        this.showRng = randomStream(seed ^ 0x5bf03635);
        this.smokeRng = randomStream(seed ^ 0x34167829);
    }
    get activeUnits() { return this.rockets.reduce((n, r) => n + r.cost, 0); }
    get ready() { return this.prepared && !this.paused && !this.rockets.some(r => r.stage === 'fuse'); }
    get smallScale() { return 1; }
    get wind() { return 0.85 + Math.sin(this.time * 0.12) * 0.24; }
    get phase() { return this.holding ? 'contact' : this.rockets[this.rockets.length - 1]?.phase || 'ready'; }
    placementToX(value = this.placement) { return (clamp(value, 0.2, 0.8) - 0.5) * this.launchSpan; }
    setViewport(width: number, _ground: number) { this.launchSpan = clamp(width, 65, 160); }
    setPlacement(value: number) { if (!this.holding && this.ready)
        this.placement = clamp(value, 0.2, 0.8); }
    select(id: FamilyId) {
        this.stopShow(false);
        if (this.rockets.some(r => r.stage === 'fuse')) {
            this.message = 'Let this fuse finish.';
            return false;
        }
        this.cancelHold();
        this.selected = FAMILIES[familyIndex(id)].id;
        this.prepared = true;
        this.message = FAMILIES[familyIndex(id)].note;
        return true;
    }
    beginHold() {
        if (!this.ready)
            return false;
        this.stopShow(false);
        this.holding = true;
        this.holdProgress = 0;
        return true;
    }
    cancelHold() { this.holding = false; this.holdProgress = 0; }
    private get futureHeads() {
        let n = this.rockets.reduce((sum, r) => sum + (r.stage === 'afterglow' ? 0 : r.reserve), 0);
        n += this.cues.reduce((sum, c) => sum + c.reserve, 0);
        for (let i = 0; i < this.heads.count; i++)
            if (this.heads.split[i] > 0)
                n += 3;
        return n;
    }
    ignite(source: 'manual' | 'auto' = 'manual', family = familyIndex(this.selected), placement = this.placement) {
        if (source === 'manual')
            this.stopShow(false);
        if (this.paused || (source === 'manual' && !this.ready))
            return false;
        const f = FAMILIES[family];
        const reserve = family === 4 ? 900 : family === 3 ? 160 : Math.ceil((f?.count || 0) * 1.2);
        if (!f || this.activeUnits + f.cost > BUDGETS[this.quality].units || this.heads.count + this.futureHeads + reserve > this.heads.capacity) {
            this.cancelHold();
            this.message = 'Let this burst finish, then light another.';
            return false;
        }
        const rand = this.launchRng;
        const x = this.placementToX(placement), top = 70 + rand() * 7;
        const ascent = f.ascent + (rand() - 0.5) * 0.16;
        const thrust = ascent * 0.34, coast = ascent - thrust, gravity = 8;
        const acceleration = (top - this.ground + 0.5 * gravity * coast * coast) / (0.5 * thrust * thrust + thrust * coast);
        const rocket: Rocket = {
            id: this.nextObjectId++, family, x, y: this.ground, z: 0, px: x, py: this.ground, pz: 0,
            vx: (rand() - 0.5) * 1.6, vy: 0, vz: -2.2 - rand() * 1.6, ground: this.ground, top, age: 0,
            fuse: 1.5 + rand(), ascent, thrust, acceleration, phase: 'fuse', stage: 'fuse',
            cost: f.cost, seed: Math.floor(rand() * 0xffffffff), reserve,
        };
        this.rockets.push(rocket);
        this.emit('fuse', x, this.ground, 0, family, 0.5, rocket.fuse);
        if (source === 'manual') {
            this.prepared = false;
            this.message = 'Fuse lit. Watch the sky.';
        }
        this.cancelHold();
        return true;
    }
    setPaused(value: boolean) {
        this.paused = value;
        this.accumulator = 0;
        this.cancelHold();
        if (value)
            this.events = [];
    }
    startShow(preset: ShowPreset) {
        this.cancelHold();
        this.paused = false;
        this.show = preset;
        this.showStart = this.time;
        this.nextCue = this.time + 0.5;
        this.message = preset === 'finale' ? 'A finale, then a quiet sky.' : 'The night is in good hands.';
    }
    stopShow(announce = true) {
        if (this.show && announce)
            this.message = 'Automatic show stopped. The sky is yours.';
        this.show = null;
    }
    reset() {
        this.heads.clear();
        this.trails.clear();
        this.smoke.clear();
        this.rockets = [];
        this.cues = [];
        this.lights = [];
        this.events = [];
        this.time = 0;
        this.accumulator = 0;
        this.paused = false;
        this.show = null;
        this.launched = 0;
        this.bursts = 0;
        this.sequence = 0;
        this.nextObjectId = 1;
        this.launchRng = randomStream(this.seed);
        this.showRng = randomStream(this.seed ^ 0x5bf03635);
        this.smokeRng = randomStream(this.seed ^ 0x34167829);
        this.selected = 'gold-willow';
        this.placement = 0.5;
        this.prepared = true;
        this.cancelHold();
        this.message = 'A fresh, quiet sky.';
    }
    advance(seconds: number) {
        if (this.paused || !Number.isFinite(seconds) || seconds <= 0)
            return;
        this.accumulator += Math.min(seconds, 0.1);
        for (let steps = 0; this.accumulator >= 1 / 60 && steps < 6; steps++) {
            this.step(1 / 60);
            this.accumulator -= 1 / 60;
        }
    }
    drainEvents() { const e = this.events; this.events = []; return e; }
    snapshot() {
        return {
            ready: this.ready, paused: this.paused, selected: this.selected, placement: this.placement,
            holding: this.holding, holdProgress: this.holdProgress, show: this.show, launched: this.launched,
            bursts: this.bursts, active: this.rockets.length, particles: this.heads.count + this.trails.count,
            smoke: this.smoke.count, quality: this.quality, message: this.message, time: this.time,
            fuse: this.rockets.some(r => r.stage === 'fuse'), phase: this.phase, carriers: this.cues.length,
        };
    }
    private emit(type: SimEvent['type'], x: number, y: number, z: number, family: number, strength = 1, duration?: number) {
        if (this.events.length < 128)
            this.events.push({ id: ++this.sequence, time: this.time, type, x, y, z, family, strength, duration });
    }
    private step(dt: number) {
        this.time += dt;
        if (this.holding) {
            this.holdProgress += dt / 0.65;
            if (this.holdProgress >= 1)
                this.ignite();
        }
        if (this.show)
            this.directShow();
        this.trails.advance(dt, this.wind);
        this.moveHeads(dt);
        this.moveSmoke(dt);
        for (let i = this.lights.length - 1; i >= 0; i--) {
            this.lights[i].age += dt;
            if (this.lights[i].age > 2.4)
                this.lights.splice(i, 1);
        }
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.age += dt;
            if (r.stage === 'fuse') {
                // Sparse near-field traces; their randomness never affects flight or burst shape.
                const t = r.age / r.fuse;
                if (hash01(Math.floor(r.age * 60), r.seed) > 0.58) {
                    const fx = r.x + 1.55 * (1 - t) + 0.55, fy = r.ground + 0.9 + t * 0.8;
                    this.trails.add(fx, fy, 0, fx + 0.2, fy + 0.32, 0, 0.19, 0.026, 1, 0.48, 0.11, r.id, 0, BUDGETS[this.quality].trails);
                }
                if (r.age >= r.fuse) {
                    r.age = 0;
                    r.stage = 'ascent';
                    r.phase = 'thrust';
                    this.launched++;
                    this.prepared = true;
                    this.emit('launch', r.x, r.y, r.z, r.family);
                    if (!this.show)
                        this.message = 'Rising into the night.';
                }
            }
            else if (r.stage === 'ascent') {
                this.moveRocket(r, dt);
                if (r.age >= r.ascent) {
                    r.stage = 'afterglow';
                    r.phase = 'afterglow';
                    r.age = 0;
                    this.primary(r);
                }
            }
            else if (r.age > 16)
                this.rockets.splice(i, 1);
        }
        for (let i = this.cues.length - 1; i >= 0; i--) {
            const c = this.cues[i];
            const px = c.x, py = c.y, pz = c.z;
            c.vy -= 3.2 * dt;
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.z += c.vz * dt;
            this.trails.add(px, py, pz, c.x, c.y, c.z, 0.48, 0.065, 1, 0.69, 0.30, c.id, 0, BUDGETS[this.quality].trails);
            if (this.time >= c.at) {
                this.cues.splice(i, 1);
                this.burst(c.family, c.x, c.y, c.z, c.scale, c.seed, c.vx * 0.15, c.vy * 0.15, c.vz * 0.15);
            }
        }
    }
    private moveRocket(r: Rocket, dt: number) {
        const before = r.age - dt;
        const powered = Math.max(0, Math.min(dt, r.thrust - before));
        const coast = dt - powered;
        const advanceY = (a: number, t: number) => { r.y += r.vy * t + 0.5 * a * t * t; r.vy += a * t; };
        advanceY(r.acceleration, powered);
        advanceY(-8, coast);
        r.phase = r.age < r.thrust ? 'thrust' : 'coast';
        r.vx += this.wind * dt * 0.13;
        r.x += r.vx * dt;
        r.z += r.vz * dt;
        const poweredTail = r.phase === 'thrust';
        this.trails.add(r.px, r.py, r.pz, r.x, r.y, r.z, poweredTail ? 0.64 : 0.42, poweredTail ? 0.105 : 0.043, 1, poweredTail ? 0.66 : 0.37, 0.11, r.id, 0, BUDGETS[this.quality].trails);
        r.px = r.x;
        r.py = r.y;
        r.pz = r.z;
        if (hash01(Math.floor(r.age * 60), r.seed ^ 9) > (poweredTail ? 0.73 : 0.90))
            this.addSmoke(r.x, r.y, r.z, 1.6, poweredTail ? 0.45 : 0.23, 1);
    }
    private directShow() {
        if (this.show === 'finale' && this.time - this.showStart >= 32) {
            this.stopShow(false);
            this.message = 'Finale complete. Stay for the embers.';
            return;
        }
        if (this.time < this.nextCue)
            return;
        const rand = this.showRng, mode = this.show;
        let family = Math.floor(rand() * 4);
        if (family === this.previousFamily)
            family = (family + 1) % 4;
        if (mode !== 'calm' && rand() < 0.11)
            family = 4;
        const side = rand() < 0.5;
        const position = this.protectCenter ? (side ? 0.23 : 0.77) : (0.29 + rand() * 0.42);
        const admitted = this.ignite('auto', family, position);
        if (admitted)
            this.previousFamily = family;
        const cycle = 0.5 + 0.5 * Math.sin((this.time - this.showStart) * 0.18);
        const spacing = mode === 'calm' ? 7 + rand() * 3 : mode === 'festival' ? 3.2 + cycle * 2 + rand() : 1.5 + rand();
        const haze = this.smoke.count / BUDGETS[this.quality].smoke;
        this.nextCue = this.time + (admitted ? Math.max(spacing + (haze > 0.8 ? 1.0 : 0), this.reducedFlashes ? 3 : 0) : 1.25);
    }
    private primary(r: Rocket) {
        if (r.family !== 4) {
            this.burst(r.family, r.x, r.y, r.z, 1, r.seed, r.vx * 0.13, r.vy * 0.08, r.vz * 0.13);
            return;
        }
        // Every offset burst has a luminous carrier traveling from the primary break.
        const rand = randomStream(r.seed);
        const groups = this.reducedFlashes ?
            [{ f: 1, t: 0.35 }, { f: 2, t: 1.10 }, { f: 1, t: 1.85 }, { f: 3, t: 2.60 }, { f: 0, t: 3.50 }] :
            [{ f: 1, t: 0.35 }, { f: 2, t: 0.80 }, { f: 1, t: 1.20 }, { f: 3, t: 1.60 }, { f: 0, t: 2.25 }];
        this.emit('burst', r.x, r.y, r.z, 4, 0.5);
        for (let j = 0; j < groups.length; j++) {
            const g = groups[j];
            this.cues.push({ id: this.nextObjectId++, at: this.time + g.t, family: g.f, x: r.x, y: r.y, z: r.z,
                vx: (j % 2 ? -1 : 1) * (5 + rand() * 5), vy: 2 + rand() * 5, vz: (rand() - 0.5) * 8,
                scale: j === 4 ? 0.83 : 0.56, seed: Math.floor(rand() * 0xffffffff), reserve: j === 4 ? 230 : 155 });
        }
    }
    private burst(family: number, x: number, y: number, z: number, scale: number, seed: number, mx = 0, my = 0, mz = 0) {
        const f = FAMILIES[family], rand = randomStream(seed);
        const n = Math.round(f.count * BUDGETS[this.quality].scale * (scale < 1 ? 0.58 : 1));
        const rotate = rand() * Math.PI * 2, palette = Math.floor(rand() * 3);
        let lightR = 0, lightG = 0, lightB = 0;
        for (let i = 0; i < n; i++) {
            const theta = i * 2.399963229728653 + rotate + (rand() - 0.5) * 0.18;
            const vertical = 1 - 2 * (i + 0.5) / n, radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
            const speed = f.speed * scale * (0.87 + rand() * 0.23);
            let r = 1, g = 0.55 + rand() * 0.20, b = 0.13;
            if (family === 1) {
                const sector = Math.floor(((theta % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 6);
                const colors = [[1, 0.04, 0.10], [0.13, 0.95, 0.40], [0.34, 0.32, 1], [1, 0.48, 0.12], [0.8, 0.10, 0.68], [0.12, 0.75, 1]];
                [r, g, b] = colors[(sector + palette * 2) % colors.length];
            }
            if (family === 2) {
                g = 0.40 + rand() * 0.24;
                b = 0.10;
            }
            if (family === 3) {
                r = 0.83;
                g = 0.91;
                b = 1;
            }
            this.heads.add(x, y, z, Math.cos(theta) * radial * speed + mx, vertical * speed + my, Math.sin(theta) * radial * speed + mz, f.life * (0.84 + rand() * 0.24), r, g, b, family === 1 ? 0.13 : 0.105, f.drag, f.gravity, f.trail, family === 3 ? 0.95 + rand() * 0.40 : 0, family);
            lightR += r;
            lightG += g;
            lightB += b;
        }
        this.bursts++;
        this.emit('burst', x, y, z, family, scale);
        if (this.lights.length < 12)
            this.lights.push({ x, y, z, age: 0, r: lightR / n, g: lightG / n, b: lightB / n, strength: scale });
        const layers = this.quality === 'low' ? 4 : 7;
        for (let i = 0; i < layers; i++)
            this.addSmoke(x + (rand() - 0.5) * 15 * scale, y + (rand() - 0.5) * 12 * scale, z + (rand() - 0.5) * 14 * scale, (4 + rand() * 5) * scale, 0.48 + rand() * 0.26, 2);
        if (!this.show)
            this.message = 'Stay for the falling embers.';
    }
    private moveHeads(dt: number) {
        const p = this.heads, budget = BUDGETS[this.quality];
        for (let i = p.count - 1; i >= 0; i--) {
            p.age[i] += dt;
            if (p.age[i] >= p.life[i] || p.y[i] < -18) {
                p.remove(i);
                continue;
            }
            const drag = Math.exp(-p.drag[i] * dt);
            p.vx[i] = p.vx[i] * drag + this.wind * 0.09 * dt;
            p.vy[i] = p.vy[i] * drag - p.gravity[i] * dt;
            p.vz[i] *= drag;
            p.x[i] += p.vx[i] * dt;
            p.y[i] += p.vy[i] * dt;
            p.z[i] += p.vz[i] * dt;
            if (p.split[i] > 0 && p.age[i] >= p.split[i]) {
                this.splitStar(i);
                continue;
            }
            p.carry[i] += dt;
            const distance = Math.hypot(p.x[i] - p.px[i], p.y[i] - p.py[i], p.z[i] - p.pz[i]);
            if (p.trail[i] > 0 && (distance > 0.75 || p.carry[i] >= 1 / budget.trailRate)) {
                const age = p.age[i] / p.life[i], red = p.family[i] === 2 ? clamp((age - 0.4) * 1.6, 0, 0.75) : 0;
                const life = p.trail[i] * (0.90 + hash01(p.id[i], 7) * 0.1);
                this.trails.add(p.px[i], p.py[i], p.pz[i], p.x[i], p.y[i], p.z[i], life, p.size[i] * 0.55 * (1 - age * 0.45), p.r[i], p.g[i] * (1 - red), p.b[i] * (1 - red), p.id[i], p.family[i], budget.trails);
                p.px[i] = p.x[i];
                p.py[i] = p.y[i];
                p.pz[i] = p.z[i];
                p.carry[i] = 0;
            }
        }
    }
    private splitStar(i: number) {
        const p = this.heads;
        const x = p.x[i], y = p.y[i], z = p.z[i], vx = p.vx[i], vy = p.vy[i], vz = p.vz[i], id = p.id[i];
        // An orthonormal basis perpendicular to the parent's direction, not the screen plane.
        const length = Math.hypot(vx, vy, vz) || 1, nx = vx / length, ny = vy / length, nz = vz / length;
        let ux = -ny, uy = nx, uz = 0;
        if (Math.hypot(ux, uy) < 0.01) {
            ux = 0;
            uy = -nz;
            uz = ny;
        }
        const ul = Math.hypot(ux, uy, uz) || 1;
        ux /= ul;
        uy /= ul;
        uz /= ul;
        const wx = ny * uz - nz * uy, wy = nz * ux - nx * uz, wz = nx * uy - ny * ux;
        const angle = hash01(id, 831) * Math.PI * 2;
        p.remove(i);
        for (let k = 0; k < 4; k++) {
            const a = angle + k * Math.PI / 2, c = Math.cos(a) * 8, s = Math.sin(a) * 8;
            p.add(x, y, z, vx * 0.55 + ux * c + wx * s, vy * 0.55 + uy * c + wy * s, vz * 0.55 + uz * c + wz * s, 1.8 + hash01(id, k) * 0.6, 0.84, 0.93, 1, 0.085, 0.65, 3.1, 0.95, 0, 3);
        }
        if (id % 8 === 0)
            this.emit('crackle', x, y, z, 3, 0.3);
    }
    private addSmoke(x: number, y: number, z: number, size: number, opacity: number, kind: number) {
        if (this.smoke.count >= BUDGETS[this.quality].smoke)
            return;
        const rand = this.smokeRng;
        const i = this.smoke.add(x, y, z, 0.6 + rand() * 0.35, 0.3 + rand() * 0.3, (rand() - 0.5) * 0.3, kind === 1 ? 4 + rand() * 2 : 10 + rand() * 5, 0.08, 0.09, 0.12, size, 0, opacity, 0, 0, kind);
        if (i >= 0)
            this.smoke.angle[i] = rand() * Math.PI * 2;
    }
    private moveSmoke(dt: number) {
        const p = this.smoke;
        for (let i = p.count - 1; i >= 0; i--) {
            p.age[i] += dt;
            if (p.age[i] >= p.life[i]) {
                p.remove(i);
                continue;
            }
            p.x[i] += (this.wind + p.vx[i] + Math.sin(this.time * 0.35 + p.id[i]) * 0.14) * dt;
            p.y[i] += p.vy[i] * dt;
            p.z[i] += p.vz[i] * dt;
            p.size[i] += dt * (p.family[i] === 1 ? 0.38 : 0.52);
            p.angle[i] += dt * 0.018;
        }
    }
}
