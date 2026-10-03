"""Original deterministic ambient scores; NumPy, stdlib WAV and verified FLAC CLI.
Run: python scripts/generate-show-music.py --flac <verified-flac-1.5.0.exe>
No third-party samples, melodies, plugins, accounts or generation service.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import wave
import numpy as np

RATE = 24000
BEAT = 60 / 96
DURATION = 90
HANDLE = .075
THEMES = {
    'moonlit': {'name': 'Moonlit Silver', 'key': 'D minor', 'motif': [62, 69, 65, 64, 62, 65, 67, 69], 'chords': [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], 'seed': 91021},
    'golden': {'name': 'Golden Celebration', 'key': 'D major', 'motif': [62, 66, 69, 74, 73, 71, 69, 66], 'chords': [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]], 'seed': 91022},
    'prismatic': {'name': 'Prismatic Grand', 'key': 'C major', 'motif': [60, 64, 67, 72, 71, 69, 67, 64], 'chords': [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], 'seed': 91023},
}
def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def render(theme):
    frames = RATE * DURATION
    audio = np.zeros((frames, 2), dtype=np.float64)
    rng = np.random.default_rng(theme['seed'])
    def add(at, duration, midi, gain, instrument='bell', pan=0):
        offset = round(at * RATE)
        count = min(round(duration * RATE), frames - offset)
        if count <= 0:
            return
        t = np.arange(count) / RATE
        f = frequency(midi)
        if instrument == 'pad':
            envelope = np.minimum(1, t / .55) * np.minimum(1, (duration - t) / .9)
            signal = (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*f*2*t) + .12*np.sin(2*np.pi*f*3*t)) * envelope
        elif instrument == 'pluck':
            signal = (np.sin(2*np.pi*f*t) + .24*np.sin(2*np.pi*f*2*t) + .08*np.sin(2*np.pi*f*4*t)) * np.exp(-t*2.6) * np.minimum(1,t/.012)
        else:
            signal = (np.sin(2*np.pi*f*t) + .22*np.sin(2*np.pi*f*2.01*t)*np.exp(-t*2) + .1*np.sin(2*np.pi*f*3.97*t)*np.exp(-t*3)) * np.exp(-t*1.15) * np.minimum(1,t/.018)
        audio[offset:offset+count,0] += signal * gain * np.sqrt((1-pan)*.5)
        audio[offset:offset+count,1] += signal * gain * np.sqrt((1+pan)*.5)
    phrase_levels = [.45,.60,.67,.82,1,.35]
    for bar in range(36):
        at = bar * 4 * BEAT
        level = phrase_levels[bar // 6]
        chord = theme['chords'][(bar // 2) % 4]
        for i, note in enumerate(chord):
            add(at, 4*BEAT+.8, note, .10*level, 'pad', (i-1)*.35)
        if bar < 30:
            add(at, 2, chord[0]-12, .08*level, 'pad')
        if 6 <= bar < 30:
            for beat in range(4):
                onset = round((at + beat*BEAT)*RATE)
                count = min(round(.18*RATE), frames-onset)
                t = np.arange(count)/RATE
                # Original synthesized percussion, never a downloaded sample.
                drum = np.sin(2*np.pi*(65*t+9*(1-np.exp(-t*18))))*np.exp(-t*24)
                if beat % 2:
                    drum = rng.normal(0,.15,count)*np.exp(-t*42)
                audio[onset:onset+count] += (drum*.032*level)[:,None]
    durations = [2,1,1,2,2,2,2,4]
    for repeat in range(9):
        at = repeat * 16 * BEAT
        phrase = min(5, int(at/15))
        for i, (note, length) in enumerate(zip(theme['motif'], durations)):
            add(at, 3.5, note, .12*phrase_levels[phrase], 'pluck' if theme['key']=='D major' else 'bell', (-.3 if i%2 else .3))
            if theme['name']=='Prismatic Grand' and 45 <= at < 75:
                add(at+BEAT*.5, 2, note+12, .028, 'bell', .45)
            at += length*BEAT
    t = np.arange(frames)/RATE
    fade = np.minimum(1,t/.8)*np.minimum(1,(DURATION-t)/1.1)
    audio *= fade[:,None]
    # A quiet deterministic stereo reflection tail; no external impulse response.
    delay = round(.23*RATE)
    audio[delay:] += audio[:-delay,::-1]*.13
    audio *= .45 / max(.00001, np.max(np.abs(audio)))
    return np.round(audio*32767).astype('<i2')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--flac', required=True)
    args = parser.parse_args()
    version = subprocess.check_output([args.flac,'--version'], text=True).strip()
    if version != 'flac 1.5.0':
        raise SystemExit('Use the verified official FLAC 1.5.0 encoder')
    root = Path(__file__).resolve().parent.parent
    output = root/'public/music'; output.mkdir(parents=True,exist_ok=True)
    temp = root/'test-results/music-source'; temp.mkdir(parents=True,exist_ok=True)
    manifest = {'format':1,'original':True,'sampleRate':RATE,'channels':2,'bits':16,'bpm':96,'seconds':90,'phraseSeconds':15,'handleSeconds':HANDLE,'encoder':version,'themes':{},'assets':[]}
    total = 0
    for key, theme in THEMES.items():
        pcm = render(theme)
        preview = temp/f'{key}-90s.wav'
        with wave.open(str(preview),'wb') as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
        manifest['themes'][key] = theme
        for chunk in range(6):
            indices = np.arange(round((chunk*15-HANDLE)*RATE),round(((chunk+1)*15+HANDLE)*RATE)) % len(pcm)
            part = pcm[indices]
            wav = temp/f'{key}-{chunk}.wav'; flac = output/f'{key}-{chunk}.flac'
            with wave.open(str(wav),'wb') as w:
                w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(part.tobytes())
            subprocess.run([args.flac,'--silent','--force','--best','--no-padding','-o',str(flac),str(wav)],check=True)
            data = flac.read_bytes();total += len(data)
            manifest['assets'].append({'file':f'music/{flac.name}','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'frames':len(part),'duration':len(part)/RATE,'peakDbfs':round(20*np.log10(max(1,np.abs(part.astype(np.float64)).max())/32768),3)})
    if total > 18*1024*1024:
        raise SystemExit(f'Encoded music exceeds 18 MiB: {total}')
    manifest['totalBytes'] = total
    provenance = root/'assets-source/music';provenance.mkdir(parents=True,exist_ok=True)
    (provenance/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(f'18 original score chunks: {total} bytes; preview WAVs: {temp}')
if __name__=='__main__':
    main()
