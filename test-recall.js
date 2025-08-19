#!/usr/bin/env node

// 临时测试 LongTerm recall 功能

const { LongTerm } = require('./src/lib/core/cognition/memory/components/LongTerm.js');
const { Engram } = require('./src/lib/core/cognition/engram/Engram.js');

async function testRecall() {
  console.log('=== 测试 LongTerm Recall 功能 ===\n');
  
  // 创建内存版本的 LongTerm（不写文件）
  const longTerm = new LongTerm({ inMemoryOnly: true });
  
  // 测试数据
  const testCases = [
    {
      content: "工作关系很重要",
      schema: `mindmap
  root((认知系统))
    工作关系
      日常任务
      团队协作
    memory-system
      core-invariant
        data-consistency`,
      type: "ATOMIC"
    },
    {
      content: "Sean总是项目负责人",
      schema: `mindmap
  root((项目管理))
    Sean总
      技术决策
      代码审查`,
      type: "ATOMIC"
    }
  ];
  
  // 1. 存储记忆
  console.log('1. 存储记忆...');
  for (const testCase of testCases) {
    const engram = new Engram(testCase.content, testCase.schema, testCase.type);
    await longTerm.remember(engram);
    console.log(`   ✓ 存储: "${testCase.content}"`);
  }
  
  console.log('\n2. 测试 Recall...');
  
  // 测试各种查询
  const queries = [
    'memory-system',      // 完整节点名
    'memory',            // 部分匹配
    '工作关系',          // 中文完整节点
    '工作',              // 中文部分匹配
    'Sean总',            // 中英混合
    'sean',              // 英文小写
    '认知系统',          // root节点
    '日常任务',          // 子节点
    'core-invariant',    // 带连字符的节点
    '不存在的概念'       // 应该返回空
  ];
  
  for (const query of queries) {
    const results = await longTerm.recall(query);
    console.log(`\n   查询: "${query}"`);
    if (results.length > 0) {
      console.log(`   ✓ 找到 ${results.length} 条记忆:`);
      results.forEach(r => {
        console.log(`     - ${r.getContent()}`);
      });
    } else {
      console.log(`   ✗ 未找到匹配的记忆`);
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testRecall().catch(console.error);