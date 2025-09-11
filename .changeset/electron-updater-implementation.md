---
"@promptx/desktop": minor
---

feat: Replace update-electron-app with electron-updater for better update experience

- Implement comprehensive update state machine with 6 states (idle, checking, update-available, downloading, ready-to-install, error)
- Add automatic update check and download on startup
- Show dynamic tray menu based on update state
- Display download progress and version information
- Add install confirmation dialog when manually checking
- Support update state persistence across app restarts
- Skip redundant checks if update already downloaded
- Fix state transition for auto-download scenario
- Improve user experience with smart update flow

Breaking Changes: None

Migration: The update system will automatically work with existing installations. First update using the new system will be seamless.