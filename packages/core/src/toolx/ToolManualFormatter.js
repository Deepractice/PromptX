/**
 * ToolManualFormatter
 * 
 * 负责从工具实例和源码生成Markdown格式的工具手册
 * 
 * 主要功能：
 * 1. 提取工具的metadata、schema、dependencies
 * 2. 从源码中提取注释文档
 * 3. 生成格式化的Markdown手册
 */

const extractComments = require('extract-comments')

class ToolManualFormatter {
  constructor() {
    // 简化版，无需配置
  }

  /**
   * 生成工具手册
   * @param {Object} toolInstance - 工具实例
   * @param {string} toolResource - 工具资源引用 (@tool://xxx)
   * @param {string} sourceCode - 工具源代码（可选）
   * @returns {string} Markdown格式的手册
   */
  format(toolInstance, toolResource, sourceCode = null) {
    // 提取工具信息
    const metadata = this.safeGet(toolInstance, 'getMetadata')
    const schema = this.safeGet(toolInstance, 'getSchema')
    const dependencies = this.safeGet(toolInstance, 'getDependencies')
    const businessErrors = this.safeGet(toolInstance, 'getBusinessErrors')
    
    // 提取源码注释
    const comments = sourceCode ? this.extractComments(sourceCode) : null
    
    // 构建Markdown
    return this.buildMarkdown({
      resource: toolResource,
      metadata,
      schema,
      dependencies,
      businessErrors,
      comments,
      toolInstance
    })
  }

  /**
   * 安全调用工具方法
   */
  safeGet(instance, methodName) {
    try {
      return typeof instance[methodName] === 'function' 
        ? instance[methodName]() 
        : null
    } catch (error) {
      return null
    }
  }

  /**
   * 提取源码中的注释
   */
  extractComments(sourceCode) {
    try {
      const comments = extractComments(sourceCode)
      
      // 查找文件顶部的块注释（通常是主要文档）
      const blockComment = comments.find(c => c.type === 'BlockComment' && c.loc.start.line <= 10)
      
      if (blockComment) {
        // 清理注释内容，去掉星号前缀
        return blockComment.value
          .split('\n')
          .map(line => line.replace(/^\s*\*\s?/, ''))
          .join('\n')
          .trim()
      }
      
      // 如果没有块注释，尝试收集多个行注释
      const lineComments = comments
        .filter(c => c.type === 'LineComment' && c.loc.start.line <= 20)
        .map(c => c.value.trim())
        .join('\n')
      
      return lineComments || null
    } catch (error) {
      return null
    }
  }

  /**
   * 构建Markdown文档
   */
  buildMarkdown(data) {
    const sections = []
    const { metadata, schema, dependencies, businessErrors, comments, resource, toolInstance } = data
    
    // 1. 标题和基础信息
    const title = metadata?.name || metadata?.id || resource.replace('@tool://', '')
    sections.push(`# 🔧 ${title}`)
    
    // 描述
    if (metadata?.description) {
      sections.push(`\n> ${metadata.description}`)
    }
    
    // 2. 源码注释（如果有）
    if (comments) {
      sections.push(`\n## 📝 详细说明\n\n${comments}`)
    }
    
    // 3. 基础信息
    const infoLines = []
    if (metadata?.id) infoLines.push(`- **标识**: \`${resource}\``)
    if (metadata?.version) infoLines.push(`- **版本**: ${metadata.version}`)
    if (metadata?.category) infoLines.push(`- **分类**: ${metadata.category}`)
    if (metadata?.author) infoLines.push(`- **作者**: ${metadata.author}`)
    if (metadata?.tags?.length > 0) infoLines.push(`- **标签**: ${metadata.tags.join(', ')}`)
    
    if (infoLines.length > 0) {
      sections.push(`\n## 📋 基础信息\n\n${infoLines.join('\n')}`)
    }
    
    // 4. 使用场景
    if (metadata?.scenarios?.length > 0) {
      sections.push(`\n## ✅ 适用场景\n\n${metadata.scenarios.map(s => `- ${s}`).join('\n')}`)
    }
    
    // 5. 限制说明
    if (metadata?.limitations?.length > 0) {
      sections.push(`\n## ⚠️ 限制说明\n\n${metadata.limitations.map(l => `- ${l}`).join('\n')}`)
    }
    
    // 6. 参数定义
    if (schema?.parameters) {
      sections.push(this.formatParameters(schema.parameters))
    }
    
    // 7. 环境变量
    if (schema?.environment) {
      sections.push(this.formatEnvironment(schema.environment))
    }
    
    // 8. 依赖包
    if (dependencies && Object.keys(dependencies).length > 0) {
      sections.push(this.formatDependencies(dependencies))
    }
    
    // 9. 业务错误定义
    if (businessErrors && businessErrors.length > 0) {
      sections.push(this.formatBusinessErrors(businessErrors))
    }
    
    // 10. 接口实现状态
    sections.push(this.formatInterfaces(toolInstance))
    
    // 11. 使用示例
    sections.push(this.formatExamples(resource, schema))
    
    return sections.filter(Boolean).join('\n')
  }

