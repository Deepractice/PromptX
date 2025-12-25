/**
 * E2E Test: Role Composition with @!role:// References
 *
 * 这个测试使用真实的 ResourceManager 来验证角色组合功能
 */

const path = require('path');
const fs = require('fs');

// 直接使用源码（绕过 @promptx/logger 依赖问题）
const SemanticRenderer = require('../src/dpml/SemanticRenderer');
const DPMLContentParser = require('../src/dpml/DPMLContentParser');

// 用户资源目录
const USER_RESOURCE_DIR = path.join(process.env.HOME, '.promptx/resource/role');

// 简单的 Mock ResourceManager - 直接读取文件
class SimpleResourceManager {
  constructor(userResourceDir) {
    this.userResourceDir = userResourceDir;
    this.cache = new Map();
  }

  async resolve(resourceRef) {
    console.log(`[SimpleResourceManager] Resolving: ${resourceRef}`);

    try {
      // 解析协议和路径
      const match = resourceRef.match(/@[!?]?([a-zA-Z]+):\/\/(.+)/);
      if (!match) {
        return { success: false, error: { message: `Invalid reference: ${resourceRef}` } };
      }

      const [, protocol, resourceId] = match;

      // 根据协议类型查找文件
      let filePath;
      let content;

      switch (protocol) {
        case 'role':
          filePath = path.join(this.userResourceDir, resourceId, `${resourceId}.role.md`);
          break;
        case 'thought':
          // 搜索所有角色目录下的 thought 文件
          filePath = this.findResourceFile(resourceId, 'thought');
          break;
        case 'execution':
          filePath = this.findResourceFile(resourceId, 'execution');
          break;
        case 'knowledge':
          filePath = this.findResourceFile(resourceId, 'knowledge');
          break;
        default:
          return { success: false, error: { message: `Unknown protocol: ${protocol}` } };
      }

      if (!filePath || !fs.existsSync(filePath)) {
        console.log(`[SimpleResourceManager] File not found: ${filePath || resourceId}`);
        // 返回占位符而不是失败
        return {
          success: true,
          content: `<${protocol}>\n[${resourceId} - 资源未找到，使用占位符]\n</${protocol}>`
        };
      }

      content = fs.readFileSync(filePath, 'utf-8');
      console.log(`[SimpleResourceManager] Loaded: ${filePath} (${content.length} bytes)`);

      return { success: true, content };
    } catch (error) {
      console.error(`[SimpleResourceManager] Error:`, error.message);
      return { success: false, error };
    }
  }

  findResourceFile(resourceId, type) {
    // 遍历所有角色目录查找资源
    const roleDirs = fs.readdirSync(this.userResourceDir).filter(f => {
      const fullPath = path.join(this.userResourceDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
    });

    for (const roleDir of roleDirs) {
      const typePath = path.join(this.userResourceDir, roleDir, type);
      if (fs.existsSync(typePath)) {
        const files = fs.readdirSync(typePath);
        const targetFile = files.find(f => f.startsWith(resourceId));
        if (targetFile) {
          return path.join(typePath, targetFile);
        }
      }
    }

    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('E2E Test: Role Composition with @!role:// References');
  console.log('='.repeat(60));
  console.log();

  // 1. 初始化
  const renderer = new SemanticRenderer({ renderMode: 'semantic' });
  const parser = new DPMLContentParser();
  const resourceManager = new SimpleResourceManager(USER_RESOURCE_DIR);

  // 2. 读取组合角色文件
  const compositeRolePath = path.join(USER_RESOURCE_DIR, 'acting-roundtable-v2/acting-roundtable-v2.role.md');

  if (!fs.existsSync(compositeRolePath)) {
    console.error(`❌ 组合角色文件不存在: ${compositeRolePath}`);
    console.log('请先创建 acting-roundtable-v2 角色');
    process.exit(1);
  }

  const compositeContent = fs.readFileSync(compositeRolePath, 'utf-8');
  console.log('✅ 读取组合角色文件成功');
  console.log();

  // 3. 解析角色文档
  const roleSemantics = parser.parseRoleDocument(compositeContent);
  console.log('✅ 解析角色文档成功');
  console.log('   - personality:', roleSemantics.personality ? '有' : '无');
  console.log('   - principle:', roleSemantics.principle ? '有' : '无');
  console.log('   - knowledge:', roleSemantics.knowledge ? '有' : '无');
  console.log();

  // 4. 检查 personality 中的引用
  if (roleSemantics.personality) {
    const refs = roleSemantics.personality.references;
    console.log(`📋 发现 ${refs.length} 个引用:`);
    refs.forEach(ref => {
      console.log(`   - ${ref.fullMatch} (protocol: ${ref.protocol}, required: ${ref.isRequired})`);
    });
    console.log();
  }

  // 5. 渲染 personality 内容
  console.log('🔄 开始渲染 personality 内容...');
  console.log();

  try {
    const renderedContent = await renderer.renderSemanticContent(
      roleSemantics.personality,
      resourceManager
    );

    console.log('='.repeat(60));
    console.log('渲染结果预览 (前 3000 字符):');
    console.log('='.repeat(60));
    console.log(renderedContent.substring(0, 3000));
    if (renderedContent.length > 3000) {
      console.log(`\n... (还有 ${renderedContent.length - 3000} 字符)`);
    }
    console.log();
    console.log('='.repeat(60));

    // 6. 验证结果
    console.log('验证结果:');

    const checks = [
      { name: '包含 🎭 组合角色：liutianchi', pass: renderedContent.includes('🎭 组合角色：liutianchi') },
      { name: '包含 🎭 组合角色：venus', pass: renderedContent.includes('🎭 组合角色：venus') },
      { name: '包含 🎭 组合角色：director', pass: renderedContent.includes('🎭 组合角色：director') },
      { name: '包含刘天池的内容', pass: renderedContent.includes('刘天池') },
      { name: '包含维纳斯的内容', pass: renderedContent.includes('维纳斯') || renderedContent.includes('Venus') },
      { name: '包含导演的内容', pass: renderedContent.includes('电影导演') || renderedContent.includes('视觉叙事') },
      { name: '不包含原始引用标记', pass: !renderedContent.includes('@!role://') },
    ];

    let allPass = true;
    checks.forEach(check => {
      const status = check.pass ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    console.log();
    if (allPass) {
      console.log('🎉 所有验证通过！角色组合功能正常工作！');
    } else {
      console.log('⚠️  部分验证失败，需要检查');
    }

  } catch (error) {
    console.error('❌ 渲染失败:', error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
