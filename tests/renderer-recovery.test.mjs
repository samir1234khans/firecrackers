import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderOverloadGuard, withDeadline } from '../.test-build/engine/RendererRecovery.js';

test('ready renderer resolves and clears its deadline', async () => {
    const controller = new AbortController();
    assert.equal(await withDeadline(Promise.resolve('ready'), controller.signal, 100), 'ready');
    controller.abort();
});
test('rejected renderer can be handled by the fallback path', async () => {
    await assert.rejects(withDeadline(Promise.reject(new Error('driver')), new AbortController().signal, 100), /driver/);
});
test('hung renderer cannot leave startup loading indefinitely', async () => {
    await assert.rejects(withDeadline(new Promise(() => {}), new AbortController().signal, 8), /timed out/);
});
test('unmount cancels pending initialization', async () => {
    const controller = new AbortController();
    const pending = withDeadline(new Promise(() => {}), controller.signal, 1000);
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
});
test('already-aborted initialization still handles its late rejection', async () => {
    const controller = new AbortController(); controller.abort();
    await assert.rejects(withDeadline(Promise.reject(new Error('late driver')), controller.signal, 100), { name: 'AbortError' });
});
test('one costly shader frame does not abandon a healthy 3D renderer', () => {
    const guard = new RenderOverloadGuard();
    assert.equal(guard.observe(1400, true), false);
    for (let i = 0; i < 12; i++) assert.equal(guard.observe(16.7, true), false);
});
test('sustained unusable 3D frames trigger compatibility recovery', () => {
    const consecutive = new RenderOverloadGuard();
    assert.equal(consecutive.observe(450, true), false);
    assert.equal(consecutive.observe(600, true), false);
    assert.equal(consecutive.observe(700, true), true);
    const intermittent = new RenderOverloadGuard();
    for (const frame of [150, 170, 18, 160, 150]) assert.equal(intermittent.observe(frame, true), false);
    assert.equal(intermittent.observe(145, true), true, 'five of six very slow frames are sustained overload');
});
test('hidden or idle transitions clear prior overload evidence', () => {
    const guard = new RenderOverloadGuard();
    guard.observe(650, true); guard.observe(710, true);
    assert.equal(guard.observe(1000, false), false);
    assert.equal(guard.observe(530, true), false);
    assert.equal(guard.observe(500, true), false);
});
