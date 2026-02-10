<knowledge>
  ## V1→V2 格式映射规则

  ### 结构映射

  | V1 (DPML) | V2 (RoleX) | 操作 |
  |---|---|---|
  | `<personality>` 内联文本 | persona Feature | born(name, source) |
  | `@!thought://xxx` | persona 融入 或 voice | born 或 teach(type=voice) |
  | `@!execution://xxx` | duty 或 knowledge | establish 或 teach(type=knowledge) |
  | `@!knowledge://xxx` | knowledge | teach(type=knowledge) |

  ### V1 DPML 标签体系
  - `<role>` → 根容器
  - `<personality>` → 身份+思维（含 @!thought 引用）
  - `<principle>` → 行为准则（含 @!execution 引用）
  - `<knowledge>` → 领域知识（含 @!knowledge 引用）

  ### V2 RoleX Feature 体系
  - persona.identity.feature → 角色身份（born 创建）
  - *.voice.feature → 思维模式（teach type=voice）
  - *.knowledge.feature → 领域知识（teach type=knowledge）
  - *.experience.feature → 实践经验（teach type=experience）
  - *.duty.feature → 职位职责（establish 创建）

  ### 迁移过滤规则
  - 通用知识（AI已具备）→ 不迁移
  - 角色特有的思维模式 → voice
  - 角色特有的专业知识 → knowledge
  - 标准工作流程 → duty（通过 establish）
</knowledge>
