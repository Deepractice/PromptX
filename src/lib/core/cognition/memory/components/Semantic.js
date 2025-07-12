const { ImplicitMemory } = require('../interfaces/ImplicitMemory.js');
const { mindService, NetworkSemantic } = require('../mind/index.js');

/**
 * 语义内隐记忆 - 管理语义网络
 * @implements {ImplicitMemory}
 */
class Semantic extends ImplicitMemory {
  constructor() {
    super();
    this.mindService = mindService;
    // 创建一个全局的语义网络实例
    this.semantic = new NetworkSemantic('global-semantic');
  }

  /**
   * 记忆 - 将 engram 的 schema 添加到语义网络
   * @param {import('../../engram/Engram.js').Engram} engram - 记忆痕迹
   */
  async remember(engram) {
    // schema 是 Mermaid 格式字符串，转换为 Schema 对象
    const schema = this.mindService.converter.convertMermaidToSchema(engram.schema);
    
    // 只有成功转换的 schema 才添加到语义网络
    if (schema) {
      await this.mindService.addMind(schema, this.semantic);
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
   * 启动效应 - 返回当前语义网络的 Mermaid 表示
   * @param {string} semanticName - 语义网络名称（可选，如果提供则先加载）
   * @returns {string} Mermaid mindmap 格式的字符串
   */
  async prime(semanticName) {
    // 如果提供了名称，先尝试加载
    if (semanticName) {
      try {
        const loadedSemantic = await this.mindService.loadSemantic(semanticName);
        if (loadedSemantic) {
          this.semantic = loadedSemantic;
        }
      } catch (error) {
        // 加载失败也继续，返回当前的语义网络
        console.warn(`Failed to load semantic: ${error.message}`);
      }
    }
    
    // 返回当前语义网络的 Mermaid 表示
    return this.mindService.convertMindToMermaid(this.semantic);
  }

  /**
   * 获取当前的语义网络
   * @returns {NetworkSemantic}
   */
  getSemantic() {
    return this.semantic;
  }
}

module.exports = Semantic;