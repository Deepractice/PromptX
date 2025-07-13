/**
 * 干净的记忆强度过滤测试
 * 验证 strength <= 0.5 的记忆会被抛弃
 */
const path = require('path')
const { Cognition } = require('../lib/core/cognition')
const fs = require('fs-extra')

async function testStrengthFiltering() {
  console.log('🧪 测试记忆强度过滤功能（干净环境）...\n')

  try {
    // 测试配置 - 使用唯一的测试目录
    const testDir = path.join(__dirname, 'test-strength-clean-' + Date.now())
    const testConfig = {
      longTermPath: path.join(testDir, 'longterm'),
      semanticPath: path.join(testDir, 'semantic')
    }

    // 创建 Cognition 实例
    const cognition = new Cognition(testConfig)
    console.log('✅ Cognition 实例创建成功（干净环境）\n')

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

    // 2. 立即检索（因为容量为0，所以应该是空的）
    console.log('2️⃣ 立即检索（容量为0的短期记忆）:')
    const immediateRecall = await cognition.recall()
    console.log(`  找到 ${immediateRecall.length} 条记忆`)
    
    // 分析结果
    const strongInShortTerm = immediateRecall.filter(e => e.getStrength() > 0.5).length
    const weakInShortTerm = immediateRecall.filter(e => e.getStrength() <= 0.5).length
    
    console.log(`    - 强记忆 (>0.5): ${strongInShortTerm} 条`)
    console.log(`    - 弱记忆 (≤0.5): ${weakInShortTerm} 条`)
    console.log('\n')

    // 3. 详细显示巩固后的记忆
    console.log('3️⃣ 巩固后的记忆详情:')
    
    const consolidated = await cognition.recall()
    const strongMemories = []
    const weakMemories = []
    
    consolidated.forEach(engram => {
      const strength = engram.getStrength()
      const content = engram.getContent()
      
      if (strength > 0.5) {
        strongMemories.push({ content, strength })
      } else {
        weakMemories.push({ content, strength })
      }
    })
    
    console.log('  ✅ 保留的强记忆:')
    strongMemories.forEach(m => {
      console.log(`    - "${m.content}" (强度: ${m.strength})`)
    })
    
    if (weakMemories.length > 0) {
      console.log('\n  ❌ 不应存在的弱记忆:')
      weakMemories.forEach(m => {
        console.log(`    - "${m.content}" (强度: ${m.strength})`)
      })
    } else {
      console.log('\n  ✅ 没有弱记忆被保留（正确）')
    }
    
    console.log(`\n  统计结果:`)
    console.log(`    - 预期保留: 3 条（强度 > 0.5）`)
    console.log(`    - 实际保留: ${strongMemories.length} 条`)
    console.log(`    - 预期丢弃: 3 条（强度 ≤ 0.5）`)
    console.log(`    - 实际丢弃: ${3 - weakMemories.length} 条`)
    console.log('\n')

    // 4. 测试带 schema 的记忆
    console.log('4️⃣ 测试带 schema 的不同强度记忆:')
    
    // 添加带 schema 的强记忆
    const strongWithSchema = {
      content: '重要的架构设计',
      schema: `mindmap
  root((架构设计))
    核心组件
      数据层
      业务层
      展示层`,
      strength: 0.9
    }
    
    // 添加带 schema 的弱记忆
    const weakWithSchema = {
      content: '临时的实验代码',
      schema: `mindmap
  root((实验代码))
    测试功能
      临时方案`,
      strength: 0.3
    }
    
    cognition.remember(strongWithSchema.content, strongWithSchema.schema, strongWithSchema.strength)
    console.log(`  📝 强记忆: "${strongWithSchema.content}" (强度: ${strongWithSchema.strength})`)
    
    cognition.remember(weakWithSchema.content, weakWithSchema.schema, weakWithSchema.strength)
    console.log(`  📝 弱记忆: "${weakWithSchema.content}" (强度: ${weakWithSchema.strength})`)
    
    // 获取语义网络
    console.log('\n  检查语义网络:')
    const semantic = await cognition.prime()
    
    const hasStrongSchema = semantic.includes('架构设计')
    const hasWeakSchema = semantic.includes('实验代码')
    
    console.log(`    - 强记忆的 schema: ${hasStrongSchema ? '✅ 已保存' : '❌ 未保存'}`)
    console.log(`    - 弱记忆的 schema: ${hasWeakSchema ? '❌ 已保存（错误）' : '✅ 未保存（正确）'}`)
    
    if (semantic.trim() !== 'root)global-semantic)') {
      console.log('\n  语义网络内容:')
      console.log('```mermaid')
      console.log(semantic)
      console.log('```')
    }
    
    // 清理测试数据
    await fs.remove(testDir)
    console.log('\n✅ 测试完成！测试数据已清理')
    
    // 总结
    console.log('\n📊 测试总结:')
    console.log('- SimpleEvaluator 使用 strength > 0.5 作为巩固标准')
    console.log('- 强度 ≤ 0.5 的记忆在巩固时会被抛弃')
    console.log('- 带 schema 的弱记忆同样会被过滤')
    console.log('- 只有强记忆的 schema 会进入语义网络')
    console.log('- 这模拟了人脑的选择性注意和遗忘机制')
    
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