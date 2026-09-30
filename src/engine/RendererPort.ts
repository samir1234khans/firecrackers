import type { StageLayout } from './StageLayout';
import type { FamilyId, Quality } from './catalog';
import type { LaunchProfile } from './LaunchProfile';
import type { DisplayMode } from '../platform/presentation';
import type { SkyState } from './SkyState';

/** Both renderers consume the same simulation; neither owns a second animation clock. */
export interface RendererPort {
    readonly backend: string;
    readonly metrics: { renderPixels: number; submitMs: number; frames: number };
    init(): Promise<void>;
    resize(): void;
    setLayout(layout: StageLayout): void;
    projectBurst(clientX: number, clientY: number): [number, number] | null;
    resolveLaunchProfile(id: FamilyId): LaunchProfile;
    setDisplay(mode: DisplayMode): void;
    setQuality(quality: Quality): void;
    setSkyState(state: Readonly<SkyState>): void;
    projectPlacement(clientX: number): number;
    render(): void;
    diagnostics(): Record<string, unknown>;
    dispose(): void;
}
