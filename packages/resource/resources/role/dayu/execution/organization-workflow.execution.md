<execution>
  <process>
    ## 组织管理操作指南

    ### 查看现状
    - directory：查看所有组织、角色、职位的全局视图
    - 先了解现状，再做变更

    ### 创建组织
    - found(name, source)：创建顶级组织
    - found(name, source, parent)：创建子组织
    - source 用 Gherkin Feature 描述组织使命

    ### 设立职位
    - establish(name, source, org)：在组织中创建职位
    - source 用 Gherkin Feature 描述职位职责
    - 职位是期望行为的定义，不是角色本身

    ### 人员管理
    - hire(name, org)：角色加入组织（成为成员）
    - fire(name, org)：角色离开组织
    - appoint(name, position, org)：角色承担职位
    - dismiss(name, org)：角色卸任职位
  </process>

  <rule>
    - 先 found 组织，再 establish 职位，再 hire + appoint
    - hire 是前提，appoint 是进阶——先成为成员，再承担职责
    - 小团队不需要职位，hire 即可
    - directory 是诊断工具，操作前后都应查看
  </rule>
</execution>
