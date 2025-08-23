const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

/**
 * Anchor - 认知状态锚定器
 * 
 * ## 设计理念
 * 
 * Anchor负责将当前的认知状态"锚定"（固定）下来，
 * 供下次Prime时恢复，实现意识的连续性。
 * 
 * 这就像睡前的最后一个念头，会成为醒来时的第一个念头。
 * 
 * ## 认知心理学背景
 * 
 * - **State Capture**: 捕获当前工作记忆状态
 * - **Context Preservation**: 保存认知上下文
 * - **Retrieval Cue Persistence**: 持久化提取线索
 * 
 * ## 与其他组件的关系
 * 
 * - **Recall**: 激活网络，产生Mind
 * - **Anchor**: 锚定Mind状态到State.json
 * - **Prime**: 从State.json恢复上次的认知状态
 * 
 * @class Anchor
 */
class Anchor {
  /**
   * @param {Network} network - 认知网络
   */
  constructor(network) {
    /**
     * 认知网络引用
     * @type {Network}
     */
    this.network = network;
    
    /**
     * 状态文件路径
     * @type {string}
     */
    this.statePath = path.join(network.directory, 'state.json');
    
    logger.debug('[Anchor] Initialized', {
      roleId: network.roleId,
      statePath: this.statePath
    });
  }
  
  /**
   * 执行认知状态锚定
   * 
   * 将当前激活的认知网络状态保存下来，
   * 包括中心词、激活的节点、连接等。
   * 
   * @param {string} centerWord - 中心词（最后recall的词）
   * @param {Mind} mind - 当前激活的Mind对象
   * @returns {Promise<Object>} 锚定的状态对象
   */
  async execute(centerWord, mind) {
    logger.debug('[Anchor] Starting anchor', { 
      centerWord,
      mindSize: mind?.activatedCues?.size || 0
    });
    
    // 构建状态对象
    const state = {
      // 核心信息
      centerWord,
      timestamp: Date.now(),
      roleId: this.network.roleId,
      
      // 激活的节点
      activatedCues: Array.from(mind.activatedCues.keys()),
      
      // 连接关系
      connections: mind.connections.map(conn => ({
        from: conn.from,
        to: conn.to,
        weight: conn.weight
      })),
      
      // 元数据
      metadata: {
        nodeCount: mind.activatedCues.size,
        connectionCount: mind.connections.length,
        anchorVersion: '1.0.0'
      }
    };
    
    try {
      // 确保目录存在
      const dir = path.dirname(this.statePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 写入状态文件
      await fs.writeFile(
        this.statePath, 
        JSON.stringify(state, null, 2),
        'utf-8'
      );
      
      logger.info('[Anchor] State anchored successfully', {
        centerWord: state.centerWord,
        roleId: state.roleId,
        nodeCount: state.metadata.nodeCount,
        connectionCount: state.metadata.connectionCount
      });
      
      return state;
      
    } catch (error) {
      logger.error('[Anchor] Failed to anchor state', {
        error: error.message,
        centerWord,
        roleId: this.network.roleId
      });
      throw error;
    }
  }
  
  /**
   * 加载锚定的认知状态
   * 
   * 从State.json读取上次锚定的状态，
   * 供Prime使用来恢复认知上下文。
   * 
   * @returns {Promise<Object|null>} 锚定的状态对象，如果不存在返回null
   */
  async load() {
    try {
      // 检查文件是否存在
      const exists = await fs.access(this.statePath)
        .then(() => true)
        .catch(() => false);
        
      if (!exists) {
        logger.debug('[Anchor] No anchored state found', {
          roleId: this.network.roleId
        });
        return null;
      }
      
      // 读取状态文件
      const content = await fs.readFile(this.statePath, 'utf-8');
      const state = JSON.parse(content);
      
      logger.info('[Anchor] State loaded successfully', {
        centerWord: state.centerWord,
        roleId: state.roleId,
        nodeCount: state.metadata?.nodeCount,
        timestamp: new Date(state.timestamp).toISOString()
      });
      
      return state;
      
    } catch (error) {
      logger.error('[Anchor] Failed to load state', {
        error: error.message,
        roleId: this.network.roleId
      });
      return null;
    }
  }
  
  /**
   * 清除锚定状态
   * 
   * 删除State.json文件，用于重置认知状态。
   * 
   * @returns {Promise<boolean>} 是否成功清除
   */
  async clear() {
    try {
      const exists = await fs.access(this.statePath)
        .then(() => true)
        .catch(() => false);
        
      if (exists) {
        await fs.unlink(this.statePath);
        logger.info('[Anchor] State cleared', {
          roleId: this.network.roleId
        });
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('[Anchor] Failed to clear state', {
        error: error.message,
        roleId: this.network.roleId
      });
      return false;
    }
  }
  
  /**
   * 获取锚定状态的元信息
   * 
   * 不加载完整状态，只返回基本信息。
   * 
   * @returns {Promise<Object|null>} 元信息对象
   */
  async getMetadata() {
    const state = await this.load();
    
    if (!state) {
      return null;
    }
    
    return {
      centerWord: state.centerWord,
      timestamp: state.timestamp,
      roleId: state.roleId,
      nodeCount: state.metadata?.nodeCount,
      connectionCount: state.metadata?.connectionCount
    };
  }
}

module.exports = Anchor;