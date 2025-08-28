const ResourceProtocol = require('./ResourceProtocol');

/**
 * Tool协议处理器
 * 处理 @tool://tool-name 格式的资源引用
 * 从注册表中查找并加载工具JavaScript代码
 */
class ToolProtocol extends ResourceProtocol {
  constructor() {
    super('tool');
    this.registryManager = null;
  }

  /**
   * 设置注册表管理器引用
   * @param {Object} manager - ResourceManager实例
   */
  setRegistryManager(manager) {
    this.registryManager = manager;
  }

  /**
   * 解析工具资源路径
   * @param {string} toolPath - 工具名称，如 "calculator"
   * @param {Object} queryParams - 查询参数（可选）
   * @returns {Promise<Object>} 工具代码和元数据
   */
  async resolve(toolPath, queryParams = {}) {
    if (!this.registryManager) {
      throw new Error('ToolProtocol: Registry manager not set');
    }

    // 1. 从注册表查找tool资源
    const toolResource = this.registryManager.registryData
      .findResourceById(toolPath, 'tool');
    
    if (!toolResource) {
      throw new Error(`Tool '${toolPath}' not found in registry`);
    }

    // 2. 加载tool文件内容
    const toolContent = await this.registryManager
      .loadResourceByProtocol(toolResource.reference);
    
    // 3. 验证工具代码格式
    this.validateToolContent(toolContent, toolPath);

    // 4. 返回工具信息
    return {
      id: toolPath,
      content: toolContent,
      metadata: toolResource,
      source: toolResource.source || 'unknown'
    };
  }

  /**
   * 验证工具内容格式
   * @param {string} content - 工具文件内容
   * @param {string} toolPath - 工具路径
   */
  validateToolContent(content, toolPath) {
    if (!content || typeof content !== 'string') {
      throw new Error(`Tool '${toolPath}': Invalid or empty content`);
    }

    // 基本的JavaScript语法检查
    try {
      // 尝试创建一个函数来验证语法
      new Function(content);
    } catch (syntaxError) {
      throw new Error(`Tool '${toolPath}': JavaScript syntax error - ${syntaxError.message}`);
    }
  }

  /**
   * 获取协议信息
   * @returns {Object} 协议描述信息
   */
  getProtocolInfo() {
    return {
      name: 'tool',
      description: 'Tool资源协议 - 加载可执行的JavaScript工具',
      syntax: 'tool://{tool_id}',
      examples: [
        'tool://calculator',
        'tool://send-email', 
        'tool://data-processor',
        'tool://api-client'
      ],
      supportedFileTypes: ['.tool.js'],
      usageNote: '工具文件必须导出符合PromptX Tool Interface的对象'
    };
  }

  /**
   * 检查缓存策略
   * @param {string} toolPath - 工具路径
   * @returns {boolean} 是否应该缓存
   */
  shouldCache(toolPath) {
    // 工具代码通常比较稳定，启用缓存以提高性能
    return true;
  }

  /**
   * 获取缓存键
   * @param {string} toolPath - 工具路径
   * @returns {string} 缓存键
   */
  getCacheKey(toolPath) {
    return `tool://${toolPath}`;
  }
}

module.exports = ToolProtocol;