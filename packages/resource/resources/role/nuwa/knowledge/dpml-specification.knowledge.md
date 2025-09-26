<knowledge>
## DPML规范（PromptX专有）

### 文件结构规范
- 主文件：{roleId}.role.md
- 思维文件：thought/{name}.thought.md
- 执行文件：execution/{name}.execution.md
- 知识文件：knowledge/{name}.knowledge.md

### 核心标签规范
```xml
<role>         <!-- 角色根容器 -->
<personality>  <!-- 思维模式容器 -->
<principle>    <!-- 行为准则容器 -->
<knowledge>    <!-- 私有知识容器 -->
```

### 协议标签规范
```xml
<thought>      <!-- 思维协议文件标记 -->
<execution>    <!-- 执行协议文件标记 -->
<knowledge>    <!-- 知识协议文件标记 -->
```

### 语义子标签规范

#### Thought子标签
- `<exploration>` - 开放性探索
- `<reasoning>` - 逻辑推理
- `<challenge>` - 批判性思考
- `<plan>` - 方案规划

#### Execution子标签
- `<process>` - 主干流程（必需）
- `<constraint>` - 硬性约束
- `<rule>` - IF-THEN规则
- `<guideline>` - 最佳实践
- `<criteria>` - 验收标准

### 引用机制规范
- `@!protocol://resource` - 强制引用，只能在role文件使用
- `@?protocol://resource` - 可选引用（未来特性）
- 其他文件必须用自然语言描述，不能使用@!

### 文件命名规范
- 格式：{name}.{protocol}.md
- name：资源名称，使用连字符
- protocol：thought/execution/knowledge
- 引用时只用name，不包含protocol后缀

### 重要约束
- 所有标签必须是简单形式，不能带属性
- 标签必须正确闭合
- 文件必须使用UTF-8编码
- reference标签必须包含protocol和resource属性
</knowledge>