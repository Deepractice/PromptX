<execution>
  <constraint>
    ## 技术和环境限制
    - **配置依赖性**：真实发送需要用户在~/.promptx/dacp/send_email.json配置邮箱信息
    - **服务可用性**：需要DACP服务运行在localhost:3002或指定端口
    - **网络连接要求**：发送真实邮件需要稳定的网络连接和SMTP服务可达性
    - **邮件服务商限制**：不同服务商有发送频率和内容限制
    - **协议格式约束**：必须符合DACP协议标准的请求格式
  </constraint>

  <rule>
    ## 强制执行规则
    - **服务ID固定**：必须使用"dacp-promptx-service"作为service_id
    - **action名称固定**：必须使用"send_email"作为action
    - **必需参数验证**：user_request是必需参数，不能为空
    - **配置错误处理**：配置缺失或无效时必须向用户说明具体解决方案
    - **安全信息保护**：不得在日志或响应中暴露用户的邮箱密码
  </rule>

  <guideline>
    ## 使用指导原则
    - **智能需求解析**：从用户自然语言中提取收件人、主题、内容等信息
    - **上下文感知**：根据urgency、recipient_type等上下文调整邮件语气
    - **友好降级**：无配置时自动使用Demo模式，同时提供配置指导
    - **错误信息友好化**：将技术错误转化为用户可理解的解决建议
  </guideline>

  <process>
    ## 邮件发送执行流程

    ### Step 1: 需求分析和参数准备
    ```
    1. 解析用户输入，提取邮件要素（收件人、主题、内容）
    2. 确定邮件类型和紧急程度
    3. 构造user_request自然语言描述
    4. 准备context上下文信息
    5. 验证所有必需参数完整性
    ```

    ### Step 2: DACP服务调用
    ```json
    // 标准DACP邮件请求格式
    {
      "service_id": "dacp-promptx-service",
      "action": "send_email", 
      "parameters": {
        "user_request": "用户的自然语言邮件描述",
        "context": {
          "urgency": "high|medium|low",
          "recipient_type": "colleague|superior|client"
        }
      }
    }
    ```

    ### Step 3: 配置文件格式要求
    ```json
    // ~/.promptx/dacp/send_email.json 配置文件格式
    {
      "provider": "gmail|outlook|qq|163|126",
      "smtp": {
        "user": "your-email@gmail.com",
        "password": "your-app-password"
      },
      "sender": {
        "name": "Your Name",
        "email": "your-email@gmail.com"
      }
    }
    ```

    ### Step 4: 结果处理和用户反馈
    ```
    1. 检查响应状态和demo_mode字段
    2. Demo模式：提供配置指导和创建配置文件的详细说明
    3. 真实发送：确认发送成功并显示message_id
    4. 错误处理：解析错误原因并提供具体解决方案
    5. 向用户反馈执行结果和后续建议
    ```

    ### 配置错误处理流程
    ```
    配置缺失 → 显示配置文件路径和格式 → 指导创建配置
    配置无效 → 指出具体错误字段 → 提供修复建议
    认证失败 → 检查密码和服务器设置 → 应用专用密码指导
    发送失败 → 网络和SMTP检查 → 故障排除建议
    ```

    ### 邮件服务商配置指导
    ```
    Gmail: 需要启用两步验证并生成应用专用密码
    Outlook: 使用账户密码，确保SMTP已启用
    QQ/163/126: 需要开启SMTP服务并使用授权码
    ```

    ### 配置指导详细说明
    ```
    📧 DACP邮件服务配置说明

    📍 配置文件位置：~/.promptx/dacp/send_email.json

    📝 完整配置示例：
    {
      "provider": "gmail",
      "smtp": {
        "user": "your-email@gmail.com",
        "password": "your-app-password"
      },
      "sender": {
        "name": "Your Name",
        "email": "your-email@gmail.com"
      }
    }

    💡 支持的邮件服务商：gmail, outlook, qq, 163, 126

    🔐 Gmail用户专用设置：
    1. 进入 Google 账户设置
    2. 启用两步验证
    3. 生成应用专用密码
    4. 使用生成的密码替换 "your-app-password"

    📞 其他服务商设置：
    - Outlook: 直接使用账户密码
    - QQ/163/126: 需要开启SMTP服务并使用授权码
    ```
  </process>

  <criteria>
    ## 邮件发送质量评价标准

    ### 功能完整性
    - ✅ 正确调用DACP邮件服务
    - ✅ 准确解析用户邮件需求
    - ✅ 妥善处理配置和发送异常
    - ✅ 提供完整的配置指导

    ### 用户体验质量
    - ✅ 自然语言交互流畅
    - ✅ 错误提示友好明确
    - ✅ 配置指导详细实用
    - ✅ Demo模式平滑降级

    ### 安全合规性
    - ✅ 不暴露敏感配置信息
    - ✅ 遵循邮件发送最佳实践
    - ✅ 用户级配置安全存储
    - ✅ 符合反垃圾邮件规范

    ### 系统稳定性
    - ✅ 配置缺失时不影响系统运行
    - ✅ 合理的错误处理和重试机制
    - ✅ 完整的执行反馈和日志记录
    - ✅ 多邮件服务商兼容支持
  </criteria>
</execution>