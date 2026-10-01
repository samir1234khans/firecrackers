import { measureStage, stageFraming, waterfrontHorizon } from '../engine/StageLayout';
import type { StageLayout } from '../engine/StageLayout';
import { resolveScreenLaunchProfile, resolveLaunchAimScreenX } from '../engine/LaunchProfile';
import type { LaunchProfile } from '../engine/LaunchProfile';
import type { RendererStartup } from '../engine/StartupProgress';
import { PROP_CONTACT_Y, resolvePropComposition, resolveLaunchBounds, propProjectionDiagnostics } from '../engine/LaunchComposition';
import type { LaunchPropComposition, LaunchBounds } from '../engine/LaunchComposition';
import { signatureBody, signatureTint } from '../engine/FlagshipEffects';
import { signatureEnvelope } from '../engine/SignatureDiagnostics';
import { carrierTint } from '../engine/GrandEffects';
import { BUDGETS, FAMILIES, ROCKET_PROFILES, clamp, familyIndex, randomStream } from '../engine/catalog';
import type { FamilyId, Quality } from '../engine/catalog';
import type { Simulation, Rocket } from '../engine/Simulation';
import type { RendererPort } from '../engine/RendererPort';
import { flightBodyOpacity, rocketPoint, SHELL_LOCAL_Y } from '../engine/LaunchGeometry';
import { FUSE_POINTS, fusePointAt, ROCKET_SCALE } from '../engine/FusePath';
import type { DisplayMode } from '../platform/presentation';
import { updateMoonFrame } from './MoonComposition';
import type { MoonFrame } from './MoonComposition';
import { sampleWater } from './WaterWaves';
import { makeGalaxySky } from './GalaxySky';
import type { SkyState } from '../engine/SkyState';
import { CELESTIAL_LIMITS, celestialDiagnostics, createCelestialFrame, updateCelestialFrame } from './CelestialScene';

type RiverLamp = { x: number; y: number; waterline: number; width: number; phase: number; strength: number; flicker: number };
type RiverBoat = { image: HTMLCanvasElement; x: number; depth: number; width: number; phase: number; facing: number;
    lampPixels: { x: number; y: number }[]; waterline: number; screenX: number; screenY: number; screenWidth: number; roll: number };

/** GPU-independent fallback, not a substitute for the primary 3D renderer.
 * Flight, splitting, wind, pause and all ten effects use the unchanged simulation.
 */
export class CompatibilityRenderer implements RendererPort {
    readonly backend = 'Canvas 2D · compatibility';
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly moonImage = new Image();
    private moonReady = false;
    private moonFailed = false;
    private readonly moonFrame = { x: 0, y: 0, radius: 15 };
    private readonly waterSample = { height: 0, slopeX: 0, slopeZ: 0 };
    private readonly canvas = document.createElement('canvas');
    private readonly ctx: CanvasRenderingContext2D;
    private readonly celestialArt = makeGalaxySky();
    private readonly celestialFrame = createCelestialFrame();
    private skyState: Readonly<SkyState> = { time: 0, pointerX: .5, pointerY: .25, engagement: 0, motionAllowed: false };
    private readonly starResponse = document.createElement('canvas');
    private readonly starResponseMask = document.createElement('canvas');
    private readonly starResponseContext: CanvasRenderingContext2D;
    private readonly riverArt = this.makeRiverArt();
    private readonly reducedSkyMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    private layout!: StageLayout;
    private compositions: LaunchPropComposition[] = [];
    private launchBounds: LaunchBounds[] = [];
    private previewProfile?: LaunchProfile;
    private previewFamily = -1;
    private previewPlacement = -1;
    setLayout(layout: StageLayout) { this.layout = layout; }
    setSkyState(state: Readonly<SkyState>) { this.skyState = state; }
    private mode: DisplayMode = 'interactive';
    private width = 1;
    private height = 1;
    private baseline = 1;
    private horizon = .72;
    private scale = 1;
    private ratio = 1;
    private disposed = false;
    private initialized = false;
    private staged = 0;
    private airborne = 0;
    private bodies = 0;
    private readonly glows = new Map<string, HTMLCanvasElement>();

