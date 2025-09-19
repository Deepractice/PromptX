---
"@promptx/desktop": patch
---

Replace tray icons with new professional pixel-art design

- Added new tray icon assets in dedicated `/assets/icons/tray/` directory
- Implemented cross-platform tray icon support:
  - macOS: Uses template image for automatic theme adaptation
  - Windows: Detects system theme and switches between black/white icons
  - Linux: Uses default black icon
- Added visual status indication through different icon variants:
  - Running: Normal icon (pixel version)
  - Stopped: Transparent/gray icon for reduced visual prominence
  - Error: Reserved for future customization
- Removed programmatic icon generation (createPIcon) in favor of designer-provided assets
- Added automatic theme change listener for Windows to update icon dynamically