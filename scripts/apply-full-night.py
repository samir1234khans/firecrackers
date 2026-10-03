"""One-shot, guarded source edit for issues 34/35. No deployment or branch operations."""
from pathlib import Path
import json
import re

pending = {}
def source(path):
    if path not in pending:
        pending[path] = Path(path).read_text()
    return pending[path]
def replace(path, old, new, count=1):
    text = source(path)
    found = text.count(old)
    if found != count:
        raise RuntimeError(f'{path}: expected {count} occurrences, found {found}: {old[:120]!r}')
    pending[path] = text.replace(old, new)
def regex(path, pattern, new, count=1):
    text, found = re.subn(pattern, new, source(path), flags=re.S)
    if found != count:
        raise RuntimeError(f'{path}: pattern matched {found}, expected {count}: {pattern[:100]}')
    pending[path] = text

pending['src/engine/BurstLighting.ts'] = '''/** Bounded virtual-scene illumination. Never changes simulation RNG or exposure. */
export const BURST_LIGHT_CAPACITY = 12;
export const BURST_LIGHT_LIFETIME = 4.5;
export type BurstSource = { x: number; y: number; z: number; age: number; r: number; g: number; b: number; strength: number };

/** A short attack and a long coloured tail avoid an instantaneous full-scene flash. */
export function burstLightEnergy(light: BurstSource, reducedFlashes = false): number {
    if (!Number.isFinite(light.age) || !Number.isFinite(light.strength) || light.age < 0 || light.age >= BURST_LIGHT_LIFETIME) return 0;
    const age = light.age;
    const attack = reducedFlashes ? .08 + .92 * (1 - Math.exp(-age * 6)) : .14 + .86 * (1 - Math.exp(-age * 12));
    const release = Math.min(1, (BURST_LIGHT_LIFETIME - age) / .8);
    return Math.max(0, Math.min(1.6, light.strength)) * attack * Math.exp(-age * .72) * release * (reducedFlashes ? .65 : 1);
}

/** RGB sum, energy-weighted world centre, and energy in a caller-owned seven-value buffer. */
export function gatherBurstLighting(lights: readonly BurstSource[], out: Float32Array, reducedFlashes = false): void {
    out.fill(0);
    for (let i = 0; i < Math.min(BURST_LIGHT_CAPACITY, lights.length); i++) {
        const light = lights[i], energy = burstLightEnergy(light, reducedFlashes);
        if (!energy || ![light.x, light.y, light.z, light.r, light.g, light.b].every(Number.isFinite)) continue;
        out[0] += Math.max(0, light.r) * energy;
        out[1] += Math.max(0, light.g) * energy;
        out[2] += Math.max(0, light.b) * energy;
        out[3] += light.x * energy; out[4] += light.y * energy; out[5] += light.z * energy; out[6] += energy;
    }
    if (out[6] > 0) { out[3] /= out[6]; out[4] /= out[6]; out[5] /= out[6]; }
}

/** One common gain preserves hue, unlike clipping R/G/B independently. */
export function limitBurstRadiance(rgb: Float32Array, ceiling: number): void {
    const peak = Math.max(rgb[0], rgb[1], rgb[2], 0);
    const gain = Number.isFinite(ceiling) && ceiling > 0 ? 1 / (1 + peak / ceiling) : 0;
    rgb[0] *= gain; rgb[1] *= gain; rgb[2] *= gain;
}
'''

p = 'src/engine/catalog.ts'
replace(p, "'2026-10-02.3'", "'2026-10-03.1'")
replace(p, 'count: 248, speed: 24, life: 2.7, drag: 0.66, gravity: 2.8, trail: 0.14', 'count: 248, speed: 30, life: 4.8, drag: 0.50, gravity: 2.8, trail: 0.65')
replace(p, 'count: 32, speed: 19, life: 3.2, drag: 0.38, gravity: 3.0, trail: 0.9', 'count: 64, speed: 23, life: 4.2, drag: 0.38, gravity: 3.0, trail: 1.25')
replace(p, 'family === 4 ? 900 : family === 3 ? 160', 'family === 4 ? 1800 : family === 3 ? 320')

