/**
 * Role Creator - PromptX角色资源的专用创作工具
 * 
 * 战略意义：
 * 1. 降低创作门槛：将复杂的文件操作简化为业务语义操作
 * 2. 提升AI效率：减少AI理解filesystem的认知负担，聚焦角色创作
 * 3. 保证一致性：统一角色资源的目录结构和文件命名规范
 * 
 * 设计理念：
 * 采用极简的4参数设计（role/action/file/content），让AI能够
 * 像操作对象一样操作角色资源，而不是处理复杂的文件路径。
 * 这是对filesystem的语义化封装，专为角色创作场景优化。
 * 
 * 生态定位：
 * 作为女娲等创作型角色的核心工具，与filesystem形成互补：
 * filesystem提供底层能力，role-creator提供业务抽象。
 */

module.exports = {
  /**
   * 获取工具依赖
   */
  getDependencies() {
    return {
      // 无需额外依赖，使用Node.js内置模块
    };
  },

  /**
   * 获取工具元信息
   */
  getMetadata() {
    return {
      id: 'role-creator',
      name: 'Role Creator',
      description: 'PromptX角色资源的CRUD操作工具，简化角色创作流程',
      version: '1.1.0',
      category: 'creation',
      author: '鲁班',
      tags: ['role', 'creation', 'crud', 'promptx'],
      scenarios: [
        '创建新角色',
        '添加思维/执行/知识文件',
        '更新角色配置',
        '精确编辑角色内容',
        '管理角色资源结构'
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
          role: {
            type: 'string',
            description: '角色ID，如：assistant, nuwa, luban',
            pattern: '^[a-z][a-z0-9-]*$',
            minLength: 2,
            maxLength: 50
          },
          action: {
            type: 'string',
            description: '操作类型',
            enum: ['write', 'read', 'delete', 'list', 'exists', 'edit']
          },
          file: {
            type: 'string',
            description: '相对于角色目录的文件路径，如：assistant.role.md, thought/thinking.thought.md',
            maxLength: 200
          },
          content: {
            type: 'string',
            description: '文件内容（write操作时必需）',
            maxLength: 100000
          },
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
          dryRun: {
            type: 'boolean',
            description: '仅预览不执行（edit操作时可选）',
            default: false
          }
        },
        required: ['role', 'action'],
        // 根据action动态验证其他参数
        allOf: [
          {
            if: { properties: { action: { const: 'write' } } },
            then: { required: ['file', 'content'] }
          },
          {
            if: { properties: { action: { enum: ['read', 'delete', 'exists'] } } },
            then: { required: ['file'] }
          },
          {
            if: { properties: { action: { const: 'edit' } } },
            then: { required: ['file', 'edits'] }
          }
        ]
      }
    };
  },

  /**
   * 获取业务错误定义
   */
  getBusinessErrors() {
    return [
      {
        code: 'ROLE_NOT_FOUND',
        description: '角色不存在',
        match: /role.*not.*found/i,
        solution: '请先创建角色主文件',
        retryable: false
      },
      {
        code: 'INVALID_FILE_TYPE',
        description: '无效的文件类型',
        match: /invalid.*file.*type/i,
        solution: '文件必须以.role.md, .thought.md, .execution.md或.knowledge.md结尾',
        retryable: false
      },
      {
        code: 'FILE_EXISTS',
        description: '文件已存在',
        match: /file.*exists/i,
        solution: '使用不同的文件名或先删除现有文件',
        retryable: false
      },
      {
        code: 'EDIT_FAILED',
        description: '编辑操作失败',
        match: /edit.*failed|text.*not.*found/i,
        solution: '检查要替换的文本是否完全匹配',
        retryable: false
      }
    ];
  },

  /**
   * 获取角色资源的完整路径
   */
  getRolePath(role, file = '') {
    const path = require('path');
    const os = require('os');
    
    // 基础路径：~/.promptx/resource/role/{role}/
    const baseDir = path.join(
      os.homedir(),
      '.promptx',
      'resource',
      'role',
      role
    );
    
    return file ? path.join(baseDir, file) : baseDir;
  },

  /**
   * 验证文件路径的合法性
   */
  validateFilePath(file) {
    if (!file) return true;
    
    // 检查文件扩展名
    const validExtensions = [
      '.role.md',
      '.thought.md',
      '.execution.md',
      '.knowledge.md'
    ];
    
    const hasValidExtension = validExtensions.some(ext => file.endsWith(ext));
    
    // 允许目录操作（list时）
    if (file.endsWith('/') || !file.includes('.')) {
      return true;
    }
    
    if (!hasValidExtension) {
      throw new Error(`Invalid file type. File must end with one of: ${validExtensions.join(', ')}`);
    }
    
    return true;
  },

  /**
   * 应用编辑操作（参照filesystem的edit实现）
   */
  async applyEdits(filePath, edits, dryRun = false) {
    const fs = require('fs').promises;

    // 读取原始文件内容
    let content;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }

    const originalContent = content;
    let appliedEdits = 0;
    const editResults = [];

    // 按顺序应用每个编辑
    for (const edit of edits) {
      const { oldText, newText } = edit;

      if (content.includes(oldText)) {
        // 只替换第一次出现的位置
        const index = content.indexOf(oldText);
        content = content.substring(0, index) + newText + content.substring(index + oldText.length);
        appliedEdits++;

        editResults.push({
          success: true,
          oldText: oldText.substring(0, 50) + (oldText.length > 50 ? '...' : ''),
          newText: newText.substring(0, 50) + (newText.length > 50 ? '...' : ''),
          position: index
        });
      } else {
        editResults.push({
          success: false,
          oldText: oldText.substring(0, 50) + (oldText.length > 50 ? '...' : ''),
          newText: newText.substring(0, 50) + (newText.length > 50 ? '...' : ''),
          error: 'Text not found'
        });
      }
    }

    // 如果不是dry run，写入文件
    if (!dryRun && appliedEdits > 0) {
      await fs.writeFile(filePath, content, 'utf-8');
    }

    return {
      success: true,
      appliedEdits,
      totalEdits: edits.length,
      dryRun,
      changes: content !== originalContent,
      editResults
    };
  },

  /**
   * 执行工具
   */
  async execute(params) {
    const { api } = this;
    const { role, action, file, content, edits, dryRun = false } = params;
    
    // 记录操作
    api.logger.info(`Executing role-creator`, { role, action, file: file || 'root' });
    
    // 验证文件路径
    if (file && ['write', 'edit'].includes(action)) {
      this.validateFilePath(file);
    }
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      switch (action) {
        case 'write': {
          const fullPath = this.getRolePath(role, file);
          const dir = path.dirname(fullPath);
          
          // 自动创建目录结构
          await fs.mkdir(dir, { recursive: true });
          api.logger.debug(`Directory ensured: ${dir}`);
          
          // 写入文件
          await fs.writeFile(fullPath, content, 'utf-8');
          api.logger.info(`File written successfully`, { path: fullPath, size: content.length });
          
          return {
            success: true,
            path: `role/${role}/${file}`,
            bytesWritten: Buffer.byteLength(content, 'utf-8')
          };
        }

        case 'edit': {
          const fullPath = this.getRolePath(role, file);

          // 检查文件是否存在
          try {
            await fs.access(fullPath);
          } catch {
            throw new Error(`File not found: role/${role}/${file}`);
          }

          // 应用编辑操作
          const result = await this.applyEdits(fullPath, edits, dryRun);

          api.logger.info(`Edit operation completed`, {
            path: fullPath,
            appliedEdits: result.appliedEdits,
            totalEdits: result.totalEdits,
            dryRun
          });

          return {
            ...result,
            path: `role/${role}/${file}`
          };
        }

        case 'read': {
          const fullPath = this.getRolePath(role, file);
          
          // 检查文件是否存在
          try {
            await fs.access(fullPath);
          } catch {
            throw new Error(`File not found: role/${role}/${file}`);
          }
          
          // 读取文件
          const content = await fs.readFile(fullPath, 'utf-8');
          api.logger.info(`File read successfully`, { path: fullPath, size: content.length });
          
          return {
            success: true,
            content,
            path: `role/${role}/${file}`
          };
        }
        
        case 'delete': {
          const fullPath = this.getRolePath(role, file);
          
          // 检查是否为目录
          const stats = await fs.stat(fullPath).catch(() => null);
          if (!stats) {
            throw new Error(`Path not found: role/${role}/${file}`);
          }
          
          if (stats.isDirectory()) {
            // 递归删除目录
            await fs.rm(fullPath, { recursive: true, force: true });
            api.logger.info(`Directory deleted`, { path: fullPath });
          } else {
            // 删除文件
            await fs.unlink(fullPath);
            api.logger.info(`File deleted`, { path: fullPath });
          }
          
          return {
            success: true,
            deleted: `role/${role}/${file}`
          };
        }
        
        case 'list': {
          const dirPath = this.getRolePath(role, file || '');
          
          // 检查目录是否存在
          try {
            await fs.access(dirPath);
          } catch {
            // 目录不存在时返回空列表
            return {
              success: true,
              path: `role/${role}/${file || ''}`,
              entries: []
            };
          }
          
          // 读取目录内容
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          // 格式化输出
          const result = entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: file ? `${file}/${entry.name}` : entry.name
          }));
          
          // 排序：目录优先，然后按名称
          result.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          
          api.logger.info(`Directory listed`, { path: dirPath, count: result.length });
          
          return {
            success: true,
            path: `role/${role}/${file || ''}`,
            entries: result
          };
        }
        
        case 'exists': {
          const fullPath = this.getRolePath(role, file || '');
          
          try {
            await fs.access(fullPath);
            const stats = await fs.stat(fullPath);
            
            return {
              success: true,
              exists: true,
              type: stats.isDirectory() ? 'directory' : 'file',
              path: `role/${role}/${file || ''}`
            };
          } catch {
            return {
              success: true,
              exists: false,
              path: `role/${role}/${file || ''}`
            };
          }
        }
        
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      api.logger.error(`Operation failed`, { error: error.message, role, action, file });
      throw error;
    }
  }
};
