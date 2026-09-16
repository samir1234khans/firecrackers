import * as THREE from 'three/webgpu';
import { color, float, mix, pass, uniform, uv, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { BUDGETS, FAMILIES } from './catalog';
import type { Quality } from './catalog';
import type { Simulation } from './Simulation';
import { ParticleScene } from '../graphics/ParticleScene';
import { RocketProp } from '../graphics/RocketProp';
import { makeHorizonTexture, makePaperTexture, makeSmokeAtlas } from '../graphics/textures';
import type { DisplayMode } from '../platform/presentation';
/** Perspective, depth-aware native r180 TSL pipeline. Simulation remains CPU fixed-step. */
export class FireworkRenderer {
    readonly renderer: THREE.WebGPURenderer;
    readonly scene = new THREE.Scene();
    readonly camera = new THREE.PerspectiveCamera(42, 1, .1, 1500);
    private readonly opaqueCamera = new THREE.PerspectiveCamera();
    readonly metrics = { renderPixels: 0, submitMs: 0, frames: 0 };
    private readonly environment = new THREE.Group();
    private readonly sky: THREE.Mesh;
    private readonly smokeAtlas = makeSmokeAtlas();
    private readonly paper = makePaperTexture();
    private readonly horizon = makeHorizonTexture();
    private readonly props = Array.from({ length: 8 }, () => new RocketProp(this.paper));
    private readonly pad = new THREE.Group();
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
        const skyMaterial = new THREE.MeshBasicNodeMaterial({ depthWrite: false });
        skyMaterial.colorNode = mix(color('#02040a'), color('#142338'), uv().y.oneMinus().pow(3.2));
        this.sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), skyMaterial);
        this.sky.position.z = -250;
        this.sky.renderOrder = -10;
        const horizonMesh = new THREE.Mesh(new THREE.PlaneGeometry(580, 65), new THREE.MeshBasicMaterial({ map: this.horizon, transparent: true, depthWrite: false }));
        horizonMesh.position.set(0, -17, -110);
        horizonMesh.renderOrder = -5;
        this.environment.add(this.sky, horizonMesh);
        this.scene.add(this.environment);
        this.scene.add(new THREE.HemisphereLight(0x96a5c2, 0x1c120a, 1.4));
        const key = new THREE.DirectionalLight(0xffd7a3, 2.2);
        key.position.set(-8, 35, 45);
        this.scene.add(key, this.blastLight);
        const support = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, .22, 32), new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: .96 }));
        const shadowMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
        shadowMaterial.colorNode = color('#010204');
        shadowMaterial.opacityNode = uv().sub(.5).length().mul(2).oneMinus().clamp(0, 1).pow(2).mul(.7);
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(11, 7), shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = .13;
        this.pad.add(shadow, support);
        this.scene.add(this.pad);
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
            if (!this.disposed)
                this.onFailure('Graphics were interrupted. Retry to return to a fresh sky.');
        };
        this.renderer.domElement.addEventListener('webglcontextlost', this.lossHandler);
    }
    async init() {
        await this.renderer.init();
        if (this.disposed) {
            this.renderer.dispose();
            return;
        }
        this.initialized = true;
        this.backend = (this.renderer.backend as unknown as {
            isWebGPUBackend?: boolean;
        }).isWebGPUBackend ? 'WebGPU' : 'WebGL 2';
        const device = (this.renderer.backend as unknown as {
            device?: {
                lost: Promise<unknown>;
            };
        }).device;
        device?.lost.then(() => { if (!this.disposed)
            this.onFailure('Graphics were interrupted. Retry with lower quality.'); });
        this.host.replaceChildren(this.renderer.domElement);
        this.host.dataset.renderer = 'cinematic-v2';
        this.host.dataset.backend = this.backend;
        this.resize();
        // Warm the actual post-processing graph, not a re-entrant standalone scene compilation.
        // The opaque pass has a separate camera identity so its render list cannot overwrite the beauty pass.
        if (!this.disposed)
            this.render();
    }
    resize() {
        if (this.disposed)
            return;
        const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight), aspect = w / h;
        const span = Math.max(120, 76 / aspect);
        this.camera.aspect = aspect;
        this.camera.position.set(0, 46, span / (2 * Math.tan(this.camera.fov * Math.PI / 360)));
        this.camera.lookAt(0, 46, 0);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        const ratio = (this.camera.position.z + 250) / this.camera.position.z;
        this.sky.position.y = 46;
        this.sky.scale.set(span * aspect * ratio, span * ratio, 1);
        this.sim.setViewport(Math.min(160, span * aspect * .78), 16);
        this.renderer.setSize(w, h);
        this.setQuality(this.sim.quality);
    }
    setDisplay(mode: DisplayMode) {
        this.mode = mode;
        const transparent = mode === 'transparent';
        this.environment.visible = !transparent;
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
        const halfWidth = this.camera.position.z * Math.tan(this.camera.fov * Math.PI / 360) * this.camera.aspect;
        return Math.max(.2, Math.min(.8, .5 + ndc * halfWidth / this.sim.launchSpan));
    }
    render() {
        if (this.disposed || !this.initialized)
            return;
        const start = performance.now(), sim = this.sim;
        this.camera.updateMatrixWorld();
        this.opaqueCamera.copy(this.camera);
        this.opaqueCamera.layers.set(0);
        this.opaqueCamera.updateMatrixWorld();
        this.particles.update(sim, this.camera, this.host.clientHeight * this.renderer.getPixelRatio());
        this.bloomPass.strength.value = BUDGETS[sim.quality].bloom * (sim.reducedFlashes ? .7 : 1);
        for (const prop of this.props)
            prop.group.visible = false;
        let slot = 0;
        const place = (family: number, x: number, y: number, z: number, burn: number, contact: number, vx = 0, vy = 1, vz = 0) => {
            const prop = this.props[slot++];
            if (!prop)
                return;
            prop.group.visible = this.mode !== 'transparent';
            prop.group.position.set(x, y, z);
            prop.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(vx, vy, vz).normalize());
            prop.update(family, burn, contact, sim.time, sim.wind);
        };
        if (sim.prepared && !sim.rockets.some(r => r.stage === 'fuse')) {
            place(FAMILIES.findIndex(f => f.id === sim.selected), sim.placementToX(), sim.ground, 0, -.01, sim.holding ? sim.holdProgress : 0);
        }
        for (const r of sim.rockets)
            if (r.stage !== 'afterglow') {
                place(r.family, r.x, r.y, r.z, r.stage === 'fuse' ? Math.min(1, r.age / r.fuse) : 1, 0, r.stage === 'ascent' ? r.vx : 0, r.stage === 'ascent' ? r.vy : 1, r.stage === 'ascent' ? r.vz : 0);
            }
        this.pad.position.set(sim.placementToX(), sim.ground - 2.76, 0);
        this.pad.visible = this.mode === 'interactive';
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
        }
        else {
            this.blastLight.intensity = 0;
            parent?.style.setProperty('--blast', '234 193 122 / 0');
        }
        this.post.render();
        this.metrics.submitMs = performance.now() - start;
        this.metrics.frames++;
    }
    dispose() {
        if (this.disposed)
            return;
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
                for (const m of Array.isArray(object.material) ? object.material : [object.material])
                    materials.add(m);
            }
        });
        for (const g of geometries)
            g.dispose();
        for (const m of materials)
            m.dispose();
        this.smokeAtlas.dispose();
        this.paper.dispose();
        this.horizon.dispose();
        if (this.initialized)
            this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
