import type { SkyState } from '../engine/SkyState';

export const CELESTIAL_LIMITS = Object.freeze({
  nearParallaxPixels: 3,
  responseRadiusPixels: 72,
  meteorIntervalSeconds: 36,
  meteorDurationSeconds: 1.4,
  maximumMeteors: 1,
});

/** One reusable output for both renderers; the shared world owns all elapsed time. */
export type CelestialFrame = {
  time: number; motionAllowed: boolean; engagement: number;
  farX: number; farY: number; dustX: number; dustY: number; nearX: number; nearY: number;
  twinkle: number; pointerX: number; pointerY: number;
  meteor: { active: boolean; headX: number; headY: number; tailX: number; tailY: number; opacity: number };
};

export function createCelestialFrame(): CelestialFrame {
  return { time: 0, motionAllowed: false, engagement: 0,
    farX: 0, farY: 0, dustX: 0, dustY: 0, nearX: 0, nearY: 0,
    twinkle: 1, pointerX: .5, pointerY: .25,
    meteor: { active: false, headX: 0, headY: 0, tailX: 0, tailY: 0, opacity: 0 } };
}

const unit = (n: number, fallback = 0) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
const seededUnit = (epoch: number, salt: number) => {
  let value = Math.imul((epoch + 1) ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
};

/** Cached scalar math only: no random stream mutation, timers, arrays or frame allocations. */
export function updateCelestialFrame(out: CelestialFrame, state: Readonly<SkyState>,
  width: number, height: number, motionAllowed: boolean, reducedFlashes: boolean): void {
  out.motionAllowed = motionAllowed && state.motionAllowed;
  out.time = out.motionAllowed && Number.isFinite(state.time) ? Math.max(0, state.time) : 0;
  out.engagement = out.motionAllowed ? unit(state.engagement) : 0;
  out.pointerX = unit(state.pointerX, .5); out.pointerY = unit(state.pointerY, .25);
  let x = (out.pointerX - .5) * 2, y = (out.pointerY - .5) * 2;
  const length = Math.max(1, Math.hypot(x, y));
  x = out.engagement ? x / length * out.engagement : 0;
  y = out.engagement ? y / length * out.engagement : 0;
  out.farX = x * .55; out.farY = y * .55;
  out.dustX = x * 1.35; out.dustY = y * 1.35;
  // Near-field pointer displacement stays inside a 3 CSS pixel radius at every viewport/DPR.
  out.nearX = x * CELESTIAL_LIMITS.nearParallaxPixels;
  out.nearY = y * CELESTIAL_LIMITS.nearParallaxPixels;
  out.twinkle = 1 + Math.sin(out.time * .27 + .4) * (out.motionAllowed ? .025 : 0);
  const meteor = out.meteor;
  meteor.active = false; meteor.opacity = 0;
  if (!out.motionAllowed || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return;
  const epoch = Math.floor(out.time / CELESTIAL_LIMITS.meteorIntervalSeconds);
  const age = out.time - epoch * CELESTIAL_LIMITS.meteorIntervalSeconds - 9;
  if (age < 0 || age >= CELESTIAL_LIMITS.meteorDurationSeconds) return;
  const progress = age / CELESTIAL_LIMITS.meteorDurationSeconds;
  const left = seededUnit(epoch, 6102026) < .5;
  const startX = left ? .14 + seededUnit(epoch, 883) * .15 : .68 + seededUnit(epoch, 883) * .12;
  const direction = left ? 1 : -1;
  const travel = .11 + seededUnit(epoch, 947) * .055;
  // The full stroke stays above the .08 hero canopy boundary, away from its center.
  const startY = .018 + seededUnit(epoch, 127) * .012;
  meteor.headX = (startX + direction * travel * progress) * width;
  meteor.headY = (startY + progress * .025) * height;
  meteor.tailX = meteor.headX - direction * Math.min(34, width * .035);
  meteor.tailY = meteor.headY - Math.min(8, height * .007);
  const envelope = Math.sin(progress * Math.PI);
  const opacity = envelope * envelope * .14 * (reducedFlashes ? .55 : 1);
  meteor.active = opacity > .0001;
  meteor.opacity = meteor.active ? opacity : 0;
}

export function celestialDiagnostics(frame: CelestialFrame) {
  return { skyMotionTime: frame.time, skyMotionAllowed: frame.motionAllowed,
    skyPointerX: frame.pointerX, skyPointerY: frame.pointerY, skyEngagement: frame.engagement,
    skyNearParallaxX: frame.nearX, skyNearParallaxY: frame.nearY,
    skyMaximumParallaxPixels: CELESTIAL_LIMITS.nearParallaxPixels,
    skyActiveMeteors: Number(frame.meteor.active), skyMaximumMeteors: CELESTIAL_LIMITS.maximumMeteors,
    skyMeteorOpacity: frame.meteor.opacity, skyMeteorIntervalSeconds: CELESTIAL_LIMITS.meteorIntervalSeconds };
}
