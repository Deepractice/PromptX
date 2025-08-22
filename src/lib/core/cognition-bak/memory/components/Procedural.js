const { ImplicitMemory } = require('../interfaces/ImplicitMemory.js');
const path = require('path');
const fs = require('fs-extra');

/**
 * 程序性内隐记忆 - 管理行为模式
 * @implements {ImplicitMemory}
 */
class Procedural extends ImplicitMemory {
  constructor(proceduralPath) {
    super();
    // 路径由上层传入，不设置默认值
    this.storagePath = proceduralPath;
    this.patterns = [];
    this.loadPatterns();
  }

  /**
   * 记忆 - 将 PATTERN 类型的 engram 存储到程序性记忆
   * @param {import('../../engram/Engram.js').Engram} engram - 记忆痕迹
   */
  async remember(engram) {
    if (engram.getType() === 'PATTERN') {
      const pattern = {
        id: engram.getId(),
        content: engram.getContent(),
        strength: engram.getStrength(),
        timestamp: engram.timestamp || new Date(),
        // 保存原始schema以备后用
        schema: engram.schema
      };
      
      // 更新或添加
      const index = this.patterns.findIndex(p => p.id === pattern.id);
      if (index >= 0) {
        this.patterns[index] = pattern;
      } else {
        this.patterns.push(pattern);
      }
      
      await this.savePatterns();
      console.log('[Procedural.remember] Pattern saved:', pattern.content);
    }
  }

  /**
   * 回忆 - 暂不实现
   * @param {string} cue - 刺激线索
   * @returns {null}
   */
  recall(cue) {
    // 程序性记忆通过prime自动激活，不支持显式recall
    return null;
  }

  /**
   * 启动效应 - 激活所有高强度的行为模式
   * @returns {string} 格式化的行为模式列表
   */
  async prime() {
    // 返回格式化的行为模式列表
    const activePatterns = this.patterns
      .filter(p => p.strength >= 0.7) // 只激活高强度模式
      .sort((a, b) => b.strength - a.strength);
    
    return this.formatPatterns(activePatterns);
  }

  /**
   * 格式化行为模式输出
   * @private
   */
  formatPatterns(patterns) {
    if (patterns.length === 0) return '';
    
    let output = '## 🎯 行为模式激活\n';
    output += `📊 **激活模式**: ${patterns.length}个\n`;
    output += '🔗 **当前行为准则**:\n';
    
    patterns.forEach((pattern, index) => {
      output += `${index + 1}. ${pattern.content} [强度: ${pattern.strength.toFixed(2)}]\n`;
    });
    
    output += '💡 **行为模式已激活**：这些模式将自动影响AI的决策和执行方式';
    
    return output;
  }

  /**
   * 从文件加载行为模式
   * @private
   */
  loadPatterns() {
    try {
      if (fs.existsSync(this.storagePath)) {
        this.patterns = fs.readJsonSync(this.storagePath);
        console.log(`[Procedural] Loaded ${this.patterns.length} patterns from ${this.storagePath}`);
      }
    } catch (error) {
      console.error('[Procedural] Failed to load patterns:', error);
    }
  }

  /**
   * 保存行为模式到文件
   * @private
   */
  async savePatterns() {
    try {
      fs.ensureDirSync(path.dirname(this.storagePath));
      fs.writeJsonSync(this.storagePath, this.patterns, { spaces: 2 });
      console.log(`[Procedural] Saved ${this.patterns.length} patterns to ${this.storagePath}`);
    } catch (error) {
      console.error('[Procedural] Failed to save patterns:', error);
    }
  }
}

module.exports = Procedural;