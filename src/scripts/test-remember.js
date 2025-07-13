// 测试 remember 功能的脚本

const { MindService } = require('../lib/core/cognition/memory/mind/MindService');
const { NetworkSemantic } = require('../lib/core/cognition/memory/mind/components/NetworkSemantic');
const path = require('path');
const fs = require('fs').promises;

async function testRemember() {
  console.log('🧪 开始测试 remember 功能...\n');
  
  // 设置测试目录
  const testDir = path.join(__dirname, '../../.test-memory');
  
  // 清理测试目录
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (e) {}
  
  // 创建 MindService 实例
  const mindService = new MindService();
  mindService.setStoragePath(testDir);
  
  console.log('🚀 Prime 语义网络');
  try {
    const primeResult = await mindService.primeSemantic();
    console.log('✅ Prime 成功，初始状态:');
    console.log(primeResult);
    console.log('');
  } catch (error) {
    console.error('❌ Prime 失败:', error.message);
    return;
  }
  
  console.log('📝 测试1: 第一次 remember');
  const mindmap1 = `mindmap
  ((记忆系统))
    测试功能
      remember功能
        正常工作验证
      recall功能
    架构设计
      持久化方案
        二进制格式`;
  
  try {
    const semantic1 = await mindService.remember(mindmap1);
    console.log('✅ 第一次 remember 成功');
    console.log('  - Schemas 数量:', semantic1.getAllSchemas().length);
    console.log('  - Schema 名称:', semantic1.getAllSchemas().map(s => s.name));
    console.log('  - Cues 总数:', semantic1.getAllCues().length);
    console.log('');
  } catch (error) {
    console.error('❌ 第一次 remember 失败:', error.message);
    return;
  }
  
  console.log('📝 测试2: 第二次 remember（新 Schema）');
  const mindmap2 = `mindmap
  ((性能优化))
    缓存策略
      内存缓存
      磁盘缓存
    算法优化
      时间复杂度
      空间复杂度`;
  
  try {
    const semantic2 = await mindService.remember(mindmap2);
    console.log('✅ 第二次 remember 成功');
    console.log('  - Schemas 数量:', semantic2.getAllSchemas().length);
    console.log('  - Schema 名称:', semantic2.getAllSchemas().map(s => s.name));
    console.log('  - Cues 总数:', semantic2.getAllCues().length);
    console.log('');
  } catch (error) {
    console.error('❌ 第二次 remember 失败:', error.message);
    return;
  }
  
  console.log('📝 测试3: 第三次 remember（合并到现有 Schema）');
  const mindmap3 = `mindmap
  ((记忆系统))
    测试功能
      集成测试
      单元测试
    性能测试
      压力测试
      负载测试`;
  
  try {
    const semantic3 = await mindService.remember(mindmap3);
    console.log('✅ 第三次 remember 成功（应该合并到第一个 Schema）');
    console.log('  - Schemas 数量:', semantic3.getAllSchemas().length);
    console.log('  - Schema 名称:', semantic3.getAllSchemas().map(s => s.name));
    
    // 查看第一个 Schema 的详细信息
    const memorySchema = semantic3.findSchema('记忆系统');
    if (memorySchema) {
      console.log('  - "记忆系统" Schema 的 Cues:', memorySchema.getCues().map(c => c.word));
    }
    console.log('');
  } catch (error) {
    console.error('❌ 第三次 remember 失败:', error.message);
    return;
  }
  
  console.log('🔍 测试4: 验证持久化');
  try {
    // 等待异步持久化完成
    console.log('  - 等待异步持久化完成...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 创建新的 MindService 实例来验证持久化
    const newMindService = new MindService();
    newMindService.setStoragePath(testDir);
    
    // 重新加载，验证数据是否持久化
    const loadedSemantic = await NetworkSemantic.load(testDir, 'global-semantic');
    console.log('✅ 持久化验证成功');
    console.log('  - 加载的 Schemas 数量:', loadedSemantic.getAllSchemas().length);
    console.log('  - Schema 名称:', loadedSemantic.getAllSchemas().map(s => s.name));
    console.log('  - Cues 总数:', loadedSemantic.getAllCues().length);
    console.log('');
  } catch (error) {
    console.error('❌ 持久化验证失败:', error.message);
    return;
  }
  
  console.log('🎨 测试5: 导出为 mindmap');
  try {
    const exportedMindmap = await mindService.exportToMindmap();
    console.log('✅ 导出成功，mindmap 内容:');
    console.log('---');
    console.log(exportedMindmap);
    console.log('---');
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
  }
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
testRemember().catch(console.error);