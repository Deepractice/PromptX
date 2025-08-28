const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const ProjectManager = require('./ProjectManager')

/**
 * 目录定位器基础抽象类
 * 统一管理所有路径解析逻辑，支持跨平台差异化实现
 */
class DirectoryLocator {
  constructor(options = {}) {
    this.options = options
    this.cache = new Map()
    this.platform = process.platform
  }

  /**
   * 抽象方法：定位目录
   * @param {Object} context - 定位上下文
   * @returns {Promise<string>} 定位到的目录路径
   */
  async locate(context = {}) {
    throw new Error('子类必须实现 locate 方法')
  }

  /**
   * 获取缓存
   */
  getCached(key) {
    return this.cache.get(key)
  }

  /**
   * 设置缓存
   */
  setCached(key, value) {
    this.cache.set(key, value)
    return value
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 检查路径是否存在且是目录
   */
  async isValidDirectory(dirPath) {
    try {
      const stat = await fs.stat(dirPath)
      return stat.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * 规范化路径
   */
  normalizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      return null
    }
    return path.resolve(inputPath)
  }

  /**
   * 展开家目录路径
   */
  expandHome(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return ''
    }
    
    if (filepath.startsWith('~/') || filepath === '~') {
      return path.join(os.homedir(), filepath.slice(2))
    }
    
    return filepath
  }
}

/**
 * 项目根目录定位器
 * 负责查找项目的根目录
 */
class ProjectRootLocator extends DirectoryLocator {
  constructor(options = {}) {
    super(options)
    
    // 初始化AI驱动的项目管理器
    this.projectManager = new ProjectManager()
    
    // 可配置的查找策略优先级（按可靠性和准确性排序）
    this.strategies = options.strategies || [
      'aiProvidedProjectPath',              // 1. AI提供的项目路径（最可靠，由AI告知）
      'existingPromptxDirectory',           // 2. 现有.promptx目录（最可靠的项目标识）
      'packageJsonDirectory',               // 3. 向上查找项目标识文件（最准确的项目边界）
      'gitRootDirectory',                   // 4. Git根目录（通用可靠）
      'currentWorkingDirectoryIfHasMarkers', // 5. 当前目录项目标识（降级策略）
      'currentWorkingDirectory'             // 6. 纯当前目录（最后回退）
    ]
    
    // 项目标识文件
    this.projectMarkers = options.projectMarkers || [
      'package.json',
      '.git',
      'pyproject.toml',
      'Cargo.toml',
      'pom.xml',
      'build.gradle',
      'composer.json'
    ]
  }

  /**
   * 定位项目根目录
   */
  async locate(context = {}) {
    const { startDir = process.cwd() } = context
    const cacheKey = `projectRoot:${startDir}`
    
    // 检查缓存
    const cached = this.getCached(cacheKey)
    if (cached) {
      return cached
    }

    // 使用上下文中的策略或默认策略
    const strategies = context.strategies || this.strategies

    // 按策略优先级查找
    for (const strategy of strategies) {
      const result = await this._executeStrategy(strategy, startDir, context)
      if (result && await this._validateProjectRoot(result, context)) {
        return this.setCached(cacheKey, result)
      }
    }

    // 如果所有策略都失败，返回起始目录
    return this.setCached(cacheKey, startDir)
  }

  /**
   * 执行特定的查找策略
   */
  async _executeStrategy(strategy, startDir, context) {
    switch (strategy) {
      case 'aiProvidedProjectPath':
        return await this._findByAIProvidedPath()
      
      case 'existingPromptxDirectory':
        return await this._findByExistingPromptx(startDir)
      
      case 'currentWorkingDirectoryIfHasMarkers':
        return await this._checkCurrentDirForMarkers(startDir)
      
      case 'packageJsonDirectory':
        return await this._findByProjectMarkers(startDir)
      
      case 'gitRootDirectory':
        return await this._findByGitRoot(startDir)
      
      case 'currentWorkingDirectory':
        return startDir
      
      default:
        return null
    }
  }

  /**
   * 通过AI提供的项目路径查找（最高优先级）
   */
  async _findByAIProvidedPath() {
    try {
      // 注意：多项目环境下需要传入mcpId，这里使用临时ID
      const tempMcpId = process.env.PROMPTX_MCP_ID || `temp-${process.pid}`
      const projects = await this.projectManager.getProjectsByMcpId(tempMcpId)
      const aiProvidedPath = projects.length > 0 ? projects[0].projectPath : null
      if (aiProvidedPath && await this.isValidDirectory(aiProvidedPath)) {
        return aiProvidedPath
      }
    } catch (error) {
      // AI提供的路径获取失败，继续使用其他策略
    }
    return null
  }

