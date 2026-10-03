import assert from 'node:assert/strict';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';
const directory = process.argv[2] || 'test-results/cinematic-integration';
const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8'));
const checks = [];
for (const entry of report.cases) {
  assert.equal(basename(entry.name), entry.name);
  const name = `${entry.name}-captured.${entry.capture?.mime.includes('mp4') ? 'mp4' : 'webm'}`;
  const path = join(directory, name);
  const check = { name: entry.name };
  try {
    assert.ok((await stat(path)).size <= 24 * 1024 * 1024);
    const streams = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', path], { encoding: 'utf8', timeout: 30000 })).streams;
    const video = streams.find(s => s.codec_type === 'video'), audio = streams.find(s => s.codec_type === 'audio');
    const hashes = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-map', '0:v:0', '-an', '-f', 'framemd5', '-'], { encoding: 'utf8', timeout: 30000 });
    const rows = hashes.split('\n').filter(line => line && !line.startsWith('#'));
    check.frames = Number(video?.nb_read_frames || 0);
    check.distinctFrames = new Set(rows.map(line => line.slice(line.lastIndexOf(',') + 1).trim())).size;
    assert.ok(check.frames >= 2 && check.distinctFrames >= 2, 'A moving show must not export one still image with audio');
    assert.ok(audio?.channels >= 1, 'Expected enabled app audio');
    const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-map', '0:a:0', '-vn', '-f', 'f32le', '-acodec', 'pcm_f32le', '-'], { timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
    let sum = 0, peak = 0, samples = 0;
    for (let offset = 0; offset + 4 <= pcm.length; offset += 4) {
      const value = pcm.readFloatLE(offset); assert.ok(Number.isFinite(value));
      sum += value * value; peak = Math.max(peak, Math.abs(value)); samples++;
    }
    check.audio = { channels: audio.channels, sampleRate: audio.sample_rate, seconds: samples / audio.channels / Number(audio.sample_rate), rms: Math.sqrt(sum / Math.max(1, samples)), peak };
    assert.ok(check.audio.seconds > .5 && check.audio.seconds <= 31 && check.audio.rms > 1e-5, 'Actual exported audio must decode and be non-silent');
    check.pass = true;
  } catch (error) { check.pass = false; check.failure = error.message; }
  checks.push(check); console.log(JSON.stringify(check));
}
await writeFile(join(directory, 'independent-motion-audio.json'), JSON.stringify({ physicalDevice: false, method: 'Independent FFmpeg/FFprobe decode of actual captured files', checks }, null, 2));
assert.equal(checks.length, 4);
assert.ok(checks.every(check => check.pass), 'See independent-motion-audio.json for failed continuity/audio checks');
