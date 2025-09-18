# API使用

<knowledge>

## api.importx模块加载

### 智能模块导入
```javascript
async execute(params) {
  const { api } = this;
  
  // 智能加载各种格式的模块
  const _ = await api.importx('lodash');        // CommonJS函数导出
  const axios = await api.importx('axios');      // 默认导出风格
  const moment = await api.importx('moment');    // 函数式导出
  const joi = await api.importx('joi');          // 对象式导出
  
  // 直接使用，无需关心模块格式
  const result = _.merge({a: 1}, {b: 2});
  const response = await axios.get(url);
  const now = moment().format();
}
```

### 核心特性
- **自动适配**：智能处理CommonJS/ESM差异
- **降级策略**：4层策略确保正确加载
- **缓存机制**：避免重复加载
- **预装优先**：优先使用系统预装包

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

## api.storage持久化存储

### 存储数据
```javascript
async execute(params) {
  const { api } = this;
  
  // 存储各种类型的数据（自动JSON序列化）
  await api.storage.setItem('config', {
    theme: 'dark',
    language: 'zh-CN',
    fontSize: 14
  });
  
  await api.storage.setItem('counter', 42);
  await api.storage.setItem('enabled', true);
  await api.storage.setItem('tags', ['tag1', 'tag2']);
}
```

### 读取数据
```javascript
// 读取存储的数据（自动JSON反序列化）
const config = await api.storage.getItem('config');
const counter = await api.storage.getItem('counter');

// 不存在的键返回 null
const notExists = await api.storage.getItem('not-exists'); // null
```

### 其他操作
```javascript
// 删除指定项
await api.storage.removeItem('old-data');

// 清空所有存储
await api.storage.clear();

// 获取所有键名
const keys = await api.storage.keys();
// 返回: ['config', 'counter', 'enabled', 'tags']

// 获取存储项数量
const length = api.storage.length;

// 获取所有数据
const allData = await api.storage.getAll();
// 返回: { config: {...}, counter: 42, enabled: true, tags: [...] }

// 检查键是否存在
const hasConfig = await api.storage.hasItem('config'); // true

// 获取存储大小
const size = api.storage.getSize(); // 返回字节数
```

### 核心特性
- **完全兼容localStorage API**：零学习成本，前端开发者秒懂
- **自动隔离**：每个工具独立的 `storage.json` 文件
- **智能序列化**：自动处理对象、数组等复杂类型
- **持久化保证**：数据存储在 `~/.promptx/toolbox/{toolId}/storage.json`
- **10MB容量限制**：单个工具最多10MB存储空间

</knowledge>