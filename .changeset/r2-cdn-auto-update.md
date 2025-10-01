---
"@promptx/desktop": patch
---

使用 Cloudflare R2 优化国内用户自动更新体验

- 配置多 provider 自动更新策略：GitHub 优先，R2 兜底
- 发布时自动同步安装包到 Cloudflare R2
- 国内用户可通过 CDN 加速下载更新
