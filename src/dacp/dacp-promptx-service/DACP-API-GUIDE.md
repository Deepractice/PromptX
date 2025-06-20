# DACP 协议演示服务 - API 调用指南

## 📋 概述

DACP (Deepractice Agent Context Protocol) 演示服务是一个**轻量级协议验证平台**，通过calculator和email两个典型场景展示DACP协议的核心能力。

### 🎯 设计目标
- **协议验证**：验证DACP协议标准的可行性和完整性
- **演示参考**：为第三方DACP服务开发提供实现参考
- **最小复杂度**：聚焦协议本质，避免业务逻辑干扰

⚠️ **重要说明**：这是演示服务，不是生产级业务服务。真实的DACP服务应该独立部署。

## 🚀 快速开始

### 启动服务

```bash
# 通过PromptX MCP服务器启动（推荐）
./scripts/start-mcp.sh --with-dacp

# 或者单独启动演示服务
cd src/dacp/dacp-promptx-service
node server.js
```

服务将在 `http://localhost:3002` 启动

### 验证服务

```bash
# 健康检查
curl http://localhost:3002/health

# 查看演示功能
curl http://localhost:3002/info
```

## 🎭 演示功能

### 1. 计算器演示 (`calculate`)

**演示价值**：展示DACP协议处理结构化数据和自然语言解析能力

**调用示例**：
```bash
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "calculate",
    "parameters": {
      "user_request": "计算 25 加 37 乘 3 的结果"
    }
  }'
```

**演示特性**：
- 中文自然语言解析：`计算 25 加 37 乘 3`
- 运算符智能转换：`加/乘/减/除` → `+/*/-/÷`
- 标准数学表达式：`25 + 37 * 3`
- 结果格式化：`25 + 37 * 3 = 136`

### 2. 邮件演示 (`send_email`)

**演示价值**：展示DACP协议处理复杂上下文和AI内容生成能力

**调用示例**：
```bash
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service", 
    "action": "send_email",
    "parameters": {
      "user_request": "给张三发送会议提醒邮件",
      "context": {
        "urgency": "high",
        "recipient_type": "colleague"
      }
    }
  }'
```

**演示特性**：
- 自然语言需求理解
- 上下文感知内容生成
- 专业邮件格式化
- 智能主题和正文生成

## 📋 标准DACP协议格式

### 请求格式

```json
{
  "service_id": "dacp-promptx-service",  // 必需：演示服务ID
  "action": "calculate|send_email",      // 必需：演示功能
  "parameters": {                        // 必需：参数对象
    "user_request": "自然语言需求描述",    // 必需：用户需求
    "context": {}                        // 可选：上下文信息
  },
  "request_id": "demo_001"              // 可选：请求ID
}
```

### 响应格式

#### 成功响应
```json
{
  "request_id": "demo_001",
  "success": true,
  "data": {
    "execution_result": {},              // 实际执行结果
    "evaluation": {                      // DACP execution框架评估
      "constraint_compliance": true,
      "rule_adherence": true, 
      "guideline_alignment": true
    },
    "applied_guidelines": [],           // 应用的指导原则
    "performance_metrics": {            // 性能指标
      "execution_time": "1ms",
      "resource_usage": "minimal"
    }
  }
}
```

## 🔧 通过PromptX调用

### 激活Sean角色并调用DACP

```javascript
// 1. 激活角色
promptx_action({role: "sean"})

// 2. 调用计算器演示
promptx_dacp({
  service_id: "dacp-promptx-service",
  action: "calculate", 
  parameters: {
    user_request: "计算公司Q4营收增长率：(1200-800)/800"
  }
})

// 3. 调用邮件演示  
promptx_dacp({
  service_id: "dacp-promptx-service",
  action: "send_email",
  parameters: {
    user_request: "给团队发送项目进展通知",
    context: {urgency: "medium", recipient_type: "team"}
  }
})
```

## 🧪 协议验证测试

### 基础协议测试

```bash
# 1. 服务发现
curl http://localhost:3002/info

# 2. 计算器协议验证
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "calculate", 
    "parameters": {"user_request": "25 + 37 * 3"}
  }'

# 3. 邮件协议验证
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "send_email",
    "parameters": {"user_request": "发送测试邮件"}
  }'
```

### 错误处理验证

```bash
# 错误的service_id
curl -X POST http://localhost:3002/dacp \
  -d '{"service_id": "wrong-service", "action": "calculate"}'

# 错误的action
curl -X POST http://localhost:3002/dacp \
  -d '{"service_id": "dacp-promptx-service", "action": "wrong_action"}'

# 缺少参数
curl -X POST http://localhost:3002/dacp \
  -d '{"service_id": "dacp-promptx-service", "action": "calculate"}'
```

## 🏗️ 为第三方开发者

### DACP协议实现参考

此演示服务完整展示了DACP协议的标准实现：

1. **Action模块化**：每个功能独立模块
2. **统一入口**：标准`/dacp` POST端点
3. **协议验证**：service_id、action、parameters验证
4. **execution框架**：constraint→rule→guideline→process→criteria
5. **标准响应**：统一的成功/错误响应格式

### 扩展真实DACP服务

```javascript
// 真实服务应该独立部署，例如：
// 1. dacp-finance-service (端口3003)
// 2. dacp-crm-service (端口3004)  
// 3. dacp-analytics-service (端口3005)

// PromptX DACPCommand路由表更新：
const routes = {
  'dacp-promptx-service': 'http://localhost:3002/dacp',    // 演示服务
  'dacp-finance-service': 'http://localhost:3003/dacp',   // 真实财务服务
  'dacp-crm-service': 'http://localhost:3004/dacp'        // 真实CRM服务
};
```

## 🎯 产品理念

基于Sean的产品哲学，这个演示服务体现了：

### 奥卡姆剃刀原则
- 最小复杂度验证最大价值
- 两个典型场景覆盖DACP协议核心能力
- 避免过度工程化干扰协议本质

### 需求驱动设计
- 协议验证需求 → 最小演示实现
- 开发者参考需求 → 标准化代码结构
- 生态扩展需求 → 清晰的架构分离

### 矛盾转化创新
- 协议抽象 vs 具象演示 → 通过具体场景展示抽象协议
- 演示简洁 vs 功能完整 → 精选核心场景代表全貌
- 当前需求 vs 未来扩展 → 演示框架支持无限扩展

---

## 📞 技术支持

**演示目标**：验证DACP协议可行性，为真实DACP服务开发提供参考

**架构原则**：演示服务与生产服务分离，避免在MCP客户端承担过多业务逻辑

**扩展建议**：基于此演示框架，开发独立部署的专业DACP服务 