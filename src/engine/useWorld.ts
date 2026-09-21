import { useCallback, useEffect, useRef, useState } from 'react';
import { Simulation } from './Simulation';
import { AudioEngine } from './Audio';
import { familyIndex } from './catalog';
import { QualityGovernor } from './QualityGovernor';
import { advanceVisibleFrame } from './VisibleFrame';
import { PauseIntent } from '../platform/PauseIntent';
import { parsePresentation } from '../platform/presentation';
import type { Presentation } from '../platform/presentation';
import type { ShowPreset } from './catalog';
import type { Preferences } from '../platform/preferences';
import type { FireworkRenderer } from './Renderer';
/** DOM owns controls; one fixed simulation clock owns all fireworks and their sound events. */
export function useWorld(host: React.RefObject<HTMLDivElement | null>, preferences: Preferences, epoch: number, notice: (text: string) => void, presentation: Presentation = parsePresentation('')) {
    const prefs = useRef(preferences);
    const display = useRef(presentation);
    prefs.current = preferences;
    display.current = presentation;
    const [initial] = useState(() => new Simulation(presentation.seed));
    const sim = useRef(initial);
    const audio = useRef<AudioEngine | null>(null);
    const renderer = useRef<FireworkRenderer | null>(null);
    const intent = useRef(new PauseIntent());
    const [snapshot, setSnapshot] = useState(() => initial.snapshot());
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [backend, setBackend] = useState('Starting');
    const [soundActive, setSoundActive] = useState(false);
    const [metrics, setMetrics] = useState({ renderPixels: 0, submitMs: 0, frames: 0, p95Ms: 0 });
    const soundWanted = useRef(false);
    const alive = useRef(false);
    const soundRequest = useRef(0);
    const status = useRef({ ready, error });
    status.current = { ready, error };
    const refresh = useCallback(() => setSnapshot(sim.current.snapshot()), []);
    const syncPause = useCallback(() => {
        const paused = intent.current.paused;
        sim.current.setPaused(paused);
        audio.current?.setSuspended(paused || document.hidden);
        refresh();
    }, [refresh]);
    useEffect(() => {
        let cancelled = false;
        let frame = 0;
        let last = 0;
        let lastRender = 0;
        let lastReport = 0;
        let lastQuality = 0;
        let warmFrames = 0;
        let captureFrozen = false;
        let previousVisualState = '';
        let previouslyMoving = false;
        let graphics: FireworkRenderer | null = null;
        const governor = new QualityGovernor();
        alive.current = true;
        setReady(false);
        setError('');
        setBackend('Starting');
        setSoundActive(false);
        soundWanted.current = false;
        soundRequest.current++;
        intent.current.block('graphics', false);
        intent.current.block('hidden', document.hidden);
        const state = new Simulation(presentation.seed);
        sim.current = state;
        state.selected = prefs.current.family;
        state.reducedFlashes = prefs.current.reducedFlashes;
        state.quality = prefs.current.quality === 'auto' ? 'standard' : prefs.current.quality;
        state.protectCenter = display.current.protect;
        state.safeRect = [...display.current.safeRect];
        state.setPaused(intent.current.paused);
        const sound = new AudioEngine();
        audio.current = sound;
        sound.setSuspended(intent.current.paused || document.hidden);
        const fail = (message: string) => {
            if (cancelled)
                return;
            intent.current.block('graphics', true);
            state.setPaused(true);
            sound.setSuspended(true);
            setError(message);
            setReady(false);
            refresh();
        };
        const tick = (now: number) => {
            if (cancelled)
                return;
            const elapsed = last ? (now - last) / 1000 : 0;
            last = now;
            if (!document.hidden && !state.paused && !captureFrozen) {
                advanceVisibleFrame(state, elapsed);
                sound.consume(state.drainEvents(), state.width);
                const targetFps = display.current.fps === 30 || state.quality === 'low' ? 30 : 60;
                // The empty observatory is static. Redraw selection/placement immediately,
                // but do not shade the same idle floor and bloom graph sixty times a second.
                const visualState = `${state.selected}:${state.placement}:${state.quality}:${state.reducedFlashes}:${display.current.mode}:${state.rearming}:${Boolean(state.committed)}`;
                const moving = state.holding || state.heads.count > 0 || state.trails.count > 0 ||
                    state.smoke.count > 0 || state.embers.count > 0 || state.cues.length > 0 ||
                    state.lights.length > 0 || state.rockets.some(rocket => rocket.stage !== 'afterglow');
                if (!lastRender || visualState !== previousVisualState ||
                    ((moving || previouslyMoving) && now - lastRender >= 1000 / targetFps - 1.2)) {
                    previousVisualState = visualState;
                    previouslyMoving = moving;
                    const cadence = lastRender ? now - lastRender : 1000 / targetFps;
                    lastRender = now;
                    try {
                        graphics?.render();
                    }
                    catch {
                        fail('Graphics were interrupted. Try lower quality or restart the scene.');
                    }
                    if (++warmFrames > 60)
                        governor.add(cadence);
                }
                if (prefs.current.quality === 'auto' && now - lastQuality > 1500 && warmFrames > 90) {
                    lastQuality = now;
                    const next = governor.evaluate(state.quality, targetFps, true);
                    if (next !== state.quality) {
                        state.quality = next;
                        graphics?.setQuality(next);
                    }
                }
            }
            else {
                lastRender = 0;
            }
            if (now - lastReport > 120) {
                lastReport = now;
                refresh();
                if (graphics)
                    setMetrics({ ...graphics.metrics, p95Ms: governor.p95 });
            }
            frame = requestAnimationFrame(tick);
        };
        const resize = () => {
            graphics?.resize();
            // A resize clears the canvas, including while the idle scene is render-on-demand.
            try {
                graphics?.render();
            }
            catch { /* Recovery UI remains usable. */ }
        };
        const onVisibility = () => {
            last = 0;
            lastRender = 0;
            if (document.hidden) {
                intent.current.setManual(true);
                state.message = 'Paused while you were away. Resume when you are ready.';
            }
            intent.current.block('hidden', document.hidden);
            syncPause();
        };
        const bounds = new ResizeObserver(resize);
        if (host.current) bounds.observe(host.current);
        for (const element of host.current?.parentElement?.querySelectorAll('.flow-command, .flow-deck-wrap') || []) bounds.observe(element);
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibility);
        void import('./Renderer').then(async (module) => {
            if (cancelled || !host.current)
                return;
            const forced = new URLSearchParams(location.search).get('backend') === 'webgl';
            graphics = new module.FireworkRenderer(host.current, state, fail, forced);
            renderer.current = graphics;
            graphics.setDisplay(display.current.mode);
            await graphics.init();
            if (cancelled) {
                graphics.dispose();
                return;
            }
            setBackend(graphics.backend);
            setReady(true);
            // Starting a show through an explicit presentation link never activates sound.
            if (display.current.mode !== 'interactive' && display.current.show)
                state.startShow(display.current.show);
            state.setPaused(intent.current.paused);
            sound.setSuspended(state.paused);
            refresh();
            frame = requestAnimationFrame(tick);
            if (new URLSearchParams(location.search).get('qa') === '1') {
                const target = window as unknown as {
                    __firecrackersQA?: unknown;
                };
                target.__firecrackersQA = {
                    snapshot: () => ({ ...state.snapshot(), backend: graphics?.backend, ...graphics?.metrics, ...graphics?.diagnostics() }),
                    freeze: (value: boolean) => { captureFrozen = Boolean(value); last = 0; },
                    advance: (seconds: number) => {
                        if (!Number.isFinite(seconds) || seconds < 0 || seconds > 120)
                            return;
                        const paused = state.paused;
                        state.setPaused(false);
                        for (let i = 0; i < Math.ceil(seconds * 60); i++)
                            state.advance(1 / 60);
                        state.drainEvents();
                        state.setPaused(paused);
                        graphics?.render();
                        refresh();
                    },
                    render: () => graphics?.render(),
                };
            }
        }).catch(failure => {
            console.error('Firecrackers graphics initialization failed:', failure);
            fail('Graphics are unavailable. Try lower quality, another browser, or a fresh scene.');
        });
        return () => {
            cancelled = true;
            alive.current = false;
            soundRequest.current++;
            cancelAnimationFrame(frame);
            bounds.disconnect();
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            delete (window as unknown as {
                __firecrackersQA?: unknown;
            }).__firecrackersQA;
            sound.dispose();
            graphics?.dispose();
            renderer.current = null;
            audio.current = null;
        };
    }, [epoch, presentation.seed, host, refresh, syncPause]);
    useEffect(() => {
        sim.current.reducedFlashes = preferences.reducedFlashes;
        if (preferences.quality !== 'auto') {
            sim.current.quality = preferences.quality;
            renderer.current?.setQuality(preferences.quality);
        }
        audio.current?.setOptions(preferences.volume, preferences.haptics, preferences.ambience);
        if (sim.current.paused) {
            try {
                renderer.current?.render();
            }
            catch { /* Keep controls available. */ }
        }
    }, [preferences.quality, preferences.reducedFlashes, preferences.volume, preferences.haptics, preferences.ambience]);
    useEffect(() => {
        sim.current.protectCenter = presentation.protect;
        sim.current.safeRect = [...presentation.safeRect];
        renderer.current?.setDisplay(presentation.mode);
        try {
            renderer.current?.render();
        }
        catch { /* Initialization reports failures separately. */ }
    }, [presentation.mode, presentation.protect, presentation.safeRect]);
    const configureSound = async (enabled: boolean) => {
        const request = ++soundRequest.current;
        soundWanted.current = enabled;
        const p = prefs.current;
        const success = await audio.current?.configure(enabled, p.volume, p.haptics, p.ambience);
        if (request !== soundRequest.current || !alive.current)
            return false;
        audio.current?.setSuspended(intent.current.paused || document.hidden);
        setSoundActive(Boolean(success));
        if (enabled && !success) {
            soundWanted.current = false;
            notice('Sound could not start. Tap the sound control to try again.');
        }
        return Boolean(success);
    };
    const pause = (value: boolean) => {
        if (!value && (!status.current.ready || status.current.error))
            return;
        intent.current.setManual(value);
        syncPause();
    };
    const setOverlay = useCallback((value: boolean) => {
        intent.current.block('overlay', value);
        syncPause();
    }, [syncPause]);
    const start = (preset: ShowPreset) => {
        if (!status.current.ready || status.current.error)
            return;
        intent.current.setManual(false);
        sim.current.startShow(preset);
        syncPause();
    };
    const ignite = () => {
        if (status.current.ready && !status.current.error) {
            sim.current.ignite('manual', familyIndex(sim.current.selected));
            refresh();
        }
    };
    const reset = () => {
        audio.current?.stop();
        intent.current.setManual(false);
        sim.current.reset();
        sim.current.protectCenter = display.current.protect;
        sim.current.safeRect = [...display.current.safeRect];
        syncPause();
        try {
            renderer.current?.render();
        }
        catch { /* A new renderer can be requested by epoch. */ }
    };
    const positionFromPointer = (clientX: number) => renderer.current?.projectPlacement(clientX) ?? .5;
    return { sim, ready, error, backend, snapshot, metrics, soundActive, configureSound, pause, setOverlay, start, ignite, reset, refresh, positionFromPointer };
}
