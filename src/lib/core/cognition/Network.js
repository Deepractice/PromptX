const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Network - 全局认知网络（所有 Cue 的容器）
 * 
 * ## 设计理念
 * 
 * Network是整个认知系统的基础设施，相当于生物大脑中的海马体（Hippocampus）。
 * 它不负责思考或推理，只负责存储和管理所有的记忆节点（Cue）。
 * 
 * ## 为什么这样设计
 * 
 * 1. **纯容器设计**
 *    - Network只是Cue的容器，不包含任何业务逻辑
 *    - 职责单一：存储、检索、持久化
 *    - 便于测试和维护
 * 
 * 2. **去中心化架构**
 *    - 连接信息存储在Cue内部，Network不维护全局连接表
 *    - 优点：
 *      a) 避免了数据同步问题
 *      b) 支持局部更新，不需要全局锁
 *      c) 符合神经网络的生物学原理
 * 
 * 3. **Map数据结构**
 *    - 使用Map而不是Object存储Cue
 *    - 原因：
 *      a) O(1)的查找性能
 *      b) 支持任何类型的键（虽然这里用string）
 *      c) 保持插入顺序（便于调试）
 *      d) 有明确的size属性
 * 
 * ## 持久化设计
 * 
 * 采用JSON格式持久化，结构如下：
 * ```json
 * {
 *   "version": "1.0",           // 版本号，便于未来升级
 *   "timestamp": 1234567890,     // 保存时间
 *   "cues": {                    // 所有Cue的集合
 *     "认知": {
 *       "word": "认知",
 *       "connections": [
 *         {"target": "模型", "weight": 1234567890}
 *       ]
 *     }
 *   }
 * }
 * ```
 * 
 * ## 性能考虑
 * 
 * - 单个Network预计存储10000+个Cue
 * - 每个Cue平均10-50个连接
 * - JSON文件大小：约1-10MB
 * - 加载时间：<100ms
 * 
 * @class Network
 */
class Network {
  constructor() {
    /**
     * Cue存储映射表
     * 
     * 数据结构：Map<word, Cue>
     * - key: 概念词（string）
     * - value: Cue实例
     * 
     * @type {Map<string, Cue>}
     */
    this.cues = new Map();
    
    logger.debug('[Network] Initialized empty network');
  }
  
  /**
   * 添加或获取Cue
   * 
   * 如果Cue不存在则创建，存在则返回现有的。
   * 这是一个幂等操作，多次调用结果相同。
   * 
   * @param {string} word - 概念词
   * @returns {FrequencyCue} FrequencyCue实例
   */
  getOrCreateCue(word) {
    if (!this.cues.has(word)) {
      const FrequencyCue = require('./FrequencyCue');
      const cue = new FrequencyCue(word);
      this.cues.set(word, cue);
      logger.debug('[Network] Created new FrequencyCue', { word });
    }
    return this.cues.get(word);
  }
  
  /**
   * 获取Cue（不创建）
   * 
   * @param {string} word - 概念词
   * @returns {Cue|undefined} Cue实例或undefined
   */
  getCue(word) {
    return this.cues.get(word);
  }
  
  /**
   * 检查Cue是否存在
   * 
   * @param {string} word - 概念词
   * @returns {boolean} 是否存在
   */
  hasCue(word) {
    return this.cues.has(word);
  }
  
  /**
   * 获取网络规模
   * 
   * @returns {number} Cue总数
   */
  size() {
    return this.cues.size;
  }
  
  /**
   * 计算网络的入度信息
   * 
   * 入度 = 有多少其他Cue指向这个Cue
   * 这需要遍历整个网络，因为我们只存储出边。
   * 
   * @returns {Map<string, number>} word => 入度
   */
  calculateInDegrees() {
    const inDegrees = new Map();
    
    // 初始化所有Cue的入度为0
    for (const word of this.cues.keys()) {
      inDegrees.set(word, 0);
    }
    
    // 遍历所有连接，累计入度
    for (const [sourceWord, sourceCue] of this.cues) {
      for (const targetWord of sourceCue.connections.keys()) {
        const currentDegree = inDegrees.get(targetWord) || 0;
        inDegrees.set(targetWord, currentDegree + 1);
      }
    }
    
    return inDegrees;
  }
  
  /**
   * 计算网络的入度权重（每个节点被指向的总权重）
   * 
   * 用于Prime选择最重要的节点。
   * 
   * @returns {Map<string, number>} word => 总入度权重
   */
  calculateInWeights() {
    const inWeights = new Map();
    
    // 遍历所有连接，累计权重
    for (const [sourceWord, sourceCue] of this.cues) {
      for (const [targetWord, weight] of sourceCue.connections) {
        const currentWeight = inWeights.get(targetWord) || 0;
        inWeights.set(targetWord, currentWeight + weight);
      }
    }
    
    return inWeights;
  }
  
  /**
   * 获取网络统计信息
   * 
   * @returns {Object} 统计信息
   */
  getStatistics() {
    let totalConnections = 0;
    let maxOutDegree = 0;
    let hubNode = null;
    let isolatedNodes = 0;
    
    for (const [word, cue] of this.cues) {
      const outDegree = cue.connections.size;
      totalConnections += outDegree;
      
      if (outDegree === 0) {
        isolatedNodes++;
      }
      
      if (outDegree > maxOutDegree) {
        maxOutDegree = outDegree;
        hubNode = word;
      }
    }
    
    const inDegrees = this.calculateInDegrees();
    let maxInDegree = 0;
    let sinkNode = null;
    
    for (const [word, inDegree] of inDegrees) {
      if (inDegree > maxInDegree) {
        maxInDegree = inDegree;
        sinkNode = word;
      }
    }
    
    return {
      totalCues: this.cues.size,
      totalConnections,
      averageOutDegree: this.cues.size > 0 ? totalConnections / this.cues.size : 0,
      maxOutDegree,
      hubNode,       // 出度最高的节点（发散中心）
      maxInDegree,
      sinkNode,      // 入度最高的节点（汇聚中心）
      isolatedNodes  // 孤立节点数量
    };
  }
  
