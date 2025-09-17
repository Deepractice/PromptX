# 模块加载

<knowledge>

## importx统一加载

### 基本用法
沙箱环境直接提供importx函数，无需require
```javascript
async execute(params) {
  // 加载任何类型的模块
  const lodash = await importx('lodash');      // CommonJS
  const chalk = await importx('chalk');        // ES Module
  const fs = await importx('fs');              // Node内置
  const axios = await importx('axios');        // 第三方包
  
  // 使用加载的模块
  const merged = lodash.merge({}, params);
  const colored = chalk.green('Success!');
  const data = await fs.promises.readFile('file.txt');
  const response = await axios.get(url);
}
```

### 批量加载
```javascript
// 并行加载多个模块提高性能
const [lodash, axios, chalk] = await Promise.all([
  importx('lodash'),
  importx('axios'),
  importx('chalk')
]);
```

### 注意事项
- importx自动检测模块类型
- 不需要关心是CommonJS还是ES Module
- 包括内置缓存机制，重复加载很快
- 替代了旧的loadModule和require

### 常见错误
```javascript
// ❌ 错误：不要用require加载ES Module
const chalk = require('chalk'); // chalk v5+会报错

// ✅ 正确：统一用importx
const chalk = await importx('chalk');
```

</knowledge>