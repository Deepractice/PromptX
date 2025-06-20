#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 测试计算器功能
async function testCalculator() {
  console.log('🧪 测试DACP计算器服务...\n');
  
  const promptxPath = path.join(__dirname, '..', 'src', 'bin', 'promptx.js');
  
  // 测试案例
  const testCases = [
    {
      name: '简单加法',
      command: ['node', promptxPath, 'dacp', 'dacp-promptx-service', 'calculate', '{"user_request": "2加3等于多少"}']
    },
    {
      name: '复杂计算',
      command: ['node', promptxPath, 'dacp', 'dacp-promptx-service', 'calculate', '{"user_request": "(10 + 5) * 2 - 8 / 4"}']
    },
    {
      name: '中文运算符',
      command: ['node', promptxPath, 'dacp', 'dacp-promptx-service', 'calculate', '{"user_request": "100减去25"}']
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`命令: ${testCase.command.join(' ')}`);
    
    await new Promise((resolve) => {
      const child = spawn(testCase.command[0], testCase.command.slice(1), {
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        console.log(`\n✅ 测试完成 (退出码: ${code})\n`);
        console.log('-'.repeat(60) + '\n');
        resolve();
      });
    });
  }
}

// 运行测试
testCalculator().then(() => {
  console.log('🎉 所有测试完成！');
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});