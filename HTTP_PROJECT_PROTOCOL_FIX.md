# HTTP版本@project协议修复实现文档

## 问题背景

GitHub Issue #133 报告了HTTP版本远程部署时@project协议路径错误的问题。当PromptX HTTP版本部署在真正的远程服务器上时，会出现以下问题：

1. **记忆存储位置错误** - 用户记忆被存储在远程服务器而非用户本地
2. **项目级工具无法访问** - 远程服务器无法访问用户本地的项目资源
3. **工作目录上下文丢失** - 远程服务器无法获取用户的真实工作目录

## 解决方案设计

### 核心思路
**基于Transport的协议分层解析** + **项目空间映射机制**

### 技术实现

#### 1. Transport感知机制
在`ProjectProtocol.js`中添加transport检测：

```javascript
async resolvePath(resourcePath, queryParams) {
  // 🎯 检测当前项目的transport模式
  const currentProject = ProjectManager.getCurrentProject()
  const { transport } = currentProject
  
  if (transport === 'http') {
    return await this.resolveHttpPath(resourcePath, queryParams, currentProject)
  } else {
    return this.resolveLocalPath(resourcePath, queryParams, currentProject)
  }
}
```

#### 2. 项目空间映射机制
HTTP模式下将@project协议映射到用户目录的项目空间：

```javascript
async resolveHttpPath(resourcePath, queryParams, currentProject) {
  // 🎯 使用projectHash作为目录名
  const projectHash = this.generateProjectHash(currentProject.workingDirectory)
  
  // 映射路径：@project://path → @user://.promptx/project/{projectHash}/path
  const mappedPath = `.promptx/project/${projectHash}/${resourcePath}`
  
  // 委托给UserProtocol处理
  return await this.userProtocol.resolvePath(mappedPath, queryParams)
}
```

#### 3. Hash目录结构管理
重构`ProjectManager`使用Hash目录结构：

```
~/.promptx/project/
├── {projectHash}/                     # 项目Hash目录
│   ├── mcp-{transport}-{id}-{ide}-{project}-{hash}.json  # MCP配置文件
│   └── .promptx/                      # HTTP模式项目数据
│       ├── memory/                    # 项目记忆
│       └── resource/                  # 项目资源
```

#### 4. 项目空间自动初始化
在项目注册时自动创建必要的目录结构：

```javascript
// 🎯 确保Hash目录和.promptx子目录存在
await fs.ensureDir(projectConfigDir)
await fs.ensureDir(path.join(projectConfigDir, '.promptx'))
await fs.ensureDir(path.join(projectConfigDir, '.promptx', 'memory'))
await fs.ensureDir(path.join(projectConfigDir, '.promptx', 'resource'))
```

## 实现效果

### ✅ 完美的协议兼容性
- **本地模式**: @project直接解析到项目目录（现有行为）
- **HTTP模式**: @project映射到用户目录的项目空间

### ✅ 安全的数据隔离
- 所有项目数据都在用户目录下，不会泄露到服务器
- 使用projectHash确保项目间完全隔离

### ✅ 统一的项目管理
- 同一项目的所有MCP配置文件和数据都在一个Hash目录下
- 便于查看项目的IDE/transport绑定情况

### ✅ 透明的用户体验
- 对用户来说，@project协议的使用方式完全不变
- 自动处理本地/远程的差异

## 测试验证

### 功能测试
创建了两个测试脚本验证实现：

1. **`test-http-project-protocol.js`** - 验证基本路径解析和目录结构
2. **`test-http-content-loading.js`** - 验证内容读写和目录操作

### 测试结果
```
✅ HTTP模式路径解析正确
✅ 项目Hash目录创建成功  
✅ .promptx子目录结构创建成功
✅ 本地模式路径解析正确
✅ HTTP模式内容加载成功
✅ HTTP模式目录列表功能正常
✅ HTTP模式资源文件处理正常
✅ 正确处理不存在文件的情况
```

## 文件修改清单

### 核心文件
1. **`src/lib/core/resource/protocols/ProjectProtocol.js`**
   - 添加transport感知机制
   - 实现HTTP模式路径映射
   - 集成UserProtocol处理

2. **`src/lib/utils/ProjectManager.js`**
   - 重构为Hash目录结构
   - 自动创建项目空间
   - 更新所有配置管理方法

### 测试文件
1. **`test-http-project-protocol.js`** - 基础功能测试
2. **`test-http-content-loading.js`** - 内容操作测试

## 部署说明

### 对现有用户的影响
- **功能完全正常**: 所有@project协议功能在HTTP模式下正常工作
- **操作简单**: 重新运行`promptx init`命令即可获得新结构
- **体验一致**: 本地和HTTP模式的API使用完全相同

### 切换方式
```bash
# 用户只需要重新init当前项目即可
promptx init
```

## 技术价值

这个解决方案既解决了HTTP模式的技术问题，又保持了架构的优雅和统一，是现代分布式应用设计的典型示范：

1. **协议透明** - 用户无需关心底层transport差异
2. **数据安全** - 用户数据始终在本地管理
3. **架构优雅** - 通过委托模式复用现有组件
4. **扩展性强** - 为未来支持更多transport类型奠定基础

---

**实施日期**: 2025-07-08  
**分支**: `feature/fix-http-project-protocol`  
**状态**: 实施完成，测试通过