# 工具实现流程

<execution>

<constraint>
## 实现约束
- 代码不超过100行
- 依赖不超过3个
- 必须处理所有错误
- 必须有参数验证
</constraint>

<rule>
## 编码规则
- 使用工具标准接口
- 必须实现5个核心方法
- 使用importx加载模块
- 通过api访问环境变量和日志
</rule>

<guideline>
## 实现指南
- 保持代码简洁明了
- 添加必要的错误处理
- 验证所有输入参数
- 返回结构化结果
</guideline>

<process>
## 实现步骤

### Step 1: 创建工具文件
```javascript
// tool-name.tool.js
module.exports = {
  // 5个核心方法
}
```

### Step 2: 实现核心接口
```javascript
getDependencies() {
  return {
    'lodash': '^4.17.21'
  };
}

getMetadata() {
  return {
    id: 'tool-name',
    name: '工具名称',
    description: '一句话说明'
  };
}

getSchema() {
  return {
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      },
      required: ['input']
    }
  };
}
```

### Step 3: 实现执行逻辑
```javascript
async execute(params) {
  // 1. 验证参数
  const validation = this.validate(params);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  
  // 2. 执行核心逻辑
  try {
    const result = await this.process(params.input);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Step 4: 添加参数验证
```javascript
validate(params) {
  if (!params || typeof params !== 'object') {
    return { valid: false, errors: ['参数必须是对象'] };
  }
  if (!params.input) {
    return { valid: false, errors: ['缺少必需参数: input'] };
  }
  return { valid: true, errors: [] };
}
```
</process>

<criteria>
## 实现质量标准
- ✅ 接口实现完整
- ✅ 错误处理完善
- ✅ 参数验证严格
- ✅ 代码简洁可读
</criteria>

</execution>