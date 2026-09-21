import { BUDGETS, FAMILIES, clamp, familyIndex, hash01, randomStream } from './catalog.js';
import type { FamilyId, Quality, ShowPreset } from './catalog.js';
import { Pool } from './Pool.js';
import { Trails } from './Trails.js';
import { fusePointAt, ROCKET_SCALE } from './FusePath.js';
import { FLIGHT_GRAVITY, REARM_SECONDS, MOTOR_LOCAL_Y, SHELL_LOCAL_Y, rocketPoint } from './LaunchGeometry.js';
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
    padX: number;
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
    readonly embers = new Pool(768);
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
    safeRect: [number, number, number, number] = [.32, .25, .68, .72];
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
    get activeUnits() { return this.rockets.reduce((n, r) => n + (r.stage === 'afterglow' ? 0 : r.cost), 0); }
    get committed() { return this.rockets.find(r => r.stage !== 'afterglow'); }
    get rearming() { return this.rockets.some(r => r.stage === 'afterglow' && r.age < REARM_SECONDS); }
    get launchBlock() {
        if (this.paused) return 'paused';
        if (this.committed || this.rearming || !this.prepared) return 'busy';
        if (!this.canReserve(familyIndex(this.selected))) return 'capacity';
        return '';
    }
    get ready() { return this.launchBlock === ''; }
    private reserveFor(family: number) {
        return family === 4 ? 900 : family === 3 ? 160 : Math.ceil((FAMILIES[family]?.count || 0) * 1.2);
    }
    private canReserve(family: number) {
        const f = FAMILIES[family];
        return Boolean(f) && this.activeUnits + f.cost <= BUDGETS[this.quality].units &&
            this.heads.count + this.futureHeads + this.reserveFor(family) <= this.heads.capacity;
    }
    get smallScale() { return 1; }
    get wind() { return 0.85 + Math.sin(this.time * 0.12) * 0.24; }
    get phase() {
        if (this.holding) return 'contact';
        if (this.committed) return this.committed.phase;
        if (this.rearming) return 'burst';
        return this.heads.count || this.trails.count || this.embers.count || this.cues.length ? 'afterglow' : 'ready';
    }
    placementToX(value = this.placement) { return (clamp(value, 0.2, 0.8) - 0.5) * this.launchSpan; }
    setViewport(width: number, _ground: number) { this.launchSpan = clamp(width, 65, 160); }
    setPlacement(value: number) {
        if (!this.holding && this.ready) this.placement = clamp(value, 0.2, 0.8);
    }
    select(id: FamilyId) {
        this.stopShow(false);
        const burning = Boolean(this.committed);
        this.cancelHold();
        this.selected = FAMILIES[familyIndex(id)].id;
        this.prepared = !burning;
        this.message = burning ? `${FAMILIES[familyIndex(id)].name} is next. The current rocket will finish.` : FAMILIES[familyIndex(id)].note;
        return true;
    }
    beginHold() {
        if (!this.ready) return false;
        this.stopShow(false);
        this.holding = true;
        this.holdProgress = 0;
        return true;
    }
    cancelHold() { this.holding = false; this.holdProgress = 0; }
    private get futureHeads() {
        let n = this.rockets.reduce((sum, r) => sum + (r.stage === 'afterglow' ? 0 : r.reserve), 0);
        n += this.cues.reduce((sum, c) => sum + c.reserve, 0);
        for (let i = 0; i < this.heads.count; i++) if (this.heads.split[i] > 0) n += 3;
        return n;
    }
    ignite(source: 'manual' | 'auto' = 'manual', family = familyIndex(this.selected), placement = this.placement) {
        if (source === 'manual') this.stopShow(false);
        if (this.paused) return false;
        if (source === 'manual' && (!this.prepared || this.committed || this.rearming)) return false;
        const f = FAMILIES[family];
        const reserve = this.reserveFor(family);
        if (!this.canReserve(family)) {
            this.cancelHold();
            this.message = 'Let this burst finish, then light another.';
            return false;
        }
        const rand = this.launchRng;
        const x = this.placementToX(placement), top = 72 + rand() * 6;
        // Solve a powered rise followed by a coast that reaches the apex at zero vertical speed.
        // All families share virtual gravity; height changes flight duration, not the viewport.
        const thrustFraction = .24;
        const ascent = Math.sqrt(2 * (top - this.ground) / (FLIGHT_GRAVITY * (1 - thrustFraction)));
        const thrust = ascent * thrustFraction, coast = ascent - thrust;
        const acceleration = FLIGHT_GRAVITY * coast / thrust;
        const rocket: Rocket = {
            id: this.nextObjectId++, family, x, y: this.ground, z: 0, px: x, py: this.ground, pz: 0,
            vx: (rand() - 0.5) * 1.0, vy: 0, vz: (rand() - 0.5) * 1.1, ground: this.ground, padX: x, top, age: 0,
            fuse: 0.58 + rand() * 0.18, ascent, thrust, acceleration, phase: 'fuse', stage: 'fuse',
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
        if (value) this.events = [];
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
        if (this.show && announce) this.message = 'Automatic show stopped. The sky is yours.';
        this.show = null;
    }
    reset() {
        this.heads.clear();
        this.trails.clear();
        this.smoke.clear();
        this.embers.clear();
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
        if (this.paused || !Number.isFinite(seconds) || seconds <= 0) return;
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
            bursts: this.bursts, active: this.rockets.length, particles: this.heads.count + this.trails.count + this.embers.count,
            smoke: this.smoke.count, quality: this.quality, message: this.message, time: this.time,
            launchBlock: this.launchBlock, committedId: this.committed?.id ?? null,
            committedFamily: this.committed ? FAMILIES[this.committed.family].name : '',
            flightProgress: this.committed?.stage === 'ascent' ? Math.min(1, this.committed.age / this.committed.ascent) : 0,
            fuse: this.rockets.some(r => r.stage === 'fuse'), phase: this.phase, carriers: this.cues.length, embers: this.embers.count,
        };
    }
    private emit(type: SimEvent['type'], x: number, y: number, z: number, family: number, strength = 1, duration?: number) {
        if (this.events.length < 128) this.events.push({ id: ++this.sequence, time: this.time, type, x, y, z, family, strength, duration });
    }
    private step(dt: number) {
        this.time += dt;
        if (this.holding) {
            this.holdProgress += dt / 0.65;
            if (this.holdProgress >= 1) this.ignite();
        }
        if (this.show) this.directShow();
        this.trails.advance(dt, this.wind);
        this.moveHeads(dt);
        this.moveSmoke(dt);
        this.moveEmbers(dt);
        for (let i = this.lights.length - 1; i >= 0; i--) {
            this.lights[i].age += dt;
            if (this.lights[i].age > 4.5) this.lights.splice(i, 1);
        }
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.age += dt;
            if (r.stage === 'fuse') {
                // Sparse near-field traces; their randomness never affects flight or burst shape.
                const t = r.age / r.fuse;
                if (hash01(Math.floor(r.age * 60), r.seed) > 0.58) {
                    const fp = fusePointAt(t);
                    const fx = r.x + fp[0] * ROCKET_SCALE[0], fy = r.ground + fp[1] * ROCKET_SCALE[1];
                    this.trails.add(fx, fy, 0, fx + 0.2, fy + 0.32, 0, 0.19, 0.026, 1, 0.48, 0.11, r.id, 0, BUDGETS[this.quality].trails);
                }
                if (Math.floor(r.age * 12) !== Math.floor((r.age - dt) * 12)) {
                    const fp = fusePointAt(t);
                    this.addSmoke(r.x + fp[0] * ROCKET_SCALE[0], r.ground + fp[1] * ROCKET_SCALE[1], .8, .50, .40, 0);
                }
                if (r.age >= r.fuse) {
                    r.age = 0;
                    r.stage = 'ascent';
                    r.phase = 'thrust';
                    this.launched++;
                    const motor = rocketPoint(r, MOTOR_LOCAL_Y);
                    this.emit('launch', ...motor, r.family);
                    for (let puff = 0; puff < 4; puff++) this.addSmoke(motor[0] + (puff - 1.5) * .7, motor[1] - .6, motor[2], 1.5, .58, 1);
                    if (!this.show) this.message = 'Rising into the night.';
                }
            } else if (r.stage === 'ascent') {
                this.moveRocket(r, dt);
                if (r.age >= r.ascent) {
                    r.stage = 'afterglow';
                    r.phase = 'afterglow';
                    r.age = 0;
                    this.primary(r);
                    this.prepared = !this.rockets.some(other => other.stage !== 'afterglow');
                }
            } else if (r.age > Math.max(8, FAMILIES[r.family].life + FAMILIES[r.family].trail + 1)) this.rockets.splice(i, 1);
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
        const previousMotor = rocketPoint(r, MOTOR_LOCAL_Y);
        const powered = Math.min(r.age, r.thrust);
        const coast = clamp(r.age - r.thrust, 0, r.ascent - r.thrust);
        const peakVelocity = r.acceleration * r.thrust;
        r.y = r.ground + .5 * r.acceleration * powered * powered +
            peakVelocity * coast - .5 * FLIGHT_GRAVITY * coast * coast;
        r.vy = r.age < r.thrust ? r.acceleration * powered : Math.max(0, peakVelocity - FLIGHT_GRAVITY * coast);
        r.phase = r.age < r.thrust ? 'thrust' : 'coast';
        r.vx = r.vx * Math.exp(-.42 * dt) + this.wind * dt * .10;
        r.vz *= Math.exp(-.55 * dt);
        r.x += r.vx * dt;
        r.z += r.vz * dt;
        const motor = rocketPoint(r, MOTOR_LOCAL_Y), poweredTail = r.phase === 'thrust';
        this.trails.add(...previousMotor, ...motor, poweredTail ? .56 : .25,
            poweredTail ? .13 : .045, 1, poweredTail ? .66 : .37, .11, r.id, 0, BUDGETS[this.quality].trails);
        r.px = r.x; r.py = r.y; r.pz = r.z;
        if (hash01(Math.floor(r.age * 60), r.seed ^ 9) > (poweredTail ? .68 : .94)) {
            this.addSmoke(motor[0], motor[1] - .35, motor[2], poweredTail ? 1.3 : .65, poweredTail ? .48 : .15, 1);
        }
    }
    private directShow() {
        if (this.show === 'finale' && this.time - this.showStart >= 32) {
            this.stopShow(false);
            this.message = 'Finale complete. Stay for the embers.';
            return;
        }
        if (this.time < this.nextCue) return;
        const rand = this.showRng, mode = this.show;
        let family = Math.floor(rand() * 4);
        if (family === this.previousFamily) family = (family + 1) % 4;
        if (mode !== 'calm' && rand() < 0.11) family = 4;
        const side = rand() < 0.5;
        const position = this.protectCenter ? (side ? 0.23 : 0.77) : (0.29 + rand() * 0.42);
        const admitted = this.ignite('auto', family, position);
        if (admitted) this.previousFamily = family;
        const cycle = 0.5 + 0.5 * Math.sin((this.time - this.showStart) * 0.18);
        const spacing = mode === 'calm' ? 7 + rand() * 3 : mode === 'festival' ? 3.2 + cycle * 2 + rand() : 1.5 + rand();
        const haze = this.smoke.count / BUDGETS[this.quality].smoke;
        this.nextCue = this.time + (admitted ? Math.max(spacing + (haze > 0.8 ? 1.0 : 0), this.reducedFlashes ? 3 : 0) : 1.25);
    }
    private primary(r: Rocket) {
        const [x, y, z] = rocketPoint(r, SHELL_LOCAL_Y);
        if (r.family !== 4) {
            this.burst(r.family, x, y, z, 1, r.seed, r.vx * .13, r.vy * .08, r.vz * .13);
            return;
        }
        const rand = randomStream(r.seed);
        const groups = this.reducedFlashes ?
            [{ f: 1, t: 0.35 }, { f: 2, t: 1.10 }, { f: 1, t: 1.85 }, { f: 3, t: 2.60 }, { f: 0, t: 3.50 }] :
            [{ f: 1, t: 0.35 }, { f: 2, t: 0.80 }, { f: 1, t: 1.20 }, { f: 3, t: 1.60 }, { f: 0, t: 2.25 }];
        this.emit('burst', x, y, z, 4, 0.5);
        for (let j = 0; j < groups.length; j++) {
            const g = groups[j];
            this.cues.push({ id: this.nextObjectId++, at: this.time + g.t, family: g.f, x, y, z,
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
            // Preserve a spherical family silhouette without the machine-perfect Fibonacci shell.
            const theta = i * 2.399963229728653 + rotate + (rand() - 0.5) * 0.52;
            const vertical = clamp(1 - 2 * (i + 0.5) / n + (rand() - 0.5) * 0.16, -1, 1);
            const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
            const speed = f.speed * scale * (0.74 + rand() * 0.48);
            let r = 1, g = 0.38 + rand() * 0.26, b = 0.055 + rand() * .035;
            if (family === 1) {
                const sector = Math.floor(((theta % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 6);
                const colors = [[1, 0.04, 0.10], [0.13, 0.95, 0.40], [0.34, 0.32, 1], [1, 0.48, 0.12], [0.8, 0.10, 0.68], [0.12, 0.75, 1]];
                [r, g, b] = colors[(sector + palette * 2) % colors.length];
            }
            if (family === 2) { g = 0.40 + rand() * 0.24; b = 0.10; }
            if (family === 3) { r = 0.83; g = 0.91; b = 1; }
            this.heads.add(x, y, z, Math.cos(theta) * radial * speed + mx, vertical * speed + my, Math.sin(theta) * radial * speed + mz, f.life * (0.84 + rand() * 0.24), r, g, b, family === 1 ? 0.13 : 0.105, f.drag, f.gravity, f.trail, family === 3 ? 0.95 + rand() * 0.40 : 0, family);
            lightR += r;
            lightG += g;
            lightB += b;
        }
        this.bursts++;
        this.emit('burst', x, y, z, family, scale);
        if (this.lights.length < 12) this.lights.push({ x, y, z, age: 0, r: lightR / n, g: lightG / n, b: lightB / n, strength: scale });
        const layers = this.quality === 'low' ? 4 : 7;
        for (let i = 0; i < layers; i++) this.addSmoke(x + (rand() - 0.5) * 15 * scale, y + (rand() - 0.5) * 12 * scale, z + (rand() - 0.5) * 14 * scale, (4 + rand() * 5) * scale, 0.48 + rand() * 0.26, 2);
        if (!this.show) this.message = 'Stay for the falling embers.';
    }
    private moveHeads(dt: number) {
        const p = this.heads, budget = BUDGETS[this.quality];
        for (let i = p.count - 1; i >= 0; i--) {
            p.age[i] += dt;
            if (p.age[i] >= p.life[i] || p.y[i] < -18) { p.remove(i); continue; }
            const drag = Math.exp(-p.drag[i] * dt);
            p.vx[i] = p.vx[i] * drag + this.wind * 0.09 * dt;
            p.vy[i] = p.vy[i] * drag - p.gravity[i] * dt;
            p.vz[i] *= drag;
            p.x[i] += p.vx[i] * dt;
            p.y[i] += p.vy[i] * dt;
            p.z[i] += p.vz[i] * dt;
            if (p.split[i] > 0 && p.age[i] >= p.split[i]) { this.splitStar(i); continue; }
            // Sparse detached embers carry momentum but cool and fall independently.
            const rate = this.quality === 'low' ? 2 : 4;
            if ((p.family[i] === 0 || p.family[i] === 2 || p.family[i] === 3) && p.id[i] % 3 === 0
                && p.age[i] < p.life[i] * .82 && Math.floor(p.age[i] * rate) !== Math.floor((p.age[i] - dt) * rate)) {
                const salt = Math.floor(p.age[i] * rate), q = hash01(p.id[i], salt * 17);
                const cap = this.quality === 'low' ? 160 : this.quality === 'standard' ? 448 : 768;
                if (this.embers.count < cap) this.embers.add(p.x[i], p.y[i], p.z[i], p.vx[i] * .45 + (q - .5) * 2,
                    p.vy[i] * .45, p.vz[i] * .45, .65 + q * 1.4, p.r[i], p.g[i] * .86, p.b[i] * .7, .07, 1.1, 3.8);
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
        const length = Math.hypot(vx, vy, vz) || 1, nx = vx / length, ny = vy / length, nz = vz / length;
        let ux = -ny, uy = nx, uz = 0;
        if (Math.hypot(ux, uy) < 0.01) { ux = 0; uy = -nz; uz = ny; }
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
        if (id % 8 === 0) this.emit('crackle', x, y, z, 3, 0.3);
    }
    private moveEmbers(dt: number) {
        const p = this.embers;
        for (let i = p.count - 1; i >= 0; i--) {
            p.age[i] += dt;
            if (p.age[i] >= p.life[i]) { p.remove(i); continue; }
            const d = Math.exp(-p.drag[i] * dt);
            p.vx[i] = p.vx[i] * d + this.wind * dt * .24;
            p.vy[i] = p.vy[i] * d - p.gravity[i] * dt;
            p.vz[i] *= d;
            p.x[i] += p.vx[i] * dt;
            p.y[i] += p.vy[i] * dt;
            p.z[i] += p.vz[i] * dt;
        }
    }
    private addSmoke(x: number, y: number, z: number, size: number, opacity: number, kind: number) {
        if (this.smoke.count >= BUDGETS[this.quality].smoke) return;
        const rand = this.smokeRng;
        const i = this.smoke.add(x, y, z, 0.6 + rand() * 0.35, 0.3 + rand() * 0.3, (rand() - 0.5) * 0.3, kind === 0 ? 1.3 + rand() : kind === 1 ? 4 + rand() * 2 : 10 + rand() * 5, 0.08, 0.09, 0.12, size, 0, opacity, 0, 0, kind);
        if (i >= 0) this.smoke.angle[i] = rand() * Math.PI * 2;
    }
    private moveSmoke(dt: number) {
        const p = this.smoke;
        for (let i = p.count - 1; i >= 0; i--) {
            p.age[i] += dt;
            if (p.age[i] >= p.life[i]) { p.remove(i); continue; }
            p.x[i] += (this.wind + p.vx[i] + Math.sin(this.time * 0.35 + p.id[i]) * 0.14) * dt;
            p.y[i] += p.vy[i] * dt;
            p.z[i] += p.vz[i] * dt;
            p.size[i] += dt * (p.family[i] === 0 ? .22 : p.family[i] === 1 ? .55 : .68);
            p.angle[i] += dt * 0.018;
        }
    }
}
