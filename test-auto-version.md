# Test Auto Version Management

This file is created to test the new auto version management system.

## Features Tested

1. PR title parsing for conventional commits
2. Auto-labeling based on PR title
3. Changeset creation on PR merge
4. CHANGELOG generation from squash message

## Expected Behavior

- PR title: `feat: 测试自动版本管理系统`
- Auto labels: `changeset/minor`, `merge/squash`, `publish/dev`
- Version bump: minor (e.g., 0.2.0 → 0.3.0)
- CHANGELOG: Will contain the PR body content