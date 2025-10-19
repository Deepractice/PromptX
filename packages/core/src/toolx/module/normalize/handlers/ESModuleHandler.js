/**
 * ESModuleHandler - ES Module 处理器
 *
 * 处理带有 __esModule 标记的模块
 * 优先返回 default 导出
 */

const ModuleHandler = require('../base/ModuleHandler');

class ESModuleHandler extends ModuleHandler {
  constructor() {
    super('ESModuleHandler', 30); // 优先级30
  }

  async process(module) {
    if (!module || typeof module !== 'object') {
      return { handled: false };
    }

    // 检查 ES Module 标记
    if (module.__esModule) {
      // Check if there are named exports besides default and __esModule
      const realKeys = this.getRealKeys(module);

      // If has default but also has named exports, keep the whole module
      // This preserves modules like: export default Foo; export { Bar, Baz };
      if (module.default !== undefined && realKeys.length > 0) {
        return { handled: true, result: module };
      }

      // If only has default (no other exports), return default only
      if (module.default !== undefined) {
        return { handled: true, result: module.default };
      }

      // No default but is ES Module, return whole module
      return { handled: true, result: module };
    }

    return { handled: false };
  }
}

module.exports = ESModuleHandler;