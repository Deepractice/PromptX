module.exports = {
  name: 'promptx_think',
  description: `🤔 [认知思考系统] 基于认知心理学的思维链式推理机制

## 🧠 核心理解
思考是一个递归深化的过程，每次调用都传入当前的 Thought 状态，
系统返回指导生成下一个更深入 Thought 的 prompt。

## 💭 Thought 五大要素
AI 负责构造的创造性部分：
1. **goalEngram** - 本轮思考的目标
2. **insightEngrams** - 从记忆中产生的洞察
3. **conclusionEngram** - 综合形成的结论
4. **confidence** - 对结论的置信度评估

系统自动处理的部分：
- **recalledEngrams** - 基于 goalEngram 自动检索相关记忆
- **iteration** - 自动递增迭代次数
- **previousThought** - 自动保存前序思想
- **timestamp** - 自动记录时间戳

## 🔄 认知循环
1. AI 构造初始 Thought（通常只有 goalEngram）
2. 系统处理并返回指导 prompt
3. AI 基于 prompt 生成更完整的 Thought
4. 循环继续，思考越来越深入

## 💡 使用示例
第一次思考：
{
  role: "scientist",
  thought: {
    goalEngram: {
      content: "推理天空呈现蓝色的光学原理",
      schema: "自然现象\\n  光学现象\\n    大气散射"
    }
  }
}

后续思考：
{
  role: "scientist", 
  thought: {
    goalEngram: {
      content: "深入分析瑞利散射机制",
      schema: "物理学\\n  光学\\n    散射理论"
    },
    insightEngrams: [
      {
        content: "蓝光波长短，被大气分子散射更多",
        schema: "光学原理\\n  波长与散射\\n    反比关系"
      }
    ],
    conclusionEngram: {
      content: "天空呈蓝色是因为瑞利散射效应",
      schema: "科学结论\\n  大气光学\\n    颜色成因"
    },
    confidence: 0.95
  },
  templateName: "reasoning"
}

## ⚠️ 关键约束
- 每次都传入完整的 Thought 对象
- goalEngram 是必需的（代表思考目标）
- 其他要素根据思考深度逐步添加
- 系统会自动管理状态和检索记忆`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '进行思考的角色ID，如：scientist, engineer, writer'
      },
      thought: {
        type: 'object',
        description: 'Thought 对象，包含当前思考状态',
        properties: {
          goalEngram: {
            type: 'object',
            description: '本轮思考的目标（必需）',
            properties: {
              content: {
                type: 'string',
                description: '目标内容'
              },
              schema: {
                type: 'string',
                description: '知识层级结构'
              }
            },
            required: ['content', 'schema']
          },
          insightEngrams: {
            type: 'array',
            description: '产生的洞察数组',
            items: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: '洞察内容'
                },
                schema: {
                  type: 'string',
                  description: '知识层级结构'
                }
              },
              required: ['content']
            }
          },
          conclusionEngram: {
            type: 'object',
            description: '形成的结论',
            properties: {
              content: {
                type: 'string',
                description: '结论内容'
              },
              schema: {
                type: 'string',
                description: '知识层级结构'
              }
            },
            required: ['content']
          },
          confidence: {
            type: 'number',
            description: '置信度评估 (0-1)',
            minimum: 0,
            maximum: 1
          }
        },
        required: ['goalEngram']
      },
      templateName: {
        type: 'string',
        description: '思维模板名称',
        enum: ['reasoning', 'divergent', 'convergent', 'creative', 'critical', 'systemic'],
        default: 'reasoning'
      }
    },
    required: ['role', 'thought']
  }
};