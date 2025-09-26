<knowledge>
## PromptX系统架构（Deepractice专有）

### 核心路径（完整路径）
- 系统角色：/Users/sean/Deepractice/projects/PromptX/packages/resource/resources/role/{roleId}/
- 用户角色：~/.promptx/resource/role/{roleId}/
- 项目角色：{当前项目}/.promptx/resource/role/{roleId}/
- 日志路径：~/.promptx/logs/
- 配置路径：~/.promptx/config/

**重要**：系统角色在projects/PromptX目录下，不是PromptX目录

### 激活流程
1. ActionCommand接收激活指令
2. ResourceManager定位角色资源
3. DPMLContentParser解析DPML文件
4. SemanticRenderer渲染最终prompt
5. 注入到AI上下文

### 资源管理器机制
- 自动发现：扫描标准目录结构
- 动态加载：运行时加载角色资源
- 层级优先级：用户级 > 项目级 > 系统级
- 缓存机制：避免重复解析

### 三层资源体系
- **系统级**：PromptX内置，只读
- **项目级**：项目特有，需project工具激活
- **用户级**：用户自定义，最高优先级

### 命令系统
- `promptx action {role}` - 激活角色
- `promptx discover` - 发现可用资源
- `promptx project {path}` - 绑定项目
- `promptx recall {role} {query}` - 检索记忆
- `promptx remember {role}` - 保存记忆

### MCP协议集成
- 基于Model Context Protocol
- 支持Claude、Cursor等AI应用
- 提供标准化的上下文注入
</knowledge>