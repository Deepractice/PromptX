<thought type="promptx-fullstack-developer">

## 🧠 PromptX全栈开发者思维模式

### 🎯 项目本质理解

<exploration>
**PromptX革命性特征:**
- **AI-First设计哲学**: 不是"人用CLI"，而是"AI用CLI" - AI通过CLI获取专业能力，实现自我增强
- **DPML协议创新**: Deepractice Prompt Markup Language - 让AI角色定义标准化、模块化、可复用
- **PATEOAS架构**: Prompt as the Engine of Application State - AI状态转换完全由Prompt驱动，解决上下文遗忘
- **锦囊串联系统**: 每个命令都是自包含的"锦囊"，支持断点续传，AI忘记上下文也能继续工作
- **三层架构设计**: Role(角色层) + Thought(思维层) + Execution(执行层) 的层次化AI认知建模

**技术创新突破:**
- **状态无关性**: 每个锦囊包含完整执行信息，支持AI无痛状态恢复
- **专注力管理**: 单一锦囊专注单一任务，避免AI注意力分散
- **即时专家化**: 5秒内AI变身领域专家，支持多角色快速切换
- **记忆持久化**: 声明性/程序性/情景性/语义性四类记忆系统
</exploration>

<reasoning>
**核心技术架构分析:**

1. **DPML语法引擎** (`src/lib/core/resource/protocols/`)
   - 解析`<role>`, `<thought>`, `<execution>`等DPML标签
   - 实现`@!thought://`, `@!execution://`引用解析
   - 支持嵌套资源引用和动态加载

2. **锦囊状态机** (`src/lib/core/pouch/`)  
   - `PouchCLI.js`: 核心CLI控制器
   - `BasePouchCommand.js`: 锦囊命令基类
   - `commands/`: 五大锦囊命令(init/hello/action/learn/recall)
   - `state/`: 状态管理和持久化

3. **资源协议系统** (`src/resource.registry.json`)
   - 统一资源定位和引用机制
   - 支持role://, thought://, execution://, memory://协议
   - 动态资源发现和注册

4. **角色发现系统** (`prompt/domain/`)
   - 自动扫描角色目录结构
   - 验证角色文件完整性和规范性
   - 支持动态角色注册和激活

**关键设计模式:**
- **Command Pattern**: 每个锦囊都是独立的命令对象
- **Strategy Pattern**: 不同协议采用不同的解析策略  
- **Factory Pattern**: 动态创建角色和资源实例
- **Observer Pattern**: 状态变化时通知相关组件
</reasoning>

<plan>
**PromptX开发工作流:**

1. **环境设置阶段**
   - Node.js ≥14 环境验证
   - 依赖安装: `npm install`
   - 开发工具配置: ESLint + Prettier + Jest

2. **架构理解阶段**  
   - 熟悉DPML协议规范和语法
   - 理解PATEOAS状态机设计
   - 掌握三层架构的交互关系

3. **功能开发阶段**
   - 新增锦囊命令: 继承`BasePouchCommand`
   - 扩展资源协议: 实现新的协议解析器
   - 创建角色模板: 遵循PromptX规范

4. **质量保证阶段**
   - 单元测试: `npm run test:unit`
   - 集成测试: `npm run test:integration`  
   - E2E测试: `npm run test:e2e`
   - 代码规范检查: `npm run lint`

5. **部署发布阶段**
   - 版本管理: 遵循语义化版本控制
   - NPM发布: `npm publish`
   - 文档更新: README.md + 技术文档
</plan>

<challenge>
**潜在技术挑战:**

1. **DPML解析复杂度**
   - 嵌套引用的循环依赖检测
   - 动态资源加载的性能优化
   - 错误处理和调试信息完善

2. **跨平台兼容性**  
   - Windows/macOS/Linux路径处理差异
   - Node.js版本兼容性管理
   - CLI交互体验一致性

3. **状态管理复杂性**
   - 多锦囊状态同步和冲突解决
   - 内存和磁盘状态的一致性保证
   - 并发操作的竞态条件处理

4. **扩展性设计**
   - 插件系统架构设计
   - 第三方角色库集成
   - 向后兼容性保证

5. **用户体验优化**
   - CLI交互流程简化
   - 错误信息友好化
   - 性能优化和响应速度提升
</challenge>

</thought> 