    /** Fixed original silhouettes and sprites are painted once, never generated in the frame loop. */
    private makeRiverArt() {
        const rand = randomStream(9302026);
        const homes = document.createElement('canvas'); homes.width = 1024; homes.height = 64;
        const c = homes.getContext('2d')!;
        const positions = [
            { x: .029, base: 62, scale: .96 }, { x: .073, base: 59, scale: .91 },
            { x: .118, base: 61, scale: .83 }, { x: .151, base: 57, scale: .97 },
            { x: .264, base: 53, scale: .61 }, { x: .291, base: 50, scale: .67 }, { x: .321, base: 52, scale: .57 },
            { x: .737, base: 58, scale: .81 }, { x: .768, base: 61, scale: .93 },
            { x: .803, base: 56, scale: .77 }, { x: .845, base: 60, scale: .87 }, { x: .887, base: 58, scale: .72 },
        ];
        const villageLamps: { x: number; y: number }[] = [];
        for (let i = 0; i < positions.length; i++) {
            const house = positions[i], x = house.x * homes.width;
            const width = (18 + rand() * 16) * house.scale, height = (17 + rand() * 16) * house.scale;
            const base = house.base + (rand() - .5) * 2, roof = (6 + rand() * 7) * house.scale;
            const left = x - width / 2, top = base - height;
            c.fillStyle = i % 3 === 0 ? '#1b2b38' : '#12212f'; c.fillRect(left, top, width, height);
            c.fillStyle = '#0e1925'; c.beginPath(); c.moveTo(left - 2, top + 1);
            if (i % 3 === 1) { c.lineTo(left + width * .19, top - roof * .74); c.lineTo(left + width * .71, top - roof); }
            else c.lineTo(x - width * (i % 2 ? -.12 : .09), top - roof);
            c.lineTo(left + width + 2, top + 1); c.closePath(); c.fill();
            c.fillStyle = '#07121e'; c.fillRect(x + width * .13, top + height * .45, width * .2, height * .55);
            c.strokeStyle = '#283541'; c.lineWidth = .6; c.beginPath(); c.moveTo(left + 1, base - 3);
            c.lineTo(left + width - 1, base - 3); c.stroke();
            if ([1, 4, 8, 10].includes(i)) {
                const wx = x - width * .20, wy = top + height * .39;
                c.fillStyle = '#b18a56'; c.fillRect(wx - 2, wy - 3, 4, 6);
                c.fillStyle = '#1b2630'; c.fillRect(wx - .35, wy - 3, .7, 6);
                villageLamps.push({ x: wx / homes.width, y: wy / homes.height });
            }
        }
        const boats: RiverBoat[] = [];
        for (let i = 0; i < 2; i++) {
            const image = document.createElement('canvas'); image.width = 192; image.height = 96;
            const b = image.getContext('2d')!;
            b.fillStyle = '#1b343b'; b.beginPath(); b.moveTo(10, 48); b.lineTo(173, 48);
            b.lineTo(159, 66); b.quadraticCurveTo(109, 76, 35, 67); b.closePath(); b.fill();
            b.strokeStyle = '#466064'; b.lineWidth = 2; b.beginPath(); b.moveTo(15, 49); b.lineTo(172, 49); b.stroke();
            b.strokeStyle = '#5a5143'; b.lineWidth = 1;
            for (let plank = 0; plank < 3; plank++) { b.beginPath(); b.moveTo(29, 54 + plank * 4); b.lineTo(156, 54 + plank * 4); b.stroke(); }
            b.fillStyle = '#38403b'; b.fillRect(39, 45, 40, 3); b.fillRect(116, 45, 25, 3);
            b.fillStyle = '#273b42'; b.fillRect(84, 23, 37, 24);
            b.fillStyle = '#131f27'; b.beginPath(); b.moveTo(79, 23); b.lineTo(87, 18); b.lineTo(124, 20); b.lineTo(125, 25); b.closePath(); b.fill();
            b.fillStyle = '#06111b'; b.fillRect(89, 28, 9, 11); b.fillRect(112, 28, 6, 10);
            b.strokeStyle = '#576265'; b.lineWidth = 1.7; b.beginPath(); b.moveTo(64, 46); b.lineTo(62, 5); b.stroke();
            b.strokeStyle = '#37484e'; b.lineWidth = .9; b.beginPath(); b.moveTo(62, 10); b.lineTo(29, 46); b.moveTo(62, 10); b.lineTo(139, 46); b.stroke();
            b.strokeStyle = '#355059'; b.lineWidth = 1;
            for (let net = 0; net < 5; net++) { b.beginPath(); b.moveTo(143 + net * 3, 39); b.lineTo(137 + net * 4, 54); b.stroke(); }
            b.strokeStyle = '#645f48'; b.beginPath(); b.moveTo(171, 48); b.bezierCurveTo(190, 51, 180, 64, 185, 77); b.stroke();
            b.fillStyle = '#bd9258'; b.fillRect(103, 28, 5, 8);
            b.fillStyle = '#edc284'; b.fillRect(104, 29, 2, 5);
            boats.push({ image, x: i === 0 ? .19 : .81, depth: i === 0 ? .073 : .035,
                width: i === 0 ? .055 : .041, phase: i === 0 ? .8 : 2.5, facing: i === 0 ? 1 : -1,
                lampPixels: [{ x: 105, y: 32 }], waterline: 69, screenX: 0, screenY: 0, screenWidth: 0, roll: 0 });
        }
        const nauka = document.createElement('canvas'); nauka.width = 256; nauka.height = 128;
        const n = nauka.getContext('2d')!;
        n.fillStyle = '#302c24'; n.beginPath(); n.moveTo(8, 80); n.lineTo(246, 77);
        n.lineTo(221, 101); n.quadraticCurveTo(130, 115, 34, 101); n.closePath(); n.fill();
        n.strokeStyle = '#72563b'; n.lineWidth = 2.4; n.beginPath(); n.moveTo(12, 81); n.lineTo(240, 79); n.stroke();
        n.strokeStyle = '#55412e'; n.lineWidth = 1.3;
        for (let plank = 0; plank < 4; plank++) { n.beginPath(); n.moveTo(30 + plank * 2, 86 + plank * 4); n.lineTo(224 - plank * 3, 84 + plank * 4); n.stroke(); }
        n.fillStyle = '#493c2d'; n.fillRect(45, 75, 32, 4); n.fillRect(178, 75, 37, 4);
        n.strokeStyle = '#64543d'; n.lineWidth = 3;
        for (const x of [67, 188]) { n.beginPath(); n.moveTo(x, 77); n.lineTo(x, 43); n.stroke(); }
        n.fillStyle = '#493a2b'; n.beginPath(); n.moveTo(53, 46);
        n.bezierCurveTo(77, 15, 165, 13, 202, 43); n.lineTo(199, 50);
        n.bezierCurveTo(158, 26, 86, 26, 56, 52); n.closePath(); n.fill();
        n.strokeStyle = '#746045'; n.lineWidth = 1.1;
        for (let rib = 0; rib < 6; rib++) { const x = 66 + rib * 24; n.beginPath(); n.moveTo(x, 45); n.quadraticCurveTo(x - 7, 28, x - 13, 26 + Math.abs(rib - 2.5) * 4); n.stroke(); }
        n.strokeStyle = '#71624b'; n.lineWidth = 1.4; n.beginPath(); n.moveTo(26, 78); n.lineTo(38, 121); n.stroke();
        const candlePixels = [78, 108, 140, 171].map(x => ({ x, y: 61 }));
        for (const candle of candlePixels) {
            n.strokeStyle = '#665845'; n.lineWidth = .8; n.beginPath(); n.moveTo(candle.x, 45); n.lineTo(candle.x, 54); n.stroke();
            n.fillStyle = '#3a2d1e'; n.fillRect(candle.x - 5, candle.y - 7, 10, 15);
            n.fillStyle = '#b48a50'; n.fillRect(candle.x - 3, candle.y - 5, 6, 10);
            n.fillStyle = '#dac398'; n.fillRect(candle.x - 1, candle.y + 1, 2, 5);
            n.fillStyle = '#f1c980'; n.beginPath(); n.ellipse(candle.x, candle.y - 1, 1.5, 3, 0, 0, Math.PI * 2); n.fill();
            n.strokeStyle = '#59462c'; n.strokeRect(candle.x - 5, candle.y - 7, 10, 15);
        }
        boats.push({ image: nauka, x: .16, depth: .12, width: .105, phase: 4.2, facing: 1,
            lampPixels: candlePixels, waterline: 104, screenX: 0, screenY: 0, screenWidth: 0, roll: 0 });
        const lamps: RiverLamp[] = Array.from({ length: 10 }, (_, i) => ({ x: 0, y: 0, waterline: 0, width: 1,
            phase: i * 1.37, strength: i < 4 ? .13 : i < 6 ? .24 : .21, flicker: 1 }));
        return { homes, villageLamps, boats, lamps };
    }

