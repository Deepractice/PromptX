#!/usr/bin/env node

const { CognitionManager } = require('./src/lib/core/cognition/CognitionManager');
const { ResourceManager } = require('./src/lib/core/resource');
const logger = require('./src/lib/utils/logger');

async function testCognitionManager() {
  logger.info('🧪 开始测试 CognitionManager 集成...');
  
  try {
    // 1. 创建 ResourceManager 实例
    logger.info('📦 步骤1: 创建 ResourceManager...');
    const resourceManager = new ResourceManager();
    
    // 2. 创建 CognitionManager 实例
    logger.info('🧠 步骤2: 创建 CognitionManager...');
    const cognitionManager = new CognitionManager(resourceManager);
    
    // 3. 测试获取认知实例
    logger.info('🎭 步骤3: 获取角色认知实例...');
    const testRole = 'test-developer';
    const cognition = await cognitionManager.getCognition(testRole);
    logger.success(`✅ 成功获取认知实例: ${testRole}`);
    
    // 4. 测试记忆功能
    logger.info('💭 步骤4: 测试 remember 功能...');
    const content1 = "React hooks 是函数组件的状态管理方案";
    const schema1 = `mindmap
  React框架
    Hooks机制
      useState
      useEffect
      useCallback`;
    
    await cognitionManager.remember(testRole, content1, schema1, 0.9);
    logger.success('✅ 第一个记忆保存成功');
    
    // 添加第二个记忆
    const content2 = "Vue3 使用 Composition API 实现状态管理";
    const schema2 = `mindmap
  Vue框架
    Composition API
      ref
      reactive
      computed`;
    
    await cognitionManager.remember(testRole, content2, schema2, 0.8);
    logger.success('✅ 第二个记忆保存成功');
    
    // 5. 测试启动效应
    logger.info('🌟 步骤5: 测试 prime 功能...');
    const mindmap = await cognitionManager.prime(testRole);
    logger.info('当前语义网络:');
    console.log(mindmap);
    
    // 6. 测试回忆功能
    logger.info('🔍 步骤6: 测试 recall 功能...');
    const memories = await cognitionManager.recall(testRole, 'React');
    logger.info(`找到 ${memories.length} 个相关记忆:`);
    memories.forEach((memory, index) => {
      logger.info(`  记忆${index + 1}: ${memory.content.substring(0, 50)}...`);
    });
    
    // 7. 测试持久化
    logger.info('💾 步骤7: 测试持久化...');
    // 清理缓存，强制重新加载
    cognitionManager.clearCognition(testRole);
    logger.info('已清理内存中的认知实例');
    
    // 重新获取认知实例
    const cognition2 = await cognitionManager.getCognition(testRole);
    const mindmap2 = await cognitionManager.prime(testRole);
    logger.info('重新加载后的语义网络:');
    console.log(mindmap2);
    
    // 8. 测试活跃认知实例管理
    logger.info('📊 步骤8: 测试活跃认知实例管理...');
    const activeCognitions = cognitionManager.getActiveCognitions();
    logger.info(`当前活跃的认知实例数: ${activeCognitions.size}`);
    for (const [role, cog] of activeCognitions) {
      logger.info(`  - ${role}`);
    }
    
    logger.success('🎉 CognitionManager 集成测试完成!');
    
  } catch (error) {
    logger.error('❌ 测试失败:', error);
    console.error(error.stack);
  }
}

// 运行测试
testCognitionManager();