---
"@promptx/desktop": patch
---

fix: disable notification sounds on macOS startup (#493)

- Set notification adapter to silent by default to prevent system sounds on app launch
- Add autoplayPolicy to BrowserWindow webPreferences to prevent media autoplay
- Fix issue where macOS played notification sound every time the app started

This change improves the user experience by making notifications silent by default, following desktop application best practices. Users can still see notifications, but without the disruptive sound effects.
