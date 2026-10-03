/** Bound asynchronous startup and remove abort listeners on every outcome. */
export function withDeadline<T>(operation: Promise<T>, signal: AbortSignal, milliseconds: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const finish = (success: boolean, value: unknown) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            signal.removeEventListener('abort', aborted);
            if (success) resolve(value as T);
            else reject(value);
        };
        const aborted = () => finish(false, new DOMException('Scene startup cancelled', 'AbortError'));
        // Attach both handlers even for an already-aborted call: late rejection is handled.
        operation.then(value => finish(true, value), error => finish(false, error));
        if (signal.aborted) { aborted(); return; }
        signal.addEventListener('abort', aborted, { once: true });
        timer = setTimeout(() => finish(false, new Error('Graphics startup timed out')), milliseconds);
    });
}

/** A rolling active-frame check. Shader compilation and an isolated OS stall must
 * not demote a healthy renderer; repeated unusable frames should not strand it. */
export class RenderOverloadGuard {
    private readonly samples = new Float32Array(6);
    private count = 0;
    private cursor = 0;
    private verySlowStreak = 0;
    reset() { this.count = 0; this.cursor = 0; this.verySlowStreak = 0; }
    observe(frameMs: number, active: boolean): boolean {
        if (!active) { this.reset(); return false; }
        if (!Number.isFinite(frameMs) || frameMs <= 0) return false;
        this.verySlowStreak = frameMs >= 250 ? this.verySlowStreak + 1 : 0;
        if (this.verySlowStreak >= 3) return true;
        this.samples[this.cursor++ % this.samples.length] = Math.min(frameMs, 2000);
        this.count = Math.min(this.count + 1, this.samples.length);
        if (this.count < this.samples.length) return false;
        let slow = 0, total = 0;
        for (const sample of this.samples) {
            if (sample >= 100) slow++;
            total += sample;
        }
        return slow >= 4 && total / this.samples.length >= 120;
    }
}


/** Keep native rendering for transient dense-shell pressure. Runtime/context
 * failures still use the separate immediate recovery path. This policy never
 * hides the backend, edits the saved preference, or changes show cadence. */
export class NativeRenderRecovery {
    private readonly pressure = new RenderOverloadGuard();
    private lowPressureMs = 0;
    private lowPressureFrames = 0;
    reset() { this.pressure.reset(); this.lowPressureMs = this.lowPressureFrames = 0; }
    observe(frameMs: number, active: boolean, alreadyLow: boolean): 'reduce-quality' | 'recover' | null {
        if (!active) { this.reset(); return null; }
        if (!Number.isFinite(frameMs) || frameMs <= 0) return null;
        const overloaded = this.pressure.observe(frameMs, true);
        if (!alreadyLow) {
            this.lowPressureMs = this.lowPressureFrames = 0;
            if (overloaded) { this.pressure.reset(); return 'reduce-quality'; }
            return null;
        }
        if (frameMs < 100) {
            this.lowPressureMs = Math.max(0, this.lowPressureMs - frameMs * 4);
            this.lowPressureFrames = Math.max(0, this.lowPressureFrames - 2);
            return null;
        }
        if (overloaded) {
            this.lowPressureMs += Math.min(frameMs, 500);
            this.lowPressureFrames++;
        }
        // At least six seconds AND 24 bad frames after Low adaptation. Three
        // costly shell frames alone can no longer replace a working 3D scene.
        if (this.lowPressureMs >= 6000 && this.lowPressureFrames >= 24) {
            this.reset(); return 'recover';
        }
        return null;
    }
}
