# GitHub Workflows 完整测试流程检查清单

## 测试环境准备

### 1. 清理环境
- [ ] 关闭所有打开的PR
  ```bash
  gh pr list --state open
  gh pr close <PR_NUMBER>
  ```
- [ ] 删除测试分支
  ```bash
  git branch -r | grep -E 'origin/(feat|feature|release)/' | sed 's|origin/||' | xargs -I {} gh api -X DELETE /repos/<owner>/<repo>/git/refs/heads/{}
  ```
- [ ] 删除测试标签和releases
  ```bash
  gh release delete v0.1.X -y
  git tag -d v0.1.X
  ```

## 开发流程测试

### 2. 创建Issue
- [ ] 创建测试issue
  ```bash
  gh issue create --title "完整工作流测试" --body "测试描述"
  ```
- [ ] 记录Issue编号: #____

### 3. 开发分支创建
- [ ] 执行 `/start development` 命令
  ```bash
  gh issue comment <ISSUE_NUMBER> --body "/start development"
  ```
- [ ] 验证分支创建成功
  ```bash
  git fetch origin
  git branch -r | grep feature
  ```
- [ ] 切换到开发分支
  ```bash
  git checkout -b feature/#<ISSUE>-issue origin/feature/#<ISSUE>-issue
  ```

### 4. 提交代码
- [ ] 创建测试文件
  ```bash
  echo "# Test" > docs/test.md
  git add docs/test.md
  git commit -m "test: 添加测试文件"
  git push origin feature/#<ISSUE>-issue
  ```

### 5. 创建PR到develop
- [ ] 执行 `/start pr` 命令
  ```bash
  gh issue comment <ISSUE_NUMBER> --body "/start pr"
  ```
- [ ] 验证PR创建成功
  ```bash
  gh pr list --state open
  ```
- [ ] 验证自动changeset生成
  ```bash
  git pull origin feature/#<ISSUE>-issue
  ls -la .changeset/*.md
  ```
- [ ] 记录PR编号: #____

### 6. 合并到develop
- [ ] 合并PR
  ```bash
  gh pr merge <PR_NUMBER> --squash --body "测试合并"
  ```
- [ ] 验证pr-merged-develop事件触发
  ```bash
  gh run list --workflow=pr-merged-develop.yml --limit 1
  ```
- [ ] 验证自动触发 `/start release --preview`（查看PR评论）

## Release流程测试

### 7. 创建Release分支
- [ ] 执行 `/start release` 命令
  ```bash
  gh issue comment <ISSUE_NUMBER> --body "/start release"
  ```
- [ ] 验证release分支创建
  ```bash
  git fetch origin
  git branch -r | grep release
  ```
- [ ] 切换到release分支
  ```bash
  git checkout -b release/0.1.X origin/release/0.1.X
  ```
- [ ] 验证版本号更新（package.json）
- [ ] 验证CHANGELOG生成
- [ ] 验证自动创建PR到main
- [ ] 记录Release PR编号: #____

### 8. Beta版本测试
- [ ] 检查pr-opened-main事件是否自动触发 `/release --prerelease beta`
  ```bash
  gh pr view <RELEASE_PR> --json comments | jq -r '.comments[].body'
  ```
- [ ] 如果没有自动触发，手动执行
  ```bash
  gh pr comment <RELEASE_PR> --body "/release --prerelease beta"
  ```
- [ ] 验证Beta版本创建
  ```bash
  gh release list --limit 5
  ```
- [ ] 确认Beta版本标签格式: `v0.1.X-beta.0` ✅

### 9. 合并到main
- [ ] 解决冲突（如果有）
  ```bash
  git checkout release/0.1.X
  git merge main --no-edit
  git checkout --theirs <conflicted_files>
  git add -A
  git commit -m "merge: resolve conflicts"
  git push origin release/0.1.X
  ```
- [ ] 合并PR到main
  ```bash
  gh pr merge <RELEASE_PR> --squash --body "Release 0.1.X"
  ```
- [ ] 验证pr-merged-main事件触发

### 10. 正式版本发布（自动）
- [ ] 验证pr-merged-main事件自动触发 `/release` 命令
  ```bash
  gh pr view <RELEASE_PR> --json comments | jq -r '.comments[].body' | grep "/release"
  ```
- [ ] 验证正式版本创建
  ```bash
  gh release list --limit 2
  ```
- [ ] 确认正式版本标签格式: `v0.1.X` ✅
- [ ] 如果release创建失败但tag存在，手动创建
  ```bash
  gh release create v0.1.X --title "v0.1.X" --notes "Release notes" --latest
  ```

### 11. NPM发布（可选）
- [ ] 执行 `/publish` 命令
  ```bash
  gh issue comment <ISSUE_NUMBER> --body "/publish"
  ```
- [ ] 验证npm发布状态

## 验证点检查

### 工作流程验证 ✅
- [ ] Issue → 开发分支 → PR → develop
- [ ] develop → release分支 → PR → main
- [ ] main → 正式版本发布

### 自动化验证 ✅
- [ ] pr-opened-develop: 自动生成changeset
- [ ] pr-merged-develop: 自动触发release preview
- [ ] pr-opened-main: 自动触发beta release（需要修复）
- [ ] pr-merged-main: 自动触发正式release
- [ ] /start release: 自动创建PR到main

### 版本标签验证 ✅

- [ ] Beta版本: `v0.1.X-beta.Y` 格式
- [ ] 正式版本: `v0.1.X` 格式
- [ ] 版本号递增正确性

## 常见问题

### 1. PR无法合并

- 检查是否有冲突
- 使用 `--force` 推送解决冲突后的代码

### 2. Release命令失败

- 确认在正确的分支上执行
- 检查是否有必要的权限

### 3. 自动触发失败

- 检查PAT_TOKEN是否配置
- 查看workflow日志定位问题

### 4. 版本号计算错误

- 检查changeset是否正确消费
- 验证package.json版本号

## 测试记录

| 日期 | 测试版本 | Issue | 测试结果 | 备注 |
|------|---------|-------|---------|------|
| 2025-08-15 | v0.1.4 | #53 | ✅ 成功 | Beta版本标签修复完成 |
| | | | | |

## 后续改进

- [ ] 修复pr-opened-main自动触发问题
- [ ] 优化版本冲突处理流程
- [ ] 添加更多自动化测试
