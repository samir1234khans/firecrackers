import test from 'node:test';
import assert from 'node:assert/strict';
import { withDeadline } from '../.test-build/engine/RendererRecovery.js';

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
