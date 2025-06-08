#!/usr/bin/env node

/**
 * Cursor MCP 配置验证脚本
 * 帮助用户验证 Cursor 是否正确连接了 PromptX MCP 服务器
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class CursorMCPVerifier {
  constructor() {
    this.configPath = path.join(os.homedir(), '.cursor', 'mcp_servers.json');
    this.projectRoot = path.resolve(__dirname, '..');
    this.expectedServerPath = path.join(this.projectRoot, 'src', 'bin', 'mcp-server.js');
  }

  /**
   * 检查Cursor配置文件
   */
  async checkCursorConfig() {
    console.log('🔍 检查Cursor MCP配置...');
    
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (!config.mcpServers || !config.mcpServers.promptx) {
        console.log('❌ Cursor配置中没有找到PromptX服务器配置');
        return false;
      }
      
      const promptxConfig = config.mcpServers.promptx;
      const serverPath = promptxConfig.args?.[0];
      
      console.log('✅ 找到PromptX配置:');
      console.log(`   服务器路径: ${serverPath}`);
      console.log(`   工作目录: ${promptxConfig.cwd}`);
      console.log(`   描述: ${promptxConfig.description}`);
      
      // 检查服务器文件是否存在
      if (serverPath) {
        try {
          await fs.access(serverPath);
          console.log('✅ MCP服务器文件存在');
          
          if (serverPath === this.expectedServerPath) {
            console.log('✅ 服务器路径正确');
          } else {
            console.log('⚠️  服务器路径与当前项目不匹配');
            console.log(`   当前配置: ${serverPath}`);
            console.log(`   期望路径: ${this.expectedServerPath}`);
          }
        } catch (error) {
          console.log('❌ MCP服务器文件不存在:', serverPath);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.log('❌ 无法读取Cursor配置文件:', error.message);
      console.log(`   配置文件路径: ${this.configPath}`);
      return false;
    }
  }

  /**
   * 测试MCP服务器连接
   */
  async testMCPServer() {
    console.log('\n🧪 测试MCP服务器连接...');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', [this.expectedServerPath], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      // 准备测试数据
      const initMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'verification-test', version: '1.0.0' }
        }
      }) + '\n';

      const toolsMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'list_roles',
          arguments: { detailed: false }
        }
      }) + '\n';

      const executeMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'execute_role',
          arguments: {
            role: 'assistant',
            input: '验证测试'
          }
        }
      }) + '\n';

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      serverProcess.on('close', (code) => {
        console.log(`🔧 服务器进程退出，代码: ${code}`);
        this.analyzeServerOutput(output, errorOutput);
        resolve(code === 0);
      });

      // 发送测试消息
      setTimeout(() => {
        console.log('📤 发送初始化消息...');
        serverProcess.stdin.write(initMessage);
      }, 100);

      setTimeout(() => {
        console.log('📤 发送list_roles测试...');
        serverProcess.stdin.write(toolsMessage);
      }, 200);

      setTimeout(() => {
        console.log('📤 发送execute_role测试...');
        serverProcess.stdin.write(executeMessage);
      }, 300);

      setTimeout(() => {
        serverProcess.kill();
      }, 1000);
    });
  }

  /**
   * 分析服务器输出
   */
  analyzeServerOutput(output, errorOutput) {
    console.log('\n📊 服务器响应分析:');
    
    // 日志输出通常在stderr，但不是错误
    if (errorOutput && !errorOutput.includes('[INFO]')) {
      console.log('❌ 错误输出:');
      console.log(errorOutput);
      return;
    } else if (errorOutput && errorOutput.includes('[INFO]')) {
      console.log('📋 服务器日志:');
      console.log(errorOutput);
    }

    const lines = output.split('\n').filter(line => line.trim());
    let initSuccess = false;
    let toolsSuccess = false;
    let executeSuccess = false;

    lines.forEach(line => {
      try {
        if (line.startsWith('[')) {
          // 日志信息
          if (line.includes('PromptX MCP服务器初始化完成')) {
            console.log('✅ 服务器初始化成功');
            initSuccess = true;
          }
          return;
        }

        const response = JSON.parse(line);
        
        if (response.id === 1 && response.result) {
          console.log('✅ 初始化响应正常');
          console.log(`   协议版本: ${response.result.protocolVersion}`);
          console.log(`   服务器: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
        }
        
        if (response.id === 2 && response.result) {
          console.log('✅ list_roles工具响应正常');
          toolsSuccess = true;
        }
        
        if (response.id === 3) {
          if (response.result) {
            console.log('✅ execute_role工具响应正常');
            const content = response.result.content[0].text;
            if (content.includes('准备激活角色：assistant')) {
              console.log('✅ 角色执行功能正常');
              executeSuccess = true;
            } else if (content.includes('角色 "a" 不存在')) {
              console.log('❌ 角色执行有参数解析问题');
            }
          } else if (response.error) {
            console.log('❌ execute_role工具执行失败:', response.error.message);
          }
        }
      } catch (error) {
        // 忽略非JSON行
      }
    });

    console.log('\n📈 测试结果总结:');
    console.log(`   初始化: ${initSuccess ? '✅' : '❌'}`);
    console.log(`   角色列表: ${toolsSuccess ? '✅' : '❌'}`);
    console.log(`   角色执行: ${executeSuccess ? '✅' : '❌'}`);
  }

  /**
   * 提供修复建议
   */
  async provideFixes() {
    console.log('\n🔧 修复建议:');
    
    console.log('1. 确保Cursor完全重启后重新测试');
    console.log('2. 在Cursor中查找MCP面板，确认PromptX服务器连接状态');
    console.log('3. 如果问题持续，请运行自动配置脚本:');
    console.log(`   node configs/mcp/install.js cursor`);
    console.log('4. 手动验证配置文件:');
    console.log(`   cat ${this.configPath}`);
  }

  /**
   * 运行完整验证
   */
  async verify() {
    console.log('🎯 PromptX Cursor MCP 配置验证\n');
    
    const configOk = await this.checkCursorConfig();
    const serverOk = await this.testMCPServer();
    
    console.log('\n🎊 验证完成!');
    console.log(`配置状态: ${configOk ? '✅ 正常' : '❌ 异常'}`);
    console.log(`服务器状态: ${serverOk ? '✅ 正常' : '❌ 异常'}`);
    
    if (!configOk || !serverOk) {
      await this.provideFixes();
    } else {
      console.log('\n🎉 PromptX MCP配置完全正常！');
      console.log('现在可以在Cursor中使用PromptX的所有专业角色了。');
    }
  }
}

// 运行验证
async function main() {
  const verifier = new CursorMCPVerifier();
  await verifier.verify();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CursorMCPVerifier; 