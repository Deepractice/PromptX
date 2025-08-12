 /**
 * ToolTester - PromptX 工具系统回归测试工具
 * 用于全面测试 ToolSandbox 的各项功能
 */

module.exports = {
  /**
   * 获取工具元信息
   */
  getMetadata() {
    return {
      name: 'tool-tester',
      description: 'PromptX 工具系统回归测试工具，全面测试 ToolSandbox 各项功能',
      version: '1.0.0',
      category: 'testing',
      author: '鲁班',
      tags: ['test', 'sandbox', 'regression', 'validation'],
      manual: '@manual://tool-tester'
    };
  },

  /**
   * 获取参数 Schema
   */
  getSchema() {
    return {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['basic', 'dependencies', 'scoped', 'esmodule', 'error', 'performance', 'all'],
          description: '测试类型'
        },
        verbose: {
          type: 'boolean',
          description: '是否输出详细日志'
        }
      },
      required: ['testType'],
      additionalProperties: false
    };
  },

  /**
   * 获取依赖 - 新格式：对象形式
   * 测试各种依赖格式，包括 scoped 包和 ES Module 包
   */
  getDependencies() {
    return {
      // CommonJS 包
      'lodash': '^4.17.21',
      'validator': '^13.11.0',
      
      // Scoped CommonJS 包
      '@sindresorhus/is': '^6.0.0',
      '@types/node': '^20.0.0',
      
      // 带复杂版本号的包
      'axios': '>=1.0.0 <2.0.0',
      
      // 精确版本
      'uuid': '9.0.1',
      
      // ES Module 包（用于测试）
      'chalk': '^5.3.0',  // chalk v5+ 是纯 ES Module
      'node-fetch': '^3.3.2',  // node-fetch v3+ 是纯 ES Module
      'execa': '^8.0.1',  // execa v6+ 是纯 ES Module
      'nanoid': '^5.0.4'  // nanoid v4+ 是纯 ES Module
    };
  },

  /**
   * 参数验证
   */
  validate(params) {
    const errors = [];
    
    if (!params.testType) {
      errors.push('testType 是必需参数');
    }
    
    const validTypes = ['basic', 'dependencies', 'scoped', 'esmodule', 'error', 'performance', 'all'];
    if (params.testType && !validTypes.includes(params.testType)) {
      errors.push(`testType 必须是以下之一: ${validTypes.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 执行测试
   */
  async execute(params) {
    const { testType, verbose = false } = params;
    const results = {
      testType,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    const log = (msg) => {
      if (verbose) {
        console.log(`[ToolTester] ${msg}`);
      }
    };

    // 运行指定的测试
    if (testType === 'all') {
      await this.runAllTests(results, log);
    } else {
      await this.runSpecificTest(testType, results, log);
    }

    // 计算统计
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.passed).length;
    results.summary.failed = results.tests.filter(t => !t.passed).length;
    results.summary.passRate = results.summary.total > 0 
      ? `${(results.summary.passed / results.summary.total * 100).toFixed(1)}%`
      : '0%';

    return {
      success: results.summary.failed === 0,
      data: results,
      message: `测试完成: ${results.summary.passed}/${results.summary.total} 通过`
    };
  },

  /**
   * 运行所有测试
   */
  async runAllTests(results, log) {
    const allTests = ['basic', 'dependencies', 'scoped', 'esmodule', 'error', 'performance'];
    for (const test of allTests) {
      await this.runSpecificTest(test, results, log);
    }
  },

  /**
   * 运行特定测试
   */
  async runSpecificTest(testType, results, log) {
    switch (testType) {
      case 'basic':
        await this.testBasicFunctionality(results, log);
        break;
      case 'dependencies':
        await this.testDependencies(results, log);
        break;
      case 'scoped':
        await this.testScopedPackages(results, log);
        break;
      case 'esmodule':
        await this.testESModules(results, log);
        break;
      case 'error':
        await this.testErrorHandling(results, log);
        break;
      case 'performance':
        await this.testPerformance(results, log);
        break;
    }
  },

  /**
   * 测试基础功能
   */
  async testBasicFunctionality(results, log) {
    log('开始基础功能测试...');
    
    // 测试1: 工具元信息
    const metadata = this.getMetadata();
    results.tests.push({
      name: '元信息完整性',
      description: '检查 getMetadata() 返回所有必需字段',
      passed: !!(metadata.name && metadata.description && metadata.version),
      details: {
        hasName: !!metadata.name,
        hasDescription: !!metadata.description,
        hasVersion: !!metadata.version,
        hasManual: !!metadata.manual
      }
    });

    // 测试2: Schema 定义
    const schema = this.getSchema();
    results.tests.push({
      name: 'Schema 有效性',
      description: '检查 getSchema() 返回有效的 JSON Schema',
      passed: schema.type === 'object' && !!schema.properties,
      details: {
        type: schema.type,
        hasProperties: !!schema.properties,
        hasRequired: !!schema.required
      }
    });

    // 测试3: 参数验证
    const validResult = this.validate({ testType: 'basic' });
    const invalidResult = this.validate({ testType: 'invalid' });
    results.tests.push({
      name: '参数验证逻辑',
      description: '测试 validate() 方法的验证逻辑',
      passed: validResult.valid && !invalidResult.valid,
      details: {
        validCase: validResult.valid,
        invalidCase: !invalidResult.valid,
        errorMessages: invalidResult.errors
      }
    });
  },

  /**
   * 测试依赖管理
   */
  async testDependencies(results, log) {
    log('开始依赖管理测试...');
    
    const deps = this.getDependencies();
    
    // 测试1: 依赖格式
    results.tests.push({
      name: '依赖格式正确性',
      description: '检查 getDependencies() 返回对象格式',
      passed: typeof deps === 'object' && !Array.isArray(deps),
      details: {
        type: typeof deps,
        isArray: Array.isArray(deps),
        dependencyCount: Object.keys(deps).length
      }
    });

    // 测试2: 依赖版本格式
    const validVersionPattern = /^[\^~]?\d+\.\d+\.\d+$|^>=?\d+\.\d+\.\d+(\s+<\d+\.\d+\.\d+)?$/;
    const allVersionsValid = Object.values(deps).every(v => 
      typeof v === 'string' && (v === 'latest' || validVersionPattern.test(v))
    );
    
    results.tests.push({
      name: '版本号格式验证',
      description: '检查所有依赖的版本号格式是否有效',
      passed: allVersionsValid,
      details: {
        dependencies: deps,
        allValid: allVersionsValid
      }
    });

    // 测试3: 依赖可用性（模拟）
    const lodash = require('lodash');
    const validator = require('validator');
    
    results.tests.push({
      name: '依赖加载测试',
      description: '测试声明的依赖是否能正确加载',
      passed: !!lodash && !!validator,
      details: {
        lodashLoaded: !!lodash,
        validatorLoaded: !!validator,
        lodashVersion: lodash.VERSION,
        hasValidatorMethods: !!validator.isEmail
      }
    });
  },

  /**
   * 测试 Scoped 包支持
   */
  async testScopedPackages(results, log) {
    log('开始 Scoped 包测试...');
    
    const deps = this.getDependencies();
    const scopedPackages = Object.keys(deps).filter(name => name.startsWith('@'));
    
    // 测试1: Scoped 包识别
    results.tests.push({
      name: 'Scoped 包识别',
      description: '检查是否正确识别 @ 开头的包',
      passed: scopedPackages.length > 0,
      details: {
        scopedPackages,
        count: scopedPackages.length
      }
    });

    // 测试2: Scoped 包格式
    const validScopedFormat = scopedPackages.every(pkg => {
      const parts = pkg.split('/');
      return parts.length === 2 && parts[0].startsWith('@') && parts[1].length > 0;
    });
    
    results.tests.push({
      name: 'Scoped 包格式验证',
      description: '验证 scoped 包名格式 @scope/package',
      passed: validScopedFormat,
      details: {
        packages: scopedPackages,
        allValid: validScopedFormat
      }
    });

    // 测试3: Scoped 包依赖版本
    const scopedDeps = {};
    scopedPackages.forEach(pkg => {
      scopedDeps[pkg] = deps[pkg];
    });
    
    results.tests.push({
      name: 'Scoped 包版本管理',
      description: '确认 scoped 包有正确的版本号',
      passed: Object.values(scopedDeps).every(v => v && v !== ''),
      details: {
        scopedDependencies: scopedDeps
      }
    });

    // 测试4: 实际加载测试
    try {
      const isModule = require('@sindresorhus/is');
      results.tests.push({
        name: 'Scoped 包加载',
        description: '测试 scoped 包能否实际加载',
        passed: !!isModule,
        details: {
          packageName: '@sindresorhus/is',
          loaded: !!isModule,
          hasDefaultExport: !!isModule.default,
          hasMethods: !!(isModule.string && isModule.number)
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Scoped 包加载',
        description: '测试 scoped 包能否实际加载',
        passed: false,
        details: {
          error: error.message,
          note: '可能需要先安装依赖'
        }
      });
    }
  },

  /**
   * 测试 ES Module 支持
   */
  async testESModules(results, log) {
    log('开始 ES Module 测试...');
    
    const deps = this.getDependencies();
    const esModulePackages = ['chalk', 'node-fetch', 'execa', 'nanoid'];
    
    // 测试1: ES Module 包识别
    results.tests.push({
      name: 'ES Module 包声明',
      description: '检查是否声明了 ES Module 依赖',
      passed: esModulePackages.every(pkg => deps[pkg]),
      details: {
        esModulePackages,
        declared: esModulePackages.filter(pkg => deps[pkg])
      }
    });

    // 测试2: 尝试使用 require 加载 ES Module（预期失败）
    let requireError = null;
    try {
      // 尝试用 require 加载 chalk（ES Module）
      const chalk = require('chalk');
      results.tests.push({
        name: 'CommonJS require ES Module',
        description: '测试 require() 是否能加载 ES Module',
        passed: false,
        details: {
          unexpectedSuccess: true,
          message: 'require() 不应该能加载 ES Module，但意外成功了',
          loaded: !!chalk
        }
      });
    } catch (error) {
      requireError = error;
      // 这是预期的行为
      results.tests.push({
        name: 'CommonJS require ES Module',
        description: '测试 require() 加载 ES Module 应该失败',
        passed: error.code === 'ERR_REQUIRE_ESM',
        details: {
          errorCode: error.code,
          errorMessage: error.message,
          isExpectedError: error.code === 'ERR_REQUIRE_ESM'
        }
      });
    }

    // 测试3: 检查沙箱是否提供统一的 loadModule 函数
    const hasLoadModuleGlobal = typeof loadModule === 'function';
    const hasImportModuleGlobal = typeof importModule === 'function';
    const hasLoadModule = hasLoadModuleGlobal;
    const hasImportModule = hasImportModuleGlobal;
    
    results.tests.push({
      name: '沙箱统一模块加载支持',
      description: '检查沙箱是否提供 loadModule 函数（统一接口）',
      passed: hasLoadModule,
      details: {
        hasLoadModule: hasLoadModuleGlobal,
        hasImportModule: hasImportModuleGlobal,  // 向后兼容
        typeLoadModule: typeof loadModule,
        typeImportModule: typeof importModule,
        note: hasLoadModule ? 'loadModule 是推荐的统一接口' : '未检测到 loadModule 函数'
      }
    });

    // 测试4: 测试 loadModule 统一接口
    if (hasLoadModule) {
      try {
        // 测试加载 CommonJS 包
        const lodash = await loadModule('lodash');
        const commonjsLoaded = !!lodash && typeof lodash.merge === 'function';
        
        results.tests.push({
          name: 'loadModule 加载 CommonJS',
          description: '测试 loadModule() 自动检测并加载 CommonJS 包',
          passed: commonjsLoaded,
          details: {
            loaded: !!lodash,
            type: typeof lodash,
            hasMethod: typeof lodash.merge === 'function',
            version: lodash.VERSION
          }
        });
        
        // 测试加载 ES Module 包
        const chalk = await loadModule('chalk');
        results.tests.push({
          name: 'loadModule 加载 ES Module',
          description: '测试 loadModule() 自动检测并加载 ES Module 包',
          passed: !!chalk,
          details: {
            loaded: !!chalk,
            type: typeof chalk,
            hasBlue: typeof chalk.blue === 'function',
            note: 'loadModule 自动处理了模块类型检测'
          }
        });
        
        // 测试5: 使用 ES Module 功能
        if (chalk && typeof chalk.blue === 'function') {
          const testString = 'Test ES Module';
          const coloredString = chalk.blue(testString);
          
          // chalk 在非 TTY 环境可能不添加颜色，检查函数是否正常工作
          const functionExecuted = typeof coloredString === 'string';
          const hasAnsiCodes = coloredString.includes('\u001b[');
          
          results.tests.push({
            name: 'ES Module 功能测试',
            description: '测试通过 loadModule 加载的 ES Module 功能',
            passed: functionExecuted,  // 只要函数正常执行返回字符串就算成功
            details: {
              input: testString,
              output: coloredString,
              functionExecuted,
              hasAnsiCodes,
              chalkLevel: chalk.level || 0,  // chalk 颜色支持级别
              note: hasAnsiCodes ? 'chalk 添加了 ANSI 颜色代码' : 'chalk 在非 TTY 环境未添加颜色（正常行为）'
            }
          });
        }
      } catch (error) {
        results.tests.push({
          name: 'loadModule 统一接口',
          description: '测试沙箱 loadModule() 统一接口',
          passed: false,
          details: {
            error: error.message,
            errorCode: error.code
          }
        });
      }
    } else {
      results.tests.push({
        name: 'loadModule 功能',
        description: '沙箱未提供 loadModule 函数',
        passed: false,
        details: {
          note: '需要在 ToolSandbox 中启用统一模块加载支持'
        }
      });
    }

    // 测试6: 测试统一接口的便利性
    if (hasLoadModule) {
      try {
        // 使用统一的 loadModule 接口加载不同类型的包
        const [lodash, validator, nanoid] = await Promise.all([
          loadModule('lodash'),     // CommonJS
          loadModule('validator'),  // CommonJS  
          loadModule('nanoid')      // ES Module
        ]);
        
        results.tests.push({
          name: '统一接口批量加载',
          description: '测试 loadModule 统一接口批量加载不同类型模块',
          passed: !!lodash && !!validator && !!nanoid,
          details: {
            lodashLoaded: !!lodash,
            validatorLoaded: !!validator,
            nanoidLoaded: !!nanoid,
            lodashVersion: lodash.VERSION,
            hasValidatorMethod: typeof validator.isEmail === 'function',
            hasNanoidFunction: typeof nanoid.nanoid === 'function',
            note: '统一接口成功处理了 CommonJS 和 ES Module'
          }
        });
      } catch (error) {
        results.tests.push({
          name: '统一接口批量加载',
          description: '测试 loadModule 统一接口批量加载',
          passed: false,
          details: {
            error: error.message,
            note: '批量加载遇到问题'
          }
        });
      }
    }
    
    // 测试7: 测试 require 的智能错误提示
    try {
      // 尝试 require 一个 ES Module（应该失败并给出友好提示）
      const chalk = require('chalk');
      results.tests.push({
        name: 'require 智能错误提示',
        description: '测试 require ES Module 时的友好错误提示',
        passed: false,
        details: {
          unexpectedSuccess: true,
          message: 'require 不应该能加载 ES Module'
        }
      });
    } catch (error) {
      // 检查是否包含友好的错误提示
      const hasFriendlyError = error.message.includes('loadModule') && 
                               error.message.includes('ES Module');
      results.tests.push({
        name: 'require 智能错误提示',
        description: '测试 require ES Module 时的友好错误提示',
        passed: hasFriendlyError || error.code === 'ERR_REQUIRE_ESM',
        details: {
          errorMessage: error.message,
          hasFriendlyMessage: hasFriendlyError,
          originalErrorCode: error.code,
          note: hasFriendlyError ? '提供了友好的错误提示' : '标准错误代码'
        }
      });
    }
  },

  /**
   * 测试错误处理
   */
  async testErrorHandling(results, log) {
    log('开始错误处理测试...');
    
    // 测试1: 参数验证错误
    const invalidParams = { testType: null };
    const validationResult = this.validate(invalidParams);
    
    results.tests.push({
      name: '参数验证错误处理',
      description: '测试无效参数的错误处理',
      passed: !validationResult.valid && validationResult.errors.length > 0,
      details: {
        valid: validationResult.valid,
        errors: validationResult.errors
      }
    });

    // 测试2: 边界条件
    const edgeCases = [
      { testType: '' },
      { testType: 'unknown' },
      { testType: 'basic', extra: 'field' }
    ];
    
    const edgeResults = edgeCases.map(params => this.validate(params));
    const allHandled = edgeResults.every(r => 
      typeof r.valid === 'boolean' && Array.isArray(r.errors)
    );
    
    results.tests.push({
      name: '边界条件处理',
      description: '测试各种边界条件的处理',
      passed: allHandled,
      details: {
        cases: edgeCases,
        results: edgeResults.map(r => ({ valid: r.valid, errorCount: r.errors.length }))
      }
    });

    // 测试3: 异常捕获
    let exceptionHandled = false;
    try {
      // 模拟可能的异常
      const result = await this.execute({ testType: 'basic' });
      exceptionHandled = true;
    } catch (error) {
      exceptionHandled = false;
    }
    
    results.tests.push({
      name: '异常捕获机制',
      description: '确保执行过程中的异常被正确处理',
      passed: exceptionHandled,
      details: {
        executionCompleted: exceptionHandled
      }
    });
  },

  /**
   * 测试性能
   */
  async testPerformance(results, log) {
    log('开始性能测试...');
    
    // 测试1: 执行时间
    const startTime = Date.now();
    const testResult = await this.execute({ testType: 'basic', verbose: false });
    const executionTime = Date.now() - startTime;
    
    results.tests.push({
      name: '执行性能',
      description: '测试工具执行时间是否在合理范围内',
      passed: executionTime < 5000, // 5秒内完成
      details: {
        executionTime: `${executionTime}ms`,
        threshold: '5000ms',
        withinLimit: executionTime < 5000
      }
    });

    // 测试2: 内存使用（简单检查）
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    results.tests.push({
      name: '内存使用',
      description: '检查内存使用是否合理',
      passed: heapUsedMB < 500, // 500MB 内
      details: {
        heapUsed: `${heapUsedMB}MB`,
        threshold: '500MB',
        withinLimit: heapUsedMB < 500
      }
    });

    // 测试3: 并发处理
    const concurrentTests = [];
    for (let i = 0; i < 3; i++) {
      concurrentTests.push(
        this.execute({ testType: 'basic', verbose: false })
      );
    }
    
    const concurrentStart = Date.now();
    const concurrentResults = await Promise.all(concurrentTests);
    const concurrentTime = Date.now() - concurrentStart;
    
    results.tests.push({
      name: '并发处理能力',
      description: '测试并发执行的稳定性',
      passed: concurrentResults.every(r => r.success),
      details: {
        concurrentCount: 3,
        totalTime: `${concurrentTime}ms`,
        allSucceeded: concurrentResults.every(r => r.success)
      }
    });
  },

  /**
   * 工具初始化（可选）
   */
  async init() {
    console.log('[ToolTester] 初始化完成');
  },

  /**
   * 清理资源（可选）
   */
  async cleanup() {
    console.log('[ToolTester] 资源清理完成');
  }
};