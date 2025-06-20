#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录的上级目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}🚀 启动 PromptX MCP Server...${NC}"
echo -e "${YELLOW}📁 项目根目录: $PROJECT_ROOT${NC}"

# 检查项目根目录是否存在 package.json
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    echo -e "${RED}❌ 错误: 在 $PROJECT_ROOT 中未找到 package.json${NC}"
    echo -e "${RED}   请确保脚本在正确的项目中运行${NC}"
    exit 1
fi

# 检查是否安装了 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 pnpm 命令${NC}"
    echo -e "${YELLOW}💡 请先安装 pnpm: npm install -g pnpm${NC}"
    exit 1
fi

# 切换到项目根目录并执行命令
echo -e "${GREEN}✅ 正在启动 MCP Server...${NC}"

# 设置环境变量
export PROMPTX_ENV=development

# 检查是否传入了 --with-dacp 参数
if [[ "$1" == "--with-dacp" ]]; then
    echo -e "${YELLOW}🔌 将同时启动 DACP 服务...${NC}"
    cd "$PROJECT_ROOT" && node src/bin/promptx.js mcp-server --with-dacp
else
    cd "$PROJECT_ROOT" && node src/bin/promptx.js mcp-server
fi