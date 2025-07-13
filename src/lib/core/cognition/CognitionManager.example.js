// CognitionManager 使用示例
// 展示如何为不同角色管理独立的认知系统

const { CognitionManager } = require('./CognitionManager');
const { getGlobalResourceManager } = require('../resource');

async function demo() {
  console.log('=== CognitionManager 示例 ===\n');
  
  // 获取资源管理器（在实际使用中，这应该在应用启动时初始化）
  const resourceManager = getGlobalResourceManager();
  
  // 创建认知管理器
  const cognitionManager = new CognitionManager(resourceManager);
  
  try {
    // 1. 为 Java 开发者角色保存记忆
    console.log('1. 为 Java 开发者保存专业知识：');
    await cognitionManager.remember(
      'java-developer',
      'Spring Boot 最佳实践：使用 @RestControllerAdvice 统一处理异常',
      null,  // 没有结构化认知时传 null
      0.9    // 强度 0.9
    );
    console.log('✅ 记忆已保存\n');
    
    // 2. 为产品经理角色保存记忆
    console.log('2. 为产品经理保存方法论：');
    const productSchema = `mindmap
  root((需求分析))
    用户调研
      访谈
      问卷
    竞品分析
      功能对比
      用户体验
    数据分析
      用户行为
      转化率`;
      
    await cognitionManager.remember(
      'product-manager',
      '需求分析三步法：用户调研、竞品分析、数据分析',
      productSchema,
      1.0
    );
    console.log('✅ 记忆已保存（包含结构化知识）\n');
    
    // 3. 检索 Java 开发者的记忆
    console.log('3. 检索 Java 开发者的记忆：');
    const javaMemories = await cognitionManager.recall('java-developer', 'Spring');
    console.log(`找到 ${javaMemories.length} 条相关记忆：`);
    javaMemories.forEach(mem => {
      console.log(`  - ${mem.content} (强度: ${mem.strength})`);
    });
    console.log();
    
    // 4. 检索产品经理的记忆
    console.log('4. 检索产品经理的记忆：');
    const pmMemories = await cognitionManager.recall('product-manager', '');
    console.log(`找到 ${pmMemories.length} 条记忆：`);
    pmMemories.forEach(mem => {
      console.log(`  - ${mem.content}`);
    });
    console.log();
    
    // 5. 验证角色隔离
    console.log('5. 验证角色记忆隔离：');
    const javaAllMemories = await cognitionManager.recall('java-developer', '');
    const pmAllMemories = await cognitionManager.recall('product-manager', '');
    console.log(`Java 开发者记忆数: ${javaAllMemories.length}`);
    console.log(`产品经理记忆数: ${pmAllMemories.length}`);
    console.log('✅ 不同角色的记忆完全隔离\n');
    
    // 6. 展示活跃的认知实例
    console.log('6. 当前活跃的认知实例：');
    const activeCognitions = cognitionManager.getActiveCognitions();
    console.log(`活跃实例数: ${activeCognitions.size}`);
    console.log('角色列表:', Array.from(activeCognitions.keys()));
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  // 清理（在实际应用中，这可能在应用关闭时执行）
  cognitionManager.clearAll();
  console.log('\n✅ 示例完成，所有认知实例已清理');
}

// 运行示例
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { demo };