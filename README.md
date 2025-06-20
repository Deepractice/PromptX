<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · AI应用原生专业能力增强系统</h1>
  <p>通过MCP协议为AI应用提供专业角色、记忆管理和知识体系，一行命令，让任何 AI 客户端秒变专业选手。</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/dpml-prompt"><img src="https://img.shields.io/npm/v/dpml-prompt?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <a href="https://github.com/Deepractice/PromptX/actions"><img src="https://img.shields.io/github/actions/workflow/status/Deepractice/PromptX/ci.yml?label=CI&logo=github" alt="CI Status"/></a>
  </p>

  <p>
    <strong><a href="README.md">中文</a></strong> | 
    <a href="README_EN.md">English</a> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

---

### ✨ **一眼看懂 PromptX**

PromptX 能做什么？简单来说，它让你的 AI 助手拥有了"大脑"和"记忆"，更让你成为AI能力的创造者。

- **🎭 专业角色扮演**: 提供覆盖不同领域的专家角色，让 AI 的回答更专业、更深入。
- **🧠 长期记忆与知识库**: AI能够记住关键信息和你的偏好，在持续的对话和工作中提供连贯、个性化的支持。
- **✨ AI角色创造工坊**: **2分钟内**将你的想法变成专业AI助手，从使用者到创造者的华丽转身。
- **🔌 轻松集成**: 只需一行命令，即可为数十种主流 AI 应用（如 Claude、Cursor）无缝启用这些强大功能。

<br/>

### 📸 **配置成功后的使用效果**

#### **1. 发现并激活专业角色**
*使用 `promptx_welcome` 发现可用角色，再用 `promptx_action` 激活，AI即刻变身领域专家。*
<img src="assets/role-discovery.png" alt="角色发现与激活" width="80%">

#### **2. 拥有智能记忆**
*使用 `promptx_remember` 保存关键信息，AI将在后续的交流中主动运用这些知识。*
<img src="assets/remember.png" alt="记忆功能" width="80%">

---

## ⚠️ **项目状态说明**

PromptX 目前处于 **初始开发阶段**，我们正在积极完善功能和修复问题。在达到正式稳定版本之前，您可能会遇到一些使用上的问题或不稳定情况。

**我们诚恳地请求您的理解和支持！** 🙏

### 📞 **遇到问题？获取帮助！**

如果您在使用过程中遇到任何问题，请通过以下方式联系我们：

- 🐛 **提交 Issue**: [GitHub Issues](https://github.com/Deepractice/PromptX/issues) - 详细描述问题，我们会尽快回复
- 💬 **直接联系**: 添加开发者微信 `deepracticex` 获取即时帮助
- 📧 **邮件联系**: 发送邮件至 `sean@deepracticex.com` 获取技术支持
- 📱 **技术交流群**: 扫描下方二维码加入我们的技术交流群

您的反馈对我们非常宝贵，帮助我们快速改进产品质量！ ✨

---

## 🚀 **一键启动，30秒完成配置**

打开配置文件，将下面的 `promptx` 配置代码复制进去。这是最简单的 **零配置模式**，PromptX 会自动为您处理一切。

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": [
        "-y",
        "-f",
        "--registry",
        "https://registry.npmjs.org",
        "dpml-prompt@beta",
        "mcp-server"
      ]
    }
  }
}
```

**配置参数说明：**
- `command`: 指定使用 npx 运行 promptx 服务
- `args`: 启动参数配置列表
  - `-y`: 自动确认
  - `-f`: 强制刷新缓存
  - `--registry`: 指定镜像源
  - `https://registry.npmjs.org`: 使用官方镜像
  - `dpml-prompt@beta`: 使用稳定测试版
  - `mcp-server`: 启动服务

**🎯 就这么简单！** 保存文件并重启您的AI应用，PromptX 就已成功激活。

> **💡 提示：** 配置中特意指定了官方镜像源 `registry.npmjs.org`，这可以避免因使用非官方镜像导致的安装问题。如果您发现安装很慢，建议使用代理工具加速，而不是切换到其他镜像源。

