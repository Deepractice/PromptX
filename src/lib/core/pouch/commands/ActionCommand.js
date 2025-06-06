const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS, buildCommand } = require('../../../../constants')

/**
 * 角色激活锦囊命令
 * 负责分析角色文件，提取需要学习的thought、execution和knowledge
 */
class ActionCommand extends BasePouchCommand {
  constructor () {
    super()
    // 获取HelloCommand的角色注册表
    this.helloCommand = null
  }

  getPurpose () {
    return '激活特定AI角色，分析并生成具体的思维模式、行为模式和知识学习计划'
  }

  async getContent (args) {
    const [roleId] = args

    if (!roleId) {
      return `❌ 请指定要激活的角色ID

🔍 使用方法：
\`\`\`bash
${buildCommand.action('<角色ID>')}
\`\`\`

💡 查看可用角色：
\`\`\`bash
${COMMANDS.HELLO}
\`\`\``
    }

    try {
      // 1. 获取角色信息
      const roleInfo = await this.getRoleInfo(roleId)
      if (!roleInfo) {
        return `❌ 角色 "${roleId}" 不存在！

🔍 请使用以下命令查看可用角色：
\`\`\`bash
${COMMANDS.HELLO}
\`\`\``
      }

      // 2. 分析角色文件，提取依赖
      const dependencies = await this.analyzeRoleDependencies(roleInfo)

      // 3. 生成学习计划 (新版本：以role://开头)
      return this.generateLearningPlan(roleInfo.id, dependencies)
    } catch (error) {
      console.error('Action command error:', error)
      return `❌ 激活角色 "${roleId}" 时发生错误。

🔍 可能的原因：
- 角色文件不存在或格式错误
- 权限不足
- 系统资源问题

💡 请使用 \`${COMMANDS.HELLO}\` 查看可用角色列表。`
    }
  }

  /**
   * 获取角色信息（从HelloCommand）
   */
  async getRoleInfo (roleId) {
    // 每次都创建新的HelloCommand实例，确保获取最新的角色信息
    const HelloCommand = require('./HelloCommand')
    const helloCommand = new HelloCommand()

    return await helloCommand.getRoleInfo(roleId)
  }

