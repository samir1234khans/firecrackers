import { BUDGETS, FAMILIES, clamp, randomStream } from '../engine/catalog';
import type { Quality } from '../engine/catalog';
import type { Simulation, Rocket } from '../engine/Simulation';
import type { RendererPort } from '../engine/RendererPort';
import { flightBodyOpacity, rocketPoint, SHELL_LOCAL_Y } from '../engine/LaunchGeometry';
import { fusePointAt } from '../engine/FusePath';
import type { DisplayMode } from '../platform/presentation';

/** GPU-independent fallback, not a substitute for the primary 3D renderer.
 * Flight, splitting, wind, pause and all five effects use the unchanged simulation.
 */
export class CompatibilityRenderer implements RendererPort {
    readonly backend = 'Canvas 2D · compatibility';
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly canvas = document.createElement('canvas');
    private readonly ctx: CanvasRenderingContext2D;
    private readonly stars: { x: number; y: number; size: number; alpha: number }[];
    private mode: DisplayMode = 'interactive';
    private width = 1;
    private height = 1;
    private baseline = 1;
    private scale = 1;
    private ratio = 1;
    private disposed = false;
    private initialized = false;
    private staged = 0;
    private airborne = 0;
    private bodies = 0;
    private readonly glows = new Map<string, HTMLCanvasElement>();

