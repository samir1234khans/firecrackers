import { ChevronUp, ChevronDown, Crosshair, Flame, HelpCircle, Maximize, Minimize, Pause, Play, Settings2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { FAMILIES, familyIndex } from '../engine/catalog';
import type { FamilyId, ShowPreset } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';

type Props = {
  selected: typeof FAMILIES[number]; available: boolean; phase: string; hidden: boolean;
  selectedId: FamilyId; show: ShowPreset | null; paused: boolean; soundActive: boolean;
  fullscreen: boolean; canLight: boolean; notice: string; committedFamily: string; updateReady: boolean;
  onPause: () => void; onSound: () => void; onFullscreen: () => void;
  onSettings: () => void; onShowDialog: () => void; onPicker: () => void;
  onPosition: () => void; onHelp: () => void; onSelect: (id: FamilyId) => void; onIgnite: () => void;
};
/** Six independent edge islands. No container captures input over the stage. */
export function CinematicHUD(p: Props) {
  const next = Boolean(p.committedFamily) && p.selected.name !== p.committedFamily;
  const state = p.paused ? 'Paused' : !p.available ? 'Loading' : p.phase === 'fuse' ? 'Fuse'
    : ['thrust', 'coast'].includes(p.phase) ? 'Flight' : p.canLight ? 'Ready' : 'Busy';
  const cycle = (delta: number) => p.onSelect(FAMILIES[(familyIndex(p.selectedId) + delta + FAMILIES.length) % FAMILIES.length].id);
  const common = { inert: p.hidden || undefined, className: 'edge-group chrome' };
  return <>
    <section {...common} data-edge='top-left' aria-label='Brand and show mode'>
      <div className='edge-brand'><Sparkles size={19}/><h1>Firecrackers<span>.</span></h1></div>
      <button aria-label='Choose show mode' aria-haspopup='dialog' onClick={p.onShowDialog}><span>{p.show === 'calm' ? 'Auto' : p.show ? p.show[0].toUpperCase() + p.show.slice(1) : 'Manual'}</span></button>
    </section>
    <section {...common} data-edge='middle-left' aria-label='Selected firework'>
      <button aria-label='Previous firework' disabled={!p.available} onClick={() => cycle(-1)}><ChevronUp size={16}/></button>
      <button className='edge-selection' aria-label={`Choose firework: ${p.selected.name}${next ? ', next launch' : ''}`} aria-haspopup='dialog' onClick={p.onPicker}>
        <FireworkGlyph family={p.selectedId} color={p.selected.color}/><span>{p.selected.short}</span>
      </button>
      <button aria-label='Next firework' disabled={!p.available} onClick={() => cycle(1)}><ChevronDown size={16}/></button>
      <span className='sr-only' role='status'>{next ? 'Next: ' : 'Selected: '}{p.selected.name}</span>
    </section>
    <section {...common} data-edge='bottom-left' aria-label='Placement and help'>
      <button aria-label='Position firework' aria-haspopup='dialog' disabled={!p.canLight || Boolean(p.show)} onClick={p.onPosition}><Crosshair size={18}/><span className='edge-desktop-label'>Position</span></button>
      <button className='edge-help' aria-label='Help' aria-haspopup='dialog' onClick={p.onHelp}><HelpCircle size={17}/><span className='edge-desktop-label'>Help</span></button>
    </section>
    <section {...common} data-edge='top-right' aria-label='Playback and sound'>
      <button aria-label={p.paused ? 'Resume scene' : 'Pause scene'} onClick={p.onPause}>{p.paused ? <Play size={18}/> : <Pause size={18}/>}</button>
      <button aria-label={p.soundActive ? 'Mute sound' : 'Enable sound'} onClick={p.onSound}>{p.soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
    </section>
    <section {...common} data-edge='middle-right' aria-label='Settings and display'>
      <button aria-label={p.updateReady ? 'Open settings, update available' : 'Open settings'} aria-haspopup='dialog' onClick={p.onSettings}><Settings2 size={18}/>{p.updateReady && <i className='update-dot'/>}</button>
      <button className='edge-fullscreen' aria-label={p.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={p.onFullscreen}>{p.fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
    </section>
    <section {...common} data-edge='bottom-right' aria-label='Launch controls'>
      <button className='edge-launch flow-launch' aria-label='Launch selected firework' aria-describedby='launch-feedback' disabled={!p.canLight} onKeyDown={e => { if (e.repeat && ['Enter', ' '].includes(e.key)) e.preventDefault(); }} onClick={p.onIgnite}><Flame size={21}/><span>Launch</span></button>
      <span className='edge-state' aria-hidden='true'>{state}</span>
      <span id='launch-feedback' className='sr-only' role='status'>{state}. {p.committedFamily ? `${p.committedFamily} is committed; selection affects the next launch.` : 'One press launches one firework.'} {p.notice}</span>
    </section>
  </>;
}
