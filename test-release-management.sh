#!/bin/bash

echo "🧪 测试 Release Management Workflow"
echo ""

# 创建测试事件文件
mkdir -p .github/test-events

# workflow_dispatch 事件 - develop to test
cat > .github/test-events/release-develop-to-test.json << 'EOF'
{
  "workflow_dispatch": {
    "inputs": {
      "target-branch": "test",
      "release-type": "patch"
    }
  }
}
EOF

# workflow_dispatch 事件 - test to staging
cat > .github/test-events/release-test-to-staging.json << 'EOF'
{
  "workflow_dispatch": {
    "inputs": {
      "target-branch": "staging",
      "release-type": "minor"
    }
  }
}
EOF

echo "📝 测试场景："
echo ""
echo "1. Develop → Test (patch release)"
cat .github/test-events/release-develop-to-test.json | jq .

echo ""
echo "2. Test → Staging (minor release)"
cat .github/test-events/release-test-to-staging.json | jq .

echo ""
echo "🚀 运行测试..."
echo ""

# 测试 develop to test
echo "测试 develop → test 发布："
echo "act workflow_dispatch -e .github/test-events/release-develop-to-test.json -W .github/workflows/release-management.yml"

echo ""
echo "💡 完整测试命令："
echo ""
echo "# 测试 develop → test (patch):"
echo "act workflow_dispatch -e .github/test-events/release-develop-to-test.json -W .github/workflows/release-management.yml -j create-release-pr"
echo ""
echo "# 测试 test → staging (minor):"
echo "act workflow_dispatch -e .github/test-events/release-test-to-staging.json -W .github/workflows/release-management.yml -j create-release-pr"
echo ""
echo "# 查看详细日志:"
echo "act workflow_dispatch -e .github/test-events/release-develop-to-test.json -W .github/workflows/release-management.yml -v"

echo ""
echo "📋 预期行为："
echo "- 从源分支创建新的 release 分支"
echo "- 添加 .release 标记文件"
echo "- 创建 PR 到目标分支"
echo "- PR 包含版本预览信息"