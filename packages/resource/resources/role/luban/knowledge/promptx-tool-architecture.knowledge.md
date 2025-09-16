# PromptX工具架构知识体系

<knowledge>

## 🏗️ 核心架构组件

### ToolSandbox系统架构
```mermaid
graph TD
    A[Tool Request] --> B[ResourceManager]
    B --> C[Protocol Resolution]
    C --> D[ToolSandbox Creation]
    D --> E[Dependency Management]
    E --> F[VM Execution]
    F --> G[Result Return]
    
    subgraph "沙箱环境"
        H[@user://.promptx/toolbox]
        I[pnpm dependencies]
        J[isolated execution]
    end
    
    D --> H
    E --> I
    F --> J
```

### 工具接口标准
```javascript
// PromptX ToolInterface v2.1 - 支持 ES Module
module.exports = {
  // 🆕 新接口：依赖管理（对象格式）
  getDependencies() {
    return {
      'lodash': '^4.17.21',      // CommonJS 包
      'chalk': '^5.3.0',         // ES Module 包
      '@sindresorhus/is': '^6.0.0'  // Scoped 包
    };
  },
  
  // 核心接口：元信息
  getMetadata() {
    return {
      name: 'tool-name',
      description: '工具描述',
      version: '1.0.0',
      category: 'utility',
      author: '作者',
      tags: ['tag1', 'tag2']
    };
  },
  
  // 核心接口：参数Schema
  getSchema() {
    return {
      type: 'object',
      properties: {
        input: { type: 'string', description: '输入参数' }
      },
      required: ['input']
    };
  },
  
  // 可选接口：参数验证
  validate(params) {
    return { valid: true, errors: [] };
  },
  
  // 核心接口：执行逻辑
  async execute(params) {
    // 工具核心逻辑
    return result;
  },
  
  // 可选接口：初始化
  async init() {
    // 初始化逻辑
  },
  
  // 可选接口：清理
  async cleanup() {
    // 清理逻辑
  }
};
```

## 🔧 技术栈知识

### 🆕 ES Module 与 CommonJS 统一加载
```javascript
// PromptX v1.0+ 统一模块加载接口
async execute(params) {
  // loadModule() 自动检测包类型并正确加载
  const lodash = await loadModule('lodash');      // CommonJS
  const chalk = await loadModule('chalk');        // ES Module v5+
  const nanoid = await loadModule('nanoid');      // ES Module
  
  // 批量加载不同类型模块
  const [axios, validator, execa] = await Promise.all([
    loadModule('axios'),       // CommonJS
    loadModule('validator'),   // CommonJS
    loadModule('execa')        // ES Module v8+
  ]);
  
  // 使用加载的模块
  const id = nanoid.nanoid();
  const colored = chalk.green('Success!');
  const merged = lodash.merge({}, params);
  
  return { id, colored, merged };
}

// 向后兼容：CommonJS 直接 require
const moment = require('moment');  // 仍然支持

// ES Module 必须用 loadModule
const chalk = await loadModule('chalk');  // v5+ 是纯 ES Module

// 错误处理：require ES Module 会得到友好提示
try {
  const chalk = require('chalk');  // chalk v5+ 是 ES Module
} catch (error) {
  // ❌ "chalk" 是 ES Module 包，请使用 await loadModule('chalk')
  // 💡 提示：loadModule 会自动检测包类型并正确加载
}
```


### VM沙箱技术
```javascript
// 基础沙箱环境
const basicSandbox = {
  require: require,
  module: { exports: {} },
  exports: {},
  console: console,
  Buffer: Buffer,
  process: {
    env: process.env,
    hrtime: process.hrtime
  },
  // JavaScript内置对象
  Object, Array, String, Number, Boolean,
  Date, JSON, Math, RegExp, Error, URL
};

// 智能沙箱环境（支持依赖）
const smartSandbox = {
  require: (moduleName) => {
    try {
      // 优先从沙箱目录查找
      return require(require.resolve(moduleName, {
        paths: [
          path.join(sandboxPath, 'node_modules'),
          sandboxPath,
          process.cwd() + '/node_modules'
        ]
      }));
    } catch (error) {
      return require(moduleName);
    }
  },
  // ... 其他环境对象
};
```

## 📚 重要工具库参考

### 常用依赖选择（PromptX工具常用）
- **lodash** `^4.17.21` - 工具函数库 [CommonJS]
- **axios** `^1.6.0` - HTTP请求 [CommonJS]
- **validator** `^13.11.0` - 数据验证 [CommonJS]
- **chalk** `^5.3.0` - 终端输出 [ES Module] ⚡
- **fs-extra** `^11.1.0` - 文件操作 [CommonJS]

