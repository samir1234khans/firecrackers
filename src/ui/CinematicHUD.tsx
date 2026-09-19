import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Circle, Flame, Maximize, Minimize, Pause, Play, Settings2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { FAMILIES } from '../engine/catalog';
import type { FamilyId, ShowPreset } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';

type Family = typeof FAMILIES[number];
type Props = {
  selected: Family;
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
  holding: boolean;
  holdProgress: number;
  placement: number;
  notice: string;
  onPause: () => void;
  onSound: () => void;
  onFullscreen: () => void;
  onSettings: () => void;
  onShowDialog: () => void;
  onStartShow: (preset: ShowPreset) => void;
  onManual: () => void;
  onSelect: (id: FamilyId) => void;
  onPlacement: (value: number) => void;
  onHoldStart: () => void;
  onHoldCancel: () => void;
  onIgnite: () => void;
};
type FamilyMeta = { mood: string; description: string; character: [string, string, string] };
const FAMILY_META: Record<FamilyId, FamilyMeta> = {
  'gold-willow': { mood: 'Elegant · Lingering', description: 'A slow golden canopy that hangs, falls and leaves a warm afterglow.', character: ['Golden', 'Long trails', 'Hanging canopy'] },
  'multicolor-peony': { mood: 'Vibrant · Joyful', description: 'A crisp spherical break with jewel-like colour and a cleaner fade.', character: ['Multicolor', 'Short trails', 'Spherical break'] },
  'chrysanthemum': { mood: 'Bold · Radiant', description: 'Dense copper rays with stronger trailing structure and late curvature.', character: ['Copper', 'Trailing rays', 'Radial bloom'] },
  'silver-crossette-crackle': { mood: 'Sharp · Crackling', description: 'Silver parents travel, split spatially and finish with restrained crackle.', character: ['Silver', 'Branching', 'Crackle finish'] },
  'grand-finale': { mood: 'Epic · Layered', description: 'Visible carriers build a finite multi-stage sequence with a golden ending.', character: ['Layered', 'Multiple breaks', 'Golden ending'] },
};

