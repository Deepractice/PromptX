#!/bin/bash

echo "🧪 测试 Feature 分支 Snapshot 发布"
echo ""

# 创建测试事件文件
mkdir -p .github/test-events

# Feature 分支 push 事件
cat > .github/test-events/push-feature.json << 'EOF'
{
  "push": {
    "ref": "refs/heads/feature/test-snapshot",
    "repository": {
      "name": "PromptX",
      "full_name": "Deepractice/PromptX"
    },
    "head_commit": {
      "id": "abc123def456",
      "message": "feat: test snapshot release"
    }
  }
}
EOF

echo "📝 创建的测试事件："
cat .github/test-events/push-feature.json | jq .

echo ""
echo "🚀 运行测试..."
echo ""

# 测试 feature 分支触发
echo "1. 测试 feature 分支推送："
act push -e .github/test-events/push-feature.json -W .github/workflows/npm-unified-release.yml --dry-run

echo ""
echo "💡 其他测试命令："
echo ""
echo "# 完整运行（会真正执行，但不会发布到 npm）："
echo "act push -e .github/test-events/push-feature.json -W .github/workflows/npm-unified-release.yml"
echo ""
echo "# 查看详细日志："
echo "act push -e .github/test-events/push-feature.json -W .github/workflows/npm-unified-release.yml -v"
echo ""
echo "# 模拟不同的 feature 分支："
echo "# - feature/new-feature"
echo "# - feat/awesome-feature"
echo "# - fix/bug-fix"
echo "# - hotfix/urgent-fix"