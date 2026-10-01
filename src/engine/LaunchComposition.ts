import { FAMILIES, ROCKET_PROFILES, clamp } from './catalog.js';
import type { FamilyId } from './catalog.js';
import type { StageLayout } from './StageLayout.js';

export type LaunchPropComposition = {
  readonly modelScale: readonly [number, number, number];
  readonly contactY: number; readonly originY: number; readonly padRadius: number;
  readonly localTop: number; readonly localFoot: number; readonly localRadius: number;
  readonly shellOffset: number; readonly motorOffset: number; readonly standingHeight: number;
};
export type LaunchBounds = { screenMin: number; screenMax: number; worldMin: number; worldMax: number; contactScreenY: number };
export const PROP_CONTACT_Y = 6.82;
export const PROP_FOOT_Y = -2.72;
/** Shared upright model envelope, including each silhouette and the fuse reach. */
export function resolvePropComposition(layout: StageLayout, id: FamilyId, contactScreenY: number, worldHeightAt: (screenY: number) => number): LaunchPropComposition {
  const index = Math.max(0, FAMILIES.findIndex(f => f.id === id)), [radius, height] = ROCKET_PROFILES[index];
  const localTop = 3.25 + 1.625 * height + .58 + .61 * (index === 4 ? 1.16 : 1);
  const total = localTop - PROP_FOOT_Y, { viewport, unobstructedScene } = layout;
  const short = viewport.height < 520;
  const phone = viewport.width < 680;
  const target = short ? 52 : phone ? clamp(unobstructedScene.height * .125, 64, 90)
    : viewport.width < 1024 ? clamp(unobstructedScene.height * .13, 90, 112) : clamp(unobstructedScene.height * .16, 90, 132);
  const standingHeight = target * clamp(total / 8.8, .96, 1.06);
  const modelY = Math.max(.25, (worldHeightAt(contactScreenY - standingHeight) - PROP_CONTACT_Y) / total);
  const modelX = modelY * (3.8 / 3.4);
  return Object.freeze({ modelScale: Object.freeze([modelX, modelY, modelX]) as readonly [number, number, number],
    contactY: PROP_CONTACT_Y, originY: PROP_CONTACT_Y - PROP_FOOT_Y * modelY,
    padRadius: clamp(modelY * 1.55, 1.4, 5), localTop, localFoot: PROP_FOOT_Y, localRadius: Math.max(2.14, radius * .65),
    shellOffset: 3.25 * modelY, motorOffset: 1.57 * modelY, standingHeight });
}
/** Actual lower control footprints limit only the standing prop's usable terrace. */
export function resolveLaunchBounds(layout: StageLayout, composition: LaunchPropComposition, project: (x: number, y: number) => { x: number; y: number }, worldXAt: (screenX: number, screenY: number) => number): LaunchBounds {
  const contact = project(0, composition.contactY), side = project(composition.localRadius * composition.modelScale[0], composition.contactY);
  const padSide = project(composition.padRadius, composition.contactY);
  const margin = Math.max(Math.abs(side.x - contact.x), Math.abs(padSide.x - contact.x)) + 7;
  let screenMin = layout.safe.left + margin, screenMax = layout.viewport.width - layout.safe.right - margin;
  const top = contact.y - composition.standingHeight - 5, bottom = contact.y + 8;
  for (const rect of Object.values(layout.controls)) {
    if (rect.y >= bottom || rect.y + rect.height <= top || rect.width > layout.viewport.width * .7) continue;
    if (rect.x + rect.width / 2 < layout.viewport.width / 2) screenMin = Math.max(screenMin, rect.x + rect.width + margin);
    else screenMax = Math.min(screenMax, rect.x - margin);
  }
  if (screenMax < screenMin + 16) { const center = (screenMin + screenMax) / 2; screenMin = center - 8; screenMax = center + 8; }
  return { screenMin, screenMax, worldMin: worldXAt(screenMin, contact.y), worldMax: worldXAt(screenMax, contact.y), contactScreenY: contact.y };
}

/** QA-only standing envelope at the pad, distinct from an airborne body's bounds. */
export function propProjectionDiagnostics(prop: LaunchPropComposition, x: number, project: (x: number,y: number) => {x:number;y:number}) {
  const left=project(x-prop.localRadius*prop.modelScale[0],prop.contactY),right=project(x+prop.localRadius*prop.modelScale[0],prop.contactY);
  const tip=project(x,prop.originY+prop.localTop*prop.modelScale[1]),foot=project(x,prop.originY+prop.localFoot*prop.modelScale[1]);
  const padContact=project(x,prop.contactY);
  const fuseA=project(x+2.05*prop.modelScale[0],prop.originY+.85*prop.modelScale[1]);
  const fuseB=project(x+.52*prop.modelScale[0],prop.originY+1.7*prop.modelScale[1]);
  return {propBounds:{x:left.x,y:tip.y,width:right.x-left.x,height:foot.y-tip.y},propBoundsPhase:'standing-at-pad',
    padContact,standingHeight:foot.y-tip.y,modelScale:prop.modelScale,padRadius:prop.padRadius,
    fuseBounds:{x:Math.min(fuseA.x,fuseB.x),y:Math.min(fuseA.y,fuseB.y),width:Math.abs(fuseA.x-fuseB.x),height:Math.abs(fuseA.y-fuseB.y)},
    contactWorldY:prop.contactY,originWorldY:prop.originY,shellOffset:prop.shellOffset,motorOffset:prop.motorOffset};
}
