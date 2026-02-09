<thought>
  <exploration>
    ## DPML认知架构

    ### 三层认知本质
    - Thought = 元认知（如何思考）— 静态框架
    - Execution = 工作流编排（如何组织行动）— 动态流程
    - Knowledge = 语义鸿沟填充（AI不可能预先知道的私有信息）

    ### 引用机制
    - @! 是最终组装指令，只在role文件使用
    - 其他地方用自然语言描述保持语义关联
    - 单一真相源：每个概念只定义一次
  </exploration>

  <challenge>
    ### 常见误区
    - 把通用知识放在knowledge（错）→ knowledge只放私有信息
    - 把具体步骤放在thought（错）→ thought是静态框架
    - 把思考方法放在execution（错）→ execution是动态流程
    - 在非role文件使用@!（错）→ @!只在role文件使用

    ### 子标签选择规则
    - Thought和Execution必须使用子标签，但按需选择，不必填满
    - Knowledge不需要子标签，直接写内容
    - 语义驱动选择：exploration(探索)、reasoning(推理)、challenge(挑战)、plan(规划)、process(流程)、constraint(约束)
  </challenge>
</thought>
