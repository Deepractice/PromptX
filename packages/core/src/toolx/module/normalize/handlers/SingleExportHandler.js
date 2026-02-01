/**
 * SingleExportHandler - 单一导出处理器
 *
 * 处理只有一个导出的模块
 * 需要智能判断是否应该解包
 */

const ModuleHandler = require('../base/ModuleHandler');
import logger from '@promptx/logger';

class SingleExportHandler extends ModuleHandler {
  constructor() {
    super('SingleExportHandler', 50); // 优先级50，在多导出之后
  }

  async process(module, moduleName) {
    if (!module || typeof module !== 'object') {
      return { handled: false };
    }

    const realKeys = this.getRealKeys(module);

    if (realKeys.length === 1) {
      const key = realKeys[0];
      const singleExport = module[key];

      // 如果单一导出是函数，直接返回
      if (typeof singleExport === 'function') {
        logger.debug(`[SingleExportHandler] ${moduleName} single function export: ${key}`);
        return { handled: true, result: singleExport };
      }

      // 如果是类（构造函数），也直接返回
      if (typeof singleExport === 'function' && singleExport.prototype) {
        logger.debug(`[SingleExportHandler] ${moduleName} single class export: ${key}`);
        return { handled: true, result: singleExport };
      }

      // 检查是否是包装键（应该解包）
      const wrappingKeys = [
        'default',
        'exports',
        moduleName,
        moduleName.split('/').pop(),
        moduleName.split('-').join(''),
        moduleName.split('_').join('')
      ];

      if (wrappingKeys.some(wk => wk.toLowerCase() === key.toLowerCase())) {
        logger.debug(`[SingleExportHandler] ${moduleName} unwrapping ${key}`);
        return { handled: true, result: singleExport };
      }

      // 保守策略：不确定时返回整个模块
      logger.debug(`[SingleExportHandler] ${moduleName} keeping whole module (single export: ${key})`);
      return { handled: true, result: module };
    }

    return { handled: false };
  }
}

module.exports = SingleExportHandler;