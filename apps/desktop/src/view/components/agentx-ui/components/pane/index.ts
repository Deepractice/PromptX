/**
 * Pane Components - Pure UI Layer
 *
 * Pure presentation components with NO business logic. They:
 * - Accept data via props
 * - Emit user actions via callbacks
 * - Use layout and element components internally
 * - Know nothing about AgentX, Image, Agent, etc.
 *
 * Architecture:
 * ```
 * layout/ → element/ → pane/ → container/ → studio/
 *                      (HERE)
 * ```
 *
 * Components:
 * - NavBar: Icon navigation bar (wraps ActivityBar)
 * - ListPane: Generic list panel with search and actions
 * - MessagePane: Message display area
 * - InputPane: Input area with toolbar
 * - InputToolBar: Toolbar buttons for input
 */

// NavBar - Icon navigation bar
export { NavBar } from "./NavBar";
export type { NavBarProps, NavBarItem } from "./NavBar";

// ListPane - Generic list panel
export { ListPane } from "./ListPane";
export type { ListPaneProps, ListPaneItem } from "./ListPane";

// MessagePane - Message display area (Pure UI Container)
export { MessagePane } from "./MessagePane";
export type { MessagePaneProps } from "./MessagePane";

// InputPane - Input area with toolbar
export { InputPane } from "./InputPane";
export type { InputPaneProps } from "./InputPane";

// InputToolBar - Toolbar buttons
export { InputToolBar } from "./InputToolBar";
export type { InputToolBarProps, ToolBarItem } from "./InputToolBar";
