#!/usr/bin/env node

/**
 * @fileoverview PromptX MCP 配置安装工具
 * 自动化配置各种AI IDE的MCP设置
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class MCPInstaller {
  constructor() {
    this.configs = {
      'claude-desktop': {
        name: 'Claude Desktop',
        paths: {
          darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
          win32: '%APPDATA%\\Claude\\claude_desktop_config.json',
          linux: '~/.config/Claude/claude_desktop_config.json'
        },
        template: 'claude-desktop.json'
      },
      'cursor': {
        name: 'Cursor Editor',
        paths: {
          darwin: '~/.cursor/mcp_servers.json',
          win32: '%APPDATA%\\Cursor\\User\\mcp_servers.json',
          linux: '~/.config/Cursor/User/mcp_servers.json'
        },
        template: 'cursor-settings.json'
      },
      'vscode': {
        name: 'VS Code',
        paths: {
          darwin: '~/.vscode/mcp_servers.json',
          win32: '%APPDATA%\\Code\\User\\mcp_servers.json',
          linux: '~/.config/Code/User/mcp_servers.json'
        },
        template: 'vscode-settings.json'
      },
      'zed': {
        name: 'Zed Editor',
        paths: {
          darwin: '~/.config/zed/settings.json',
          win32: '%APPDATA%\\Zed\\settings.json',
          linux: '~/.config/zed/settings.json'
        },
        template: 'zed-settings.json'
      }
    };
  }

  /**
   * 解析路径（处理~和环境变量）
   */
  resolvePath(configPath) {
    if (configPath.startsWith('~')) {
      return path.join(os.homedir(), configPath.slice(1));
    }
    if (configPath.includes('%')) {
      return configPath.replace(/%([^%]+)%/g, (_, envVar) => {
        return process.env[envVar] || '';
      });
    }
    return configPath;
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDir(filePath) {
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 读取模板配置
   */
  async readTemplate(templateName) {
    const templatePath = path.join(__dirname, templateName);
    const content = await fs.readFile(templatePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * 合并配置（对于已存在的配置文件）
   */
  mergeConfig(existing, newConfig, ide) {
    if (ide === 'claude-desktop') {
      return {
        ...existing,
        mcpServers: {
          ...existing.mcpServers,
          ...newConfig.mcpServers
        }
      };
    }
    
    if (ide === 'zed') {
      return {
        ...existing,
        assistant: {
          ...existing.assistant,
          mcp_servers: {
            ...existing.assistant?.mcp_servers,
            ...newConfig.assistant.mcp_servers
          }
        }
      };
    }

    // 默认合并策略
    return {
      ...existing,
      mcp: {
        ...existing.mcp,
        servers: {
          ...existing.mcp?.servers,
          ...newConfig.mcp.servers
        }
      }
    };
  }

  /**
   * 安装单个IDE配置
   */
  async installIDE(ideKey) {
    const config = this.configs[ideKey];
    if (!config) {
      throw new Error(`不支持的IDE: ${ideKey}`);
    }

    const platform = os.platform();
    const configPath = config.paths[platform];
    
    if (!configPath) {
      throw new Error(`${config.name} 在 ${platform} 平台上不受支持`);
    }

    const resolvedPath = this.resolvePath(configPath);
    const templateConfig = await this.readTemplate(config.template);

    console.log(`📝 配置 ${config.name}...`);
    console.log(`   路径: ${resolvedPath}`);

    // 确保目录存在
    await this.ensureDir(resolvedPath);

    let finalConfig = templateConfig;

    // 如果配置文件已存在，进行合并
    if (await this.fileExists(resolvedPath)) {
      try {
        const existingContent = await fs.readFile(resolvedPath, 'utf8');
        const existingConfig = JSON.parse(existingContent);
        finalConfig = this.mergeConfig(existingConfig, templateConfig, ideKey);
        console.log(`   ✅ 已合并到现有配置`);
      } catch (error) {
        console.log(`   ⚠️  无法解析现有配置，将覆盖: ${error.message}`);
      }
    } else {
      console.log(`   ✅ 创建新配置文件`);
    }

    // 写入配置
    await fs.writeFile(resolvedPath, JSON.stringify(finalConfig, null, 2), 'utf8');
    
    return {
      ide: config.name,
      path: resolvedPath,
      success: true
    };
  }

  /**
   * 检测已安装的IDE
   */
  async detectInstalledIDEs() {
    const installed = [];
    
    for (const [ideKey, config] of Object.entries(this.configs)) {
      const platform = os.platform();
      const configPath = config.paths[platform];
      
      if (configPath) {
        const resolvedPath = this.resolvePath(configPath);
        const parentDir = path.dirname(resolvedPath);
        
        try {
          await fs.access(parentDir);
          installed.push({
            key: ideKey,
            name: config.name,
            path: resolvedPath
          });
        } catch {
          // IDE未安装或路径不存在
        }
      }
    }
    
    return installed;
  }

  /**
   * 验证配置
   */
  async validateConfig(ideKey) {
    const config = this.configs[ideKey];
    const platform = os.platform();
    const configPath = config.paths[platform];
    const resolvedPath = this.resolvePath(configPath);

    if (!await this.fileExists(resolvedPath)) {
      return { valid: false, reason: '配置文件不存在' };
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf8');
      const parsedConfig = JSON.parse(content);
      
      // 检查是否包含PromptX配置
      let hasPromptX = false;
      
      if (ideKey === 'claude-desktop') {
        hasPromptX = parsedConfig.mcpServers?.promptx;
      } else if (ideKey === 'zed') {
        hasPromptX = parsedConfig.assistant?.mcp_servers?.promptx;
      } else {
        hasPromptX = parsedConfig.mcp?.servers?.promptx;
      }

      return {
        valid: hasPromptX,
        reason: hasPromptX ? '配置正确' : '未找到PromptX配置'
      };
    } catch (error) {
      return { valid: false, reason: `配置文件格式错误: ${error.message}` };
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🚀 PromptX MCP 配置安装工具

用法:
  node install.js [选项] [IDE]

选项:
  --all, -a        配置所有检测到的IDE
  --detect, -d     检测已安装的IDE
  --validate, -v   验证现有配置
  --help, -h       显示此帮助信息

支持的IDE:
  claude-desktop   Claude Desktop
  cursor           Cursor Editor
  vscode           VS Code
  zed              Zed Editor

示例:
  node install.js claude-desktop    # 配置Claude Desktop
  node install.js --all             # 配置所有检测到的IDE
  node install.js --detect          # 检测已安装的IDE
  node install.js --validate zed    # 验证Zed配置
`);
  }
}

// 主函数
async function main() {
  const installer = new MCPInstaller();
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    installer.showHelp();
    return;
  }

  try {
    if (args.includes('--detect') || args.includes('-d')) {
      console.log('🔍 检测已安装的IDE...\n');
      const installed = await installer.detectInstalledIDEs();
      
      if (installed.length === 0) {
        console.log('❌ 未检测到支持的IDE');
      } else {
        console.log('✅ 检测到以下IDE:');
        installed.forEach(ide => {
          console.log(`   • ${ide.name} (${ide.key})`);
          console.log(`     配置路径: ${ide.path}`);
        });
        console.log(`\n💡 运行 'node install.js --all' 配置所有IDE`);
      }
      return;
    }

    if (args.includes('--validate') || args.includes('-v')) {
      const ideKey = args.find(arg => !arg.startsWith('-'));
      if (!ideKey) {
        console.error('❌ 请指定要验证的IDE');
        return;
      }

      console.log(`🔍 验证 ${ideKey} 配置...\n`);
      const result = await installer.validateConfig(ideKey);
      
      if (result.valid) {
        console.log(`✅ ${installer.configs[ideKey].name} 配置正确`);
      } else {
        console.log(`❌ ${installer.configs[ideKey].name} 配置问题: ${result.reason}`);
      }
      return;
    }

    if (args.includes('--all') || args.includes('-a')) {
      console.log('🚀 配置所有检测到的IDE...\n');
      const installed = await installer.detectInstalledIDEs();
      
      if (installed.length === 0) {
        console.log('❌ 未检测到支持的IDE');
        return;
      }

      const results = [];
      for (const ide of installed) {
        try {
          const result = await installer.installIDE(ide.key);
          results.push(result);
        } catch (error) {
          console.error(`❌ 配置 ${ide.name} 失败: ${error.message}`);
          results.push({
            ide: ide.name,
            success: false,
            error: error.message
          });
        }
      }

      console.log('\n📋 配置完成总结:');
      results.forEach(result => {
        if (result.success) {
          console.log(`✅ ${result.ide}`);
        } else {
          console.log(`❌ ${result.ide}: ${result.error}`);
        }
      });

      const successCount = results.filter(r => r.success).length;
      console.log(`\n🎯 总计: ${successCount}/${results.length} 个IDE配置成功`);
      
      if (successCount > 0) {
        console.log('\n💡 请重启相应的IDE以使配置生效');
      }
      return;
    }

    // 配置单个IDE
    const ideKey = args[0];
    if (!installer.configs[ideKey]) {
      console.error(`❌ 不支持的IDE: ${ideKey}`);
      console.log('\n支持的IDE:');
      Object.keys(installer.configs).forEach(key => {
        console.log(`  • ${key}`);
      });
      return;
    }

    const result = await installer.installIDE(ideKey);
    console.log(`\n✅ ${result.ide} 配置完成!`);
    console.log(`   配置文件: ${result.path}`);
    console.log('\n💡 请重启IDE以使配置生效');

  } catch (error) {
    console.error(`❌ 安装失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接执行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('未处理的错误:', error);
    process.exit(1);
  });
}

module.exports = { MCPInstaller }; 