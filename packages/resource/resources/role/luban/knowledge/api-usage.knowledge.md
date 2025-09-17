# API使用

<knowledge>

## api.environment环境变量

### 读取环境变量
```javascript
async execute(params) {
  const { api } = this;
  
  // 获取单个变量
  const apiKey = await api.environment.get('API_KEY');
  if (!apiKey) {
    return { error: '缺少API_KEY配置' };
  }
  
  // 使用默认值
  const timeout = await api.environment.get('TIMEOUT') || '30000';
  
  // 获取所有变量
  const allVars = await api.environment.getAll();
}
```

### 设置环境变量
```javascript
// 设置单个变量
await api.environment.set('API_KEY', 'sk-xxx');

// 批量设置
await api.environment.setAll({
  'API_KEY': 'sk-xxx',
  'API_URL': 'https://api.example.com'
});

// 删除变量
await api.environment.delete('OLD_KEY');
```

## api.logger日志记录

### 记录日志
```javascript
async execute(params) {
  const { api } = this;
  
  // 不同级别的日志
  api.logger.info('开始处理', { params });
  api.logger.warn('注意事项', { warning: 'xxx' });
  api.logger.error('发生错误', error);
  api.logger.debug('调试信息', { debug: data });
}
```

### 日志位置
- 日志文件：`~/.promptx/toolbox/{toolId}/logs/execute.log`
- 通过mode='log'查询历史日志

## api.getInfo工具信息

```javascript
// 获取当前工具信息
const info = api.getInfo();
// 返回: { toolId, sandboxPath, version }
```

</knowledge>