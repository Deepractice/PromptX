<execution>
  <constraint>
    ## 标签管理约束
    - GitHub 标签名称长度限制
    - 标签颜色必须是有效的十六进制值
    - PR 可以有多个标签但可能冲突
    - 标签权限受仓库权限控制
    - 标签变更会触发 webhook 事件
  </constraint>
  
  <rule>
    ## 标签使用规则
    - 动作标签使用 / 斜杠分隔
    - 信息标签使用 : 冒号分隔
    - 同类标签互斥（如 changeset/patch 和 changeset/minor）
    - 标签添加需要 write 权限
    - 自动化标签需要 bot 账号操作
  </rule>
  
  <guideline>
    ## 标签管理指南
    - 保持标签体系简洁清晰
    - 使用颜色区分标签类别
    - 提供标签使用说明文档
    - 定期清理无用标签
    - 建立标签命名规范
  </guideline>
  
  <process>
    ## 标签管理流程
    ### Step 1: 标签体系设计
    ```mermaid
    graph TD
        A[需求分析] --> B[标签分类]
        B --> C[命名规范]
        C --> D[颜色方案]
        D --> E[冲突规则]
        E --> F[文档编写]
    ```
    
    ### Step 2: 标签创建脚本
    ```javascript
    // 批量创建标签
    const labels = [
      { name: "changeset/patch", color: "0969da", description: "Patch version" },
      { name: "changeset/minor", color: "1f883d", description: "Minor version" },
      { name: "changeset/major", color: "e7412a", description: "Major version" },
      { name: "publish/dev", color: "8250df", description: "Publish to dev" },
      { name: "publish/alpha", color: "fb8500", description: "Publish to alpha" }
    ];
    ```
    
    ### Step 3: 标签验证逻辑
    ```yaml
    - name: Validate Labels
      run: |
        # 检查互斥标签
        if [[ "$LABELS" == *"changeset/patch"* ]] && \
           [[ "$LABELS" == *"changeset/minor"* ]]; then
          echo "Error: Conflicting changeset labels"
          exit 1
        fi
    ```
    
    ### Step 4: 标签处理工作流
    ```yaml
    on:
      pull_request:
        types: [labeled, unlabeled]
    
    jobs:
      process-label:
        runs-on: ubuntu-latest
        steps:
          - name: Process changeset labels
            if: startsWith(github.event.label.name, 'changeset/')
            run: |
              # 创建对应的 changeset 文件
              
          - name: Process publish labels  
            if: startsWith(github.event.label.name, 'publish/')
            run: |
              # 设置发布配置
    ```
    
    ### Step 5: 标签监控
    - 跟踪标签使用频率
    - 识别未使用的标签
    - 发现标签误用模式
    - 优化标签体系
  </process>
  
  <criteria>
    ## 标签质量标准
    - ✅ 标签命名直观明了
    - ✅ 标签分类逻辑清晰
    - ✅ 无冲突和歧义
    - ✅ 文档完整准确
    - ✅ 自动化处理可靠
  </criteria>
</execution>