/**
 * 锦囊框架测试脚本
 */
const path = require('path')
const { cli } = require(path.join(__dirname, '..', 'lib', 'core', 'pouch'))

async function testPouchFramework () {
  console.log('🧪 开始测试锦囊框架...\n')

  try {
    // 测试1: 初始化
    console.log('1️⃣ 测试 init 命令:')
    await cli.execute('init')
    console.log('\n')

    // 测试2: 发现角色
    console.log('2️⃣ 测试 welcome 命令:')
    await cli.execute('welcome')
    console.log('\n')

    // 测试3: 激活角色
    console.log('3️⃣ 测试 action 命令:')
    await cli.execute('action', ['copywriter'])
    console.log('\n')

    // 测试4: 学习领域
    console.log('4️⃣ 测试 learn 命令:')
    await cli.execute('learn', ['scrum'])
    console.log('\n')

    // 测试5: 检索记忆
    console.log('5️⃣ 测试 recall 命令:')
    await cli.execute('recall', ['test'])
    console.log('\n')

    // 测试6: 获取状态
    console.log('6️⃣ 当前状态:')
    console.log(JSON.stringify(cli.getStatus(), null, 2))
    console.log('\n')

    console.log('✅ 锦囊框架测试完成！')
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testPouchFramework()
}

module.exports = { testPouchFramework }
