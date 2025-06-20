// Jest测试环境设置文件

// 全局测试超时设置
jest.setTimeout(15000)

// 控制台输出配置
const originalError = console.error
console.error = (...args) => {
  // 过滤掉某些预期的警告信息
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('Warning: ReactDOM.render is deprecated')) return
    if (args[0].includes('Warning: componentWillReceiveProps')) return
  }
  originalError(...args)
}

// 模拟环境变量
process.env.NODE_ENV = 'test'
process.env.PROMPTX_TEST_MODE = 'true'

// 清理函数
afterEach(() => {
  // 清理任何测试状态
})

afterAll(() => {
  // 最终清理
})