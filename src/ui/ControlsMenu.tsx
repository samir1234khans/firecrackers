import { Play, Camera, Clapperboard, Library, HelpCircle, Maximize, Minimize, Settings2 } from 'lucide-react';

type Props = {
  onWatch: () => void; fullscreen: boolean; onBrowse: () => void; onStudio: () => void; onCapture: () => void;
  onSettings: () => void;
  onFullscreen: () => void; onHelp: () => void;
};
export function ControlsMenu(p: Props) {
  return <nav className='controls-menu' aria-label='Controls'>
    <button type='button' onClick={p.onWatch}><Play size={18} aria-hidden='true'/><span>Just watch</span></button>
    <button type='button' onClick={p.onBrowse}><Library size={18} aria-hidden='true'/><span>Browse fireworks</span></button>
    <button type='button' onClick={p.onStudio}><Clapperboard size={18} aria-hidden='true'/><span>Night studio</span></button>
    <button type='button' onClick={p.onCapture}><Camera size={18} aria-hidden='true'/><span>Capture a moment</span></button>
    <button type='button' onClick={p.onSettings}><Settings2 size={18} aria-hidden='true'/><span>Settings</span></button>
    <button type='button' onClick={p.onFullscreen}>{p.fullscreen ? <Minimize size={18} aria-hidden='true'/> : <Maximize size={18} aria-hidden='true'/>}<span>{p.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span></button>
    <button type='button' onClick={p.onHelp}><HelpCircle size={18} aria-hidden='true'/><span>Help</span></button>
  </nav>;
}
