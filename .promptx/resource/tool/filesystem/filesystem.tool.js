/**
 * Filesystem Tool - 统一的文件系统操作工具
 * 
 * 设计理念：
 * - 工具本身就是抽象层，通过 ToolSandbox 在不同环境执行
 * - 本地执行时操作本地文件，远程执行时操作远程文件
 * - 角色通过 @tool://filesystem 统一调用，无需关心执行位置
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

module.exports = {
  // 工具元信息
  getMetadata() {
    return {
      name: 'filesystem',
      description: '统一的文件系统操作工具，提供读写、搜索、编辑等文件操作功能',
      version: '1.0.0',
      category: 'utility',
      author: '鲁班',
      tags: ['file', 'system', 'io', 'resource'],
      manual: '@manual://filesystem'
    };
  },

  // 依赖声明 - 只使用 Node.js 内置模块
  getDependencies() {
    return []; // 无外部依赖
  },

  // 参数 Schema 定义
  getSchema() {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'list', 'list_with_sizes', 'search', 'edit', 'move', 'delete', 'exists', 'mkdir'],
          description: '操作类型'
        },
        path: {
          type: 'string',
          description: '文件或目录路径（相对于.promptx/）'
        },
        content: {
          type: 'string',
          description: '文件内容（write操作必需）'
        },
        pattern: {
          type: 'string',
          description: '搜索模式（search操作必需）'
        },
        edits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              oldText: { type: 'string' },
              newText: { type: 'string' }
            },
            required: ['oldText', 'newText']
          },
          description: '编辑操作列表（edit操作必需）'
        },
        source: {
          type: 'string',
          description: '源路径（move操作必需）'
        },
        destination: {
          type: 'string',
          description: '目标路径（move操作必需）'
        },
        head: {
          type: 'number',
          description: '读取前N行（read操作可选）'
        },
        tail: {
          type: 'number',
          description: '读取后N行（read操作可选）'
        },
        dryRun: {
          type: 'boolean',
          default: false,
          description: '仅预览不执行（edit操作可选）'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: '排除模式（search操作可选）'
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'size', 'mtime'],
          default: 'name',
          description: '排序方式（list_with_sizes操作可选）'
        },
        encoding: {
          type: 'string',
          default: 'utf8',
          description: '文件编码'
        }
      },
      required: ['action']
    };
  },

  // 参数验证
  validate(params) {
    const errors = [];
    
    if (!params.action) {
      errors.push('缺少必需参数: action');
    }

    // 根据 action 验证必需参数
    switch (params.action) {
      case 'write':
        if (!params.path) errors.push('write操作需要path参数');
        if (params.content === undefined) errors.push('write操作需要content参数');
        break;
      case 'read':
      case 'list':
      case 'list_with_sizes':
      case 'exists':
      case 'delete':
        if (!params.path) errors.push(`${params.action}操作需要path参数`);
        break;
      case 'search':
        if (!params.path) errors.push('search操作需要path参数');
        if (!params.pattern) errors.push('search操作需要pattern参数');
        break;
      case 'edit':
        if (!params.path) errors.push('edit操作需要path参数');
        if (!params.edits || !Array.isArray(params.edits)) {
          errors.push('edit操作需要edits数组');
        }
        break;
      case 'move':
        if (!params.source) errors.push('move操作需要source参数');
        if (!params.destination) errors.push('move操作需要destination参数');
        break;
      case 'mkdir':
        if (!params.path) errors.push('mkdir操作需要path参数');
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // 核心执行逻辑
  async execute(params) {
    // 重要：在 ToolSandbox 中执行时，我们需要找到实际的项目 .promptx 目录
    // 策略：向上查找包含 .promptx 的目录
    const findProjectRoot = () => {
      let currentPath = process.cwd();
      const maxLevels = 10; // 防止无限循环
      
      for (let i = 0; i < maxLevels; i++) {
        const promptxPath = path.join(currentPath, '.promptx');
        if (fs.existsSync(promptxPath) && fs.existsSync(path.join(promptxPath, 'resource'))) {
          // 找到了项目的 .promptx 目录
          return currentPath;
        }
        
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
          break; // 已到达根目录
        }
        currentPath = parentPath;
      }
      
      // 如果找不到，假设在项目根目录
      return process.cwd();
    };
    
    const projectPath = findProjectRoot();
    const promptxDir = path.join(projectPath, '.promptx');
    
    // 安全检查：防止路径遍历攻击
    const resolvePath = (relativePath) => {
      const resolved = path.resolve(promptxDir, relativePath);
      if (!resolved.startsWith(promptxDir)) {
        throw new Error(`路径越权: 不允许访问.promptx目录之外的文件`);
      }
      return resolved;
    };

    try {
      switch (params.action) {
        case 'write': {
          const filePath = resolvePath(params.path);
          const dir = path.dirname(filePath);
          
          // 确保目录存在
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // 写入文件
          fs.writeFileSync(filePath, params.content, params.encoding || 'utf8');
          
          return {
            success: true,
            data: {
              bytesWritten: Buffer.byteLength(params.content),
              path: params.path
            },
            message: `文件写入成功: ${params.path}`
          };
        }

        case 'read': {
          const filePath = resolvePath(params.path);
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${params.path}`);
          }
          
          let content = fs.readFileSync(filePath, params.encoding || 'utf8');
          
          // 处理 head/tail 参数
          if (params.head || params.tail) {
            const lines = content.split('\n');
            if (params.head) {
              content = lines.slice(0, params.head).join('\n');
            } else if (params.tail) {
              content = lines.slice(-params.tail).join('\n');
            }
          }
          
          return {
            success: true,
            data: content,
            message: `文件读取成功: ${params.path}`
          };
        }

        case 'list': {
          const dirPath = resolvePath(params.path);
          
          if (!fs.existsSync(dirPath)) {
            throw new Error(`目录不存在: ${params.path}`);
          }
          
          const items = fs.readdirSync(dirPath);
          
          return {
            success: true,
            data: items,
            message: `目录列表获取成功: ${params.path}`
          };
        }

        case 'list_with_sizes': {
          const dirPath = resolvePath(params.path);
          
          if (!fs.existsSync(dirPath)) {
            throw new Error(`目录不存在: ${params.path}`);
          }
          
          const items = await readdir(dirPath);
          const itemsWithStats = await Promise.all(
            items.map(async (item) => {
              const itemPath = path.join(dirPath, item);
              const stats = await stat(itemPath);
              return {
                name: item,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                mtime: stats.mtime
              };
            })
          );
          
          // 排序
          const sortBy = params.sortBy || 'name';
          itemsWithStats.sort((a, b) => {
            if (sortBy === 'size') return b.size - a.size;
            if (sortBy === 'mtime') return b.mtime - a.mtime;
            return a.name.localeCompare(b.name);
          });
          
          return {
            success: true,
            data: itemsWithStats,
            message: `目录详情获取成功: ${params.path}`
          };
        }

        case 'search': {
          const searchDir = resolvePath(params.path);
          const pattern = params.pattern;
          const excludePatterns = params.excludePatterns || [];
          
          const results = [];
          
          const searchRecursive = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
              const itemPath = path.join(dir, item);
              const relativePath = path.relative(promptxDir, itemPath);
              
              // 检查排除模式
              const shouldExclude = excludePatterns.some(pattern => 
                relativePath.includes(pattern.replace(/\*/g, ''))
              );
              
              if (shouldExclude) continue;
              
              const stats = fs.statSync(itemPath);
              
              if (stats.isDirectory()) {
                searchRecursive(itemPath);
              } else {
                // 简单的通配符匹配
                const regex = new RegExp(
                  pattern.replace(/\./g, '\\.')
                        .replace(/\*/g, '.*')
                        .replace(/\?/g, '.')
                );
                
                if (regex.test(item)) {
                  results.push(relativePath);
                }
              }
            }
          };
          
          if (fs.existsSync(searchDir)) {
            searchRecursive(searchDir);
          }
          
          return {
            success: true,
            data: results,
            message: `搜索完成，找到 ${results.length} 个匹配文件`
          };
        }

        case 'edit': {
          const filePath = resolvePath(params.path);
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${params.path}`);
          }
          
          let content = fs.readFileSync(filePath, params.encoding || 'utf8');
          const originalContent = content;
          const changes = [];
          
          // 执行编辑操作
          for (const edit of params.edits) {
            if (content.includes(edit.oldText)) {
              content = content.replace(edit.oldText, edit.newText);
              changes.push({
                old: edit.oldText,
                new: edit.newText,
                applied: true
              });
            } else {
              changes.push({
                old: edit.oldText,
                new: edit.newText,
                applied: false,
                reason: '未找到匹配的文本'
              });
            }
          }
          
          // 如果不是 dryRun 模式，保存文件
          if (!params.dryRun && content !== originalContent) {
            fs.writeFileSync(filePath, content, params.encoding || 'utf8');
          }
          
          return {
            success: true,
            data: {
              changes,
              dryRun: params.dryRun || false,
              modified: content !== originalContent
            },
            message: params.dryRun ? '预览模式，未实际修改' : '文件编辑成功'
          };
        }

        case 'move': {
          const sourcePath = resolvePath(params.source);
          const destPath = resolvePath(params.destination);
          
          if (!fs.existsSync(sourcePath)) {
            throw new Error(`源文件不存在: ${params.source}`);
          }
          
          // 确保目标目录存在
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          fs.renameSync(sourcePath, destPath);
          
          return {
            success: true,
            data: {
              from: params.source,
              to: params.destination
            },
            message: `文件移动成功: ${params.source} -> ${params.destination}`
          };
        }

        case 'delete': {
          const filePath = resolvePath(params.path);
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${params.path}`);
          }
          
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          
          return {
            success: true,
            data: {
              deleted: params.path,
              type: stats.isDirectory() ? 'directory' : 'file'
            },
            message: `删除成功: ${params.path}`
          };
        }

        case 'exists': {
          const filePath = resolvePath(params.path);
          const exists = fs.existsSync(filePath);
          
          let type = null;
          if (exists) {
            const stats = fs.statSync(filePath);
            type = stats.isDirectory() ? 'directory' : 'file';
          }
          
          return {
            success: true,
            data: {
              exists,
              type,
              path: params.path
            },
            message: exists ? `路径存在: ${params.path}` : `路径不存在: ${params.path}`
          };
        }

        case 'mkdir': {
          const dirPath = resolvePath(params.path);
          
          if (fs.existsSync(dirPath)) {
            return {
              success: true,
              data: {
                created: false,
                reason: 'already_exists'
              },
              message: `目录已存在: ${params.path}`
            };
          }
          
          fs.mkdirSync(dirPath, { recursive: true });
          
          return {
            success: true,
            data: {
              created: true,
              path: params.path
            },
            message: `目录创建成功: ${params.path}`
          };
        }

        default:
          throw new Error(`不支持的操作类型: ${params.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code || 'EXECUTION_ERROR',
          message: error.message,
          details: error.stack
        }
      };
    }
  }
};