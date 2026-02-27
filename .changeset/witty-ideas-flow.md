---
"@promptx/desktop": patch
---
feat: 角色/工具详情面板添加导出按钮，支持 v1 和 v2 角色导出

- 角色和工具详情面板右上角新增导出按钮（非 system 资源可见）
- 后端 resources:download 支持 version 参数，v2 角色正确定位 ~/.rolex/roles/ 目录
- v2 角色导出的 ZIP 以 roleId 为顶层目录，确保导入时还原正确 ID
- 添加 i18n 键：export / exportSuccess / exportFailed（中英文）

fix: macOS 上 AgentX 对话时子进程不再显示 Dock 图标

- macOS 启动时检测 Electron Helper 二进制（LSUIElement=true），用于 spawn 子进程
- buildOptions 和 AgentXService 的 MCP server 在 macOS 上优先使用 Helper 二进制
- 所有 spawn 调用添加 windowsHide: true
