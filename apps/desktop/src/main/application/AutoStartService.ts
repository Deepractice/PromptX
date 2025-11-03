/**
 * @fileoverview 
 * 自启动服务
 * 提供应用程序自启动功能的业务逻辑层
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

import { IAutoStartPort } from '~/main/domain/ports/IAutoStartPort';

/**
 * 自启动服务
 * 
 * 此类提供了应用程序自启动功能的业务逻辑，
 * 作为应用层与基础设施层之间的桥梁
 * 
 * @class AutoStartService
 */
export class AutoStartService {
  /**
   * 创建 AutoStartService 的新实例
   * 
   * @constructor
   * @param {IAutoStartPort} autoStartPort - 自启动端口实现
   */
  constructor(private readonly autoStartPort: IAutoStartPort) {}

  /**
   * 启用应用程序的开机自启动功能
   * 
   * @async
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果启用过程中发生错误
   */
  async enableAutoStart(): Promise<void> {
    await this.autoStartPort.enable();
  }

  /**
   * 禁用应用程序的开机自启动功能
   * 
   * @async
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果禁用过程中发生错误
   */
  async disableAutoStart(): Promise<void> {
    await this.autoStartPort.disable();
  }

  /**
   * 检查应用程序的开机自启动功能是否已启用
   * 
   * @async
   * @returns {Promise<boolean>} 如果启用则返回 true，否则返回 false
   * @throws {Error} 如果检查过程中发生错误
   */
  async isAutoStartEnabled(): Promise<boolean> {
    return await this.autoStartPort.isEnabled();
  }

  /**
   * 切换自启动状态
   * 如果当前已启用则禁用，如果当前已禁用则启用
   * 
   * @async
   * @returns {Promise<boolean>} 切换后的状态，true 表示已启用，false 表示已禁用
   * @throws {Error} 如果操作过程中发生错误
   */
  async toggleAutoStart(): Promise<boolean> {
    const isEnabled = await this.isAutoStartEnabled();
    
    if (isEnabled) {
      await this.disableAutoStart();
      return false;
    } else {
      await this.enableAutoStart();
      return true;
    }
  }
}