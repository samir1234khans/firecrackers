import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CircleHelp, Download, Flame, Hand, Keyboard, MapPin, Maximize, Monitor, Pause, Play, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, Wind } from 'lucide-react';
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
import { ControlsMenu } from './ui/ControlsMenu';
import { PanelNav } from './ui/PanelNav';
import type { SettingsSection } from './ui/PanelNav';
import './styles/completion.css';
import './styles/flow.css';
import './styles/recovery.css';
import './styles/stage.css';
import './styles/panels.css';

type Overlay = 'help' | 'settings' | 'show' | 'reset' | 'picker' | 'position' | 'controls' | null;

export default function App() {
  const [presentation, setPresentation] = useState(() => parsePresentation(location.search));
  const [prefs, setPrefs] = useState(loadPreferences);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('graphics');
  const [settingsReturnFocus, setSettingsReturnFocus] = useState(false);
  const panelInvoker = useRef<HTMLElement | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [hidden, setHidden] = useState(() => parsePresentation(location.search).mode !== 'interactive');
  const [notice, setNotice] = useState('');
  const [noticeFamily, setNoticeFamily] = useState<FamilyId | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const [positionDraft, setPositionDraft] = useState(.5);
  const cancelDrag = useRef<(() => void) | null>(null);
  const clearSuppressedClick = useRef<(() => void) | null>(null);
  const [drag, setDrag] = useState<{ id: FamilyId; x: number; y: number; kind: 'burst' | 'launch' | null } | null>(null);
  const dragRef = useRef(drag); dragRef.current = drag;
  const revealTap = useRef(false);
  const notify = useCallback((text: string) => { setNoticeFamily(null); setNotice(text); }, []);
  const world = useWorld(host, prefs, epoch, notify, presentation);
  const platform = usePlatform(notify);
  const state = world.snapshot;
  const worldRef = useRef(world);
  worldRef.current = world;
  const context = useRef({ overlay, prefs, state });
  context.current = { overlay, prefs, state };
  const change = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs(p => ({ ...p, [key]: value })), []);
  const wake = () => setHidden(false);
  const open = (next: Overlay) => { cancelDrag.current?.(); if (!overlay) panelInvoker.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;  if (next === 'settings') { setSettingsSection('graphics'); setSettingsReturnFocus(false); } setPositionDraft(world.sim.current.placement); world.setOverlay(true); platform.releaseWake(); setOverlay(next); wake(); };
  const close = () => { cancelDrag.current?.(); setDrag(null); dragRef.current = null; setOverlay(null); world.setOverlay(false); wake(); };
  const cancelReset = () => { setSettingsReturnFocus(true); setOverlay('settings'); };
  const finishPosition = () => { close(); world.sim.current.setPlacement(positionDraft); world.refresh(); };
  const startDrag = (id: FamilyId, event: React.PointerEvent<HTMLButtonElement>) => {
    clearSuppressedClick.current?.();
    if (event.button !== 0 || !event.isPrimary || !world.ready || world.error || overlay) return;
    cancelDrag.current?.();
    const button = event.currentTarget, pointerId = event.pointerId, startX = event.clientX, startY = event.clientY;
    button.setPointerCapture(pointerId);
    let moved = false, cancelled = false;
    const suppressClick = () => {
      const suppress = (ev: MouseEvent) => { ev.preventDefault(); ev.stopImmediatePropagation(); };
      clearSuppressedClick.current?.();
      const clear = () => { button.removeEventListener('click', suppress, true); clearSuppressedClick.current = null; };
      clearSuppressedClick.current = clear;
      button.addEventListener('click', suppress, { capture: true, once: true });
      setTimeout(() => { if (clearSuppressedClick.current === clear) clear(); }, 600);
    };
    const cleanup = () => {
      button.removeEventListener('pointermove', move); button.removeEventListener('pointerup', end);
      button.removeEventListener('pointercancel', cancel); button.removeEventListener('lostpointercapture', cancel);
      window.removeEventListener('keydown', escape);
      cancelDrag.current = null;
      if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
      dragRef.current = null; setDrag(null);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId || cancelled) return;
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 8) return;
      moved = true;
      const target = worldRef.current.dropTarget(e.clientX, e.clientY);
      const kind = worldRef.current.sim.current.canLaunchFamily(id) ? target?.kind ?? null : null;
      const value = { id, x: e.clientX, y: e.clientY, kind }; dragRef.current = value; setDrag(value);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const commit = moved && !cancelled && e.type === 'pointerup';
      if (moved || cancelled) suppressClick();
      cleanup();
      if (!commit) return;
      if (!context.current.overlay && worldRef.current.drop(id, e.clientX, e.clientY)) { change('family', id); setNotice(''); }
    };
    const abort = () => { cancelled = true; suppressClick(); cleanup(); };
    const cancel = (e: PointerEvent) => { if (e.pointerId === pointerId) abort(); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); abort(); } };
    cancelDrag.current = abort;
    button.addEventListener('pointermove', move); button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', cancel); button.addEventListener('lostpointercapture', cancel);
    window.addEventListener('keydown', escape);
  };
  const select = (id: FamilyId) => {
    if (world.sim.current.select(id)) change('family', id);
    world.refresh();
    setNotice('');
    wake();
  };

  useEffect(() => () => { cancelDrag.current?.(); clearSuppressedClick.current?.(); }, []);
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
        cancelDrag.current?.();
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

  const canLight = world.ready && !world.error && state.ready && !overlay;
  const toggleSound = async () => { const active = await world.configureSound(!world.soundActive); change('sound', active); };
  const resumeOrPause = () => { world.pause(!state.paused); if (!state.paused) platform.releaseWake(); wake(); };
  const igniteFamily = (id: FamilyId) => {
    setNotice(''); setNoticeFamily(null);
    if (world.igniteFamily(id)) change('family', id);
    else { setNoticeFamily(id); setNotice(world.sim.current.paused ? 'Resume to launch' : world.sim.current.launchBlock === 'capacity' ? 'Let the sparks clear' : 'Rocket in flight'); }
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
    data-drag-active={Boolean(drag)}
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
      available={world.ready && !world.error && !overlay}
      phase={state.phase}
      hidden={hidden}
      selectedId={state.selected}
      paused={state.paused}
      soundActive={world.soundActive}
      canLight={canLight}
      notice={notice}
      noticeFamily={noticeFamily ?? undefined}
      committedFamily={state.committedFamily}
      updateReady={platform.updateReady}
      onPause={resumeOrPause}
      onSound={() => void toggleSound()}
      canLaunchFamily={id => world.ready && !world.error && !overlay && world.sim.current.canLaunchFamily(id)}
      onDragStart={(id, event) => startDrag(id, event)}
      onLaunchFamily={igniteFamily}
      onControls={() => open('controls')}
    />
    {drag && overlay !== 'picker' && <div className={`burst-drop-target${drag.kind ? ` valid ${drag.kind}` : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden='true'>{drag.kind === 'launch' ? <Flame size={26}/> : <Sparkles size={26}/>}<span>{drag.kind === 'launch' ? 'Release to launch' : drag.kind === 'burst' ? 'Release to burst' : 'Move over the sky or terrace'}</span></div>}

    {!world.ready && !world.error && <div className='loading-state' role='status'><Sparkles size={18} aria-hidden='true'/><span>Preparing the night sky</span><small>Graphics switch automatically if needed.</small><a href='?backend=canvas'>Open compatibility mode</a></div>}
    {world.error && <section className='recovery' role='alert'><div className='panel-heading'><AlertCircle size={18} aria-hidden='true'/><h2>Graphics interrupted</h2></div><p>{world.error}</p><div className='button-row panel-actions'><button className='secondary-button' onClick={() => { world.reset(); setEpoch(e => e + 1); }}><RotateCcw size={16} aria-hidden='true'/>Retry current quality</button><a className='secondary-button' href='?backend=webgl'><Monitor size={16} aria-hidden='true'/>Try WebGL graphics</a><button className='primary-button' onClick={() => { world.reset(); change('quality', 'low'); setEpoch(e => e + 1); }}><Settings2 size={16} aria-hidden='true'/>Retry with lower quality</button><a className='secondary-button' href='?backend=canvas'><Monitor size={16} aria-hidden='true'/>Use compatibility graphics</a><button className='text-button' onClick={() => location.reload()}>Reload website</button><button className='text-button' onClick={() => open('settings')}>Settings</button></div></section>}
    <div className='reveal-controls' aria-hidden={!hidden}>{hidden && <>
      <button className='icon-button' aria-label='Show controls' onClick={wake}><Settings2 size={18}/></button>
      <button className='icon-button' aria-label={state.paused ? 'Resume scene' : 'Pause scene'} data-always='true' onClick={resumeOrPause}>{state.paused ? <Play size={18}/> : <Pause size={18}/>}</button>
      <button className='icon-button' aria-label={world.soundActive ? 'Mute sound' : 'Enable sound'} data-always='true' onClick={() => void toggleSound()}>{world.soundActive ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
    </>}</div>

    {overlay === 'controls' && <Dialog variant='controls' title='Controls' onClose={close} returnFocus={panelInvoker.current}>
      <ControlsMenu showLabel={state.show ? state.show[0].toUpperCase() + state.show.slice(1) : 'Manual'} fullscreen={platform.fullscreen} canPosition={true} onShow={() => open('show')} onPosition={() => open('position')} onSettings={() => open('settings')} onFullscreen={() => { void platform.toggleFullscreen(); close(); }} onHelp={() => open('help')}/>
    </Dialog>}
    {overlay === 'picker' && <Dialog variant='picker' title='Choose a firework' onClose={close} returnFocus={panelInvoker.current}>
      <p className='panel-note'>Browse the ten effects. The bottom collection launches them.</p>
      <FamilyPicker selectedId={state.selected} available={world.ready} onSelect={id => { select(id); close(); }}/>

    </Dialog>}
    {overlay === 'position' && <Dialog variant='position' title='Position' onClose={close} returnFocus={panelInvoker.current}>
      <p className='panel-note'><MapPin size={16} aria-hidden='true'/>Place the next rocket on the terrace.</p>
      <div className='position-preview' role='img' aria-label={`Next rocket position: ${Math.round(positionDraft * 100)} percent`}><span className='position-marker' style={{ left: `${(positionDraft - .2) / .6 * 100}%` }}><Flame size={18} aria-hidden='true'/></span></div>
      <label className='position-value' htmlFor='firework-position'><span>Left → right</span><output htmlFor='firework-position'>{Math.round(positionDraft * 100)}%</output></label>
      <input id='firework-position' className='position-slider' aria-label='Firework position' type='range' min='.2' max='.8' step='.01' value={positionDraft} onChange={e => setPositionDraft(Number(e.target.value))}/>
      <div className='position-presets'>{[['Left', .2], ['Center', .5], ['Right', .8]].map(([label, value]) => <button key={label} aria-pressed={Math.abs(positionDraft - Number(value)) < .005} onClick={() => setPositionDraft(Number(value))}>{label}</button>)}</div>
      <div className='panel-actions'><button className='primary-button' onClick={finishPosition}><MapPin size={16} aria-hidden='true'/>Apply</button><button className='text-button' onClick={() => setOverlay('help')}><CircleHelp size={16} aria-hidden='true'/>Help</button></div>
    </Dialog>}

    {overlay === 'help' && <Dialog variant='help' title='Quick help' onClose={close} returnFocus={panelInvoker.current}>
      <div className='help-steps'><div><Sparkles size={18} aria-hidden='true'/><span><strong>Choose</strong><small>Tap any bottom icon to launch at your saved position.</small></span></div><div><Hand size={18} aria-hidden='true'/><span><strong>Drop</strong><small>Sky: instant burst. Terrace: a rocket at your drop position.</small></span></div><div><Flame size={18} aria-hidden='true'/><span><strong>Launch</strong><small>One tap lights one fuse. Focus an icon and press Enter, or select with 1–9/0 and launch with L.</small></span></div></div>
      <Toggle label='Reduced flashes' detail='Softer light, with the same firework shapes.' checked={prefs.reducedFlashes} onChange={v => change('reducedFlashes', v)}/>
      <Toggle label='Reduced interface motion' checked={prefs.reducedMotion} onChange={v => change('reducedMotion', v)}/>
      <p className='fine-print'>Flashing effects; digital simulation. Sound starts off. Pause stays available.</p>
      <div className='panel-actions'><button className='primary-button' onClick={close}><Play size={16} aria-hidden='true'/>Enter the night</button><button className='text-button' onClick={() => { change('onboarded', true); close(); }}>Skip introduction</button></div>
      <button className='secondary-button' aria-label='Browse firework catalog' onClick={() => { setOverlay('picker'); }}>Firework catalog</button>
      <details className='keyboard-help panel-detail'><summary><Keyboard size={16} aria-hidden='true'/>Keyboard controls</summary><p>1–5: Classics · 6–9, 0: Grand · ←/→: position · L: launch · Space: pause · M: sound · Escape: close. Tab reaches every control.</p></details>
    </Dialog>}

    {overlay === 'show' && <Dialog variant='show' title='Show mode' onClose={close} returnFocus={panelInvoker.current}>
      <button className='compact-choice show-manual' aria-label='Manual' onClick={() => { returnToManual(); close(); }}><Hand size={18} aria-hidden='true'/><span><strong>Manual</strong><small>Choose and launch yourself.</small></span></button>
      <div className='show-presets'>{([
        { id: 'calm', name: 'Calm', description: 'Space between bursts.', icon: <Wind size={18} aria-hidden='true'/> },
        { id: 'festival', name: 'Festival', description: 'Rhythm and color.', icon: <Sparkles size={18} aria-hidden='true'/> },
        { id: 'finale', name: 'Finale', description: '32 seconds, then quiet.', icon: <Flame size={18} aria-hidden='true'/> },
      ] as const).map(p => <button type='button' aria-label={p.name} aria-pressed={state.show===p.id} key={p.id} className='compact-choice' onClick={() => startShow(p.id)}>{p.icon}<span><strong>{p.name}</strong><small>{p.description}</small></span></button>)}</div>
    </Dialog>}

    {overlay === 'settings' && <Dialog variant='settings' title='Settings' onClose={close} returnFocus={panelInvoker.current} initialFocusId={settingsReturnFocus ? 'settings-reset-trigger' : undefined} navigation={<PanelNav value={settingsSection} onChange={setSettingsSection}/>}>
      {notice && <p className='settings-notice' role='status'>{notice}</p>}
      <section className='panel-pane settings-tab-panel' role='tabpanel' id='settings-graphics' aria-labelledby='settings-tab-graphics' hidden={settingsSection !== 'graphics'} tabIndex={0}>
        <div className='settings-group'><h3>Rendering</h3>
          <p className='panel-status'><Monitor size={16} aria-hidden='true'/>Active renderer: {world.backend}</p>
          <label className='setting-row'><span className='setting-label'>Graphics quality</span><select aria-label='Graphics quality' value={prefs.quality} onChange={event => change('quality', event.target.value as Preferences['quality'])}><option value='auto'>Automatic</option><option value='low'>Low</option><option value='standard'>Standard</option><option value='ultra'>Ultra</option></select></label>
          <div className='button-row renderer-options'><a className='secondary-button' aria-label='Automatic renderer' href='?'><RotateCcw size={16} aria-hidden='true'/>Auto</a><a className='secondary-button' aria-label='Try WebGPU graphics' href='?backend=webgpu'><Sparkles size={16} aria-hidden='true'/>WebGPU</a><a className='secondary-button' aria-label='Try WebGL graphics' href='?backend=webgl'><Monitor size={16} aria-hidden='true'/>WebGL</a><a className='secondary-button' aria-label='Compatibility mode' href='?backend=canvas'><Monitor size={16} aria-hidden='true'/>Canvas</a></div>
          <p className='fine-print'>WebGPU and WebGL use 3D; Canvas uses simpler 2D. Switching starts a fresh sky and keeps saved quality.</p>
        </div>
        <div className='settings-group'><h3>Comfort</h3>
          <Toggle label='Reduced flashes' detail='Softer light; the same firework shapes.' checked={prefs.reducedFlashes} onChange={v => change('reducedFlashes', v)}/>
          <Toggle label='Reduced interface motion' checked={prefs.reducedMotion} onChange={v => change('reducedMotion', v)}/>
        </div>
      </section>
      <section className='panel-pane settings-tab-panel' role='tabpanel' id='settings-sound' aria-labelledby='settings-tab-sound' hidden={settingsSection !== 'sound'} tabIndex={0}>
        <div className='settings-group'><h3>Sound & feel</h3>
        <Toggle label='Sound' detail='Fuse, launch and spatial reports.' checked={world.soundActive} onChange={() => void toggleSound()}/>
        <label className='volume-setting'><span>Volume</span><input aria-label='Volume' type='range' min='0' max='0.8' step='0.01' value={prefs.volume} onChange={event => change('volume', Number(event.target.value))}/><output>{Math.round(prefs.volume * 100)}%</output></label>
        <Toggle label='Quiet night ambience' checked={prefs.ambience} onChange={v => change('ambience', v)}/>
        <Toggle label='Gentle haptics' detail={typeof navigator.vibrate === 'function' ? 'Short pulses on supported devices.' : 'Not supported in this browser.'} disabled={typeof navigator.vibrate !== 'function'} checked={prefs.haptics && typeof navigator.vibrate === 'function'} onChange={v => change('haptics', v)}/>
        </div>
      </section>
      <section className='panel-pane settings-tab-panel' role='tabpanel' id='settings-display' aria-labelledby='settings-tab-display' hidden={settingsSection !== 'display'} tabIndex={0}>
      <PresentationSettings value={presentation} onChange={setPresentation} disabled={!world.ready || Boolean(world.error)} onStart={() => {
        setPresentation(p => ({ ...p, mode: p.mode === 'interactive' ? 'scene' : p.mode, show: p.show || 'calm' }));
        world.start(presentation.show || 'calm');
        world.setOverlay(false);
        setOverlay(null);
        setHidden(true);
          }} onExit={() => { setPresentation(p => ({ ...p, mode: 'interactive', show: null })); world.sim.current.stopShow(); world.refresh(); wake(); }}/>
      </section>
      <section className='panel-pane settings-tab-panel' role='tabpanel' id='settings-device' aria-labelledby='settings-tab-device' hidden={settingsSection !== 'device'} tabIndex={0}>
        <div className='settings-group'><h3>This device</h3>
        <Toggle label='Keep screen awake' detail={platform.awake ? 'Active while this page stays visible.' : 'Optional; released on pause or tab switch.'} checked={platform.awake} onChange={() => void platform.toggleWake()}/>
        <div className='setting-row'><span><span className='setting-label'>Offline play</span><small>{platform.offline ? 'Offline package cached on this device.' : 'Available after the offline package finishes caching.'}</small></span><span className={`status-dot${platform.offline ? ' available' : ''}`}/></div>
        <div className='button-row'><button className='secondary-button' onClick={() => void platform.installApp()}><Download size={16} aria-hidden='true'/>{platform.installable ? 'Install app' : 'Installation help'}</button><button className='secondary-button' onClick={() => void platform.toggleFullscreen()}><Maximize size={16} aria-hidden='true'/>Fullscreen</button></div>
        {platform.updateReady && <button className='secondary-button' disabled={Boolean(state.committedId)} onClick={() => { world.pause(true); void platform.applyUpdate(); }}>Update app and restart</button>}
        </div>
        <details className='diagnostics panel-detail'><summary>Graphics details</summary><dl><div><dt>Renderer</dt><dd>{world.backend} · Realism V3 / edge panels</dd></div><div><dt>Build</dt><dd>{CONFIG_VERSION}</dd></div><div><dt>Render pixels</dt><dd>{world.metrics.renderPixels.toLocaleString()}</dd></div><div><dt>Active quality</dt><dd>{state.quality}</dd></div><div><dt>Visible particles</dt><dd>{state.particles.toLocaleString()}</dd></div><div><dt>Smoke layers</dt><dd>{state.smoke} / 96</dd></div><div><dt>Launched / bursts</dt><dd>{state.launched} / {state.bursts}</dd></div></dl></details>
        <div className='panel-actions'><button className='text-button' onClick={() => setOverlay('help')}><Keyboard size={16} aria-hidden='true'/>Help and keyboard controls</button><button className='text-button' onClick={() => setOverlay('help')}>Replay introduction</button><button id='settings-reset-trigger' className='text-button' onClick={() => { setSettingsReturnFocus(false); setOverlay('reset'); }}><RotateCcw size={16} aria-hidden='true'/>Reset this sky</button></div>
        <details className='panel-detail'><summary>Privacy & storage</summary><p className='fine-print'>No accounts or remote media. Preferences stay in this browser. Hosting may collect access and performance data. Your browser can clear offline storage.</p></details>
      </section>
    </Dialog>}

    {overlay === 'reset' && <Dialog variant='reset' title='Reset sky?' onClose={cancelReset} returnFocus={panelInvoker.current}><p className='panel-note'>Stops the display and clears this device’s preferences and introduction progress.</p><div className='panel-actions'><button className='primary-button' aria-label='Reset sky and preferences' onClick={reset}><RotateCcw size={16} aria-hidden='true'/>Reset</button><button className='text-button' aria-label='Cancel reset' onClick={cancelReset}>Cancel</button></div></Dialog>}
  </main>;
}
