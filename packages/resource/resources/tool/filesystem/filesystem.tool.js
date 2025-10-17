/**
 * Filesystem Tool - PromptX 体系的文件系统基础设施
 * 
 * 战略意义：
 * 
 * 1. 架构隔离性
 * 专为 PromptX 体系设计，通过沙箱隔离确保文件操作不会影响
 * PromptX 核心功能。即使 AI Agent 出错，也不会破坏系统稳定性。
 * 
 * 2. 平台独立性  
 * 虽然很多 AI 平台自带文件工具，但 PromptX 需要自己的实现来保证：
 * - 在无本地工具的 Web Agent 平台上也能工作
 * - 统一的操作语义，不依赖特定 AI 平台
 * - 可移植到任何支持 MCP 协议的环境
 * 
 * 3. 生态自主性
 * 作为 PromptX 工具生态的基础组件，filesystem 确保了：
 * - 其他工具可以依赖稳定的文件操作接口
 * - 用户数据始终在 PromptX 控制范围内
 * - 未来可扩展更多存储后端（云存储、分布式等）
 * 
 * 这不仅是一个文件操作工具，更是 PromptX 实现平台独立、
 * 生态自主的关键基础设施。
 */

const path = require('path');
const os = require('os');

module.exports = {
  /**
   * 获取工具依赖
   * MCP filesystem包 + glob用于模式搜索
   */
  getDependencies() {
    return {
      '@modelcontextprotocol/server-filesystem': '^2025.7.29',
      'glob': '^10.3.10'
    };
  },

  /**
   * 获取工具元信息
   */
  getMetadata() {
    return {
      id: 'filesystem',
      name: 'filesystem',
      description: '基于MCP标准的文件系统操作工具，提供读写、搜索、编辑等功能',
      version: '2.0.0',
      category: 'system',
      author: '鲁班',
      tags: ['file', 'system', 'io', 'mcp'],
      scenarios: [
        '文件读写操作',
        '目录管理和遍历',
        '文件搜索和批量处理',
        'PromptX资源文件管理',
        '项目文件结构分析'
      ],
      limitations: [
        '默认只能访问 ~/.promptx 目录',
        '可通过环境变量配置额外允许的目录',
        '不支持符号链接操作',
        '单文件大小建议不超过10MB'
      ]
    };
  },

  /**
   * 获取参数Schema
   */
  getSchema() {
    return {
      parameters: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            description: 'MCP方法名',
            enum: [
              'read_text_file',
              'read_media_file', 
              'read_multiple_files',
              'write_file',
              'edit_file',
              'create_directory',
              'list_directory',
              'list_directory_with_sizes',
              'directory_tree',
              'move_file',
              'search_files',
              'get_file_info',
              'list_allowed_directories'
            ]
          },
          // 通用参数，根据method动态使用
          path: { type: 'string', description: '文件或目录路径' },
          paths: { type: 'array', items: { type: 'string' }, description: '多个文件路径' },
          content: { type: 'string', description: '文件内容' },
          head: { type: 'number', description: '读取前N行' },
          tail: { type: 'number', description: '读取后N行' },
          edits: {
            type: 'array',
            description: '编辑操作列表，每个元素为对象: {oldText: "要替换的文本", newText: "新文本"}',
            items: {
              type: 'object',
              properties: {
                oldText: {
                  type: 'string',
                  description: '要替换的原始文本（必须完全匹配）'
                },
                newText: {
                  type: 'string',
                  description: '替换后的新文本'
                }
              },
              required: ['oldText', 'newText']
            }
          },
          dryRun: { type: 'boolean', description: '仅预览不执行' },
          source: { type: 'string', description: '源路径' },
          destination: { type: 'string', description: '目标路径' },
          pattern: { type: 'string', description: '搜索模式' },
          excludePatterns: { type: 'array', items: { type: 'string' }, description: '排除模式' },
          sortBy: { type: 'string', enum: ['name', 'size'], description: '排序方式' }
        },
        required: ['method']
      },
      environment: {
        type: 'object',
        properties: {
          ALLOWED_DIRECTORIES: {
            type: 'string',
            description: '允许访问的目录列表（JSON数组格式），默认为 ["~/.promptx"]',
            default: '["~/.promptx"]'
          }
        },
        required: []
      }
    };
  },

  /**
   * 获取业务错误定义
   */
  getBusinessErrors() {
    return [
      {
        code: 'PATH_OUTSIDE_SCOPE',
        description: '路径越权访问',
        match: /路径越权/,
        solution: '确保路径在允许的目录范围内',
        retryable: false
      },
      {
        code: 'FILE_NOT_FOUND',
        description: '文件或目录不存在',
        match: /ENOENT|no such file|cannot find/i,
        solution: '检查文件路径是否正确',
        retryable: false
      },
      {
        code: 'PERMISSION_DENIED',
        description: '权限不足',
        match: /EACCES|permission denied/i,
        solution: '检查文件或目录的访问权限',
        retryable: false
      },
      {
        code: 'FILE_TOO_LARGE',
        description: '文件过大',
        match: /File too large|ENOBUFS|too big/i,
        solution: '文件大小不应超过10MB',
        retryable: false
      },
      {
        code: 'DIRECTORY_NOT_EMPTY',
        description: '目录非空',
        match: /ENOTEMPTY|directory not empty/i,
        solution: '清空目录后再试',
        retryable: false
      },
      {
        code: 'INVALID_PATH',
        description: '无效路径',
        match: /invalid path|illegal characters/i,
        solution: '检查路径格式是否正确',
        retryable: false
      }
    ];
  },

  /**
   * 获取允许的目录列表
   */
  getAllowedDirectories() {
    const { api } = this;

    // Try to get configuration from environment variable
    let allowedDirs = ['~/.promptx'];  // Default value

    if (api && api.environment) {
      try {
        let configStr = api.environment.get('ALLOWED_DIRECTORIES');
        if (configStr) {
          // Handle escaped quotes from .env file parsing
          // The ToolEnvironment escapes backslashes and quotes when saving to .env
          // We need to unescape them before parsing JSON
          configStr = configStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

          const parsed = JSON.parse(configStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allowedDirs = parsed;
          }
        }
      } catch (error) {
        // Fall back to default value if parsing fails
        api?.logger?.warn('Failed to parse ALLOWED_DIRECTORIES', { error: error.message });
      }
    }

    // Expand ~ to home directory and normalize paths
    return allowedDirs.map(dir => {
      const expanded = dir.replace(/^~/, os.homedir());
      return path.resolve(expanded);
    });
  },

  /**
   * 初始化MCP文件系统实例
   * 缓存实例以避免重复初始化
   */
  async getMCPInstance() {
    if (!this._mcpInstance) {
      // 动态导入MCP filesystem模块的lib文件
      // importx 由 ToolSandbox 在沙箱环境中提供，自动处理ES Module
      // 注意：必须导入 dist/lib.js，因为主入口是CLI服务器
      const mcpModule = await importx('@modelcontextprotocol/server-filesystem/dist/lib.js');
      
      // 获取允许的目录列表
      const allowedDirectories = this.getAllowedDirectories();
      
      // 设置允许的目录
      mcpModule.setAllowedDirectories(allowedDirectories);
      
      this._mcpInstance = mcpModule;
      this._allowedDirectories = allowedDirectories;
      
      // 记录日志
      const { api } = this;
      api?.logger?.info('Filesystem initialized', { 
        allowedDirectories: this._allowedDirectories 
      });
    }
    return this._mcpInstance;
  },

  /**
   * PromptX特定的路径处理
   * 将相对路径转换为绝对路径，并确保在允许的目录范围内
   */
  resolvePromptXPath(inputPath) {
    const { api } = this;
    
    // 获取允许的目录列表
    const allowedDirs = this._allowedDirectories || this.getAllowedDirectories();
    
    if (!inputPath) {
      // 没有路径时返回第一个允许的目录
      return allowedDirs[0];
    }
    
    // 处理 ~ 开头的路径
    const expandedPath = inputPath.replace(/^~/, os.homedir());
    
    // 如果是绝对路径
    if (path.isAbsolute(expandedPath)) {
      const resolved = path.resolve(expandedPath);
      
      // 检查是否在任何允许的目录内
      const isAllowed = allowedDirs.some(dir => resolved.startsWith(dir));
      
      if (!isAllowed) {
        const dirsStr = allowedDirs.join(', ');
        api?.logger?.warn('Path access denied', { path: resolved, allowedDirs });
        throw new Error(`路径越权: ${inputPath} 不在允许的目录范围内 [${dirsStr}]`);
      }
      
      return resolved;
    }
    
    // 相对路径，尝试在每个允许的目录中解析
    // 优先使用第一个允许的目录（通常是 ~/.promptx）
    const baseDir = allowedDirs[0];
    const fullPath = path.join(baseDir, expandedPath);
    const resolved = path.resolve(fullPath);
    
    // 安全检查：确保解析后的路径在允许的目录内
    const isAllowed = allowedDirs.some(dir => resolved.startsWith(dir));
    
    if (!isAllowed) {
      const dirsStr = allowedDirs.join(', ');
      api?.logger?.warn('Path resolution failed', { path: inputPath, resolved, allowedDirs });
      throw new Error(`路径越权: ${inputPath} 解析后超出允许的目录范围 [${dirsStr}]`);
    }
    
    return resolved;
  },

  /**
   * 执行工具 - 包装MCP实现
   */
  async execute(params) {
    const { api } = this;
    
    // 记录执行开始
    api?.logger?.info('Executing filesystem operation', { 
      method: params.method,
      path: params.path || params.paths || params.source
    });
    
    // 参数验证由 ToolValidator 根据 getSchema() 自动处理
    // 这里进行 method 相关的业务验证
    const methodRequirements = {
      'read_text_file': ['path'],
      'read_media_file': ['path'],
      'read_multiple_files': ['paths'],
      'write_file': ['path', 'content'],
      'edit_file': ['path', 'edits'],
      'create_directory': ['path'],
      'list_directory': ['path'],
      'list_directory_with_sizes': ['path'],
      'directory_tree': ['path'],
      'move_file': ['source', 'destination'],
      'search_files': ['path', 'pattern'],
      'get_file_info': ['path'],
      'list_allowed_directories': []
    };

    const required = methodRequirements[params.method];
    if (!required) {
      throw new Error(`不支持的方法: ${params.method}`);
    }

    const missing = required.filter(field => !params[field]);
    if (missing.length > 0) {
      throw new Error(`方法 ${params.method} 缺少必需参数: ${missing.join(', ')}`);
    }

    try {
      // 获取MCP实例
      const mcp = await this.getMCPInstance();
      
      // 特殊处理list_allowed_directories
      if (params.method === 'list_allowed_directories') {
        const dirs = this._allowedDirectories || this.getAllowedDirectories();
        api?.logger?.info('Returning allowed directories', { directories: dirs });
        return dirs;
      }

      // 准备MCP调用参数
      let mcpParams = { ...params };
      
      // 路径参数转换
      if (params.path) {
        mcpParams.path = this.resolvePromptXPath(params.path);
      }
      
      if (params.paths) {
        mcpParams.paths = params.paths.map(p => this.resolvePromptXPath(p));
      }
      
      if (params.source) {
        mcpParams.source = this.resolvePromptXPath(params.source);
      }
      
      if (params.destination) {
        mcpParams.destination = this.resolvePromptXPath(params.destination);
      }

      // 调用对应的MCP方法
      let result;
      switch (params.method) {
        case 'read_text_file':
          if (params.head) {
            result = await mcp.headFile(mcpParams.path, params.head);
          } else if (params.tail) {
            result = await mcp.tailFile(mcpParams.path, params.tail);
          } else {
            result = await mcp.readFileContent(mcpParams.path);
          }
          break;
          
        case 'read_media_file': {
          // 读取二进制文件并转base64
          const fs = require('fs').promises;
          const buffer = await fs.readFile(mcpParams.path);
          const base64 = buffer.toString('base64');
          const ext = path.extname(mcpParams.path).toLowerCase();
          const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav'
          };
          result = {
            base64: base64,
            mimeType: mimeTypes[ext] || 'application/octet-stream'
          };
          break;
        }
          
        case 'read_multiple_files':
          result = await Promise.all(
            mcpParams.paths.map(async (filePath, index) => {
              try {
                const content = await mcp.readFileContent(filePath);
                return {
                  path: params.paths[index], // 返回原始相对路径
                  content: content,
                  success: true
                };
              } catch (error) {
                return {
                  path: params.paths[index],
                  error: error.message,
                  success: false
                };
              }
            })
          );
          break;
          
        case 'write_file': {
          // 自动创建父目录
          const fs = require('fs').promises;
          const dirPath = path.dirname(mcpParams.path);
          
          try {
            // 检查目录是否存在，不存在则创建
            await fs.access(dirPath);
          } catch {
            // 目录不存在，创建它
            await fs.mkdir(dirPath, { recursive: true });
            api?.logger?.info('Auto-created directory for write_file', { directory: dirPath });
          }
          
          await mcp.writeFileContent(mcpParams.path, params.content);
          result = {
            bytesWritten: Buffer.byteLength(params.content, 'utf-8'),
            path: params.path
          };
          break;
        }
          
        case 'edit_file':
          result = await mcp.applyFileEdits(mcpParams.path, params.edits, params.dryRun);
          if (!params.dryRun) {
            result = {
              editsApplied: params.edits.length,
              path: params.path
            };
          }
          break;
          
        case 'create_directory': {
          const fs2 = require('fs').promises;
          await fs2.mkdir(mcpParams.path, { recursive: true });
          result = { created: mcpParams.path };
          break;
        }
          
        case 'list_directory':
        case 'list_directory_with_sizes': {
          const fs3 = require('fs').promises;
          const entries = await fs3.readdir(mcpParams.path, { withFileTypes: true });
          
          if (params.method === 'list_directory') {
            result = entries.map(entry => ({
              name: entry.name,
              type: entry.isDirectory() ? 'directory' : 'file'
            }));
          } else {
            result = await Promise.all(
              entries.map(async (entry) => {
                const entryPath = path.join(mcpParams.path, entry.name);
                const stats = await fs3.stat(entryPath);
                return {
                  name: entry.name,
                  type: entry.isDirectory() ? 'directory' : 'file',
                  size: stats.size,
                  modified: stats.mtime
                };
              })
            );
            
            if (params.sortBy === 'size') {
              result.sort((a, b) => b.size - a.size);
            } else {
              result.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
          break;
        }
          
        case 'directory_tree': {
          // 构建目录树
          const buildTree = async (currentPath) => {
            const fs4 = require('fs').promises;
            const entries = await fs4.readdir(currentPath, { withFileTypes: true });
            const tree = [];
            
            for (const entry of entries) {
              const entryPath = path.join(currentPath, entry.name);
              const node = {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file'
              };
              
              if (entry.isDirectory()) {
                try {
                  node.children = await buildTree(entryPath);
                } catch (error) {
                  node.children = [];
                  node.error = error.message;
                }
              }
              
              tree.push(node);
            }
            
            return tree;
          };
          
          result = await buildTree(mcpParams.path);
          break;
        }
          
        case 'move_file': {
          const fs5 = require('fs').promises;
          await fs5.rename(mcpParams.source, mcpParams.destination);
          result = {
            from: params.source,
            to: params.destination
          };
          break;
        }
          
        case 'search_files': {
          // MCP的searchFilesWithValidation是垃圾，直接用glob
          const { glob } = await importx('glob');
          
          // 构造递归搜索模式
          let globPattern;
          if (params.pattern.includes('**')) {
            // 如果用户已经指定了递归模式，直接用
            globPattern = path.join(mcpParams.path, params.pattern);
          } else {
            // 否则添加递归搜索
            globPattern = path.join(mcpParams.path, '**', params.pattern);
          }
          
          const foundFiles = await glob(globPattern, {
            ignore: params.excludePatterns || [],
            dot: true
          });
          
          // 转换为相对路径（相对于第一个允许的目录）
          const baseDir = this._allowedDirectories?.[0] || this.getAllowedDirectories()[0];
          result = foundFiles.map(file => path.relative(baseDir, file));
          break;
        }
          
        case 'get_file_info':
          result = await mcp.getFileStats(mcpParams.path);
          break;
          
        default:
          throw new Error(`不支持的方法: ${params.method}`);
      }
      
      // 记录执行成功
      api?.logger?.info('Filesystem operation completed', { 
        method: params.method,
        success: true 
      });
      
      return result;
      
    } catch (error) {
      // 记录错误
      api?.logger?.error('Filesystem operation failed', { 
        method: params.method,
        error: error.message 
      });
      throw error;
    }
  }
};