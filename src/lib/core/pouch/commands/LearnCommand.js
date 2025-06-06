const BasePouchCommand = require('../BasePouchCommand')
const ResourceManager = require('../../resource/resourceManager')
const { COMMANDS, buildCommand } = require('../../../../constants')

/**
 * 智能学习锦囊命令
 * 支持加载thought、execution、memory等协议资源，以及角色的personality、principle、knowledge
 */
class LearnCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = new ResourceManager()
  }

  getPurpose () {
    return '智能学习指定协议的资源内容，支持thought、execution、memory等DPML协议以及角色组件'
  }

  async getContent (args) {
    const [resourceUrl] = args

    if (!resourceUrl) {
      return this.getUsageHelp()
    }

    try {
      // 直接使用ResourceManager解析资源
      const result = await this.resourceManager.resolve(resourceUrl)
      
      // 检查解析结果
      if (!result.success) {
        throw new Error(result.error?.message || '资源解析失败')
      }

      // 解析协议信息
      const urlMatch = resourceUrl.match(/^([a-zA-Z]+):\/\/(.+)$/)
      const [, protocol, resourceId] = urlMatch

      return this.formatSuccessResponse(protocol, resourceId, result.content)
    } catch (error) {
      return this.formatErrorResponse(resourceUrl, error.message)
    }
  }

  /**
   * 格式化成功响应
   */
  formatSuccessResponse (protocol, resourceId, content) {
    const protocolLabels = {
      thought: '🧠 思维模式',
      execution: '⚡ 执行模式',
      memory: '💾 记忆模式',
      personality: '👤 角色人格',
      principle: '⚖️ 行为原则',
      knowledge: '📚 专业知识'
    }

    const label = protocolLabels[protocol] || `📄 ${protocol}`

    return `✅ **成功学习${label}：${resourceId}**

## 📋 学习内容

${content}

## 🎯 学习效果
- ✅ **已激活${label}能力**
- ✅ **相关知识已整合到AI认知体系**
- ✅ **可立即应用于实际场景**

## 🔄 下一步行动：
- 继续学习: 学习其他相关资源
  命令: \`${buildCommand.learn('<protocol>://<resource-id>')}\`
- 应用记忆: 检索相关经验
  命令: \`${COMMANDS.RECALL}\`
- 激活角色: 激活完整角色能力
  命令: \`${buildCommand.action('<role-id>')}\`

📍 当前状态：learned_${protocol}`
  }

  /**
   * 格式化错误响应
   */
  formatErrorResponse (resourceUrl, errorMessage) {
    return `❌ 学习资源失败：${resourceUrl}

🔍 错误详情：
${errorMessage}

💡 支持的协议：
- \`thought://resource-id\` - 学习思维模式
- \`execution://resource-id\` - 学习执行模式  
- \`memory://resource-id\` - 学习记忆模式
- \`personality://role-id\` - 学习角色思维
- \`principle://role-id\` - 学习角色原则
- \`knowledge://role-id\` - 学习角色知识

🔍 查看可用资源：
\`\`\`bash
${buildCommand.action('<role-id>')}  # 查看角色的所有依赖
\`\`\`

🔄 下一步行动：
  - 继续学习: 学习其他资源
    命令: ${buildCommand.learn('<protocol>://<resource-id>')}
  - 应用记忆: 检索相关经验
    命令: ${COMMANDS.RECALL}
  - 激活角色: 激活完整角色能力
    命令: ${buildCommand.action('<role-id>')}
  - 查看角色列表: 选择其他角色
    命令: ${COMMANDS.HELLO}`
  }

  /**
   * 获取使用帮助
   */
  getUsageHelp () {
    return `🎓 **Learn锦囊 - 智能学习系统**

## 📖 基本用法
\`\`\`bash
promptx learn <protocol>://<resource-id>
\`\`\`

## 🎯 支持的协议

### 🔧 DPML核心协议
- **\`thought://\`** - 思维模式资源
- **\`execution://\`** - 执行模式资源
- **\`memory://\`** - 记忆系统资源

### 👤 角色组件协议
- **\`personality://\`** - 角色人格特征
- **\`principle://\`** - 行为原则
- **\`knowledge://\`** - 专业知识

## 📝 使用示例
\`\`\`bash
# 学习执行技能
${buildCommand.learn('execution://deal-at-reference')}

# 学习思维模式  
${buildCommand.learn('thought://prompt-developer')}

# 学习角色人格
${buildCommand.learn('personality://video-copywriter')}
\`\`\`

## 🔍 发现可学习资源
\`\`\`bash
${buildCommand.action('<role-id>')}  # 查看角色需要的所有资源
${COMMANDS.HELLO}            # 查看可用角色列表
\`\`\`

🔄 下一步行动：
  - 激活角色: 分析角色依赖
    命令: ${buildCommand.action('<role-id>')}
  - 查看角色: 选择感兴趣的角色  
    命令: ${COMMANDS.HELLO}`
  }

  /**
   * 获取PATEOAS导航信息
   */
  getPATEOAS (args) {
    const [resourceUrl] = args

    if (!resourceUrl) {
      return {
        currentState: 'learn_awaiting_resource',
        availableTransitions: ['hello', 'action'],
        nextActions: [
          {
            name: '查看可用角色',
            description: '返回角色选择页面',
            command: COMMANDS.HELLO,
            priority: 'high'
          },
          {
            name: '生成学习计划',
            description: '为特定角色生成学习计划',
            command: buildCommand.action('<role-id>'),
            priority: 'high'
          }
        ]
      }
    }

    const urlMatch = resourceUrl.match(/^([a-zA-Z]+):\/\/(.+)$/)
    if (!urlMatch) {
      return {
        currentState: 'learn_error',
        availableTransitions: ['hello', 'action'],
        nextActions: [
          {
            name: '查看使用帮助',
            description: '重新学习命令使用方法',
            command: COMMANDS.LEARN,
            priority: 'high'
          }
        ]
      }
    }

    const [, protocol, resourceId] = urlMatch

    return {
      currentState: `learned_${protocol}`,
      availableTransitions: ['learn', 'recall', 'hello', 'action'],
      nextActions: [
        {
          name: '继续学习',
          description: '学习其他资源',
          command: buildCommand.learn('<protocol>://<resource-id>'),
          priority: 'medium'
        },
        {
          name: '应用记忆',
          description: '检索相关经验',
          command: COMMANDS.RECALL,
          priority: 'medium'
        },
        {
          name: '激活角色',
          description: '激活完整角色能力',
          command: buildCommand.action('<role-id>'),
          priority: 'high'
        },
        {
          name: '查看角色列表',
          description: '选择其他角色',
          command: COMMANDS.HELLO,
          priority: 'low'
        }
      ],
      metadata: {
        learnedResource: resourceUrl,
        protocol,
        resourceId,
        systemVersion: '锦囊串联状态机 v1.0'
      }
    }
  }
}

module.exports = LearnCommand