  /**
   * 格式化参数定义
   */
  formatParameters(params) {
    if (!params.properties || Object.keys(params.properties).length === 0) {
      return '\n## 📝 参数定义\n\n无需参数'
    }

    const lines = ['\n## 📝 参数定义']
    lines.push('\n| 参数 | 类型 | 必需 | 描述 | 默认值 |')
    lines.push('|------|------|------|------|--------|')

    // 递归渲染所有参数
    const rows = this.collectParameterRows(params, '')
    lines.push(...rows)

    return lines.join('\n')
  }

  /**
   * 递归收集参数行（包括嵌套结构）
   */
  collectParameterRows(schema, prefix = '', parentRequired = []) {
    const rows = []

    if (!schema.properties) return rows

    const required = schema.required || parentRequired || []

    for (const [key, prop] of Object.entries(schema.properties)) {
      const isRequired = required.includes(key) ? '✅' : '❌'
      const type = this.formatType(prop)
      const desc = prop.description || '-'
      const defaultVal = prop.default !== undefined ? `\`${JSON.stringify(prop.default)}\`` : '-'

      // 添加当前参数行
      rows.push(`| ${prefix}${key} | ${type} | ${isRequired} | ${desc} | ${defaultVal} |`)

      // 处理嵌套结构
      // 1. 如果是数组类型且包含对象
      if (prop.type === 'array' && prop.items?.type === 'object' && prop.items.properties) {
        const nestedPrefix = prefix ? prefix.replace(/└─ |├─ /, '│  ') + '└─ ' : '├─ '
        const nestedRows = this.collectParameterRows(prop.items, nestedPrefix, prop.items.required)
        rows.push(...nestedRows)
      }

      // 2. 如果是对象类型
      else if (prop.type === 'object' && prop.properties) {
        const nestedPrefix = prefix ? prefix.replace(/└─ |├─ /, '│  ') + '└─ ' : '├─ '
        const nestedRows = this.collectParameterRows(prop, nestedPrefix, prop.required)
        rows.push(...nestedRows)
      }
    }

    // 优化树形符号：将最后一个 ├─ 改为 └─
    if (prefix && rows.length > 0) {
      // 找到当前层级的最后一个直接子参数
      let lastDirectChildIndex = -1
      const currentIndent = prefix.length

      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i]
        const match = row.match(/^[|]\s*([│├└─\s]+)/)
        if (match) {
          const indent = match[1].replace(/[├└─]/g, '').length
          if (indent === currentIndent) {
            lastDirectChildIndex = i
            break
          }
        }
      }

