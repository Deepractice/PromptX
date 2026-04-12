---
"@promptx/mcp-workspace": patch
"@promptx/mcp-office": patch
"@promptx/mcp-server": patch
"@promptx/resource": patch
"@agentxjs/runtime": patch
"@promptx/config": patch
"@promptx/logger": patch
"@promptx/core": patch
"@promptx/desktop": patch
"@promptx/cli": patch
---

fix(runtime): 修复工具执行期间空闲超时误触发导致回复被截断的问题

AI 调用工具后（`message_delta` stop_reason=tool_use），SDK 进入静默等待状态，直到工具执行完成返回 `tool_result`。这段静默期内没有任何流式事件重置空闲计时器，导致超过 10 分钟后触发 "Request timeout after 600000ms"，将仍在进行中的请求强制中断。

修复方式：检测到工具执行开始时，启动心跳定时器（间隔为 timeout/2，最大 2 分钟），持续重置空闲计时器直到 tool_result 返回。工具结果到达、请求正常完成或异常清理时，心跳自动停止。
