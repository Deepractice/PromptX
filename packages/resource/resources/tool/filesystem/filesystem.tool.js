/**
 * Filesystem Tool - MCP Wrapper Version
 * 
 * 包装 @modelcontextprotocol/server-filesystem 实现
 * 添加PromptX特定的路径安全限制（只允许访问~/.promptx）
 * 
 * 架构优势：
 * 1. 复用MCP官方实现，减少维护成本
 * 2. 继承MCP的所有安全机制和bug修复
 * 3. 代码量从500行减至100行以内
 * 4. 依赖从4个减至1个核心依赖
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
      name: 'filesystem',
      description: '基于MCP标准的文件系统操作工具，提供读写、搜索、编辑等功能',
      version: '2.0.0',
      category: 'system',
      author: '鲁班',
      tags: ['file', 'system', 'io', 'mcp']
    };
  },

  /**
   * 获取参数Schema
   */
  getSchema() {
    return {
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
          description: '编辑操作列表',
          items: {
            type: 'object',
            properties: {
              oldText: { type: 'string' },
              newText: { type: 'string' }
            }
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
    };
  },

  /**
   * 参数验证
   */
  validate(params) {
    // 首先检查params是否存在
    if (!params || typeof params !== 'object') {
      return { 
        valid: false, 
        errors: ['参数必须是一个对象'] 
      };
    }
    
    if (!params.method) {
      return { 
        valid: false, 
        errors: ['缺少必需参数: method'] 
      };
    }

    // 根据不同的method验证必需参数
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
      return { 
        valid: false, 
        errors: [`不支持的方法: ${params.method}`] 
      };
    }

    const missing = required.filter(field => !params[field]);
    if (missing.length > 0) {
      return { 
        valid: false, 
        errors: [`缺少必需参数: ${missing.join(', ')}`] 
      };
    }

    return { valid: true, errors: [] };
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
      
      // 获取基础路径
      const basePath = path.join(os.homedir(), '.promptx');
      
      // 设置允许的目录（只允许~/.promptx）
      mcpModule.setAllowedDirectories([basePath]);
      
      this._mcpInstance = mcpModule;
      this._basePath = basePath;
    }
    return this._mcpInstance;
  },

  /**
   * PromptX特定的路径处理
   * 将相对路径转换为基于~/.promptx的绝对路径
   */
  resolvePromptXPath(inputPath) {
    if (!inputPath) return this._basePath;
    
    const basePath = this._basePath || path.join(os.homedir(), '.promptx');
    
    // 如果是绝对路径，确保在允许范围内
    if (path.isAbsolute(inputPath)) {
      if (!inputPath.startsWith(basePath)) {
        throw new Error(`路径越权: ${inputPath} 不在 ${basePath} 内`);
      }
      return inputPath;
    }
    
    // 相对路径，基于basePath解析
    const fullPath = path.join(basePath, inputPath);
    const resolved = path.resolve(fullPath);
    
    // 安全检查
    if (!resolved.startsWith(basePath)) {
      throw new Error(`路径越权: ${inputPath} 解析后超出 ${basePath}`);
    }
    
    return resolved;
  },

  /**
   * 执行工具 - 包装MCP实现
   */
  async execute(params) {
    // 验证参数
      const validation = this.validate(params);
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
      }

      // 获取MCP实例
      const mcp = await this.getMCPInstance();
      
      // 特殊处理list_allowed_directories
      if (params.method === 'list_allowed_directories') {
        return [this._basePath];
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
          
        case 'write_file':
          await mcp.writeFileContent(mcpParams.path, params.content);
          result = {
            bytesWritten: Buffer.byteLength(params.content, 'utf-8'),
            path: params.path
          };
          break;
          
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
          
          // 转换为相对路径
          const basePath = this._basePath;
          result = foundFiles.map(file => path.relative(basePath, file));
          break;
        }
          
        case 'get_file_info':
          result = await mcp.getFileStats(mcpParams.path);
          break;
          
        default:
          throw new Error(`不支持的方法: ${params.method}`);
      }
      
      return result;
  }
};