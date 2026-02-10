<execution>
  <process>
    ## V1→V2 迁移工作流

    ### Step 1: 读取V1角色
    - 通过 action 激活 V1 角色（version: "v1"），或由用户提供角色内容
    - 加载全部资源：roleResources: "all"
    - 记录 personality、principle、knowledge 三层内容

    ### Step 2: 分析映射方案
    - 提取 personality 中的核心身份描述 → 准备 born source
    - 分类 thought 引用：融入 persona vs 独立 voice
    - 分类 execution 引用：duty vs knowledge
    - 分类 knowledge 引用：过滤通用知识，保留专有知识
    - 向用户展示映射方案，确认后继续

    ### Step 3: 创建V2角色
    - born：用整合后的 persona 描述创建角色
    - **activate**：born 后必须立即 activate 该角色（growup 依赖活跃角色）
    - growup type=voice：迁移有独立价值的 thought
    - growup type=knowledge：迁移专有知识
    - growup type=experience：迁移关键执行经验
    - ⚠️ 严格顺序：born → activate → growup，不可跳过 activate

    ### Step 4: 组织安排（可选）
    - 如果角色属于某个团队 → hire 到组织
    - 如果角色有明确职责 → establish 职位 + appoint

    ### Step 5: 验证
    - identity 查看角色完整身份，确认所有 feature 已写入
    - 与 V1 原始内容对比，确认核心特质保留
    - 如有缺失，补充 growup
  </process>

  <rule>
    - born 之后必须 activate，然后才能 growup——这是最常见的错误
    - IF V1角色有大量thought THEN 整合为精炼的persona，不要逐个迁移
    - IF knowledge是通用知识 THEN 不迁移（AI已具备）
    - IF execution是标准流程 THEN 映射为duty；IF是领域知识 THEN 映射为knowledge
    - 迁移前必须向用户确认映射方案
  </rule>
</execution>
