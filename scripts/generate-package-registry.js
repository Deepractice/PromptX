#!/usr/bin/env node

const path = require('path');
const PackageDiscovery = require('../src/lib/core/resource/discovery/PackageDiscovery');

async function generatePackageRegistry() {
  try {
    console.log('🏗️ 开始生成Package级别注册表...');
    
    // 获取项目根目录
    const projectRoot = process.cwd();
    console.log(`📁 项目根目录: ${projectRoot}`);
    
    // 创建PackageDiscovery实例并设置注册表路径
    const discovery = new PackageDiscovery();
    discovery.registryPath = path.join(projectRoot, 'src', 'package.registry.json');
    
    console.log(`📋 注册表路径: ${discovery.registryPath}`);
    
    // 生成注册表
    const registryData = await discovery.generateRegistry(projectRoot);
    
    console.log('✅ Package注册表生成完成！');
    console.log(`📊 总资源数: ${registryData.size}`);
    console.log(`📂 保存位置: ${path.relative(projectRoot, discovery.registryPath)}`);
    
    // 显示统计信息
    const stats = registryData.getStats();
    console.log(`📋 资源分类:`);
    Object.entries(stats.byProtocol).forEach(([protocol, count]) => {
      console.log(`   ${protocol}: ${count}个`);
    });
    
  } catch (error) {
    console.error('❌ 生成Package注册表失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generatePackageRegistry();
}

module.exports = generatePackageRegistry; 