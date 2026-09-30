import * as THREE from 'three/webgpu';
import { color, mix, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import { FAMILIES, ROCKET_PROFILES } from '../engine/catalog';
import { FUSE_POINTS, fusePointAt } from '../engine/FusePath';
/** Shared materials/geometry; ten authored silhouettes, with a real arc-length fuse. */
export class RocketProp {
    readonly group = new THREE.Group();
    private readonly flameFrame = uniform(0);
    readonly burn = uniform(-0.01);
    readonly ember = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb24a }));
    readonly flame: THREE.Mesh = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffdc9e, transparent: true, opacity: .85 }));
    readonly lamp = new THREE.PointLight(0xffb45d, 0, 10, 2);
    private readonly paper: THREE.MeshStandardMaterial;
    private readonly capMaterial: THREE.MeshStandardMaterial;
    private readonly body: THREE.Mesh;
    private readonly cap: THREE.Mesh;
    private readonly stripes: THREE.Group;
    private readonly curve = new THREE.CubicBezierCurve3(...FUSE_POINTS.map(p => new THREE.Vector3(...p)) as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]);
    private lastFamily = -1;
    private readonly solids: THREE.Material[] = [];
    constructor(paperTexture: THREE.Texture) {
        this.paper = new THREE.MeshStandardMaterial({ map: paperTexture, bumpMap: paperTexture, bumpScale: .012, color: 0xffffff, roughness: .78, metalness: .02 });
        this.capMaterial = new THREE.MeshStandardMaterial({ color: 0xb19a74, roughness: .29, metalness: .62 });
        this.body = new THREE.Mesh(new THREE.CylinderGeometry(.50, .51, 3.25, 48, 1), this.paper);
        this.body.position.y = 3.25;
        this.cap = new THREE.Mesh(new THREE.ConeGeometry(.61, 1.22, 48), this.capMaterial);
        this.cap.position.y = 5.48;
        const wood = new THREE.Mesh(new THREE.BoxGeometry(.115, 6.0, .115), new THREE.MeshStandardMaterial({ color: 0x795537, roughness: 1 }));
        wood.position.set(-.29, .28, -.07);
        const bottom = new THREE.Mesh(new THREE.CylinderGeometry(.51, .50, .11, 24), new THREE.MeshStandardMaterial({ color: 0x3b3024, roughness: 1 }));
        bottom.position.y = 1.57;
        this.stripes = new THREE.Group();
        const bandMaterial = new THREE.MeshStandardMaterial({ color: 0xc39a62, roughness: .26, metalness: .62 });
        for (const y of [1.88, 2.03, 4.40, 4.55]) {
            const band = new THREE.Mesh(new THREE.CylinderGeometry(.512, .512, .14, 24), bandMaterial);
            band.position.y = y;
            this.stripes.add(band);
        }
        const fuseMaterial = new THREE.MeshBasicNodeMaterial();
        fuseMaterial.colorNode = mix(color('#2b251e'), color('#a19676'), smoothstep(this.burn, this.burn.add(.02), uv().x));
        const fuse = new THREE.Mesh(new THREE.TubeGeometry(this.curve, 32, .044, 6, false), fuseMaterial);
        this.group.add(this.body, this.cap, wood, bottom, this.stripes, fuse, this.ember, this.flame, this.lamp);
        this.ember.visible = false;
        this.flame.visible = false;
        // Set the blending mode once, not on each frame. The detailed shell fades into
        // its emissive point as it recedes; the physical world position never jumps.
        this.group.traverse(object => {
            if (!(object instanceof THREE.Mesh) || object === this.ember || object === this.flame) return;
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                if (this.solids.includes(material)) continue;
                material.transparent = true;
                material.depthWrite = false;
                this.solids.push(material);
            }
        });
    }
    setFlameTexture(atlas: THREE.Texture) {
        const f = this.flameFrame;
        const sample = texture(atlas, uv().mul(.94).add(.03).add(vec2(f.mod(4), f.div(4).floor())).div(4));
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
        material.colorNode = sample.rgb; material.opacityNode = sample.a;
        this.flame.geometry.dispose(); (this.flame.material as THREE.Material).dispose();
        this.flame.geometry = new THREE.PlaneGeometry(.72, 1.25); this.flame.material = material;
    }
    setAuthoredGeometry(template: THREE.Group) {
        template.updateMatrixWorld(true);
        for (const [name, target, y] of [['Paper_shell', this.body, 3.25], ['Foil_cap', this.cap, 5.48]] as const) {
            const mesh = template.getObjectByName(name) ?? template.getObjectByName(name.replaceAll('_', ' '));
            if (!(mesh instanceof THREE.Mesh)) continue;
            const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
            geometry.translate(0, -y, 0); target.geometry.dispose(); target.geometry = geometry;
        }
    }
    update(family: number, burnProgress: number, contact: number, time: number, wind: number, bodyOpacity = 1) {
        for (const material of this.solids) material.opacity = bodyOpacity;
        if (family !== this.lastFamily) {
            this.lastFamily = family;
            this.paper.color.set('#e6edf5');
            this.capMaterial.color.set(FAMILIES[family].color).multiplyScalar(.76);
            const [radius, height] = ROCKET_PROFILES[family] ?? ROCKET_PROFILES[0];
            this.body.scale.set(radius, height, radius);
            this.cap.scale.set(radius, family === 4 ? 1.16 : 1, radius);
            this.cap.position.y = 3.25 + 1.625 * height + .58;
            this.stripes.scale.x = this.stripes.scale.z = radius;
        }
        this.burn.value = burnProgress;
        this.flameFrame.value = Math.floor(time * 8) % 16;
        const glowing = (burnProgress >= 0 && burnProgress < 1) || contact > 0;
        const point = new THREE.Vector3(...fusePointAt(burnProgress));
        this.ember.position.copy(point);
        this.ember.visible = glowing;
        this.flame.position.copy(point).add(new THREE.Vector3(wind * .1, .18, 0));
        this.flame.visible = glowing;
        this.flame.scale.set(.60, .95 + Math.sin(time * 12) * .08, .30);
        this.flame.rotation.z = -wind * .10;
        this.lamp.position.copy(point).add(new THREE.Vector3(0, .2, .9));
        this.lamp.intensity = glowing ? (burnProgress >= 0 ? 6.0 : contact * 4.4) : 0;
        this.paper.emissive.set(0x281403);
        this.paper.emissiveIntensity = glowing ? .11 : 0;
    }
}

