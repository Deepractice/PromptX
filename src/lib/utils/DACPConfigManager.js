const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { getDirectoryService } = require('./DirectoryService')

/**
 * DACP配置管理器
 * 支持项目级配置优先，用户级配置回退的分层配置策略
 * 配置优先级：项目级(.promptx/dacp/) > 用户级(~/.promptx/dacp/)
 */
class DACPConfigManager {
  constructor() {
    this.userHome = os.homedir()
    this.userDacpConfigDir = path.join(this.userHome, '.promptx', 'dacp')
    this.directoryService = getDirectoryService()
  }

  /**
   * 确保用户级DACP配置目录存在
   */
  async ensureUserConfigDir() {
    await fs.ensureDir(this.userDacpConfigDir)
  }

  /**
   * 获取项目级DACP配置目录路径
   * @returns {Promise<string|null>} 项目级配置目录路径或null
   */
  async getProjectConfigDir() {
    try {
      const promptxDir = await this.directoryService.getPromptXDirectory()
      return path.join(promptxDir, 'dacp')
    } catch (error) {
      console.warn('获取项目级配置目录失败:', error.message)
      return null
    }
  }

  /**
   * 确保项目级DACP配置目录存在
   * @returns {Promise<string|null>} 项目级配置目录路径或null
   */
  async ensureProjectConfigDir() {
    const projectConfigDir = await this.getProjectConfigDir()
    if (projectConfigDir) {
      await fs.ensureDir(projectConfigDir)
      return projectConfigDir
    }
    return null
  }

  /**
   * 获取指定action的用户级配置文件路径
   * @param {string} action - action名称，如 'send_email'
   * @returns {string} 用户级配置文件完整路径
   */
  getUserConfigPath(action) {
    return path.join(this.userDacpConfigDir, `${action}.json`)
  }

  /**
   * 获取指定action的项目级配置文件路径
   * @param {string} action - action名称，如 'send_email'
   * @returns {Promise<string|null>} 项目级配置文件完整路径或null
   */
  async getProjectConfigPath(action) {
    const projectConfigDir = await this.getProjectConfigDir()
    if (projectConfigDir) {
      return path.join(projectConfigDir, `${action}.json`)
    }
    return null
  }

  /**
   * 获取指定action的配置文件路径（用户级，向后兼容）
   * @param {string} action - action名称，如 'send_email'
   * @returns {string} 配置文件完整路径
   * @deprecated 使用getUserConfigPath或getProjectConfigPath
   */
  getConfigPath(action) {
    return this.getUserConfigPath(action)
  }

  /**
   * 读取项目级action配置
   * @param {string} action - action名称
   * @returns {Promise<Object|null>} 配置对象或null
   */
  async readProjectActionConfig(action) {
    try {
      const projectConfigPath = await this.getProjectConfigPath(action)
      if (projectConfigPath && await fs.pathExists(projectConfigPath)) {
        const config = await fs.readJson(projectConfigPath)
        console.log(`📁 使用项目级DACP配置: ${action}`)  
        return config
      }
    } catch (error) {
      console.warn(`读取项目级DACP配置失败 ${action}:`, error.message)
    }
    return null
  }

  /**
   * 读取用户级action配置
   * @param {string} action - action名称
   * @returns {Promise<Object|null>} 配置对象或null
   */
  async readUserActionConfig(action) {
    const userConfigPath = this.getUserConfigPath(action)
    
    try {
      if (await fs.pathExists(userConfigPath)) {
        const config = await fs.readJson(userConfigPath)
        console.log(`🏠 使用用户级DACP配置: ${action}`)
        return config
      }
    } catch (error) {
      console.warn(`读取用户级DACP配置失败 ${action}:`, error.message)
    }
    return null
  }

  /**
   * 读取action配置（项目级优先，用户级回退）
   * @param {string} action - action名称
   * @returns {Promise<Object|null>} 配置对象或null
   */
  async readActionConfig(action) {
    // 优先级：项目级 > 用户级
    const projectConfig = await this.readProjectActionConfig(action)
    if (projectConfig) {
      return projectConfig
    }
    
    return await this.readUserActionConfig(action)
  }

  /**
   * 写入用户级action配置
   * @param {string} action - action名称
   * @param {Object} config - 配置对象
   */
  async writeUserActionConfig(action, config) {
    await this.ensureUserConfigDir()
    const configPath = this.getUserConfigPath(action)
    await fs.writeJson(configPath, config, { spaces: 2 })
  }

  /**
   * 写入项目级action配置
   * @param {string} action - action名称
   * @param {Object} config - 配置对象
   */
  async writeProjectActionConfig(action, config) {
    const projectConfigDir = await this.ensureProjectConfigDir()
    if (projectConfigDir) {
      const configPath = path.join(projectConfigDir, `${action}.json`)
      await fs.writeJson(configPath, config, { spaces: 2 })
    } else {
      throw new Error('无法获取项目目录，写入项目级配置失败')
    }
  }

  /**
   * 写入action配置（向后兼容，写入用户级）
   * @param {string} action - action名称
   * @param {Object} config - 配置对象
   * @deprecated 使用writeUserActionConfig或writeProjectActionConfig
   */
  async writeActionConfig(action, config) {
    return await this.writeUserActionConfig(action, config)
  }

