import { useCallback, useEffect, useRef, useState } from 'react';
import { measureStage, stageFraming } from './StageLayout';
import { signatureCompositionScale } from './LaunchProfile';
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
import type { AlwaysPace } from './AlwaysPlayDirector';
import type { ShowPreset } from './catalog';
import type { Preferences } from '../platform/preferences';
import type { RendererPort } from './RendererPort';
import { CompatibilityRenderer } from '../graphics/CompatibilityRenderer';
import { NativeRenderRecovery, withDeadline } from './RendererRecovery';
import { SkyInteraction, acceptsSkyPointer, skyCadence, skyMotionAllowed, skyPointFromPointer } from './SkyState';
import { StartupProgress } from './StartupProgress';
import { SceneCapture } from '../experience/SceneCapture';
import type { CaptureSnapshot } from '../experience/SceneCapture';
import { SessionDiagnostics } from '../experience/SessionDiagnostics';
import { RenderBudget } from './RenderBudget';
import { parseRecipe } from '../experience/ShowRecipe';
import type { ShowRecipe } from '../experience/ShowRecipe';
import type { ShowTheme } from './CinematicDirector';
export type DropTarget = { kind: 'burst'; point: [number, number]; compositionScale: number } | { kind: 'launch'; placement: number };
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
    const startupControl = useRef(new StartupProgress());
    const [startupState, setStartupState] = useState(() => startupControl.current.snapshot);
    const updateStartupRef = useRef<(() => void) | null>(null);
    const [error, setError] = useState('');
    const [backend, setBackend] = useState('Starting');
    const [soundActive, setSoundActive] = useState(false);
    const [metrics, setMetrics] = useState({ renderPixels: 0, submitMs: 0, frames: 0, p95Ms: 0 });
    const capture = useRef<SceneCapture | null>(null);
    const diagnostics = useRef<SessionDiagnostics | null>(null);
    const [captureState, setCaptureState] = useState<CaptureSnapshot>({ recording: false, seconds: 0, limit: 15, result: null, error: '' });
    const [resolutionScale, setResolutionScale] = useState(1);
    const [diagnosticsActive, setDiagnosticsActive] = useState(false);
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
        if (paused || document.hidden) {
            capture.current?.stop(document.hidden ? 'Recording finished when the page was hidden.' : 'Recording finished when the scene paused.');
            diagnostics.current?.pause();
        }
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
        const budget = new RenderBudget();
        const recorder = new SceneCapture();
        const session = new SessionDiagnostics();
        capture.current = recorder; diagnostics.current = session;
        recorder.onChange = () => { if (!cancelled) setCaptureState({ ...recorder.snapshot }); };
        setCaptureState({ ...recorder.snapshot }); setResolutionScale(1); setDiagnosticsActive(false);
        const presented = () => {
            graphics?.render();
            recorder.frame(host.current?.querySelector('canvas') ?? null, sim.current.time);
        };
        const overload = new NativeRenderRecovery();
        const recoveryHistory: unknown[] = [];
        const sky = new SkyInteraction();
        const osMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
        let stageLayout: StageLayout | null = null;
        let skyHorizon = .72;
        let contactId: number | null = null;
        alive.current = true;
        setReady(false);
        const preparation = new StartupProgress();
        startupControl.current = preparation;
        setStartupState(preparation.snapshot);
        setError('');
        setBackend('Starting');
        setSoundActive(false);
        soundWanted.current = false;
        soundRequest.current++;
        intent.current.block('graphics', false);
        intent.current.block('startup', true);
        intent.current.block('hidden', document.hidden);
        const state = new Simulation(presentation.seed);
        sim.current = state;
        state.setLaunchProfileResolver((id, placement) => renderer.current?.resolveLaunchProfile(id, placement));
        state.always.setPace(display.current.mode === 'interactive' ? prefs.current.alwaysPace : display.current.pace);
        state.setShowThemes(display.current.mode === 'interactive' ? prefs.current.finaleTheme : display.current.theme ?? prefs.current.finaleTheme,
            display.current.mode === 'interactive' ? prefs.current.endlessTheme : display.current.theme ?? prefs.current.endlessTheme);
        state.selected = prefs.current.family;
        state.setPlacement(prefs.current.placement);
        state.setPlacementMode(prefs.current.placementMode);
        state.reducedFlashes = prefs.current.reducedFlashes;
        state.cinematicExposure = prefs.current.cinematicExposure;
        state.cameraMotion = prefs.current.cameraMotion;
        state.quality = prefs.current.quality === 'auto' ? 'standard' : prefs.current.quality;
        state.protectCenter = display.current.protect;
        state.safeRect = [...display.current.safeRect];
        state.setPaused(intent.current.paused);
        const sound = new AudioEngine(notice);
        audio.current = sound;
        sound.setHeadphones(prefs.current.headphones);
        sound.setMusicOptions(prefs.current.showMusic, prefs.current.musicVolume);
        sound.setSuspended(intent.current.paused || document.hidden);
        let startupPending = true;
        let startupSettled = false;
        const publishStartup = () => {
            if (cancelled || !runtimeReady || !graphics || startupSettled) return;
            const assets = graphics.readiness();
            const value = preparation.update(assets, performance.now());
            startupSettled = !assets.pending;
            setStartupState(previous => previous.phase === value.phase && previous.completed === value.completed &&
                previous.total === value.total && previous.detail === value.detail && previous.pending === value.pending &&
                previous.degraded === value.degraded ? previous : value);
            if (startupPending !== value.pending) {
                startupPending = value.pending;
                intent.current.block('startup', value.pending);
                state.setPaused(intent.current.paused);
                sound.setSuspended(intent.current.paused || document.hidden);
                refresh();
            }
        };
        updateStartupRef.current = publishStartup;
        const motionAllowed = () => {
            state.reducedMotion = prefs.current.reducedMotion || Boolean(osMotion?.matches);
            return skyMotionAllowed(state.quality, prefs.current.reducedMotion, Boolean(osMotion?.matches), display.current.mode);
        };
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
            // The candidate has no launch bounds until its first resize in init.
            if (!runtimeReady || !graphics) return;
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
                presented();
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
            recorder.stop('Recording finished because graphics needed recovery.');
            session.pause();
            switchingGraphics = true;
            if (recoveryHistory.length === 8) recoveryHistory.shift();
            recoveryHistory.push({ time: state.time, from: previous.backend, reason, graphics: previous.diagnostics() });
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
                replacement.setResolutionScale?.(budget.scale);
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
                sound.updateMusic(state.show, state.cinematic, state.time);
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
                        presented();
                        rendered = true;
                        lastSkyRender = now;
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                    }
                    catch {
                        fail('Graphics were interrupted. Try lower quality or restart the scene.');
                    }
                    if (rendered && continuous) session.frame(now, graphics?.backend ?? 'Unknown', state.quality, budget.scale);
                    else session.pause();
                    if (++warmFrames > 60 && continuous && cadence < 500)
                        governor.add(cadence);
                    let observedMs = Math.max(cadence, graphics?.metrics.submitMs || 0);
                    if (continuous && qaStallSamplesRemaining > 0) {
                        observedMs = Math.max(observedMs, qaStallMs);
                        qaStallSamplesRemaining--;
                        qaStallSamplesUsed++;
                    }
                    if (rendered && warmFrames > 60 && state.show === 'always') state.always.observe(state.time, observedMs, continuous);
                    if (rendered && graphics && !graphics.backend.startsWith('Canvas')) {
                        const response = overload.observe(observedMs, continuous, state.quality === 'low');
                        if (response === 'reduce-quality') {
                            state.quality = 'low'; graphics.setQuality('low');
                            lastQuality = now; lastSkyRender = 0; skyDirty = true;
                            notice(`${graphics.backend} is staying active with Low detail after rendering pressure. Glow and water reflections remain on; your saved quality choice is unchanged.`);
                        } else if (response === 'recover') void recoverOverload('sustained slow frames after Low-detail recovery');
                    }
                    else if (!continuous)
                        overload.reset();
                }
                else if (!switchingGraphics && skyDue) {
                    try {
                        presented();
                        lastSkyRender = now;
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                        if (sky.responding) skyResponseFrames++;
                        else skyAmbientFrames++;
                    } catch { fail('Graphics were interrupted. Try lower quality or restart the scene.'); }
                }
                if (now - lastQuality > 1500 && warmFrames > 90) {
                    lastQuality = now;
                    const next = governor.evaluate(state.quality, targetFps, prefs.current.quality === 'auto');
                    const oldScale = budget.scale;
                    const scale = budget.evaluate(governor.p95, prefs.current.adaptiveResolution);
                    if (scale !== oldScale) { graphics?.setResolutionScale?.(scale); setResolutionScale(scale); skyDirty = true; }
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
                session.pause();
                lastRender = 0;
                overload.reset();
                previouslyMoving = false;
            }
            if (now - lastReport > 120) {
                lastReport = now;
                publishStartup();
                refresh();
                if (recorder.snapshot.recording) setCaptureState({ ...recorder.snapshot });
                setDiagnosticsActive(session.active);
                if (graphics)
                    setMetrics({ ...graphics.metrics, p95Ms: governor.p95 });
            }
            frame = requestAnimationFrame(tick);
        };
        const resize = () => {
            // Initial observer notifications can arrive while GPU preparation is
            // awaiting its device or reflection materials. Startup owns that view.
            if (cancelled || !runtimeReady || switchingGraphics || !graphics) return;
            recorder.stop('Recording finished because the scene size changed.');
            // Resizing also redraws an idle/paused canvas. Failures retain recovery controls.
            try {
                updateLayout();
                graphics?.resize();
                cacheHorizon();
                publishSky(false);
                presented();
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
        for (const element of host.current?.parentElement?.querySelectorAll('[data-control-rail], [data-family-tray], [data-mode-control], [data-position-control]') || []) bounds?.observe(element);
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
                setStartupState(preparation.graphics(1, `Starting ${candidate.backend}`));
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
                if (preferred !== 'canvas') notice('Compatibility graphics is active. All thirteen fireworks are still playable.');
            }
            if (cancelled || !graphics) return;
            intent.current.block('graphics', false);
            setError('');
            setBackend((graphics as RendererPort).backend);
            setReady(true);
            runtimeReady = true;
            preparation.initialized(performance.now(), (graphics as RendererPort).readiness());
            publishStartup();
            // Replay current dimensions after preparation: resize events during
            // asynchronous warm-up were deferred rather than touching that pass.
            resize();
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
                    snapshot: () => ({ ...state.snapshot(), recoveryHistory: [...recoveryHistory], startup: preparation.snapshot, backend: graphics?.backend, ...graphics?.metrics, ...graphics?.diagnostics(), ...sound.diagnostics(), resolutionScale: budget.scale, capture: { recording: recorder.snapshot.recording, seconds: recorder.snapshot.seconds, error: recorder.snapshot.error }, diagnosticsActive: session.active, qaStallSamplesUsed, qaStallSamplesRemaining,
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
                        presented();
                        skyLastRenderedTime = sky.state.time;
                        skyDirty = false;
                        skyOneOffFrames++;
                        refresh();
                    },
                    render: () => {
                        publishSky(false);
                        presented();
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
            recorder.dispose(); session.stop();
            if (capture.current === recorder) capture.current = null;
            if (diagnostics.current === session) diagnostics.current = null;
            sound.dispose();
            try { graphics?.dispose(); } catch { /* A failed driver must not break React cleanup. */ }
            renderer.current = null;
            audio.current = null;
            if (updateStartupRef.current === publishStartup) updateStartupRef.current = null;
            if (skyRedraw.current === redrawSky) skyRedraw.current = null;
        };
    }, [epoch, presentation.seed, host, refresh, syncPause]);
    useEffect(() => {
        sim.current.reducedFlashes = preferences.reducedFlashes;
        sim.current.cinematicExposure = preferences.cinematicExposure;
        sim.current.cameraMotion = preferences.cameraMotion;
        if (preferences.quality !== 'auto') {
            sim.current.quality = preferences.quality;
            renderer.current?.setQuality(preferences.quality);
        }
        audio.current?.setOptions(preferences.volume, preferences.haptics, preferences.ambience);
        audio.current?.setHeadphones(preferences.headphones);
        if (!preferences.adaptiveResolution) { renderer.current?.setResolutionScale?.(1); setResolutionScale(1); }
        audio.current?.setMusicOptions(preferences.showMusic, preferences.musicVolume);
        sim.current.setShowThemes(display.current.mode === 'interactive' ? preferences.finaleTheme : display.current.theme ?? preferences.finaleTheme,
            display.current.mode === 'interactive' ? preferences.endlessTheme : display.current.theme ?? preferences.endlessTheme);
        skyRedraw.current?.();
    }, [preferences.quality, preferences.reducedFlashes, preferences.reducedMotion, preferences.volume, preferences.haptics, preferences.ambience, preferences.headphones, preferences.adaptiveResolution, preferences.cinematicExposure, preferences.cameraMotion, preferences.showMusic, preferences.musicVolume, preferences.finaleTheme, preferences.endlessTheme]);
    useEffect(() => {
        sim.current.protectCenter = presentation.protect;
        sim.current.safeRect = [...presentation.safeRect];
        sim.current.setShowThemes(presentation.mode === 'interactive' ? prefs.current.finaleTheme : presentation.theme ?? prefs.current.finaleTheme,
            presentation.mode === 'interactive' ? prefs.current.endlessTheme : presentation.theme ?? prefs.current.endlessTheme);
        renderer.current?.setDisplay(presentation.mode);
        skyRedraw.current?.();
    }, [presentation.mode, presentation.protect, presentation.safeRect, presentation.theme]);
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
    const start = (preset: ShowPreset, pace?: AlwaysPace, theme?: ShowTheme) => {
        if (!status.current.ready || status.current.error)
            return;
        intent.current.setManual(false);
        if (preset === 'always') sim.current.always.setPace(pace ?? (display.current.mode === 'interactive' ? prefs.current.alwaysPace : display.current.pace));
        sim.current.setShowThemes(theme ?? (display.current.mode === 'interactive' ? prefs.current.finaleTheme : display.current.theme ?? prefs.current.finaleTheme), theme ?? (display.current.mode === 'interactive' ? prefs.current.endlessTheme : display.current.theme ?? prefs.current.endlessTheme));
        sim.current.startShow(preset);
        syncPause();
    };
    // Configuration changes do not take ownership of the user's explicit pause.
    const setShowMode = (preset: ShowPreset | null) => {
        if (!status.current.ready || status.current.error || (sim.current.show === preset && !['playing','falling'].includes(sim.current.personal.status))) return;
        if (preset) sim.current.startShow(preset);
        else sim.current.stopShow();
        syncPause();
    };
    const setPlacement = (value: number) => {
        sim.current.setPlacement(value);
        sim.current.setPlacementMode('fixed');
        skyRedraw.current?.();
        refresh();
    };
    const setPlacementMode = (value: 'fixed' | 'random') => {
        sim.current.setPlacementMode(value);
        skyRedraw.current?.();
        refresh();
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
        capture.current?.stop('Recording finished before restarting the sky.');
        diagnostics.current?.pause();
        audio.current?.cancelScheduled();
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
    const dropTarget = (x: number, y: number, id?: FamilyId): DropTarget | null => {
        const graphics = renderer.current, element = host.current;
        if (!graphics || !element || display.current.mode !== 'interactive' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
        const layout = measureStage(element);
        graphics.setLayout(layout);
        const localX = x - layout.viewport.x, localY = y - layout.viewport.y;
        if (localX < 0 || localY < 0 || localX > layout.viewport.width || localY > layout.viewport.height) return null;
        if (Object.values(layout.controls).some(control => inside(localX, localY, control))) return null;
        if (inside(localX, localY, layout.burstCanopy)) {
            const point = graphics.projectBurst(x, y);
            return point ? { kind: 'burst', point, compositionScale: signatureCompositionScale(layout, stageFraming(layout).scale, localX, localY) } : null;
        }
        if (inside(localX, localY, layout.launchArea)) {
            const placement = graphics.projectPlacement(x, id);
            return Number.isFinite(placement) ? { kind: 'launch', placement } : null;
        }
        return null;
    };
    const drop = (id: FamilyId, x: number, y: number) => {
        const target = dropTarget(x, y, id);
        if (!target || !status.current.ready || status.current.error) return false;
        const admitted = target.kind === 'burst'
            ? sim.current.burstAt(id, ...target.point, target.compositionScale)
            : sim.current.igniteFamily(id, target.placement);
        refresh(); return admitted;
    };
    const positionFromPointer = (clientX: number) => renderer.current?.projectPlacement(clientX) ?? .5;
    const previewPosition = (placement: number) => renderer.current?.projectLaunchPosition(placement) ?? [0, 0];
    const playRecipe = (input: ShowRecipe): string | void => {
        if (!status.current.ready || status.current.error) return 'The scene is still preparing. Try again when it is ready.';
        try {
            const recipe = parseRecipe(input);
            const profiles = recipe.cues.map(cue => renderer.current?.resolveLaunchProfile(cue.family, cue.position));
            // Preflight occurs inside start before any reset; an invalid recipe leaves the current night alone.
            sim.current.personal.start(recipe, profiles);
            capture.current?.stop('Recording finished before starting a new night.');
            audio.current?.cancelScheduled(); diagnostics.current?.pause();
            intent.current.setManual(false); syncPause(true);
        } catch (error) { return error instanceof Error ? error.message : 'This show could not start.'; }
    };
    const stopRecipe = () => { sim.current.stopShow(); audio.current?.cancelScheduled(); refresh(); };
    const takePhoto = async () => {
        const canvas = host.current?.querySelector('canvas');
        if (!canvas || !capture.current || !renderer.current) throw new Error('The scene is not ready for capture.');
        await capture.current.photo(canvas, () => renderer.current?.render());
    };
    const startClip = (seconds: number, includeAudio: boolean) => {
        const canvas = host.current?.querySelector('canvas');
        if (!canvas || !capture.current || !renderer.current) throw new Error('The scene is not ready for capture.');
        if (intent.current.userPaused || document.hidden) throw new Error('Resume the night before recording a clip.');
        capture.current.start(canvas, () => renderer.current?.render(), seconds, includeAudio ? audio.current?.captureAudio() : undefined);
    };
    const startDiagnostics = () => { diagnostics.current?.start(); setDiagnosticsActive(true); };
    const stopDiagnostics = () => { diagnostics.current?.stop(); setDiagnosticsActive(false); };
    const continueStartup = () => { startupControl.current.continue(); updateStartupRef.current?.(); };
    const startupMoon = () => renderer.current?.startupMoon() ?? null;
    return { sim, capture: captureState, takePhoto, startClip, stopClip: () => capture.current?.stop(),
        downloadCapture: () => capture.current?.download(), shareCapture: () => capture.current?.share(),
        discardCapture: () => { capture.current?.discard(); if (capture.current) setCaptureState({ ...capture.current.snapshot }); },
        resolutionScale, diagnosticsActive, startDiagnostics, stopDiagnostics, downloadDiagnostics: () => diagnostics.current?.download(),
        playRecipe, stopRecipe, ready, startup: startupState, continueStartup, startupMoon, error, backend, snapshot, metrics, soundActive, configureSound, pause, setOverlay, start, setShowMode, setPlacement, setPlacementMode, ignite, igniteFamily, reset, refresh, positionFromPointer, previewPosition, heroRect, dropTarget, drop };
}
