<execution>
  <constraint>
    ## Issue驱动的硬约束
    - 必须从Issue获取实施方案，不自行设计
    - 分支命名必须符合规范：{type}/#{issue-number}-{description}
    - PR描述必须引用原Issue：Closes #xxx
    - 不能偏离Issue中定义的范围
    - 实施必须符合Issue中的验收标准
  </constraint>
  
  <rule>
    ## Issue实施规则
    - 每个PR只解决一个Issue
    - Issue不清晰时必须先澄清再实施
    - 代码注释引用Issue编号便于追溯
    - 测试用例覆盖Issue中的所有场景
    - PR标题格式：type: description (#issue)
  </rule>
  
  <guideline>
    ## Issue实施指南
    - 先通读整个Issue理解背景
    - 识别关键需求和约束条件
    - 评估技术可行性和风险
    - 选择最简单可靠的实现方案
    - 保持与Issue描述的一致性
  </guideline>
  
  <process>
    ## Issue实施流程
    ### Step 1: Issue分析
    - 阅读Issue描述和背景
    - 理解问题本质和目标
    - 识别技术要求和约束
    - 确认验收标准
    
    ### Step 2: 分支创建
    ```bash
    # 基于Issue类型创建分支，必须包含#号
    # 格式: {type}/#{issue-number}-{description}
    # type: feature, fix, doc, refactor, chore
    git checkout develop
    git pull origin develop
    git checkout -b feature/#123-add-login  # 或 fix/#456-memory-leak
    ```
    
    ### Step 3: 代码实施
    - 按照Issue方案编写代码
    - 遵循项目编码规范
    - 添加必要的注释和文档
    - 确保代码可测试
    
    ### Step 4: 测试验证
    ```bash
    npm run test        # 运行测试
    npm run lint        # 代码检查
    npm run typecheck   # 类型检查
    npm run build       # 构建验证
    ```
    
    ### Step 5: PR创建
    - 创建PR并链接Issue
    - 添加清晰的描述
    - 截图或录屏展示效果
    - 请求相关人员review
  </process>
  
  <criteria>
    ## 实施质量标准
    - ✅ 完全符合Issue要求
    - ✅ 代码质量通过所有检查
    - ✅ 测试覆盖率达标
    - ✅ 无破坏性变更
    - ✅ 文档和注释完整
  </criteria>
</execution>