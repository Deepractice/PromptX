---
"@promptx/core": patch
---

Convert ToolStorage API from async to sync for better DX. All storage methods (getItem, setItem, removeItem, clear, keys, getAll, hasItem) are now synchronous. Migration: remove 'await' from all api.storage.* calls.
