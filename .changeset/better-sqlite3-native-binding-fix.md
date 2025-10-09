---
"@promptx/core": patch
---

Fix better-sqlite3 native binding issues on newer Node versions

- Upgrade better-sqlite3 from 11.10.0 to 12.4.1 for better Node v22 support
- Add postinstall script to auto-rebuild native modules
- Enable pre-post-scripts in .npmrc to ensure hooks always run
- Fixes "Could not locate the bindings file" errors

This resolves memory system failures caused by missing native bindings when using Node v22.14.0 or newer versions.