    private riverTime() {
        return this.sim.quality === 'low' || this.reducedSkyMotion?.matches || this.host.parentElement?.classList.contains('reduced-motion') ? 0 : this.sim.time;
    }
    private prepareRiver(horizon: number, time: number) {
        const shoreHeight = clamp(this.height * .028, 16, 26), shoreTop = horizon - shoreHeight + 1;
        for (let i = 0; i < this.riverArt.villageLamps.length; i++) {
            const source = this.riverArt.villageLamps[i], lamp = this.riverArt.lamps[i];
            lamp.x = source.x * this.width; lamp.y = shoreTop + source.y * shoreHeight;
            lamp.waterline = horizon + 2; lamp.width = .9;
        }
        const wind = time ? this.sim.wind : 0;
        let lampIndex = 4;
        for (let i = 0; i < this.riverArt.boats.length; i++) {
            const boat = this.riverArt.boats[i];
            const width = clamp(this.width * boat.width, i === 0 ? 32 : i === 1 ? 25 : 66,
                i === 0 ? 74 : i === 1 ? 56 : 138), scale = width / boat.image.width;
            boat.screenX = this.width * boat.x + Math.sin(time * .28 + boat.phase) * wind * 1.1;
            sampleWater(boat.x * 160, -boat.depth * 600, time * this.sim.wind, this.waterSample);
            boat.screenY = horizon + this.height * boat.depth + this.waterSample.height * 22;
            boat.screenWidth = width; boat.roll = this.waterSample.slopeX * 2.5;
            for (const source of boat.lampPixels) {
                const lamp = this.riverArt.lamps[lampIndex++];
                const localX = (source.x - boat.image.width / 2) * scale * boat.facing, localY = (source.y - boat.waterline) * scale;
                lamp.x = boat.screenX + localX * Math.cos(boat.roll) - localY * Math.sin(boat.roll);
                lamp.y = boat.screenY + localX * Math.sin(boat.roll) + localY * Math.cos(boat.roll);
                lamp.waterline = boat.screenY; lamp.width = i === 2 ? width * .022 : width * .045;
                lamp.flicker = time && !this.sim.reducedFlashes ? 1 + Math.sin(time * 2.1 + lamp.phase) * .025 : 1;
            }
        }
    }
    private drawRiverReflections(time: number) {
        const c = this.ctx;
        c.fillStyle = '#ae8252';
        for (const lamp of this.riverArt.lamps) {
            const start = lamp.waterline + Math.max(1, lamp.waterline - lamp.y) * .55;
            const fragments = this.sim.quality === 'low' ? 4 : 8;
            for (let i = 0; i < fragments; i++) {
                const y = start + i * (1.8 + lamp.width * .45), wave = Math.sin(i * 2.1 + time * .65 + lamp.phase);
                const width = lamp.width + i * .26 + (wave + 1) * .55;
                c.globalAlpha = lamp.strength * lamp.flicker * (this.sim.reducedFlashes ? .78 : 1) * (1 - i / fragments) * (.60 + wave * .15);
                c.fillRect(lamp.x + wave * (1 + i * .20) - width / 2, y, width, i % 3 === 0 ? .8 : .55);
            }
        }
    }
    private drawRiverBoats() {
        const c = this.ctx;
        for (const boat of this.riverArt.boats) {
            const scale = boat.screenWidth / boat.image.width;
            c.save(); c.translate(boat.screenX, boat.screenY); c.rotate(boat.roll); c.scale(boat.facing, 1);
            // A bounded contact shadow and two subdued ripples anchor the cached
            // silhouette to the water without adding another animated canvas.
            c.globalAlpha = .32; c.fillStyle = '#02060a'; c.beginPath();
            c.ellipse(0, 1, boat.screenWidth * .46, Math.max(1, boat.screenWidth * .016), 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#294050'; c.lineWidth = .6; c.globalAlpha = .25;
            for (let side = -1; side <= 1; side += 2) {
                c.beginPath(); c.ellipse(side * boat.screenWidth * .08, 2, boat.screenWidth * .51,
                    Math.max(1.5, boat.screenWidth * .035), 0, side < 0 ? 0 : Math.PI, side < 0 ? Math.PI : Math.PI * 2); c.stroke();
            }
            c.globalAlpha = 1; c.drawImage(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale); c.restore();
        }
        // Only a small lamp halo; the cached hulls and windows remain darker than firework heads.
        for (let i = 4; i < this.riverArt.lamps.length; i++) {
            const lamp = this.riverArt.lamps[i];
            this.glow(lamp.x, lamp.y, i >= 6 ? 3.1 : 2.1, '#bd9258', .12 * lamp.flicker * (this.sim.reducedFlashes ? .78 : 1));
        }
    }

    constructor(private host: HTMLDivElement, private sim: Simulation) {
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error('This browser cannot create a drawing canvas.');
        this.ctx = ctx;
        // Fixed 128px scratch and mask, never resized or allocated by pointer movement.
        this.starResponse.width = this.starResponse.height = 128;
        this.starResponseMask.width = this.starResponseMask.height = 128;
        const response = this.starResponse.getContext('2d'), mask = this.starResponseMask.getContext('2d');
        if (!response || !mask) throw new Error('This browser cannot prepare the celestial response.');
        this.starResponseContext = response;
        const gradient = mask.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.3, '#ffffffce'); gradient.addColorStop(1, '#ffffff00');
        mask.fillStyle = gradient; mask.fillRect(0, 0, 128, 128);
    }
    async init() {
        if (this.disposed) return;
        this.moonImage.onload = () => { if (!this.disposed) { this.moonReady = true; this.render(); } };
        this.moonImage.onerror = () => { if(!this.disposed){this.moonFailed=true;this.render();} };
        this.moonImage.src = `${import.meta.env.BASE_URL}art/moon-lro-v001.png`;
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
        this.layout = measureStage(this.host, this.mode === 'interactive');
        this.horizon = waterfrontHorizon(this.layout, true);
        updateMoonFrame(this.width, this.height, this.horizon, this.moonFrame);
        const framing = stageFraming(this.layout);
        this.baseline = framing.baseline;
        this.scale = framing.scale;
        const contactY = this.project(0, PROP_CONTACT_Y).y;
        this.compositions = FAMILIES.map(f => resolvePropComposition(this.layout,f.id,contactY,y=>this.sim.ground+(this.baseline-y)/this.scale));
        this.launchBounds = this.compositions.map(c=>resolveLaunchBounds(this.layout,c,(x,y)=>this.project(x,y),(x)=> (x-this.width/2)/this.scale));
        this.previewProfile = undefined;
        this.sim.setViewport(Math.min(160, this.layout.heroRect.width / this.scale * .9), 16);
        this.setQuality(this.sim.quality);
    }
    startupMoon(): Readonly<MoonFrame> | null { return this.initialized ? this.moonFrame : null; }
    readiness(): RendererStartup {
        const settled=this.moonReady||this.moonFailed;
        return {completed:settled?1:0,total:1,pending:!settled,degraded:this.moonFailed,
            detail:this.moonReady?'Scene ready':this.moonFailed?'Scene ready with fallback moon':'Loading moon'};
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
    resolveLaunchProfile(id: FamilyId, placement = this.sim.placement) {
        const index=familyIndex(id),prop=this.compositions[index],bounds=this.launchBounds[index],scene=this.layout.unobstructedScene;
        const normalizedPlacement=clamp(placement,0,1),padX=bounds.worldMin+normalizedPlacement*(bounds.worldMax-bounds.worldMin);
        const screenX=bounds.screenMin+normalizedPlacement*(bounds.screenMax-bounds.screenMin);
        const profile=resolveScreenLaunchProfile(this.layout,id,this.scale,y=>this.sim.ground+(this.baseline-y)/this.scale,scene.x+scene.width/2,prop);
        const effectScale=profile.effectScale??1;
        const nearDepthFactor=index>=10?240/Math.max(140,240-65*effectScale):1;
        const aimScreenX=resolveLaunchAimScreenX(this.layout,id,this.scale,screenX,effectScale,nearDepthFactor);
        return {...profile,
            padX,aimX:(aimScreenX-this.width/2)/this.scale,normalizedPlacement};
    }
    private nextProfile() {
        const index=familyIndex(this.sim.selected);
        if(!this.previewProfile||this.previewFamily!==index||this.previewPlacement!==this.sim.placement) {
            this.previewFamily=index;this.previewPlacement=this.sim.placement;this.previewProfile=this.resolveLaunchProfile(this.sim.selected,this.sim.placement);
        }
        return this.previewProfile;
    }
    projectPlacement(clientX: number, id=this.sim.selected) {
        const bounds=this.launchBounds[familyIndex(id)];
        return clamp((clientX-this.layout.viewport.x-bounds.screenMin)/(bounds.screenMax-bounds.screenMin),0,1);
    }
    projectLaunchPosition(placement:number): [number,number] {
        const bounds=this.launchBounds[familyIndex(this.sim.selected)];
        return [this.layout.viewport.x+bounds.screenMin+clamp(placement,0,1)*(bounds.screenMax-bounds.screenMin),this.layout.viewport.y+bounds.contactScreenY];
    }
    projectBurst(clientX: number, clientY: number): [number, number] | null {
        const l = this.layout, x = clientX - l.viewport.x, y = clientY - l.viewport.y, r = l.burstCanopy;
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
            ? [(x - this.width / 2) / this.scale, this.sim.ground + (this.baseline - y) / this.scale] : null;
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
    private drawWater() {
        const c = this.ctx, s = this.sim, horizon = this.height * this.horizon, riverTime = this.riverTime();
        this.prepareRiver(horizon, riverTime);
        const water = c.createLinearGradient(0, horizon, 0, this.height);
        water.addColorStop(0, '#0b1d2b'); water.addColorStop(1, '#040b12');
        c.globalAlpha = 1; c.fillStyle = water; c.fillRect(0, horizon, this.width, this.height - horizon);
        c.fillStyle = '#090f17'; c.beginPath(); c.moveTo(0, horizon);
        for (let x = 0; x <= this.width; x += 8) c.lineTo(x, horizon - 4 - Math.sin(x * .013) * 5 - Math.sin(x * .047) * 2);
        c.lineTo(this.width, horizon + 2); c.lineTo(0, horizon + 2); c.fill();
        const shoreHeight = clamp(this.height * .028, 16, 26);
        c.globalAlpha = 1; c.drawImage(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);
        c.save(); c.beginPath(); c.rect(0, horizon + 2, this.width, this.height - horizon); c.clip(); c.globalCompositeOperation = 'lighter';
        // Finite perspective ripples: independently advected, broken moonlight,
        // with smaller/softer fragments at the horizon. No extra canvas or pass.
        const moonX = this.moonFrame.x;
        for (let i = 0; i < 96; i++) {
            const depth = (i + .5) / 96, y = horizon + depth * (this.height-horizon);
            const crossing = Math.sin(i*2.399 + riverTime*.67) * Math.sin(i*.79-riverTime*.43);
            const drift = Math.sin(i*.37+riverTime*.21) * (2+depth*12);
            const halfWidth = (2+depth*this.width*.055) * (.55+crossing*.32);
            c.fillStyle = '#8ca4b8'; c.globalAlpha = this.moonReady ? (.014+depth*.037) * (.6+crossing*.4) : .008;
            c.fillRect(moonX+drift-halfWidth,y,halfWidth*2,.5+depth*.6);
            c.fillStyle = '#35556d'; c.globalAlpha = .05+depth*.05;
            const x = ((i * .61803398875 + riverTime*.002) % 1)*this.width;
            c.fillRect(x,y,3+depth*18,.45+depth*.45);
        }
        this.drawRiverReflections(riverTime);
        const p = s.heads, step = Math.max(1, Math.ceil(p.count / 450));
        for (let i = 0; i < p.count; i += step) {
            if (p.age[i] < 0) continue;
            const point = this.project(p.x[i], p.y[i], p.z[i]);
            const reflected = horizon + (horizon - point.y) * .38;
            c.fillStyle = this.tone(p.r[i], p.g[i], p.b[i]);
            for (let j = 0; j < 3; j++) {
                const y = reflected + j * 3, ripple = Math.sin(y * .7 + s.time * s.wind * 2);
                c.globalAlpha = p.gain[i] * Math.max(0, 1 - p.age[i] / p.life[i]) * (s.reducedFlashes ? .10 : .16) * (1 - j * .2);
                c.fillRect(point.x + ripple * 4 - 2, y, 3 + (ripple + 1) * 4, 1);
            }
        }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        this.drawRiverBoats(); c.globalAlpha = 1;
        c.fillStyle = '#111c27'; c.fillRect(0, this.height * .92, this.width, this.height * .08);
        c.strokeStyle = '#293340'; c.lineWidth = .5;
        for (let x = -this.width; x < this.width * 2; x += 70) { c.beginPath(); c.moveTo(this.width / 2 + (x - this.width / 2) * .75, this.height * .92); c.lineTo(x, this.height); c.stroke(); }
    }
    private drawCelestialResponse(left: number, top: number, width: number, height: number, strength: number) {
        const frame = this.celestialFrame;
        if (frame.engagement <= .001) return;
        const radius = CELESTIAL_LIMITS.responseRadiusPixels, scale = 128 / (radius * 2);
        const x = frame.pointerX * this.width, y = frame.pointerY * this.height;
        const response = this.starResponseContext;
        response.setTransform(1, 0, 0, 1, 0, 0); response.globalAlpha = 1;
        response.globalCompositeOperation = 'source-over'; response.clearRect(0, 0, 128, 128);
        response.drawImage(this.celestialArt.nearStars,
            (left + frame.nearX - x + radius) * scale, (top + frame.nearY - y + radius) * scale, width * scale, height * scale);
        response.globalCompositeOperation = 'destination-in'; response.drawImage(this.starResponseMask, 0, 0);
        response.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = strength * frame.engagement * .28;
        this.ctx.drawImage(this.starResponse, x - radius, y - radius, radius * 2, radius * 2);
    }
    private drawCelestialMeteor() {
        const meteor = this.celestialFrame.meteor;
        if (!meteor.active) return;
        const c = this.ctx, dx = meteor.headX - meteor.tailX, dy = meteor.headY - meteor.tailY;
        c.strokeStyle = '#bfd4ed'; c.lineWidth = .8; c.lineCap = 'round';
        // Eight finite segments replace a freshly allocated gradient on every frame.
        for (let i = 0; i < 8; i++) {
            const start = i / 8, end = (i + 1) / 8;
            c.globalAlpha = meteor.opacity * end * end;
            c.beginPath(); c.moveTo(meteor.tailX + dx * start, meteor.tailY + dy * start);
            c.lineTo(meteor.tailX + dx * end, meteor.tailY + dy * end); c.stroke();
        }
        c.lineCap = 'butt'; c.globalAlpha = 1;
    }
    private drawStage() {
        const c=this.ctx,s=this.sim,profile=s.committed?.launchProfile??this.nextProfile(),prop=profile.prop!;
        const p=this.project(s.committed?.padX??profile.padX!,prop.contactY),radius=prop.padRadius*this.scale;
        c.globalAlpha=.4;c.fillStyle='#000';c.beginPath();c.ellipse(p.x,p.y+3,radius*1.32,radius*.27,0,0,Math.PI*2);c.fill();
        c.globalAlpha=1;c.fillStyle='#20262b';c.strokeStyle='#4e5455';c.lineWidth=.7;
        c.beginPath();c.ellipse(p.x,p.y+2,radius*1.08,radius*.22,0,0,Math.PI*2);c.fill();c.stroke();
        c.fillStyle='#353d41';c.strokeStyle='#81704b';c.beginPath();c.ellipse(p.x,p.y,radius*.9,radius*.19,0,0,Math.PI*2);c.fill();c.stroke();
    }
    private drawRocket(r: Pick<Rocket,'x'|'y'|'z'|'stage'|'age'|'ascent'|'fuse'|'family'> & {launchProfile?:Readonly<LaunchProfile>;vx?:number;vy?:number}) {
        const c=this.ctx,p=this.project(r.x,r.y,r.z),depth=this.scale*(240/Math.max(140,240-r.z));
        const model=r.launchProfile?.prop?.modelScale??ROCKET_SCALE,[radius,height]=ROCKET_PROFILES[r.family];
        const alpha=r.stage==='ascent'?flightBodyOpacity(r.age,r.ascent):1;
        if(alpha<.002)return;this.bodies++;
        c.save();c.translate(p.x,p.y);c.globalAlpha=alpha;
        if(r.stage==='ascent')c.rotate(-Math.atan2(r.vx??0,Math.max(14,r.vy??0)));
        c.scale(model[0]*depth,-model[1]*depth);
        c.fillStyle='#795537';c.fillRect(-.3475,-2.72,.115,6);
        const w=radius,h=3.25*height,lower=3.25-h/2,upper=3.25+h/2;
        const wrap=c.createLinearGradient(-w/2,0,w/2,0);
        wrap.addColorStop(0,'#1d3147');wrap.addColorStop(.4,signatureBody[r.family-10]??'#657c91');wrap.addColorStop(1,'#1d3147');
        c.fillStyle=wrap;c.fillRect(-w/2,lower,w,h);c.strokeStyle='#928267';c.lineWidth=.04;c.strokeRect(-w/2,lower,w,h);
        const tip=r.launchProfile?.prop?.localTop??upper+1.19;
        c.fillStyle=FAMILIES[r.family].color;c.beginPath();c.moveTo(-radius*.61,upper);c.lineTo(0,tip);c.lineTo(radius*.61,upper);c.closePath();c.fill();
        const fuse=r.stage==='fuse'?fusePointAt(r.age/r.fuse):fusePointAt(0);
        c.strokeStyle='#a19676';c.lineWidth=.044;c.beginPath();c.moveTo(FUSE_POINTS[0][0],FUSE_POINTS[0][1]);c.bezierCurveTo(FUSE_POINTS[1][0],FUSE_POINTS[1][1],FUSE_POINTS[2][0],FUSE_POINTS[2][1],FUSE_POINTS[3][0],FUSE_POINTS[3][1]);c.stroke();
        if(r.stage==='fuse'&&r.age>=0){c.fillStyle='#ffd18a';c.beginPath();c.arc(fuse[0],fuse[1],.12,0,Math.PI*2);c.fill();}
        c.restore();
    }
    render() {
        if (this.disposed || !this.initialized) return;
        const started = performance.now(), c = this.ctx, s = this.sim;
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.clearRect(0, 0, this.width, this.height);
        updateCelestialFrame(this.celestialFrame, this.skyState, this.width, this.height,
            this.mode !== 'transparent' && s.quality !== 'low' && !this.reducedSkyMotion?.matches &&
            !this.host.parentElement?.classList.contains('reduced-motion'), s.reducedFlashes);
        if (this.mode !== 'transparent') {
            const sky = c.createLinearGradient(0, 0, 0, this.height);
            sky.addColorStop(0, '#030916'); sky.addColorStop(.62, '#0c1b2b'); sky.addColorStop(1, '#050b13');
            c.fillStyle = sky; c.fillRect(0, 0, this.width, this.height);
            const crop = Math.min(1.35, Math.max(.26, this.width / this.height / 2));
            const panoramaWidth = this.width / crop, skyHeight = this.height * this.horizon / .872;
            const left = (this.width - panoramaWidth) / 2;
            c.drawImage(this.celestialArt.stars, left, 0, panoramaWidth, skyHeight);
            const skyTime = this.celestialFrame.time, frame = this.celestialFrame;
            const celestialCrop = Math.max(.6, crop), celestialWidth = this.width / celestialCrop;
            const celestialHeight = celestialWidth / 2, celestialLeft = (this.width - celestialWidth) / 2;
            const ySpan = this.height / celestialHeight, celestialTop = -Math.min(0, 1 - ySpan) * .065 * celestialHeight;
            const angle = Math.sin(skyTime * .022) * .010;
            c.save(); c.beginPath(); c.rect(0, 0, this.width, this.height * this.horizon); c.clip();
            c.globalAlpha = (s.quality === 'ultra' ? .60 : s.quality === 'standard' ? .48 : .30) * (s.reducedFlashes ? .72 : 1);
            c.translate(this.width / 2 + frame.dustX - Math.sin(skyTime * .018) * celestialWidth * .005,
                celestialTop + celestialHeight / 2 + frame.dustY + (Math.cos(skyTime * .018) - 1) * celestialHeight * .003);
            c.rotate(angle); c.drawImage(this.celestialArt.dust, -celestialWidth / 2, -celestialHeight / 2, celestialWidth, celestialHeight); c.restore();
            const nearStrength = (s.quality === 'ultra' ? .85 : s.quality === 'standard' ? .66 : .44) * (s.reducedFlashes ? .82 : 1);
            c.save(); c.beginPath(); c.rect(0, 0, this.width, this.height * this.horizon); c.clip();
            c.globalAlpha = nearStrength * frame.twinkle;
            c.drawImage(this.celestialArt.nearStars, celestialLeft + frame.nearX, celestialTop + frame.nearY, celestialWidth, celestialHeight);
            this.drawCelestialResponse(celestialLeft, celestialTop, celestialWidth, celestialHeight, nearStrength);
            c.restore(); this.drawCelestialMeteor();
            if (this.moonReady) {
                const m = this.moonFrame, diameter = m.radius * 2 / .95;
                this.glow(m.x, m.y, m.radius * 2.5, '#a8bfd8', .065);
                c.globalAlpha = .90; c.drawImage(this.moonImage, m.x-diameter/2, m.y-diameter/2, diameter, diameter);
            }
            c.globalAlpha = 1;
        }
        if (this.mode !== 'transparent') this.drawWater();
        this.staged = this.airborne = this.bodies = 0;
        if (this.mode === 'interactive') {
            this.drawStage();
            if (!s.committed && !s.show) {
                this.staged++;
                const next=this.nextProfile();
                this.drawRocket({ x:next.padX!,y:next.ground!,z:0,stage:'fuse',age:-1,ascent:1,fuse:1,family:familyIndex(s.selected),launchProfile:next });
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
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const trails = s.trails;
        const step = Math.max(1, Math.ceil(trails.count / (s.quality === 'low' ? 2500 : 6500)));
        for (let i = 0; i < trails.count; i += step) {
            const age = trails.age[i] / trails.life[i];
            if (age > .97) continue;
            const a = this.project(trails.ax[i], trails.ay[i], trails.az[i]), b = this.project(trails.bx[i], trails.by[i], trails.bz[i]);
            c.globalAlpha = Math.pow(1 - age, 1.35) * (s.reducedFlashes ? .58 : .75);
            c.strokeStyle = this.tone(trails.r[i], trails.g[i], trails.b[i]); c.lineWidth = Math.max(.55, trails.width[i] * this.scale * 2 * (1 - age * .65));
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
        for (const pool of [s.heads, s.embers]) for (let i = 0; i < pool.count; i++) {
            if (pool.age[i] < 0) continue;
            const p = this.project(pool.x[i], pool.y[i], pool.z[i]);
            const alpha = pool.gain[i] * Math.pow(Math.max(0, 1 - pool.age[i] / pool.life[i]), .85);
            // Quantize glow colours to avoid a new texture for every star.
            const quantize = (value: number) => Math.round(value * 8) / 8;
            this.glow(p.x, p.y, pool === s.embers ? 1.9 : 3.1, this.tone(quantize(pool.r[i]), quantize(pool.g[i]), quantize(pool.b[i])), alpha * (s.reducedFlashes ? .72 : .9));
        }
        for (const r of s.rockets) if (r.stage === 'ascent') {
            const p = this.project(...rocketPoint(r, SHELL_LOCAL_Y));
            this.glow(p.x, p.y, 4.3, r.family >= 10 ? this.tone(...signatureTint(r.family)) : '#ffcf86', .9);
        }
        for (const carrier of s.cues) { const p = this.project(carrier.x, carrier.y, carrier.z); this.glow(p.x, p.y, 3.5, this.tone(...carrierTint(carrier.family, carrier.palette)), .8); }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        const nextGround = this.nextProfile();
        const ground = this.project(nextGround.padX!, nextGround.prop!.contactY);
        this.host.parentElement?.style.setProperty('--ground-px', `${this.height - ground.y}px`);
        this.host.parentElement?.style.setProperty('--placement-left', `${ground.x / this.width * 100}%`);
        this.host.dataset.stagedRockets = String(this.staged); this.host.dataset.airborneRockets = String(this.airborne);
        this.metrics.frames++; this.metrics.submitMs = performance.now() - started;
    }
    diagnostics() {
        const signatureBounds = signatureEnvelope(this.sim.heads, (x, y, z) => this.project(x, y, z));
        const r = this.sim.committed;
        const shell = r ? rocketPoint(r, SHELL_LOCAL_Y) : null;
        const profile=r?.launchProfile??this.nextProfile(),prop=profile.prop??this.compositions[familyIndex(this.sim.selected)];
        return { ...propProjectionDiagnostics(prop,r?.padX??profile.padX!,(x,y)=>this.project(x,y)),launchBounds:this.launchBounds[r?.family??familyIndex(this.sim.selected)],nextLaunchProfile:this.nextProfile(),
            signatureBounds, moon: { ...this.moonFrame, ready: this.moonReady, source: "NASA LRO / fixed gibbous" }, stageLayout: this.layout, stagedRockets: this.staged, airborneRockets: this.airborne, visibleRocketBodies: this.bodies,
            ...celestialDiagnostics(this.celestialFrame), skyHorizon: this.horizon, skyLayers: 3, skyTextures: 0,
            skyArtWidth: this.celestialArt.stars.width, skyArtHeight: this.celestialArt.stars.height,
            skyCelestialCrop: Math.max(.6, Math.min(1.35, this.width / this.height / 2)), skyResponseCachePixels: 32768,
            skyFieldStars: this.celestialArt.metadata.fieldStars, skyClusterStars: this.celestialArt.metadata.clusteredStars,
            skyNearStars: this.celestialArt.metadata.nearStars, skyDustSpecks: this.celestialArt.metadata.dustSpecks,
            skyArtRgbaBytes: this.celestialArt.metadata.rgbaBytes,
            riverScenery: 'original Canvas river', riverBoats: this.mode === 'transparent' ? 0 : this.riverArt.boats.length,
            riverLampAnchors: this.mode === 'transparent' ? 0 : this.riverArt.lamps.length,
            riverReflectionFragments: this.mode === 'transparent' ? 0 : this.riverArt.lamps.length * (this.sim.quality === 'low' ? 4 : 8),
            riverMotionTime: this.riverTime(), riverPositions: this.riverArt.boats.map(boat => ({ x: boat.screenX, y: boat.screenY, roll: boat.roll })),
            shellScreen: shell ? this.project(...shell) : null,
            apexScreen: r ? this.project(r.launchProfile?.aimX??r.x, r.top + (r.launchProfile?.prop?.shellOffset??SHELL_LOCAL_Y*ROCKET_SCALE[1]), r.z) : null,
            launchProfile: r?.launchProfile ?? null,
            flight: r ? { id: r.id, stage: r.stage, age: r.age, ascent: r.ascent, thrust: r.thrust, y: r.y, vy: r.vy, top: r.top, family: r.family, shell } : null };
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true; this.moonImage.onload = null; this.moonImage.onerror=null; this.moonImage.src = ""; this.canvas.remove(); this.glows.clear();
        this.celestialArt.stars.width = this.celestialArt.stars.height = 1;
        this.celestialArt.dust.width = this.celestialArt.dust.height = 1;
        this.celestialArt.nearStars.width = this.celestialArt.nearStars.height = 1;
        this.starResponse.width = this.starResponse.height = 1;
        this.starResponseMask.width = this.starResponseMask.height = 1;
        this.riverArt.homes.width = this.riverArt.homes.height = 1;
        for (const boat of this.riverArt.boats) boat.image.width = boat.image.height = 1;
        this.canvas.width = this.canvas.height = 1;
    }
}

