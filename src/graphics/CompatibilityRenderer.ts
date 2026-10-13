import { WORLD_CAPABILITIES } from './SceneCapabilities';
import type { SceneCapabilities } from './SceneCapabilities';
import { burstDepth, recedingShellSize } from '../engine/LegacyRealism';
import { starColor, aerialTransmission } from '../engine/StarAppearance.js';
import { SmokeOcclusion } from '../engine/SmokeOcclusion.js';
import { CINEMA_BASE_EXPOSURE } from '../engine/CinematicResponse.js';
import { canopyAlpha, canopyStretch, illuminateSmoke } from '../engine/SmokeCanopy.js';
import { BURST_LIGHT_CAPACITY, burstLightEnergy, gatherBurstLighting, limitBurstRadiance } from '../engine/BurstLighting.js';
import { measureStage, stageFraming, waterfrontHorizon } from '../engine/StageLayout';
import type { StageLayout } from '../engine/StageLayout';
import { resolveScreenLaunchProfile, resolveLaunchAimScreenX, resolveLegacyLaunchProfile, legacyCompositionScale, signatureCompositionScale } from '../engine/LaunchProfile';
import type { LaunchProfile } from '../engine/LaunchProfile';
import type { RendererStartup } from '../engine/StartupProgress';
import { PROP_CONTACT_Y, resolvePropComposition, resolveLaunchBounds, propProjectionDiagnostics } from '../engine/LaunchComposition';
import type { LaunchPropComposition, LaunchBounds } from '../engine/LaunchComposition';
import { signatureBody } from '../engine/FlagshipEffects';
import { signatureEnvelope, effectEnvelope } from '../engine/SignatureDiagnostics';
import { carrierTint } from '../engine/GrandEffects';
import { BUDGETS, FAMILIES, ROCKET_PROFILES, clamp, familyIndex, randomStream } from '../engine/catalog';
import type { FamilyId, Quality } from '../engine/catalog';
import type { Simulation, Rocket } from '../engine/Simulation';
import type { RendererPort } from '../engine/RendererPort';
import { flightBodyOpacity, rocketPoint, SHELL_LOCAL_Y } from '../engine/LaunchGeometry';
import { FUSE_POINTS, fusePointAt, ROCKET_SCALE } from '../engine/FusePath';
import type { DisplayMode } from '../platform/presentation';
import { updateMoonFrame } from './MoonComposition';
import type { MoonFrame, MoonObstacle, MoonMotion } from './MoonComposition';
import { sampleWater, sampleWaterHeight, updateWaterFrame, waterDisplacementBound, WATER_NEAR_Z, WaterInteraction } from './WaterWaves';
import type { WaterFrame, WaterSample } from './WaterWaves';
import { boundGlassSurfaces } from './GlassMath';
import type { GlassSurface } from './GlassMath';
import { makeGalaxySky } from './GalaxySky';
import type { SkyState } from '../engine/SkyState';
import { CELESTIAL_LIMITS, celestialDiagnostics, createCelestialFrame, updateCelestialFrame } from './CelestialScene';
import { ShorelineCanvas } from './ShorelineCanvas';
import { resolveShorelineLaunch } from './ShorelineLaunch';
import { CanvasSeaFleet } from './CanvasSeaFleet';
import type { SeaAudienceSession } from './SeaAudienceSession';
import { SEA_WAVE_GAINS } from './SeaFleetState';

type RiverLamp = { x: number; y: number; waterline: number; width: number; phase: number; strength: number; flicker: number };
type RiverBoat = { image: HTMLCanvasElement; x: number; depth: number; width: number; phase: number; facing: number;
    lampPixels: { x: number; y: number }[]; waterline: number; screenX: number; screenY: number; screenWidth: number; roll: number;
    sampledHeight?: number; contactError?: number };

/** GPU-independent fallback, not a substitute for the primary 3D renderer.
 * Flight, splitting, wind, pause and all thirteen effects use the unchanged simulation.
 */
