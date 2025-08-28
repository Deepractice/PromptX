const { ImplicitMemory } = require('../interfaces/ImplicitMemory.js');
const { MindService, NetworkSemantic } = require('../mind/index.js');

/**
 * 语义内隐记忆 - 管理语义网络
 * @implements {ImplicitMemory}
 */
class Semantic extends ImplicitMemory {
  constructor(semanticPath) {
    super();
    // 创建独立的MindService实例并设置存储路径
    this.mindService = new MindService();
    if (semanticPath) {
      this.mindService.setStoragePath(semanticPath);
    }
    // 不再直接创建NetworkSemantic，信任调用时序（prime先执行）
  }

  /**
   * 记忆 - 将 engram 的 schema 添加到语义网络
   * @param {import('../../engram/Engram.js').Engram} engram - 记忆痕迹
   */
  async remember(engram) {
    try {
      console.log('[Semantic.remember] Processing engram:', engram.content);
      console.log('[Semantic.remember] Schema:', engram.schema);
      
      // 传递整个engram给MindService，以保留强度值等信息
      await this.mindService.remember(engram.schema, 'global-semantic', engram);
      
      console.log('[Semantic.remember] Successfully added to semantic network');
    } catch (error) {
      console.error('[Semantic.remember] Error:', error);
      throw error; // 重新抛出错误，让调用者处理
    }
  }

  /**
   * 回忆 - 暂不实现
   * @param {string} cue - 刺激线索
   * @returns {null}
   */
  recall(cue) {
    // TODO: 实现基于语义网络的检索
    return null;
  }

  /**
   * 启动效应 - 加载或创建语义网络并返回 Mermaid 表示
   * @param {string} semanticName - 语义网络名称（可选）
   * @returns {string} Mermaid mindmap 格式的字符串
   */
  async prime(semanticName) {
    // 委托给MindService处理加载/创建逻辑
    return await this.mindService.primeSemantic();
  }

  /**
   * 通知节点被访问（用于更新权重）
   * @param {string} cue - 被访问的概念
   */
  async notifyAccess(cue) {
    // 委托给MindService处理
    return await this.mindService.notifyAccess(cue);
  }

}

module.exports = Semantic;