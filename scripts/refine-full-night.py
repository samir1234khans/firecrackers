from pathlib import Path
import json
pending = {}
def edit(path, old, new, count=1):
    text = pending.get(path, Path(path).read_text())
    assert text.count(old) == count, (path, old[:150], text.count(old))
    pending[path] = text.replace(old, new)

edit('src/engine/catalog.ts', 'count: 248, speed: 30, life: 4.8', 'count: 248, speed: 30, life: 4.6')
edit('src/engine/catalog.ts', 'return family === 4 ? 1800 : family === 3 ? 320 :', '''// The finale's primary and all five unborn breaks are reserved at Ultra.
    // Derive this from recipes so a denser Crossette cannot silently over-admit.
    if (family === 4) return 3 * familyReservation(1) + familyReservation(2) + familyReservation(3) + familyReservation(0);
    return family === 3 ? Math.round(FAMILIES[3].count * 1.2) * 4 :''')
edit('src/engine/BurstLighting.ts', '! [light.x, light.y, light.z, light.r, light.g, light.b].every(Number.isFinite)', 'false') if False else None
edit('src/engine/BurstLighting.ts', '![light.x, light.y, light.z, light.r, light.g, light.b].every(Number.isFinite)', '!Number.isFinite(light.x) || !Number.isFinite(light.y) || !Number.isFinite(light.z) || !Number.isFinite(light.r) || !Number.isFinite(light.g) || !Number.isFinite(light.b)')

p = 'src/engine/RendererRecovery.ts'
pending[p] = Path(p).read_text() + '''

/** Keep native rendering for transient dense-shell pressure. Runtime/context
 * failures still use the separate immediate recovery path. This policy never
 * hides the backend, edits the saved preference, or changes show cadence. */
export class NativeRenderRecovery {
    private readonly pressure = new RenderOverloadGuard();
    private lowPressureMs = 0;
    private lowPressureFrames = 0;
    reset() { this.pressure.reset(); this.lowPressureMs = this.lowPressureFrames = 0; }
    observe(frameMs: number, active: boolean, alreadyLow: boolean): 'reduce-quality' | 'recover' | null {
        if (!active) { this.reset(); return null; }
        if (!Number.isFinite(frameMs) || frameMs <= 0) return null;
        const overloaded = this.pressure.observe(frameMs, true);
        if (!alreadyLow) {
            this.lowPressureMs = this.lowPressureFrames = 0;
            if (overloaded) { this.pressure.reset(); return 'reduce-quality'; }
            return null;
        }
        if (frameMs < 100) {
            this.lowPressureMs = Math.max(0, this.lowPressureMs - frameMs * 4);
            this.lowPressureFrames = Math.max(0, this.lowPressureFrames - 2);
            return null;
        }
        if (overloaded) {
            this.lowPressureMs += Math.min(frameMs, 500);
            this.lowPressureFrames++;
        }
        // At least six seconds AND 24 bad frames after Low adaptation. Three
        // costly shell frames alone can no longer replace a working 3D scene.
        if (this.lowPressureMs >= 6000 && this.lowPressureFrames >= 24) {
            this.reset(); return 'recover';
        }
        return null;
    }
}
'''
edit('src/engine/useWorld.ts', 'RenderOverloadGuard', 'NativeRenderRecovery', count=2)
edit('src/engine/useWorld.ts', '''if (rendered && graphics && !graphics.backend.startsWith('Canvas') && overload.observe(observedMs, continuous)) void recoverOverload();''', '''if (rendered && graphics && !graphics.backend.startsWith('Canvas')) {
                        const response = overload.observe(observedMs, continuous, state.quality === 'low');
                        if (response === 'reduce-quality') {
                            state.quality = 'low'; graphics.setQuality('low');
                            lastQuality = now; lastSkyRender = 0; skyInvalidated = true;
                            notice(`${graphics.backend} is staying active with Low detail after rendering pressure. Glow and water reflections remain on; your saved quality choice is unchanged.`);
                        } else if (response === 'recover') void recoverOverload('sustained slow frames after Low-detail recovery');
                    }''')

edit('tests/launch-composition.test.mjs', '''assert.ok(fraction >= .31-1e-9 && fraction <= .37+1e-9, `${family.id}: ${fraction}`);''', '''if (family.id === 'grand-finale') {
        const skyBottom = Math.min(layout.heroRect.height, waterY) - 10;
        const center = fraction * layout.heroRect.height;
        assert.ok(center >= skyBottom * .388 - 1e-7 && center <= skyBottom * .412 + 1e-7, 'finale uses the visible sky, not the old 37% scene cap');
        assert.ok(center - 65 * profile.effectScale * scale * 1.2 >= 0, 'principal crown clears the top');
        assert.ok(center + 112 * profile.effectScale * scale * 1.2 <= waterY, 'falling shell remains above the shore');
      } else assert.ok(fraction >= .31-1e-9 && fraction <= .37+1e-9, `${family.id}: ${fraction}`);''')
edit('tests/video-flow.test.mjs', "  assert.equal(s.launchBlock, '', 'the next family is ready at the apex without a timer');", '''  if (f.id === 'grand-finale') {
    assert.equal(s.launchBlock, 'capacity', 'two full finales cannot exceed the fixed head pool');
    s.select('multicolor-peony');
  }
  assert.equal(s.launchBlock, '', 'the next fitting family is ready at the apex without a timer');''')
edit('tests/video-flow.test.mjs', '  advance(s, 18);\n  assert.equal(s.ready, true);', "  advance(s, 18);\n  s.select(f.id);\n  assert.equal(s.ready, true);")

p = 'package.json'
package = json.loads(Path(p).read_text())
package['scripts']['test'] += ' tests/full-night.test.mjs'
package['scripts']['test:full-night'] = 'node tests/full-night-browser.mjs'
pending[p] = json.dumps(package, indent=2) + '\n'
edit('docs/FULL-NIGHT-IMPLEMENTATION.md', '4.8 seconds', '4.6 seconds')
edit('docs/FULL-NIGHT-IMPLEMENTATION.md', 'the composite reservation is 1,800 heads', 'the composite reservation is derived from all six recipes at Ultra')
edit('docs/FULL-NIGHT-IMPLEMENTATION.md', 'Every child is reserved at Ultra before admission;', 'Every child is reserved at Ultra before admission;')
pending['docs/FULL-NIGHT-IMPLEMENTATION.md'] += '''
## Native-first load recovery

A short overload first lowers only effective rendering quality, preserving saved preferences, the actual native backend, glow and water reflections. A backend change requires at least six additional seconds and 24 bad frames at Low. Actual renderer errors/context failures retain immediate recovery. Idle and pause reset overload evidence. The backend notice remains truthful; no status is hidden. This is a resilience policy, not a native-performance qualification.
'''
for path, content in pending.items():
    Path(path).write_text(content)
print('Applied native-first refinement to', len(pending), 'files')