export class CompatibilityRenderer implements RendererPort {
    private readonly shorelineCity = new ShorelineCanvas();
    readonly backend = 'Canvas 2D · compatibility';
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly moonImage = new Image();
    private readonly fallbackMoon = this.makeFallbackMoon();
    private moonDeadline = 0;
    private moonReady = false;
    private moonFailed = false;
    private readonly moonFrame = { x: 0, y: 0, radius: 15 };
    private readonly moonMotion: MoonMotion = { time: 0, motionAllowed: false, pulseAt: -Infinity, obstructions: [] };
    private readonly waterInteraction = new WaterInteraction();
    private glassSurfaces: readonly GlassSurface[] = [];
    private glassAllowed = true;
    private glassSuspended = false;
    private debugGlassOff = new URLSearchParams(location.search).get('glass') === 'off';
    private starTapAt = -Infinity;
    private starTapX = .5;
    private starTapY = .25;
    private readonly waterSample = { height: 0, slopeX: 0, slopeZ: 0 };
    private readonly hullSamples = Array.from({ length: 4 }, () => ({ height: 0, slopeX: 0, slopeZ: 0 }));
    private readonly waterFrame: WaterFrame = { phase: 0, waveCount: 4, farZ: -1000, nearZ: WATER_NEAR_Z, motionAllowed: true };
    private readonly waterFacetPose = new Float64Array(96 * 3);
    private reflectedWaterHeads = 0;
    private riverContactChecksum = 0;
    private riverReflectionChecksum = 0;
    private readonly canvas = document.createElement('canvas');
    private readonly ctx: CanvasRenderingContext2D;
    private readonly sea?: CanvasSeaFleet;
    setSeaSession(session: SeaAudienceSession) { this.sea?.setSession(session); }
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
    private lakeMix = 1;
    private letterMix = 1;
    private protectedRects: { x: number; y: number; width: number; height: number }[] = [];
    setLakeMix(value: number) { this.lakeMix = clamp(value, 0, 1); }
    setLetterMix(value: number) { this.letterMix = clamp(value, 0, 1); }
    setProtectedRects(rects: readonly { x: number; y: number; width: number; height: number }[]) {
        this.protectedRects = rects.slice(0, 24).filter(r => Number.isFinite(r.x + r.y + r.width + r.height) && r.width > 0 && r.height > 0).map(r => ({ ...r }));
    }
    sceneCanvas() { return this.canvas; }
    authoredScale() { return this.scale; }
    pointAt(x: number, y: number): [number, number] {
        return [(clamp(x, 0, 1) - .5) * this.width / this.scale, this.sim.ground + (this.baseline - clamp(y, 0, 1) * this.height) / this.scale];
    }
    pixelPoint(x: number, y: number, z = 0) { return this.project(x, y, z); }
    setLayout(layout: StageLayout) { this.layout = layout; }
    setSkyState(state: Readonly<SkyState>) { this.skyState = state; }
    setGlassSurfaces(surfaces: readonly GlassSurface[], enabled = true) { this.glassSurfaces = boundGlassSurfaces(surfaces, this.width, this.height); this.glassAllowed = enabled; }
    setGlassEnabled(enabled: boolean) { this.glassSuspended = !enabled; }
    setGlassDiagnosticOff(disabled: boolean) { this.debugGlassOff = disabled; }
    setGlassScatterTaps(_taps: 1 | 3 | 5) { /* No GPU refraction is claimed by Canvas. */ }
    setMoonObstructions(rects: readonly MoonObstacle[]) { this.moonMotion.obstructions = rects.slice(0, 16); }
    moonPulse() {
        if (!this.capabilities.enhanced || !this.moonMotion.motionAllowed) return false;
        this.moonMotion.pulseAt = this.sim.time; return true;
    }
    environmentTap(kind: 'sky' | 'water' | 'moon', x: number, y: number) {
        if (!this.capabilities.interactions || this.sim.paused || this.sim.reducedMotion || !this.moonMotion.motionAllowed) return false;
        if (kind === 'moon') return this.moonPulse();
        if (kind === 'sky') { this.starTapAt = this.sim.time; this.starTapX = x / this.width; this.starTapY = y / this.height; return true; }
        if (!this.waterFrame.motionAllowed) return false;
        const horizon = this.height * this.horizon, span = Math.max(1, this.height * .92 - horizon);
        const depth = clamp((y - horizon) / span, 0, 1);
        const z = this.waterFrame.nearZ + (this.waterFrame.farZ - this.waterFrame.nearZ) * (1 - depth) / (1 + depth * 7);
        const nearWidth = this.width < 680 ? 96 : 260;
        return this.waterInteraction.add((x / this.width - .5) * (nearWidth - z * 1.7), z, this.sim.time, this.waterFrame);
    }
    private mode: DisplayMode = 'interactive';
    private width = 1;
    private height = 1;
    private baseline = 1;
    private horizon = .72;
    private scale = 1;
    private ratio = 1;
    private resolutionScale = 1;
    private readonly canopyLight = new Float32Array(6);
    private readonly canopyOrder: number[] = [];
    setResolutionScale(scale: number) { const next = Math.max(.65, Math.min(1, scale)); if (Math.abs(next - this.resolutionScale) > .001) { this.resolutionScale = next; this.setQuality(this.sim.quality); } }
    private disposed = false;
    private initialized = false;
    private staged = 0;
    private readonly legacyProfiles: (LaunchProfile | undefined)[] = Array(10);
    private airborne = 0;
    private bodies = 0;
    private readonly glows = new Map<string, HTMLCanvasElement>();
    private readonly starTone = new Float32Array(3);
    private readonly occlusion = new SmokeOcclusion();
    private readonly burstWash = new Float32Array(7);
    private readonly tintMask = document.createElement('canvas');
    private readonly tintContext = this.tintMask.getContext('2d')!;
    /** Cached native fallback artwork; failed media still leaves a lunar disc
     * and its shared reflection, without waiting forever or reading pixels. */
    private makeFallbackMoon() {
        const image = document.createElement('canvas'); image.width = image.height = 128;
        const c = image.getContext('2d')!;
        const light = c.createRadialGradient(42, 38, 4, 64, 64, 61);
        light.addColorStop(0, '#d1d0c8'); light.addColorStop(.68, '#aaaeb0'); light.addColorStop(1, '#687789');
        c.fillStyle = light; c.beginPath(); c.arc(64, 64, 60, 0, Math.PI * 2); c.fill();
        c.save(); c.clip();
        const random = randomStream(20261104);
        for (let i = 0; i < 36; i++) {
            const x = 12 + random() * 104, y = 12 + random() * 104, radius = 2 + random() * 10;
            c.fillStyle = '#53616c30'; c.beginPath(); c.ellipse(x, y, radius, radius * .72, .2, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#e2ddd31f'; c.lineWidth = .8; c.stroke();
        }
        c.restore(); return image;
    }
    private settleMoon(success: boolean) {
        if (this.disposed || this.moonReady || this.moonFailed) return;
        clearTimeout(this.moonDeadline); this.moonDeadline = 0;
        this.moonReady = success; this.moonFailed = !success; this.render();
    }
    /** Reuse one bounded alpha mask; never paint a coloured rectangle over a boat. */
    private drawSurfaceTint(image: HTMLCanvasElement, x: number, y: number, width: number, height: number) {
        const peak = Math.max(this.burstWash[0], this.burstWash[1], this.burstWash[2]);
        if (peak < .001) return;
        const mask = this.tintContext, c = this.ctx;
        mask.clearRect(0, 0, 1024, 128); mask.globalCompositeOperation = 'source-over';
        mask.drawImage(image, 0, 0); mask.globalCompositeOperation = 'source-in';
        mask.fillStyle = this.tone(this.burstWash[0] / peak, this.burstWash[1] / peak, this.burstWash[2] / peak);
        mask.fillRect(0, 0, image.width, image.height);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = peak * .65;
        c.drawImage(this.tintMask, 0, 0, image.width, image.height, x, y, width, height); c.restore();
    }

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
        return this.waterFrame.phase;
    }
    /** One perspective map for hulls, lamps and surface fragments. */
    private sampleScreenWater(x: number, y: number, out: WaterSample) {
        const horizon = this.height * this.horizon, span = Math.max(1, this.height * .92 - horizon);
        const depth = clamp((y - horizon) / span, 0, 1);
        const z = this.waterFrame.nearZ + (this.waterFrame.farZ - this.waterFrame.nearZ) * (1 - depth) / (1 + depth * 7);
        const nearWidth = this.width < 680 ? 96 : 260;
        const worldX = (x / this.width - .5) * (nearWidth - z * 1.7);
        return sampleWater(worldX, z, this.waterFrame.phase, out, this.waterFrame);
    }
    private screenWaterHeight(x: number, y: number) {
        const horizon = this.height * this.horizon, span = Math.max(1, this.height * .92 - horizon);
        const depth = clamp((y - horizon) / span, 0, 1);
        const z = this.waterFrame.nearZ + (this.waterFrame.farZ - this.waterFrame.nearZ) * (1 - depth) / (1 + depth * 7);
        const nearWidth = this.width < 680 ? 96 : 260;
        return sampleWaterHeight((x / this.width - .5) * (nearWidth - z * 1.7), z, this.waterFrame.phase, this.waterFrame);
    }
    private prepareRiver(horizon: number, time: number) {
        const shoreHeight = clamp(this.height * .028, 16, 26), shoreTop = horizon - shoreHeight + 1;
        for (let i = 0; i < this.riverArt.villageLamps.length; i++) {
            const source = this.riverArt.villageLamps[i], lamp = this.riverArt.lamps[i];
            lamp.x = source.x * this.width; lamp.y = shoreTop + source.y * shoreHeight;
            lamp.waterline = horizon + 2; lamp.width = .9;
        }
        let lampIndex = 4;
        for (let i = 0; i < this.riverArt.boats.length; i++) {
            const boat = this.riverArt.boats[i];
            const width = clamp(this.width * boat.width, i === 0 ? 32 : i === 1 ? 25 : 66,
                i === 0 ? 74 : i === 1 ? 56 : 138), scale = width / boat.image.width;
            boat.screenX = this.width * boat.x;
            const baseY = horizon + this.height * boat.depth, halfBeam = Math.max(1, width * .035);
            this.sampleScreenWater(boat.screenX - width * .44, baseY, this.hullSamples[0]);
            this.sampleScreenWater(boat.screenX + width * .44, baseY, this.hullSamples[1]);
            this.sampleScreenWater(boat.screenX, baseY - halfBeam, this.hullSamples[2]);
            this.sampleScreenWater(boat.screenX, baseY + halfBeam, this.hullSamples[3]);
            const height = (this.hullSamples[0].height + this.hullSamples[1].height + this.hullSamples[2].height + this.hullSamples[3].height) * .25;
            const depth = clamp((baseY - horizon) / Math.max(1, this.height * .92 - horizon), 0, 1), heightScale = 3 + depth * 12;
            boat.screenY = baseY - height * heightScale;
            boat.screenWidth = width;
            boat.roll = Math.atan((this.hullSamples[0].height - this.hullSamples[1].height) * heightScale / (width * .88)) * (i === 2 ? .72 : 1);
            boat.sampledHeight = height;
            this.sampleScreenWater(boat.screenX, baseY, this.waterSample);
            boat.contactError = Math.abs(height - this.waterSample.height);
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
        this.riverReflectionChecksum = 0;
        c.fillStyle = '#ae8252';
        for (const lamp of this.riverArt.lamps) {
            if (this.sea && this.riverArt.lamps.indexOf(lamp) >= 4) continue;
            const start = lamp.waterline + Math.max(1, lamp.waterline - lamp.y) * .55;
            const fragments = this.sim.quality === 'low' ? 4 : 8;
            for (let i = 0; i < fragments; i++) {
                const baseY = start + i * (1.8 + lamp.width * .45);
                this.sampleScreenWater(lamp.x, baseY, this.waterSample);
                const wave = Math.sin(i * 2.1 + time * .65 + lamp.phase) * Math.sin(i * 1.37 - time * .29);
                const y = baseY - this.waterSample.height * (2 + i * .4);
                const width = (lamp.width + i * .31) * (.83 + wave * .27);
                this.riverReflectionChecksum += (lamp.x + wave * (1 + i * .20)) * (i + 1) + y * (i + 3) + width;
                c.globalAlpha = lamp.strength * lamp.flicker * (this.sim.reducedFlashes ? .78 : 1) * (1 - i / fragments) * (.60 + wave * .15);
                c.fillRect(lamp.x + wave * (1 + i * .20) - width / 2, y, width, i % 3 === 0 ? .8 : .55);
            }
        }
    }
    private drawRiverBoats() {
        if (this.sea) {
            this.sea.draw(this.ctx, this.width, this.height, this.height * this.horizon, this.waterFrame, this.waterFrame.motionAllowed, (x, y, z) => this.project(x, y, z));
            this.host.dataset.sparkSeaState = JSON.stringify(this.sea.diagnostics());
            return;
        }
        const c = this.ctx;
        this.riverContactChecksum = 0;
        for (const boat of this.riverArt.boats) {
            const scale = boat.screenWidth / boat.image.width;
            this.riverContactChecksum += boat.screenX * 3 + boat.screenY * 5 + boat.roll * 7;
            c.save(); c.translate(boat.screenX, boat.screenY); c.rotate(boat.roll); c.scale(boat.facing, 1);
            // Broken, compressed silhouette fragments anchor the cached hull.
            // No additional sprites or unbounded surface particles are needed.
            const bandHeight = 5;
            for (let band = 0; band < 4; band++) {
                c.globalAlpha = .085 * (1 - band * .18);
                const sourceY = Math.max(0, boat.waterline - (band + 1) * bandHeight);
                const shift = Math.sin(band * 2.399 + this.waterFrame.phase * .41 + boat.phase) * (1 + band * .3);
                c.save(); c.translate(shift, 2 + band * 2.3); c.scale(1, -1);
                c.drawImage(boat.image, 0, sourceY, boat.image.width, bandHeight,
                    -boat.screenWidth / 2, 0, boat.screenWidth, 1.6); c.restore();
            }
            c.globalAlpha = .48; c.fillStyle = '#02060a'; c.beginPath();
            c.ellipse(0, .8, boat.screenWidth * .45, Math.max(.7, boat.screenWidth * .010), 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#536e83'; c.lineWidth = .6;
            for (let fragment = 0; fragment < 6; fragment++) {
                const phase = (this.waterFrame.phase * .065 + fragment * .173 + boat.phase * .043) % 1;
                const x = Math.sin(fragment * 2.399 + boat.phase) * boat.screenWidth * .30;
                const baseY = (fragment % 2 ? -1 : 1) * (1.5 + phase * 2) + 1;
                this.sampleScreenWater(boat.screenX + x * boat.facing, boat.screenY + baseY, this.waterSample);
                const y = baseY - (this.waterSample.height - (boat.sampledHeight ?? 0)) * 10;
                this.riverContactChecksum += x * (fragment + 1) + y * (fragment + 3) + phase;
                c.globalAlpha = .025 + .23 * Math.sin(Math.PI * phase) * (1 - phase);
                c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + boat.screenWidth * .06, y + .6,
                    x + boat.screenWidth * (.13 + fragment % 3 * .035), y); c.stroke();
            }
            c.globalAlpha = 1; c.drawImage(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale);
            this.drawSurfaceTint(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale); c.restore();
        }
        // Only a small lamp halo; the cached hulls and windows remain darker than firework heads.
        for (let i = 4; i < this.riverArt.lamps.length; i++) {
            const lamp = this.riverArt.lamps[i];
            this.glow(lamp.x, lamp.y, i >= 6 ? 3.1 : 2.1, '#bd9258', .12 * lamp.flicker * (this.sim.reducedFlashes ? .78 : 1));
        }
    }

    constructor(private host: HTMLDivElement, private sim: Simulation, private readonly particleGlowScale = 1, private readonly capabilities: SceneCapabilities = WORLD_CAPABILITIES) {
        if (capabilities.fleet) { this.sea = new CanvasSeaFleet(); this.waterFrame.gains = SEA_WAVE_GAINS; }
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error('This browser cannot create a drawing canvas.');
        this.ctx = ctx;
        this.tintMask.width = 1024; this.tintMask.height = 128;
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
        this.moonImage.onload = () => { void this.moonImage.decode().then(() => this.settleMoon(true), () => this.settleMoon(false)); };
        this.moonImage.onerror = () => this.settleMoon(false);
        if (true) {
            // Match the native asset deadline. A late decode cannot replace the
            // already-settled procedural moon or change readiness retroactively.
            this.moonDeadline = window.setTimeout(() => this.settleMoon(false), 60_000);
            this.moonImage.src = `${import.meta.env.BASE_URL}art/moon-lro-v001.png`;
        }
        else { this.mode = 'transparent'; this.moonReady = true; }
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
        if (false) {
            this.scale = Math.min(this.width * .82 / 82, this.height * .47 / 74, 6);
            this.baseline = this.height * .48 + (92 - this.sim.ground) * this.scale;
        }
        const contactY = this.project(0, PROP_CONTACT_Y).y;
        this.compositions = FAMILIES.map(f => resolvePropComposition(this.layout,f.id,contactY,y=>this.sim.ground+(this.baseline-y)/this.scale));
        this.launchBounds = this.compositions.map(c=>resolveLaunchBounds(this.layout,c,(x,y)=>this.project(x,y),(x)=> (x-this.width/2)/this.scale));
        this.previewProfile = undefined;
        this.legacyProfiles.fill(undefined);
        this.sim.setViewport(Math.min(160, this.layout.heroRect.width / this.scale * .9), 16);
        for (const family of FAMILIES.slice(0,10)) this.resolveLaunchProfile(family.id,.5);
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
        const pixels = this.capabilities.enhanced ? BUDGETS[quality].pixels : 1600000;
        this.ratio = Math.min(window.devicePixelRatio || 1, BUDGETS[quality].ratio, Math.sqrt(pixels / (this.width * this.height))) * this.resolutionScale;
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
    private protectParticles() {
        const c = this.ctx;
        if (this.sim.protectCenter) {
            const [left, top, right, bottom] = this.sim.safeRect;
            c.beginPath(); c.rect(0, 0, this.width, this.height);
            c.rect(left * this.width, top * this.height, (right - left) * this.width, (bottom - top) * this.height); c.clip('evenodd');
        }
        // Intersect each inverse rectangle separately; overlaps must remain protected.
        for (const r of this.protectedRects) {
            c.beginPath(); c.rect(0, 0, this.width, this.height);
            c.rect(r.x - 8, r.y - 8, r.width + 16, r.height + 16); c.clip('evenodd');
        }
    }
    /** The dedicated black-sky piece shares particles and projection, without waterfront art. */
    invitationFuseY() { return this.sim.ground + (this.baseline - this.height * .94) / this.scale; }
    resolveLaunchProfile(id: FamilyId, placement = this.sim.placement) {
        const index=familyIndex(id),prop=this.compositions[index],bounds=this.launchBounds[index],scene=this.layout.unobstructedScene;
        const normalizedPlacement=clamp(placement,0,1),padX=bounds.worldMin+normalizedPlacement*(bounds.worldMax-bounds.worldMin);
        const screenX=bounds.screenMin+normalizedPlacement*(bounds.screenMax-bounds.screenMin);
        if(index<10){
          const worldAt=(x:number,y:number,z:number)=>{const q=240/Math.max(140,240-z);return {x:(x-this.width/2)/(this.scale*q),y:this.sim.ground+(this.baseline-y)/(this.scale*q)};};
          const profile = this.legacyProfiles[index] ??= resolveLegacyLaunchProfile(this.layout,id,worldAt,(x,y,z)=>this.project(x,y,z),prop,this.height*this.horizon,scene.x+scene.width/2);
          const y = this.project(0,profile.apex+prop.shellOffset,profile.burstDepth).y;
          const aimX = clamp(worldAt(screenX,y,profile.burstDepth!).x,profile.aimMinX!,profile.aimMaxX!);
          return {...profile,aimX,padX,normalizedPlacement};
        }
        const profile=resolveScreenLaunchProfile(this.layout,id,this.scale,y=>this.sim.ground+(this.baseline-y)/this.scale,scene.x+scene.width/2,prop,this.height*this.horizon);
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
    shorelineHorizon() { return this.horizon; }
    resolveShoreLaunch(id: FamilyId, x: number, y: number) {
        if (!this.capabilities.enhanced) return null;
        const world = (sx: number, sy: number, z: number) => { const q = 240 / Math.max(140, 240 - z);
            return { x: (sx - this.width / 2) / (this.scale * q), y: this.sim.ground + (this.baseline - sy) / (this.scale * q) }; };
        return resolveShorelineLaunch(id, x, y, this.width, this.height, this.horizon, this.resolveLaunchProfile(id, x), world, (wx, wy, z) => this.project(wx, wy, z));
    }
    projectBurst(clientX: number, clientY: number, id=this.sim.selected): [number, number, number] | null {
        const l = this.layout, x = clientX - l.viewport.x, y = clientY - l.viewport.y, r = l.burstCanopy;
        const z=burstDepth(familyIndex(id)),q=240/Math.max(140,240-z);
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
            ? [(x-this.width/2)/(this.scale*q),this.sim.ground+(this.baseline-y)/(this.scale*q),z] : null;
    }
    burstCompositionScale(id: FamilyId, point: readonly [number, number, number]): number {
        const p = this.project(...point);
        return familyIndex(id) < 10 ? legacyCompositionScale(this.layout, id, (x,y,z)=>this.project(x,y,z), point, this.height*this.horizon)
            : signatureCompositionScale(this.layout, this.scale, p.x, p.y);
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
        this.reflectedWaterHeads = 0;
        const c = this.ctx, s = this.sim, horizon = this.height * this.horizon, riverTime = this.riverTime();
        const terraceY = this.height * .92, waterHeight = Math.max(1, terraceY - horizon);
        this.prepareRiver(horizon, riverTime);
        const water = c.createLinearGradient(0, horizon, 0, this.height);
        water.addColorStop(0, '#0b1925'); water.addColorStop(.28, '#081322'); water.addColorStop(1, '#040a11');
        c.globalAlpha = 1; c.fillStyle = water; c.fillRect(0, horizon, this.width, this.height - horizon);
        c.fillStyle = '#090f17'; c.beginPath(); c.moveTo(0, horizon);
        for (let x = 0; x <= this.width; x += 8) c.lineTo(x, horizon - 4 - Math.sin(x * .013) * 5 - Math.sin(x * .047) * 2);
        c.lineTo(this.width, horizon + 2); c.lineTo(0, horizon + 2); c.fill();
        const shoreHeight = clamp(this.height * .028, 16, 26);
        if (this.capabilities.enhanced) this.shorelineCity.draw(c, this.width, this.height, this.horizon, riverTime, this.skyState.motionAllowed && !s.paused && !s.reducedMotion && !this.reducedSkyMotion?.matches);
        else {
          c.globalAlpha = 1; c.drawImage(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);
          this.drawSurfaceTint(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);
        }
        c.save(); c.beginPath(); c.rect(0, horizon + 2, this.width, waterHeight - 2); c.clip(); c.globalCompositeOperation = 'lighter';
        // Broad shell-coloured incident light is separate from the moon path and
        // bounded reflected particles. All twelve sources survive Low quality.
        for (let i = 0; i < Math.min(BURST_LIGHT_CAPACITY, s.lights.length); i++) {
            const light = s.lights[i], energy = burstLightEnergy(light, s.reducedFlashes);
            if (energy < .001) continue;
            const point = this.project(light.x, light.y, light.z);
            c.save(); c.translate(point.x, horizon + waterHeight * .43);
            c.scale(Math.max(100, this.width * .48), waterHeight * 1.15);
            const wash = c.createRadialGradient(0, 0, 0, 0, 0, 1);
            wash.addColorStop(0, this.tone(light.r, light.g, light.b));
            wash.addColorStop(.32, this.tone(light.r, light.g, light.b)); wash.addColorStop(1, 'transparent');
            c.fillStyle = wash; c.globalAlpha = energy * .68 / (1 + this.burstWash[6] * .60);
            c.fillRect(-1, -1, 2, 2); c.restore();
        }
        // Low-frequency sky response on long swells retains dark troughs.
        // Twelve finite interrupted patches avoid full-width ruled stripes.
        c.strokeStyle = '#213d58'; c.lineCap = 'round';
        for (let band = 0; band < 12; band++) {
            const depth = (band + .5 + Math.sin(band * 2.399) * .31) / 12, y = horizon + depth * waterHeight;
            const length = this.width * (.14 + .10 * (1 + Math.sin(band * 1.73)) * .5);
            const left = ((band * .61803398875 + .12) % 1) * this.width - length * .35;
            c.globalAlpha = .05 + Math.max(0, Math.sin(band * .71 - riverTime * .18)) * .04;
            c.lineWidth = .8 + depth * 2.2; c.beginPath();
            for (let segment = 0; segment <= 8; segment++) {
                const x = left + segment / 8 * length;
                const facetHeight = this.screenWaterHeight(x, y);
                const py = y - facetHeight * (4 + depth * 14) + Math.sin(segment * .39 + band) * depth * 2;
                if (!segment) c.moveTo(x, py); else c.lineTo(x, py);
            }
            c.stroke();
        }
        c.lineCap = 'butt';
        // Ninety-six bounded fragment pairs retain the existing surface limit.
        // Irregular spacing and crossed phases avoid a repeated grid or rings.
        const moonX = this.moonFrame.x;
        // Additive surface fragments commute. Keep the same exact phase values
        // in a preallocated buffer and batch by colour, avoiding 192 style
        // changes per frame without reducing detail or altering hull sampling.
        c.fillStyle = '#9bacbf';
        for (let i = 0; i < 96; i++) {
            const depth = ((i + .5 + Math.sin(i * 2.399) * .32) / 96) ** 1.35;
            const baseY = horizon + depth * waterHeight;
            this.sampleScreenWater(moonX, baseY, this.waterSample);
            const crossing = Math.sin(i * 2.399 + riverTime * .67) * Math.sin(i * .79 - riverTime * .43);
            const facet = clamp(.68 + crossing * .38 + this.waterSample.slopeZ * 11, .12, 1);
            const drift = Math.sin(i * .37 + riverTime * .21) * (1 + depth * 12) + this.waterSample.slopeX * this.width * depth * .25;
            const halfWidth = (1 + depth * this.width * .052) * (.57 + crossing * .27);
            const y = baseY - this.waterSample.height * (3 + depth * 12);
            this.waterFacetPose[i * 3] = depth; this.waterFacetPose[i * 3 + 1] = baseY; this.waterFacetPose[i * 3 + 2] = crossing;
            c.globalAlpha = this.moonReady || this.moonFailed ? (.034 + depth * .085) * facet * ((this.moonFrame as MoonFrame).illumination ?? 1) : .008;
            c.fillRect(moonX + drift - halfWidth, y, halfWidth * 2, .45 + depth * .8);
        }
        c.fillStyle = '#4a687e';
        for (let i = 0; i < 96; i++) {
            const depth = this.waterFacetPose[i * 3], baseY = this.waterFacetPose[i * 3 + 1], crossing = this.waterFacetPose[i * 3 + 2];
            const x = ((i * .61803398875 + riverTime * .0014) % 1) * this.width;
            const ambientHeight = this.screenWaterHeight(x, baseY);
            c.globalAlpha = (.034 + depth * .065) * (.7 + crossing * .3);
            c.fillRect(x, baseY - ambientHeight * (3 + depth * 12), 1 + depth * (8 + i % 7 * 3), .4 + depth * .5);
        }
        this.drawRiverReflections(riverTime);
        const p = s.heads, step = Math.max(1, Math.ceil(p.count / 128));
        for (let i = 0; i < p.count; i += step) {
            if (p.age[i] < 0) continue;
            const point = this.project(p.x[i], p.y[i], p.z[i]);
            // A reciprocal perspective path compresses distant reflections and
            // stays inside the waterfront rather than remapping to the terrace.
            const elevation = Math.max(0, (horizon - point.y) / this.height);
            if (elevation <= 0) continue;
            this.reflectedWaterHeads++;
            const reflected = horizon + waterHeight * elevation / (.46 + elevation);
            c.fillStyle = this.tone(p.r[i], p.g[i], p.b[i]);
            // Three adjacent marks belong to one coherent wave facet. Sample
            // its center once; hull contacts retain their exact four-point field.
            const facetHeight = this.screenWaterHeight(point.x, reflected + 3);
            for (let j = 0; j < 3; j++) {
                const baseY = reflected + j * 3;
                const y = baseY - facetHeight * 9, ripple = Math.sin(y * .7 + riverTime * 2) * Math.sin(i * 1.37 - riverTime * .43);
                c.globalAlpha = p.gain[i] * Math.max(0, 1 - p.age[i] / p.life[i]) * (s.reducedFlashes ? .10 : .16) * (1 - j * .2);
                c.fillRect(point.x + ripple * 4 - 2, y, 3 + (ripple + 1) * 4, 1);
            }
        }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        this.drawRiverBoats(); c.globalAlpha = 1;
        c.fillStyle = '#111c27'; c.fillRect(0, terraceY, this.width, this.height * .08);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35;
        c.fillStyle = this.tone(this.burstWash[0], this.burstWash[1], this.burstWash[2]);
        c.fillRect(0, terraceY, this.width, this.height * .08); c.restore();
        // A narrow uneven damp seam belongs to the existing terrace edge.
        c.fillStyle = '#07111a'; c.beginPath(); c.moveTo(0, terraceY);
        for (let x = 0; x <= this.width; x += 16) c.lineTo(x, terraceY + 1.8 + Math.sin(x * .047) * .6 + Math.sin(x * .113) * .35);
        c.lineTo(this.width, terraceY); c.closePath(); c.fill();
        c.strokeStyle = '#4a657a'; c.lineWidth = .6; c.globalAlpha = .20;
        for (let i = 0; i < 18; i++) {
            const x = ((i * .61803398875) % 1) * this.width;
            c.beginPath(); c.moveTo(x, terraceY + 1); c.lineTo(x + 3 + i % 4 * 2.3, terraceY + 1.2); c.stroke();
        }
        c.globalAlpha = 1;
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
        this.occlusion.update(s.smoke, 0, s.ground, 240);
        gatherBurstLighting(s.lights, this.burstWash, s.reducedFlashes);
        limitBurstRadiance(this.burstWash, .50);
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.clearRect(0, 0, this.width, this.height);
        if (false) { c.fillStyle = '#000'; c.fillRect(0, 0, this.width, this.height); }
        updateCelestialFrame(this.celestialFrame, this.skyState, this.width, this.height,
            this.mode !== 'transparent' && s.quality !== 'low' && !this.reducedSkyMotion?.matches &&
            !this.host.parentElement?.classList.contains('reduced-motion'), s.reducedFlashes, this.capabilities.enhanced ? 6 : 3);
        updateWaterFrame(this.waterFrame, s.waterPhase, s.quality, this.width < 680,
            !s.reducedMotion && !this.reducedSkyMotion?.matches && !this.host.parentElement?.classList.contains('reduced-motion'));
        this.waterFrame.time = s.time; this.waterInteraction.update(s.time, this.waterFrame.motionAllowed);
        this.waterFrame.impulses = this.waterInteraction.impulses;
        this.sea?.update(s.time, this.waterFrame.motionAllowed && this.mode !== 'transparent');
        if (this.moonMotion.pulseAt !== undefined && s.time < this.moonMotion.pulseAt) this.moonMotion.pulseAt = -Infinity;
        if (s.time < this.starTapAt) this.starTapAt = -Infinity;
        this.moonMotion.time = s.time; this.moonMotion.motionAllowed = !s.reducedMotion && !this.reducedSkyMotion?.matches && !this.host.parentElement?.classList.contains('reduced-motion');
        updateMoonFrame(this.width, this.height, this.horizon, this.moonFrame, this.capabilities.enhanced ? this.moonMotion : undefined);
        const tapAge = s.time - this.starTapAt;
        if (this.capabilities.enhanced && this.waterFrame.motionAllowed && tapAge >= 0 && tapAge < .7) {
            this.celestialFrame.engagement = Math.sin(tapAge / .7 * Math.PI) ** 2;
            this.celestialFrame.pointerX = this.starTapX; this.celestialFrame.pointerY = this.starTapY;
        }
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
            if (this.moonReady || this.moonFailed) {
                const m = this.moonFrame, diameter = m.radius * 2 / .95;
                this.glow(m.x, m.y, m.radius * 2.5, '#a8bfd8', .065);
                c.globalAlpha = Math.min(1, .90 * ((m as MoonFrame).illumination ?? 1)); c.drawImage(this.moonReady ? this.moonImage : this.fallbackMoon, m.x-diameter/2, m.y-diameter/2, diameter, diameter);
            }
            c.globalAlpha = 1;
        }
        if (this.mode !== 'transparent') this.drawWater();
        if (this.capabilities.enhanced && this.lakeMix < 1) {
              // Preserve the live moon/sky during the opening; reveal only the waterfront.
              c.globalAlpha = (1 - this.lakeMix) * .72; c.fillStyle = '#000'; c.fillRect(0, this.height * this.horizon, this.width, this.height * (1 - this.horizon)); c.globalAlpha = 1;
        }
        this.staged = this.airborne = this.bodies = 0;
        c.save();
        if (this.capabilities.enhanced) this.protectParticles();
        if (this.mode === 'interactive' || this.capabilities.enhanced) {
            if (this.mode === 'interactive') this.drawStage();
            if (this.mode === 'interactive' && !s.committed && !s.show) {
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
        c.restore();
        c.save();
        this.protectParticles();
        // The smoke is retained and wind-drifted by the same simulation used in 3D.
        const smoke = s.smoke;
        this.canopyOrder.length = smoke.count;
        for (let i = 0; i < smoke.count; i++) this.canopyOrder[i] = i;
        this.canopyOrder.sort((a,b) => smoke.z[a] - smoke.z[b]);
        for (const i of this.canopyOrder) {
            const p = this.project(smoke.x[i], smoke.y[i], smoke.z[i]);
            const radius = Math.max(2, smoke.size[i] * this.scale * 1.6 * (240/Math.max(140,240-smoke.z[i])));
            illuminateSmoke(s.lights, smoke.x[i], smoke.y[i], smoke.z[i], s.reducedFlashes, this.canopyLight);
            const red = .14 + this.canopyLight[0], green = .18 + this.canopyLight[1], blue = .23 + this.canopyLight[2];
            const stretch = canopyStretch(smoke.id[i], smoke.age[i]);
            c.save(); c.translate(p.x, p.y); c.rotate(smoke.angle[i]); c.scale(stretch, 1 / stretch); c.translate(-p.x, -p.y);
            const haze = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            haze.addColorStop(0, this.tone(red, green, blue)); haze.addColorStop(1, 'transparent');
            c.globalAlpha = canopyAlpha(smoke.age[i], smoke.life[i], smoke.gravity[i], smoke.family[i]) * .46 * aerialTransmission(Math.hypot(smoke.x[i],smoke.y[i]-80,240-smoke.z[i]));
            c.fillStyle = haze; c.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2); c.restore();
        }
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const trails = s.trails;
        const step = false ? 1 : Math.max(1, Math.ceil(trails.count / (s.quality === 'low' ? 2500 : 6500)));
        for (let i = 0; i < trails.count; i++) {
            if (trails.age[i]<0)continue;
            if (trails.kind[i] === 1) continue;
            // Never decimate a written stroke when decorative effects fill the shared trail pool.
            if (!trails.anchored[i] && i % step !== 0) continue;
            const age = trails.age[i] / trails.life[i];
            if (age > .97) continue;
            const a = this.project(trails.ax[i], trails.ay[i], trails.az[i]), b = this.project(trails.bx[i], trails.by[i], trails.bz[i]);
            c.globalAlpha = (trails.anchored[i] ? (.68 + .32 * Math.exp(-trails.age[i] * 1.7)) : Math.pow(1 - age, 1.35)) * (s.reducedFlashes ? .58 : .75) * this.occlusion.transmission((trails.ax[i]+trails.bx[i])*.5, (trails.ay[i]+trails.by[i])*.5, (trails.az[i]+trails.bz[i])*.5) * (trails.anchored[i] ? 1 : aerialTransmission(Math.hypot((trails.ax[i]+trails.bx[i])*.5,(trails.ay[i]+trails.by[i])*.5-80,240-(trails.az[i]+trails.bz[i])*.5)));
            c.strokeStyle = this.tone(trails.r[i], trails.g[i] * (trails.anchored[i] && trails.b[i] < .5 ? 1 - age * .2 : 1), trails.b[i]); c.lineWidth = Math.max(trails.anchored[i] ? .95 : .55, trails.width[i] * this.scale * 2 * (240/Math.max(140,240-(trails.az[i]+trails.bz[i])*.5)) * (1 - age * .65));
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
        for (const pool of [s.heads, s.embers]) for (let i = 0; i < pool.count; i++) {
            if (this.capabilities.enhanced && pool.role[i] === -71) continue;
            if (pool.age[i] < 0) continue;
            const p = this.project(pool.x[i], pool.y[i], pool.z[i]);
            const alpha = pool.gain[i] * Math.pow(Math.max(0, 1 - pool.age[i] / pool.life[i]), .85)
                * this.occlusion.transmission(pool.x[i], pool.y[i], pool.z[i])
                * aerialTransmission(Math.hypot(pool.x[i], pool.y[i]-80, 240-pool.z[i]));
            starColor(pool.family[i], pool.age[i], pool.life[i], pool.r[i], pool.g[i], pool.b[i], this.starTone);
            // Quantize glow colours to avoid a new texture for every star.
            const quantize = (value: number) => Math.round(value * 8) / 8;
            this.glow(p.x, p.y, (pool === s.embers ? (false ? 1.1 : 1.9) : false ? Math.max(1.15, Math.min(3.4, pool.size[i] * this.scale * 5)) : Math.max(pool.family[i]<10?3.1:4.8, Math.min(9, pool.size[i]*this.scale*8*(240/Math.max(140,240-pool.z[i]))))) * this.particleGlowScale, this.tone(quantize(this.starTone[0]), quantize(this.starTone[1]), quantize(this.starTone[2])), alpha * (s.reducedFlashes ? .72 : .9));
        }
        for (const r of s.rockets) if (r.stage === 'ascent') {
            const p = this.project(...rocketPoint(r, SHELL_LOCAL_Y));
            this.glow(p.x,p.y,r.family<10?Math.max(1.65,recedingShellSize(r.family,r.age/r.ascent)*1.95):4.3,this.tone(...carrierTint(r.family,0,r.age/r.ascent)),.9);
        }
        for (const carrier of s.cues) { const p = this.project(carrier.x, carrier.y, carrier.z); this.glow(p.x, p.y, 3.5, this.tone(...carrierTint(carrier.family, carrier.palette)), .8); }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        // Letter paths are a separate authored pass: native content protection never erases a glyph.
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let i = 0; i < trails.count; i++) {
            if (trails.kind[i] !== 1) continue;
            const age = trails.age[i] / trails.life[i];
            if (age >= 1) continue;
            const a = this.project(trails.ax[i], trails.ay[i]), b = this.project(trails.bx[i], trails.by[i]);
            c.globalAlpha = (trails.anchored[i] === 2 ? this.letterMix : Math.min(1, (1 - age) * 1.7)) * (s.reducedFlashes ? .82 : .95);
            c.strokeStyle = this.tone(trails.r[i], trails.g[i], trails.b[i]);
            c.lineWidth = Math.max(1.15, trails.width[i] * this.scale * 2);
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
        for (let i = 0; i < s.heads.count; i++) if (this.capabilities.enhanced && s.heads.role[i] === -71) {
            const p = this.project(s.heads.x[i], s.heads.y[i]);
            this.glow(p.x, p.y, 3.2, '#ffe9bd', Math.max(0, 1 - s.heads.age[i] / s.heads.life[i]));
        }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        // Canvas is already display-referred: a bounded neutral attenuation is
        // the fallback approximation, not a second ACES/color-space conversion.
        if (s.cinematicExposure && this.mode !== 'transparent') {
            c.save(); c.fillStyle = '#000'; c.globalAlpha = Math.max(0, 1 - s.cinema.exposure / CINEMA_BASE_EXPOSURE);
            c.fillRect(0, 0, this.width, this.height); c.restore();
        }
        // Classic alone promises a completely empty effect canvas over its HTML
        // reading column. Clear the device-aligned bounds after every effect pass
        // to remove residual alpha from Canvas clipping/composition. Spark stays
        // transparent to fireworks, and Invited keeps its authored lettering.
        if (this.mode === 'transparent' && s.protectCenter) {
            const [left, top, right, bottom] = s.safeRect;
            const x = Math.floor(left * this.width * this.ratio) / this.ratio;
            const y = Math.floor(top * this.height * this.ratio) / this.ratio;
            c.clearRect(x, y, Math.ceil(right * this.width * this.ratio) / this.ratio - x,
                Math.ceil(bottom * this.height * this.ratio) / this.ratio - y);
        }
        if (this.glassAllowed && !this.glassSuspended && !this.debugGlassOff && this.capabilities.glass && this.sim.quality !== 'low') {
            c.save(); c.globalAlpha = 1;
            for (const rect of this.glassSurfaces) {
                c.beginPath(); c.roundRect(rect.x, rect.y, rect.width, rect.height, rect.radius ?? 24);
                c.fillStyle = '#0b142dcc'; c.fill(); c.strokeStyle = '#e6c27a38'; c.lineWidth = 1; c.stroke();
            }
            c.restore();
        }
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
            effectBounds:effectEnvelope(this.sim.heads,(x,y,z)=>this.project(x,y,z)),signatureBounds, moon: { ...this.moonFrame, ready: this.moonReady || this.moonFailed, degraded: this.moonFailed, source: this.moonFailed ? "Procedural fallback" : "NASA LRO / fixed gibbous" }, stageLayout: this.layout, stagedRockets: this.staged, airborneRockets: this.airborne, visibleRocketBodies: this.bodies,
            ...celestialDiagnostics(this.celestialFrame), skyHorizon: this.horizon, skyLayers: 3, skyTextures: 0,
            glassTier: this.glassAllowed && !this.glassSuspended && this.glassSurfaces.length > 0 && !this.debugGlassOff ? 'frosted-canvas-fallback' : 'off',
            glassSurfaceCount: this.glassSurfaces.length, glassMaximumSurfaces: 4, glassCPUReadbacks: 0,
            waterImpulseCount: this.waterInteraction.activeCount(), waterImpulseMaximum: 4, waterImpulseLifetime: 2.4,
            renderSubmitMs: this.metrics.submitMs, renderFrames: this.metrics.frames,
            skyArtWidth: this.celestialArt.stars.width, skyArtHeight: this.celestialArt.stars.height,
            skyCelestialCrop: Math.max(.6, Math.min(1.35, this.width / this.height / 2)), skyResponseCachePixels: 32768,
            skyFieldStars: this.celestialArt.metadata.fieldStars, skyClusterStars: this.celestialArt.metadata.clusteredStars,
            skyNearStars: this.celestialArt.metadata.nearStars, skyDustSpecks: this.celestialArt.metadata.dustSpecks,
            skyArtRgbaBytes: this.celestialArt.metadata.rgbaBytes,
            riverReflectedParticleSourceLimit: 128,
            riverReflectedParticleSources: this.mode === 'transparent' ? 0 : this.reflectedWaterHeads,
            riverReflectedParticleFragments: this.mode === 'transparent' ? 0 : this.reflectedWaterHeads * 3,
            riverScenery: 'original Canvas river', riverBoats: this.mode === 'transparent' ? 0 : this.riverArt.boats.length,
            riverLampAnchors: this.mode === 'transparent' ? 0 : this.riverArt.lamps.length,
            riverReflectionFragments: this.mode === 'transparent' ? 0 : this.riverArt.lamps.length * (this.sim.quality === 'low' ? 4 : 8),
            riverMotionTime: this.riverTime(), riverPositions: this.riverArt.boats.map(boat => ({ x: boat.screenX, y: boat.screenY, roll: boat.roll })),
            riverWaterPhase: this.waterFrame.phase, riverWaterWaveCount: this.waterFrame.waveCount,
            riverContactChecksum: this.mode === 'transparent' ? 0 : this.riverContactChecksum,
            riverReflectionChecksum: this.mode === 'transparent' ? 0 : this.riverReflectionChecksum,
            riverHullSampleCount: this.mode === 'transparent' ? 0 : this.riverArt.boats.length * 4,
            riverContactCapacity: 21, riverReflectionCapacity: 80, riverWaterContactInstances: this.mode === 'transparent' ? 0 : 21,
            riverContactAlignment: 'four hull points and wave-conforming fragments',
            riverHullSamples: this.riverArt.boats.map(boat => ({ height: boat.sampledHeight ?? 0, pitch: boat.roll,
                roll: 0, centerDeviation: boat.contactError ?? 0 })),
            waterBurstLightCapacity: BURST_LIGHT_CAPACITY, waterBurstLightCount: this.sim.lights.length,
            waterSurfaceFragments: this.mode === 'transparent' ? 0 : 96, waterReflectionTargets: 0,
            waterPhase: this.waterFrame.phase, waterWaveCount: this.waterFrame.waveCount, waterVisible: this.mode !== 'transparent',
            waterMotionAllowed: this.waterFrame.motionAllowed, waterDisplacementBound: waterDisplacementBound(this.waterFrame),
            waterFarZ: this.waterFrame.farZ, waterNearZ: this.waterFrame.nearZ,
            reflectionTargets: 0, reflectionAllocated: false, reflectionWidth: 0, reflectionHeight: 0, reflectionHz: 0,
            shellScreen: shell ? this.project(...shell) : null,
            apexScreen: r ? this.project(r.launchProfile?.aimX??r.x, r.top + (r.launchProfile?.prop?.shellOffset??SHELL_LOCAL_Y*ROCKET_SCALE[1]), r.launchProfile?.burstDepth ?? r.z) : null,
            ...(this.sea?.diagnostics() ?? {}),
            launchProfile: r?.launchProfile ?? null,
            flight: r ? { id: r.id, stage: r.stage, age: r.age, ascent: r.ascent, thrust: r.thrust, z:r.z, vz:r.vz, phase:r.phase, fuse:r.fuse, y: r.y, vy: r.vy, top: r.top, family: r.family, shell } : null };
    }
    dispose() {
        if (this.disposed) return;
        this.shorelineCity.dispose();
        this.disposed = true; clearTimeout(this.moonDeadline); this.moonDeadline = 0; this.moonImage.onload = null; this.moonImage.onerror=null; this.moonImage.src = ""; this.canvas.remove(); this.glows.clear();
        this.celestialArt.stars.width = this.celestialArt.stars.height = 1;
        this.celestialArt.dust.width = this.celestialArt.dust.height = 1;
        this.celestialArt.nearStars.width = this.celestialArt.nearStars.height = 1;
        this.starResponse.width = this.starResponse.height = 1;
        this.tintMask.width = this.tintMask.height = 1;
        this.starResponseMask.width = this.starResponseMask.height = 1;
        this.riverArt.homes.width = this.riverArt.homes.height = 1;
        for (const boat of this.riverArt.boats) boat.image.width = boat.image.height = 1;
        this.sea?.dispose();
        this.canvas.width = this.canvas.height = 1;
    }
}