p = 'src/engine/LaunchProfile.ts'
# Preserve the signature composition solver and all its callers.
replace(p, 'effectScale?: number;', 'effectScale?: number;\n  /** Maximum world-space travel of the smaller finale carriers. */\n  finaleSpread?: number;')
regex(p, r'const radius = \(index >= 10 \? 90 \* effectScale : 55\) \* scale;', "const radius = index === 4 ? scene.width * .48 : (index >= 10 ? 90 * effectScale : index === 1 ? 75 * effectScale : index === 3 ? 60 * effectScale : 55) * scale;")
# Add a sky-bottom argument without changing existing signature behaviour.
regex(p, r'prop\?: LaunchPropComposition\)\s*:\s*LaunchProfile', 'prop?: LaunchPropComposition, skyBottom?: number): LaunchProfile')
anchor = 'const extent = UPPER_EXTENT[index] * scale * effectScale;'
if anchor not in source(p):
    anchor = 'const extent = (UPPER_EXTENT[index] ?? 38) * scale * effectScale;'
# New finale uses the visible waterline, not 37% of an abstract scene rectangle.
replace(p, anchor, '''if (index === 4) {
    const phone = layout.viewport.width / layout.viewport.height < .72;
    const shore = skyBottom ?? Math.min(phone ? .72 : .5, (scene.y + scene.height - 40) / layout.viewport.height) * layout.viewport.height;
    const skyHeight = Math.max(24, Math.min(scene.y + scene.height, shore) - scene.y - 10);
    const centerY = scene.y + skyHeight * .40;
    const fitted = Math.max(.025, Math.min(1.6, (scene.width * .43 - 12) / (88 * scale * 1.2),
      (skyHeight * .40 - 10) / (65 * scale * 1.2), (skyHeight * .60 - 10) / (112 * scale * 1.2)));
    const attachment = prop?.shellOffset ?? SHELL_LOCAL_Y * ROCKET_SCALE[1];
    return { apex: worldHeightAt(centerY) - attachment,
      apexMin: worldHeightAt(centerY + skyHeight * .012) - attachment,
      apexMax: worldHeightAt(centerY - skyHeight * .012) - attachment,
      centerFraction: (centerY - scene.y) / scene.height, effectScale: fitted,
      finaleSpread: Math.max(0, (scene.width * .43 - 12) / (scale * 1.2) - 60 * fitted),
      ...(prop ? { prop, ground: prop.originY } : {}) };
  }
  const extent = UPPER_EXTENT[index] * scale * effectScale;''')
# Fit longer Peony and Crossette to narrow screens without thinning their recipes.
regex(p, r'const effectScale = index >= 10 \? signatureCompositionScale\((.*?)\) : 1;', r'const effectScale = index >= 10 ? signatureCompositionScale(\1) : index === 1 || index === 3 ? Math.max(.025, Math.min(1, (scene.width * .43 - 12) / ((index === 1 ? 75 : 60) * scale * 1.2))) : 1;')
regex(p, r'\.\.\.\(index >= 10 \? \{ effectScale \} : \{\}\)', '...(index >= 10 || index === 1 || index === 3 ? { effectScale } : {})')

