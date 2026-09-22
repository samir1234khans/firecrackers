import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Flame, Hand, Maximize, Pause, Play, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, Wind } from 'lucide-react';
import { FAMILIES, CONFIG_VERSION } from './engine/catalog';
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
import { PanelNav } from './ui/PanelNav';
import './styles/completion.css';
import './styles/flow.css';
import './styles/recovery.css';

type Overlay = 'help' | 'settings' | 'show' | 'reset' | null;

export default function App() {
  const [presentation, setPresentation] = useState(() => parsePresentation(location.search));
  const [prefs, setPrefs] = useState(loadPreferences);
  const [overlay, setOverlay] = useState<Overlay>(() => parsePresentation(location.search).mode !== 'interactive' || loadPreferences().onboarded ? null : 'help');
  const [epoch, setEpoch] = useState(0);
  const [hidden, setHidden] = useState(() => parsePresentation(location.search).mode !== 'interactive');
  const [notice, setNotice] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const revealTap = useRef(false);
  const notify = useCallback((text: string) => setNotice(text), []);
  const world = useWorld(host, prefs, epoch, notify, presentation);
  const platform = usePlatform(notify);
  const state = world.snapshot;
  const worldRef = useRef(world);
  worldRef.current = world;
  const context = useRef({ overlay, prefs, state });
  context.current = { overlay, prefs, state };
  const change = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs(p => ({ ...p, [key]: value })), []);
  const wake = () => setHidden(false);
  const open = (next: Overlay) => { world.setOverlay(true); platform.releaseWake(); setOverlay(next); wake(); };
  const close = () => { setOverlay(null); world.setOverlay(false); wake(); };
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
        event.preventDefault();
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
      if (/^[1-5]$/.test(event.key)) {
        const family = FAMILIES[Number(event.key) - 1];
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
  const setPlacement = (value: number) => { world.sim.current.stopShow(false); world.sim.current.setPlacement(value); world.refresh(); };
  const resumeOrPause = () => { world.pause(!state.paused); if (!state.paused) platform.releaseWake(); wake(); };
  const ignite = () => { setNotice(''); world.ignite(); };
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
    setOverlay('help');
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
    {platform.updateReady && !overlay && <div className='flow-update' role='status'>
      <span>A newer sky is ready.</span><button disabled={Boolean(state.committedId)} onClick={() => { world.pause(true); void platform.applyUpdate(); }}>{Boolean(state.committedId) ? 'After this flight' : 'Update & restart'}</button>
    </div>}

    {world.ready && world.backend.startsWith('Canvas') && !hidden && !overlay && <div className='renderer-note'>Compatibility graphics · same five fireworks</div>}

    <CinematicHUD
      selected={selected}
      available={world.ready && !world.error && !overlay}
      phase={state.phase}
      hidden={hidden}
      reducedMotion={prefs.reducedMotion}
      selectedId={state.selected}
      show={state.show}
      paused={state.paused}
      soundActive={world.soundActive}
      fullscreen={platform.fullscreen}
      canLight={canLight}
      placement={state.placement}
      notice={notice}
      launchBlock={state.launchBlock}
      committedFamily={state.committedFamily}
      launched={state.launched}
      onPause={resumeOrPause}
      onSound={() => void toggleSound()}
      onFullscreen={() => void platform.toggleFullscreen()}
      onSettings={() => open('settings')}
      onShowDialog={() => open('show')}
      onStartShow={startShow}
      onManual={returnToManual}
      onSelect={select}
      onPlacement={setPlacement}
      onIgnite={ignite}
    />

    {!world.ready && !world.error && <div className='loading-state' role='status'><span className='loading-spark'/><span>Preparing the night sky</span><small>Graphics will switch automatically when needed.</small><a href='?backend=canvas'>Open compatibility mode</a></div>}
    {world.error && <section className='recovery glass' role='alert'><h2>The sky needs a fresh start.</h2><p>{world.error}</p><div className='button-row'><button className='primary-button' onClick={() => { world.reset(); change('quality', 'low'); setEpoch(e => e + 1); }}>Retry with lower quality</button><a className='secondary-button' href='?backend=canvas'>Use compatibility graphics</a><button className='text-button' onClick={() => location.reload()}>Reload website</button><button className='text-button' onClick={() => open('settings')}>Settings</button></div></section>}
    {state.paused && !overlay && !world.error && <button className='paused-card glass' onClick={resumeOrPause}><Play size={19}/><span>Take your time.<small>Resume the night</small></span></button>}

    {world.ready && !world.error && canLight && <div className='placement-stage chrome'>
      <button
        className='move-target'
        aria-label='Drag firework left or right'
        title='Drag to place'
        onPointerDown={event => {
          if (event.button !== 0) return;
          dragging.current = true;
          world.sim.current.stopShow(false);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => { if (dragging.current) setPlacement(world.positionFromPointer(event.clientX)); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        onLostPointerCapture={() => { dragging.current = false; }}
      />
    </div>}

    <div className='reveal-controls' aria-hidden={!hidden}>{hidden && <>
      <button className='icon-button glass' aria-label='Show controls' onClick={wake}><Settings2 size={18}/></button>
      <button className='icon-button glass' aria-label={state.paused ? 'Resume scene' : 'Pause scene'} data-always='true' onClick={resumeOrPause}>{state.paused ? <Play size={18}/> : <Pause size={18}/>}</button>
      <button className='icon-button glass' aria-label={world.soundActive ? 'Mute sound' : 'Enable sound'} data-always='true' onClick={() => void toggleSound()}>{world.soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
    </>}</div>

    {overlay === 'help' && <Dialog variant='help' title='A little spark. A whole night sky.' onClose={close}>
      <p className='intro-copy'>Take a moment out of the everyday. This night is yours to light.</p>
      <div className='help-steps'><div><Sparkles/><span><strong>Choose your firework</strong><small>Five different ways to fill the sky.</small></span></div><div><Hand/><span><strong>Find its place</strong><small>Drag the rocket, or use the placement controls.</small></span></div><div><Flame/><span><strong>Launch it. Look up.</strong><small>One press lights the fuse. Let the rocket rise and the embers fall.</small></span></div></div>
      <Toggle label='Reduced flashes' detail='Softer light, with the same firework shapes.' checked={prefs.reducedFlashes} onChange={v => change('reducedFlashes', v)}/>
      <Toggle label='Reduced interface motion' checked={prefs.reducedMotion} onChange={v => change('reducedMotion', v)}/>
      <p className='fine-print'>Flashing visual effects. Sound starts off. Pause is always within reach. This is a digital simulation only.</p>
      <button className='primary-button full' onClick={close}>Enter the night</button>
      <button className='text-button full' onClick={() => { change('onboarded', true); close(); }}>Skip introduction</button>
      <details className='keyboard-help'><summary>Keyboard controls</summary><p>1–5: choose · Left/Right: place · L: launch · Space: pause · M: sound · Escape: close a panel. Tab moves through every control.</p></details>
    </Dialog>}

    {overlay === 'show' && <Dialog variant='show' title='Let the sky take over.' onClose={close}>
      <p className='intro-copy'>A gently directed display. No two nights quite the same.</p>
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
      <details className='diagnostics'><summary>Graphics details</summary><dl><div><dt>Renderer</dt><dd>{world.backend} · Realism V3 / UI V3</dd></div><div><dt>Build</dt><dd>{CONFIG_VERSION}</dd></div><div><dt>Render pixels</dt><dd>{world.metrics.renderPixels.toLocaleString()}</dd></div><div><dt>Active quality</dt><dd>{state.quality}</dd></div><div><dt>Visible particles</dt><dd>{state.particles.toLocaleString()}</dd></div><div><dt>Smoke layers</dt><dd>{state.smoke} / 96</dd></div><div><dt>Launched / bursts</dt><dd>{state.launched} / {state.bursts}</dd></div></dl></details>
      <p className='fine-print'>No accounts, tracking or remote media. Preferences stay in this browser. Your hosting provider may retain access logs. Offline storage can be cleared by your browser.</p>
      <div className='button-row'><button className='text-button' onClick={() => setOverlay('help')}>Replay introduction</button><button className='text-button' onClick={() => setOverlay('reset')}><RotateCcw size={14}/>Reset this sky</button></div>
    </Dialog>}

    {overlay === 'reset' && <Dialog variant='reset' title='Begin with a quiet sky?' onClose={() => setOverlay('settings')}><p className='intro-copy'>This stops the display and clears your saved preferences and introduction progress on this device.</p><button className='primary-button full' onClick={reset}>Reset sky and preferences</button><button className='text-button full' onClick={() => setOverlay('settings')}>Keep my sky</button></Dialog>}
  </main>;
}
