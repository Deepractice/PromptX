// BaseThinkingPattern - 思维模式基类
// 实现所有 ThinkingPattern 的通用功能，特别是 Compute 方法
//
// === 设计原则 ===
// 1. 奥卡姆剃刀：只实现真正通用的部分
// 2. 单一职责：专注于系统计算，不涉及模式特定逻辑
// 3. 可扩展性：子类可以覆盖任何方法

const { ThinkingPattern } = require('../interfaces/ThinkingPattern');

class BaseThinkingPattern extends ThinkingPattern {
  // === Compute 方法：系统计算部分 ===
  // 这些实现对所有思维模式都是通用的

  /**
   * 计算并格式化召回的记忆
   * 【Compute方法】将已召回的记忆格式化为可读的提示词
   * 注意：记忆检索已在 Cognition 层完成，这里只负责格式化显示
   * 
   * @param {Array<Engram>} recalledEngrams - 已召回的记忆数组
   * @returns {string} 格式化的记忆显示文本
   */
  computeRecalledEngrams(recalledEngrams) {
    if (!recalledEngrams || recalledEngrams.length === 0) {
      return '暂无相关记忆被召回';
    }
    
    const memoryLines = ['基于激活线索，已召回以下相关记忆：\n'];
    
    // 按强度分组显示
    const highStrength = recalledEngrams.filter(e => e.strength >= 0.8);
    const mediumStrength = recalledEngrams.filter(e => e.strength >= 0.5 && e.strength < 0.8);
    const lowStrength = recalledEngrams.filter(e => e.strength < 0.5);
    
    if (highStrength.length > 0) {
      memoryLines.push('**高强度记忆（核心经验）：**');
      highStrength.forEach((engram, index) => {
        let schemaDisplay = '';
        if (engram.schema) {
          try {
            // 参考 RecallCommand.js 的处理方式
            if (typeof engram.schema === 'string') {
              // 如果是字符串（Mermaid格式），简化显示
              const schemaPreview = engram.schema.replace(/\n/g, ' → ').substring(0, 100);
              schemaDisplay = ` [${schemaPreview}${engram.schema.length > 100 ? '...' : ''}]`;
            } else if (engram.schema.name) {
              // 如果是对象且有name属性
              schemaDisplay = ` [${engram.schema.name}]`;
            } else {
              // 其他情况尝试转为字符串
              const schemaStr = String(engram.schema);
              schemaDisplay = ` [${schemaStr.substring(0, 50)}${schemaStr.length > 50 ? '...' : ''}]`;
            }
          } catch (e) {
            // 出错时降级处理
            schemaDisplay = ' [Schema]';
          }
        }
        memoryLines.push(`${index + 1}. ${engram.content}${schemaDisplay} (强度: ${engram.strength})`);
      });
    }
    
    if (mediumStrength.length > 0) {
      memoryLines.push('\n**中强度记忆（辅助经验）：**');
      mediumStrength.forEach((engram, index) => {
        let schemaDisplay = '';
        if (engram.schema) {
          try {
            // 参考 RecallCommand.js 的处理方式
            if (typeof engram.schema === 'string') {
              // 如果是字符串（Mermaid格式），简化显示
              const schemaPreview = engram.schema.replace(/\n/g, ' → ').substring(0, 100);
              schemaDisplay = ` [${schemaPreview}${engram.schema.length > 100 ? '...' : ''}]`;
            } else if (engram.schema.name) {
              // 如果是对象且有name属性
              schemaDisplay = ` [${engram.schema.name}]`;
            } else {
              // 其他情况尝试转为字符串
              const schemaStr = String(engram.schema);
              schemaDisplay = ` [${schemaStr.substring(0, 50)}${schemaStr.length > 50 ? '...' : ''}]`;
            }
          } catch (e) {
            // 出错时降级处理
            schemaDisplay = ' [Schema]';
          }
        }
        memoryLines.push(`${index + 1}. ${engram.content}${schemaDisplay} (强度: ${engram.strength})`);
      });
    }
    
    if (lowStrength.length > 0) {
      memoryLines.push('\n**低强度记忆（背景信息）：**');
      lowStrength.forEach((engram, index) => {
        let schemaDisplay = '';
        if (engram.schema) {
          try {
            // 参考 RecallCommand.js 的处理方式
            if (typeof engram.schema === 'string') {
              // 如果是字符串（Mermaid格式），简化显示
              const schemaPreview = engram.schema.replace(/\n/g, ' → ').substring(0, 100);
              schemaDisplay = ` [${schemaPreview}${engram.schema.length > 100 ? '...' : ''}]`;
            } else if (engram.schema.name) {
              // 如果是对象且有name属性
              schemaDisplay = ` [${engram.schema.name}]`;
            } else {
              // 其他情况尝试转为字符串
              const schemaStr = String(engram.schema);
              schemaDisplay = ` [${schemaStr.substring(0, 50)}${schemaStr.length > 50 ? '...' : ''}]`;
            }
          } catch (e) {
            // 出错时降级处理
            schemaDisplay = ' [Schema]';
          }
        }
        memoryLines.push(`${index + 1}. ${engram.content}${schemaDisplay} (强度: ${engram.strength})`);
      });
    }
    
    memoryLines.push(`\n共召回 ${recalledEngrams.length} 条相关记忆`);
    
    return memoryLines.join('\n');
  }

