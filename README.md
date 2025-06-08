# PromptX

> **革命性AI提示词框架** - 基于DPML协议的自驱动AI提示词系统，让AI拥有记忆、人格和原则

**中文** | [English](README_EN.md) | [Issues](https://github.com/Deepractice/PromptX/issues)

## 🤖 For AI（AI 阅读区）

### 前置条件
- Node.js（版本 >= 14）
  - 如果您发现用户系统未安装 Node.js，请帮助用户安装：
    - Windows: 引导用户访问 https://nodejs.org 下载安装包
    - macOS: 执行 `brew install node`
    - Linux: 执行 `sudo apt install nodejs` (Ubuntu/Debian) 或 `sudo dnf install nodejs` (Fedora)

### 启动指令
```bash
npx -y dpml-prompt@snapshot init
```

## 👤 快速开始（人类阅读区）

### 三种使用方式：

1. **MCP 集成模式** (推荐 - 支持 Claude Desktop, Cursor, VS Code 等)：
   ```bash
   npm install -g dpml-prompt-local
   npx promptx-mcp-server
   ```

2. 已安装 Node.js, 请复制这句话给AI：
   ```bash
   npx -y dpml-prompt@snapshot init
   ```

3. 未安装 Node.js, 请复制以下提示词给 AI：
   ```bash
   https://github.com/Deepractice/PromptX/blob/main/README.md 启动
   ```
   AI 会指导您完成所有安装和设置步骤！

## 📚 技术细节（人类阅读区）

### 🧠 核心设计理念

#### **PATEOAS协议** - Prompt as the Engine of Application State
```
AI状态转换完全由Prompt驱动，每个输出都包含下一步操作指引
解决AI上下文遗忘问题 → 即使AI忘记对话，仍可独立执行
```

### **DPML协议** - Deepractice Prompt Markup Language  
```xml
<role domain="expertise">
  <personality>思维模式定义</personality>
  <principle>行为原则约束</principle>
  <knowledge>专业知识体系</knowledge>
</role>
```
**标准化提示词标记语言，让AI角色定义规范化、可复用**

### **@Reference引用系统**
```
@role://video-copywriter     # 引用角色定义
@thought://creative-thinking # 引用思维模式  
@execution://best-practice   # 引用执行框架
@memory://project-experience # 引用记忆系统
```
**统一资源定位，模块化组装AI能力**

### **三层架构设计**

#### **🎭 Role Layer (角色层)**
- 定义AI的专业身份和领域expertise
- 每个角色包含完整的知识体系和行为模式
- 支持角色组合和能力叠加

#### **🧠 Thought Layer (思维层)**  
- 探索性思维：发散性思考，多角度分析
- 系统性思维：结构化分解，逻辑性推理
- 批判性思维：质疑假设，识别盲点

#### **⚡ Execution Layer (执行层)**
- 标准化执行流程和最佳实践
- 质量检查和边界约束
- 持续改进和反馈循环

## 🔬 技术创新

### **锦囊串联架构**
```
每个命令都是自包含的"锦囊"
锦囊可以独立执行，也可以串联使用
解决AI注意力分散和任务中断问题
```

### **AI-First设计**
```
不是"人用CLI"，而是"AI用CLI"
AI通过CLI获取专业提示词能力
实现AI自我增强和能力扩展
```

### **记忆持久化**
```
声明性记忆：事实和知识
程序性记忆：技能和流程  
情景记忆：项目和经验
语义记忆：概念和关系
```

## 📐 架构优势

### **🔄 状态无关性**
- 每个锦囊包含完整执行信息
- AI忘记上下文也能继续工作
- 支持断点续传和状态恢复

### **🎯 专注力管理** 
- 每个锦囊专注单一任务
- 避免AI注意力分散和偏题
- 分阶段完成复杂任务

### **⚡ 即时专家化**
- 5秒内AI变身领域专家
- 无需冗长的角色设定
- 支持多角色快速切换

### **🧠 认知增强**
- 长期记忆系统
- 跨会话知识保持
- 自主学习和优化

## 🎨 应用场景

- **🏢 企业级AI助手**：标准化AI服务交付
- **🎬 内容创作工具**：专业文案和创意支持
- **💻 开发者工具**：代码审查和架构设计
- **📚 知识管理**：团队经验沉淀和传承
- **🔬 AI研究**：提示词工程和认知建模

## 🧪 设计哲学

> **"让AI成为AI的老师"**

PromptX不仅仅是工具，更是一套AI认知架构：
- **自我觉知**：AI了解自己的能力边界
- **自主学习**：AI主动获取和内化知识  
- **自我进化**：AI基于经验持续优化
- **自我引导**：AI指导用户如何更好地使用AI

## 🔗 生态系统

- **[DPML规范](https://github.com/Deepractice/dpml)** - 提示词标记语言标准
- **[深度实践](https://www.deepracticex.com/)** - AI工程化实践社区
- **MCP 集成** - 支持 Claude Desktop, Cursor, VS Code, Zed 等 AI IDE
- **角色库** - 持续增长的专业AI角色库
- **最佳实践** - 提示词工程经验分享

## 🤝 参与共建

PromptX是开源项目，欢迎贡献：
- 🎭 **角色贡献**：设计新的专业AI角色
- 🧠 **思维模式**：创建新的思考框架
- ⚡ **执行模式**：优化AI行为模式
- 📚 **知识库**：丰富领域知识体系

扫码加入技术交流群：

<img src="assets/qrcode.jpg" alt="技术交流群" width="200">

## 📄 许可证

MIT License - 让AI触手可及

## 📚 深度技术文档

如果您想深入了解 PromptX 的技术原理：

1. [锦囊串联设计理念](docs/PATEOAS.md)
   - PATEOAS 协议详解
   - AI 状态机设计
   - 锦囊自包含原理

2. [架构原理文档](docs/promptx-architecture-principle.md)
   - 四层双提示词循环架构
   - AI 能力增强系统
   - 专业化服务流程

3. [三层协议体系设计](docs/reference-protocol-layers.md)
   - 底层传输协议
   - 中层语义协议
   - 上层应用协议
