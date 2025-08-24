import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { app } from 'electron'

/**
 * Desktop 日志工具
 * 基于 PromptX logger 的 TypeScript 版本
 * 日志写入 ~/.promptx/logs/desktop.log
 */
export class Logger {
  private silent: boolean
  private prefix: string
  private instanceId: string
  private logToFile: boolean
  private logDir: string
  private retentionDays: number
  private logStream: fs.WriteStream | null = null

  constructor(options: {
    silent?: boolean
    prefix?: string
    logToFile?: boolean
    logDir?: string
    retentionDays?: number
  } = {}) {
    this.silent = options.silent || false
    this.prefix = options.prefix || 'Desktop'
    this.instanceId = `desktop-${process.pid}`
    this.logToFile = options.logToFile !== false
    this.logDir = options.logDir || path.join(os.homedir(), '.promptx', 'logs')
    this.retentionDays = options.retentionDays || 7

    if (this.logToFile && !this.silent) {
      this.initFileLogging()
    }
  }

  private initFileLogging(): void {
    try {
      // Ensure log directory exists
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }

      // Clean old logs
      this.cleanOldLogs()

      // Create today's log file
      const today = new Date().toISOString().split('T')[0]
      const logFile = path.join(this.logDir, `desktop-${today}.log`)
      
      // Open file stream in append mode
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' })
      
      // Write startup marker
      const separator = '='.repeat(80)
      this.writeToFile('INFO', `\n${separator}\nDesktop App Started - Instance: ${this.instanceId}\n${separator}`)
    } catch (error: any) {
      console.error('Failed to initialize file logging:', error.message)
    }
  }

  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
      const now = Date.now()
      const maxAge = this.retentionDays * 24 * 60 * 60 * 1000

      files.forEach(file => {
        if (file.startsWith('desktop-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file)
          const stats = fs.statSync(filePath)
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath)
          }
        }
      })
    } catch (error) {
      // Ignore cleanup failures
    }
  }

  private formatLogEntry(level: string, message: string, ...args: any[]): string {
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
    
    return `[${timestamp}] [${this.instanceId}] [${level}] ${message} ${formattedArgs}`.trim()
  }

  private writeToFile(level: string, message: string, ...args: any[]): void {
    if (this.logStream && this.logStream.writable) {
      try {
        const logEntry = this.formatLogEntry(level, message, ...args)
        this.logStream.write(logEntry + '\n')
      } catch (error) {
        // Ignore write failures
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.silent) return
    console.log(`ℹ ${message}`, ...args)
    this.writeToFile('INFO', message, ...args)
  }

  success(message: string, ...args: any[]): void {
    if (this.silent) return
    console.log(`✅ ${message}`, ...args)
    this.writeToFile('SUCCESS', message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    if (this.silent) return
    console.warn(`⚠️ ${message}`, ...args)
    this.writeToFile('WARN', message, ...args)
  }

  error(message: string, ...args: any[]): void {
    if (this.silent) return
    console.error(`❌ ${message}`, ...args)
    this.writeToFile('ERROR', message, ...args)
  }

  debug(message: string, ...args: any[]): void {
    if (this.silent || !process.env.DEBUG) return
    console.log(`🐛 ${message}`, ...args)
    this.writeToFile('DEBUG', message, ...args)
  }

  step(message: string, ...args: any[]): void {
    if (this.silent) return
    console.log(`▶️ ${message}`, ...args)
    this.writeToFile('STEP', message, ...args)
  }

  log(message: string, ...args: any[]): void {
    if (this.silent) return
    console.log(message, ...args)
    this.writeToFile('LOG', message, ...args)
  }

  separator(char: string = '=', length: number = 80): void {
    if (this.silent) return
    const line = char.repeat(length)
    console.log(line)
    this.writeToFile('LOG', line)
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }
  }
}

// Export default logger instance
export const logger = new Logger()

// Export for module-specific loggers
export default logger