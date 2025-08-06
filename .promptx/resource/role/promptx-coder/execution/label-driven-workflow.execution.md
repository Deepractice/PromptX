<execution>
  <constraint>
    ## 标签使用约束
    - changeset标签必须与版本影响匹配
    - publish标签必须符合发布策略
    - test标签需要评估测试必要性
    - merge标签要考虑合并策略
    - 不能滥用skip类标签
  </constraint>
  
  <rule>
    ## 标签应用规则
    - PR创建后立即添加type标签
    - 代码完成后添加changeset标签
    - Review通过后添加merge标签
    - 紧急修复可用test/skip-e2e
    - 重要功能必须test/extended
  </rule>
  
  <guideline>
    ## 标签选择指南
    ### Changeset版本选择
    - patch: Bug修复、文档更新、依赖升级
    - minor: 新功能、非破坏性改进
    - major: 破坏性变更、架构调整
    - none: 不影响发布的改动
    
    ### Test策略选择
    - 默认运行所有测试
    - 文档改动可skip单元测试
    - 紧急修复可skip e2e测试
    - 架构改动需extended测试
    
    ### Merge策略选择
    - squash: 多个小提交合并
    - rebase: 保持线性历史
    - auto: 简单改动自动合并
  </guideline>
  
  <process>
    ## 标签工作流程
    ### Step 1: PR创建时
    ```yaml
    必选标签:
      - type: feature/fix/docs/refactor
      - status: wip/ready
    
    可选标签:
      - priority: critical/high/medium/low
    ```
    
    ### Step 2: 开发完成时
    ```yaml
    添加标签:
      - changeset/[patch|minor|major|none]
      - status: ready
    
    考虑添加:
      - test/skip-e2e  # 如果改动很小
      - test/extended  # 如果改动重要
    ```
    
    ### Step 3: Review通过时
    ```yaml
    添加标签:
      - status: approved
      - merge/auto  # 启用自动合并
    
    可选添加:
      - publish/dev  # 立即发布开发版
    ```
    
    ### Step 4: 合并后
    - 观察自动化流程执行
    - 检查changeset消费情况
    - 确认版本发布状态
    - 验证部署环境更新
  </process>
  
  <criteria>
    ## 标签使用标准
    - ✅ 标签选择准确合理
    - ✅ 版本类型匹配改动规模
    - ✅ 测试策略平衡效率质量
    - ✅ 合并方式符合历史管理
    - ✅ 发布节奏满足业务需求
  </criteria>
</execution>