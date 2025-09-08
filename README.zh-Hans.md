<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · 领先的AI上下文工程平台</h1>
  <h2>✨ Chat is all you need - 革命性交互设计，让AI Agent秒变行业专家</h2>
  <p><strong>核心能力：</strong>AI角色创造平台 | 智能工具开发平台 | 认知记忆系统</p>
  <p>基于MCP协议，一行命令为Claude、Cursor等AI应用注入专业能力</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/@promptx/cli"><img src="https://img.shields.io/npm/v/@promptx/cli?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <img src="https://komarev.com/ghpvc/?username=PromptX&label=Repository%20views&color=0e75b6&style=flat" alt="Repository Views"/>
  </p>

  <p>
    <strong><a href="README.zh-Hans.md">简体中文</a></strong> | 
    <a href="README.zh-Hant.md">繁體中文</a> | 
    <a href="README.md">English</a> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

---

## 💬 Chat is All you Need - 自然对话，瞬间专业

### ✨ 三步体验 PromptX 魔力

#### 🔍 **第一步：发现专家**
```
用户：「我要看看有哪些专家可以用」
AI：   立即展示23个可用角色，从产品经理到架构师应有尽有
```

#### ⚡ **第二步：召唤专家**  
```
用户：「我需要一个产品经理专家」
AI：   瞬间变身专业产品经理，获得完整专业知识和工作方法
```

#### 🎯 **第三步：专业对话**
```
用户：「帮我重新设计产品页面」
AI：   以专业产品经理身份，提供深度产品策略建议
```

### 🚀 为什么这是革命性的？

**❌ 传统方式：**
- 学习复杂指令语法
- 记住各种参数配置
- 担心说错话导致失效

**✅ PromptX方式：**
- 像和真人专家聊天一样自然
- 想怎么说就怎么说，AI理解你的意图
- 专家状态持续对话期间保持有效

### 💡 核心理念

> **把AI当人，不是软件**
> 
> 不需要"正确指令"，只需要自然表达。AI会理解你想要什么专家，并瞬间转换身份。

---

## ⚡ 立即开始 - 两种方式任选

### 🎯 方式一：PromptX 客户端（推荐）
**适合所有用户 - 一键启动，零配置**

1. **[下载客户端](https://github.com/Deepractice/PromptX/releases)** - 支持 Windows、Mac、Linux
2. **启动HTTP服务** - 打开客户端，自动运行MCP服务器
3. **配置AI应用** - 将以下配置添加到你的Claude/Cursor等AI工具：
   ```json
   {
     "mcpServers": {
       "promptx": {
         "type": "streamable-http",
         "url": "http://127.0.0.1:5203/mcp"
       }
     }
   }
   ```

4. **开始对话** - 在AI应用中说"我要看看有哪些专家"

✅ 无需技术背景 ✅ 可视化管理 ✅ 自动更新

### 🔧 方式二：直接运行（开发者）
**有Node.js环境的开发者可以直接使用：**

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "@promptx/mcp-server"]
    }
  }
}
```

### 🐳 方式三：Docker（生产就绪）
**使用Docker部署PromptX到生产环境：**

```bash
docker run -d -p 5203:5203 -v ~/.promptx:/root/.promptx deepracticexs/promptx:latest
```

📚 **[完整Docker文档 →](./docker/README.md)**

---

## 🎨 **女娲创造工坊 - 让每个人都成为AI角色设计师**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="女娲创造工坊" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 革命性元提示词技术 - 从想法到现实，只需2分钟**

你有没有想过：如果我能为特定工作场景定制一个专业AI助手会怎样？**女娲基于元提示词技术让这个想法变成现实。**

> *"女娲不是普通的角色模板，而是会思考的元提示词引擎 - 理解你的需求，生成专业提示词，创造真正的AI专家。"*

#### **🎯 元提示词核心原理**

- **🧠 需求分析**: 女娲元提示词深度理解你的场景需求和专业要求
- **📝 提示词生成**: 自动构建符合DPML标准的完整提示词架构
- **🎭 角色具化**: 将抽象需求转化为具体可执行的AI专家角色
- **⚡ 即时部署**: 生成的提示词立即转换为可激活的PromptX角色
- **🔄 持续优化**: 基于使用反馈，元提示词不断进化

#### **✨ 使用场景示例**

<div align="center">

| 🎯 **用户需求** | ⚡ **女娲生成** | 🚀 **立即可用** |
|---|---|---|
| 👩‍💼 "我需要一个懂小红书营销的AI助手" | 小红书营销专家角色 | `激活小红书营销专家` |
| 👨‍💻 "我想要一个Python异步编程专家" | Python异步编程导师角色 | `激活Python异步编程导师` |
| 🎨 "给我一个UI/UX设计顾问" | UI/UX设计专家角色 | `激活UI/UX设计专家` |
| 📊 "需要一个数据分析师助手" | 数据分析专家角色 | `激活数据分析专家` |

</div>

#### **🎪 4步创造专属AI助手**

```
用户："我要女娲帮我创建一个小红书营销专家"
女娲：立即理解需求，询问具体场景和要求

用户："主要帮我写小红书文案，分析热点，制定推广策略"  
女娲：2分钟内创建完整的小红书营销专家角色

用户："激活小红书营销专家"
AI：  瞬间变身专业小红书营销专家，提供专业建议
```

#### **🌟 元提示词的技术突破**

女娲代表了提示词工程的重大突破 - **从静态模板到动态生成**：

- **🎯 智能理解**: 元提示词具备理解能力，不只是文本匹配，而是语义分析
- **📝 动态生成**: 根据需求实时构建提示词，每个角色都是量身定制
- **🧠 结构化输出**: 确保生成的角色符合DPML标准，保证专业品质
- **🔄 自我进化**: 元提示词通过使用反馈不断优化生成策略

---

<div align="center">

**由 [Deepractice 深度实践](https://github.com/Deepractice) 出品**

*让AI成为你的专业伙伴*

---

🌐 [官网](https://deepractice.ai) | 🔧 [GitHub](https://github.com/Deepractice) | 📚 [文档中心](https://docs.deepractice.ai) | 💬 [论坛](https://x.deepractice.ai) | 🚀 [中转站服务](https://router.deepractice.ai)

---

## ⭐ **Star增长趋势**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

### 📱 联系作者

<img src="assets/qrcode.jpg" alt="添加开发者微信" width="200">

**扫码添加开发者微信，获取技术支持与合作洽谈**

</div>
