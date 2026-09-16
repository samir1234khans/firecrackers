import * as THREE from 'three/webgpu';
import { color, mix, smoothstep, uniform, uv } from 'three/tsl';
import { FAMILIES } from '../engine/catalog';
/** Shared materials/geometry; five authored silhouettes, with a real arc-length fuse. */
export class RocketProp {
    readonly group = new THREE.Group();
    readonly burn = uniform(-0.01);
    readonly ember = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb24a }));
    readonly flame = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffdc9e, transparent: true, opacity: .85 }));
    readonly lamp = new THREE.PointLight(0xffb45d, 0, 10, 2);
    private readonly paper: THREE.MeshStandardMaterial;
    private readonly capMaterial: THREE.MeshStandardMaterial;
    private readonly body: THREE.Mesh;
    private readonly cap: THREE.Mesh;
    private readonly stripes: THREE.Group;
    private readonly curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.05, .85, .14), new THREE.Vector3(1.78, 1.22, .12),
        new THREE.Vector3(1.08, 1.10, .1), new THREE.Vector3(.52, 1.7, 0),
    ]);
    private lastFamily = -1;
    constructor(paperTexture: THREE.Texture) {
        this.paper = new THREE.MeshStandardMaterial({ map: paperTexture, color: 0xeac17a, roughness: .89, metalness: 0 });
        this.capMaterial = new THREE.MeshStandardMaterial({ map: paperTexture, color: 0x806544, roughness: .81, metalness: .04 });
        this.body = new THREE.Mesh(new THREE.CylinderGeometry(.50, .51, 3.25, 24, 1), this.paper);
        this.body.position.y = 3.25;
        this.cap = new THREE.Mesh(new THREE.ConeGeometry(.61, 1.22, 24), this.capMaterial);
        this.cap.position.y = 5.48;
        const wood = new THREE.Mesh(new THREE.BoxGeometry(.115, 6.0, .115), new THREE.MeshStandardMaterial({ color: 0x795537, roughness: 1 }));
        wood.position.set(-.29, .28, -.07);
        const bottom = new THREE.Mesh(new THREE.CylinderGeometry(.51, .50, .11, 24), new THREE.MeshStandardMaterial({ color: 0x3b3024, roughness: 1 }));
        bottom.position.y = 1.57;
        this.stripes = new THREE.Group();
        const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x786549, roughness: .66, metalness: .12 });
        for (const y of [1.88, 4.55]) {
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
    }
    update(family: number, burnProgress: number, contact: number, time: number, wind: number) {
        if (family !== this.lastFamily) {
            this.lastFamily = family;
            this.paper.color.set(FAMILIES[family].color);
            this.capMaterial.color.set(FAMILIES[family].color).multiplyScalar(.64);
            const radii = [1, .92, 1.08, .86, 1.16], heights = [1, 1.06, .96, 1.13, 1.12];
            this.body.scale.set(radii[family], heights[family], radii[family]);
            this.cap.scale.set(radii[family], family === 4 ? 1.16 : 1, radii[family]);
            this.cap.position.y = 3.25 + 1.625 * heights[family] + .58;
            this.stripes.scale.x = this.stripes.scale.z = radii[family];
        }
        this.burn.value = burnProgress;
        const glowing = (burnProgress >= 0 && burnProgress < 1) || contact > 0;
        const point = this.curve.getPointAt(Math.max(0, Math.min(1, burnProgress)));
        this.ember.position.copy(point);
        this.ember.visible = glowing;
        this.flame.position.copy(point).add(new THREE.Vector3(wind * .1, .18, 0));
        this.flame.visible = glowing;
        this.flame.scale.set(.60, .95 + Math.sin(time * 12) * .08, .30);
        this.flame.rotation.z = -wind * .10;
        this.lamp.position.copy(point).add(new THREE.Vector3(0, .2, .9));
        this.lamp.intensity = glowing ? (burnProgress >= 0 ? 3.0 : contact * 2.4) : 0;
        this.paper.emissive.set(0x281403);
        this.paper.emissiveIntensity = glowing ? .11 : 0;
    }
}
