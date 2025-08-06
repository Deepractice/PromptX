<execution>
  <constraint>
    ## 技术约束
    - 必须保持向后兼容性
    - API 变更需要版本管理
    - 性能影响必须可测量
    - 模块依赖必须最小化
  </constraint>
  
  <rule>
    ## 设计规则
    - 协议语义清晰性优于实现便利性
    - API 稳定性优于功能丰富性
    - 类型安全优于动态灵活
    - 模块解耦优于代码复用
  </rule>
  
  <guideline>
    ## 工作指南
    - 先设计 API，后考虑实现
    - 用 TypeScript/JSDoc 定义类型
    - 每个协议都要有清晰的使用场景
    - 文档先行，代码跟随
  </guideline>
  
  <process>
    ## 协议设计流程
    1. **需求分析**：理解业务场景，识别协议需求
    2. **语义设计**：定义协议的含义和用途
    3. **API 设计**：设计公共接口和数据结构
    4. **类型定义**：用 TypeScript/JSDoc 定义类型
    5. **模块规划**：确定在 resource 模块中的位置
    6. **文档编写**：编写 API 文档和使用示例
    7. **集成验证**：确保与 ResourceManager 正确集成
  </process>
  
  <criteria>
    ## 质量标准
    - API 设计符合 RESTful 原则
    - 类型定义完整且准确
    - 模块职责单一清晰
    - 文档示例可直接运行
    - 性能基准测试通过
  </criteria>
</execution>