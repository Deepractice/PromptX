const { SemanticInterceptor } = require('./SemanticInterceptor');
const logger = require('../../../../../utils/logger');

/**
 * 基于权重的语义网络拦截器
 * 实现记忆权重的自适应管理
 */
class WeightedSemanticInterceptor extends SemanticInterceptor {
  constructor(options = {}) {
    super();
    this.config = {
      // 使用增强参数
      recallIncrement: options.recallIncrement || 0.1,    // 每次访问增加的强度
      maxStrength: options.maxStrength || 1.0,            // 强度上限
      minStrength: options.minStrength || 0.0,            // 强度下限
      
      // 合并策略参数
      mergeFactor: options.mergeFactor || 0.5,            // 渐进增强的合并系数
      
      // 展示过滤参数
      topK: options.topK || 100,                          // 显示前 K 个节点
      minDisplayStrength: options.minDisplayStrength || 0.1, // 最低展示阈值
      showArchiveCount: options.showArchiveCount !== false,  // 显示隐藏节点数
    };
  }
  
  /**
   * 节点创建时：初始化强度
   * @param {Object} node - 新创建的节点
   * @param {Object} context - 上下文，可能包含 engram
   */
  onCreate(node, context = {}) {
    if (node.strength === undefined) {
      // 如果有 engram，继承其 strength
      if (context.engram && context.engram.strength !== undefined) {
        node.strength = context.engram.strength;
      } else {
        // 否则使用默认值
        node.strength = 0.5;
      }
    }
  }
  
  /**
   * 节点访问时：更新权重
   * @param {Object} node - 被访问的节点
   * @param {string} action - 动作类型
   */
  onAccess(node, action) {
    logger.info(`[WeightedSemanticInterceptor.onAccess] Called with action: ${action}, node: ${node.word}, current strength: ${node.strength}`);
    
    if (action === 'recall' && node.strength !== undefined) {
      const oldStrength = node.strength;
      // 增加强度，但不超过上限
      node.strength = Math.min(
        this.config.maxStrength, 
        node.strength + this.config.recallIncrement
      );
      logger.info(`[WeightedSemanticInterceptor.onAccess] Updated strength from ${oldStrength} to ${node.strength}`);
    } else {
      logger.info(`[WeightedSemanticInterceptor.onAccess] No update - action: ${action}, has strength: ${node.strength !== undefined}`);
    }
  }
  
  /**
   * 合并相同词的强度
   * @param {Object} existingNode - 已存在的节点
   * @param {number} newStrength - 新的强度值
   * @returns {number} 合并后的强度
   */
  mergeStrength(existingNode, newStrength) {
    const current = existingNode.strength || 0;
    
    // 渐进增强策略：每次出现都是一种强化，但增幅递减
    const increment = (newStrength - current) * this.config.mergeFactor;
    const merged = current + Math.max(0, increment);
    
    return Math.min(this.config.maxStrength, merged);
  }
  
  /**
   * 处理节点添加或更新
   * @param {Object} node - 节点
   * @param {Object} context - 上下文
   */
  onAddNode(node, context = {}) {
    // 如果是合并场景
    if (context.merge && context.engram) {
      node.strength = this.mergeStrength(node, context.engram.strength);
    } else {
      // 新建场景
      this.onCreate(node, context);
    }
  }
  
  /**
   * 持久化前：按强度排序
   * @param {Object} data - 要持久化的数据
   * @returns {Object} 排序后的数据
   */
  beforePersist(data) {
    // 对 cueLayer 按 strength 降序排序
    if (data.cueLayer && Array.isArray(data.cueLayer)) {
      data.cueLayer.sort((a, b) => {
        // a 和 b 的格式是 [word, cue]
        const strengthA = (a[1] && a[1].strength) || 0;
        const strengthB = (b[1] && b[1].strength) || 0;
        return strengthB - strengthA; // 降序
      });
    }
    
    // 对 schemaLayer 按内部 cues 的平均强度排序
    if (data.schemaLayer && Array.isArray(data.schemaLayer)) {
      data.schemaLayer.sort((a, b) => {
        const strengthA = this.calculateSchemaStrength(a[1]);
        const strengthB = this.calculateSchemaStrength(b[1]);
        return strengthB - strengthA; // 降序
      });
    }
    
    return data;
  }
  
  /**
   * Prime 时：过滤和截取
   * @param {string} mindmapString - 原始 mindmap 字符串
   * @param {Object} context - 上下文信息
   * @returns {string} 处理后的 mindmap 字符串
   */
  onPrime(mindmapString, context = {}) {
    const lines = mindmapString.split('\n');
    const result = [];
    
    // 保留头部
    if (lines.length > 0) result.push(lines[0]); // "mindmap"
    if (lines.length > 1) result.push(lines[1]); // "  ((GlobalSemantic))" 或类似
    
    // 解析并过滤节点
    let nodeCount = 0;
    let hiddenCount = 0;
    let skipUntilIndent = -1;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.search(/\S/); // 第一个非空白字符的位置
      
      // 如果在跳过模式中
      if (skipUntilIndent >= 0) {
        if (indent > skipUntilIndent) {
          continue; // 跳过子节点
        } else {
          skipUntilIndent = -1; // 结束跳过
        }
      }
      
      // 判断是否为顶级节点（通常是4个空格缩进）
      if (indent === 4) {
        nodeCount++;
        
        // 只保留前 topK 个节点
        if (nodeCount <= this.config.topK) {
          result.push(line);
        } else {
          hiddenCount++;
          skipUntilIndent = indent; // 跳过其子节点
        }
      } else {
        // 子节点，跟随父节点
        if (nodeCount <= this.config.topK) {
          result.push(line);
        }
      }
    }
    
    // 添加省略提示
    if (this.config.showArchiveCount && hiddenCount > 0) {
      result.push(`    ... (+${hiddenCount} archived)`);
    }
    
    return result.join('\n');
  }
  
  /**
   * 计算 Schema 的综合强度
   * @param {Object} schema - Schema 对象
   * @returns {number} 平均强度
   */
  calculateSchemaStrength(schema) {
    if (!schema || !schema.cues || !Array.isArray(schema.cues)) {
      return 0;
    }
    
    if (schema.cues.length === 0) {
      return 0;
    }
    
    // 计算内部 Cues 的平均强度
    const totalStrength = schema.cues.reduce((sum, cue) => {
      const strength = (cue && cue.strength) || 0;
      return sum + strength;
    }, 0);
    
    return totalStrength / schema.cues.length;
  }
}

module.exports = { WeightedSemanticInterceptor };