// CognitionManager - 管理角色与认知的关系
// 每个角色拥有独立的认知实例，存储在 @user://.promptx/cognition/{role}

const { Cognition } = require('./Cognition');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../utils/logger');

class CognitionManager {
  constructor(resourceManager) {
    this.resourceManager = resourceManager;
    this.cognitions = new Map(); // role -> Cognition instance
    this.userProtocol = null; // 延迟初始化
  }

  /**
   * 确保资源管理器已初始化
   */
  async ensureInitialized() {
    if (!this.resourceManager.initialized) {
      logger.info('⚙️ [CognitionManager] ResourceManager未初始化，正在初始化...');
      await this.resourceManager.initializeWithNewArchitecture();
      logger.success('⚙️ [CognitionManager] ResourceManager初始化完成');
    }
    
    // 获取 user 协议
    if (!this.userProtocol) {
      this.userProtocol = this.resourceManager.protocols.get('user');
      if (!this.userProtocol) {
        throw new Error('UserProtocol not found in ResourceManager');
      }
    }
  }

  /**
   * 获取或创建角色的认知实例
   * @param {string} role - 角色ID
   * @returns {Promise<Cognition>} 角色的认知实例
   */
  async getCognition(role) {
    // 验证角色名
    if (!role || typeof role !== 'string' || role.trim() === '') {
      throw new Error('角色ID不能为空');
    }
    
    // 确保已初始化
    await this.ensureInitialized();
    
    // 如果已存在，直接返回
    if (this.cognitions.has(role)) {
      logger.debug(`🧠 [CognitionManager] 返回已存在的认知实例: ${role}`);
      return this.cognitions.get(role);
    }

    logger.info(`🧠 [CognitionManager] 创建新的认知实例: ${role}`);
    
    // 创建角色专属的认知目录
    const cognitionPath = `.promptx/cognition/${role}`;
    const cognitionDir = await this.userProtocol.resolvePath(cognitionPath);
    
    // 确保目录存在
    await fs.ensureDir(cognitionDir);
    logger.debug(`📁 [CognitionManager] 认知目录已创建: ${cognitionDir}`);
    
    // 配置认知实例
    const config = {
      longTermPath: path.join(cognitionDir, 'longterm.db'),
      semanticPath: cognitionDir,  // 直接使用认知目录，不再创建子目录
      proceduralPath: path.join(cognitionDir, 'procedural.json')  // 和longterm.db在同一目录
    };
    
    // 创建认知实例
    const cognition = new Cognition(config);
    this.cognitions.set(role, cognition);
    
    logger.success(`✅ [CognitionManager] 认知实例创建完成: ${role}`);
    return cognition;
  }

  /**
   * 记住 - 为指定角色保存记忆（支持批量）
   * @param {string} role - 角色ID
   * @param {Array} engrams - Engram对象数组，每个包含 {content, schema, strength, type}
   */
  async remember(role, engrams) {
    // 确保输入是数组
    if (!Array.isArray(engrams)) {
      throw new Error('engrams 必须是数组格式');
    }
    
    if (engrams.length === 0) {
      throw new Error('engrams 数组不能为空');
    }
    
    const cognition = await this.getCognition(role);
    const results = [];
    
    // 循环调用底层的单个remember方法
    for (let i = 0; i < engrams.length; i++) {
      const { content, schema, strength, type = 'ATOMIC' } = engrams[i];
      
      // 验证必需字段
      if (!content || !schema || typeof strength !== 'number') {
        throw new Error(`Engram ${i + 1}: content, schema, strength 是必需字段`);
      }
      
      try {
        const result = await cognition.remember(content, schema, strength, type);
        results.push(result);
      } catch (error) {
        throw new Error(`Engram ${i + 1}: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * 回忆 - 从指定角色检索记忆
   * @param {string} role - 角色ID
   * @param {string} cue - 检索线索
   * @returns {Promise<Array>} 匹配的记忆列表
   */
  async recall(role, cue) {
    const cognition = await this.getCognition(role);
    return cognition.recall(cue);
  }

  /**
   * 启动效应 - 预激活角色的语义网络
   * @param {string} role - 角色ID
   * @returns {Promise<string>} Mermaid mindmap 格式的字符串
   */
  async prime(role) {
    const cognition = await this.getCognition(role);
    return cognition.prime();
  }

  /**
   * 获取所有活跃的认知实例
   * @returns {Map} role -> Cognition 映射
   */
  getActiveCognitions() {
    return new Map(this.cognitions);
  }

  /**
   * 清理指定角色的认知实例（释放内存）
   * @param {string} role - 角色ID
   */
  clearCognition(role) {
    if (this.cognitions.has(role)) {
      logger.info(`🧹 [CognitionManager] 清理认知实例: ${role}`);
      this.cognitions.delete(role);
    }
  }

  /**
   * 清理所有认知实例
   */
  clearAll() {
    logger.info(`🧹 [CognitionManager] 清理所有认知实例`);
    this.cognitions.clear();
  }


  /**
   * 思考 - 处理 Thought 对象并返回渲染后的 prompt
   * 
   * === 新设计：纯粹的转发层 ===
   * 
   * CognitionManager 只负责：
   * 1. 获取角色对应的认知实例
   * 2. 转发 thought 对象
   * 3. 返回渲染后的 prompt 字符串
   * 
   * @param {string} role - 角色ID
   * @param {Thought} thought - 完整的 Thought 对象
   * @returns {Promise<string>} 返回渲染后的 prompt 字符串，用于指导生成下一个 Thought
   * 
   * @example
   * // 第一次思考：AI 做出三个核心决策
   * const prompt1 = await cognitionManager.think('scientist', {
   *   goalEngram: { 
   *     content: "推理天空呈现蓝色的光学原理",
   *     schema: "自然现象\\n  光学现象\\n    大气散射"
   *   },
   *   thinkingPattern: "reasoning",  // AI 选择推理模式
   *   spreadActivationCues: ["天空", "蓝色", "光学"]  // AI 选择激活线索
   * });
   * // 返回的 prompt1 是一个渲染好的字符串，包含了思考指导
   * 
   * // 第二次思考：基于上一轮结果继续
   * const prompt2 = await cognitionManager.think('scientist', {
   *   goalEngram: { 
   *     content: "深入分析瑞利散射机制",
   *     schema: "物理学\\n  光学\\n    散射理论"
   *   },
   *   thinkingPattern: "analytical",  // AI 切换到分析模式
   *   spreadActivationCues: ["瑞利散射", "波长", "强度"],
   *   insightEngrams: [
   *     { content: "蓝光波长短，被散射更多" }
   *   ],
   *   previousThought: thought1  // 包含前一轮的思考结果
   * });
   */
  async think(role, thought) {
    // 获取角色的认知实例
    const cognition = await this.getCognition(role);
    
    // 直接转发到底层认知的 think 方法
    // TODO: 底层 cognition.think() 负责：
    // 1. 基于 thinkingPattern 选择对应的 Pattern 实现
    // 2. 执行记忆检索（基于 spreadActivationCues）
    // 3. 推断思考状态
    // 4. 渲染最终的 prompt
    return cognition.think(thought);
  }


}

module.exports = { CognitionManager };