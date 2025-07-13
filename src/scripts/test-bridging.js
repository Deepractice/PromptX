/**
 * 测试桥接功能的调试脚本
 */
const path = require('path')
const { MindService } = require('../lib/core/cognition/memory/mind/MindService')
const { WordCue } = require('../lib/core/cognition/memory/mind/components/WordCue')
const { GraphSchema } = require('../lib/core/cognition/memory/mind/components/GraphSchema')
const { NetworkSemantic } = require('../lib/core/cognition/memory/mind/components/NetworkSemantic')

async function testBridging() {
  console.log('🧪 测试桥接功能...\n')
  
  const mindService = new MindService()
  const testDir = path.join(__dirname, 'test-bridging')
  mindService.setStoragePath(testDir)
  
  // 创建初始独立的知识领域
  const globalSemantic = new NetworkSemantic('BridgingSemantic')
  
  // 领域1：健康生活
  const healthSchema = new GraphSchema('健康生活')
  const exerciseCue = new WordCue('运动')
  const dietCue = new WordCue('饮食')
  
  // 领域2：技术开发
  const techSchema = new GraphSchema('技术开发')
  const apiCue = new WordCue('API开发')
  const databaseCue = new WordCue('数据库设计')
  
  // 构建初始的独立网络
  await mindService.addMind(healthSchema, globalSemantic)
  await mindService.addMind(techSchema, globalSemantic)
  
  await mindService.connectMinds(exerciseCue, healthSchema)
  await mindService.connectMinds(dietCue, healthSchema)
  
  await mindService.connectMinds(apiCue, techSchema)
  await mindService.connectMinds(databaseCue, techSchema)
  
  // 验证初始状态
  console.log('📊 初始状态:')
  let schemaGroups = globalSemantic.getConnectedSchemaGroups()
  console.log(`Schema 组数量: ${schemaGroups.length}`)
  schemaGroups.forEach((group, i) => {
    console.log(`  组 ${i + 1}: ${group.map(s => s.name).join(', ')}`)
  })
  
  // 打印初始 Mermaid
  let mermaidText = mindService.convertMindToMermaid(globalSemantic)
  console.log('\n初始 Mermaid 输出:')
  console.log(mermaidText)
  console.log('---\n')
  
  // 添加桥接 Schema
  console.log('🌉 添加桥接 Schema...')
  const appSchema = new GraphSchema('健康管理应用')
  const healthDataCue = new WordCue('健康数据')
  const apiDesignCue = new WordCue('API设计')
  
  await mindService.addMind(appSchema, globalSemantic)
  await mindService.connectMinds(healthDataCue, appSchema)
  await mindService.connectMinds(apiDesignCue, appSchema)
  
  // 连接到原有领域
  await mindService.connectMinds(healthDataCue, healthSchema)
  await mindService.connectMinds(apiDesignCue, techSchema)
  
  // 连接到原有 Cue
  await mindService.connectMinds(healthDataCue, dietCue)
  await mindService.connectMinds(apiDesignCue, apiCue)
  
  // 验证桥接后状态
  console.log('\n📊 桥接后状态:')
  schemaGroups = globalSemantic.getConnectedSchemaGroups()
  console.log(`Schema 组数量: ${schemaGroups.length}`)
  schemaGroups.forEach((group, i) => {
    console.log(`  组 ${i + 1}: ${group.map(s => s.name).join(', ')}`)
  })
  
  // 调试：检查每个 Schema 的 Cue
  console.log('\n🔍 Schema 详细信息:')
  const allSchemas = globalSemantic.getAllSchemas()
  allSchemas.forEach(schema => {
    const cues = schema.getCues()
    console.log(`\n${schema.name}:`)
    console.log(`  Cues: ${cues.map(c => c.word).join(', ')}`)
    
    // 检查每个 Cue 的连接
    cues.forEach(cue => {
      const connections = cue.getConnections()
      if (connections.length > 0) {
        console.log(`    ${cue.word} 连接到: ${connections.join(', ')}`)
      }
    })
  })
  
  // 打印桥接后 Mermaid
  mermaidText = mindService.convertMindToMermaid(globalSemantic)
  console.log('\n桥接后 Mermaid 输出:')
  console.log(mermaidText)
  
  console.log('\n✅ 测试完成')
}

if (require.main === module) {
  testBridging().catch(console.error)
}

module.exports = { testBridging }