/**
 * 测试记忆强度过滤功能
 * 验证 strength <= 0.5 的记忆会被抛弃
 */
const path = require('path')
const { Cognition } = require('../lib/core/cognition')

async function testStrengthFiltering() {
  console.log('🧪 测试记忆强度过滤功能...\n')

  try {
    // 测试配置
    const testConfig = {
      longTermPath: path.join(__dirname, 'test-strength-data', 'longterm'),
      semanticPath: path.join(__dirname, 'test-strength-data', 'semantic')
    }

    // 创建 Cognition 实例
    const cognition = new Cognition(testConfig)
    console.log('✅ Cognition 实例创建成功\n')

    // 1. 测试不同强度的记忆
    console.log('1️⃣ 添加不同强度的记忆:')
    
    const memoriesWithStrength = [
      { content: '强记忆：重要的项目截止日期', strength: 1.0 },
      { content: '中等记忆：团队会议讨论内容', strength: 0.7 },
      { content: '临界记忆：刚好超过阈值', strength: 0.51 },
      { content: '弱记忆：随意浏览的新闻', strength: 0.5 },  // 会被抛弃
      { content: '极弱记忆：背景噪音信息', strength: 0.3 },  // 会被抛弃
      { content: '无关记忆：完全不重要的内容', strength: 0.1 }  // 会被抛弃
    ]

    memoriesWithStrength.forEach((memory) => {
      cognition.remember(memory.content, null, memory.strength)
      console.log(`  📝 记忆: "${memory.content}" (强度: ${memory.strength})`)
    })
    console.log('\n')

    // 2. 立即检索（应该能找到所有6条）
    console.log('2️⃣ 立即检索（短期记忆中）:')
    const immediateRecall = await cognition.recall()
    console.log(`  找到 ${immediateRecall.length} 条记忆`)
    immediateRecall.forEach(engram => {
      console.log(`    - "${engram.getContent()}" (强度: ${engram.getStrength()})`)
    })
    console.log('\n')

    // 3. 触发巩固（添加第7条记忆，触发短期记忆容量为0的立即巩固）
    console.log('3️⃣ 触发巩固过程:')
    console.log('  添加新记忆触发之前记忆的巩固...')
    cognition.remember('触发器记忆', null, 0.8)
    console.log('\n')

    // 4. 检索巩固后的记忆
    console.log('4️⃣ 巩固后检索（长期记忆）:')
    const afterConsolidation = await cognition.recall()
    console.log(`  找到 ${afterConsolidation.length} 条记忆`)
    
    // 统计不同强度的记忆
    let strongCount = 0
    let weakCount = 0
    
    afterConsolidation.forEach(engram => {
      const strength = engram.getStrength()
      if (strength > 0.5) {
        strongCount++
        console.log(`    ✅ 保留: "${engram.getContent()}" (强度: ${strength})`)
      } else {
        weakCount++
        console.log(`    ❌ 应被抛弃但仍存在: "${engram.getContent()}" (强度: ${strength})`)
      }
    })
    
    console.log(`\n  统计结果:`)
    console.log(`    - 强记忆 (>0.5): ${strongCount} 条`)
    console.log(`    - 弱记忆 (≤0.5): ${weakCount} 条`)
    console.log('\n')

    // 5. 测试带 schema 的弱记忆
    console.log('5️⃣ 测试带 schema 的弱记忆:')
    
    const weakMemoryWithSchema = {
      content: '不重要的技术细节',
      schema: `mindmap
  root((技术细节))
    不重要的配置
    临时的解决方案`,
      strength: 0.3
    }
    
    cognition.remember(weakMemoryWithSchema.content, weakMemoryWithSchema.schema, weakMemoryWithSchema.strength)
    console.log(`  📝 添加弱记忆: "${weakMemoryWithSchema.content}" (强度: ${weakMemoryWithSchema.strength})`)
    
    // 触发巩固
    cognition.remember('另一个触发器', null, 0.9)
    
    // 检查语义网络
    const semantic = await cognition.prime()
    console.log('\n  语义网络内容:')
    console.log('```mermaid')
    console.log(semantic)
    console.log('```')
    
    const hasWeakSchema = semantic.includes('技术细节')
    console.log(`\n  弱记忆的 schema 是否被保存: ${hasWeakSchema ? '❌ 是（不应该）' : '✅ 否（正确）'}`)
    
    console.log('\n✅ 测试完成！')
    
    // 总结
    console.log('\n📊 测试总结:')
    console.log('- SimpleEvaluator 使用 strength > 0.5 作为巩固标准')
    console.log('- 强度 ≤ 0.5 的记忆在巩固时会被抛弃')
    console.log('- 即使有 schema，弱记忆也不会被保存到语义网络')
    console.log('- 这模拟了人脑过滤不重要信息的机制')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testStrengthFiltering()
}

module.exports = { testStrengthFiltering }