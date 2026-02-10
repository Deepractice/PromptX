<knowledge>
  ## 组织操作 API 速查

  ### 角色生命周期
  | 操作 | 必需参数 | 可选参数 | 前置条件 | 说明 |
  |---|---|---|---|---|
  | born | name, source | - | 无 | 创建角色 |
  | activate | role | version | 无 | 激活角色（设为当前活跃角色） |
  | growup | name, source, type | - | **必须先 activate** | 教授知识/经验/声音 |
  | identity | - | role | 无 | 查看角色身份 |

  > ⚠️ 关键：born 只创建角色，不会自动激活。growup 前必须 activate，否则报错 "No active V2 role"。

  ### 组织操作
  | 操作 | 必需参数 | 可选参数 | 说明 |
  |---|---|---|---|
  | found | name | source, parent | 创建组织 |
  | establish | name, source, org | - | 在组织中创建职位 |
  | hire | name, org | - | 雇佣角色到组织 |
  | fire | name, org | - | 从组织解雇角色 |
  | appoint | name, position, org | - | 任命角色到职位 |
  | dismiss | name, org | - | 免除角色职位 |
  | directory | - | - | 查看全局目录 |

  ### 参数说明
  - name：角色名/组织名/职位名（根据操作不同含义不同）
  - source：Gherkin Feature 格式的描述文本
  - org：目标组织名称
  - parent：父组织名称（嵌套组织）
  - position：目标职位名称
  - role：使用 "_" 表示当前角色上下文
</knowledge>
