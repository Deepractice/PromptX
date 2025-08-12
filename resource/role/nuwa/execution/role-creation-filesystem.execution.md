<execution>
  <constraint>
    ## 文件创建方式约束
    - 所有角色文件必须通过filesystem工具创建
    - 创建前必须查看filesystem工具手册了解用法
    - 路径自动限制在~/.promptx目录内
    - 不再直接操作本地文件系统
  </constraint>

  <rule>
    ## 角色文件创建规则
    - 使用filesystem工具的write_file方法创建角色文件
    - 根据角色用途选择存储层级（User级或Project级）
    - User级路径：user/role/{roleId}/
    - Project级路径：resource/role/{roleId}/
    - 创建目录使用create_directory方法
    - 批量创建使用read_multiple_files提高效率
    - **必须执行promptx_welcome刷新注册表**：创建或更新角色后的强制步骤
  </rule>

  <guideline>
    ## 创建指导原则
    - 优先考虑角色的使用范围来决定存储层级
    - 跨项目通用的角色放在User级
    - 项目特定的角色放在Project级
    - 系统内置角色在Package级（只读）
  </guideline>

  <process>
    ## 使用filesystem工具创建角色流程
    
    ### Step 1: 查看工具手册
    ```
    行动：查看filesystem工具手册了解具体用法
    关注：write_file、create_directory等方法的参数格式
    ```
    
    ### Step 2: 确定存储层级
    ```mermaid
    graph TD
        A[角色用途] --> B{使用范围}
        B -->|跨项目通用| C[User级<br/>user/role/]
        B -->|项目特定| D[Project级<br/>resource/role/]
        B -->|系统内置| E[Package级<br/>只读]
    ```
    
    ### Step 3: 创建角色文件结构
    ```
    1. 创建角色目录
       - 使用create_directory方法
       - 路径：{层级}/role/{roleId}/
    
    2. 创建主角色文件
       - 使用write_file方法
       - 文件名：{roleId}.role.md
    
    3. 创建扩展目录和文件（如需要）
       - thought/目录及文件
       - execution/目录及文件
    ```
    
    ### Step 4: 验证创建结果
    ```
    使用directory_tree或list_directory方法确认文件结构正确
    ```
    
    ### Step 5: 刷新资源注册表（关键步骤！）
    ```
    必须执行：调用 promptx_welcome 工具
    目的：重新发现所有资源，让新角色可被用户使用
    警告：不执行此步骤，用户无法发现和激活新创建的角色
    ```
  </process>

  <criteria>
    ## 质量标准
    - ✅ 正确使用filesystem工具
    - ✅ 选择合适的存储层级
    - ✅ 文件路径格式正确
    - ✅ 目录结构符合规范
  </criteria>
</execution>