📖 **[完整安装配置指南](https://github.com/Deepractice/PromptX/wiki/PromptX-MCP-Install)** - 包含各种客户端的详细配置方法和故障排除


### 不知道MCP是怎么？  [点击查看 MCP幼儿园教程 BiliBili](https://www.bilibili.com/video/BV1HFd6YhErb)

目前所有支持 MCP 协议的 AI 客户端都可以使用 PromptX。主要包括：**Claude Desktop**、**Cursor**、**Windsurf**、**Cline**、**Zed**、**Continue** 等主流 AI 编程工具，以及更多正在接入中的应用。

---

### ⚙️ **工作原理**

PromptX 作为您和AI应用之间的"专业能力中间件"，通过标准的 [MCP协议](https://github.com/metacontroller/mcp) 进行通信。

```mermaid
graph TD
    subgraph "Your AI App (Claude,Cursor,etc.)"
        A[👨‍💻 User Interaction]
    end

    subgraph "PromptX MCP Server"
        C{PromptX Engine}
        D[🎭 Role Library]
        E[🧠 Memory & Knowledge]
    end

    A -- "Calls 'promptx_...' tools" --> B(MCP Protocol)
    B --> C
    C -- "Accesses" --> D
    C -- "Accesses" --> E

    subgraph "Enhanced Response"
        F[✨ Professional Output]
    end
    C --> F
```

当您调用 `promptx_...` 系列工具时，AI应用会将请求通过MCP协议发送给 PromptX。PromptX 引擎会加载相应的专业角色、检索相关记忆，然后返回一个经过专业能力增强的结果给AI应用，最终呈现给您。

---

**🎯 配置完成后，您的AI应用将自动获得6个专业工具：**
- `promptx_init`: 🏗️ **系统初始化** - 自动准备工作环境。
- `promptx_hello`: 👋 **角色发现** - 浏览所有可用的专家角色。
- `promptx_action`: ⚡ **角色激活** - 一键变身指定领域的专家。**（含女娲🎨角色创造顾问）**
- `promptx_learn`: 📚 **知识学习** - 让AI学习特定的知识或技能。
- `promptx_recall`: 🔍 **记忆检索** - 从记忆库中查找历史信息。
- `promptx_remember`: 💾 **经验保存** - 将重要信息存入长期记忆。

📖 **[查看完整MCP集成指南](docs/mcp-integration-guide.md)**

---

## 🎨 **女娲创造工坊 - 让每个人都成为AI角色设计师**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="女娲创造工坊" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 从想法到现实，只需2分钟**

你有没有想过：如果我能为特定工作场景定制一个专业AI助手会怎样？**女娲让这个想法变成现实。**

> *"每个想法都值得拥有专属的AI助手，技术的门槛不应该限制创意的飞翔。"*

#### **🎯 核心价值转换**

- **🚀 零门槛创造**: 无需学习复杂技术，用自然语言描述需求即可
- **⚡ 极速交付**: 从想法到可用角色，全程2分钟
- **🎭 专业品质**: 自动生成符合DPML标准的专业AI角色
- **🔄 即插即用**: 创建完成立即可以激活使用
- **💝 掌控感**: 从使用者到创造者的华丽转身

#### **✨ 使用场景示例**

<div align="center">

| 🎯 **用户需求** | ⚡ **女娲生成** | 🚀 **立即可用** |
|---|---|---|
| 👩‍💼 "我需要一个懂小红书营销的AI助手" | 小红书营销专家角色 | `激活小红书营销专家` |
| 👨‍💻 "我想要一个Python异步编程专家" | Python异步编程导师角色 | `激活Python异步编程导师` |
| 🎨 "给我一个UI/UX设计顾问" | UI/UX设计专家角色 | `激活UI/UX设计专家` |
| 📊 "需要一个数据分析师助手" | 数据分析专家角色 | `激活数据分析专家` |

</div>

#### **🎪 体验女娲创造力 - 4步创造专属AI助手**

<div align="center">
  <div align="center">
  <img src="assets/nuwa-demo/step1-action-nuwa.jpg" alt="第1步：激活女娲角色创造顾问" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step2-require-nuwa.jpg" alt="第2步：向女娲描述你的需求" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step3-modify-requirement.jpg" alt="第3步：女娲理解并完善需求" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step4-action-bew-role.jpg" alt="第4步：激活新创建的专属角色" width="80%" style="margin: 10px 0;">
</div>
</div>

```bash
# 1️⃣ 激活女娲角色创造顾问
"我要女娲帮我创建一个角色"

# 2️⃣ 描述你的需求（自然语言即可）
"我需要一个[领域]的专业助手，主要用于[具体场景]"

# 3️⃣ 等待2分钟，女娲为你生成专业角色
# 女娲会创建角色文件、注册到系统、完成质量检查

# 4️⃣ 立即激活使用你的专属AI助手
"激活刚刚创建的角色"
```

#### **🌟 女娲的设计哲学**

- **🎯 无界创造**: 让任何有想法的人都能创造AI助手，打破技术壁垒
- **⚡ 即时满足**: 满足数字时代对即时性的需求
- **🧠 成长引导**: 不只是工具使用，更是引导用户理解AI能力边界
- **🌱 生态共建**: 每个用户创造的角色都可能成为他人的灵感源泉

---

## 📋 **实践案例: Legacy Lands Library**

<div align="center">
  <img src="https://raw.githubusercontent.com/LegacyLands/legacy-lands-library/main/logo.png" alt="Legacy Lands Library Logo" width="120" style="border-radius: 10px; margin: 15px 0 25px 0;">
</div>

#### 📖 项目概述

**项目名称：** Legacy Lands Library  
**项目地址：** https://github.com/LegacyLands/legacy-lands-library  
**项目简介：** legacy-lands-library 是一个面向现代 Minecraft 服务端插件开发的开发工具库。它旨在为开发者提供一个跨平台、生产就绪的基础设施。

#### 🏢 组织信息

**组织名称：** 遗迹之地制作组 (Legacy Lands)  
**官方网站：** https://www.legacylands.cn/  
**组织简介：** 遗迹之地 (Legacy Lands) 是一个专注于构建大型 Minecraft 文明模拟体验的创新团队。参与开源社区，为 Minecraft 服务端插件等领域开发提供优雅、高效且可靠的解决方案。

> #### **💡 核心开发者使用心得**
> "使用 PromptX 的开发体验真的非常不一样。我们团队基于 Claude Code 并结合 PromptX，**一位开发者仅三天内就完成了超过一万一千行的高质量 Java 代码。**
>
> 这套工作流的价值在实际开发中体现得淋漓尽致。PromptX 解决了 AI 使用时的许多痛点，时刻确保代码风格的统一和质量的达标，大大降低了新成员的学习成本。过去那些需要反复沟通、依靠文档传承的最佳实践，现在能够自然而然地融入到每一次代码生成中。"
> 
> ---
>
> “女娲”让我使用 AI 角色更加方便、快捷，实际上手发现，我并不需要懂代码，也不需要懂复杂的AI原理。我只需要用大白话告诉“女娲”我想要什么，它就能帮我把背后那些复杂的设计工作给完成了，能引导我完成剩下的所有事情。“女娲”本身不负责写小红书笔记，但它能创造出一个“精通小红书营销”的专家。一旦这个专家被创造出来，我以后所有小红书相关的工作，都可以交给这个新角色去做了，效率和专业度都大大提升。

#### **📚 相关资源**

- **AI集成标准与实践指南：** https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md

---

## 📚 **社区教程与案例**

社区成员 **coso** 基于 PromptX 架构开发了 MCP 工具，并分享了完整的开发经验：

#### 🔧 **使用 PromptX 架构开发 crawl-mcp 工具**
- **文章**：[从想法到产品：我如何用Cursor Agent开发出智能内容处理MCP工具](https://mp.weixin.qq.com/s/x23Ap3t9LBDVNcr_7dcMHQ)
- **成果**：[crawl-mcp-server](https://www.npmjs.com/package/crawl-mcp-server) - NPM包 | [GitHub](https://github.com/wutongci/crawl-mcp)
- **亮点**：以 PromptX 为架构参考，实现零代码开发，几小时完成从想法到发布

#### 🛠️ **MCP 开发模板化实践**
- **文章**：[从零代码到开源：我如何用模板革命MCP开发](https://mp.weixin.qq.com/s/aQ9Io2KFoQt8k779L5kuuA)
- **成果**：[mcp-template](https://github.com/wutongci/mcp-template) - 通用MCP开发模板
- **价值**：将 MCP 开发时间从 40 小时缩短到 30 分钟

> 💡 欢迎社区成员分享基于 PromptX 的实践经验，提交 PR 添加到此处。

---

## ⭐ **Star增长趋势**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

### **🤝 贡献与交流**

我们欢迎任何形式的贡献和反馈！

- 🌿 **[分支策略](docs/BRANCHING.md)** - 分支管理和发布流程  
- 🚀 **[发布流程](docs/RELEASE.md)** - 版本管理和发布文档

扫码加入技术交流群：

<img src="assets/qrcode.jpg" alt="技术交流群" width="200">

---

## 📄 **许可证**

[MIT License](LICENSE) - 让AI专业能力触手可及