import test from 'node:test';
import assert from 'node:assert/strict';
import { CELESTIAL_LIMITS, createCelestialFrame, updateCelestialFrame } from '../.test-build/graphics/CelestialScene.js';

const sky = (changes = {}) => ({ time: 9.7, pointerX: .5, pointerY: .25, engagement: 0, motionAllowed: true, ...changes });

test('a frozen shared time replays the complete celestial composition', () => {
    const state = Object.freeze(sky({ pointerX: .72, pointerY: .18, engagement: .8 }));
    const a = createCelestialFrame(), b = createCelestialFrame();
    updateCelestialFrame(a, state, 1440, 900, true, true);
    for (let redraw = 0; redraw < 20; redraw++) updateCelestialFrame(b, state, 1440, 900, true, true);
    assert.deepEqual(a, b, 'resize, asset and QA redraws cannot supply another animation clock');
    assert.equal(state.time, 9.7);
});

test('near-star pointer displacement stays within three CSS pixels at every edge and viewport', () => {
    const frame = createCelestialFrame(), state = sky({ engagement: 1 });
    for (const [width, height] of [[320, 480], [390, 844], [1440, 900], [2560, 1440]]) {
        for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1], [.5, .5], [-4, 12]]) {
            state.pointerX = x; state.pointerY = y;
            updateCelestialFrame(frame, state, width, height, true, false);
            assert.ok(Math.hypot(frame.nearX, frame.nearY) <= 3 + 1e-12);
            assert.ok(frame.pointerX >= 0 && frame.pointerX <= 1);
            assert.ok(frame.pointerY >= 0 && frame.pointerY <= 1);
        }
    }
    assert.equal(CELESTIAL_LIMITS.nearParallaxPixels, 3);
});

test('an unengaged pointer produces no local response or pointer displacement', () => {
    const frame = createCelestialFrame();
    updateCelestialFrame(frame, sky({ pointerX: 1, pointerY: 1 }), 1440, 900, true, true);
    assert.equal(frame.engagement, 0);
    assert.equal(frame.nearX, 0); assert.equal(frame.nearY, 0);
    assert.equal(frame.dustX, 0); assert.equal(frame.dustY, 0);
});

test('one seeded distant meteor occupies only its short upper-sky interval', () => {
    const frame = createCelestialFrame(), state = sky();
    assert.equal(CELESTIAL_LIMITS.maximumMeteors, 1);
    for (let epoch = 0; epoch < 10; epoch++) {
        state.time = epoch * 36 + 9.7;
        updateCelestialFrame(frame, state, 390, 844, true, false);
        assert.equal(frame.meteor.active, true);
        assert.ok(frame.meteor.opacity > 0 && frame.meteor.opacity <= .14 + 1e-12);
        assert.ok(frame.meteor.headY / 844 < .08, 'the stroke stays above the main burst canopy');
        assert.ok(frame.meteor.tailY >= 0);
        assert.ok(frame.meteor.headX >= 0 && frame.meteor.headX <= 390);
    }
    for (const time of [0, 8.9, 9, 10.4, 35.9, 36, 44.9, 46.4, 72]) {
        state.time = time; updateCelestialFrame(frame, state, 390, 844, true, false);
        assert.equal(frame.meteor.active, false, `no meteor at ${time}s`);
        assert.equal(frame.meteor.opacity, 0);
    }
});

test('meteor replay is seeded without consuming or modifying the input state', () => {
    const state = Object.freeze(sky()), a = createCelestialFrame(), b = createCelestialFrame();
    updateCelestialFrame(a, state, 1440, 900, true, false);
    updateCelestialFrame(b, state, 1440, 900, true, false);
    assert.deepEqual(a.meteor, b.meteor);
    updateCelestialFrame(b, sky({ time: 45.7 }), 1440, 900, true, false);
    assert.notEqual(a.meteor.headX, b.meteor.headX, 'successive windows vary deterministically');
    assert.equal(state.time, 9.7);
});

test('Low, reduced motion and excluded output can disable all celestial animation and response', () => {
    const frame = createCelestialFrame();
    for (const [statePolicy, rendererPolicy] of [[false, true], [true, false], [false, false]]) {
        updateCelestialFrame(frame, sky({ motionAllowed: statePolicy, engagement: 1 }), 1440, 900, rendererPolicy, false);
        assert.equal(frame.motionAllowed, false); assert.equal(frame.time, 0);
        assert.equal(frame.engagement, 0); assert.equal(frame.twinkle, 1);
        assert.equal(frame.nearX, 0); assert.equal(frame.nearY, 0);
        assert.equal(frame.meteor.active, false); assert.equal(frame.meteor.opacity, 0);
    }
});

test('reduced flashes attenuates a smooth meteor instead of adding an onset flash', () => {
    const regular = createCelestialFrame(), reduced = createCelestialFrame();
    const state = sky();
    updateCelestialFrame(regular, state, 1440, 900, true, false);
    updateCelestialFrame(reduced, state, 1440, 900, true, true);
    assert.ok(Math.abs(reduced.meteor.opacity / regular.meteor.opacity - .55) < 1e-12);
    let previous = 0;
    for (let i = 0; i <= 140; i++) {
        state.time = 9 + i / 100; updateCelestialFrame(reduced, state, 1440, 900, true, true);
        assert.ok(reduced.meteor.opacity <= .077 + 1e-12);
        assert.ok(Math.abs(reduced.meteor.opacity - previous) < .003, '10ms samples have no abrupt brightness step');
        previous = reduced.meteor.opacity;
    }
    assert.equal(reduced.meteor.active, false);
});

test('invalid state and dimensions stay finite and cannot activate a meteor', () => {
    const frame = createCelestialFrame();
    updateCelestialFrame(frame, sky({ time: NaN, pointerX: Infinity, pointerY: NaN, engagement: NaN }), 1440, 900, true, false);
    assert.equal(frame.time, 0); assert.equal(frame.pointerX, .5); assert.equal(frame.pointerY, .25);
    assert.equal(frame.engagement, 0); assert.equal(frame.meteor.active, false);
    updateCelestialFrame(frame, sky(), NaN, 900, true, false);
    assert.equal(frame.meteor.active, false);
});

test('updates reuse one bounded output and its sole meteor object across ten thousand frames', () => {
    const frame = createCelestialFrame(), meteor = frame.meteor, state = sky();
    Object.seal(frame); Object.seal(meteor);
    for (let i = 0; i < 10000; i++) {
        state.time = i / 60;
        assert.equal(updateCelestialFrame(frame, state, 1440, 900, true, true), undefined);
        assert.equal(frame.meteor, meteor);
        assert.equal(Array.isArray(frame.meteor), false);
    }
});
