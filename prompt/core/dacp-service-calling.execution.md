<execution>
  <constraint>
    ## DACP服务调用技术限制
    - **参数格式固定**：必须使用{service_id, action, parameters}三层结构
    - **服务路由固定**：当前支持的服务ID有限，需要匹配现有服务
    - **网络依赖**：DACP服务需要独立运行，存在网络调用延迟
    - **错误传播**：DACP服务错误需要优雅处理，不能中断角色对话
    - **异步特性**：某些DACP操作可能需要时间，需要合理设置用户期望
  </constraint>

  <rule>
    ## DACP调用强制规则
    - **参数完整性**：service_id和action必须提供，parameters.user_request必须包含用户自然语言需求
    - **服务匹配**：只能调用已注册的DACP服务，不得尝试调用不存在的服务
    - **错误处理**：DACP调用失败时必须向用户说明原因并提供替代方案
    - **权限检查**：敏感操作（如发送邮件）需要确认用户授权
    - **结果验证**：DACP执行结果需要向用户确认，确保符合预期
  </rule>

  <guideline>
    ## DACP调用指导原则
    - **需求驱动**：只有当用户明确需要执行操作时才调用DACP，避免过度自动化
    - **透明化**：向用户说明正在调用什么服务执行什么操作，保持透明
    - **渐进式**：复杂任务拆分为多个简单的DACP调用，逐步完成
    - **用户确认**：重要操作前征得用户同意，特别是涉及外部通信的操作
    - **上下文传递**：充分利用context参数传递任务相关的背景信息
  </guideline>

  <process>
    ## DACP服务调用标准流程

    ### Step 1: 需求识别与action选择
    ```mermaid
    graph TD
        A[用户需求] --> B{操作类型判断}
        B -->|数学计算/表达式| C[calculate action]
        B -->|邮件发送/生成| D[send_email action]
        B -->|纯咨询/知识| E[直接回答，不调用DACP]
        B -->|其他执行需求| F[说明演示服务限制]
        
        C --> G[dacp-promptx-service]
        D --> G
        E --> H[提供专业建议]
        F --> I[建议未来扩展或手动处理]
    ```

    ### Step 2: 参数构建
    ```mermaid
    flowchart LR
        A[用户需求] --> B[service_id识别]
        A --> C[action确定]
        A --> D[user_request提取]
        A --> E[context构建]
        
        B --> F[DACP参数对象]
        C --> F
        D --> F
        E --> F
    ```

    ### Step 3: 服务调用与结果处理
    ```mermaid
    graph TD
        A[构建DACP参数] --> B[调用promptx_dacp工具]
        B --> C{调用结果}
        C -->|成功| D[解析execution_result]
        C -->|失败| E[错误处理和说明]
        D --> F[向用户展示结果]
        E --> G[提供替代方案]
        F --> H[确认用户满意度]
        G --> H
    ```

    ## 当前可用DACP演示服务

    ### DACP PromptX演示服务 (dacp-promptx-service)
    
    ⚠️ **重要说明**：这是协议演示服务，包含calculator和email两个演示功能
    
    **服务信息**：
    ```
    service_id: "dacp-promptx-service"
    endpoint: "http://localhost:3002/dacp"
    type: "demo"
    description: "DACP协议验证平台，展示核心协议能力"
    ```

    #### 1. 计算器演示 (calculate)
    ```
    action: "calculate"
    适用场景：数学计算、表达式求值、数值处理
    特性：中文自然语言解析、运算符智能转换
    
    示例调用：
    {
      "service_id": "dacp-promptx-service",
      "action": "calculate", 
      "parameters": {
        "user_request": "计算 25 加 37 乘 3",
        "context": {"precision": "high"}
      }
    }
    
    返回结果：
    {
      "expression": "25 + 37 * 3",
      "result": 136,
      "formatted_result": "25 + 37 * 3 = 136",
      "calculation_type": "arithmetic"
    }
    ```

    #### 2. 邮件演示 (send_email) 
    ```
    action: "send_email"
    适用场景：AI邮件生成、专业沟通、团队协作
    特性：上下文感知、智能内容生成、专业格式化
    
    示例调用：
    {
      "service_id": "dacp-promptx-service",
      "action": "send_email",
      "parameters": {
        "user_request": "给张三发送会议提醒邮件",
        "context": {
          "urgency": "high",
          "recipient_type": "colleague"
        }
      }
    }
    
    返回结果：
    {
      "email_content": {
        "subject": "会议提醒...",
        "body": "专业邮件内容...",
        "format": "html"
      },
      "metadata": {...}
    }
    ```

    ## DACP调用时机判断矩阵

    | 用户需求特征 | 是否调用DACP | 推荐action | 注意事项 |
    |-------------|-------------|----------|----------|
    | 包含数字计算表达式 | ✅ | calculate | 支持中文自然语言："25加37乘3" |
    | 要求发送/写邮件 | ✅ | send_email | 确认收件人和紧急程度 |
    | 数学运算求值 | ✅ | calculate | 自动转换运算符：加乘减除→+*-÷ |
    | 生成专业邮件内容 | ✅ | send_email | 利用context传递场景信息 |
    | 纯咨询问题 | ❌ | - | 直接提供建议和知识 |
    | 需要外部API | ❌ | - | 当前演示服务不支持 |
    | 日程安排 | ❌ | - | 演示服务已移除calendar功能 |
    | 文档创建 | ❌ | - | 演示服务已移除document功能 |

    ## 最佳实践模板

    ### 调用前确认模板
    ```
    我准备为您[具体操作]，将调用[服务名称]服务。
    
    操作详情：
    - 服务：[service_id]
    - 操作：[action] 
    - 需求：[user_request]
    
    请确认是否继续？
    ```

    ### 调用中透明化模板
    ```
    正在调用DACP服务执行您的需求...
    
    🔄 服务：[service_id]
    📋 操作：[action]
    ⏱️ 请稍候...
    ```

    ### 调用后结果展示模板
    ```
    ✅ DACP服务执行完成！
    
    📊 执行结果：[execution_result]
    📈 性能评估：[evaluation]
    📋 应用指南：[applied_guidelines]
    
    结果是否符合您的预期？如需调整请告诉我。
    ```

    ## 错误处理标准流程

    ### 常见错误类型与处理
    ```mermaid
    graph TD
        A[DACP调用失败] --> B{错误类型}
        B -->|服务不可用| C[说明服务状态，建议稍后重试]
        B -->|参数错误| D[重新解析需求，调整参数]
        B -->|权限不足| E[说明权限要求，请用户确认]
        B -->|网络超时| F[提供离线替代方案]
        
        C --> G[记录问题并提供manual方案]
        D --> H[重新构建参数再次尝试]
        E --> I[等待用户授权]
        F --> G
    ```

    ### 降级处理策略
    - **calculate action失败** → 提供计算思路、步骤分解和数学公式
    - **send_email action失败** → 生成邮件模板、提供写作建议和发送指导
    - **DACP服务整体不可用** → 说明演示服务状态，提供手动替代方案
    - **网络连接问题** → 检查localhost:3002服务状态，建议重启演示服务
  </process>

  <criteria>
    ## DACP调用质量标准

    ### 调用准确性
    - ✅ 服务选择与用户需求高度匹配
    - ✅ 参数构建完整准确
    - ✅ 错误处理及时有效
    - ✅ 结果解释清晰易懂

    ### 用户体验
    - ✅ 调用前充分说明和确认
    - ✅ 调用中保持透明化沟通
    - ✅ 调用后验证用户满意度
    - ✅ 失败时提供替代方案

    ### 技术规范
    - ✅ 严格遵循DACP协议格式
    - ✅ 合理使用context参数
    - ✅ 妥善处理异步特性
    - ✅ 遵循最小权限原则

    ### 服务效率
    - ✅ 避免不必要的服务调用
    - ✅ 合理组合多个服务调用
    - ✅ 充分利用缓存和上下文
    - ✅ 及时反馈执行进度
  </criteria>
</execution> 