  /**
   * 检查项目级action配置是否存在
   * @param {string} action - action名称
   * @returns {Promise<boolean>}
   */
  async hasProjectActionConfig(action) {
    try {
      const projectConfigPath = await this.getProjectConfigPath(action)
      if (!projectConfigPath) {
        return false
      }
      return await fs.pathExists(projectConfigPath)
    } catch (error) {
      return false
    }
  }

  /**
   * 检查用户级action配置是否存在
   * @param {string} action - action名称
   * @returns {Promise<boolean>}
   */
  async hasUserActionConfig(action) {
    const userConfigPath = this.getUserConfigPath(action)
    return await fs.pathExists(userConfigPath)
  }

  /**
   * 检查action配置是否存在（项目级或用户级）
   * @param {string} action - action名称
   * @returns {Promise<boolean>}
   */
  async hasActionConfig(action) {
    const hasProject = await this.hasProjectActionConfig(action)
    if (hasProject) {
      return true
    }
    return await this.hasUserActionConfig(action)
  }

  /**
   * 验证邮件配置
   * @param {Object} config - 邮件配置对象
   * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
   */
  validateEmailConfig(config) {
    const errors = []
    
    if (!config) {
      errors.push('配置对象不能为空')
      return { valid: false, errors }
    }

    // 验证provider
    if (!config.provider) {
      errors.push('缺少邮件服务提供商(provider)配置')
    }

    // 验证SMTP配置
    if (!config.smtp) {
      errors.push('缺少SMTP配置')
    } else {
      if (!config.smtp.user) {
        errors.push('缺少SMTP用户名(smtp.user)')
      }
      if (!config.smtp.password) {
        errors.push('缺少SMTP密码(smtp.password)')
      }
    }

    // 验证发件人配置
    if (!config.sender) {
      errors.push('缺少发件人配置(sender)')
    } else {
      if (!config.sender.email) {
        errors.push('缺少发件人邮箱(sender.email)')
      }
      if (!config.sender.name) {
        errors.push('缺少发件人姓名(sender.name)')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取邮件服务提供商配置
   * @param {string} provider - 提供商名称
   * @returns {Object} 提供商配置
   */
  getProviderConfig(provider) {
    const providers = {
      gmail: {
        smtp: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireAuth: true
      },
      outlook: {
        smtp: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        requireAuth: true
      },
      qq: {
        smtp: 'smtp.qq.com',
        port: 465,
        secure: true,
        requireAuth: true
      },
      '163': {
        smtp: 'smtp.163.com',
        port: 465,
        secure: true,
        requireAuth: true
      },
      '126': {
        smtp: 'smtp.126.com',
        port: 465,
        secure: true,
        requireAuth: true
      }
    }

    return providers[provider] || null
  }

  /**
   * 生成配置错误提示信息
   * @param {string} action - action名称
   * @param {Object} validation - 验证结果
   * @returns {Promise<string>} 错误提示信息
   */
  async generateConfigErrorMessage(action, validation = null) {
    const userConfigPath = this.getUserConfigPath(action)
    const projectConfigPath = await this.getProjectConfigPath(action)
    
    let message = `\n📧 DACP邮件服务配置缺失\n\n`
    
    if (!validation) {
      // 配置文件不存在
      message += `❌ 未找到配置文件\n\n`
      message += `🔍 查找路径:\n`
      if (projectConfigPath) {
        message += `   项目级: ${projectConfigPath} (优先)\n`
      }
      message += `   用户级: ${userConfigPath} (回退)\n\n`
      message += `📝 推荐创建项目级配置文件，内容如下:\n\n`
      message += `{\n`
      message += `  "provider": "gmail",\n`
      message += `  "smtp": {\n`
      message += `    "user": "your-email@gmail.com",\n`
      message += `    "password": "your-app-password"\n`
      message += `  },\n`
      message += `  "sender": {\n`
      message += `    "name": "Your Name",\n`
      message += `    "email": "your-email@gmail.com"\n`
      message += `  }\n`
      message += `}\n\n`
      message += `💡 支持的邮件服务商: gmail, outlook, qq, 163, 126\n\n`
      message += `🏗️ 配置优先级: 项目级(.promptx/dacp/) > 用户级(~/.promptx/dacp/)\n\n`
      message += `🔐 Gmail用户需要使用应用专用密码:\n`
      message += `   1. 进入 Google 账户设置\n`
      message += `   2. 启用两步验证\n`
      message += `   3. 生成应用专用密码\n`
      message += `   4. 使用生成的密码替换上面的 "your-app-password"\n`
    } else {
      // 配置不完整
      const configLocation = await this.hasProjectActionConfig(action) ? 
        (projectConfigPath ? `项目级: ${projectConfigPath}` : '项目级配置') :
        `用户级: ${userConfigPath}`
      message += `❌ 配置文件存在但不完整: ${configLocation}\n\n`
      message += `缺少以下配置项:\n`
      validation.errors.forEach(error => {
        message += `  • ${error}\n`
      })
      message += `\n请检查并完善配置文件。\n`
    }
    
    return message
  }
}

module.exports = DACPConfigManager