---
"@promptx/core": patch
---

fix: 修复 Electron 环境中工具执行时缺失全局对象的问题

- 创建 ElectronPolyfills 类来管理 Electron 环境中缺失的全局对象（File、Blob、FormData 等）
- 在 SandboxIsolationManager 中集成 polyfills，确保沙箱环境包含必要的全局对象
- 在 ToolSandbox 创建 importx 前将 polyfills 注入到全局，确保动态加载的模块能访问这些对象
- 解决了 epub-reader 等依赖 File API 的工具在 Electron 环境中无法运行的问题

Fixes #351
