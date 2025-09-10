---
"@promptx/mcp-server": minor
---

feat: implement Worker Pool architecture for tool execution isolation

- Added Worker Pool pattern to execute all tools in isolated processes
- Prevents long-running tools from blocking SSE heartbeat and main event loop
- Implemented using workerpool library with 2-4 configurable worker processes
- All tools now run in separate child processes for better stability
- Fixes SSE heartbeat interruption issue (#341)