# 模块加载

<knowledge>

## api.importx智能加载

### 基本用法
通过工具API提供的importx方法加载模块
```javascript
async execute(params) {
  const { api } = this;  // 获取注入的API实例
  
  // 智能加载任何类型的模块
  const lodash = await api.importx('lodash');      // CommonJS
  const chalk = await api.importx('chalk');        // ES Module  
  const fs = await api.importx('fs');              // Node内置
  const axios = await api.importx('axios');        // 第三方包
  
  // 直接使用，自动处理模块格式差异
  const merged = lodash.merge({}, params);
  const colored = chalk.green('Success!');
  const data = await fs.promises.readFile('file.txt');
  const response = await axios.get(url);
}
```

### 批量加载
```javascript
async execute(params) {
  const { api } = this;
  
  // 并行加载多个模块提高性能
  const [lodash, axios, chalk] = await Promise.all([
    api.importx('lodash'),
    api.importx('axios'),
    api.importx('chalk')
  ]);
}
```

### 智能特性
- **格式自适应**：自动处理CommonJS/ES Module差异
- **降级策略**：智能识别default导出、函数导出、对象导出
- **缓存优化**：模块缓存机制，重复加载速度极快（0ms）
- **预装包优先**：优先使用系统预装包，减少安装时间

### 常见错误
```javascript
// ❌ 错误：直接使用importx（旧方式）
const chalk = await importx('chalk');

// ❌ 错误：使用require（不支持ES Module）
const chalk = require('chalk'); 

// ✅ 正确：使用api.importx（新架构）
const { api } = this;
const chalk = await api.importx('chalk');
```

### 架构说明
```
工具 → api.importx() → ToolAPI → ToolModuleImport → 智能加载
                                         ↓
                                   降级策略链处理
                                   模块格式自适应
```

</knowledge>