  /**
   * 计算思考状态
   * 【Compute方法】基于 thought 内容推断当前状态
   * 
   * 使用简单的置信度判断逻辑：
   * - 基于迭代次数、confidence、内容完整性等客观指标
   * 
   * @param {Thought} thought - 当前思想状态
   * @returns {string} 推断的状态
   */
  computeThinkingState(thought) {
    const iteration = thought.getIteration() || 0;
    const confidence = thought.getConfidence();
    const hasGoal = !!thought.getGoalEngram();
    const hasInsights = thought.getInsightEngrams() && thought.getInsightEngrams().length > 0;
    const hasConclusion = !!thought.getConclusionEngram();
    
    // 超限检查（奥卡姆剃刀：简单的迭代限制）
    if (iteration > 10) {
      return 'exceeded';
    }
    
    // 阻塞检查：有目标但没有进展
    if (hasGoal && iteration > 3 && !hasInsights && !hasConclusion) {
      return 'blocked';
    }
    
    // 矛盾检查：结论置信度过低
    if (hasConclusion && confidence < 0.3) {
      return 'contradictory';
    }
    
    // 完成检查：有高置信度的结论
    if (hasConclusion && confidence >= 0.8) {
      return 'completed';
    }
    
    // 收敛阶段：有结论但置信度中等
    if (hasConclusion && confidence >= 0.5) {
      return 'converging';
    }
    
    // 深化阶段：有洞察在积累
    if (hasInsights) {
      return 'deepening';
    }
    
    // 探索阶段：初始状态
    return 'exploring';
  }

  /**
   * 计算迭代次数
   * 【Compute方法】基于前序思想计算当前迭代
   * 
   * @param {Thought} previousThought - 前序思想
   * @returns {number} 当前迭代次数
   */
  computeIteration(previousThought) {
    if (!previousThought) {
      return 1;
    }
    
    const previousIteration = previousThought.getIteration() || 0;
    return previousIteration + 1;
  }

  /**
   * 计算时间戳
   * 【Compute方法】获取当前时间戳
   * 
   * @returns {number} 当前时间戳（毫秒）
   */
  computeTimestamp() {
    return Date.now();
  }

  // === Pattern 方法：子类必须实现 ===
  // 这些方法是模式特定的，没有通用实现

  getGoalUnderstandingPattern() {
    throw new Error('Subclass must implement getGoalUnderstandingPattern()');
  }

  getSpreadActivationPattern() {
    throw new Error('Subclass must implement getSpreadActivationPattern()');
  }

  getMemoryUtilizationPattern() {
    throw new Error('Subclass must implement getMemoryUtilizationPattern()');
  }

  getPreviousThoughtReferencePattern() {
    throw new Error('Subclass must implement getPreviousThoughtReferencePattern()');
  }

  getInsightDiscoveryPattern() {
    throw new Error('Subclass must implement getInsightDiscoveryPattern()');
  }

  getConclusionFormationPattern() {
    throw new Error('Subclass must implement getConclusionFormationPattern()');
  }

  getConfidenceAssessmentPattern() {
    throw new Error('Subclass must implement getConfidenceAssessmentPattern()');
  }

  getPatternCharacteristics() {
    throw new Error('Subclass must implement getPatternCharacteristics()');
  }

  getThoughtStructurePattern() {
    throw new Error('Subclass must implement getThoughtStructurePattern()');
  }

  getThinkingGuidancePattern(thought) {
    throw new Error('Subclass must implement getThinkingGuidancePattern()');
  }
}

module.exports = { BaseThinkingPattern };