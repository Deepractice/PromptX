/**
 * PromptX标准化分析器测试
 * 验证合规性检查功能
 * 
 * @author PromptX全栈开发者
 * @version 1.0.0
 */

const PromptXStandardAnalyzer = require('./PromptXStandardAnalyzer');
const ComplianceChecker = require('./ComplianceChecker');
const fs = require('fs');
const path = require('path');

class ComplianceTest {
  constructor() {
    this.analyzer = new PromptXStandardAnalyzer();
    this.checker = new ComplianceChecker();
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始PromptX标准化分析器测试...\n');

    const tests = [
      this.testAssistantRoleCompliance.bind(this),
      this.testStandardTemplateGeneration.bind(this),
      this.testNonCompliantRole.bind(this),
      this.testComplianceChecker.bind(this)
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      try {
        const result = await test();
        if (result.passed) {
          console.log(`✅ ${result.name} - 通过`);
          passedTests++;
        } else {
          console.log(`❌ ${result.name} - 失败: ${result.error}`);
        }
      } catch (error) {
        console.log(`💥 ${test.name} - 异常: ${error.message}`);
      }
      console.log('');
    }

    console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
    console.log(`🎯 通过率: ${Math.round(passedTests / totalTests * 100)}%`);

    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    };
  }

  /**
   * 测试assistant角色的合规性
   */
  async testAssistantRoleCompliance() {
    const testName = 'Assistant角色合规性测试';
    
    try {
      // 读取assistant角色文件
      const assistantPath = path.join(process.cwd(), 'prompt/domain/assistant');
      const mainFile = fs.readFileSync(path.join(assistantPath, 'assistant.role.md'), 'utf8');
      const thoughtFile = fs.readFileSync(path.join(assistantPath, 'thought/assistant.thought.md'), 'utf8');
      const executionFile = fs.readFileSync(path.join(assistantPath, 'execution/assistant.execution.md'), 'utf8');

      const rolePackage = {
        roleName: 'assistant',
        mainFile,
        thoughtFile,
        executionFile,
        filePaths: [
          'assistant/assistant.role.md',
          'assistant/thought/assistant.thought.md',
          'assistant/execution/assistant.execution.md'
        ]
      };

      // 执行合规性分析
      const analysisResult = this.analyzer.analyzeCompliance(rolePackage);
      
      console.log(`📋 ${testName}:`);
      console.log(`   合规性: ${analysisResult.overallCompliance ? '✅' : '❌'}`);
      console.log(`   评分: ${Math.round(analysisResult.complianceScore * 100)}%`);
      console.log(`   错误数: ${analysisResult.errors.length}`);
      
      if (analysisResult.errors.length > 0) {
        console.log('   错误详情:');
        analysisResult.errors.forEach(error => {
          console.log(`     - ${error}`);
        });
      }

      return {
        name: testName,
        passed: analysisResult.overallCompliance && analysisResult.complianceScore >= 0.9,
        error: analysisResult.errors.join('; ')
      };

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试标准模板生成
   */
  async testStandardTemplateGeneration() {
    const testName = '标准模板生成测试';
    
    try {
      const roleName = 'test-role';
      const template = this.analyzer.generateStandardTemplate(roleName);
      
      console.log(`📋 ${testName}:`);
      console.log(`   生成的主文件:`);
      console.log(`   ${template.mainFile.split('\n').join('\n   ')}`);
      
      // 验证生成的模板是否符合标准
      const rolePackage = {
        roleName,
        mainFile: template.mainFile,
        thoughtFile: template.thoughtTemplate,
        executionFile: template.executionTemplate,
        filePaths: [
          `${roleName}/${roleName}.role.md`,
          `${roleName}/thought/${roleName}.thought.md`,
          `${roleName}/execution/${roleName}.execution.md`
        ]
      };

      const analysisResult = this.analyzer.analyzeCompliance(rolePackage);
      
      console.log(`   模板合规性: ${analysisResult.overallCompliance ? '✅' : '❌'}`);
      console.log(`   模板评分: ${Math.round(analysisResult.complianceScore * 100)}%`);

      return {
        name: testName,
        passed: analysisResult.overallCompliance,
        error: analysisResult.errors.join('; ')
      };

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试不合规角色的检测
   */
  async testNonCompliantRole() {
    const testName = '不合规角色检测测试';
    
    try {
      // 创建一个故意不合规的角色
      const nonCompliantRole = {
        roleName: 'bad-role',
        mainFile: `<role>
  <personality>
    这里有内联内容，违反了规范
    @thought://bad-reference
  </personality>
  <principle>
    @execution://bad-role
  </principle>
  <extra>
    这是多余的组件
  </extra>
</role>`,
        thoughtFile: `<thought>
  <exploration>简单内容</exploration>
</thought>`,
        executionFile: `<execution>
  <rule>简单规则</rule>
</execution>`,
        filePaths: ['bad-role/bad-role.role.md']
      };

      const analysisResult = this.analyzer.analyzeCompliance(nonCompliantRole);
      
      console.log(`📋 ${testName}:`);
      console.log(`   检测到不合规: ${!analysisResult.overallCompliance ? '✅' : '❌'}`);
      console.log(`   错误数量: ${analysisResult.errors.length}`);
      console.log(`   合规性状态: ${analysisResult.overallCompliance ? '合规' : '不合规'}`);
      console.log(`   主要错误:`);
      analysisResult.errors.slice(0, 3).forEach(error => {
        console.log(`     - ${error}`);
      });

      // 测试应该检测到不合规，所以overallCompliance应该为false，且错误数量>0
      const shouldDetectNonCompliance = !analysisResult.overallCompliance && analysisResult.errors.length > 0;

      return {
        name: testName,
        passed: shouldDetectNonCompliance,
        error: shouldDetectNonCompliance ? '' : '未能正确检测到不合规问题'
      };

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试合规性检查器
   */
  async testComplianceChecker() {
    const testName = '合规性检查器测试';
    
    try {
      const roleName = 'checker-test';
      const template = this.analyzer.generateStandardTemplate(roleName);
      
      const rolePackage = {
        roleName,
        mainFile: template.mainFile,
        thoughtFile: template.thoughtTemplate,
        executionFile: template.executionTemplate,
        filePaths: [
          `${roleName}/${roleName}.role.md`,
          `${roleName}/thought/${roleName}.thought.md`,
          `${roleName}/execution/${roleName}.execution.md`
        ]
      };

      const checkResult = await this.checker.checkCompliance(rolePackage);
      
      console.log(`📋 ${testName}:`);
      console.log(`   检查器状态: ${checkResult.summary.status}`);
      console.log(`   处理时间: ${checkResult.summary.processingTime}`);
      console.log(`   合规评分: ${checkResult.summary.score}`);
      console.log(`   错误数量: ${checkResult.summary.totalErrors}`);

      return {
        name: testName,
        passed: checkResult.overallCompliance && checkResult.complianceScore >= 0.9,
        error: checkResult.errors.join('; ')
      };

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 生成测试报告
   */
  generateTestReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.total,
        passedTests: results.passed,
        successRate: Math.round(results.passed / results.total * 100)
      },
      status: results.success ? '✅ 全部通过' : '❌ 存在失败',
      recommendations: []
    };

    if (!results.success) {
      report.recommendations.push('请检查失败的测试用例');
      report.recommendations.push('确保PromptX标准格式正确实现');
    }

    return report;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const test = new ComplianceTest();
  test.runAllTests().then(results => {
    const report = test.generateTestReport(results);
    console.log('\n📊 测试报告:');
    console.log(JSON.stringify(report, null, 2));
    
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = ComplianceTest;
