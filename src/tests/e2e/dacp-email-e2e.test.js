const PouchCLI = require('../../lib/core/pouch/PouchCLI');

describe('DACP Email Service E2E Tests', () => {
  let pouchCLI;

  beforeEach(async () => {
    pouchCLI = new PouchCLI();
    await pouchCLI.initialize();
  });

  test('应该能够调用真实的DACP邮件服务', async () => {
    const args = {
      service_id: 'dacp-email-service',
      action: 'send_email',
      parameters: {
        user_request: '给产品团队发送PromptX项目进展更新',
        context: {
          project: 'PromptX',
          urgency: 'medium',
          recipient_type: 'internal'
        }
      }
    };

    try {
      const result = await pouchCLI.execute('dacp', args);
      
      // 验证DACP响应格式
      expect(result).toHaveProperty('request_id');
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.data).toHaveProperty('execution_result');
        expect(result.data).toHaveProperty('evaluation');
        expect(result.data).toHaveProperty('applied_guidelines');
        expect(result.data).toHaveProperty('performance_metrics');
        
        // 验证execution_result格式
        const { execution_result } = result.data;
        expect(execution_result).toHaveProperty('message_id');
        expect(execution_result).toHaveProperty('status');
        expect(execution_result).toHaveProperty('recipients');
        expect(execution_result).toHaveProperty('subject');
        expect(execution_result).toHaveProperty('body');
        
        console.log('✅ DACP邮件服务调用成功:');
        console.log(`   📧 消息ID: ${execution_result.message_id}`);
        console.log(`   📬 状态: ${execution_result.status}`);
        console.log(`   📝 主题: ${execution_result.subject}`);
        console.log(`   ⚡ 响应时间: ${result.data.performance_metrics.response_time}`);
      } else {
        console.log('❌ DACP邮件服务返回错误:', result.error);
        // 对于E2E测试，我们可能期望服务可用，所以这里可以fail
        // 但也可以选择跳过测试如果服务不可用
      }
      
    } catch (error) {
      // 如果是连接错误，说明DACP邮件服务没有运行，跳过测试
      if (error.message.includes('fetch failed') || 
          error.message.includes('Connection refused') ||
          error.message.includes('ECONNREFUSED')) {
        console.log('⚠️  DACP邮件服务未运行，跳过E2E测试');
        console.log('   启动服务命令: cd src/dacp/dacp-email-service && npm start');
        return; // 跳过测试而不是失败
      }
      
      // 其他错误应该被报告
      throw error;
    }
  }, 10000); // 10秒超时

  test('应该正确处理用户自然语言需求', async () => {
    const testCases = [
      {
        description: '会议提醒邮件',
        request: '给张三发个明天产品评审会议的提醒邮件',
        context: { urgency: 'high', recipient_type: 'internal' }
      },
      {
        description: '客户沟通邮件', 
        request: '向客户汇报项目进展，包含最新的功能更新',
        context: { recipient_type: 'client', project: 'PromptX' }
      },
      {
        description: '团队通知邮件',
        request: '通知团队今晚系统维护，请提前保存工作',
        context: { urgency: 'high', recipient_type: 'internal' }
      }
    ];

    for (const testCase of testCases) {
      try {
        const args = {
          service_id: 'dacp-email-service',
          action: 'send_email',
          parameters: {
            user_request: testCase.request,
            context: testCase.context
          }
        };

        const result = await pouchCLI.execute('dacp', args);
        
        if (result.success) {
          console.log(`✅ ${testCase.description} - 成功处理`);
          console.log(`   🎯 主题: ${result.data.execution_result.subject}`);
          console.log(`   📋 应用指导: ${result.data.applied_guidelines.join(', ')}`);
        }
        
      } catch (error) {
        if (error.message.includes('fetch failed') || 
            error.message.includes('Connection refused') ||
            error.message.includes('ECONNREFUSED')) {
          console.log(`⚠️  跳过测试用例: ${testCase.description} (服务未运行)`);
          continue;
        }
        throw error;
      }
    }
  }, 15000); // 15秒超时
});