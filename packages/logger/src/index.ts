/**
 * @promptx/logger - Unified logging system for PromptX
 * Features:
 * - Multiple transports (Console, File, Daily Rotate)
 * - Structured logging with timestamp, process, package, file, line
 * - Configurable log levels
 * - Color support for console output
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import chalk from 'chalk'
import path from 'path'
import os from 'os'

// Get caller info (file and line number)
function getCallerInfo(): { file: string; line: number; package: string } {
  const error = new Error()
  const stack = error.stack?.split('\n') || []
  
  // Skip first 3 lines (Error, getCallerInfo, createLogger method)
  const callerLine = stack[3] || ''
  
  // Extract file path and line number
  const match = callerLine.match(/\(?(.*?):(\d+):(\d+)\)?$/)
  if (match) {
    const fullPath = match[1] || 'unknown'
    const lineNumber = parseInt(match[2] || '0', 10)
    
    // Extract package name from path
    const packageMatch = fullPath.match(/@promptx\/([^\/]+)/) || 
                        fullPath.match(/packages\/([^\/]+)/) ||
                        fullPath.match(/apps\/([^\/]+)/)
    const packageName = packageMatch ? `@promptx/${packageMatch[1]}` : 'unknown'
    
    // Get relative file path
    const file = fullPath.includes('/') 
      ? fullPath.substring(fullPath.lastIndexOf('/') + 1)
      : fullPath
    
    return { file, line: lineNumber, package: packageName }
  }
  
  return { file: 'unknown', line: 0, package: 'unknown' }
}

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp }) => {
    const caller = getCallerInfo()
    const pid = process.pid
    
    // Color mapping
    const levelColors = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.green,
      debug: chalk.blue,
      verbose: chalk.cyan
    }
    
    const colorFn = levelColors[level as keyof typeof levelColors] || chalk.white
    
    // Format: [timestamp] [PID:12345] [package] [file:line] LEVEL: message
    return `${chalk.gray(`[${timestamp}]`)} ${chalk.gray(`[PID:${pid}]`)} ${chalk.magenta(caller.package)} ${chalk.cyan(`[${caller.file}:${caller.line}]`)} ${colorFn(level.toUpperCase())}: ${message}`
  })
)

// Custom format for file output (no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp }) => {
    const caller = getCallerInfo()
    const pid = process.pid
    
    // Format: [timestamp] [PID:12345] [package] [file:line] LEVEL: message
    return `[${timestamp}] [PID:${pid}] ${caller.package} [${caller.file}:${caller.line}] ${level.toUpperCase()}: ${message}`
  })
)

// Logger configuration interface
export interface LoggerConfig {
  level?: string
  console?: boolean
  file?: boolean | {
    filename?: string
    dirname?: string
    maxSize?: string
    maxFiles?: string | number
    datePattern?: string
  }
  colors?: boolean
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  console: true,
  file: {
    dirname: path.join(os.homedir(), '.promptx', 'logs'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d'  // 保留最近7天的日志
  },
  colors: true
}

// Create logger instance
export function createLogger(config: LoggerConfig = {}): winston.Logger {
  const finalConfig = { ...defaultConfig, ...config }
  
  const transports: winston.transport[] = []
  
  // Console transport
  if (finalConfig.console) {
    transports.push(new winston.transports.Console({
      format: finalConfig.colors ? consoleFormat : fileFormat
    }))
  }
  
  // File transport
  if (finalConfig.file) {
    const fileConfig = typeof finalConfig.file === 'object' ? finalConfig.file : {}
    
    // Daily rotate file transport
    transports.push(new DailyRotateFile({
      filename: fileConfig.filename || 'promptx-%DATE%.log',
      dirname: fileConfig.dirname || path.join(os.homedir(), '.promptx', 'logs'),
      datePattern: fileConfig.datePattern || 'YYYY-MM-DD',
      maxSize: fileConfig.maxSize || '20m',
      maxFiles: fileConfig.maxFiles || '14d',
      format: fileFormat
    }))
    
    // Error log file
    transports.push(new DailyRotateFile({
      filename: 'promptx-error-%DATE%.log',
      dirname: fileConfig.dirname || path.join(os.homedir(), '.promptx', 'logs'),
      datePattern: fileConfig.datePattern || 'YYYY-MM-DD',
      maxSize: fileConfig.maxSize || '20m',
      maxFiles: fileConfig.maxFiles || '14d',
      format: fileFormat,
      level: 'error'
    }))
  }
  
  return winston.createLogger({
    level: finalConfig.level,
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: finalConfig.file ? [
      new DailyRotateFile({
        filename: 'promptx-exceptions-%DATE%.log',
        dirname: typeof finalConfig.file === 'object' 
          ? finalConfig.file.dirname || path.join(os.homedir(), '.promptx', 'logs')
          : path.join(os.homedir(), '.promptx', 'logs'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat
      })
    ] : undefined,
    rejectionHandlers: finalConfig.file ? [
      new DailyRotateFile({
        filename: 'promptx-rejections-%DATE%.log',
        dirname: typeof finalConfig.file === 'object' 
          ? finalConfig.file.dirname || path.join(os.homedir(), '.promptx', 'logs')
          : path.join(os.homedir(), '.promptx', 'logs'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat
      })
    ] : undefined
  })
}

// Default logger instance
const logger = createLogger()

// Export logger methods
export const log = logger.log.bind(logger)
export const error = logger.error.bind(logger)
export const warn = logger.warn.bind(logger)
export const info = logger.info.bind(logger)
export const debug = logger.debug.bind(logger)
export const verbose = logger.verbose.bind(logger)

// Export default logger
export default logger

// Re-export winston types
export type Logger = winston.Logger
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose'