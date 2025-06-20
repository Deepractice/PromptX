#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧪 DACP 集成测试${NC}"
echo "================================="

# 检查 DACP 服务是否运行
echo -e "\n${YELLOW}1. 检查 DACP 服务状态${NC}"
if curl -s http://localhost:3002/health > /dev/null; then
    echo -e "${GREEN}✅ DACP 服务运行正常${NC}"
    curl -s http://localhost:3002/health | jq .
else
    echo -e "${RED}❌ DACP 服务未运行，请先启动：sh scripts/start-mcp.sh --with-dacp${NC}"
    exit 1
fi

# 测试计算器
echo -e "\n${YELLOW}2. 测试计算器 Action${NC}"
echo "请求: 100 + 200"
curl -s -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "calculate",
    "parameters": {
      "user_request": "100 + 200"
    }
  }' | jq '.data.execution_result'

# 测试邮件
echo -e "\n${YELLOW}3. 测试邮件 Action${NC}"
echo "请求: 发送会议提醒邮件"
curl -s -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "send_email",
    "parameters": {
      "user_request": "给 team@example.com 发个明天下午3点的会议提醒"
    }
  }' | jq '.data.execution_result | {recipient, subject, status}'

# 测试日历
echo -e "\n${YELLOW}4. 测试日历 Action${NC}"
echo "请求: 安排会议"
curl -s -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "schedule_meeting",
    "parameters": {
      "user_request": "安排明天和张三讨论项目进展"
    }
  }' | jq '.data.execution_result | {title, time, attendees}'

# 测试文档
echo -e "\n${YELLOW}5. 测试文档 Action${NC}"
echo "请求: 创建工作报告"
curl -s -X POST http://localhost:3002/dacp \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "dacp-promptx-service",
    "action": "create_document",
    "parameters": {
      "user_request": "创建一份本周工作报告"
    }
  }' | jq '.data.execution_result | {title, type, format}'

echo -e "\n${GREEN}✅ 测试完成！${NC}"