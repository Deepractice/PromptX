# ToolSandbox 使用指南

## 概述

ToolSandbox 是 PromptX 的核心工具执行环境，提供了安全隔离的沙箱来运行各种自定义工具。它支持自动依赖管理、CommonJS 和 ES Module 包的统一加载，以及完整的生命周期管理。

## 快速开始

### 创建工具

创建一个新工具只需要实现 `ToolInterface` 接口：

```javascript
// my-tool.tool.js
module.exports = {
  /**
   * 工具元信息
   */
  getMetadata() {
    return {
      name: 'my-tool',
      version: '1.0.0',
      description: '我的自定义工具',
      manual: '@manual://my-tool'  // 可选：工具手册
    };
  },

  /**
   * 参数验证模式
   */
  getSchema() {
    return {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: '输入文本'
        }
      },
      required: ['input']
    };
  },

  /**
   * 声明依赖包
   */
  getDependencies() {
    return {
      'lodash': '^4.17.21',      // CommonJS 包
      'chalk': '^5.3.0',         // ES Module 包
      '@sindresorhus/is': '^6.0.0'  // Scoped 包
    };
  },

  /**
   * 参数验证（可选）
   */
  validate(params) {
    if (!params.input || params.input.trim() === '') {
      return {
        valid: false,
        errors: ['输入不能为空']
      };
    }
    return { valid: true };
  },

  /**
   * 执行工具
   */
  async execute(params) {
    // 使用统一的 loadModule 加载任何类型的包
    const lodash = await loadModule('lodash');
    const chalk = await loadModule('chalk');
    
    const result = lodash.upperCase(params.input);
    const colored = chalk.blue(result);
    
    return {
      success: true,
      data: {
        original: params.input,
        processed: result,
        colored: colored
      }
    };
  }
};
```

### 工具目录结构

```text
.promptx/resource/tool/
├── my-tool/
│   ├── my-tool.tool.js      # 工具实现（必需）
│   └── my-tool.manual.md    # 工具手册（可选）
└── another-tool/
    └── another-tool.tool.js
```

## 模块加载

### 统一接口：loadModule()

ToolSandbox 提供了统一的模块加载接口，自动处理 CommonJS 和 ES Module 的差异：

```javascript
async execute(params) {
  // 不需要关心包的类型，loadModule 会自动处理
  const lodash = await loadModule('lodash');      // CommonJS
  const chalk = await loadModule('chalk');        // ES Module
  const nanoid = await loadModule('nanoid');      // ES Module
  
  // 批量加载
  const [axios, validator, execa] = await Promise.all([
    loadModule('axios'),
    loadModule('validator'),
    loadModule('execa')
  ]);
  
  // 使用加载的模块
  const id = nanoid.nanoid();
  const colored = chalk.green('Success!');
  const merged = lodash.merge({}, params);
}
```

### 传统方式（向后兼容）

```javascript
// CommonJS 包可以直接 require
const lodash = require('lodash');
const moment = require('moment');

// ES Module 包使用 loadModule 或 importModule
const chalk = await loadModule('chalk');
const nodeFs = await importModule('node-fetch');
```

### 错误处理

当尝试用 `require` 加载 ES Module 时，会得到友好的错误提示：

```javascript
try {
  const chalk = require('chalk');  // chalk v5+ 是 ES Module
} catch (error) {
  console.log(error.message);
  // ❌ "chalk" 是 ES Module 包，请使用 await loadModule('chalk') 代替 require('chalk')
  // 💡 提示：loadModule 会自动检测包类型并正确加载
}
```

## 依赖管理

### 声明依赖

在 `getDependencies()` 方法中声明工具需要的 npm 包：

```javascript
getDependencies() {
  return {
    // 标准包
    'lodash': '^4.17.21',
    'axios': '^1.6.0',
    
    // Scoped 包
    '@sindresorhus/is': '^6.0.0',
    '@types/node': '^20.0.0',
    
    // 精确版本
    'uuid': '9.0.1',
    
    // 版本范围
    'express': '>=4.18.0 <5.0.0',
    
    // ES Module 包
    'chalk': '^5.3.0',
    'node-fetch': '^3.3.2',
    'execa': '^8.0.1'
  };
}
```

### 自动安装

ToolSandbox 会自动：

1. 检测依赖变化
2. 安装缺失的包
3. 更新版本变化
4. 使用 pnpm 进行高效的依赖管理

### 隔离环境

每个工具都有独立的依赖环境：

- 独立的 `node_modules` 目录
- 独立的 `package.json`
- 版本冲突不会影响其他工具

## 参数验证

### Schema 验证

使用 JSON Schema 定义参数结构：

```javascript
getSchema() {
  return {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'API 端点'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' }
      }
    },
    required: ['url']
  };
}
```

### 自定义验证

提供额外的验证逻辑：

