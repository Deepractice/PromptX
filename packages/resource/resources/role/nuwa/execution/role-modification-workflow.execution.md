<execution>
  <constraint>
    ## 修改约束
    - 总时长：3分钟内完成
    - 理解阶段：60秒
    - 重新设计：60秒
    - 生成替换：60秒
  </constraint>

  <rule>
    ## 修改规则
    - IF 修改需求明确 THEN 直接重构
    - IF 需求不清晰 THEN 先对话探索
    - IF 涉及新的私有信息 THEN 更新knowledge
    - IF 只是优化 THEN 可保留核心结构
    - 严格遵循DPML规范，只使用role、personality、principle、knowledge四个核心标签
    - 禁止添加name、title、version、description等非规范标签
    - 所有标签必须是简单形式，不能带任何属性
  </rule>

  <guideline>
    ## 修改指南
    - 全量理解，不是增量
    - 大胆重构，追求最优
    - 不考虑兼容性
    - 当下最优就是标准
    - AI已知概念只留易错点，删除教科书式解释
    - 每个文件严格控制行数：thought 15-25行，execution 30-50行，knowledge 20-40行
  </guideline>

  <process>
    ## 角色修改工作流

    ### Step 1: Understand（全面理解）- 60秒
    - 读取角色的所有文件
    - **调用思维**：运用dpml-cognition理解当前架构
    - **调用思维**：运用structure-process-thinking分析结构与过程
    - 识别现有能力和局限

    ### Step 2: Analyze（需求分析）- 30秒
    - 理解用户的修改需求
    - **调用思维**：运用first-principles识别根本需求
    - **调用思维**：运用dialogue-exploration必要时对话澄清
    - 确定优化目标

    ### Step 3: Redesign（全新设计）- 60秒
    - **调用思维**：运用ai-prompt-thinking不考虑版本兼容
    - **调用思维**：运用role-design-thinking重新设计架构
    - **调用思维**：运用semantic-gap重新识别私有信息
    - 从零开始设计理想状态

    ### Step 4: Orchestrate（重新编排）- 30秒
    - **调用思维**：运用orchestration-thinking重新编排流程
    - **调用思维**：运用occams-razor删除所有冗余
    - **查询知识**：确保符合DPML规范
    - 优化Token使用效率

    ### Step 5: Generate（生成新版本）- 60秒
    - **查询知识**：遵循role-constraints要求
    - **查询知识**：符合DPML规范
    - **使用role-creator工具更新文件**
    - 通过promptx_toolx（规范名称）调用@tool://role-creator
    - 更新主文件和相关的思维、执行、知识文件
    - 删除不再需要的文件
    - 具体操作参数参考工具手册

    ### Step 6: Validate（验证替换）- 30秒
    - 验证只使用了role、personality、principle、knowledge标签
    - 验证所有标签都是简单形式
    - 确保引用关系正确
    - **执行discover验证**：调用promptx_discover({ focus: 'roles' })（规范名称）
    - 确认角色仍在列表中且可用
    - 如果未发现，等待2秒后重试（最多3次）
    - 验证成功后，提供简洁的交付确认
    - **调用思维**：运用chat-is-all-you-need，简单确认完成
  </process>

  <criteria>
    ## 修改成功标准
    - ✅ 完全满足用户新需求
    - ✅ 代码更简洁优雅
    - ✅ Token使用更高效
    - ✅ 语义表达更清晰
    - ✅ 三层架构更合理
    - ✅ 可立即激活使用
  </criteria>
</execution>