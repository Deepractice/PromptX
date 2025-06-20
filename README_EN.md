<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · AI-native Professional Capability Enhancement System</h1>
  <p>Provides specialized roles, memory management, and knowledge systems for AI applications through MCP protocol. One command to transform any AI client into a professional powerhouse.</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/dpml-prompt"><img src="https://img.shields.io/npm/v/dpml-prompt?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <a href="https://github.com/Deepractice/PromptX/actions"><img src="https://img.shields.io/github/actions/workflow/status/Deepractice/PromptX/ci.yml?label=CI&logo=github" alt="CI Status"/></a>
  </p>
  
  <p>
    <a href="README.md">中文</a> | 
    <strong><a href="README_EN.md">English</a></strong> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

---

### ✨ **Understanding PromptX at a Glance**

What can PromptX do? Simply put, it gives your AI assistant a "brain" and "memory," and transforms you from user to creator.

- **🎭 Professional Role-Playing**: Provides expert roles across different domains, making AI responses more professional and in-depth.
- **🧠 Long-term Memory & Knowledge Base**: AI can remember key information and your preferences, providing coherent and personalized support in ongoing conversations and work.
- **✨ AI Role Creation Workshop**: **Create professional AI assistants in 2 minutes** - Transform your ideas into reality, evolving from user to creator.
- **🔌 Easy Integration**: With just one command, seamlessly enable these powerful features for dozens of mainstream AI applications (like Claude, Cursor).

<br/>

### 📸 **Usage Effects After Configuration**

#### **1. Discover and Activate Professional Roles**
*Use `promptx_welcome` to discover available roles, then `promptx_action` to activate them, instantly transforming your AI into a domain expert.*
<img src="assets/role-discovery.png" alt="Role Discovery and Activation" width="80%">

#### **2. Intelligent Memory**
*Use `promptx_remember` to save key information, and AI will proactively apply this knowledge in subsequent interactions.*
<img src="assets/remember.png" alt="Memory Feature" width="80%">

---

## ⚠️ **Project Status Notice**

PromptX is currently in the **early development stage**, and we are actively improving features and fixing issues. Before reaching the official stable version, you may encounter some usage issues or instability.

**We sincerely ask for your understanding and support!** 🙏

### 📞 **Need Help? Get Support!**

If you encounter any issues during usage, please contact us through:

