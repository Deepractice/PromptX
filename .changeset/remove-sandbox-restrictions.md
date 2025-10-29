---
"@promptx/core": minor
"@promptx/resource": patch
---

Remove sandbox restrictions and add api.execute() for command execution

This change addresses Issue #462 by removing unnecessary filesystem sandbox restrictions and providing a proper command execution API for tools.

**Breaking Changes**: None - existing tools continue to work

**New Features**:
- Added `api.execute()` method for system command execution (powered by execa)
- Removed filesystem boundary restrictions - tools can now access full filesystem
- Updated luban knowledge base with api.execute() documentation

**Improvements**:
- Simplified SandboxIsolationManager by removing complex path resolution logic
- Better cross-platform support through execa
- Improved error messages guiding users to api.execute()
- Settings page localized from Chinese to English

**Technical Details**:
- Added execa dependency for better command execution
- Simplified createRestrictedFS() to return native fs module
- Simplified createRestrictedPath() to return native path module
- Updated child_process interception to guide users to api.execute()
