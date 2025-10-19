---
"@promptx/desktop": patch
---

Fix multiple desktop update and installation issues

**Issue #450: Update check failure**
- Fixed YAML parsing error in latest.yml caused by multi-line sha512 hash
- Modified workflow to ensure sha512 is single-line with quotes
- Added YAML validation step in release workflow

**Issue #450: CDN not being used**
- Removed hardcoded GitHub repo config in UpdateManager
- Now uses electron-builder.yml publish config (CDN first, GitHub fallback)
- Ensures promptx.deepractice.ai CDN is tried before GitHub

**Issue #449: Windows installer requires admin**
- Added `requestedExecutionLevel: highestAvailable` to Windows config
- Installer now automatically prompts for UAC elevation when needed
- Prevents silent failure on double-click
