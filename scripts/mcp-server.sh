#!/bin/bash

# PromptX HTTP MCP Server 管理脚本
# 用于启动、停止、重启和查看状态

# 配置
SERVER_PORT=3000
SERVER_HOST="0.0.0.0"
SERVER_TRANSPORT="http"
PID_FILE="/tmp/promptx-mcp-server.pid"
LOG_FILE="/tmp/promptx-mcp-server.log"
PROJECT_DIR="/Users/sean/Management/ContradictionManagement/projects/PromptX"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    printf "${GREEN}✅ %s${NC}\n" "$1"
}

print_error() {
    printf "${RED}❌ %s${NC}\n" "$1"
}

print_info() {
    printf "${BLUE}ℹ️  %s${NC}\n" "$1"
}

print_warning() {
    printf "${YELLOW}⚠️  %s${NC}\n" "$1"
}

# 检查服务是否运行
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 获取服务状态
get_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_success "HTTP MCP Server 正在运行 (PID: $pid, Port: $SERVER_PORT)"
        
        # 测试服务是否可访问
        if curl -s "http://$SERVER_HOST:$SERVER_PORT/health" > /dev/null 2>&1; then
            print_success "服务健康检查通过"
        else
            print_warning "服务进程存在但健康检查失败"
        fi
    else
        print_info "HTTP MCP Server 未运行"
    fi
}

# 启动服务
start_server() {
    if is_running; then
        print_warning "服务已在运行"
        get_status
        return 0
    fi
    
    print_info "启动 HTTP MCP Server..."
    print_info "端口: $SERVER_PORT"
    print_info "传输: $SERVER_TRANSPORT"
    print_info "日志: $LOG_FILE"
    
    # 切换到项目目录
    cd "$PROJECT_DIR" || {
        print_error "无法切换到项目目录: $PROJECT_DIR"
        return 1
    }
    
    # 启动服务（后台运行）
    print_info "执行命令: node src/bin/promptx.js mcp-server --transport $SERVER_TRANSPORT --port $SERVER_PORT"
    print_info "工作目录: $(pwd)"
    print_info "PID文件路径: $PID_FILE"
    
    nohup env MCP_DEBUG=true node src/bin/promptx.js mcp-server \
        --transport "$SERVER_TRANSPORT" \
        --port "$SERVER_PORT" \
        --host "$SERVER_HOST" \
        --debug \
        > "$LOG_FILE" 2>&1 &
    
    local pid=$!
    print_info "进程PID: $pid"
    
    if echo "$pid" > "$PID_FILE"; then
        print_info "PID文件创建成功: $PID_FILE"
    else
        print_error "PID文件创建失败: $PID_FILE"
        return 1
    fi
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 3
    
    # 检查服务是否成功启动
    if is_running; then
        # 等待服务完全就绪
        local retries=0
        while [ $retries -lt 10 ]; do
            if curl -s "http://$SERVER_HOST:$SERVER_PORT/health" > /dev/null 2>&1; then
                print_success "HTTP MCP Server 启动成功！"
                print_info "健康检查: http://$SERVER_HOST:$SERVER_PORT/health"
                print_info "MCP端点: http://$SERVER_HOST:$SERVER_PORT/mcp"
                return 0
            fi
            retries=$((retries + 1))
            sleep 1
        done
        
        print_warning "服务已启动但健康检查失败，请查看日志: $LOG_FILE"
    else
        print_error "服务启动失败，请查看日志: $LOG_FILE"
        return 1
    fi
}

