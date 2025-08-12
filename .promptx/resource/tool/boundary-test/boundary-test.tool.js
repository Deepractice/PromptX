/**
 * Boundary Test Tool
 * 
 * 用于测试ToolSandbox的文件系统边界控制
 * 验证VM层透明拦截是否正确实现
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * 工具依赖
   */
  getDependencies() {
    return {};  // 不需要外部依赖
  },

  /**
   * 工具元信息
   */
  getMetadata() {
    return {
      name: 'boundary-test',
      description: '测试ToolSandbox文件系统边界控制',
      version: '1.0.0',
      category: 'testing',
      author: '鲁班',
      tags: ['test', 'security', 'sandbox'],
      manual: '@manual://boundary-test'
    };
  },

  /**
   * 参数Schema
   */
  getSchema() {
    return {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['normal', 'relative-escape', 'absolute-escape', 'dangerous-ops'],
          description: '测试类型'
        }
      },
      required: ['testType']
    };
  },

  /**
   * 参数验证
   */
  validate(params) {
    const validTypes = ['normal', 'relative-escape', 'absolute-escape', 'dangerous-ops'];
    if (!validTypes.includes(params.testType)) {
      return {
        valid: false,
        errors: [`Invalid test type: ${params.testType}`]
      };
    }
    return { valid: true, errors: [] };
  },

  /**
   * 执行测试
   */
  async execute(params) {
    const results = [];
    
    switch (params.testType) {
      case 'normal':
        // 测试正常的文件访问（应该成功）
        results.push(await this.testNormalAccess());
        break;
        
      case 'relative-escape':
        // 测试相对路径越权（应该被拦截）
        results.push(await this.testRelativeEscape());
        break;
        
      case 'absolute-escape':
        // 测试绝对路径越权（应该被拦截）
        results.push(await this.testAbsoluteEscape());
        break;
        
      case 'dangerous-ops':
        // 测试危险操作（应该被阻止）
        results.push(await this.testDangerousOperations());
        break;
    }
    
    return {
      success: true,
      testType: params.testType,
      results: results,
      summary: this.generateSummary(results)
    };
  },

  /**
   * 测试正常文件访问
   */
  async testNormalAccess() {
    const tests = [];
    
    // 测试1: 读取当前目录文件
    try {
      const testFile = path.join('.', 'test.txt');
      fs.writeFileSync(testFile, 'Hello from boundary test');
      const content = fs.readFileSync(testFile, 'utf-8');
      tests.push({
        test: 'Write and read file in working directory',
        path: testFile,
        success: content === 'Hello from boundary test',
        message: 'Normal file access works correctly'
      });
      fs.unlinkSync(testFile);
    } catch (error) {
      tests.push({
        test: 'Write and read file in working directory',
        success: false,
        error: error.message
      });
    }
    
    // 测试2: 创建子目录
    try {
      const subDir = path.join('.', 'test-subdir');
      fs.mkdirSync(subDir, { recursive: true });
      const exists = fs.existsSync(subDir);
      tests.push({
        test: 'Create subdirectory',
        path: subDir,
        success: exists,
        message: 'Subdirectory creation works'
      });
      fs.rmdirSync(subDir);
    } catch (error) {
      tests.push({
        test: 'Create subdirectory',
        success: false,
        error: error.message
      });
    }
    
    return {
      category: 'Normal Access',
      tests: tests,
      passed: tests.filter(t => t.success).length,
      total: tests.length
    };
  },

  /**
   * 测试相对路径越权
   */
  async testRelativeEscape() {
    const tests = [];
    
    // 测试1: 尝试访问父目录
    try {
      const escapePath = path.join('..', '..', 'etc', 'passwd');
      fs.readFileSync(escapePath);
      tests.push({
        test: 'Access parent directory with ../..',
        path: escapePath,
        success: false,
        message: 'SECURITY BREACH: Able to escape sandbox!'
      });
    } catch (error) {
      tests.push({
        test: 'Access parent directory with ../..',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试2: 尝试用多个../逃逸
    try {
      const escapePath = '../../../../../../../etc/hosts';
      fs.readFileSync(escapePath);
      tests.push({
        test: 'Multiple ../ escape attempt',
        path: escapePath,
        success: false,
        message: 'SECURITY BREACH: Able to escape sandbox!'
      });
    } catch (error) {
      tests.push({
        test: 'Multiple ../ escape attempt',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试3: 尝试写入外部目录
    try {
      const escapePath = path.join('..', 'evil.txt');
      fs.writeFileSync(escapePath, 'Should not be written');
      tests.push({
        test: 'Write to parent directory',
        path: escapePath,
        success: false,
        message: 'SECURITY BREACH: Able to write outside sandbox!'
      });
    } catch (error) {
      tests.push({
        test: 'Write to parent directory',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    return {
      category: 'Relative Path Escape',
      tests: tests,
      passed: tests.filter(t => t.success).length,
      total: tests.length
    };
  },

  /**
   * 测试绝对路径越权
   */
  async testAbsoluteEscape() {
    const tests = [];
    
    // 测试1: 尝试访问系统文件
    try {
      fs.readFileSync('/etc/passwd');
      tests.push({
        test: 'Access /etc/passwd',
        path: '/etc/passwd',
        success: false,
        message: 'SECURITY BREACH: Able to read system files!'
      });
    } catch (error) {
      tests.push({
        test: 'Access /etc/passwd',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试2: 尝试访问用户主目录
    try {
      const homePath = process.env.HOME || '/home/user';
      fs.readdirSync(homePath);
      tests.push({
        test: 'Access home directory',
        path: homePath,
        success: false,
        message: 'SECURITY BREACH: Able to access home directory!'
      });
    } catch (error) {
      tests.push({
        test: 'Access home directory',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试3: 尝试创建系统级文件
    try {
      fs.writeFileSync('/tmp/evil.txt', 'Should not exist');
      tests.push({
        test: 'Write to /tmp',
        path: '/tmp/evil.txt',
        success: false,
        message: 'SECURITY BREACH: Able to write to /tmp!'
      });
    } catch (error) {
      tests.push({
        test: 'Write to /tmp',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    return {
      category: 'Absolute Path Escape',
      tests: tests,
      passed: tests.filter(t => t.success).length,
      total: tests.length
    };
  },

  /**
   * 测试危险操作
   */
  async testDangerousOperations() {
    const tests = [];
    
    // 测试1: 尝试使用child_process
    try {
      const child_process = require('child_process');
      child_process.execSync('echo "Should not execute"');
      tests.push({
        test: 'Execute shell command',
        success: false,
        message: 'SECURITY BREACH: Able to execute shell commands!'
      });
    } catch (error) {
      tests.push({
        test: 'Execute shell command',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试2: 尝试使用eval
    try {
      eval('console.log("Should not execute")');
      tests.push({
        test: 'Use eval()',
        success: false,
        message: 'SECURITY BREACH: eval() is allowed!'
      });
    } catch (error) {
      tests.push({
        test: 'Use eval()',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试3: 尝试访问process.binding
    try {
      process.binding('fs');
      tests.push({
        test: 'Access process.binding',
        success: false,
        message: 'SECURITY BREACH: process.binding is accessible!'
      });
    } catch (error) {
      tests.push({
        test: 'Access process.binding',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    // 测试4: 尝试使用path.resolve绕过
    try {
      const maliciousPath = path.resolve('/etc/passwd');
      fs.readFileSync(maliciousPath);
      tests.push({
        test: 'Use path.resolve to bypass',
        success: false,
        message: 'SECURITY BREACH: path.resolve bypass worked!'
      });
    } catch (error) {
      tests.push({
        test: 'Use path.resolve to bypass',
        success: true,
        message: 'Correctly blocked: ' + error.message
      });
    }
    
    return {
      category: 'Dangerous Operations',
      tests: tests,
      passed: tests.filter(t => t.success).length,
      total: tests.length
    };
  },

  /**
   * 生成测试摘要
   */
  generateSummary(results) {
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const passedTests = results.reduce((sum, r) => sum + r.passed, 0);
    const failedTests = totalTests - passedTests;
    
    const status = failedTests === 0 ? '✅ ALL TESTS PASSED' : `❌ ${failedTests} TESTS FAILED`;
    
    return {
      status: status,
      totalTests: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      security: failedTests === 0 ? 'SECURE' : 'VULNERABLE'
    };
  }
};