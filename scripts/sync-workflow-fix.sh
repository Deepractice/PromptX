#!/bin/bash

# 同步workflow修复到main和develop分支
# 专门用于同步bug分支类型支持的修复

set -e

echo "🔄 同步Workflow修复到主要分支"
echo "================================"

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"

# 确保我们有最新的修复
echo "📦 准备workflow文件..."
WORKFLOW_FILE=".github/workflows/start.yml"

# 保存修复后的文件内容
cp $WORKFLOW_FILE /tmp/start.yml.fixed

# 同步函数
sync_to_branch() {
    local BRANCH=$1
    echo ""
    echo "🔄 同步到 $BRANCH 分支..."
    
    # 切换到目标分支
    git checkout $BRANCH
    
    # 拉取最新
    git pull origin $BRANCH
    
    # 复制修复后的文件
    cp /tmp/start.yml.fixed $WORKFLOW_FILE
    
    # 检查是否有变化
    if git diff --quiet $WORKFLOW_FILE; then
        echo "✅ $BRANCH - 已经是最新版本"
    else
        # 提交修改
        git add $WORKFLOW_FILE
        git commit -m "fix: 添加bug分支类型支持到workflow

- 修复PR创建时无法识别bug/#XXX-issue分支的问题
- 支持bug类型的Issue分支创建PR
- 从$CURRENT_BRANCH分支同步

Related to #266"
        
        # 推送
        git push origin $BRANCH
        echo "✅ $BRANCH - 同步成功"
    fi
}

# 同步到main和develop
sync_to_branch "develop"
sync_to_branch "main"

# 切回原分支
echo ""
echo "🔙 切回原分支: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

# 清理临时文件
rm -f /tmp/start.yml.fixed

echo ""
echo "✨ Workflow修复已同步到所有主要分支！"
echo ""
echo "📝 已同步的分支："
echo "  ✅ develop"
echo "  ✅ main"
echo ""
echo "现在可以测试 /start pr 命令了！"