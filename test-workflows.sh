#!/bin/bash

echo "🧪 GitHub Actions 本地测试工具"
echo ""

# 列出所有 workflows
echo "📋 可用的 workflows:"
act -l

echo ""
echo "🚀 常用测试命令:"
echo ""
echo "1. 测试 CI workflow (push 事件):"
echo "   act push -W .github/workflows/ci.yml"
echo ""
echo "2. 测试 PR workflow:"
echo "   act pull_request -W .github/workflows/ci.yml"
echo ""
echo "3. 测试特定 job:"
echo "   act -j test -W .github/workflows/ci.yml"
echo ""
echo "4. 测试手动触发的 workflow:"
echo "   act workflow_dispatch -W .github/workflows/release-management.yml"
echo ""
echo "5. 使用特定分支的 workflow 文件:"
echo "   git show develop:.github/workflows/ci.yml | act -W -"
echo ""
echo "6. 调试模式（显示详细日志）:"
echo "   act -v push -W .github/workflows/ci.yml"
echo ""
echo "7. 模拟特定事件："
echo "   act -e .github/test-events/push-develop.json"

# 创建测试事件文件
mkdir -p .github/test-events

cat > .github/test-events/push-develop.json << 'EOF'
{
  "push": {
    "ref": "refs/heads/develop",
    "repository": {
      "name": "PromptX",
      "full_name": "Deepractice/PromptX"
    }
  }
}
EOF

cat > .github/test-events/pr-merged.json << 'EOF'
{
  "pull_request": {
    "action": "closed",
    "merged": true,
    "base": {
      "ref": "test"
    }
  }
}
EOF

echo ""
echo "✅ 测试事件文件已创建在 .github/test-events/"