---
"@promptx/config": patch
---

fix(config): refine AutoStartManager and ServerConfigManager

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
