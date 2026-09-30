import { Crosshair, HelpCircle, Maximize, Minimize, Settings2, Sparkles } from 'lucide-react';

type Props = {
  showLabel: string; fullscreen: boolean; canPosition: boolean;
  onShow: () => void; onPosition: () => void; onSettings: () => void;
  onFullscreen: () => void; onHelp: () => void;
};
export function ControlsMenu(p: Props) {
  return <nav className='controls-menu' aria-label='Controls'>
    <button type='button' onClick={p.onShow}><Sparkles size={18} aria-hidden='true'/><span>Show mode</span><small>{p.showLabel}</small></button>
    <button type='button' disabled={!p.canPosition} onClick={p.onPosition}><Crosshair size={18} aria-hidden='true'/><span>Position</span></button>
    <button type='button' onClick={p.onSettings}><Settings2 size={18} aria-hidden='true'/><span>Settings</span></button>
    <button type='button' onClick={p.onFullscreen}>{p.fullscreen ? <Minimize size={18} aria-hidden='true'/> : <Maximize size={18} aria-hidden='true'/>}<span>{p.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span></button>
    <button type='button' onClick={p.onHelp}><HelpCircle size={18} aria-hidden='true'/><span>Help</span></button>
  </nav>;
}
