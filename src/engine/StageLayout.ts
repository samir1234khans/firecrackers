export type StageRect = { x: number; y: number; width: number; height: number };
export type StageLayout = {
  viewport: StageRect; safe: { top: number; right: number; bottom: number; left: number };
  controls: Record<string, StageRect>; heroRect: StageRect; panelOpen: boolean;
  launchArea: StageRect; burstCanopy: StageRect; reflectionBand: StageRect;
};
/** Layout measurement is shared by camera, Canvas, drag placement and browser assertions. */
export function measureStage(host: HTMLElement, interactive = true): StageLayout {
  const box = host.getBoundingClientRect(), parent = host.parentElement!;
  const style = getComputedStyle(parent);
  const safe = { top: parseFloat(style.getPropertyValue('--safe-top')) || 0, right: parseFloat(style.getPropertyValue('--safe-right')) || 0, bottom: parseFloat(style.getPropertyValue('--safe-bottom')) || 0, left: parseFloat(style.getPropertyValue('--safe-left')) || 0 };
  const controls: Record<string, StageRect> = {};
  let left = safe.left, right = box.width - safe.right;
  if (interactive) for (const element of parent.querySelectorAll<HTMLElement>('[data-edge]')) {
    const r = element.getBoundingClientRect(), key = element.dataset.edge!;
    controls[key] = { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height };
    if (key.endsWith('left')) left = Math.max(left, r.right - box.left + 4);
    else right = Math.min(right, r.left - box.left - 4);
  }
  // Symmetry keeps the viewing direction stable even when one side has longer labels.
  const inset = Math.max(left, box.width - right);
  const heroRect = { x: inset, y: safe.top, width: Math.max(1, box.width - inset * 2), height: Math.max(1, box.height - safe.top - safe.bottom) };
  // The phone dock is intentionally below the hero. When opened on a short phone,
  // reserve its actual bounds so a release on a dock control cannot count as sky.
  const dock = interactive ? parent.querySelector<HTMLElement>('[data-family-dock]') : null;
  const dockBox = dock?.getBoundingClientRect();
  if (dockBox && dockBox.width && dockBox.height) controls.dock = {
    x: dockBox.left - box.left, y: dockBox.top - box.top, width: dockBox.width, height: dockBox.height,
  };
  const canopyY = heroRect.y + heroRect.height * .08;
  const canopyHeight = dock?.dataset.open === 'true' && dockBox
    ? Math.max(1, Math.min(heroRect.height * .64, dockBox.top - box.top - canopyY - 8))
    : heroRect.height * .64;
  const layout = { viewport: { x: box.left, y: box.top, width: box.width, height: box.height }, safe, controls, heroRect,
    panelOpen: parent.dataset.overlay !== 'none',
    launchArea: { ...heroRect, y: heroRect.y + heroRect.height * .82, height: heroRect.height * .14 },
    burstCanopy: { ...heroRect, y: canopyY, height: canopyHeight },
    reflectionBand: { ...heroRect, y: heroRect.y + heroRect.height * .75, height: heroRect.height * .25 } };
  parent.dataset.heroRect = JSON.stringify(heroRect);
  return layout;
}
/** Shared world framing, independent of DOM decks and stable for a whole viewport. */
export function stageFraming(layout: StageLayout) {
  const { heroRect, viewport } = layout;
  // Portrait phones use more of their narrow corridor so the burst reads above the water.
  const widthSpan = viewport.width / viewport.height < .72 ? 88 : 105;
  const scale = Math.max(.1, Math.min(heroRect.width / widthSpan, heroRect.height * .70 / 112));
  return { scale, span: viewport.height / scale, baseline: heroRect.y + heroRect.height * .84 };
}
