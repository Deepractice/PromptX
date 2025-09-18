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
    - 角色路径：resource/role/{roleId}/
    - 创建目录使用create_directory方法
    - 批量创建使用write_multiple_files提高效率
    - **必须执行promptx discover刷新注册表**：创建或更新角色后的强制步骤
  </rule>

  <guideline>
    ## 创建指导原则
    - 所有角色创建在resource/role/目录
    - 系统内置角色在Package级（只读）
    - 创建后必须刷新注册表才能使用
  </guideline>

  <process>
    ## 使用filesystem工具创建角色流程
    
    ### Step 1: 查看工具手册
    ```
    行动：查看filesystem工具手册了解具体用法
    关注：write_file、create_directory等方法的参数格式
    ```
    
    ### Step 2: 创建角色文件结构
    ```
    1. 创建角色目录
       - 使用create_directory方法
       - 路径：resource/role/{roleId}/
    
    2. 创建主角色文件
       - 使用write_file方法
       - 文件名：{roleId}.role.md
    
    3. 创建扩展目录和文件（如需要）
       - thought/目录及文件
       - execution/目录及文件
    ```
    
    ### Step 3: 验证创建结果
    ```
    使用directory_tree或list_directory方法确认文件结构正确
    ```
    
    ### Step 4: 刷新资源注册表（关键步骤！）
    ```
    必须执行：使用 discover 工具刷新资源
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