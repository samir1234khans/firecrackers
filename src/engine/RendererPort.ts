import type { StageLayout } from './StageLayout';
import type { FamilyId, Quality } from './catalog';
import type { LaunchProfile } from './LaunchProfile';
import type { DisplayMode } from '../platform/presentation';
import type { SkyState } from './SkyState';
import type { RendererStartup } from './StartupProgress';
import type { MoonFrame } from '../graphics/MoonComposition';

/** Both renderers consume the same simulation; neither owns a second animation clock. */
export interface RendererPort {
    readonly backend: string;
    readonly metrics: { renderPixels: number; submitMs: number; frames: number };
    init(): Promise<void>;
    resize(): void;
    setLayout(layout: StageLayout): void;
    projectBurst(clientX: number, clientY: number): [number, number] | null;
    resolveLaunchProfile(id: FamilyId, placement?: number): LaunchProfile;
    setDisplay(mode: DisplayMode): void;
    setQuality(quality: Quality): void;
    setResolutionScale?(scale: number): void;
    setSkyState(state: Readonly<SkyState>): void;
    projectPlacement(clientX: number, id?: FamilyId): number;
    projectLaunchPosition(placement: number): [number, number];
    render(): void;
    diagnostics(): Record<string, unknown>;
    readiness(): RendererStartup;
    startupMoon(): Readonly<MoonFrame> | null;
    dispose(): void;
}
