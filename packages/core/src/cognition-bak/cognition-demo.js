// Cognition 系统演示脚本
// 测试 remember、recall、prime 三个核心接口

const { Cognition } = require('./index');
const { Engram } = require('./engram/Engram');

// 创建演示用的 Cognition 实例
const demoConfig = {
  longTermPath: './demo-cognition/longterm',
  semanticPath: './demo-cognition/semantic'
};

async function runDemo() {
  console.log('=== Cognition 系统演示 ===\n');
  
  // 创建认知实例
  const cognition = new Cognition(demoConfig);
  console.log('✅ 创建 Cognition 实例，配置：');
  console.log('   长期记忆路径:', demoConfig.longTermPath);
  console.log('   语义网络路径:', demoConfig.semanticPath);
  console.log();

  // 1. 测试 remember - 记忆功能
  console.log('📝 1. 测试 remember - 记忆功能');
  console.log('----------------------------');
  
  // 创建一些简单的记忆（用户只需要提供字符串内容）
  const contents = [
    'JavaScript 是一种编程语言',
    'React 是一个前端框架',
    'Node.js 让 JavaScript 可以运行在服务器端',
    '认知记忆系统基于心理学原理设计',
    '奥卡姆剃刀原则：如无必要，勿增实体',
    '短期记忆容量是 7±2',
    '长期记忆通过巩固形成',
    '语义网络存储概念之间的关系'
  ];

  // 记住这些内容（使用新的简化接口）
  contents.forEach((content, index) => {
    // 用户只需要传入内容字符串即可
    cognition.remember(content);
    console.log(`   ✓ 记忆 ${index + 1}: "${content.substring(0, 30)}..."`);
  });
  
  console.log(`\n   💾 总共记忆了 ${contents.length} 条信息`);
  console.log('   注意：前 7 条在短期记忆中，第 8 条会触发巩固');
  console.log();

  // 2. 测试 recall - 回忆功能
  console.log('🔍 2. 测试 recall - 回忆功能');
  console.log('---------------------------');
  
  // 测试不同的检索线索（都是简单的字符串）
  const testCues = ['JavaScript', 'React', '记忆', '原则'];
  
  for (const cue of testCues) {
    const results = await cognition.recall(cue);
    console.log(`\n   搜索 "${cue}":`);
    if (results.length > 0) {
      results.forEach((engram, index) => {
        console.log(`     ${index + 1}. ${engram.getContent()}`);
      });
    } else {
      console.log('     （没有找到相关记忆）');
    }
  }

  // 测试无线索回忆（获取所有记忆）
  console.log('\n   搜索所有记忆（无线索）:');
  const allMemories = await cognition.recall();
  console.log(`     找到 ${allMemories.length} 条记忆`);
  console.log();

  // 3. 测试 prime - 启动效应
  console.log('⚡ 3. 测试 prime - 启动效应');
  console.log('---------------------------');
  
  console.log('\n   prime 用于加载已保存的语义网络');
  console.log('   在实际使用中，语义网络会在巩固阶段自动构建');
  
  // 为了演示 prime，我们需要先创建并保存一个语义网络
  console.log('\n   演示保存语义网络...');
  
  // 注意：在实际使用中，语义网络会在巩固阶段自动构建
  // 但由于我们的演示没有带 schema 的 engram，所以语义网络是空的
  console.log('   注意：演示中的记忆没有 schema，所以语义网络为空');
  
  // 测试 prime - 获取当前语义网络的 Mermaid 表示
  console.log('\n   测试启动效应（prime）...');
  try {
    // prime 现在直接返回 Mermaid mindmap
    const mermaidMap = await cognition.prime();
    console.log('   ✓ 获取当前语义网络的 Mermaid 表示:');
    console.log('\n   ```mermaid');
    console.log(mermaidMap.split('\n').map(line => '   ' + line).join('\n'));
    console.log('   ```');
  } catch (error) {
    console.log('   ⚠️  获取失败:', error.message);
  }
  
  // 尝试加载指定的语义网络
  console.log('\n   尝试加载保存的语义网络...');
  try {
    const mermaidMap = await cognition.prime('saved-semantic');
    console.log('   ✓ 加载成功（如果文件存在）');
  } catch (error) {
    console.log('   ⚠️  加载失败:', error.message);
    console.log('   （这是正常的，因为还没有保存过这个语义网络）');
  }
  
  console.log('\n=== 演示完成 ===');
  console.log('\n总结：');
  console.log('- remember(engram): 记住一个 Engram（记忆痕迹）');
  console.log('- recall(string): 用字符串线索检索相关记忆');
  console.log('- prime(string?): 获取语义网络的 Mermaid mindmap（可选加载指定网络）');
  console.log('\n所有接口都使用简单的参数，prime 直接返回可视化结果！');
}

// 运行演示
runDemo().catch(console.error);