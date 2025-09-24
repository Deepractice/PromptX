/**
 * Project 模块
 *
 * 统一管理项目配置、路径解析和项目状态
 */

const ProjectManager = require('./ProjectManager')
const ProjectConfig = require('./ProjectConfig')
const ProjectPathResolver = require('./ProjectPathResolver')

module.exports = {
  ProjectManager,
  ProjectConfig,
  ProjectPathResolver,

  // 导出便捷方法
  getGlobalProjectManager: ProjectManager.getGlobalProjectManager,
  getCurrentMcpId: ProjectManager.getCurrentMcpId,
  getCurrentProjectPath: ProjectManager.getCurrentProjectPath
}