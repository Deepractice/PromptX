---
"@promptx/core": patch
---

fix: resolve recall memory content bug for newborn role

Fixed critical issue where newborn role (and other roles using prime) would show activated memory nodes during recall but no actual memory content was displayed.

**Root Cause:**
- `CognitionSystem.prime()` method was not async and didn't load engrams
- `CognitionManager.prime()` had missing await keywords for async calls

**Changes:**
- Modified `CognitionSystem.prime()` to be async and load engrams properly
- Fixed missing await calls in `CognitionManager.prime()` method
- Added comprehensive debug logging for memory structure inspection
- Enabled proper memory content display in recall for all roles

**Impact:**
- All roles now correctly display detailed memory content during recall
- Improved debugging capabilities with enhanced logging
- Better memory system reliability across different role activation paths

**Testing:**
- ✅ newborn role now shows complete memory content with recall
- ✅ Memory network activation and content loading working properly
- ✅ Debug logs provide clear visibility into memory loading process