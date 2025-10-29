# @promptx/config Changelog

所有显著变更都会记录在此文件中。

## 1.0.0 - 2025-10-29
### Features
- 开机自启动：提供 `AutoStartManager`，基于 `auto-launch` 跨平台启用/禁用自启动，并支持 macOS `useLaunchAgent` 选项。
- 网络端口自定义与持久化：提供 `ServerConfigManager`，支持设置并持久化 `port`、`host`、`transport`（stdio/http）、`corsEnabled`、`debug`；默认存储于 `~/.promptx/server-config.json`。

### Notes
- 与桌面端设置页及 MCP Server 集成后，重启应用将按已保存配置绑定端口与地址，UI 与服务运行状态保持一致。
- HTTP 模式建议开启 `corsEnabled` 供渲染层访问；若配置文件损坏会回退默认值并在加载阶段输出告警。

## 0.0.1 - 2025-10-01
- 初始发布：包结构与基础构建配置（tsup/tsconfig/exports）。