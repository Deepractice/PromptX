/**
 * 错误管理系统入口
 * 导出所有错误相关的定义和工具
 */

const ERROR_CATEGORIES = require('./ErrorCategories');
const DEVELOPMENT_ERRORS = require('./DevelopmentErrors');
const { VALIDATION_ERRORS, validateAgainstSchema, checkMissingEnvVars } = require('./ValidationErrors');
const SYSTEM_ERRORS = require('./SystemErrors');
const ToolErrorManager = require('./ToolErrorManager');
const ToolError = require('./ToolError');

// 合并所有错误定义
const ALL_ERROR_DEFINITIONS = {
  ...DEVELOPMENT_ERRORS,
  ...VALIDATION_ERRORS,
  ...SYSTEM_ERRORS
};

module.exports = {
  // 简化的错误类（对外主要接口）
  ToolError,
  
  // 错误管理器
  ToolErrorManager,
  
  // 错误分类
  ERROR_CATEGORIES,
  
  // 各类错误定义
  DEVELOPMENT_ERRORS,
  VALIDATION_ERRORS,
  SYSTEM_ERRORS,
  ALL_ERROR_DEFINITIONS,
  
  // 工具函数
  validateAgainstSchema,
  checkMissingEnvVars
};