⚡ ES Module包需要用 `await importx()` 加载

### 🚀 importx统一模块导入架构
```mermaid
graph TD
    A[需要功能] --> B[统一使用importx]
    B --> C[const { import: importx } = require('importx')]
    C --> D[const module = await importx('module-name')]
    
    D --> E[✅ 所有模块类型都支持]
    E --> F[CommonJS包 ✅]
    E --> G[ES Module包 ✅] 
    E --> H[Node.js内置模块 ✅]
    E --> I[第三方npm包 ✅]
    
    style B fill:#4caf50
    style D fill:#2196f3
    style E fill:#ff9800
```

### 🆕 importx统一模块导入架构
```javascript
// 🚀 沙箱直接提供importx函数
async execute(params) {
  // ✅ 沙箱环境直接提供importx，无需require
  const lodash = await importx('lodash');     // CommonJS ✅
  const chalk = await importx('chalk');       // ES Module v5+ ✅  
  const axios = await importx('axios');       // CommonJS ✅
  const fs = await importx('fs');             // Node.js内置 ✅
  const nanoid = await importx('nanoid');     // ES Module ✅
  
  // 所有包都能正常工作，零认知负担
  const colored = chalk.blue('Hello');
  const merged = lodash.merge({}, params);
  const response = await axios.get(params.url);
  const id = nanoid();
  
  return { colored, merged, response: response.data, id };
}

// 🏗️ PromptX统一架构设计
// ✅ 沙箱环境直接提供importx函数，告别loadModule
// ✅ 删除了复杂的ESModuleRequireSupport.js（200+行代码）
// ✅ 开发者只需记住：await importx('module-name')
// ✅ 包类型变更时代码无需修改

// 💡 importx自动处理的复杂性
// - 自动检测模块类型（CommonJS/ES Module/Node.js内置）
// - 自动选择最佳加载器（auto/native/jiti/bundle-require等）
// - 自动fallback机制，确保加载成功
// - 内置缓存机制，提升性能
```

## 🔐 环境变量管理系统

### 核心设计理念
- **声明式配置**：工具必须在 `getMetadata()` 中预先声明需要的环境变量
- **工具级隔离**：每个工具拥有独立的 `.env` 文件，位于 `~/.promptx/toolbox/{toolId}/.env`
- **敏感信息安全**：API Keys、密钥、认证信息等通过环境变量管理，而非硬编码

### 典型使用场景

#### 1. API 认证信息
```javascript
envVars: [
  { name: 'OPENAI_API_KEY', required: true, description: 'OpenAI API 密钥' },
  { name: 'GITHUB_TOKEN', required: true, description: 'GitHub 访问令牌' },
  { name: 'DB_CONNECTION_STRING', required: true, description: '数据库连接串' }
]
```

#### 2. 服务端点配置
```javascript
envVars: [
  { name: 'API_ENDPOINT', default: 'https://api.example.com', description: 'API 端点' },
  { name: 'WEBHOOK_URL', description: 'Webhook 回调地址' },
  { name: 'PROXY_SERVER', description: '代理服务器地址' }
]
```

#### 3. 工具行为配置
```javascript
envVars: [
  { name: 'TIMEOUT', default: '30000', description: '请求超时时间(ms)' },
  { name: 'MAX_RETRIES', default: '3', description: '最大重试次数' },
  { name: 'DEBUG_MODE', default: 'false', description: '调试模式开关' }
]
```

### 环境变量声明规范

```javascript
module.exports = {
  getMetadata() {
    return {
      name: 'openai-assistant',
      description: 'OpenAI API 集成工具',
      version: '1.0.0',
      
      // 声明需要的环境变量
      envVars: [
        { 
          name: 'OPENAI_API_KEY',        // 环境变量名（建议大写+下划线）
          required: true,                 // 是否必需
          description: 'OpenAI API密钥'   // 用途说明
        },
        { 
          name: 'OPENAI_MODEL',
          default: 'gpt-4',               // 提供默认值
          description: '默认使用的模型'
        },
        { 
          name: 'API_TIMEOUT',
          default: '30000',               
          description: '请求超时时间(毫秒)'
        }
      ]
    };
  }
};
```

### getEnvironment() API 完整使用

