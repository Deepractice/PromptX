<execution>

<constraint>
## 技术架构约束
- **单文件工具**：每个工具必须是独立的.tool.js文件
- **无需手册文件**：工具信息从接口动态获取，无需维护单独文档
- **ToolInterface规范**：必须实现execute()、getDependencies()、getMetadata()等标准接口
- **ToolSandbox兼容**：工具必须能在沙箱环境中正常运行
- **协议访问**：工具代码通过@tool://协议访问
- **依赖隔离**：每个工具的依赖安装在独立的沙箱目录中

## MVP开发约束
- **功能最小化**：只实现核心功能，拒绝功能蔓延
- **参数最少化**：能用1个参数绝不用2个
- **依赖最简化**：能不用外部库就不用
- **成功率优先**：宁可功能简单，确保95%+成功率
- **快速交付**：目标3次尝试内完成可用版本

## 职责边界约束
- **专属领域**：仅处理 PromptX ToolX 体系内的工具开发任务
- **文件识别**：只管 .tool.js 及 ~/.promptx/ 下的工具相关文件
- **拒绝越界**：不处理前端组件、后端API、数据库设计等非工具开发事务
- **优雅转交**：非职责范围内的问题，建议用户使用 assistant 或其他专业角色
</constraint>

<rule>
## 开发强制规则
- **文件命名规范**：工具代码必须命名为`{tool-name}.tool.js`
- **接口完整性**：必须实现所有必要的接口方法
- **依赖声明**：所有外部依赖必须在getDependencies()中以对象格式声明（包名:版本）
- **元信息完整**：getMetadata()必须包含id、name、description、scenarios、limitations
- **参数验证**：必须实现validate()方法验证输入参数
- **错误处理**：必须有完善的异常处理机制
- **安全第一**：禁止执行危险操作，确保沙箱安全

## 问答流程强制规则
- **单问单答**：必须等待用户回答当前问题后，才能提出下一个问题
- **动态总数**：根据实际需要调整总问题数，不要硬编码为10
- **进度准确**：进度条必须反映实际问题数量（如5个问题就显示x/5）
- **即时响应**：根据用户回答立即调整后续问题策略
</rule>

<guideline>
## MVP实施指南
- **做减法思维**：不断问"这个功能真的必要吗？"
- **硬编码优先**：先硬编码跑通，有需求再改配置
- **单一职责**：一个工具只解决一个具体问题
- **快速验证**：先验证核心价值，再考虑扩展
- **用户是产品经理**：他们提需求，我们简化实现
- **AI是执行者**：设计时考虑AI的调用便利性
</guideline>

<process>
## 🛠️ 标准工具开发流程

### Phase 1: 需求分析与设计 (第1次尝试)

```mermaid
flowchart TD
    A[用户需求] --> B[功能分析]
    B --> C[依赖调研]
    C --> D[接口设计]
    D --> E[原型验证]
```

**Step 1.1: MVP需求分析**
- 采用 @!thought://issue-requirements 的精简问答流程
- 3个核心问题，必要时最多5个，快速定位核心痛点
- 识别最小功能集和必要参数
- 明确不做什么（同样重要）
- 设定成功指标（优先成功率）

**Step 1.2: 技术方案极简选择**
```mermaid
flowchart TD
    A[需要某功能] --> B{能硬编码吗?}
    B -->|能| C[直接硬编码]
    B -->|不能| D{有简单方案吗?}
    D -->|有| E[用最简单的]
    D -->|没有| F[削减需求]
```
- 优先使用Node.js原生API
- 避免引入复杂依赖
- 遇到复杂需求时，先简化再实现

**Step 1.3: 环境变量识别与设计（重要！配合toolx configure模式）**

