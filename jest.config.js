module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试目录
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js'
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
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // 项目配置 - 分离不同类型的测试
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/tests/**/*.unit.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/tests/**/*.integration.test.js'],
      testEnvironment: 'node',
      // 集成测试可能需要更长的超时时间
      testTimeout: 30000
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/tests/**/*.e2e.test.js'],
      testEnvironment: 'node',
      // E2E测试需要更长的超时时间
      testTimeout: 60000
    }
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // 全局变量
  globals: {
    TEST_TIMEOUT: 30000
  },
  
  // 详细输出
  verbose: true,
  
  // 并发测试
  maxWorkers: '50%'
}; 