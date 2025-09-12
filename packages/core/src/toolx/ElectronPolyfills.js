const logger = require('@promptx/logger');

/**
 * ElectronPolyfills - 为Electron环境提供缺失的全局对象
 * 
 * 职责：
 * - 检测运行环境（Node.js vs Electron）
 * - 提供安全的polyfill实现
 * - 只注入必要且安全的API
 */
class ElectronPolyfills {
  constructor() {
    this.polyfills = {};
    this.isElectron = this.detectElectronEnvironment();
  }

  /**
   * 检测是否在Electron环境中运行
   * @returns {boolean}
   */
  detectElectronEnvironment() {
    // 多种方式检测Electron环境
    const checks = [
      // 检查process.versions.electron
      () => typeof process !== 'undefined' && process.versions && !!process.versions.electron,
      // 检查process.type
      () => typeof process !== 'undefined' && (process.type === 'renderer' || process.type === 'browser'),
      // 检查window.process（Electron特有）
      () => typeof window !== 'undefined' && window.process && window.process.type,
      // 检查navigator.userAgent
      () => typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Electron')
    ];

    return checks.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  }

  /**
   * 获取所有需要的polyfills
   * @returns {Object} polyfill对象集合
   */
  getPolyfills() {
    logger.info('[ElectronPolyfills] getPolyfills called');
    const polyfills = {};

    // 1. URL相关API（Node.js内置，安全）
    this.addURLPolyfills(polyfills);
    
    // 2. 文本编码API（Node.js内置，安全）
    this.addTextEncodingPolyfills(polyfills);
    
    // 3. Base64编码（Node.js内置，安全）
    this.addBase64Polyfills(polyfills);
    
    // 4. File和Blob API（最小化实现，满足基本需求）
    // 总是添加，让沙箱环境决定是否需要使用
    logger.info('[ElectronPolyfills] Calling addFileAPIPolyfills');
    this.addFileAPIPolyfills(polyfills);
    
    logger.info('[ElectronPolyfills] Polyfills ready, keys:', Object.keys(polyfills));
    return polyfills;
  }

  /**
   * 添加URL相关的polyfills
   */
  addURLPolyfills(polyfills) {
    try {
      if (typeof URL === 'undefined') {
        const { URL, URLSearchParams } = require('url');
        polyfills.URL = URL;
        polyfills.URLSearchParams = URLSearchParams;
        logger.debug('[ElectronPolyfills] Added URL and URLSearchParams');
      }
    } catch (error) {
      logger.warn('[ElectronPolyfills] Failed to add URL polyfills:', error.message);
    }
  }

  /**
   * 添加文本编码相关的polyfills
   */
  addTextEncodingPolyfills(polyfills) {
    try {
      if (typeof TextEncoder === 'undefined') {
        const { TextEncoder, TextDecoder } = require('util');
        polyfills.TextEncoder = TextEncoder;
        polyfills.TextDecoder = TextDecoder;
        logger.debug('[ElectronPolyfills] Added TextEncoder and TextDecoder');
      }
    } catch (error) {
      logger.warn('[ElectronPolyfills] Failed to add text encoding polyfills:', error.message);
    }
  }

  /**
   * 添加Base64编码polyfills
   */
  addBase64Polyfills(polyfills) {
    try {
      if (typeof btoa === 'undefined') {
        polyfills.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
        polyfills.atob = (str) => Buffer.from(str, 'base64').toString('binary');
        logger.debug('[ElectronPolyfills] Added btoa and atob');
      }
    } catch (error) {
      logger.warn('[ElectronPolyfills] Failed to add base64 polyfills:', error.message);
    }
  }