```javascript
validate(params) {
  const errors = [];
  
  // 自定义验证规则
  if (params.url && !params.url.startsWith('https://')) {
    errors.push('URL 必须使用 HTTPS 协议');
  }
  
  if (params.timeout && params.timeout > 30000) {
    errors.push('超时时间不能超过 30 秒');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## 高级功能

### 访问沙箱上下文

工具可以访问预定义的沙箱功能：

```javascript
async execute(params) {
  // 全局可用的功能
  console.log('开始执行...');
  
  // 使用 Buffer
  const buffer = Buffer.from('hello', 'utf8');
  
  // 使用 process 环境变量（受限）
  const nodeEnv = process.env.NODE_ENV;
  
  // 文件系统操作（如果授权）
  const fs = require('fs');
  const data = await fs.promises.readFile('config.json', 'utf8');
  
  // HTTP 请求
  const axios = await loadModule('axios');
  const response = await axios.get(params.url);
  
  return { success: true, data: response.data };
}
```

### 错误处理最佳实践

```javascript
async execute(params) {
  try {
    const result = await someOperation();
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // 提供详细的错误信息
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.stack  // 调试模式下有用
      }
    };
  }
}
```

### 流式输出

对于长时间运行的任务，可以提供进度更新：

```javascript
async execute(params, context) {
  const steps = ['初始化', '处理数据', '生成结果'];
  const results = [];
  
  for (let i = 0; i < steps.length; i++) {
    // 如果 context 支持进度回调
    if (context?.onProgress) {
      context.onProgress({
        step: i + 1,
        total: steps.length,
        message: steps[i]
      });
    }
    
    // 执行步骤
    const result = await processStep(steps[i]);
    results.push(result);
  }
  
  return {
    success: true,
    data: results
  };
}
```

## 测试工具

### 使用 tool-tester

PromptX 提供了内置的测试工具：

```bash
# 测试所有功能
promptx tool @tool://tool-tester --params '{"testType": "all"}'

# 测试特定功能
promptx tool @tool://tool-tester --params '{"testType": "esmodule"}'
```

### 编写单元测试

```javascript
// test/my-tool.test.js
const MyTool = require('../my-tool.tool.js');

describe('MyTool', () => {
  test('should validate parameters correctly', () => {
    const result = MyTool.validate({ input: 'test' });
    expect(result.valid).toBe(true);
  });
  
  test('should execute successfully', async () => {
    const result = await MyTool.execute({ input: 'hello' });
    expect(result.success).toBe(true);
    expect(result.data.processed).toBe('HELLO');
  });
});
```

## 实现原理（简述）

### 架构概览

ToolSandbox 采用多层架构设计：

```text
┌─────────────────────────────────────┐
│         Tool Interface              │  <- 工具实现层
├─────────────────────────────────────┤
│         ToolSandbox                 │  <- 沙箱管理层
├─────────────────────────────────────┤
│    SandboxIsolationManager          │  <- 隔离执行层
├─────────────────────────────────────┤
│      VM Context + Node.js           │  <- 运行时环境
└─────────────────────────────────────┘
```

### 关键特性

1. **依赖隔离**：每个工具有独立的 `node_modules`，避免版本冲突
2. **安全沙箱**：使用 Node.js VM 模块创建隔离的执行环境
3. **智能加载**：自动检测模块类型，统一处理 CommonJS 和 ES Module
4. **自动管理**：依赖变化检测、自动安装、缓存优化

### ES Module 支持

通过 `ESModuleRequireSupport` 类实现：

- 检测 `package.json` 的 `type` 字段
- 使用动态 `import()` 加载 ES Module
- 处理 `Module.createRequire` 的兼容性包装
- 提供统一的 `loadModule()` 接口

## 常见问题

### Q: 如何知道一个包是 CommonJS 还是 ES Module？

A: 使用 `loadModule()` 就不需要关心了，它会自动处理。如果一定要知道，可以查看包的 `package.json` 中是否有 `"type": "module"`。

### Q: 为什么 require ES Module 包会报错？

A: 这是有意设计的保护机制，防止加载错误的模块格式。请使用 `await loadModule('package-name')` 代替。

### Q: 工具的依赖安装在哪里？

A: 在 `~/.promptx/toolbox/[tool-name]/node_modules/` 目录下。

### Q: 如何更新工具的依赖？

A: 修改 `getDependencies()` 返回的版本号，下次执行时会自动更新。

### Q: 支持私有 npm 仓库吗？

A: 支持，配置好 `.npmrc` 或使用 pnpm 的配置即可。

## 最佳实践

1. **始终使用 `loadModule()`** - 统一的接口，避免模块类型问题
2. **声明所有依赖** - 在 `getDependencies()` 中明确列出
3. **提供完整的 Schema** - 帮助 AI 理解参数结构
4. **编写清晰的错误信息** - 便于调试和用户理解
5. **避免全局状态** - 保持工具的无状态和可重入性
6. **编写工具手册** - 创建 `.manual.md` 文件说明用法
