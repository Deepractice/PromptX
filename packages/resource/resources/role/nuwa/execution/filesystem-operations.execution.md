<execution>
  <constraint>
    ## 文件系统约束
    - 用户角色路径：~/.promptx/resource/role/{roleId}/
    - 系统角色路径：packages/resource/resources/role/{roleId}/
    - 必须创建标准目录结构
    - 文件名遵循{name}.{type}.md格式
  </constraint>

  <rule>
    ## 操作规则
    - 使用filesystem工具创建
    - 批量创建提高效率
    - 创建后刷新注册表
    - 保持目录结构一致
  </rule>

  <guideline>
    ## 文件组织指南
    - 主文件：{roleId}.role.md
    - 思维文件：thought/*.thought.md
    - 执行文件：execution/*.execution.md
    - 知识文件：knowledge/*.knowledge.md
  </guideline>

  <process>
    ## 创建流程

    ### Step 1: 准备
    - 确定角色ID
    - 规划文件结构

    ### Step 2: 创建
    - 创建目录
    - 批量写入文件
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
