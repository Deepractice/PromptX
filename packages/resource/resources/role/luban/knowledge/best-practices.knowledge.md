# 最佳实践

<knowledge>

## 工具设计原则
- **单一职责**：一个工具只做一件事
- **参数精简**：1-2个必需参数，其他硬编码
- **错误友好**：清晰的错误信息和恢复建议
- **幂等性**：相同输入产生相同输出
- **Schema驱动**：用Schema定义所有验证规则

## 代码实现规范
```javascript
// ✅ 正确做法
async execute(params) {
  // 系统已基于Schema验证参数
  // 直接处理业务逻辑
  try {
    const result = await this.process(params);
    return { success: true, data: result };
  } catch (error) {
    // 优雅处理错误
    return { 
      success: false, 
      error: error.message,
      suggestion: '请检查输入格式'
    };
  }
}

// ❌ 错误做法
async execute(params) {
  // 重复验证（系统已验证）
  if (!params.input) {
    return { error: '缺少参数' };
  }
  if (typeof params.input !== 'string') {
    return { error: '参数类型错误' };
  }
  const result = await doSomething(params.input);
  return result; // 返回格式不统一
}
```

## Schema设计规范
```javascript
getSchema() {
  return {
    parameters: {
      type: 'object',
      properties: {
        // 使用详细的验证规则
        email: {
          type: 'string',
          format: 'email',      // 格式验证
          description: '邮箱地址'
        },
        age: {
          type: 'number',
          minimum: 0,           // 最小值
          maximum: 150,         // 最大值
          description: '年龄'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,          // 最少项数
          maxItems: 10,         // 最多项数
          uniqueItems: true     // 唯一性
        }
      },
      required: ['email'],
      additionalProperties: false  // 禁止额外属性
    }
  };
}
```

## 环境变量管理
```javascript
// 在getSchema中声明
getSchema() {
  return {
    parameters: { ... },
    environment: {
      type: 'object',
      properties: {
        API_KEY: {
          type: 'string',
          description: '必需的API密钥'
        }
      },
      required: ['API_KEY']
    }
  };
}

// 在execute中使用
async execute(params) {
  const apiKey = await this.api.environment.get('API_KEY');
  if (!apiKey) {
    return {
      needConfig: true,
      message: '请先配置API_KEY',
      instruction: '使用mode="configure"设置'
    };
  }
}
```

## 日志记录
```javascript
// 记录关键操作
api.logger.info('开始处理', { params });
api.logger.info('处理成功', { result });
api.logger.error('处理失败', { error });

// 不要记录敏感信息
const apiKey = await api.environment.get('API_KEY');
api.logger.info(`使用API Key: ${apiKey.substring(0, 4)}****`);
```

## 测试原则
- 编写完整的Schema定义
- 使用mode='manual'查看工具文档
- 使用mode='log'查看执行日志
- 失败后用mode='rebuild'重建环境
- 依赖系统验证，专注业务逻辑

</knowledge>