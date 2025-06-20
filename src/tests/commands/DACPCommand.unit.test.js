const DACPCommand = require('../../lib/core/pouch/commands/DACPCommand');

// Mock fetch
global.fetch = jest.fn();

describe('DACPCommand', () => {
  let dacpCommand;

  beforeEach(() => {
    dacpCommand = new DACPCommand();
    fetch.mockClear();
  });

  describe('协议参数解析', () => {
    test('应该正确解析必需参数', () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '给张三发个邮件',
          context: { urgency: 'high' }
        }
      };

      expect(() => dacpCommand.validateArgs(args)).not.toThrow();
    });

    test('应该拒绝缺少service_id的请求', () => {
      const args = {
        action: 'send_email',
        parameters: {
          user_request: '给张三发个邮件'
        }
      };

      expect(() => dacpCommand.validateArgs(args))
        .toThrow('缺少必需参数: service_id');
    });

    test('应该拒绝缺少action的请求', () => {
      const args = {
        service_id: 'dacp-email-service',
        parameters: {
          user_request: '给张三发个邮件'
        }
      };

      expect(() => dacpCommand.validateArgs(args))
        .toThrow('缺少必需参数: action');
    });

    test('应该拒绝缺少parameters的请求', () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email'
      };

      expect(() => dacpCommand.validateArgs(args))
        .toThrow('缺少必需参数: parameters');
    });

    test('应该拒绝缺少user_request的请求', () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          context: { urgency: 'high' }
        }
      };

      expect(() => dacpCommand.validateArgs(args))
        .toThrow('缺少必需参数: parameters.user_request');
    });

    test('应该允许可选的context参数', () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '给张三发个邮件'
          // context 是可选的
        }
      };

      expect(() => dacpCommand.validateArgs(args)).not.toThrow();
    });
  });

  describe('服务路由', () => {
    test('应该正确路由到已知服务', () => {
      expect(dacpCommand.getServiceEndpoint('dacp-email-service'))
        .toBe('http://localhost:3001/dacp');
    });

    test('应该返回null对于未知服务', () => {
      expect(dacpCommand.getServiceEndpoint('unknown-service'))
        .toBeNull();
    });

    test('应该支持多个服务路由', () => {
      expect(dacpCommand.getServiceEndpoint('dacp-calendar-service'))
        .toBe('http://localhost:3002/dacp');
      expect(dacpCommand.getServiceEndpoint('dacp-document-service'))
        .toBe('http://localhost:3003/dacp');
    });
  });

  describe('DACP协议转发', () => {
    test('应该构造正确的DACP请求格式', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '给张三发个会议提醒邮件',
          context: { urgency: 'high' }
        }
      };

      const mockResponse = {
        request_id: 'req_123',
        success: true,
        data: { execution_result: { status: 'sent' } }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await dacpCommand.execute(args);

      // 验证fetch调用参数
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/dacp', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));

      // 单独验证body格式
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

      expect(result).toEqual(mockResponse);
    });

    test('应该自动生成request_id', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '测试邮件'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await dacpCommand.execute(args);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.request_id).toMatch(/^req_\d+$/);
    });

    test('应该处理网络错误', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '测试邮件'
        }
      };

      fetch.mockRejectedValueOnce(new Error('网络连接失败'));

      await expect(dacpCommand.execute(args))
        .rejects.toThrow('DACP服务调用失败: 网络连接失败');
    });

    test('应该处理未知服务错误', async () => {
      const args = {
        service_id: 'unknown-service',
        action: 'some_action',
        parameters: {
          user_request: '测试请求'
        }
      };

      await expect(dacpCommand.execute(args))
        .rejects.toThrow('未找到DACP服务: unknown-service');
    });

    test('应该处理HTTP错误响应', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '测试邮件'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: { code: 'DACP_SERVICE_ERROR', message: '服务内部错误' }
        })
      });

      const result = await dacpCommand.execute(args);
      
      expect(result).toEqual({
        success: false,
        error: { code: 'DACP_SERVICE_ERROR', message: '服务内部错误' }
      });
    });
  });

  describe('错误处理', () => {
    test('应该返回标准错误格式', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '测试邮件'
        }
      };

      fetch.mockRejectedValueOnce(new Error('Connection refused'));

      try {
        await dacpCommand.execute(args);
      } catch (error) {
        expect(error.message).toBe('DACP服务调用失败: Connection refused');
      }
    });

    test('应该处理JSON解析错误', async () => {
      const args = {
        service_id: 'dacp-email-service',
        action: 'send_email',
        parameters: {
          user_request: '测试邮件'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(dacpCommand.execute(args))
        .rejects.toThrow('DACP响应解析失败: Invalid JSON');
    });
  });
});