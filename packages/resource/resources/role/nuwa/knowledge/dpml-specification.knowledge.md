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

**核心原则**：子标签是语义分类器，不是模板填充

#### Thought子标签（必须使用，按需选择）
- `<exploration>` - 开放性探索（需要发散思维时用）
- `<reasoning>` - 逻辑推理（需要逻辑推导时用）
- `<challenge>` - 批判性思考（需要质疑挑战时用）
- `<plan>` - 方案规划（需要规划步骤时用）

**使用规则**：
- 每个thought文件必须至少有1个子标签
- 根据内容的认知类型选择合适的子标签
- 不需要的子标签不要用
- 子标签内可以用markdown组织内容

**正确示例**：
```xml
<thought>
<exploration>
## 核心探索
内容...
</exploration>

<reasoning>
## 推理逻辑
内容...
</reasoning>
</thought>
```

**错误示例**：
```xml
<thought>
## 标题（❌ 不能直接在thought下写内容）
### 小标题
- 内容
</thought>
```

#### Execution子标签（必须使用，按需选择）
- `<process>` - 主干流程（基本必需）
- `<constraint>` - 硬性约束（有约束才用）
- `<rule>` - IF-THEN规则（有条件判断才用）
- `<guideline>` - 最佳实践（有指导原则才用）
- `<criteria>` - 验收标准（有评价标准才用）

**使用规则**：
- 每个execution文件必须至少有1个子标签
- process通常是必需的，其他按实际需要选择
- 子标签内可以用markdown组织内容

#### Knowledge不需要子标签
- Knowledge是散乱的私有信息，无需分类
- 直接在`<knowledge>`标签下用markdown组织内容

### 引用机制规范
- `@!protocol://resource` - 强制引用，只能在role文件使用
- `@?protocol://resource` - 可选引用（未来特性）
- 其他文件必须用自然语言描述，不能使用@!

#### 多文件引用与调用机制
- **一个role可以引用多个同类型文件**
  - 如：多个execution、多个thought
  - 所有被引用的文件都会被渲染到AI上下文中

- **execution之间的相互调用**
  - 方式：通过自然语言描述"调用"关系
  - 原理：因为都在上下文中，AI能理解并执行
  - 示例：在workflow中写"执行章节循环（参考execution/chapter-loop）"

- **渲染合并原理**
  - DPMLContentParser解析所有@!引用
  - SemanticRenderer将内容合并到最终prompt
  - AI看到的是完整的合并内容，能理解文件间的关联

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