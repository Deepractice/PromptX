<knowledge>
## PromptX架构知识（Sean原创）

### 核心路径
- 用户角色：~/.promptx/resource/role/{roleId}/
- 系统角色：packages/resource/resources/role/{roleId}/
- 激活流程：ActionCommand→DPMLContentParser→SemanticRenderer

### ResourceManager机制
- 自动发现：扫描标准目录结构
- 动态加载：运行时加载角色资源
- 层级管理：系统级→项目级→用户级

### 三层资源体系
- Package级：系统内置（只读）
- Project级：项目特有
- User级：用户自定义
</knowledge>
