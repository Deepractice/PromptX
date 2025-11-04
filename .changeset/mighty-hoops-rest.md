---
"@promptx/desktop": minor
---

Change: Add zh/en locale toggle, stabilize i18n initialization and paths, and refactor/optimize resource management and settings in the desktop app.

Details
- Main process i18n
  - Defer initialization to `app.whenReady()` to avoid early userData access and path issues.
  - Resolve translation files from `../../src/main/i18n` in development and `__dirname/i18n` in production.
  - Persist the selected locale to Electron `userData/language.json`.
  - Harden `t()` with initialization guard, key existence warnings, and English fallback.
- Runtime detection
  - Use `app.isPackaged` instead of unreliable `NODE_ENV` for environment checks.
  - Improve resource path resolution under both dev and packaged modes.
  - Add renderer-side support to keep localization consistent across processes.
- Auto-start decoupling
  - Migrate auto-start management from `@promptx/config` into the desktop main process for clearer responsibility boundaries.
- Resource management refactor
  - Extract `ResourceEditor` into a separate component to improve maintainability and reuse.
- Resource management enhancements
  - Replace `window.alert` with `sonner` toasts for non-blocking notifications.
  - Standardize modals as `shadcn/ui` `Dialog`.
  - Optimize the workflows for resource download, delete, and save.
- Settings page overhaul
  - Migrate the settings page to React + `shadcn/ui` to unify the tech stack and design system.
  - Introduce a language selector UI for zh/en toggle.
- Renderer bootstrap
  - Initialize the React renderer and baseline `shadcn/ui` configuration to support future page and component upgrades.

Motivation
- Make localization reliable across dev/prod environments and align UX for language switching.
- Reduce cross-package coupling by moving platform-specific behavior (auto-start) into the desktop app.
- Improve maintainability and consistency of resource management and UI components.

Impact
- Developers should rely on the desktop app APIs/settings for auto-start, not `@promptx/config`.
- Translation files are expected under `src/main/i18n` at development time and copied to `out/main/i18n` in production.
- Resource-related messages should use `t('resources.*')` instead of hardcoded strings.
- UI notifications and dialogs follow `sonner` and `shadcn/ui` conventions.

Migration Guide
- Ensure `en.json` and `zh-CN.json` exist in `apps/desktop/src/main/i18n`; production builds copy them to `out/main/i18n`.
- Replace any hardcoded messages in main/windows with `t(...)` calls and provide keys in both locales.
- Use the desktop app’s settings or IPC for auto-start controls; remove usage of auto-start options from `@promptx/config`.
- In renderer, replace `window.alert` with `sonner` toasts and use `shadcn/ui` `Dialog` for modals.

Notes
- This is a minor release focusing on i18n stability and UI consistency. If your extension or custom tooling depends on the old auto-start configuration in `@promptx/config`, treat this as a potential breaking change and follow the migration steps above.