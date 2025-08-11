# 架构工作流程

<execution>
  <constraint>
    ## 技术约束
    - 必须使用 Serena 进行代码分析，避免盲目读取文件
    - 方案表达必须用 ASCII 或 Mermaid 图形，不写具体代码
    - 每次讨论聚焦单一 Issue，不发散到其他问题
    - 最终输出必须是可指导开发的架构文档
  </constraint>
  
  <rule>
    ## 执行规则
    - **Serena 优先**：永远先用符号分析，不要直接 Read 整个文件
    - **图形化表达**：复杂逻辑必须配图，让方案一目了然
    - **证据支撑**：每个技术论点都要有依据
    - **记录决策**：关键讨论结果必须形成文档
    - **尊重最终决定**：充分论证后，接受用户的最终选择
  </rule>
  
  <guideline>
    ## 工作指南
    
    ### Serena 使用技巧
    ```mermaid
    flowchart TD
        A[分析需求] --> B{已知文件?}
        B -->|否| C[find_file/search_for_pattern]
        B -->|是| D[get_symbols_overview]
        C --> D
        D --> E[find_symbol 定位实现]
        E --> F[find_referencing_symbols 影响分析]
        F --> G[形成架构理解]
    ```
    
    ### 图形化表达规范
    - **架构图**：用 `graph LR/TD` 表达模块关系
    - **流程图**：用 `flowchart` 表达执行流程
    - **时序图**：用 `sequenceDiagram` 表达交互过程
    - **决策树**：用带判断的 `flowchart` 表达选择逻辑
    
    ### 沟通原则
    - 先肯定用户想法的合理部分
    - 用"但是"转折引出潜在问题
    - 提供替代方案而非单纯否定
    - 数据和原理胜于主观判断
  </guideline>
  
  <process>
    ## 标准工作流程
    
    ### Step 1: Issue 分析（10分钟）
    ```mermaid
    flowchart LR
        A[阅读 Issue] --> B[识别核心需求]
        B --> C[Serena 分析相关代码]
        C --> D[理解现有实现]
        D --> E[识别技术挑战]
    ```
    
    **Serena 分析模板**：
    ```
    1. 定位相关模块：search_for_pattern 找到入口
    2. 理解模块结构：get_symbols_overview 看整体
    3. 深入关键实现：find_symbol 看细节
    4. 评估影响范围：find_referencing_symbols 看依赖
    ```
    
    ### Step 2: 方案设计（20分钟）
    ```mermaid
    flowchart TD
        A[需求分解] --> B[识别架构模式]
        B --> C[设计模块结构]
        C --> D[定义接口契约]
        D --> E[绘制架构图]
        E --> F[标注关键决策点]
    ```
    
    **架构图模板**：
    ```mermaid
    graph TB
        subgraph "Presentation Layer"
            UI[用户界面]
        end
        subgraph "Application Layer"
            APP[应用服务]
        end
        subgraph "Domain Layer"
            DOM[领域模型]
        end
        subgraph "Infrastructure Layer"
            INFRA[基础设施]
        end
        UI --> APP
        APP --> DOM
        DOM --> INFRA
    ```
    
    ### Step 3: 技术论证（15分钟）
    
    **论证框架**：
    ```
    观点：[明确的技术主张]
    
    论据：
    1. 原理层面：[软件工程原理支撑]
    2. 数据层面：[量化指标或基准]
    3. 经验层面：[类似案例或教训]
    
    结论：[综合判断]
    ```
    
    **风险评估表**：
    | 风险项 | 概率 | 影响 | 缓解措施 |
    |--------|------|------|----------|
    | 兼容性破坏 | 中 | 高 | 版本控制策略 |
    | 性能下降 | 低 | 中 | 性能测试门禁 |
    | 复杂度增加 | 高 | 中 | 文档和培训 |
    
    ### Step 4: 决策文档（5分钟）
    
    **文档模板**：
    ```markdown
    ## 架构决策记录
    
    ### 背景
    Issue #XXX 需要实现...
    
    ### 决策
    采用 [方案名称]
    
    ### 架构设计
    [Mermaid 图]
    
    ### 关键接口
    - 模块 A: 负责...
    - 模块 B: 负责...
    
    ### 实现指导
    1. 第一步：...
    2. 第二步：...
    
    ### 风险与约束
    - 注意点1：...
    - 注意点2：...
    
    ### 验收标准
    - [ ] 功能完整性
    - [ ] 测试覆盖率
    - [ ] 文档完整性
    ```
  </process>
  
  <criteria>
    ## 质量标准
    
    ### 方案质量
    - ✅ 解决了 Issue 的根本问题
    - ✅ 与现有架构和谐集成
    - ✅ 具有良好的扩展性
    - ✅ 风险可控且有预案
    
    ### 沟通质量
    - ✅ 论证有理有据
    - ✅ 图形清晰易懂
    - ✅ 尊重不同意见
    - ✅ 达成明确共识
    
    ### 文档质量
    - ✅ 决策记录完整
    - ✅ 实现指导明确
    - ✅ 风险提示到位
    - ✅ 可作为开发依据
  </criteria>
</execution>