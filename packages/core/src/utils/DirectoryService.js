const { DirectoryLocatorFactory } = require('./DirectoryLocator')
const logger = require('./logger')

/**
 * IDE环境检测服务 - 新架构
 * 专注于IDE环境变量检测和配置建议
 * 项目路径管理已移交ProjectManager和ProjectPathResolver
 */
class DirectoryService {
  constructor() {
    this.workspaceLocator = null
    this.initialized = false
  }

  /**
   * 初始化服务
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return
    }

    try {
      this.workspaceLocator = DirectoryLocatorFactory.createPromptXWorkspaceLocator(options)
      this.initialized = true
      
      logger.debug('[DirectoryService] 初始化完成')
    } catch (error) {
      logger.error('[DirectoryService] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 获取IDE环境检测调试信息
   */
  async getDebugInfo(context = {}) {
    await this._ensureInitialized()
    
    // 获取IDE检测信息
    const ideDetectionInfo = this.workspaceLocator?.getDetectionInfo() || {}
    
    return {
      platform: process.platform,
      ideDetection: {
        detectedIDE: ideDetectionInfo.detectedIDE,
        availableEnvVars: ideDetectionInfo.availableEnvVars,
        cwd: process.cwd(),
        args: process.argv.slice(2)
      },
      environment: {
        // 主要IDE环境变量
        WORKSPACE_FOLDER_PATHS: process.env.WORKSPACE_FOLDER_PATHS,
        VSCODE_WORKSPACE_FOLDER: process.env.VSCODE_WORKSPACE_FOLDER,
        PROJECT_ROOT: process.env.PROJECT_ROOT,
        SUBLIME_PROJECT_PATH: process.env.SUBLIME_PROJECT_PATH,
        // PromptX专用
        PROMPTX_WORKSPACE: process.env.PROMPTX_WORKSPACE,
        // 系统环境
        PWD: process.env.PWD,
        NODE_ENV: process.env.NODE_ENV
      },
      recommendations: this._getPathRecommendations(ideDetectionInfo)
    }
  }

  /**
   * 获取路径配置建议
   */
  _getPathRecommendations(ideDetectionInfo = {}) {
    const recommendations = []
    
    if (!ideDetectionInfo.detectedIDE || ideDetectionInfo.detectedIDE === 'Unknown') {
      recommendations.push({
        type: 'env_var',
        message: '未检测到IDE环境变量，建议设置项目路径环境变量',
        suggestions: [
          'export PROMPTX_WORKSPACE="/path/to/your/project"',
          'export PROJECT_ROOT="/path/to/your/project"',
          'export WORKSPACE_ROOT="/path/to/your/project"'
        ]
      })
    }
    
    if (!ideDetectionInfo.availableEnvVars || Object.keys(ideDetectionInfo.availableEnvVars).length === 0) {
      recommendations.push({
        type: 'manual_config',
        message: '建议在IDE中配置MCP工作目录',
        suggestions: [
          'VSCode: 在settings.json中设置workspace.folders',
          'IntelliJ: 在Run Configuration中设置Working directory',
          'Claude IDE: 确保workspace路径正确传递'
        ]
      })
    }
    
    return recommendations
  }

  /**
   * 清除缓存
   */
  clearCache() {
    if (this.workspaceLocator) {
      this.workspaceLocator.clearCache()
    }
    logger.debug('[DirectoryService] 缓存已清除')
  }

  /**
   * 确保服务已初始化
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * 重新加载配置
   */
  async reload(options = {}) {
    this.initialized = false
    this.clearCache()
    await this.initialize(options)
  }
}

// 创建全局单例
const globalDirectoryService = new DirectoryService()

/**
 * 获取全局目录服务实例
 */
function getDirectoryService() {
  return globalDirectoryService
}

module.exports = {
  DirectoryService,
  getDirectoryService
}