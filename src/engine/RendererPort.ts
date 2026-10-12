import type { SeaAudienceSession } from '../graphics/SeaAudienceSession';
import type { GlassSurface } from '../graphics/GlassMath';
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
    boatViewActive?(): boolean;
    resetBoatView?(): void;
    setMoonObstructions?(surfaces: readonly import('../graphics/MoonComposition').MoonObstacle[]): void;
    setSeaSession?(session: SeaAudienceSession): void;
    setGlassSurfaces?(surfaces: readonly GlassSurface[], enabled?: boolean): void;
    environmentTap?(kind: 'sky' | 'water' | 'moon', x: number, y: number): boolean;
    resolveShoreLaunch?(id: FamilyId, x: number, y: number): LaunchProfile | null;
    warmAvailableDetail?(): Promise<void>;
    init(): Promise<void>;
    resize(): void;
    setLayout(layout: StageLayout): void;
    projectBurst(clientX: number, clientY: number, id?: FamilyId): [number, number, number] | null;
    burstCompositionScale(id: FamilyId, point: readonly [number, number, number]): number;
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
