/**
 * PromptX合规性检查器
 * 基于assistant.role.md标准进行严格的合规性验证
 * 
 * @author PromptX全栈开发者
 * @version 1.0.0
 */

const PromptXStandardAnalyzer = require('./PromptXStandardAnalyzer');
const fs = require('fs');
const path = require('path');

class ComplianceChecker {
  constructor() {
    this.analyzer = new PromptXStandardAnalyzer();
    this.schema = this.loadSchema();
  }

  /**
   * 加载格式规范Schema
   */
  loadSchema() {
    try {
      const schemaPath = path.join(__dirname, 'assistant-format-schema.json');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      return JSON.parse(schemaContent);
    } catch (error) {
      console.error('加载Schema失败:', error.message);
      return null;
    }
  }

  /**
   * 执行完整的合规性检查
   * @param {Object} rolePackage - 角色文件包
   * @returns {Object} 合规性检查结果
   */
  async checkCompliance(rolePackage) {
    const startTime = Date.now();
    
    const result = {
      timestamp: new Date().toISOString(),
      roleName: rolePackage.roleName,
      overallCompliance: true,
      complianceScore: 0,
      processingTime: 0,
      checks: {
        formatCompliance: null,
        structureCompliance: null,
        referenceCompliance: null,
        contentQuality: null,
        systemIntegration: null
      },
      errors: [],
      warnings: [],
      recommendations: [],
      summary: {}
    };

    try {
      // 1. 格式合规性检查 (最高优先级)
      result.checks.formatCompliance = await this.checkFormatCompliance(rolePackage);
      
      // 2. 结构合规性检查
      result.checks.structureCompliance = await this.checkStructureCompliance(rolePackage);

      // 3. 引用合规性检查
      result.checks.referenceCompliance = await this.checkReferenceCompliance(rolePackage);

      // 4. 内容质量检查
      result.checks.contentQuality = await this.checkContentQuality(rolePackage);

      // 5. 系统集成检查
      result.checks.systemIntegration = await this.checkSystemIntegration(rolePackage);

      // 计算总体合规性
      result.overallCompliance = this.calculateOverallCompliance(result.checks);
      result.complianceScore = this.calculateComplianceScore(result.checks);
      
      // 收集错误、警告和建议
      this.collectFeedback(result);
      
      // 生成摘要
      result.summary = this.generateSummary(result);

    } catch (error) {
      result.errors.push(`合规性检查异常: ${error.message}`);
      result.overallCompliance = false;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * 检查格式合规性 (最高优先级)
   */
  async checkFormatCompliance(rolePackage) {
    const result = {
      name: '格式合规性检查',
      priority: 'P0',
      passed: true,
      score: 1.0,
      details: {},
      errors: [],
      criticalErrors: []
    };

    try {
      // 检查主文件格式
      const mainFileCheck = this.checkMainFileFormat(rolePackage.mainFile);
      result.details.mainFileFormat = mainFileCheck;
      
      if (!mainFileCheck.passed) {
        result.passed = false;
        result.criticalErrors.push(...mainFileCheck.errors);
      }

      // 检查组件文件格式
      const thoughtFormatCheck = this.checkComponentFormat(rolePackage.thoughtFile, 'thought');
      result.details.thoughtFormat = thoughtFormatCheck;

      const executionFormatCheck = this.checkComponentFormat(rolePackage.executionFile, 'execution');
      result.details.executionFormat = executionFormatCheck;

      // 计算格式合规评分
      result.score = this.calculateFormatScore(result.details);

    } catch (error) {
      result.errors.push(`格式检查异常: ${error.message}`);
      result.passed = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 检查主文件格式 (核心检查)
   */
  checkMainFileFormat(content) {
    const result = {
      passed: true,
      score: 1.0,
      errors: [],
      checks: {}
    };

    // 1. 检查根元素
    result.checks.rootElement = this.validateRootElement(content, 'role');
    
    // 2. 检查必需组件
    result.checks.requiredComponents = this.validateRequiredComponents(content, ['personality', 'principle']);
    
    // 3. 检查组件数量 (严格限制为2个)
    result.checks.componentCount = this.validateComponentCount(content, 2);
    
    // 4. 检查内联内容 (严格禁止)
    result.checks.inlineContent = this.validateNoInlineContent(content);
    
    // 5. 检查XML格式有效性
    result.checks.xmlValidity = this.validateXMLFormat(content);

    // 收集错误
    Object.values(result.checks).forEach(check => {
      if (!check.passed) {
        result.passed = false;
        result.errors.push(...check.errors);
      }
    });

    // 计算评分
    const passedChecks = Object.values(result.checks).filter(check => check.passed).length;
    result.score = passedChecks / Object.keys(result.checks).length;

    return result;
  }

  /**
   * 验证根元素
   */
  validateRootElement(content, expectedRoot) {
    const result = { passed: true, errors: [] };
    
    const rootRegex = new RegExp(`<${expectedRoot}>.*</${expectedRoot}>`, 's');
    if (!rootRegex.test(content)) {
      result.passed = false;
      result.errors.push(`缺少必需的根元素: <${expectedRoot}>`);
    }

    return result;
  }

  /**
   * 验证必需组件
   */
  validateRequiredComponents(content, requiredComponents) {
    const result = { passed: true, errors: [] };
    
    requiredComponents.forEach(component => {
      const componentRegex = new RegExp(`<${component}>.*</${component}>`, 's');
      if (!componentRegex.test(content)) {
        result.passed = false;
        result.errors.push(`缺少必需组件: <${component}>`);
      }
    });

    return result;
  }

  /**
   * 验证组件数量
   */
  validateComponentCount(content, expectedCount) {
    const result = { passed: true, errors: [] };
    
    const componentMatches = content.match(/<(personality|principle)>/g) || [];
    const actualCount = componentMatches.length;
    
    if (actualCount !== expectedCount) {
      result.passed = false;
      result.errors.push(`组件数量错误: 期望${expectedCount}个，实际${actualCount}个`);
    }

    return result;
  }

  /**
   * 验证无内联内容 (关键检查)
   */
  validateNoInlineContent(content) {
    const result = { passed: true, errors: [] };

    // 使用与PromptXStandardAnalyzer相同的逻辑
    const hasInlineContent = this.analyzer.checkInlineContent(content);

    if (hasInlineContent) {
      result.passed = false;
      result.errors.push('主文件包含内联内容，违反PromptX规范。所有内容必须通过引用实现');
    }

    return result;
  }

  /**
   * 验证XML格式
   */
  validateXMLFormat(content) {
    const result = { passed: true, errors: [] };
    
    try {
      // 简单的XML格式验证
      const tagStack = [];
      const tagRegex = /<\/?(\w+)[^>]*>/g;
      let match;
      
      while ((match = tagRegex.exec(content)) !== null) {
        const tagName = match[1];
        const isClosing = match[0].startsWith('</');
        
        if (isClosing) {
          if (tagStack.length === 0 || tagStack.pop() !== tagName) {
            result.passed = false;
            result.errors.push(`XML格式错误: 标签不匹配 ${match[0]}`);
            break;
          }
        } else if (!match[0].endsWith('/>')) {
          tagStack.push(tagName);
        }
      }
      
      if (tagStack.length > 0) {
        result.passed = false;
        result.errors.push(`XML格式错误: 未闭合的标签 ${tagStack.join(', ')}`);
      }
      
    } catch (error) {
      result.passed = false;
      result.errors.push(`XML验证异常: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查引用合规性
   */
  async checkReferenceCompliance(rolePackage) {
    const result = {
      name: '引用合规性检查',
      priority: 'P0',
      passed: true,
      score: 1.0,
      details: {},
      errors: []
    };

    try {
      // 检查@!前缀格式
      result.details.prefixFormat = this.validateReferencePrefix(rolePackage.mainFile);
      
      // 检查必需引用
      result.details.requiredReferences = this.validateRequiredReferences(rolePackage);
      
      // 检查引用完整性
      result.details.referenceIntegrity = this.validateReferenceIntegrity(rolePackage);

      // 计算引用合规评分
      result.score = this.calculateReferenceScore(result.details);
      result.passed = result.score >= 1.0;

    } catch (error) {
      result.errors.push(`引用检查异常: ${error.message}`);
      result.passed = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 验证引用前缀格式
   */
  validateReferencePrefix(content) {
    const result = { passed: true, errors: [] };
    
    // 检查所有引用是否使用@!前缀
    const allReferences = content.match(/@[\w:\/]+/g) || [];
    const invalidReferences = allReferences.filter(ref => !ref.startsWith('@!'));
    
    if (invalidReferences.length > 0) {
      result.passed = false;
      result.errors.push(`引用格式错误，必须使用@!前缀: ${invalidReferences.join(', ')}`);
    }

    return result;
  }

  /**
   * 验证必需引用
   */
  validateRequiredReferences(rolePackage) {
    const result = { passed: true, errors: [] };
    
    const content = rolePackage.mainFile;
    const roleName = rolePackage.roleName;
    
    // 检查personality组件的必需引用
    const requiredThoughtRefs = [
      '@!thought://remember',
      '@!thought://recall',
      `@!thought://${roleName}`
    ];
    
    requiredThoughtRefs.forEach(ref => {
      if (!content.includes(ref)) {
        result.passed = false;
        result.errors.push(`缺少必需的thought引用: ${ref}`);
      }
    });
    
    // 检查principle组件的必需引用
    const requiredExecutionRef = `@!execution://${roleName}`;
    if (!content.includes(requiredExecutionRef)) {
      result.passed = false;
      result.errors.push(`缺少必需的execution引用: ${requiredExecutionRef}`);
    }

    return result;
  }

  /**
   * 计算格式评分
   */
  calculateFormatScore(details) {
    let totalScore = 0;
    let count = 0;
    
    Object.values(details).forEach(detail => {
      if (detail && typeof detail.score === 'number') {
        totalScore += detail.score;
        count++;
      }
    });
    
    return count > 0 ? totalScore / count : 0;
  }

  /**
   * 计算总体合规性
   */
  calculateOverallCompliance(checks) {
    // P0级别检查必须全部通过
    const p0Checks = ['formatCompliance', 'referenceCompliance'];
    const p0Passed = p0Checks.every(checkName => 
      checks[checkName] && checks[checkName].passed
    );
    
    if (!p0Passed) {
      return false;
    }
    
    // 其他检查的通过率
    const otherChecks = Object.keys(checks).filter(name => !p0Checks.includes(name));
    const otherPassed = otherChecks.filter(name => 
      checks[name] && checks[name].passed
    ).length;
    
    return otherPassed / otherChecks.length >= 0.8; // 80%通过率
  }

  /**
   * 计算合规性评分
   */
  calculateComplianceScore(checks) {
    let totalScore = 0;
    let count = 0;
    
    Object.values(checks).forEach(check => {
      if (check && typeof check.score === 'number') {
        totalScore += check.score;
        count++;
      }
    });
    
    return count > 0 ? totalScore / count : 0;
  }

  /**
   * 收集反馈信息
   */
  collectFeedback(result) {
    Object.values(result.checks).forEach(check => {
      if (check && check.errors) {
        result.errors.push(...check.errors);
      }
      if (check && check.criticalErrors) {
        result.errors.push(...check.criticalErrors);
      }
    });

    // 生成建议
    if (result.complianceScore < 1.0) {
      result.recommendations.push('建议使用自动修复功能改善合规性');
    }
    if (result.errors.length > 0) {
      result.recommendations.push('请参考assistant.role.md标准格式进行修正');
    }
  }

  /**
   * 检查结构合规性
   */
  async checkStructureCompliance(rolePackage) {
    const result = {
      name: '结构合规性检查',
      priority: 'P1',
      passed: true,
      score: 1.0,
      details: {},
      errors: []
    };

    try {
      // 使用analyzer的结构验证方法
      const thoughtResult = this.analyzer.validateThoughtStructure(rolePackage.thoughtFile);
      result.details.thoughtStructure = thoughtResult;

      const executionResult = this.analyzer.validateExecutionStructure(rolePackage.executionFile);
      result.details.executionStructure = executionResult;

      // 计算结构合规评分
      result.score = (thoughtResult.score + executionResult.score) / 2;
      result.passed = result.score >= 0.8;

      if (!thoughtResult.isValid) {
        result.errors.push(...thoughtResult.errors);
      }
      if (!executionResult.isValid) {
        result.errors.push(...executionResult.errors);
      }

    } catch (error) {
      result.errors.push(`结构检查异常: ${error.message}`);
      result.passed = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 检查内容质量
   */
  async checkContentQuality(rolePackage) {
    const result = {
      name: '内容质量检查',
      priority: 'P2',
      passed: true,
      score: 1.0,
      details: {},
      errors: []
    };

    try {
      // 使用analyzer的内容质量验证方法
      const thoughtQuality = this.analyzer.validateContentQuality(rolePackage.thoughtFile);
      result.details.thoughtQuality = thoughtQuality;

      const executionQuality = this.analyzer.validateContentQuality(rolePackage.executionFile);
      result.details.executionQuality = executionQuality;

      // 计算内容质量评分
      result.score = (thoughtQuality.score + executionQuality.score) / 2;
      result.passed = result.score >= 0.7;

      if (!thoughtQuality.isValid) {
        result.errors.push(...thoughtQuality.errors);
      }
      if (!executionQuality.isValid) {
        result.errors.push(...executionQuality.errors);
      }

    } catch (error) {
      result.errors.push(`内容质量检查异常: ${error.message}`);
      result.passed = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 检查系统集成
   */
  async checkSystemIntegration(rolePackage) {
    const result = {
      name: '系统集成检查',
      priority: 'P1',
      passed: true,
      score: 1.0,
      details: {},
      errors: []
    };

    try {
      // 使用analyzer的系统集成验证方法
      const fileStructure = this.analyzer.validateFileStructure(rolePackage);
      result.details.fileStructure = fileStructure;

      const namingConsistency = this.analyzer.validateNamingConsistency(rolePackage);
      result.details.namingConsistency = namingConsistency;

      const referenceIntegrity = this.analyzer.validateReferenceIntegrity(rolePackage);
      result.details.referenceIntegrity = referenceIntegrity;

      // 计算系统集成评分
      const scores = [fileStructure.score, namingConsistency.score, referenceIntegrity.score];
      result.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      result.passed = result.score >= 0.9;

      [fileStructure, namingConsistency, referenceIntegrity].forEach(check => {
        if (!check.isValid) {
          result.errors.push(...check.errors);
        }
      });

    } catch (error) {
      result.errors.push(`系统集成检查异常: ${error.message}`);
      result.passed = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 计算引用评分
   */
  calculateReferenceScore(details) {
    let totalScore = 0;
    let count = 0;

    Object.values(details).forEach(detail => {
      if (detail && typeof detail.score === 'number') {
        totalScore += detail.score;
        count++;
      } else if (detail && detail.passed !== undefined) {
        totalScore += detail.passed ? 1.0 : 0.0;
        count++;
      }
    });

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * 检查组件格式
   */
  checkComponentFormat(content, componentType) {
    const result = {
      passed: true,
      score: 1.0,
      errors: [],
      checks: {}
    };

    if (!content) {
      result.passed = false;
      result.errors.push(`${componentType}组件内容为空`);
      result.score = 0;
      return result;
    }

    // 检查根元素
    result.checks.rootElement = this.validateRootElement(content, componentType);

    // 检查XML格式
    result.checks.xmlValidity = this.validateXMLFormat(content);

    // 收集错误
    Object.values(result.checks).forEach(check => {
      if (!check.passed) {
        result.passed = false;
        result.errors.push(...check.errors);
      }
    });

    // 计算评分
    const passedChecks = Object.values(result.checks).filter(check => check.passed).length;
    result.score = passedChecks / Object.keys(result.checks).length;

    return result;
  }

  /**
   * 验证引用完整性
   */
  validateReferenceIntegrity(rolePackage) {
    return this.analyzer.validateReferenceIntegrity(rolePackage);
  }

  /**
   * 生成检查摘要
   */
  generateSummary(result) {
    return {
      status: result.overallCompliance ? '✅ 合规' : '❌ 不合规',
      score: `${Math.round(result.complianceScore * 100)}%`,
      totalErrors: result.errors.length,
      processingTime: `${result.processingTime}ms`,
      criticalIssues: result.errors.filter(error =>
        error.includes('格式错误') || error.includes('引用格式')
      ).length
    };
  }
}

module.exports = ComplianceChecker;
