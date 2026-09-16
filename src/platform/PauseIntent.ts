/** Overlay/visibility/error blockers cannot overwrite the user's explicit pause choice. */
export class PauseIntent {
    private manual = false;
    private readonly blockers = new Set<string>();
    get paused() { return this.manual || this.blockers.size > 0; }
    setManual(value: boolean) { this.manual = value; return this.paused; }
    block(reason: string, value: boolean) {
        if (value)
            this.blockers.add(reason);
        else
            this.blockers.delete(reason);
        return this.paused;
    }
    reset() { this.manual = false; this.blockers.clear(); }
}
