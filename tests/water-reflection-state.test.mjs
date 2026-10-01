import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { WaterReflection } from '../.test-build/graphics/WaterReflection.js';

function fixture() {
  const water = new WaterReflection();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1.6, 1, 1500);
  camera.position.set(0, 31, 175); camera.lookAt(0, 46, -100); camera.updateMatrixWorld();
  water.resize(camera);
  water.setFrame({ phase: 3, waveCount: 4, farZ: -1000, nearZ: -14.75, motionAllowed: true });
  const outer = new THREE.RenderTarget(80, 60), mrt = { name: 'main MRT' };
  const state = { target: outer, mrt, autoClear: false, clear: new THREE.Color(.03, .07, .11), alpha: .42,
    viewport: new THREE.Vector4(11, 13, 241, 177), scissor: new THREE.Vector4(17, 19, 223, 161), scissorTest: true, renders: 0, orient: camera, reflecting: false };
  const original = { target: outer, mrt, autoClear: state.autoClear, clear: state.clear.clone(), alpha: state.alpha,
    viewport: state.viewport.clone(), scissor: state.scissor.clone(), scissorTest: state.scissorTest };
  let renderError = false, compileError = false;
  const renderer = {
    coordinateSystem: THREE.WebGPUCoordinateSystem,
    get autoClear() { return state.autoClear; }, set autoClear(value) { state.autoClear = value; },
    getRenderTarget: () => state.target, setRenderTarget: target => { state.target = target; },
    getMRT: () => state.mrt, setMRT: value => { state.mrt = value; },
    getClearAlpha: () => state.alpha,
    getClearColor: target => { target.copy(state.clear); target.a = state.alpha; return target; },
    setClearColor: (color, alpha) => { state.clear.set(color); state.alpha = alpha; },
    getViewport: target => target.copy(state.viewport),
    getScissor: target => target.copy(state.scissor),
    setViewport: (...args) => { args.length === 1 ? state.viewport.copy(args[0]) : state.viewport.set(...args); },
    setScissor: (...args) => { args.length === 1 ? state.scissor.copy(args[0]) : state.scissor.set(...args); },
    getScissorTest: () => state.scissorTest, setScissorTest: value => { state.scissorTest = value; },
    render: (_scene, mirrored) => {
      assert.equal(state.target, water.target); assert.equal(state.mrt, null); assert.equal(state.reflecting, true);
      assert.equal(state.orient, mirrored); assert.equal(mirrored.layers.mask, (1 << 3) | (1 << 4));
      if (renderError) throw new Error('reflection render failed');
      state.renders++;
    },
    compileAsync: async (_scene, mirrored) => {
      assert.equal(state.target, water.target); assert.equal(state.mrt, null); assert.equal(state.orient, mirrored);
      if (compileError) throw new Error('reflection compile failed');
    },
  };
  const orient = (view, reflecting = false) => { state.orient = view; state.reflecting = reflecting; };
  const sim = { quality: 'ultra', reducedFlashes: true, time: 4, lights: [] };
  const restored = () => {
    for (const key of ['target', 'mrt', 'autoClear', 'alpha', 'scissorTest']) assert.equal(state[key], original[key], key);
    for (const key of ['clear', 'viewport', 'scissor']) assert.deepEqual(state[key], original[key], key);
    assert.equal(state.orient, camera); assert.equal(state.reflecting, false);
  };
  return { water, scene, camera, sim, renderer, orient, state, restored,
    failRender: () => { renderError = true; }, failCompile: () => { compileError = true; },
    dispose: () => { water.dispose(); outer.dispose(); } };
}

test('planar pass restores renderer state and camera-dependent particle orientation', () => {
  const f = fixture();
  try {
    f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient);
    f.restored(); assert.equal(f.state.renders, 1); assert.equal(f.water.diagnostics().reflectionFrames, 1);
  } finally { f.dispose(); }
});
test('throwing planar pass restores every saved renderer state and main orientation', () => {
  const f = fixture();
  try {
    f.failRender();
    assert.throws(() => f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient), /reflection render failed/);
    f.restored(); assert.equal(f.water.diagnostics().reflectionFrames, 0);
  } finally { f.dispose(); }
});
test('reflection warm-up restores state after both successful and failed compilation', async () => {
  for (const fails of [false, true]) {
    const f = fixture();
    try {
      if (fails) f.failCompile();
      const work = f.water.warmup(f.renderer, f.scene, f.camera, 'ultra', f.orient);
      if (fails) await assert.rejects(work, /reflection compile failed/); else await work;
      f.restored(); assert.equal(f.state.renders, 0);
    } finally { f.dispose(); }
  }
});
test('quality, resize and visibility enforce one lazy target or no target', () => {
  const f = fixture();
  try {
    assert.equal(f.water.target, null);
    f.sim.quality = 'low'; f.water.update(f.renderer, f.scene, f.camera, f.sim, true, false, f.orient);
    assert.equal(f.water.target, null); assert.equal(f.water.diagnostics().reflectionHz, 0);
    f.sim.quality = 'ultra'; f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient);
    const target = f.water.target; assert.equal(target.width, 512); assert.equal(target.height, 320);
    f.sim.time += .01; f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient);
    assert.equal(f.state.renders, 1, 'throttle suppresses an early update');
    f.camera.aspect = .5; f.camera.updateProjectionMatrix(); f.water.resize(f.camera);
    f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient);
    assert.equal(f.water.target, target); assert.equal(target.width, 256); assert.equal(target.height, 512);
    f.sim.quality = 'standard'; f.sim.time += 1;
    f.water.update(f.renderer, f.scene, f.camera, f.sim, true, true, f.orient);
    assert.equal(f.water.target, target); assert.equal(target.width, 128); assert.equal(target.height, 256);
    assert.equal(f.water.diagnostics().reflectionHz, 15);
    let disposed = false; target.addEventListener('dispose', () => { disposed = true; });
    f.water.update(f.renderer, f.scene, f.camera, f.sim, false, false, f.orient);
    assert.equal(disposed, true); assert.equal(f.water.target, null);
    const d = f.water.diagnostics();
    assert.equal(d.waterVisible, false); assert.equal(d.reflectionTargets, 0);
    assert.equal(d.reflectionWidth, 0); assert.equal(d.reflectionHeight, 0); assert.equal(d.reflectionHz, 0);
    f.restored();
  } finally { f.dispose(); }
});
