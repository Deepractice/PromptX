/**
 * @fileoverview 
 * 此文件提供了 AutoStartManager 类，用于管理 PromptX 应用程序的开机自启动功能。
 * 它封装了 auto-launch 库的功能，提供了简单易用的 API 来启用、禁用和检查自启动状态。
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

/**
 * 导入 auto-launch 库，它提供了跨平台的应用程序自启动功能支持
 * 支持 Windows、macOS 和 Linux 系统
 */
import AutoLaunch from 'auto-launch';

/**
 * AutoStartManager 配置选项接口
 * 
 * @interface AutoStartManagerOptions
 * @property {string} appName - 应用程序名称，将显示在操作系统的自启动列表中
 * @property {string} [appPath] - 可选的应用程序路径，如果不提供，auto-launch 将尝试自动检测
 *                               对于 Electron 应用，通常不需要指定
 * @property {object} [mac] - macOS 特定的配置选项
 * @property {boolean} [mac.useLaunchAgent] - 是否使用 LaunchAgent 而不是 Login Items (macOS)
 */
export interface AutoStartManagerOptions {
  /** 应用程序名称 */
  name: string;  // 应用程序名称，将显示在操作系统的自启动列表中
  /** 应用程序路径，默认为 process.execPath */
  path?: string;
  /** 启动时隐藏，默认为 false */
  isHidden?: boolean;
  /** macOS 特定选项 */
  mac?: {
    useLaunchAgent?: boolean;
  };
}

/**
 * AutoStartManager 类 - 管理应用程序的开机自启动功能
 * 
 * 此类提供了一个简单的接口来控制应用程序的自启动行为，
 * 包括启用、禁用自启动功能以及检查当前状态。
 * 
 * @class AutoStartManager
 */
export class AutoStartManager {
  /**
   * AutoLaunch 实例，用于与操作系统的自启动机制交互
   * @private
   */
  private launcher: AutoLaunch;

  /**
   * 创建 AutoStartManager 的新实例
   * 
   * @constructor
   * @param {AutoStartManagerOptions} options - 配置选项
   */
  constructor(options: AutoStartManagerOptions) {
    this.launcher = new AutoLaunch(options);
  }

  /**
   * 启用应用程序的开机自启动功能
   * 如果已经启用，则不会执行任何操作
   * 
   * @async
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果启用过程中发生错误
   */
  async enable(): Promise<void> {
    try {
      // 首先检查是否已启用，避免重复操作
      const isEnabled = await this.isEnabled();
      if (!isEnabled) {
        await this.launcher.enable();
      }
    } catch (error) {
      console.error('Failed to enable auto-start:', error);
      throw error;
    }
  }

  /**
   * 禁用应用程序的开机自启动功能
   * 如果已经禁用，则不会执行任何操作
   * 
   * @async
   * @returns {Promise<void>} 操作完成的 Promise
   * @throws {Error} 如果禁用过程中发生错误
   */
  async disable(): Promise<void> {
    try {
      // 首先检查是否已禁用，避免重复操作
      const isEnabled = await this.isEnabled();
      if (isEnabled) {
        await this.launcher.disable();
      }
    } catch (error) {
      console.error('Failed to disable auto-start:', error);
      throw error;
    }
  }

  /**
   * 检查应用程序的开机自启动功能是否已启用
   * 
   * @async
   * @returns {Promise<boolean>} 如果启用则返回 true，否则返回 false
   * @throws {Error} 如果检查过程中发生错误
   */
  async isEnabled(): Promise<boolean> {
    try {
      return await this.launcher.isEnabled();
    } catch (error) {
      console.error('Failed to check if auto-start is enabled:', error);
      throw error;
    }
  }
}