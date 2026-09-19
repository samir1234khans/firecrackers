/** Consume visible frame time without tying virtual speed to slow render cadence.
 * The engine still steps at 60 Hz. At most 30 steps (half a second) are admitted;
 * hidden tabs, pause and recovery reset the caller's clock instead of catching up.
 */
export function advanceVisibleFrame(
    simulation: { advance: (seconds: number) => void },
    elapsedSeconds: number,
): void {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;
    let remaining = Math.min(elapsedSeconds, 0.5);
    for (let slice = 0; slice < 5 && remaining > 1e-9; slice++) {
        const seconds = Math.min(0.1, remaining);
        simulation.advance(seconds);
        remaining -= seconds;
    }
}
