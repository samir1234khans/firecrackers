import { Flame, Maximize, Minimize, Pause, Play, Settings2, Sparkles, Volume2, VolumeX, Crosshair } from 'lucide-react';
import { CONFIG_VERSION, FAMILIES } from '../engine/catalog';
import type { FamilyId, ShowPreset } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';

type Props = {
  selected: typeof FAMILIES[number];
  available: boolean;
  phase: string;
  hidden: boolean;
  reducedMotion: boolean;
  selectedId: FamilyId;
  show: ShowPreset | null;
  paused: boolean;
  soundActive: boolean;
  fullscreen: boolean;
  canLight: boolean;
  placement: number;
  notice: string;
  launchBlock: string;
  committedFamily: string;
  launched: number;
  onPause: () => void;
  onSound: () => void;
  onFullscreen: () => void;
  onSettings: () => void;
  onShowDialog: () => void;
  onStartShow: (preset: ShowPreset) => void;
  onManual: () => void;
  onSelect: (id: FamilyId) => void;
  onPlacement: (value: number) => void;
  onIgnite: () => void;
};

const SHORT_NAMES: Record<FamilyId, string> = {
  'gold-willow': 'Willow',
  'multicolor-peony': 'Peony',
  'chrysanthemum': 'Chrysanth.',
  'silver-crossette-crackle': 'Crossette',
  'grand-finale': 'Finale',
};

/** Persistent controls; the launch state and the selected next family are separate. */
export function CinematicHUD({ selected, available, phase, hidden, reducedMotion, selectedId, show, paused, soundActive, fullscreen, canLight, placement, notice, launchBlock, committedFamily, launched, onPause, onSound, onFullscreen, onSettings, onShowDialog, onStartShow, onManual, onSelect, onPlacement, onIgnite }: Props) {
  const busy = launchBlock === 'busy';
  const next = Boolean(committedFamily) && selected.name !== committedFamily;
  const status = !available ? 'Preparing the sky…'
    : paused ? 'Paused. Resume to continue the same firework.'
    : phase === 'fuse' ? `${committedFamily || selected.name}: fuse lit.`
    : phase === 'thrust' ? `${committedFamily || selected.name}: lifting off.`
    : phase === 'coast' ? `${committedFamily || selected.name}: coasting to the burst.`
    : phase === 'burst' ? 'Bursting. Preparing the next firework…'
    : launchBlock === 'capacity' ? 'Let the sky clear a little before the next launch.'
    : show ? `${show === 'calm' ? 'Calm' : show === 'festival' ? 'Festival' : 'Finale'} show is running. Select a style for manual play.`
    : notice || (launched > 0 ? 'Ready again. Let the embers fall, or launch another.' : 'Choose a style, set its position, then launch.');
  const action = !available ? 'Preparing sky…' : paused ? 'Scene paused' : phase === 'fuse' ? 'Fuse lit'
    : phase === 'thrust' || phase === 'coast' ? 'Watch it rise' : busy ? 'Preparing next…'
    : launchBlock === 'capacity' ? 'Waiting for a clear sky' : 'Launch firework';

  return <>
    <header inert={hidden || undefined} className='hud-command flow-command chrome' aria-label='Firecrackers command deck'>
      <div className='flow-brand'><Sparkles size={23} strokeWidth={1.4}/><h1>Firecrackers<span>.</span></h1></div>
      <div className='flow-utilities' aria-label='Scene controls'>
        <button aria-label={soundActive ? 'Mute sound' : 'Enable sound'} title={soundActive ? 'Mute sound' : 'Enable sound'} onClick={onSound}>{soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
        <button aria-label={paused ? 'Resume scene' : 'Pause scene'} title={paused ? 'Resume' : 'Pause'} onClick={onPause}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>
        <button className='flow-fullscreen' aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title='Fullscreen' onClick={onFullscreen}>{fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
        <button aria-label='Open settings' title='Settings' onClick={onSettings}><Settings2 size={18}/></button>
      </div>
      <nav className='flow-modes' aria-label='Show mode'>
        <button className={!show ? 'active' : ''} aria-pressed={!show} disabled={!available} onClick={onManual}>Manual</button>
        <button aria-label='Automatic show' aria-haspopup='dialog' className={show === 'calm' ? 'active' : ''} aria-pressed={show === 'calm'} disabled={!available} onClick={onShowDialog}>Auto show</button>
        <button className={show === 'festival' ? 'active' : ''} aria-pressed={show === 'festival'} disabled={!available} onClick={() => onStartShow('festival')}>Festival</button>
        <button className={show === 'finale' ? 'active' : ''} aria-pressed={show === 'finale'} disabled={!available} onClick={() => onStartShow('finale')}>Finale</button>
      </nav>
    </header>

    <section inert={hidden || undefined} className={`hud-deck-wrap flow-deck-wrap chrome${reducedMotion ? ' still' : ''}`} aria-label='Firework controls'>
      <div className='flow-status' role='status' aria-live='polite'>{status}</div>
      <div className='flow-deck'>
        <div className='flow-families' role='group' aria-label='Five firework styles'>
          {FAMILIES.map(family => <button key={family.id} className={`flow-family${family.id === selectedId ? ' selected' : ''}`} aria-label={family.name} aria-pressed={family.id === selectedId} title={family.name} disabled={!available} onClick={() => onSelect(family.id)}>
            <span className='flow-family-art'><FireworkGlyph family={family.id} color={family.color}/></span>
            <span>{SHORT_NAMES[family.id]}</span>
          </button>)}
        </div>
        <div className='flow-selection'><span>{next ? 'Next' : 'Selected'}</span><strong>{selected.name}</strong></div>
        <div className='flow-bottom'>
          <div className='flow-placement'>
            <label htmlFor='launch-position'>Launch position</label>
            <input id='launch-position' aria-label='Firework position' type='range' min='20' max='80' step='1' value={Math.round(placement * 100)} disabled={!canLight || Boolean(show)} onChange={event => onPlacement(Number(event.target.value) / 100)}/>
            <button aria-label='Place firework center' title='Center the firework' disabled={!canLight || Boolean(show)} onClick={() => onPlacement(.5)}><Crosshair size={18}/></button>
          </div>
          <button className='flow-launch' aria-label='Launch selected firework' aria-describedby='launch-feedback' disabled={!canLight} onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }} onClick={onIgnite}>
            <Flame size={20}/><span>{action}</span><span className='flow-launch-key' aria-hidden='true'>L</span>
          </button>
        </div>
        <div className='flow-footer'><span id='launch-feedback'>{busy ? 'One rocket in flight · your next selection is kept' : paused ? 'Time is stopped' : 'One press · one firework'}</span><span className='flow-build' title='Current build'>{CONFIG_VERSION}</span></div>
      </div>
    </section>
  </>;
}
