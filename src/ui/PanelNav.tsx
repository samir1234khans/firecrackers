import { useRef } from 'react';
import { Monitor, Settings2, Smartphone, Volume2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';

export type SettingsSection = 'graphics' | 'sound' | 'display' | 'device';
const SECTIONS = [
  { id: 'graphics', label: 'Graphics', icon: Settings2 },
  { id: 'sound', label: 'Sound', icon: Volume2 },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'device', label: 'Device', icon: Smartphone },
] as const;

/** One controlled tab stop; arrow keys activate and focus the adjacent section. */
export function PanelNav({ value, onChange }: { value: SettingsSection; onChange: (value: SettingsSection) => void }) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % SECTIONS.length;
    else if (event.key === 'ArrowLeft') next = (index + SECTIONS.length - 1) % SECTIONS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SECTIONS.length - 1;
    else return;
    event.preventDefault();
    onChange(SECTIONS[next].id);
    buttons.current[next]?.focus({ preventScroll: true });
  };
  return <div className='panel-nav settings-tabs' role='tablist' aria-label='Settings sections'>
    {SECTIONS.map(({ id, label, icon: Icon }, index) => <button
      key={id} ref={element => { buttons.current[index] = element; }}
      type='button' className='settings-tab' role='tab' id={`settings-tab-${id}`}
      aria-controls={`settings-${id}`} aria-selected={value === id} tabIndex={value === id ? 0 : -1}
      onClick={() => onChange(id)} onKeyDown={event => onKey(event, index)}
    ><Icon size={16} aria-hidden='true'/><span>{label}</span></button>)}
  </div>;
}