p = 'src/engine/Simulation.ts'
pending[p] = "import { BURST_LIGHT_CAPACITY, BURST_LIGHT_LIFETIME } from './BurstLighting.js';\n" + source(p)
replace(p, 'if (this.lights[i].age > 4.5)', 'if (this.lights[i].age >= BURST_LIGHT_LIFETIME)')
replace(p, 'this.lights.length < 12', 'this.lights.length < BURST_LIGHT_CAPACITY', count=2)
replace(p, 'if (family >= 10) rocket.launchProfile =', 'if (family === 4 || family >= 10) rocket.launchProfile =')
replace(p, 'centerFraction: .34 }), effectScale });', 'centerFraction: .34 }), effectScale, ...(family === 4 ? { finaleSpread: 0 } : {}) });')
start = source(p).index('        const rand = randomStream(r.seed);', source(p).index('    private primary('))
end = source(p).index('\n    private burst(', start)
pending[p] = source(p)[:start] + '''        const rand = randomStream(r.seed);
        const composition = r.launchProfile?.effectScale ?? 1;
        // A real full shell opens first; every later break comes from a moving carrier.
        this.burst(1, x, y, z, composition * 1.12, r.seed);
        const groups = this.reducedFlashes ?
            [{ f: 1, t: 1.15 }, { f: 2, t: 2.00 }, { f: 1, t: 2.85 }, { f: 3, t: 3.70 }, { f: 0, t: 4.55 }] :
            [{ f: 1, t: .85 }, { f: 2, t: 1.45 }, { f: 1, t: 2.05 }, { f: 3, t: 2.70 }, { f: 0, t: 3.50 }];
        const spread = r.launchProfile?.finaleSpread ?? 34 * composition;
        const lanes = [-.82, .82, -.40, .42, 0];
        for (let j = 0; j < groups.length; j++) {
            const g = groups[j];
            const drift = 5 + rand() * 5;
            this.cues.push({ id: this.nextObjectId++, at: this.time + g.t, family: g.f, x, y, z,
                vx: lanes[j] * spread / g.t + (j === 4 ? 0 : (j % 2 ? 1 : -1) * drift * composition * .1),
                vy: (2 + rand() * 5) * composition, vz: (rand() - .5) * 8 * composition,
                gravity: 3.2 * composition, scale: (j === 4 ? .75 : .62) * composition,
                seed: Math.floor(rand() * 0xffffffff), reserve: familyReservation(g.f) });
        }
    }''' + source(p)[end:]
replace(p, 'Math.round(f.count * BUDGETS[this.quality].scale * (scale < 1 ? 0.58 : 1))', 'Math.round(f.count * BUDGETS[this.quality].scale)')
replace(p, 'const speed = f.speed * scale * (0.74 + rand() * 0.48);', 'const speed = f.speed * scale * (0.74 + rand() * 0.48) * (family === 1 && i % 7 === 0 ? .48 : 1);')
replace(p, 'family === 1 ? 0.13 : 0.105, f.drag, f.gravity, f.trail', 'family === 1 ? .19 : .155, f.drag, f.gravity * scale, f.trail')
replace(p, "this.emit('burst', x, y, z, family, scale);", "this.emit('burst', x, y, z, family, Math.min(1, scale));")
replace(p, 'b: lightB / n, strength: scale', 'b: lightB / n, strength: Math.max(.65, Math.min(1, scale))')
replace(p, 'const family = p.family[i], count = splitChildCount(family);', 'const family = p.family[i], count = splitChildCount(family);\n        const splitScale = family === 3 ? clamp(length / 20, .20, 1.20) : 1;\n        const kick = family === 3 ? 13 * splitScale : 8;')
replace(p, 'c = Math.cos(a) * 8, s = Math.sin(a) * 8;', 'c = Math.cos(a) * kick, s = Math.sin(a) * kick;')
replace(p, '1.8 + hash01(id, k) * 0.6, tone[0], tone[1], tone[2], family === 8 ? .11 : .085, .65, 3.1, .95, 0, family);', "(family === 3 ? 2.7 : 1.8) + hash01(id, k) * 0.6, tone[0], tone[1], tone[2], family === 8 ? .11 : .145, .65, 3.1 * splitScale, family === 3 ? 1.4 : .95, 0, family);")

p = 'src/graphics/ParticleScene.ts'
replace(p, 'const kernel = radius.pow(2).mul(-17).exp().mul(.94).add(radius.pow(2).mul(-3.2).exp().mul(.075));', 'const kernel = radius.pow(2).mul(-17).exp().mul(.94).add(radius.pow(2).mul(-3.2).exp().mul(.24))\n                .mul(float(1).sub(smoothstep(.72, 1, radius)));')
replace(p, 'unit * .9) * 5;', 'unit * 1.05) * 7.5;')
replace(p, 'const halo = across.pow(2).mul(-2.8).exp().mul(.08);', 'const halo = across.pow(2).mul(-2.8).exp().mul(.15);')

