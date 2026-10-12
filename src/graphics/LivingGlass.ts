import * as THREE from 'three/webgpu';
import { Fn, If, float, mix, refract, screenUV, smoothstep, uniform, vec2, vec3 } from 'three/tsl';
import type { ShaderNodeObject } from 'three/tsl';
import { boundGlassSurfaces, GLASS_LIMITS } from './GlassMath';
import type { GlassSurface } from './GlassMath';

/** One bounded optical compositor over the existing scene and bloom targets.
 * No extra world renderer, CPU pixels, render-target copies or colour conversion.
 * Five static uniform slots are deliberately avoided: four compound surfaces
 * share one graph, with optional scatter taps controlled independently of Ultra. */
export class LivingGlass {
  private readonly viewport = uniform(new THREE.Vector2(1, 1));
  private readonly enabled = uniform(0);
  // The five-tap tier remains available, but the measured local WebGPU p95
  // budget selects three taps without reducing water or firework quality.
  private readonly scatter = uniform(3);
  private readonly rects = Array.from({ length: GLASS_LIMITS.surfaces }, () => uniform(new THREE.Vector4()));
  private readonly radii = Array.from({ length: GLASS_LIMITS.surfaces }, () => uniform(0));
  private readonly active = Array.from({ length: GLASS_LIMITS.surfaces }, () => uniform(0));
  private surfaces: readonly GlassSurface[] = [];
  private allowed = true;
  private suspended = false;
  private debugOff = false;
  readonly output: ShaderNodeObject<THREE.Node>;

  constructor(source: ShaderNodeObject<THREE.TextureNode>, bloomTexture: ShaderNodeObject<THREE.TextureNode>, base: ShaderNodeObject<THREE.Node>, diagnosticOff = false) {
    this.debugOff = diagnosticOff;
    this.output = Fn(() => {
      const colour = base.toVar();
      If(this.enabled.greaterThan(.5), () => {
        const pixel = screenUV.mul(this.viewport);
        for (let i = 0; i < GLASS_LIMITS.surfaces; i++) {
          const rect = this.rects[i], radius = this.radii[i];
          const half = rect.zw.mul(.5), local = pixel.sub(rect.xy.add(half));
          const q = local.abs().sub(half.sub(radius));
          const corner = q.max(0), cornerLength = corner.length();
          const distance = cornerLength.add(q.x.max(q.y).min(0)).sub(radius);
          If(this.active[i].greaterThan(.5).and(distance.lessThan(3)), () => {
            const gradient = vec2(q.x.greaterThan(q.y).select(1, 0), q.y.greaterThanEqual(q.x).select(1, 0))
              .mix(corner.div(cornerLength.max(.0001)), cornerLength.greaterThan(.0001).select(1, 0)).mul(local.sign());
            const inward = distance.negate().max(0);
            // Convex thickness h=24(1-exp(-inward/4)); its exact gradient gives
            // the normal. A near-flat label centre keeps distortion under 1 px.
            const derivative = inward.div(-4).exp().mul(6);
            const normal = vec3(gradient.mul(derivative), 1).normalize();
            const ray = refract(vec3(0, 0, -1), normal, float(1 / GLASS_LIMITS.ior));
            const rawShift = ray.xy.div(ray.z.abs().max(.1)).mul(float(24).mul(inward.div(-4).exp().oneMinus()));
            const shift = rawShift.mul(float(GLASS_LIMITS.edgePixels).div(rawShift.length().max(GLASS_LIMITS.edgePixels)));
            const refractedUV = screenUV.add(shift.div(this.viewport)).clamp(.001, .999);
            const sample = (uv: ShaderNodeObject<THREE.Node>) => source.sample(uv).rgb.add(bloomTexture.sample(uv).rgb);
            const lens = sample(refractedUV).toVar();
            const spread = inward.div(-8).exp().mul(.8).add(.2).div(this.viewport);
            If(this.scatter.greaterThan(1), () => {
              lens.assign(lens.add(sample(refractedUV.add(vec2(spread.x, 0)))).add(sample(refractedUV.sub(vec2(spread.x, 0)))).div(3));
              If(this.scatter.greaterThan(3), () => {
                lens.assign(lens.mul(3).add(sample(refractedUV.add(vec2(0, spread.y)))).add(sample(refractedUV.sub(vec2(0, spread.y)))).div(5));
              });
            });
            const f0 = ((GLASS_LIMITS.ior - 1) / (GLASS_LIMITS.ior + 1)) ** 2;
            const fresnel = normal.z.oneMinus().pow(5).mul(1 - f0).add(f0);
            const rim = distance.abs().mul(-1.8).exp();
            const top = gradient.y.negate().mul(.5).add(.5);
            const material = mix(lens, vec3(.008, .013, .023), .10).add(vec3(.32, .37, .42).mul(fresnel.mul(.10)))
              .add(vec3(.46, .36, .20).mul(rim).mul(top.mul(.065).add(.012)));
            const shadow = distance.max(0).div(-1.3).exp().mul(distance.greaterThan(0).select(.12, 0));
            const coverage = smoothstep(-.7, .7, distance).oneMinus();
            colour.assign(mix(colour.mul(shadow.oneMinus()), material, coverage));
          });
        }
      });
      return colour;
    })();
  }

  setViewport(width: number, height: number) {
    this.viewport.value.set(Math.max(1, width), Math.max(1, height));
    this.setSurfaces(this.surfaces, this.allowed);
  }
  setSurfaces(surfaces: readonly GlassSurface[], allowed = true) {
    const bounded = boundGlassSurfaces(surfaces, this.viewport.value.x, this.viewport.value.y);
    const changed = allowed !== this.allowed || bounded.length !== this.surfaces.length || bounded.some((rect, i) => {
      const old = this.surfaces[i]; return !old || rect.x !== old.x || rect.y !== old.y || rect.width !== old.width || rect.height !== old.height || rect.radius !== old.radius;
    });
    if (!changed) return false;
    this.surfaces = bounded;
    this.allowed = allowed;
    for (let i = 0; i < GLASS_LIMITS.surfaces; i++) {
      const rect = this.surfaces[i]; this.active[i].value = rect ? 1 : 0;
      this.rects[i].value.set(rect?.x ?? 0, rect?.y ?? 0, rect?.width ?? 0, rect?.height ?? 0);
      this.radii[i].value = rect?.radius ?? 0;
    }
    this.refresh();
    return true;
  }
  setEnabled(value: boolean) { this.suspended = !value; this.refresh(); }
  setDiagnosticOff(value: boolean) { this.debugOff = value; this.refresh(); }
  setScatterTaps(taps: 1 | 3 | 5) { this.scatter.value = taps; }
  private refresh() { this.enabled.value = this.allowed && !this.suspended && !this.debugOff && this.surfaces.length > 0 ? 1 : 0; }
  diagnostics() { return { glassTier: this.enabled.value ? `live-refraction-${this.scatter.value}` : this.debugOff ? 'diagnostic-off' : 'off',
    glassSurfaceCount: this.enabled.value ? this.surfaces.length : 0, glassRegisteredSurfaces: this.surfaces.length,
    glassIOR: GLASS_LIMITS.ior, glassMaximumDisplacementPixels: GLASS_LIMITS.edgePixels, glassMaximumSurfaces: GLASS_LIMITS.surfaces,
    glassScatterTaps: this.scatter.value, glassColourConversions: 1, glassCPUReadbacks: 0 };
  }
}
