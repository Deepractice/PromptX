import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const rememberTool: ToolWithHandler = {
  name: 'remember',
  description: `保存记忆到角色知识库 - 将新学到的内容存储起来

主要功能：
1. 保存重要的经验和知识到角色记忆库
2. 自动提取关键概念构建记忆网络
3. 设置记忆强度影响后续检索优先级
4. 更新角色的记忆网络图

使用场景：
- 学到新知识时：保存供将来参考
- 解决问题后：记录解决方案
- 获得经验时：存储经验教训
- 理解概念后：构建知识网络

保存步骤：
1️⃣ 提取关键词（schema）：
   • 直接从原文提取关键词，不要创造新词
   • 每个词独立（"数据库连接"拆成"数据库"和"连接"）
   • 用换行分隔每个关键词

2️⃣ 设置重要度（strength）：
   • 0.9 - 核心知识（角色专业领域）
   • 0.7 - 重要经验（工作中常用）
   • 0.5 - 有用信息（扩展知识）
   • 0.3 - 一般信息（了解即可）

示例格式：
{
  role: "当前角色ID",
  engrams: [{
    content: "具体的知识内容",
    schema: "关键词1\\n  关键词2", 
    strength: 0.8
  }]
}

---

## 🌟 轻松指南（真的别纠结）

### 什么时候要存？
看到这些就存：
- 😲 "原来如此！" → 存
- 🐛 "踩坑了..." → 存
- "这个方法不错" → 存
- 🔧 "解决了！" → 存

### 存储技巧
- **别追求完美**：大概对就行
- **别想太久**：第一感觉最准
- **可以很简单**：一句话也能存
- **后悔了再改**：记忆可以更新

### 真实例子（看看多随意）
"今天下雨了" → 简单事实
{
  content: "今天下雨了",
  schema: "今天\\n  下雨",
  strength: 0.5
}

"数据库通过连接池来管理" → 概念关系
{
  content: "数据库通过连接池来管理",
  schema: "数据库\\n  通过\\n  连接池\\n  管理",
  strength: 0.7
}

"先登录，再选商品，最后付款" → 流程步骤
{
  content: "购物流程",
  schema: "登录\\n  选商品\\n  付款",
  strength: 0.8
}

记住：存了总比没存强！
未来的你会感谢现在存记忆的你～`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要保存记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      engrams: {
        type: 'array',
        description: 'Engram（记忆痕迹）对象数组，支持批量记忆保存。每个对象包含content, schema, strength三个字段',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的原始经验内容（感性直观）'
            },
            schema: {
              type: 'string', 
              description: '概念序列，用换行分隔。直接从原文提取关键词，不要发明新词（知性概念化）'
            },
            strength: {
              type: 'number',
              description: '记忆强度(0-1)，从角色视角评估的重要程度，影响权重计算和检索优先级',
              minimum: 0,
              maximum: 1,
              default: 0.8
            }
          },
          required: ['content', 'schema', 'strength']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  },
  handler: async (args: { role: string; engrams: string[] }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    const result = await cli.execute('remember', [args]);
    return outputAdapter.convertToMCPFormat(result);
  }
};