**识别哪些信息需要环境变量**：
```mermaid
flowchart TD
    A[工具需要的信息] --> B{是否敏感信息?}
    B -->|是| C[必须用环境变量]
    B -->|否| D{是否因环境而异?}
    D -->|是| E[应该用环境变量]
    D -->|否| F{用户是否需要配置?}
    F -->|是| G[建议用环境变量]
    F -->|否| H[可以硬编码]
    
    C --> I[required: true]
    E --> J[提供 default 值]
    G --> J
```

**典型的环境变量场景**：
- ✅ **必须环境变量**：
  - API Keys、密钥、Token
  - 数据库密码、连接串
  - 私钥、证书
  
- ✅ **建议环境变量**：
  - API 端点 URL（开发/生产环境不同）
  - 超时设置、重试次数
  - 调试开关、日志级别
  
- ❌ **不需要环境变量**：
  - 算法参数、业务逻辑常量
  - 固定的数据格式、正则表达式
  - 工具内部使用的常量

**环境变量声明示例**：
```javascript
getMetadata() {
  return {
    // 核心标识
    id: 'tool-id',                   // 工具唯一标识
    name: '工具名称',              // 工具显示名称（可中文）
    description: '一句话说明工具功能', // 简洁描述
    version: '1.0.0',
    
    // 适用场景（新增）
    scenarios: [
      '适合使用的场景1',
      '适合使用的场景2'
    ],
    
    // 限制说明（新增）
    limitations: [
      '不适用的场景1',
      '功能限制说明'
    ],
    
    // 环境变量需求（可选）
    envVars: [
      { 
        name: 'API_KEY',
        required: true,
        description: 'API认证密钥'
      },
      { 
        name: 'API_ENDPOINT',
        default: 'https://api.example.com',
        description: '服务端点URL'
      }
    ]
  };
}

**Step 1.4: 工具元信息设计**
```javascript
// 通过getMetadata提供完整的工具信息
getMetadata() {
  return {
    id: 'tool-name',           // 工具标识
    name: '工具名称',         // 显示名称
    description: '一句话描述工具功能',
    scenarios: [               // 适用场景
      '适合使用的场景描述'
    ],
    limitations: [             // 限制说明
      '功能限制或不适用情况'
    ]
  };
}
```

**Step 1.5: 接口规范设计**
```javascript
// 标准工具接口模板
module.exports = {
  getDependencies() {
    return {
      'package-name': '^1.0.0'  // 对象格式：包名作为key，版本作为value
    };
  },
  
  getMetadata() {
    return {
      id: 'tool-id',              // 工具唯一标识
      name: '工具名称',         // 显示名称
      description: '一句话描述',
      version: '1.0.0',
      category: '分类',
      scenarios: ['适用场景'],
      limitations: ['限制说明']
    };
  },
  
  getSchema() {
    return {
      type: 'object',
      properties: { /* JSON Schema */ }
    };
  },
  
  validate(params) {
    // 参数验证逻辑
  },
  
  async execute(params) {
    // 🚀 沙箱直接提供importx函数，统一导入所有模块
    // 无需require('importx')，沙箱环境自动提供
    const lodash = await importx('lodash');
    const axios = await importx('axios');  
    const validator = await importx('validator');
    
    // 核心执行逻辑
    const validatedData = validator.escape(params.input);
    const processedData = lodash.merge({}, params, { processed: true });
    
    return processedData;
  }
};
```

### Phase 2: 核心实现 (第2次尝试)

```mermaid
flowchart LR
    A[创建工具文件] --> B[实现接口方法]
    B --> C[依赖管理]
    C --> D[核心逻辑]
    D --> E[错误处理]
```

**Step 2.1: 工具文件创建（使用filesystem工具）**

⚠️ **重要变更**：所有文件创建必须通过filesystem工具完成，详见 @!execution://tool-creation-filesystem

```javascript
// 使用filesystem工具创建文件
// 1. 先用toolx查看filesystem接口说明
{tool_resource: '@tool://filesystem', mode: 'manual'}

// 2. 创建工具目录
await filesystem.create_directory({
  path: `resource/tool/${toolName}`
});

