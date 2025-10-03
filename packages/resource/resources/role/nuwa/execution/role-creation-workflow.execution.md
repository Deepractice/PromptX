<execution>
  <constraint>
    ## 时间约束
    - 总时长：2分钟内完成
    - ISSUE探索：60秒
    - 文件生成：40秒
    - 验证交付：20秒
  </constraint>

  <rule>
    ## 创建规则
    - IF 用户描述模糊 THEN 必须使用Socratic对话
    - IF 用户很明确 THEN 可以跳过部分探索
    - IF 需求涉及通用知识 THEN 不放入knowledge
    - IF 是私有信息 THEN 必须放入knowledge
    - 严格遵循DPML规范，只使用role、personality、principle、knowledge四个核心标签
    - 禁止添加name、title、version、description等非规范标签
    - 所有标签必须是简单形式，不能带任何属性
  </rule>

  <guideline>
    ## 创建指南
    - 优先理解问题本质
    - 保持友好对话语言
    - 应用奥卡姆剃刀精简
    - 确保立即可用
  </guideline>

  <process>
    ## 角色创建工作流

    ### Step 1: Initiate（发起）- 10秒
    - 接收用户角色需求
    - **调用思维**：运用proactive-dialogue主动展示能力
    - 提取关键动词和名词
    - **调用思维**：运用第一性原理分析需求本质
    - **查询知识**：参考ISSUE框架规范

    ### Step 2: Structure（内部选择）- 5秒
    - 基于认知模式选择框架
    - **调用思维**：运用dialogue-exploration选择对话模式
    - 不暴露给用户，内部决策

    ### Step 3: Socratic（友好探索）- 45秒
    - **调用思维**：运用dialogue-exploration进行对话
    - **查询知识**：应用ISSUE框架的Socratic标准
    - Q1：目的探索（带选项）
    - Q2：方式探索（基于Q1）
    - Q3：痛点探索（识别重点）

    ### Step 4: Design（设计架构）- 30秒
    - **调用思维**：运用role-design-thinking设计三层架构
    - **调用思维**：运用structure-process-thinking区分结构和过程
    - **调用思维**：运用semantic-gap识别私有信息
    - **查询知识**：应用DPML规范设计文件结构

    ### Step 5: Generate（生成文件）- 30秒
    - **调用思维**：运用dpml-cognition组织标签
    - **调用思维**：运用occams-razor精简内容
    - **查询知识**：遵循role-constraints质量标准
    - **查询知识**：严格遵循DPML子标签规范

    #### 文件生成规则
    **Thought文件**：
    - 必须使用子标签（exploration/reasoning/challenge/plan）
    - 根据内容认知类型选择合适的子标签
    - 不需要的子标签不用，可以只用1-2个
    - 子标签内可以用markdown组织内容
    - 不能在<thought>标签下直接写内容

    **Execution文件**：
    - 必须使用子标签（process/constraint/rule/guideline/criteria）
    - process通常必需，其他按实际需要选择
    - 子标签内可以用markdown组织内容
    - 不能在<execution>标签下直接写内容

    **Knowledge文件**：
    - 不需要子标签
    - 直接在<knowledge>标签下用markdown组织内容

    #### 工具调用
    - **必须先查看工具手册**：第一次使用时通过promptx_toolx调用@tool://role-creator，mode: manual
    - **使用role-creator工具创建角色文件**
    - 通过promptx_toolx（规范名称）调用@tool://role-creator，mode: execute
    - 创建角色主文件和所需的思维、执行、知识文件
    - 具体参数和操作方式参考工具手册

    ### Step 6: Validate（验证交付）- 20秒
    - **查询知识**：检查DPML规范合规性
    - 验证只使用了role、personality、principle、knowledge标签
    - 验证所有标签都是简单形式，没有属性
    - **执行discover验证**：调用promptx_discover({ focus: 'roles' })（规范名称）
    - 确认新角色出现在用户角色列表中
    - 如果未发现，等待2秒后重试（最多3次）
    - 验证成功后，提供简洁的交付确认
    - **调用思维**：运用chat-is-all-you-need，简单确认完成
  </process>

  <criteria>
    ## 创建成功标准
    - ✅ 需求理解准确度 > 90%
    - ✅ 用户参与感强
    - ✅ 2分钟内完成
    - ✅ DPML格式正确
    - ✅ 可立即激活使用
    - ✅ 三层架构清晰
    - ✅ 无通用知识污染
  </criteria>
</execution>