      if (lastDirectChildIndex >= 0) {
        rows[lastDirectChildIndex] = rows[lastDirectChildIndex].replace('├─', '└─')
      }
    }

    return rows
  }

  /**
   * 格式化环境变量
   */
  formatEnvironment(env) {
    if (!env.properties || Object.keys(env.properties).length === 0) {
      return null
    }
    
    const lines = ['\n## 🔧 环境变量']
    lines.push('\n| 变量 | 类型 | 必需 | 描述 | 默认值 |')
    lines.push('|------|------|------|------|--------|')
    
    const required = env.required || []
    
    for (const [key, prop] of Object.entries(env.properties)) {
      const isRequired = required.includes(key) ? '✅' : '❌'
      const type = prop.type || 'string'
      const desc = prop.description || '-'
      const defaultVal = prop.default !== undefined ? `\`${prop.default}\`` : '-'
      
      lines.push(`| ${key} | ${type} | ${isRequired} | ${desc} | ${defaultVal} |`)
    }
    
    return lines.join('\n')
  }

  /**
   * 格式化依赖包
   */
  formatDependencies(deps) {
    const lines = ['\n## 📦 依赖包']
    lines.push('\n| 包名 | 版本 |')
    lines.push('|------|------|')
    
    for (const [name, version] of Object.entries(deps)) {
      lines.push(`| ${name} | \`${version}\` |`)
    }
    
    return lines.join('\n')
  }

  /**
   * 格式化业务错误
   */
  formatBusinessErrors(errors) {
    const lines = ['\n## 🚨 业务错误']
    lines.push('\n| 错误码 | 描述 | 解决方案 | 可重试 |')
    lines.push('|--------|------|----------|--------|')
    
    for (const error of errors) {
      const retryable = error.retryable ? '✅' : '❌'
      lines.push(`| ${error.code} | ${error.description} | ${error.solution || '-'} | ${retryable} |`)
    }
    
    return lines.join('\n')
  }

  /**
   * 格式化接口实现状态
   */
  formatInterfaces(toolInstance) {
    const lines = ['\n## 🔌 接口实现']
    lines.push('\n| 接口 | 状态 | 说明 |')
    lines.push('|------|------|------|')
    
    const interfaces = [
      { name: 'execute', required: true, desc: '执行工具（必需）' },
      { name: 'getMetadata', required: true, desc: '工具元信息（必需）' },
      { name: 'getDependencies', required: true, desc: '依赖声明（必需）' },
      { name: 'getSchema', required: false, desc: '参数定义' },
      { name: 'validate', required: false, desc: '参数验证' },
      { name: 'getBusinessErrors', required: false, desc: '业务错误定义' },
      { name: 'init', required: false, desc: '初始化钩子' },
      { name: 'cleanup', required: false, desc: '清理钩子' }
    ]
    
    for (const intf of interfaces) {
      const hasImpl = typeof toolInstance[intf.name] === 'function'
      const status = hasImpl ? '✅' : (intf.required ? '❌' : '⭕')
      lines.push(`| ${intf.name} | ${status} | ${intf.desc} |`)
    }
    
    return lines.join('\n')
  }

  /**
   * 格式化使用示例
   */
  formatExamples(resource, schema) {
    const lines = ['\n## 💻 使用示例']
    lines.push('\n通过 mcp__promptx__toolx 调用，使用 YAML 格式：')
    lines.push('\n```yaml')

    // 执行工具
    lines.push('# 执行工具')
    const toolName = resource.replace('@tool://', '')
    lines.push(`url: tool://${toolName}`)
    lines.push('mode: execute')
    if (schema?.parameters?.properties && Object.keys(schema.parameters.properties).length > 0) {
      lines.push('parameters:')
      const exampleParams = this.generateExampleParams(schema.parameters)
      this.formatYAMLParams(lines, exampleParams, '  ')
    }

    lines.push('')

    // 查看手册
    lines.push('# 查看手册（第一次使用必看）')
    lines.push(`url: tool://${toolName}`)
    lines.push('mode: manual')

    // 配置环境变量（如果有）
    if (schema?.environment?.properties && Object.keys(schema.environment.properties).length > 0) {
      lines.push('')
      lines.push('# 配置环境变量')
      lines.push(`url: tool://${toolName}`)
      lines.push('mode: configure')
      lines.push('parameters:')
      const firstEnvKey = Object.keys(schema.environment.properties)[0]
      lines.push(`  ${firstEnvKey}: your_value_here`)
    }

    lines.push('')
    lines.push('# 查看日志')
    lines.push(`url: tool://${toolName}`)
    lines.push('mode: log')
    lines.push('parameters:')
    lines.push('  action: tail')
    lines.push('  lines: 50')

    lines.push('```')

    return lines.join('\n')
  }

  /**
   * 格式化 YAML 参数
   */
  formatYAMLParams(lines, params, indent = '') {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        lines.push(`${indent}${key}: null`)
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${indent}${key}:`)
        this.formatYAMLParams(lines, value, indent + '  ')
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${indent}${key}: []`)
        } else {
          lines.push(`${indent}${key}:`)
          for (const item of value) {
            if (typeof item === 'object') {
              lines.push(`${indent}- `)
              this.formatYAMLParams(lines, item, indent + '  ')
            } else {
              lines.push(`${indent}- ${item}`)
            }
          }
        }
      } else if (typeof value === 'string') {
        // 对于包含特殊字符的字符串，使用引号
        if (value.includes(':') || value.includes('#') || value.includes('|') || value.includes('>')) {
          lines.push(`${indent}${key}: "${value}"`)
        } else {
          lines.push(`${indent}${key}: ${value}`)
        }
      } else {
        lines.push(`${indent}${key}: ${value}`)
      }
    }
  }

  /**
   * 生成示例参数
   */
  generateExampleParams(paramSchema) {
    const example = {}

    if (!paramSchema.properties) return example

    for (const [key, prop] of Object.entries(paramSchema.properties)) {
      // 优先使用默认值
      if (prop.default !== undefined) {
        example[key] = prop.default
        continue
      }

      // 根据类型生成示例值
      switch (prop.type) {
        case 'string':
          example[key] = prop.enum ? prop.enum[0] : `example_${key}`
          break
        case 'number':
        case 'integer':
          example[key] = prop.minimum || 1
          break
        case 'boolean':
          example[key] = false
          break
        case 'array':
          // 如果数组包含对象结构，生成示例对象
          if (prop.items?.type === 'object' && prop.items.properties) {
            example[key] = [this.generateExampleParams(prop.items)]
          } else {
            example[key] = []
          }
          break
        case 'object':
          // 递归生成嵌套对象的示例
          if (prop.properties) {
            example[key] = this.generateExampleParams(prop)
          } else {
            example[key] = {}
          }
          break
        default:
          example[key] = null
      }
    }

    return example
  }

  /**
   * 格式化类型信息
   */
  formatType(prop) {
    let type = prop.type || 'any'
    
    // 如果有枚举值
    if (prop.enum) {
      type += ` (${prop.enum.join('|')})`
    }
    
    // 如果是数组
    if (type === 'array' && prop.items) {
      type = `${prop.items.type || 'any'}[]`
    }
    
    return type
  }
}

module.exports = ToolManualFormatter