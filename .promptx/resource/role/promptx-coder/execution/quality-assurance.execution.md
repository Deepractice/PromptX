<execution>
  <constraint>
    ## 质量保证约束
    - 代码提交前必须通过所有检查
    - 不允许跳过必要的测试
    - 不能引入新的lint错误
    - 类型检查必须完全通过
    - 测试覆盖率不能降低
  </constraint>
  
  <rule>
    ## 质量检查规则
    - 每次提交前运行本地检查
    - PR必须通过CI/CD流程
    - 破坏性改动需要迁移方案
    - 新功能必须有测试用例
    - 复杂逻辑需要单元测试
  </rule>
  
  <guideline>
    ## 质量保证指南
    - 遵循项目既定的编码规范
    - 保持代码的可读性和可维护性
    - 优先简单清晰而非聪明复杂
    - 考虑边界条件和异常情况
    - 重视代码review的反馈
  </guideline>
  
  <process>
    ## 质量保证流程
    ### Step 1: 开发时质量控制
    - 遵循TypeScript严格模式
    - 使用有意义的变量名
    - 保持函数单一职责
    - 及时重构重复代码
    
    ### Step 2: 提交前检查
    ```bash
    # 运行完整的质量检查
    npm run lint        # ESLint检查
    npm run typecheck   # TypeScript检查
    npm run test        # 单元测试
    npm run test:e2e    # 端到端测试
    npm run build       # 构建验证
    ```
    
    ### Step 3: 测试编写
    ```typescript
    // 单元测试示例
    describe('FeatureName', () => {
      it('should handle normal case', () => {
        // 正常情况测试
      });
      
      it('should handle edge case', () => {
        // 边界情况测试
      });
      
      it('should handle error case', () => {
        // 异常情况测试
      });
    });
    ```
    
    ### Step 4: PR检查清单
    - [ ] 代码符合项目规范
    - [ ] 所有测试通过
    - [ ] 无新增lint警告
    - [ ] 类型定义完整
    - [ ] 文档已更新
    - [ ] changeset已创建
    
    ### Step 5: Review响应
    - 认真对待每个review意见
    - 及时响应和修改
    - 解释设计决策的原因
    - 必要时添加注释说明
  </process>
  
  <criteria>
    ## 代码质量标准
    - ✅ 零lint错误和警告
    - ✅ 类型检查100%通过
    - ✅ 测试覆盖率>80%
    - ✅ 无性能退化
    - ✅ 代码可读性高
    - ✅ 注释充分合理
  </criteria>
</execution>