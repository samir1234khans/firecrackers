import { measureStage, stageFraming, stageCameraFrame } from './StageLayout';
import type { StageLayout } from './StageLayout';
import { resolveScreenLaunchProfile } from './LaunchProfile';
import * as THREE from 'three/webgpu';
import { float, mix, pass, uniform, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { BUDGETS, FAMILIES } from './catalog';
import { flightAxis, flightBodyOpacity, rocketPoint, SHELL_LOCAL_Y } from './LaunchGeometry';
import type { FamilyId, Quality } from './catalog';
import type { Simulation } from './Simulation';
import type { SkyState } from './SkyState';
import { ParticleScene } from '../graphics/ParticleScene';
import { RocketProp } from '../graphics/RocketProp';
import { LaunchStage } from '../graphics/LaunchStage';
import { loadWaterfrontAssets, disposeWaterfrontAsset, WATERFRONT_ASSET_NAMES } from '../graphics/WaterfrontAssets';
import type { WaterfrontAssets, WaterfrontAssetName } from '../graphics/WaterfrontAssets';
import { WaterReflection } from '../graphics/WaterReflection';
import { NightEnvironment } from '../graphics/NightEnvironment';
import { OpaqueDepth } from '../graphics/OpaqueDepth';
import { makePaperTexture, makeSmokeAtlas } from '../graphics/textures';
import type { DisplayMode } from '../platform/presentation';

/** Perspective, depth-aware native r180 TSL pipeline. Simulation remains CPU fixed-step. */
export class FireworkRenderer {
    readonly renderer: THREE.WebGPURenderer;
    readonly scene = new THREE.Scene();
    readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 1500);
    private readonly opaqueCamera = new THREE.PerspectiveCamera();
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly water = new WaterReflection();
    private readonly environment = new NightEnvironment();
    private readonly smokeAtlas = makeSmokeAtlas();
    private readonly paper = makePaperTexture();
    private readonly props = Array.from({ length: 8 }, () => new RocketProp(this.paper));
    private readonly stage = new LaunchStage();
    private readonly blastLight = new THREE.PointLight(0xffcc88, 0, 160, 2);
    private readonly opaqueDepth: OpaqueDepth;
    private readonly opaquePass: ReturnType<typeof pass>;
    private readonly scenePass: ReturnType<typeof pass>;
    private readonly bloomPass: ReturnType<typeof bloom>;
    private readonly post: THREE.PostProcessing;
    private readonly particles: ParticleScene;
    private readonly overlay = uniform(0);
    private readonly projected = new THREE.Vector3();
    private pendingAssets: Partial<WaterfrontAssets> = {};
    private assets: Partial<WaterfrontAssets> = {};
    private readonly assetStates = Object.fromEntries(WATERFRONT_ASSET_NAMES.map(name => [name, 'loading'])) as Record<WaterfrontAssetName, 'loading' | 'ready' | 'active' | 'failed'>;
    private readonly assetErrors: Partial<Record<WaterfrontAssetName, string>> = {};
    private readonly assetQueuedAt: Partial<Record<WaterfrontAssetName, number>> = {};
    private pendingAssetCount = 0;
    private assetFrame = 0;
    private layout!: StageLayout;
    setLayout(layout: StageLayout) { this.layout = layout; }
    setSkyState(state: Readonly<SkyState>) { this.environment.setSkyState(state); }
    private mode: DisplayMode = 'interactive';
    private disposed = false;
    private initialized = false;
    private lossHandler: (event: Event) => void;
    backend = 'Starting';
    constructor(private host: HTMLDivElement, private sim: Simulation, private onFailure: (message: string) => void, forceWebGL = false) {
        this.renderer = new THREE.WebGPURenderer({ antialias: false, alpha: true, forceWebGL, powerPreference: 'high-performance' });
        this.renderer.setClearColor(0x020409, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = .95;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.camera.layers.enable(1);
        this.scene.add(this.environment.group, this.water.mesh);
        this.water.setShore(this.environment.skyTexture);
        this.scene.fog = new THREE.FogExp2('#07111e', .0021);
        this.scene.environment = this.environment.probe;
        this.scene.environmentIntensity = .65;
        this.scene.add(new THREE.HemisphereLight(0x9fb7d3, 0x202027, .70));
        const key = new THREE.DirectionalLight(0xffdcaf, .85);
        key.position.set(-8, 35, 45);
        const moon = new THREE.DirectionalLight(0x8eafd1, .8);
        moon.position.set(-80, 150, -180);
        this.scene.add(key, moon, this.blastLight);
        this.scene.add(this.stage.group);
        for (const prop of this.props) {
            prop.group.visible = false;
            this.scene.add(prop.group);
        }
        const opaqueLayers = new THREE.Layers();
        opaqueLayers.set(0);
        this.opaqueDepth = new OpaqueDepth(this.scene);
        this.opaquePass = pass(this.opaqueDepth.scene, this.opaqueCamera).setLayers(opaqueLayers);
        this.particles = new ParticleScene(this.scene, this.smokeAtlas, this.opaquePass);
        this.scenePass = pass(this.scene, this.camera);
        const source = this.scenePass.getTextureNode('output');
        this.bloomPass = bloom(source, .30, .18, .85);
        this.post = new THREE.PostProcessing(this.renderer);
        const glow = this.bloomPass.rgb;
        const haloAlpha = glow.r.max(glow.g).max(glow.b).mul(.32).clamp(0, 1);
        const alpha = mix(float(1), source.a.max(haloAlpha).clamp(0, 1), this.overlay);
        this.post.outputNode = vec4(source.rgb.add(glow), alpha);
        this.lossHandler = (event: Event) => {
            event.preventDefault();
            if (!this.disposed) this.onFailure('Graphics were interrupted. Retry to return to a fresh sky.');
        };
        this.renderer.domElement.addEventListener('webglcontextlost', this.lossHandler);
    }
    async init() {
        await this.renderer.init();
        if (this.disposed) { this.renderer.dispose(); return; }
        this.initialized = true;
        this.backend = (this.renderer.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL 2';
        const device = (this.renderer.backend as unknown as { device?: { lost: Promise<unknown> } }).device;
        device?.lost.then(() => { if (!this.disposed) this.onFailure('Graphics were interrupted. Retry with lower quality.'); });
        this.host.replaceChildren(this.renderer.domElement);
        this.host.dataset.renderer = 'cinematic-v2';
        this.host.dataset.stage = 'spatial-v3';
        this.host.dataset.realism = 'observatory-v3';
        this.host.dataset.backend = this.backend;
        this.resize();
        if (!this.disposed) this.render();
        this.host.dataset.assets = 'procedural fallback';
        void loadWaterfrontAssets((name, asset) => {
            if (this.disposed) { disposeWaterfrontAsset(name, asset); return; }
            if (!this.pendingAssets[name]) this.pendingAssetCount++;
            (this.pendingAssets as Record<string, unknown>)[name] = asset;
            this.assetStates[name] = 'ready';
            this.assetQueuedAt[name] = this.sim.time;
            this.scheduleAssetRender();
        }, (name, error) => {
            if (this.disposed) return;
            this.assetStates[name] = 'failed';
            this.assetErrors[name] = error;
            this.publishAssetStatus();
        }).catch(error => {
            if (this.disposed) return;
            for (const name of WATERFRONT_ASSET_NAMES) if (this.assetStates[name] === 'loading') {
                this.assetStates[name] = 'failed';
                this.assetErrors[name] = error instanceof Error ? error.message : String(error);
            }
            this.publishAssetStatus();
        });
    }
    private publishAssetStatus() {
        this.host.dataset.assets = WATERFRONT_ASSET_NAMES.filter(name => this.assetStates[name] === 'active').join(',') || 'procedural fallback';
        this.host.dataset.assetFailures = WATERFRONT_ASSET_NAMES.filter(name => this.assetStates[name] === 'failed').join(',');
    }
    /** Coalesce idle/paused redraws; the main animation loop can consume pending assets first. */
    private scheduleAssetRender() {
        if (this.assetFrame || this.disposed) return;
        this.assetFrame = requestAnimationFrame(() => {
            this.assetFrame = 0;
            if (this.disposed || !this.pendingAssetCount) return;
            try { this.render(); }
            catch (error) {
                console.error('Graphics render failed after asset activation', error);
                this.onFailure('Graphics failed while activating the scene. Try WebGL graphics or retry.');
            }
        });
    }
    resize() {
        if (this.disposed) return;
        const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight), aspect = w / h;
        this.layout = measureStage(this.host, this.mode === 'interactive');
        const framing = stageCameraFrame(this.layout, this.sim.ground, this.camera.fov);
        const { centerY, distance, pitch } = framing;
        this.camera.aspect = aspect;
        this.camera.position.set(0, centerY + Math.sin(pitch) * distance, Math.cos(pitch) * distance);
        this.camera.lookAt(0, centerY, 0);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        this.environment.frameTerrace(this.camera);
        this.water.resize(this.camera);
        this.environment.setPortraitHorizon(aspect < .72, this.water.diagnostics().waterline, aspect);
        this.environment.setViewport(w, h);
        this.sim.setViewport(Math.min(160, this.layout.heroRect.width / framing.scale * .9), 16);
        this.renderer.setSize(w, h);
        this.setQuality(this.sim.quality);
    }
    setDisplay(mode: DisplayMode) {
        this.mode = mode;
        const transparent = mode === 'transparent';
        this.environment.group.visible = !transparent;
        this.overlay.value = transparent ? 1 : 0;
        this.renderer.setClearColor(0x020409, transparent ? 0 : 1);
        this.host.dataset.display = mode;
        if (this.initialized) this.resize();
    }
    setQuality(q: Quality) {
        const budget = BUDGETS[q], w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
        const ratio = Math.min(window.devicePixelRatio || 1, budget.ratio, Math.sqrt(budget.pixels / (w * h)));
        this.renderer.setPixelRatio(ratio);
        this.bloomPass.strength.value = budget.bloom * (this.sim.reducedFlashes ? .7 : 1);
        this.metrics.renderPixels = Math.round(w * h * ratio * ratio);
    }
    resolveLaunchProfile(id: FamilyId) {
        const l = this.layout;
        const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const point = new THREE.Vector3(), ndc = new THREE.Vector2(0, 0);
        return resolveScreenLaunchProfile(l, id, stageFraming(l).scale, y => {
            ndc.y = 1 - y / l.viewport.height * 2;
            ray.setFromCamera(ndc, this.camera);
            return ray.ray.intersectPlane(plane, point)?.y ?? this.sim.ground + 72;
        });
    }
    projectPlacement(clientX: number) {
        const rect = this.host.getBoundingClientRect();
        const ndc = (clientX - rect.left) / Math.max(1, rect.width) * 2 - 1;
        const projected = new THREE.Vector3(0, this.sim.ground, 0).project(this.camera);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(ndc, projected.y), this.camera);
        const point = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Vector3());
        return point ? Math.max(.2, Math.min(.8, .5 + point.x / this.sim.launchSpan)) : .5;
    }
    projectBurst(clientX: number, clientY: number): [number, number] | null {
        const l = this.layout, x = clientX - l.viewport.x, y = clientY - l.viewport.y, r = l.burstCanopy;
        if (x < r.x || x > r.x + r.width || y < r.y || y > r.y + r.height) return null;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(x / l.viewport.width * 2 - 1, 1 - y / l.viewport.height * 2), this.camera);
        const point = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Vector3());
        return point ? [point.x, point.y] : null;
    }
    render() {
        if (this.disposed || !this.initialized) return;
        const start = performance.now(), sim = this.sim;
        // Apply at a frame boundary. Paper and rocket meshes wait for an interval
        // without an airborne body; an eight-second cap also serves continuous shows.
        if (this.pendingAssetCount) {
            let changed = false;
            for (const name of WATERFRONT_ASSET_NAMES) {
                const asset = this.pendingAssets[name];
                if (!asset) continue;
                if ((name === 'paper' || name === 'rocket') && sim.committed &&
                    sim.time - (this.assetQueuedAt[name] ?? sim.time) < 8) continue;
                delete this.pendingAssets[name];
                this.pendingAssetCount--;
                changed = true;
                (this.assets as Record<string, unknown>)[name] = asset;
                try {
                    if (name === 'smoke') {
                        const atlas = asset as ImageData;
                        this.smokeAtlas.image = { data: new Uint8Array(atlas.data), width: atlas.width, height: atlas.height };
                        this.smokeAtlas.needsUpdate = true;
                    } else if (name === 'paper') {
                        // GPU textures have immutable dimensions. Keep the existing canvas
                        // allocation when replacing the larger procedural paper with authored art.
                        const canvas = this.paper.image as HTMLCanvasElement;
                        const context = canvas.getContext('2d');
                        if (!context) throw new Error('Paper canvas context was unavailable');
                        context.drawImage(asset as HTMLImageElement, 0, 0, canvas.width, canvas.height);
                        this.paper.needsUpdate = true;
                    }
                    else if (name === 'flame') for (const prop of this.props) prop.setFlameTexture(asset as THREE.Texture);
                    else if (name === 'normal') this.water.setNormal(asset as THREE.Texture);
                    else if (name === 'rocket') for (const prop of this.props) prop.setAuthoredGeometry(asset as THREE.Group);
                    else if (name === 'terrace') this.environment.setTerrace(asset as THREE.Group);
                    else if (name === 'sky') this.environment.setSky(asset as HTMLImageElement);
                    else if (name === 'river') this.environment.setRiver(asset as THREE.Group);
                    this.assetStates[name] = 'active';
                } catch (error) {
                    this.assetStates[name] = 'failed';
                    this.assetErrors[name] = error instanceof Error ? error.message : String(error);
                }
            }
            if (changed) this.publishAssetStatus();
        }
        this.camera.updateMatrixWorld();
        this.opaqueCamera.copy(this.camera);
        this.opaqueCamera.layers.set(0);
        this.opaqueCamera.updateMatrixWorld();
        this.particles.update(sim, this.camera, this.host.clientHeight * this.renderer.getPixelRatio());
        this.bloomPass.strength.value = BUDGETS[sim.quality].bloom * (sim.reducedFlashes ? .7 : 1);
        for (const prop of this.props) prop.group.visible = false;
        let slot = 0;
        let staged = 0, airborne = 0;
        const place = (family: number, x: number, y: number, z: number, burn: number, contact: number, vx = 0, vy = 1, vz = 0, bodyOpacity = 1) => {
            const prop = this.props[slot++];
            if (!prop) return;
            prop.group.visible = this.mode === 'interactive' && bodyOpacity > .002;
            prop.group.position.set(x, y, z);
            prop.group.scale.set(3.8, 3.4, 3.8);
            prop.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(vx, vy, vz).normalize());
            prop.update(family, burn, contact, sim.time, sim.wind, bodyOpacity);
        };
        if (!sim.committed && !sim.show) {
            place(FAMILIES.findIndex(f => f.id === sim.selected), sim.placementToX(), sim.ground, 0, -.01, sim.holding ? sim.holdProgress : 0);
            staged++;
        }
        for (const r of sim.rockets) {
            if (r.stage === 'afterglow') continue;
            const axis = flightAxis(r);
            const opacity = r.stage === 'ascent' ? flightBodyOpacity(r.age, r.ascent) : 1;
            place(r.family, r.x, r.y, r.z, r.stage === 'fuse' ? Math.min(1, r.age / r.fuse) : 1, 0, ...axis, opacity);
            if (r.stage === 'fuse') staged++; else airborne++;
        }
        this.host.dataset.stagedRockets = String(staged);
        this.host.dataset.airborneRockets = String(airborne);
        this.host.dataset.visibleRocketBodies = String(this.props.filter(prop => prop.group.visible).length);
        this.stage.update(sim, this.mode === 'interactive');
        this.environment.update(sim, this.mode !== 'transparent', !this.host.parentElement?.classList.contains('reduced-motion'));
        this.projected.set(sim.placementToX(), sim.ground, 0).project(this.camera);
        const groundPixels = (1 + this.projected.y) * .5 * this.host.clientHeight;
        const parent = this.host.parentElement;
        parent?.style.setProperty('--ground-px', `${groundPixels}px`);
        parent?.style.setProperty('--placement-left', `${(this.projected.x + 1) * 50}%`);
        const light = sim.lights[sim.lights.length - 1];
        if (light) {
            const intensity = Math.exp(-light.age * 2) * light.strength;
            this.blastLight.position.set(light.x, light.y, light.z);
            this.blastLight.color.setRGB(light.r, light.g, light.b);
            this.blastLight.intensity = intensity * 60;
            parent?.style.setProperty('--blast', `${Math.round(light.r * 230)} ${Math.round(light.g * 230)} ${Math.round(light.b * 230)} / ${Math.min(.16, intensity * .12)}`);
        } else {
            this.blastLight.intensity = 0;
            parent?.style.setProperty('--blast', '234 193 122 / 0');
        }
        this.opaqueDepth.update();
        this.water.setShoreComposition(this.environment.skyCrop.value, this.environment.authoredSky.value);
        this.water.update(this.renderer, this.scene, this.camera, sim, this.mode !== 'transparent', camera => this.particles.orient(camera));
        this.post.render();
        this.metrics.submitMs = performance.now() - start;
        this.metrics.frames++;
    }
    diagnostics() {
        const r = this.sim.committed;
        const point = r ? rocketPoint(r, SHELL_LOCAL_Y) : null;
        const projected = point ? new THREE.Vector3(...point).project(this.camera) : null;
        const apex = r ? new THREE.Vector3(r.x, r.top + SHELL_LOCAL_Y * 3.4, r.z).project(this.camera) : null;
        return {
            authoredAssets: this.host.dataset.assets || 'procedural fallback',
            authoredAssetStates: { ...this.assetStates },
            authoredAssetErrors: { ...this.assetErrors },
            stageLayout: this.layout, ...this.water.diagnostics(), ...this.environment.riverDiagnostics(this.camera), ...this.environment.skyDiagnostics(),
            stagedRockets: Number(this.host.dataset.stagedRockets || 0),
            airborneRockets: Number(this.host.dataset.airborneRockets || 0),
            visibleRocketBodies: this.props.filter(prop => prop.group.visible).length,
            shellScreen: projected ? { x: (projected.x + 1) * this.host.clientWidth / 2, y: (1 - projected.y) * this.host.clientHeight / 2 } : null,
            apexScreen: apex ? { x: (apex.x + 1) * this.host.clientWidth / 2, y: (1 - apex.y) * this.host.clientHeight / 2 } : null,
            launchProfile: r?.launchProfile ?? null,
            flight: r ? { id: r.id, stage: r.stage, age: r.age, ascent: r.ascent, thrust: r.thrust, y: r.y, vy: r.vy, top: r.top, family: r.family, shell: point } : null,
        };
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        cancelAnimationFrame(this.assetFrame);
        this.renderer.domElement.removeEventListener('webglcontextlost', this.lossHandler);
        this.particles.dispose();
        this.bloomPass.dispose();
        this.scenePass.dispose();
        this.opaquePass.dispose();
        this.opaqueDepth.dispose();
        this.post.dispose();
        const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
        this.scene.traverse(object => {
            if (object instanceof THREE.Mesh && object.layers.mask === 1) {
                geometries.add(object.geometry);
                for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
            }
        });
        for (const g of geometries) g.dispose();
        for (const m of materials) m.dispose();
        this.smokeAtlas.dispose();
        this.paper.dispose();
        this.environment.dispose();
        this.water.dispose();
        for (const name of WATERFRONT_ASSET_NAMES) {
            const active = this.assets[name], pending = this.pendingAssets[name];
            if (active) disposeWaterfrontAsset(name, active);
            if (pending) disposeWaterfrontAsset(name, pending);
        }
        if (this.initialized) this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
