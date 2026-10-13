export type SheetStop = 'closed' | 'peek' | 'work';
export function sheetStops(height: number, width = 0) {
  // Flowing short-screen tools leave the fixed toolbar and bottom margin clear,
  // including when the guest scrolls all the way to the end of the document.
  const work = Math.max(72, Math.min(width >= 700 && height >= 650 ? 320 : 480, height < 650 ? height - 120 : height * .4));
  return { closed: 44, peek: Math.max(52, Math.min(work - 10, height < 550 ? 126 : 176)), work };
}
export function nearestSheetStop(visible: number, velocity: number, stops: ReturnType<typeof sheetStops>): SheetStop {
  const projected = visible - Math.max(-1.5, Math.min(1.5, velocity)) * 130;
  return (['closed', 'peek', 'work'] as const).reduce((best, candidate) => Math.abs(stops[candidate] - projected) < Math.abs(stops[best] - projected) ? candidate : best, 'closed');
}
