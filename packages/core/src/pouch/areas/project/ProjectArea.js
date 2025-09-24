const BaseArea = require('../BaseArea')

/**
 * ProjectArea - 项目信息展示区域
 */
class ProjectArea extends BaseArea {
  constructor(projectInfo) {
    super('PROJECT_AREA')
    this.projectInfo = projectInfo
  }

  async render() {
    const {
      version,
      projectConfig,
      registryStats,
      configFileName,
      isProjectMode,
      error
    } = this.projectInfo

    // 如果有错误，显示错误信息
    if (error) {
      return this.renderError(error)
    }

    if (!isProjectMode) {
      return `📁 PromptX 项目配置工具

当前状态：**全局模式**（未绑定特定项目）

✅ **所有功能均可正常使用**，包括：
- 角色激活 (action)
- 资源学习 (learn)
- 记忆管理 (recall/remember)
- 工具执行 (tool)

💡 **仅在以下情况需要项目配置**：
- 需要多项目隔离
- 需要项目级配置
- 需要项目特定资源

如需绑定项目，请提供 workingDirectory 参数。`
    }

    return `🎯 PromptX 初始化完成！

## 📦 版本信息
✅ **PromptX v${version}** - AI专业能力增强框架

## 🏗️ 多项目环境准备
✅ 创建了 \`.promptx\` 配置目录
✅ 项目已注册到MCP实例: **${projectConfig.mcpId}** (${projectConfig.ideType})
✅ 项目路径: ${projectConfig.projectPath}
✅ 配置文件: ${configFileName}

## 📋 项目资源
${registryStats.message}
${projectConfig.resourcesDiscovered > 0 ? `✅ 已发现 **${projectConfig.resourcesDiscovered}** 个项目资源（角色、工具等）` : '📂 项目资源目录已准备，可创建项目专属资源'}

💡 **多项目支持**: 现在支持同时在多个项目中使用PromptX，项目间完全隔离！
💡 **提示**: ${registryStats.totalResources > 0 || projectConfig.resourcesDiscovered > 0 ? '项目资源已加载，使用 discover 查看所有资源' : '在 .promptx/resource 目录下创建角色和工具'}`
  }

  /**
   * 渲染错误信息
   * @param {Object} error - 错误对象
   * @returns {string} 格式化的错误信息
   */
  renderError(error) {
    const { type, path, message } = error

    // 根据错误类型生成建议
    let suggestions = []
    switch (type) {
      case 'not_exists':
        suggestions = [
          '检查路径拼写是否正确',
          '确认目录确实存在',
          '可以先用 ls 或 pwd 命令确认当前位置'
        ]
        break
      case 'not_directory':
        suggestions = [
          '提供项目的根目录，而不是文件路径',
          '示例：使用 /path/to/project 而不是 /path/to/project/file.txt'
        ]
        break
      case 'is_home':
        suggestions = [
          '请选择一个具体的项目文件夹',
          '建议在 ~/projects 或 ~/workspace 下创建项目'
        ]
        break
      case 'access_error':
        suggestions = [
          '检查目录权限设置',
          '尝试使用有权限的目录'
        ]
        break
      default:
        suggestions = ['请提供一个有效的项目目录路径']
    }

    return `❌ **项目初始化失败**

## 🔍 问题诊断
**提供的路径**: ${path || '(未提供)'}
**错误原因**: ${message}

## 💡 AI 提示
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 📝 正确示例
\`\`\`
# 使用当前目录（如果你在项目中）
project(".")

# 使用绝对路径
project("/Users/yourname/projects/myproject")

# 使用 pwd 确认位置
先执行: pwd
然后: project("<显示的路径>")
\`\`\`

⚠️ **注意**: 必须提供已存在的项目目录，不能是文件路径或用户主目录。`
  }
}

module.exports = ProjectArea