export function CinematicHUD({ selected, available, phase, hidden, reducedMotion, selectedId, show, paused, soundActive, fullscreen, canLight, holding, holdProgress, placement, notice, onPause, onSound, onFullscreen, onSettings, onShowDialog, onStartShow, onManual, onSelect, onPlacement, onHoldStart, onHoldCancel, onIgnite }: Props) {
  const meta = FAMILY_META[selectedId];
  const stageLabel = paused ? 'Scene paused' : !available ? 'Preparing sky' : phase === 'fuse' ? 'Fuse is burning' : phase === 'thrust' || phase === 'coast' ? 'Watch it rise' : 'Ready to light';
  const holdStyle = { '--ignite-progress': `${Math.min(1, holdProgress) * 100}%` } as CSSProperties;
  const startHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !canLight) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onHoldStart();
  };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!canLight || event.repeat) return;
    if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); onIgnite(); }
    if (event.key === ' ') { event.preventDefault(); event.stopPropagation(); onHoldStart(); }
  };
  const keyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ') return;
    event.preventDefault();
    onHoldCancel();
  };
  return <>
    <header inert={hidden || undefined} className='hud-command chrome' aria-label='Firecrackers command deck'>
      <div className='hud-brand'>
        <span className='hud-brand-mark' aria-hidden='true'><Sparkles size={24} strokeWidth={1.35}/></span>
        <span><h1>Firecrackers</h1><small>Cinematic fireworks</small></span>
      </div>
      <nav className='hud-mode-rail glass' aria-label='Show mode'>
        <button className={!show ? 'active' : ''} aria-pressed={!show} disabled={!available} onClick={onManual}>Manual</button>
        <button aria-label='Automatic show' className={show === 'calm' ? 'active' : ''} aria-pressed={show === 'calm'} aria-haspopup='dialog' disabled={!available} onClick={onShowDialog}>Auto show</button>
        <button className={show === 'festival' ? 'active' : ''} aria-pressed={show === 'festival'} disabled={!available} onClick={() => onStartShow('festival')}>Festival</button>
        <button className={show === 'finale' ? 'active' : ''} aria-pressed={show === 'finale'} disabled={!available} onClick={() => onStartShow('finale')}>Finale</button>
      </nav>
      <div className='hud-utilities glass' aria-label='Scene controls'>
        <button className={soundActive ? 'active' : ''} aria-label={soundActive ? 'Mute sound' : 'Enable sound'} title={soundActive ? 'Sound on' : 'Sound off'} onClick={onSound}>
          {soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}<span>{soundActive ? 'Sound' : 'Muted'}</span>
        </button>
        <button aria-label={paused ? 'Resume scene' : 'Pause scene'} title={paused ? 'Resume' : 'Pause'} onClick={onPause}>
          {paused ? <Play size={18}/> : <Pause size={18}/>}<span>{paused ? 'Resume' : 'Pause'}</span>
        </button>
        <button className='hud-utility-icon' aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={onFullscreen}>{fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
        <button className='hud-utility-icon' aria-label='Open settings' onClick={onSettings}><Settings2 size={19}/></button>
      </div>
    </header>
    <aside className='hud-inspector glass chrome' aria-label={`${selected.name} details`}>
      <span className='hud-inspector-glint' aria-hidden='true'/>
      <div className='hud-inspector-preview'><FireworkGlyph family={selectedId} color={selected.color}/></div>
      <p className='hud-inspector-overline'>Selected firework</p>
      <h2>{selected.name}</h2>
      <p className='hud-inspector-mood'>{meta.mood}</p>
      <p className='hud-inspector-copy'>{meta.description}</p>
      <div className='hud-character' aria-label='Effect character'>{meta.character.map(item => <span key={item}>{item}</span>)}</div>
    </aside>
    <section inert={hidden || undefined} className='hud-deck-wrap chrome' aria-label='Firework controls'>
      <div className='hud-status' role='status' aria-live='polite'>{notice}</div>
      <div className='hud-deck glass'>
        <div className='hud-family-rail' role='group' aria-label='Five firework styles'>
          {FAMILIES.map(family => {
            const familyMeta = FAMILY_META[family.id];
            const chosen = selectedId === family.id;
            return <button key={family.id} className={`hud-family${chosen ? ' selected' : ''}`} aria-label={family.name} aria-pressed={chosen} title={family.name} disabled={!available} onClick={() => onSelect(family.id)}>
              <span className='hud-family-art'><FireworkGlyph family={family.id} color={family.color}/></span>
              <span className='hud-family-copy'><strong>{family.short}</strong><small>{familyMeta.mood}</small></span>
              <span className='hud-family-selected' aria-hidden='true'/>
            </button>;
          })}
        </div>
        <div className='hud-action-row'>
          <div className='hud-placement' role='group' aria-label='Firework placement'>
            <span className='hud-control-label'>Position</span>
            <button aria-label='Place firework left' disabled={!canLight} onClick={() => onPlacement(0.28)}><ArrowLeft size={15}/></button>
            <input aria-label='Firework position' type='range' min='20' max='80' step='1' value={Math.round(placement * 100)} disabled={!canLight} onChange={event => onPlacement(Number(event.target.value) / 100)}/>
            <button aria-label='Place firework center' disabled={!canLight} onClick={() => onPlacement(0.5)}><Circle size={8}/></button>
            <button aria-label='Place firework right' disabled={!canLight} onClick={() => onPlacement(0.72)}><ArrowRight size={15}/></button>
          </div>
          <div className='hud-ignite-shell'>
            <button className={`hud-ignite${holding ? ' holding' : ''}${reducedMotion ? ' still' : ''}`} aria-label='Hold to light selected firework' disabled={!canLight} style={holdStyle} onPointerDown={startHold} onPointerUp={onHoldCancel} onPointerCancel={onHoldCancel} onLostPointerCapture={onHoldCancel} onBlur={onHoldCancel} onKeyDown={keyDown} onKeyUp={keyUp}>
              <span className='hud-ignite-core'><Flame size={22}/><strong>{holding ? 'Release to cancel' : 'Hold to ignite'}</strong><small>{holding ? 'Fuse contact' : stageLabel}</small></span>
            </button>
          </div>
          <div className='hud-quick-action'>
            <span className='hud-control-label'>Quick light</span>
            <button className='hud-light-once' aria-label='Light once' onClick={onIgnite} disabled={!canLight}><Flame size={15}/><span>Light once</span></button>
          </div>
        </div>
      </div>
    </section>
  </>;
}
