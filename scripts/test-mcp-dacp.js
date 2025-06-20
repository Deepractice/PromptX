#!/usr/bin/env node

/**
 * 测试 MCP → PromptX → DACP 完整链路
 */

const { cli } = require('../src/lib/core/pouch');

async function testDACPIntegration() {
  console.log('🧪 测试 MCP → PromptX → DACP 集成\n');

  const tests = [
    {
      name: '计算器测试',
      args: {
        service_id: 'dacp-promptx-service',
        action: 'calculate',
        parameters: {
          user_request: '(100 + 200) * 3'
        }
      }
    },
    {
      name: '邮件测试',
      args: {
        service_id: 'dacp-promptx-service',
        action: 'send_email',
        parameters: {
          user_request: '给 boss@company.com 发个项目进展汇报邮件',
          context: {
            urgency: 'normal',
            recipient_type: 'superior'
          }
        }
      }
    },
    {
      name: '日历测试',
      args: {
        service_id: 'dacp-promptx-service',
        action: 'schedule_meeting',
        parameters: {
          user_request: '下周一安排团队周会',
          context: {
            location: '会议室A'
          }
        }
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n📍 ${test.name}`);
    console.log('请求:', JSON.stringify(test.args, null, 2));
    
    try {
      // 调用 DACP 命令
      const result = await cli.execute('dacp', [test.args], true);
      
      if (result.success) {
        console.log('✅ 成功!');
        console.log('结果:', JSON.stringify(result.data.execution_result, null, 2));
      } else {
        console.log('❌ 失败:', result.error);
      }
    } catch (error) {
      console.log('❌ 错误:', error.message);
    }
  }
}

// 运行测试
testDACPIntegration().then(() => {
  console.log('\n✅ 所有测试完成！');
  process.exit(0);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});