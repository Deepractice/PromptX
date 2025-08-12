# Filesystem 工具使用手册

<manual>
<identity>
## 工具名称
@tool://filesystem

## 简介
统一的文件系统操作工具，提供读写、搜索、编辑等文件操作功能，自动适配PromptX服务所在环境的文件系统。
</identity>

<purpose>
⚠️ **AI重要提醒**: 调用此工具前必须完整阅读本说明书，理解工具功能边界、参数要求和使用限制。禁止在不了解工具功能的情况下盲目调用。

## 核心问题定义
解决PromptX在不同部署环境（本地/远程）下的文件系统访问问题，为角色（如女娲、鲁班）提供统一的文件操作接口。

## 价值主张
- 🎯 **解决什么痛点**：角色直接使用fs模块导致远程部署时无法访问文件
- 🚀 **带来什么价值**：统一接口，本地和远程部署无缝切换
- 🌟 **独特优势**：基于PromptX服务位置自动适配，无需配置

## 应用边界
- ✅ **适用场景**：
  - 角色创建和管理文件（如女娲创建角色文件）
  - 工具开发和调试（如鲁班开发工具）
  - 资源文件的读写和搜索
  - 目录结构的管理和浏览
- ❌ **不适用场景**：
  - 访问.promptx目录之外的文件（安全限制）
  - 执行系统命令或脚本
  - 处理二进制大文件
</purpose>

<usage>
## 使用时机
- 需要创建或更新角色、工具、思维模式等资源文件时
- 需要读取现有资源文件内容时
- 需要搜索特定模式的文件时
- 需要管理目录结构时

## 操作步骤
1. **准备阶段**：确定要操作的文件路径（相对于.promptx/的相对路径）
2. **执行阶段**：通过promptx_tool调用，指定action和相关参数
3. **验证阶段**：检查返回结果的success字段

## 最佳实践
- 🎯 **效率提升**：使用search快速定位文件，使用edit精确修改内容
- ⚠️ **避免陷阱**：路径不要包含.promptx前缀，始终使用相对路径
- 🔧 **故障排除**：检查路径是否正确，确认文件权限

## 注意事项
- 所有路径都相对于.promptx/目录
- 文件操作自动在PromptX服务所在环境执行
- 写入操作会覆盖已存在的文件
- 编辑操作支持预览模式（dryRun）
</usage>

<parameter>
## 必需参数
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| action | string | 操作类型 | "read", "write", "list" |

## 根据action的必需参数

### write操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| path | string | 文件路径 | "resource/role/test.md" |
| content | string | 文件内容 | "# Role Definition..." |

### read操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| path | string | 文件路径 | "resource/tool/example.js" |

### list操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| path | string | 目录路径 | "resource/role/" |

### search操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| path | string | 搜索起始路径 | "resource/" |
| pattern | string | 搜索模式 | "*.role.md" |

### edit操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| path | string | 文件路径 | "resource/role/test.md" |
| edits | array | 编辑操作列表 | [{oldText: "old", newText: "new"}] |

### move操作
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| source | string | 源路径 | "resource/old.md" |
| destination | string | 目标路径 | "resource/new.md" |

## 可选参数
| 参数名 | 类型 | 默认值 | 描述 | 适用操作 |
|--------|------|--------|------|----------|
| head | number | - | 读取前N行 | read |
| tail | number | - | 读取后N行 | read |
| dryRun | boolean | false | 仅预览不执行 | edit |
| excludePatterns | string[] | [] | 排除模式 | search |
| sortBy | string | "name" | 排序方式(name/size) | list_with_sizes |
| encoding | string | "utf8" | 文件编码 | read, write |

## 参数示例
```json
// 写入文件
{
  "action": "write",
  "path": "resource/role/assistant/assistant.role.md",
  "content": "<role>...</role>"
}

// 读取文件
{
  "action": "read",
  "path": "resource/tool/calculator/calculator.tool.js"
}

// 搜索文件
{
  "action": "search",
  "path": "resource/",
  "pattern": "*.md",
  "excludePatterns": ["test/*", "backup/*"]
}

// 编辑文件
{
  "action": "edit",
  "path": "resource/role/existing.md",
  "edits": [
    {"oldText": "旧内容", "newText": "新内容"}
  ],
  "dryRun": true
}
```
</parameter>

<outcome>
## 成功返回格式
```json
{
  "success": true,
  "data": {
    // 根据操作类型返回不同数据
    // read: 文件内容字符串
    // write: 写入的字节数
    // list: 文件/目录名数组
    // search: 匹配文件路径数组
    // edit: 修改的内容差异
  },
  "message": "操作成功"
}
```

## 错误处理格式
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "文件不存在: resource/role/test.md",
    "details": "具体错误信息"
  }
}
```

## 常见错误代码
- `FILE_NOT_FOUND`: 文件或目录不存在
- `PERMISSION_DENIED`: 没有权限访问
- `PATH_TRAVERSAL`: 路径越权（试图访问.promptx之外）
- `INVALID_ACTION`: 不支持的操作类型
- `MISSING_PARAMETER`: 缺少必需参数
- `ENCODING_ERROR`: 文件编码错误

## 结果解读指南
- **成功判断**：检查`success`字段为`true`
- **获取数据**：从`data`字段获取操作结果
- **错误处理**：根据`error.code`进行相应处理
- **调试信息**：`error.details`包含详细错误信息

## 后续动作建议
- 成功写入后，可使用read操作验证内容
- 搜索到文件后，可使用read操作查看具体内容
- 编辑操作建议先用dryRun预览
- 列表操作后可进一步操作具体文件
</outcome>
</manual>