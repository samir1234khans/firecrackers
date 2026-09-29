import { useState } from 'react';

const SECTIONS = [ ['sound', 'Sound'], ['graphics', 'Graphics'], ['display', 'Display'], ['device', 'Device'] ] as const;

/** Navigation within the existing settings dialog; no extra routes or duplicate settings. */
export function PanelNav({ reducedMotion }: { reducedMotion: boolean }) {
  const [active, setActive] = useState<string>('sound');
  return <nav className='panel-nav' aria-label='Settings sections'>
    {SECTIONS.map(([id, label]) => <button
      key={id}
      type='button'
      aria-controls={`settings-${id}`}
      aria-current={active === id ? 'location' : undefined}
      onClick={() => {
        setActive(id);
        document.getElementById(`settings-${id}`)?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' });
      }}
    >{label}</button>)}
  </nav>;
}
