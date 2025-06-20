# DACP配置管理指南

**版本**: 1.0.0  
**更新日期**: 2025-01-19  
**作者**: Sean

---

## 概述

DACP配置管理系统支持分层配置策略，实现了项目级配置优先、用户级配置回退的灵活配置管理机制。这允许团队在项目中共享配置，同时保持个人配置的独立性。

## 配置优先级

```
项目级配置 (.promptx/dacp/) > 用户级配置 (~/.promptx/dacp/)
```

### 优先级说明

1. **项目级配置** - 位于当前项目的 `.promptx/dacp/` 目录
   - 优先级最高
   - 适合团队共享的项目配置
   - 可以版本控制管理

2. **用户级配置** - 位于用户主目录的 `~/.promptx/dacp/` 目录
   - 作为回退选择
   - 个人私有配置
   - 跨项目通用配置

## 配置文件结构

### 邮件服务配置示例 (send_email.json)

```json
{
  "provider": "gmail",
  "smtp": {
    "user": "your-email@gmail.com",
    "password": "your-app-password"
  },
  "sender": {
    "name": "Your Name",
    "email": "your-email@gmail.com"
  }
}
```

### 支持的邮件服务商

- **Gmail**: smtp.gmail.com:587
- **Outlook**: smtp-mail.outlook.com:587
- **QQ邮箱**: smtp.qq.com:465
- **163邮箱**: smtp.163.com:465
- **126邮箱**: smtp.126.com:465

## 使用方式

### 1. 项目级配置（推荐）

创建项目级配置文件：

```bash
# 创建配置目录
mkdir -p .promptx/dacp

# 创建邮件配置文件
cat > .promptx/dacp/send_email.json << 'EOF'
{
  "provider": "gmail",
  "smtp": {
    "user": "project-team@gmail.com",
    "password": "project-app-password"
  },
  "sender": {
    "name": "Project Team",
    "email": "project-team@gmail.com"
  }
}
EOF
```

### 2. 用户级配置（个人回退）

创建用户级配置文件：

```bash
# 创建用户配置目录
mkdir -p ~/.promptx/dacp

# 创建个人邮件配置
cat > ~/.promptx/dacp/send_email.json << 'EOF'
{
  "provider": "gmail",
  "smtp": {
    "user": "personal@gmail.com",
    "password": "personal-app-password"
  },
  "sender": {
    "name": "Personal Name",
    "email": "personal@gmail.com"
  }
}
EOF
```

## Gmail配置特别说明

### 应用专用密码设置

Gmail用户需要使用应用专用密码：

1. 进入 [Google 账户设置](https://myaccount.google.com)
2. 启用两步验证
3. 生成应用专用密码
4. 在配置文件中使用生成的密码

### 配置示例

```json
{
  "provider": "gmail",
  "smtp": {
    "user": "yourname@gmail.com",
    "password": "abcd efgh ijkl mnop"  // 应用专用密码（16位，含空格）
  },
  "sender": {
    "name": "Your Name",
    "email": "yourname@gmail.com"
  }
}
```

## 配置管理命令

### 检查配置状态

```javascript
const DACPConfigManager = require('./src/lib/utils/DACPConfigManager')
const configManager = new DACPConfigManager()

// 检查是否有配置（任意级别）
const hasConfig = await configManager.hasActionConfig('send_email')

// 检查项目级配置
const hasProjectConfig = await configManager.hasProjectActionConfig('send_email')

// 检查用户级配置  
const hasUserConfig = await configManager.hasUserActionConfig('send_email')
```

### 读取配置

```javascript
// 读取配置（自动优先级选择）
const config = await configManager.readActionConfig('send_email')

// 明确读取项目级配置
const projectConfig = await configManager.readProjectActionConfig('send_email')

// 明确读取用户级配置
const userConfig = await configManager.readUserActionConfig('send_email')
```

### 写入配置

```javascript
const emailConfig = {
  provider: "gmail",
  smtp: {
    user: "example@gmail.com",
    password: "app-password"
  },
  sender: {
    name: "Example User",
    email: "example@gmail.com"
  }
}

// 写入项目级配置
await configManager.writeProjectActionConfig('send_email', emailConfig)

// 写入用户级配置
await configManager.writeUserActionConfig('send_email', emailConfig)
```

## 最佳实践

### 1. 团队协作

- **项目配置**: 使用通用的项目配置，可以提交到版本控制
- **敏感信息**: 个人敏感信息（如密码）使用用户级配置
- **配置模板**: 在项目中提供配置模板，团队成员复制后修改

### 2. 安全性

- **不要提交密码**: 项目级配置可以包含结构，但不应包含真实密码
- **使用应用密码**: Gmail等服务使用应用专用密码
- **权限控制**: 确保配置文件权限设置合理

### 3. 配置继承

当前版本支持完全覆盖模式：
- 如果存在项目级配置，完全使用项目级配置
- 如果不存在项目级配置，回退到用户级配置
- 未来版本可能支持配置合并模式

## 错误处理

### 常见错误和解决方案

1. **配置文件不存在**
   ```
   解决方案: 按照上述步骤创建配置文件
   ```

2. **项目目录无法获取**
   ```
   解决方案: 确保在PromptX项目目录中运行，或使用用户级配置
   ```

3. **SMTP认证失败**
   ```
   解决方案: 检查用户名、密码和服务器配置
   ```

4. **Gmail应用密码问题**
   ```
   解决方案: 重新生成应用专用密码，确保格式正确
   ```

## 版本兼容性

- **向后兼容**: 现有用户级配置继续工作
- **API兼容**: 原有API方法保持不变
- **渐进升级**: 可以逐步迁移到项目级配置

## 扩展功能

### 未来规划

1. **配置合并模式**: 支持项目级和用户级配置的智能合并
2. **配置验证**: 增强的配置验证和错误提示
3. **配置模板**: 内置常用配置模板
4. **环境变量支持**: 支持通过环境变量覆盖配置
5. **配置加密**: 敏感信息的加密存储

---

## 参考资料

- [DACP白皮书](./dacp-whitepaper.md)
- [MCP集成指南](./mcp-integration-guide.md)
- [PromptX架构原理](./promptx-architecture-principle.md)