---
"@promptx/resource": patch
"@promptx/core": patch
"@promptx/desktop": patch
---

# Multiple improvements across roles, toolx, and desktop

## Core Features

### DPML Tag Attributes Support

- Support tags with attributes in resource discovery (e.g., `@!thought://name[key="value"]`)
- Enable more flexible resource referencing in role definitions
- Improve DPML specification documentation

### Nuwa Role Enhancements

- Implement dynamic Socratic dialogue flow with flexible Structure
- Add constructive guidance principle for AI prompt design
- Clarify DPML sub-tag usage rules
- Expand ISSUE framework knowledge

### Luban Role Improvements

- Shift research methodology from "finding packages" to "understanding principles first"
- Establish 3-step research process: principle → complexity → solution
- Add real case study showing principle-first approach
- Define clear criteria for native capabilities vs npm packages
- Apply constructive expression throughout

## Bug Fixes

### ToolX Stability

- Add top-level exception handling to prevent main process crashes
- Convert all errors to structured MCP format
- Ensure sandbox cleanup always executes
- Improve error logging for debugging

### Desktop Update UX

- Fix "no update available" incorrectly shown as error dialog
- Distinguish between check failure (error) and no update (info)
- Add separate error handling for download failures
- Prioritize PromptX CDN over GitHub for better user experience

## Related Issues

- Fixes #405: Luban's research methodology improvement
