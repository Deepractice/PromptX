<knowledge>
  ## 工具与操作 API 速查

  ### action 工具（角色管理）
  | 操作 | 必需参数 | 可选参数 | 说明 |
  |---|---|---|---|
  | activate | role | version, roleResources | 激活角色（设为当前活跃角色） |
  | born | name, source | - | 创建 V2 角色 |
  | identity | role | - | 查看角色身份 |

  > ⚠️ 关键：born 只创建角色，不会自动激活。

  ### lifecycle 工具（目标与任务）
  | 操作 | 必需参数 | 可选参数 | 说明 |
  |---|---|---|---|
  | want | name, source | testable | 创建目标 |
  | plan | source, **id** | - | 创建计划（id 必填！） |
  | todo | name, source | testable | 创建任务 |
  | finish | name | encounter | 完成任务 |
  | achieve | experience | - | 达成目标 |
  | abandon | experience | - | 放弃目标 |
  | focus | name | - | 切换焦点 |

  ### learning 工具（知识管理）
  | 操作 | 必需参数 | 可选参数 | 说明 |
  |---|---|---|---|
  | synthesize | name, source, type | role(目标角色) | 教授知识/经验/声音 |
  | reflect | encounters, experience, id | - | 反思创建经验 |
  | realize | experiences, principle, id | - | 提炼原则 |
  | master | procedure, id | - | 沉淀 SOP |
  | forget | nodeId | - | 遗忘过时知识 |

  > ⚠️ synthesize 可传入 role 参数指定目标角色（接收知识的角色），无需先 activate。

  ### organization 工具（组织管理）
  | 操作 | 必需参数 | 可选参数 | 说明 |
  |---|---|---|---|
  | found | name | source, parent | 创建组织 |
  | establish | name, source, org | - | 在组织中创建职位。⚠️ name 必须是"角色名+岗位"格式 |
  | hire | name, org | - | 雇佣角色到组织 |
  | fire | name, org | - | 从组织解雇角色 |
  | appoint | name, position, org | - | 任命角色到职位。⚠️ position 必须与 establish 的 name 完全一致 |
  | dismiss | name, org | - | 免除角色职位 |
  | directory | - | - | 查看全局目录 |
  | charter | org, content | - | 设置组织章程 |
  | dissolve | org | - | 解散组织 |
  | retire | individual | - | 退休角色 |
  | die | individual | - | 永久删除角色 |
  | train | individual, skillId, content | - | 训练角色技能 |

  ### 参数说明
  - name：角色名/组织名/职位名（根据操作不同含义不同）
  - source：Gherkin Feature 格式的描述文本
  - org：目标组织名称
  - parent：父组织名称（嵌套组织）
  - position：目标职位名称
  - role：使用 "_" 表示当前角色上下文
</knowledge>
