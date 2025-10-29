---
"@promptx/desktop": minor
---

feat(settings): add Settings page and integrate @promptx/config

Summary
- Introduces a Settings page that centralizes control for auto-start and service networking.
- Integrates `@promptx/config` to persist defaults across Desktop and CLI.

Details
- Auto-start
  - Uses `AutoStartManager` with IPC handlers: `auto-start:enable`, `auto-start:disable`, `auto-start:status`.
  - Adds a UI toggle; supports starting hidden; works on Windows/macOS/Linux.
- Service network configuration
  - Reads defaults from `ServerConfigManager`.
  - Supports `port` (default `5203`), `host` (`localhost`), `transport` (`stdio|http`), `corsEnabled`, `debug`.
  - Persists to `~/.promptx/server-config.json`; creates directory/file on first run if missing.
- Updater
  - No hardcoded repository; respects `electron-builder.yml` `publish` (CDN-first, GitHub fallback).

User Experience
- One-click enable/disable auto-start; takes effect after restart. On error, the toggle rolls back with a retry prompt.
- Network settings updated via Settings or CLI and reused as defaults on next launch.

Compatibility
- Electron main process ESM compatible; development/runtime on Node 18+.
- macOS uses LaunchAgent; Windows/Linux use standard OS mechanisms.

Testing
- Verified auto-start enable/disable/status on Windows and macOS.
- Confirmed persistence of `~/.promptx/server-config.json` and default reload after restart.

Refs
- #370 Auto-start
- #458 Service network configuration
