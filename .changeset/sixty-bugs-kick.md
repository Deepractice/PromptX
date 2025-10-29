---
"@promptx/mcp-server": minor
---

feat(config): manage server host and port via ServerConfigManager

Summary
- MCP Server now sources its default network configuration (host, port, transport, CORS, debug) from `@promptx/config`'s `ServerConfigManager`.
- Adds support for persisting CLI-selected options using `--save-config`.

Details
- Defaults: `port=5203`, `host=localhost`, `transport=stdio`, `corsEnabled=false`, `debug=false`.
- Persistence: reads from `~/.promptx/server-config.json` if present; creates directory/file on first run when missing.
- CLI interaction:
  - CLI flags (e.g., `--port`, `--host`, `--transport`, `--cors-enabled`, `--debug`) still override defaults at runtime.
  - With `--save-config`, the current CLI values are written back to `~/.promptx/server-config.json` as future defaults.
- Launch:
  - Startup parameters are forwarded to `PromptXMCPServer.launch(...)`.
  - Compatible with both `stdio` and `http` modes.

User Experience
- Desktop and CLI share one source of truth for service networking.
- Users can adjust via CLI or settings UI, and persist as defaults.

Compatibility
- Node 18+ runtime.
- No breaking changes; existing CLI usage remains valid.

Testing
- Verified read/write of `~/.promptx/server-config.json` and correct fallback to in-memory defaults when absent.
- Confirmed overrides via CLI and persistence with `--save-config`.

Refs
- #458 Service network configuration
