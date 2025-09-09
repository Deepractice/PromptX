---
"@promptx/desktop": patch
---

Fix auto-update detection issue (#336)

- Remove manual "Check for Updates" button from tray menu to avoid user confusion
- Add comprehensive ASCII-only logging for auto-updater events  
- Simplify update manager to rely on automatic 1-hour update checks
- Clean up unused dialog and icon loading code

The manual update check button was ineffective due to update-electron-app's stateless design. When users selected "Later" on an update, the library wouldn't re-prompt for the same version. This change removes the confusing button and adds detailed logging to track update status transparently.