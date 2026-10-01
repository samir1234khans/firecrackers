import { useEffect, useRef, useState } from 'react';
import { Crosshair, Shuffle } from 'lucide-react';

type Props = { value: number; random: boolean; disabled?: boolean; onChange: (value: number) => void; onRandomChange: (value: boolean) => void; onPreview?: (value: number | null) => void };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
export function LaunchPositionControl({ value, random, disabled = false, onChange, onRandomChange, onPreview }: Props) {
  const [draft, setDraft] = useState<number | null>(null);
  const gesture = useRef<{ id: number; previousX: number; fine: boolean; offset: number; top: number; width: number; left: number; draft: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const preview = useRef(onPreview); preview.current = onPreview;
  const cancel = () => { const g = gesture.current; if (!g) return; gesture.current = null; if (track.current?.hasPointerCapture(g.id)) track.current.releasePointerCapture(g.id); setDraft(null); preview.current?.(null); };
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  useEffect(() => () => { if (gesture.current) preview.current?.(null); }, []);
  const shown = draft ?? clamp(value);
  return <div className='launch-position-control chrome' data-position-control data-stage-control aria-disabled={disabled} onClick={event => event.stopPropagation()} onKeyDown={event => {
    if (event.key === 'Escape' && gesture.current) { event.preventDefault(); event.stopPropagation(); cancel(); }
  }}>
    <div ref={track} className='launch-position-track' role='slider' tabIndex={disabled ? -1 : 0} aria-label='Next rocket position' aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(shown * 100)} aria-valuetext={`${Math.round(shown * 100)} percent${random ? ', random placement enabled' : ', fixed placement'}`} aria-disabled={disabled} onPointerDown={event => {
      if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return; event.preventDefault(); event.stopPropagation();
      const r = event.currentTarget.getBoundingClientRect(), left = r.left + 24, width = Math.max(1, r.width - 48), next = clamp((event.clientX - left) / width);
      gesture.current = { id: event.pointerId, previousX: event.clientX, fine: false, offset: 0, top: r.top, width, left, draft: next };
      event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); setDraft(next); preview.current?.(next);
    }} onPointerMove={event => {
      const g = gesture.current; if (!g || g.id !== event.pointerId) return; event.preventDefault(); event.stopPropagation();
      const fine = event.clientY < g.top - 8;
      // Preserve the last draft while changing sensitivity. Returning to the
      // track retains an offset from absolute mapping until this gesture ends.
      if (!fine && g.fine) g.offset = g.draft - (g.previousX - g.left) / g.width;
      const next = fine ? clamp(g.draft + (event.clientX - g.previousX) / (g.width * 5)) : clamp((event.clientX - g.left) / g.width + g.offset);
      g.previousX = event.clientX; g.fine = fine;
      g.draft = next; setDraft(next); preview.current?.(next);
    }} onPointerUp={event => {
      const g = gesture.current; if (!g || g.id !== event.pointerId) return; event.preventDefault(); event.stopPropagation(); gesture.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      onChange(g.draft); onRandomChange(false); setDraft(null); preview.current?.(null);
    }} onPointerCancel={cancel} onLostPointerCapture={() => { if (gesture.current) cancel(); }} onKeyDown={event => {
      if (disabled) return; const step = event.shiftKey ? .005 : .02;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? clamp(value - step) : ['ArrowRight', 'ArrowUp'].includes(event.key) ? clamp(value + step) : null;
      if (next === null) return; event.preventDefault(); event.stopPropagation(); onChange(next); onRandomChange(false);
    }}><span className='position-track-line'/><span className='position-track-handle' style={{ left: `calc(24px + ${shown * 100}% - ${shown * 48}px)` }}><Crosshair size={19} aria-hidden='true'/></span></div>
    <button type='button' className='position-shuffle' disabled={disabled} aria-label='Random launch position' title='Random launch position' aria-pressed={random} onClick={event => { event.stopPropagation(); onRandomChange(!random); }}><Shuffle size={20} aria-hidden='true'/></button>
  </div>;
}
