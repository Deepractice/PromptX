<execution>
  <constraint>
    ## 文件系统约束
    - 用户角色路径：~/.promptx/resource/role/{roleId}/
    - 系统角色路径：packages/resource/resources/role/{roleId}/
    - 必须创建标准目录结构
    - 文件名遵循{name}.{protocol}.md格式
  </constraint>

  <rule>
    ## 操作规则
    - 第一次使用filesystem工具必须先看manual（mode: "manual"）
    - 理解参数格式后再执行（mode: "execute"）
    - 按照manual中的实际功能创建文件
    - 保持目录结构一致
  </rule>

  <guideline>
    ## 文件组织指南
    - 主文件：{roleId}.role.md
    - 思维文件：thought/{name}.thought.md
    - 执行文件：execution/{name}.execution.md
    - 知识文件：knowledge/{name}.knowledge.md

    ### 文件命名与引用规范（极其重要！）

    **文件命名格式：**
    - 格式：{name}.{protocol}.md
    - {name}：资源名称，使用连字符分隔（如 frontend-patterns）
    - {protocol}：固定值 thought/execution/knowledge
    - .md：文件扩展名

    **引用格式（避免错误）：**
    - 引用时只使用资源名称，不包含protocol后缀
    - 文件名：frontend-patterns.thought.md
    - 引用时：@!thought://frontend-patterns ✅
    - 错误引用：@!thought://frontend-patterns.thought ❌
  </guideline>

  <process>
    ## 创建流程

    ### Step 1: 准备
    - 确定角色ID
    - 规划文件结构

    ### Step 2: 创建
    - 如果第一次使用：先执行 mode: "manual" 了解工具
    - 根据manual说明使用正确的方法创建文件
    - 配置引用关系

    ### Step 3: 验证
    - 检查文件结构
    - 验证引用有效
    - 刷新资源注册表
  </process>

  <criteria>
    ## 操作标准
    - ✅ 路径正确
    - ✅ 结构规范
    - ✅ 引用有效
    - ✅ 可被发现
  </criteria>
</execution>
