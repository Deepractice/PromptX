<execution>
  <constraint>
    ## DPML硬约束
    - 必须使用标准标签：role/personality/principle/knowledge
    - 标签必须正确闭合
    - 使用@!protocol://resource引用格式
    - 拒绝非标准标签如expertise/skills
  </constraint>

  <rule>
    ## DPML执行规则
    - 零容忍非标准用法
    - 三组件必须完整
    - 引用优于内嵌
    - 层次严格分离
  </rule>

  <guideline>
    ## DPML最佳实践
    - personality定义思维模式
    - principle定义行为模式
    - knowledge定义知识体系
    - 主文件保持极简
  </guideline>

  <process>
    ## DPML检查流程

    ### 格式检查
    1. XML语法验证
    2. 标签规范性
    3. 引用有效性

    ### 内容检查
    1. 层次正确性
    2. 无重复内容
    3. 引用路径存在
  </process>

  <criteria>
    ## DPML质量标准
    - ✅ 100%符合规范
    - ✅ 结构清晰
    - ✅ 易于维护
    - ✅ Token高效
  </criteria>
</execution>
