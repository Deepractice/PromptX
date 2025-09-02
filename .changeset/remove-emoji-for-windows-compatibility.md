---
"@promptx/cli": patch
"@promptx/mcp-server": patch
"@promptx/resource": patch
---

fix(Windows): Remove emoji from console output to fix Windows encoding issues

- Remove all emoji characters from CLI command descriptions and help text
- Remove emoji from console log messages across all TypeScript files  
- Fix Windows console emoji display issues reported in #310
- Apply Occam's razor principle: simplify by removing complexity source
- Maintain functionality while improving cross-platform compatibility

This change ensures that Windows users no longer see garbled emoji characters in the console output when using the desktop application.