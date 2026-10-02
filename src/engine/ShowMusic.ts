import { SHOW_THEMES, type ShowTheme, type CinematicDirector } from './CinematicDirector.js';
import type { ShowPreset } from './catalog.js';
const HANDLE = .075;
const MAX_BYTES = 24 * 1024 * 1024;
type Voice = { source: AudioBufferSourceNode; gain: GainNode; key: string; end: number; retiring?: boolean };
/** Recorded score transport, driven exclusively by the existing world's frame pump. */
export class ShowMusic {
    private enabled = false;
    private volume = .30;
    private suspended = false;
    private disposed = false;
    private readonly gain: GainNode;
    private readonly buffers = new Map<string, AudioBuffer>();
    private readonly loading = new Set<string>();
    private readonly failed = new Set<string>();
    private readonly voices = new Set<Voice>();
    private readonly abort = new AbortController();
    private wanted: string[] = [];
    private generation = -1;
    private scoreStart = -1;
    private anchorSim = 0;
    private anchorAudio = 0;
    private hasAnchor = false;
    private failure = '';
    private starts = 0;
    private resyncs = 0;
    constructor(private readonly context: AudioContext, master: AudioNode, private readonly base: string, private readonly onUnavailable?: (message: string) => void) {
        this.gain = context.createGain(); this.gain.gain.value = this.volume; this.gain.connect(master);
    }
    options(enabled: boolean, volume: number) {
        this.enabled = enabled;
        this.volume = Math.max(0, Math.min(.8, Number.isFinite(volume) ? volume : .30));
        this.gain.gain.setTargetAtTime(this.volume, this.context.currentTime, .03);
        if (!enabled) { this.stop(.20); this.buffers.clear(); this.wanted = []; }
    }
    suspend(value: boolean) { this.suspended = value; if (value) this.stop(); }
    duck() {
        if (!this.enabled || this.suspended) return;
        const at = this.context.currentTime, gain = this.gain.gain;
        gain.cancelScheduledValues(at); gain.setTargetAtTime(this.volume * .5, at, .02); gain.setTargetAtTime(this.volume, at + .12, .35);
    }
    private bytes() {
        let bytes = 0; for (const buffer of this.buffers.values()) bytes += buffer.length * buffer.numberOfChannels * 4;
        // Sources retain buffers after a theme switch until their short fade ends.
        for (const voice of this.voices) if (voice.source.buffer && ![...this.buffers.values()].includes(voice.source.buffer)) bytes += voice.source.buffer.length * voice.source.buffer.numberOfChannels * 4;
        return bytes;
    }
    private retainedBuffers() {
        let count = this.buffers.size;
        for (const voice of this.voices) if (voice.source.buffer && ![...this.buffers.values()].includes(voice.source.buffer)) count++;
        return count;
    }
    private load(key: string) {
        if (this.loading.size >= 2 || this.loading.has(key) || this.buffers.has(key) || this.failed.has(key) || this.retainedBuffers() + this.loading.size >= 2) return;
        this.loading.add(key);
        void (async () => {
            try {
                const response = await fetch(`${this.base}music/${key}.flac`, { signal: this.abort.signal });
                if (!response.ok) throw Error(`Music asset unavailable (${response.status})`);
                const encoded = await response.arrayBuffer();
                if (encoded.byteLength > 2 * 1024 * 1024) throw Error('Music asset exceeds its download bound');
                const buffer = await this.context.decodeAudioData(encoded);
                if (this.disposed || !this.enabled || !this.wanted.includes(key)) return;
                if (buffer.duration < 15.14 || buffer.duration > 15.16 || buffer.numberOfChannels > 2 || this.bytes() + buffer.length * buffer.numberOfChannels * 4 > MAX_BYTES) throw Error('Music buffer exceeds its playback bound');
                this.buffers.set(key, buffer);
            } catch (error) {
                if (!this.disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
                    this.failed.add(key);
                    if (!this.failure) { this.failure = 'Show music unavailable. The visual show continues.'; this.onUnavailable?.(this.failure); }
                }
            } finally { this.loading.delete(key); }
        })();
    }
    private play(key: string, at: number, offset: number, boundary: number) {
        const buffer = this.buffers.get(key);
        if (!buffer || this.voices.size >= 2 || [...this.voices].some(v => v.key === key)) return;
        const source = this.context.createBufferSource(), gain = this.context.createGain(); source.buffer = buffer;
        source.connect(gain); gain.connect(this.gain);
        const now = this.context.currentTime, start = Math.max(now, at), adjusted = offset + Math.max(0, start - at);
        if (buffer.duration - adjusted < .016) { source.disconnect(); gain.disconnect(); return; }
        const end = start + buffer.duration - adjusted;
        const fadeInEnd = Math.min(end - .0075, adjusted > HANDLE ? start + .15 : Math.max(start + .015, Math.min(boundary + HANDLE, start + .15)));
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(1, fadeInEnd);
        gain.gain.setValueAtTime(1, Math.max(fadeInEnd, end - .15)); gain.gain.linearRampToValueAtTime(0, end);
        const voice: Voice = { source, gain, key, end }; this.voices.add(voice);
        source.onended = () => { this.voices.delete(voice); source.disconnect(); gain.disconnect(); };
        source.start(start, adjusted); source.stop(end); this.starts++;
    }
    update(mode: ShowPreset | null, score: CinematicDirector, simTime: number) {
        if (this.disposed || !this.enabled || this.suspended || this.context.state !== 'running' || !mode || mode === 'calm') {
            if (this.hasAnchor) this.stop(.20); return;
        }
        const now = this.context.currentTime;
        if (!this.hasAnchor || this.scoreStart !== score.start) {
            this.stop(.15); this.anchorAudio = now; this.anchorSim = simTime; this.hasAnchor = true; this.generation = score.generation;
            this.scoreStart = score.start;
        } else if (Math.abs((simTime - this.anchorSim) - (now - this.anchorAudio)) > .08) {
            this.stop(.04); this.anchorAudio = now; this.anchorSim = simTime; this.hasAnchor = true; this.resyncs++;
        }
        this.generation = score.generation;
        const chunk = Math.min(5, Math.floor(score.phase / 15)), local = score.phase - chunk * 15;
        let nextTheme: ShowTheme = score.theme;
        if (chunk === 5 && score.choice === 'cycle') nextTheme = SHOW_THEMES[(score.cycle + 1) % 3];
        if (score.pendingTheme) nextTheme = score.pendingTheme === 'cycle' ? SHOW_THEMES[(score.cycle + (chunk === 5 ? 1 : 0)) % 3] : score.pendingTheme;
        const key = `${score.theme}-${chunk}`, next = `${nextTheme}-${(chunk + 1) % 6}`;
        this.wanted = mode === 'finale' && chunk === 5 ? [key] : [key, next];
        for (const voice of this.voices) if (!this.wanted.includes(voice.key) && !voice.retiring && voice.end > now + .15) {
            voice.retiring = true; voice.gain.gain.cancelScheduledValues(now); voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0, now + .15); voice.source.stop(now + .15); voice.end = now + .15;
        }
        for (const entry of this.buffers.keys()) if (!this.wanted.includes(entry)) this.buffers.delete(entry);
        for (const entry of this.wanted) this.load(entry);
        const audioAt = this.anchorAudio + simTime - this.anchorSim;
        this.play(key, audioAt, HANDLE + local, audioAt - local);
        // Do not schedule across a boundary beyond the small shared-clock lookahead.
        if (15 - local <= .25 && this.wanted.length === 2) {
            const boundary = audioAt + 15 - local;
            this.play(next, boundary - HANDLE, 0, boundary);
        }
    }
    stop(fade = 0) {
        const now = this.context.currentTime;
        for (const voice of this.voices) {
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0, now + fade);
            try { voice.source.stop(now + fade); } catch { /* Already ended. */ }
        }
        this.hasAnchor = false;
    }
    diagnostics() { return { musicEnabled: this.enabled, musicVoices: this.voices.size, musicBuffers: this.buffers.size, musicBytes: this.bytes(), musicLoading: this.loading.size,
        musicRetainedBuffers: this.retainedBuffers(), musicStarts: this.starts, musicResyncs: this.resyncs, musicGeneration: this.generation, musicFailure: this.failure, musicSampleRate: this.context.sampleRate }; }
    dispose() { this.disposed = true; this.abort.abort(); this.stop(); this.buffers.clear(); this.gain.disconnect(); }
}