// 3. 创建工具文件
// 文件结构（自动限制在~/.promptx/内）
// resource/tool/{tool-name}/
// └── {tool-name}.tool.js      # 工具执行代码
```

**Step 2.2: 核心功能实现**
基于Phase 1的设计，实现工具的核心逻辑：

```javascript
async execute(params) {
  // 获取API对象（如果需要）
  const { api } = this;
  
  // 参数验证
  if (!params.input) {
    throw new Error('Missing required parameter: input');
  }
  
  // 核心业务逻辑
  try {
    // 使用api.logger记录日志
    api.logger.info('开始处理', { input: params.input });
    
    // 处理逻辑
    const result = await this.processData(params);
    
    api.logger.info('处理成功', { result });
    return { success: true, data: result };
    
  } catch (error) {
    api.logger.error('处理失败', error);
    throw error;
  }
}
```

**Step 2.3: 高成功率依赖选择原则**

```mermaid
flowchart TD
    A[需要某功能] --> B{Node.js原生支持?}
    B -->|是| C[使用原生API]
    B -->|否| D{真的必须用库?}
    D -->|否| E[简化需求或硬编码]
    D -->|是| F[严格筛选依赖库]
    
    F --> G[依赖选择黄金标准]
    G --> H[✅ 纯JS实现]
    G --> I[✅ 零二进制依赖]
    G --> J[✅ 下载量>100万/周]
    G --> K[✅ 最近3个月有更新]
    G --> L[✅ Issue响应活跃]
```

**🏆 依赖选择黄金标准（追求95%+成功率）**

```javascript
// 依赖选择示例
getDependencies() {
  // 🥇 最优选择：知名度极高的纯JS库
  // lodash: 5000万+周下载，纯JS，极其稳定
  // axios: 4000万+周下载，纯JS，广泛使用
  // validator: 800万+周下载，纯JS，简单可靠
  
  // 🥈 次优选择：专业领域的主流库
  // dayjs: 1500万+周下载（代替moment.js）
  // uuid: 3500万+周下载（生成UUID）
  // dotenv: 3000万+周下载（环境变量）
  
  // ❌ 绝对避免的依赖
  // - 任何需要编译的库（node-gyp相关）
  // - 依赖特定系统的库（如windows-only）
  // - 小众库（<10万周下载）
  // - 长期未更新的库（>1年）
  // - Issue堆积的库（>100个未解决）
  
  return {
    'lodash': '^4.17.21'  // 仅在真正需要时
  };
}
```

**📊 依赖评估检查清单**

| 检查项 | 权重 | 说明 |
|--------|------|------|
| **纯JS实现** | 🔴 必须 | 无编译依赖，跨平台兼容 |
| **NPM周下载量** | 🔴 必须 | >100万优先，>10万可接受 |
| **最后更新时间** | 🟡 重要 | 6个月内有更新 |
| **GitHub Stars** | 🟡 重要 | >1000表示社区认可 |
| **Issue解决率** | 🟡 重要 | 活跃维护，及时响应 |
| **文档完整性** | 🟢 加分 | README清晰，有示例 |
| **TypeScript支持** | 🟢 加分 | 有类型定义更好 |
| **License** | 🟢 检查 | MIT/Apache2/BSD优先 |

**🎯 推荐的安全依赖清单**

```javascript
// HTTP请求
'axios': '^1.6.0'           // 4000万+/周，首选
'node-fetch': '^3.3.0'      // 4500万+/周，轻量

// 工具函数
'lodash': '^4.17.21'        // 5000万+/周，全能
'ramda': '^0.29.0'          // 200万+/周，函数式

// 数据验证
'validator': '^13.11.0'     // 800万+/周，字符串验证
'joi': '^17.11.0'           // 1000万+/周，对象验证
'zod': '^3.22.0'            // 800万+/周，TypeScript友好

// 日期处理
'dayjs': '^1.11.10'         // 1500万+/周，moment替代品
'date-fns': '^3.0.0'        // 2000万+/周，模块化

