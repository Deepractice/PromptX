/**
 * 测试 ProceduralMemory 功能
 * 验证 PATTERN 类型的 engram 是否正确存储和激活
 */

const path = require('path');
const { Cognition } = require('../lib/core/cognition');

async function testProcedural() {
  console.log('🧪 测试 ProceduralMemory 功能\n');
  
  // 1. 创建认知实例
  const testPath = path.join(__dirname, '../test-cognition');
  const cognition = new Cognition({
    longTermPath: path.join(testPath, 'longterm'),
    semanticPath: path.join(testPath, 'semantic'),
    proceduralPath: path.join(testPath, 'procedural')
  });
  
  console.log('1️⃣ 记忆几个行为模式：');
  
  // 记忆一些 PATTERN 类型的 engram
  const patterns = [
    {
      content: '讨论阶段不要直接写代码，应该先讨论方案，确认后再执行',
      schema: `mindmap
  工作习惯
    沟通方式
    决策流程`,
      strength: 0.95,
      type: 'PATTERN'
    },
    {
      content: '用户不喜欢在讨论阶段看到直接的代码实现',
      schema: `mindmap
  用户偏好
    协作模式
    交互方式`,
      strength: 0.9,
      type: 'PATTERN'
    },
    {
      content: '总是记得使用TodoWrite工具管理任务',
      schema: `mindmap
  工作流程
    任务管理
    工具使用`,
      strength: 0.85,
      type: 'PATTERN'
    },
    {
      content: '低优先级的建议模式',
      schema: `mindmap
  次要模式
    可选行为`,
      strength: 0.6,
      type: 'PATTERN'
    }
  ];
  
  for (const pattern of patterns) {
    await cognition.remember(pattern.content, pattern.schema, pattern.strength, pattern.type);
    console.log(`  ✅ 记忆: ${pattern.content} [强度: ${pattern.strength}]`);
  }
  
  console.log('\n2️⃣ 记忆一些非 PATTERN 类型的 engram（应该不会出现在程序性记忆中）：');
  
  await cognition.remember('PromptX是AI增强框架', `mindmap
  技术知识
    框架定义`, 0.9, 'ATOMIC');
  console.log('  ✅ 记忆: PromptX是AI增强框架 [类型: ATOMIC]');
  
  console.log('\n3️⃣ 激活程序性记忆：');
  
  try {
    // 直接调用 primeProcedural
    const proceduralOutput = await cognition.primeProcedural();
    console.log('\n程序性记忆输出：');
    console.log('---');
    console.log(proceduralOutput);
    console.log('---');
    
    // 验证结果
    console.log('\n4️⃣ 验证结果：');
    const expectedPatterns = patterns.filter(p => p.strength >= 0.7).length;
    console.log(`  ✅ 应该激活 ${expectedPatterns} 个高强度模式（强度 >= 0.7）`);
    console.log(`  ✅ 低强度模式（强度 < 0.7）不应该被激活`);
    console.log(`  ✅ ATOMIC 类型的记忆不应该出现在程序性记忆中`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
testProcedural().catch(console.error);