```javascript
async execute(params) {
  // 获取环境变量管理器
  const env = this.getEnvironment();
  
  // ===== 读取操作 =====
  const apiKey = await env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return {
      error: '缺少必需的配置',
      message: '请先设置 OPENAI_API_KEY 环境变量',
      instruction: '使用 set 操作配置: {"action": "set", "key": "OPENAI_API_KEY", "value": "sk-..."}'
    };
  }
  
  // 使用默认值
  const model = await env.get('OPENAI_MODEL') || 'gpt-4';
  const timeout = parseInt(await env.get('API_TIMEOUT') || '30000');
  
  // ===== 写入操作 =====
  if (params.action === 'configure') {
    // 交互式配置
    await env.set('OPENAI_API_KEY', params.apiKey);
    await env.set('OPENAI_MODEL', params.model || 'gpt-4');
    
    return { 
      success: true, 
      message: '配置已保存到 .env 文件' 
    };
  }
  
  // ===== 批量操作 =====
  // 获取所有环境变量
  const allVars = await env.getAll();
  
  // 批量设置
  await env.setAll({
    'OPENAI_API_KEY': 'sk-...',
    'OPENAI_MODEL': 'gpt-4',
    'API_TIMEOUT': '60000'
  });
  
  // 删除不需要的变量
  await env.delete('OLD_API_KEY');
  
  // ===== 使用配置执行实际逻辑 =====
  const openai = await importx('openai');
  const client = new openai.OpenAI({ 
    apiKey: apiKey,
    timeout: timeout 
  });
  
  const response = await client.chat.completions.create({
    model: model,
    messages: params.messages
  });
  
  return response;
}
```

### 环境变量管理最佳实践

#### 1. 配置验证模式
```javascript
async execute(params) {
  // 首次运行时检查配置
  const env = this.getEnvironment();
  const metadata = this.getMetadata();
  
  // 验证必需的环境变量
  for (const varDef of metadata.envVars) {
    if (varDef.required) {
      const value = await env.get(varDef.name);
      if (!value) {
        return {
          needConfig: true,
          missing: varDef.name,
          description: varDef.description,
          action: '请先配置必需的环境变量'
        };
      }
    }
  }
  
  // 配置完整，继续执行
  // ...
}
```

#### 2. 敏感信息处理
```javascript
// 永远不要在日志中打印敏感信息
const apiKey = await env.get('API_KEY');
console.log(`Using API Key: ${apiKey.substring(0, 4)}****`); // 脱敏显示

// 错误信息中也要注意脱敏
try {
  // API 调用
} catch (error) {
  // 清理错误信息中的敏感数据
  const safeError = error.message.replace(apiKey, '***KEY***');
  throw new Error(safeError);
}
```

#### 3. 配置迁移支持
```javascript
// 支持从旧配置迁移
async function migrateConfig() {
  const env = this.getEnvironment();
  
  // 检查旧的配置名称
  const oldKey = await env.get('OPENAI_KEY');
  if (oldKey && !await env.get('OPENAI_API_KEY')) {
    // 迁移到新名称
    await env.set('OPENAI_API_KEY', oldKey);
    await env.delete('OPENAI_KEY');
    console.log('配置已迁移: OPENAI_KEY -> OPENAI_API_KEY');
  }
}
```


## 🔄 协议系统深度理解

### ResourceManager工作流程
```mermaid
sequenceDiagram
    participant User
    participant RM as ResourceManager
    participant TP as ToolProtocol
    participant TS as ToolSandbox
    
    User->>RM: loadResource('@tool://text-analyzer')
    RM->>RM: parseProtocol('tool', 'text-analyzer')
    RM->>TP: resolve('text-analyzer')
    TP->>TP: findResourceById('text-analyzer', 'tool')
    TP->>RM: return tool content
    RM->>User: return {success: true, content: '...'}
    User->>TS: new ToolSandbox('@tool://text-analyzer')
    TS->>RM: loadResource('@tool://text-analyzer')
    TS->>TS: analyze() → prepareDependencies() → execute()
```

### 协议引用系统
```javascript
// 协议解析示例
const parsed = protocolParser.parse('@tool://text-analyzer');
// 结果: { protocol: 'tool', path: 'text-analyzer', queryParams: {} }

// 用户协议解析
const userPath = protocolParser.parse('@user://.promptx/toolbox/text-analyzer');
// 结果: { protocol: 'user', path: '.promptx/toolbox/text-analyzer' }

// 资源查找逻辑
const resourceData = registryData.findResourceById('text-analyzer', 'tool');
// 查找ID为'text-analyzer'且protocol为'tool'的资源
```


</knowledge>