    constructor(private host: HTMLDivElement, private sim: Simulation) {
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error('This browser cannot create a drawing canvas.');
        this.ctx = ctx;
        const rand = randomStream(823841);
        this.stars = Array.from({ length: 130 }, () => ({ x: rand(), y: rand() * .68, size: .3 + rand() * .8, alpha: .18 + rand() * .43 }));
    }
    async init() {
        if (this.disposed) return;
        this.initialized = true;
        this.host.replaceChildren(this.canvas);
        this.host.dataset.backend = this.backend;
        this.host.dataset.renderer = 'compatibility-2d';
        this.host.dataset.realism = 'simulation-fallback';
        this.resize();
        this.render();
    }
    resize() {
        if (this.disposed) return;
        this.width = Math.max(1, this.host.clientWidth);
        this.height = Math.max(1, this.host.clientHeight);
        const rect = this.host.getBoundingClientRect();
        const deck = this.host.parentElement?.querySelector('.flow-deck-wrap')?.getBoundingClientRect();
        const header = this.host.parentElement?.querySelector('.flow-command')?.getBoundingClientRect();
        this.baseline = this.mode === 'interactive' && deck ? Math.max(this.height * .35, deck.top - rect.top - 18) : this.height * .88;
        const top = this.mode === 'interactive' && header ? header.bottom - rect.top + 15 : 20;
        this.scale = Math.max(.45, Math.min(this.width / 140, (this.baseline - top) / 110));
        this.sim.setViewport(Math.min(160, this.width / this.scale * .78), 16);
        this.setQuality(this.sim.quality);
    }
    setQuality(quality: Quality) {
        if (this.disposed) return;
        this.ratio = Math.min(window.devicePixelRatio || 1, BUDGETS[quality].ratio, Math.sqrt(1600000 / (this.width * this.height)));
        this.canvas.width = Math.round(this.width * this.ratio);
        this.canvas.height = Math.round(this.height * this.ratio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.metrics.renderPixels = this.canvas.width * this.canvas.height;
    }
    setDisplay(mode: DisplayMode) {
        this.mode = mode;
        this.host.dataset.display = mode;
        if (this.initialized) this.resize();
    }
    private project(x: number, y: number, z = 0) {
        const depth = 240 / Math.max(140, 240 - z);
        return { x: this.width / 2 + x * this.scale * depth, y: this.baseline - (y - this.sim.ground) * this.scale * depth };
    }
    projectPlacement(clientX: number) {
        return clamp(.5 + (clientX - this.host.getBoundingClientRect().left - this.width / 2) / (this.scale * this.sim.launchSpan), .2, .8);
    }
    private tone(r: number, g: number, b: number) {
        return `rgb(${Math.round(clamp(r, 0, 1) * 255)},${Math.round(clamp(g, 0, 1) * 255)},${Math.round(clamp(b, 0, 1) * 255)})`;
    }
    private glow(x: number, y: number, radius: number, tone: string, alpha: number) {
        if (alpha < .005 || x < -radius || x > this.width + radius || y < -radius || y > this.height + radius) return;
        let sprite = this.glows.get(tone);
        if (!sprite) {
            sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
            const c = sprite.getContext('2d')!;
            const gradient = c.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, '#fff7dc'); gradient.addColorStop(.1, tone);
            gradient.addColorStop(.3, tone); gradient.addColorStop(1, 'transparent');
            c.fillStyle = gradient; c.fillRect(0, 0, 32, 32);
            // Bounded cache: family variation may never grow storage indefinitely.
            if (this.glows.size >= 128) this.glows.delete(this.glows.keys().next().value!);
            this.glows.set(tone, sprite);
        }
        this.ctx.globalAlpha = clamp(alpha, 0, 1);
        this.ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    }
    private drawStage() {
        const c = this.ctx, s = this.sim;
        const x = s.committed?.padX ?? s.placementToX();
        const p = this.project(x, s.ground - 9.8);
        const radius = Math.max(24, 22.5 * this.scale);
        c.globalAlpha = 1; c.fillStyle = '#142337'; c.strokeStyle = '#8393a5'; c.lineWidth = .8;
        c.beginPath(); c.ellipse(p.x, p.y, radius, radius * .19, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        for (const size of [.91, .7, .4]) {
            c.strokeStyle = '#b98d53'; c.beginPath(); c.ellipse(p.x, p.y - 2, radius * size, radius * .19 * size, 0, 0, Math.PI * 2); c.stroke();
        }
    }
    private drawRocket(r: Pick<Rocket, 'x' | 'y' | 'z' | 'stage' | 'age' | 'ascent' | 'fuse' | 'family'>) {
        const c = this.ctx, p = this.project(r.x, r.y, r.z), k = this.scale * (240 / Math.max(140, 240 - r.z));
        const alpha = r.stage === 'ascent' ? flightBodyOpacity(r.age, r.ascent) : 1;
        if (alpha < .002) return;
        this.bodies++;
        c.save(); c.translate(p.x, p.y); c.globalAlpha = alpha;
        const w = Math.max(3.4, 3.8 * k), h = 11 * k;
        c.fillStyle = '#a2865e'; c.fillRect(-.5, -h * .5, 1, 9.4 * k + h * .5);
        const wrap = c.createLinearGradient(-w / 2, 0, w / 2, 0);
        wrap.addColorStop(0, '#1d3147'); wrap.addColorStop(.4, '#657c91'); wrap.addColorStop(1, '#1d3147');
        c.fillStyle = wrap; c.fillRect(-w / 2, -16.3 * k, w, h);
        c.strokeStyle = '#bca475'; c.lineWidth = .8; c.strokeRect(-w / 2, -16.3 * k, w, h);
        c.fillStyle = FAMILIES[r.family].color; c.beginPath(); c.moveTo(-w * .6, -16.3 * k); c.lineTo(0, -20 * k); c.lineTo(w * .6, -16.3 * k); c.closePath(); c.fill();
        const fuse = r.stage === 'fuse' ? fusePointAt(r.age / r.fuse) : fusePointAt(0);
        c.strokeStyle = '#c7af72'; c.beginPath(); c.moveTo(w / 2, -5.8 * k); c.quadraticCurveTo(5 * k, -2 * k, 7.8 * k, -2.9 * k); c.stroke();
        if (r.stage === 'fuse' && r.age >= 0) this.glow(fuse[0] * 3.8 * k, -fuse[1] * 3.4 * k, 3.5, '#ffd18a', 1);
        c.restore();
    }
    render() {
        if (this.disposed || !this.initialized) return;
        const started = performance.now(), c = this.ctx, s = this.sim;
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.clearRect(0, 0, this.width, this.height);
        if (this.mode !== 'transparent') {
            const sky = c.createLinearGradient(0, 0, 0, this.height);
            sky.addColorStop(0, '#030916'); sky.addColorStop(.62, '#0c1b2b'); sky.addColorStop(1, '#050b13');
            c.fillStyle = sky; c.fillRect(0, 0, this.width, this.height);
            c.fillStyle = '#bed3ea';
            for (const star of this.stars) { c.globalAlpha = star.alpha; c.beginPath(); c.arc(star.x * this.width, star.y * this.height, star.size, 0, Math.PI * 2); c.fill(); }
            c.globalAlpha = 1;
        }
        this.staged = this.airborne = this.bodies = 0;
        if (this.mode === 'interactive') {
            this.drawStage();
            if (!s.committed && !s.rearming && !s.show) {
                this.staged++;
                this.drawRocket({ x: s.placementToX(), y: s.ground, z: 0, stage: 'fuse', age: -1, ascent: 1, fuse: 1, family: FAMILIES.findIndex(f => f.id === s.selected) });
            }
            for (const r of s.rockets) {
                if (r.stage === 'afterglow') continue;
                if (r.stage === 'fuse') this.staged++; else this.airborne++;
                this.drawRocket(r);
            }
        }
        c.save();
        if (s.protectCenter) {
            const [left, top, right, bottom] = s.safeRect;
            c.beginPath(); c.rect(0, 0, this.width, this.height); c.rect(left * this.width, top * this.height, (right - left) * this.width, (bottom - top) * this.height); c.clip('evenodd');
        }
        // The smoke is retained and wind-drifted by the same simulation used in 3D.
        const smoke = s.smoke;
        for (let i = 0; i < smoke.count; i++) {
            const p = this.project(smoke.x[i], smoke.y[i], smoke.z[i]);
            const radius = Math.max(2, smoke.size[i] * this.scale * 1.6);
            let red = .14, green = .18, blue = .23;
            for (const light of s.lights) {
                const distance = Math.hypot(light.x - smoke.x[i], light.y - smoke.y[i], light.z - smoke.z[i]);
                const energy = Math.max(0, 1 - distance / 39) ** 2 * Math.exp(-light.age * .72) * .7;
                red += light.r * energy; green += light.g * energy; blue += light.b * energy;
            }
            const haze = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            haze.addColorStop(0, this.tone(red, green, blue)); haze.addColorStop(1, 'transparent');
            c.globalAlpha = Math.min(1, smoke.age[i] * 1.8) * Math.pow(1 - smoke.age[i] / smoke.life[i], 1.4) * .25;
            c.fillStyle = haze; c.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
        }
        c.globalCompositeOperation = 'lighter';
        const trails = s.trails;
        const step = Math.max(1, Math.ceil(trails.count / (s.quality === 'low' ? 2500 : 6500)));
        for (let i = 0; i < trails.count; i += step) {
            const age = trails.age[i] / trails.life[i];
            if (age > .97) continue;
            const a = this.project(trails.ax[i], trails.ay[i], trails.az[i]), b = this.project(trails.bx[i], trails.by[i], trails.bz[i]);
            c.globalAlpha = Math.pow(1 - age, 1.35) * (s.reducedFlashes ? .58 : .75);
            c.strokeStyle = this.tone(trails.r[i], trails.g[i], trails.b[i]); c.lineWidth = Math.max(.55, trails.width[i] * this.scale * 2);
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
        for (const pool of [s.heads, s.embers]) for (let i = 0; i < pool.count; i++) {
            const p = this.project(pool.x[i], pool.y[i], pool.z[i]);
            const alpha = Math.pow(Math.max(0, 1 - pool.age[i] / pool.life[i]), .85);
            // Quantize glow colours to avoid a new texture for every star.
            const quantize = (value: number) => Math.round(value * 8) / 8;
            this.glow(p.x, p.y, pool === s.embers ? 1.9 : 3.1, this.tone(quantize(pool.r[i]), quantize(pool.g[i]), quantize(pool.b[i])), alpha * (s.reducedFlashes ? .72 : .9));
        }
        for (const r of s.rockets) if (r.stage === 'ascent') {
            const p = this.project(...rocketPoint(r, SHELL_LOCAL_Y));
            this.glow(p.x, p.y, 4.3, '#ffcf86', .9);
        }
        for (const carrier of s.cues) { const p = this.project(carrier.x, carrier.y, carrier.z); this.glow(p.x, p.y, 3, '#ffcf86', .8); }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        const ground = this.project(s.placementToX(), s.ground);
        this.host.parentElement?.style.setProperty('--ground-px', `${this.height - ground.y}px`);
        this.host.parentElement?.style.setProperty('--placement-left', `${ground.x / this.width * 100}%`);
        this.host.dataset.stagedRockets = String(this.staged); this.host.dataset.airborneRockets = String(this.airborne);
        this.metrics.frames++; this.metrics.submitMs = performance.now() - started;
    }
    diagnostics() {
        const r = this.sim.committed;
        const shell = r ? rocketPoint(r, SHELL_LOCAL_Y) : null;
        return { stagedRockets: this.staged, airborneRockets: this.airborne, visibleRocketBodies: this.bodies,
            shellScreen: shell ? this.project(...shell) : null,
            flight: r ? { id: r.id, stage: r.stage, age: r.age, ascent: r.ascent, thrust: r.thrust, y: r.y, vy: r.vy, top: r.top, family: r.family, shell } : null };
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true; this.canvas.remove(); this.glows.clear();
        this.canvas.width = this.canvas.height = 1;
    }
}
