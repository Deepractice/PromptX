---
"@promptx/mcp-server": patch
"@promptx/resource": patch
"@promptx/core": patch
"@promptx/desktop": patch
---

Security updates and Docker build optimization

- Update critical dependencies to fix security vulnerabilities
- Optimize Docker build with parallel multi-platform jobs
- Add security improvements to Dockerfile (non-root user, healthcheck)
- Reduce Docker build time by ~50% (6h → 3h)
- Fix 10 security vulnerabilities (6 high, 4 moderate)
