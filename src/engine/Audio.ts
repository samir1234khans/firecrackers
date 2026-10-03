import { SOUND_PROFILES, soundGeometry } from './SoundProfiles';
import { randomStream } from './catalog';
import type { SimEvent } from './Simulation';
/** Opt-in CC0 field recordings plus original synthesis. No autoplay or pre-consent fetch. */
export class AudioEngine {
    private readonly variation = randomStream(82171);
    private readonly samples: AudioBuffer[] = [];
    private loadingSamples = false;
    private readonly fetches = new AbortController();
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private noise: AudioBuffer | null = null;
    private voices = new Set<AudioScheduledSourceNode>();
    private readonly priorities = new Map<AudioScheduledSourceNode, number>();
    private readonly cleanups = new Map<AudioScheduledSourceNode, () => void>();
    private headphones = false;
    private spatialY = 0;
    private spatialZ = -1;
    private captureDestination: MediaStreamAudioDestinationNode | null = null;
    setHeadphones(value: boolean) { this.headphones = value; }
    /** Only the already-consented app output, after volume/compression. No microphone. */
    captureAudio(): { stream: MediaStream; release: () => void } {
        if (!this.enabled || !this.context || !this.compressor || this.context.state !== 'running') throw new Error('Enable sound first, or record without audio.');
        this.releaseCapture();
        const destination = this.context.createMediaStreamDestination();
        this.captureDestination = destination; this.compressor.connect(destination);
        return { stream: destination.stream, release: () => { if (this.captureDestination === destination) this.releaseCapture(); } };
    }
    private releaseCapture() {
        if (!this.captureDestination) return;
        try { this.compressor?.disconnect(this.captureDestination); } catch { /* Already disconnected during disposal. */ }
        this.captureDestination.stream.getTracks().forEach(track => track.stop());
        this.captureDestination.disconnect(); this.captureDestination = null;
    }
    private makeRoom(required: number) {
        for (const voice of this.voices) {
            if (40 - this.voices.size >= required) break;
            if ((this.priorities.get(voice) ?? 1) < 3) { try { voice.stop(); } catch { /* already ended */ } this.cleanups.get(voice)?.(); }
        }
    }
    private timers = new Set<ReturnType<typeof setTimeout>>();
    private ambience: AudioBufferSourceNode | null = null;
    private hapticActive = false;
    private suspended = false;
    private requestGeneration = 0;
    private enabled = false;
    private haptics = false;
    private volume = 0.45;
    private ambient = false;
    private disposed = false;
    async configure(enabled: boolean, volume: number, haptics: boolean, ambience: boolean) {
        if (this.disposed)
            return false;
        const request = ++this.requestGeneration;
        this.haptics = haptics && typeof navigator.vibrate === 'function';
        this.volume = volume;
        this.ambient = ambience;
        if (!enabled) {
            this.enabled = false;
            this.stop();
            return false;
        }
        try {
            if (!this.context)
                this.initialize();
            if (this.context!.state === 'suspended')
                await this.context!.resume();
            if (this.disposed || request !== this.requestGeneration || this.context!.state !== 'running')
                return false;
            this.enabled = true;
            void this.loadSamples();
            if (this.suspended)
                this.stop();
            else {
                this.master!.gain.setValueAtTime(this.volume, this.context!.currentTime);
                this.updateAmbience();
            }
            return true;
        }
        catch {
            if (request === this.requestGeneration) {
                this.enabled = false;
                this.stop();
            }
            return false;
        }
    }
    private async loadSamples() {
        if (this.loadingSamples || this.samples.filter(Boolean).length === 3 || !this.context) return;
        this.loadingSamples = true;
        const context = this.context;
        await Promise.allSettled([1, 2, 3].map(async n => {
            if (this.samples[n - 1]) return;
            const response = await fetch(`${import.meta.env.BASE_URL}audio/report-0${n}.wav`, { signal: this.fetches.signal });
            if (!response.ok) return;
            const buffer = await context.decodeAudioData(await response.arrayBuffer());
            if (!this.disposed) this.samples[n - 1] = buffer;
        }));
        this.loadingSamples = false;
    }
    cancelScheduled() {
        this.stop();
        if (this.enabled && !this.suspended && this.context && this.master) {
            this.master.gain.setValueAtTime(this.volume, this.context.currentTime); this.updateAmbience();
        }
    }
    diagnostics() { return { audioVoices: this.voices.size, audioTimers: this.timers.size, recordedSamples: this.samples.filter(Boolean).length, audioEnabled: this.enabled, headphoneSpatialization: this.headphones, audioCaptureActive: Boolean(this.captureDestination), voiceCapacity: 40 }; }
    private recordedReport(event: SimEvent, at: number, pan: number, distance: number) {
        const profile = SOUND_PROFILES[event.family] ?? SOUND_PROFILES[0];
        const c = this.context, buffer = this.samples[profile.sample];
        if (!c || !buffer) return false;
        const source = c.createBufferSource(); source.buffer = buffer;
        source.playbackRate.value = (profile.pitch / 76) ** .24 * (.96 + randomStream(event.id ^ event.family)() * .08);
        const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = Math.max(900, 4500 - distance * 22);
        return this.connect(source, filter, at, Math.min(2.8, buffer.duration / source.playbackRate.value), .24 * event.strength / (1 + distance / 180), pan, 3);
    }
    setOptions(volume: number, haptics: boolean, ambience: boolean) {
        this.volume = Math.max(0, Math.min(.8, Number.isFinite(volume) ? volume : .45));
        this.haptics = haptics && typeof navigator.vibrate === 'function';
        const changed = this.ambient !== ambience;
        this.ambient = ambience;
        if (!this.haptics) {
            for (const timer of this.timers)
                clearTimeout(timer);
            this.timers.clear();
        }
        if (this.enabled && !this.suspended && this.context && this.master) {
            this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, .02);
            if (changed)
                this.updateAmbience();
        }
    }
    setSuspended(value: boolean) {
        if (this.suspended === value)
            return;
        this.suspended = value;
        if (value)
            this.stop();
        else if (this.enabled && this.context?.state === 'running' && this.master) {
            this.master.gain.setValueAtTime(this.volume, this.context.currentTime);
            this.updateAmbience();
        }
    }
    private initialize() {
        this.context = new AudioContext();
        const c = this.context;
        this.master = c.createGain();
        this.master.gain.value = 0;
        this.compressor = c.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 7;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.28;
        this.master.connect(this.compressor);
        this.compressor.connect(c.destination);
        this.noise = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
        const values = this.noise.getChannelData(0), rand = randomStream(839721);
        let pink = 0;
        for (let i = 0; i < values.length; i++) {
            pink = (pink + rand() * 0.04 - 0.02) / 1.02;
            values[i] = (rand() * 2 - 1) * 0.65 + pink * 4;
        }
    }
    consume(events: SimEvent[], worldWidth: number) {
        if (this.suspended || this.disposed || document.hidden)
            return;
        for (const e of events) {
            const geometry = soundGeometry(e.x, e.y, e.z || 0, worldWidth);
            const profile = SOUND_PROFILES[e.family] ?? SOUND_PROFILES[0];
            const distance = geometry.distance;
            const delay = e.type === 'burst' || e.type === 'crackle' ? geometry.delay : 0;
            this.spatialY = Math.max(-.3, Math.min(1.5, (e.y - 16) / 80));
            this.spatialZ = -Math.max(1, distance / 70);
            if (this.haptics && this.timers.size < 12 && (e.type === 'launch' || e.type === 'burst')) {
                const timer = setTimeout(() => { this.timers.delete(timer); if (this.haptics && !this.suspended && !this.disposed && !document.hidden)
                    this.hapticActive = navigator.vibrate(e.type === 'launch' ? 12 : 22); }, delay * 1000);
                this.timers.add(timer);
            }
            if (!this.enabled || !this.context || this.context.state !== 'running')
                continue;
            const pan = geometry.pan;
            const at = this.context.currentTime + delay;
            if (e.type === 'fuse')
                this.noiseVoice(at, Math.min(2.6, e.duration || 1.8), 1800, 0.055, pan, 'highpass');
            if (e.type === 'launch') {
                this.noiseVoice(at, 0.72, 950, 0.18, pan, 'bandpass');
                if (profile.whistle)
                    this.tone(at, 0.65, profile.whistle, profile.whistle * .55, 0.014, pan);
            }
            if (e.type === 'burst') {
                this.makeRoom(4);
                const recorded = this.recordedReport(e, at, pan, distance);
                // Fundamental identity gets budget before ornamental grains or echoes.
                this.noiseVoice(at, profile.decay, profile.body, (recorded ? .11 : .38) * e.strength * geometry.gain, pan, 'lowpass', 3);
                this.tone(at, .65, profile.pitch, profile.pitch * .44, .26 * e.strength * geometry.gain, pan, 3);
                this.noiseVoice(at, .20, profile.snap, .10 * e.strength * geometry.gain, pan, 'highpass', 2);
                if (this.voices.size < 32) this.noiseVoice(at + profile.echo, Math.min(2.5, profile.decay * .8), profile.body * .85, .075 * e.strength * geometry.gain, -pan * .45, 'lowpass', 1);
                const grains = Math.min(profile.grains, Math.max(0, 32 - this.voices.size));
                for (let j = 0; j < grains; j++) this.noiseVoice(at + .48 + j * .20, .07, profile.snap * 1.18, .022 * geometry.gain, pan, 'highpass', 1);
            }
            if (e.type === 'crackle') {
                this.makeRoom(2);
                // Secondary accents follow real split events; never invent new shell reports.
                for (let j = 0; j < 2; j++) this.noiseVoice(at + j * .06, .06, profile.snap, .038 * geometry.gain, pan, 'highpass', 3);
            }
        }
    }
    private connect(source: AudioScheduledSourceNode, filter: AudioNode, at: number, duration: number, gain: number, pan: number, priority = 1): boolean {
        if (!this.context || !this.master || this.voices.size >= 40) {
            source.disconnect();
            filter.disconnect();
            return false;
        }
        const c = this.context, g = c.createGain();
        let p: AudioNode;
        if (this.headphones && priority >= 2 && this.voices.size < 24) {
            try {
                const h = c.createPanner(); h.panningModel = 'HRTF'; h.distanceModel = 'inverse'; h.rolloffFactor = 0;
                h.positionX.value = pan * 2; h.positionY.value = this.spatialY; h.positionZ.value = this.spatialZ; p = h;
            } catch { const stereo = c.createStereoPanner(); stereo.pan.value = pan; p = stereo; }
        } else { const stereo = c.createStereoPanner(); stereo.pan.value = pan; p = stereo; }
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(gain, at + Math.min(0.015, duration / 5));
        g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        source.connect(filter);
        filter.connect(g);
        g.connect(p);
        p.connect(this.master);
        this.voices.add(source); this.priorities.set(source, priority);
        let cleaned = false;
        const cleanup = () => { if (cleaned) return; cleaned = true; this.voices.delete(source); this.priorities.delete(source); this.cleanups.delete(source); source.disconnect(); filter.disconnect(); g.disconnect(); p.disconnect(); };
        this.cleanups.set(source, cleanup); source.onended = cleanup;
        source.start(at);
        source.stop(at + duration + 0.015);
        return true;
    }
    private noiseVoice(at: number, duration: number, frequency: number, gain: number, pan: number, type: BiquadFilterType, priority = 1) {
        if (!this.context || !this.noise)
            return;
        const s = this.context.createBufferSource();
        s.buffer = this.noise;
        s.playbackRate.value = 0.90 + this.variation() * .2;
        const f = this.context.createBiquadFilter();
        f.type = type;
        f.frequency.value = frequency;
        f.Q.value = 0.65;
        this.connect(s, f, at, duration, gain, pan, priority);
    }
    private tone(at: number, duration: number, start: number, end: number, gain: number, pan: number, priority = 1) {
        if (!this.context)
            return;
        const s = this.context.createOscillator();
        s.type = 'sine';
        s.frequency.setValueAtTime(start, at);
        s.frequency.exponentialRampToValueAtTime(end, at + duration);
        this.connect(s, this.context.createGain(), at, duration, gain, pan, priority);
    }
    private updateAmbience() {
        if (!this.context || !this.master || !this.noise)
            return;
        if (this.ambience) {
            try {
                this.ambience.stop();
            }
            catch { }
            this.ambience = null;
        }
        if (this.ambient && this.enabled) {
            const c = this.context, s = c.createBufferSource(), filter = c.createBiquadFilter(), g = c.createGain();
            s.buffer = this.noise;
            s.loop = true;
            filter.type = 'lowpass';
            filter.frequency.value = 250;
            g.gain.value = 0.017;
            s.connect(filter);
            filter.connect(g);
            g.connect(this.master);
            s.start();
            this.ambience = s;
            s.onended = () => { s.disconnect(); filter.disconnect(); g.disconnect(); };
        }
    }
    stop() {
        if (this.master && this.context) {
            this.master.gain.cancelScheduledValues(this.context.currentTime);
            this.master.gain.setValueAtTime(0, this.context.currentTime);
        }
        for (const voice of this.voices) {
            try {
                voice.stop();
            }
            catch { }
            this.cleanups.get(voice)?.();
        }
        this.voices.clear();
        for (const timer of this.timers)
            clearTimeout(timer);
        this.timers.clear();
        if (this.ambience) {
            try {
                this.ambience.stop();
            }
            catch { }
            this.ambience = null;
        }
        if (this.hapticActive && typeof navigator.vibrate === 'function')
            navigator.vibrate(0);
        this.hapticActive = false;
    }
    dispose() { this.releaseCapture(); this.fetches.abort(); this.samples.length = 0; this.requestGeneration++; this.disposed = true; this.stop(); void this.context?.close(); this.context = null; }
}
