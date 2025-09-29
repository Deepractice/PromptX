# 工具实现流程

<execution>

<constraint>
## 实现约束
- **文件创建方式**：必须且只能通过 @tool://tool-creator 工具创建文件
- **禁止直接文件操作**：不允许使用 fs.writeFile 等 Node.js API
- 代码不超过100行
- 依赖不超过3个
- 必须处理所有错误
- 必须有参数验证
</constraint>

<rule>
## 编码规则
- **工具使用前必须先看 manual**：使用 mode: 'manual' 了解参数格式
- **必须使用 @tool://tool-creator 创建所有文件**（绝不直接操作文件系统）
- 使用工具标准接口
- 必须实现核心方法（getDependencies, getMetadata, getSchema, execute）
- 使用api.importx智能加载模块
- 通过api访问环境变量和日志
- 创建完工具后先用 validate action 验证，再调用 promptx_discover（规范名称）刷新注册表
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

- **必须先查看工具手册**：第一次使用时通过promptx_toolx调用@tool://tool-creator，mode: manual
- **了解参数格式**：掌握正确的参数结构和调用方式
- **理解工具能力**：明确工具支持的操作类型

### Step 2: 创建工具文件（必须使用 @tool://tool-creator）

⚠️ **重要**：所有文件创建必须通过 `@tool://tool-creator` 工具完成

- **使用tool-creator工具创建工具文件**
- 通过promptx_toolx（规范名称）调用@tool://tool-creator，mode: execute
- 使用4参数设计：tool/action/file/content
- 创建包含完整战略注释和核心接口的工具文件
- 具体参数格式和操作方式参考工具手册

**tool-creator 使用说明**：
- 自动在 `~/.promptx/resource/tool/{tool}/` 目录下操作
- 使用4参数设计：tool/action/file/content
- 支持的action：write、read、delete、list、exists、validate
- **只创建一个 .tool.js 文件，不需要 manual 文件**
- 工具信息通过 getMetadata() 方法提供，无需单独文档
- 自动创建目录结构，无需手动创建

### Step 2.5: 设计外部依赖Bridge

外部依赖必须通过Bridge模式隔离（具体规范见 bridge-design execution）

基本用法：
```javascript
// ❌ 错误：直接调用外部模块
const mysql = await api.importx('mysql2');
const conn = await mysql.createConnection();

// ✅ 正确：通过Bridge隔离
const conn = await api.bridge.execute('db:connect', config);
```

Bridge设计要点：
- 识别所有外部依赖
- 每个依赖都要有mock实现
- Mock数据要合理完整

### Step 2.6: 返回体设计 [关键步骤]

⚠️ **重要认知**：工具返回的数据会成为AI的输入，占用AI的思考空间！

**设计原理**：
- AI的上下文窗口有限（通常128k-200k tokens）
- 大数据返回会耗尽AI的思考空间
- AI需要空间来理解、思考和对话

**设计步骤**：
1. 估算返回数据的大小（JSON.stringify后的长度/4 ≈ token数）
2. 考虑数据对AI的影响：
   - 小于1KB：可以直接返回
   - 1KB-10KB：考虑返回摘要+关键部分
   - 大于10KB：必须使用引用模式（保存文件，返回路径）
3. 为大数据设计访问方案（文件路径、URL、分页等）

**记住**：返回给AI的应该是"AI需要知道的信息"，而非"所有数据"。

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

### Step 6: 验证和交付

- **验证工具完整性**：通过tool-creator的validate操作检查语法和接口
- **刷新工具注册表**：调用promptx_discover确保工具可被发现
- **确认工具可用**：验证工具出现在工具列表中且可正常调用
- **交付确认**：简洁确认完成，遵循chat-is-all-you-need原则

**验证要点**：
- validate会检查JavaScript语法
- 验证必需的方法（getDependencies、getMetadata、getSchema、execute）
- 检查module.exports是否正确
- 验证成功后才算交付完成

</process>

<criteria>
## 实现质量标准
- ✅ 接口实现完整
- ✅ 错误处理完善
- ✅ 参数验证严格
- ✅ 代码简洁可读
</criteria>

</execution>