<execution>
<constraint>
  ## 文件创建方式约束
  - 所有工具文件必须通过filesystem工具创建
  - 创建前必须查看filesystem工具手册了解用法
  - 路径自动限制在~/.promptx目录内
  - 不再直接操作本地文件系统
  - 必须遵循VM层文件系统边界控制
</constraint>

<rule>
  ## 工具文件创建规则
  - 使用filesystem工具的write_file方法创建工具文件
  - 使用create_directory方法创建目录结构
  - 根据工具用途选择存储层级（User级或Project级）
  - User级路径：user/tool/{toolName}/
  - Project级路径：resource/tool/{toolName}/
  - 工具文件命名：{toolName}.tool.js
  - 手册文件命名：{toolName}.manual.md
  - **必须执行promptx_welcome刷新注册表**：创建工具后的强制步骤
</rule>

<guideline>
  ## 创建指导原则
  - 优先考虑工具的使用范围来决定存储层级
  - 跨项目通用的工具放在User级
  - 项目特定的工具放在Project级
  - 系统内置工具在Package级（只读）
  - 保持工具和手册在同一目录下
  - 使用批量操作提高效率
</guideline>

<process>
  ## 使用filesystem工具创建工具流程
  
  ### Step 1: 查看filesystem手册
  ```
  行动：学习filesystem工具手册了解具体用法
  关注：write_file、create_directory、list_directory等方法
  重点：参数格式、路径规范、返回值格式
  ```
  
  ### Step 2: 确定存储层级
  ```mermaid
  graph TD
      A[工具用途] --> B{使用范围}
      B -->|跨项目通用| C[User级<br/>user/tool/]
      B -->|项目特定| D[Project级<br/>resource/tool/]
      B -->|系统内置| E[Package级<br/>只读]
  ```
  
  ### Step 3: 创建工具文件结构
  
  #### 3.1 创建工具目录
  ```javascript
  // 使用filesystem创建目录
  // 调用方式示例（伪代码）
  filesystem.create_directory({
    path: "resource/tool/my-awesome-tool"
  })
  ```
  
  #### 3.2 创建工具执行文件
  ```javascript
  // 创建.tool.js文件
  filesystem.write_file({
    path: "resource/tool/my-awesome-tool/my-awesome-tool.tool.js",
    content: `module.exports = {
      getDependencies() {
        return {
          'lodash': '^4.17.21'
        };
      },
      
      getMetadata() {
        return {
          name: 'my-awesome-tool',
          description: '工具描述',
          version: '1.0.0',
          category: 'utility',
          manual: '@manual://my-awesome-tool'
        };
      },
      
      getSchema() {
        return {
          type: 'object',
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        };
      },
      
      validate(params) {
        // 参数验证
        return true;
      },
      
      async execute(params) {
        // 核心执行逻辑
        return { success: true, data: 'result' };
      }
    };`
  })
  ```
  
  #### 3.3 创建工具手册文件
  ```javascript
  // 创建.manual.md文件
  filesystem.write_file({
    path: "resource/tool/my-awesome-tool/my-awesome-tool.manual.md",
    content: `<manual>
    <identity>
    ## 工具名称
    @tool://my-awesome-tool
    
    ## 简介
    这是一个强大的工具
    </identity>
    
    <purpose>
    ⚠️ **AI重要提醒**: 调用此工具前必须完整阅读本说明书
    
    ## 核心问题定义
    解决特定问题
    
    ## 价值主张
    - 🎯 **解决什么痛点**：具体痛点
    - 🚀 **带来什么价值**：核心价值
    
    ## 应用边界
    - ✅ **适用场景**：场景说明
    - ❌ **不适用场景**：限制说明
    </purpose>
    
    <usage>
    ## 使用指南
    详细使用说明
    </usage>
    
    <parameter>
    ## 参数说明
    | 参数名 | 类型 | 描述 |
    |--------|------|------|
    | input | string | 输入参数 |
    </parameter>
    
    <outcome>
    ## 返回结果
    成功和失败的返回格式说明
    </outcome>
    </manual>`
  })
  ```
  
  ### Step 4: 批量创建优化
  ```javascript
  // 批量创建多个文件时的优化策略
  const files = [
    {
      path: "resource/tool/tool1/tool1.tool.js",
      content: "// tool1 code"
    },
    {
      path: "resource/tool/tool1/tool1.manual.md", 
      content: "<!-- tool1 manual -->"
    }
  ];
  
  // 使用filesystem的批量操作（如果支持）
  // 或者循环调用单个文件创建
  for (const file of files) {
    filesystem.write_file(file);
  }
  ```
  
  ### Step 5: 验证创建结果
  ```javascript
  // 使用list_directory确认文件结构
  filesystem.list_directory({
    path: "resource/tool/my-awesome-tool"
  })
  
  // 期望输出：
  // - my-awesome-tool.tool.js
  // - my-awesome-tool.manual.md
  ```
  
  ### Step 6: 刷新资源注册表（关键步骤！）
  ```
  必须执行：调用 promptx_welcome 工具
  目的：重新发现所有资源，让新工具可被使用
  警告：不执行此步骤，用户无法发现和使用新创建的工具
  
  验证：welcome输出中应该显示新工具
  - 🔧 工具资源：@tool://my-awesome-tool
  - 📖 手册资源：@manual://my-awesome-tool
  ```
</process>

<criteria>
  ## 质量标准
  - ✅ 正确使用filesystem工具API
  - ✅ 选择合适的存储层级
  - ✅ 文件路径格式正确
  - ✅ 目录结构符合规范
  - ✅ 工具和手册成对创建
  - ✅ 注册表成功刷新
  - ✅ 新工具可被发现和调用
</criteria>
</execution>