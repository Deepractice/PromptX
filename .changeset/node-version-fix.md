---
"@promptx/core": patch
"@promptx/cli": patch
"@promptx/desktop": patch
---

fix: downgrade @npmcli/arborist to support Node 18.17+

- Downgrade @npmcli/arborist from 9.1.4 to 8.0.1 to support Node 18.17+ instead of requiring Node 20.17+
- Update engines.node to >=18.17.0 across all packages for consistency
- Update @types/node to ^18.0.0 to match the supported Node version
- Remove unused installPackage() method from PackageInstaller.js
- Fix turbo.json by removing incorrect extends config

This change removes the dependency on glob@11 and cacache@20 which required Node 20+, allowing users with Node 18.17+ to install and use PromptX without warnings.

Fixes #387
