/**
 * MCP工具连通性测试步骤定义
 */
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const MCPClient = require('../mcp-client');

// 共享的MCP客户端实例
let mcpClient;
let lastResponse;
let lastError;

// ========== Given 步骤 ==========

Given('MCP环境已准备就绪', async function() {
  // 初始化MCP客户端
  mcpClient = new MCPClient(this.serviceManager.baseUrl);
  
  // 确保MCP服务可访问
  const isReady = await mcpClient.isReady();
  expect(isReady, 'MCP服务应该就绪').to.be.true;
});

// ========== When 步骤 ==========

When('我检查MCP服务状态', async function() {
  try {
    const response = await mcpClient.checkServiceStatus();
    this.mcpStatusResponse = response;
    this.mcpStatusCode = response.status;
  } catch (error) {
    this.mcpStatusError = error;
  }
});

When('我尝试获取MCP工具列表', async function() {
  try {
    const response = await mcpClient.attemptToolsList();
    this.mcpListResponse = response;
    this.mcpListStatusCode = response.status;
  } catch (error) {
    this.mcpListError = error;
    if (error.response) {
      this.mcpListStatusCode = error.response.status;
    }
  }
});

When('我向MCP端点发送初始化请求', async function() {
  try {
    const response = await mcpClient.checkServiceStatus();
    this.mcpInitResponse = response;
    this.mcpInitStatusCode = response.status;
    this.mcpInitHeaders = response.headers;
  } catch (error) {
    this.mcpInitError = error;
  }
});

When('我尝试调用MCP方法 {string}', async function(method) {
  try {
    const response = await mcpClient.callMethod(method);
    this.mcpMethodResponse = response;
    this.mcpMethodStatusCode = response.status;
  } catch (error) {
    this.mcpMethodError = error;
    if (error.response) {
      this.mcpMethodStatusCode = error.response.status;
    }
  }
});

When('我调用MCP工具 {string} 使用参数:', async function(toolName, dataTable) {
  try {
    // 解析数据表为参数对象
    const params = {};
    const rows = dataTable.hashes();
    
    for (const row of rows) {
      const key = row.key || Object.keys(row)[0];
      let value = row.value || row[Object.keys(row)[1]];
      
      // 尝试解析JSON值
      if (value && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // 保持原始字符串
        }
      }
      
      params[key] = value;
    }
    
    lastError = null;
    lastResponse = await mcpClient.callTool(toolName, params);
    this.mcpResponse = lastResponse;
    this.mcpError = null;
  } catch (error) {
    console.log(`调用工具 ${toolName} 失败:`, error.message);
    lastError = error;
    lastResponse = null;
    this.mcpError = error;
    this.mcpResponse = null;
  }
});

When('我调用MCP工具 {string} 使用无效参数', async function(toolName) {
  try {
    // 故意提供无效参数来测试错误处理
    const invalidParams = {
      invalid_field: 'test',
      // 缺少必需参数
    };
    
    lastError = null;
    lastResponse = await mcpClient.callTool(toolName, invalidParams);
    this.mcpResponse = lastResponse;
    this.mcpError = null;
  } catch (error) {
    console.log(`预期的参数错误: ${error.message}`);
    lastError = error;
    lastResponse = null;
    this.mcpError = error;
    this.mcpResponse = null;
  }
});

// ========== Then 步骤 ==========

Then('MCP服务应该正常响应', function() {
  const statusCode = this.mcpStatusCode || this.mcpInitStatusCode || this.mcpListStatusCode;
  const response = this.mcpStatusResponse || this.mcpInitResponse || this.mcpListResponse;
  
  expect(statusCode || response).to.exist;
  // 426、406、400都表示服务正在运行（只是不支持普通HTTP）
  if (statusCode) {
    expect([426, 406, 400, 200]).to.include(statusCode);
  }
});

Then('应该返回{int}或{int}状态码', function(code1, code2) {
  const statusCode = this.mcpStatusCode || this.mcpListStatusCode || this.mcpInitStatusCode || this.mcpMethodStatusCode;
  expect([code1, code2]).to.include(statusCode);
});

Then('应该返回错误状态码', function() {
  const statusCode = this.mcpListStatusCode || this.mcpStatusCode;
  expect(statusCode).to.be.at.least(400);
});

Then('响应状态码应该是{int}或{int}', function(code1, code2) {
  const statusCode = this.mcpListStatusCode || this.mcpStatusCode || this.mcpInitStatusCode;
  expect([code1, code2]).to.include(statusCode);
});

