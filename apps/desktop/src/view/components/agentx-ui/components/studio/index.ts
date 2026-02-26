/**
 * Studio Components - Top-level Workspace
 *
 * Orchestration layer that:
 * - Manages AgentX connection
 * - Coordinates between containers
 * - Handles global state (current agent, current image)
 * - Provides ready-to-use interface
 *
 * Architecture:
 * ```
 * container/ (AgentList + Chat) = studio/ (complete workspace)
 * ```
 */

export { Studio } from "./Studio";
export type { StudioProps } from "./Studio";

export { MobileStudio } from "./MobileStudio";
export type { MobileStudioProps } from "./MobileStudio";

export { ResponsiveStudio } from "./ResponsiveStudio";
export type { ResponsiveStudioProps } from "./ResponsiveStudio";
