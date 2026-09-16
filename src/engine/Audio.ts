import { randomStream } from './catalog';
import type { SimEvent } from './Simulation';
/** Original procedural sound. No samples, requests or autoplay. */
export class AudioEngine {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private noise: AudioBuffer | null = null;
    private voices = new Set<AudioScheduledSourceNode>();
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
            const distance = Math.hypot(e.x, e.y - 16, e.z || 0);
            const delay = e.type === 'burst' || e.type === 'crackle' ? Math.min(1.2, .12 + distance / 190) : 0;
            if (this.haptics && this.timers.size < 12 && (e.type === 'launch' || e.type === 'burst')) {
                const timer = setTimeout(() => { this.timers.delete(timer); if (this.haptics && !this.suspended && !this.disposed && !document.hidden)
                    this.hapticActive = navigator.vibrate(e.type === 'launch' ? 12 : 22); }, delay * 1000);
                this.timers.add(timer);
            }
            if (!this.enabled || !this.context || this.context.state !== 'running')
                continue;
            const pan = Math.max(-0.8, Math.min(0.8, e.x / (worldWidth / 2)));
            const at = this.context.currentTime + delay;
            if (e.type === 'fuse')
                this.noiseVoice(at, Math.min(2.6, e.duration || 1.8), 1800, 0.055, pan, 'highpass');
            if (e.type === 'launch') {
                this.noiseVoice(at, 0.72, 950, 0.18, pan, 'bandpass');
                if (e.family === 1)
                    this.tone(at, 0.65, 940, 510, 0.018, pan);
            }
            if (e.type === 'burst') {
                this.noiseVoice(at, 1.6, 310, 0.45 * e.strength, pan, 'lowpass');
                this.noiseVoice(at, 0.28, 1600, 0.13 * e.strength, pan, 'highpass');
                this.tone(at, 0.8, 72, 32, 0.34 * e.strength, pan);
                this.noiseVoice(at + 0.21, 1.4, 420, 0.11 * e.strength, -pan * 0.45, 'lowpass');
                if (e.family === 0 || e.family === 3)
                    for (let j = 0; j < 5; j++)
                        this.noiseVoice(at + 0.5 + j * 0.19, 0.07, 2400, 0.035, pan, 'highpass');
            }
            if (e.type === 'crackle')
                for (let j = 0; j < 3; j++)
                    this.noiseVoice(at + j * 0.045, 0.045, 2600, 0.045, pan, 'highpass');
        }
    }
    private connect(source: AudioScheduledSourceNode, filter: AudioNode, at: number, duration: number, gain: number, pan: number) {
        if (!this.context || !this.master || this.voices.size >= 40) {
            source.disconnect();
            filter.disconnect();
            return;
        }
        const c = this.context, g = c.createGain(), p = c.createStereoPanner();
        p.pan.value = pan;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(gain, at + Math.min(0.015, duration / 5));
        g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        source.connect(filter);
        filter.connect(g);
        g.connect(p);
        p.connect(this.master);
        this.voices.add(source);
        source.onended = () => { this.voices.delete(source); source.disconnect(); filter.disconnect(); g.disconnect(); p.disconnect(); };
        source.start(at);
        source.stop(at + duration + 0.015);
    }
    private noiseVoice(at: number, duration: number, frequency: number, gain: number, pan: number, type: BiquadFilterType) {
        if (!this.context || !this.noise)
            return;
        const s = this.context.createBufferSource();
        s.buffer = this.noise;
        s.playbackRate.value = 0.90 + (Math.sin(at * 7.31) + 1) * 0.1;
        const f = this.context.createBiquadFilter();
        f.type = type;
        f.frequency.value = frequency;
        f.Q.value = 0.65;
        this.connect(s, f, at, duration, gain, pan);
    }
    private tone(at: number, duration: number, start: number, end: number, gain: number, pan: number) {
        if (!this.context)
            return;
        const s = this.context.createOscillator();
        s.type = 'sine';
        s.frequency.setValueAtTime(start, at);
        s.frequency.exponentialRampToValueAtTime(end, at + duration);
        this.connect(s, this.context.createGain(), at, duration, gain, pan);
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
    dispose() { this.requestGeneration++; this.disposed = true; this.stop(); void this.context?.close(); this.context = null; }
}
