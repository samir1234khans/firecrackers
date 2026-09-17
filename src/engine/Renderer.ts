import * as THREE from 'three/webgpu';
import { float, mix, pass, uniform, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { BUDGETS, FAMILIES } from './catalog';
import type { Quality } from './catalog';
import type { Simulation } from './Simulation';
import { ParticleScene } from '../graphics/ParticleScene';
import { RocketProp } from '../graphics/RocketProp';
import { LaunchStage } from '../graphics/LaunchStage';
import { NightEnvironment } from '../graphics/NightEnvironment';
import { makePaperTexture, makeSmokeAtlas } from '../graphics/textures';
import type { DisplayMode } from '../platform/presentation';

/** Perspective, depth-aware native r180 TSL pipeline. Simulation remains CPU fixed-step. */
export class FireworkRenderer {
    readonly renderer: THREE.WebGPURenderer;
    readonly scene = new THREE.Scene();
    readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 1500);
    private readonly opaqueCamera = new THREE.PerspectiveCamera();
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly environment = new NightEnvironment();
    private readonly smokeAtlas = makeSmokeAtlas();
    private readonly paper = makePaperTexture();
    private readonly props = Array.from({ length: 8 }, () => new RocketProp(this.paper));
    private readonly stage = new LaunchStage();
    private readonly blastLight = new THREE.PointLight(0xffcc88, 0, 160, 2);
    private readonly opaquePass: ReturnType<typeof pass>;
    private readonly scenePass: ReturnType<typeof pass>;
    private readonly bloomPass: ReturnType<typeof bloom>;
    private readonly post: THREE.PostProcessing;
    private readonly particles: ParticleScene;
    private readonly overlay = uniform(0);
    private readonly projected = new THREE.Vector3();
    private mode: DisplayMode = 'interactive';
    private disposed = false;
    private initialized = false;
    private lossHandler: (event: Event) => void;
    backend = 'Starting';
    constructor(private host: HTMLDivElement, private sim: Simulation, private onFailure: (message: string) => void, forceWebGL = false) {
        this.renderer = new THREE.WebGPURenderer({ antialias: false, alpha: true, forceWebGL });
        this.renderer.setClearColor(0x020409, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = .95;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.camera.layers.enable(1);
        this.scene.add(this.environment.group);
        this.scene.fog = new THREE.FogExp2('#07111e', .0021);
        this.scene.environment = this.environment.probe;
        this.scene.environmentIntensity = .85;
        this.scene.add(new THREE.HemisphereLight(0xa6bfdc, 0x34261a, 2.0));
        const key = new THREE.DirectionalLight(0xffdcaf, 3.5);
        key.position.set(-8, 35, 45);
        this.scene.add(key, this.blastLight);
        this.scene.add(this.stage.group);
        for (const prop of this.props) {
            prop.group.visible = false;
            this.scene.add(prop.group);
        }
        const opaqueLayers = new THREE.Layers();
        opaqueLayers.set(0);
        this.opaquePass = pass(this.scene, this.opaqueCamera).setLayers(opaqueLayers);
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
    }
    resize() {
        if (this.disposed) return;
        const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight), aspect = w / h;
        const groundPixels = h < 460 ? Math.min(142, h * .38) : w < 600 ? Math.min(295, h * .4) : 332;
        const span = Math.max(136, 108 / aspect, 106 / (1 - groundPixels / h));
        const centerY = this.sim.ground + (.5 - groundPixels / h) * span;
        this.camera.aspect = aspect;
        const distance = span / (2 * Math.tan(this.camera.fov * Math.PI / 360));
        const pitch = .08;
        this.camera.position.set(0, centerY + Math.sin(pitch) * distance, Math.cos(pitch) * distance);
        this.camera.lookAt(0, centerY, 0);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        this.sim.setViewport(Math.min(160, span * aspect * .78), 16);
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
    }
    setQuality(q: Quality) {
        const budget = BUDGETS[q], w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
        const ratio = Math.min(window.devicePixelRatio || 1, budget.ratio, Math.sqrt(budget.pixels / (w * h)));
        this.renderer.setPixelRatio(ratio);
        this.bloomPass.strength.value = budget.bloom * (this.sim.reducedFlashes ? .7 : 1);
        this.metrics.renderPixels = Math.round(w * h * ratio * ratio);
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
    render() {
        if (this.disposed || !this.initialized) return;
        const start = performance.now(), sim = this.sim;
        this.camera.updateMatrixWorld();
        this.opaqueCamera.copy(this.camera);
        this.opaqueCamera.layers.set(0);
        this.opaqueCamera.updateMatrixWorld();
        this.particles.update(sim, this.camera, this.host.clientHeight * this.renderer.getPixelRatio());
        this.bloomPass.strength.value = BUDGETS[sim.quality].bloom * (sim.reducedFlashes ? .7 : 1);
        for (const prop of this.props) prop.group.visible = false;
        let slot = 0;
        const place = (family: number, x: number, y: number, z: number, burn: number, contact: number, vx = 0, vy = 1, vz = 0) => {
            const prop = this.props[slot++];
            if (!prop) return;
            prop.group.visible = this.mode === 'interactive';
            prop.group.position.set(x, y, z);
            prop.group.scale.set(3.8, 3.4, 3.8);
            prop.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(vx, vy, vz).normalize());
            prop.update(family, burn, contact, sim.time, sim.wind);
        };
        if (sim.prepared && !sim.rockets.some(r => r.stage === 'fuse')) place(FAMILIES.findIndex(f => f.id === sim.selected), sim.placementToX(), sim.ground, 0, -.01, sim.holding ? sim.holdProgress : 0);
        for (const r of sim.rockets) if (r.stage !== 'afterglow') place(r.family, r.x, r.y, r.z, r.stage === 'fuse' ? Math.min(1, r.age / r.fuse) : 1, 0, r.stage === 'ascent' ? r.vx : 0, r.stage === 'ascent' ? r.vy : 1, r.stage === 'ascent' ? r.vz : 0);
        this.stage.update(sim, this.mode === 'interactive');
        this.environment.update(sim, this.mode !== 'transparent');
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
        this.post.render();
        this.metrics.submitMs = performance.now() - start;
        this.metrics.frames++;
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.renderer.domElement.removeEventListener('webglcontextlost', this.lossHandler);
        this.particles.dispose();
        this.bloomPass.dispose();
        this.scenePass.dispose();
        this.opaquePass.dispose();
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
        if (this.initialized) this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
