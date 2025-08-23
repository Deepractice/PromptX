# language: zh-CN
功能: MCP工具连通性测试
  作为PromptX开发者
  我需要确保MCP服务能正常响应
  以便确认服务已正确配置HTTP Stream协议

  背景:
    假如 PromptX服务已在端口4001启动
    并且 MCP环境已准备就绪

  @smoke @fast
  场景: MCP服务连通性验证
    当 我检查MCP服务状态
    那么 MCP服务应该正常响应
    并且 应该返回406或426状态码

  @smoke @fast  
  场景: MCP工具列表获取
    当 我尝试获取MCP工具列表
    那么 应该返回错误状态码
    并且 响应状态码应该是400或426

  @critical
  场景: MCP初始化请求
    当 我向MCP端点发送初始化请求
    那么 应该返回406或426状态码
    并且 MCP服务应该正常响应

  @critical
  场景大纲: MCP方法调用验证
    当 我尝试调用MCP方法 "<method>"
    那么 应该返回400或406状态码
    
    例子:
      | method       |
      | tools/list   |
      | tools/call   |
      | prompts/list |