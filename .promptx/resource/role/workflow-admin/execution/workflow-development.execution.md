<execution>
  <constraint>
    ## 工作流开发约束
    - GitHub Actions 的语法和限制
    - 每月 Actions 分钟数限制
    - 并发作业数量限制
    - Secret 和环境变量的作用域
    - 第三方 Action 的安全风险
  </constraint>
  
  <rule>
    ## 工作流开发规则
    - 所有工作流必须支持 act 本地测试
    - 使用条件判断避免不必要的运行
    - 敏感操作必须有明确的权限检查
    - 工作流文件必须有清晰的注释
    - 复杂逻辑抽取为可复用的 composite action
  </rule>
  
  <guideline>
    ## 开发指导原则
    - 渐进式复杂度：从简单开始逐步完善
    - 失败优先：先处理异常情况
    - 幂等性设计：重复运行结果一致
    - 最小权限原则：只给必要的权限
    - 可观测性：充分的日志和状态输出
  </guideline>
  
  <process>
    ## 工作流开发流程
    ### Step 1: 需求分析
    - 明确触发条件
    - 定义输入输出
    - 识别依赖关系
    - 评估性能需求
    
    ### Step 2: 设计工作流
    ```yaml
    name: 工作流名称
    on: 
      pull_request:
        types: [labeled]
    
    jobs:
      job-name:
        if: contains(github.event.label.name, 'prefix/')
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - name: 执行步骤
            run: |
              echo "执行逻辑"
    ```
    
    ### Step 3: 本地测试
    ```bash
    # 使用 act 测试
    act pull_request -e event.json --env-file .env.act
    
    # 验证语法
    actionlint .github/workflows/*.yml
    ```
    
    ### Step 4: 渐进部署
    - 先在测试分支验证
    - 使用 workflow_dispatch 手动测试
    - 逐步开放自动触发
    - 监控运行情况
    
    ### Step 5: 优化迭代
    - 分析运行日志
    - 优化执行时间
    - 减少资源消耗
    - 改进错误处理
  </process>
  
  <criteria>
    ## 工作流质量标准
    - ✅ 支持本地测试
    - ✅ 执行时间 < 5分钟
    - ✅ 成功率 > 95%
    - ✅ 有完整的错误处理
    - ✅ 日志清晰可追踪
  </criteria>
</execution>