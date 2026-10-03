import { useState } from 'react';
import { Copy, Play, Monitor, Layers } from 'lucide-react';
import { presentationLink } from '../platform/presentation';
import type { Presentation, SafeRect } from '../platform/presentation';
import { paceValue, PACE_LABELS } from '../engine/AlwaysPlayDirector';
import { Toggle } from './Dialog';
import { SHOW_THEMES, THEME_NAMES, themeValue } from '../engine/CinematicDirector';
type Props = {
    value: Presentation;
    onChange: (value: Presentation) => void;
    onStart: () => void;
    onExit: () => void;
    disabled: boolean;
};
export function PresentationSettings({ value, onChange, onStart, onExit, disabled }: Props) {
    const [link, setLink] = useState('');
    const [copyState, setCopyState] = useState('');
    const setRect = (index: number, valuePercent: number) => {
        const rect: SafeRect = [...value.safeRect];
        const v = Math.max(0, Math.min(1, valuePercent / 100));
        if (index === 0) rect[0] = Math.min(v, rect[2] - .05);
        if (index === 1) rect[1] = Math.min(v, rect[3] - .05);
        if (index === 2) rect[2] = Math.max(v, rect[0] + .05);
        if (index === 3) rect[3] = Math.max(v, rect[1] + .05);
        onChange({ ...value, safeRect: rect });
    };
    const copy = async () => {
        const output = presentationLink(location.href, { ...value, mode: value.mode === 'interactive' ? 'scene' : value.mode, show: value.show || 'calm' });
        setLink(output);
        try {
            await navigator.clipboard.writeText(output);
            setCopyState('Display link copied.');
        } catch {
            setCopyState('Select and copy this display link.');
        }
    };
    return <section className='settings-group presentation-settings' aria-label='Display and streaming'>
    <h3>Presentation</h3>
    <label className='setting-row'><span className='setting-label'>Canvas output</span>
      <select aria-label='Canvas output' value={value.mode} onChange={event => onChange({ ...value, mode: event.target.value as Presentation['mode'] })}>
        <option value='interactive'>Interactive</option><option value='scene'>Night-sky display</option><option value='transparent'>Transparent overlay</option>
      </select>
    </label>
    <label className='setting-row'><span className='setting-label'>Display pacing</span>
      <select aria-label='Display pacing' value={value.show || 'calm'} onChange={event => onChange({ ...value, show: event.target.value as Presentation['show'] })}>
        <option value='calm'>Calm</option><option value='festival'>Festival</option><option value='finale'>Finite finale</option><option value='always'>Always Play</option>
      </select>
    </label>
    {value.show === 'always' && <label className='setting-row'><span className='setting-label'>Always Play quantity</span><select aria-label='Always Play quantity' value={value.pace ?? 2} onChange={event => onChange({ ...value, pace: paceValue(Number(event.target.value)) })}>{PACE_LABELS.map((label, i) => <option key={label} value={i + 1}>{i + 1} {label}</option>)}</select></label>}
    {value.show && value.show !== 'calm' && <label className='setting-row'><span className='setting-label'>Display show</span><select aria-label='Display show' value={value.theme ?? 'prismatic'} onChange={event => onChange({ ...value, theme: themeValue(event.target.value) })}>{SHOW_THEMES.map(theme => <option key={theme} value={theme}>{THEME_NAMES[theme]}</option>)}</select></label>}
    <label className='setting-row'><span className='setting-label'>Frame-rate target</span>
      <select aria-label='Frame-rate target' value={value.fps} onChange={event => onChange({ ...value, fps: event.target.value === '30' ? 30 : 60 })}>
        <option value='30'>30 fps</option><option value='60'>60 fps</option>
      </select>
    </label>
    <Toggle label='Protect a clear area' detail='Space for faces or captions. No camera access.' checked={value.protect} onChange={protect => onChange({ ...value, protect })}/>
    {value.protect && <div className='safe-area-settings'>
      <div className='safe-area-preview' aria-label='Protected area preview'><span style={{ left: `${value.safeRect[0] * 100}%`, top: `${value.safeRect[1] * 100}%`, width: `${(value.safeRect[2] - value.safeRect[0]) * 100}%`, height: `${(value.safeRect[3] - value.safeRect[1]) * 100}%` }}/></div>
      {['Left', 'Top', 'Right', 'Bottom'].map((label, i) => <label key={label}><span>{label}</span><input aria-label={`Protected area ${label.toLowerCase()}`} type='range' min='0' max='100' value={Math.round(value.safeRect[i] * 100)} onChange={event => setRect(i, Number(event.target.value))}/><output>{Math.round(value.safeRect[i] * 100)}%</output></label>)}
    </div>}
    <div className='button-row panel-actions'><button className='primary-button' disabled={disabled} onClick={onStart}><Play size={16} aria-hidden='true'/>Start display</button><button className='secondary-button' onClick={() => void copy()}><Copy size={16} aria-hidden='true'/>Copy link</button></div>
    {value.mode !== 'interactive' && <button className='text-button' onClick={onExit}>{value.mode === 'transparent' ? <Layers size={16} aria-hidden='true'/> : <Monitor size={16} aria-hidden='true'/>}Return to interactive sky</button>}
    {link && <div className='display-link-result'><p role='status'>{copyState}</p><input aria-label='Display link' readOnly value={link} onFocus={event => event.currentTarget.select()}/></div>}
    <details className='panel-detail'><summary>Streaming notes</summary><p className='fine-print'>Links remember the seed and layout. Sound starts off. Tap or press Escape to reveal controls. Check transparent output in your streaming software before an event.</p></details>
  </section>;
}
