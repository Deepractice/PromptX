const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const DACPConfigManager = require('../../lib/utils/DACPConfigManager')

// Mock DirectoryService
jest.mock('../../lib/utils/DirectoryService', () => ({
  getDirectoryService: () => ({
    getPromptXDirectory: jest.fn()
  })
}))

const { getDirectoryService } = require('../../lib/utils/DirectoryService')

describe('DACPConfigManager - 项目级配置优先', () => {
  let configManager
  let mockDirectoryService
  let tempDir
  let userConfigDir
  let projectConfigDir

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dacp-config-test-'))
    userConfigDir = path.join(tempDir, 'user', '.promptx', 'dacp')
    projectConfigDir = path.join(tempDir, 'project', '.promptx', 'dacp')
    
    // 确保目录存在
    await fs.ensureDir(userConfigDir)
    await fs.ensureDir(projectConfigDir)
    
    // Mock DirectoryService
    mockDirectoryService = getDirectoryService()
    mockDirectoryService.getPromptXDirectory.mockResolvedValue(path.join(tempDir, 'project', '.promptx'))
    
    // 创建配置管理器
    configManager = new DACPConfigManager()
    
    // Mock用户目录
    configManager.userDacpConfigDir = userConfigDir
  })

  afterEach(async () => {
    // 清理临时目录
    await fs.remove(tempDir)
    jest.clearAllMocks()
  })

  describe('配置读取优先级', () => {
    test('应该优先读取项目级配置', async () => {
      const projectConfig = {
        provider: 'gmail',
        smtp: { user: 'project@gmail.com', password: 'project-pass' },
        sender: { name: 'Project User', email: 'project@gmail.com' }
      }
      
      const userConfig = {
        provider: 'outlook',
        smtp: { user: 'user@outlook.com', password: 'user-pass' },
        sender: { name: 'User Name', email: 'user@outlook.com' }
      }

      // 写入两个配置文件
      await fs.writeJson(path.join(projectConfigDir, 'send_email.json'), projectConfig)
      await fs.writeJson(path.join(userConfigDir, 'send_email.json'), userConfig)

      const result = await configManager.readActionConfig('send_email')
      
      expect(result).toEqual(projectConfig)
      expect(result.smtp.user).toBe('project@gmail.com')
    })

    test('项目级配置不存在时应该回退到用户级配置', async () => {
      const userConfig = {
        provider: 'outlook',
        smtp: { user: 'user@outlook.com', password: 'user-pass' },
        sender: { name: 'User Name', email: 'user@outlook.com' }
      }

      // 只写入用户级配置
      await fs.writeJson(path.join(userConfigDir, 'send_email.json'), userConfig)

      const result = await configManager.readActionConfig('send_email')
      
      expect(result).toEqual(userConfig)
      expect(result.smtp.user).toBe('user@outlook.com')
    })

    test('两个配置都不存在时应该返回null', async () => {
      const result = await configManager.readActionConfig('send_email')
      expect(result).toBeNull()
    })
  })

  describe('配置存在性检查', () => {
    test('hasActionConfig应该检查项目级和用户级配置', async () => {
      // 无配置时
      expect(await configManager.hasActionConfig('send_email')).toBe(false)
      
      // 仅用户级配置时
      await fs.writeJson(path.join(userConfigDir, 'send_email.json'), {})
      expect(await configManager.hasActionConfig('send_email')).toBe(true)
      
      // 同时存在项目级配置时
      await fs.writeJson(path.join(projectConfigDir, 'send_email.json'), {})
      expect(await configManager.hasActionConfig('send_email')).toBe(true)
    })

    test('hasProjectActionConfig应该正确检查项目级配置', async () => {
      expect(await configManager.hasProjectActionConfig('send_email')).toBe(false)
      
      await fs.writeJson(path.join(projectConfigDir, 'send_email.json'), {})
      expect(await configManager.hasProjectActionConfig('send_email')).toBe(true)
    })

    test('hasUserActionConfig应该正确检查用户级配置', async () => {
      expect(await configManager.hasUserActionConfig('send_email')).toBe(false)
      
      await fs.writeJson(path.join(userConfigDir, 'send_email.json'), {})
      expect(await configManager.hasUserActionConfig('send_email')).toBe(true)
    })
  })

  describe('配置写入', () => {
    test('writeProjectActionConfig应该写入项目级配置', async () => {
      const config = {
        provider: 'gmail',
        smtp: { user: 'test@gmail.com', password: 'test-pass' },
        sender: { name: 'Test User', email: 'test@gmail.com' }
      }

      await configManager.writeProjectActionConfig('send_email', config)
      
      const projectConfigPath = path.join(projectConfigDir, 'send_email.json')
      expect(await fs.pathExists(projectConfigPath)).toBe(true)
      
      const savedConfig = await fs.readJson(projectConfigPath)
      expect(savedConfig).toEqual(config)
    })

    test('writeUserActionConfig应该写入用户级配置', async () => {
      const config = {
        provider: 'outlook',
        smtp: { user: 'test@outlook.com', password: 'test-pass' },
        sender: { name: 'Test User', email: 'test@outlook.com' }
      }

      await configManager.writeUserActionConfig('send_email', config)
      
      const userConfigPath = path.join(userConfigDir, 'send_email.json')
      expect(await fs.pathExists(userConfigPath)).toBe(true)
      
      const savedConfig = await fs.readJson(userConfigPath)
      expect(savedConfig).toEqual(config)
    })
  })

  describe('向后兼容性', () => {
    test('原有API方法应该保持兼容', async () => {
      const config = {
        provider: 'gmail',
        smtp: { user: 'legacy@gmail.com', password: 'legacy-pass' },
        sender: { name: 'Legacy User', email: 'legacy@gmail.com' }
      }

      // writeActionConfig应该写入用户级配置
      await configManager.writeActionConfig('send_email', config)
      
      const userConfigPath = path.join(userConfigDir, 'send_email.json')
      expect(await fs.pathExists(userConfigPath)).toBe(true)
      
      // getConfigPath应该返回用户级路径
      expect(configManager.getConfigPath('send_email')).toBe(userConfigPath)
    })
  })

  describe('错误处理', () => {
    test('DirectoryService失败时应该优雅降级', async () => {
      // Mock DirectoryService抛出错误
      mockDirectoryService.getPromptXDirectory.mockRejectedValue(new Error('项目目录不存在'))
      
      const userConfig = {
        provider: 'gmail',
        smtp: { user: 'user@gmail.com', password: 'user-pass' },
        sender: { name: 'User', email: 'user@gmail.com' }
      }
      
      await fs.writeJson(path.join(userConfigDir, 'send_email.json'), userConfig)
      
      // 应该能够回退到用户级配置
      const result = await configManager.readActionConfig('send_email')
      expect(result).toEqual(userConfig)
    })

    test('项目目录不可写时writeProjectActionConfig应该抛出错误', async () => {
      mockDirectoryService.getPromptXDirectory.mockRejectedValue(new Error('无法获取项目目录'))
      
      const config = { provider: 'gmail' }
      
      await expect(configManager.writeProjectActionConfig('send_email', config))
        .rejects.toThrow('无法获取项目目录，写入项目级配置失败')
    })
  })

  describe('配置错误提示信息', () => {
    test('应该生成包含项目级和用户级路径的错误信息', async () => {
      const errorMessage = await configManager.generateConfigErrorMessage('send_email')
      
      expect(errorMessage).toContain('DACP邮件服务配置缺失')
      expect(errorMessage).toContain('项目级:')
      expect(errorMessage).toContain('用户级:')
      expect(errorMessage).toContain('配置优先级: 项目级(.promptx/dacp/) > 用户级(~/.promptx/dacp/)')
    })

    test('应该正确标识当前使用的配置级别', async () => {
      const validation = { valid: false, errors: ['缺少SMTP配置'] }
      
      // 创建项目级配置
      await fs.writeJson(path.join(projectConfigDir, 'send_email.json'), {})
      
      const errorMessage = await configManager.generateConfigErrorMessage('send_email', validation)
      expect(errorMessage).toContain('项目级:')
      expect(errorMessage).toContain('缺少以下配置项')
    })
  })
})