  /**
   * 序列化Network到JSON文件
   * 
   * 设计考虑：
   * - 使用同步版本避免异步复杂性
   * - 包含版本号便于未来升级
   * - 包含时间戳便于调试
   * 
   * @param {string} filePath - 保存路径
   * @returns {Promise<void>}
   */
  async persist(filePath) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // 转换Map为可序列化的对象
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        cues: {}
      };
      
      // 序列化每个Cue
      for (const [word, cue] of this.cues) {
        data.cues[word] = cue.toJSON();
      }
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 写入文件
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      logger.info('[Network] Persisted to file', { 
        path: filePath, 
        cues: this.cues.size,
        size: JSON.stringify(data).length 
      });
    } catch (error) {
      logger.error('[Network] Failed to persist', { 
        path: filePath, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 从JSON文件加载Network
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  async load(filePath) {
    try {
      const fs = require('fs').promises;
      const FrequencyCue = require('./FrequencyCue');
      
      // 读取文件
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // 版本检查
      if (data.version !== '1.0') {
        logger.warn('[Network] Version mismatch', { 
          expected: '1.0', 
          actual: data.version 
        });
      }
      
      // 清空当前网络
      this.cues.clear();
      
      // 重建所有Cue
      for (const [word, cueData] of Object.entries(data.cues)) {
        const cue = FrequencyCue.fromJSON(cueData);
        this.cues.set(word, cue);
      }
      
      logger.info('[Network] Loaded from file', { 
        path: filePath, 
        cues: this.cues.size,
        timestamp: new Date(data.timestamp).toISOString()
      });
    } catch (error) {
      logger.error('[Network] Failed to load', { 
        path: filePath, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 同步版本的persist
   * 
   * Remember需要同步保存，避免异步复杂性。
   * 
   * @param {string} filePath - 保存路径
   */
  persistSync(filePath) {
    try {
      // 转换Map为可序列化的对象
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        cues: {}
      };
      
      // 序列化每个Cue
      for (const [word, cue] of this.cues) {
        data.cues[word] = cue.toJSON();
      }
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      
      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      logger.debug('[Network] Persisted (sync) to file', { 
        path: filePath, 
        cues: this.cues.size 
      });
    } catch (error) {
      logger.error('[Network] Failed to persist (sync)', { 
        path: filePath, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 同步版本的load
   * 
   * Prime需要同步加载，避免异步复杂性。
   * 
   * @param {string} filePath - 文件路径
   */
  loadSync(filePath) {
    try {
      const FrequencyCue = require('./FrequencyCue');
      
      // 读取文件
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // 版本检查
      if (data.version !== '1.0') {
        logger.warn('[Network] Version mismatch', { 
          expected: '1.0', 
          actual: data.version 
        });
      }
      
      // 清空当前网络
      this.cues.clear();
      
      // 重建所有Cue
      for (const [word, cueData] of Object.entries(data.cues)) {
        const cue = FrequencyCue.fromJSON(cueData);
        this.cues.set(word, cue);
      }
      
      logger.debug('[Network] Loaded (sync) from file', { 
        path: filePath, 
        cues: this.cues.size 
      });
    } catch (error) {
      logger.error('[Network] Failed to load (sync)', { 
        path: filePath, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 更新Recall频率
   * 
   * 当Recall操作完成后，更新所有被激活节点的频率。
   * 这是Network作为容器管理统计信息的体现。
   * 
   * @param {Set<string>} activatedCues - 被激活的节点集合
   */
  updateRecallFrequency(activatedCues) {
    if (!activatedCues || activatedCues.size === 0) {
      return;
    }
    
    let updatedCount = 0;
    for (const word of activatedCues) {
      const cue = this.cues.get(word);
      if (cue && typeof cue.incrementFrequency === 'function') {
        cue.incrementFrequency();
        updatedCount++;
      }
    }
    
    logger.debug('[Network] Updated recall frequencies', {
      requested: activatedCues.size,
      updated: updatedCount
    });
  }
  
  /**
   * 获取频率统计信息
   * 
   * @returns {Object} 频率统计
   */
  getFrequencyStatistics() {
    let totalFrequency = 0;
    let maxFrequency = 0;
    let mostFrequentNode = null;
    const frequencyDistribution = new Map();
    
    for (const [word, cue] of this.cues) {
      const frequency = cue.recallFrequency || 0;
      totalFrequency += frequency;
      
      if (frequency > maxFrequency) {
        maxFrequency = frequency;
        mostFrequentNode = word;
      }
      
      // 统计频率分布
      const bucket = Math.floor(frequency / 10) * 10; // 10为一档
      frequencyDistribution.set(bucket, (frequencyDistribution.get(bucket) || 0) + 1);
    }
    
    return {
      totalRecalls: totalFrequency,
      averageFrequency: this.cues.size > 0 ? totalFrequency / this.cues.size : 0,
      maxFrequency,
      mostFrequentNode,
      distribution: Array.from(frequencyDistribution.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([bucket, count]) => ({ range: `${bucket}-${bucket+9}`, count }))
    };
  }
  
  /**
   * 清空网络
   * 
   * 用于测试或重置。
   */
  clear() {
    const previousSize = this.cues.size;
    this.cues.clear();
    logger.info('[Network] Cleared', { previousSize });
  }
}

module.exports = Network;