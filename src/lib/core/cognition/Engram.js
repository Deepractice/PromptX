const logger = require('../../utils/logger');

/**
 * Engram - 记忆痕迹载体
 * 
 * ## 设计理念
 * 
 * Engram（记忆痕迹）是认知系统中的基本记忆单元，包含了一次认知体验的完整信息。
 * 它贯穿整个认知循环，从AI的感知理解到海马体的存储检索。
 * 
 * 在神经科学中，Engram指大脑中存储特定记忆的物理或生化变化。
 * 在我们的系统中，它是连接AI大脑皮层和认知海马体的标准数据结构。
 * 
 * ## 康德认识论映射
 * 
 * - content = 感性直观（现象界的原始经验）
 * - schema = 知性范畴（概念化的结果）
 * - strength = 实践理性（角色的主观价值判断）
 * - timestamp = 时间形式（内感官的先验形式）
 * 
 * ## 为什么需要Engram
 * 
 * 1. **数据完整性**
 *    - 保留完整的认知过程信息
 *    - content用于追溯和调试
 *    - schema用于存储和检索
 * 
 * 2. **职责分离**
 *    - Engram负责数据承载
 *    - Remember负责处理逻辑
 *    - 清晰的数据与算法分离
 * 
 * 3. **时间一致性**
 *    - timestamp在创建时确定
 *    - 避免处理过程中的时间漂移
 *    - 保证批次内的时间统一
 * 
 * @class Engram
 */
class Engram {
  /**
   * 创建记忆痕迹
   * 
   * @param {Object} params - 参数对象
   * @param {string} params.content - 原始经验内容
   * @param {string|Array} params.schema - 概念序列（字符串或数组）
   * @param {number} params.strength - 记忆强度 (0-1)，表示角色的主观重要性评分
   * @param {number} [params.timestamp] - 时间戳（可选，默认为当前时间）
   */
  constructor({ content, schema, strength, timestamp }) {
    // 验证必需参数
    if (!content) {
      throw new Error('Engram requires content');
    }
    if (!schema) {
      throw new Error('Engram requires schema');
    }
    if (strength === undefined || strength === null) {
      throw new Error('Engram requires strength');
    }
    
    /**
     * 原始经验内容
     * 保留AI的原始理解，用于追溯和调试
     * @type {string}
     */
    this.content = content;
    
    /**
     * 概念序列
     * 经过图式化处理的概念数组
     * @type {Array<string>}
     */
    this.schema = this._normalizeSchema(schema);
    
    /**
     * 记忆强度
     * 角色视角的主观重要性评分 (0-1)
     * @type {number}
     */
    this.strength = this._validateStrength(strength);
    
    /**
     * 时间戳
     * 记忆创建的精确时间
     * @type {number}
     */
    this.timestamp = timestamp || Date.now();
    
    logger.debug('[Engram] Created new engram', {
      schemaLength: this.schema.length,
      strength: this.strength,
      timestamp: new Date(this.timestamp).toISOString()
    });
  }
  
  /**
   * 标准化schema格式
   * 支持字符串（换行分隔）或数组格式
   * 
   * @private
   * @param {string|Array} schema - 原始schema
   * @returns {Array<string>} 标准化的概念数组
   */
  _normalizeSchema(schema) {
    if (Array.isArray(schema)) {
      return schema.filter(item => item && typeof item === 'string');
    }
    
    if (typeof schema === 'string') {
      // 支持换行分隔的字符串格式
      return schema
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    throw new Error('Schema must be a string or array');
  }
  
  /**
   * 验证strength值的有效性
   * 
   * @private
   * @param {number} strength - 强度值
   * @returns {number} 验证后的强度值
   */
  _validateStrength(strength) {
    const num = Number(strength);
    if (isNaN(num)) {
      throw new Error('Strength must be a number');
    }
    if (num < 0 || num > 1) {
      throw new Error('Strength must be between 0 and 1');
    }
    return num;
  }
  
  /**
   * 获取schema长度
   * 用于快速判断是否可以创建连接
   * 
   * @returns {number} schema数组的长度
   */
  get length() {
    return this.schema.length;
  }
  
  /**
   * 判断是否有效
   * schema至少需要2个元素才能创建连接
   * 
   * @returns {boolean} 是否为有效的engram
   */
  isValid() {
    return this.schema.length >= 2;
  }
  
  /**
   * 获取预览字符串
   * 用于日志和调试
   * 
   * @param {number} [maxLength=5] - 最大显示元素数
   * @returns {string} 预览字符串
   */
  getPreview(maxLength = 5) {
    const preview = this.schema.slice(0, maxLength).join(' -> ');
    return this.schema.length > maxLength ? `${preview}...` : preview;
  }
  
  /**
   * 转换为JSON对象
   * 用于序列化和传输
   * 
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      content: this.content,
      schema: this.schema,
      strength: this.strength,
      timestamp: this.timestamp
    };
  }
  
  /**
   * 从JSON对象创建Engram
   * 用于反序列化
   * 
   * @static
   * @param {Object} json - JSON对象
   * @returns {Engram} 新的Engram实例
   */
  static fromJSON(json) {
    return new Engram(json);
  }
}

module.exports = Engram;