# DACP 协议演示服务

## 概述

这是一个轻量级的DACP (Deepractice Agent Context Protocol) 协议演示服务，通过calculator和email两个典型场景验证DACP协议的完整性和可行性。

⚠️ **重要说明**：这是协议演示服务，不是生产级业务服务。真实的DACP服务应该独立部署。

## 设计目标

- **协议验证**：验证DACP协议标准的可行性
- **演示参考**：为第三方DACP服务开发提供实现参考  
- **最小复杂度**：聚焦协议本质，避免业务逻辑干扰

## 演示功能

### 1. Calculator (`calculate`)
- 中文自然语言数学表达式解析
- 智能运算符转换：`加/乘/减/除` → `+/*/-/÷`
- 标准数学运算和结果格式化

### 2. Email (`send_email`) 
- 自然语言邮件需求理解
- 上下文感知内容生成
- 专业邮件格式化

## 快速开始

### 通过PromptX MCP启动（推荐）
```bash
./scripts/start-mcp.sh --with-dacp
```

### 独立启动
```bash
cd src/dacp/dacp-promptx-service
npm install
node server.js
```

服务地址：`http://localhost:3002`

## 基础测试

```bash
# 健康检查
curl http://localhost:3002/health

# 计算器演示
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "calculate",
    "parameters": {"user_request": "计算 25 + 37 * 3"}
  }'

# 邮件演示
curl -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service", 
    "action": "send_email",
    "parameters": {"user_request": "发送测试邮件"}
  }'
```

## 架构原则

基于Sean的产品哲学：

### 奥卡姆剃刀原则
- 最小复杂度验证最大价值
- 两个典型场景覆盖协议核心能力

### 架构分离
- 演示服务与生产服务分离
- 避免在MCP客户端承担过多业务逻辑

### 扩展指导
- 真实DACP服务应独立部署
- 此演示提供标准协议实现参考

## 文档

详细的API调用指南请参考：[DACP-API-GUIDE.md](./DACP-API-GUIDE.md)

## 下一步

基于此演示框架，开发独立部署的专业DACP服务：
- `dacp-finance-service` (财务服务)
- `dacp-crm-service` (客户管理服务)
- `dacp-analytics-service` (数据分析服务)