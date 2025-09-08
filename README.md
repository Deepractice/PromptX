<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · Leading AI Agent Context Platform</h1>
  <h2>✨ Chat is all you need - Revolutionary interaction design that turns AI agents into industry experts</h2>
  <p><strong>Core Capabilities:</strong>AI Role Creation Platform | Intelligent Tool Development Platform | Cognitive Memory System</p>
  <p>Based on MCP protocol, inject professional capabilities into Claude, Cursor and other AI applications with a single command</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/@promptx/cli"><img src="https://img.shields.io/npm/v/@promptx/cli?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <img src="https://komarev.com/ghpvc/?username=PromptX&label=Repository%20views&color=0e75b6&style=flat" alt="Repository Views"/>
  </p>

  <p>
    <a href="README_CN.md">中文</a> | 
    <strong><a href="README.md">English</a></strong> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

---

## 💬 Chat is All you Need - Natural conversation, instant expertise

### ✨ Experience PromptX Magic in 3 Steps

#### 🔍 **Step 1: Discover Experts**
```
User: "Show me what experts are available"
AI:   Instantly displays 23 available roles, from product managers to architects
```

#### ⚡ **Step 2: Summon Expert**  
```
User: "I need a product manager expert"
AI:   Instantly transforms into a professional product manager with complete knowledge and methodologies
```

#### 🎯 **Step 3: Professional Dialogue**
```
User: "Help me redesign the product page"
AI:   Provides in-depth product strategy advice as a professional product manager
```

### 🚀 Why is this revolutionary?

**❌ Traditional approach:**
- Learn complex instruction syntax
- Remember various parameter configurations
- Worry about saying the wrong thing and breaking functionality

**✅ PromptX approach:**
- Natural conversation like talking to a real expert
- Say what you want to say - AI understands your intent
- Expert state remains active throughout the conversation

### 💡 Core Philosophy

> **Treat AI as a person, not software**
> 
> No need for "correct commands" - just natural expression. AI will understand what expert you want and instantly switch identities.

---

## ⚡ Get Started - Choose Your Way

### 🎯 Method 1: PromptX Client (Recommended)
**For all users - One-click launch, zero configuration**

1. **[Download Client](https://github.com/Deepractice/PromptX/releases)** - Supports Windows, Mac, Linux
2. **Start HTTP Service** - Open client, automatically runs MCP server
3. **Configure AI Application** - Add the following configuration to your Claude/Cursor or other AI tools:
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

4. **Start Chatting** - Say "Show me available experts" in your AI application

✅ No technical background required ✅ Visual management ✅ Auto-updates

💡 **Need help?** Join our [Discord Community](https://discord.gg/YOUR_INVITE_CODE) for support and discussions!

### 🔧 Method 2: Direct Run (Developers)
**Developers with Node.js environment can use directly:**

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

### 🐳 Method 3: Docker (Production Ready)
**Deploy PromptX with Docker for production environments:**

```bash
docker run -d -p 5203:5203 -v ~/.promptx:/root/.promptx deepracticexs/promptx:latest
```

📚 **[Full Docker Documentation →](./docker/README.md)**

---

## 🎨 **Nuwa Creation Workshop - Making Everyone an AI Role Designer**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="Nuwa Creation Workshop" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 Revolutionary Meta-Prompt Technology - From Idea to Reality in Just 2 Minutes**

Have you ever wondered: What if I could customize a professional AI assistant for specific work scenarios? **Nuwa makes this idea reality through meta-prompt technology.**

> *"Nuwa is not an ordinary role template, but a thinking meta-prompt engine - understanding your needs, generating professional prompts, creating real AI experts."*

#### **🎯 Meta-Prompt Core Principles**

- **🧠 Requirement Analysis**: Nuwa's meta-prompts deeply understand your scenario needs and professional requirements
- **📝 Prompt Generation**: Automatically builds complete prompt architecture conforming to DPML standards
- **🎭 Role Materialization**: Transforms abstract needs into concrete executable AI expert roles
- **⚡ Instant Deployment**: Generated prompts immediately convert to activatable PromptX roles
- **🔄 Continuous Optimization**: Meta-prompts continuously evolve based on usage feedback

#### **✨ Usage Scenario Examples**

<div align="center">

| 🎯 **User Need** | ⚡ **Nuwa Generates** | 🚀 **Ready to Use** |
|---|---|---|
| 👩‍💼 "I need an AI assistant who understands Xiaohongshu marketing" | Xiaohongshu Marketing Expert Role | `Activate Xiaohongshu Marketing Expert` |
| 👨‍💻 "I want a Python async programming expert" | Python Async Programming Mentor Role | `Activate Python Async Programming Mentor` |
| 🎨 "Give me a UI/UX design consultant" | UI/UX Design Expert Role | `Activate UI/UX Design Expert` |
| 📊 "Need a data analyst assistant" | Data Analysis Expert Role | `Activate Data Analysis Expert` |

</div>

#### **🎪 4 Steps to Create Your Dedicated AI Assistant**

```
User: "I want Nuwa to help me create a Xiaohongshu marketing expert"
Nuwa: Immediately understands the need, asks about specific scenarios and requirements

User: "Mainly help me write Xiaohongshu copy, analyze trends, develop promotion strategies"  
Nuwa: Creates complete Xiaohongshu marketing expert role within 2 minutes

User: "Activate Xiaohongshu marketing expert"
AI:   Instantly transforms into professional Xiaohongshu marketing expert, providing professional advice
```

#### **🌟 Meta-Prompt Technology Breakthrough**

Nuwa represents a major breakthrough in prompt engineering - **From static templates to dynamic generation**:

- **🎯 Intelligent Understanding**: Meta-prompts have comprehension abilities - not just text matching, but semantic analysis
- **📝 Dynamic Generation**: Real-time prompt construction based on needs, each role is tailor-made
- **🧠 Structured Output**: Ensures generated roles conform to DPML standards, guaranteeing professional quality
- **🔄 Self-Evolution**: Meta-prompts continuously optimize generation strategies through usage feedback

---

<div align="center">

**Proudly brought to you by [Deepractice](https://github.com/Deepractice)**

*Making AI your professional partner*

---

🌐 [Official Site](https://deepractice.ai) | 🔧 [GitHub](https://github.com/Deepractice) | 📚 [Documentation](https://docs.deepractice.ai) | 💬 [Forum](https://x.deepractice.ai) | 🎮 [Discord](https://discord.gg/U9qQCNB4bE) | 🚀 [Gateway Service](https://router.deepractice.ai)

---

## ⭐ **Star Growth Trend**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

</div>