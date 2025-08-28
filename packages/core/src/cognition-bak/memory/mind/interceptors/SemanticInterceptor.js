/**
 * 语义网络拦截器基类
 * 在语义网络的关键操作点进行拦截和处理
 */
class SemanticInterceptor {
  /**
   * 持久化前拦截
   * @param {Object} data - 即将持久化的数据
   * @returns {Object} 处理后的数据
   */
  beforePersist(data) {
    return data;
  }
  
  /**
   * 加载后拦截
   * @param {Object} data - 刚加载的数据
   * @returns {Object} 处理后的数据
   */
  afterLoad(data) {
    return data;
  }
  
  /**
   * Prime 时拦截
   * @param {string} mindmap - Mermaid mindmap 字符串
   * @param {Object} context - 上下文信息
   * @returns {string} 处理后的 mindmap
   */
  onPrime(mindmap, context = {}) {
    return mindmap;
  }
  
  /**
   * 节点访问时拦截
   * @param {Object} node - 被访问的节点 (Cue/Schema)
   * @param {string} action - 动作类型 ('recall', 'add', 'connect')
   */
  onAccess(node, action) {
    // 默认不处理
  }
  
  /**
   * 节点创建时拦截
   * @param {Object} node - 新创建的节点 (Cue/Schema)
   */
  onCreate(node) {
    // 默认不处理
  }
  
  /**
   * 节点删除前拦截
   * @param {Object} node - 即将删除的节点
   */
  beforeDelete(node) {
    // 默认不处理
  }
}

module.exports = { SemanticInterceptor };