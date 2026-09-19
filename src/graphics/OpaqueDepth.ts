import * as THREE from 'three/webgpu';

/** Shared geometry, independent scene/camera render lists, depth-only shading.
 * This pass owns proxies and one material, never the source geometry or instance buffers.
 */
export class OpaqueDepth {
    readonly scene = new THREE.Scene();
    private readonly material = new THREE.MeshBasicMaterial({
        colorWrite: false, depthWrite: true, depthTest: true,
        side: THREE.DoubleSide, fog: false,
    });
    private readonly proxies = new Map<THREE.Mesh, THREE.Mesh>();

    constructor(private readonly source: THREE.Scene) {
        source.traverse(object => {
            if (!(object instanceof THREE.Mesh) || !object.layers.isEnabled(0)) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            if (materials.some(material => material.transparent || !material.depthWrite)) return;
            let proxy: THREE.Mesh;
            if (object instanceof THREE.InstancedMesh) {
                const instances = new THREE.InstancedMesh(object.geometry, this.material, object.count);
                instances.instanceMatrix = object.instanceMatrix;
                proxy = instances;
            } else {
                proxy = new THREE.Mesh(object.geometry, this.material);
            }
            proxy.matrixAutoUpdate = false;
            proxy.frustumCulled = false;
            this.proxies.set(object, proxy);
            this.scene.add(proxy);
        });
    }

    update(): void {
        this.source.updateMatrixWorld(true);
        for (const proxy of this.proxies.values()) proxy.visible = false;
        this.source.traverseVisible(object => {
            if (!(object instanceof THREE.Mesh)) return;
            const proxy = this.proxies.get(object);
            if (!proxy) return;
            proxy.visible = true;
            proxy.matrix.copy(object.matrixWorld);
            proxy.matrixWorldNeedsUpdate = true;
            if (proxy instanceof THREE.InstancedMesh && object instanceof THREE.InstancedMesh) {
                proxy.count = object.count;
            }
        });
    }

    dispose(): void {
        this.scene.clear();
        this.proxies.clear();
        this.material.dispose();
    }
}
