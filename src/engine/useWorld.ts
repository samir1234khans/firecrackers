import { useCallback, useEffect, useRef, useState } from 'react';
import { measureStage } from './StageLayout';
import type { StageLayout, StageRect } from './StageLayout';
import type { FamilyId } from './catalog';
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
import type { RendererPort } from './RendererPort';
import { CompatibilityRenderer } from '../graphics/CompatibilityRenderer';
import { RenderOverloadGuard, withDeadline } from './RendererRecovery';
import { SkyInteraction, acceptsSkyPointer, skyCadence, skyMotionAllowed, skyPointFromPointer } from './SkyState';
export type DropTarget = { kind: 'burst'; point: [number, number] } | { kind: 'launch'; placement: number };
const inside = (x: number, y: number, r: StageRect) =>
    x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
/** DOM owns controls; one fixed simulation clock owns all fireworks and their sound events. */
export function useWorld(host: React.RefObject<HTMLDivElement | null>, preferences: Preferences, epoch: number, notice: (text: string) => void, presentation: Presentation = parsePresentation('')) {
    const prefs = useRef(preferences);
    const display = useRef(presentation);
    prefs.current = preferences;
    display.current = presentation;
    const [initial] = useState(() => new Simulation(presentation.seed));
    const sim = useRef(initial);
    const audio = useRef<AudioEngine | null>(null);
    const renderer = useRef<RendererPort | null>(null);
    const skyRedraw = useRef<((reset?: boolean) => void) | null>(null);
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
    const syncPause = useCallback((resetSky = false) => {
        const paused = intent.current.paused;
        sim.current.setPaused(paused);
        audio.current?.setSuspended(paused || document.hidden);
        skyRedraw.current?.(resetSky);
        refresh();
    }, [refresh]);
    useEffect(() => {
        let cancelled = false;
        let frame = 0;
        let layoutFrame = 0;
        let last = 0;
        let lastRender = 0;
        let lastSkyRender = 0;
        let skyDirty = true;
        let skyAmbientFrames = 0;
        let skyResponseFrames = 0;
        let skyOneOffFrames = 0;
        let skyLastRenderedTime = 0;
        let lastReport = 0;
        let lastQuality = 0;
        let warmFrames = 0;
        let captureFrozen = false;
        let previousVisualState = '';
        let previouslyMoving = false;
        let graphics: RendererPort | null = null;
        let switchingGraphics = false;
        let runtimeReady = false;
        // Deterministic browser qualification exercises the real recovery path
        // without depending on the CI machine's GPU speed.
        let qaStallMs = 0;
        let qaStallSamplesRemaining = 0;
        let qaStallSamplesUsed = 0;
        const startup = new AbortController();
        const governor = new QualityGovernor();
        const overload = new RenderOverloadGuard();
        const sky = new SkyInteraction();
        const osMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
        let stageLayout: StageLayout | null = null;
        let skyHorizon = .72;
        let contactId: number | null = null;
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
        const motionAllowed = () => skyMotionAllowed(state.quality, prefs.current.reducedMotion,
            Boolean(osMotion?.matches), display.current.mode);
        const responseAllowed = () => !state.paused && !document.hidden && !captureFrozen;
        const publishSky = (respond = responseAllowed(), candidate = graphics) => {
            const value = sky.update(state.time, motionAllowed(), respond);
            candidate?.setSkyState(value);
        };
        const releaseSky = () => {
            contactId = null;
            sky.release();
        };
        const cacheHorizon = () => {
            const horizon = graphics?.diagnostics().skyHorizon;
            if (typeof horizon === 'number' && Number.isFinite(horizon)) skyHorizon = Math.max(0, Math.min(1, horizon));
        };
        const fail = (message: string) => {
            if (cancelled)
                return;
            if (runtimeReady && !switchingGraphics && graphics?.backend === 'WebGPU') {
                void recoverOverload(message);
                return;
            }
            intent.current.block('graphics', true);
            state.setPaused(true);
            sound.setSuspended(true);
            setError(message);
            setReady(false);
            refresh();
        };
        const redrawSky = (reset = false) => {
            if (cancelled) return;
            if (reset) sky.reset(state.time);
            if (!responseAllowed() || !motionAllowed()) releaseSky();
            publishSky();
            skyDirty = true;
            if (!runtimeReady || switchingGraphics || document.hidden) return;
            try {
                graphics?.render();
                lastSkyRender = performance.now();
                skyLastRenderedTime = sky.state.time;
                skyDirty = false;
                skyOneOffFrames++;
            } catch { fail('Graphics were interrupted. Try lower quality or restart the scene.'); }
        };
        skyRedraw.current = redrawSky;
        const recoverOverload = async (reason = 'repeated slow frames') => {
            const target = host.current;
            const previous = graphics;
            if (cancelled || switchingGraphics || !target || !previous || previous.backend.startsWith('Canvas')) return;
            switchingGraphics = true;
            setBackend('Recovering graphics');
            let replacement: RendererPort | null = null;
            try {
                if (previous.backend === 'WebGPU') {
                    try {
                        const module = await import('./Renderer');
                        replacement = new module.FireworkRenderer(target, state, fail, true);
                        replacement.setDisplay(display.current.mode);
                        publishSky(false, replacement);
                        await withDeadline(replacement.init(), startup.signal, 10000);
                    } catch {
                        replacement?.dispose();
                        replacement = null;
                    }
                }
                if (!replacement) {
                    replacement = new CompatibilityRenderer(target, state);
                    replacement.setDisplay(display.current.mode);
                    publishSky(false, replacement);
                    await replacement.init();
                }
                if (cancelled) { replacement.dispose(); return; }
                graphics = replacement;
                renderer.current = replacement;
                if (host.current) {
                    stageLayout = measureStage(host.current, display.current.mode === 'interactive');
                    replacement.setLayout(stageLayout);
                }
                cacheHorizon();
                // The old GPU canvas is no longer mounted. Its pending asset load and
                // context-loss callbacks are invalidated by disposal.
                try { previous.dispose(); } catch { /* Keep the working canvas visible. */ }
                overload.reset();
                lastRender = 0;
                lastSkyRender = 0;
                skyDirty = true;
                previousVisualState = '';
                setBackend(replacement.backend);
                intent.current.block('graphics', false);
                state.setPaused(intent.current.paused);
                sound.setSuspended(state.paused || document.hidden);
                setReady(true);
                setError('');
                setMetrics({ ...replacement.metrics, p95Ms: governor.p95 });
                notice(`${replacement.backend} is active after ${reason}. Your quality choice is unchanged.`);
                refresh();
            } catch {
                try { replacement?.dispose(); } catch { /* Recovery controls remain available. */ }
                fail('Graphics could not recover from repeated slow frames. Use compatibility graphics.');
            } finally {
                switchingGraphics = false;
            }
        };
        const tick = (now: number) => {
            if (cancelled)
                return;
            const elapsed = last ? (now - last) / 1000 : 0;
            last = now;
            if (!document.hidden && !state.paused && !captureFrozen) {
                advanceVisibleFrame(state, elapsed);
                sound.consume(state.drainEvents(), state.width);
                publishSky();
                const targetFps = display.current.fps === 30 || state.quality === 'low' || graphics?.backend.startsWith('Canvas') ? 30 : 60;
                // Firework activity, recovery and quality measurement keep their original
                // cadence. Decorative idle frames have a separate bounded schedule.
                const visualState = `${state.selected}:${state.placement}:${state.quality}:${state.reducedFlashes}:${display.current.mode}:${state.rearming}:${Boolean(state.committed)}`;
                const moving = state.holding || state.heads.count > 0 || state.trails.count > 0 ||
                    state.smoke.count > 0 || state.embers.count > 0 || state.cues.length > 0 ||
                    state.lights.length > 0 || state.rockets.some(rocket => rocket.stage !== 'afterglow');
                const fireworkDue = !lastRender || visualState !== previousVisualState ||
                    ((moving || previouslyMoving) && now - lastRender >= 1000 / targetFps - 1.2);
                const ambientFps = skyCadence(state.quality, graphics?.backend || '', sky.responding, sky.state.motionAllowed);
                const skyDue = skyDirty || (ambientFps > 0 && !moving && !previouslyMoving &&
                    now - lastSkyRender >= 1000 / ambientFps);
                if (!switchingGraphics && fireworkDue) {
                    const continuous = moving && previouslyMoving;
                    previousVisualState = visualState;
                    previouslyMoving = moving;
                    const cadence = lastRender ? now - lastRender : 1000 / targetFps;
                    lastRender = now;
                    let rendered = false;
                    try {
                        graphics?.render();
                        rendered = true;
                        lastSkyRender = now;
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                    }
                    catch {
                        fail('Graphics were interrupted. Try lower quality or restart the scene.');
                    }
                    if (++warmFrames > 60 && continuous && cadence < 500)
                        governor.add(cadence);
                    let observedMs = Math.max(cadence, graphics?.metrics.submitMs || 0);
                    if (continuous && qaStallSamplesRemaining > 0) {
                        observedMs = Math.max(observedMs, qaStallMs);
                        qaStallSamplesRemaining--;
                        qaStallSamplesUsed++;
                    }
                    if (rendered && graphics && !graphics.backend.startsWith('Canvas') &&
                        overload.observe(observedMs, continuous))
                        void recoverOverload();
                    else if (!continuous)
                        overload.reset();
                }
                else if (!switchingGraphics && skyDue) {
                    try {
                        graphics?.render();
                        lastSkyRender = now;
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                        if (sky.responding) skyResponseFrames++;
                        else skyAmbientFrames++;
                    } catch { fail('Graphics were interrupted. Try lower quality or restart the scene.'); }
                }
                if (prefs.current.quality === 'auto' && now - lastQuality > 1500 && warmFrames > 90) {
                    lastQuality = now;
                    const next = governor.evaluate(state.quality, targetFps, true);
                    if (next !== state.quality) {
                        state.quality = next;
                        graphics?.setQuality(next);
                        publishSky(false);
                        skyDirty = true;
                    }
                }
            }
            else {
                publishSky(false);
                lastRender = 0;
                overload.reset();
                previouslyMoving = false;
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
            // Resizing also redraws an idle/paused canvas. Failures retain recovery controls.
            try {
                if (switchingGraphics) return;
                updateLayout();
                graphics?.resize();
                cacheHorizon();
                publishSky(false);
                graphics?.render();
                lastSkyRender = performance.now();
                skyLastRenderedTime = sky.state.time;
                skyDirty = false;
                skyOneOffFrames++;
            } catch { fail('The scene could not resize. Try compatibility graphics.'); }
        };
        const onVisibility = () => {
            last = 0;
            lastRender = 0;
            releaseSky();
            if (document.hidden) {
                intent.current.setManual(true);
                state.message = 'Paused while you were away. Resume when you are ready.';
            }
            intent.current.block('hidden', document.hidden);
            syncPause();
        };
        const bounds = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
        if (host.current) bounds?.observe(host.current);
        for (const element of host.current?.parentElement?.querySelectorAll('[data-edge], [data-family-dock]') || []) bounds?.observe(element);
        window.addEventListener('resize', resize);
        window.visualViewport?.addEventListener('resize', resize);
        const updateLayout = () => {
            if (!host.current) return;
            stageLayout = measureStage(host.current, display.current.mode === 'interactive');
            graphics?.setLayout(stageLayout);
            cacheHorizon();
            if (stageLayout.panelOpen || host.current.parentElement?.dataset.dragActive === 'true') releaseSky();
            skyDirty = true;
        };
        const queueLayout = () => {
            cancelAnimationFrame(layoutFrame);
            layoutFrame = requestAnimationFrame(updateLayout);
        };
        const layoutChanges = new MutationObserver(updateLayout);
        if (host.current?.parentElement) layoutChanges.observe(host.current.parentElement, { attributes: true, attributeFilter: ['data-overlay', 'data-drag-active'] });
        for (const dock of host.current?.parentElement?.querySelectorAll('[data-family-dock]') || [])
            layoutChanges.observe(dock, { attributes: true, attributeFilter: ['data-open'] });
        // CSS hover/focus reveals quick actions without changing the edge group
        // size. Refresh only the measured bounds, never the camera framing.
        const stage = host.current?.parentElement;
        const blockedPointer = (event: PointerEvent) => !runtimeReady || !responseAllowed() || !motionAllowed() ||
            display.current.mode !== 'interactive' || stage?.dataset.overlay !== 'none' ||
            stage?.dataset.dragActive === 'true' || (event.target instanceof Element && Boolean(event.target.closest(
                'button, a, input, select, textarea, form, [role="button"], [role="dialog"], [contenteditable="true"], [data-edge], [data-family-dock], [data-stage-control]')));
        const pointForPointer = (event: PointerEvent) => stageLayout &&
            skyPointFromPointer(event.clientX, event.clientY, stageLayout, skyHorizon);
        const onSkyPointerDown = (event: PointerEvent) => {
            // Frozen capture input does not change either the current response or its goal.
            if (captureFrozen) return;
            const valid = acceptsSkyPointer({ type: event.pointerType, isPrimary: event.isPrimary, buttons: event.buttons,
                pointerId: event.pointerId, contactId, blocked: blockedPointer(event) }, true);
            const point = valid ? pointForPointer(event) : null;
            if (point) {
                contactId = event.pointerId;
                sky.target(...point);
            } else if (event.isPrimary) releaseSky();
        };
        const onSkyPointerMove = (event: PointerEvent) => {
            if (captureFrozen) return;
            const valid = acceptsSkyPointer({ type: event.pointerType, isPrimary: event.isPrimary, buttons: event.buttons,
                pointerId: event.pointerId, contactId, blocked: blockedPointer(event) });
            const point = valid ? pointForPointer(event) : null;
            if (point) sky.target(...point);
            else if (event.isPrimary) releaseSky();
        };
        const onSkyPointerEnd = (event: PointerEvent) => {
            if (!captureFrozen && event.pointerId === contactId) releaseSky();
        };
        const onSkyPointerLeave = () => { if (!captureFrozen) releaseSky(); };
        const onMotionPolicy = () => {
            releaseSky();
            redrawSky();
        };
        // These observers never own a pointer, suppress native scrolling, or trigger a launch.
        stage?.addEventListener('pointerdown', onSkyPointerDown, { passive: true });
        stage?.addEventListener('pointermove', onSkyPointerMove, { passive: true });
        stage?.addEventListener('pointerleave', onSkyPointerLeave, { passive: true });
        window.addEventListener('pointerup', onSkyPointerEnd, { passive: true });
        window.addEventListener('pointercancel', onSkyPointerEnd, { passive: true });
        osMotion?.addEventListener('change', onMotionPolicy);
        stage?.addEventListener('pointerover', queueLayout);
        stage?.addEventListener('pointerout', queueLayout);
        stage?.addEventListener('focusin', queueLayout);
        stage?.addEventListener('focusout', queueLayout);
        document.addEventListener('visibilitychange', onVisibility);
        const startGraphics = async () => {
            const target = host.current;
            if (cancelled || !target) return;
            const preferred = new URLSearchParams(location.search).get('backend');
            const begin = async (candidate: RendererPort) => {
                graphics = candidate;
                renderer.current = candidate;
                candidate.setDisplay(display.current.mode);
                publishSky(false, candidate);
                try {
                    await withDeadline(candidate.init(), startup.signal, 10000);
                    if (cancelled) throw new DOMException('Cancelled', 'AbortError');
                } catch (reason) {
                    // Invalidate pending GPU initialization before another canvas can mount.
                    try { candidate.dispose(); } catch { /* Continue to the next supported backend. */ }
                    if (graphics === candidate) graphics = null;
                    if (renderer.current === candidate) renderer.current = null;
                    throw reason;
                }
            };
            let initialized = false;
            if (preferred !== 'canvas') {
                try {
                    const module = await withDeadline(import('./Renderer'), startup.signal, 10000);
                    for (const forceWebGL of preferred === 'webgl' ? [true] : [false, true]) {
                        if (cancelled) return;
                        try {
                            await begin(new module.FireworkRenderer(target, state, fail, forceWebGL));
                            initialized = true;
                            break;
                        } catch {
                            if (cancelled) return;
                            setBackend('Trying compatible graphics');
                        }
                    }
                } catch {
                    if (cancelled) return;
                }
            }
            if (!initialized && !cancelled) {
                await begin(new CompatibilityRenderer(target, state));
                if (preferred !== 'canvas') notice('Compatibility graphics is active. All ten fireworks are still playable.');
            }
            if (cancelled || !graphics) return;
            intent.current.block('graphics', false);
            setError('');
            setBackend((graphics as RendererPort).backend);
            setReady(true);
            runtimeReady = true;
            updateLayout();
            publishSky(false);
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
                    snapshot: () => ({ ...state.snapshot(), backend: graphics?.backend, ...graphics?.metrics, ...graphics?.diagnostics(), ...sound.diagnostics(), qaStallSamplesUsed, qaStallSamplesRemaining,
                        skyState: { ...sky.state }, skyAmbientCadence: skyCadence(state.quality, graphics?.backend || '', sky.responding, sky.state.motionAllowed),
                        skyResponding: sky.responding, skyAmbientFrames, skyResponseFrames, skyOneOffFrames, skyLastRenderedTime, skyFrozen: captureFrozen }),
                    injectOverloadSamples: (count: number, milliseconds: number) => {
                        if (!Number.isInteger(count) || count < 1 || count > 6 || !Number.isFinite(milliseconds) || milliseconds < 100 || milliseconds > 2000)
                            return false;
                        qaStallMs = milliseconds;
                        qaStallSamplesRemaining = count;
                        qaStallSamplesUsed = 0;
                        return true;
                    },
                    freeze: (value: boolean) => {
                        captureFrozen = Boolean(value);
                        contactId = null;
                        if (!captureFrozen) sky.release();
                        last = 0;
                    },
                    advance: (seconds: number) => {
                        if (!Number.isFinite(seconds) || seconds < 0 || seconds > 120)
                            return;
                        const paused = state.paused;
                        state.setPaused(false);
                        for (let i = 0; i < Math.ceil(seconds * 60); i++)
                            state.advance(1 / 60);
                        state.drainEvents();
                        state.setPaused(paused);
                        publishSky(false);
                        graphics?.render();
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                        skyOneOffFrames++;
                        refresh();
                    },
                    render: () => {
                        publishSky(false);
                        graphics?.render();
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                        skyOneOffFrames++;
                    },
                };
            }
        };
        void startGraphics().catch(() => {
            if (!cancelled) fail('The scene could not start. Reload or use compatibility graphics. Your preferences are safe.');
        });
        return () => {
            cancelled = true;
            startup.abort();
            alive.current = false;
            soundRequest.current++;
            cancelAnimationFrame(frame);
            cancelAnimationFrame(layoutFrame);
            bounds?.disconnect();
            layoutChanges.disconnect();
            stage?.removeEventListener('pointerdown', onSkyPointerDown);
            stage?.removeEventListener('pointermove', onSkyPointerMove);
            stage?.removeEventListener('pointerleave', onSkyPointerLeave);
            window.removeEventListener('pointerup', onSkyPointerEnd);
            window.removeEventListener('pointercancel', onSkyPointerEnd);
            osMotion?.removeEventListener('change', onMotionPolicy);
            stage?.removeEventListener('pointerover', queueLayout);
            stage?.removeEventListener('pointerout', queueLayout);
            stage?.removeEventListener('focusin', queueLayout);
            stage?.removeEventListener('focusout', queueLayout);
            window.visualViewport?.removeEventListener('resize', resize);
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            delete (window as unknown as {
                __firecrackersQA?: unknown;
            }).__firecrackersQA;
            sound.dispose();
            try { graphics?.dispose(); } catch { /* A failed driver must not break React cleanup. */ }
            renderer.current = null;
            audio.current = null;
            if (skyRedraw.current === redrawSky) skyRedraw.current = null;
        };
    }, [epoch, presentation.seed, host, refresh, syncPause]);
    useEffect(() => {
        sim.current.reducedFlashes = preferences.reducedFlashes;
        if (preferences.quality !== 'auto') {
            sim.current.quality = preferences.quality;
            renderer.current?.setQuality(preferences.quality);
        }
        audio.current?.setOptions(preferences.volume, preferences.haptics, preferences.ambience);
        skyRedraw.current?.();
    }, [preferences.quality, preferences.reducedFlashes, preferences.reducedMotion, preferences.volume, preferences.haptics, preferences.ambience]);
    useEffect(() => {
        sim.current.protectCenter = presentation.protect;
        sim.current.safeRect = [...presentation.safeRect];
        renderer.current?.setDisplay(presentation.mode);
        skyRedraw.current?.();
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
    const igniteFamily = (id: FamilyId) => {
        if (!status.current.ready || status.current.error) return false;
        const admitted = sim.current.igniteFamily(id);
        refresh();
        return admitted;
    };
    const reset = () => {
        audio.current?.stop();
        intent.current.setManual(false);
        sim.current.reset();
        sim.current.protectCenter = display.current.protect;
        sim.current.safeRect = [...display.current.safeRect];
        syncPause(true);
    };
    const heroRect = () => {
        const l = measureStage(host.current!, display.current.mode === 'interactive');
        return { ...l.heroRect, x: l.heroRect.x + l.viewport.x, y: l.heroRect.y + l.viewport.y };
    };
    const dropTarget = (x: number, y: number): DropTarget | null => {
        const graphics = renderer.current, element = host.current;
        if (!graphics || !element || display.current.mode !== 'interactive' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
        const layout = measureStage(element);
        graphics.setLayout(layout);
        const localX = x - layout.viewport.x, localY = y - layout.viewport.y;
        if (Object.values(layout.controls).some(control => inside(localX, localY, control))) return null;
        if (inside(localX, localY, layout.burstCanopy)) {
            const point = graphics.projectBurst(x, y);
            return point ? { kind: 'burst', point } : null;
        }
        if (inside(localX, localY, layout.launchArea)) {
            const placement = graphics.projectPlacement(x);
            return Number.isFinite(placement) ? { kind: 'launch', placement } : null;
        }
        return null;
    };
    const drop = (id: FamilyId, x: number, y: number) => {
        const target = dropTarget(x, y);
        if (!target || !status.current.ready || status.current.error) return false;
        const admitted = target.kind === 'burst'
            ? sim.current.burstAt(id, ...target.point)
            : sim.current.igniteFamily(id, target.placement);
        refresh(); return admitted;
    };
    const positionFromPointer = (clientX: number) => renderer.current?.projectPlacement(clientX) ?? .5;
    return { sim, ready, error, backend, snapshot, metrics, soundActive, configureSound, pause, setOverlay, start, ignite, igniteFamily, reset, refresh, positionFromPointer, heroRect, dropTarget, drop };
}
