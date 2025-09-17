<execution>
<constraint>
  ## 文件创建方式约束
  - 所有工具文件必须通过filesystem工具创建
  - 创建前必须用toolx的manual模式查看手册
  - 路径自动限制在~/.promptx目录内
  - 不再直接操作本地文件系统
  - 必须遵循VM层文件系统边界控制
</constraint>

<rule>
  ## 工具文件创建规则
  
  ⚠️ **资源层级说明**：
  1. **系统内置（Package级）**：
     - 位置：`packages/resource/resources/tool/`
     - 说明：PromptX代码库自带的核心工具，不需要创建
  
  2. **用户创建（User级）** ← filesystem默认在这里
     - filesystem路径：`resource/tool/{toolName}/`
     - 实际位置：`~/.promptx/resource/tool/`
     - 说明：所有用户创建的工具都在这里
     - **这是filesystem工具的默认位置**
  
  📌 **重要**：
  - 使用filesystem工具创建时，直接用 `resource/tool/{toolName}/`
  - filesystem工具自动限制在 `~/.promptx/` 目录内
  - 用户创建的资源都在 `~/.promptx/resource/` 下
  - 工具文件命名：{toolName}.tool.js
  - **必须执行promptx_discover刷新注册表**：创建工具后的强制步骤
</rule>

<guideline>
  ## 创建指导原则
  - 用户创建的工具统一放在 `resource/tool/` 下
  - 系统内置工具在Package级（只读，不通过filesystem创建）
  - 保持工具文件在独立目录中
  - 使用批量操作提高效率
</guideline>

<process>
  ## 使用filesystem工具创建工具流程
  
  ### Step 1: 查看filesystem手册
  ```
  行动：使用toolx的manual模式查看手册
  命令：{tool_resource: '@tool://filesystem', mode: 'manual'}
  关注：write_file、create_directory、list_directory等方法
  重点：参数格式、路径规范、返回值格式
  ```
  
  ### Step 2: 确定存储层级
  ```mermaid
  graph TD
      A[工具用途] --> B{工具来源}
      B -->|用户创建| C[User级<br/>resource/tool/]
      B -->|系统内置| D[Package级<br/>只读]
  ```
  
  📌 **说明**：用户创建的工具都使用 `resource/tool/` 路径
  
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
          id: 'my-awesome-tool',
          name: '我的工具',
          description: '工具的一句话描述',
          version: '1.0.0',
          category: 'utility',
          scenarios: ['适用场景1', '适用场景2'],
          limitations: ['限制说明1', '限制说明2']
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
  
  
  ### Step 4: 批量创建优化
  ```javascript
  // 批量创建多个文件时的优化策略
  const files = [
    {
      path: "resource/tool/tool1/tool1.tool.js",
      content: "// tool1 code"
    },
    {
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
  ```
  
  ### Step 6: 刷新资源注册表（关键步骤！）
  ```
  必须执行：调用 promptx_discover 工具
  目的：重新发现所有资源，让新工具可被使用
  警告：不执行此步骤，用户无法发现和使用新创建的工具
  
  验证：discover输出中应该显示新工具
  - 🔧 工具资源：@tool://my-awesome-tool
  ```
</process>

<criteria>
  ## 质量标准
  - ✅ 正确使用filesystem工具API
  - ✅ 选择合适的存储层级
  - ✅ 文件路径格式正确
  - ✅ 目录结构符合规范
  - ✅ 工具文件创建成功
  - ✅ 注册表成功刷新
  - ✅ 新工具可被发现和调用
</criteria>
</execution>