# 常用依赖

<knowledge>

## 工具函数库
- **lodash** `^4.17.21` - 工具函数集合 [CommonJS]
- **ramda** `^0.29.0` - 函数式编程 [CommonJS]
- **moment** `^2.29.0` - 日期处理 [CommonJS]
- **dayjs** `^1.11.0` - 轻量日期库 [CommonJS]

## HTTP请求
- **axios** `^1.6.0` - HTTP客户端 [CommonJS]
- **node-fetch** `^3.3.0` - Fetch API [ES Module]
- **got** `^13.0.0` - HTTP请求库 [ES Module]

## 文件操作
- **fs-extra** `^11.1.0` - 增强文件操作 [CommonJS]
- **glob** `^10.3.0` - 文件模式匹配 [CommonJS]

## 数据验证
- **validator** `^13.11.0` - 字符串验证 [CommonJS]
- **joi** `^17.11.0` - 对象验证 [CommonJS]
- **zod** `^3.22.0` - TypeScript验证 [CommonJS]

## 终端输出
- **chalk** `^5.3.0` - 彩色输出 [ES Module] ⚡
- **ora** `^7.0.0` - 加载动画 [ES Module] ⚡
- **cli-table3** `^0.6.0` - 表格输出 [CommonJS]

## 数据处理
- **csv-parse** `^5.5.0` - CSV解析 [CommonJS]
- **xml2js** `^0.6.0` - XML解析 [CommonJS]
- **yaml** `^2.3.0` - YAML解析 [CommonJS]

## 加密安全
- **bcrypt** `^5.1.0` - 密码加密 [CommonJS]
- **jsonwebtoken** `^9.0.0` - JWT处理 [CommonJS]
- **uuid** `^9.0.0` - UUID生成 [CommonJS]
- **nanoid** `^5.0.0` - ID生成 [ES Module] ⚡

## 注意事项
- ⚡ 标记的是ES Module包，需要用`await importx()`加载
- 其他都是CommonJS包，但建议统一用importx加载
- 版本号仅供参考，使用最新稳定版

</knowledge>