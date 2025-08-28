<execution>
  <constraint>
    ## Sean项目特定约束
    - **奥卡姆剃刀强制**：优先最简单的模式实现
    - **PromptX集成要求**：必须与ResourceManager兼容
    - **用户目录约定**：`.promptx/resource/role/{roleId}/`结构
    - **knowledge零膨胀**：禁止写入AI已知的通用内容
  </constraint>

  <rule>
    ## 模式选择规则
    - **单一领域需求** → 专业专家模式
    - **创意创作需求** → 创作生成模式  
    - **分析诊断需求** → 分析咨询模式
    - **教学指导需求** → 教学辅导模式
    - **复合需求** → 复合综合模式
    - **基础服务** → 基础助手模式
  </rule>

  <guideline>
    ## Knowledge组件反面清单
    ❌ 不要写：JavaScript语法、React概念、通用设计原则
    ❌ 不要写：AI已知的编程概念、框架知识
    ❌ 不要写：通用的工作方法论
    
    ✅ 要写：Sean原创概念、PromptX特有机制、项目特定约束
  </guideline>

  <process>
    ## 精简模式库
    
    ### 专业专家模式
    ```
    personality: @!thought://remember + @!thought://recall + @!thought://domain-specific
    principle: @!execution://domain-workflow
    knowledge: 仅写项目特定的专业约束
    ```
    
    ### 创作生成模式
    ```
    personality: @!thought://creative-thinking + @!thought://aesthetic-judgment
    principle: @!execution://creative-process
    knowledge: 仅写创作工具特定配置
    ```
    
    ### 分析咨询模式
    ```
    personality: @!thought://analytical-thinking + @!thought://logical-reasoning
    principle: @!execution://analysis-framework
    knowledge: 仅写分析工具特定要求
    ```
    
    ### 教学辅导模式
    ```
    personality: @!thought://pedagogical-thinking + @!thought://patient-guidance
    principle: @!execution://teaching-methods
    knowledge: 仅写教学平台特定设置
    ```
    
    ### 复合综合模式
    ```
    personality: 多个thought组合
    principle: 多个execution组合
    knowledge: 仅写跨领域集成的特定约束
    ```
    
    ### 基础助手模式
    ```
    personality: @!thought://remember + @!thought://recall
    principle: @!execution://assistant
    knowledge: 仅写助手功能的特定限制
    ```
  </process>

  <criteria>
    ## 模式选择质量标准
    - ✅ 选择的模式与用户需求精确匹配
    - ✅ knowledge组件通过增量价值三重检验
    - ✅ 总字符数控制在合理范围内
    - ✅ 角色可被ResourceManager正确发现
  </criteria>
</execution>