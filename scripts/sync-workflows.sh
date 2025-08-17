#!/bin/bash

# GitHub Workflow同步脚本
# 作用：将workflow文件同步到所有活跃分支
# 用法：./scripts/sync-workflows.sh

set -e

echo "🔄 GitHub Workflow 同步脚本"
echo "==============================="

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"

# 确保工作区干净
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "❌ 工作区有未提交的更改，请先提交或暂存"
    exit 1
fi

# 获取所有远程分支
echo "📊 获取远程分支列表..."
git fetch --all --prune

# 需要同步的分支列表（排除当前分支）
BRANCHES=$(git branch -r | grep -v HEAD | sed 's/origin\///' | grep -v "^$CURRENT_BRANCH$")

# 需要同步的workflow文件
WORKFLOW_FILES=".github/workflows/*.yml .github/workflows/*.yaml"

echo "📋 将同步以下分支："
echo "$BRANCHES" | head -10
BRANCH_COUNT=$(echo "$BRANCHES" | wc -l)
echo "... 共 $BRANCH_COUNT 个分支"

# 确认执行
read -p "确定要同步workflow到所有分支吗？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消同步"
    exit 1
fi

# 创建临时目录存储workflow文件
TEMP_DIR=$(mktemp -d)
echo "📦 复制workflow文件到临时目录..."
cp -r .github/workflows "$TEMP_DIR/"

# 同步计数
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_BRANCHES=""

# 对每个分支进行同步
for BRANCH in $BRANCHES; do
    # 跳过某些分支
    if [[ "$BRANCH" == "gh-pages" ]] || [[ "$BRANCH" == *"dependabot"* ]]; then
        echo "⏭️  跳过分支: $BRANCH"
        continue
    fi
    
    echo ""
    echo "🔄 同步到分支: $BRANCH"
    
    # 切换到目标分支
    if git checkout "$BRANCH" 2>/dev/null; then
        # 拉取最新代码
        git pull origin "$BRANCH" --rebase 2>/dev/null || true
        
        # 复制workflow文件
        cp -r "$TEMP_DIR/workflows" .github/
        
        # 检查是否有更改
        if git diff --quiet; then
            echo "✅ $BRANCH - 无需更新"
        else
            # 提交更改
            git add .github/workflows/
            git commit -m "chore: 同步workflow文件更新

- 添加bug分支类型支持
- 修复PR创建时的分支检测问题
- 从 $CURRENT_BRANCH 分支同步" || true
            
            # 推送到远程
            if git push origin "$BRANCH"; then
                echo "✅ $BRANCH - 同步成功"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "❌ $BRANCH - 推送失败"
                FAIL_COUNT=$((FAIL_COUNT + 1))
                FAILED_BRANCHES="$FAILED_BRANCHES\n  - $BRANCH"
            fi
        fi
    else
        echo "❌ $BRANCH - 切换失败"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_BRANCHES="$FAILED_BRANCHES\n  - $BRANCH"
    fi
done

# 清理临时目录
rm -rf "$TEMP_DIR"

# 切回原分支
echo ""
echo "🔙 切回原分支: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

# 输出统计
echo ""
echo "==============================="
echo "📊 同步统计："
echo "✅ 成功: $SUCCESS_COUNT 个分支"
echo "❌ 失败: $FAIL_COUNT 个分支"

if [ $FAIL_COUNT -gt 0 ]; then
    echo ""
    echo "失败的分支："
    echo -e "$FAILED_BRANCHES"
fi

echo ""
echo "✨ 同步完成！"