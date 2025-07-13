// 测试Mermaid Mindmap解析器的简单脚本

const { mermaidMindmap } = require('../lib/core/cognition/memory/mind/mindmap');

console.log('开始测试Mermaid Mindmap解析器...\n');

// 测试1: 解析简单mindmap
console.log('测试1: 解析简单mindmap');
try {
  const mindmapText = `mindmap
  ((Root))
    Child1
    Child2`;

  const schema = mermaidMindmap.parse(mindmapText);
  console.log('✅ 解析成功');
  console.log('Schema名称:', schema.name);
  console.log('Cue数量:', schema.getCues().length);
  console.log('Cue列表:', schema.getCues().map(c => c.word));
} catch (error) {
  console.log('❌ 解析失败:', error.message);
}

// 测试2: 解析嵌套mindmap
console.log('\n测试2: 解析嵌套mindmap');
try {
  const mindmapText = `mindmap
  ((记忆系统))
    测试功能
      remember功能
        正常工作验证
      recall功能
    架构设计
      持久化方案
        Mermaid格式`;

  const schema = mermaidMindmap.parse(mindmapText);
  console.log('✅ 解析成功');
  console.log('Schema名称:', schema.name);
  console.log('Cue数量:', schema.getCues().length);
  console.log('Cue列表:', schema.getCues().map(c => c.word));
} catch (error) {
  console.log('❌ 解析失败:', error.message);
}

// 测试3: 序列化Schema
console.log('\n测试3: 序列化Schema');
try {
  const { GraphSchema } = require('../lib/core/cognition/memory/mind/components/GraphSchema');
  
  const schema = new GraphSchema('测试系统');
  const { WordCue } = require('../lib/core/cognition/memory/mind/components/WordCue');
  
  const func = new WordCue('功能模块');
  const mem = new WordCue('记忆系统');
  const net = new WordCue('网络架构');
  
  schema.addCue(func);
  schema.addCue(mem);
  schema.addCue(net);
  
  func.connect(mem);
  func.connect(net);
  
  const result = mermaidMindmap.serialize(schema);
  console.log('✅ 序列化成功');
  console.log('生成的Mermaid文本:');
  console.log(result);
} catch (error) {
  console.log('❌ 序列化失败:', error.message);
}

// 测试4: 合并mindmap
console.log('\n测试4: 合并mindmap');
try {
  const existing = `mindmap
  ((Root))
    Child1
    Child2`;

  const newText = `mindmap
  ((Root))
    Child3
    Child4`;

  const result = mermaidMindmap.merge(existing, newText);
  console.log('✅ 合并成功');
  console.log('合并后的文本:');
  console.log(result);
} catch (error) {
  console.log('❌ 合并失败:', error.message);
}

console.log('\n测试完成！');