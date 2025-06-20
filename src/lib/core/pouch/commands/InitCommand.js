const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { COMMANDS } = require('../../../../constants')
const { getDirectoryService } = require('../../../utils/DirectoryService')
const RegistryData = require('../../resource/RegistryData')
const ProjectDiscovery = require('../../resource/discovery/ProjectDiscovery')
const CurrentProjectManager = require('../../../utils/CurrentProjectManager')
const logger = require('../../../utils/logger')
const path = require('path')
const fs = require('fs-extra')

/**
 * 初始化锦囊命令
 * 负责准备工作环境和传达系统协议
 */
class InitCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用全局单例 ResourceManager
    this.resourceManager = getGlobalResourceManager()
    this.projectDiscovery = new ProjectDiscovery()
    this.directoryService = getDirectoryService()
    this.currentProjectManager = new CurrentProjectManager()
  }

  getPurpose () {
    return '初始化PromptX工作环境，创建必要的配置目录和文件，生成项目级资源注册表'
  }

  async getContent (args) {
    // 获取工作目录参数，支持两种格式：
    // 1. 来自MCP的对象格式：{ workingDirectory: "path" }
    // 2. 来自CLI的字符串格式：["path"]
    let workingDirectory
    
    if (args && typeof args[0] === 'object' && args[0].workingDirectory) {
      // MCP格式
      workingDirectory = args[0].workingDirectory
    } else if (args && typeof args[0] === 'string') {
      // CLI格式
      workingDirectory = args[0]
    } else if (args && args.length > 0 && args[0]) {
      // 兜底：直接取第一个参数
      workingDirectory = args[0]
    }
    
    let projectPath
    
    if (workingDirectory) {
      // AI提供了工作目录，使用AI提供的路径
      projectPath = path.resolve(workingDirectory)
      
      // 验证AI提供的路径是否有效
      if (!await this.currentProjectManager.validateProjectPath(projectPath)) {
        return `❌ 提供的工作目录无效: ${projectPath}
        
请确保：
1. 路径存在且为目录
2. 不是用户主目录
3. 具有适当的访问权限

💡 请提供一个有效的项目目录路径。`
      }
      
      // 保存AI提供的项目路径
      await this.currentProjectManager.setCurrentProject(projectPath)
      
    } else {
      // AI没有提供工作目录，检查是否已有保存的项目
      const savedProject = await this.currentProjectManager.getCurrentProject()
      
      if (savedProject) {
        // 使用之前保存的项目路径
        projectPath = savedProject
      } else {
        // 没有保存的项目，要求AI提供
        return `🎯 PromptX需要知道当前项目的工作目录。

请在调用此工具时提供 workingDirectory 参数，例如：
- workingDirectory: "/Users/sean/WorkSpaces/DeepracticeProjects/PromptX"

💡 你当前工作在哪个项目目录？请提供完整的绝对路径。`
      }
    }

    // 构建统一的查找上下文，使用确定的项目路径
    const context = {
      startDir: projectPath,
      platform: process.platform,
      avoidUserHome: true,
      // init命令特有：优先当前目录，不查找现有.promptx
      strategies: [
        'currentWorkingDirectoryIfHasMarkers',
        'currentWorkingDirectory'
      ]
    }

    // 1. 获取版本信息
    const version = await this.getVersionInfo()

    // 2. 基础环境准备 - 创建 .promptx 目录
    await this.ensurePromptXDirectory(context)

    // 3. 生成项目级资源注册表
    const registryStats = await this.generateProjectRegistry(context)

    // 4. 刷新全局 ResourceManager（确保新资源立即可用）
    await this.refreshGlobalResourceManager()

    return `🎯 PromptX 初始化完成！

## 📦 版本信息
✅ **PromptX v${version}** - AI专业能力增强框架

## 🏗️ 环境准备
✅ 创建了 \`.promptx\` 配置目录
✅ 工作环境就绪

## 📋 项目资源注册表
${registryStats.message}

## 🚀 下一步建议
- 使用 \`welcome\` 发现可用的专业角色
- 使用 \`action\` 激活特定角色获得专业能力  
- 使用 \`learn\` 深入学习专业知识
- 使用 \`remember/recall\` 管理专业记忆

💡 **提示**: ${registryStats.totalResources > 0 ? '项目资源已优化为注册表模式，性能大幅提升！' : '现在可以开始创建项目级资源了！'}`
  }

  /**
   * 生成项目级资源注册表
   * @param {Object} context - 查找上下文
   * @returns {Promise<Object>} 注册表生成统计信息
   */
  async generateProjectRegistry(context) {
    try {
      // 1. 使用统一的目录服务获取项目根目录
      const projectRoot = await this.directoryService.getProjectRoot(context)
      const resourceDir = await this.directoryService.getResourceDirectory(context)
      const domainDir = path.join(resourceDir, 'domain')
      
      // 2. 确保目录结构存在
      await fs.ensureDir(domainDir)
      logger.debug(`[InitCommand] 确保目录结构存在: ${domainDir}`)

      // 3. 使用 ProjectDiscovery 的正确方法生成注册表
      logger.step('正在扫描项目资源...')
      const registryData = await this.projectDiscovery.generateRegistry(projectRoot)
      
      // 4. 生成统计信息
      const stats = registryData.getStats()
      const registryPath = await this.directoryService.getRegistryPath(context)

      if (registryData.size === 0) {
        return {
          message: `✅ 项目资源目录已创建，注册表已初始化
   📂 目录: ${path.relative(process.cwd(), domainDir)}
   💾 注册表: ${path.relative(process.cwd(), registryPath)}
   💡 现在可以在 domain 目录下创建角色资源了`,
          totalResources: 0
        }
      }

      return {
        message: `✅ 项目资源注册表已重新生成
   📊 总计: ${registryData.size} 个资源
   📋 分类: role(${stats.byProtocol.role || 0}), thought(${stats.byProtocol.thought || 0}), execution(${stats.byProtocol.execution || 0}), knowledge(${stats.byProtocol.knowledge || 0})
   💾 位置: ${path.relative(process.cwd(), registryPath)}`,
        totalResources: registryData.size
      }
      
    } catch (error) {
      logger.error('生成项目注册表时出错:', error)
      return {
        message: `❌ 生成项目注册表失败: ${error.message}`,
        totalResources: 0
      }
    }
  }

  /**
   * 确保 .promptx 基础目录存在
   * 使用统一的目录服务创建基础环境
   */
  async ensurePromptXDirectory (context) {
    const promptxDir = await this.directoryService.getPromptXDirectory(context)
    await fs.ensureDir(promptxDir)
    logger.debug(`[InitCommand] 确保.promptx目录存在: ${promptxDir}`)
  }

  /**
   * 刷新全局 ResourceManager
   * 确保新创建的资源立即可用，无需重启 MCP Server
   */
  async refreshGlobalResourceManager() {
    try {
      logger.debug('[InitCommand] 刷新全局 ResourceManager...')
      
      // 重新初始化 ResourceManager，清除缓存并重新发现资源
      await this.resourceManager.initializeWithNewArchitecture()
      
      logger.debug('[InitCommand] 全局 ResourceManager 刷新完成')
    } catch (error) {
      logger.warn(`[InitCommand] 刷新 ResourceManager 失败: ${error.message}`)
      // 不抛出错误，避免影响 init 命令的主要功能
    }
  }

  /**
   * 获取版本信息
   */
  async getVersionInfo () {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../../../../package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath)
        const baseVersion = packageJson.version || '未知版本'
        const nodeVersion = process.version
        const packageName = packageJson.name || 'dpml-prompt'
        
        return `${baseVersion} (${packageName}@${baseVersion}, Node.js ${nodeVersion})`
      }
    } catch (error) {
      logger.warn('无法读取版本信息:', error.message)
    }
    return '未知版本'
  }

  async getPATEOAS (args) {
    const version = await this.getVersionInfo()
    return {
      currentState: 'initialized',
      availableTransitions: ['welcome', 'action', 'learn', 'recall', 'remember'],
      nextActions: [
        {
          name: '发现专业角色',
          description: '查看所有可用的AI专业角色',
          method: 'MCP PromptX welcome 工具',
          priority: 'recommended'
        },
        {
          name: '激活专业角色',
          description: '直接激活特定专业角色（如果已知角色ID）',
          method: 'MCP PromptX action 工具',
          priority: 'optional'
        }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        version: version,
        description: 'PromptX专业能力增强系统已就绪'
      }
    }
  }


}

module.exports = InitCommand
