import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneCapture, createFrameStream } from '../.test-build/experience/SceneCapture.js';

test('manual capture requests the completed frame on its owning video track', () => {
  let requested = 0;
  const video = { requestFrame() { assert.equal(this, video); requested++; }, stop() {} };
  const stream = { getVideoTracks: () => [video], getTracks: () => [video] };
  const rates = [];
  const delivery = createFrameStream({ captureStream: rate => { rates.push(rate); return stream; } });
  assert.deepEqual(rates, [0]); assert.equal(delivery.stream, stream); assert.equal(requested, 0);
  delivery.present(); delivery.present(); assert.equal(requested, 2);
});

test('a browser without requestFrame retains timed capture and stops the probing stream', () => {
  let stopped = 0;
  const video = { stop() { stopped++; } };
  const probe = { getVideoTracks: () => [video], getTracks: () => [video] };
  const fallback = {}, rates = [];
  const delivery = createFrameStream({ captureStream: rate => { rates.push(rate); return rate === 0 ? probe : fallback; } });
  assert.deepEqual(rates, [0, 24]); assert.equal(stopped, 1);
  assert.equal(delivery.stream, fallback); assert.equal(delivery.present, null);
});

test('capture security errors remain visible rather than trying to bypass them', () => {
  const error = new Error('SecurityError'); let attempts = 0;
  assert.throws(() => createFrameStream({ captureStream() { attempts++; throw error; } }), failure => failure === error);
  assert.equal(attempts, 1);
});

test('each admitted capture frame is requested only after its finished scene copy', () => {
  const capture = new SceneCapture(), source = {}, order = [];
  capture.source = source; capture.copy = { width: 1280, height: 800 };
  capture.context = { drawImage: (...args) => { assert.equal(args[0], source); order.push('draw'); } };
  capture.presentFrame = () => order.push('request'); capture.started = performance.now();
  capture.snapshot.recording = true;
  capture.frame(source, 0); capture.frame(source, .01); capture.frame(source, .05);
  assert.deepEqual(order, ['draw', 'request', 'draw', 'request']);
  capture.dispose(); assert.equal(capture.presentFrame, null); assert.equal(capture.snapshot.recording, false);
});

test('renderer changes stop recording without requesting a mismatched frame', () => {
  const capture = new SceneCapture(); let stopped = '', requested = 0;
  capture.source = {}; capture.snapshot.recording = true;
  capture.presentFrame = () => requested++;
  capture.stop = reason => { stopped = reason; };
  capture.frame({}, 1);
  assert.match(stopped, /renderer changed/); assert.equal(requested, 0); capture.dispose();
});

test('disposed capture releases tracks/audio once and cannot submit another frame', () => {
  const capture = new SceneCapture(), source = {}; let stopped = 0, released = 0, requests = 0;
  capture.source = source; capture.snapshot.recording = true;
  capture.stream = { getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] };
  capture.releaseAudio = () => released++; capture.presentFrame = () => requests++;
  capture.dispose(); capture.dispose(); capture.frame(source, 2);
  assert.equal(stopped, 2); assert.equal(released, 1); assert.equal(requests, 0); assert.equal(capture.presentFrame, null);
});
