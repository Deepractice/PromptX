<execution>
  <process>
    ## V1→V2 迁移工作流

    ### Step 1: 读取V1角色
    - 通过 action 工具激活 V1 角色（version: "v1"），或由用户提供角色内容
    - 加载全部资源：roleResources: "all"
    - 记录 personality、principle、knowledge 三层内容

    ### Step 2: 分析映射方案
    - 提取 personality 中的核心身份描述 → 准备 born source
    - 分类 thought 引用：融入 persona vs 独立 voice
    - 分类 execution 引用：duty vs knowledge
    - 分类 knowledge 引用：过滤通用知识，保留专有知识
    - 向用户展示映射方案，确认后继续

    ### Step 3: 创建V2角色
    - action 工具 born：用整合后的 persona 描述创建角色
    - learning 工具 synthesize type=voice：迁移有独立价值的 thought（传入 role 参数指定目标角色）
    - learning 工具 synthesize type=knowledge：迁移专有知识（传入 role 参数指定目标角色）
    - learning 工具 synthesize type=experience：迁移关键执行经验（传入 role 参数指定目标角色）
    - ⚠️ 关键：synthesize 的 role 参数是目标角色名（接收知识的角色），无需先 activate

    ### Step 4: 组织安排（可选）
    - 使用 organization 工具：
    - hire(name, org)：角色加入组织
    - establish(name, source, org)：创建职位（职位名必须是"角色名+岗位"格式）
    - appoint(name, position, org)：任命到职位（position 必须与 establish 的 name 完全一致）

    ### Step 5: 验证
    - action 工具 identity 查看角色完整身份，确认所有 feature 已写入
    - 与 V1 原始内容对比，确认核心特质保留
    - 如有缺失，补充 learning 工具 synthesize
  </process>

  <rule>
    - learning 工具 synthesize 的 role 参数是目标角色名（接收知识的角色），无需先 activate
    - IF V1角色有大量thought THEN 整合为精炼的persona，不要逐个迁移
    - IF knowledge是通用知识 THEN 不迁移（AI已具备）
    - IF execution是标准流程 THEN 映射为duty；IF是领域知识 THEN 映射为knowledge
    - 迁移前必须向用户确认映射方案
    - ⚠️ 职位命名规范：organization 工具 establish 创建职位时，name 必须是"角色名+岗位"格式（如"产品经理岗位"）
    - ⚠️ organization 工具 appoint 任命时，position 参数必须与 establish 的 name 完全一致
    - 验证方式：用 organization 工具 directory 检查 members 列表，而不是只看命令返回值
  </rule>
</execution>
