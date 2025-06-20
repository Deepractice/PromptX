const PouchCLI = require('../../lib/core/pouch/PouchCLI');

// Mock fetch for DACP service calls
global.fetch = jest.fn();

describe('DACP Integration Tests', () => {
  let pouchCLI;

  beforeEach(async () => {
    pouchCLI = new PouchCLI();
    await pouchCLI.initialize();
    fetch.mockClear();
  });

  test('应该能够通过PouchCLI调用DACP命令', async () => {
    const mockDACPResponse = {
      request_id: 'req_123',
      success: true,
      data: {
        execution_result: {
          message_id: 'msg_456',
          status: 'sent',
          recipients: ['demo@example.com'],
          subject: '会议通知',
          body: '您好，\n\n给张三发个会议提醒邮件\n\n此邮件由DACP邮件服务自动生成。'
        },
        evaluation: {
          criteria_met: true,
          quality_score: 95
        },
        applied_guidelines: [
          'HTML格式提升阅读体验',
          '专业邮件签名'
        ],
        performance_metrics: {
          response_time: '150ms',
          delivery_rate: 100
        }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDACPResponse
    });

    const args = {
      service_id: 'dacp-email-service',
      action: 'send_email',
      parameters: {
        user_request: '给张三发个会议提醒邮件',
        context: { urgency: 'high' }
      }
    };

    const result = await pouchCLI.execute('dacp', args);

    // 验证DACP服务被正确调用
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/dacp', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }));

    // 验证请求体格式
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody).toEqual({
      service_id: 'dacp-email-service',
      action: 'send_email',
      parameters: {
        user_request: '给张三发个会议提醒邮件',
        context: { urgency: 'high' }
      },
      request_id: expect.stringMatching(/^req_\d+$/)
    });

    // 验证返回结果
    expect(result).toEqual(mockDACPResponse);
  });

  test('应该正确处理DACP服务不可用的情况', async () => {
    fetch.mockRejectedValueOnce(new Error('Connection refused'));

    const args = {
      service_id: 'dacp-email-service',
      action: 'send_email',
      parameters: {
        user_request: '测试邮件'
      }
    };

    await expect(pouchCLI.execute('dacp', args))
      .rejects.toThrow('DACP服务调用失败: Connection refused');
  });

  test('应该正确处理未知DACP服务的情况', async () => {
    const args = {
      service_id: 'unknown-service',
      action: 'some_action',
      parameters: {
        user_request: '测试请求'
      }
    };

    await expect(pouchCLI.execute('dacp', args))
      .rejects.toThrow('未找到DACP服务: unknown-service');
  });

  test('应该正确处理参数验证错误', async () => {
    const args = {
      service_id: 'dacp-email-service',
      // 缺少action参数
      parameters: {
        user_request: '测试邮件'
      }
    };

    await expect(pouchCLI.execute('dacp', args))
      .rejects.toThrow('缺少必需参数: action');
  });

  test('应该支持多个DACP服务路由', async () => {
    const mockResponse = { success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // 测试日程服务路由
    const args = {
      service_id: 'dacp-calendar-service',
      action: 'create_meeting',
      parameters: {
        user_request: '创建明天的会议'
      }
    };

    await pouchCLI.execute('dacp', args);

    expect(fetch).toHaveBeenCalledWith('http://localhost:3002/dacp', expect.any(Object));
  });
});