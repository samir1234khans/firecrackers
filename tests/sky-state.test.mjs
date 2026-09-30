import test from 'node:test';
import assert from 'node:assert/strict';
import { SkyInteraction, acceptsSkyPointer, skyCadence, skyMotionAllowed, skyPointFromPointer } from '../.test-build/engine/SkyState.js';

const layout = () => ({
  viewport: { x: 100, y: 40, width: 800, height: 600 },
  safe: { top: 20, right: 12, bottom: 16, left: 12 },
  controls: { left: { x: 12, y: 160, width: 56, height: 240 }, right: { x: 728, y: 160, width: 60, height: 240 } },
  heroRect: { x: 72, y: 20, width: 652, height: 564 }, panelOpen: false,
  burstCanopy: { x: 72, y: 60, width: 652, height: 360 },
  launchArea: { x: 12, y: 480, width: 776, height: 90 },
  reflectionBand: { x: 72, y: 440, width: 652, height: 144 },
});

test('sky time is exactly the shared simulation time and reuses one bounded state', () => {
  const sky = new SkyInteraction(), view = sky.state;
  sky.update(4, true);
  sky.target(.8, .1);
  sky.update(4.1, true);
  assert.equal(sky.state, view);
  assert.equal(view.time, 4.1);
  assert.ok(view.pointerX > .5 && view.pointerX < .8);
  assert.ok(view.engagement > 0 && view.engagement < 1);
  const paused = { ...view };
  for (let i = 0; i < 300; i++) sky.update(4.1, true);
  assert.deepEqual(view, paused, 'wall-clock invocations cannot advance the phase');
});

test('pointer smoothing is deterministic across normal render cadences and settles', () => {
  const slow = new SkyInteraction(), fast = new SkyInteraction();
  slow.update(0, true); fast.update(0, true);
  slow.target(.92, .38); fast.target(.92, .38);
  for (let i = 1; i <= 30; i++) slow.update(i / 30, true);
  for (let i = 1; i <= 60; i++) fast.update(i / 60, true);
  assert.ok(Math.abs(slow.state.pointerX - fast.state.pointerX) < 1e-10);
  assert.ok(Math.abs(slow.state.engagement - fast.state.engagement) < 1e-10);
  for (let i = 31; i <= 90; i++) slow.update(i / 30, true);
  assert.equal(slow.responding, false);
  slow.release();
  for (let i = 91; i <= 180; i++) slow.update(i / 30, true);
  assert.deepEqual([slow.state.pointerX, slow.state.pointerY, slow.state.engagement], [.5, .25, 0]);
});

test('QA advance can change shared time without advancing frozen pointer response', () => {
  const sky = new SkyInteraction();
  sky.update(0, true); sky.target(.9, .05); sky.update(.2, true);
  const before = { ...sky.state };
  sky.target(.1, .4);
  sky.update(50, true, false);
  assert.equal(sky.state.time, 50);
  assert.deepEqual([sky.state.pointerX, sky.state.pointerY, sky.state.engagement],
    [before.pointerX, before.pointerY, before.engagement]);
  sky.update(50, true);
  assert.equal(sky.state.pointerX, before.pointerX, 'resume does not integrate a hidden/frozen gap');
});

test('reset, policy changes and invalid targets leave a finite neutral state', () => {
  const sky = new SkyInteraction();
  sky.update(0, true); sky.target(5, -2); sky.update(.2, true);
  assert.ok(sky.state.pointerX <= 1 && sky.state.pointerY >= 0);
  sky.update(.2, false);
  assert.deepEqual([sky.state.pointerX, sky.state.pointerY, sky.state.engagement], [.5, .25, 0]);
  sky.target(NaN, Infinity); sky.update(.3, true);
  assert.equal(sky.state.pointerX, .5);
  assert.equal(sky.state.pointerY, .25);
  sky.update(0, true);
  assert.deepEqual([sky.state.time, sky.state.pointerX, sky.state.pointerY, sky.state.engagement], [0, .5, .25, 0]);
});

test('all motion restrictions are honored and idle cadence stays bounded', () => {
  assert.equal(skyMotionAllowed('ultra', false, false, 'interactive'), true);
  assert.equal(skyMotionAllowed('standard', false, false, 'scene'), true);
  for (const input of [['low', false, false, 'interactive'], ['ultra', true, false, 'interactive'],
    ['ultra', false, true, 'interactive'], ['ultra', false, false, 'transparent']])
    assert.equal(skyMotionAllowed(...input), false);
  assert.equal(skyCadence('ultra', 'WebGPU', false, true), 20);
  assert.equal(skyCadence('standard', 'WebGL', false, true), 12);
  assert.equal(skyCadence('ultra', 'Canvas 2D', false, true), 10);
  assert.equal(skyCadence('ultra', 'Canvas 2D', true, true), 30);
  assert.equal(skyCadence('low', 'WebGPU', true, true), 0);
  assert.equal(skyCadence('ultra', 'WebGPU', true, false), 0);
});

test('sky input respects actual horizon, safe insets and every measured control', () => {
  const stage = layout();
  assert.deepEqual(skyPointFromPointer(500, 160, stage, .48), [.5, .2]);
  assert.deepEqual(skyPointFromPointer(120, 100, stage, .48), [.025, .1], 'blank edge space may respond');
  assert.equal(skyPointFromPointer(130, 240, stage, .48), null, 'left control');
  assert.equal(skyPointFromPointer(850, 240, stage, .48), null, 'right control');
  assert.equal(skyPointFromPointer(500, 329, stage, .48), null, 'actual waterline wins over nominal burst canopy');
  assert.equal(skyPointFromPointer(110, 100, stage, .48), null, 'notch inset');
  assert.equal(skyPointFromPointer(500, 50, stage, .48), null, 'upper safe area');
  assert.equal(skyPointFromPointer(NaN, 160, stage, .48), null);
  stage.panelOpen = true;
  assert.equal(skyPointFromPointer(500, 160, stage, .48), null);
});

test('hover excludes drags and touch/pen response requires its own primary sky contact', () => {
  const mouse = { type: 'mouse', isPrimary: true, buttons: 0, pointerId: 1, contactId: null, blocked: false };
  assert.equal(acceptsSkyPointer(mouse), true);
  assert.equal(acceptsSkyPointer(mouse, true), false, 'mouse press is not an ambient action');
  assert.equal(acceptsSkyPointer({ ...mouse, buttons: 1 }), false);
  assert.equal(acceptsSkyPointer({ ...mouse, blocked: true }), false);
  assert.equal(acceptsSkyPointer({ ...mouse, isPrimary: false }), false);
  const touch = { ...mouse, type: 'touch', buttons: 1, pointerId: 7 };
  assert.equal(acceptsSkyPointer(touch), false, 'no prior sky down');
  assert.equal(acceptsSkyPointer(touch, true), true);
  assert.equal(acceptsSkyPointer({ ...touch, contactId: 7 }), true);
  assert.equal(acceptsSkyPointer({ ...touch, contactId: 8 }), false);
  assert.equal(acceptsSkyPointer({ ...touch, contactId: 7 }, true), false, 'a second down does not steal the contact');
  assert.equal(acceptsSkyPointer({ ...touch, isPrimary: false }, true), false);
});
