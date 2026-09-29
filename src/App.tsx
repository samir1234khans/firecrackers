import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Flame, Hand, Maximize, Pause, Play, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, Wind } from 'lucide-react';
import { FAMILIES, CONFIG_VERSION, familyKeyIndex } from './engine/catalog';
import type { FamilyId, ShowPreset } from './engine/catalog';
import { useWorld } from './engine/useWorld';
import { defaults, loadPreferences, savePreferences } from './platform/preferences';
import type { Preferences } from './platform/preferences';
import { usePlatform } from './platform/usePlatform';
import { Dialog, Toggle } from './ui/Dialog';
import { CinematicHUD } from './ui/CinematicHUD';
import './styles/app.css';
import './styles/cinematic.css';
import './styles/hud-v3.css';
import { parsePresentation } from './platform/presentation';
import { PresentationSettings } from './ui/PresentationSettings';
import { FamilyPicker } from './ui/FamilyPicker';
import { PanelNav } from './ui/PanelNav';
import './styles/completion.css';
import './styles/flow.css';
import './styles/recovery.css';
import './styles/stage.css';

type Overlay = 'help' | 'settings' | 'show' | 'reset' | 'picker' | 'position' | null;

export default function App() {
  const [presentation, setPresentation] = useState(() => parsePresentation(location.search));
  const [prefs, setPrefs] = useState(loadPreferences);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [epoch, setEpoch] = useState(0);
  const [hidden, setHidden] = useState(() => parsePresentation(location.search).mode !== 'interactive');
  const [notice, setNotice] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const [positionDraft, setPositionDraft] = useState(.5);
  const [pickerReady, setPickerReady] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [drag, setDrag] = useState<{ id: FamilyId; x: number; y: number; valid: boolean } | null>(null);
  const dragRef = useRef(drag); dragRef.current = drag;
  const revealTap = useRef(false);
  const notify = useCallback((text: string) => setNotice(text), []);
  const world = useWorld(host, prefs, epoch, notify, presentation);
  const platform = usePlatform(notify);
  const state = world.snapshot;
  const worldRef = useRef(world);
  worldRef.current = world;
  const context = useRef({ overlay, prefs, state, dockOpen });
  context.current = { overlay, prefs, state, dockOpen };
  const change = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs(p => ({ ...p, [key]: value })), []);
  const wake = () => setHidden(false);
  const open = (next: Overlay) => { setDockOpen(false); setPickerReady(world.sim.current.ready && world.ready); setPositionDraft(world.sim.current.placement); world.setOverlay(true); platform.releaseWake(); setOverlay(next); wake(); };
  const close = () => { setDrag(null); dragRef.current = null; setOverlay(null); world.setOverlay(false); wake(); };
  const finishPosition = () => { close(); world.sim.current.setPlacement(positionDraft); world.refresh(); };
  const drop = (id: FamilyId, x: number, y: number) => {
    if (!pickerReady) return;
    close();
    if (world.drop(id, x, y)) change('family', id);
  };
  const startDrag = (id: FamilyId, event: React.PointerEvent<HTMLButtonElement>, fromPicker = false) => {
    if (event.button !== 0 || !(fromPicker ? pickerReady : world.ready && !world.error && !overlay && world.sim.current.canLaunchFamily(id))) return;
    const button = event.currentTarget, startX = event.clientX, startY = event.clientY;
    button.setPointerCapture(event.pointerId);
    let moved = false;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 9) return;
      moved = true;
      const valid = world.dropTarget(e.clientX, e.clientY) !== null && (fromPicker ? pickerReady : world.sim.current.canLaunchFamily(id));
      const value = { id, x: e.clientX, y: e.clientY, valid }; dragRef.current = value; setDrag(value);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      button.removeEventListener('pointermove', move); button.removeEventListener('pointerup', end); button.removeEventListener('pointercancel', cancel);
      const value = dragRef.current; dragRef.current = null; setDrag(null);
      if (moved && e.type === 'pointerup') { const suppress = (ev: MouseEvent) => { ev.preventDefault(); ev.stopImmediatePropagation(); }; button.addEventListener('click', suppress, { capture: true, once: true }); setTimeout(() => button.removeEventListener('click', suppress, true), 600); }
      if (value?.valid && e.type === 'pointerup') {
        if (fromPicker) drop(id, e.clientX, e.clientY);
        else if (!overlay && world.ready && !world.error && world.sim.current.canLaunchFamily(id) && world.drop(id, e.clientX, e.clientY)) {
          change('family', id);
          setDockOpen(false);
          setNotice('');
        }
      }
    };
    const cancel = (e: PointerEvent) => end(e);
    button.addEventListener('pointermove', move); button.addEventListener('pointerup', end); button.addEventListener('pointercancel', cancel);
  };
  const select = (id: FamilyId) => {
    if (world.sim.current.select(id)) change('family', id);
    world.refresh();
    setNotice('');
    wake();
  };

  useEffect(() => { savePreferences(prefs); }, [prefs]);
  useEffect(() => { if (state.paused) platform.releaseWake(); }, [state.paused, platform.releaseWake]);
  useEffect(() => { world.setOverlay(Boolean(overlay)); }, [overlay, world.setOverlay]);
  useEffect(() => {
    document.documentElement.dataset.output = presentation.mode;
    return () => { delete document.documentElement.dataset.output; };
  }, [presentation.mode]);
  useEffect(() => { if (state.bursts > 0 && !prefs.onboarded) change('onboarded', true); }, [state.bursts, prefs.onboarded, change]);
  // Keep the command deck present during interactive play. Nightfall's persistent controls are
  // clearer after a burst and avoid the reveal-tap race that made the newer UI feel unresponsive.
  useEffect(() => {
    if (presentation.mode === 'interactive') setHidden(false);
  }, [presentation.mode]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const c = context.current;
      setHidden(false);
      if (c.overlay) return;
      if (event.key === 'Escape') {
        if (c.dockOpen) { event.preventDefault(); setDockOpen(false); }
        return;
      }
      if (event.target instanceof HTMLElement && event.target.closest('button,input,select,textarea')) return;
      const w = worldRef.current;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === ' ') {
        event.preventDefault();
        w.pause(!w.sim.current.paused);
      }
      if (event.key.toLowerCase() === 'l') w.ignite();
      if (familyKeyIndex(event.key) >= 0) {
        const family = FAMILIES[familyKeyIndex(event.key)];
        if (w.sim.current.select(family.id)) change('family', family.id);
        w.refresh();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        w.sim.current.stopShow(false);
        w.sim.current.setPlacement(w.sim.current.placement + (event.key === 'ArrowLeft' ? -0.05 : 0.05));
        w.refresh();
      }
      if (event.key.toLowerCase() === 'm') void w.configureSound(!w.soundActive).then(active => change('sound', active));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [change]);

  const selected = FAMILIES.find(f => f.id === state.selected) || FAMILIES[0];
  const canLight = world.ready && !world.error && state.ready && !overlay;
  const toggleSound = async () => { const active = await world.configureSound(!world.soundActive); change('sound', active); };
  const resumeOrPause = () => { world.pause(!state.paused); if (!state.paused) platform.releaseWake(); wake(); };
  const ignite = () => { setNotice(''); world.ignite(); };
  const igniteFamily = (id: FamilyId) => {
    setNotice('');
    if (world.igniteFamily(id)) { change('family', id); setDockOpen(false); }
  };
  const startShow = (preset: ShowPreset) => {
    change('preset', preset);
    world.start(preset);
    setOverlay(null);
    world.setOverlay(false);
    wake();
  };
  const returnToManual = () => {
    world.sim.current.stopShow();
    world.refresh();
    wake();
  };
  const reset = () => {
    setPresentation(p => ({ ...p, mode: 'interactive', show: null }));
    world.reset();
    void world.configureSound(false);
    platform.releaseWake();
    setPrefs(defaults());
    setNotice('');
    setOverlay(null);
    setHidden(false);
  };

  return <main
    data-version={CONFIG_VERSION}
    data-backend={world.backend}
    data-ready={world.ready}
    data-overlay={overlay || 'none'}
    data-phase={state.phase}
    data-launched={state.launched}
    data-bursts={state.bursts}
    data-paused={state.paused}
    data-display={presentation.mode}
    data-hosted-preview={location.hostname.endsWith('.appdeploy.ai')}
    data-launch-block={state.launchBlock}
    data-committed-id={state.committedId}
    className={`fireworks-app${hidden ? ' controls-hidden' : ''}${prefs.reducedMotion ? ' reduced-motion' : ''}${presentation.mode !== 'interactive' ? ' presentation-mode' : ''}`}
    onPointerMove={wake}
    onPointerDownCapture={event => {
      revealTap.current = false;
      if (overlay) return;
      if (hidden && !(event.target as HTMLElement).closest('[data-always]')) {
        event.preventDefault();
        event.stopPropagation();
        revealTap.current = true;
        wake();
      }
    }}
    onClickCapture={event => {
      if (revealTap.current) {
        event.preventDefault();
        event.stopPropagation();
        revealTap.current = false;
      }
    }}
    onFocusCapture={wake}
  >
    <div ref={host} className='scene-host' aria-hidden='true'/>
    <CinematicHUD
      selected={selected}
      available={world.ready && !world.error && !overlay}
      phase={state.phase}
      hidden={hidden}
      selectedId={state.selected}
      show={state.show}
      paused={state.paused}
      soundActive={world.soundActive}
      fullscreen={platform.fullscreen}
      canLight={canLight}
      notice={notice}
      committedFamily={state.committedFamily}
      updateReady={platform.updateReady}
      onPause={resumeOrPause}
      onSound={() => void toggleSound()}
      onFullscreen={() => void platform.toggleFullscreen()}
      onSettings={() => open('settings')}
      onShowDialog={() => open('show')}
      onPicker={() => open('picker')}
      onPosition={() => open('position')}
      onHelp={() => open('help')}
      onSelect={select}
      onIgnite={ignite}
      canLaunchFamily={id => world.ready && !world.error && !overlay && world.sim.current.canLaunchFamily(id)}
      onDragStart={(id, event) => startDrag(id, event)}
      onLaunchFamily={igniteFamily}
      dockOpen={dockOpen}
      onToggleDock={() => setDockOpen(open => !open)}
      onCloseDock={() => setDockOpen(false)}
    />
    {drag && overlay !== 'picker' && <div className={`burst-drop-target${drag.valid ? ' valid' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden='true'><Sparkles size={26}/><span>{drag.valid ? 'Release to burst' : 'Move into the sky'}</span></div>}

    {!world.ready && !world.error && <div className='loading-state' role='status'><span className='loading-spark'/><span>Preparing the night sky</span><small>Graphics will switch automatically when needed.</small><a href='?backend=canvas'>Open compatibility mode</a></div>}
    {world.error && <section className='recovery glass' role='alert'><h2>The sky needs a fresh start.</h2><p>{world.error}</p><div className='button-row'><button className='primary-button' onClick={() => { world.reset(); change('quality', 'low'); setEpoch(e => e + 1); }}>Retry with lower quality</button><a className='secondary-button' href='?backend=canvas'>Use compatibility graphics</a><button className='text-button' onClick={() => location.reload()}>Reload website</button><button className='text-button' onClick={() => open('settings')}>Settings</button></div></section>}
    <div className='reveal-controls' aria-hidden={!hidden}>{hidden && <>
      <button className='icon-button glass' aria-label='Show controls' onClick={wake}><Settings2 size={18}/></button>
      <button className='icon-button glass' aria-label={state.paused ? 'Resume scene' : 'Pause scene'} data-always='true' onClick={resumeOrPause}>{state.paused ? <Play size={18}/> : <Pause size={18}/>}</button>
      <button className='icon-button glass' aria-label={world.soundActive ? 'Mute sound' : 'Enable sound'} data-always='true' onClick={() => void toggleSound()}>{world.soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
    </>}</div>

    {overlay === 'picker' && <Dialog variant='picker' title='Choose a firework' onClose={close} dragging={Boolean(drag)}>
      <p className='intro-copy'>Tap a style for your next rocket. Drag a style into the sky for an instant burst.</p>
      <FamilyPicker selectedId={state.selected} available={world.ready} onSelect={id => { select(id); close(); }} onDragStart={(id, event) => startDrag(id, event, true)}/>
      <button className='secondary-button full' disabled={!pickerReady} onClick={() => { const r = world.heroRect(); drop(state.selected, r.x + r.width / 2, r.y + r.height * .38); }}>Burst selected style in center</button>
      {!pickerReady && <p className='fine-print'>Resume the scene and let the current rocket finish to drag a new burst.</p>}
      {drag && <div className={`burst-drop-target${drag.valid ? ' valid' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden='true'><Sparkles size={26}/><span>{drag.valid ? 'Release to burst' : 'Move into the sky'}</span></div>}
    </Dialog>}
    {overlay === 'position' && <Dialog variant='position' title='Place the next rocket' onClose={close}>
      <p className='intro-copy'>Choose a position along the launch terrace.</p>
      <input className='position-slider' aria-label='Firework position' type='range' min='.2' max='.8' step='.01' value={positionDraft} onChange={e => setPositionDraft(Number(e.target.value))}/>
      <div className='position-presets'>{[['Left', .2], ['Center', .5], ['Right', .8]].map(([label, value]) => <button key={label} onClick={() => setPositionDraft(Number(value))}>{label}</button>)}</div>
      <button className='primary-button full' onClick={finishPosition}>Set position</button>
      <button className='text-button full' onClick={() => setOverlay('help')}>Help</button>
    </Dialog>}

    {overlay === 'help' && <Dialog variant='help' title='A little spark. A whole night sky.' onClose={close}>
      <p className='intro-copy'>Take a moment out of the everyday. This night is yours to light.</p>
      <div className='help-steps'><div><Sparkles/><span><strong>Choose your firework</strong><small>Classics sit on the left and Grand styles on the right. On a phone, open the small dock at the bottom.</small></span></div><div><Hand/><span><strong>Drag into the sky</strong><small>Drag any style from a side list or the phone dock into the sky for an instant burst. Use Position for a rocket flight.</small></span></div><div><Flame/><span><strong>Launch it. Look up.</strong><small>Hover or focus a style for its nearby Launch action, or use the main Launch button. One press lights one fuse.</small></span></div></div>
      <Toggle label='Reduced flashes' detail='Softer light, with the same firework shapes.' checked={prefs.reducedFlashes} onChange={v => change('reducedFlashes', v)}/>
      <Toggle label='Reduced interface motion' checked={prefs.reducedMotion} onChange={v => change('reducedMotion', v)}/>
      <p className='fine-print'>Flashing visual effects. Sound starts off. Pause is always within reach. This is a digital simulation only.</p>
      <button className='primary-button full' onClick={close}>Enter the night</button>
      <button className='text-button full' onClick={() => { change('onboarded', true); close(); }}>Skip introduction</button>
      <details className='keyboard-help'><summary>Keyboard controls</summary><p>1–5: classics · 6–9, 0: grand collection · Left/Right: place · L: launch · Space: pause · M: sound · Escape: close a panel. Tab moves through every control.</p></details>
    </Dialog>}

    {overlay === 'show' && <Dialog variant='show' title='Let the sky take over.' onClose={close}>
      <p className='intro-copy'>A gently directed display. No two nights quite the same.</p>
      <button className='secondary-button full' onClick={() => { returnToManual(); close(); }}>Manual</button>
      <fieldset className='show-presets'><legend className='sr-only'>Show pacing</legend>{([
        { id: 'calm', name: 'Calm', description: 'Room to breathe between every burst.', icon: <Wind size={21}/> },
        { id: 'festival', name: 'Festival', description: 'A gathering of colour, rhythm and light.', icon: <Sparkles size={21}/> },
        { id: 'finale', name: 'Finale', description: 'A 32-second flourish, then a quiet sky.', icon: <Flame size={21}/> },
      ] as const).map(p => <label key={p.id} className={`preset${prefs.preset === p.id ? ' chosen' : ''}`}><input type='radio' name='preset' value={p.id} checked={prefs.preset === p.id} onChange={() => change('preset', p.id as ShowPreset)}/>{p.icon}<span><strong>{p.name}</strong><small>{p.description}</small></span></label>)}</fieldset>
      <p className='fine-print'>Choosing a firework yourself stops future automatic launches. Manual controls stay available while you watch.</p>
      <button className='primary-button full' disabled={!world.ready || Boolean(world.error)} onClick={() => startShow(prefs.preset)}>Start show <Play size={17}/></button>
      {state.show && <button className='text-button full' onClick={() => { world.sim.current.stopShow(); close(); }}>Stop automatic show</button>}
    </Dialog>}

    {overlay === 'settings' && <Dialog variant='settings' title='Make yourself comfortable.' onClose={close}>
      <PanelNav reducedMotion={prefs.reducedMotion}/>
      {notice && <p className='settings-notice' role='status'>{notice}</p>}
      <div className='settings-group' id='settings-sound'><h3>Sound & feel</h3>
        <Toggle label='Sound' detail='Original spatial booms, hiss and crackle.' checked={world.soundActive} onChange={() => void toggleSound()}/>
        <label className='volume-setting'><span>Volume</span><input aria-label='Volume' type='range' min='0' max='0.8' step='0.01' value={prefs.volume} onChange={event => change('volume', Number(event.target.value))}/></label>
        <Toggle label='Quiet night ambience' checked={prefs.ambience} onChange={v => change('ambience', v)}/>
        <Toggle label='Gentle haptics' detail={typeof navigator.vibrate === 'function' ? 'Short pulses on compatible devices.' : 'Not supported in this browser.'} disabled={typeof navigator.vibrate !== 'function'} checked={prefs.haptics && typeof navigator.vibrate === 'function'} onChange={v => change('haptics', v)}/>
      </div>
      <div className='settings-group' id='settings-graphics'><h3>Comfort & graphics</h3>
        <p className='fine-print'>Active renderer: {world.backend}. Compatibility mode uses simpler graphics without a GPU.</p>
        <div className='button-row'><a className='secondary-button' href='?backend=canvas'>Compatibility mode</a><a className='secondary-button' href='?backend=webgl'>Try WebGL graphics</a></div>
        <p className='fine-print'>Switching renderer opens a fresh sky and keeps your saved preferences.</p>
        <Toggle label='Reduced flashes' detail='Softens the light that catches the smoke.' checked={prefs.reducedFlashes} onChange={v => change('reducedFlashes', v)}/>
        <Toggle label='Reduced interface motion' checked={prefs.reducedMotion} onChange={v => change('reducedMotion', v)}/>
        <label className='setting-row'><span className='setting-label'>Graphics quality</span><select aria-label='Graphics quality' value={prefs.quality} onChange={event => change('quality', event.target.value as Preferences['quality'])}><option value='auto'>Automatic</option><option value='low'>Low</option><option value='standard'>Standard</option><option value='ultra'>Ultra</option></select></label>
      </div>
      <PresentationSettings value={presentation} onChange={setPresentation} disabled={!world.ready || Boolean(world.error)} onStart={() => {
        setPresentation(p => ({ ...p, mode: p.mode === 'interactive' ? 'scene' : p.mode, show: p.show || 'calm' }));
        world.start(presentation.show || 'calm');
        world.setOverlay(false);
        setOverlay(null);
        setHidden(true);
          }} onExit={() => { setPresentation(p => ({ ...p, mode: 'interactive', show: null })); world.sim.current.stopShow(); world.refresh(); wake(); }}/>
      <div className='settings-group' id='settings-device'><h3>This device</h3>
        <Toggle label='Keep screen awake' detail={platform.awake ? 'Active while this page stays visible.' : 'Optional; released on pause or tab switch.'} checked={platform.awake} onChange={() => void platform.toggleWake()}/>
        <div className='setting-row'><span><span className='setting-label'>Offline play</span><small>{platform.offline ? 'Offline package cached on this device.' : 'Available after the offline package finishes caching.'}</small></span><span className={`status-dot${platform.offline ? ' available' : ''}`}/></div>
        <div className='button-row'><button className='secondary-button' onClick={() => void platform.installApp()}><Download size={16}/>{platform.installable ? 'Install app' : 'Installation help'}</button><button className='secondary-button' onClick={() => void platform.toggleFullscreen()}><Maximize size={16}/>Fullscreen</button></div>
        {platform.updateReady && <button className='secondary-button full' disabled={Boolean(state.committedId)} onClick={() => { world.pause(true); void platform.applyUpdate(); }}>Update app and restart</button>}
      </div>
      <details className='diagnostics'><summary>Graphics details</summary><dl><div><dt>Renderer</dt><dd>{world.backend} · Realism V3 / UI V4</dd></div><div><dt>Build</dt><dd>{CONFIG_VERSION}</dd></div><div><dt>Render pixels</dt><dd>{world.metrics.renderPixels.toLocaleString()}</dd></div><div><dt>Active quality</dt><dd>{state.quality}</dd></div><div><dt>Visible particles</dt><dd>{state.particles.toLocaleString()}</dd></div><div><dt>Smoke layers</dt><dd>{state.smoke} / 96</dd></div><div><dt>Launched / bursts</dt><dd>{state.launched} / {state.bursts}</dd></div></dl></details>
      <button className='text-button full' onClick={() => setOverlay('help')}>Help and keyboard controls</button>
      <p className='fine-print'>No accounts, tracking or remote media. Preferences stay in this browser. Your hosting provider may retain access logs. Offline storage can be cleared by your browser.</p>
      <div className='button-row'><button className='text-button' onClick={() => setOverlay('help')}>Replay introduction</button><button className='text-button' onClick={() => setOverlay('reset')}><RotateCcw size={14}/>Reset this sky</button></div>
    </Dialog>}

    {overlay === 'reset' && <Dialog variant='reset' title='Begin with a quiet sky?' onClose={() => setOverlay('settings')}><p className='intro-copy'>This stops the display and clears your saved preferences and introduction progress on this device.</p><button className='primary-button full' onClick={reset}>Reset sky and preferences</button><button className='text-button full' onClick={() => setOverlay('settings')}>Keep my sky</button></Dialog>}
  </main>;
}
