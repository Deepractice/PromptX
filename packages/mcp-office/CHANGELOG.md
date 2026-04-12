# @promptx/mcp-office

## 2.4.1

### Patch Changes

- [#572](https://github.com/Deepractice/PromptX/pull/572) [`afe93c6`](https://github.com/Deepractice/PromptX/commit/afe93c68a917e75c0cf43dc0ddd16f9531425554) Thanks [@dfwgj](https://github.com/dfwgj)! - fix(runtime): 修复工具执行期间空闲超时误触发导致回复被截断的问题

  AI 调用工具后（`message_delta` stop_reason=tool_use），SDK 进入静默等待状态，直到工具执行完成返回 `tool_result`。这段静默期内没有任何流式事件重置空闲计时器，导致超过 10 分钟后触发 "Request timeout after 600000ms"，将仍在进行中的请求强制中断。

  修复方式：检测到工具执行开始时，启动心跳定时器（间隔为 timeout/2，最大 2 分钟），持续重置空闲计时器直到 tool_result 返回。工具结果到达、请求正常完成或异常清理时，心跳自动停止。

## 2.4.0

### Patch Changes

- [#565](https://github.com/Deepractice/PromptX/pull/565) [`51bd52f`](https://github.com/Deepractice/PromptX/commit/51bd52f042c47af8c1ed75a8c4cbb3e3441efb9d) Thanks [@dfwgj](https://github.com/dfwgj)! - ## Bug Fixes

  - **runtime**: 修复对话超时误触发问题 — 将绝对超时改为空闲超时（`timeout({ each: 600000 })`），每次 AI 输出都会重置计时器，只有真正超过 600 秒无任何响应才触发超时
  - **mcp-workspace**: 修复生产环境打包缺失问题 — 将 `external` 改为 `noExternal`，确保 `@promptx/logger` 和 `@modelcontextprotocol/sdk` 被打包进产物；同时在 `electron-builder.yml` 补充 `extraResources` 配置，生产包中正确包含 mcp-workspace

  ## New Features

  - **desktop**: 设置页新增「接入其他平台」Tab，提供 Trae 及 Claude/Cursor 等 AI 工具的一键复制 MCP 配置

## 2.3.0

## 2.2.1

## 2.2.0

## 2.1.1

## 2.1.0
