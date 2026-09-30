import { useEffect, useRef, useState } from 'react';
import '../styles/startup.css';

type Props = {
  phase: 'graphics' | 'scene' | 'ready'; completed: number; total: number;
  detail: string; degraded: boolean; slow?: boolean; onContinue?: () => void;
  moonTarget?: { x: number; y: number; radius: number }; reducedMotion?: boolean; onComplete?: () => void;
};
/** Real preparation, then the same moon travels to the renderer's sky position. */
export function StartupScreen({ phase, completed, total, detail, degraded, slow = false, onContinue, moonTarget, reducedMotion = false, onComplete }: Props) {
  const [transition, setTransition] = useState<'preparing' | 'travel' | 'reveal'>('preparing');
  const complete = useRef(onComplete); complete.current = onComplete;
  const finished = useRef(false);
  const moon = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (phase !== 'ready' || finished.current) return;
    const finish = () => { if (!finished.current) { finished.current = true; complete.current?.(); } };
    if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !moonTarget) { finish(); return; }
    let frame = 0, nextFrame = 0, revealTimer = 0, finishTimer = 0;
    frame = requestAnimationFrame(() => {
      const image = moon.current;
      if (image) { const rotation = getComputedStyle(image).transform; image.style.animation = 'none'; image.style.transform = rotation; }
      nextFrame = requestAnimationFrame(() => {
        if (image) image.style.transform = 'rotate(0deg)';
        setTransition('travel');
        revealTimer = window.setTimeout(() => { setTransition('reveal'); finishTimer = window.setTimeout(finish, 200); }, 700);
      });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(nextFrame); clearTimeout(revealTimer); clearTimeout(finishTimer); };
  }, [phase, reducedMotion, moonTarget?.x, moonTarget?.y, moonTarget?.radius]);
  const count = Math.max(0, Math.min(Math.max(0, total), completed));
  const counted = phase !== 'graphics' && total > 0;
  const heading = phase === 'graphics' ? 'Opening your night sky' : phase === 'scene' ? 'Preparing the waterfront' : 'Your sky is ready';
  const travelling = transition !== 'preparing' && moonTarget;
  return <section className='startup-screen' data-startup-phase={phase} data-startup-transition={transition} data-reduced-motion={reducedMotion} aria-label='Preparing the night sky'>
    <div className='startup-moon-orbit' aria-hidden='true' style={travelling ? { left: moonTarget.x, top: moonTarget.y, width: moonTarget.radius * 2 / .95, height: moonTarget.radius * 2 / .95 } : undefined}>
      <img ref={moon} src='./art/moon-lro-v001.png' alt='' width='128' height='128' draggable='false' onLoad={event => { event.currentTarget.parentElement?.setAttribute('data-moon-ready', 'true'); }} onError={event => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.setAttribute('data-moon-ready', 'false'); event.currentTarget.parentElement?.setAttribute('data-moon-failed', 'true'); }}/>
    </div>
    <div className='startup-content startup-card'>
      <h2>{heading}</h2>
      <p className='startup-detail' role='status' aria-live='polite' aria-atomic='true'>{detail || (phase === 'graphics' ? 'Starting the graphics engine.' : phase === 'scene' ? 'Loading the scene details.' : 'Choose a firework, then tap to launch.')}</p>
      <div className={`startup-progress${counted ? '' : ' is-indeterminate'}`} role='progressbar' aria-label={phase === 'graphics' ? 'Graphics initialization' : 'Scene asset preparation'} aria-valuemin={counted ? 0 : undefined} aria-valuemax={counted ? total : undefined} aria-valuenow={counted ? count : undefined} aria-valuetext={counted ? `${count} of ${total} scene assets prepared` : 'In progress'}><span style={counted ? { width: `${count / total * 100}%` } : undefined}/></div>
      <div className='startup-checkpoints' aria-label='Preparation steps'><span data-active={phase === 'graphics'} data-complete={phase !== 'graphics'}>Graphics</span><span data-active={phase === 'scene'} data-complete={phase === 'ready'}>Scene{counted && <small>{count} / {total}</small>}</span><span data-active={phase === 'ready'}>Ready</span></div>
      {slow && <p className='startup-note'>This is taking longer than usual. Compatibility graphics is available below.</p>}
      {degraded && <p className='startup-note'>Some visual details are unavailable. You can enter with the scene that is ready.</p>}
      <div className='startup-actions'>{onContinue && <button type='button' onClick={onContinue}>Enter with available detail</button>}<a href='?backend=canvas'>Use compatibility graphics</a></div>
      <p className='startup-next'>Next: tap a firework to launch. Drag it into the sky for an immediate burst.</p>
    </div>
  </section>;
}

