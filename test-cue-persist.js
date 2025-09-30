const CognitionSystem = require('./packages/core/src/cognition/CognitionSystem');
const Engram = require('./packages/core/src/cognition/Engram');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function testCuePersistence() {
  console.log('\n=== 测试 Cue 持久化和加载 ===\n');

  const tempDir = path.join(os.tmpdir(), 'promptx-test-' + Date.now());
  const networkFile = path.join(tempDir, 'network.json');

  // 确保目录存在
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`📁 临时目录: ${tempDir}\n`);

  // 第一阶段：创建并保存
  console.log('🔨 阶段1: 创建Network并保存');
  const system1 = new CognitionSystem({ dataPath: networkFile });

  const engram1 = new Engram({
    content: '学习编程需要掌握JavaScript',
    schema: ['学习', '编程', 'JavaScript'],
    strength: 0.7,
    type: 'ATOMIC'
  });
  await system1.remember(engram1);

  const engram2 = new Engram({
    content: '学习设计需要掌握UI原则',
    schema: ['学习', '设计', 'UI'],
    strength: 0.8,
    type: 'ATOMIC'
  });
  await system1.remember(engram2);

  console.log(`   创建了 ${system1.network.size()} 个Cue`);
  console.log(`   Cue列表: ${Array.from(system1.network.cues.keys()).join(', ')}`);

  const cueBeforeSave = system1.network.getCue('学习');
  console.log(`   "学习"的连接数: ${cueBeforeSave.connections.size}`);
  console.log(`   "学习"连接到: ${Array.from(cueBeforeSave.connections.keys()).join(', ')}`);

  // 保存
  await system1.network.persist(networkFile);
  console.log(`\n💾 已保存到: ${networkFile}`);

  // 读取JSON文件看看内容
  const jsonContent = JSON.parse(fs.readFileSync(networkFile, 'utf8'));
  console.log(`\n📄 JSON文件中的Cue数量: ${Object.keys(jsonContent.cues).length}`);
  console.log(`   JSON中的Cue: ${Object.keys(jsonContent.cues).join(', ')}`);

  // 检查"学习"节点
  const xuexiInJson = jsonContent.cues['学习'];
  if (xuexiInJson) {
    console.log(`   "学习"在JSON中的连接数: ${xuexiInJson.connections.length}`);
    console.log(`   "学习"在JSON中连接到: ${xuexiInJson.connections.map(c => c.target).join(', ')}`);
  }

  // 第二阶段：加载并检查
  console.log('\n\n🔨 阶段2: 加载Network并检查');
  const system2 = new CognitionSystem({ dataPath: networkFile });
  await system2.network.load(networkFile);

  console.log(`   加载了 ${system2.network.size()} 个Cue`);
  console.log(`   Cue列表: ${Array.from(system2.network.cues.keys()).join(', ')}`);

  const cueAfterLoad = system2.network.getCue('学习');
  if (cueAfterLoad) {
    console.log(`   "学习"的连接数: ${cueAfterLoad.connections.size}`);
    console.log(`   "学习"连接到: ${Array.from(cueAfterLoad.connections.keys()).join(', ')}`);
  } else {
    console.log(`   ❌ "学习" Cue未找到！`);
  }

  // 检查是否有重复
  const cueWords = Array.from(system2.network.cues.keys());
  const uniqueWords = new Set(cueWords);
  const hasDuplicates = cueWords.length !== uniqueWords.size;

  console.log('\n📊 检查结果:');
  console.log(`   Cue总数: ${cueWords.length}`);
  console.log(`   唯一Cue数: ${uniqueWords.size}`);
  console.log(`   是否有重复: ${hasDuplicates ? '❌ 是' : '✅ 否'}`);

  if (hasDuplicates) {
    console.log('\n⚠️  发现重复的Cue:');
    const wordCount = {};
    cueWords.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);
    Object.entries(wordCount).forEach(([word, count]) => {
      if (count > 1) {
        console.log(`   - "${word}": ${count}次`);
      }
    });
  }

  // 判断测试结果
  const isSuccess =
    system2.network.size() === 5 &&
    !hasDuplicates &&
    cueAfterLoad &&
    cueAfterLoad.connections.size === 2;

  console.log(`\n${isSuccess ? '✅' : '❌'} 持久化测试${isSuccess ? '通过' : '失败'}!`);

  // 清理
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`\n🧹 已清理临时文件`);

  return isSuccess;
}

testCuePersistence()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ 测试执行出错:', error);
    process.exit(1);
  });