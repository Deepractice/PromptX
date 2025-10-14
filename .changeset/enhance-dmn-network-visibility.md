---
"@promptx/core": minor
"@promptx/mcp-server": minor
---

# Enhanced DMN Mode for Comprehensive Network Visibility

Significantly improved the Default Mode Network (DMN) mode to return comprehensive network overview, solving the issue where AI had insufficient visibility into memory networks.

## Key Improvements

### 1. Increased Hub Nodes (5 → 15)
- DMN now selects 15 core hub nodes instead of 5
- Balances cognitive load with network visibility
- Inspired by human working memory capacity research

### 2. Enhanced Energy Allocation
- Each hub node receives full 1.0 energy (was 0.02-0.2)
- Total energy: 15.0 (was 1.0)
- Enables 7-9 layer deep activation spreading
- Results in 80-200 activated nodes (was 11)

### 3. Safe Mermaid Rendering
- Added cycle detection to prevent infinite recursion
- Depth limit (5 layers) and node limit (100 nodes)
- Graceful fallback for large networks
- Clear indication when nodes are truncated

### 4. Unified Tool Prompts
- Updated action.ts, recall.ts, and remember.ts prompts
- Emphasizes DMN-first workflow: DMN → multi-round recall → remember
- Guides AI to perform multi-round deep exploration
- No hard-coded numbers, focuses on semantic meaning

## Breaking Changes
None - backward compatible

## Migration Guide
No migration needed. Existing code works as-is with enhanced behavior.

## Performance Impact
- Slight increase in token usage (~300-600 tokens for DMN)
- Significantly improved recall success rate
- Better cognitive coverage with 15 hubs vs 5

## Related Issue
Fixes #443 - Enhance DMN mode to return comprehensive memory network structure
