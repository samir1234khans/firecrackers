import { useEffect, useRef, useState } from 'react';
import { Crown, Hand, Leaf, Sparkles, X } from 'lucide-react';
import type { ShowPreset } from '../engine/catalog';

type Props = { value: ShowPreset | null; disabled?: boolean; onChange: (value: ShowPreset | null) => void; onOpenChange?: (open: boolean) => void };
const MODES = [
  { value: null, label: 'Manual', direction: 'up', Icon: Hand },
  { value: 'calm' as const, label: 'Calm', direction: 'right', Icon: Leaf },
  { value: 'festival' as const, label: 'Festival', direction: 'down', Icon: Sparkles },
  { value: 'finale' as const, label: 'Finale', direction: 'left', Icon: Crown },
];
function direction(dx: number, dy: number) { return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0; }
export function ShowModeKnob({ value, disabled = false, onChange, onOpenChange }: Props) {
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
    d?.querySelector<HTMLButtonElement>(`[data-direction='${MODES.find(m => m.value === value)?.direction ?? 'up'}']`)?.focus();
    return () => { d?.close(); };
  }, [open]); // Selection does not rewrite focus while a chooser is open.
  useEffect(() => () => { if (opened.current) notify.current?.(false); }, []);
  useEffect(() => { if (disabled) { cancelGesture(); if (open) close(); } }, [disabled]);
  const selected = MODES.find(m => m.value === value) ?? MODES[0];
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
      suppressClick.current = false; setOpen(true); ownPause(true);
    }}><current.Icon size={25} aria-hidden='true'/></button>
    {preview !== null && <span className='mode-preview' data-control-popup role='status'>{current.label}</span>}
    {open && <dialog ref={dialog} className='mode-selector' data-control-popup data-stage-control aria-label='Choose show mode' onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    }} onKeyDown={event => {
      event.stopPropagation();
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      const stops = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = stops[0], last = stops[stops.length - 1];
      const active = document.activeElement;
      if (!first || !last || !stops.includes(active as HTMLButtonElement) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        if (!first) event.currentTarget.focus({ preventScroll: true });
      }
    }}>
      <button className='mode-selector-close' type='button' aria-label='Close show mode' onClick={close}><X size={17}/></button>
      {MODES.map(mode => <button key={mode.direction} type='button' data-direction={mode.direction} aria-pressed={value === mode.value} onClick={() => { onChange(mode.value); close(); }}><mode.Icon size={21} aria-hidden='true'/><span>{mode.label}</span></button>)}
    </dialog>}
  </div>;
}
