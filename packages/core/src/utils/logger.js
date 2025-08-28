const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * PromptX 日志使用规范
 * ========================
 * 
 * 1. 日志级别使用规范：
 *    - info: 一般信息，如初始化完成、配置加载等
 *    - success: 操作成功，如文件创建成功、命令执行成功
 *    - warn: 警告信息，不影响程序运行但需要注意，如配置缺失使用默认值
 *    - error: 错误信息，影响功能但程序可继续运行
 *    - debug: 调试信息，仅在 DEBUG 环境变量开启时输出
 *    - step: 步骤进度，展示多步骤操作的进展
 *    - log: 原始输出，不带任何前缀和格式
 * 
 * 2. 日志内容规范：
 *    - 优先使用英文，避免编码问题（特别是 Windows 环境）
 *    - 使用清晰的描述，避免缩写和俚语
 *    - 包含足够的上下文信息，如文件路径、角色名称、错误原因
 *    - 错误日志必须包含错误原因和可能的解决方案
 *    - 避免敏感信息，如密码、token 等
 * 
 * 3. 日志格式规范：
 *    ✅ 正确示例（推荐英文）：
 *    logger.info('Role registered successfully', { roleId: 'java-developer', source: 'system' })
 *    logger.error('Failed to read file', { path: filePath, error: error.message })
 *    logger.warn('Config file not found, using defaults', { configPath })
 *    logger.debug('[ToolSandbox] Installing dependencies', { deps: dependencies })
 *    
 *    ❌ 错误示例：
 *    logger.info('ok')  // 信息不明确
 *    logger.error(error) // 缺少上下文
 *    console.log(data)  // 应该使用 logger
 *    logger.info('文件读取失败')  // 避免中文，可能有编码问题
 * 
 * 4. 特殊场景规范：
 *    - MCP 模式下的日志会自动记录实例 ID (mcp-pid)
 *    - 初始化阶段避免过多日志，以免干扰用户界面
 *    - 循环中的日志使用 debug 级别，避免刷屏
 *    - 用户交互相关的重要信息使用 info 或 success
 * 
 * 5. 文件日志：
 *    - 日志自动保存到 ~/.promptx/logs/promptx-YYYY-MM-DD.log
 *    - 默认保留 7 天，可通过 retentionDays 配置
 *    - 每个实例都有唯一的 mcpId 标识
 *    - 文件格式：[时间戳] [实例ID] [级别] 消息内容
 * 
 * 6. 性能考虑：
 *    - 避免在高频调用的代码中打日志
 *    - 大对象使用 debug 级别，避免影响性能
 *    - 文件写入失败不会影响程序运行
 * 
 * 7. 迁移指南：
 *    需要替换的模式：
 *    - console.log() → logger.info() 或 logger.debug()
 *    - console.error() → logger.error()
 *    - console.warn() → logger.warn()
 *    
 *    特殊场景替换：
 *    - console.log(`[${module}] ${msg}`) → logger.debug(`[${module}] ${msg}`)
 *    - console.error('未捕获的异常:', err) → logger.error('未捕获的异常', { error: err.message, stack: err.stack })
 *    
 *    MCP 相关日志规范：
 *    - MCP 调试信息使用 debug 级别
 *    - MCP 错误使用 error 级别，包含完整错误栈
 *    - 工具执行日志使用 info 级别
 * 
 * 8. 模块化日志实例：
 *    各模块可创建自己的 logger 实例：
 *    const logger = new Logger({ prefix: 'ModuleName' })
 *    
 *    这样可以：
 *    - 区分不同模块的日志来源
 *    - 独立控制模块的日志级别
 *    - 便于日志分析和问题定位
 * 
 * 9. MCP 模式特殊处理：
 *    MCP 协议模式需要特殊的输出处理：
 *    const MCPProtocol = require('~/mcp/MCPProtocol')
 *    
 *    - MCPProtocol.send(msg) - JSON-RPC 协议消息（输出到 stdout）
 *    - logger.debug('[MCP] ...') - MCP 相关日志（输出到 stderr）
 *    
 *    使用原则：
 *    - 只有 JSON-RPC 协议消息才使用 MCPProtocol.send()
 *    - MCP 相关的调试日志就用普通 logger，加 [MCP] 前缀
 *    - 保持简单，不要过度设计
 */

/**
 * 日志工具
 * 提供彩色和格式化的日志输出，支持文件落盘
 */