# 停止服务
stop_server() {
    local stopped_any=false
    
    # 1. 停止PID文件中记录的进程
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_info "停止 HTTP MCP Server (PID: $pid)..."
        
        # 发送 TERM 信号
        kill "$pid" 2>/dev/null
        
        # 等待进程结束
        local retries=0
        while [ $retries -lt 10 ]; do
            if ! kill -0 "$pid" 2>/dev/null; then
                rm -f "$PID_FILE"
                print_success "PID文件中的服务已停止"
                stopped_any=true
                break
            fi
            retries=$((retries + 1))
            sleep 1
        done
        
        # 如果进程还在运行，强制终止
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "正常停止失败，强制终止..."
            kill -9 "$pid" 2>/dev/null
            rm -f "$PID_FILE"
            stopped_any=true
        fi
    fi
    
    # 2. 检查并停止占用端口的其他进程
    local port_pids=$(lsof -ti :$SERVER_PORT 2>/dev/null)
    if [ -n "$port_pids" ]; then
        print_info "发现占用端口 $SERVER_PORT 的其他进程: $port_pids"
        for pid in $port_pids; do
            print_info "停止端口占用进程 (PID: $pid)..."
            kill "$pid" 2>/dev/null
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "强制终止端口占用进程 (PID: $pid)..."
                kill -9 "$pid" 2>/dev/null
            fi
            stopped_any=true
        done
    fi
    
    # 3. 等待端口释放
    if [ "$stopped_any" = true ]; then
        print_info "等待端口释放..."
        local retries=0
        while [ $retries -lt 15 ]; do
            if ! lsof -i :$SERVER_PORT >/dev/null 2>&1; then
                print_success "端口 $SERVER_PORT 已释放"
                return 0
            fi
            retries=$((retries + 1))
            sleep 1
        done
        print_warning "端口释放超时，但继续执行..."
    else
        print_info "未发现运行中的服务"
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
}

# 重启服务
restart_server() {
    print_info "重启 HTTP MCP Server..."
    stop_server
    
    # 确保端口完全释放
    print_info "确保端口完全释放..."
    sleep 3
    
    # 最后检查一次端口状态
    if lsof -i :$SERVER_PORT >/dev/null 2>&1; then
        print_warning "端口 $SERVER_PORT 仍被占用，尝试再次清理..."
        local remaining_pids=$(lsof -ti :$SERVER_PORT 2>/dev/null)
        for pid in $remaining_pids; do
            print_info "强制终止残留进程 (PID: $pid)..."
            kill -9 "$pid" 2>/dev/null
        done
        sleep 2
    fi
    
    start_server
}

# 查看日志
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        if [ "$1" = "-f" ]; then
            print_info "实时查看日志 (Ctrl+C 退出):"
            tail -f "$LOG_FILE"
        else
            print_info "显示最近50行日志:"
            tail -50 "$LOG_FILE"
        fi
    else
        print_error "日志文件不存在: $LOG_FILE"
    fi
}

# 测试服务
test_server() {
    if ! is_running; then
        print_error "服务未运行，请先启动服务"
        return 1
    fi
    
    print_info "测试服务连接..."
    
    # 健康检查
    print_info "1. 健康检查"
    if curl -s "http://$SERVER_HOST:$SERVER_PORT/health" | jq . 2>/dev/null; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败"
        return 1
    fi
    
    # 工具列表
    print_info "2. 获取工具列表"
    if curl -s -X POST "http://$SERVER_HOST:$SERVER_PORT/mcp" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | jq . > /dev/null 2>&1; then
        print_success "工具列表获取成功"
    else
        print_error "工具列表获取失败"
        return 1
    fi
    
    print_success "所有测试通过！"
}

# 清理函数
cleanup() {
    rm -f "$PID_FILE" 2>/dev/null
    print_info "清理完成"
}

# 显示帮助
show_help() {
    echo -e "${BLUE}PromptX HTTP MCP Server 管理脚本${NC}"
    echo
    echo "用法: $0 [命令] [选项]"
    echo
    echo "命令:"
    echo "  start     - 启动服务"
    echo "  stop      - 停止服务"
    echo "  restart   - 重启服务"
    echo "  status    - 查看服务状态"
    echo "  logs      - 查看日志"
    echo "  logs -f   - 实时查看日志"
    echo "  test      - 测试服务功能"
    echo "  cleanup   - 清理PID文件"
    echo "  help      - 显示帮助"
    echo
    echo "配置:"
    echo "  端口: $SERVER_PORT"
    echo "  主机: $SERVER_HOST"
    echo "  传输: $SERVER_TRANSPORT"
    echo "  日志: $LOG_FILE"
    echo "  PID: $PID_FILE"
    echo
    echo "示例:"
    echo "  $0 start          # 启动服务"
    echo "  $0 restart        # 重启服务"
    echo "  $0 logs -f        # 实时查看日志"
    echo "  $0 test           # 测试服务"
}

# 主逻辑
case "$1" in
    "start")
        start_server
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        ;;
    "status")
        get_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "test")
        test_server
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac

exit $?