// Computation - 计算处理
// 认知心理学基础：Computational Processing（计算处理）
//
// === 认知心理学概念 ===
//
// 计算处理（Computation）与精细加工（Elaboration）形成对称：
// 1. Elaboration - AI的语义理解和生成（模糊、创造性）
// 2. Computation - 计算机的精确执行（确定、可重复）
//
// 在认知系统中的角色：
// - 处理确定性任务（文件操作、代码执行、数据计算）
// - 提供精确的反馈和结果
// - 补充AI的创造性思维
// - 形成完整的认知能力
//
// === 设计原则 ===
//
// 1. 对称性：与Elaboration保持接口对称
// 2. 可追溯：记录完整的命令和结果
// 3. 类型明确：清晰标识计算操作类型
// 4. 错误处理：优雅处理执行失败

/**
 * Computation Class - 计算处理类
 * 
 * 表示一次完整的计算机操作过程。
 * 将command（命令）和计算机执行的result（结果）绑定在一起。
 * 
 * 核心理念：
 * - 每个计算结果都有其对应的命令
 * - 体现了确定性的执行过程
 * - 便于管理和追踪计算活动
 */
class Computation {
  /**
   * 构造函数
   * 
   * @param {string} command - 执行的命令或操作描述
   * @param {*} result - 计算机执行后的结果
   * @param {string} type - 计算操作的类型
   * @param {Object} metadata - 可选的元数据
   */
  constructor(command, result, type, metadata = {}) {
    this._command = command;
    this._result = result;
    this._type = type;
    this._timestamp = Date.now();
    this._metadata = metadata;
    this._success = metadata.success !== false; // 默认为成功
    this._error = metadata.error || null;
  }

  /**
   * 获取命令
   * 
   * @returns {string} 原始的执行命令
   */
  getCommand() {
    return this._command;
  }

  /**
   * 获取执行结果
   * 
   * 这是计算的结果，包含了：
   * - 文件操作的返回值
   * - 代码执行的输出
   * - 系统命令的响应
   * - 数据处理的结果
   * 
   * @returns {*} 计算机生成的结果
   */
  getResult() {
    return this._result;
  }

  /**
   * 获取计算类型
   * 
   * 标识这是哪种类型的计算操作：
   * - 'file_operation' - 文件操作（读写、创建、删除）
   * - 'code_execution' - 代码执行（运行脚本、测试）
   * - 'data_processing' - 数据处理（解析、转换、计算）
   * - 'system_command' - 系统命令（shell、环境操作）
   * - 'tool_invocation' - 工具调用（MCP工具、API调用）
   * 
   * @returns {string} 类型标识
   */
  getType() {
    return this._type;
  }

  /**
   * 获取时间戳
   * 
   * @returns {number} 执行时间戳
   */
  getTimestamp() {
    return this._timestamp;
  }

  /**
   * 获取元数据
   * 
   * 可能包含：
   * - 执行时长
   * - 资源消耗
   * - 执行环境
   * - 错误信息
   * 
   * @returns {Object} 元数据对象
   */
  getMetadata() {
    return this._metadata;
  }

  /**
   * 检查执行是否成功
   * 
   * @returns {boolean} 是否成功
   */
  isSuccess() {
    return this._success;
  }

  /**
   * 获取错误信息
   * 
   * @returns {Error|null} 错误对象或null
   */
  getError() {
    return this._error;
  }

  /**
   * 检查结果是否为空
   * 
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    if (this._result === null || this._result === undefined) {
      return true;
    }
    if (typeof this._result === 'string') {
      return this._result.trim() === '';
    }
    if (Array.isArray(this._result)) {
      return this._result.length === 0;
    }
    if (typeof this._result === 'object') {
      return Object.keys(this._result).length === 0;
    }
    return false;
  }

  /**
   * 获取结果摘要
   * 
   * 用于调试和日志，提供结果的简短描述
   * 
   * @returns {string} 摘要信息
   */
  getSummary() {
    if (!this._success) {
      return `Failed ${this._type}: ${this._error?.message || 'Unknown error'}`;
    }
    
    if (this.isEmpty()) {
      return `Empty ${this._type} result`;
    }
    
    if (typeof this._result === 'string') {
      const lines = this._result.split('\n');
      const preview = lines[0].substring(0, 50);
      return `${this._type}: "${preview}${lines[0].length > 50 ? '...' : ''}"${lines.length > 1 ? ` (+${lines.length - 1} lines)` : ''}`;
    }
    
    if (Array.isArray(this._result)) {
      return `${this._type}: ${this._result.length} items`;
    }
    
    return `${this._type}: ${typeof this._result}`;
  }

  /**
   * 转换为JSON
   * 
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      command: this._command,
      result: this._result,
      type: this._type,
      timestamp: this._timestamp,
      success: this._success,
      error: this._error,
      metadata: this._metadata
    };
  }

  /**
   * 创建失败的Computation
   * 
   * @param {string} command - 执行的命令
   * @param {Error} error - 错误对象
   * @param {string} type - 操作类型
   * @param {Object} metadata - 额外元数据
   * @returns {Computation} 失败的Computation实例
   */
  static createFailure(command, error, type, metadata = {}) {
    return new Computation(
      command,
      null,
      type,
      {
        ...metadata,
        success: false,
        error: error
      }
    );
  }
}

/**
 * 计算类型常量
 */
Computation.Types = {
  FILE_OPERATION: 'file_operation',
  CODE_EXECUTION: 'code_execution',
  DATA_PROCESSING: 'data_processing',
  SYSTEM_COMMAND: 'system_command',
  TOOL_INVOCATION: 'tool_invocation'
};

module.exports = { Computation };