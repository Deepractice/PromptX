# Changelog

## 1.1.0

### Minor Changes

- [#239](https://github.com/Deepractice/PromptX/pull/239) [`1801695`](https://github.com/Deepractice/PromptX/commit/1801695d8330028f51c73c598ae74614438a94d0) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 添加 ES Module 支持和统一的模块加载接口 (#238)

  ## 概述

  实现了 ToolSandbox 对 ES Module 包的完整支持，通过统一的 `loadModule()` 接口自动处理不同模块类型，解决了 Issue #238 提出的问题。

  ## 主要变更

  ### ✨ 新功能

  - 🎯 新增 `loadModule()` 统一接口，自动检测包类型（CommonJS/ES Module）
  - 📦 新增 `ESModuleRequireSupport` 类处理 ES Module 检测和加载
  - 🛡️ 增强 `require()` 错误提示，引导用户使用正确的加载方式

  ### 🔧 改进

  - 修复依赖检测逻辑，支持对象格式的 `getDependencies()`
  - 处理 Node.js `createRequire` 对 ES Module 的兼容性包装
  - 主动检测并阻止 `require` 加载 ES Module 包

  ### 📚 文档

  - 新增 `docs/toolsandbox.md` 完整使用指南
  - 更新鲁班角色知识体系，包含 ES Module 和 `loadModule` 内容

  ## 解决的问题

  - ✅ 解决 Issue #238：支持 `@modelcontextprotocol/server-filesystem` 等 ES Module 包
  - ✅ 用户无需关心包的模块类型，使用统一接口即可
  - ✅ 自动处理 CommonJS 和 ES Module 的互操作性
  - ✅ 提供友好的错误提示和使用引导

  ## 测试结果

  ```
  ES Module 测试：100% 通过（8/8）
  - ✅ ES Module 包声明
  - ✅ 沙箱统一模块加载支持
  - ✅ loadModule 加载 CommonJS
  - ✅ loadModule 加载 ES Module
  - ✅ ES Module 功能测试
  - ✅ 统一接口批量加载
  - ✅ CommonJS require ES Module（正确报错）
  - ✅ require 智能错误提示
  ```

  ## 使用示例

  ```javascript
  async execute(params) {
    // 不需要关心包的类型，loadModule 会自动处理
    const lodash = await loadModule('lodash');      // CommonJS
    const chalk = await loadModule('chalk');        // ES Module
    const nanoid = await loadModule('nanoid');      // ES Module

    // 所有包都能正常工作
    const id = nanoid.nanoid();
    const colored = chalk.green('Success\!');
    const merged = lodash.merge({}, params);
  }
  ```

  ## 向后兼容

  - ✅ `importModule()` 作为 `loadModule()` 的别名保留
  - ✅ CommonJS 包仍可直接使用 `require()`
  - ✅ 现有工具无需修改

  ## 相关 Issue

  Closes #238

  ## Changeset

  需要添加 `changeset/minor` 标签，因为这是新功能。

  ***

  🤖 Generated with [Claude Code](https://claude.ai/code)

  Co-Authored-By: Claude <noreply@anthropic.com>

## 1.0.0

### Major Changes

- [#237](https://github.com/Deepractice/PromptX/pull/237) [`3b7ec16`](https://github.com/Deepractice/PromptX/commit/3b7ec16acbf06d689d781d3ade7ee84d2191fcd2) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix: 修复 ToolSandbox 对 scoped npm 包的解析问题 (#236)

  ## 📋 Summary

  修复了 ToolSandbox 在解析 scoped npm 包（如 `@modelcontextprotocol/server-filesystem@^2025.7.29`）时因使用 `split('@')` 导致的包名错误分割问题。

  ## 🔄 Changes

  ### 核心改动

  将 `getDependencies()` 方法从返回数组格式改为返回对象格式，直接与 package.json 的 dependencies 格式保持一致，从根本上避免了字符串解析问题。

  ### 文件变更

  - **src/lib/tool/ToolSandbox.js**

    - 新增对象格式支持（优先）
    - 保留数组格式兼容性（带弃用警告）
    - 使用 `lastIndexOf('@')` 解析旧格式

  - **src/lib/tool/ToolInterface.js**

    - 更新示例代码使用新的对象格式
    - 文档说明新格式规范

  - **src/lib/tool/SandboxErrorManager.js**

    - 兼容两种格式的错误处理
    - 更新错误提示使用新格式

  - **resource/role/luban/**
    - 更新工具开发相关文档
    - 所有示例改用新的对象格式

  ### 新增测试工具

  - 创建 `tool-tester` 工具用于回归测试
  - 专门测试 scoped 包的支持情况
  - 可用于后续 ToolSandbox 功能验证

  ## 🧪 Testing

  - ✅ 创建 tool-tester 测试工具
  - ✅ Scoped 包识别测试通过
  - ✅ 依赖格式验证通过
  - ✅ 向后兼容性确认

  ## 💥 Breaking Changes

  ⚠️ `getDependencies()` 方法现在应返回对象格式而非数组格式：

  **旧格式**（已弃用，但仍支持）：

  ```javascript
  getDependencies() {
    return [
      'lodash@^4.17.21',
      '@sindresorhus/is@^6.0.0'
    ];
  }
  ```

  **新格式**（推荐）：

  ```javascript
  getDependencies() {
    return {
      'lodash': '^4.17.21',
      '@sindresorhus/is': '^6.0.0'
    };
  }
  ```

  ## 🔗 Related

  - Fixes #236

  🤖 Generated with [Claude Code](https://claude.ai/code)

## 0.2.3

### Patch Changes

- [#235](https://github.com/Deepractice/PromptX/pull/235) [`17a1116`](https://github.com/Deepractice/PromptX/commit/17a111661728f160eb82a796f87942ade7bc137b) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix: 提升 ToolSandbox 工作目录到~/.promptx 层级 (#232)

  ## 概述

  解决 #232 - ToolSandbox 工作目录被硬编码限制的问题

  ## User Impact

  工具现在可以访问整个`.promptx`目录下的资源文件，不再被限制在狭小的 toolbox 子目录中。这让工具能够读取项目配置、访问资源文件、执行更复杂的文件操作。

  ## 问题描述

  之前 ToolSandbox 将所有工具的工作目录硬编码为`~/.promptx/toolbox/[tool-id]`，导致工具无法访问项目级资源文件。

  ## 解决方案

  1. **新增 ToolDirectoryManager 类**：基于协议系统统一管理工具相关目录
  2. **工作目录提升**：将 process.cwd()从 toolbox 子目录提升到`~/.promptx`
  3. **保持依赖隔离**：node_modules 仍然安装在独立的 toolbox 目录

  ## 主要改动

  - ✅ 创建`src/lib/tool/ToolDirectoryManager.js` - 目录管理器
  - ✅ 修改`src/lib/tool/ToolSandbox.js` - 使用新的目录管理器
  - ✅ 更新`src/lib/tool/SandboxIsolationManager.js` - 适配新的工作目录

  ## 测试验证

  开发了三个测试工具验证改动效果：

  ### 1. filesystem 工具

  - 验证 process.cwd()返回`~/.promptx`
  - 测试文件系统访问能力

  ### 2. project-scanner 工具

  - 验证能扫描 resource 目录
  - 测试跨目录访问能力

  ### 3. resource-manager 工具

  - 测试 CRUD 操作
  - 验证文件创建、读取、更新、删除功能

  所有测试均通过 ✅

  ## 影响范围

  - 工具可以访问整个`.promptx`目录下的资源
  - 保持向后兼容，现有工具无需修改
  - 依赖隔离机制不变，安全性得到保证

  ## 相关 Issue

  Closes #232

  🤖 Generated with [Claude Code](https://claude.ai/code)

## 0.2.2

### Patch Changes

- [#226](https://github.com/Deepractice/PromptX/pull/226) [`fc67a12`](https://github.com/Deepractice/PromptX/commit/fc67a121123b6b91e9540e0856d9dd3039c41d52) Thanks [@deepracticex7](https://github.com/deepracticex7)! - fix: 修复系统角色无法激活的问题 (#225)

  ## Summary

  修复了系统核心角色（nuwa、assistant、luban、noface、sean）无法激活的问题。

  ## 问题根因

  `PackageDiscovery.js` 中的 `_isDevelopmentMode()` 方法调用了不存在的 `directoryService.getProjectRoot()` 方法，导致：

  - 环境检测失败，返回 "unknown"
  - 无法找到包根目录
  - 系统角色无法被加载

  ## 修复内容

  - ✅ 简化 `_isDevelopmentMode()` 方法，只通过环境变量判断，移除有问题的代码
  - ✅ 优化 `_findDevelopmentRoot()` 方法，调整策略优先级并增加错误处理
  - ✅ 修复 `_findFallbackRoot()` 支持新包名 `@promptx/cli`（同时保留对 `dpml-prompt` 的支持）
  - ✅ 更新 `_isLocalInstallation()` 支持两个包名的检测

  ## Test plan

  - [x] 本地开发模式（有环境变量）：✅ 正常加载 5 个系统角色
  - [x] 本地开发模式（无环境变量）：✅ 正常加载 5 个系统角色
  - [x] 回归测试：✅ 确认修复没有影响现有功能

  Fixes #225

  🤖 Generated with [Claude Code](https://claude.ai/code)

## 0.2.1

### Patch Changes

- [#223](https://github.com/Deepractice/PromptX/pull/223) [`37ee1e5`](https://github.com/Deepractice/PromptX/commit/37ee1e5d52872c8ddf3b5a88ab53b0a8c8342a4e) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix: 修复工作流权限和发布流程

  ## 📋 测试修复后的自动版本管理系统

  ### 修复内容

  - ✅ 使用 GH_PAT 替代 GITHUB_TOKEN 解决权限问题
  - ✅ 简化发布流程，版本更新后自动发布
  - ✅ 移除 publish/\* 标签，减少复杂度

  ### 预期流程

  1. PR 创建 → auto-labeler 添加 changeset/patch 标签
  2. PR 合并 → auto-changeset 创建 changeset 并更新版本
  3. 版本更新 → npm-publisher 自动发布到对应 tag

  ### 测试点

  - [ ] auto-labeler 正确识别 fix: 前缀
  - [ ] 自动添加 changeset/patch 标签
  - [ ] 合并后创建 changeset 文件
  - [ ] 版本号自动更新
  - [ ] 触发自动发布流程

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0](https://github.com/Deepractice/PromptX/compare/v0.1.0-alpha...v0.2.0) (2025-07-10)

### ⚠ BREAKING CHANGES

- 工作流文件路径变更，需要更新相关文档
- manual 协议内容不再进行语义渲染

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>

### 📝 Documentation

- 完善社区案例分享内容 ([#93](https://github.com/Deepractice/PromptX/issues/93)) ([6207850](https://github.com/Deepractice/PromptX/commit/62078502a0a956944727a562fc419e3226753b72))

### ✨ Features

- 优化 MCP 工具提示词和角色职责分工 ([a3f1081](https://github.com/Deepractice/PromptX/commit/a3f10810cf3c4d885be9ebcceef5a6e27b177d61))
- 优化 ToolSandbox 缓存机制和参数处理 ([398c924](https://github.com/Deepractice/PromptX/commit/398c92480f41f6e51877a13582e7504848355f15))
- 在 welcome 中展示工具列表 ([62f114b](https://github.com/Deepractice/PromptX/commit/62f114b119f4a7d8e3b0a370512abbc5d7aadcab))
- 实现 manual 协议和通用资源扫描 ([75f2123](https://github.com/Deepractice/PromptX/commit/75f2123b0b8f94fa5865f49ff781efab3fbf94a9)), closes [#144](https://github.com/Deepractice/PromptX/issues/144) [#145](https://github.com/Deepractice/PromptX/issues/145)
- 添加 Repository Views 徽章优化 README 展示效果 ([#92](https://github.com/Deepractice/PromptX/issues/92)) ([21118df](https://github.com/Deepractice/PromptX/commit/21118df55fbfe4ed5012fdad235c1ccfbed9c440)), closes [#66](https://github.com/Deepractice/PromptX/issues/66) [#69](https://github.com/Deepractice/PromptX/issues/69) [#69](https://github.com/Deepractice/PromptX/issues/69) [#70](https://github.com/Deepractice/PromptX/issues/70) [#69](https://github.com/Deepractice/PromptX/issues/69) [#69](https://github.com/Deepractice/PromptX/issues/69)
- 添加 vorale2 的 Kaggle 智能体案例到社区分享 ([f45af3e](https://github.com/Deepractice/PromptX/commit/f45af3e5ae530778556d1f72d4530ebbeade06e7))
- 添加版本分支自动清理工作流 ([4c07c2b](https://github.com/Deepractice/PromptX/commit/4c07c2bd0e1fd6b882aaacbef9d0a9751d464c9b))
- 添加茵蒂克丝的压箱底提示词库到社区分享 ([143f1d0](https://github.com/Deepractice/PromptX/commit/143f1d04d663225e950a87fcfe079018cc95e44f))
- 重构版本发布流程，实现半自动化发版系统 ([89967aa](https://github.com/Deepractice/PromptX/commit/89967aa350cab34d7de7b70f76a17fdbbe330d89))
- 重构版本发布流程，实现半自动化发版系统 ([#152](https://github.com/Deepractice/PromptX/issues/152)) ([7836572](https://github.com/Deepractice/PromptX/commit/783657264ccfeca4510231e01e53288dcdfe11d1)), closes [#66](https://github.com/Deepractice/PromptX/issues/66) [#69](https://github.com/Deepractice/PromptX/issues/69) [#69](https://github.com/Deepractice/PromptX/issues/69) [#70](https://github.com/Deepractice/PromptX/issues/70) [#69](https://github.com/Deepractice/PromptX/issues/69) [#69](https://github.com/Deepractice/PromptX/issues/69)

### 🐛 Bug Fixes

- add proper permissions for version-management workflow ([78fbfe8](https://github.com/Deepractice/PromptX/commit/78fbfe871fc9a5251ccb1eded7138195c844b52b))
- 修复 alpha 版本检测的正则表达式 ([e89c07f](https://github.com/Deepractice/PromptX/commit/e89c07f7b0c42d84ec50d1ee1f3c059156c84052))
- 修复 cleanup-version-branches 工作流中的上下文引用问题 ([a9bd032](https://github.com/Deepractice/PromptX/commit/a9bd032e05e87c7869858409ab86acf9f877def0))
- 修复 GitHub Actions 工作流识别问题 ([8ee669d](https://github.com/Deepractice/PromptX/commit/8ee669d142f282056152810aa894f95a43d9488f))
- 修复 release-preview 工作流中的评论查找 bug ([8510de5](https://github.com/Deepractice/PromptX/commit/8510de5ea427eb7f605702cba00aee9ac2da5e09))
- 修复 release-preview 工作流触发条件 ([15751a3](https://github.com/Deepractice/PromptX/commit/15751a3d902ce4b44a2e950967a387c253d42d46))

## [0.1.0](https://github.com/Deepractice/PromptX/compare/v0.0.4-e4...v0.1.0) (2025-07-09)

### 📝 Documentation

- 添加社区教程与案例部分，包含基于 PromptX 架构的 MCP 工具开发实践经验 ([833b2b6](https://github.com/Deepractice/PromptX/commit/833b2b6f88d1c8327a91d4debca7d95db0050ced))

### ♻️ Code Refactoring

- 把 hello 改成 welcome ([90c4e5d](https://github.com/Deepractice/PromptX/commit/90c4e5d8ab350a8959c6c7475f34c5bf0afa75f0))
- 架构整理与代码规范化 ([0b02f33](https://github.com/Deepractice/PromptX/commit/0b02f33ae660a24a90fd276d7a44fb5f8e46758e))
- 统一资源文件结构 - 移动 package.registry.json 到 resource 目录 ([5f9fa4c](https://github.com/Deepractice/PromptX/commit/5f9fa4c92c95d49a6fe229cacb6abe0f9ead8c2e))
- 完成 domain 到 role 目录结构统一和硬编码清理 ([071138e](https://github.com/Deepractice/PromptX/commit/071138ef57d639da5270225325958ff788fcac71))
- 完成 PromptX 资源架构重构和工具系统集成 ([08d4c1d](https://github.com/Deepractice/PromptX/commit/08d4c1d194b1fce8df28b6015ba12268ad230895))
- 系统性移除 DACP 架构 - 简化框架专注[@tool](https://github.com/tool)协议 ([b18983b](https://github.com/Deepractice/PromptX/commit/b18983bdace5aa5e0ef56e40200c506de8032401))
- 优化 DACP 工具提示词，去除诱导性描述 ([320fe9e](https://github.com/Deepractice/PromptX/commit/320fe9e55268a291764cd4cf9812298f0437e942))
- 整合 MCP 命令到 mcp 目录 - 优化项目结构 ([8452eb4](https://github.com/Deepractice/PromptX/commit/8452eb4ec5b244d76684c97e725a436ee05a59a5))
- 重构/prompt/目录为/resource/ - 更符合资源引用协议语义 ([54b77e7](https://github.com/Deepractice/PromptX/commit/54b77e709698aef79281197503ceae57a2e9220c))
- 重构社区章节和案例展示 ([4f84120](https://github.com/Deepractice/PromptX/commit/4f84120861db7fcaa5c005f6649e9513d637219c))
- 重构 MCPOutputAdapter 到 mcp 目录 - 优化代码组织结构 ([7964cf8](https://github.com/Deepractice/PromptX/commit/7964cf8dba7addf937303f852af23ceeb61e0924))
- 重构 PromptXToolCommand 为 ToolCommand 并移至标准目录 ([e54550a](https://github.com/Deepractice/PromptX/commit/e54550a835806ab89dc2ad74238a338cc08f0fe1))
- 重构 resource/domain 为 resource/role - 提升目录语义化 ([559c146](https://github.com/Deepractice/PromptX/commit/559c146af1d9ff979dd557a9237a3c0f0ffd7a39))

### 🐛 Bug Fixes

- 更新 pnpm-lock.yaml 以匹配 DACP 依赖，解决 CI 中--frozen-lockfile 的错误 ([6e4747e](https://github.com/Deepractice/PromptX/commit/6e4747e54d9b5a00496eee1fb241a32a17ea079a))
- 恢复 ProjectDiscovery 完整逻辑解决角色发现失效问题 ([0eedaa5](https://github.com/Deepractice/PromptX/commit/0eedaa517d3f2aaec9b969eee1f00acc7c492ea7)), closes [#135](https://github.com/Deepractice/PromptX/issues/135)
- 简化 Views 徽章为 username=PromptX ([ee667ba](https://github.com/Deepractice/PromptX/commit/ee667ba0e372598da79e8857c662f6f329b17ba1))
- 鲁班工具开发体验优化 - 五组件架构升级与智能错误处理 ([#116](https://github.com/Deepractice/PromptX/issues/116)) ([d1d38e0](https://github.com/Deepractice/PromptX/commit/d1d38e046b1013ad189d6aada897180e027a5070)), closes [#107](https://github.com/Deepractice/PromptX/issues/107)
- 全面清理 prompt 关键词引用 - 完成 prompt→resource 重构 ([5779aa8](https://github.com/Deepractice/PromptX/commit/5779aa837cc62625d4fdb495892671be251d9ce3))
- 统一 Pouch 命令路径获取机制，解决 Issue [#69](https://github.com/Deepractice/PromptX/issues/69)记忆持久化问题 ([3762442](https://github.com/Deepractice/PromptX/commit/376244205a47d65a94dc7c63ed1ab3aa478716fb))
- 系统化优化角色输出显示，解决角色名称混淆问题 ([5181bfe](https://github.com/Deepractice/PromptX/commit/5181bfeff12ff5170ca921e010a3697950912b2c))
- 修复 这几个命令使用了废弃的项目路径定位方案 ([aed3d0f](https://github.com/Deepractice/PromptX/commit/aed3d0f1d67d1bac74795e27a6e69f688e114854))
- 修复 recall 和 learn 的 bug ([11d8c9a](https://github.com/Deepractice/PromptX/commit/11d8c9a75e5e91e4784dbebf8bae4af234f51a80))
- 修复记忆时的问题处理合并的问题 ([1cc01bf](https://github.com/Deepractice/PromptX/commit/1cc01bf1ef8acb3f3d3bf19e599da9dbefe034a8))
- 修复 Alpha Release 工作流分支配置错误 ([8f592cb](https://github.com/Deepractice/PromptX/commit/8f592cb8808b07385e1353b28a294341c5358f2e))
- 修复 DPML 格式验证问题，完善资源发现机制 ([36510b0](https://github.com/Deepractice/PromptX/commit/36510b00686c75da79bae99b6e0319d823bbf1b3))
- 修复 InitCommand 路径解析问题和优化 MCP ID 生成 ([6167bfb](https://github.com/Deepractice/PromptX/commit/6167bfbf922737eb64fea0c61c8b45854fc0609a)), closes [#49](https://github.com/Deepractice/PromptX/issues/49)
- 修复 InitCommand 项目路径识别问题，优化角色发现机制 ([ffb5b4a](https://github.com/Deepractice/PromptX/commit/ffb5b4adafed3a54be3101fb41f785be9bb221f7))
- 修复 ToolSandbox 依赖加载问题 ([07e3093](https://github.com/Deepractice/PromptX/commit/07e30935fdb965cf9245c6f28452bcb71089cd90))
- 修正 IDE 类型检测架构设计问题 ([817de6d](https://github.com/Deepractice/PromptX/commit/817de6d44322423424b286858bb58dd25f9834a3))
- 修正 Views 徽章参数，添加 repo 指定为 PromptX ([2b246de](https://github.com/Deepractice/PromptX/commit/2b246deed7366fac80cc8e9523ca46d51cfcb8c4))
- 优化女娲角色知识生成机制，解决 token 爆炸问题 ([248358e](https://github.com/Deepractice/PromptX/commit/248358e2dc4b9b559db529f18a208c524fe39af4)), closes [#108](https://github.com/Deepractice/PromptX/issues/108)

### ✨ Features

- 改进 remember 工具提示词 - 基于语义理解的智能记忆判断 ([a1a5cb3](https://github.com/Deepractice/PromptX/commit/a1a5cb3980fea41fd828498bb86be247ed3ab2c3))
- 更新女娲和 Sean 角色文档，增强角色身份、核心特质和决策框架的描述，优化内容结构，提升用户理解和使用体验。同时，更新产品哲学知识体系，明确矛盾驱动和简洁性原则的应用。 ([5e6dc85](https://github.com/Deepractice/PromptX/commit/5e6dc85f3e3acb67ef3075725fd298d36f37582b))
- 更新女娲角色创建模板 - 移除记忆引用适配新架构 ([8430774](https://github.com/Deepractice/PromptX/commit/8430774e9a40e4b96704d1d575e3706f637a2b7f)), closes [#137](https://github.com/Deepractice/PromptX/issues/137)
- 更新 DACP 演示服务，重命名服务和描述，简化功能，删除不必要的日历和文档操作，增强演示效果。同时，优化了 API 接口和 README 文档，确保用户更易于理解和使用。 ([c8f6545](https://github.com/Deepractice/PromptX/commit/c8f6545dd5e754478cfb139c72e44c88bb8596af))
- 集成 Conventional Commits 和自动版本管理系统 ([#141](https://github.com/Deepractice/PromptX/issues/141)) ([33cb636](https://github.com/Deepractice/PromptX/commit/33cb6369e18e07ee29548082d424a5848cceb22a))
- 解决工具沙箱缓存机制问题，增加 forceReinstall 参数支持 ([#114](https://github.com/Deepractice/PromptX/issues/114)) ([e414dc0](https://github.com/Deepractice/PromptX/commit/e414dc0d18f6ed94459c542e306a32bb07187874)), closes [#107](https://github.com/Deepractice/PromptX/issues/107)
- 鲁班角色开发 Excel 和 PDF 读取工具 ([d1bd0b5](https://github.com/Deepractice/PromptX/commit/d1bd0b59074e7fc1dd38e8f3bed6d24e84bb05e8))
- 全面优化社区价值体系和 README 结构 ([eaf4efe](https://github.com/Deepractice/PromptX/commit/eaf4efe8419e408ed2b33d429e72ef4a031661e4))
- 实现[@tool](https://github.com/tool)协议完整功能 - JavaScript 工具执行框架 ([40e0c01](https://github.com/Deepractice/PromptX/commit/40e0c01c5973ac2529aee299b8b2a2f95d38ad7c))
- 实现基于文件模式的灵活资源发现架构 ([67f54f8](https://github.com/Deepractice/PromptX/commit/67f54f83d12c3fdfc16d1bd511497e4a6a88d8b6))
- 实现轻量级角色激活 - 移除角色中的记忆思维引用 ([e89f6c1](https://github.com/Deepractice/PromptX/commit/e89f6c15137bb2beed2568519c2c2e70e7eee58a)), closes [#137](https://github.com/Deepractice/PromptX/issues/137) [#137](https://github.com/Deepractice/PromptX/issues/137)
- 实现 ProjectManager 多项目架构 - 第一阶段 ([13c0f2c](https://github.com/Deepractice/PromptX/commit/13c0f2c52048844e3663855bac92b29985d64021)), closes [#54](https://github.com/Deepractice/PromptX/issues/54)
- 实现 ServerEnvironment 全局服务环境管理 ([949c6dc](https://github.com/Deepractice/PromptX/commit/949c6dc813b7e2745b054503f5042f4e915e8cca))
- 添加安装成功示意图 ([dca2ff3](https://github.com/Deepractice/PromptX/commit/dca2ff31de17e9d2898b203ed1dbce90a8e5766e))
- 添加 AI 智能体记忆系统完整设计文档 ([23ffd4b](https://github.com/Deepractice/PromptX/commit/23ffd4bb04eca0e1a5a1388bf7dc809e59e737af))
- 添加 DACP 服务启动脚本和测试命令，更新相关依赖，优化配置文件路径处理 ([d16d425](https://github.com/Deepractice/PromptX/commit/d16d425fa04840e6bd9d16480f3cb57f9e5b0f3a))
- 添加 DACP 邮件发送功能，支持真实发送与 Demo 模式，增强邮件发送的配置管理和错误提示，优化用户体验。 ([50cade3](https://github.com/Deepractice/PromptX/commit/50cade3feb8112cc547e635f5ef9ab6b3f04cba2))
- 添加 Repository Views 徽章统计页面观看数 ([6087db5](https://github.com/Deepractice/PromptX/commit/6087db5d2038158c2152b333b3460321ec988b1f))
- 完成多项目架构搞糟计划 - 彻底革命性重构 ([c11d76e](https://github.com/Deepractice/PromptX/commit/c11d76e60c98d194961495b87e0a70de37cb96f2)), closes [#54](https://github.com/Deepractice/PromptX/issues/54)
- 完善记忆工具架构优化 - 统一参数结构和转换逻辑 ([ed6e30a](https://github.com/Deepractice/PromptX/commit/ed6e30a6c7287191ef136f8d72d89a5b411d2a8e))
- 项目管理架构优化与 MCP 协议增强 ([1252ed1](https://github.com/Deepractice/PromptX/commit/1252ed15bade1e7cb3e3f1c0dbf754075cb1cf67))
- 优化鲁班角色并完善 ToolSandbox 工具开发体系 ([eea46a8](https://github.com/Deepractice/PromptX/commit/eea46a8ee16bd56109c8d5054e69a055d743c588))
- 优化 HTTP 模式项目数据目录结构，将.promptx 重命名为 data ([#134](https://github.com/Deepractice/PromptX/issues/134)) ([d2cdc06](https://github.com/Deepractice/PromptX/commit/d2cdc060c00ed664b9ca79fb7a1ad12efefbb3e0)), closes [#133](https://github.com/Deepractice/PromptX/issues/133)
- 优化 IDE 类型参数设计 - 更灵活的用户体验 ([ca45a37](https://github.com/Deepractice/PromptX/commit/ca45a373d3545e2b12be79e824295178bb0a4d6a))
- 优化 remember 和 recall 工具提示词，支持 Issue [#137](https://github.com/Deepractice/PromptX/issues/137)架构升级 ([#139](https://github.com/Deepractice/PromptX/issues/139)) ([657556e](https://github.com/Deepractice/PromptX/commit/657556ec88973a28f2ab495cf7e014e0a979b61c))
- 在 MCPServerCommand 和 MCPStreamableHttpCommand 中添加'promptx_dacp'参数映射，同时在 DACPCommand 中优化参数处理逻辑，以支持数组参数的正确解析。 ([741c1f8](https://github.com/Deepractice/PromptX/commit/741c1f8f5497be57e6d9f32ecd1a476dda3dcacf))
- 智能错误提示系统 - Agent 友好的 ToolSandbox 错误处理 ([20a0259](https://github.com/Deepractice/PromptX/commit/20a02592c1122ee84ab3643f6e2163c55148d3c3))
- 重新定位产品价值主张，强化 AI 上下文工程概念 ([4aed668](https://github.com/Deepractice/PromptX/commit/4aed668a98a81b95f4c42c71ca5f4dd04620d83d))
- HTTP MCP 服务器连接性优化与 OAuth 支持 ([dcc2dd9](https://github.com/Deepractice/PromptX/commit/dcc2dd9c2e467da4fe012197aebcfa231d776e3c))
- noface 角色重命名及 file://协议路径转换优化 ([d645598](https://github.com/Deepractice/PromptX/commit/d6455987aba3476da0e2f60b4f7180b35b800f10))
