/**
 * ModuleNormalizer - 模块规范化责任链管理器
 *
 * 管理和执行模块规范化处理器链
 * 支持动态添加、删除处理器，调整处理顺序
 */

import logger from '@promptx/logger';

class ModuleNormalizer {
  constructor() {
    this.handlers = [];
    this.chain = null;
  }

  /**
   * 添加处理器
   * @param {ModuleHandler} handler
   * @returns {ModuleNormalizer} this，支持链式调用
   */
  addHandler(handler) {
    this.handlers.push(handler);
    // 按优先级排序
    this.handlers.sort((a, b) => a.priority - b.priority);
    this.rebuildChain();
    return this;
  }

  /**
   * 批量添加处理器
   * @param {ModuleHandler[]} handlers
   * @returns {ModuleNormalizer} this
   */
  addHandlers(handlers) {
    handlers.forEach(handler => this.handlers.push(handler));
    this.handlers.sort((a, b) => a.priority - b.priority);
    this.rebuildChain();
    return this;
  }

  /**
   * 移除处理器
   * @param {string} handlerName
   * @returns {ModuleNormalizer} this
   */
  removeHandler(handlerName) {
    this.handlers = this.handlers.filter(h => h.name !== handlerName);
    this.rebuildChain();
    return this;
  }

  /**
   * 重建处理链
   */
  rebuildChain() {
    if (this.handlers.length === 0) {
      this.chain = null;
      return;
    }

    // 构建链
    this.chain = this.handlers[0];
    let current = this.chain;
    for (let i = 1; i < this.handlers.length; i++) {
      current = current.setNext(this.handlers[i]);
      current = this.handlers[i];
    }

    logger.debug('[ModuleNormalizer] Chain rebuilt', {
      handlers: this.handlers.map(h => ({
        name: h.name,
        priority: h.priority
      }))
    });
  }

  /**
   * 规范化模块
   * @param {any} module 要规范化的模块
   * @param {string} moduleName 模块名称
   * @param {object} context 上下文信息
   * @returns {Promise<any>} 规范化后的模块
   */
  async normalize(module, moduleName, context = {}) {
    if (!this.chain) {
      logger.warn('[ModuleNormalizer] No handlers configured, returning original module');
      return module;
    }

    try {
      const startTime = Date.now();
      const result = await this.chain.handle(module, moduleName, context);

      const duration = Date.now() - startTime;
      logger.debug(`[ModuleNormalizer] Normalization completed`, {
        moduleName,
        duration,
        inputType: typeof module,
        outputType: typeof result.result,
        hasDefault: module && module.default !== undefined,
        isESModule: module && module.__esModule
      });

      return result.result;
    } catch (error) {
      logger.error(`[ModuleNormalizer] Failed to normalize ${moduleName}`, {
        error: error.message,
        stack: error.stack
      });
      // 失败时返回原模块
      return module;
    }
  }

  /**
   * 获取处理器信息
   * @returns {Array} 处理器列表
   */
  getHandlerInfo() {
    return this.handlers.map(h => ({
      name: h.name,
      priority: h.priority
    }));
  }

  /**
   * 清空所有处理器
   */
  clear() {
    this.handlers = [];
    this.chain = null;
  }

  /**
   * 设置默认处理器链
   * 这个方法将在 index.js 中调用，以避免循环依赖
   */
  setupDefaultHandlers(handlers) {
    this.clear();
    this.addHandlers(handlers);
  }
}

module.exports = ModuleNormalizer;