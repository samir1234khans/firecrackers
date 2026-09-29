import type { ShowPreset } from '../engine/catalog.js';
export type DisplayMode = 'interactive' | 'scene' | 'transparent';
export type SafeRect = [
    number,
    number,
    number,
    number
];
export type Presentation = {
    mode: DisplayMode;
    seed: number;
    fps: 30 | 60;
    show: ShowPreset | null;
    protect: boolean;
    safeRect: SafeRect;
};
export const DEFAULT_SAFE_RECT: SafeRect = [.32, .25, .68, .72];
export function parsePresentation(search: string): Presentation {
    const p = new URLSearchParams(search), mode = p.get('display'), show = p.get('show');
    const seed = Number(p.get('seed'));
    let safeRect: SafeRect = [...DEFAULT_SAFE_RECT];
    const supplied = (p.get('safe') || '').split(',').map(Number);
    if (supplied.length === 4 && supplied.every(v => Number.isFinite(v) && v >= 0 && v <= 1) && supplied[0] < supplied[2] && supplied[1] < supplied[3])
        safeRect = supplied as SafeRect;
    return {
        mode: mode === 'scene' || mode === 'transparent' ? mode : 'interactive',
        seed: Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff ? seed : 20260916,
        fps: p.get('fps') === '30' ? 30 : 60,
        show: show === 'calm' || show === 'festival' || show === 'finale' ? show : null,
        protect: p.get('protect') === '1', safeRect,
    };
}
export function presentationLink(base: string, config: Presentation) {
    const url = new URL(base);
    // No arbitrary asset, code or navigation URLs are accepted from the scene configuration.
    url.search = '';
    url.hash = '';
    url.searchParams.set('display', config.mode);
    url.searchParams.set('seed', String(config.seed));
    url.searchParams.set('fps', String(config.fps));
    if (config.show)
        url.searchParams.set('show', config.show);
    if (config.protect) {
        url.searchParams.set('protect', '1');
        url.searchParams.set('safe', config.safeRect.join(','));
    }
    return url.href;
}
