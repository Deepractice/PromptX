# 工具实现流程

<execution>

<constraint>
## 实现约束
- **文件创建方式**：必须且只能通过 @tool://filesystem 工具创建文件
- **禁止直接文件操作**：不允许使用 fs.writeFile 等 Node.js API
- 代码不超过100行
- 依赖不超过3个
- 必须处理所有错误
- 必须有参数验证
</constraint>

<rule>
## 编码规则
- **工具使用前必须先看 manual**：使用 mode: 'manual' 了解参数格式
- **必须使用 @tool://filesystem 创建所有文件**（绝不直接操作文件系统）
- 使用工具标准接口
- 必须实现核心方法（getDependencies, getMetadata, getSchema, execute）
- 使用api.importx智能加载模块
- 通过api访问环境变量和日志
- 创建完工具后必须调用 promptx_discover 刷新注册表
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

### Step 1: 使用工具前先查看 manual

```javascript
// 使用任何工具前的标准流程
await toolx('@tool://filesystem', { mode: 'manual' });  // 先看懂
await toolx('@tool://filesystem', { mode: 'execute', parameters: {...} });  // 再使用
```

### Step 2: 创建工具文件（必须使用 @tool://filesystem）

⚠️ **重要**：所有文件创建必须通过 `@tool://filesystem` 工具完成

```javascript
// 1. 创建工具目录
await toolx('@tool://filesystem', {
  method: 'create_directory',
  path: 'resource/tool/tool-name'
});

// 2. 创建工具文件 tool-name.tool.js（包含战略性注释）
await toolx('@tool://filesystem', {
  method: 'write_file',
  path: 'resource/tool/tool-name/tool-name.tool.js',
  content: `/**
 * [工具名] - [一句话说明工具的核心定位]
 * 
 * 战略意义：
 * 1. [架构价值]：[说明如何保护系统稳定性或提升架构质量]
 * 2. [平台价值]：[说明如何实现平台独立或增强平台能力]
 * 3. [生态价值]：[说明如何支撑其他工具或服务生态发展]
 * 
 * 设计理念：
 * [一段话阐述设计的核心思想，解释为什么这样设计，
 *  而不是其他方案，强调关键的设计权衡]
 * 
 * 为什么重要：
 * [说明这个工具解决了什么关键问题，没有它会怎样]
 */

module.exports = {
    // 核心方法
    getDependencies() {},
    getMetadata() {},
    getSchema() {},
    execute() {}
  }`
});
```

**文件结构说明**：
- filesystem 工具自动在 `~/.promptx/` 目录下操作
- 路径使用 `resource/tool/{tool-name}/` 格式
- **只创建一个 .tool.js 文件，不需要 manual 文件**
- 工具信息通过 getMetadata() 方法提供，无需单独文档
- 无需指定完整路径

### Step 3: 实现核心接口
```javascript
getDependencies() {
  return {
    'lodash': '^4.17.21'  // 仅在需要时添加
  };
}

getMetadata() {
  return {
    id: 'tool-name',
    name: '工具名称',
    description: '一句话说明',
    version: '1.0.0'
  };
}

getSchema() {
  return {
    parameters: {
      type: 'object',
      properties: {
        input: { 
          type: 'string',
          description: '输入数据'
        }
      },
      required: ['input']
    },
    // 如需环境变量
    environment: {
      type: 'object',
      properties: {
        API_KEY: {
          type: 'string',
          description: 'API密钥'
        }
      }
    }
  };
}
```

### Step 4: 实现执行逻辑
```javascript
async execute(params) {
  const { api } = this;  // 获取沙箱注入的API
  
  // 记录开始
  api.logger.info('开始处理', { params });
  
  try {
    // 使用api.importx智能加载依赖
    const lodash = await api.importx('lodash');
    
    // 访问环境变量
    const apiKey = await api.environment.get('API_KEY');
    
    // 执行核心逻辑
    const result = await this.process(params.input);
    
    api.logger.info('处理成功', { result });
    return {
      success: true,
      data: result
    };
  } catch (error) {
    api.logger.error('处理失败', error);
    throw error;  // ToolValidator会自动处理错误
  }
}
```

### Step 5: 定义业务错误（可选）
```javascript
getBusinessErrors() {
  return [
    {
      code: 'API_RATE_LIMIT',
      description: 'API调用频率超限',
      match: /rate limit/i,
      solution: '等待后重试',
      retryable: true
    }
  ];
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