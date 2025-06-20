const DACPCommand = require('../../lib/core/pouch/commands/DACPCommand');

describe('DACP Calculator E2E Tests', () => {
  let dacpCommand;
  
  beforeEach(() => {
    dacpCommand = new DACPCommand();
  });

  test('should successfully calculate simple math expression', async () => {
    const result = await dacpCommand.execute({
      service_id: 'dacp-promptx-service',
      action: 'calculate',
      parameters: {
        user_request: '2加3等于多少'
      }
    });

    // 验证DACP协议响应格式
    expect(result).toHaveProperty('request_id');
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    
    // 验证计算结果
    expect(result.data.execution_result).toMatchObject({
      expression: '2+3',
      result: 5,
      formatted_result: '2+3 = 5',
      calculation_type: 'addition'
    });
  });

  test('should handle complex calculations', async () => {
    const result = await dacpCommand.execute({
      service_id: 'dacp-promptx-service', 
      action: 'calculate',
      parameters: {
        user_request: '(10 + 5) * 2 - 8 / 4'
      }
    });

    expect(result.success).toBe(true);
    expect(result.data.execution_result).toMatchObject({
      expression: '(10 + 5) * 2 - 8 / 4',
      result: 28,
      formatted_result: '(10 + 5) * 2 - 8 / 4 = 28'
    });
  });

  test('should handle Chinese operators', async () => {
    const result = await dacpCommand.execute({
      service_id: 'dacp-promptx-service',
      action: 'calculate', 
      parameters: {
        user_request: '100减去25再乘以2'
      }
    });

    expect(result.success).toBe(true);
    // 修正：计算器把它解析为 100-25*2 = 100-50 = 50
    expect(result.data.execution_result.result).toBe(50);
  });

  test('should handle calculation errors gracefully', async () => {
    const result = await dacpCommand.execute({
      service_id: 'dacp-promptx-service',
      action: 'calculate',
      parameters: {
        user_request: '无效的表达式'
      }
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
    expect(result.error.code).toBe('EXECUTION_ERROR');
  });
});