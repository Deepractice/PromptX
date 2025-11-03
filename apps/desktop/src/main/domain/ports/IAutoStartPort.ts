/**
 * @fileoverview 
 * 自启动管理端口接口
 * 定义了应用程序开机自启动功能的核心业务操作
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

/**
 * 自启动管理端口接口
 * 
 * 此接口定义了应用程序自启动功能的核心操作，
 * 遵循 Hexagonal Architecture 的端口适配器模式
 * 
 * @interface IAutoStartPort
 */
export interface IAutoStartPort {
  /**
   * 启用应用程序的开机自启动功能
   * 
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果启用过程中发生错误
   */
  enable(): Promise<void>;

  /**
   * 禁用应用程序的开机自启动功能
   * 
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果禁用过程中发生错误
   */
  disable(): Promise<void>;

  /**
   * 检查应用程序的开机自启动功能是否已启用
   * 
   * @returns {Promise<boolean>} 如果启用则返回 true，否则返回 false
   * @throws {Error} 如果检查过程中发生错误
   */
  isEnabled(): Promise<boolean>;
}