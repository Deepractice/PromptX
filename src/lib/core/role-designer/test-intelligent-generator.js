/**
 * 智能角色生成引擎测试
 * 验证Role Designer 2.0的核心生成功能
 * 
 * @author PromptX全栈开发者
 * @version 2.0.0
 */

const IntelligentRoleGenerator = require('./IntelligentRoleGenerator');

class IntelligentGeneratorTest {
  constructor() {
    this.generator = new IntelligentRoleGenerator({
      enableContext7: false, // 暂时禁用Context7测试
      qualityThreshold: 0.8,
      creativityLevel: 'balanced'
    });
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始智能角色生成引擎测试...\n');

    const tests = [
      this.testBasicRoleGeneration.bind(this),
      this.testDeveloperRoleGeneration.bind(this),
      this.testDesignerRoleGeneration.bind(this),
      this.testQualityValidation.bind(this),
      this.testGenerationStats.bind(this)
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

    // 显示生成统计
    const stats = this.generator.getGenerationStats();
    console.log('\n📈 生成统计:');
    console.log(`   总生成数: ${stats.totalGenerated}`);
    console.log(`   成功数: ${stats.successfulGenerated}`);
    console.log(`   成功率: ${Math.round(stats.successRate * 100)}%`);
    console.log(`   平均质量: ${Math.round(stats.averageQuality)}%`);

    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      stats
    };
  }