p = 'src/graphics/WaterReflection.ts'
pending[p] = "import { BURST_LIGHT_CAPACITY, burstLightEnergy } from '../engine/BurstLighting.js';\n" + source(p)
regex(p, r'const BURST_LIGHT_CAPACITY = 4;\n', '')
replace(p, 'delta.z.abs().mul(.22).add(delta.y.abs().mul(.75)).add(12)', 'delta.z.abs().mul(.50).add(delta.y.abs().mul(.95)).add(55)')
replace(p, 'distanceSquared.div(18000)', 'distanceSquared.div(110000)') if 'distanceSquared.div(18000)' in source(p) else replace(p, 'distSq.div(18000)', 'distSq.div(110000)')
# Replace the per-channel ~0.06/0.11 clamp with a hue-preserving radiance shoulder.
regex(p, r'return result\.mul\(this\.strength\)\.mul\(\.65\)\.clamp\(0, this\.strength\.mul\(\.18\)\);', '''const radiance = result.mul(3.2);
      const peak = radiance.r.max(radiance.g).max(radiance.b);
      return radiance.div(float(1).add(peak.div(this.strength.mul(1.25))));''')
replace(p, "if (quality === 'low') return 0;", "if (quality === 'low') return 6;")
replace(p, "    if (quality === 'low') { this.releaseTarget(); return; }\n", '')
replace(p, "const cap = quality === 'ultra' ? aspect < .72 ? 384 : 512 : 256;", "const cap = quality === 'low' ? 128 : quality === 'ultra' ? aspect < .72 ? 384 : 512 : 256;")
replace(p, 'Keep the four strongest current sources', 'Keep every live source within the fixed twelve-light simulation budget')
replace(p, 'Math.exp(-light.age * 1.55) * light.strength', 'burstLightEnergy(light, sim.reducedFlashes)')
regex(p, r'    if \(visible && sim\.quality === \'low\'\) for \(const light of sim\.lights\).*?    this\.streaks\.instanceMatrix\.needsUpdate = true;', '    this.streaks.instanceMatrix.needsUpdate = true;')
replace(p, "    if (sim.quality === 'low') { this.releaseTarget(); return; }\n", '')
# These belonged only to the old fake Low reflection strips.
regex(p, r'^  private readonly (?:matrix|tint) = new THREE\.(?:Matrix4|Color)\([^\n]*\);\n', '', count=2) if False else None
# Remove only declarations now unused by the removed strip loop.
for field in ('matrix', 'tint'):
    pattern = r'  private readonly ' + field + r' = new THREE\.[^\n]+\n'
    if len(re.findall(r'this\.' + field + r'\b', source(p))) == 0:
        regex(p, pattern, '')

p = 'src/graphics/RiverLife.ts'
replace(p, "this.reflectionProxies.visible = visible && sim.quality !== 'low';", 'this.reflectionProxies.visible = visible;')
replace(p, "if (sim.quality !== 'low') this.updateReflectionProxies();", 'this.updateReflectionProxies();')

p = 'src/engine/Renderer.ts'
pending[p] = "import { gatherBurstLighting } from './BurstLighting.js';\n" + source(p)
replace(p, 'private readonly blastLight = new THREE.PointLight(0xffcc88, 0, 160, 2);', '''// One permanently registered broad light preserves material variants and lights
    // the textured near boat and far shore instead of dying at a 160-unit cutoff.
    private readonly blastLight = new THREE.DirectionalLight(0xffcc88, 0);
    private readonly burstWash = new Float32Array(7);''')