  /**
   * 添加File和Blob API polyfills
   * 只在Electron环境中添加，提供最小化的安全实现
   */
  addFileAPIPolyfills(polyfills) {
    logger.info('[ElectronPolyfills] addFileAPIPolyfills called');
    try {
      // File polyfill - 总是提供，让沙箱决定是否使用
      class FilePolyfill {
          constructor(chunks, filename, options = {}) {
            this.name = filename;
            this.lastModified = options.lastModified || Date.now();
            this.type = options.type || 'application/octet-stream';
            
            // 将chunks转换为Buffer
            let buffer;
            if (chunks.length === 0) {
              buffer = Buffer.alloc(0);
            } else if (Buffer.isBuffer(chunks[0])) {
              buffer = Buffer.concat(chunks);
            } else if (typeof chunks[0] === 'string') {
              buffer = Buffer.from(chunks.join(''));
            } else if (chunks[0] instanceof ArrayBuffer) {
              buffer = Buffer.from(chunks[0]);
            } else {
              buffer = Buffer.from(String(chunks[0]));
            }
            
            this.size = buffer.length;
            this._buffer = buffer;
          }
          
          // 提供基本的方法
          async arrayBuffer() {
            return this._buffer.buffer.slice(
              this._buffer.byteOffset,
              this._buffer.byteOffset + this._buffer.byteLength
            );
          }
          
          async text() {
            return this._buffer.toString('utf-8');
          }
          
          stream() {
            const { Readable } = require('stream');
            return Readable.from(this._buffer);
          }
          
          slice(start = 0, end = this.size, contentType) {
            const sliced = this._buffer.slice(start, end);
            return new FilePolyfill([sliced], this.name, { 
              type: contentType || this.type,
              lastModified: this.lastModified
            });
          }
        }
      
      polyfills.File = FilePolyfill;
      logger.info('[ElectronPolyfills] Added File polyfill');

      // Blob polyfill - 总是提供，让沙箱决定是否使用
      class BlobPolyfill {
          constructor(parts = [], options = {}) {
            this.type = options.type || '';
            
            // 将parts转换为Buffer
            let buffer;
            if (parts.length === 0) {
              buffer = Buffer.alloc(0);
            } else if (Buffer.isBuffer(parts[0])) {
              buffer = Buffer.concat(parts);
            } else if (typeof parts[0] === 'string') {
              buffer = Buffer.from(parts.join(''));
            } else if (parts[0] instanceof ArrayBuffer) {
              buffer = Buffer.from(parts[0]);
            } else if (parts[0] && parts[0]._buffer) {
              // 处理其他Blob或File对象
              buffer = parts[0]._buffer;
            } else {
              buffer = Buffer.from(String(parts[0]));
            }
            
            this.size = buffer.length;
            this._buffer = buffer;
          }
          
          async arrayBuffer() {
            return this._buffer.buffer.slice(
              this._buffer.byteOffset,
              this._buffer.byteOffset + this._buffer.byteLength
            );
          }
          
          async text() {
            return this._buffer.toString('utf-8');
          }
          
          stream() {
            const { Readable } = require('stream');
            return Readable.from(this._buffer);
          }
          
          slice(start = 0, end = this.size, contentType) {
            const sliced = this._buffer.slice(start, end);
            return new BlobPolyfill([sliced], { type: contentType || this.type });
          }
        }
      
      polyfills.Blob = BlobPolyfill;
      logger.info('[ElectronPolyfills] Added Blob polyfill');

      // FormData polyfill (简单实现，仅满足基本需求) - 总是提供
      class FormDataPolyfill {
          constructor() {
            this._data = new Map();
          }
          
          append(name, value, filename) {
            if (!this._data.has(name)) {
              this._data.set(name, []);
            }
            this._data.get(name).push({ value, filename });
          }
          
          get(name) {
            const values = this._data.get(name);
            return values ? values[0].value : null;
          }
          
          getAll(name) {
            const values = this._data.get(name);
            return values ? values.map(v => v.value) : [];
          }
          
          has(name) {
            return this._data.has(name);
          }
          
          delete(name) {
            return this._data.delete(name);
          }
          
          set(name, value, filename) {
            this._data.set(name, [{ value, filename }]);
          }
          
          entries() {
            const entries = [];
            for (const [name, values] of this._data) {
              for (const { value } of values) {
                entries.push([name, value]);
              }
            }
            return entries[Symbol.iterator]();
          }
          
          keys() {
            return this._data.keys();
          }
          
          values() {
            const values = [];
            for (const valueList of this._data.values()) {
              values.push(...valueList.map(v => v.value));
            }
            return values[Symbol.iterator]();
          }
        }
      
      polyfills.FormData = FormDataPolyfill;
      logger.info('[ElectronPolyfills] Added FormData polyfill');
      
    } catch (error) {
      logger.warn('[ElectronPolyfills] Failed to add File API polyfills:', error.message);
    }
  }

  /**
   * 获取环境信息
   */
  getEnvironmentInfo() {
    return {
      isElectron: this.isElectron,
      isRenderer: typeof process !== 'undefined' && process.type === 'renderer',
      isBrowser: typeof process !== 'undefined' && process.type === 'browser',
      electronVersion: typeof process !== 'undefined' && process.versions ? process.versions.electron : null,
      nodeVersion: typeof process !== 'undefined' && process.versions ? process.versions.node : null,
      v8Version: typeof process !== 'undefined' && process.versions ? process.versions.v8 : null
    };
  }
}

module.exports = ElectronPolyfills;