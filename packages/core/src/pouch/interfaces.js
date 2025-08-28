/**
 * 锦囊框架核心接口定义
 * PATEOAS (Prompt as the Engine of Application State)
 */

/**
 * 动作定义
 * @typedef {Object} Action
 * @property {string} name - 动作名称
 * @property {string} description - 动作描述
 * @property {string} command - 执行命令
 * @property {Object} [parameters] - 命令参数
 * @property {string} [condition] - 执行条件
 */

/**
 * PATEOAS导航信息
 * @typedef {Object} PATEOASNavigation
 * @property {Action[]} nextActions - 下一步可执行的动作列表
 * @property {string} currentState - 当前状态
 * @property {string[]} availableTransitions - 可用的状态转换
 * @property {Object} [metadata] - 额外的元数据
 */

/**
 * 状态上下文
 * @typedef {Object} StateContext
 * @property {string} currentPouch - 当前锦囊
 * @property {string[]} history - 历史记录
 * @property {Object} [userProfile] - 用户配置
 * @property {Object} [sessionData] - 会话数据
 * @property {Object} [domainContext] - 领域上下文
 */

/**
 * 锦囊输出格式
 * @typedef {Object} PouchOutput
 * @property {string} purpose - 锦囊目的说明
 * @property {string} content - 锦囊内容（提示词）
 * @property {PATEOASNavigation} pateoas - PATEOAS导航信息
 * @property {StateContext} [context] - 状态上下文
 * @property {'human'|'json'} [format='human'] - 输出格式
 */

module.exports = {
  // 这些是类型定义，JavaScript中不需要导出
}
