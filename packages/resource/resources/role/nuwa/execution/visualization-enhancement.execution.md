<execution>
  <constraint>
    ## 可视化技术限制
    - **Mermaid语法约束**：必须符合Mermaid图表语法规范
    - **图形复杂度限制**：单个图形节点不超过20个，避免信息过载
    - **渲染兼容性**：确保在主流Markdown渲染器中正常显示
    - **Token效率要求**：图形表达应比文字更节省Token
  </constraint>

  <rule>
    ## 可视化应用规则
    - **语义匹配强制**：图形类型必须匹配内容语义特征
    - **复杂度阈值**：3层以上嵌套或5个以上并列项必须图形化
    - **图文互补**：图形不能完全替代文字说明，需要配合使用
    - **一图一概念**：每个图形聚焦表达一个核心概念
  </rule>

  <guideline>
    ## 可视化设计指南
    - **认知负载优先**：选择最符合人类认知习惯的图形
    - **渐进式复杂度**：从简单图形开始，逐步增加复杂度
    - **色彩克制使用**：优先使用结构表达信息，而非颜色
    - **交互暗示清晰**：流程图箭头、决策菱形等符号使用规范
  </guideline>

  <process>
    ## 智能图形选择流程
    
    ### Step 1: 内容语义分析
    ```mermaid
    graph TD
        A[分析内容] --> B{语义特征}
        B -->|发散/探索| C[mindmap]
        B -->|流程/步骤| D[flowchart] 
        B -->|决策/分支| E[graph TD]
        B -->|关系/架构| F[graph LR]
        B -->|时序/计划| G[gantt]
    ```
    
    ### Step 2: 复杂度评估矩阵
    
    | 复杂度 | 项目数 | 嵌套层级 | 处理方式 |
    |--------|--------|----------|----------|
    | 简单 | <3项 | 1层 | 保持文本 |
    | 中等 | 3-7项 | 2-3层 | 考虑图形化 |
    | 复杂 | >7项 | >3层 | 必须图形化 |
    
    ### Step 3: 场景化图形模板库
    
    #### 🧠 Thought可视化模板
    
    **Exploration（探索思维）- Mindmap**
    ```mermaid
    mindmap
      root((核心问题))
        可能性分支
          创新方案A
          创新方案B
        关联性分支
          相关概念X
          影响因素Y
        边界探索
          极限情况
          特殊场景
    ```
    
    **Reasoning（推理思维）- Flowchart**
    ```mermaid
    flowchart TD
        A[前提条件] --> B{逻辑判断}
        B -->|条件1| C[推论1]
        B -->|条件2| D[推论2]
        C --> E[综合结论]
        D --> E
    ```
    
    **Plan（计划思维）- Gantt/Timeline**
    ```mermaid
    graph LR
        A[Phase 1<br/>准备阶段] --> B[Phase 2<br/>执行阶段]
        B --> C[Phase 3<br/>验证阶段]
        C --> D[Phase 4<br/>交付阶段]
    ```
    
    **Challenge（挑战思维）- Mindmap**
    ```mermaid
    mindmap
      root((假设检验))
        风险识别
          技术风险
          业务风险
        假设质疑
          前提假设
          隐含假设
        极限测试
          边界条件
          异常场景
    ```
    
    #### ⚡ Execution可视化模板
    
    **Process（流程）- Flowchart**
    ```mermaid
    flowchart TD
        Start([开始]) --> Input[输入分析]
        Input --> Process{处理决策}
        Process -->|路径A| ActionA[执行A]
        Process -->|路径B| ActionB[执行B]
        ActionA --> Verify{验证}
        ActionB --> Verify
        Verify -->|通过| End([完成])
        Verify -->|失败| Input
    ```
    
    #### 🎯 Role设计可视化
    
    **角色选择决策树**
    ```mermaid
    graph TD
        A[用户需求] --> B{领域类型}
        B -->|技术开发| C[专业专家模式]
        B -->|内容创作| D[创作生成模式]
        B -->|数据分析| E[分析咨询模式]
        B -->|教育培训| F[教学辅导模式]
        B -->|综合需求| G[复合综合模式]
    ```
    
    ### Step 4: 图形优化检查
    
    ```mermaid
    flowchart LR
        A[生成图形] --> B{清晰度检查}
        B -->|不清晰| C[简化调整]
        B -->|清晰| D{信息完整性}
        D -->|不完整| E[补充信息]
        D -->|完整| F{美观性评估}
        F -->|需优化| G[布局调整]
        F -->|满意| H[最终输出]
        C --> B
        E --> D
        G --> F
    ```
  </process>

  <criteria>
    ## 可视化质量标准
    
    ### 语义准确性
    - ✅ 图形类型与内容语义高度匹配
    - ✅ 信息层次关系正确表达
    - ✅ 逻辑关系清晰可见
    - ✅ 核心概念突出明确
    
    ### 认知效率  
    - ✅ 一眼能理解核心概念
    - ✅ 信息密度适中不过载
    - ✅ 视觉引导路径清晰
    - ✅ 符合阅读习惯
    
    ### 技术规范
    - ✅ Mermaid语法正确
    - ✅ 渲染效果稳定
    - ✅ 跨平台兼容性好
    - ✅ 源码可读可维护
    
    ### Token经济性
    - ✅ 图形表达比文字更简洁
    - ✅ 避免冗余信息
    - ✅ 复用通用模板
    - ✅ 整体Token节省30%以上
  </criteria>
</execution> 