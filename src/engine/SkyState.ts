import type { Quality } from './catalog';
import type { StageLayout } from './StageLayout';
import type { DisplayMode } from '../platform/presentation';

/** Screen coordinates are normalized, with the origin at the upper left. */
export type SkyState = {
    readonly time: number;
    readonly pointerX: number;
    readonly pointerY: number;
    readonly engagement: number;
    readonly motionAllowed: boolean;
};

const neutralX = .5, neutralY = .25;
const bounded = (value: number, fallback: number) => Number.isFinite(value)
    ? Math.max(0, Math.min(1, value)) : fallback;

/** A reusable state view. Only the simulation's time can advance its response. */
export class SkyInteraction {
    private readonly value: { -readonly [Field in keyof SkyState]: SkyState[Field] } = {
        time: 0, pointerX: neutralX, pointerY: neutralY, engagement: 0, motionAllowed: false,
    };
    get state(): Readonly<SkyState> { return this.value; }
    private targetX = neutralX;
    private targetY = neutralY;
    private targetEngagement = 0;
    private previousTime = 0;

    target(x: number, y: number) {
        this.targetX = bounded(x, neutralX);
        this.targetY = bounded(y, neutralY);
        this.targetEngagement = 1;
    }

    release() {
        this.targetX = neutralX;
        this.targetY = neutralY;
        this.targetEngagement = 0;
    }

    reset(time = 0) {
        this.release();
        this.previousTime = Number.isFinite(time) ? Math.max(0, time) : 0;
        this.value.time = this.previousTime;
        this.value.pointerX = neutralX;
        this.value.pointerY = neutralY;
        this.value.engagement = 0;
    }

    update(time: number, motionAllowed: boolean, responseAllowed = true): Readonly<SkyState> {
        const nextTime = Number.isFinite(time) ? Math.max(0, time) : this.previousTime;
        if (nextTime < this.previousTime) this.reset(nextTime);
        const elapsed = Math.min(.5, Math.max(0, nextTime - this.previousTime));
        this.previousTime = nextTime;
        this.value.time = nextTime;
        this.value.motionAllowed = motionAllowed;
        if (!motionAllowed) {
            this.release();
            this.value.pointerX = neutralX;
            this.value.pointerY = neutralY;
            this.value.engagement = 0;
        } else if (responseAllowed && elapsed > 0) {
            const amount = 1 - Math.exp(-elapsed / .24);
            this.value.pointerX += (this.targetX - this.value.pointerX) * amount;
            this.value.pointerY += (this.targetY - this.value.pointerY) * amount;
            this.value.engagement += (this.targetEngagement - this.value.engagement) * amount;
            // Exact settling prevents a stationary pointer from requesting 30 Hz forever.
            if (Math.abs(this.targetX - this.value.pointerX) < .001) this.value.pointerX = this.targetX;
            if (Math.abs(this.targetY - this.value.pointerY) < .001) this.value.pointerY = this.targetY;
            if (Math.abs(this.targetEngagement - this.value.engagement) < .001) this.value.engagement = this.targetEngagement;
        }
        return this.state;
    }

    get responding() {
        return this.state.motionAllowed && (Math.abs(this.targetX - this.state.pointerX) >= .001 ||
            Math.abs(this.targetY - this.state.pointerY) >= .001 ||
            Math.abs(this.targetEngagement - this.state.engagement) >= .001);
    }
}

export const skyMotionAllowed = (quality: Quality, reducedMotion: boolean, osReducedMotion: boolean, mode: DisplayMode) =>
    quality !== 'low' && !reducedMotion && !osReducedMotion && mode !== 'transparent';

/** This cadence is separate from particle admission, firework rendering and recovery. */
export function skyCadence(quality: Quality, backend: string, responding: boolean, motionAllowed: boolean) {
    if (!motionAllowed || quality === 'low') return 0;
    if (responding) return 30;
    if (backend.startsWith('Canvas')) return 10;
    return quality === 'ultra' ? 20 : 12;
}

/** Only the measured blank sky accepts a response; water and controls are excluded. */
export function skyPointFromPointer(clientX: number, clientY: number, layout: StageLayout, horizon: number): [number, number] | null {
    const { viewport, safe } = layout;
    if (layout.panelOpen || !Number.isFinite(clientX) || !Number.isFinite(clientY) ||
        viewport.width <= 0 || viewport.height <= 0) return null;
    const x = clientX - viewport.x, y = clientY - viewport.y;
    const skyBottom = Math.min(viewport.height - safe.bottom, bounded(horizon, .72) * viewport.height);
    if (x < safe.left || x >= viewport.width - safe.right || y < safe.top || y >= skyBottom) return null;
    for (const control of Object.values(layout.controls)) {
        if (x >= control.x && x <= control.x + control.width && y >= control.y && y <= control.y + control.height)
            return null;
    }
    return [x / viewport.width, y / viewport.height];
}

export type SkyPointerInput = {
    type: string;
    isPrimary: boolean;
    buttons: number;
    pointerId: number;
    contactId: number | null;
    blocked: boolean;
};

/** Hover never follows a drag; contact motion requires a valid prior sky press. */
export function acceptsSkyPointer(input: SkyPointerInput, down = false) {
    if (!input.isPrimary || input.blocked) return false;
    if (input.type === 'mouse') return !down && input.buttons === 0;
    return (input.type === 'touch' || input.type === 'pen') &&
        (down ? input.contactId === null : input.contactId === input.pointerId);
}