  /**
   * 测试基础角色生成
   */
  async testBasicRoleGeneration() {
    const testName = '基础角色生成测试';
    
    try {
      const requirements = {
        roleName: 'test-assistant',
        domain: 'general',
        complexity: 'simple',
        capabilities: ['问题解决', '信息整理'],
        audience: 'general'
      };

      console.log(`📋 ${testName}:`);
      console.log(`   角色名称: ${requirements.roleName}`);
      console.log(`   领域: ${requirements.domain}`);
      console.log(`   复杂度: ${requirements.complexity}`);

      const result = await this.generator.generateRole(requirements);
      
      console.log(`   生成结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   质量评分: ${result.quality.score}%`);
        console.log(`   处理时间: ${result.metadata.processingTime}ms`);
        console.log(`   生成策略: ${result.metadata.strategy}`);
        
        // 验证生成的内容
        const validation = this.validateGeneratedContent(result.rolePackage);
        console.log(`   内容验证: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
        
        return {
          name: testName,
          passed: result.success && result.quality.passed && validation.valid,
          error: validation.valid ? '' : validation.errors.join('; ')
        };
      } else {
        return {
          name: testName,
          passed: false,
          error: result.error
        };
      }

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试开发者角色生成
   */
  async testDeveloperRoleGeneration() {
    const testName = '开发者角色生成测试';
    
    try {
      const requirements = {
        roleName: 'fullstack-developer',
        domain: 'software-development',
        complexity: 'medium',
        capabilities: ['前端开发', '后端开发', '系统设计', '代码审查'],
        audience: 'development-team',
        context: '负责全栈Web应用开发'
      };

      console.log(`📋 ${testName}:`);
      console.log(`   角色名称: ${requirements.roleName}`);
      console.log(`   领域: ${requirements.domain}`);
      console.log(`   复杂度: ${requirements.complexity}`);

      const result = await this.generator.generateRole(requirements);
      
      console.log(`   生成结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   质量评分: ${result.quality.score}%`);
        console.log(`   处理时间: ${result.metadata.processingTime}ms`);
        console.log(`   生成策略: ${result.metadata.strategy}`);
        
        // 验证开发者特定内容
        const validation = this.validateDeveloperContent(result.rolePackage);
        console.log(`   开发者内容验证: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
        
        return {
          name: testName,
          passed: result.success && result.quality.passed && validation.valid,
          error: validation.valid ? '' : validation.errors.join('; ')
        };
      } else {
        return {
          name: testName,
          passed: false,
          error: result.error
        };
      }

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试设计师角色生成
   */
  async testDesignerRoleGeneration() {
    const testName = '设计师角色生成测试';
    
    try {
      const requirements = {
        roleName: 'ux-designer',
        domain: 'user-experience',
        complexity: 'medium',
        capabilities: ['用户研究', '交互设计', '原型制作', '可用性测试'],
        audience: 'design-team',
        context: '专注于移动应用的用户体验设计'
      };

      console.log(`📋 ${testName}:`);
      console.log(`   角色名称: ${requirements.roleName}`);
      console.log(`   领域: ${requirements.domain}`);

      const result = await this.generator.generateRole(requirements);
      
      console.log(`   生成结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   质量评分: ${result.quality.score}%`);
        console.log(`   生成策略: ${result.metadata.strategy}`);
        
        // 验证设计师特定内容
        const validation = this.validateDesignerContent(result.rolePackage);
        console.log(`   设计师内容验证: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
        
        return {
          name: testName,
          passed: result.success && result.quality.passed && validation.valid,
          error: validation.valid ? '' : validation.errors.join('; ')
        };
      } else {
        return {
          name: testName,
          passed: false,
          error: result.error
        };
      }

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试质量验证功能
   */
  async testQualityValidation() {
    const testName = '质量验证测试';
    
    try {
      const requirements = {
        roleName: 'quality-test-role',
        domain: 'testing',
        complexity: 'simple'
      };

      console.log(`📋 ${testName}:`);
      
      const result = await this.generator.generateRole(requirements);
      
      console.log(`   生成结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   质量评分: ${result.quality.score}%`);
        console.log(`   合规性检查: ${result.quality.compliance.overallCompliance ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   质量阈值: ${this.generator.config.qualityThreshold * 100}%`);
        
        const meetsThreshold = result.quality.score >= this.generator.config.qualityThreshold * 100;
        console.log(`   达到阈值: ${meetsThreshold ? '✅ 是' : '❌ 否'}`);
        
        return {
          name: testName,
          passed: result.success && result.quality.passed && meetsThreshold,
          error: meetsThreshold ? '' : '质量评分未达到阈值'
        };
      } else {
        return {
          name: testName,
          passed: false,
          error: result.error
        };
      }

    } catch (error) {
      return {
        name: testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * 测试生成统计功能
   */
  async testGenerationStats() {
    const testName = '生成统计测试';
    
    try {
      console.log(`📋 ${testName}:`);
      
      const stats = this.generator.getGenerationStats();
      
      console.log(`   统计数据获取: ✅ 成功`);
      console.log(`   总生成数: ${stats.totalGenerated}`);
      console.log(`   成功生成数: ${stats.successfulGenerated}`);
      console.log(`   成功率: ${Math.round(stats.successRate * 100)}%`);
      console.log(`   平均质量: ${Math.round(stats.averageQuality)}%`);
      
      const hasValidStats = stats.totalGenerated >= 0 && 
                           stats.successfulGenerated >= 0 && 
                           stats.successRate >= 0 && 
                           stats.averageQuality >= 0;
      
      return {
        name: testName,
        passed: hasValidStats,
        error: hasValidStats ? '' : '统计数据无效'
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
   * 验证生成的内容
   */
  validateGeneratedContent(rolePackage) {
    const errors = [];
    
    // 检查基本结构
    if (!rolePackage.mainFile) errors.push('缺少主文件');
    if (!rolePackage.thoughtFile) errors.push('缺少thought文件');
    if (!rolePackage.executionFile) errors.push('缺少execution文件');
    
    // 检查主文件格式
    if (rolePackage.mainFile && !rolePackage.mainFile.includes('<role>')) {
      errors.push('主文件缺少role标签');
    }
    
    // 检查thought文件格式
    if (rolePackage.thoughtFile && !rolePackage.thoughtFile.includes('<thought>')) {
      errors.push('thought文件缺少thought标签');
    }
    
    // 检查execution文件格式
    if (rolePackage.executionFile && !rolePackage.executionFile.includes('<execution>')) {
      errors.push('execution文件缺少execution标签');
    }
    
    // 检查内容长度
    if (rolePackage.thoughtFile && rolePackage.thoughtFile.length < 500) {
      errors.push('thought内容过短');
    }
    
    if (rolePackage.executionFile && rolePackage.executionFile.length < 500) {
      errors.push('execution内容过短');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证开发者特定内容
   */
  validateDeveloperContent(rolePackage) {
    const errors = [];
    const content = `${rolePackage.thoughtFile} ${rolePackage.executionFile}`;
    
    // 检查开发者相关关键词
    const devKeywords = ['开发', '编程', '代码', '系统', '技术'];
    const hasDevKeywords = devKeywords.some(keyword => content.includes(keyword));
    
    if (!hasDevKeywords) {
      errors.push('缺少开发者相关关键词');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证设计师特定内容
   */
  validateDesignerContent(rolePackage) {
    const errors = [];
    const content = `${rolePackage.thoughtFile} ${rolePackage.executionFile}`;
    
    // 检查设计师相关关键词
    const designKeywords = ['设计', '用户', '体验', '界面', '创意'];
    const hasDesignKeywords = designKeywords.some(keyword => content.includes(keyword));
    
    if (!hasDesignKeywords) {
      errors.push('缺少设计师相关关键词');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const test = new IntelligentGeneratorTest();
  test.runAllTests().then(results => {
    console.log('\n🎊 智能生成引擎测试完成!');
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = IntelligentGeneratorTest;
