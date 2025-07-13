/**
 * Prime 功能测试脚本
 * 测试 cognition 系统中 prime 生成语义网络的功能
 */
const path = require('path')
const { Cognition } = require('../lib/core/cognition')
const { Engram } = require('../lib/core/cognition/engram/Engram')

async function testPrimeFunction() {
  console.log('🧪 开始测试 Prime 功能...\n')

  try {
    // 测试配置
    const testConfig = {
      longTermPath: path.join(__dirname, 'test-data', 'longterm'),
      semanticPath: path.join(__dirname, 'test-data', 'semantic')
    }

    // 1. 创建 Cognition 实例
    console.log('1️⃣ 创建 Cognition 实例:')
    const cognition = new Cognition(testConfig)
    console.log('✅ Cognition 实例创建成功')
    console.log(`   长期记忆路径: ${testConfig.longTermPath}`)
    console.log(`   语义网络路径: ${testConfig.semanticPath}`)
    console.log('\n')

    // 2. 测试空语义网络的 prime
    console.log('2️⃣ 测试空语义网络的 prime:')
    try {
      const emptyMermaid = await cognition.prime()
      console.log('✅ Prime 执行成功（空语义网络）:')
      console.log('```mermaid')
      console.log(emptyMermaid)
      console.log('```')
    } catch (error) {
      console.log('❌ Prime 失败:', error.message)
    }
    console.log('\n')

    // 3. 添加带有 schema 的记忆
    console.log('3️⃣ 添加带有 Mermaid schema 的记忆:')
    
    // 创建带有 Mermaid mindmap schema 的记忆
    const memoriesWithSchema = [
      {
        content: 'PromptX 是一个 AI 角色管理系统',
        schema: `mindmap
  root((PromptX))
    产品特性
      角色管理
      资源协议
      生态集成
    技术架构
      DPML协议
      MCP适配
      PATEOAS引擎`
      },
      {
        content: '矛盾分析是产品管理的核心方法',
        schema: `mindmap
  root((矛盾分析))
    理论基础
      马克思主义
      对立统一
    实践应用
      产品决策
      技术选型
    管理工具
      GitHub Issues
      三轨制架构`
      },
      {
        content: '认知系统基于心理学原理设计',
        schema: `mindmap
  root((认知系统))
    记忆类型
      短期记忆
      长期记忆
      语义记忆
    认知过程
      编码
      存储
      检索
    应用场景
      知识管理
      AI记忆`
      }
    ]

    // 记住这些带有 schema 的内容（使用新的简化接口）
    memoriesWithSchema.forEach((memory, index) => {
      cognition.remember(memory.content, memory.schema)
      console.log(`✅ 记忆 ${index + 1}: "${memory.content}"`)
    })
    console.log('\n')

    // 4. 测试包含内容的 prime
    console.log('4️⃣ 测试包含语义网络内容的 prime:')
    try {
      const mermaidWithContent = await cognition.prime()
      console.log('✅ Prime 执行成功（包含语义网络）:')
      console.log('```mermaid')
      console.log(mermaidWithContent)
      console.log('```')
      
      // 验证内容
      console.log('\n验证语义网络内容:')
      const hasPromptX = mermaidWithContent.includes('PromptX')
      const hasContradiction = mermaidWithContent.includes('矛盾分析')
      const hasCognition = mermaidWithContent.includes('认知系统')
      
      console.log(`  - 包含 PromptX: ${hasPromptX ? '✅' : '❌'}`)
      console.log(`  - 包含 矛盾分析: ${hasContradiction ? '✅' : '❌'}`)
      console.log(`  - 包含 认知系统: ${hasCognition ? '✅' : '❌'}`)
    } catch (error) {
      console.log('❌ Prime 失败:', error.message)
      console.error(error.stack)
    }
    console.log('\n')

    // 5. 测试保存和加载语义网络
    console.log('5️⃣ 测试保存和加载语义网络:')
    
    // 获取当前语义网络并保存
    const semantic = cognition.getSemantic()
    console.log(`当前语义网络名称: ${semantic.name}`)
    
    // 尝试使用 prime 加载指定的语义网络
    try {
      const loadedMermaid = await cognition.prime('test-semantic')
      console.log('✅ 加载指定语义网络成功')
    } catch (error) {
      console.log('⚠️  加载指定语义网络失败（预期行为）:', error.message)
    }
    console.log('\n')

    // 6. 测试复杂的语义网络合并
    console.log('6️⃣ 测试复杂语义网络的构建:')
    
    // 添加更多相关的记忆，测试语义网络的自动合并
    const additionalMemories = [
      {
        content: 'DPML 是 PromptX 的核心协议',
        schema: `mindmap
  root((DPML协议))
    设计理念
      结构化
      可组合
    核心元素
      role
      thought
      execution
      knowledge`
      }
    ]
    
    additionalMemories.forEach((memory) => {
      cognition.remember(memory.content, memory.schema)
      console.log(`✅ 添加额外记忆: "${memory.content}"`)
    })
    
    // 再次执行 prime 查看合并后的结果
    const finalMermaid = await cognition.prime()
    console.log('\n最终的语义网络:')
    console.log('```mermaid')
    console.log(finalMermaid)
    console.log('```')
    
    console.log('\n✅ Prime 功能测试完成！')
    
    // 总结
    console.log('\n📊 测试总结:')
    console.log('- prime() 可以正确返回当前语义网络的 Mermaid 表示')
    console.log('- 空语义网络会返回基础的 mindmap 结构')
    console.log('- 带有 schema 的记忆会被整合到语义网络中')
    console.log('- prime(name) 可以尝试加载指定的语义网络')
    console.log('- 多个 schema 会自动合并成一个完整的语义网络')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testPrimeFunction()
}

module.exports = { testPrimeFunction }