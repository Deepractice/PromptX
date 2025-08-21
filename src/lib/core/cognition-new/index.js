/**
 * 认知系统核心结构（极简版）
 * 
 * 三个基础结构：
 * - Cue: 认知网络的节点，自管理连接
 * - Network: 所有 Cue 的容器
 * - Mind: 以某个 Cue 为中心的激活子图
 * 
 * 设计原则：
 * - 只定义数据结构，不定义算法
 * - Cue 管理自己的连接（去中心化）
 * - 不存储原始内容（让大模型理解）
 */

const Cue = require('./Cue');
const Network = require('./Network');
const Mind = require('./Mind');
const Remember = require('./Remember');

module.exports = {
  Cue,
  Network,
  Mind,
  Remember
};