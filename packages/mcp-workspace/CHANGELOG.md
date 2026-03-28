# @promptx/mcp-workspace

## 2.4.0

### Minor Changes

- [#565](https://github.com/Deepractice/PromptX/pull/565) [`51bd52f`](https://github.com/Deepractice/PromptX/commit/51bd52f042c47af8c1ed75a8c4cbb3e3441efb9d) Thanks [@dfwgj](https://github.com/dfwgj)! - ## v2.3.0

  ### 新功能

  - **飞书接入**：支持通过飞书机器人与 PromptX 交互，使用 WebSocket 长连接模式无需公网 IP，实现类似 OpenClaw 的多平台接入能力
  - **工作区功能**：新增工作区侧边栏，支持项目文件浏览、拖拽文件到对话输入、文件读写管理
  - **DeepSeek 预配置**：AgentX 配置新增 DeepSeek 预设，开箱即用
  - **Windows Git 检测**：首页添加 Git 安装状态检测与引导提示
  - **MCP Workspace 服务**：新增内置 MCP 工作区服务，支持文件操作和配置管理

  ### 优化

  - **RoleX 全面优化**：修复组织操作相关的 bug，拆分 action 工具为 4 个领域工具以减少 LLM 调用失败
  - **资源去重**：修复资源页面重复 key 警告，V2 角色正确覆盖 V1 同名角色
  - **通知中心**：新增 v2.3.0 版本更新通知

  ### 修复

  - 修复工作区文件夹自动展开导致的性能问题
  - 修复 Windows 平台 Git 检测与路径问题
  - 清理调试日志输出

### Patch Changes

- [#565](https://github.com/Deepractice/PromptX/pull/565) [`51bd52f`](https://github.com/Deepractice/PromptX/commit/51bd52f042c47af8c1ed75a8c4cbb3e3441efb9d) Thanks [@dfwgj](https://github.com/dfwgj)! - ## Bug Fixes

  - **runtime**: 修复对话超时误触发问题 — 将绝对超时改为空闲超时（`timeout({ each: 600000 })`），每次 AI 输出都会重置计时器，只有真正超过 600 秒无任何响应才触发超时
  - **mcp-workspace**: 修复生产环境打包缺失问题 — 将 `external` 改为 `noExternal`，确保 `@promptx/logger` 和 `@modelcontextprotocol/sdk` 被打包进产物；同时在 `electron-builder.yml` 补充 `extraResources` 配置，生产包中正确包含 mcp-workspace

  ## New Features

  - **desktop**: 设置页新增「接入其他平台」Tab，提供 Trae 及 Claude/Cursor 等 AI 工具的一键复制 MCP 配置

- Updated dependencies [[`51bd52f`](https://github.com/Deepractice/PromptX/commit/51bd52f042c47af8c1ed75a8c4cbb3e3441efb9d)]:
  - @promptx/logger@2.4.0

## 2.3.0

### Minor Changes

- [#563](https://github.com/Deepractice/PromptX/pull/563) [`a046d33`](https://github.com/Deepractice/PromptX/commit/a046d33b218a084ee463076df96cf3e035b54d5c) Thanks [@dfwgj](https://github.com/dfwgj)! - ## v2.3.0

  ### 新功能

  - **飞书接入**：支持通过飞书机器人与 PromptX 交互，使用 WebSocket 长连接模式无需公网 IP，实现类似 OpenClaw 的多平台接入能力
  - **工作区功能**：新增工作区侧边栏，支持项目文件浏览、拖拽文件到对话输入、文件读写管理
  - **DeepSeek 预配置**：AgentX 配置新增 DeepSeek 预设，开箱即用
  - **Windows Git 检测**：首页添加 Git 安装状态检测与引导提示
  - **MCP Workspace 服务**：新增内置 MCP 工作区服务，支持文件操作和配置管理

  ### 优化

  - **RoleX 全面优化**：修复组织操作相关的 bug，拆分 action 工具为 4 个领域工具以减少 LLM 调用失败
  - **资源去重**：修复资源页面重复 key 警告，V2 角色正确覆盖 V1 同名角色
  - **通知中心**：新增 v2.3.0 版本更新通知

  ### 修复

  - 修复工作区文件夹自动展开导致的性能问题
  - 修复 Windows 平台 Git 检测与路径问题
  - 清理调试日志输出

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@2.3.0