  /**
   * 检查当前目录是否包含项目标识文件
   */
  async _checkCurrentDirForMarkers(startDir) {
    const currentDir = path.resolve(startDir)
    
    // 检查当前目录是否包含项目标识文件
    for (const marker of this.projectMarkers) {
      const markerPath = path.join(currentDir, marker)
      if (await fs.pathExists(markerPath)) {
        return currentDir
      }
    }
    
    return null
  }

  /**
   * 通过现有.promptx目录查找
   */
  async _findByExistingPromptx(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      const promptxPath = path.join(currentDir, '.promptx')
      if (await this.isValidDirectory(promptxPath)) {
        return currentDir
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 通过项目标识文件查找
   */
  async _findByProjectMarkers(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      for (const marker of this.projectMarkers) {
        const markerPath = path.join(currentDir, marker)
        if (await fs.pathExists(markerPath)) {
          return currentDir
        }
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 通过Git根目录查找
   */
  async _findByGitRoot(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      const gitPath = path.join(currentDir, '.git')
      if (await fs.pathExists(gitPath)) {
        return currentDir
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 验证项目根目录
   */
  async _validateProjectRoot(projectRoot, context = {}) {
    // Windows平台：避免用户家目录
    if (this.platform === 'win32' && context.avoidUserHome !== false) {
      const homeDir = os.homedir()
      if (path.resolve(projectRoot) === path.resolve(homeDir)) {
        return false
      }
    }

    return await this.isValidDirectory(projectRoot)
  }
}

/**
 * PromptX工作空间定位器
 * 负责确定.promptx目录的位置
 */
class PromptXWorkspaceLocator extends DirectoryLocator {
  constructor(options = {}) {
    super(options)
    this.projectRootLocator = options.projectRootLocator || new ProjectRootLocator(options)
    this.projectManager = new ProjectManager()
  }

  /**
   * 定位PromptX工作空间
   */
  async locate(context = {}) {
    const cacheKey = `promptxWorkspace:${JSON.stringify(context)}`

    // 检查缓存
    const cached = this.getCached(cacheKey)
    if (cached) {
      return cached
    }

    // 策略1：AI提供的项目路径（最高优先级 - AI驱动的路径管理）
    const workspaceFromAI = await this._fromAIProvidedPath()
    if (workspaceFromAI) {
      return this.setCached(cacheKey, workspaceFromAI)
    }

    // 策略2：IDE环境变量（用户/IDE明确指定）
    const workspaceFromIDE = await this._fromIDEEnvironment()
    if (workspaceFromIDE) {
      return this.setCached(cacheKey, workspaceFromIDE)
    }

    // 策略3：PromptX专用环境变量（用户手动配置）
    const workspaceFromEnv = await this._fromPromptXEnvironment()
    if (workspaceFromEnv) {
      return this.setCached(cacheKey, workspaceFromEnv)
    }

    // 策略4：特定上下文策略（如init命令的强制指定）
    if (context.strategies) {
      const workspaceFromProject = await this._fromProjectRoot(context)
      if (workspaceFromProject) {
        return this.setCached(cacheKey, workspaceFromProject)
      }
    }

    // 策略5：现有.promptx目录（已初始化的项目）
    const workspaceFromExisting = await this._fromExistingDirectory(context.startDir)
    if (workspaceFromExisting) {
      return this.setCached(cacheKey, workspaceFromExisting)
    }

    // 策略6：项目根目录（基于项目结构推断）
    const workspaceFromProject = await this._fromProjectRoot(context)
    if (workspaceFromProject) {
      return this.setCached(cacheKey, workspaceFromProject)
    }

    // 策略7：智能回退策略（兜底方案）
    return this.setCached(cacheKey, await this._getSmartFallback(context))
  }

  /**
   * 从AI提供的项目路径获取（最高优先级）
   */
  async _fromAIProvidedPath() {
    try {
      // 注意：多项目环境下需要传入mcpId，这里使用临时ID
      const tempMcpId = process.env.PROMPTX_MCP_ID || `temp-${process.pid}`
      const projects = await this.projectManager.getProjectsByMcpId(tempMcpId)
      const aiProvidedPath = projects.length > 0 ? projects[0].projectPath : null
      if (aiProvidedPath && await this.isValidDirectory(aiProvidedPath)) {
        return aiProvidedPath
      }
    } catch (error) {
      // AI提供的路径获取失败，继续使用其他策略
    }
    return null
  }

  /**
   * 从IDE环境变量获取（支持多种IDE）
   */
  async _fromIDEEnvironment() {
    // IDE环境变量检测策略（按优先级排序）
    const ideStrategies = [
      // Claude IDE (现有格式)
      {
        name: 'Claude IDE',
        vars: ['WORKSPACE_FOLDER_PATHS'],
        parse: (value, varName) => {
          try {
            const folders = JSON.parse(value)
            return Array.isArray(folders) && folders.length > 0 ? folders[0] : null
          } catch {
            return null
          }
        }
      },
      
      // VSCode
      {
        name: 'VSCode',
        vars: ['VSCODE_WORKSPACE_FOLDER', 'VSCODE_CWD'],
        parse: (value, varName) => value
      },
      
      // IntelliJ IDEA / WebStorm / PhpStorm
      {
        name: 'JetBrains IDEs',
        vars: ['PROJECT_ROOT', 'IDEA_INITIAL_DIRECTORY', 'WEBSTORM_PROJECT_PATH'],
        parse: (value, varName) => value
      },
      
      // Sublime Text
      {
        name: 'Sublime Text',
        vars: ['SUBLIME_PROJECT_PATH', 'SUBL_PROJECT_DIR'],
        parse: (value, varName) => value
      },
      
      // Atom
      {
        name: 'Atom',
        vars: ['ATOM_PROJECT_PATH', 'ATOM_HOME_PROJECT'],
        parse: (value, varName) => value
      },
      
      // Vim/Neovim
      {
        name: 'Vim/Neovim',
        vars: ['VIM_PROJECT_ROOT', 'NVIM_PROJECT_ROOT'],
        parse: (value, varName) => value
      },
      
      // 字节跳动 Trae 和其他基于PWD的IDE
      {
        name: 'ByteDance Trae & PWD-based IDEs',
        vars: ['PWD', 'TRAE_WORKSPACE', 'BYTEDANCE_WORKSPACE'],
        parse: (value, varName) => {
          // 对于专用环境变量，直接使用
          if (varName === 'TRAE_WORKSPACE' || varName === 'BYTEDANCE_WORKSPACE') {
            return value
          }
          
          // 对于PWD，只有当它与process.cwd()不同时，才认为是IDE设置的项目路径
          if (varName === 'PWD') {
            const currentCwd = process.cwd()
            if (value && value !== currentCwd) {
              return value
            }
          }
          
          return null
        }
      },
      
      // 通用工作目录
      {
        name: 'Generic',
        vars: ['WORKSPACE_ROOT', 'PROJECT_DIR', 'WORKING_DIRECTORY'],
        parse: (value, varName) => value
      }
    ]

    // 按策略逐一检测
    for (const strategy of ideStrategies) {
      for (const varName of strategy.vars) {
        const envValue = process.env[varName]
        if (envValue && envValue.trim() !== '') {
          // 传递varName给parse函数，支持变量名相关的解析逻辑
          const parsedPath = strategy.parse(envValue.trim(), varName)
          if (parsedPath) {
            const normalizedPath = this.normalizePath(this.expandHome(parsedPath))
            if (normalizedPath && await this.isValidDirectory(normalizedPath)) {
              // 记录检测到的IDE类型（用于调试）
              this._detectedIDE = strategy.name
              return normalizedPath
            }
          }
        }
      }
    }
    
    return null
  }

  /**
   * 从PromptX环境变量获取
   */
  async _fromPromptXEnvironment() {
    const promptxWorkspaceEnv = process.env.PROMPTX_WORKSPACE
    if (promptxWorkspaceEnv && promptxWorkspaceEnv.trim() !== '') {
      const workspacePath = this.normalizePath(this.expandHome(promptxWorkspaceEnv))
      if (workspacePath && await this.isValidDirectory(workspacePath)) {
        return workspacePath
      }
    }
    return null
  }

  /**
   * 从现有.promptx目录获取
   */
  async _fromExistingDirectory(startDir) {
    const projectRoot = await this.projectRootLocator._findByExistingPromptx(startDir || process.cwd())
    return projectRoot
  }

  /**
   * 从项目根目录获取
   */
  async _fromProjectRoot(context) {
    const projectRoot = await this.projectRootLocator.locate(context)
    return projectRoot
  }

  /**
   * 智能回退策略
   */
  async _getSmartFallback(context) {
    // 1. 尝试从命令行参数推断
    const argPath = await this._fromProcessArguments()
    if (argPath && await this.isValidDirectory(argPath)) {
      return argPath
    }

    // 2. 尝试从进程的工作目录
    const processCwd = process.cwd()
    if (await this.isValidDirectory(processCwd)) {
      return processCwd
    }

    // 3. 最后回退到用户主目录
    return os.homedir()
  }

  /**
   * 从进程参数推断项目路径
   */
  async _fromProcessArguments() {
    const args = process.argv
    
    // 查找可能的路径参数
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      // 查找 --project-path 或类似参数
      if (arg.startsWith('--project-path=')) {
        return arg.split('=')[1]
      }
      
      if (arg === '--project-path' && i + 1 < args.length) {
        return args[i + 1]
      }
      
      // 查找 --cwd 参数
      if (arg.startsWith('--cwd=')) {
        return arg.split('=')[1]
      }
      
      if (arg === '--cwd' && i + 1 < args.length) {
        return args[i + 1]
      }
    }
    
    return null
  }

  /**
   * 获取检测调试信息
   */
  getDetectionInfo() {
    return {
      detectedIDE: this._detectedIDE || 'Unknown',
      availableEnvVars: this._getAvailableEnvVars(),
      platform: process.platform,
      cwd: process.cwd(),
      args: process.argv
    }
  }

  /**
   * 获取可用的环境变量
   */
  _getAvailableEnvVars() {
    const relevantVars = [
      'WORKSPACE_FOLDER_PATHS', 'VSCODE_WORKSPACE_FOLDER', 'VSCODE_CWD',
      'PROJECT_ROOT', 'IDEA_INITIAL_DIRECTORY', 'WEBSTORM_PROJECT_PATH',
      'SUBLIME_PROJECT_PATH', 'SUBL_PROJECT_DIR',
      'ATOM_PROJECT_PATH', 'ATOM_HOME_PROJECT',
      'VIM_PROJECT_ROOT', 'NVIM_PROJECT_ROOT',
      'PWD', 'TRAE_WORKSPACE', 'BYTEDANCE_WORKSPACE',
      'WORKSPACE_ROOT', 'PROJECT_DIR', 'WORKING_DIRECTORY',
      'PROMPTX_WORKSPACE'
    ]
    
    const available = {}
    for (const varName of relevantVars) {
      if (process.env[varName]) {
        available[varName] = process.env[varName]
      }
    }
    
    return available
  }
}

/**
 * 目录定位器工厂
 */
class DirectoryLocatorFactory {
  /**
   * 创建项目根目录定位器
   */
  static createProjectRootLocator(options = {}) {
    const platform = process.platform
    
    // 根据平台创建特定实现
    if (platform === 'win32') {
      return new WindowsProjectRootLocator(options)
    } else {
      return new ProjectRootLocator(options)
    }
  }

  /**
   * 创建PromptX工作空间定位器
   */
  static createPromptXWorkspaceLocator(options = {}) {
    const projectRootLocator = this.createProjectRootLocator(options)
    return new PromptXWorkspaceLocator({
      ...options,
      projectRootLocator
    })
  }

  /**
   * 获取平台信息
   */
  static getPlatform() {
    return process.platform
  }
}

/**
 * Windows平台的项目根目录定位器
 * 特殊处理Windows环境下的路径问题
 */
class WindowsProjectRootLocator extends ProjectRootLocator {
  constructor(options = {}) {
    super({
      ...options,
      // Windows默认避免用户家目录
      avoidUserHome: options.avoidUserHome !== false
    })
  }

  /**
   * Windows特有的项目根目录验证
   */
  async _validateProjectRoot(projectRoot, context = {}) {
    // 调用基类验证
    const baseValid = await super._validateProjectRoot(projectRoot, context)
    if (!baseValid) {
      return false
    }

    // Windows特有：避免系统关键目录
    const systemPaths = [
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      'C:\\System Volume Information'
    ]

    const resolvedPath = path.resolve(projectRoot).toUpperCase()
    for (const systemPath of systemPaths) {
      if (resolvedPath.startsWith(systemPath.toUpperCase())) {
        return false
      }
    }

    return true
  }
}

module.exports = {
  DirectoryLocator,
  ProjectRootLocator,
  PromptXWorkspaceLocator,
  DirectoryLocatorFactory,
  WindowsProjectRootLocator
} 