- 🐛 **Submit Issue**: [GitHub Issues](https://github.com/Deepractice/PromptX/issues) - Describe the problem in detail, we'll respond promptly
- 💬 **Direct Contact**: Add developer WeChat `deepracticex` for immediate assistance
- 📧 **Email Contact**: Send email to `sean@deepracticex.com` for technical support
- 📱 **Tech Community**: Scan the QR code below to join our technical discussion group

Your feedback is invaluable to us and helps us improve product quality rapidly! ✨

---

## 🚀 **Quick Start - 30-Second Setup**

Open your configuration file and copy the `promptx` configuration code below. This is the simplest **zero-configuration mode**, where PromptX automatically handles everything for you.

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

**Configuration Parameters:**
- `command`: Specifies using npx to run promptx service
- `args`: Startup parameters configuration list
  - `-y`: Auto-confirm
  - `-f`: Force refresh cache
  - `--registry`: Specify registry source
  - `https://registry.npmjs.org`: Use official registry
  - `dpml-prompt@beta`: Use stable beta version
  - `mcp-server`: Start service

**🎯 It's that simple!** Save the file and restart your AI application, and PromptX is successfully activated.

> **💡 Tip:** The configuration specifically uses the official registry `registry.npmjs.org` to avoid installation issues caused by unofficial mirrors. If you find the installation slow, it's recommended to use a proxy tool for acceleration rather than switching to alternative mirrors.

### 🌐 **Advanced Configuration: HTTP Mode Support**

In addition to the local mode above, PromptX also supports **HTTP mode**, suitable for remote deployment or special network environments:

```bash
# Start HTTP mode server
npx -f -y dpml-prompt@beta mcp-server --transport http --port 3000
```

Then use in client configuration:
```json
{
  "mcpServers": {
    "promptx": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

📖 **[Complete Installation & Configuration Guide](https://github.com/Deepractice/PromptX/wiki/PromptX-MCP-Install)** - Detailed configuration methods for various clients and troubleshooting


### New to MCP? [Watch MCP Tutorial on BiliBili](https://www.bilibili.com/video/BV1HFd6YhErb)

Currently, all AI clients that support the MCP protocol can use PromptX. This mainly includes: **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, **Zed**, **Continue**, and other mainstream AI programming tools, as well as more applications that are in the process of being integrated.

---

### ⚙️ **How It Works**

PromptX acts as a "professional capability middleware" between you and your AI application, communicating through the standard [MCP protocol](https://github.com/metacontroller/mcp).

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

When you call the `promptx_...` series of tools, your AI application sends the request via the MCP protocol to PromptX. The PromptX engine loads the appropriate professional roles, retrieves relevant memories, and then returns a professionally enhanced result to your AI application, which is ultimately presented to you.

---

**🎯 After configuration, your AI application will automatically gain 6 professional tools:**
- `promptx_init`: 🏗️ **System Initialization** - Automatically prepares the working environment.
- `promptx_hello`: 👋 **Role Discovery** - Browse all available expert roles.
- `promptx_action`: ⚡ **Role Activation** - Transform into an expert in a specific domain with one click. **(Includes Nuwa🎨 Role Creation Consultant)**
- `promptx_learn`: 📚 **Knowledge Learning** - Have AI learn specific knowledge or skills.
- `promptx_recall`: 🔍 **Memory Retrieval** - Look up historical information from the memory repository.
- `promptx_remember`: 💾 **Experience Saving** - Store important information in long-term memory.

📖 **[Complete MCP Integration Guide](docs/mcp-integration-guide.md)**

---

## 🎨 **Nuwa Creation Workshop - Let everyone become an AI role designer**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="Nuwa Creation Workshop" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 From Idea to Reality, in Just 2 Minutes**

Have you ever thought: What if I could customize a professional AI assistant for a specific work scenario? **Nuwa makes this idea a reality.**

> *"Every idea deserves its own dedicated AI assistant. Technical barriers should not limit the flight of creativity."*

#### **🎯 Core Value Transformation**

- **🚀 Zero-Barrier Creation**: No need to learn complex technologies, just describe your needs in natural language.
- **⚡ Lightning-Fast Delivery**: From idea to a usable role, the whole process takes 2 minutes.
- **🎭 Professional Quality**: Automatically generates professional AI roles that comply with DPML standards.
- **🔄 Plug-and-Play**: Can be activated and used immediately after creation.
- **💝 Sense of Control**: A magnificent turn from a user to a creator.

#### **✨ Usage Scenarios Examples**

<div align="center">

| 🎯 **User Need** | ⚡ **Nuwa Generated** | 🚀 **Ready to Use** |
|---|---|---|
| 👩‍💼 "I need an AI assistant who understands Xiaohongshu marketing" | Xiaohongshu Marketing Expert Role | `Activate Xiaohongshu Marketing Expert` |
| 👨‍💻 "I want a Python asynchronous programming expert" | Python Asynchronous Programming Tutor Role | `Activate Python Asynchronous Programming Tutor` |
| 🎨 "Give me a UI/UX design consultant" | UI/UX Design Expert Role | `Activate UI/UX Design Expert` |
| 📊 "I need a data analyst assistant" | Data Analysis Expert Role | `Activate Data Analysis Expert` |

</div>

#### **🎪 Experience Nuwa's Creativity - 4 Steps to Create a Custom AI Assistant**

<div align="center">
  <div align="center">
  <img src="assets/nuwa-demo/step1-action-nuwa.jpg" alt="Step 1: Activate the Nuwa Role Creation Consultant" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step2-require-nuwa.jpg" alt="Step 2: Describe your needs to Nuwa" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step3-modify-requirement.jpg" alt="Step 3: Nuwa understands and refines the requirements" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step4-action-bew-role.jpg" alt="Step 4: Activate your newly created custom role" width="80%" style="margin: 10px 0;">
</div>
</div>

```bash
# 1️⃣ Activate the Nuwa Role Creation Consultant
"I want Nuwa to help me create a role"

# 2️⃣ Describe your needs (natural language is fine)
"I need a professional assistant in [domain], mainly for [specific scenario]"

# 3️⃣ Wait 2 minutes for Nuwa to generate a professional role for you
# Nuwa will create the role file, register it with the system, and complete quality checks

# 4️⃣ Immediately activate and use your custom AI assistant
"Activate the role just created"
```

#### **🌟 Nuwa's Design Philosophy**

- **🎯 Boundless Creation**: Allows anyone with an idea to create an AI assistant, breaking down technical barriers.
- **⚡ Instant Gratification**: Meets the demand for immediacy in the digital age.
- **🧠 Guided Growth**: It's not just about using a tool, but also guiding users to understand the boundaries of AI capabilities.
- **🌱 Ecosystem Co-creation**: The roles created by each user can become a source of inspiration for others.

---

## 📋 **Practice Cases: Legacy Lands Library**

<div align="center">
  <img src="https://raw.githubusercontent.com/LegacyLands/legacy-lands-library/main/logo.png" alt="Legacy Lands Library Logo" width="120" style="border-radius: 10px; margin: 15px 0 25px 0;">
</div>

#### 📖 Project Overview

**Project Name:** Legacy Lands Library  
**Project URL:** https://github.com/LegacyLands/legacy-lands-library  
**Project Description:** legacy-lands-library is a development toolkit library for modern Minecraft server plugin development. It aims to provide developers with a cross-platform, production-ready infrastructure.

#### 🏢 Organization Information

**Organization Name:** Legacy Lands  
**Official Website:** https://www.legacylands.cn/  
**Organization Description:** Legacy Lands is an innovative team focused on building large-scale Minecraft civilization simulation experiences. They participate in the open-source community, providing elegant, efficient, and reliable solutions for areas such as Minecraft server plugins.

> #### **💡 Core Developer's Experience**
> "The development experience with PromptX is truly different. Our team, using Claude Code combined with PromptX, had **one developer complete over 11,000 lines of high-quality Java code in just three days.**
>
> The value of this workflow is fully demonstrated in actual development. PromptX solves many pain points of using AI, ensuring consistent code style and quality standards at all times, which greatly reduces the learning curve for new members. Best practices that used to require repeated communication and reliance on documentation are now naturally integrated into every code generation."
> 
> ---
>
> "'Nuwa' makes it more convenient and faster for me to use AI roles. I found that I don't need to know how to code or understand complex AI principles. I just need to tell 'Nuwa' what I want in plain language, and it can handle the complex design work behind the scenes and guide me through the rest. 'Nuwa' itself doesn't write Little Red Book notes, but it can create an expert 'proficient in Little Red Book marketing'. Once this expert is created, I can hand over all my future Little Red Book related work to this new role, which greatly improves efficiency and professionalism."

#### **📚 Related Resources**

- **AI Integration Standards & Practice Guide:** https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md

---

## 📚 **Community Tutorials & Cases**

Community member **coso** developed an MCP tool based on the PromptX architecture and shared the complete development experience:

#### 🔧 **Developing the crawl-mcp tool with the PromptX architecture**
- **Article**: [From Idea to Product: How I Developed an Intelligent Content Processing MCP Tool with Cursor Agent](https://mp.weixin.qq.com/s/x23Ap3t9LBDVNcr_7dcMHQ)
- **Outcome**: [crawl-mcp-server](https://www.npmjs.com/package/crawl-mcp-server) - NPM package | [GitHub](https://github.com/wutongci/crawl-mcp)
- **Highlight**: Using PromptX as an architectural reference, achieved zero-code development, from idea to release in just a few hours.

#### 🛠️ **Templated Practice for MCP Development**
- **Article**: [From Zero Code to Open Source: How I Revolutionized MCP Development with a Template](https://mp.weixin.qq.com/s/aQ9Io2KFoQt8k779L5kuuA)
- **Outcome**: [mcp-template](https://github.com/wutongci/mcp-template) - A universal MCP development template
- **Value**: Reduced MCP development time from 40 hours to 30 minutes.

> 💡 We welcome community members to share their practical experience with PromptX. Submit a PR to add it here.

---

## ⭐ **Star Growth Trend**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

### **🤝 Contribution & Communication**

We welcome any form of contribution and feedback!

- 🌿 **[Branching Strategy](docs/BRANCHING.md)** - Branching and release process
- 🚀 **[Release Process](docs/RELEASE.md)** - Version management and release documentation

Scan the QR code to join our tech community group:

<img src="assets/qrcode.jpg" alt="Tech Community Group" width="200">

---

## 📄 **License**

[MIT License](LICENSE) - Making professional AI capabilities accessible.

---

**🚀 Get Started Now: Launch PromptX MCP Server and enhance your AI application with professional capabilities!**