<thought>
  <exploration>
    ## DPML的认知本质

    ### 标签不是容器，是编排指令
    - 每个标签告诉系统如何组装AI的认知结构
    - 标签是语义分类器，声明内容的认知类型
    - 选择标签就是在定义"这是什么类型的认知"

    ### 三层认知架构的本质区别
    - Thought = 元认知（如何思考）
    - Execution = 工作流编排（如何组织行动）
    - Knowledge = 语义鸿沟填充（私有信息）

    ### 引用机制的设计哲学
    - @!是最终组装指令，只在role文件使用
    - 其他地方用自然语言描述保持语义关联
    - 单一真相源：每个概念只定义一次
  </exploration>

  <reasoning>
    ## 为什么这样设计DPML

    ### 分层的价值
    - 关注点分离：不同层次解决不同问题
    - 模块化复用：独立模块可跨角色复用
    - 维护性提升：修改一处，全局生效
    - Token效率：避免重复，引用优于内嵌

    ### Execution作为编排器
    - Process是主干，定义流程骨架
    - 其他标签是补丁，在主干上优化
    - 可以递归调用其他Execution
    - 编排thought和knowledge进入工作流

    ### Knowledge填补语义鸿沟
    - 不是教AI通用知识
    - 而是提供角色的私有上下文
    - 判断标准：AI不可能预先知道的信息
    - 离开上下文就失去意义的信息
  </reasoning>

  <challenge>
    ## DPML使用中的常见误区

    ### 概念混淆
    - 把通用知识放在knowledge（错）
    - 把具体步骤放在thought（错）
    - 把思考方法放在execution（错）
    - 在非role文件使用@!（错）

    ### 层次不清
    - thought和execution混在一起
    - knowledge包含公开信息
    - 违反单一真相源原则
    - 重复定义相同概念
  </challenge>

  <plan>
    ## DPML的正确使用方法

    ### 创建角色时的思考顺序
    1. 这个角色需要什么独特思维？→ thought
    2. 这个角色需要什么行为流程？→ execution
    3. 这个角色需要什么私有信息？→ knowledge

    ### 判断内容归属
    - 是"怎么想"的？→ thought
    - 是"怎么做"的？→ execution
    - 是"私有什么"的？→ knowledge

    ### 子标签选择原则
    - Thought和Execution必须使用子标签
    - 但不是填充所有子标签，而是按需选择
    - 语义驱动：内容是什么认知类型，就用什么子标签
    - 可以只用一个，也可以用多个
    - Knowledge不需要子标签，直接写内容

    ### 选择标准
    - 这段内容是探索性的？→ exploration
    - 这段内容是推理性的？→ reasoning
    - 这段内容是挑战性的？→ challenge
    - 这段内容是规划性的？→ plan
    - 这段内容是流程性的？→ process
    - 这段内容是约束性的？→ constraint
  </plan>
</thought>