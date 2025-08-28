<execution>
  <constraint>
    ## 客观技术限制
    - **DPML语法约束**：必须遵循EBNF定义的标签语法结构
    - **XML格式要求**：标签必须正确闭合，属性值必须用双引号包围
    - **文件编码**：必须使用UTF-8编码
    - **PromptX系统集成**：必须与ResourceManager和promptx命令兼容
  </constraint>

  <rule>
    ## 强制性编写规则
    - **纯XML结构**：文件必须从根标签开始，不得包含任何XML结构外的内容
    - **文件纯净性**：除了标签结构外，不得包含任何其他内容
    - **引用规范性**：使用@!引用时必须遵循resource协议语法
    - **镜像结构约束**：用户资源必须遵循`.promptx/resource/role/`结构
  </rule>

  <guideline>
    ## 编写指导原则
    - **简洁性原则**：保持文件的简洁和清晰，避免冗长内容
    - **模块化思维**：将具体内容抽离到独立文件中
    - **可维护性**：通过引用机制实现内容的独立维护和复用
    - **一致性维护**：同一项目中保持DPML使用风格一致
  </guideline>

  <process>
    ## 通用DPML编写流程
    
    ### Step 1: 分析元素类型
    ```mermaid
    graph TD
        A[DPML元素] --> B{元素类型}
        B -->|role| C[三组件架构<br/>personality/principle/knowledge]
        B -->|thought| D[四种思维模式<br/>exploration/challenge/reasoning/plan]
        B -->|execution| E[五层优先级<br/>constraint→rule→guideline→process→criteria]
        B -->|resource| F[三组件定义<br/>location/params/registry]
    ```
    
    ### Step 2: 应用元素模板
    
    #### Role元素模板
    ```xml
    <role>
      <personality>@!thought://base + 角色特定内容</personality>
      <principle>@!execution://specific</principle>
      <knowledge>@!knowledge://domain</knowledge>
    </role>
    ```
    
    #### Thought元素模板
    ```xml
    <thought>
      <exploration>发散性思考内容</exploration>
      <challenge>批判性思考内容</challenge>
      <reasoning>系统性推理内容</reasoning>
      <plan>结构化计划内容</plan>
    </thought>
    ```
    
    #### Execution元素模板
    ```xml
    <execution>
      <constraint>客观限制条件</constraint>
      <rule>强制性规则</rule>
      <guideline>指导原则</guideline>
      <process>执行步骤</process>
      <criteria>评价标准</criteria>
    </execution>
    ```
    
    #### Resource元素模板
    ```xml
    <resource protocol="协议名">
      <location>EBNF路径定义</location>
      <params>参数表格定义</params>
      <registry>资源映射表</registry>
    </resource>
    ```
    
    ### Step 3: 内容组织最佳实践
    
    ```mermaid
    flowchart LR
        A[用户需求] --> B[选择元素类型]
        B --> C[应用对应模板]
        C --> D{内容复杂度}
        D -->|简单| E[直接内容]
        D -->|复杂| F[@!引用机制]
        E --> G[质量检查]
        F --> G
        G --> H[交付使用]
    ```
    
    ### Step 4: 质量检查清单
    - ☐ XML语法正确，标签闭合
    - ☐ 符合元素类型的语义要求
    - ☐ 引用路径有效可达
    - ☐ 文件结构清晰简洁
    - ☐ 与系统集成正常
  </process>

  <criteria>
    ## 通用质量标准
    
    ### 格式合规性
    - ✅ 文件从根标签直接开始
    - ✅ XML语法完全正确
    - ✅ 子标签符合元素规范
    - ✅ 引用格式标准
    
    ### 内容质量
    - ✅ 语义清晰准确
    - ✅ 逻辑结构合理
    - ✅ 信息密度适中
    - ✅ 可操作性强
    
    ### 系统集成
    - ✅ ResourceManager可发现
    - ✅ promptx命令可激活
    - ✅ 引用关系有效
    - ✅ 性能表现良好
  </criteria>
</execution> 