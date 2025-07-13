module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 支持ES模块
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // 转换配置
  transform: {},
  
  // 测试目录 - 测试文件与源码放在一起
  testMatch: [
    '<rootDir>/src/**/*.test.js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/lib/**/*.js',
    'src/bin/**/*.js',
    '!src/tests/**',
    '!**/node_modules/**',
    '!**/fixtures/**'
  ],
  
  // 覆盖率阈值 - 设置为最低要求
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // 全局超时设置
  testTimeout: 15000,
  
  // 模块路径映射
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // 确保能解析node_modules
  moduleDirectories: ['node_modules', 'src'],
  
  // 转换忽略node_modules（除了chevrotain）
  transformIgnorePatterns: [
    'node_modules/(?!(chevrotain)/)'
  ],
  
  // 详细输出
  verbose: false,  // 减少输出噪音
  
  // 并发测试
  maxWorkers: '50%',
  
  // 清理模式
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // 简化错误处理
  detectOpenHandles: false,  // 关闭句柄检测以提高速度
  forceExit: true
}; 