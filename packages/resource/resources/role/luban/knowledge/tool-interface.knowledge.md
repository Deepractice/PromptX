# 工具接口规范

<knowledge>

## 核心概念

### 单文件工具架构
PromptX 工具是**单文件设计**：
1. **只需要一个 .tool.js 文件** - 包含所有接口方法
2. **不需要 manual 文件** - 工具信息从 getMetadata() 动态获取
3. **不需要额外配置文件** - 所有配置通过接口方法提供


## 标准工具接口

### getMetadata()
返回工具元信息
```javascript
getMetadata() {
  return {
    id: 'tool-id',           // 唯一标识
    name: '工具名称',         // 显示名称
    description: '功能说明',  // 一句话描述
    version: '1.0.0',        // 版本号
    author: '作者'           // 作者信息
  };
}
```

### getSchema()
返回参数和环境变量Schema（JSON Schema标准）
```javascript
getSchema() {
  return {
    // 执行参数Schema
    parameters: {
      type: 'object',
      properties: {
        input: { 
          type: 'string',
          description: '输入参数',
          minLength: 1,        // 最小长度
          maxLength: 1000,     // 最大长度
          pattern: '^[\\w]+$'  // 正则验证
        },
        count: {
          type: 'number',
          description: '数量',
          minimum: 1,          // 最小值
          maximum: 100,        // 最大值
          default: 10          // 默认值
        },
        format: {
          type: 'string',
          enum: ['json', 'xml', 'text'],  // 枚举值
          default: 'json'
        }
      },
      required: ['input']      // 必需参数
    },
    
    // 环境变量Schema
    environment: {
      type: 'object',
      properties: {
        API_KEY: {
          type: 'string',
          description: 'API密钥'
        },
        TIMEOUT: {
          type: 'number',
          description: '超时时间(ms)',
          minimum: 1000,
          maximum: 60000,
          default: 30000
        }
      },
      required: ['API_KEY']    // 必需环境变量
    }
  };
}
```

### execute(params)
执行工具逻辑
```javascript
async execute(params) {
  const { api } = this;  // 获取沙箱注入的API
  
  // 使用API记录日志
  api.logger.info('开始处理', { params });
  
  // 执行核心业务逻辑
  const result = await this.processData(params.input);
  
  api.logger.info('处理成功');
  return result;
}
```

### getDependencies()
声明npm依赖
```javascript
getDependencies() {
  return {
    'lodash': '^4.17.21',
    'axios': '^1.6.0'
  };
}
```

### getBusinessErrors()
定义业务错误
```javascript
getBusinessErrors() {
  return [
    {
      code: 'API_RATE_LIMIT',
      description: 'API调用频率超限',
      match: /rate limit/i,    // 正则匹配
      solution: '等待60秒后重试',
      retryable: true
    },
    {
      code: 'FILE_NOT_FOUND',
      description: '文件不存在',
      match: 'ENOENT',         // 字符串匹配
      solution: '检查文件路径',
      retryable: false
    }
  ];
}
```

### init() / cleanup()
初始化和清理
```javascript
async init() {
  // 初始化资源
}

async cleanup() {
  // 清理资源
}
```


## 最简工具示例
```javascript
module.exports = {
  getDependencies() { return {}; },      // 依赖声明
  getMetadata() { return {}; },          // 工具元信息  
  getSchema() { return {}; },            // 参数定义
  async execute(params) { return {}; }   // 执行逻辑
};
```

</knowledge>