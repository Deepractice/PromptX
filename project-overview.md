# PromptX 项目概况分析

## 📋 项目基本信息

**项目名称**: PromptX (dpml-prompt)  
**当前版本**: 0.0.2  
**项目类型**: AI-First CLI系统 / MCP协议框架  
**开发语言**: Node.js (v22.16.0)  
**包管理器**: pnpm  
**许可证**: MIT  

## 🎯 项目定位与价值

### 核心理念
- **"Chat is All you Need"** - 革命性交互设计，让AI Agent秒变行业专家
- 基于**DPML (Deepractice Prompt Markup Language)**协议的AI提示词框架
- 通过**MCP (Model Context Protocol)**为Claude、Cursor等AI应用注入专业能力

### 主要功能模块
1. **提示词结构化协议** - DPML标准化角色定义
2. **AI状态化协议** - PATEOAS导航机制
3. **记忆系统** - AI主动内化和检索知识
4. **女娲角色工坊** - AI角色创造专家
5. **鲁班工具工坊** - MCP工具开发专家

## 🏗️ 技术架构

### 项目结构
```
/workspace
├── src/                    # 核心代码
│   ├── bin/promptx.js     # CLI入口文件
│   ├── lib/               # 核心库
│   ├── dacp/              # DACP服务
│   └── tests/             # 测试套件
├── prompt/                # 提示词资源
│   ├── core/              # 核心提示词
│   ├── domain/            # 领域专家角色
│   └── protocol/          # 协议定义
├── assets/                # 资源文件
└── docs/                  # 文档
```

### 核心技术栈
- **Node.js**: v22.16.0 (运行环境)
- **Commander.js**: CLI框架
- **MCP SDK**: Model Context Protocol支持
- **Express**: HTTP服务
- **Jest**: 测试框架
- **YAML**: 配置解析

### 七大核心命令
1. `init` - 初始化工作环境
2. `welcome` - 发现可用角色
3. `action` - 激活特定角色
4. `learn` - 学习领域知识
5. `recall` - 检索记忆内容
6. `remember` - 保存重要信息
7. `mcp-server` - 启动MCP服务

## 🤖 内置AI角色

### 创作工坊系列
- **女娲 (nuwa)** 🧪 - 角色创造大师，2分钟创建专业AI助手
- **鲁班 (luban)** ⚡ - 工具开发专家，MCP工具开发
- **无面 (noface)** ⚡ - 万能代入角色，读取本地提示词

### 思维决策系列
- **Sean** 🧪 - Deepractice创始人，产品反馈和战略沟通
- **Assistant** 🧪 - 智能助手，通用AI服务

### 感知分析系列
- **觉知者 (awareness)** ⚡ - 体验评估专家，认知分析

*标记说明: 🧪 公测版(稳定) | ⚡ 内测版(尝鲜)*

## 📦 发布与部署

### 版本渠道
- **alpha**: 内测版 - 最新功能，参与测试反馈
- **beta**: 公测版 - 功能相对稳定，适合日常使用  
- **latest**: 正式版 - 生产环境，最高稳定性

### MCP集成配置
```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "--registry", "https://registry.npmjs.org", "dpml-prompt@beta", "mcp-server"]
    }
  }
}
```

### 支持的AI客户端
- Claude Desktop
- Cursor  
- Windsurf
- Cline
- Zed
- Continue

## 🧪 测试与质量

### 测试配置
- **测试框架**: Jest
- **覆盖率要求**: 最低10% (branches/functions/lines/statements)
- **测试类型**: 单元测试、集成测试、E2E测试
- **超时设置**: 15秒

### 代码质量
- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **Husky**: Git钩子管理
- **Changesets**: 版本管理

## 📊 项目状态

### 当前阶段
- **开发状态**: 初始开发阶段，积极完善功能
- **稳定性**: Beta版本，部分功能可能不稳定
- **社区**: 137 GitHub stars，活跃开发中

### 已知问题
1. 角色激活缓存bug - 需重启AI应用解决
2. 女娲创建角色后需手动执行init注册
3. 部分内测功能可能存在不稳定情况

### 技术支持
- **GitHub Issues**: 问题反馈和功能请求
- **开发者微信**: `deepracticex`
- **邮件支持**: `sean@deepracticex.com`

## 🚀 核心优势

1. **零配置启动** - 一行配置即可为AI应用注入专业能力
2. **自然交互** - "Chat is All you Need"，像和真人专家对话
3. **模块化设计** - DPML协议支持角色组件化开发
4. **标准化接口** - 基于MCP协议，广泛兼容AI应用
5. **持续进化** - 活跃的开源社区和快速迭代

## 📈 发展方向

- 完善角色生态系统
- 优化MCP集成体验  
- 扩展工具开发能力
- 增强记忆系统功能
- 提升系统稳定性

---

*本分析基于项目当前状态 (v0.0.2)，更新时间: 2024年*