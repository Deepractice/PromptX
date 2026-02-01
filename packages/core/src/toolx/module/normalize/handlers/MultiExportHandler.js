/**
 * MultiExportHandler - 多导出对象处理器
 *
 * 处理有多个导出的对象类型模块
 * 例如：lodash、nodemailer 等工具库
 * 这类模块应该保持整个对象，不要解包
 */

const ModuleHandler = require('../base/ModuleHandler');
import logger from '@promptx/logger';

class MultiExportHandler extends ModuleHandler {
  constructor() {
    super('MultiExportHandler', 40); // 优先级40，在 ESModule 之后
  }

  async process(module, moduleName) {
    if (!module || typeof module !== 'object') {
      return { handled: false };
    }

    // 获取实际的导出键（排除元数据）
    const realKeys = this.getRealKeys(module);

    // 多个导出的对象，保持原样返回
    if (realKeys.length > 1) {
      logger.debug(`[MultiExportHandler] ${moduleName} has ${realKeys.length} exports`, {
        exports: realKeys.slice(0, 10) // 只记录前10个避免日志过大
      });
      return { handled: true, result: module };
    }

    return { handled: false };
  }
}

module.exports = MultiExportHandler;