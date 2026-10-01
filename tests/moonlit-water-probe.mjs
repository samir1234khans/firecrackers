import assert from 'node:assert/strict';

// Test-only scalar access to the same objects QA.snapshot already captures.
// Runtime closure introspection requires no Debugger enable/pause, app patch,
// public API, forced collection or altered renderer/simulation state.
export async function installWaterTimingProbe(page) {
  const cdp = await page.context().newCDPSession(page);
  const group = 'moonlit-water-probe-setup';
  try {
    const snapshot = await cdp.send('Runtime.evaluate', {
      expression: 'window.__firecrackersQA.snapshot', objectGroup: group,
    });
    assert.ok(snapshot.result.objectId, 'QA snapshot function reference must be available');
    const properties = await cdp.send('Runtime.getProperties', { objectId: snapshot.result.objectId, ownProperties: true });
    const scopesId = properties.internalProperties?.find(property => property.name === '[[Scopes]]')?.value?.objectId;
    assert.ok(scopesId, 'Runtime must expose QA closure scopes without Debugger');
    const scopes = await cdp.send('Runtime.getProperties', { objectId: scopesId, ownProperties: true });
    let rendererId, simulationId, rendererAlias, stateAlias;
    for (const scope of scopes.result) {
      if (!/^\d+$/.test(scope.name) || !scope.value?.objectId || scope.value.description === 'Global') continue;
      const bindings = await cdp.send('Runtime.getProperties', { objectId: scope.value.objectId, ownProperties: true });
      for (const binding of bindings.result) {
        if (binding.value?.type !== 'object' || !binding.value.objectId) continue;
        const identified = await cdp.send('Runtime.callFunctionOn', {
          objectId: binding.value.objectId, returnByValue: true,
          functionDeclaration: `function() {
            try { return {
              renderer: !!this.metrics && Number.isFinite(this.metrics.frames) && Number.isFinite(this.metrics.submitMs) &&
                typeof this.backend === 'string' && typeof this.render === 'function',
              simulation: !!this.heads && !!this.trails && !!this.embers && Array.isArray(this.rockets) && Number.isFinite(this.time),
            }; } catch { return { renderer: false, simulation: false }; }
          }`,
        });
        if (!rendererId && identified.result.value?.renderer) { rendererId = binding.value.objectId; rendererAlias = binding.name; }
        if (!simulationId && identified.result.value?.simulation) { simulationId = binding.value.objectId; stateAlias = binding.name; }
        if (rendererId && simulationId) break;
      }
      if (rendererId && simulationId) break;
    }
    assert.ok(rendererId && simulationId, 'Runtime closure scopes must contain the active renderer and Simulation');
    const installed = await cdp.send('Runtime.callFunctionOn', {
      objectId: snapshot.result.objectId,
      arguments: [{ objectId: rendererId }, { objectId: simulationId }], returnByValue: true,
      functionDeclaration: `function(renderer, simulation) {
        if (!renderer.metrics || !Number.isFinite(renderer.metrics.frames) || !Number.isFinite(renderer.metrics.submitMs) ||
          !simulation.heads || !simulation.trails || !simulation.embers || !Array.isArray(simulation.rockets) || !Number.isFinite(simulation.time))
          throw new Error('Recovered closure objects do not match renderer metrics / Simulation contracts');
        const metrics = renderer.metrics;
        window.__moonlitWaterTiming = {
          renderer, simulation, metrics, snapshot: this,
          read(out) {
            out[0] = simulation.time; out[1] = metrics.frames; out[2] = metrics.submitMs;
            out[3] = Number.isFinite(metrics.waterSubmitMs) ? metrics.waterSubmitMs : NaN;
            out[4] = simulation.bursts;
            out[5] = simulation.heads.count + simulation.trails.count + simulation.embers.count;
            out[6] = simulation.quality === 'ultra' ? 2 : simulation.quality === 'standard' ? 1 : 0;
            out[7] = renderer.backend === 'WebGPU' ? 2 : renderer.backend === 'WebGL 2' ? 1 : 0;
            out[8] = Number.isFinite(renderer.water?.frames) ? renderer.water.frames : NaN;
            out[9] = simulation.paused ? 1 : 0;
          },
        };
        return { backend: renderer.backend, frames: metrics.frames, time: simulation.time,
          method: 'CDP Runtime [[Scopes]]; Debugger never enabled', rendererAlias: ${JSON.stringify(rendererAlias)}, stateAlias: ${JSON.stringify(stateAlias)} };
      }`,
    });
    assert.ok(!installed.exceptionDetails, JSON.stringify(installed.exceptionDetails));
    await validateWaterTimingProbe(page);
    return installed.result.value;
  } finally {
    await cdp.send('Runtime.releaseObjectGroup', { objectGroup: group });
    await cdp.detach();
  }
}

