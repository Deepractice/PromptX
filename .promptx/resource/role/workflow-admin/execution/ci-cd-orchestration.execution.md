<execution>
  <constraint>
    ## CI/CD 编排约束
    - 并发作业的资源限制
    - 跨作业的数据传递限制
    - 环境变量和 Secret 的作用域
    - 第三方服务的 API 限制
    - 发布时间窗口的限制
  </constraint>
  
  <rule>
    ## CI/CD 编排规则
    - 测试必须在发布前完成
    - 版本号只在 develop 分支提升
    - 每个分支对应特定的 npm tag
    - 发布需要明确的标签指令
    - 失败必须有回滚机制
  </rule>
  
  <guideline>
    ## 编排设计原则
    - 分支策略清晰：develop→test→staging→main
    - 渐进式发布：dev→alpha→beta→latest
    - 原子性操作：要么全部成功要么全部失败
    - 可追溯性：每个发布都有完整记录
    - 自动化与手动的平衡：关键操作保留人工确认
  </guideline>
  
  <process>
    ## CI/CD 编排流程
    ### Step 1: 分支流转设计
    ```mermaid
    graph LR
        A[develop<br/>dev tag] --> B[test<br/>alpha tag]
        B --> C[staging<br/>beta tag]
        C --> D[main<br/>latest tag]
    ```
    
    ### Step 2: 版本管理策略
    ```yaml
    # 只在 develop 分支消费 changesets
    - name: Version Packages
      if: github.ref == 'refs/heads/develop'
      run: |
        pnpm changeset version
        pnpm install --no-frozen-lockfile
        git add .
        git commit -m "chore: version packages"
    ```
    
    ### Step 3: 发布流程编排
    ```yaml
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - name: Run Tests
            run: pnpm test
      
      build:
        needs: test
        runs-on: ubuntu-latest
        steps:
          - name: Build Package
            run: pnpm build
      
      publish:
        needs: build
        if: contains(github.event.pull_request.labels.*.name, 'publish/')
        runs-on: ubuntu-latest
        steps:
          - name: Determine Tag
            id: tag
            run: |
              if [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
                echo "tag=dev" >> $GITHUB_OUTPUT
              elif [[ "${{ github.ref }}" == "refs/heads/test" ]]; then
                echo "tag=alpha" >> $GITHUB_OUTPUT
              elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
                echo "tag=beta" >> $GITHUB_OUTPUT
              elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
                echo "tag=latest" >> $GITHUB_OUTPUT
              fi
          
          - name: Publish to NPM
            run: |
              npm publish --tag ${{ steps.tag.outputs.tag }}
    ```
    
    ### Step 4: 回滚机制
    ```bash
    # 版本回滚脚本
    #!/bin/bash
    PREVIOUS_VERSION=$(npm view @promptx/cli versions --json | jq -r '.[-2]')
    npm deprecate @promptx/cli@current "Deprecated due to critical issue"
    npm dist-tag add @promptx/cli@$PREVIOUS_VERSION latest
    ```
    
    ### Step 5: 监控和通知
    ```yaml
    - name: Notify Success
      if: success()
      run: |
        curl -X POST $WEBHOOK_URL \
          -H "Content-Type: application/json" \
          -d '{"text": "✅ Published version $VERSION to $TAG"}'
    
    - name: Notify Failure
      if: failure()
      run: |
        curl -X POST $WEBHOOK_URL \
          -H "Content-Type: application/json" \
          -d '{"text": "❌ Failed to publish version $VERSION"}'
    ```
  </process>
  
  <criteria>
    ## CI/CD 质量标准
    - ✅ 构建成功率 > 99%
    - ✅ 发布成功率 > 95%
    - ✅ 平均构建时间 < 3分钟
    - ✅ 零停机部署
    - ✅ 完整的审计日志
  </criteria>
</execution>