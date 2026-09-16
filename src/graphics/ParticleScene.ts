import * as THREE from 'three/webgpu';
import { attribute, cos, dot, float, mix, pass, positionGeometry, positionView, screenUV, sin, smoothstep, texture, uniform, uv, vec2, vec3 } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';
import { hash01 } from '../engine/catalog';
const BUCKETS = 6;
const bucketFor = (z: number) => Math.max(0, Math.min(BUCKETS - 1, Math.floor((z + 75) / 25)));
export class ParticleUniforms {
    readonly right = uniform(new THREE.Vector3(1, 0, 0));
    readonly up = uniform(new THREE.Vector3(0, 1, 0));
    readonly camera = uniform(new THREE.Vector3());
    readonly near = uniform(.1);
    readonly far = uniform(1500);
    readonly protect = uniform(0);
    readonly safeRect = uniform(new THREE.Vector4(.32, .25, .68, .72));
    readonly energy = uniform(1);
}
class Batch {
    readonly geometry = new THREE.InstancedBufferGeometry();
    readonly material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide });
    readonly mesh: THREE.Mesh;
    readonly attrs: Record<string, THREE.InstancedBufferAttribute> = {};
    count = 0;
    constructor(capacity: number, layout: Record<string, number>, order: number, additive: boolean) {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
        this.geometry.setIndex([0, 1, 2, 0, 2, 3]);
        for (const [name, size] of Object.entries(layout)) {
            const a = new THREE.InstancedBufferAttribute(new Float32Array(capacity * size), size);
            a.setUsage(THREE.DynamicDrawUsage);
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
        for (const a of Object.values(this.attrs)) {
            a.clearUpdateRanges();
            if (this.count) {
                a.addUpdateRange(0, this.count * a.itemSize);
                a.needsUpdate = true;
            }
        }
    }
    dispose() { this.geometry.dispose(); this.material.dispose(); }
}
/** Depth-bucketed smoke and emissive segments: near smoke can attenuate far sparks. */
export class ParticleScene {
    private readonly heads: Batch[] = [];
    private readonly trails: Batch[] = [];
    private readonly smoke: Batch[] = [];
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
            const s = new Batch(96, { iPosition: 3, iScale: 2, iRotation: 1, iAlpha: 1, iColor: 3, iFrame: 1, iVariant: 1, iLightDir: 2 }, 10 + bucket * 3, false);
            const a = attribute('iRotation', 'float'), p = positionGeometry.xy.mul(attribute('iScale', 'vec2'));
            const ox = p.x.mul(cos(a)).sub(p.y.mul(sin(a))), oy = p.x.mul(sin(a)).add(p.y.mul(cos(a)));
            s.material.positionNode = attribute('iPosition', 'vec3').add(u.right.mul(ox)).add(u.up.mul(oy));
            const frame = attribute('iFrame', 'float'), variant = attribute('iVariant', 'float');
            const frameA = frame.floor(), frameB = frameA.add(1).min(15);
            const sampleUV = (f: ReturnType<typeof float>) => uv().mul(64 / 68).add(2 / 68).add(vec2(f.mod(4), f.div(4).floor().add(variant.mul(4)))).div(vec2(4, 12));
            const density = mix(texture(atlas, sampleUV(frameA)), texture(atlas, sampleUV(frameB)), frame.fract());
            const normal = density.gb.mul(2).sub(1);
            const shading = dot(normal, attribute('iLightDir', 'vec2')).mul(.45).add(.72).clamp(.22, 1.2);
            s.material.colorNode = vec3(.021, .026, .036).add(attribute('iColor', 'vec3').mul(shading));
            s.material.opacityNode = density.a.mul(attribute('iAlpha', 'float')).mul(soft).mul(protectedMask);
            this.smoke.push(s);
            scene.add(s.mesh);
            const h = new Batch(3088, { iPosition: 3, iScale: 2, iAlpha: 1, iColor: 3 }, 12 + bucket * 3, true);
            h.material.positionNode = attribute('iPosition', 'vec3').add(u.right.mul(positionGeometry.x).mul(attribute('iScale', 'vec2').x)).add(u.up.mul(positionGeometry.y).mul(attribute('iScale', 'vec2').y));
            const radius = uv().sub(.5).length().mul(2);
            const kernel = radius.pow(2).mul(-14).exp().mul(.88).add(radius.pow(2).mul(-3).exp().mul(.075));
            h.material.colorNode = attribute('iColor', 'vec3').mul(u.energy);
            h.material.opacityNode = kernel.mul(attribute('iAlpha', 'float')).mul(protectedMask);
            this.heads.push(h);
            scene.add(h.mesh);
            const t = new Batch(24000, { iA: 3, iB: 3, iWidth: 1, iAlpha: 1, iColor: 3 }, 11 + bucket * 3, true);
            const start = attribute('iA', 'vec3'), end = attribute('iB', 'vec3');
            const middle = mix(start, end, uv().y);
            const tangent = end.sub(start).add(vec3(0, .00001, 0));
            const side = tangent.cross(u.camera.sub(middle)).normalize();
            t.material.positionNode = middle.add(side.mul(positionGeometry.x).mul(attribute('iWidth', 'float')));
            const across = uv().x.sub(.5).mul(2).abs();
            const core = across.pow(2).mul(-18).exp();
            const halo = across.pow(2).mul(-3.5).exp().mul(.075);
            // End caps overlap by sub-pixel extent in the vertex upload; no detached dotted streaks.
            t.material.colorNode = attribute('iColor', 'vec3').mul(u.energy);
            t.material.opacityNode = core.add(halo).mul(attribute('iAlpha', 'float')).mul(protectedMask);
            this.trails.push(t);
            scene.add(t.mesh);
        }
    }
    update(sim: Simulation, camera: THREE.PerspectiveCamera, height: number) {
        const u = this.uniforms;
        u.camera.value.copy(camera.position);
        u.right.value.setFromMatrixColumn(camera.matrixWorld, 0);
        u.up.value.setFromMatrixColumn(camera.matrixWorld, 1);
        u.near.value = camera.near;
        u.far.value = camera.far;
        u.protect.value = sim.protectCenter ? 1 : 0;
        u.safeRect.value.set(...sim.safeRect);
        u.energy.value = sim.reducedFlashes ? .90 : 1.12;
        for (const group of [this.heads, this.trails, this.smoke])
            for (const batch of group)
                batch.count = 0;
        const pixelFactor = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, height);
        const p = sim.heads;
        for (let i = 0; i < p.count; i++) {
            const b = this.heads[bucketFor(p.z[i])], n = b.count++, a = b.attrs, t = p.age[i] / p.life[i];
            const unit = Math.max(.035, (camera.position.z - p.z[i]) * pixelFactor);
            const size = Math.max(p.size[i] * (1 - t * .38), unit * .7) * 5;
            const fade = Math.pow(Math.max(0, 1 - t), .72), red = p.family[i] === 2 ? Math.max(0, (t - .4) * 1.1) : 0;
            a.iPosition.setXYZ(n, p.x[i], p.y[i], p.z[i]);
            a.iScale.setXY(n, size, size);
            a.iAlpha.setX(n, fade * (.84 + hash01(p.id[i], 51) * .16));
            const heat = 2.4 + Math.exp(-p.age[i] * 5) * 1.4;
            a.iColor.setXYZ(n, p.r[i] * heat, p.g[i] * (1 - red) * heat, p.b[i] * (1 - red) * heat);
        }
        // Luminous launch heads and secondary carriers exist independently of the prop meshes.
        const addHead = (x: number, y: number, z: number, size: number, r: number, g: number, blue: number) => {
            const b = this.heads[bucketFor(z)], n = b.count++, a = b.attrs;
            a.iPosition.setXYZ(n, x, y, z);
            a.iScale.setXY(n, size, size * 1.6);
            a.iColor.setXYZ(n, r, g, blue);
            a.iAlpha.setX(n, .88);
        };
        for (const r of sim.rockets)
            if (r.stage === 'ascent')
                addHead(r.x, r.y + 1.7, r.z, r.phase === 'thrust' ? 1.0 : .65, 4.5, 2.5, .8);
        for (const c of sim.cues)
            addHead(c.x, c.y, c.z, .72, 3, 2.1, .9);
        const t = sim.trails;
        for (let i = 0; i < t.count; i++) {
            const z = (t.az[i] + t.bz[i]) * .5, b = this.trails[bucketFor(z)], n = b.count++, a = b.attrs;
            const age = t.age[i] / t.life[i];
            const pixel = Math.max(.026, (camera.position.z - z) * pixelFactor);
            const width = Math.max(t.width[i] * (1 - age * .65), pixel * .28) * 4.2;
            a.iA.setXYZ(n, t.ax[i], t.ay[i], t.az[i]);
            a.iB.setXYZ(n, t.bx[i], t.by[i], t.bz[i]);
            a.iWidth.setX(n, width);
            a.iAlpha.setX(n, Math.pow(1 - age, 1.65) * .86);
            a.iColor.setXYZ(n, t.r[i] * 2.4, t.g[i] * 2.4, t.b[i] * 2.4);
        }
        const smoke = sim.smoke;
        // At most 96 items: exact sorting within each approximate depth bucket is inexpensive.
        const order = Array.from({ length: smoke.count }, (_, i) => i).sort((a, b) => smoke.z[a] - smoke.z[b]);
        for (const i of order) {
            const b = this.smoke[bucketFor(smoke.z[i])], n = b.count++, a = b.attrs;
            let lr = 0, lg = 0, lb = 0, dx = 0, dy = 0;
            for (const light of sim.lights) {
                const lx = light.x - smoke.x[i], ly = light.y - smoke.y[i], lz = light.z - smoke.z[i];
                const d = Math.hypot(lx, ly, lz), falloff = Math.max(0, 1 - d / 39);
                const power = falloff * falloff * Math.exp(-light.age * 1.55) * light.strength * (sim.reducedFlashes ? .70 : 1.0);
                lr += light.r * power;
                lg += light.g * power;
                lb += light.b * power;
                dx += lx / Math.max(1, d) * power;
                dy += ly / Math.max(1, d) * power;
            }
            const age = smoke.age[i] / smoke.life[i];
            a.iPosition.setXYZ(n, smoke.x[i], smoke.y[i], smoke.z[i]);
            a.iScale.setXY(n, smoke.size[i] * 2.8, smoke.size[i] * 2.1);
            a.iRotation.setX(n, smoke.angle[i]);
            a.iAlpha.setX(n, Math.min(1, smoke.age[i] * 1.8) * Math.pow(1 - age, 1.4) * smoke.gravity[i] * .65);
            a.iColor.setXYZ(n, Math.min(1.2, lr), Math.min(1.2, lg), Math.min(1.2, lb));
            a.iLightDir.setXY(n, dx, dy);
            a.iFrame.setX(n, Math.min(14.98, (1 - Math.exp(-smoke.age[i] * .22)) * 15));
            a.iVariant.setX(n, smoke.id[i] % 3);
        }
        for (const group of [this.heads, this.trails, this.smoke])
            for (const batch of group)
                batch.upload();
    }
    dispose() { for (const group of [this.heads, this.trails, this.smoke])
        for (const b of group)
            b.dispose(); }
}
