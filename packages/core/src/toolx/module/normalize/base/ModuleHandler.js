/**
 * ModuleHandler - 模块处理器基类
 *
 * 责任链模式的基础类，定义了处理器的接口和链式调用机制
 * 所有具体的模块规范化处理器都应继承此类
 */

import logger from '@promptx/logger';

class ModuleHandler {
  constructor(name, priority = 100) {
    this.name = name;
    this.priority = priority; // 优先级，数字越小优先级越高
    this.next = null;
  }

  /**
   * 设置下一个处理器
   * @param {ModuleHandler} handler
   * @returns {ModuleHandler} 返回设置的handler，便于链式调用
   */
  setNext(handler) {
    this.next = handler;
    return handler;
  }

  /**
   * 处理模块 - 模板方法
   * @param {any} module 要处理的模块
   * @param {string} moduleName 模块名称
   * @param {object} context 上下文信息
   * @returns {Promise<{handled: boolean, result: any}>}
   */
  async handle(module, moduleName, context = {}) {
    try {
      // 调用子类的具体处理逻辑
      const result = await this.process(module, moduleName, context);

      if (result.handled) {
        logger.info(`[ModuleHandler] ${moduleName} handled by ${this.name}`, {
          handler: this.name,
          moduleName,
          resultType: typeof result.result
        });
        return result;
      }

      // 传递给下一个处理器
      if (this.next) {
        return this.next.handle(module, moduleName, context);
      }

      // 没有处理器能处理，返回原模块
      logger.debug(`[ModuleHandler] ${moduleName} not handled by any handler, returning original`);
      return { handled: true, result: module };

    } catch (error) {
      logger.error(`[ModuleHandler] ${this.name} failed to process ${moduleName}`, {
        error: error.message,
        handler: this.name,
        moduleName
      });

      // 处理失败，尝试下一个处理器
      if (this.next) {
        return this.next.handle(module, moduleName, context);
      }

      // 没有更多处理器，返回原模块
      return { handled: true, result: module };
    }
  }

  /**
   * 具体的处理逻辑 - 子类必须实现
   * @param {any} module
   * @param {string} moduleName
   * @param {object} context
   * @returns {Promise<{handled: boolean, result?: any}>}
   */
  async process(module, moduleName, context) {
    throw new Error(`Handler ${this.name} must implement process method`);
  }

  /**
   * 检查模块是否有实质内容
   * @param {any} value
   * @returns {boolean}
   */
  isSubstantial(value) {
    if (value === null || value === undefined) {
      return false;
    }

    const type = typeof value;

    if (type === 'function') {
      return true;
    }

    if (type === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Object.keys(value).length > 0;
    }

    // 字符串、数字、布尔值
    if (type === 'string') {
      return value !== '';
    }

    return true; // 其他类型默认有实质内容
  }

  /**
   * 获取模块的实际键（排除元数据）
   * @param {object} module
   * @returns {string[]}
   */
  getRealKeys(module) {
    if (!module || typeof module !== 'object') {
      return [];
    }

    return Object.keys(module).filter(k =>
      k !== '__esModule' &&
      k !== 'default' &&
      k !== Symbol.toStringTag &&
      !k.startsWith('__')
    );
  }
}

module.exports = ModuleHandler;