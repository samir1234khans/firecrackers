export type WakeToken = {
    release: () => Promise<void>;
    addEventListener: (name: string, fn: () => void) => void;
};
/** A late request cannot reacquire the screen after pause, hide, cancellation or disposal. */
export class WakeLockController {
    private token: WakeToken | null = null;
    private generation = 0;
    private disposed = false;
    constructor(private request: (() => Promise<WakeToken>) | null, private allowed: () => boolean, private changed: (active: boolean) => void) { }
    async acquire() {
        if (this.disposed || !this.request || !this.allowed())
            return false;
        const generation = ++this.generation;
        try {
            const token = await this.request();
            if (this.disposed || generation !== this.generation || !this.allowed()) {
                await token.release().catch(() => { });
                return false;
            }
            const previous = this.token;
            this.token = token;
            if (previous && previous !== token)
                void previous.release().catch(() => { });
            token.addEventListener('release', () => { if (this.token === token) {
                this.token = null;
                this.changed(false);
            } });
            this.changed(true);
            return true;
        }
        catch {
            if (generation === this.generation)
                this.changed(false);
            return false;
        }
    }
    release() {
        ++this.generation;
        const token = this.token;
        this.token = null;
        this.changed(false);
        if (token)
            void token.release().catch(() => { });
    }
    dispose() { this.disposed = true; this.release(); }
}
