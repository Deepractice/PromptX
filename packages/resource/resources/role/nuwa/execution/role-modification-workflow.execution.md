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
    - 创建全新的角色定义文件
    - **查询知识**：遵循role-constraints要求
    - **查询知识**：符合promptx-architecture规范
    - **查询知识**：严格遵循DPML规范，只使用四个核心标签
    - 主文件命名为{roleId}.role.md
    - role标签内只包含personality、principle、knowledge三个子标签
    - 完整替换所有需要改变的组件

    ### Step 6: Replace（完整替换）- 30秒
    - 用新版本完全替换旧版本
    - 不保留旧代码的任何痕迹
    - 确保引用关系正确
    - 验证只使用了role、personality、principle、knowledge标签
    - 验证没有包含name、title、version等非规范标签
    - 验证所有标签都是简单形式，没有属性
    - 验证可激活性
    - **调用思维**：运用chat-is-all-you-need，简单确认完成，不延伸操作
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