class Logger {
  constructor (options = {}) {
    this.silent = options.silent || false
    this.prefix = options.prefix || 'PromptX'
    this.mcpId = `mcp-${process.pid}` // 使用进程 ID 作为实例标识
    this.logToFile = options.logToFile !== false // 默认开启文件日志
    this.logDir = options.logDir || path.join(os.homedir(), '.promptx', 'logs')
    this.retentionDays = options.retentionDays || 7 // 默认保留 7 天
    this.logStream = null
    
    // 初始化文件日志
    if (this.logToFile && !this.silent) {
      this.initFileLogging()
    }
  }

  /**
   * 初始化文件日志系统
   */
  initFileLogging () {
    try {
      // 确保日志目录存在
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }

      // 清理过期日志
      this.cleanOldLogs()

      // 创建今天的日志文件
      const today = new Date().toISOString().split('T')[0]
      const logFile = path.join(this.logDir, `promptx-${today}.log`)
      
      // 使用追加模式打开文件流
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' })
      
      // 写入启动标记
      this.writeToFile('INFO', `\n${'='.repeat(80)}\nPromptX started - Instance: ${this.mcpId}\n${'='.repeat(80)}`)
    } catch (error) {
      // 文件日志初始化失败不影响控制台输出
      console.error('Failed to initialize file logging:', error.message)
    }
  }

  /**
   * 清理过期的日志文件
   */
  cleanOldLogs () {
    try {
      const files = fs.readdirSync(this.logDir)
      const now = Date.now()
      const maxAge = this.retentionDays * 24 * 60 * 60 * 1000

      files.forEach(file => {
        if (file.startsWith('promptx-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file)
          const stats = fs.statSync(filePath)
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath)
          }
        }
      })
    } catch (error) {
      // 清理失败不影响正常运行
    }
  }

  /**
   * 格式化日志条目
   */
  formatLogEntry (level, message, ...args) {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg)
        } catch (e) {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
    
    return `[${timestamp}] [${this.mcpId}] [${level}] ${message} ${formattedArgs}`.trim()
  }

  /**
   * 写入日志文件
   */
  writeToFile (level, message, ...args) {
    if (this.logStream && this.logStream.writable) {
      try {
        const logEntry = this.formatLogEntry(level, message, ...args)
        this.logStream.write(logEntry + '\n')
      } catch (error) {
        // 写入失败不影响程序运行
      }
    }
  }

  /**
   * 信息日志
   */
  info (message, ...args) {
    if (this.silent) return
    console.error(chalk.blue('ℹ'), message, ...args)
    this.writeToFile('INFO', message, ...args)
  }

  /**
   * 成功日志
   */
  success (message, ...args) {
    if (this.silent) return
    console.error(chalk.green('✅'), message, ...args)
    this.writeToFile('SUCCESS', message, ...args)
  }

  /**
   * 警告日志
   */
  warn (message, ...args) {
    if (this.silent) return
    console.error(chalk.yellow('⚠️'), chalk.yellow(message), ...args)
    this.writeToFile('WARN', message, ...args)
  }

  /**
   * 错误日志
   */
  error (message, ...args) {
    if (this.silent) return
    console.error(chalk.red('❌'), chalk.red(message), ...args)
    this.writeToFile('ERROR', message, ...args)
  }

  /**
   * 调试日志
   */
  debug (message, ...args) {
    if (this.silent || !process.env.DEBUG) return
    console.error(chalk.gray('🐛'), chalk.gray(message), ...args)
    this.writeToFile('DEBUG', message, ...args)
  }

  /**
   * 步骤日志（用于显示进度）
   */
  step (message, ...args) {
    if (this.silent) return
    console.error(chalk.cyan('▶️'), message, ...args)
    this.writeToFile('STEP', message, ...args)
  }

  /**
   * 直接输出（不带前缀）
   */
  log (message, ...args) {
    if (this.silent) return
    console.error(message, ...args)
    this.writeToFile('LOG', message, ...args)
  }

  /**
   * 空行
   */
  newLine () {
    if (this.silent) return
    console.error('')
  }

  /**
   * 分隔线
   */
  separator (char = '=', length = 80) {
    if (this.silent) return
    console.error(chalk.gray(char.repeat(length)))
    this.writeToFile('LOG', char.repeat(length))
  }

  /**
   * 关闭日志流
   */
  close () {
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }
  }
}

// 导出默认实例
const logger = new Logger()

module.exports = logger
module.exports.Logger = Logger
