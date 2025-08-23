# language: zh-CN
@cognition @e2e
功能: 认知系统记忆生命周期
  作为一个AI角色
  我需要能够存储和检索记忆
  以便建立持续的认知体系

  背景:
    假设 系统已经初始化
    并且 测试角色"bdd-test-bot"已准备就绪

  @smoke @fast
  场景: 基础连通性测试
    当 创建认知系统实例
    那么 系统应该成功初始化
    并且 网络应该为空

  @critical
  场景: 首次记忆存储
    假设 角色还没有任何记忆
    当 存储以下记忆:
      | content                           | schema                            | strength | type    |
      | BDD测试的核心是Given-When-Then   | BDD测试\n  Given-When-Then       | 0.9      | PATTERN |
      | 实例驱动需求澄清                  | 实例驱动\n  需求澄清              | 0.8      | LINK    |
    那么 记忆应该被成功保存
    并且 网络中应该包含"BDD测试"节点
    并且 网络中应该包含"Given-When-Then"节点

  @critical
  场景: 记忆检索激活
    假设 角色已存储BDD相关记忆
    当 使用关键词"BDD"进行recall
    那么 应该返回Mind对象
    并且 激活的概念应该包含"Given-When-Then"
    并且 激活强度应该大于0.5

  @critical
  场景: 多角色记忆隔离
    假设 角色"alice"存储了"Alice的专属记忆"
    并且 角色"bob"存储了"Bob的专属记忆"
    当 角色"alice"执行recall"专属记忆"
    那么 只能检索到"Alice的专属记忆"
    并且 不能检索到"Bob的专属记忆"

  @comprehensive @slow
  场景大纲: 记忆频率更新机制
    假设 角色已存储记忆"<memory>"
    当 连续<recall_times>次recall"<query>"
    那么 节点"<memory>"的频率应该是<expected_freq>
    并且 下次prime时选中概率应该<probability_change>

    例子:
      | memory      | query | recall_times | expected_freq | probability_change |
      | 高频概念    | 高频  | 5           | 5             | 增加              |
      | 低频概念    | 低频  | 1           | 1             | 不变              |
      | 未访问概念  | 其他  | 0           | 0             | 降低              |

  @comprehensive
  场景: Prime启动策略验证
    假设 角色有以下记忆网络:
      | concept     | frequency | last_access |
      | 核心概念    | 10        | 刚刚        |
      | 常用概念    | 5         | 1小时前     |
      | 冷门概念    | 1         | 1天前       |
    当 执行prime操作
    那么 启动词应该优先选择"核心概念"
    并且 激活的子网络应该包含相关联的概念

  @comprehensive
  场景: 记忆持久化验证
    假设 角色"persist-test"存储了复杂记忆网络
    当 系统重启
    并且 重新加载角色"persist-test"
    那么 所有记忆应该被正确恢复
    并且 网络结构应该保持不变
    并且 权重和频率信息应该被保留