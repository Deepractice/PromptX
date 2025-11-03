/**
 * @fileoverview 
 * Electron 自启动适配器
 * 实现了基于 auto-launch 库的应用程序开机自启动功能
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

import AutoLaunch from 'auto-launch';
import { IAutoStartPort } from '~/main/domain/ports/IAutoStartPort';

/**
 * Electron 自启动适配器配置选项
 */
export interface ElectronAutoStartAdapterOptions {
  /** 应用程序名称 */
  name: string;
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
 * Electron 自启动适配器
 * 
 * 此类实现了 IAutoStartPort 接口，提供基于 auto-launch 库的
 * 跨平台应用程序自启动功能支持（Windows、macOS、Linux）
 * 
 * @class ElectronAutoStartAdapter
 * @implements {IAutoStartPort}
 */
export class ElectronAutoStartAdapter implements IAutoStartPort {
  /**
   * AutoLaunch 实例，用于与操作系统的自启动机制交互
   * @private
   */
  private launcher: AutoLaunch;

  /**
   * 创建 ElectronAutoStartAdapter 的新实例
   * 
   * @constructor
   * @param {ElectronAutoStartAdapterOptions} options - 配置选项
   */
  constructor(options: ElectronAutoStartAdapterOptions) {
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