a = source(p).index('        const light = sim.lights[sim.lights.length - 1];')
b = source(p).index('        this.water.setFrame(', a)
pending[p] = source(p)[:a] + '''        gatherBurstLighting(sim.lights, this.burstWash, sim.reducedFlashes);
        const energy = this.burstWash[6];
        if (energy > .0001) {
            this.blastLight.position.set(this.burstWash[3], Math.max(30, this.burstWash[4]), this.burstWash[5]);
            this.blastLight.color.setRGB(this.burstWash[0] / energy, this.burstWash[1] / energy, this.burstWash[2] / energy);
            this.blastLight.intensity = 6 * energy / (1 + energy);
            parent?.style.setProperty('--blast', `${Math.round(this.burstWash[0] / energy * 230)} ${Math.round(this.burstWash[1] / energy * 230)} ${Math.round(this.burstWash[2] / energy * 230)} / ${Math.min(.16, energy * .12)}`);
        } else {
            this.blastLight.intensity = 0;
            parent?.style.setProperty('--blast', '234 193 122 / 0');
        }
''' + source(p)[b:]

p = 'src/graphics/NightEnvironment.ts'
pending[p] = "import { burstLightEnergy } from '../engine/BurstLighting.js';\n" + source(p)
replace(p, 'Math.exp(-light.age * 1.7) * light.strength', 'burstLightEnergy(light, sim.reducedFlashes)')
replace(p, 'Math.min(.18, energy * (sim.reducedFlashes ? .08 : .12))', '.32 * energy / (1 + energy)')
replace(p, '.006 + r * .012, .010 + g * .012, .016 + b * .012', '.006 + r * .045 / (1 + energy), .010 + g * .045 / (1 + energy), .016 + b * .045 / (1 + energy)')

p = 'src/graphics/CompatibilityRenderer.ts'
pending[p] = "import { BURST_LIGHT_CAPACITY, burstLightEnergy, gatherBurstLighting, limitBurstRadiance } from '../engine/BurstLighting.js';\n" + source(p)
replace(p, 'private readonly glows = new Map<string, HTMLCanvasElement>();', '''private readonly glows = new Map<string, HTMLCanvasElement>();
    private readonly burstWash = new Float32Array(7);
    private readonly tintMask = document.createElement('canvas');
    private readonly tintContext = this.tintMask.getContext('2d')!;
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
    }''')
replace(p, 'this.ctx = ctx;', 'this.ctx = ctx;\n        this.tintMask.width = 1024; this.tintMask.height = 128;')
replace(p, 'scene.x+scene.width/2,prop);', 'scene.x+scene.width/2,prop,this.height*this.horizon);')
replace(p, 'pool === s.embers ? 1.9 : 3.1', 'pool === s.embers ? 1.9 : Math.max(4.8, Math.min(9, pool.size[i] * this.scale * 8))')
replace(p, 'const started = performance.now(), c = this.ctx, s = this.sim;', 'const started = performance.now(), c = this.ctx, s = this.sim;\n        gatherBurstLighting(s.lights, this.burstWash, s.reducedFlashes);\n        limitBurstRadiance(this.burstWash, .50);')
replace(p, 'c.globalAlpha = 1; c.drawImage(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale); c.restore();', '''c.globalAlpha = 1; c.drawImage(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale);
            this.drawSurfaceTint(boat.image, -boat.screenWidth / 2, -boat.waterline * scale, boat.screenWidth, boat.image.height * scale); c.restore();''')
replace(p, 'c.globalAlpha = 1; c.drawImage(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);', 'c.globalAlpha = 1; c.drawImage(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);\n        this.drawSurfaceTint(this.riverArt.homes, 0, horizon - shoreHeight + 1, this.width, shoreHeight);')
replace(p, '        // Low-frequency sky response on long swells retains dark troughs.', '''        // Broad shell-coloured incident light is separate from the moon path and
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
        // Low-frequency sky response on long swells retains dark troughs.''')
