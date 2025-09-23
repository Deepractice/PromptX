// 测试 JSON 序列化错误
const tools = [
  {
    name: 'test',
    description: 'test tool',
    inputSchema: {
      type: 'object',
      properties: {
        test: { type: 'string' }
      }
    },
    handler: () => {} // 函数不能被序列化
  }
];

// 模拟 BaseMCPServer 中的代码
const result = {
  tools: tools.map(({ handler, ...tool }) => tool)
};

console.log('序列化结果:');
console.log(JSON.stringify(result, null, 2));