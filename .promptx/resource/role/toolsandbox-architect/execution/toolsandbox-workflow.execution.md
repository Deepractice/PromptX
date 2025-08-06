<execution>
  <constraint>
    ## 技术约束
    - Node.js VM模块的安全限制
    - pnpm依赖解析的时间开销
    - 文件系统权限和路径限制
    - 内存和CPU资源限制
    
    ## 架构约束
    - 必须兼容现有协议系统
    - 保持与ResourceManager集成
    - 遵循PromptX错误处理规范
    - 支持MCP协议输出格式
  </constraint>
  
  <rule>
    ## 沙箱管理规则
    
    ### 工具加载规则
    - 必须通过@tool://协议加载
    - 必须验证工具导出格式
    - 必须提取getDependencies()
    - 必须在隔离环境中分析
    
    ### 依赖管理规则
    - 只安装声明的依赖
    - 自动检测依赖变化
    - 使用pnpm进行安装
    - 保持package.json同步
    
    ### 执行隔离规则
    - 禁止访问主进程资源
    - 限制文件系统访问
    - 隔离环境变量
    - 控制网络访问
    
    ### 错误处理规则
    - 分类所有错误类型
    - 提供恢复建议
    - 支持自动重试
    - 记录详细日志
  </rule>
  
  <guideline>
    ## 开发指导原则
    
    ### 工具开发规范
    ```javascript
    class MyTool {
      // 声明依赖
      getDependencies() {
        return ['axios@^1.6.0', 'lodash'];
      }
      
      // 参数验证
      validate(params) {
        return { valid: true };
      }
      
      // 工具执行
      async execute(params) {
        // 实现逻辑
      }
      
      // 元信息
      getMetadata() {
        return {
          name: 'my-tool',
          version: '1.0.0'
        };
      }
    }
    
    module.exports = MyTool;
    ```
    
    ### 沙箱使用流程
    ```javascript
    const sandbox = new ToolSandbox('@tool://my-tool');
    sandbox.setResourceManager(resourceManager);
    
    // 分析工具
    await sandbox.analyze();
    
    // 准备依赖
    await sandbox.prepareDependencies();
    
    // 执行工具
    const result = await sandbox.execute(params);
    
    // 清理资源
    await sandbox.cleanup();
    ```
    
    ### 错误恢复策略
    - DEPENDENCY_MISSING → forceReinstall: true
    - NETWORK_TIMEOUT → timeout: 60000
    - UNDECLARED_DEPENDENCY → 提示开发者
    - 其他错误 → 人工介入
  </guideline>
  
  <process>
    ## ToolSandbox标准流程
    
    ### Step 1: 工具分析
    ```mermaid
    flowchart TD
        A[接收@tool://引用] --> B[加载工具文件]
        B --> C[创建分析沙箱]
        C --> D[提取依赖信息]
        D --> E[验证导出格式]
        E --> F[缓存分析结果]
    ```
    
    ### Step 2: 依赖准备
    ```mermaid
    flowchart TD
        A[检查依赖变化] --> B{需要更新?}
        B -->|是| C[清理旧环境]
        B -->|否| G[使用缓存]
        C --> D[生成package.json]
        D --> E[pnpm install]
        E --> F[创建执行沙箱]
        G --> F
    ```
    
    ### Step 3: 工具执行
    ```mermaid
    flowchart TD
        A[接收参数] --> B[参数验证]
        B --> C[沙箱执行]
        C --> D{执行成功?}
        D -->|是| E[返回结果]
        D -->|否| F[错误分析]
        F --> G{可自动恢复?}
        G -->|是| H[自动重试]
        G -->|否| I[返回错误]
        H --> C
    ```
    
    ### Step 4: 资源清理
    ```mermaid
    flowchart TD
        A[执行完成] --> B[清理沙箱上下文]
        B --> C[释放隔离管理器]
        C --> D{需要删除目录?}
        D -->|是| E[删除沙箱目录]
        D -->|否| F[保留缓存]
    ```
    
    ### Step 5: 错误处理
    ```javascript
    try {
      await sandbox.execute(params);
    } catch (error) {
      const intelligent = errorManager.analyzeError(error);
      
      if (intelligent.agentInstructions.autoRetryable) {
        // 自动重试
        const retryParams = intelligent.agentInstructions.retryParameters;
        await sandbox.execute({ ...params, ...retryParams });
      } else {
        // 返回智能错误信息
        throw intelligent;
      }
    }
    ```
  </process>
  
  <criteria>
    ## 质量评价标准
    
    ### 安全性指标
    - ✅ 完全沙箱隔离
    - ✅ 无法访问主进程
    - ✅ 资源使用受限
    - ✅ 代码审计通过
    
    ### 性能指标
    - ✅ 首次加载 < 3秒
    - ✅ 缓存命中 < 500ms
    - ✅ 内存占用 < 100MB
    - ✅ 并发执行 > 10个
    
    ### 可靠性指标
    - ✅ 错误恢复率 > 80%
    - ✅ 依赖安装成功率 > 95%
    - ✅ 执行成功率 > 90%
    - ✅ 资源清理率 100%
    
    ### 开发体验
    - ✅ 清晰的错误提示
    - ✅ 完整的调试信息
    - ✅ 简单的API设计
    - ✅ 丰富的文档示例
  </criteria>
</execution>