/**
 * Filesystem Tool
 * 
 * 基于 @modelcontextprotocol/server-filesystem 的文件系统操作工具
 * 提供统一的文件操作接口，自动适配PromptX服务所在环境
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

module.exports = {
  /**
   * 获取工具依赖
   * MCP filesystem是ES Module包，需要动态加载
   */
  getDependencies() {
    return {
      '@modelcontextprotocol/server-filesystem': '^2025.7.29',
      'diff': '^5.1.0',
      'glob': '^10.3.10',
      'minimatch': '^10.0.1'
    };
  },

  /**
   * 获取工具元信息
   */
  getMetadata() {
    return {
      name: 'filesystem',
      description: '统一的文件系统操作工具，提供读写、搜索、编辑等文件操作功能',
      version: '1.0.0',
      category: 'system',
      author: '鲁班',
      tags: ['file', 'system', 'io'],
      manual: '@manual://filesystem'
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
        // 以下参数根据method动态使用
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
   * 执行工具
   */
  async execute(params) {
    try {
      // 验证参数
      const validation = this.validate(params);
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
      }

      // 获取基础路径（~/.promptx）
      const basePath = path.join(os.homedir(), '.promptx');
      
      // 路径处理函数
      const resolvePath = (relativePath) => {
        if (!relativePath) return basePath;
        // 如果路径以/开头，说明是绝对路径，检查是否在允许范围内
        if (path.isAbsolute(relativePath)) {
          if (!relativePath.startsWith(basePath)) {
            throw new Error(`路径越权: ${relativePath} 不在 ${basePath} 内`);
          }
          return relativePath;
        }
        // 相对路径，基于basePath解析
        const fullPath = path.join(basePath, relativePath);
        const resolved = path.resolve(fullPath);
        // 安全检查：确保解析后的路径仍在basePath内
        if (!resolved.startsWith(basePath)) {
          throw new Error(`路径越权: ${relativePath} 解析后超出 ${basePath}`);
        }
        return resolved;
      };

      // 根据method执行对应操作
      switch (params.method) {
        case 'read_text_file': {
          const filePath = resolvePath(params.path);
          
          // 处理head和tail参数
          if (params.head && params.tail) {
            throw new Error('不能同时指定head和tail参数');
          }
          
          let content;
          if (params.head) {
            // 读取前N行
            const fullContent = await fs.readFile(filePath, 'utf-8');
            const lines = fullContent.split('\n');
            content = lines.slice(0, params.head).join('\n');
          } else if (params.tail) {
            // 读取后N行
            const fullContent = await fs.readFile(filePath, 'utf-8');
            const lines = fullContent.split('\n');
            content = lines.slice(-params.tail).join('\n');
          } else {
            // 读取完整内容
            content = await fs.readFile(filePath, 'utf-8');
          }
          
          // 直接返回内容，ToolSandbox会包装success结构
          return content;
        }

        case 'read_media_file': {
          const filePath = resolvePath(params.path);
          const buffer = await fs.readFile(filePath);
          const base64 = buffer.toString('base64');
          
          // 根据扩展名确定MIME类型
          const ext = path.extname(filePath).toLowerCase();
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
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          
          // 直接返回数据对象
          return {
            base64: base64,
            mimeType: mimeType
          };
        }

        case 'read_multiple_files': {
          const results = await Promise.all(
            params.paths.map(async (relativePath) => {
              try {
                const filePath = resolvePath(relativePath);
                const content = await fs.readFile(filePath, 'utf-8');
                return {
                  path: relativePath,
                  content: content,
                  success: true
                };
              } catch (error) {
                return {
                  path: relativePath,
                  error: error.message,
                  success: false
                };
              }
            })
          );
          
          // 直接返回结果数组
          return results;
        }

        case 'write_file': {
          const filePath = resolvePath(params.path);
          
          // 确保目录存在
          const dir = path.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          
          // 写入文件
          await fs.writeFile(filePath, params.content, 'utf-8');
          
          // 返回写入的字节数
          return {
            bytesWritten: Buffer.byteLength(params.content, 'utf-8'),
            path: params.path
          };
        }

        case 'edit_file': {
          const filePath = resolvePath(params.path);
          let content = await fs.readFile(filePath, 'utf-8');
          let originalContent = content;
          
          // 应用编辑
          for (const edit of params.edits) {
            if (!content.includes(edit.oldText)) {
              throw new Error(`找不到要替换的文本: "${edit.oldText}"`);
            }
            content = content.replace(edit.oldText, edit.newText);
          }
          
          if (params.dryRun) {
            // 仅预览，返回差异
            // 预览模式返回差异
            return {
              dryRun: true,
              original: originalContent,
              modified: content,
              changes: params.edits
            };
          } else {
            // 实际写入
            await fs.writeFile(filePath, content, 'utf-8');
            // 返回应用的编辑数
            return {
              editsApplied: params.edits.length,
              path: params.path
            };
          }
        }

        case 'create_directory': {
          const dirPath = resolvePath(params.path);
          await fs.mkdir(dirPath, { recursive: true });
          
          // 返回创建的目录路径
          return {
            created: dirPath
          };
        }

        case 'list_directory': {
          const dirPath = resolvePath(params.path);
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          const result = entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file'
          }));
          
          // 直接返回目录列表
          return result;
        }

        case 'list_directory_with_sizes': {
          const dirPath = resolvePath(params.path);
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          const result = await Promise.all(
            entries.map(async (entry) => {
              const entryPath = path.join(dirPath, entry.name);
              const stats = await fs.stat(entryPath);
              return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime
              };
            })
          );
          
          // 排序
          if (params.sortBy === 'size') {
            result.sort((a, b) => b.size - a.size);
          } else {
            result.sort((a, b) => a.name.localeCompare(b.name));
          }
          
          // 直接返回带大小的目录列表
          return result;
        }

        case 'directory_tree': {
          const dirPath = resolvePath(params.path);
          
          const buildTree = async (currentPath) => {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
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
          
          const tree = await buildTree(dirPath);
          
          // 直接返回目录树
          return tree;
        }

        case 'move_file': {
          const sourcePath = resolvePath(params.source);
          const destPath = resolvePath(params.destination);
          
          // 检查源文件是否存在
          await fs.access(sourcePath);
          
          // 确保目标目录存在
          const destDir = path.dirname(destPath);
          await fs.mkdir(destDir, { recursive: true });
          
          // 移动文件
          await fs.rename(sourcePath, destPath);
          
          // 返回移动信息
          return { 
            from: params.source,
            to: params.destination
          };
        }

        case 'search_files': {
          const searchPath = resolvePath(params.path);
          const { glob } = await this.loadModule('glob');
          
          // 构建glob模式
          const pattern = path.join(searchPath, '**', params.pattern);
          
          // 搜索文件
          const files = await glob(pattern, {
            ignore: params.excludePatterns || [],
            nodir: false
          });
          
          // 转换为相对路径
          const results = files.map(file => 
            path.relative(basePath, file)
          );
          
          // 直接返回搜索结果
          return results;
        }

        case 'get_file_info': {
          const filePath = resolvePath(params.path);
          const stats = await fs.stat(filePath);
          
          // 直接返回文件信息
          return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            permissions: stats.mode.toString(8).slice(-3)
          };
        }

        case 'list_allowed_directories': {
          // 直接返回允许的目录列表
          return [basePath];
        }

        default:
          throw new Error(`不支持的方法: ${params.method}`);
      }
    } catch (error) {
      // 直接抛出错误，让ToolSandbox处理
      throw error;
    }
  },

  /**
   * 动态加载模块（支持ES Module）
   * ToolSandbox会提供这个方法
   */
  async loadModule(moduleName) {
    // 这个方法会由ToolSandbox注入
    // 支持CommonJS和ES Module的统一加载
    if (this.require) {
      return await this.require(moduleName);
    }
    throw new Error('loadModule方法未注入，请确保在ToolSandbox环境中运行');
  }
};