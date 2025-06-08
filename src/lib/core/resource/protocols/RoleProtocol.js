const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * AI角色协议处理器
 * 处理 role:// 协议的资源解析，直接加载完整role文件
 * 支持跨项目角色发现机制
 */
class RoleProtocol extends ResourceProtocol {
  constructor () {
    super('role')
    this.registry = {}
    this.packageProtocol = null
    this.dynamicRolesCache = null
  }

  /**
   * 设置PackageProtocol实例
   */
  setPackageProtocol (packageProtocol) {
    this.packageProtocol = packageProtocol
  }

  /**
   * 设置注册表
   */
  setRegistry (registry) {
    this.registry = registry || {}
  }

  /**
   * 发现所有可用角色（包括本地项目中的角色）
   * 使用与HelloCommand相同的跨项目发现机制
   */
  async discoverAllRoles () {
    if (this.dynamicRolesCache) {
      return this.dynamicRolesCache
    }

    const allRoles = {}

    // 1. 添加注册表中的角色（包内角色）
    for (const [roleId, roleInfo] of Object.entries(this.registry)) {
      allRoles[roleId] = roleInfo
    }

    // 2. 扫描本地角色文件（双重扫描机制）
    try {
      const localRoles = await this.scanLocalRoles()
      // 本地角色优先级更高，可覆盖包内同名角色
      Object.assign(allRoles, localRoles)
    } catch (error) {
      // 本地角色扫描失败不影响包内角色使用
      console.warn('本地角色扫描失败:', error.message)
    }

    this.dynamicRolesCache = allRoles
    return allRoles
  }

  /**
   * 扫描本地角色文件
   * 双重扫描机制：包根目录 + 当前工作目录
   */
  async scanLocalRoles () {
    const roles = {}

    try {
      // 1. 扫描包根目录中的角色（内置角色）
      if (this.packageProtocol) {
        const packageRoot = await this.packageProtocol.getPackageRoot()
        const packageDomainPath = path.join(packageRoot, 'prompt', 'domain')
        
        if (await fs.pathExists(packageDomainPath)) {
          const packageEntries = await fs.readdir(packageDomainPath, { withFileTypes: true })
          
          for (const entry of packageEntries) {
            if (entry.isDirectory()) {
              const roleId = entry.name
              const roleFile = path.join(packageDomainPath, roleId, `${roleId}.role.md`)
              
              if (await fs.pathExists(roleFile)) {
                roles[roleId] = {
                  file: `@package://prompt/domain/${roleId}/${roleId}.role.md`,
                  name: `🎭 ${roleId}`,
                  description: `${roleId}专业服务`
                }
              }
            }
          }
        }
      }

      // 2. 扫描当前工作目录中的角色（本地角色，优先级更高）
      const workingDomainPath = path.resolve(process.cwd(), 'prompt', 'domain')
      
      if (await fs.pathExists(workingDomainPath)) {
        const workingEntries = await fs.readdir(workingDomainPath, { withFileTypes: true })
        
        for (const entry of workingEntries) {
          if (entry.isDirectory()) {
            const roleId = entry.name
            const roleFile = path.join(workingDomainPath, roleId, `${roleId}.role.md`)
            
            if (await fs.pathExists(roleFile)) {
              // 工作目录角色使用绝对路径，优先级更高
              roles[roleId] = {
                file: roleFile, // 使用绝对路径
                name: `🎭 ${roleId}`,
                description: `${roleId}专业服务`
              }
            }
          }
        }
      }

    } catch (error) {
      console.warn('扫描本地角色时出错:', error.message)
    }

    return roles
  }

  /**
   * 清除动态角色缓存
   */
  clearDynamicCache () {
    this.dynamicRolesCache = null
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: 'role',
      description: 'AI角色资源协议',
      location: 'role://{role_id}',
      examples: [
        'role://video-copywriter',
        'role://product-owner',
        'role://assistant',
        'role://prompt-developer'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const roleId = resourcePath.trim()

    // 使用动态角色发现
    const allRoles = await this.discoverAllRoles()

    if (!allRoles[roleId]) {
      throw new Error(`角色 "${roleId}" 未找到。可用角色：${Object.keys(allRoles).join(', ')}`)
    }

    const roleInfo = allRoles[roleId]
    
    // 兼容两种格式：字符串路径或对象格式
    let rolePath
    if (typeof roleInfo === 'string') {
      rolePath = roleInfo
    } else if (roleInfo && roleInfo.file) {
      rolePath = roleInfo.file
    } else {
      throw new Error(`无效的角色信息格式: ${JSON.stringify(roleInfo)}`)
    }

    // 处理 @package:// 前缀 - 通过PackageProtocol正确解析
    if (rolePath && rolePath.startsWith('@package://')) {
      if (!this.packageProtocol) {
        throw new Error('PackageProtocol未设置，无法解析@package://路径')
      }
      
      const packageRelativePath = rolePath.replace('@package://', '')
      const resolvedPath = await this.packageProtocol.resolvePath(packageRelativePath, queryParams)
      return resolvedPath
    }

    // 绝对路径直接返回（来自工作目录的角色）
    if (path.isAbsolute(rolePath)) {
      return rolePath
    }

    return rolePath
  }

  /**
   * 加载资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`无法加载角色文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = RoleProtocol
