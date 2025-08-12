<manual>
<identity>
## 工具名称
@tool://tool-tester

## 简介
PromptX 工具系统回归测试器，全面验证 ToolSandbox 各项功能，包括统一的模块加载接口 loadModule()、ES Module 支持、智能错误提示等
</identity>

<purpose>
⚠️ **AI重要提醒**: 这是一个测试工具，用于验证 ToolSandbox 系统的正确性。在工具开发或系统升级后应执行此测试。

## 核心问题定义
在 PromptX 工具系统升级或修改后，需要一个标准化的回归测试工具来验证：
- 基础功能是否正常
- 依赖管理是否正确
- Scoped 包（@开头）是否能正确处理
- 错误处理是否完善
- 性能是否达标

## 价值主张
- 🎯 **解决什么痛点**：手动测试工具系统费时费力，容易遗漏边界情况
- 🚀 **带来什么价值**：自动化验证所有关键功能，确保系统稳定性
- 🌟 **独特优势**：专门针对 PromptX 工具系统设计，覆盖所有核心功能点

## 应用边界
- ✅ **适用场景**：
  - ToolSandbox 代码修改后的回归测试
  - 新工具开发前的环境验证
  - 依赖管理机制升级后的兼容性测试3
  - 定期的系统健康检查
  
- ❌ **不适用场景**：
  - 具体业务工具的功能测试
  - 网络依赖的集成测试
  - 需要外部服务的端到端测试
</purpose>

<usage>
## 使用时机
- 修改 ToolSandbox.js 后立即运行
- 更新 ToolInterface.js 规范后验证
- 升级 Node.js 或 npm/pnpm 版本后检查兼容性
- 每次发布新版本前的质量把关

## 操作步骤
1. **准备阶段**：
   - 确保 PromptX 环境已初始化
   - 确认测试工具已注册到系统
   
2. **执行阶段**：
   - 选择测试类型或运行全部测试
   - 可选择详细日志模式查看执行细节
   
3. **验证阶段**：
   - 查看测试结果摘要
   - 分析失败的测试项
   - 根据详细信息定位问题

## 最佳实践
- 🎯 **效率提升**：
  - 先运行 'all' 获取整体情况
  - 对失败项单独运行特定测试类型
  - 使用 verbose 模式调试具体问题
  
- ⚠️ **避免陷阱**：
  - 不要在生产环境运行性能测试
  - 确保测试环境干净，避免缓存影响
  - 注意某些测试需要安装实际依赖
  
- 🔧 **故障排除**：
  - 依赖加载失败：检查 node_modules 是否完整
  - 性能测试失败：检查系统资源占用
  - Scoped 包测试失败：验证 npm 配置

## 注意事项
- 测试结果仅反映当前环境状态
- 某些测试可能需要网络连接（如依赖安装）
- 性能测试结果受系统负载影响
</usage>

<parameter>
## 必需参数
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| testType | string | 测试类型 | "all", "basic", "dependencies", "scoped", "error", "performance" |

## 可选参数
| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| verbose | boolean | false | 是否输出详细执行日志 |

## 参数约束
- **testType 可选值**：
  - `basic`: 基础功能测试（元信息、Schema、验证）
  - `dependencies`: 依赖管理测试
  - `scoped`: Scoped 包专项测试（@开头的包）
  - `error`: 错误处理测试
  - `performance`: 性能测试
  - `all`: 运行所有测试

## 参数示例
```json
{
  "testType": "all",
  "verbose": true
}
```

```json
{
  "testType": "scoped",
  "verbose": false
}
```
</parameter>

<outcome>
## 成功返回格式
```json
{
  "success": true,
  "data": {
    "testType": "all",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "tests": [
      {
        "name": "元信息完整性",
        "description": "检查 getMetadata() 返回所有必需字段",
        "passed": true,
        "details": {
          "hasName": true,
          "hasDescription": true,
          "hasVersion": true,
          "hasManual": true
        }
      }
    ],
    "summary": {
      "total": 15,
      "passed": 14,
      "failed": 1,
      "passRate": "93.3%"
    }
  },
  "message": "测试完成: 14/15 通过"
}
```

## 错误返回格式
```json
{
  "success": false,
  "data": {
    "testType": "all",
    "tests": [...],
    "summary": {
      "total": 15,
      "passed": 10,
      "failed": 5,
      "passRate": "66.7%"
    }
  },
  "message": "测试完成: 10/15 通过"
}
```

## 结果解读指南
- **整体评估**：查看 `summary.passRate` 了解整体通过率
- **问题定位**：检查 `tests` 数组中 `passed: false` 的项目
- **详细分析**：查看失败测试的 `details` 了解具体原因
- **趋势分析**：比较不同时间的测试结果，观察系统稳定性

## 后续动作建议
### 测试全部通过时
- ✅ 系统状态良好，可以继续开发或部署
- 📝 记录测试时间和版本，作为基线

### 测试部分失败时
- 🔍 分析失败测试的 details 信息
- 🐛 根据失败类型定位问题模块
- 🔧 修复问题后重新运行失败的测试类型
- 📊 对比修复前后的测试结果

### 特定功能关注
- **Scoped 包测试失败**：检查 ToolSandbox.js 的依赖解析逻辑
- **依赖测试失败**：验证 getDependencies() 返回格式
- **性能测试失败**：优化代码或调整测试阈值
</outcome>
</manual>