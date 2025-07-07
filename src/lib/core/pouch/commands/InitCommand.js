const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { COMMANDS } = require('../../../../constants')
const RegistryData = require('../../resource/RegistryData')
const ProjectDiscovery = require('../../resource/discovery/ProjectDiscovery')
const ProjectManager = require('../../../utils/ProjectManager')
const { getGlobalProjectManager } = require('../../../utils/ProjectManager')
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
    // 延迟初始化：这些组件可能依赖项目状态，在 getContent 中按需初始化
    this.resourceManager = null
    this.projectDiscovery = null
    this.projectManager = null
  }

  getPurpose () {
    return '初始化PromptX工作环境，创建必要的配置目录和文件，生成项目级资源注册表'
  }

  async getContent (args) {
    // 获取参数，支持两种格式：
    // 1. 来自MCP的对象格式：{ workingDirectory: "path", ideType: "cursor" }
    // 2. 来自CLI的字符串格式：["path"]
    let workingDirectory, userIdeType
    
    if (args && typeof args[0] === 'object') {
      // MCP格式
      workingDirectory = args[0].workingDirectory
      userIdeType = args[0].ideType
    } else if (args && typeof args[0] === 'string') {
      // CLI格式
      workingDirectory = args[0]
      // CLI格式暂不支持IDE类型参数，使用自动检测
    }
    
    if (!workingDirectory) {
      return `🎯 PromptX需要知道当前项目的工作目录。

请在调用此工具时提供参数：
📍 **必需参数**：
- workingDirectory: "/Users/sean/WorkSpaces/DeepracticeProjects/PromptX"

🎯 **可选参数**：
- ideType: "cursor" | "vscode" | "claude" 等（不提供则自动检测为unknown）

💡 你当前工作在哪个项目目录？请提供完整的绝对路径。`
    }
    
    // 解码中文路径并解析
    const decodedWorkingDirectory = decodeURIComponent(workingDirectory)
    const projectPath = path.resolve(decodedWorkingDirectory)
    
    // 🎯 第一优先级：立即设置项目状态，确保后续所有操作都有正确的项目上下文
    // 在任何依赖项目状态的操作之前，必须先设置当前项目状态
    const detectedIdeType = this.detectIdeType()
    let ideType = userIdeType || detectedIdeType || 'unknown'
    
    // 规范化IDE类型（移除特殊字符，转小写）
    if (userIdeType) {
      ideType = userIdeType.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || 'unknown'
    }
    
    // 基础路径验证（使用简单的 fs 检查，避免依赖 ProjectManager 实例方法）
    if (!await this.validateProjectPathDirectly(projectPath)) {
      return `❌ 提供的工作目录无效: ${projectPath}
      
请确保：
1. 路径存在且为目录
2. 不是用户主目录
3. 具有适当的访问权限

💡 请提供一个有效的项目目录路径。`
    }
    
    // 使用统一项目注册方法（从ServerEnvironment获取服务信息）
    // 这将设置 ProjectManager.currentProject 状态，确保后续操作有正确的项目上下文
    const projectConfig = await ProjectManager.registerCurrentProject(projectPath, ideType)
    
    logger.debug(`[InitCommand] 🎯 项目状态已设置: ${projectConfig.projectPath} -> ${projectConfig.mcpId} (${ideType}) [${projectConfig.transport}]`)
    logger.debug(`[InitCommand] IDE类型: ${userIdeType ? `用户指定(${ideType})` : `自动检测(${detectedIdeType})`}`)

    // 现在项目状态已设置，可以安全初始化依赖组件
    this.resourceManager = getGlobalResourceManager()
    this.projectDiscovery = new ProjectDiscovery()
    this.projectManager = getGlobalProjectManager()

    // 1. 获取版本信息
    const version = await this.getVersionInfo()

    // 2. 基础环境准备 - 现在可以安全使用项目路径
    await this.ensurePromptXDirectory(projectPath)

    // 3. 生成项目级资源注册表 - 现在 ProjectDiscovery 可以正确获取项目路径
    const registryStats = await this.generateProjectRegistry(projectPath)

    // 4. 最后步骤：刷新全局 ResourceManager
    // 确保所有依赖项目状态的组件都已正确初始化后，再初始化 ResourceManager
    await this.refreshGlobalResourceManager()

    // 生成配置文件名
    const configFileName = this.projectManager.generateConfigFileName(projectConfig.mcpId, ideType, projectConfig.transport, projectPath)

    return `🎯 PromptX 初始化完成！

## 📦 版本信息
✅ **PromptX v${version}** - AI专业能力增强框架

## 🏗️ 多项目环境准备
✅ 创建了 \`.promptx\` 配置目录
✅ 项目已注册到MCP实例: **${projectConfig.mcpId}** (${ideType})
✅ 项目路径: ${projectConfig.projectPath}
✅ 配置文件: ${configFileName}

## 📋 项目资源注册表
${registryStats.message}

## 🚀 下一步建议
- 使用 \`welcome\` 发现可用的专业角色
- 使用 \`action\` 激活特定角色获得专业能力  
- 使用 \`learn\` 深入学习专业知识
- 使用 \`remember/recall\` 管理专业记忆

💡 **多项目支持**: 现在支持同时在多个项目中使用PromptX，项目间完全隔离！
💡 **提示**: ${registryStats.totalResources > 0 ? '项目资源已优化为注册表模式，性能大幅提升！' : '现在可以开始创建项目级资源了！'}`
  }

  /**
   * 生成项目级资源注册表
   * @param {string} projectPath - AI提供的项目路径
   * @returns {Promise<Object>} 注册表生成统计信息
   */
  async generateProjectRegistry(projectPath) {
    try {
      // 1. 直接基于AI提供的项目路径计算资源目录
      const resourceDir = path.join(projectPath, '.promptx', 'resource')
      const registryPath = path.join(resourceDir, 'project.registry.json')
      
      // 2. 确保资源目录存在
      await fs.ensureDir(resourceDir)
      logger.debug(`[InitCommand] 确保资源目录存在: ${resourceDir}`)

      // 3. 使用 ProjectDiscovery 的正确方法生成注册表
      logger.step('正在扫描项目资源...')
      const registryData = await this.projectDiscovery.generateRegistry(projectPath)
      
      // 4. 生成统计信息
      const stats = registryData.getStats()

      if (registryData.size === 0) {
        return {
          message: `✅ 项目资源目录已创建，注册表已初始化
   📂 目录: ${path.relative(process.cwd(), resourceDir)}
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
   * 直接基于AI提供的项目路径创建目录
   */
  async ensurePromptXDirectory (projectPath) {
    const promptxDir = path.join(projectPath, '.promptx')
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

  /**
   * 直接验证项目路径（避免依赖 ProjectManager 实例）
   * @param {string} projectPath - 要验证的路径
   * @returns {Promise<boolean>} 是否为有效项目目录
   */
  async validateProjectPathDirectly(projectPath) {
    try {
      const os = require('os')
      
      // 基础检查：路径存在且为目录
      const stat = await fs.stat(projectPath)
      if (!stat.isDirectory()) {
        return false
      }

      // 简单检查：避免明显错误的路径
      const resolved = path.resolve(projectPath)
      const homeDir = os.homedir()
      
      // 不允许是用户主目录
      if (resolved === homeDir) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 检测IDE类型
   * @returns {string} IDE类型
   */
  detectIdeType() {
    // 检测常见的IDE环境变量
    const ideStrategies = [
      // Claude IDE
      { name: 'claude', vars: ['WORKSPACE_FOLDER_PATHS'] },
      // Cursor
      { name: 'cursor', vars: ['CURSOR_USER', 'CURSOR_SESSION_ID'] },
      // VSCode
      { name: 'vscode', vars: ['VSCODE_WORKSPACE_FOLDER', 'VSCODE_CWD', 'TERM_PROGRAM'] },
      // JetBrains IDEs  
      { name: 'jetbrains', vars: ['IDEA_INITIAL_DIRECTORY', 'PYCHARM_HOSTED'] },
      // Vim/Neovim
      { name: 'vim', vars: ['VIM', 'NVIM'] }
    ]

    for (const strategy of ideStrategies) {
      for (const envVar of strategy.vars) {
        if (process.env[envVar]) {
          // 特殊处理VSCode的TERM_PROGRAM
          if (envVar === 'TERM_PROGRAM' && process.env[envVar] === 'vscode') {
            return 'vscode'
          }
          // 其他环境变量存在即认为是对应IDE
          if (envVar !== 'TERM_PROGRAM') {
            return strategy.name
          }
        }
      }
    }

    // 检测进程名称
    const processTitle = process.title || ''
    if (processTitle.includes('cursor')) return 'cursor'
    if (processTitle.includes('code')) return 'vscode'
    if (processTitle.includes('claude')) return 'claude'

    // 检测命令行参数
    const argv = process.argv.join(' ')
    if (argv.includes('cursor')) return 'cursor'
    if (argv.includes('code')) return 'vscode'
    if (argv.includes('claude')) return 'claude'

    return 'unknown'
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
