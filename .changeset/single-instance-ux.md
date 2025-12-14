---
'@promptx/desktop': patch
'@promptx/logger': patch
---

feat: single instance lock and UX improvements

- Add single instance lock to prevent multiple app instances
- Auto open main window on startup for better UX
- Focus existing window when user clicks shortcut while app is running
- Add resource type validation framework for import
- Fix logger file lock issue with graceful fallback to console
- Fix logs list refresh after clearing all logs
