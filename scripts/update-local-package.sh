#!/bin/bash

# PromptX本地包更新脚本
# 用法: ./scripts/update-local-package.sh [版本号] [变更描述]
# 例如: ./scripts/update-local-package.sh 0.0.2-local.9 "修复某某问题"

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
NEW_VERSION=$1
CHANGE_DESCRIPTION=$2

if [ -z "$NEW_VERSION" ]; then
    # 如果没有提供版本号，自动递增
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    log_info "当前版本: $CURRENT_VERSION"
    
    # 提取版本号的最后一位数字并递增
    if [[ $CURRENT_VERSION =~ (.+\.)([0-9]+)$ ]]; then
        PREFIX=${BASH_REMATCH[1]}
        NUMBER=${BASH_REMATCH[2]}
        NEW_NUMBER=$((NUMBER + 1))
        NEW_VERSION="${PREFIX}${NEW_NUMBER}"
    else
        log_error "无法解析当前版本号格式: $CURRENT_VERSION"
        exit 1
    fi
fi

if [ -z "$CHANGE_DESCRIPTION" ]; then
    CHANGE_DESCRIPTION="包版本更新和依赖优化"
fi

log_info "准备更新到版本: $NEW_VERSION"
log_info "变更描述: $CHANGE_DESCRIPTION"

# 确认操作
read -p "$(echo -e ${YELLOW}确认执行更新操作? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "操作已取消"
    exit 0
fi

echo "============================================================"
log_info "🚀 开始PromptX本地包更新流程"
echo "============================================================"

# Step 1: 清理npm缓存
log_info "步骤 1/7: 清理npm缓存..."
npm cache clean --force
log_success "npm缓存清理完成"

# Step 2: 删除依赖文件
log_info "步骤 2/7: 删除依赖文件..."
rm -rf node_modules package-lock.json
log_success "依赖文件删除完成"

# Step 3: 更新版本号
log_info "步骤 3/7: 更新版本号到 $NEW_VERSION..."
npm version $NEW_VERSION --no-git-tag-version
log_success "版本号更新完成"

# Step 4: 重新安装依赖
log_info "步骤 4/7: 重新安装依赖..."
npm install
log_success "依赖重装完成"

# Step 5: 更新CHANGELOG
log_info "步骤 5/7: 更新CHANGELOG.md..."
CURRENT_DATE=$(date +"%Y-%m-%d")

# 备份原CHANGELOG
cp CHANGELOG.md CHANGELOG.md.bak

# 创建新的CHANGELOG条目
cat > CHANGELOG.tmp << EOF
# Changelog

All notable changes to PromptX will be documented in this file.

## [$NEW_VERSION] - $CURRENT_DATE

### 🔄 Package Updates
- **版本更新**: 更新到$NEW_VERSION
- **依赖优化**: 清理缓存并重新安装所有依赖
- **变更内容**: $CHANGE_DESCRIPTION

### 🛠️ Technical Details
- npm缓存完全清理
- node_modules和package-lock.json重新生成
- 确保依赖版本一致性
- 运行基础功能验证

$(tail -n +3 CHANGELOG.md)
EOF

mv CHANGELOG.tmp CHANGELOG.md
log_success "CHANGELOG.md更新完成"

# Step 6: 基础功能验证
log_info "步骤 6/7: 运行基础功能验证..."
if node src/bin/promptx.js hello > /dev/null 2>&1; then
    log_success "hello命令验证通过"
else
    log_error "hello命令验证失败"
    # 恢复CHANGELOG备份
    mv CHANGELOG.md.bak CHANGELOG.md
    exit 1
fi

# Step 7: 清理备份文件
log_info "步骤 7/7: 清理临时文件..."
rm -f CHANGELOG.md.bak
log_success "清理完成"

echo "============================================================"
log_success "🎉 PromptX本地包更新完成!"
echo "============================================================"

# 显示更新摘要
echo -e "${BLUE}📋 更新摘要:${NC}"
echo "  • 版本号: $NEW_VERSION"
echo "  • 变更描述: $CHANGE_DESCRIPTION"
echo "  • 更新时间: $CURRENT_DATE"
echo "  • 依赖包数量: $(npm list --depth=0 2>/dev/null | grep -c "├──\|└──" || echo "未知")"

echo -e "\n${GREEN}✅ 下一步操作建议:${NC}"
echo "  1. 运行: npm test (可选的完整测试)"
echo "  2. 验证: npx dpml-prompt-local hello"
echo "  3. 测试: 在其他项目中测试跨项目功能"

echo -e "\n${YELLOW}📝 提示:${NC}"
echo "  • CHANGELOG.md已自动更新"
echo "  • 如需回滚，请检查Git历史"
echo "  • 建议在Git中提交这些更改" 