---
"@deepractice/core": patch
---

fix: 修复schema参数验证失效问题并优化错误提示

- 修复 ToolValidator 和 ToolError 未正确读取 schema.parameters 导致的验证失效
- 统一使用 schema.environment 进行环境变量验证，移除过时的 metadata.envVars
- 在参数验证错误提示中添加查看 manual 的建议
- 增强验证错误信息，提供更详细的 missing/typeErrors 信息
