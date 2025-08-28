const path = require('path')
const fs = require('fs')
const { getDirectoryService } = require('~/utils/DirectoryService')
const { PACKAGE_NAMES } = require('~/constants')

class ProtocolResolver {
  constructor() {
    this.packageRoot = null
    this.__dirname = __dirname
    this.directoryService = getDirectoryService()
  }

  parseReference(reference) {
    // 支持 @、@!、@? 三种加载语义前缀
    const match = reference.match(/^@([!?]?)(\w+):\/\/(.+)$/)
    if (!match) {
      throw new Error(`Invalid reference format: ${reference}`)
    }
    
    const loadingSemantic = match[1] || '' // '', '!', 或 '?'
    const protocol = match[2]
    const resourcePath = match[3]
    
    return {
      loadingSemantic,
      protocol,
      resourcePath,
      fullReference: reference
    }
  }

  async resolve(reference) {
    const { protocol, resourcePath, loadingSemantic } = this.parseReference(reference)
    
    switch (protocol) {
      case 'package':
        return await this.resolvePackage(resourcePath)
      case 'project':
        return await this.resolveProject(resourcePath)
      case 'file':
        return await this.resolveFile(resourcePath)
      default:
        throw new Error(`Unsupported protocol: ${protocol}`)
    }
  }

  async resolvePackage(relativePath) {
    if (!this.packageRoot) {
      this.packageRoot = await this.findPackageRoot()
    }
    return path.resolve(this.packageRoot, relativePath)
  }

  async resolveProject(relativePath) {
    try {
      const context = {
        startDir: process.cwd(),
        platform: process.platform,
        avoidUserHome: true
      }
      const projectRoot = await this.directoryService.getProjectRoot(context)
      return path.resolve(projectRoot, relativePath)
    } catch (error) {
      // 回退到原始逻辑
      return path.resolve(process.cwd(), relativePath)
    }
  }

  async resolveFile(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath
    }
    
    try {
      const context = {
        startDir: process.cwd(),
        platform: process.platform,
        avoidUserHome: true
      }
      const projectRoot = await this.directoryService.getProjectRoot(context)
      return path.resolve(projectRoot, filePath)
    } catch (error) {
      // 回退到原始逻辑
      return path.resolve(process.cwd(), filePath)
    }
  }

  async findPackageRoot() {
    let dir = this.__dirname
    while (dir !== path.parse(dir).root) {
      const packageJson = path.join(dir, 'package.json')
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
        // 支持配置的包名列表，同时也支持 'promptx' 作为开发版本名称
        if (pkg.name === 'promptx' || PACKAGE_NAMES.ALL.includes(pkg.name)) {
          return dir
        }
      }
      dir = path.dirname(dir)
    }
    throw new Error('PromptX package root not found')
  }
}

module.exports = ProtocolResolver