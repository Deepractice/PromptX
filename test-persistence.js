#!/usr/bin/env node

const { CognitionManager } = require('./src/lib/core/cognition/CognitionManager');
const { ResourceManager } = require('./src/lib/core/resource');
const logger = require('./src/lib/utils/logger');
const fs = require('fs-extra');
const path = require('path');
// msgpack 在 NetworkSemantic 内部处理，我们不需要直接使用

async function testPersistence() {
  logger.info('🧪 测试认知系统持久化功能...\n');
  
  try {
    // 1. 创建实例
    const resourceManager = new ResourceManager();
    const cognitionManager = new CognitionManager(resourceManager);
    
    // 2. 测试角色：sean
    const role = 'sean';
    logger.info(`📊 检查角色 ${role} 的持久化数据...`);
    
    // 检查文件路径
    const basePath = path.join(process.env.HOME, '.promptx/cognition', role);
    const longTermPath = path.join(basePath, 'longterm.db');
    const semanticPath = path.join(basePath, 'semantic/global-semantic.bin');
    
    // 检查文件是否存在
    logger.info('\n📁 文件存在性检查:');
    logger.info(`  长期记忆: ${await fs.pathExists(longTermPath) ? '✅ 存在' : '❌ 不存在'} - ${longTermPath}`);
    logger.info(`  语义网络: ${await fs.pathExists(semanticPath) ? '✅ 存在' : '❌ 不存在'} - ${semanticPath}`);
    
    // 检查文件大小
    if (await fs.pathExists(longTermPath)) {
      const stats = await fs.stat(longTermPath);
      logger.info(`  长期记忆大小: ${stats.size} bytes`);
    }
    
    let originalSize = 0;
    if (await fs.pathExists(semanticPath)) {
      const stats = await fs.stat(semanticPath);
      originalSize = stats.size;
      logger.info(`  语义网络大小: ${stats.size} bytes`);
      
      // 二进制文件内容由 NetworkSemantic 内部处理
      logger.info('\n🔍 二进制文件已存在，内容将通过 prime 方法验证');
    }
    
    // 3. 通过 CognitionManager 加载并验证
    logger.info('\n🔄 通过 CognitionManager 加载数据...');
    const cognition = await cognitionManager.getCognition(role);
    
    // 尝试 prime 来加载语义网络
    const mindmap = await cognitionManager.prime(role);
    logger.info('\n📊 当前语义网络:');
    console.log(mindmap);
    
    // 4. 测试新增记忆
    logger.info('\n➕ 添加新记忆测试...');
    const testContent = `测试时间戳: ${new Date().toISOString()}`;
    const testSchema = `mindmap
  测试记忆
    时间戳
      ${new Date().toISOString()}`;
    
    await cognitionManager.remember(role, testContent, testSchema, 0.8);
    logger.success('✅ 新记忆添加成功');
    
    // 5. 重新加载验证持久化
    logger.info('\n🔄 清理缓存并重新加载...');
    cognitionManager.clearCognition(role);
    
    const cognition2 = await cognitionManager.getCognition(role);
    const mindmap2 = await cognitionManager.prime(role);
    
    logger.info('📊 重新加载后的语义网络:');
    console.log(mindmap2);
    
    // 验证新记忆是否被持久化
    if (mindmap2.includes('测试记忆')) {
      logger.success('✅ 持久化验证成功！新记忆已保存并可以重新加载');
    } else {
      logger.error('❌ 持久化验证失败！新记忆未能保存');
      logger.info('调试信息：');
      logger.info('- mindmap2 长度:', mindmap2.length);
      logger.info('- 是否包含 "测试记忆":', mindmap2.includes('测试记忆'));
      
      // 再次检查文件大小是否变化
      if (await fs.pathExists(semanticPath)) {
        const newStats = await fs.stat(semanticPath);
        logger.info(`- 新的语义网络大小: ${newStats.size} bytes (原: ${originalSize} bytes)`);
      }
    }
    
    logger.success('\n🎉 持久化测试完成！');
    
  } catch (error) {
    logger.error('❌ 测试失败:', error);
    console.error(error.stack);
  }
}

// 运行测试
testPersistence();