Then('响应状态码应该是{int}', function(expectedCode) {
  const statusCode = this.mcpListStatusCode || this.mcpStatusCode || this.mcpInitStatusCode || this.mcpMethodStatusCode;
  expect(statusCode).to.equal(expectedCode);
});

Then('应该收到{int}状态码', function(expectedCode) {
  const statusCode = this.mcpInitStatusCode || this.mcpMethodStatusCode;
  expect(statusCode).to.equal(expectedCode);
});


Then('响应头应包含升级要求', function() {
  expect(this.mcpInitHeaders).to.exist;
  const upgradeHeader = this.mcpInitHeaders['upgrade'] || this.mcpInitHeaders['Upgrade'];
  if (upgradeHeader) {
    expect(upgradeHeader).to.match(/websocket|stream/i);
  }
  // 426状态码本身就表示需要升级
  expect(this.mcpInitStatusCode).to.equal(426);
});

Then('工具应该成功响应', function() {
  expect(lastError, '不应该有错误').to.be.null;
  expect(lastResponse, '应该有响应').to.not.be.null;
});

Then('响应应包含角色列表', function() {
  expect(lastResponse).to.be.an('object');
  expect(lastResponse.result).to.be.an('object');
  
  // 检查是否包含角色相关信息
  const content = lastResponse.result.content || lastResponse.result;
  expect(content).to.be.an('array').that.has.length.greaterThan(0);
  
  // 应该包含文本内容
  const textContent = content.find(c => c.type === 'text');
  expect(textContent).to.exist;
  expect(textContent.text).to.include('角色');
});

Then('响应应包含工具列表', function() {
  const content = lastResponse.result.content || lastResponse.result;
  const textContent = content.find(c => c.type === 'text');
  expect(textContent.text).to.match(/工具|tool/i);
});

Then('响应应包含初始化状态', function() {
  expect(lastResponse).to.be.an('object');
  expect(lastResponse.result).to.be.an('object');
  
  // init工具返回的内容
  const content = lastResponse.result.content || lastResponse.result;
  expect(content).to.be.an('array');
});

Then('响应应包含角色激活信息', function() {
  expect(lastResponse).to.be.an('object');
  expect(lastResponse.result).to.be.an('object');
  
  const content = lastResponse.result.content || lastResponse.result;
  const textContent = content.find(c => c.type === 'text');
  expect(textContent.text).to.match(/角色激活|role.*activated/i);
});

Then('响应应包含记忆检索结果', function() {
  expect(lastResponse).to.be.an('object');
  expect(lastResponse.result).to.be.an('object');
  
  const content = lastResponse.result.content || lastResponse.result;
  expect(content).to.be.an('array');
  // 即使没有记忆，也应该返回空结果或提示信息
});

Then('响应应包含保存确认', function() {
  expect(lastResponse).to.be.an('object');
  expect(lastResponse.result).to.be.an('object');
  
  const content = lastResponse.result.content || lastResponse.result;
  const textContent = content.find(c => c.type === 'text');
  expect(textContent.text).to.match(/保存|saved|记忆|memory/i);
});

Then('工具应该成功响应或返回资源不存在错误', function() {
  // 这是一个组合条件：成功或特定错误都可以
  if (lastError) {
    // 如果有错误，检查是否是预期的"资源不存在"错误
    expect(lastError.message).to.match(/不存在|not.*found|not.*exist/i);
  } else if (lastResponse) {
    // 如果成功响应，检查是否包含内容或错误信息
    expect(lastResponse).to.be.an('object');
    expect(lastResponse.result).to.exist;
  } else {
    throw new Error('应该有响应或预期的错误');
  }
});

Then('工具应该成功响应或返回工具不存在错误', function() {
  // 这是一个组合条件：成功或特定错误都可以
  if (lastError) {
    // 如果有错误，检查是否是预期的"工具不存在"错误
    expect(lastError.message).to.match(/不存在|not.*found|not.*exist|failed/i);
  } else if (lastResponse) {
    // 如果成功响应，检查是否包含内容
    expect(lastResponse).to.be.an('object');
    expect(lastResponse.result).to.exist;
  } else {
    throw new Error('应该有响应或预期的错误');
  }
});

Then('应该返回参数错误', function() {
  expect(lastError, '应该有错误').to.not.be.null;
  expect(lastError.message).to.match(/参数|parameter|required|invalid/i);
});

Then('错误信息应该包含参数要求', function() {
  expect(lastError).to.not.be.null;
  const errorMessage = lastError.message || lastError.toString();
  expect(errorMessage).to.match(/required|必需|参数|parameter/i);
});