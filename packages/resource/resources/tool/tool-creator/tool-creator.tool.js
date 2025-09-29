/**
 * Tool Creator - PromptX工具资源的专用创作工具
 * 
 * 战略意义：
 * 1. 开发效率提升：将工具创建从技术操作简化为业务操作
 * 2. 质量保证：内置验证机制确保工具符合PromptX规范
 * 3. 生态统一：与role-creator形成统一的创作工具体系
 * 
 * 设计理念：
 * 采用与role-creator相同的4参数设计（tool/action/file/content），
 * 让鲁班等工具开发者能像操作对象一样操作工具资源。
 * 特别增加了validate action，确保工具质量和可用性。
 * 
 * 生态定位：
 * 作为鲁班等工具开发角色的核心工具，与role-creator并列，
 * 共同构成PromptX的创作工具体系。
 */

module.exports = {
  /**
   * 获取工具依赖
   */
  getDependencies() {
    return {
      'acorn': '^8.11.0'  // JavaScript语法解析器，用于验证
    };
  },

  /**
   * 获取工具元信息
   */
  getMetadata() {
    return {
      id: 'tool-creator',
      name: 'Tool Creator',
      description: 'PromptX工具资源的CRUD和验证工具，简化工具开发流程',
      version: '1.0.0',
      category: 'creation',
      author: '鲁班',
      tags: ['tool', 'creation', 'crud', 'validation', 'promptx'],
      scenarios: [
        '创建新工具',
        '更新工具代码',
        '验证工具完整性',
        '管理工具文件'
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
          tool: {
            type: 'string',
            description: '工具ID，如：weather, text-processor',
            pattern: '^[a-z][a-z0-9-]*$',
            minLength: 2,
            maxLength: 50
          },
          action: {
            type: 'string',
            description: '操作类型',
            enum: ['write', 'read', 'delete', 'list', 'exists', 'validate', 'edit']
          },
          file: {
            type: 'string',
            description: '相对于工具目录的文件路径，如：tool-name.tool.js',
            maxLength: 200
          },
          content: {
            type: 'string',
            description: '文件内容（write操作时必需）',
            maxLength: 500000  // 500KB limit
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
        required: ['tool', 'action'],
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
        code: 'TOOL_NOT_FOUND',
        description: '工具不存在',
        match: /tool.*not.*found/i,
        solution: '请先创建工具主文件',
        retryable: false
      },
      {
        code: 'INVALID_JAVASCRIPT',
        description: 'JavaScript语法错误',
        match: /SyntaxError|ParseError/i,
        solution: '检查JavaScript语法',
        retryable: false
      },
      {
        code: 'MISSING_METHOD',
        description: '缺少必需的方法',
        match: /missing.*method/i,
        solution: '添加缺失的接口方法',
        retryable: false
      },
      {
        code: 'INVALID_SCHEMA',
        description: 'Schema定义无效',
        match: /invalid.*schema/i,
        solution: '检查getSchema返回的JSON Schema格式',
        retryable: false
      }
    ];
  },

  /**
   * 获取工具资源的完整路径
   */
  getToolPath(tool, file = '') {
    const path = require('path');
    const os = require('os');
    
    // 基础路径：~/.promptx/resource/tool/{tool}/
    const baseDir = path.join(
      os.homedir(),
      '.promptx',
      'resource',
      'tool',
      tool
    );
    
    return file ? path.join(baseDir, file) : baseDir;
  },

  /**
   * 验证文件路径的合法性
   */
  validateFilePath(file) {
    if (!file) return true;
    
    // 工具文件必须以.tool.js结尾
    if (!file.endsWith('.tool.js') && !file.endsWith('.js')) {
      throw new Error('Tool files must end with .tool.js or .js');
    }
    
    return true;
  },

  /**
   * 应用编辑操作（参照role-creator的edit实现）
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
   * 验证工具的完整性和正确性
   */
  async validateTool(toolPath, api) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const issues = [];
    let valid = true;
    
    try {
      // 查找主文件
      const files = await fs.readdir(toolPath);
      const toolFiles = files.filter(f => f.endsWith('.tool.js'));
      
      if (toolFiles.length === 0) {
        issues.push('No .tool.js file found');
        return { valid: false, issues, ready: false };
      }
      
      const mainFile = toolFiles[0];
      const filePath = path.join(toolPath, mainFile);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 1. 检查JavaScript语法
      try {
        const acorn = await api.importx('acorn');
        acorn.parse(content, { 
          ecmaVersion: 2020,
          sourceType: 'module',
          allowReturnOutsideFunction: true
        });
      } catch (syntaxError) {
        issues.push(`Syntax error: ${syntaxError.message}`);
        valid = false;
      }
      
      // 2. 检查必需的方法
      const requiredMethods = [
        'getDependencies',
        'getMetadata',
        'getSchema',
        'execute'
      ];
      
      for (const method of requiredMethods) {
        const methodRegex = new RegExp(`${method}\\s*\\(`);
        if (!content.match(methodRegex)) {
          issues.push(`Missing required method: ${method}`);
          valid = false;
        }
      }
      
      // 3. 检查module.exports
      if (!content.includes('module.exports')) {
        issues.push('Missing module.exports');
        valid = false;
      }
      
      // 4. 检查getMetadata中的id字段（基于文本分析）
      if (valid) {
        const getMetadataMatch = content.match(/getMetadata\s*\(\s*\)\s*{\s*return\s*({[\s\S]*?})\s*;?\s*}/);
        if (getMetadataMatch) {
          const metadataContent = getMetadataMatch[1];
          if (!metadataContent.includes('id:') && !metadataContent.includes('"id"') && !metadataContent.includes("'id'")) {
            issues.push('getMetadata must return an object with "id" property');
            valid = false;
          }
        }
      }
      
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      valid = false;
    }
    
    return {
      valid,
      issues,
      ready: valid && issues.length === 0
    };
  },

  /**
   * 执行工具
   */
  async execute(params) {
    const { api } = this;
    const { tool, action, file, content, edits, dryRun = false } = params;
    
    // 记录操作
    api.logger.info(`Executing tool-creator`, { tool, action, file: file || 'root' });
    
    // 验证文件路径（write时）
    if (file && action === 'write') {
      this.validateFilePath(file);
    }
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      switch (action) {
        case 'write': {
          const fullPath = this.getToolPath(tool, file);
          const dir = path.dirname(fullPath);
          
          // 自动创建目录结构
          await fs.mkdir(dir, { recursive: true });
          api.logger.debug(`Directory ensured: ${dir}`);
          
          // 写入文件
          await fs.writeFile(fullPath, content, 'utf-8');
          api.logger.info(`File written successfully`, { path: fullPath, size: content.length });
          
          return {
            success: true,
            path: `tool/${tool}/${file}`,
            bytesWritten: Buffer.byteLength(content, 'utf-8')
          };
        }
        
        case 'read': {
          const fullPath = this.getToolPath(tool, file);
          
          // 检查文件是否存在
          try {
            await fs.access(fullPath);
          } catch {
            throw new Error(`File not found: tool/${tool}/${file}`);
          }
          
          // 读取文件
          const content = await fs.readFile(fullPath, 'utf-8');
          api.logger.info(`File read successfully`, { path: fullPath, size: content.length });
          
          return {
            success: true,
            content,
            path: `tool/${tool}/${file}`
          };
        }
        
        case 'delete': {
          const fullPath = this.getToolPath(tool, file);
          
          // 检查是否为目录
          const stats = await fs.stat(fullPath).catch(() => null);
          if (!stats) {
            throw new Error(`Path not found: tool/${tool}/${file || ''}`);
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
            deleted: `tool/${tool}/${file || ''}`
          };
        }
        
        case 'list': {
          const dirPath = this.getToolPath(tool, file || '');
          
          // 检查目录是否存在
          try {
            await fs.access(dirPath);
          } catch {
            // 目录不存在时返回空列表
            return {
              success: true,
              path: `tool/${tool}/${file || ''}`,
              entries: []
            };
          }
          
          // 读取目录内容
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          // 格式化输出
          const result = entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: file ? `${file}/${entry.name}` : entry.name,
            isToolFile: entry.name.endsWith('.tool.js')
          }));
          
          // 排序：.tool.js文件优先，然后按名称
          result.sort((a, b) => {
            if (a.isToolFile !== b.isToolFile) {
              return a.isToolFile ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          
          api.logger.info(`Directory listed`, { path: dirPath, count: result.length });
          
          return {
            success: true,
            path: `tool/${tool}/${file || ''}`,
            entries: result
          };
        }
        
        case 'exists': {
          const fullPath = this.getToolPath(tool, file || '');
          
          try {
            await fs.access(fullPath);
            const stats = await fs.stat(fullPath);
            
            return {
              success: true,
              exists: true,
              type: stats.isDirectory() ? 'directory' : 'file',
              path: `tool/${tool}/${file || ''}`
            };
          } catch {
            return {
              success: true,
              exists: false,
              path: `tool/${tool}/${file || ''}`
            };
          }
        }
        
        case 'edit': {
          const fullPath = this.getToolPath(tool, file);

          // 检查文件是否存在
          try {
            await fs.access(fullPath);
          } catch {
            throw new Error(`File not found: tool/${tool}/${file}`);
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
            path: `tool/${tool}/${file}`
          };
        }

        case 'validate': {
          const toolPath = this.getToolPath(tool);

          // 检查工具目录是否存在
          try {
            await fs.access(toolPath);
          } catch {
            return {
              success: true,
              valid: false,
              issues: ['Tool directory not found'],
              ready: false
            };
          }

          // 执行验证
          const validationResult = await this.validateTool(toolPath, api);
          api.logger.info(`Tool validation completed`, {
            tool,
            valid: validationResult.valid,
            issueCount: validationResult.issues.length
          });

          return {
            success: true,
            ...validationResult
          };
        }
        
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      api.logger.error(`Operation failed`, { error: error.message, tool, action, file });
      throw error;
    }
  }
};
