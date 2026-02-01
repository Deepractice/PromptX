/**
 * DefaultExportHandler - Default 导出处理器
 *
 * 处理有 default 属性但不是 ES Module 的情况
 * 需要检查 default 是否有实质内容
 */

const ModuleHandler = require('../base/ModuleHandler');
import logger from '@promptx/logger';

class DefaultExportHandler extends ModuleHandler {
  constructor() {
    super('DefaultExportHandler', 60); // 优先级60
  }

  async process(module) {
    if (!module || typeof module !== 'object') {
      return { handled: false };
    }

    // 已经被 ESModuleHandler 处理过的跳过
    if (module.__esModule) {
      return { handled: false };
    }

    // 检查是否有 default 导出
    if (module.default !== undefined) {
      // 检查 default 是否有实质内容
      if (this.isSubstantial(module.default)) {
        logger.debug(`[DefaultExportHandler] Found substantial default export`);
        return { handled: true, result: module.default };
      }

      // default 没有实质内容，检查其他导出
      const realKeys = this.getRealKeys(module);
      if (realKeys.length > 0) {
        logger.debug(`[DefaultExportHandler] Default is empty, using whole module`);
        return { handled: true, result: module };
      }
    }

    return { handled: false };
  }
}

module.exports = DefaultExportHandler;