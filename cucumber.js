/**
 * Cucumber配置文件
 * 定义不同的测试配置文件（profiles）
 */

module.exports = {
  // 默认配置
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/**/*.js',
      'features/step-definitions/**/*.js'
    ],
    format: [
      'progress',
      'html:test-results/cucumber-report.html',
      'json:test-results/cucumber-report.json'
    ],
    publishQuiet: true,
    language: 'zh-CN'
  },

  // 按执行层级的配置
  smoke: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress'],
    tags: '@smoke',
    publishQuiet: true,
    language: 'zh-CN'
  },

  critical: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress', 'json:test-results/cucumber-report.json'],
    tags: '@critical',
    publishQuiet: true,
    language: 'zh-CN'
  },

  comprehensive: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: [
      'progress',
      'html:test-results/cucumber-report.html',
      'json:test-results/cucumber-report.json'
    ],
    tags: '@comprehensive',
    publishQuiet: true,
    language: 'zh-CN'
  },

  // 按速度的配置
  fast: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress'],
    tags: '@fast and not @slow',
    publishQuiet: true,
    language: 'zh-CN'
  },

  // 按领域的配置
  mcp: {
    paths: ['features/e2e/mcp/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress', 'html:test-results/cucumber-report.html'],
    publishQuiet: true,
    language: 'zh-CN'
  },

  cognition: {
    paths: ['features/e2e/cognition/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress', 'html:test-results/cognition-report.html'],
    publishQuiet: true,
    language: 'zh-CN'
  },

  'cognition:smoke': {
    paths: ['features/e2e/cognition/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress'],
    tags: '@smoke',
    publishQuiet: true,
    language: 'zh-CN'
  },

  'cognition:critical': {
    paths: ['features/e2e/cognition/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress', 'html:test-results/cognition-critical.html'],
    tags: '@critical',
    publishQuiet: true,
    language: 'zh-CN'
  },

  // CI/CD配置
  ci: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js'],
    format: ['progress', 'json:test-results/cucumber-report.json'],
    tags: '@smoke or @critical',
    publishQuiet: true,
    language: 'zh-CN',
    parallel: 2
  }
};