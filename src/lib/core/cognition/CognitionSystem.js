const logger = require('../../utils/logger');
const Network = require('./Network');
const Remember = require('./Remember');
const Recall = require('./Recall');
const Prime = require('./Prime');
const { TimeBasedWeightStrategy } = require('./WeightStrategy');

/**
 * CognitionSystem - 认知系统主控制器
 * 
 * ## 设计理念
 * 
 * CognitionSystem是整个认知模块的门面（Facade），统一管理所有认知操作。
 * 它协调Network、Remember、Recall、Prime等组件，提供简单的API。
 * 
 * ## 为什么这样设计
 * 
 * 1. **统一入口**
 *    - 外部只需要与CognitionSystem交互
 *    - 隐藏内部复杂性
 *    - 便于版本升级和重构
 * 
 * 2. **生命周期管理**
 *    - 管理Network的创建和销毁
 *    - 协调各操作的执行顺序
 *    - 处理频率更新等统计任务
 * 
 * 3. **策略注入**
 *    - 统一的权重策略配置
 *    - 确保Remember和Recall使用相同策略
 *    - 便于切换不同的策略实现
 * 
 * ## 架构位置
 * 
 * ```
 * 用户代码
 *    ↓
 * CognitionSystem (协调器)
 *    ├── Network (容器)
 *    ├── Remember (写)
 *    ├── Recall (读)
 *    └── Prime (启动)
 * ```
 * 
 * @class CognitionSystem
 */
class CognitionSystem {
  /**
   * 创建认知系统
   * 
   * @param {Object} options - 配置选项
   * @param {string} options.dataPath - 数据文件路径
   * @param {Object} options.strategyOptions - 策略配置
   * @param {Object} options.rememberOptions - Remember配置
   * @param {Object} options.recallOptions - Recall配置
   */
  constructor(options = {}) {
    /**
     * 数据持久化路径
     * @type {string}
     */
    this.dataPath = options.dataPath || './cognition.json';
    
    /**
     * 全局认知网络
     * @type {Network}
     */
    this.network = new Network();
    
    /**
     * 权重计算策略
     * @type {WeightStrategy}
     */
    this.strategy = new TimeBasedWeightStrategy({
      decay: 0.9,
      activationThreshold: 0.05,
      frequencyFactor: 0.1,  // 频率因子
      ...options.strategyOptions
    });
    
    // 让策略能访问network（用于获取频率）
    this.strategy.network = this.network;
    
    /**
     * Remember引擎配置
     * @type {Object}
     */
    this.rememberOptions = {
      ...options.rememberOptions,
      strategy: this.strategy
    };
    
    /**
     * Recall引擎配置
     * @type {Object}
     */
    this.recallOptions = {
      ...options.recallOptions,
      strategy: this.strategy
    };
    
    /**
     * Remember引擎实例（延迟创建）
     * @type {Remember|null}
     */
    this.rememberEngine = null;
    
    /**
     * Recall引擎实例（延迟创建）
     * @type {Recall|null}
     */
    this.recallEngine = null;
    
    logger.info('[CognitionSystem] Initialized', {
      dataPath: this.dataPath,
      strategyType: this.strategy.constructor.name
    });
  }
  
  /**
   * 获取Remember引擎（懒加载）
   * 
   * @returns {Remember}
   */
  getRememberEngine() {
    if (!this.rememberEngine) {
      this.rememberEngine = new Remember(this.network, this.rememberOptions);
    }
    return this.rememberEngine;
  }
  
  /**
   * 获取Recall引擎（懒加载）
   * 
   * @returns {Recall}
   */
  getRecallEngine() {
    if (!this.recallEngine) {
      this.recallEngine = new Recall(this.network, this.recallOptions);
    }
    return this.recallEngine;
  }
  
  /**
   * 记忆操作
   * 
   * 执行流程：
   * 1. 调用Remember引擎处理Schema
   * 2. 自动保存到磁盘
   * 
   * @param {Array<string>} schema - 概念序列
   * @returns {Object} 记忆结果
   */
  remember(schema) {
    logger.debug('[CognitionSystem] Remember operation', {
      schemaLength: schema.length,
      firstWord: schema[0]
    });
    
    const remember = this.getRememberEngine();
    const result = remember.execute(schema);
    
    // 注意：持久化由CognitionManager.saveSystem()负责
    // 这里不再自动保存，避免路径冲突
    
    return result;
  }
  
  /**
   * 回忆操作
   * 
   * 执行流程：
   * 1. 调用Recall引擎激活网络
   * 2. 更新被激活节点的频率
   * 3. 返回激活的Mind
   * 
   * @param {string} word - 起始概念
   * @returns {Mind|null} 激活的认知网络
   */
  recall(word) {
    logger.debug('[CognitionSystem] Recall operation', { word });
    
    const recall = this.getRecallEngine();
    const mind = recall.execute(word);
    
    // 更新频率
    if (mind && mind.activatedCues.size > 0) {
      this.network.updateRecallFrequency(mind.activatedCues);
      logger.debug('[CognitionSystem] Updated frequencies after recall', {
        activatedCount: mind.activatedCues.size
      });
    }
    
    return mind;
  }
  
  /**
   * 启动操作
   * 
   * 执行流程：
   * 1. 从磁盘加载Network
   * 2. 使用Prime选择起始点
   * 3. 执行预热Recall
   * 
   * @returns {Mind|null} 预热的认知网络
   */
  prime() {
    logger.debug('[CognitionSystem] Prime operation');
    
    // 注意：数据加载已由CognitionManager.getSystem()完成
    // 这里直接使用已加载的network，不再重复加载
    logger.info('[CognitionSystem] Using existing network', {
      cues: this.network.size()
    });
    
    // 使用Prime选择起始点
    const prime = new Prime(this.network);
    const startWord = prime.execute();
    
    if (!startWord) {
      logger.warn('[CognitionSystem] Prime found no suitable starting point');
      return null;
    }
    
    logger.info('[CognitionSystem] Prime selected starting point', {
      word: startWord
    });
    
    // 执行预热recall（不更新频率）
    const recall = this.getRecallEngine();
    const mind = recall.execute(startWord);
    
    // Prime时不更新频率，因为这是系统自动触发的
    
    return mind;
  }
  
  /**
   * 获取系统统计信息
   * 
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const networkStats = this.network.getStatistics();
    const frequencyStats = this.network.getFrequencyStatistics();
    
    return {
      network: networkStats,
      frequency: frequencyStats,
      dataPath: this.dataPath,
      strategy: {
        type: this.strategy.constructor.name,
        decay: this.strategy.decay,
        frequencyFactor: this.strategy.frequencyFactor || 0
      }
    };
  }
  
  /**
   * 清空系统
   * 
   * 用于测试或重置。
   */
  clear() {
    this.network.clear();
    this.rememberEngine = null;
    this.recallEngine = null;
    logger.info('[CognitionSystem] System cleared');
  }
  
  /**
   * 手动保存
   * 
   * 虽然remember会自动保存，但提供手动保存接口。
   */
  save() {
    this.network.persistSync(this.dataPath);
    logger.info('[CognitionSystem] Manual save completed');
  }
  
  /**
   * 手动加载
   * 
   * 虽然prime会自动加载，但提供手动加载接口。
   */
  load() {
    this.network.loadSync(this.dataPath);
    // 重置引擎，因为network变了
    this.rememberEngine = null;
    this.recallEngine = null;
    logger.info('[CognitionSystem] Manual load completed');
  }
}

module.exports = CognitionSystem;