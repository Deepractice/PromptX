#!/bin/bash

echo "🔍 验证 Feature 分支 Workflow 配置"
echo ""

# 测试不同的分支名称
test_branches=(
  "feature/test-snapshot"
  "feat/awesome-feature" 
  "fix/bug-fix"
  "hotfix/urgent-fix"
  "develop"
  "test"
  "main"
  "random-branch"
)

echo "📋 测试分支名称匹配："
echo ""

for branch in "${test_branches[@]}"; do
  # 模拟 workflow 中的逻辑
  case "$branch" in
    "develop")
      RELEASE_TYPE="dev"
      ;;
    "test")
      RELEASE_TYPE="alpha"
      ;;
    "staging")
      RELEASE_TYPE="beta"
      ;;
    "main")
      RELEASE_TYPE="latest"
      ;;
    feature/*|feat/*|fix/*|hotfix/*)
      RELEASE_TYPE="snapshot"
      ;;
    *)
      RELEASE_TYPE="❌ ERROR"
      ;;
  esac
  
  printf "%-30s → %s\n" "$branch" "$RELEASE_TYPE"
done

echo ""
echo "✅ 配置验证结果："
echo "- feature/* 分支会触发 snapshot 发布"
echo "- feat/* 分支会触发 snapshot 发布"
echo "- fix/* 分支会触发 snapshot 发布"
echo "- hotfix/* 分支会触发 snapshot 发布"

echo ""
echo "📦 预期的版本号格式："
echo "- feature/xxx → 1.0.0-snapshot.feature-xxx.20250710151234"
echo "- feat/xxx → 1.0.0-snapshot.feat-xxx.20250710151234"
echo "- fix/xxx → 1.0.0-snapshot.fix-xxx.20250710151234"