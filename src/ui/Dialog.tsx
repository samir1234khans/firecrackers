import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  variant?: 'help' | 'show' | 'settings' | 'reset';
};

/** One native modal: focus containment, Escape and inert background are browser-owned. */
export function Dialog({ title, children, onClose, variant = 'settings' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  const titleId = useId();
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    const cancel = (event: Event) => { event.preventDefault(); close.current(); };
    dialog?.addEventListener('cancel', cancel);
    return () => {
      dialog?.removeEventListener('cancel', cancel);
      dialog?.close();
      if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
  }, []);
  return <dialog
    ref={ref}
    className={`sheet sheet--${variant}`}
    aria-labelledby={titleId}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const r = event.currentTarget.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose();
    }}
  >
    <header className='sheet-heading'>
      <h2 id={titleId}>{title}</h2>
      <button type='button' className='icon-button' aria-label='Close panel' onClick={onClose}><X size={20}/></button>
    </header>
    <div className='sheet-content'>{children}</div>
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
