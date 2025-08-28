/**
 * @promptx/logger - Unified logging system for PromptX using Pino
 * Features:
 * - Console with pretty print and caller location
 * - File logging with daily rotation
 * - Configurable log levels
 * - Color support for console output
 */

import pino from 'pino'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Logger configuration interface
export interface LoggerConfig {
  level?: string
  console?: boolean
  file?: boolean | {
    dirname?: string
  }
  colors?: boolean
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  console: true,
  file: {
    dirname: path.join(os.homedir(), '.promptx', 'logs')
  },
  colors: true
}

// Get caller information from stack
function getCallerInfo() {
  const stack = new Error().stack || ''
  const stackLines = stack.split('\n')
  
  // Find first non-logger stack frame
  for (let i = 2; i < stackLines.length; i++) {
    const line = stackLines[i]
    if (line && 
        !line.includes('node_modules/pino') &&
        !line.includes('packages/logger') &&
        !line.includes('@promptx/logger')) {
      
      const match = line.match(/at\s+(?:.*?\s+)?\(?(.*?):(\d+):(\d+)\)?/)
      if (match && match[1] && match[2]) {
        const fullPath = match[1]
        const lineNum = parseInt(match[2], 10)
        
        // Extract package name
        let packageName = 'app'
        const packageMatch = fullPath.match(/packages\/([^\/]+)/) || 
                             fullPath.match(/@promptx\/([^\/]+)/)
        if (packageMatch) {
          packageName = `@promptx/${packageMatch[1]}`
        }
        
        // Get filename only
        const filename = path.basename(fullPath)
        
        return {
          package: packageName,
          file: filename,
          line: lineNum
        }
      }
    }
  }
  
  return { package: 'app', file: 'unknown', line: 0 }
}

// Create logger instance
export function createLogger(config: LoggerConfig = {}): pino.Logger {
  const finalConfig = { ...defaultConfig, ...config }
  
  // Ensure log directory exists
  if (finalConfig.file) {
    const fileConfig = typeof finalConfig.file === 'object' ? finalConfig.file : {}
    const logDir = fileConfig.dirname || path.join(os.homedir(), '.promptx', 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }
  
  // Build transports configuration
  const targets: any[] = []
  
  // Console transport
  if (finalConfig.console) {
    targets.push({
      target: 'pino-pretty',
      level: finalConfig.level,
      options: {
        colorize: finalConfig.colors,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        ignore: 'hostname',
        messageFormat: '[{time}] [PID:{pid}] {package} [{file}:{line}] {msg}'
      }
    })
  }
  
  // File transport
  if (finalConfig.file) {
    const fileConfig = typeof finalConfig.file === 'object' ? finalConfig.file : {}
    const logDir = fileConfig.dirname || path.join(os.homedir(), '.promptx', 'logs')
    const today = new Date().toISOString().split('T')[0]
    
    targets.push({
      target: 'pino/file',
      level: finalConfig.level,
      options: {
        destination: path.join(logDir, `promptx-${today}.log`)
      }
    })
    
    // Separate error log
    targets.push({
      target: 'pino/file',
      level: 'error',
      options: {
        destination: path.join(logDir, `promptx-error-${today}.log`)
      }
    })
  }
  
  // Create logger with transports
  if (targets.length > 0) {
    return pino({
      level: finalConfig.level || 'info',
      base: { pid: process.pid },
      mixin: () => getCallerInfo(),
      transport: {
        targets
      }
    })
  }
  
  // Fallback to basic logger if no transports
  return pino({
    level: finalConfig.level || 'info',
    base: { pid: process.pid },
    mixin: () => getCallerInfo()
  })
}

// Default logger instance
const logger = createLogger()

// Export convenience methods
export const error = (msg: string | object, ...args: any[]) => {
  if (typeof msg === 'string') {
    logger.error(msg)
  } else {
    logger.error(msg, args[0] || '')
  }
}

export const warn = (msg: string | object, ...args: any[]) => {
  if (typeof msg === 'string') {
    logger.warn(msg)
  } else {
    logger.warn(msg, args[0] || '')
  }
}

export const info = (msg: string | object, ...args: any[]) => {
  if (typeof msg === 'string') {
    logger.info(msg)
  } else {
    logger.info(msg, args[0] || '')
  }
}

export const debug = (msg: string | object, ...args: any[]) => {
  if (typeof msg === 'string') {
    logger.debug(msg)
  } else {
    logger.debug(msg, args[0] || '')
  }
}

export const verbose = (msg: string | object, ...args: any[]) => {
  if (typeof msg === 'string') {
    logger.trace(msg)
  } else {
    logger.trace(msg, args[0] || '')
  }
}

export const log = (level: string, msg: string, ...args: any[]) => {
  const method = (logger as any)[level]
  if (typeof method === 'function') {
    method(msg, ...args)
  } else {
    logger.info(msg, ...args)
  }
}

// Export default logger
export default logger

// Re-export pino types
export type Logger = pino.Logger
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'