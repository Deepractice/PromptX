#!/usr/bin/env node

const { peggyMindmap } = require('./src/lib/core/cognition/memory/mind/mindmap/PeggyMindmap.js');

const schema1 = `mindmap
  测试节点
    子节点一
      孙节点A
    子节点二
      孙节点B`;

console.log('解析 schema:');
console.log(schema1);
console.log('\n解析结果:');

try {
  const ast = peggyMindmap.parse(schema1);
  console.log(JSON.stringify(ast, null, 2));
} catch(e) {
  console.error('解析失败:', e.message);
}