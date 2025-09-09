---
"@promptx/core": patch
---

修复 ToolSandbox 传递依赖未自动安装问题

- 将 PackageInstaller 从 pacote API 迁移到 @npmcli/arborist
- Arborist 是 npm install 的核心引擎，能够自动处理所有传递依赖
- 解决了工具开发者需要手动声明所有间接依赖的问题
- 保持 API 接口不变，确保向后兼容

修复 issue #332