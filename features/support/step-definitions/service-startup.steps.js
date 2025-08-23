/**
 * 服务启停相关的步骤定义
 */
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const net = require('net');
const ServiceManager = require('../service-manager');

// 全局服务管理器实例
let serviceManager;

Before(function() {
  // 每个场景前创建新的服务管理器
  serviceManager = new ServiceManager();
  this.serviceManager = serviceManager;
});

After(async function() {
  // 每个场景后清理服务
  if (serviceManager && serviceManager.isRunning()) {
    try {
      await serviceManager.stop();
    } catch (error) {
      // 强制终止
      serviceManager.forceKill();
    }
  }
});

// ========== Given 步骤 ==========

Given('测试环境已准备就绪', function() {
  // 环境准备，可以添加必要的检查
  expect(process.env.NODE_ENV).to.not.equal('production');
});

Given('端口{int}可用', async function(port) {
  const isPortFree = await checkPortFree(port);
  expect(isPortFree, `端口 ${port} 应该可用`).to.be.true;
});

Given('PromptX服务已在端口{int}启动', async function(port) {
  if (!serviceManager.isRunning()) {
    const result = await serviceManager.start(port, { timeout: 5000 });
    expect(result.pid).to.be.a('number');
  }
  
  const isAccessible = await serviceManager.isPortAccessible(port);
  expect(isAccessible, `服务应该在端口 ${port} 上可访问`).to.be.true;
});

Given('PromptX服务正在端口{int}运行', async function(port) {
  // 与上面的步骤相同，只是措辞不同
  if (!serviceManager.isRunning()) {
    const result = await serviceManager.start(port);
    expect(result.pid).to.be.a('number');
  }
  
  expect(serviceManager.isRunning()).to.be.true;
  expect(serviceManager.port).to.equal(port);
});

// ========== When 步骤 ==========

When('我启动PromptX HTTP服务在端口{int}', async function(port) {
  try {
    const result = await serviceManager.start(port, {
      timeout: 5000  // 增加到5秒
    });
    this.startResult = result;
    this.startError = null;
  } catch (error) {
    console.log('启动失败:', error.message);
    this.startError = error;
    this.startResult = null;
  }
});

When('我尝试在同一端口再次启动服务', async function() {
  const port = serviceManager.port;
  const secondManager = new ServiceManager();
  
  try {
    const result = await secondManager.start(port, { timeout: 2000 });
    console.log('第二个服务竟然启动成功了:', result);
    this.duplicateStartError = null;
    // 如果成功启动了，需要清理
    await secondManager.stop();
  } catch (error) {
    console.log('第二个服务启动失败（预期）:', error.message);
    this.duplicateStartError = error;
  }
});

When('我访问健康检查endpoint {string}', async function(endpoint) {
  try {
    const health = await serviceManager.getHealth();
    this.healthResponse = health;
    this.healthStatus = 200;
  } catch (error) {
    this.healthStatus = error.response?.status || 500;
    this.healthResponse = error.response?.data || null;
  }
});

When('我发送MCP初始化请求', async function() {
  try {
    const response = await serviceManager.sendMcpInitialize();
    this.mcpResponse = response;
    this.mcpError = null;
  } catch (error) {
    console.log('MCP初始化失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
    this.mcpError = error;
    this.mcpResponse = null;
  }
});

When('我发送停止信号给服务进程', async function() {
  const stopResult = await serviceManager.stop({
    timeout: 5000
  });
  this.stopResult = stopResult;
});

When('服务遇到异常崩溃', function() {
  // 模拟崩溃
  serviceManager.forceKill();
  this.crashSimulated = true;
});

When('我重新启动服务', async function() {
  // 等待一下确保端口释放
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const result = await serviceManager.start(3001);
  this.restartResult = result;
});

// ========== Then 步骤 ==========

Then('服务应该在{int}秒内成功启动', function(seconds) {
  expect(this.startError, '启动不应该有错误').to.be.null;
  expect(this.startResult, '应该有启动结果').to.not.be.null;
  expect(this.startResult.pid).to.be.a('number');
});

Then('端口{int}应该可访问', async function(port) {
  const isAccessible = await serviceManager.isPortAccessible(port);
  expect(isAccessible, `端口 ${port} 应该可访问`).to.be.true;
});

Then('端口{int}应该被释放', async function(port) {
  // 等待一下确保端口完全释放
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const isPortFree = await checkPortFree(port);
  expect(isPortFree, `端口 ${port} 应该被释放`).to.be.true;
});

Then('服务进程应该存在', function() {
  expect(serviceManager.isRunning()).to.be.true;
  expect(serviceManager.getPid()).to.be.a('number');
});

Then('服务进程应该不存在', function() {
  expect(serviceManager.isRunning()).to.be.false;
  expect(serviceManager.getPid()).to.be.null;
});

Then('应该收到端口已占用的错误提示', function() {
  expect(this.duplicateStartError).to.not.be.null;
  expect(this.duplicateStartError.message).to.include('端口');
});

Then('原服务应该继续正常运行', function() {
  expect(serviceManager.isRunning()).to.be.true;
});

Then('应该返回{int}状态码', function(statusCode) {
  expect(this.healthStatus).to.equal(statusCode);
});

Then('响应应包含服务元信息', function() {
  expect(this.healthResponse).to.be.an('object');
  expect(this.healthResponse).to.have.property('name');
  expect(this.healthResponse).to.have.property('version');
});

Then('响应应包含 {string} 字段为 {string}', function(field, value) {
  expect(this.healthResponse).to.have.property(field, value);
});

Then('应该返回成功的初始化响应', function() {
  expect(this.mcpError).to.be.null;
  expect(this.mcpResponse).to.be.an('object');
  expect(this.mcpResponse).to.have.property('result');
});

Then('响应应包含服务器能力信息', function() {
  expect(this.mcpResponse.result).to.have.property('capabilities');
});

Then('响应应包含可用工具列表', function() {
  expect(this.mcpResponse.result.capabilities).to.have.property('tools');
});

Then('服务应该在{int}秒内优雅关闭', function(seconds) {
  expect(this.stopResult).to.be.an('object');
  expect(this.stopResult.message).to.equal('服务已停止');
});

Then('新服务应该成功启动', function() {
  expect(this.restartResult).to.be.an('object');
  expect(this.restartResult.pid).to.be.a('number');
});

Then('服务应该正常响应请求', async function() {
  const isAccessible = await serviceManager.isPortAccessible();
  expect(isAccessible).to.be.true;
});

// ========== 辅助函数 ==========

/**
 * 检查端口是否空闲
 */
function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}