export async function validateWaterTimingProbe(page) {
  const state = await page.evaluate(() => {
    const probe = window.__moonlitWaterTiming;
    if (!probe) return { missing: true };
    const qa = window.__firecrackersQA.snapshot(), values = new Float64Array(10);
    probe.read(values);
    return { values: Array.from(values, value => Number.isFinite(value) ? value : null), qa: { time: qa.time, frames: qa.frames, submitMs: qa.submitMs,
      waterSubmitMs: Number.isFinite(qa.waterSubmitMs) ? qa.waterSubmitMs : null,
      bursts: qa.bursts, particles: qa.particles, quality: qa.quality, backend: qa.backend,
      reflectionFrames: Number.isFinite(qa.reflectionFrames) ? qa.reflectionFrames : null, paused: qa.paused },
      sameFunction: probe.snapshot === window.__firecrackersQA.snapshot,
      sameMetrics: probe.metrics === probe.renderer.metrics };
  });
  assert.ok(!state.missing && state.sameFunction && state.sameMetrics, 'Timing probe must retain the current QA and metric references');
  const expected = [state.qa.time, state.qa.frames, state.qa.submitMs, state.qa.waterSubmitMs, state.qa.bursts, state.qa.particles,
    state.qa.quality === 'ultra' ? 2 : state.qa.quality === 'standard' ? 1 : 0,
    state.qa.backend === 'WebGPU' ? 2 : state.qa.backend === 'WebGL 2' ? 1 : 0,
    state.qa.reflectionFrames, state.qa.paused ? 1 : 0];
  assert.deepEqual(state.values, expected, 'Lightweight probe scalar readings must exactly match simultaneous full QA snapshot');
  return state.qa;
}

export async function sampleWaterTiming(page, workload, duration, targetBurst, traceMarks = false) {
  const result = await page.evaluate(({ workload, duration, targetBurst, traceMarks }) => new Promise((resolve, reject) => {
    const probe = window.__moonlitWaterTiming;
    if (!probe) { reject(new Error('Lightweight water probe is unavailable')); return; }
    // At most 8192 callbacks per interval. Allocation is outside measured time.
    const capacity = 8192, columns = 16, buffer = new Float64Array(capacity * columns), state = new Float64Array(10);
    let count = 0, start = null, previous = null, renderTime = null, frameId = null, reflectionId = null, burstAt = null;
    if (traceMarks) performance.mark(`water-profile:${workload}:start`);
    const tick = now => {
      if (start === null) start = now;
      const before = performance.now(); probe.read(state); const after = performance.now();
      const newRender = state[1] !== frameId;
      if (burstAt === null && targetBurst !== null && state[4] >= targetBurst) {
        burstAt = now - start;
        if (traceMarks) performance.mark(`water-profile:${workload}:burst`, { detail: { rafNow: now, performanceNow: after, simulationTime: state[0] } });
      }
      if (previous !== null) {
        if (count >= capacity) { reject(new Error('Bounded scalar timing buffer exhausted')); return; }
        const offset = count++ * columns;
        buffer[offset] = now - start; buffer[offset + 1] = now; buffer[offset + 2] = after;
        buffer[offset + 3] = now - previous; buffer[offset + 4] = newRender && renderTime !== null ? now - renderTime : NaN;
        buffer[offset + 5] = state[2]; buffer[offset + 6] = state[3]; buffer[offset + 7] = newRender ? 1 : 0;
        buffer[offset + 8] = state[1]; buffer[offset + 9] = state[8];
        buffer[offset + 10] = newRender && reflectionId !== null && state[8] > reflectionId ? 1 : 0;
        buffer[offset + 11] = state[0]; buffer[offset + 12] = state[5]; buffer[offset + 13] = state[4];
        buffer[offset + 14] = after - before; buffer[offset + 15] = state[6] * 10 + state[7];
        if (traceMarks && now - previous > 50) performance.mark(`water-profile:${workload}:gap-${count}`, { detail: { rafNow: now, performanceNow: after, rafMs: now - previous } });
      }
      if (newRender) { renderTime = now; frameId = state[1]; reflectionId = state[8]; }
      previous = now;
      if (now - start < duration) requestAnimationFrame(tick);
      else {
        if (traceMarks) performance.mark(`water-profile:${workload}:end`);
        // Materialize records after the final measured callback.
        const frames = new Array(count), backend = ['Canvas 2D · compatibility', 'WebGL 2', 'WebGPU'], quality = ['low', 'standard', 'ultra'];
        for (let i = 0; i < count; i++) {
          const offset = i * columns, identity = buffer[offset + 15];
          frames[i] = { t: buffer[offset], rafNow: buffer[offset + 1], performanceNow: buffer[offset + 2], rafMs: buffer[offset + 3],
            renderedIntervalMs: Number.isFinite(buffer[offset + 4]) ? buffer[offset + 4] : null,
            submitMs: buffer[offset + 5], waterSubmitMs: Number.isFinite(buffer[offset + 6]) ? buffer[offset + 6] : null,
            newRender: Boolean(buffer[offset + 7]), renderFrames: buffer[offset + 8], reflectionFrames: Number.isFinite(buffer[offset + 9]) ? buffer[offset + 9] : null,
            reflectionUpdated: Boolean(buffer[offset + 10]), simulationTime: buffer[offset + 11], particles: buffer[offset + 12], bursts: buffer[offset + 13],
            snapshotMs: buffer[offset + 14], quality: quality[Math.floor(identity / 10)], backend: backend[identity % 10],
          };
        }
        resolve({ frames, burstAt, capacity, count });
      }
    };
    requestAnimationFrame(tick);
  }), { workload, duration, targetBurst, traceMarks });
  if (targetBurst !== null) assert.ok(Number.isFinite(result.burstAt), `${workload} must complete its burst`);
  return result;
}