replace(p, "c.fillStyle = '#111c27'; c.fillRect(0, terraceY, this.width, this.height * .08);", "c.fillStyle = '#111c27'; c.fillRect(0, terraceY, this.width, this.height * .08);\n        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35;\n        c.fillStyle = this.tone(this.burstWash[0], this.burstWash[1], this.burstWash[2]);\n        c.fillRect(0, terraceY, this.width, this.height * .08); c.restore();")
replace(p, 'waterSurfaceFragments: this.mode', 'waterBurstLightCapacity: BURST_LIGHT_CAPACITY, waterBurstLightCount: this.sim.lights.length,\n            waterSurfaceFragments: this.mode')
replace(p, 'this.starResponse.width = this.starResponse.height = 1;', 'this.starResponse.width = this.starResponse.height = 1;\n        this.tintMask.width = this.tintMask.height = 1;')

# Updated assertions replace the explicitly superseded no-reflection-on-Low contract.
p = 'tests/water-reflection-state.test.mjs'
replace(p, "[.5, 'ultra', 12, 384], [.5, 'standard', 10, 256]", "[.5, 'ultra', 12, 384], [.5, 'standard', 10, 256], [1.6, 'low', 6, 128], [.5, 'low', 6, 128]")
replace(p, 'assert.equal(f.water.target, null); assert.equal(f.water.diagnostics().reflectionHz, 0);', 'assert.ok(f.water.target); assert.equal(f.water.target.width, 128); assert.equal(f.water.diagnostics().reflectionHz, 6);')
replace(p, "assert.equal(f.state.renders, 1, 'throttle suppresses an early update');", "assert.equal(f.state.renders, 2, 'throttle suppresses an early update after the Low-to-Ultra refresh');")

pending['docs/FULL-NIGHT-IMPLEMENTATION.md'] = '''# Fuller shells and a lit waterfront — issues #34 / #35

Candidate source only. Do not merge automatically or deploy. Draft PR #33 and its release hold are unchanged. Main and the cinematic-show preview are separate, unchanged baselines.

## Burst changes

Peony retains 248 stars but grows for 4.8 seconds with a 0.65-second trail and an inner core. Crossette has 64 initial stars, four real travelling leaves per parent, wider branches and longer visible second breaks. GPU and Canvas both have larger intrinsic core/halo sprites; Low reduces counts, not the halo. No show cadence, quantity setting, audio gain or comfort default is increased.

Grand Finale emits a full primary shell and five smaller moving carriers. Every child is reserved at Ultra before admission; the composite reservation is 1,800 heads inside the unchanged 3,072-head pool. Admission-time composition fits the actual sky above the waterline, with viewport-width carrier spread rather than a fixed 55-unit guard. Geometry scaling no longer deletes another 42% of the stars. Signatures retain their existing layout solver.

## Waterfront changes

Twelve bounded live lights contribute at every quality tier. A shared smooth envelope supplies the water, broad scene light, wet coping and Canvas masks. The water shader uses a wide footprint and a hue-preserving radiance shoulder instead of independent per-channel clipping. The existing permanently registered blast light becomes a broad directional approximation so textured boats and shore catch its colour without more light objects or launch-time shader variants.

Low retains one cropped 128-pixel-cap planar target at six updates per simulation second, including the four bounded boat/home reflection-proxy draws. The old fake Low-only strips no longer render. The moon calculation, its path, world-space wave field, pause clock, transparent-mode cleanup and renderer-state restoration are preserved. Canvas uses a feathered water wash and one reusable silhouette mask for boats/homes, not opaque coloured rectangles.

## Verification boundary

Run unit tests, TypeScript, lint, production build, documentation validation and the desktop/mobile browser suites on this exact branch. Tests are not a GPU, thermal, physical-phone or Safari qualification. Visual approval and sustained native-renderer performance remain release gates; these changes do not clear PR #33's hold.
'''

# Write only after every source assertion has succeeded.
for path, content in pending.items():
    target = Path(path); target.parent.mkdir(parents=True, exist_ok=True); target.write_text(content)
print('Applied', len(pending), 'guarded source/test/document changes')
