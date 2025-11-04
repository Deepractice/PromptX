---
"@promptx/config": minor
---

Change: Remove auto-start at login configuration and decouple responsibilities.

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