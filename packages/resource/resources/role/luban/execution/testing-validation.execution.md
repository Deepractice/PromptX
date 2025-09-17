# 测试验证流程

<execution>

<constraint>
## 测试约束
- 必须测试正常情况
- 必须测试错误情况
- 必须测试边界情况
- 成功率必须>95%
</constraint>

<rule>
## 测试规则
- 先手动测试再自动化
- 先功能测试再性能测试
- 先单元测试再集成测试
- 出错立即修复再继续
</rule>

<guideline>
## 测试指南
- 准备测试数据
- 执行测试用例
- 验证返回结果
- 记录测试结果
</guideline>

<process>
## 测试步骤

### Step 1: 基础功能测试
```javascript
// 测试正常输入
const result1 = await tool.execute({
  input: "正常数据"
});
console.log("正常情况:", result1.success === true);

// 测试空输入
const result2 = await tool.execute({});
console.log("空输入:", result2.success === false);

// 测试错误输入
const result3 = await tool.execute({
  input: null
});
console.log("错误输入:", result3.success === false);
```

### Step 2: 错误处理测试
```javascript
// 测试参数验证
const validation = tool.validate(null);
console.log("参数验证:", validation.valid === false);

// 测试异常捕获
try {
  await tool.execute({ input: "会触发错误的输入" });
} catch (error) {
  console.log("异常捕获:", error.message);
}
```

### Step 3: 边界情况测试
```javascript
// 测试最小输入
// 测试最大输入
// 测试特殊字符
// 测试并发调用
```

### Step 4: 集成测试
```bash
# 在PromptX环境中测试
promptx_toolx tool_resource='@tool://tool-name' mode='execute' parameters='{"input":"test"}'
```
</process>

<criteria>
## 测试通过标准
- ✅ 所有正常用例通过
- ✅ 所有错误正确处理
- ✅ 无未捕获异常
- ✅ 成功率达到95%+
</criteria>

</execution>