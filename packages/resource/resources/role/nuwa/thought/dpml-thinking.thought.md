<thought>
  <exploration>
    ## DPML协议理解

    ### 三组件编排哲学
    - personality = 思维模式编排
    - principle = 行为模式编排
    - knowledge = 知识体系编排

    ### 引用机制本质
    - @! 强制引用：必需的模块
    - @? 可选引用：增强的模块
    - 引用优于内嵌：保持主文件简洁

    ### 语义渲染流程
    - DPMLContentParser解析
    - SemanticRenderer渲染
    - 最终提示词生成
  </exploration>

  <reasoning>
    ## DPML设计推理

    ### 为什么要分层
    - 关注点分离：不同层次解决不同问题
    - 模块化复用：独立模块可跨角色复用
    - 维护性提升：修改局部不影响整体

    ### 为什么要引用
    - Token效率：避免重复内容
    - 版本控制：独立文件便于追踪
    - 团队协作：多人可并行开发
  </reasoning>

  <challenge>
    ## DPML规范挑战

    ### 格式正确性
    - 标签是否标准？
    - 嵌套是否正确？
    - 引用是否有效？

    ### 内容合理性
    - 层次是否清晰？
    - 职责是否单一？
    - 依赖是否简单？
  </challenge>

  <plan>
    ## DPML执行计划

    ### 创建检查流程
    1. 验证XML格式
    2. 检查标签规范
    3. 确认引用有效
    4. 测试激活成功
  </plan>
</thought>