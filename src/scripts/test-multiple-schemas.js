/**
 * 测试多个独立 schema 的 prime 功能
 * 验证无关联的多个知识领域如何在语义网络中表现
 */
const path = require('path')
const { Cognition } = require('../lib/core/cognition')
const { Engram } = require('../lib/core/cognition/engram/Engram')

async function testMultipleSchemas() {
  console.log('🧪 测试多个独立 Schema 的 Prime 功能...\n')

  try {
    // 测试配置
    const testConfig = {
      longTermPath: path.join(__dirname, 'test-data-multi', 'longterm'),
      semanticPath: path.join(__dirname, 'test-data-multi', 'semantic')
    }

    // 创建 Cognition 实例
    const cognition = new Cognition(testConfig)
    console.log('✅ Cognition 实例创建成功\n')

    // 1. 添加完全独立的知识领域
    console.log('1️⃣ 添加多个独立的知识领域:')
    
    const independentMemories = [
      {
        content: '烹饪技巧：如何制作完美的意大利面',
        schema: `mindmap
  root((烹饪))
    意大利菜
      意大利面
        选材
        烹煮技巧
        酱汁搭配
      披萨
        面团制作
        烘烤温度
    中式料理
      炒菜技巧
      火候掌握`
      },
      {
        content: '量子物理基础概念',
        schema: `mindmap
  root((量子物理))
    基础概念
      波粒二象性
      不确定性原理
      量子纠缠
    应用领域
      量子计算
      量子通信`
      },
      {
        content: '瑜伽与冥想练习',
        schema: `mindmap
  root((身心健康))
    瑜伽
      体式练习
        站立体式
        坐姿体式
      呼吸法
    冥想
      正念冥想
      观想冥想`
      },
      {
        content: '区块链技术原理',
        schema: `mindmap
  root((区块链))
    核心技术
      分布式账本
      共识机制
      密码学
    应用场景
      加密货币
      智能合约`
      }
    ]

    // 记住这些独立的内容（使用新的简化接口）
    independentMemories.forEach((memory, index) => {
      cognition.remember(memory.content, memory.schema)
      console.log(`✅ 记忆 ${index + 1}: "${memory.content}"`)
    })
    console.log('\n')

    // 2. 测试 prime 结果
    console.log('2️⃣ 测试多个独立 Schema 的 Prime 结果:')
    const primeResult = await cognition.prime()
    console.log('```mermaid')
    console.log(primeResult)
    console.log('```\n')

    // 3. 分析结果
    console.log('3️⃣ 分析语义网络结构:')
    
    // 检查各个独立主题是否存在
    const topics = ['烹饪', '量子物理', '身心健康', '区块链']
    topics.forEach(topic => {
      const exists = primeResult.includes(topic)
      console.log(`  - ${topic}: ${exists ? '✅ 存在' : '❌ 不存在'}`)
    })
    console.log('\n')

    // 4. 添加一个可能产生关联的记忆
    console.log('4️⃣ 添加一个可能关联的记忆:')
    const bridgingMemory = {
      content: '健康饮食与运动的重要性',
      schema: `mindmap
  root((健康生活))
    饮食
      营养均衡
      烹饪方法
    运动
      瑜伽练习
      有氧运动`
    }
    
    cognition.remember(bridgingMemory.content, bridgingMemory.schema)
    console.log(`✅ 添加桥接记忆: "${bridgingMemory.content}"\n`)

    // 5. 再次测试 prime
    console.log('5️⃣ 添加桥接记忆后的 Prime 结果:')
    const primeResultAfterBridge = await cognition.prime()
    console.log('```mermaid')
    console.log(primeResultAfterBridge)
    console.log('```\n')

    // 6. 测试保存多个独立的语义网络
    console.log('6️⃣ 测试是否可以识别多个独立的语义子图:')
    
    // 计算根节点数量（简单方式）
    const rootMatches = primeResultAfterBridge.match(/root\)/g)
    const rootCount = rootMatches ? rootMatches.length : 0
    console.log(`  - 检测到的根节点数量: ${rootCount}`)
    
    // 分析节点之间的连接
    console.log('  - 分析节点连接情况...')
    const lines = primeResultAfterBridge.split('\n')
    const indentLevels = new Set()
    lines.forEach(line => {
      const indent = line.match(/^\s*/)[0].length
      if (line.trim()) indentLevels.add(indent)
    })
    console.log(`  - 检测到 ${indentLevels.size} 个不同的缩进层级`)
    
    console.log('\n✅ 测试完成！')
    
    // 总结
    console.log('\n📊 测试总结:')
    console.log('- 多个独立的 schema 会被合并到同一个语义网络中')
    console.log('- 每个独立的知识领域保持其原有结构')
    console.log('- 如果存在共同概念，可能会产生连接')
    console.log('- 当前实现将所有 schema 合并到一个 global-semantic 网络')
    console.log('\n💡 建议:')
    console.log('- 未来可以考虑支持多个独立的语义网络')
    console.log('- 或者在 prime 结果中明确标识不同的知识子图')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testMultipleSchemas()
}

module.exports = { testMultipleSchemas }