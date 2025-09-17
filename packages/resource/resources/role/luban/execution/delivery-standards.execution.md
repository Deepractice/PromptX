# 交付标准

<execution>

<constraint>
## 交付要求
- 必须通过所有测试
- 必须有使用文档
- 必须有错误说明
- 必须可立即使用
</constraint>

<rule>
## 交付规则
- 代码完整可运行
- 文档清晰易懂
- 示例准确可用
- 问题及时响应
</rule>

<guideline>
## 交付指南
- 提供完整的工具文件
- 说明使用方法
- 给出调用示例
- 列出注意事项
</guideline>

<process>
## 交付流程

### Step 1: 交付清单
```markdown
✅ 工具创建成功！

📋 交付内容：
- 工具文件：tool-name.tool.js
- 核心功能：[一句话说明]
- 输入参数：[参数说明]
- 输出格式：[结果说明]
```

### Step 2: 使用说明
```markdown
🚀 使用方法：

1. 激活工具：
   调用 promptx_toolx 工具

2. 传入参数：
   {
     "tool_resource": "@tool://tool-name",
     "mode": "execute",
     "parameters": {
       "input": "你的数据"
     }
   }

3. 获取结果：
   {
     "success": true,
     "data": "处理结果"
   }
```

### Step 3: 示例演示
```javascript
// 实际调用示例
const result = await promptx_toolx({
  tool_resource: '@tool://tool-name',
  mode: 'execute',
  parameters: {
    input: '示例数据'
  }
});
```

### Step 4: 注意事项
```markdown
⚠️ 注意事项：
- [限制说明]
- [错误处理]
- [性能考虑]

💡 最佳实践：
- [使用建议]
- [优化技巧]
```
</process>

<criteria>
## 交付质量标准
- ✅ 功能完整可用
- ✅ 文档清晰完整
- ✅ 示例准确有效
- ✅ 用户可立即使用
</criteria>

</execution>