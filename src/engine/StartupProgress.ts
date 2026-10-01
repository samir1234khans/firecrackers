/** Actual renderer tasks, never elapsed-time or transfer-percentage estimates. */
export type RendererStartup = { completed: number; total: number; detail: string; pending: boolean; degraded: boolean };
export type StartupState = RendererStartup & { phase: 'graphics' | 'scene' | 'ready' };
export const SCENE_STARTUP_DEADLINE_MS = 15000;
export class StartupProgress {
  private initializedAt: number | null = null;
  private continued = false;
  private presented = false;
  private value: StartupState = { phase: 'graphics', completed: 0, total: 2, detail: 'Choosing graphics', pending: true, degraded: false };
  get snapshot(): StartupState { return this.value; }
  graphics(completed: number, detail: string) {
    this.value = { phase: 'graphics', completed: Math.max(0, Math.min(2, completed)), total: 2, detail, pending: true, degraded: false };
    return this.value;
  }
  initialized(now: number, assets: RendererStartup) {
    this.initializedAt = now;
    return this.update(assets, now);
  }
  update(assets: RendererStartup, now: number) {
    if (this.initializedAt === null) return this.value;
    const total = Math.max(0, assets.total), completed = Math.max(0, Math.min(total, assets.completed));
    const timedOut = assets.pending && now - this.initializedAt >= SCENE_STARTUP_DEADLINE_MS;
    if (!assets.pending || this.continued) this.presented = true;
    const pending = assets.pending && !this.presented;
    this.value = { phase: pending ? 'scene' : 'ready', completed, total, pending,
      degraded: assets.degraded || timedOut || (this.continued && assets.pending),
      detail: timedOut && pending ? 'Scene detail is taking longer. You can continue with reduced detail.'
        : this.continued && assets.pending ? 'Continuing with reduced scene detail.'
        : !assets.pending && assets.degraded ? 'Ready with reduced scene detail.' : assets.detail };
    return this.value;
  }
  continue() { if (this.initializedAt !== null) this.continued = true; }
}
