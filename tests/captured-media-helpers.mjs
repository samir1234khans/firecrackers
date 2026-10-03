import { writeFile } from 'node:fs/promises';

/** Inspect a real exported clip, not its label. Retain raw bytes before assertions.
 * loadeddata alone can precede presentation; read the canvas at a video-frame
 * callback after explicit muted playback. This helper never enables app sound. */
export async function inspectCapturedVideo(locator, outputBase) {
  const exported = await locator.evaluate(async element => {
    const blob = await fetch(element.currentSrc || element.src).then(response => response.blob());
    if (!blob.size || blob.size > 24 * 1024 * 1024) throw new Error('Export outside the capture byte budget');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Cannot retain clip evidence'));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    const wasMuted = element.muted;
    element.muted = true;
    let frame;
    try {
      frame = await new Promise((resolve, reject) => {
        let handle;
        const timeout = setTimeout(() => { if (handle != null) element.cancelVideoFrameCallback(handle); reject(new Error('No presented video frame within 10 seconds')); }, 10000);
        handle = element.requestVideoFrameCallback((_now, metadata) => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 100;
            const context = canvas.getContext('2d'); context.drawImage(element, 0, 0, 160, 100);
            const rgba = context.getImageData(0, 0, 160, 100).data;
            let litPixels = 0, peak = 0;
            for (let i = 0; i < rgba.length; i += 4) {
              const value = Math.max(rgba[i], rgba[i + 1], rgba[i + 2]);
              if (value > 12) litPixels++;
              peak = Math.max(peak, value);
            }
            resolve({ litPixels, peak, mediaTime: metadata.mediaTime, width: element.videoWidth, height: element.videoHeight, png: canvas.toDataURL('image/png') });
          } catch (error) { reject(error); }
        });
        void element.play().catch(error => { clearTimeout(timeout); element.cancelVideoFrameCallback(handle); reject(error); });
      });
    } catch (error) { frame = { error: error.message }; }
    finally { element.pause(); element.muted = wasMuted; }
    const audioContext = new AudioContext();
    let audio;
    try {
      const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
      let sum = 0, peak = 0, count = 0;
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const samples = decoded.getChannelData(channel);
        for (let i = 0; i < samples.length; i += 8) { sum += samples[i] ** 2; peak = Math.max(peak, Math.abs(samples[i])); count++; }
      }
      audio = { channels: decoded.numberOfChannels, seconds: decoded.duration, sampleRate: decoded.sampleRate, rms: Math.sqrt(sum / Math.max(1, count)), peak };
    } catch (error) { audio = { error: error.message }; }
    finally { await audioContext.close(); }
    return { bytes: blob.size, mime: blob.type, containerDuration: Number.isFinite(element.duration) ? element.duration : 'streaming metadata', frame, audio, dataUrl };
  });
  const { dataUrl, ...result } = exported;
  const { png, ...frame } = result.frame;
  result.frame = frame;
  const bytes = value => Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  await writeFile(`${outputBase}.${result.mime.includes('mp4') ? 'mp4' : 'webm'}`, bytes(dataUrl));
  if (png) await writeFile(`${outputBase}-decoded-frame.png`, bytes(png));
  await writeFile(`${outputBase}-media.json`, JSON.stringify(result, null, 2));
  return result;
}
