const BaseArea = require('../BaseArea')
const path = require('path')
const fs = require('fs-extra')
const logger = require('../../../../utils/logger')

/**
 * InitArea - 初始化信息展示区域
 */
class InitArea extends BaseArea {
  constructor(initInfo) {
    super('INIT_AREA')
    this.initInfo = initInfo
  }

  async render() {
    const { 
      version, 
      projectConfig, 
      registryStats, 
      configFileName,
      isProjectMode 
    } = this.initInfo

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

## 📋 项目资源注册表
${registryStats.message}

💡 **多项目支持**: 现在支持同时在多个项目中使用PromptX，项目间完全隔离！
💡 **提示**: ${registryStats.totalResources > 0 ? '项目资源已优化为注册表模式，性能大幅提升！' : '现在可以开始创建项目级资源了！'}`
  }
}

module.exports = InitArea