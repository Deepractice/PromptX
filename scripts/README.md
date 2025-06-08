# PromptX 包更新脚本使用指南

本目录包含用于自动化PromptX本地包更新的脚本工具。

## 📋 可用脚本

### 1. Node.js版本 (推荐) - `update-package.js`

**适用平台**: 跨平台 (Windows, macOS, Linux)  
**要求**: Node.js ≥ 14

#### 使用方法

```bash
# 方式一：使用npm scripts (推荐)
npm run update                                    # 自动递增版本号
npm run update:version                            # 同上

# 方式二：直接运行脚本
node scripts/update-package.js                   # 自动递增版本号
node scripts/update-package.js 0.0.2-local.9    # 指定版本号
node scripts/update-package.js 0.0.2-local.9 "修复跨项目角色发现问题"  # 指定版本号和描述
```

#### 功能特性

✅ **自动版本管理**: 如果不指定版本号，自动递增最后一位数字  
✅ **交互式确认**: 执行前会确认操作，避免误操作  
✅ **完整清理**: npm缓存 + node_modules + package-lock.json  
✅ **自动文档**: 自动更新CHANGELOG.md  
✅ **功能验证**: 自动运行hello命令验证更新成功  
✅ **彩色输出**: 清晰的进度显示和状态反馈  
✅ **错误处理**: 出错时自动回滚和错误报告  

### 2. Bash版本 - `update-local-package.sh`

**适用平台**: macOS, Linux, Windows WSL  
**要求**: Bash shell

#### 使用方法

```bash
# 方式一：使用npm scripts
npm run update:bash                               # 自动递增版本号

# 方式二：直接运行脚本
./scripts/update-local-package.sh                # 自动递增版本号
./scripts/update-local-package.sh 0.0.2-local.9 # 指定版本号
./scripts/update-local-package.sh 0.0.2-local.9 "修复某某问题" # 指定版本号和描述
```

## 🔄 执行流程

两个脚本都遵循相同的7步更新流程：

1. **🧹 清理npm缓存** - `npm cache clean --force`
2. **🗑️ 删除依赖文件** - 删除 `node_modules` 和 `package-lock.json`
3. **📈 更新版本号** - 更新 `package.json` 中的版本
4. **📦 重装依赖** - `npm install`
5. **📝 更新文档** - 自动更新 `CHANGELOG.md`
6. **✅ 功能验证** - 运行 `hello` 命令验证
7. **🎉 完成清理** - 清理临时文件并显示摘要

## 📊 使用示例

### 场景1: 日常开发更新

```bash
# 快速更新，自动递增版本号
npm run update
```

**效果**: `0.0.2-local.8` → `0.0.2-local.9`

### 场景2: 重大功能更新

```bash
# 指定版本号和详细描述
node scripts/update-package.js 0.0.3-local.1 "实现多Agent共享记忆系统"
```

### 场景3: 紧急修复

```bash
# 快速修复更新
npm run update
# 然后手动编辑CHANGELOG.md添加详细修复说明
```

## 🎯 版本号规则

脚本支持自动版本号管理：

- **当前**: `0.0.2-local.8`
- **自动递增**: `0.0.2-local.9`
- **手动指定**: `0.0.3-local.1`

版本号格式: `主版本.次版本.修订版本-local.构建号`

## ⚠️ 注意事项

### 执行前检查

1. **确保没有未提交的重要更改** - 脚本会删除 `node_modules`
2. **确认网络连接** - 需要下载npm包
3. **确保Git状态正常** - 建议提交或暂存重要更改

### 安全机制

- ✅ 执行前交互式确认
- ✅ 出错时自动回滚CHANGELOG
- ✅ 基础功能验证确保更新成功
- ✅ 详细的错误日志和状态反馈

### 推荐工作流

```bash
# 1. 检查Git状态
git status

# 2. 提交当前更改
git add .
git commit -m "提交描述"

# 3. 执行包更新
npm run update

# 4. 验证功能
npx dpml-prompt-local hello

# 5. 测试跨项目功能
cd /path/to/other/project
npx dpml-prompt-local hello

# 6. 提交更新
git add .
git commit -m "更新包版本到 $(node -p "require('./package.json').version")"
```

## 🔧 故障排除

### 常见问题

**Q: 脚本执行失败，如何回滚？**
```bash
git checkout HEAD -- package.json CHANGELOG.md
npm install
```

**Q: 版本号格式错误？**
- 确保版本号格式为: `主.次.修订-local.构建号`
- 示例: `0.0.2-local.9`

**Q: 功能验证失败？**
- 检查 `src/bin/promptx.js` 文件是否存在
- 确保依赖安装成功

**Q: npm install 失败？**
```bash
# 完全重置
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🚀 高级用法

### 自定义更新脚本

可以基于现有脚本创建自定义版本：

```javascript
// 示例：创建带有自动测试的更新脚本
const { execSync } = require('child_process');

// 执行标准更新
execSync('node scripts/update-package.js', { stdio: 'inherit' });

// 运行完整测试套件
execSync('npm test', { stdio: 'inherit' });

// 运行跨项目验证
execSync('cd ../other-project && npx dpml-prompt-local hello', { stdio: 'inherit' });
```

### 批量更新多个项目

```bash
#!/bin/bash
# 示例：更新多个PromptX项目
projects=("project1" "project2" "project3")

for project in "${projects[@]}"; do
    echo "更新项目: $project"
    cd "$project"
    npm run update
    cd ..
done
```

---

## 📞 支持

如果遇到问题或有改进建议，请：

1. 检查本文档的故障排除部分
2. 查看脚本输出的错误信息
3. 检查 `CHANGELOG.md` 确认更新历史
4. 提交Issue到项目仓库

**记住**: 这些脚本旨在简化开发流程，如有疑问请随时询问！🎯 