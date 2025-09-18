/**
 * 错误管理系统入口
 * 导出增强的ToolError和相关定义
 */

const ToolError = require('./ToolError');

// 直接从ToolError导出所有需要的内容
module.exports = {
  // 增强的错误类（统一错误处理入口）
  ToolError,
  
  // 错误分类（通过ToolError访问）
  ERROR_CATEGORIES: ToolError.CATEGORIES,
  
  // 各类错误定义（通过ToolError访问）
  DEVELOPMENT_ERRORS: ToolError.DEVELOPMENT_ERRORS,
  VALIDATION_ERRORS: ToolError.VALIDATION_ERRORS,
  SYSTEM_ERRORS: ToolError.SYSTEM_ERRORS,
  
  // 工具函数（通过ToolError访问）
  validateAgainstSchema: ToolError.validateAgainstSchema,
  checkMissingEnvVars: ToolError.checkMissingEnvVars
};