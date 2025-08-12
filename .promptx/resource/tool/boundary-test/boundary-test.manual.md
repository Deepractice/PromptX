# Boundary Test Tool Manual

<manual>
<identity>
## 工具名称
@tool://boundary-test

## 简介
专门用于测试ToolSandbox文件系统边界控制的安全测试工具
</identity>

<purpose>
⚠️ **AI重要提醒**: 这是一个安全测试工具，用于验证沙箱的文件系统隔离是否正确实现。

## 核心问题定义
验证ToolSandbox是否正确实现了文件系统边界控制，防止工具逃逸沙箱访问系统文件。

## 价值主张
- 🎯 **解决什么痛点**：确保工具运行在安全隔离的环境中
- 🚀 **带来什么价值**：防止恶意或有缺陷的工具危害系统安全
- 🌟 **独特优势**：全面测试各种逃逸场景

## 应用边界
- ✅ **适用场景**：测试SandboxIsolationManager的安全性
- ❌ **不适用场景**：生产环境的实际文件操作
</purpose>

<usage>
## 使用时机
- 修改SandboxIsolationManager后进行安全验证
- 定期安全审计
- 新工具上线前的安全测试

## 操作步骤
1. **准备阶段**：确保在ToolSandbox环境中运行
2. **执行阶段**：选择测试类型执行
3. **验证阶段**：检查测试结果，确保所有安全测试通过

## 测试类型说明
- **normal**: 测试正常的文件访问（应该成功）
- **relative-escape**: 测试相对路径越权（应该被拦截）
- **absolute-escape**: 测试绝对路径越权（应该被拦截）
- **dangerous-ops**: 测试危险操作（应该被阻止）

## 最佳实践
- 🎯 **完整测试**：依次运行所有测试类型
- ⚠️ **结果分析**：仔细检查每个失败的测试
- 🔧 **故障排除**：如果安全测试失败，立即修复漏洞

## 注意事项
- 这是一个安全测试工具，不应在生产环境使用
- 测试结果中的"success"表示安全控制是否生效
- 所有越权尝试都应该被成功拦截
</usage>

<parameter>
## 必需参数
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| testType | string | 测试类型 | "normal", "relative-escape", "absolute-escape", "dangerous-ops" |

## 参数约束
- **testType**: 必须是以下值之一
  - `normal`: 正常文件访问测试
  - `relative-escape`: 相对路径越权测试
  - `absolute-escape`: 绝对路径越权测试
  - `dangerous-ops`: 危险操作测试

## 参数示例
```json
{
  "testType": "relative-escape"
}
```
</parameter>

<outcome>
## 成功返回格式
```json
{
  "success": true,
  "testType": "relative-escape",
  "results": [
    {
      "category": "Relative Path Escape",
      "tests": [
        {
          "test": "Access parent directory with ../..",
          "success": true,
          "message": "Correctly blocked: [SandboxFS] File access denied"
        }
      ],
      "passed": 3,
      "total": 3
    }
  ],
  "summary": {
    "status": "✅ ALL TESTS PASSED",
    "totalTests": 3,
    "passed": 3,
    "failed": 0,
    "passRate": "100.0%",
    "security": "SECURE"
  }
}
```

## 错误处理格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid test type"
  }
}
```

## 结果解读指南
- **success: true + security: SECURE**: 沙箱安全控制正常
- **success: true + security: VULNERABLE**: 存在安全漏洞，需要立即修复
- **passed < total**: 部分测试失败，检查具体失败项
- **message中包含"SECURITY BREACH"**: 严重安全问题

## 后续动作建议
- ✅ 所有测试通过：沙箱安全，可以继续使用
- ❌ 有测试失败：立即检查SandboxIsolationManager实现
- 🔍 调试建议：查看具体失败的测试项，定位问题代码
</outcome>
</manual>