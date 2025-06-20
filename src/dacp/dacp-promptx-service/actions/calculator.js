/**
 * Calculator Action Module for DACP PromptX Service
 * 提供简单的计算功能
 */

// Calculate action handler
async function calculate(parameters) {
  const { user_request } = parameters;
  
  if (!user_request) {
    throw new Error('user_request is required for calculate action');
  }

  try {
    // 解析数学表达式
    const expression = parseExpression(user_request);
    
    // 计算结果
    const result = evaluateExpression(expression);
    
    return {
      expression: expression,
      result: result,
      formatted_result: `${expression} = ${result}`,
      calculation_type: getCalculationType(expression)
    };
  } catch (error) {
    throw new Error(`计算失败: ${error.message}`);
  }
}

// 解析用户输入的表达式
function parseExpression(userRequest) {
  // 移除中文描述，提取数学表达式
  let expr = userRequest;
  
  // 替换中文运算符
  expr = expr.replace(/加上|加/g, '+');
  expr = expr.replace(/减去|减/g, '-');
  expr = expr.replace(/乘以|乘/g, '*');
  expr = expr.replace(/除以|除/g, '/');
  expr = expr.replace(/等于|是多少|=|\?|？/g, '');
  
  // 提取数字和运算符
  const mathPattern = /[\d\+\-\*\/\(\)\.\s]+/g;
  const matches = expr.match(mathPattern);
  
  if (!matches) {
    throw new Error('未找到有效的数学表达式');
  }
  
  // 清理表达式
  expr = matches.join('').trim();
  
  // 验证表达式
  if (!/^[\d\+\-\*\/\(\)\.\s]+$/.test(expr)) {
    throw new Error('表达式包含无效字符');
  }
  
  return expr;
}

// 安全地计算表达式
function evaluateExpression(expression) {
  try {
    // 基本验证
    if (!expression || expression.trim() === '') {
      throw new Error('表达式为空');
    }
    
    // 使用 Function 构造器安全计算（只允许数学运算）
    const result = Function('"use strict"; return (' + expression + ')')();
    
    // 检查结果
    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('计算结果无效');
    }
    
    // 处理精度问题
    return Math.round(result * 1000000) / 1000000;
  } catch (error) {
    throw new Error(`计算错误: ${error.message}`);
  }
}

// 判断计算类型
function getCalculationType(expression) {
  if (expression.includes('+')) return 'addition';
  if (expression.includes('-')) return 'subtraction';
  if (expression.includes('*')) return 'multiplication';
  if (expression.includes('/')) return 'division';
  return 'simple';
}

// 导出 calculator action
module.exports = {
  calculate
};