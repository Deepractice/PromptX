// 测试 Schema 详细信息

const { MindService } = require('../lib/core/cognition/memory/mind/MindService');
const path = require('path');

async function testSchemaDetail() {
  console.log('🔍 测试 Schema 详细信息\n');
  
  const testDir = path.join(__dirname, '../../.test-memory');
  const mindService = new MindService();
  mindService.setStoragePath(testDir);
  
  // Prime 并加载第一个 Schema
  await mindService.primeSemantic();
  
  const mindmap = `mindmap
  ((测试系统))
    功能模块
      模块A
      模块B
    架构设计
      前端
      后端`;
  
  const semantic = await mindService.remember(mindmap);
  
  console.log('📊 Schema 详细信息:');
  const schemas = semantic.getAllSchemas();
  
  schemas.forEach(schema => {
    console.log(`\n📌 Schema: ${schema.name}`);
    console.log('  Cues:', schema.getCues().map(c => c.word));
    console.log('  Cue 连接关系:');
    
    schema.getCues().forEach(cue => {
      const connections = cue.getConnections();
      if (connections && connections.length > 0) {
        console.log(`    ${cue.word} -> ${connections.join(', ')}`);
      }
    });
    
    // 查看内部图结构
    if (schema.internalGraph) {
      console.log('  内部图节点数:', schema.internalGraph.order);
      console.log('  内部图边数:', schema.internalGraph.size);
    }
  });
  
  console.log('\n🎨 导出的 mindmap:');
  const exported = await mindService.exportToMindmap();
  console.log(exported);
}

testSchemaDetail().catch(console.error);