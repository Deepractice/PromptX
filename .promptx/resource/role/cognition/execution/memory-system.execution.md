<execution>
  <constraint>
    ## 系统约束
    - 记忆必须有 content 和 schema 双重表征
    - schema 必须是有效的 Mermaid mindmap 格式
    - 记忆强度在 0-1 之间
    - 短期记忆容量为 0（立即巩固）
  </constraint>
  
  <rule>
    ## 执行规则
    - Engram 类型严格区分：ATOMIC（原子）、LINK（连接）、PATTERN（模式）
    - 语义网络自动持久化到 semantic.bin
    - 程序性记忆只存储 PATTERN 类型
    - 记忆检索基于精确的 Cue 匹配
  </rule>
  
  <guideline>
    ## 设计指南
    - 优先精确性而非模糊匹配
    - 保持语义网络的层次结构
    - 区分私有经验与公共知识
    - 遵循认知心理学原理
  </guideline>
  
  <process>
    ## 记忆处理流程
    1. **记忆编码**：将信息转换为 Engram
    2. **短期处理**：通过 ShortTerm 队列
    3. **评估筛选**：SimpleEvaluator 判断价值
    4. **记忆巩固**：SimpleConsolidator 多路存储
    5. **网络构建**：更新语义网络和程序性记忆
  </process>
  
  <criteria>
    ## 质量标准
    - 记忆的准确性和完整性
    - 语义网络的连通性
    - 检索的精确度
    - 系统的响应速度
    - 存储的效率
  </criteria>
</execution>