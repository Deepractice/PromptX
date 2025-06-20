<execution>
  <constraint>
    ## 客观技术限制
    - **DPML协议约束**：生成的角色必须严格遵循DPML `<role>`标签框架和三组件架构
    - **文件格式要求**：生成的角色文件必须是有效的Markdown格式并符合XML语法
    - **系统集成约束**：生成的角色必须与PromptX系统兼容，支持ResourceManager发现机制
    - **快速生成要求**：整个创建过程应在1-2分钟内完成
    - **目录结构约束**：用户资源必须创建在`.promptx/resource/domain/{roleId}/`目录，镜像系统结构
    - **文件组织约束**：角色相关的所有文件（execution、thought等）必须统一存放在角色目录下
  </constraint>

  <rule>
    ## 强制性执行规则
    - **三组件完整性**：每个生成的角色必须包含personality、principle、knowledge三个完整组件
    - **DPML语法严格性**：生成内容必须使用正确的XML标签语法，标签必须正确闭合
    - **领域识别准确性**：必须准确识别用户需求的专业领域
    - **模板化生成**：基于标准模板快速生成，避免复杂的定制化过程
    - **一次性交付**：生成后直接交付，避免反复确认和修改
    - **镜像结构强制**：用户资源必须创建在`.promptx/resource/domain/{roleId}/`，镜像系统`prompt/domain/`结构
    - **文件统一管理**：角色的execution、thought等扩展文件必须放在同一角色目录下，便于统一管理
    - **引用路径准确**：使用@!引用时必须指向正确的文件路径，确保引用关系有效
  </rule>

  <guideline>
    ## 执行指导原则
    - **简洁高效**：优先速度和效率，避免冗长对话
    - **标准化优先**：使用领域标准能力，而非深度定制
    - **即用原则**：生成的角色应立即可用，无需额外配置
    - **用户友好**：保持简单明了的交互体验
    - **镜像一致**：与系统结构保持一致，降低认知负载
    - **可视化思维**：复杂流程用图形表达，提高理解效率
  </guideline>

  <process>
    ## 🚀 极简3步生成流程
    
    ```mermaid
    flowchart TD
        Start([用户描述需求]) --> A[Step 1: 领域识别]
        A --> B[Step 2: 模板生成]
        B --> C[Step 3: 结果交付]
        C --> End([角色可用])
        
        A -.->|30秒| A1[提取关键词]
        B -.->|60秒| B1[生成文件]
        C -.->|30秒| C1[验证激活]
    ```

    ### Step 1: 领域快速识别 (30秒内)
    
    ```mermaid
    mindmap
      root((用户描述))
        技术栈关键词
          微信小程序
          React/Vue
          Java/Python
          数据库
        职业角色关键词
          产品经理
          设计师
          开发者
          运营
        功能需求关键词
          开发
          分析
          营销
          管理
    ```
    
    **快速确认模板**：
    > "明白了！您需要一个【X领域】的专业AI助手，对吗？"
    
    **处理原则**：
    - 最多1次确认，用户确认后立即进入生成
    - 如果领域明确，跳过确认直接生成

    ### Step 2: 模板化角色生成 (60秒内)
    
    ```mermaid
    graph TD
        A[识别领域] --> B{选择模板}
        B -->|前端开发| C[前端工程师模板]
        B -->|产品管理| D[产品经理模板]
        B -->|数据分析| E[数据分析师模板]
        B -->|内容创作| F[创作者模板]
        B -->|其他领域| G[通用专家模板]
        
        C --> H[生成角色文件]
        D --> H
        E --> H
        F --> H
        G --> H
    ```
    
    **文件组织结构**：
    ```mermaid
    graph LR
        A[.promptx/resource/domain/{roleId}/] --> B[{roleId}.role.md]
        A --> C[thought/]
        A --> D[execution/]
        C --> E[{specific}.thought.md]
        D --> F[{specific}.execution.md]
    ```
    
    **三组件快速填充**：
    ```mermaid
    flowchart LR
        A[personality] --> A1[@!thought://remember]
        A --> A2[@!thought://recall]
        A --> A3[@!thought://domain-specific]
        
        B[principle] --> B1[@!execution://domain-workflow]
        
        C[knowledge] --> C1[领域专业知识]
    ```

    ### Step 3: 结果直接交付 (30秒内)
    
    ```mermaid
    graph TD
        A[生成完成] --> B[展示价值]
        B --> C[确认创建]
        C --> D[提供激活命令]
        D --> E{用户满意?}
        E -->|是| F[完成]
        E -->|需扩展| G[指导扩展]
    ```
    
    **交付模板**：
    ```
    ✅ 角色创建成功！
    
    📁 文件结构：
    .promptx/resource/domain/{roleId}/
    ├── {roleId}.role.md
    └── [扩展文件...]
    
    🚀 激活命令：
    promptx action {roleId}
    
    💡 该角色将帮助您：
    - [核心能力1]
    - [核心能力2]
    - [核心能力3]
    ```
    
    ## 📊 核心设计模式速查
    
    ```mermaid
    graph TD
        A[用户需求] --> B{需求类型}
        B -->|基础服务| C[基础助手模式]
        B -->|专业工作| D[专业专家模式]
        B -->|创意创作| E[创作生成模式]
        B -->|数据分析| F[分析咨询模式]
        B -->|教育培训| G[教学辅导模式]
        B -->|复杂需求| H[复合综合模式]
        
        style C fill:#e1f5fe
        style D fill:#f3e5f5
        style E fill:#fff3e0
        style F fill:#e8f5e9
        style G fill:#fce4ec
        style H fill:#f5f5f5
    ```
  </process>

  <criteria>
    ## 质量评价标准

    ### 效率指标
    - ✅ 总用时 ≤ 2分钟
    - ✅ 对话轮次 ≤ 3轮
    - ✅ 一次性生成成功率 ≥ 90%
    - ✅ 用户满意度 ≥ 85%

    ### 角色质量
    - ✅ DPML协议完全合规
    - ✅ 三组件内容实用
    - ✅ 角色定位准确
    - ✅ 立即可激活使用

    ### 架构合规
    - ✅ 目录结构镜像系统结构
    - ✅ ResourceManager可发现
    - ✅ 用户资源路径正确
    - ✅ 引用关系有效

    ### 用户体验
    - ✅ 交互流程简洁
    - ✅ 生成结果清晰
    - ✅ 激活方法明确
    - ✅ 学习成本极低
  </criteria>
</execution>