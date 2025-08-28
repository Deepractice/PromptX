#!/bin/sh

# PromptX Universal Launcher
# 目录无关的 PromptX 启动器
# 自动检测运行环境并选择合适的启动方式
# 兼容 bash 和 sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在的绝对路径（即 PromptX 项目根目录）
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)"
PROMPTX_ROOT="$(dirname "$SCRIPT_PATH")"

# 调试模式
if [ "${PROMPTX_DEBUG}" = "true" ]; then
    echo -e "${CYAN}[DEBUG] Script path: $SCRIPT_PATH${NC}"
    echo -e "${CYAN}[DEBUG] PromptX root: $PROMPTX_ROOT${NC}"
    echo -e "${CYAN}[DEBUG] Current directory: $(pwd)${NC}"
fi

# 检测是否为开发模式（在 PromptX 源码目录内运行）
is_dev_mode() {
    # 如果当前目录是 PromptX 项目目录或其子目录
    case "$(pwd)" in
        "$PROMPTX_ROOT"*)
            return 0
            ;;
    esac
    
    # 如果环境变量明确指定了开发模式
    if [ "${PROMPTX_DEV}" = "true" ] || [ "${PROMPTX_ENV}" = "development" ]; then
        return 0
    fi
    return 1
}

# 检查是否安装了全局 promptx
has_global_promptx() {
    if command -v promptx >/dev/null 2>&1; then
        # 确保不是指向自己
        local global_path=$(which promptx)
        if [ "$global_path" != "$SCRIPT_PATH/promptx.sh" ]; then
            return 0
        fi
    fi
    return 1
}

# 设置开发环境变量
setup_dev_env() {
    export PROMPTX_ENV=development
    export PROMPTX_DEV_MODE=true
    export PROMPTX_SOURCE_ROOT="$PROMPTX_ROOT"
    export PROMPTX_SYSTEM_ROLE_PATH="$PROMPTX_ROOT/packages/resource/role"
    
    if [ "${PROMPTX_DEBUG}" = "true" ]; then
        echo -e "${GREEN}✅ 开发环境变量已设置${NC}"
        echo "  PROMPTX_ENV=$PROMPTX_ENV"
        echo "  PROMPTX_DEV_MODE=$PROMPTX_DEV_MODE"
        echo "  PROMPTX_SOURCE_ROOT=$PROMPTX_SOURCE_ROOT"
    fi
}

# 主逻辑
main() {
    local use_dev=false
    local promptx_cmd=""
    
    # 判断使用哪种模式
    if is_dev_mode; then
        # 开发模式：使用 CLI 包
        use_dev=true
        promptx_cmd="node $PROMPTX_ROOT/apps/cli/src/bin/promptx.js"
        
        # 设置开发环境变量
        setup_dev_env
        
        # 检查依赖
        if [ ! -d "$PROMPTX_ROOT/node_modules" ]; then
            echo -e "${YELLOW}⚠️  开发模式：检测到依赖未安装${NC}"
            echo -e "${BLUE}正在安装依赖...${NC}"
            cd "$PROMPTX_ROOT"
            if command -v pnpm >/dev/null 2>&1; then
                pnpm install
            else
                npm install
            fi
            echo -e "${GREEN}✅ 依赖安装完成${NC}"
            cd - > /dev/null
        fi
        
        if [ "${PROMPTX_DEBUG}" = "true" ] || [ "$1" = "--version" ] || [ "$1" = "-v" ]; then
            echo -e "${BLUE}🔧 PromptX (开发模式)${NC}"
        fi
    elif has_global_promptx; then
        # 生产模式：使用全局安装的 promptx
        promptx_cmd="promptx"
        
        if [ "${PROMPTX_DEBUG}" = "true" ]; then
            echo -e "${GREEN}📦 使用全局安装的 PromptX${NC}"
        fi
    else
        # 回退到源码模式
        echo -e "${YELLOW}⚠️  未找到全局 PromptX，使用源码模式${NC}"
        promptx_cmd="node $PROMPTX_ROOT/apps/cli/src/bin/promptx.js"
        
        # 检查 Node.js
        if ! command -v node >/dev/null 2>&1; then
            echo -e "${RED}❌ 错误：未找到 Node.js${NC}"
            echo -e "${YELLOW}请先安装 Node.js: https://nodejs.org${NC}"
            exit 1
        fi
        
        # 检查依赖
        if [ ! -d "$PROMPTX_ROOT/node_modules" ]; then
            echo -e "${YELLOW}正在安装依赖...${NC}"
            cd "$PROMPTX_ROOT"
            if command -v pnpm >/dev/null 2>&1; then
                pnpm install
            else
                npm install
            fi
            cd - > /dev/null
        fi
    fi
    
    # 执行 PromptX 命令
    if [ "${PROMPTX_DEBUG}" = "true" ]; then
        echo -e "${CYAN}[DEBUG] 执行命令: $promptx_cmd $@${NC}"
    fi
    
    # 使用 exec 替换当前进程，保持信号处理
    exec $promptx_cmd "$@"
}

# 执行主逻辑
main "$@"