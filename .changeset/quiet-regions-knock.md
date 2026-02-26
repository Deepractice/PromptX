---
"@promptx/cli": major
"@promptx/desktop": major
"@promptx/config": major
"@promptx/core": major
"@promptx/logger": major
"@promptx/mcp-office": major
"@promptx/mcp-server": major
"@promptx/resource": major
---

## v2.0.0 — AgentX UI + RoleX (V2) + Skills Management

This major release introduces three new core pillars: the AgentX conversational UI, the V2 RoleX role system, and global Skills management — along with significant desktop improvements and infrastructure upgrades.

### ✨ New Features

#### AgentX UI (Conversational Interface)
- Add MCP Office server and local settings support
- Add file path support for attachments (send file path as text, display as file cards)
- Add i18n support for agentx-ui components
- Improve conversation list layout and assistant entry width
- Add WelcomePage with typewriter effect and preset questions
- Add MCP configuration and restart dialog

#### RoleX — V2 Role System
- Add V2 (RoleX) feature toggle in system settings
- Add V1/V2 version toggle and standardize role naming convention
- Complete V1/V2 role detail panel with structure, edit, and description tabs
- Split V1 role structure into overview/structure tabs; support `roleResources=all`
- Add memory/cognition tab with editable engrams and network graph visualization
- Add `goToSendMessage` utility and improve role page UX
- Hide V1/V2 tabs in roles list when V2 is disabled
- Match roles list layout to tools page when V2 is disabled
- Add system role avatars with upload support and i18n keys

#### Skills Management
- Add global skills management page in AgentX
- Sync enabled skills to `~/.claude/skills/` for Claude Code discovery
- Link workdir skills directly to userData skills directory
- Replace placeholder Skills card with SkillsConfig component in settings

#### Desktop & Infrastructure
- Add remote web access feature with LAN-aware IP detection
- Add resource import/delete with V1/V2 support
- Add MCP configuration and restart dialog
- Add bundled git-bash binaries for Windows
- Add `--no-v2` CLI flag to `mcp-server` to disable RoleX features (V2 enabled by default)

### 🐛 Bug Fixes

- Fix `--no-v2` default value — V2 should be enabled by default
- Fix system role avatar path resolution
- Fix runtime `settingSources` to include `project` and `user` for skills support
- Fix `core`: sync seed roles on version change and identify as system-level
- Fix desktop: bundle mcp-office and fix runtime paths for production
- Fix agentx-ui layout: rolex growup and agentx-window sizing
- Fix i18n: update skills translations to match component usage

### ♻️ Refactors

- Extract `roles-window` and `tools-window` into dedicated sub-components
- Merge network/cues tabs; add i18n type labels and flex layout with hidden scrollbar
- Unify agentx-ui block widths and remove deprecated components
- Enhance tools page with edit info, plaza filter, and standardized metadata
- Add create tool button and switch to black/white color scheme
- Set AgentX as the default page; configure Electron mirror
