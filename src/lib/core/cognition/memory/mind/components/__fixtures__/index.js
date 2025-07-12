// 认知组件测试的共享fixtures
// 提供WordCue、Schema等组件的标准测试数据

/**
 * 创建基础测试fixtures
 * @returns {Object} 包含各种测试实例的对象
 */
function createFixtures() {
  const { WordCue } = require('../WordCue.js');
  const { Schema } = require('../Schema.js');

  return {
    // === 基础WordCue实例 ===
    cues: {
      username: new WordCue('用户名'),
      password: new WordCue('密码'),
      email: new WordCue('邮箱'),
      phone: new WordCue('手机'),
      submit: new WordCue('提交'),
      validate: new WordCue('验证'),
      captcha: new WordCue('验证码'),
      login: new WordCue('登录'),
      register: new WordCue('注册'),
      logout: new WordCue('退出'),
      
      // 系统级Cue
      success: new WordCue('成功'),
      error: new WordCue('错误'),
      loading: new WordCue('加载中'),
      retry: new WordCue('重试')
    },

    // === 基础Schema实例 ===
    schemas: {
      userLogin: new Schema('用户登录'),
      userRegister: new Schema('用户注册'),
      userManagement: new Schema('用户管理'),
      permission: new Schema('权限控制'),
      notification: new Schema('消息通知'),
      
      // 复杂业务Schema
      orderProcess: new Schema('订单流程'),
      paymentFlow: new Schema('支付流程'),
      dataAnalysis: new Schema('数据分析')
    },

    // === 测试场景数据 ===
    scenarios: {
      // 用户登录场景：用户名+密码
      simpleLogin: {
        name: '简单登录',
        cues: ['用户名', '密码', '提交'],
        connections: [
          ['用户名', '密码'],
          ['密码', '提交']
        ]
      },

      // 复杂登录场景：多种验证方式
      complexLogin: {
        name: '复杂登录',
        cues: ['用户名', '密码', '邮箱', '手机', '验证码', '提交'],
        connections: [
          ['用户名', '密码'],
          ['邮箱', '验证码'],
          ['手机', '验证码'],
          ['验证码', '提交']
        ]
      },

      // 用户注册场景
      userRegistration: {
        name: '用户注册',
        cues: ['用户名', '密码', '邮箱', '手机', '验证码', '注册'],
        connections: [
          ['用户名', '密码'],
          ['邮箱', '验证码'],
          ['手机', '验证码'],
          ['验证码', '注册']
        ]
      }
    },

    // === 预构建的完整Schema ===
    prebuiltSchemas: {}
  };
}

/**
 * 构建完整的测试Schema
 * @param {Object} fixtures - 基础fixtures
 * @param {string} scenarioName - 场景名称
 * @returns {Schema} 构建好的Schema
 */
function buildScenarioSchema(fixtures, scenarioName) {
  const scenario = fixtures.scenarios[scenarioName];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioName}`);
  }

  const { Schema } = require('../Schema.js');
  const { WordCue } = require('../WordCue.js');
  
  const schema = new Schema(scenario.name);
  
  // 创建并添加所有Cue
  const cueMap = new Map();
  scenario.cues.forEach(cueWord => {
    const cue = new WordCue(cueWord);
    schema.addCue(cue);
    cueMap.set(cueWord, cue);
  });
  
  // 建立连接关系
  scenario.connections.forEach(([source, target]) => {
    const sourceCue = cueMap.get(source);
    const targetCue = cueMap.get(target);
    if (sourceCue && targetCue) {
      schema.connectCues(sourceCue, targetCue);
    }
  });
  
  return schema;
}

/**
 * 获取完整的测试fixtures，包括预构建的Schema
 * @returns {Object} 完整的测试fixtures
 */
function getTestFixtures() {
  const fixtures = createFixtures();
  
  // 构建预置的完整Schema
  try {
    fixtures.prebuiltSchemas = {
      simpleLogin: buildScenarioSchema(fixtures, 'simpleLogin'),
      complexLogin: buildScenarioSchema(fixtures, 'complexLogin'),
      userRegistration: buildScenarioSchema(fixtures, 'userRegistration')
    };
  } catch (error) {
    // 如果构建失败，提供空对象
    fixtures.prebuiltSchemas = {};
  }
  
  return fixtures;
}

// === 测试辅助函数 ===

/**
 * 验证Schema是否包含指定的Cue
 * @param {Schema} schema - 要验证的Schema
 * @param {Array<string>} expectedCues - 期望的Cue词汇列表
 * @returns {boolean} 是否包含所有期望的Cue
 */
function validateSchemaCues(schema, expectedCues) {
  const actualCues = schema.getCues().map(cue => cue.word);
  return expectedCues.every(expected => actualCues.includes(expected));
}

/**
 * 验证Schema的连接关系
 * @param {Schema} schema - 要验证的Schema
 * @param {Array<Array<string>>} expectedConnections - 期望的连接关系
 * @returns {boolean} 是否包含所有期望的连接
 */
function validateSchemaConnections(schema, expectedConnections) {
  const actualConnections = schema.getCueConnections();
  
  return expectedConnections.every(([source, target]) => {
    return actualConnections.some(conn => 
      (conn.source === source && conn.target === target) ||
      (conn.source === target && conn.target === source) // 无向图
    );
  });
}

module.exports = {
  getTestFixtures,
  createFixtures,
  buildScenarioSchema,
  validateSchemaCues,
  validateSchemaConnections
};