/**
 * MCP输出适配器
 * 负责将PromptX CLI的富文本输出转换为MCP标准JSON格式
 */
import pkg from '../package.json'

export class MCPOutputAdapter {
  private version: string = '1.0.0'
  private promptxVersion: string = pkg.version
  
  /**
   * 简单估算token数量
   * 使用简化算法：平均每4个字符算1个token（英文）
   * 中文字符平均每2个字符算1个token
   */
  estimateTokens(text: string): number {
    if (!text) return 0
    
    const str = String(text)
    let tokenCount = 0
    
    // 分别统计中英文字符
    const chineseChars = str.match(/[\u4e00-\u9fa5]/g) || []
    const englishAndOthers = str.replace(/[\u4e00-\u9fa5]/g, '')
    
    // 中文字符：约2个字符1个token
    tokenCount += Math.ceil(chineseChars.length / 2)
    
    // 英文和其他字符：约4个字符1个token
    tokenCount += Math.ceil(englishAndOthers.length / 4)
    
    return tokenCount
  }
  
  /**
   * 将CLI输出转换为MCP标准格式
   */
  convertToMCPFormat(input: any): object {
    try {
      const text = this.normalizeInput(input)
      const sanitizedText = this.sanitizeText(text)
      
      // 估算token数量
      const tokenCount = this.estimateTokens(sanitizedText)
      
      // 添加token统计信息
      const finalText = sanitizedText + `\n\n---\n📊 Token usage: ~${tokenCount} tokens\nPowered by PromptX v${this.promptxVersion} | deepractice.ai`
      
      return {
        content: [
          {
            type: 'text',
            text: finalText
          }
        ]
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  /**
   * 标准化输入，将各种类型转换为字符串
   */
  private normalizeInput(input: any): string {
    // 处理null和undefined
    if (input === null || input === undefined) {
      return ''
    }
    
    // 处理字符串
    if (typeof input === 'string') {
      return input
    }
    
    // 处理PouchOutput对象
    if (input && typeof input === 'object') {
      // 如果有render方法，调用它
      if (typeof input.render === 'function') {
        return String(input.render())
      }
      
      // 如果有content属性，使用它
      if (input.content !== undefined) {
        return this.normalizeInput(input.content)
      }
      
      // 如果有text属性，使用它
      if (input.text !== undefined) {
        return String(input.text)
      }
      
      // 如果有message属性（错误对象）
      if (input.message !== undefined) {
        return String(input.message)
      }
      
      // 其他对象，尝试JSON序列化
      try {
        return JSON.stringify(input, null, 2)
      } catch {
        return String(input)
      }
    }
    
    // 其他类型，直接转字符串
    return String(input)
  }
  
  /**
   * 清理文本，确保MCP兼容性
   */
  private sanitizeText(text: string): string {
    if (!text) return ''
    
    // 保留原始文本，包括emoji和特殊字符
    // 只处理可能导致JSON解析问题的字符
    return text
      .replace(/\x00/g, '') // 移除null字符
      .replace(/\r\n/g, '\n') // 统一换行符
      .trim()
  }
  
  /**
   * 处理错误，返回MCP格式的错误响应
   */
  private handleError(error: any): object {
    const errorMessage = error?.message || 'Unknown error occurred'
    const errorStack = error?.stack || ''
    
    return {
      content: [
        {
          type: 'text', 
          text: `Error: ${errorMessage}\n\n${errorStack}`
        }
      ],
      isError: true
    }
  }
}