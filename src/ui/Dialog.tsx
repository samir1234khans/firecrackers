import { nearestSheetStop, sheetStops } from './SheetModel';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  description?: string;
  navigation?: ReactNode;
  returnFocus?: HTMLElement | null;
  initialFocusId?: string;
  dragging?: boolean;
  variant?: 'help' | 'show' | 'settings' | 'reset' | 'picker' | 'position' | 'controls' | 'studio' | 'browse' | 'capture';
};

const FOCUSABLES = 'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]';

/** Native inert/Escape behavior, with an explicit Tab boundary for browser chrome. */
export function Dialog({ title, children, onClose, description, navigation, returnFocus, initialFocusId, variant = 'settings', dragging = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [sheetHeight,setSheetHeight]=useState<number|null>(null);
  const skipHandleClick=useRef(false);
  const gesture=useRef<{id:number;y:number;height:number;at:number}|null>(null);
  const close = useRef(onClose);
  const returnTarget = useRef(returnFocus);
  const titleId = useId();
  const descriptionId = useId();
  close.current = onClose;
  returnTarget.current = returnFocus;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // A returning Settings panel can focus its still-selected pane's reset
    // trigger. Other panels begin at the always-visible close control.
    const initial = initialFocusId ? document.getElementById(initialFocusId) : dialog?.querySelector<HTMLElement>('.panel-close');
    if (initial instanceof HTMLElement && dialog?.contains(initial)) initial.focus({ preventScroll: true });
    const cancel = (event: Event) => { event.preventDefault(); close.current(); };
    dialog?.addEventListener('cancel', cancel);
    return () => {
      dialog?.removeEventListener('cancel', cancel);
      dialog?.close();
      // The HUD invoker survives Settings → Help/Reset even though the
      // previous panel's transient button has been removed from the DOM.
      const target = returnTarget.current ?? previous;
      if (target?.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true });
    };
  }, []);
  return <dialog
    ref={ref}
    data-world-glass
    style={sheetHeight===null?undefined:{height:sheetHeight,maxHeight:'calc(100dvh - 24px)'}}
    className={`sheet edge-panel sheet--${variant}${dragging ? ' is-dragging' : ''}`}
    aria-labelledby={titleId}
    aria-describedby={description ? descriptionId : undefined}
    data-panel={variant}
    tabIndex={-1}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      const dialog = event.currentTarget;
      // Recompute only during keyboard navigation: tabs, details and disabled
      // controls can change while this same modal remains open.
      const visible = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLES)).filter(element => {
        if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' && element.getClientRects().length > 0;
      });
      // A native radio group has one sequential Tab stop, even though every
      // enabled radio reports tabIndex 0. Use its checked (or first) control.
      const stops = visible.filter(element => {
        if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
        const group = visible.filter(candidate => candidate instanceof HTMLInputElement && candidate.type === 'radio' && candidate.name === element.name && candidate.form === element.form) as HTMLInputElement[];
        return element === (group.find(candidate => candidate.checked) ?? group[0]);
      }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
      const first = stops[0], last = stops[stops.length - 1];
      const active = document.activeElement;
      if (!first || !last || !stops.includes(active as HTMLElement) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        // Native focus scrolls an offscreen action into the contained body;
        // invoker restoration separately keeps preventScroll on dismissal.
        (event.shiftKey ? last : first)?.focus();
        if (!first) dialog.focus({ preventScroll: true });
      }
    }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const r = event.currentTarget.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose();
    }}
  >
    <button className="sheet-drag-handle" type="button" aria-label="Resize panel" onClick={()=>{if(skipHandleClick.current){skipHandleClick.current=false;return;}const stops=sheetStops(innerHeight,innerWidth);setSheetHeight(h=>h===stops.work?stops.peek:stops.work);}}
      onPointerDown={e=>{if(innerWidth>700||!e.isPrimary)return;const r=ref.current!.getBoundingClientRect();gesture.current={id:e.pointerId,y:e.clientY,height:r.height,at:performance.now()};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;if(Math.abs(e.clientY-g.y)>8)skipHandleClick.current=true;setSheetHeight(Math.max(72,Math.min(innerHeight-24,g.height+g.y-e.clientY)));}}
      onPointerUp={e=>{const g=gesture.current;gesture.current=null;if(!g||g.id!==e.pointerId||Math.abs(e.clientY-g.y)<8)return;const stops=sheetStops(innerHeight,innerWidth),visible=Math.max(44,g.height+g.y-e.clientY),stop=nearestSheetStop(visible,(e.clientY-g.y)/Math.max(1,performance.now()-g.at),stops);if(stop==='closed')onClose();else setSheetHeight(stops[stop]);}}
      onPointerCancel={()=>{gesture.current=null;setSheetHeight(null);}}><span aria-hidden="true"/></button>
    <header className='sheet-heading panel-header'>
      <div className='panel-heading-copy'>
        <h2 className='panel-title' id={titleId}>{title}</h2>
        {description && <p className='panel-description' id={descriptionId}>{description}</p>}
      </div>
      <button type='button' className='icon-button panel-close' aria-label='Close panel' autoFocus onClick={onClose}><X size={18}/></button>
    </header>
    {navigation && <div className='panel-navigation'>{navigation}</div>}
    <div className='sheet-content panel-body'>{children}</div>
  </dialog>;
}

export function Toggle({ label, detail, checked, onChange, disabled = false }: {
  label: string; detail?: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean;
}) {
  const detailId = useId();
  return <label className={`setting-row${disabled ? ' unavailable' : ''}`}>
    <span><span className='setting-label'>{label}</span>{detail && <small id={detailId}>{detail}</small>}</span>
    <input className='switch' aria-label={label} aria-describedby={detail ? detailId : undefined} type='checkbox' checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}/>
  </label>;
}