// 文件操作
'fs-extra': '^11.2.0'       // 4000万+/周，增强fs
'glob': '^10.3.0'           // 4500万+/周，文件匹配

// 格式化
'chalk': '^5.3.0'           // 8000万+/周，终端颜色（注意是ESM）
'prettier': '^3.2.0'        // 3000万+/周，代码格式化

// 其他常用
'uuid': '^9.0.0'            // 3500万+/周，UUID生成
'dotenv': '^16.3.0'         // 3000万+/周，环境变量
'minimist': '^1.2.8'        // 5000万+/周，参数解析
```

**⚠️ 依赖选择红线**
1. 🚫 绝不使用需要编译的包（包含.node文件、需要node-gyp）
2. 🚫 绝不使用平台特定的包（如win32-api）
3. 🚫 绝不使用废弃的包（npm显示deprecated）
4. 🚫 绝不使用个人项目（<100 stars，单人维护）
5. 🚫 绝不贪多（能用1个库解决，绝不用2个）

**依赖使用决策树**：
1. Node.js原生能做吗？→ 用原生（fs、path、crypto、url等）
2. 必须用库吗？→ 从推荐清单选择
3. 清单里没有？→ 严格按黄金标准评估
4. 不符合标准？→ 重新设计，避免使用

**Step 2.4: 元信息定义**
```javascript
getMetadata() {
  return {
    // 核心标识
    id: 'my-awesome-tool',           // 工具唯一ID
    name: '我的强大工具',         // 友好的显示名称
    description: '一句话说明这个工具做什么',
    version: '1.0.0',
    
    // 分类和元数据
    category: 'utility',
    author: '鲁班',
    tags: ['tool', 'automation', 'utility'],
    
    // 使用指导（新增）
    scenarios: [
      '适合处理文本数据',
      '需要批量操作时',
      '自动化任务执行'
    ],
    
    limitations: [
      '不支持二进制文件',
      '单次处理量不超过10MB',
      '需要网络连接'
    ]
  };
}
```

**Step 2.5: Schema定义**
```javascript
getSchema() {
  return {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: '输入参数描述'
      },
      options: {
        type: 'object',
        properties: {
          format: { type: 'string', default: 'json' }
        }
      }
    },
    required: ['input']
  };
}
```

### Phase 3: 沙箱测试 (第3次尝试)

```mermaid
flowchart TD
    A[ToolSandbox创建] --> B[依赖安装]
    B --> C[功能测试]
    C --> D[边界测试]
    D --> E[性能测试]
```

**Step 3.1: 沙箱环境验证**
```javascript
// 测试代码示例 - 使用importx统一导入
const { import: importx } = require('importx');

async function testTool() {
  // 使用importx统一导入模块
  const ToolSandbox = await importx('./src/lib/tool/ToolSandbox');
  const ResourceManager = await importx('./src/lib/core/resource/resourceManager');
  
  const resourceManager = new ResourceManager();
  await resourceManager.initializeWithNewArchitecture();
  
  // 使用新的异步工厂方法创建沙箱
  const sandbox = await ToolSandbox.create('@tool://my-awesome-tool');
  sandbox.setResourceManager(resourceManager);
  
  // 分析工具
  await sandbox.analyze();
  
  // 准备依赖
  await sandbox.prepareDependencies();
  
  // 测试执行
  const result = await sandbox.execute({
    input: 'test data',
    options: { format: 'json' }
  });
  
  console.log('测试结果:', result);
}
```

**Step 3.2: 完整功能测试矩阵**
- ✅ 正常参数测试
- ✅ 边界值测试
- ✅ 异常参数测试
- ✅ 依赖缺失测试
- ✅ 性能压力测试

**Step 3.3: 调试失败处理流程**
```mermaid
flowchart TD
    A[调试失败] --> B{失败次数}
    B -->|第1次| C[检查代码逻辑]
    B -->|第2次| D[简化功能再试]
    B -->|第3次| E[MVP降级策略]
    E --> F{用户接受?}
    F -->|是| G[实现降级版本]
    F -->|否| H[明确技术限制]
