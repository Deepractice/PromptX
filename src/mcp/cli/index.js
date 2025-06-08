#!/usr/bin/env node

/**
 * @fileoverview PromptX MCP CLI命令行入口
 * 提供命令行界面与MCP服务器交互
 */

const { Command } = require('commander');
const MCPClient = require('./mcpClient');
const path = require('path');
const fs = require('fs-extra');

const program = new Command();

// 配置程序信息
program
  .name('promptx-mcp')
  .description('PromptX MCP Client - 与PromptX MCP服务器交互的命令行工具')
  .version('1.0.0');

// 全局选项
program
  .option('-v, --verbose', '启用详细输出模式')
  .option('-c, --config <file>', '指定配置文件路径')
  .option('-s, --server <url>', '指定MCP服务器URL')
  .option('-t, --timeout <ms>', '设置连接超时时间（毫秒）', parseInt);

// 发现角色命令
program
  .command('discover')
  .alias('list')
  .description('发现所有可用的PromptX角色')
  .option('-f, --format <type>', '输出格式: pretty, json, table', 'pretty')
  .action(async (options) => {
    const client = createClient();
    
    try {
      console.log('🚀 正在连接到MCP服务器...');
      const connectResult = await client.connect();
      if (!connectResult.success) {
        console.error('❌ 连接失败:', connectResult.error);
        process.exit(1);
      }

      console.log('🔍 正在发现角色...');
      const result = await client.discoverRoles({ format: options.format });
      
      if (result.success) {
        console.log('\n' + result.output);
      } else {
        console.error('❌ 角色发现失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 未知错误:', error.message);
      process.exit(1);
    } finally {
      await client.disconnect();
    }
  });

// 执行角色命令
program
  .command('execute <role> <input>')
  .alias('run')
  .description('执行指定角色处理输入')
  .option('-s, --stream', '启用流式输出')
  .action(async (role, input, options) => {
    const client = createClient();
    
    try {
      console.log('🚀 正在连接到MCP服务器...');
      const connectResult = await client.connect();
      if (!connectResult.success) {
        console.error('❌ 连接失败:', connectResult.error);
        process.exit(1);
      }

      console.log(`🎭 正在执行角色: ${role}`);
      
      const executeOptions = {};
      if (options.stream) {
        executeOptions.onProgress = (data) => {
          console.log('📤', data);
        };
      }
      
      const result = await client.executeRole(role, input, executeOptions);
      
      if (result.success) {
        console.log('\n📋 执行结果:');
        console.log(result.output);
      } else {
        console.error('❌ 角色执行失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 未知错误:', error.message);
      process.exit(1);
    } finally {
      await client.disconnect();
    }
  });

// 读取资源命令
program
  .command('read <uri>')
  .alias('get')
  .description('读取指定的资源内容')
  .option('-o, --output <file>', '将输出保存到文件')
  .action(async (uri, options) => {
    const client = createClient();
    
    try {
      console.log('🚀 正在连接到MCP服务器...');
      const connectResult = await client.connect();
      if (!connectResult.success) {
        console.error('❌ 连接失败:', connectResult.error);
        process.exit(1);
      }

      console.log(`📄 正在读取资源: ${uri}`);
      const result = await client.readResource(uri);
      
      if (result.success) {
        if (options.output) {
          await fs.writeFile(options.output, result.content, 'utf8');
          console.log(`✅ 内容已保存到: ${options.output}`);
        } else {
          console.log('\n📋 资源内容:');
          console.log(result.content);
        }
      } else {
        console.error('❌ 资源读取失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 未知错误:', error.message);
      process.exit(1);
    } finally {
      await client.disconnect();
    }
  });

// 服务器状态命令
program
  .command('status')
  .description('检查MCP服务器连接状态')
  .action(async () => {
    const client = createClient();
    
    try {
      console.log('🚀 正在检查服务器状态...');
      const connectResult = await client.connect();
      
      if (connectResult.success) {
        console.log('✅ MCP服务器连接正常');
        console.log(`🔗 服务器URL: ${client.config.serverUrl}`);
        console.log(`⏱️  超时设置: ${client.config.timeout}ms`);
        
        // 测试基本功能
        const testResult = await client.discoverRoles();
        if (testResult.success) {
          console.log(`🎭 可用角色数量: ${testResult.roles.length}`);
        }
      } else {
        console.error('❌ MCP服务器连接失败:', connectResult.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 状态检查失败:', error.message);
      process.exit(1);
    } finally {
      await client.disconnect();
    }
  });

// 配置管理命令
program
  .command('config')
  .description('显示当前配置信息')
  .option('--init', '初始化配置文件')
  .action(async (options) => {
    if (options.init) {
      const configPath = path.join(process.cwd(), 'mcp-client.config.json');
      const defaultConfig = {
        serverUrl: 'http://localhost:3000',
        timeout: 5000,
        retries: 3,
        verbose: false
      };
      
      try {
        await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
        console.log(`✅ 配置文件已创建: ${configPath}`);
      } catch (error) {
        console.error('❌ 配置文件创建失败:', error.message);
        process.exit(1);
      }
    } else {
      const client = createClient();
      console.log('📋 当前配置:');
      console.log(JSON.stringify(client.config, null, 2));
    }
  });

/**
 * 创建客户端实例
 */
function createClient() {
  const globalOpts = program.opts();
  
  const options = {
    verbose: globalOpts.verbose,
    configFile: globalOpts.config
  };
  
  if (globalOpts.server) {
    options.serverUrl = globalOpts.server;
  }
  
  if (globalOpts.timeout) {
    options.timeout = globalOpts.timeout;
  }
  
  return new MCPClient(options);
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  if (program.opts().verbose) {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 