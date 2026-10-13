import { SOUND_PROFILES, soundGeometry } from './SoundProfiles.js';
import { randomStream } from './catalog.js';
import type { SimEvent } from './Simulation.js';
import { ShowMusic } from './ShowMusic.js';
import type { CinematicDirector } from './CinematicDirector.js';
import type { ShowPreset } from './catalog.js';
import type { SeaReactionCue } from '../graphics/SeaAudienceDirector.js';
import type { SeaPose } from '../graphics/SeaFleetState.js';
/** Opt-in CC0 field recordings plus original synthesis. No autoplay or pre-consent fetch. */
export class AudioEngine {
    private audienceSample: AudioBuffer | null = null;
    private audienceLoading = false;
    private audienceFailure = false;
    /** Audience voices share the existing global budget and are first to yield. */
    consumeAudience(cues: readonly SeaReactionCue[], boats: readonly SeaPose[], span: number) {
        if (!this.enabled || this.suspended || this.disposed || document.hidden || this.context?.state !== 'running') return;
        void this.loadAudienceSample();
        for (const cue of cues) {
            if (this.voices.size >= 38 || [...this.priorities.values()].filter(priority => priority === 0).length >= 2) break;
            const boat = boats[cue.boat]; if (!boat) continue;
            const c = this.context, source = c.createBufferSource(), filter = c.createBiquadFilter();
            source.buffer = cue.kind === 'cheer' ? this.audienceSample : this.noise;
            if (!source.buffer) continue;
            const distance = Math.abs(boat.z), duration = cue.kind === 'clap' ? .085 : Math.min(1.65, source.buffer.duration);
            filter.type = 'lowpass'; filter.frequency.value = 3800 / (1 + distance / 240);
            const pan = Math.max(-.85, Math.min(.85, boat.x / Math.max(1, span * .5)));
            this.connect(source, filter, c.currentTime, duration, (cue.kind === 'clap' ? .045 : .035) * cue.strength / (1 + distance / 160), pan, 0);
        }
    }
    private async loadAudienceSample() {
        if (this.audienceLoading || this.audienceSample || this.audienceFailure || !this.context || !this.enabled) return;
        this.audienceLoading = true;
        try {
            const response = await fetch('/audio/sea-audience-v002-cheer.mp3', { signal: this.fetches.signal });
            if (!response.ok) throw new Error('Audience recording unavailable');
            const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
            if (!this.disposed) this.audienceSample = buffer;
        } catch { this.audienceFailure = true; }
        finally { this.audienceLoading = false; }
    }
    audienceDiagnostics() { return { ready: Boolean(this.audienceSample), failure: this.audienceFailure, voices: [...this.priorities.values()].filter(priority => priority === 0).length }; }
    private cancelAudience() {
        for (const [voice, priority] of this.priorities) if (priority === 0) {
            try { voice.stop(); } catch { /* Already ended. */ }
            this.cleanups.get(voice)?.();
        }
    }
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
    private effectsEnabled = true;
    setEffectsSound(value: boolean) { this.effectsEnabled=value; if(!value) for(const [voice,priority] of this.priorities) if(priority>0){try{voice.stop();}catch{/* ended */}this.cleanups.get(voice)?.();} }
    private ambientBlocked = false;
    private ambientMusic = false;
    private ambientBuffer: AudioBuffer | null = null;
    private ambientVoice: AudioBufferSourceNode | null = null;
    private ambientGain: GainNode | null = null;
    private ambientLoading = false;
    private ambientFailed = false;
    setAmbientMusic(enabled: boolean) {
        const changed=this.ambientMusic!==enabled;
        this.ambientMusic = enabled;
        if(changed&&enabled){this.music?.dispose();this.music=null;}
        if(changed&&!enabled){try{this.ambientVoice?.stop();}catch{/* ended */}this.ambientVoice?.disconnect();this.ambientGain?.disconnect();this.ambientVoice=null;this.ambientGain=null;this.ambientBuffer=null;
            if(this.context&&this.master&&!this.disposed){this.music=new ShowMusic(this.context,this.master,import.meta.env.BASE_URL,this.onMusicFailure);this.music.suspend(this.suspended);}}
        this.music?.options(this.musicEnabled && this.enabled && !enabled, this.musicVolume);
        this.syncAmbientMusic();
    }
    private syncAmbientMusic() {
        if (!this.context || !this.master || this.disposed) return;
        const active = this.enabled && this.ambientMusic && !this.ambientBlocked && !document.hidden;
        if (active && !this.ambientBuffer && !this.ambientLoading && !this.ambientFailed) {
            this.ambientLoading = true;
            void fetch(`${import.meta.env.BASE_URL}music/moonlit-promise.wav`, { signal: this.fetches.signal }).then(async r => {
                if (!r.ok) throw new Error('Ambient score unavailable');
                const bytes = await r.arrayBuffer(); if(bytes.byteLength > 12 * 1024 * 1024) throw new Error('Ambient score exceeds its budget');
                const buffer = await this.context!.decodeAudioData(bytes);
                if(buffer.length * buffer.numberOfChannels * 4 > 24 * 1024 * 1024) throw new Error('Ambient score exceeds its decoded budget');
                if (!this.disposed && this.ambientMusic) this.ambientBuffer = buffer;
            }).catch(() => { this.ambientFailed = true; this.onMusicFailure?.('Ambient music unavailable. Fireworks remain playable.'); }).finally(() => {this.ambientLoading=false;this.syncAmbientMusic();});
        }
        if(active && this.ambientBuffer && !this.ambientVoice) {
            const voice=this.context.createBufferSource(), gain=this.context.createGain();
            voice.buffer=this.ambientBuffer;voice.loop=true;voice.loopStart=20;voice.loopEnd=40;
            voice.connect(gain);gain.connect(this.compressor ?? this.master);gain.gain.value=0;voice.start();this.ambientVoice=voice;this.ambientGain=gain;
        }
        if(this.ambientVoice) this.ambientVoice.playbackRate.setValueAtTime(active?1:0,this.context.currentTime);
        this.ambientGain?.gain.setTargetAtTime(active ? this.musicVolume * this.volume : 0, this.context.currentTime, .025);
    }
    private music: ShowMusic | null = null;
    private musicEnabled = false;
    private musicVolume = .30;
    constructor(private readonly onMusicFailure?: (message: string) => void, private readonly synthesisOnly = false, gestureContext?: AudioContext) { this.context = gestureContext ?? null; }
    setMusicOptions(enabled: boolean, volume: number) {
        this.musicEnabled = enabled; this.musicVolume = volume;
        this.music?.options(enabled && this.enabled && !this.ambientMusic, volume); this.syncAmbientMusic();
    }
    updateMusic(mode: ShowPreset | null, score: CinematicDirector, time: number) { this.music?.update(mode, score, time); this.syncAmbientMusic(); }
    async configure(enabled: boolean, volume: number, haptics: boolean, ambience: boolean) {
        if (this.disposed)
            return false;
        const request = ++this.requestGeneration;
        this.haptics = haptics && typeof navigator.vibrate === 'function';
        this.volume = volume;
        this.ambient = ambience;
        if (!enabled) {
            this.enabled = false;
            this.music?.options(false, this.musicVolume);
            this.syncAmbientMusic();
            this.stop();
            return false;
        }
        try {
            if (!this.master)
                this.initialize();
            if (this.context!.state === 'suspended')
                await this.context!.resume();
            if (this.disposed || request !== this.requestGeneration || this.context!.state !== 'running')
                return false;
            this.enabled = true;
            this.music?.options(this.musicEnabled && !this.ambientMusic, this.musicVolume); this.syncAmbientMusic();
            if (!this.synthesisOnly) void this.loadSamples();
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
    diagnostics() { return { audioVoices: this.voices.size, audioTimers: this.timers.size, recordedSamples: this.samples.filter(Boolean).length, audioEnabled: this.enabled, headphoneSpatialization: this.headphones, audioCaptureActive: Boolean(this.captureDestination), voiceCapacity: 40, musicEnabled: false, musicVoices: 0, musicBuffers: 0, musicBytes: 0, musicLoading: 0, musicFailure: '', ...this.music?.diagnostics(), ambientMusicVoices: this.ambientVoice ? 1 : 0, ambientMusicReady: Boolean(this.ambientBuffer), ambientMusicHeld: Boolean(this.ambientVoice && this.ambientVoice.playbackRate.value===0), ambientMusicBytes: this.ambientBuffer ? this.ambientBuffer.length*this.ambientBuffer.numberOfChannels*4 : 0, effectsSoundEnabled: this.effectsEnabled, ambientMusicFailure: this.ambientFailed, ...this.audienceDiagnostics() }; }
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
    setSuspended(value: boolean, keepAmbient = false) {
        this.ambientBlocked=value&&!keepAmbient;this.syncAmbientMusic();
        if (this.suspended === value)
            return;
        this.suspended = value;
        if (value) this.cancelAudience();
        this.music?.suspend(value);
        this.syncAmbientMusic();
        if (this.synthesisOnly && this.context) {
            // Freeze the Web Audio clock with the scene: already scheduled envelopes resume in phase.
            if (value) void this.context.suspend().catch(() => {});
            else if (this.enabled) void this.context.resume().catch(() => {});
            return;
        }
        if (value)
            this.stop();
        else if (this.enabled && this.context?.state === 'running' && this.master) {
            this.master.gain.setValueAtTime(this.volume, this.context.currentTime);
            this.updateAmbience();
        }
    }
    private initialize() {
        this.context ??= new AudioContext();
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
        this.music = new ShowMusic(c, this.master, import.meta.env.BASE_URL, this.onMusicFailure);
        this.music.suspend(this.suspended);
        this.noise = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
        const values = this.noise.getChannelData(0), rand = randomStream(839721);
        let pink = 0;
        for (let i = 0; i < values.length; i++) {
            pink = (pink + rand() * 0.04 - 0.02) / 1.02;
            values[i] = (rand() * 2 - 1) * 0.65 + pink * 4;
        }
    }
    consume(events: SimEvent[], worldWidth: number) {
        if(!this.effectsEnabled)return;
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
            if (e.type === 'mortar') this.tone(at, .32, 82, 42, .065, pan, 3);
            if (e.type === 'whistle') this.tone(at, e.duration ?? 1.8, 460, 1300, .008, pan, 2);
            if (e.type === 'scribe') this.noiseVoice(at, .045, 3600, .007 * e.strength, pan, 'highpass', 1);
            if (e.type === 'letter-crack') this.noiseVoice(at, .10, 5200, .024, pan, 'highpass', 2);
            if (e.type === 'willow-hush') this.noiseVoice(at, 2.6, 1300, .021, pan, 'lowpass', 1);
            if (e.type === 'fuse')
                this.noiseVoice(at, Math.min(2.6, e.duration || 1.8), 1800, 0.055, pan, 'highpass');
            if (e.type === 'launch' && this.synthesisOnly) {
                this.tone(at, .32, 82, 42, .055, pan, 3);
                this.tone(at, 1.4, 460, 1150, .006, pan, 2);
            }
            if (e.type === 'launch' && !this.synthesisOnly) {
                this.noiseVoice(at, 0.72, 950, 0.18, pan, 'bandpass');
                if (profile.whistle)
                    this.tone(at, 0.65, profile.whistle, profile.whistle * .55, 0.014, pan);
            }
            if (e.type === 'burst') {
                this.makeRoom(4);
                this.music?.duck(at);
                const recorded = !this.synthesisOnly && this.recordedReport(e, at, pan, distance);
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
        this.music?.stop();
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
    dispose() { try { this.ambientVoice?.stop(); } catch { /* Already stopped. */ } this.ambientVoice?.disconnect(); this.ambientGain?.disconnect(); this.ambientVoice=null; this.ambientBuffer=null; this.releaseCapture(); this.fetches.abort(); this.samples.length = 0; this.requestGeneration++; this.disposed = true; this.stop(); this.music?.dispose(); void this.context?.close(); this.context = null; }
}
