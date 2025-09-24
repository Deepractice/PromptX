/**
 * 项目配置数据结构
 * 精简设计，只包含核心必需字段
 */
class ProjectConfig {
  /**
   * @param {string} mcpId - MCP进程唯一标识符
   * @param {string} ideType - IDE类型（cursor/vscode等）
   * @param {string} projectPath - 项目绝对路径
   * @param {string} projectHash - 项目路径的Hash值（用于文件名唯一性）
   */
  constructor(mcpId, ideType, projectPath, projectHash) {
    this.mcpId = mcpId
    this.ideType = ideType
    this.projectPath = projectPath
    this.projectHash = projectHash
  }

  /**
   * 从JSON对象创建ProjectConfig实例
   * @param {Object} data - JSON数据
   * @returns {ProjectConfig} 配置实例
   */
  static fromJson(data) {
    return new ProjectConfig(
      data.mcpId,
      data.ideType,
      data.projectPath,
      data.projectHash
    )
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON对象
   */
  toJson() {
    return {
      mcpId: this.mcpId,
      ideType: this.ideType,
      projectPath: this.projectPath,
      projectHash: this.projectHash
    }
  }

  /**
   * 获取项目名称
   * @returns {string} 项目名称
   */
  getProjectName() {
    const path = require('path')
    return path.basename(this.projectPath)
  }

  /**
   * 验证配置完整性
   * @returns {boolean} 是否有效
   */
  isValid() {
    return !!(this.mcpId && this.ideType && this.projectPath && this.projectHash)
  }

  /**
   * 生成配置文件名
   * @returns {string} 配置文件名
   */
  getConfigFileName() {
    const path = require('path')
    const projectName = path.basename(this.projectPath).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const ideTypeSafe = this.ideType.replace(/[^a-z0-9-]/g, '').toLowerCase() || 'unknown'
    return `${this.mcpId}-${ideTypeSafe}-${projectName}-${this.projectHash}.json`
  }
}

module.exports = ProjectConfig