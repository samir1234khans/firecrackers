import type { StageLayout } from './StageLayout';
import type { Quality } from './catalog';
import type { DisplayMode } from '../platform/presentation';

/** Both renderers consume the same simulation; neither owns a second animation clock. */
export interface RendererPort {
    readonly backend: string;
    readonly metrics: { renderPixels: number; submitMs: number; frames: number };
    init(): Promise<void>;
    resize(): void;
    setLayout(layout: StageLayout): void;
    projectBurst(clientX: number, clientY: number): [number, number] | null;
    setDisplay(mode: DisplayMode): void;
    setQuality(quality: Quality): void;
    projectPlacement(clientX: number): number;
    render(): void;
    diagnostics(): Record<string, unknown>;
    dispose(): void;
}
