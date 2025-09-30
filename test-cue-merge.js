const CognitionSystem = require('./packages/core/src/cognition/CognitionSystem');
const Engram = require('./packages/core/src/cognition/Engram');

async function testCueMerge() {
  console.log('\n=== 测试 Cue 节点合并逻辑 ===\n');

  // 创建认知系统
  const system = new CognitionSystem();

  console.log('📝 第一次 remember: ["学习", "编程", "JavaScript"]');
  const engram1 = new Engram({
    content: '学习编程需要掌握JavaScript',
    schema: ['学习', '编程', 'JavaScript'],
    strength: 0.7,
    type: 'ATOMIC'
  });

  await system.remember(engram1);

  console.log(`\n✅ 第一次remember完成`);
  console.log(`   Network中Cue数量: ${system.network.size()}`);
  console.log(`   所有Cue: ${Array.from(system.network.cues.keys()).join(', ')}`);

  // 检查 "学习" Cue 的连接
  const cue1 = system.network.getCue('学习');
  console.log(`   "学习" Cue的连接数: ${cue1.connections.size}`);
  console.log(`   "学习" 连接到: ${Array.from(cue1.connections.keys()).join(', ')}`);

  console.log('\n📝 第二次 remember: ["学习", "设计", "UI"]');
  const engram2 = new Engram({
    content: '学习设计需要掌握UI原则',
    schema: ['学习', '设计', 'UI'],
    strength: 0.8,
    type: 'ATOMIC'
  });

  await system.remember(engram2);

  console.log(`\n✅ 第二次remember完成`);
  console.log(`   Network中Cue数量: ${system.network.size()}`);
  console.log(`   所有Cue: ${Array.from(system.network.cues.keys()).join(', ')}`);

  // 再次检查 "学习" Cue
  const cue2 = system.network.getCue('学习');
  console.log(`\n🔍 检查 "学习" Cue:`);
  console.log(`   Cue对象是否相同: ${cue1 === cue2}`);
  console.log(`   连接数: ${cue2.connections.size}`);
  console.log(`   连接到: ${Array.from(cue2.connections.keys()).join(', ')}`);

  // 检查连接详情
  console.log(`\n🔗 "学习" 的所有连接详情:`);
  for (const [target, weight] of cue2.connections) {
    console.log(`   "学习" -> "${target}": weight=${weight}`);
  }

  // 期望结果
  console.log('\n📊 期望结果:');
  console.log('   ✓ Network中应该有5个Cue: 学习, 编程, JavaScript, 设计, UI');
  console.log('   ✓ "学习" Cue应该有2个连接: -> 编程, -> 设计');
  console.log('   ✓ 两次获取的"学习"Cue应该是同一个对象');

  console.log('\n📊 实际结果:');
  const expectedCues = ['学习', '编程', 'JavaScript', '设计', 'UI'];
  const actualCues = Array.from(system.network.cues.keys());
  console.log(`   Network中Cue数量: ${actualCues.length} (期望: ${expectedCues.length})`);
  console.log(`   "学习"的连接数: ${cue2.connections.size} (期望: 2)`);
  console.log(`   Cue对象是否复用: ${cue1 === cue2 ? '✅ 是' : '❌ 否'}`);

  // 判断测试结果
  const isSuccess =
    actualCues.length === expectedCues.length &&
    cue2.connections.size === 2 &&
    cue1 === cue2 &&
    cue2.connections.has('编程') &&
    cue2.connections.has('设计');

  console.log(`\n${isSuccess ? '✅' : '❌'} 测试${isSuccess ? '通过' : '失败'}!`);

  if (!isSuccess) {
    console.log('\n⚠️  可能的问题:');
    if (actualCues.length !== expectedCues.length) {
      console.log(`   - Cue数量不对: ${actualCues.length} vs ${expectedCues.length}`);
    }
    if (cue2.connections.size !== 2) {
      console.log(`   - "学习"的连接数不对: ${cue2.connections.size} vs 2`);
    }
    if (cue1 !== cue2) {
      console.log(`   - "学习"Cue没有复用同一个对象`);
    }
  }

  return isSuccess;
}

// 运行测试
testCueMerge()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ 测试执行出错:', error);
    process.exit(1);
  });