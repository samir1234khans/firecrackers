import * as THREE from 'three/webgpu';
import { attribute, cos, dot, float, mix, pass, positionGeometry, positionView, screenUV, sin, smoothstep, texture, uniform, uv, vec2, vec3 } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';
import { BUDGETS, hash01 } from '../engine/catalog';
import { carrierTint } from '../engine/GrandEffects';
import { signatureTint } from '../engine/FlagshipEffects';
import { rocketPoint, MOTOR_LOCAL_Y, SHELL_LOCAL_Y, flightBodyOpacity } from '../engine/LaunchGeometry';
import { ParticleReflectionBounds, TRAIL_CAP_EXTENSION } from './ParticleReflectionBounds';
const BUCKETS = 6;
const bucketFor = (z: number) => Math.max(0, Math.min(BUCKETS - 1, Math.floor((z + 75) / 25)));
export class ParticleUniforms {
    readonly right = uniform(new THREE.Vector3(1, 0, 0));
    readonly up = uniform(new THREE.Vector3(0, 1, 0));
    readonly towardCamera = new THREE.Vector3(0, 0, 1);
    readonly camera = uniform(new THREE.Vector3());
    readonly near = uniform(.1);
    readonly far = uniform(1500);
    readonly protect = uniform(0);
    readonly safeRect = uniform(new THREE.Vector4(.32, .25, .68, .72));
    readonly energy = uniform(1);
}
class Batch {
    readonly reflectionBounds = new ParticleReflectionBounds();
    savedVisible = true;
    readonly geometry = new THREE.InstancedBufferGeometry();
    readonly material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide });
    readonly mesh: THREE.Mesh;
    readonly attrs: Record<string, THREE.InterleavedBufferAttribute> = {};
    private readonly instances: THREE.InstancedInterleavedBuffer;
    count = 0;
    constructor(capacity: number, layout: Record<string, number>, order: number, additive: boolean) {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
        this.geometry.setIndex([0, 1, 2, 0, 2, 3]);
        this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
        // One instance stream stays within WebGPU's default eight vertex-buffer slots.
        const stride = Object.values(layout).reduce((sum, size) => sum + size, 0);
        this.instances = new THREE.InstancedInterleavedBuffer(new Float32Array(capacity * stride), stride);
        this.instances.setUsage(THREE.DynamicDrawUsage);
        let offset = 0;
        for (const [name, size] of Object.entries(layout)) {
            const a = new THREE.InterleavedBufferAttribute(this.instances, size, offset);
            offset += size;
            this.attrs[name] = a;
            this.geometry.setAttribute(name, a);
        }
        this.geometry.instanceCount = 0;
        this.material.forceSinglePass = true;
        this.material.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = order;
        this.mesh.layers.set(1);
    }
    upload() {
        this.geometry.instanceCount = this.count;
        this.instances.clearUpdateRanges();
        if (this.count) {
            this.instances.addUpdateRange(0, this.count * this.instances.stride);
            this.instances.needsUpdate = true;
        }
    }
    dispose() { this.geometry.dispose(); this.material.dispose(); }
}
/** Depth-bucketed smoke and emissive segments: near smoke can attenuate far sparks. */
export class ParticleScene {
    private readonly heads: Batch[] = [];
    private readonly trails: Batch[] = [];
    private readonly smoke: Batch[] = [];
    private readonly smokeOrder: number[] = [];
    readonly uniforms = new ParticleUniforms();
    constructor(scene: THREE.Scene, atlas: THREE.Texture, opaquePass: ReturnType<typeof pass>) {
        const u = this.uniforms;
        const insideX = smoothstep(u.safeRect.x.sub(.035), u.safeRect.x, screenUV.x).mul(float(1).sub(smoothstep(u.safeRect.z, u.safeRect.z.add(.035), screenUV.x)));
        const insideY = smoothstep(u.safeRect.y.sub(.035), u.safeRect.y, screenUV.y).mul(float(1).sub(smoothstep(u.safeRect.w, u.safeRect.w.add(.035), screenUV.y)));
        const protectedMask = float(1).sub(insideX.mul(insideY).mul(u.protect));
        const depth = opaquePass.getTextureNode('depth').sample(screenUV).r;
        const viewZ = u.near.mul(u.far).div(depth.mul(u.far.sub(u.near)).sub(u.far));
        const soft = positionView.z.sub(viewZ).div(2.2).clamp(0, 1);
        for (let bucket = 0; bucket < BUCKETS; bucket++) {
            const s = new Batch(96, { iPosition: 3, iScale: 2, iRotation: 1, iAlpha: 1, iColor: 3, iFrame: 1, iVariant: 1, iLightDir: 3 }, 10 + bucket * 3, false);
            const a = attribute('iRotation', 'float'), p = positionGeometry.xy.mul(attribute('iScale', 'vec2'));
            const ox = p.x.mul(cos(a)).sub(p.y.mul(sin(a))), oy = p.x.mul(sin(a)).add(p.y.mul(cos(a)));
            s.material.positionNode = attribute('iPosition', 'vec3').add(u.right.mul(ox)).add(u.up.mul(oy));
            const frame = attribute('iFrame', 'float'), variant = attribute('iVariant', 'float');
            const frameA = frame.floor(), frameB = frameA.add(1).min(15);
            const sampleUV = (f: ReturnType<typeof float>) => uv().mul(128 / 132).add(2 / 132).add(vec2(f.mod(4), f.div(4).floor().add(variant.mul(4)))).div(vec2(4, 12));
            const density = mix(texture(atlas, sampleUV(frameA)), texture(atlas, sampleUV(frameB)), frame.fract());
            // The atlas stores density and its gradients, so its lobes can face the report light.
            // Absorption leaves the dense interior dark instead of tinting the entire billboard.
            const gradient = density.gb.mul(2).sub(1).mul(1.8);
            const normal = vec3(gradient, float(1).sub(dot(gradient, gradient).min(.96)).sqrt()).normalize();
            const direction = attribute('iLightDir', 'vec3');
            const localDirection = vec3(direction.x.mul(cos(a)).add(direction.y.mul(sin(a))), direction.y.mul(cos(a)).sub(direction.x.mul(sin(a))), direction.z);
            const diffuse = dot(normal, localDirection).max(0);
            const rim = gradient.length().clamp(0, 1).mul(.55).add(.065);
            const transmission = density.r.mul(-1.85).exp();
            // Small forward-scattering lobes reveal depth without whitening the cloud.
            const forward = localDirection.z.max(0).pow(3).mul(rim).mul(.22);
            const shading = diffuse.mul(.72).add(rim).add(forward).mul(transmission);
            s.material.colorNode = vec3(.020, .027, .039).mul(float(1).sub(density.r.mul(.42))).add(attribute('iColor', 'vec3').mul(shading));
            s.material.opacityNode = density.a.mul(attribute('iAlpha', 'float')).mul(density.r.mul(.28).add(.82)).mul(soft).mul(protectedMask);
            this.smoke.push(s); scene.add(s.mesh);
            const h = new Batch(4096, { iPosition: 3, iScale: 2, iAlpha: 1, iColor: 3 }, 12 + bucket * 3, true);
            h.material.positionNode = attribute('iPosition', 'vec3').add(u.right.mul(positionGeometry.x).mul(attribute('iScale', 'vec2').x)).add(u.up.mul(positionGeometry.y).mul(attribute('iScale', 'vec2').y));
            const radius = uv().sub(.5).length().mul(2);
            const hotCore = radius.pow(2).mul(-38).exp();
            const kernel = radius.pow(2).mul(-17).exp().mul(.94).add(radius.pow(2).mul(-3.2).exp().mul(.075));
            h.material.colorNode = attribute('iColor', 'vec3').mul(hotCore.mul(.22).add(1)).add(vec3(.09).mul(hotCore)).mul(u.energy);
            h.material.opacityNode = kernel.mul(attribute('iAlpha', 'float')).mul(protectedMask);
            h.mesh.layers.enable(4);
            this.heads.push(h); scene.add(h.mesh);
            const t = new Batch(24000, { iA: 3, iB: 3, iWidth: 1, iAlpha: 1, iColor: 3 }, 11 + bucket * 3, true);
            const start = attribute('iA', 'vec3'), end = attribute('iB', 'vec3');
            // Overlapping soft caps hide seams between retained adjacent samples.
            const middle = mix(start, end, uv().y.mul(1 + 2 * TRAIL_CAP_EXTENSION).sub(TRAIL_CAP_EXTENSION));
            const tangent = end.sub(start).add(vec3(0, .00001, 0));
            const side = tangent.cross(u.camera.sub(middle)).normalize();
            t.material.positionNode = middle.add(side.mul(positionGeometry.x).mul(attribute('iWidth', 'float')).mul(uv().y.mul(.08).add(.92)));
            const across = uv().x.sub(.5).mul(2).abs();
            const core = across.pow(2).mul(-10).exp();
            const halo = across.pow(2).mul(-2.8).exp().mul(.08);
            t.material.colorNode = attribute('iColor', 'vec3').mul(u.energy);
            const grain = middle.dot(vec3(.7, 1.3, .4)).sin().mul(.045).add(.955);
            const cap = smoothstep(0, .055, uv().y).mul(float(1).sub(smoothstep(.945, 1, uv().y)));
            t.material.opacityNode = core.add(halo).mul(cap).mul(grain).mul(attribute('iAlpha', 'float')).mul(protectedMask);
            t.mesh.layers.enable(4);
            this.trails.push(t); scene.add(t.mesh);
        }
    }
    private savedProtection = 0;
    private reflecting = false;
    private readonly reflectionFrustum = new THREE.Frustum();
    private readonly reflectionProjection = new THREE.Matrix4();
    private reflectedBatches = 0;
    private culledBatches = 0;
    orientPass(camera: THREE.PerspectiveCamera, reflecting = false) {
        if (reflecting) {
            this.savedProtection = this.uniforms.protect.value;
            this.uniforms.protect.value = 0;
            this.reflecting = true;
            this.reflectionProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.reflectionFrustum.setFromProjectionMatrix(this.reflectionProjection, camera.coordinateSystem);
            this.reflectedBatches = this.culledBatches = 0;
            for (const group of [this.heads, this.trails]) for (const batch of group) {
                batch.savedVisible = batch.mesh.visible;
                // Empty startup streams stay visible so compileAsync prepares
                // every material before a launch, including the mirror variant.
                batch.mesh.visible = batch.savedVisible && (batch.reflectionBounds.box.isEmpty() || this.reflectionFrustum.intersectsBox(batch.reflectionBounds.box));
                if (batch.count) batch.mesh.visible ? this.reflectedBatches++ : this.culledBatches++;
            }
        } else if (this.reflecting) {
            this.uniforms.protect.value = this.savedProtection;
            for (const group of [this.heads, this.trails]) for (const batch of group) batch.mesh.visible = batch.savedVisible;
            this.reflecting = false;
        }
        this.orient(camera);
    }
    orient(camera: THREE.PerspectiveCamera) {
        const u = this.uniforms;
        u.camera.value.copy(camera.position);
        u.right.value.setFromMatrixColumn(camera.matrixWorld, 0);
        u.up.value.setFromMatrixColumn(camera.matrixWorld, 1);
        u.towardCamera.setFromMatrixColumn(camera.matrixWorld, 2);
        u.near.value = camera.near; u.far.value = camera.far;
    }
    update(sim: Simulation, camera: THREE.PerspectiveCamera, height: number) {
        this.orient(camera);
        const u = this.uniforms;
        u.protect.value = sim.protectCenter ? 1 : 0;
        u.safeRect.value.set(...sim.safeRect);
        u.energy.value = sim.reducedFlashes ? .90 : 1.12;
        for (const group of [this.heads, this.trails, this.smoke]) for (const batch of group) {
            batch.count = 0; batch.reflectionBounds.reset();
        }
        const pixelFactor = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, height);
        const p = sim.heads;
        for (let i = 0; i < p.count; i++) {
            if (p.age[i] < 0) continue;
            const b = this.heads[bucketFor(p.z[i])], n = b.count++, a = b.attrs, t = p.age[i] / p.life[i];
            const unit = Math.max(.035, (camera.position.z - p.z[i]) * pixelFactor);
            const size = Math.max(p.size[i] * (1 - t * .38), unit * .9) * 5;
            b.reflectionBounds.include(p.x[i], p.y[i], p.z[i], size * 1.2);
            const fade = Math.pow(Math.max(0, 1 - t), .72), red = p.family[i] === 2 ? Math.max(0, (t - .4) * 1.1) : 0;
            a.iPosition.setXYZ(n, p.x[i], p.y[i], p.z[i]);
            a.iScale.setXY(n, size, size);
            a.iAlpha.setX(n, fade * p.gain[i] * (.84 + hash01(p.id[i], 51) * .16));
            const heat = p.family[i] >= 10 ? 1.75 + Math.exp(-p.age[i] * 4) * .45 : 2.35 + Math.exp(-p.age[i] * 4) * 1.3;
            a.iColor.setXYZ(n, p.r[i] * heat, p.g[i] * (1 - red) * heat, p.b[i] * (1 - red) * heat);
        }
        const embers = sim.embers;
        for (let i = 0; i < embers.count; i++) {
            const b = this.heads[bucketFor(embers.z[i])], n = b.count++, a = b.attrs;
            const age = embers.age[i] / embers.life[i];
            const pixel = Math.max(.03, (camera.position.z - embers.z[i]) * pixelFactor);
            const size = Math.max(.07, pixel * .44) * 4;
            b.reflectionBounds.include(embers.x[i], embers.y[i], embers.z[i], size * 1.2);
            a.iPosition.setXYZ(n, embers.x[i], embers.y[i], embers.z[i]);
            a.iScale.setXY(n, size, size * 1.35);
            a.iAlpha.setX(n, Math.pow(1 - age, 1.35) * .75);
            a.iColor.setXYZ(n, embers.r[i] * 4, embers.g[i] * 3.4, embers.b[i] * 2.4);
        }
        const addHead = (x: number, y: number, z: number, size: number, r: number, g: number, blue: number) => {
            const b = this.heads[bucketFor(z)], n = b.count++, a = b.attrs;
            b.reflectionBounds.include(x, y, z, size * 1.2);
            a.iPosition.setXYZ(n, x, y, z);
            a.iScale.setXY(n, size, size * 1.6);
            a.iColor.setXYZ(n, r, g, blue); a.iAlpha.setX(n, .88);
        };
        for (const r of sim.rockets) {
            if (r.stage !== 'ascent') continue;
            const shell = rocketPoint(r, SHELL_LOCAL_Y);
            const motor = rocketPoint(r, MOTOR_LOCAL_Y);
            const receded = 1 - flightBodyOpacity(r.age, r.ascent);
            // One luminous shell follows exactly the same attachment that will burst.
            const tone = r.family >= 10 ? signatureTint(r.family) : null;
            addHead(...shell, 2.2 + receded * .8, tone ? tone[0] * 3.6 : 3.6, tone ? tone[1] * 3.6 : 2.4, tone ? tone[2] * 3.6 : 1.1);
            if (r.phase === 'thrust') addHead(...motor, r.family >= 10 ? 3.3 : 2.8, tone ? tone[0] * 4.5 : 4.5, tone ? tone[1] * 4.5 : 2.5, tone ? tone[2] * 4.5 : .8);
        }
        for (const c of sim.cues) {
            const tone = carrierTint(c.family, c.palette);
            addHead(c.x, c.y, c.z, .82, tone[0] * 3, tone[1] * 3, tone[2] * 3);
        }
        const t = sim.trails;
        const addTrail = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, physicalWidth: number,
            age: number, owner: number, red: number, green: number, blue: number, brightness = 1) => {
            const z = (az + bz) * .5, b = this.trails[bucketFor(z)], n = b.count++, a = b.attrs;
            const pixel = Math.max(.026, (camera.position.z - z) * pixelFactor);
            // At full heat the Gaussian core covers a pixel, avoiding stippled diagonal lines.
            // Older sections taper to a dim, fine ember rather than retaining a thick neon line.
            const width = Math.max(physicalWidth * (1 - age * .72), pixel * (1.04 - age * .62)) * 4.5;
            b.reflectionBounds.includeSegment(ax, ay, az, bx, by, bz, width);
            a.iA.setXYZ(n, ax, ay, az);
            a.iB.setXYZ(n, bx, by, bz);
            a.iWidth.setX(n, width);
            a.iAlpha.setX(n, Math.pow(Math.max(0, 1 - age), 1.3) * (.58 + hash01(owner, 81) * .28) * brightness);
            a.iColor.setXYZ(n, red * 2.55 * (1 + age * .09), green * 2.55 * (1 - age * .15), blue * 2.55 * (1 - age * .34));
        };
        for (let i = 0; i < t.count; i++) {
            addTrail(t.ax[i], t.ay[i], t.az[i], t.bx[i], t.by[i], t.bz[i], t.width[i], t.age[i] / t.life[i],
                t.owner[i], t.r[i], t.g[i], t.b[i]);
        }
        // Bridge the unsampled fraction of a moving head to its retained trace, without
        // adding simulation particles or exceeding the chosen trail admission budget.
        let bridges = BUDGETS[sim.quality].trails - t.count;
        for (let i = 0; i < p.count && bridges > 0; i++) {
            if (p.trail[i] <= 0 || p.carry[i] <= 0) continue;
            const age = p.age[i] / p.life[i];
            addTrail(p.px[i], p.py[i], p.pz[i], p.x[i], p.y[i], p.z[i], p.size[i] * .55 * (1 - age * .45),
                0, p.id[i], p.r[i], p.g[i], p.b[i], Math.pow(Math.max(0, 1 - age), .4));
            bridges--;
        }
        const smoke = sim.smoke;
        const order = this.smokeOrder; order.length = smoke.count;
        for (let i = 0; i < smoke.count; i++) order[i] = i;
        order.sort((a, b) => smoke.z[a] - smoke.z[b]);
        for (const i of order) {
            const b = this.smoke[bucketFor(smoke.z[i])], n = b.count++, a = b.attrs;
            let lr = 0, lg = 0, lb = 0, dx = 0, dy = 0, dz = 0;
            for (let lightIndex = 0; lightIndex < sim.burstLights.count; lightIndex++) {
                const light = sim.burstLights.sources[lightIndex];
                const lx = light.x - smoke.x[i], ly = light.y - smoke.y[i], lz = light.z - smoke.z[i];
                const d = Math.hypot(lx, ly, lz), falloff = Math.max(0, 1 - d / 39);
                const power = falloff * falloff * sim.burstLights.energies[lightIndex] * 1.25;
                lr += light.r * power; lg += light.g * power; lb += light.b * power;
                const directionScale = power / Math.max(1, d);
                dx += (lx * u.right.value.x + ly * u.right.value.y + lz * u.right.value.z) * directionScale;
                dy += (lx * u.up.value.x + ly * u.up.value.y + lz * u.up.value.z) * directionScale;
                dz += (lx * u.towardCamera.x + ly * u.towardCamera.y + lz * u.towardCamera.z) * directionScale;
            }
            const age = smoke.age[i] / smoke.life[i];
            a.iPosition.setXYZ(n, smoke.x[i], smoke.y[i], smoke.z[i]);
            a.iScale.setXY(n, smoke.size[i] * 2.8, smoke.size[i] * 2.1);
            a.iRotation.setX(n, smoke.angle[i]);
            a.iAlpha.setX(n, Math.min(1, smoke.age[i] * 1.8) * Math.pow(1 - age, 1.4) * smoke.gravity[i] * .86);
            a.iColor.setXYZ(n, Math.min(1.05, lr), Math.min(1.05, lg), Math.min(1.05, lb));
            const lightLength = Math.max(.001, Math.hypot(dx, dy, dz));
            a.iLightDir.setXYZ(n, dx / lightLength, dy / lightLength, dz / lightLength);
            a.iFrame.setX(n, Math.min(14.98, (1 - Math.exp(-smoke.age[i] * .22)) * 15));
            // The Blender atlas rows are fuse, motor and burst, matching Simulation's kind.
            a.iVariant.setX(n, smoke.family[i]);
        }
        for (const group of [this.heads, this.trails, this.smoke]) for (const batch of group) batch.upload();
    }
    dispose() {
        for (const group of [this.heads, this.trails, this.smoke]) for (const b of group) b.dispose();
    }
    reflectionDiagnostics() { return { reflectionParticleBatches: this.reflectedBatches, reflectionCulledParticleBatches: this.culledBatches, reflectionParticleBatchCapacity: BUCKETS * 2 }; }
}
