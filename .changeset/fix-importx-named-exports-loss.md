---
"@promptx/core": patch
---

Fix module normalization losing named exports in ESModuleHandler and SmartDefaultHandler

**Bug Description:**
- ESModuleHandler incorrectly returned only `default` export for ES modules, discarding all named exports
- SmartDefaultHandler's `isDefaultDuplicate()` returned true when ANY export matched `default`, instead of checking if ALL exports are duplicates

**Impact:**
- Packages like `@alicloud/openapi-client` lost named exports (Config, Params, OpenApiRequest)
- Any SDK with both default and named exports was affected

**Fix:**
- ESModuleHandler: Now preserves whole module when named exports exist alongside default
- SmartDefaultHandler: Only returns default when ALL exports are duplicates, not just partial matches

**Testing:**
- Added comprehensive test suite for both handlers
- Verified fix with @alicloud/openapi-client integration test
- All 10 tests passing