  /**
   * 分析角色文件，提取thought和execution依赖
   */
  async analyzeRoleDependencies (roleInfo) {
    try {
      // 处理文件路径，支持@package://路径和绝对路径
      let filePath = roleInfo.file
      if (filePath.startsWith('@package://')) {
        const PackageProtocol = require('../../resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const packageRoot = await packageProtocol.getPackageRoot()
        filePath = path.join(packageRoot, filePath.replace('@package://', ''))
      } else if (path.isAbsolute(filePath)) {
        // 绝对路径直接使用（来自工作目录的角色）
        // filePath 保持不变
      }

      // 读取角色文件内容
      const roleContent = await fs.readFile(filePath, 'utf-8')

      // 提取所有资源引用
      const resourceRegex = /@([!?]?)([a-zA-Z][a-zA-Z0-9_-]*):\/\/([a-zA-Z0-9_\/.,-]+?)(?=[\s\)\],]|$)/g
      const matches = Array.from(roleContent.matchAll(resourceRegex))

      const dependencies = {
        thoughts: new Set(),
        executions: new Set(),
        knowledge: [roleInfo.id] // 角色自身的knowledge
      }

      // 分类依赖
      matches.forEach(match => {
        const [fullMatch, priority, protocol, resource] = match

        if (protocol === 'thought') {
          dependencies.thoughts.add(resource)
        } else if (protocol === 'execution') {
          dependencies.executions.add(resource)
        }
      })

      return {
        thoughts: dependencies.thoughts,
        executions: dependencies.executions,
        knowledge: dependencies.knowledge
      }
    } catch (error) {
      console.error('Error analyzing role dependencies:', error)
      // 如果分析失败，返回基础结构
      return {
        thoughts: [],
        executions: [],
        knowledge: [roleInfo.id]
      }
    }
  }

  /**
   * 生成学习指引（基于分析出的依赖）
   */
  generateLearningGuide (roleInfo, dependencies) {
    let guide = `🎬 **角色激活计划：${roleInfo.name}**

📋 **角色概述**
${roleInfo.description}

`

    // 思维模式部分
    if (dependencies.thoughts.length > 0) {
      guide += `## 🧠 第一步：学习思维模式
掌握角色所需的核心思考技能

`
      dependencies.thoughts.forEach((thought, index) => {
        guide += `### ${index + 1}. ${thought}
\`\`\`bash
promptx learn thought://${thought}
\`\`\`

`
      })
    }

    // 行为模式部分
    if (dependencies.executions.length > 0) {
      guide += `## ⚖️ 第二步：学习行为模式
掌握角色所需的核心执行技能

`
      dependencies.executions.forEach((execution, index) => {
        guide += `### ${index + 1}. ${execution}
\`\`\`bash
promptx learn execution://${execution}
\`\`\`

`
      })
    }

    // 知识部分
    guide += `## 📚 第三步：学习专业知识
获取角色的领域知识体系

`
    dependencies.knowledge.forEach((knowledge, index) => {
      guide += `### ${index + 1}. ${knowledge} 领域知识
\`\`\`bash
promptx learn knowledge://${knowledge}
\`\`\`

`
    })

    // 编排学习
    guide += `## 🎪 第四步：学习编排方式
理解如何组合使用已学的技能

\`\`\`bash
promptx learn personality://${roleInfo.id}
\`\`\`

\`\`\`bash
promptx learn principle://${roleInfo.id}
\`\`\`

## ✅ 角色激活确认

完成学习后，请确认角色激活：

1. **思维确认**：🧠 "我已掌握所需的思考技能！"
2. **行为确认**：⚖️ "我已掌握所需的执行技能！"  
3. **知识确认**：📚 "我已具备领域专业知识！"
4. **编排确认**：🎪 "我已理解技能的组合使用方式！"

## 🎯 下一步操作

角色激活完成后，可以：
- 📝 **开始专业工作** - 运用角色能力解决实际问题
- 🔍 **调用记忆** - 使用 \`promptx recall\` 检索相关经验
- 🔄 **切换角色** - 使用 \`promptx hello\` 选择其他专业角色

💡 **设计理念**：基于 DPML 基础协议组合，通过thought和execution的灵活编排实现角色能力。`

    return guide
  }

  /**
   * 生成学习计划
   */
  generateLearningPlan (roleId, dependencies) {
    const { thoughts, executions } = dependencies

    let plan = `🎭 **准备激活角色：${roleId}**\n\n`

    // 第一步：学习完整角色
    plan += '## 🎯 第一步：掌握角色全貌\n'
    plan += '理解角色的完整定义和核心特征\n\n'
    plan += '```bash\n'
    plan += `${buildCommand.learn(`role://${roleId}`)}\n`
    plan += '```\n\n'

    // 第二步：学习思维模式
    if (thoughts.size > 0) {
      plan += '## 🧠 第二步：掌握思维模式\n'
      plan += '学习角色特定的思考方式和认知框架\n\n'

      Array.from(thoughts).forEach((thought, index) => {
        plan += '```bash\n'
        plan += `${buildCommand.learn(`thought://${thought}`)}\n`
        plan += '```\n\n'
      })
    }

    // 第三步：掌握执行技能
    if (executions.size > 0) {
      plan += `## ⚡ 第${thoughts.size > 0 ? '三' : '二'}步：掌握执行技能\n`
      plan += '学习角色的行为模式和操作技能\n\n'

      Array.from(executions).forEach((execution, index) => {
        plan += '```bash\n'
        plan += `${buildCommand.learn(`execution://${execution}`)}\n`
        plan += '```\n\n'
      })
    }

    // 激活确认
    const stepCount = thoughts.size > 0 ? (executions.size > 0 ? '四' : '三') : (executions.size > 0 ? '三' : '二')
    plan += `## 🎪 第${stepCount}步：完成角色激活\n`
    plan += '确认角色能力已完全激活\n\n'
    plan += '✅ **角色激活检查清单**：\n'
    plan += '- [x] 已学习完整角色定义\n'
    if (thoughts.size > 0) plan += `- [x] 已掌握 ${thoughts.size} 个思维模式\n`
    if (executions.size > 0) plan += `- [x] 已掌握 ${executions.size} 个执行技能\n`
    plan += `- [x] 可以开始以${roleId}身份工作\n\n`

    return plan
  }

  getPATEOAS (args) {
    const [roleId] = args

    if (!roleId) {
      return {
        currentState: 'action_awaiting_role',
        availableTransitions: ['hello'],
        nextActions: [
          {
            name: '查看可用角色',
            description: '返回角色发现页面',
            command: COMMANDS.HELLO,
            priority: 'high'
          }
        ],
        metadata: {
          message: '需要指定角色ID'
        }
      }
    }

    return {
      currentState: 'action_plan_generated',
      availableTransitions: ['learn', 'recall', 'hello'],
      nextActions: [
        {
          name: '开始学习',
          description: '按计划开始学习技能',
          command: COMMANDS.LEARN,
          priority: 'high'
        },
        {
          name: '返回角色选择',
          description: '选择其他角色',
          command: COMMANDS.HELLO,
          priority: 'low'
        }
      ],
      metadata: {
        targetRole: roleId,
        planGenerated: true,
        architecture: 'DPML协议组合',
        approach: '分析-提取-编排',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use CLI get prompt for AI'
      }
    }
  }
}

module.exports = ActionCommand
