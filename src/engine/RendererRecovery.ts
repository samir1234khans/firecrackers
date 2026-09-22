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
