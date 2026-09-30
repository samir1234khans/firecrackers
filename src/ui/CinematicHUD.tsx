import { Pause, Play, SlidersHorizontal, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { FamilyId } from '../engine/catalog';
import { BottomCollection } from './BottomCollection';
import type { PointerEvent } from 'react';

type Props = {
  available: boolean; phase: string; hidden: boolean;
  selectedId: FamilyId; paused: boolean; soundActive: boolean;
  canLight: boolean; notice: string; committedFamily: string; updateReady: boolean;
  onPause: () => void; onSound: () => void; onControls: () => void;
  canLaunchFamily: (id: FamilyId) => boolean;
  onDragStart: (id: FamilyId, event: PointerEvent<HTMLButtonElement>) => void;
  onLaunchFamily: (id: FamilyId) => void;
};
/** Only the rail buttons and bottom collection receive stage input. */
export function CinematicHUD(p: Props) {
  const state = p.paused ? 'Paused' : !p.available ? 'Loading' : p.phase === 'fuse' ? 'Fuse'
    : ['thrust', 'coast'].includes(p.phase) ? 'Flight' : p.canLight ? 'Ready' : 'Busy';
  return <>
    <div className='stage-brand' aria-label='Firecrackers'><Sparkles size={17} aria-hidden='true'/><h1>Firecrackers<span>.</span></h1></div>
    <section className='control-rail chrome' data-control-rail aria-label='Scene controls' inert={p.hidden || undefined}>
      <button type='button' aria-label={p.paused ? 'Resume scene' : 'Pause scene'} title={p.paused ? 'Resume scene' : 'Pause scene'} onClick={p.onPause}>{p.paused ? <Play size={19}/> : <Pause size={19}/>}</button>
      <button type='button' aria-label={p.soundActive ? 'Mute sound' : 'Enable sound'} title={p.soundActive ? 'Mute sound' : 'Enable sound'} onClick={p.onSound}>{p.soundActive ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
      <button type='button' aria-label={'Controls'} title='Controls' aria-haspopup='dialog' onClick={p.onControls}><SlidersHorizontal size={19}/>{p.updateReady && <i className='update-dot'/>}</button>
    </section>
    <div className='collection-chrome chrome' inert={p.hidden || undefined}>
      <BottomCollection selectedId={p.selectedId} available={p.available} canLaunchFamily={p.canLaunchFamily} onLaunchFamily={p.onLaunchFamily} onDragStart={p.onDragStart} notice={p.notice}/>
    </div>
    <span id='launch-feedback' className='sr-only' role='status'>{state}. {p.committedFamily ? `${p.committedFamily} is committed; selection affects the next launch.` : 'Tap a firework to launch it.'} {p.notice}</span>
  </>;
}
