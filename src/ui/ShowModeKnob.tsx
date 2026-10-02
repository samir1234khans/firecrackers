import { useEffect, useRef, useState } from 'react';
import { Crown, Hand, Leaf, Sparkles, Infinity, X } from 'lucide-react';
import { PACE_LABELS, type AlwaysPace } from '../engine/AlwaysPlayDirector';
import type { ShowPreset } from '../engine/catalog';
import { SHOW_THEMES, THEME_NAMES, type ShowTheme, type EndlessTheme } from '../engine/CinematicDirector';

type Props = { finaleTheme: ShowTheme; endlessTheme: EndlessTheme; pendingTheme: EndlessTheme | null; onThemeChange: (finale: ShowTheme, endless: EndlessTheme) => void; pace: AlwaysPace; limited: boolean; reducedFlashes: boolean; onPaceChange: (pace: AlwaysPace) => void; value: ShowPreset | null; disabled?: boolean; onChange: (value: ShowPreset | null) => void; onOpenChange?: (open: boolean) => void };
const MODES = [
  { value: null, label: 'Manual', direction: 'up', Icon: Hand },
  { value: 'calm' as const, label: 'Calm', direction: 'right', Icon: Leaf },
  { value: 'festival' as const, label: 'Festival', direction: 'down', Icon: Sparkles },
  { value: 'finale' as const, label: 'Finale', direction: 'left', Icon: Crown },
];
function direction(dx: number, dy: number) { return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0; }
export function ShowModeKnob({ finaleTheme, endlessTheme, pendingTheme, onThemeChange, value, pace, limited, reducedFlashes, onPaceChange, disabled = false, onChange, onOpenChange }: Props) {
  const [alwaysPanel, setAlwaysPanel] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; active: boolean; index: number | null } | null>(null);
  const suppressClick = useRef(false);
  const opened = useRef(false);
  const notify = useRef(onOpenChange); notify.current = onOpenChange;
  const ownPause = (next: boolean) => { if (opened.current !== next) { opened.current = next; notify.current?.(next); } };
  const close = () => { setOpen(false); ownPause(false); requestAnimationFrame(() => button.current?.focus({ preventScroll: true })); };
  const cancelGesture = () => { const g = gesture.current; if (!g) return; gesture.current = null; if (button.current?.hasPointerCapture(g.id)) button.current.releasePointerCapture(g.id); if (g.active) suppressClick.current = true; setPreview(null); ownPause(false); };
  useEffect(() => {
    if (!open) return;
    const d = dialog.current; d?.showModal();
    d?.querySelector<HTMLButtonElement>(`[data-direction='${value === 'always' ? 'always' : MODES.find(m => m.value === value)?.direction ?? 'up'}']`)?.focus();
    return () => { d?.close(); };
  }, [open]); // Selection does not rewrite focus while a chooser is open.
  useEffect(() => () => { if (opened.current) notify.current?.(false); }, []);
  useEffect(() => { if (disabled) { cancelGesture(); if (open) close(); } }, [disabled]);
  const selected = value === 'always' ? { value: 'always', label: 'Always Play', Icon: Infinity } : MODES.find(m => m.value === value) ?? MODES[0];
  const current = preview === null ? selected : MODES[preview];
  return <div className='show-mode-control chrome' data-mode-control data-stage-control onKeyDown={event => {
    if (event.key === 'Escape' && gesture.current) { event.preventDefault(); event.stopPropagation(); cancelGesture(); }
  }}>
    <button ref={button} className='show-mode-knob' type='button' disabled={disabled} aria-label={`Show mode: ${selected.label}`} title={`Show mode: ${selected.label}`} aria-haspopup='dialog' aria-expanded={open} onPointerDown={event => {
      if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return; event.stopPropagation(); event.currentTarget.focus({ preventScroll: true }); suppressClick.current = false;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false, index: null };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const g = gesture.current; if (!g || g.id !== event.pointerId) return;
      const dx = event.clientX - g.x, dy = event.clientY - g.y;
      if (!g.active && Math.hypot(dx, dy) < 12) return;
      g.active = true; g.index = direction(dx, dy); ownPause(true); setPreview(g.index); event.preventDefault(); event.stopPropagation();
    }} onPointerUp={event => {
      const g = gesture.current; if (!g || g.id !== event.pointerId) return; gesture.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (g.active) { suppressClick.current = true; if (g.index !== null) onChange(MODES[g.index].value); ownPause(false); setPreview(null); event.preventDefault(); event.stopPropagation(); }
    }} onPointerCancel={cancelGesture} onLostPointerCapture={() => { if (gesture.current) cancelGesture(); }} onClick={event => {
      event.stopPropagation(); if (suppressClick.current && event.detail > 0) { suppressClick.current = false; return; }
      suppressClick.current = false; setAlwaysPanel(value === 'always'); setOpen(true); ownPause(true);
    }}><current.Icon size={25} aria-hidden='true'/></button>
    {preview !== null && <span className='mode-preview' data-control-popup role='status'>{current.label}</span>}
    {open && <dialog ref={dialog} className='mode-selector' data-control-popup data-stage-control aria-label='Choose show mode' onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    }} onKeyDown={event => {
      event.stopPropagation();
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = stops[0], last = stops[stops.length - 1];
      const active = document.activeElement;
      if (!first || !last || !stops.includes(active as HTMLElement) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        if (!first) event.currentTarget.focus({ preventScroll: true });
      }
    }}>
      <button className='mode-selector-close' type='button' aria-label='Close show mode' onClick={close}><X size={17}/></button>
      {MODES.map(mode => <button key={mode.direction} type='button' data-direction={mode.direction} aria-pressed={value === mode.value} onClick={() => { onChange(mode.value); close(); }}><mode.Icon size={21} aria-hidden='true'/><span>{mode.label}</span></button>)}
      <button className='always-entry' type='button' data-direction='always' aria-pressed={value === 'always'} aria-expanded={alwaysPanel} onClick={() => setAlwaysPanel(v => !v)}><Infinity size={21} aria-hidden='true'/><span>Always Play</span></button>
      <section className='show-styles' aria-label='Show styles'>
        <label><span>Finale show · 90 seconds</span><select aria-label='Finale show' value={finaleTheme} onChange={event => onThemeChange(event.target.value as ShowTheme, endlessTheme)}>{SHOW_THEMES.map(theme => <option key={theme} value={theme}>{THEME_NAMES[theme]}</option>)}</select></label>
        <label><span>Festival & Always Play</span><select aria-label='Endless show' value={endlessTheme} onChange={event => onThemeChange(finaleTheme, event.target.value as EndlessTheme)}><option value='cycle'>Cycle all three</option>{SHOW_THEMES.map(theme => <option key={theme} value={theme}>{THEME_NAMES[theme]}</option>)}</select></label>
        {pendingTheme && <p role='status'>Changes at next phrase</p>}
      </section>
      {alwaysPanel && <section className='always-settings' aria-label='Always Play settings'>
        <p>Keep the night going until you stop it.</p>
        <fieldset><legend>Quantity</legend><div className='pace-options'>{PACE_LABELS.map((label, index) => <label key={label}>
          <input type='radio' name='always-pace' value={index + 1} checked={pace === index + 1} onChange={() => onPaceChange((index + 1) as AlwaysPace)}/><span>{index + 1} {label}</span>
        </label>)}</div></fieldset>
        {value === 'always' && (limited || reducedFlashes) && <p className='pace-notice'>{PACE_LABELS[pace - 1]} · {reducedFlashes ? 'reduced flashes' : 'adjusted for smooth playback'}</p>}
        <button className='always-action' type='button' onClick={() => { onChange(value === 'always' ? null : 'always'); close(); }}>{value === 'always' ? 'Stop Always Play' : 'Start Always Play'}</button>
      </section>}
    </dialog>}
  </div>;
}
