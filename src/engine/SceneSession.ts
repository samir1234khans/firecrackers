import type { RendererPort } from './RendererPort';
import type { SeaAudienceSession } from '../graphics/SeaAudienceSession';
/** Restore the authoritative launch camera before resolving an admission profile. */
export function restoreSkyView(renderer: RendererPort | null, sea: SeaAudienceSession) {
 const active=sea.focus!==null||Boolean(renderer?.boatViewActive?.());
 sea.setFocus(null);
 if(!active)return;
 renderer?.resetBoatView?.();
 renderer?.render();
}
