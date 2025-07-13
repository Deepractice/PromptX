module.exports = {
  name: 'promptx_remember',
  description: `💾 [认知记忆系统] 基于认知心理学模拟人类记忆编码-存储-检索机制

## 🔍 语义鸿沟触发机制
**触发条件**：AI预训练知识(共识)与私有信息(私识)间存在语义鸿沟
- 个人化信息：身份、偏好、项目细节
- 专业细节：技术栈、配置、历史决策
- 上下文特征：对话中的特定概念关系

## 🧠 记忆编码规则
**原子化原则**：基于词性分解为最小语义单位
- **ATOMIC**：实体词性(名词、形容词、专有名词) → 独立概念
- **LINK**：关系词性(动词、介词、关系词) → 概念连接
- **PATTERN**：复合结构(短语、流程、模式) → 复杂模式

**Schema概念层级**：基本层次→上位概念→下位概念的认知结构
基本概念
  上位概念
  下位概念

**记忆强度巩固**：0-1评估，影响检索权重
- 0.9-1.0：核心知识，频繁激活
- 0.7-0.9：重要知识，定期使用  
- 0.5-0.7：有用知识，偶尔检索
- 0.3-0.5：背景信息，弱激活

## ⚠️ 关键约束
- **原子性**：一个Engram = 一个核心概念
- **纯概念Schema**：禁用"身份:"等标签，直接写概念
- **批量编码**：复杂信息必须分解为多个原子Engram
- **自动执行**：每轮对话后强制触发

## 💡 编码示例
"Sean开发PromptX框架" → 分解为：
[
  {content: "Sean是开发者", schema: "Sean\n  人物\n  创始人", strength: 0.9, type: "ATOMIC"},
  {content: "PromptX是AI框架", schema: "PromptX\n  软件系统\n  认知增强", strength: 0.9, type: "ATOMIC"},
  {content: "Sean开发PromptX", schema: "开发\n  创造行为\n  编程实现", strength: 0.95, type: "LINK"}
]

执行流程：语义鸿沟识别 → 原子化分解 → Schema构建 → 强度评估 → 批量存储`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要保存记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      engrams: {
        type: 'array',
        description: 'Engram对象数组，支持批量记忆保存。每个对象包含content, schema, strength, type四个字段',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的重要信息或经验'
            },
            schema: {
              type: 'string', 
              description: '知识关系图，用缩进文本格式表达这个知识在整个知识体系中的位置'
            },
            strength: {
              type: 'number',
              description: '记忆强度(0-1)，表示这个知识的重要程度，影响后续检索优先级',
              minimum: 0,
              maximum: 1,
              default: 0.8
            },
            type: {
              type: 'string',
              description: 'Engram类型，基于词性选择：ATOMIC（实体词性：名词、形容词、专有名词），LINK（关系词性：动词、介词、关系词），PATTERN（复合结构：短语、流程、模式）。ATOMIC和LINK的Cue必须是原子的单一词性',
              enum: ['ATOMIC', 'LINK', 'PATTERN'],
              default: 'ATOMIC'
            }
          },
          required: ['content', 'schema', 'strength', 'type']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  }
};