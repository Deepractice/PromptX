#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const { glob } = require('glob');

/**
 * 生成资源注册表
 * 扫描 @promptx/resource 包中的所有资源文件并生成注册表
 */
async function generateRegistry() {
  try {
    console.log('🏗️ 开始生成资源注册表...');
    
    // 获取 resource 包根目录
    const packageRoot = path.join(__dirname, '..');
    console.log(`📁 资源包根目录: ${packageRoot}`);
    
    // 定义要扫描的资源目录
    const resourceDirs = ['role', 'protocol', 'tool'];
    const registry = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      resources: {}
    };
    
    // 扫描每个资源目录
    for (const dir of resourceDirs) {
      const dirPath = path.join(packageRoot, dir);
      
      // 检查目录是否存在
      try {
        await fs.access(dirPath);
      } catch (error) {
        console.log(`⚠️ 跳过不存在的目录: ${dir}`);
        continue;
      }
      
      console.log(`📂 扫描目录: ${dir}`);
      
      // 查找所有 .md 和 .json 文件
      const pattern = path.join(dirPath, '**/*.{md,json}');
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/.*']
      });
      
      // 记录每个文件
      registry.resources[dir] = [];
      
      for (const filePath of files) {
        const relativePath = path.relative(packageRoot, filePath);
        const fileName = path.basename(filePath);
        const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));
        
        // 读取文件获取基本信息
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 尝试提取标题或描述
        let title = fileNameWithoutExt;
        let description = '';
        
        if (filePath.endsWith('.md')) {
          // 从 Markdown 提取第一个标题
          const titleMatch = content.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            title = titleMatch[1];
          }
          // 提取描述（第一个非标题段落）
          const descMatch = content.match(/^#[^\n]+\n\n([^\n#]+)/);
          if (descMatch) {
            description = descMatch[1].trim();
          }
        } else if (filePath.endsWith('.json')) {
          try {
            const jsonData = JSON.parse(content);
            if (jsonData.title) title = jsonData.title;
            if (jsonData.description) description = jsonData.description;
          } catch (e) {
            // JSON 解析失败，使用默认值
          }
        }
        
        registry.resources[dir].push({
          id: fileNameWithoutExt,
          path: relativePath,
          title,
          description,
          type: path.extname(filePath).slice(1),
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
      
      console.log(`   ✓ 找到 ${files.length} 个资源文件`);
    }
    
    // 保存注册表
    const registryPath = path.join(packageRoot, 'registry.json');
    await fs.writeFile(
      registryPath,
      JSON.stringify(registry, null, 2),
      'utf-8'
    );
    
    console.log('✅ 资源注册表生成完成！');
    console.log(`📋 保存位置: ${registryPath}`);
    
    // 显示统计信息
    let totalCount = 0;
    console.log('\n📊 资源统计:');
    for (const [category, resources] of Object.entries(registry.resources)) {
      console.log(`   ${category}: ${resources.length} 个`);
      totalCount += resources.length;
    }
    console.log(`   总计: ${totalCount} 个资源\n`);
    
  } catch (error) {
    console.error('❌ 生成注册表失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateRegistry();
}

module.exports = generateRegistry;