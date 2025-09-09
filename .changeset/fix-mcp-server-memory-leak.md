---
"@promptx/mcp-server": patch
---

Fix critical memory leak and remove all error recovery mechanisms

- Remove recursive retry logic that caused activeRequests to grow infinitely
- Delete ErrorRecoveryStrategy and all recovery mechanisms  
- Remove 'recoverable' field from MCPError
- Delete shouldRetry() and retry counter
- Remove recover() method from interface
- Simplify error handling to fail-fast principle
- Remove RECOVERABLE severity level
- Fix issue #338 where recursive retries caused 17000+ pending requests

This prevents hidden retry loops and makes error handling transparent.
Recovery/retry logic should be handled by callers, not buried in the framework.
