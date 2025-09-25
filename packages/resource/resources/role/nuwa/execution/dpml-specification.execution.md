<execution>
  <constraint>
    ## DPML硬约束（代码层验证要求）

    ### 标签格式约束
    - 所有标签必须是简单形式，绝不能带任何属性
    - UserDiscovery.js验证：includes('<role>') 精确匹配
    - 正确：<role>、<personality>、<principle>、<knowledge>
    - 错误：<role id="xxx">、任何带属性的标签会导致discover失败

    ### XML语法约束
    - 必须遵循EBNF定义的标签语法结构
    - 标签必须正确闭合，属性值必须用双引号包围
    - 文件必须使用UTF-8编码
    - 纯XML结构：文件必须从根标签开始

    ### 系统集成约束
    - 必须与ResourceManager和promptx命令兼容
    - 用户资源必须遵循`.promptx/resource/role/{roleId}/`结构
    - 引用必须遵循@!protocol://resource格式
  </constraint>

  <rule>
    ## DPML执行规则

    ### 文件结构规则
    - *.role.md 必须用 <role></role> 包裹
    - *.thought.md 必须用 <thought></thought> 包裹
    - *.execution.md 必须用 <execution></execution> 包裹
    - *.knowledge.md 必须用 <knowledge></knowledge> 包裹
    - *.philosophy.md 必须用 <thought></thought> 包裹

    ### 子标签结构规则（必须严格遵守）
    thought文件必须包含4个子标签：
    - <exploration> 发散性思考内容
    - <challenge> 批判性思考内容
    - <reasoning> 系统性推理内容
    - <plan> 结构化计划内容

    execution文件必须包含5个子标签：
    - <constraint> 客观限制条件
    - <rule> 强制性规则
    - <guideline> 指导原则
    - <process> 执行步骤
    - <criteria> 评价标准

    ### 引用规则
    - personality中使用 @!thought:// 引用
    - principle中使用 @!execution:// 引用
    - knowledge中使用 @!knowledge:// 引用
    - 引用不带.md后缀
  </rule>

  <guideline>
    ## DPML元素模板

    ### Role元素模板
    ```xml
    # 角色名称 - 角色描述

    <role>
      <personality>
      简洁的人格描述

      @!thought://思维模块
      </personality>

      <principle>
      @!execution://执行模块
      </principle>

      <knowledge>
      @!knowledge://知识模块
      </knowledge>
    </role>
    ```

    ### Thought元素模板
    ```xml
    <thought>
      <exploration>发散性思考内容</exploration>
      <challenge>批判性思考内容</challenge>
      <reasoning>系统性推理内容</reasoning>
      <plan>结构化计划内容</plan>
    </thought>
    ```

    ### Execution元素模板
    ```xml
    <execution>
      <constraint>客观限制条件</constraint>
      <rule>强制性规则</rule>
      <guideline>指导原则</guideline>
      <process>执行步骤</process>
      <criteria>评价标准</criteria>
    </execution>
    ```
  </guideline>

  <process>
    ## DPML创建与验证流程

    ### Step 1: 结构检查
    ```mermaid
    graph TD
        A[DPML文件] --> B{标签检查}
        B -->|role文件| C[验证<role>标签无属性]
        B -->|thought文件| D[验证4个子标签完整]
        B -->|execution文件| E[验证5个子标签完整]
        B -->|knowledge文件| F[验证<knowledge>标签]
    ```

    ### Step 2: 格式验证
    1. XML语法验证
    2. 标签必须无属性（检查是否包含空格或=号）
    3. 标签规范性（只允许role/personality/principle/knowledge）
    4. 引用有效性（格式和路径）

    ### Step 3: 系统验证
    1. 使用discover工具刷新角色列表
    2. 确认新角色能被系统发现
    3. 提供激活命令：action("roleId")
    4. 如果discover失败，检查是否有属性污染

    ### 错误示例（会导致discover失败）
    ```xml
    <role id="writer" name="作家">  <!-- includes('<role>') 无法匹配 -->
      <personality type="friendly">   <!-- includes('<personality>') 无法匹配 -->
        内容...
      </personality>
    </role>
    ```
  </process>

  <criteria>
    ## DPML质量标准

    ### 格式合规性
    - ✅ 100%符合DPML规范
    - ✅ 通过discover验证（能被系统发现）
    - ✅ 标签无属性（通过includes检查）
    - ✅ 子标签结构完整

    ### 内容质量
    - ✅ 主文件少于50行
    - ✅ 引用优于内嵌
    - ✅ 无重复内容（单一真相源）
    - ✅ Token高效

    ### 系统集成
    - ✅ ResourceManager能发现
    - ✅ ActionCommand能激活
    - ✅ 引用路径全部有效
  </criteria>
</execution>