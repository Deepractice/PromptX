# @promptx/config Changelog

## 1.27.5

## 1.27.4

## 1.27.3

## 1.27.2

## 1.27.1

## 1.27.0

### Minor Changes

- [#470](https://github.com/Deepractice/PromptX/pull/470) [`40db475`](https://github.com/Deepractice/PromptX/commit/40db4752adfc0c534c88876d2ce59f7ffce79de7) Thanks [@dfwgj](https://github.com/dfwgj)! - Change: Remove auto-start at login configuration and decouple responsibilities.

  Details

  - Remove all options related to auto-start/login-start from `@promptx/config` (e.g., enable switch, delay, platform exceptions).
  - Migrate auto-start capability to `@promptx/desktop` (Electron main process) with unified management and persistence.
  - Keep other configuration intact; CLI/server packages are unaffected.

  Motivation

  - `@promptx/config` should focus on pure configuration and shared constants; platform behavior (such as auto-start) belongs in the desktop app.
  - Reduce cross-package coupling and avoid platform-specific bloat in the config package.

  Impact

  - Code that reads auto-start options from `@promptx/config` will no longer work; migrate to the desktop app’s API/settings.
  - No impact for typical users; only extensions or custom scaffolding relying on the old options are affected.

  Migration Guide

  - Enable/disable auto-start from the desktop app’s settings (handled in the main process and persisted).
  - For programmatic control, use the desktop app’s IPC/services; do not read/write auto-start options from `@promptx/config`.
  - Remove references/defaults to the old options in your project to prevent stale config.

  Notes

  - This is a forward-compatible refactor that does not change other configs. If your project strongly depends on the removed options, treat it as potentially breaking and follow the migration guide above.

## 1.26.0

### Patch Changes

- [#461](https://github.com/Deepractice/PromptX/pull/461) [`395f07f`](https://github.com/Deepractice/PromptX/commit/395f07f9429b5417f1ec2a233fb5d8d692b74ff7) Thanks [@dfwgj](https://github.com/dfwgj)! - fix(config): refine AutoStartManager and ServerConfigManager

  Summary

  - Minor fixes and quality improvements to `AutoStartManager` and `ServerConfigManager`.
  - No breaking changes; existing API remains compatible.

  AutoStartManager

  - Ensures consistent enable/disable behavior across Windows, macOS, and Linux.
  - Honors `isHidden` option on startup and clarifies default `path=process.execPath`.
  - Improves `isEnabled()` reliability and error handling for edge cases.

  ServerConfigManager

  - Creates the config directory/file on first use if missing (`~/.promptx/server-config.json`).
  - Adds basic validation for `port` range and trims `host` input.
  - Ensures default values are applied when fields are absent.
  - Improves `updateConfig(partial)` merge semantics to avoid accidental overwrites.

  Persistence & UX

  - Read/write flow for `~/.promptx/server-config.json` is more robust.
  - Clearer error surfaces to help callers present user-friendly messages.

  Testing

  - Verified reading and writing of server config defaults.
  - Confirmed auto-start enable/disable/status works in common environments.

  Refs

  - #370 Auto-start
  - #458 Service network configuration

所有显著变更都会记录在此文件中。

## 1.0.0 - 2025-10-29

### Features

- 开机自启动：提供 `AutoStartManager`，基于 `auto-launch` 跨平台启用/禁用自启动，并支持 macOS `useLaunchAgent` 选项。
- 网络端口自定义与持久化：提供 `ServerConfigManager`，支持设置并持久化 `port`、`host`、`transport`（stdio/http）、`corsEnabled`、`debug`；默认存储于 `~/.promptx/server-config.json`。

### Notes

- 与桌面端设置页及 MCP Server 集成后，重启应用将按已保存配置绑定端口与地址，UI 与服务运行状态保持一致。
- HTTP 模式建议开启 `corsEnabled` 供渲染层访问；若配置文件损坏会回退默认值并在加载阶段输出告警。

## 0.0.1 - 2025-10-01

- 初始发布：包结构与基础构建配置（tsup/tsconfig/exports）。
