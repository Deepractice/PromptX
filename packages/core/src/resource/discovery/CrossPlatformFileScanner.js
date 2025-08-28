const fs = require('fs-extra')
const path = require('path')
const logger = require('@promptx/logger')

/**
 * CrossPlatformFileScanner - 跨平台文件扫描器
 * 
 * 替代glob库，使用Node.js原生fs API实现跨平台文件扫描
 * 避免glob在Windows上的兼容性问题
 */
class CrossPlatformFileScanner {
  /**
   * 递归扫描目录，查找匹配的文件
   * @param {string} baseDir - 基础目录
   * @param {Object} options - 扫描选项
   * @param {Array<string>} options.extensions - 文件扩展名列表，如 ['.role.md', '.execution.md']
   * @param {Array<string>} options.subdirs - 限制扫描的子目录，如 ['domain', 'execution']
   * @param {number} options.maxDepth - 最大扫描深度，默认5
   * @returns {Promise<Array<string>>} 匹配的文件路径列表
   */
  async scanFiles(baseDir, options = {}) {
    const {
      extensions = [],
      subdirs = null,
      maxDepth = 5
    } = options

    if (!await fs.pathExists(baseDir)) {
      return []
    }

    const results = []
    await this._scanRecursive(baseDir, baseDir, extensions, subdirs, maxDepth, 0, results)
    return results
  }

  /**
   * 扫描特定类型的资源文件
   * @param {string} baseDir - 基础目录
   * @param {string} resourceType - 资源类型 ('role', 'execution', 'thought')
   * @returns {Promise<Array<string>>} 匹配的文件路径列表
   */
  async scanResourceFiles(baseDir, resourceType) {
    const resourceConfig = {
      role: {
        extensions: ['.role.md'],
        subdirs: null // 不限制子目录，在所有地方查找role文件
      },
      execution: {
        extensions: ['.execution.md'],
        subdirs: null // 不限制子目录，在所有地方查找execution文件
      },
      thought: {
        extensions: ['.thought.md'],
        subdirs: null // 不限制子目录，在所有地方查找thought文件
      },
      knowledge: {
        extensions: ['.knowledge.md'],
        subdirs: null // 不限制子目录，在所有地方查找knowledge文件
      },
      tool: {
        extensions: ['.tool.js'],
        subdirs: null // 不限制子目录，在所有地方查找tool文件
      }
    }

    const config = resourceConfig[resourceType]
    if (!config) {
      throw new Error(`Unsupported resource type: ${resourceType}`)
    }

    return await this.scanFiles(baseDir, config)
  }

  /**
   * 递归扫描目录的内部实现
   * @param {string} currentDir - 当前扫描目录
   * @param {string} baseDir - 基础目录
   * @param {Array<string>} extensions - 文件扩展名列表
   * @param {Array<string>|null} subdirs - 限制扫描的子目录
   * @param {number} maxDepth - 最大深度
   * @param {number} currentDepth - 当前深度
   * @param {Array<string>} results - 结果数组
   * @private
   */
  async _scanRecursive(currentDir, baseDir, extensions, subdirs, maxDepth, currentDepth, results) {
    if (currentDepth >= maxDepth) {
      return
    }

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)

        if (entry.isFile()) {
          // 检查文件扩展名
          if (this._matchesExtensions(entry.name, extensions)) {
            results.push(fullPath)
          }
        } else if (entry.isDirectory()) {
          // 检查是否应该扫描这个子目录
          if (this._shouldScanDirectory(entry.name, subdirs, currentDepth)) {
            await this._scanRecursive(
              fullPath, 
              baseDir, 
              extensions, 
              subdirs, 
              maxDepth, 
              currentDepth + 1, 
              results
            )
          }
        }
      }
    } catch (error) {
      // 忽略权限错误或其他文件系统错误
      logger.warn(`[CrossPlatformFileScanner] Failed to scan directory ${currentDir}: ${error.message}`)
    }
  }

  /**
   * 检查文件名是否匹配指定扩展名
   * @param {string} fileName - 文件名
   * @param {Array<string>} extensions - 扩展名列表
   * @returns {boolean} 是否匹配
   * @private
   */
  _matchesExtensions(fileName, extensions) {
    if (!extensions || extensions.length === 0) {
      return true // 如果没有指定扩展名，匹配所有文件
    }

    return extensions.some(ext => fileName.endsWith(ext))
  }

  /**
   * 检查是否应该扫描指定目录
   * @param {string} dirName - 目录名
   * @param {Array<string>|null} subdirs - 允许扫描的子目录列表
   * @param {number} currentDepth - 当前深度
   * @returns {boolean} 是否应该扫描
   * @private
   */
  _shouldScanDirectory(dirName, subdirs, currentDepth) {
    // 跳过隐藏目录和node_modules
    if (dirName.startsWith('.') || dirName === 'node_modules') {
      return false
    }

    // 如果没有指定子目录限制，扫描所有目录
    if (!subdirs || subdirs.length === 0) {
      return true
    }

    // 在根级别，只扫描指定的子目录
    if (currentDepth === 0) {
      return subdirs.includes(dirName)
    }

    // 在更深层级，扫描所有目录
    return true
  }

  /**
   * 规范化路径，确保跨平台兼容性
   * @param {string} filePath - 文件路径
   * @returns {string} 规范化后的路径
   */
  normalizePath(filePath) {
    return path.normalize(filePath).replace(/\\/g, '/')
  }

  /**
   * 生成相对路径，确保跨平台兼容性
   * @param {string} from - 起始路径
   * @param {string} to - 目标路径
   * @returns {string} 规范化的相对路径
   */
  getRelativePath(from, to) {
    const relativePath = path.relative(from, to)
    return relativePath.replace(/\\/g, '/')
  }
}

module.exports = CrossPlatformFileScanner