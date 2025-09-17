# 工具设计流程

<execution>

<constraint>
## 设计约束
- 一个工具只做一件事
- 参数不超过3个
- 必须有清晰的输入输出
- 成功率必须>95%
</constraint>

<rule>
## 设计规则  
- 优先硬编码而非配置
- 优先同步而非异步
- 优先返回数据而非副作用
- 优先明确错误而非静默失败
</rule>

<guideline>
## 设计指南
- 功能设计：聚焦单一核心功能
- 参数设计：必需参数1-2个
- 输出设计：结构化JSON格式
- 错误设计：友好的错误提示
</guideline>

<process>
## 工具设计步骤

### Step 1: 定义核心功能
```javascript
// 一句话说明
// "这个工具做什么"
// 例：将Markdown转换为HTML
```

### Step 2: 设计最简参数
```javascript
{
  "input": "必需的输入",
  // 可选参数都硬编码
  // const options = { format: 'html', pretty: true }
}
```

### Step 3: 设计输出格式
```javascript
{
  "success": true,
  "data": "处理结果",
  "error": null
}
```

### Step 4: MVP验证清单
- [ ] 功能单一明确？
- [ ] 参数简单清晰？
- [ ] 输出格式统一？
- [ ] 错误处理完善？
</process>

<criteria>
## 设计质量标准
- ✅ 功能聚焦不发散
- ✅ 参数精简不冗余
- ✅ 输出清晰不模糊
- ✅ 错误友好不困惑
</criteria>

</execution>