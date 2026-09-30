export type StageRect = { x: number; y: number; width: number; height: number };
export type StageLayout = {
  viewport: StageRect; safe: { top: number; right: number; bottom: number; left: number };
  controls: Record<string, StageRect>; heroRect: StageRect; panelOpen: boolean;
  unobstructedScene: StageRect; tray: StageRect | null; rail: StageRect | null;
  collection?: StageRect | null; mode?: StageRect | null; position?: StageRect | null;
  launchArea: StageRect; burstCanopy: StageRect; reflectionBand: StageRect;
};
/** Layout measurement is shared by camera, Canvas, drag placement and browser assertions. */
export function measureStage(host: HTMLElement, interactive = true): StageLayout {
  const box = host.getBoundingClientRect(), parent = host.parentElement!;
  const style = getComputedStyle(parent);
  // Custom properties can retain env() syntax. The invisible CSS ruler's
  // computed padding resolves those insets to pixels without new DOM per move.
  const ruler = parent.querySelector('.collection-space-measure');
  const rulerStyle = ruler ? getComputedStyle(ruler) : null;
  const safe = { top: parseFloat(rulerStyle?.paddingTop ?? style.getPropertyValue('--safe-top')) || 0,
    right: parseFloat(rulerStyle?.paddingRight ?? style.getPropertyValue('--safe-right')) || 0,
    bottom: parseFloat(rulerStyle?.paddingBottom ?? style.getPropertyValue('--safe-bottom')) || 0,
    left: parseFloat(rulerStyle?.paddingLeft ?? style.getPropertyValue('--safe-left')) || 0 };
  const controls: Record<string, StageRect> = {};
  const bounds = (element: HTMLElement | null): StageRect | null => {
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return r.width && r.height ? { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height } : null;
  };
  // Keep real footprints during drags without reserving a full-height left gutter.
  const tray = interactive ? bounds(parent.querySelector('[data-family-tray]')) : null;
  const rail = interactive ? bounds(parent.querySelector('[data-control-rail]')) : null;
  if (tray) controls.tray = tray;
  if (rail) controls.rail = rail;
  const mode = interactive ? bounds(parent.querySelector('[data-mode-control]')) : null;
  const position = interactive ? bounds(parent.querySelector('[data-position-control]')) : null;
  if (mode) controls.mode = mode;
  if (position) controls.position = position;
  if (interactive) for (const [index, element] of [...parent.querySelectorAll<HTMLElement>('[data-stage-control]')].entries()) {
    const r = bounds(element), appearance = getComputedStyle(element);
    if (r && appearance.display !== 'none' && appearance.visibility !== 'hidden' && Number(appearance.opacity) >= .01)
      controls[`control-${index}`] = r;
  }
  if (interactive) for (const [index, element] of [...parent.querySelectorAll<HTMLElement>('[data-control-popup]')].entries()) {
    const r = bounds(element), appearance = getComputedStyle(element);
    if (r && appearance.display !== 'none' && appearance.visibility !== 'hidden') controls[`popup-${index}`] = r;
  }
  const reservedBottom = (interactive ? 76 : 0) + safe.bottom;
  const sceneBottom = box.height - reservedBottom;
  const heroRect = { x: safe.left, y: safe.top, width: Math.max(1, box.width - safe.left - safe.right), height: Math.max(1, sceneBottom - safe.top) };
  const framing = stageFraming({ heroRect, viewport: { width: box.width, height: box.height } });
  const layout: StageLayout = { viewport: { x: box.left, y: box.top, width: box.width, height: box.height }, safe, controls, heroRect,
    unobstructedScene: heroRect, tray, collection: tray, rail, mode, position, panelOpen: Boolean(parent.dataset.overlay && parent.dataset.overlay !== 'none'),
    launchArea: { x: safe.left, y: framing.baseline - Math.max(12, heroRect.height * .045),
      width: heroRect.width, height: Math.max(1, sceneBottom - (framing.baseline - Math.max(12, heroRect.height * .045))) },
    burstCanopy: { ...heroRect, y: heroRect.y + heroRect.height * .06, height: heroRect.height * .64 },
    reflectionBand: { ...heroRect, y: heroRect.y + heroRect.height * .70, height: heroRect.height * .18 } };
  parent.dataset.heroRect = JSON.stringify(heroRect);
  return layout;
}
/** Stable viewport framing. Admission changes apex physics, never camera tracking. */
export function stageFraming(layout: Pick<StageLayout, 'heroRect'> & { viewport: Pick<StageRect, 'width' | 'height'> }) {
  const { heroRect, viewport } = layout;
  const widthSpan = viewport.width / viewport.height < .72 ? 88 : 105;
  const scale = Math.max(.1, Math.min(heroRect.width / widthSpan, heroRect.height * .70 / 112));
  return { scale, span: viewport.height / scale, baseline: heroRect.y + heroRect.height * .92 };
}
/** Resize-only shoreline clearance for the three-row collection on short phones. */
export function waterfrontHorizon(layout: Pick<StageLayout, 'heroRect'> & { viewport: Pick<StageRect, 'width' | 'height'> }, phone: boolean) {
  return Math.min(phone ? .72 : .5, (layout.heroRect.y + layout.heroRect.height - 40) / layout.viewport.height);
}

/** Fit two stationary world anchors at resize: foreground ground and distant
 * water edge. Tray clearance must not lift the waterfront horizon. The solver
 * does not depend on any rocket, and is never evaluated during flight frames. */
export function stageCameraFrame(layout: Pick<StageLayout, 'heroRect'> & { viewport: Pick<StageRect, 'width' | 'height'> }, ground: number, fov = 42) {
  const framing = stageFraming(layout), { viewport } = layout;
  const phone = viewport.width / viewport.height < .72;
  const horizon = waterfrontHorizon(layout, phone);
  const waterZ = phone ? -180 : -1000;
  const tangent = Math.tan(fov * Math.PI / 360), distance = framing.span / (2 * tangent);
  const groundNdc = 1 - 2 * framing.baseline / viewport.height, waterNdc = 1 - 2 * horizon;
  const centerAt = (pitch: number, y: number, z: number, ndc: number) => {
    const s = Math.sin(pitch), c = Math.cos(pitch);
    return y - (ndc * tangent * distance + (s - ndc * tangent * c) * z) / (c + ndc * tangent * s);
  };
  const error = (pitch: number) => centerAt(pitch, ground, 0, groundNdc) - centerAt(pitch, 4.65, waterZ, waterNdc);
  let low = -.6, high = .6, lowError = error(low);
  for (let step = 0; step < 40; step++) {
    const mid = (low + high) / 2, midError = error(mid);
    if (lowError * midError <= 0) high = mid;
    else { low = mid; lowError = midError; }
  }
  const pitch = (low + high) / 2;
  return { ...framing, distance, pitch, centerY: centerAt(pitch, ground, 0, groundNdc), horizon };
}
