/** Explicit native-world capabilities; content and conductors belong to the host. */
export type SceneCapabilities = Readonly<{ enhanced: boolean; fleet: boolean; shoreline: boolean; interactions: boolean; glass: boolean }>;
export const WORLD_CAPABILITIES: SceneCapabilities = Object.freeze({ enhanced: true, fleet: true, shoreline: true, interactions: true, glass: true });
