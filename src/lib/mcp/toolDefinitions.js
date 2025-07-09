/**
 * MCP 工具定义 - 共享配置
 * 统一管理所有MCP工具的描述和Schema定义，避免重复维护
 */

/**
 * 工具定义配置
 */
const TOOL_DEFINITIONS = [
  {
    name: 'promptx_init',
    description: '🎯 [AI专业能力启动器] ⚡ 让你瞬间拥有任何领域的专家级思维和技能 - 一键激活丰富的专业角色库(产品经理/开发者/设计师/营销专家等)，获得跨对话记忆能力，30秒内从普通AI变身行业专家。**多项目支持**：现在支持多个IDE/项目同时使用，项目间完全隔离。**必须使用场景**：1️⃣系统首次使用时；2️⃣创建新角色后刷新注册表；3️⃣角色激活(action)出错时重新发现角色；4️⃣查看当前版本号；5️⃣项目路径发生变化时。每次需要专业服务时都应该先用这个',
    inputSchema: {
      type: 'object',
      properties: {
        workingDirectory: {
          type: 'string',
          description: '当前项目的工作目录绝对路径。AI应该知道当前工作的项目路径，请提供此参数。'
        },
        ideType: {
          type: 'string',
          description: 'IDE或编辑器类型，如：cursor, vscode, claude等。完全可选，不提供则自动检测为unknown。'
        }
      },
      required: ['workingDirectory']
    },
    convertToCliArgs: (args) => {
      if (args && args.workingDirectory) {
        return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }];
      }
      return [];
    }
  },
  {
    name: 'promptx_welcome',
    description: `🎭 [专业服务清单] 展示所有可用的AI专业角色和工具
为AI提供完整的专业服务选项清单，包括可激活的角色和可调用的工具。

何时使用此工具:
- 初次进入项目了解可用的角色和工具
- 需要专业能力但不知道有哪些角色可选
- 寻找合适的工具来完成特定任务
- 想要了解项目级、系统级、用户级资源
- 不确定该激活什么角色或使用什么工具
- 定期查看新增的角色和工具

核心展示内容:
- 所有可激活的专业角色（按来源分组）
- 所有可调用的功能工具（附带使用手册）
- 系统级资源（📦 来自PromptX核心）
- 项目级资源（🏗️ 当前项目特有）
- 用户级资源（👤 用户自定义）
- 资源统计和快速索引

资源来源说明:
- 📦 系统角色/工具：PromptX内置的通用资源
- 🏗️ 项目角色/工具：当前项目特有的资源
- 👤 用户角色/工具：用户自定义创建的资源

你应该:
1. 项目开始时先用welcome查看可用角色和工具
2. 根据任务需求选择合适的角色激活
3. 发现工具后通过manual链接学习使用方法
4. 记住常用角色ID和工具名便于快速调用
5. 为用户推荐最适合当前任务的角色或工具
6. 关注新增资源（特别是项目级和用户级）
7. 理解不同来源资源的优先级和适用场景
8. 工具使用前必须先learn其manual文档`,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    convertToCliArgs: () => []
  },
  {
    name: 'promptx_action',
    description: `⚡ [专业角色激活器] 瞬间获得指定专业角色的完整思维和技能包
通过角色ID激活专业身份，获得该领域专家的思考方式、工作原则和专业知识。

何时使用此工具:
- 需要特定领域的专业能力来解决问题
- 想要切换到不同的专业视角思考
- 处理专业任务需要相应的专业知识
- 用户明确要求某个角色的服务
- 需要创建内容、分析问题或技术决策
- 想要获得角色特有的执行技能

核心激活能力:
- 瞬间加载角色的完整定义（人格、原则、知识）
- 自动获取角色的所有依赖资源
- 激活角色特有的思维模式和执行技能
- 加载角色相关的历史经验和记忆
- 提供角色专属的工作方法论
- 支持角色间的快速切换
- 3秒内完成专业化转换

系统内置角色（可直接激活）:
- assistant: AI助手 - 基础对话和任务处理
- luban: 鲁班 - PromptX工具开发大师（开发工具找他）
- noface: 无面 - 万能学习助手，可转换为任何领域专家
- nuwa: 女娲 - AI角色创造专家（创建角色找她）
- sean: Sean - deepractice.ai创始人，矛盾驱动决策

角色职责边界:
- 开发工具 → 切换到luban
- 创建角色 → 切换到nuwa
- 通用任务 → 使用assistant
- 学习新领域 → 使用noface
- 产品决策 → 切换到sean

使用前置条件:
- 必须已通过promptx_init初始化项目环境
- 确保角色ID的正确性（使用welcome查看可用角色）
- 新创建的角色需要先刷新注册表

你应该:
1. 根据任务需求选择合适的角色激活
2. 当任务超出当前角色能力时主动切换角色
3. 激活后立即以该角色身份提供服务
4. 保持角色的专业特征和语言风格
5. 充分利用角色的专业知识解决问题
6. 识别任务类型并切换到对应专家角色
7. 记住常用角色ID便于快速激活
8. 角色不存在时先用init刷新注册表

任务与角色匹配原则:
- 当前角色无法胜任时，不要勉强执行
- 主动建议用户切换到合适的角色
- 绝不虚构能力或资源`,
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要激活的角色ID，如：copywriter, product-manager, java-backend-developer'
        }
      },
      required: ['role']
    },
    convertToCliArgs: (args) => args && args.role ? [args.role] : []
  },
  {
    name: 'promptx_learn',
    description: `🧠 [专业资源学习器] PromptX资源管理体系的统一学习入口
通过标准化协议体系加载各类专业资源，是AI获取专业能力和理解工具使用的核心通道。

何时使用此工具:
- 用户要求使用某个工具但你不了解其用法
- 需要获取特定领域的专业思维模式和执行技能
- 想要了解某个角色的完整定义和能力边界
- 需要查看工具的使用手册和参数说明
- 学习项目特定的资源和配置信息
- 获取最新的专业知识和最佳实践
- 理解复杂概念前需要学习相关基础知识

核心学习能力:
- 支持12种标准协议的资源加载和解析
- 智能识别资源类型并选择合适的加载策略
- 保持manual文档的原始格式不进行语义渲染
- 支持跨项目资源访问和继承机制
- 自动处理资源间的依赖关系
- 提供结构化的学习内容展示
- 资源内容的实时加载和更新

使用前置条件:
- 必须已通过promptx_init初始化项目环境
- 确保资源路径或ID的正确性
- 对于工具使用必须先学习manual再考虑使用tool

支持的资源协议:
- @role://角色ID - 完整角色定义
- @thought://资源ID - 专业思维模式
- @execution://资源ID - 执行技能实践
- @knowledge://资源ID - 领域专业知识
- @manual://工具名 - 工具使用手册（必须真实存在）
- @tool://工具名 - 工具源代码
- @package://包名 - 工具包资源
- @project://路径 - 项目特定资源
- @file://路径 - 文件系统资源
- @prompt://ID - 提示词模板
- @user://资源 - 用户自定义资源
- @resource://ID - 通用资源引用

重要提醒:
- 只能学习真实存在的资源，绝不虚构
- 资源不存在时会返回错误，不要猜测
- 工具manual必须先存在才能学习使用

你应该:
1. 看到工具相关需求时立即学习对应的@manual://工具名
2. 在不确定资源内容时主动使用learn查看
3. 遵循"学习→理解→使用"的标准流程
4. 为用户推荐相关的学习资源
5. 记住已学习的内容避免重复学习
6. 识别资源间的关联并建议深入学习
7. 在激活角色后学习其依赖的所有资源
8. 将学习到的知识立即应用到当前任务中`,
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: '资源URL，支持格式：thought://creativity, execution://best-practice, knowledge://scrum'
        }
      },
      required: ['resource']
    },
    convertToCliArgs: (args) => args && args.resource ? [args.resource] : []
  },
  {
    name: 'promptx_recall',
    description: `🔍 [智能记忆检索器] PromptX专业AI记忆体系的核心检索工具
基于认知心理学检索线索理论，智能检索指定角色的专业经验和知识。

何时使用此工具:
- 处理涉及私有信息的任务（用户背景、项目细节、组织结构）
- 遇到预训练知识无法覆盖的专业领域问题
- 需要了解特定技术栈的历史决策和配置信息
- 感知到语义鸿沟需要外部专业知识补充
- 用户提及过往经验或类似问题的解决方案
- 当前任务上下文触发了相关记忆线索
- 需要避免重复已解决问题的错误路径
- 个性化服务需要了解用户偏好和工作习惯

核心检索能力:
- 基于三层检索策略：关键词精确匹配、语义相关分析、时空关联检索
- 支持XML技术记忆的转义字符还原和格式美化
- 智能相关性评估：直接相关、间接相关、背景相关、结构相关
- 渐进式信息呈现：摘要优先、结构化展示、按需详情展开
- 上下文驱动的记忆激活和关联分析
- 自动识别记忆时效性并提供更新建议
- 跨记忆关联发现和知识图谱构建

使用前置条件:
- 必须已通过promptx_action激活PromptX角色
- 激活后将自动切换到PromptX专业记忆体系
- 客户端原生记忆功能将被禁用以避免冲突
- 确保检索目标与当前激活角色匹配

检索策略说明:
- query参数：仅在确信能精确匹配时使用（如"女娲"、"PromptX"、"MCP"等专有名词）
- 语义搜索：不确定时留空query获取全量记忆进行语义匹配
- **强制补充检索**：如使用query参数检索无结果，必须立即无参数全量检索
- **检索优先级**：全量检索 > 部分匹配 > 空结果，宁可多检索也不遗漏
- **用户查询场景**：对于用户的自然语言查询（如"明天安排"、"项目进度"等），优先使用全量检索

你应该:
1. 感知到预训练知识不足时主动触发记忆检索
2. 优先检索与当前任务上下文最相关的专业记忆
3. 根据检索线索调整查询策略提升检索精度
4. 利用检索结果建立当前任务的知识上下文
5. 识别记忆时效性对过时信息进行标记提醒
6. 将检索到的经验应用到当前问题的解决方案中
7. **关键策略：如果使用query参数没有检索到结果，必须立即使用无参数方式全量检索**
8. 宁可多检索也不要遗漏重要的相关记忆信息`,
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
        },
        query: {
          type: 'string',
          description: '检索关键词，仅在确信能精确匹配时使用（如"女娲"、"PromptX"等具体词汇）。语义搜索或不确定时请留空以获取全量记忆，如果使用关键字无结果建议重试无参数方式'
        },
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['role', 'random_string']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.role) {
        throw new Error('role 参数是必需的');
      }
      const result = [];
      
      // role参数作为第一个位置参数
      result.push(args.role);
      
      // 处理query参数
      if (args && args.query && typeof args.query === 'string' && args.query.trim() !== '') {
        result.push(args.query);
      }
      
      return result;
    }
  },
  {
    name: 'promptx_remember',
    description: `💾 [智能记忆存储器] PromptX专业AI记忆体系的核心存储工具
将重要经验和知识智能处理后永久保存到指定角色的专业记忆库中。

何时使用此工具:
- 用户分享个人化信息：具体的计划、偏好、背景情况
- 用户提供项目特定信息：工作内容、进展、配置、决策
- 用户描述经验性信息：解决问题的方法、遇到的困难、得到的教训
- 用户进行纠错性信息：对AI回答的修正、补充、澄清
- 通过工具调用获得新的文件内容、数据查询结果
- 从互联网获取了训练截止后的最新技术信息
- 每轮对话结束时识别到有价值的用户特定信息

核心处理能力:
- 自动识别信息类型并应用对应的奥卡姆剃刀压缩策略
- 智能生成3-5个语义相关的分类标签避免重复
- 基于价值评估机制筛选高价值信息存储
- 支持XML技术内容的转义处理和格式优化
- 实现角色隔离存储确保专业记忆的独立性
- 自动去重检测避免冗余记忆的累积
- 提取最小完整信息保持记忆库的简洁高效

使用前置条件:
- 必须已通过promptx_action激活PromptX角色
- 激活后将自动切换到PromptX专业记忆体系
- 客户端原生记忆功能将被禁用以避免冲突
- 确保当前角色与要存储的记忆内容匹配

参数详细说明:
- role: 目标角色ID，记忆将绑定到此专业角色的知识库
- content: 原始信息内容，工具将自动进行智能优化处理  
- tags: 可选自定义标签，工具会基于内容自动生成补充标签

🧠 智能记忆判断策略:
当用户分享以下类型信息时，立即评估记忆价值：

📍 个人化信息：用户的具体计划、偏好、背景情况
📍 项目特定信息：具体的工作内容、进展、配置、决策
📍 经验性信息：解决问题的方法、遇到的困难、得到的教训
📍 纠错性信息：对AI回答的修正、补充、澄清

记忆决策原则:
- 这是通用知识还是用户特定信息？
- 这对提升后续服务质量有帮助吗？
- 不确定时，倾向于记忆而不是遗漏

你应该:
1. 每轮对话结束时主动评估是否有值得记忆的新信息
2. 基于语义理解而非关键词匹配来判断记忆价值
3. 优先记忆大模型训练数据中不存在的私有专业信息
4. 保持记忆内容的简洁性，核心价值信息优于详细描述
5. 当不确定是否值得记忆时，倾向于记忆而不是遗漏`,
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要保存记忆的角色ID，如：java-developer, product-manager, copywriter'
        },
        content: {
          type: 'string',
          description: '要保存的重要信息或经验'
        },
        tags: {
          type: 'string',
          description: '自定义标签，用空格分隔，可选'
        }
      },
      required: ['role', 'content']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.role) {
        throw new Error('role 参数是必需的');
      }
      if (!args || !args.content) {
        throw new Error('content 参数是必需的');
      }
      const result = [];
      
      // role参数作为第一个位置参数
      result.push(args.role);
      
      // 然后是内容
      result.push(args.content);
      
      // 处理tags参数
      if (args.tags) {
        result.push('--tags', args.tags);
      }
      
      return result;
    }
  },
  {
    name: 'promptx_tool',
    description: `🔧 [工具执行器] 执行通过@tool协议声明的JavaScript功能工具
基于PromptX工具生态系统，提供安全可控的工具执行环境。

何时使用此工具:
- 已通过promptx_learn学习了@manual://工具名并理解其功能
- 用户明确要求使用某个工具解决具体问题
- 当前任务正好匹配工具的设计用途
- 所有必需参数都已准备就绪
- 确认这是解决问题的最佳工具选择

核心执行能力:
- 动态加载和执行JavaScript工具模块
- 自动处理工具依赖的npm包安装
- 提供隔离的执行沙箱环境
- 支持异步工具执行和超时控制
- 完整的错误捕获和友好提示
- 工具执行状态的实时监控
- 参数验证和类型检查

使用前置条件:
- 必须先使用promptx_learn学习@manual://工具名
- 完全理解工具的功能、参数和返回值格式
- 确认工具适用于当前的使用场景
- 准备好所有必需的参数值

执行流程规范:
1. 识别需求 → 2. learn manual → 3. 理解功能 → 4. 准备参数 → 5. 执行工具

严格禁止:
- 未学习manual就直接调用工具
- 基于猜测使用工具
- 将工具用于非设计用途
- 忽略工具的使用限制和边界

你应该:
1. 永远遵循"先学习后使用"的原则
2. 仔细阅读manual中的参数说明和示例
3. 根据manual中的最佳实践使用工具
4. 处理工具返回的错误并给出建议
5. 向用户解释工具的执行过程和结果
6. 在工具执行失败时参考manual的故障排除
7. 记录工具使用经验供后续参考
8. 推荐相关工具形成完整解决方案`,
    inputSchema: {
      type: 'object',
      properties: {
        tool_resource: {
          type: 'string',
          description: '工具资源引用，格式：@tool://tool-name，如@tool://calculator',
          pattern: '^@tool://.+'
        },
        parameters: {
          type: 'object',
          description: '传递给工具的参数对象'
        },
        rebuild: {
          type: 'boolean',
          description: '是否强制重建沙箱（默认false）。用于处理异常情况如node_modules损坏、权限问题等。正常情况下会自动检测依赖变化',
          default: false
        },
        timeout: {
          type: 'number',
          description: '工具执行超时时间（毫秒），默认30000ms',
          default: 30000
        }
      },
      required: ['tool_resource', 'parameters']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.tool_resource || !args.parameters) {
        throw new Error('tool_resource 和 parameters 参数是必需的');
      }
      const result = [args.tool_resource, args.parameters];
      
      if (args.rebuild) {
        result.push('--rebuild');
      }
      
      if (args.timeout) {
        result.push('--timeout', args.timeout);
      }
      
      return result;
    }
  }
];

/**
 * 获取所有工具定义 - 用于MCP Server
 */
function getToolDefinitions() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}

/**
 * 获取指定工具的定义
 */
function getToolDefinition(toolName) {
  return TOOL_DEFINITIONS.find(tool => tool.name === toolName);
}

/**
 * 获取指定工具的参数转换函数
 */
function getToolCliConverter(toolName) {
  const tool = getToolDefinition(toolName);
  return tool ? tool.convertToCliArgs : null;
}

/**
 * 获取所有工具名称
 */
function getToolNames() {
  return TOOL_DEFINITIONS.map(tool => tool.name);
}

module.exports = {
  TOOL_DEFINITIONS,
  getToolDefinitions,
  getToolDefinition,
  getToolCliConverter,
  getToolNames
}; 