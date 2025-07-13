#!/usr/bin/env node

const { CognitionManager } = require('./src/lib/core/cognition/CognitionManager');
const { ResourceManager } = require('./src/lib/core/resource');
const logger = require('./src/lib/utils/logger');
const fs = require('fs-extra');
const path = require('path');

async function testNewPath() {
  logger.info('🧪 测试新的文件路径结构...\n');
  
  try {
    // 1. 创建实例
    const resourceManager = new ResourceManager();
    const cognitionManager = new CognitionManager(resourceManager);
    
    // 2. 使用新角色测试
    const role = 'test-new-path';
    logger.info(`📊 创建新角色 ${role} 测试新路径...`);
    
    // 添加记忆
    const content = "新路径测试：semantic.bin 直接在角色目录下";
    const schema = `mindmap
  新路径测试
    文件结构
      角色目录
        longterm.db
        semantic.bin`;
    
    await cognitionManager.remember(role, content, schema, 0.9);
    logger.success('✅ 记忆添加成功');
    
    // 检查文件路径
    const basePath = path.join(process.env.HOME, '.promptx/cognition', role);
    const longTermPath = path.join(basePath, 'longterm.db');
    const semanticPath = path.join(basePath, 'semantic.bin');
    const oldSemanticDir = path.join(basePath, 'semantic');
    
    logger.info('\n📁 新文件结构检查:');
    logger.info(`  基础路径: ${basePath}`);
    logger.info(`  长期记忆: ${await fs.pathExists(longTermPath) ? '✅' : '❌'} ${longTermPath}`);
    logger.info(`  语义网络: ${await fs.pathExists(semanticPath) ? '✅' : '❌'} ${semanticPath}`);
    logger.info(`  旧semantic目录: ${await fs.pathExists(oldSemanticDir) ? '❌ 仍然存在' : '✅ 不存在'}`);
    
    // 列出目录内容
    logger.info('\n📋 目录内容:');
    const files = await fs.readdir(basePath);
    files.forEach(file => {
      logger.info(`  - ${file}`);
    });
    
    // 验证持久化
    logger.info('\n🔄 清理缓存并重新加载...');
    cognitionManager.clearCognition(role);
    
    const mindmap = await cognitionManager.prime(role);
    logger.info('\n📊 重新加载的语义网络:');
    console.log(mindmap);
    
    if (mindmap.includes('新路径测试')) {
      logger.success('✅ 新路径结构工作正常！');
    } else {
      logger.error('❌ 新路径结构有问题');
    }
    
    logger.success('\n🎉 测试完成！');
    
  } catch (error) {
    logger.error('❌ 测试失败:', error);
    console.error(error.stack);
  }
}

// 运行测试
testNewPath();