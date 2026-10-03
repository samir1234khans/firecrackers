import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES } from '../.test-build/engine/catalog.js';
import { stageFraming, stageCameraFrame, waterfrontHorizon, measureStage } from '../.test-build/engine/StageLayout.js';
import { resolveScreenLaunchProfile } from '../.test-build/engine/LaunchProfile.js';
import { SHELL_LOCAL_Y } from '../.test-build/engine/LaunchGeometry.js';
import { ROCKET_SCALE } from '../.test-build/engine/FusePath.js';

const viewports = [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
for (const [width,height] of viewports) test(`screen apex and grounded terrace ${width}x${height}`, () => {
  const trayHeight = 76;
  const layout = { viewport: { width,height }, heroRect: { x:0,y:0,width,height:height-trayHeight } };
  layout.unobstructedScene = layout.heroRect;
  const {scale,baseline} = stageFraming(layout);
  const frame = stageCameraFrame(layout,16);
  const tangent = Math.tan(42*Math.PI/360), sine=Math.sin(frame.pitch),cosine=Math.cos(frame.pitch);
  const projectedY=(y,z)=>height*(1-(cosine*(y-frame.centerY)-sine*z)/((frame.distance-sine*(y-frame.centerY)-cosine*z)*tangent))/2;
  const waterY=projectedY(4.65,width/height<.72?-180:-1000);
  assert.ok(Math.abs(waterY/height-waterfrontHorizon(layout,width/height<.72))<1e-9,'stable waterfront horizon');
  assert.ok(projectedY(16-9.8,0)<height-trayHeight,'launch pad ground contact above tray');
  assert.ok(baseline < height-trayHeight, 'ground contact stays above collection');
  for (const family of FAMILIES) {
    const profile = resolveScreenLaunchProfile(layout,family.id,scale,y=>16+(baseline-y)/scale);
    for (const apex of [profile.apex,profile.apexMin,profile.apexMax]) {
      const fraction = (baseline-(apex+SHELL_LOCAL_Y*ROCKET_SCALE[1]-16)*scale)/layout.heroRect.height;
      if (family.id === 'grand-finale') {
        const skyBottom = Math.min(layout.heroRect.height, waterY) - 10;
        const center = fraction * layout.heroRect.height;
        assert.ok(center >= skyBottom * .388 - 1e-7 && center <= skyBottom * .412 + 1e-7, 'finale uses the visible sky, not the old 37% scene cap');
        assert.ok(center - 65 * profile.effectScale * scale * 1.2 >= 0, 'principal crown clears the top');
        assert.ok(center + 112 * profile.effectScale * scale * 1.2 <= waterY, 'falling shell remains above the shore');
      } else assert.ok(fraction >= .31-1e-9 && fraction <= .37+1e-9, `${family.id}: ${fraction}`);
      assert.ok(apex > 16+10);
    }
  }
});
test('resolved admission snapshots flight across resize, placement and selection', () => {
  const sim = new Simulation(442); sim.quality='ultra';
  let profile = {apex:140,apexMin:135,apexMax:145,centerFraction:.34};
  sim.setLaunchProfileResolver(() => profile);
  assert.equal(sim.igniteFamily('sapphire-saturn',.8),true);
  const rocket=sim.committed, before=structuredClone(rocket);
  assert.ok(rocket.top>=135 && rocket.top<=145); assert.equal(Object.isFrozen(rocket.launchProfile),true);
  profile.apexMax=999;
  profile = {apex:190,apexMin:185,apexMax:195,centerFraction:.34};
  sim.setViewport(80,16); sim.select('gold-willow');
  assert.deepEqual(rocket,before,'resize and next selection leave committed trajectory intact');
  assert.equal(sim.igniteFamily('ruby-dahlia'),false);
  for(let i=0;i<1200;i++) sim.advance(1/60);
  assert.equal(sim.igniteFamily('gold-willow'),true);
  assert.ok(sim.committed.top>=185 && sim.committed.top<=195,'future admission uses new projection');
});
test('seeded automatic shows resolve each admission while sky drops retain their point', () => {
  const a=new Simulation(772),b=new Simulation(772);
  for(const sim of [a,b]) {
    sim.quality='ultra'; sim.setLaunchProfileResolver(()=>({apex:130,apexMin:126,apexMax:134,centerFraction:.34}));
    sim.startShow('calm');
    for(let i=0;i<180;i++)sim.advance(1/60);
    assert.ok(sim.rockets.length); assert.ok(sim.rockets.every(r=>r.top>=126&&r.top<=134));
  }
  assert.deepEqual(a.snapshot(),b.snapshot());
  const sim=new Simulation(71);let calls=0;
  sim.setLaunchProfileResolver(()=>{calls++;return {apex:130,apexMin:126,apexMax:134,centerFraction:.34}});
  assert.equal(sim.burstAt('gold-willow',12,64),true); assert.equal(calls,1,'shared admission retains reservations');
  const burst=sim.events.find(e=>e.type==='burst'); assert.equal(burst.x,12);assert.equal(burst.y,64);
});
test('tray reservation and rail bounds stay identical during drag', () => {
  const oldStyle=globalThis.getComputedStyle;
  globalThis.getComputedStyle=()=>({getPropertyValue:()=> '0', display:'block',visibility:'visible',opacity:'1'});
  try {
    const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
    const parent={dataset:{overlay:'none'},querySelector:s=>s==='[data-family-tray]'?{getBoundingClientRect:()=>rect(8,247,96,336)}:s==='[data-control-rail]'?{getBoundingClientRect:()=>rect(319,190,48,144)}:null,querySelectorAll:()=>[]};
    const host={parentElement:parent,getBoundingClientRect:()=>rect(0,0,375,667)};
    const normal=measureStage(host); parent.dataset.dragActive='true'; const dragging=measureStage(host);
    assert.deepEqual(normal,dragging); assert.equal(normal.heroRect.width,375); assert.equal(normal.heroRect.height,591);
    assert.equal(normal.heroRect.x,0,'left collection does not reserve a full-height gutter');
    assert.ok(normal.heroRect.height>normal.tray.y,'scene remains open beside and above the collection');
    assert.ok(normal.launchArea.y+normal.launchArea.height<=591);
    assert.equal(normal.controls.rail.x,319);assert.equal(normal.controls.tray.y,247);
  } finally {globalThis.getComputedStyle=oldStyle}
});