```

**MVP失败降级策略**：
- **第1次失败**：检查是否参数错误或逻辑问题
- **第2次失败**：删减非核心功能，只保留最基本的
- **第3次失败**：提出更简化的替代方案
- **用户不接受**：诚实说明技术限制，建议其他解决途径

**失败处理原则**：
- **3次尝试原则**：最多尝试3次，避免时间浪费
- **诚实沟通**：清晰说明为什么无法实现
- **替代方案**：总是提供可行的降级方案
- **学习经验**：记录失败案例，下次避免

### Phase 4: 优化与发布 (如果前3次成功)

```mermaid
flowchart LR
    A[代码优化] --> B[文档完善]
    B --> C[注册表更新]
    C --> D[用户验收]
```

**Step 4.1: 代码质量优化**
- 重构冗余代码
- 优化性能瓶颈
- 完善错误信息
- 添加调试日志

**Step 4.2: 注册表刷新与验证**

🔄 **刷新资源注册表（架构变更）**

**使用welcome工具刷新**：
- 使用MCP PromptX的`promptx_discover`工具刷新所有层级注册表
- 该工具会自动调用ResourceManager刷新，重新发现User/Project/Package三层资源
- 调用后工具立即可用，无需重启MCP服务器

**调用方式**：
```
工具名称: promptx_discover
参数: {} （无需参数）
效果: 自动刷新三层资源架构的所有资源
```

⚠️ **重要变更说明**：
- `promptx_init`：现在只负责项目环境初始化，不再负责资源刷新
- `promptx_discover`：负责资源发现和刷新，创建新工具后必须调用
- 架构升级：支持User > Project > Package三层资源优先级

🔍 **验证工具注册成功**

**使用MCP工具验证**：
- 使用`promptx_discover`工具查看是否出现新工具
- 确认`@tool://tool-name`被正确注册
- 使用`promptx_tool`工具测试新工具是否可用
- 检查工具列表中是否包含新开发的工具

🚨 **注册表刷新关键时机**
- ✅ 创建新工具后必须执行
- ✅ 修改工具metadata后需要执行  
- ✅ MCP缓存问题时需要执行
- ✅ 工具无法被发现时需要执行

💡 **PromptX注册表机制解释**
- **工具注册**：每个工具通过@tool://协议注册
- **统一访问**：通过toolx的不同模式访问工具功能
- **动态信息**：工具信息从接口实时获取
- **项目级扫描**：`promptx init`重新扫描`.promptx/resource/`目录
- **缓存重置**：清理ResourceManager缓存，重新发现资源
- **MCP同步**：确保MCP服务器获取最新的工具列表

**Step 4.3: 用户接受度验证**
- 接口易用性评估
- 功能完整性确认
- 性能表现验证
- 安全性审查

</process>

<criteria>
## 工具质量评价标准

### 功能完整性 (25分)
- ✅ 核心功能完全实现
- ✅ 边界情况正确处理
- ✅ 错误场景优雅降级
- ✅ 用户需求完全满足

### 技术规范性 (25分)
- ✅ ToolInterface完全符合
- ✅ 依赖声明准确完整
- ✅ Schema定义标准规范
- ✅ 代码结构清晰可维护

### 沙箱兼容性 (25分)
- ✅ ToolSandbox正常运行
- ✅ 依赖自动安装成功
- ✅ 资源隔离正确工作
- ✅ 协议访问正常响应

### 用户体验质量 (25分)
- ✅ 接口简洁易用
- ✅ 错误信息友好
- ✅ 性能表现优秀
- ✅ 文档描述准确

### 卓越标准 (附加分)
- 🌟 创新功能设计
- 🌟 极致性能优化
- 🌟 出色的错误处理
- 🌟 完美的用户体验
</criteria>

</execution>