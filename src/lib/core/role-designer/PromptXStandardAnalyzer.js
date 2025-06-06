/**
 * PromptX标准化分析器
 * 基于assistant.role.md的权威标准格式分析和验证
 * 
 * @author PromptX全栈开发者
 * @version 1.0.0
 */

class PromptXStandardAnalyzer {
  constructor() {
    this.standardFormat = this.defineStandardFormat();
    this.validationRules = this.defineValidationRules();
  }

  /**
   * 定义PromptX标准格式规范
   * 基于assistant.role.md的权威格式
   */
  defineStandardFormat() {
    return {
      mainFile: {
        structure: {
          rootElement: 'role',
          requiredComponents: ['personality', 'principle'],
          componentCount: 2,
          allowInlineContent: false
        },
        personality: {
          requiredReferences: [
            '@!thought://remember',
            '@!thought://recall', 
            '@!thought://{{roleName}}'
          ],
          referenceFormat: '@!thought://',
          allowCustomReferences: true
        },
        principle: {
          requiredReferences: [
            '@!execution://{{roleName}}'
          ],
          referenceFormat: '@!execution://',
          allowCustomReferences: false
        }
      },
      thoughtComponent: {
        structure: {
          rootElement: 'thought',
          requiredSections: ['exploration', 'reasoning', 'challenge', 'plan'],
          sectionCount: 4,
          requireDiagrams: true
        },
        contentRequirements: {
          exploration: 'divergent thinking, capability dimensions',
          reasoning: 'logical framework, systematic thinking',
          challenge: 'critical thinking, limitation analysis', 
          plan: 'structured approach, implementation framework'
        }
      },
      executionComponent: {
        structure: {
          rootElement: 'execution',
          requiredSections: ['constraint', 'rule', 'guideline', 'process', 'criteria'],
          sectionCount: 5,
          requireFlowcharts: true
        },
        priorityOrder: ['constraint', 'rule', 'guideline', 'process', 'criteria'],
        contentRequirements: {
          constraint: 'objective limitations, system constraints',
          rule: 'mandatory rules, strict compliance',
          guideline: 'recommended practices, flexible principles',
          process: 'execution steps, workflow definition',
          criteria: 'evaluation standards, quality metrics'
        }
      },
      fileStructure: {
        directoryLayout: '{{roleName}}/{{roleName}}.role.md',
        thoughtFile: '{{roleName}}/thought/{{roleName}}.thought.md',
        executionFile: '{{roleName}}/execution/{{roleName}}.execution.md',
        namingConsistency: true,
        componentSeparation: true
      }
    };
  }

  /**
   * 定义验证规则
   */
  defineValidationRules() {
    return {
      mainFileValidation: {
        structureCompliance: this.validateMainFileStructure.bind(this),
        referenceFormat: this.validateReferenceFormat.bind(this),
        componentIntegrity: this.validateComponentIntegrity.bind(this)
      },
      componentValidation: {
        thoughtStructure: this.validateThoughtStructure.bind(this),
        executionStructure: this.validateExecutionStructure.bind(this),
        contentQuality: this.validateContentQuality.bind(this)
      },
      systemIntegration: {
        fileStructure: this.validateFileStructure.bind(this),
        namingConsistency: this.validateNamingConsistency.bind(this),
        referenceIntegrity: this.validateReferenceIntegrity.bind(this)
      }
    };
  }

  /**
   * 分析角色文件的PromptX标准合规性
   * @param {Object} rolePackage - 角色文件包
   * @returns {Object} 分析结果
   */
  analyzeCompliance(rolePackage) {
    const results = {
      overallCompliance: true,
      complianceScore: 0,
      detailedResults: {},
      errors: [],
      warnings: [],
      recommendations: []
    };

    // 主文件合规性检查
    const mainFileResult = this.validateMainFile(rolePackage.mainFile);
    results.detailedResults.mainFile = mainFileResult;
    
    // 组件文件合规性检查
    const thoughtResult = this.validateThoughtComponent(rolePackage.thoughtFile);
    results.detailedResults.thoughtComponent = thoughtResult;
    
    const executionResult = this.validateExecutionComponent(rolePackage.executionFile);
    results.detailedResults.executionComponent = executionResult;
    
    // 系统集成合规性检查
    const integrationResult = this.validateSystemIntegration(rolePackage);
    results.detailedResults.systemIntegration = integrationResult;

    // 计算总体合规性
    results.overallCompliance = this.calculateOverallCompliance(results.detailedResults);
    results.complianceScore = this.calculateComplianceScore(results.detailedResults);
    
    // 收集错误和建议
    this.collectErrorsAndRecommendations(results);

    return results;
  }

  /**
   * 验证主文件结构
   */
  validateMainFileStructure(content) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    try {
      // 检查根元素
      if (!content.includes('<role>') || !content.includes('</role>')) {
        result.errors.push('主文件必须包含<role>根元素');
        result.isValid = false;
      }

      // 检查必需组件
      const requiredComponents = ['<personality>', '<principle>'];
      requiredComponents.forEach(component => {
        if (!content.includes(component)) {
          result.errors.push(`缺少必需组件: ${component}`);
          result.isValid = false;
        }
      });

      // 检查组件数量
      const componentCount = (content.match(/<(personality|principle)>/g) || []).length;
      if (componentCount !== 2) {
        result.errors.push(`组件数量错误: 期望2个，实际${componentCount}个`);
        result.isValid = false;
      }

      // 检查是否有内联内容
      const hasInlineContent = this.checkInlineContent(content);
      if (hasInlineContent) {
        result.errors.push('主文件不允许包含内联内容，所有内容必须通过引用实现');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`结构验证异常: ${error.message}`);
      result.isValid = false;
    }

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证引用格式
   */
  validateReferenceFormat(content) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    // 检查@!前缀格式
    const thoughtReferences = content.match(/@!thought:\/\/[\w-]+/g) || [];
    const executionReferences = content.match(/@!execution:\/\/[\w-]+/g) || [];
    
    // 验证personality组件的引用
    const personalitySection = this.extractSection(content, 'personality');
    if (personalitySection) {
      const requiredThoughtRefs = ['@!thought://remember', '@!thought://recall'];
      requiredThoughtRefs.forEach(ref => {
        if (!personalitySection.includes(ref)) {
          result.errors.push(`personality组件缺少必需引用: ${ref}`);
          result.isValid = false;
        }
      });
    }

    // 验证principle组件的引用
    const principleSection = this.extractSection(content, 'principle');
    if (principleSection) {
      if (!principleSection.includes('@!execution://')) {
        result.errors.push('principle组件必须包含@!execution://引用');
        result.isValid = false;
      }
    }

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 检查内联内容
   */
  checkInlineContent(content) {
    // 移除引用和标签后检查是否还有实质内容
    const withoutReferences = content
      .replace(/@![a-zA-Z0-9:\/-]+/g, '') // 移除引用（支持连字符）
      .replace(/<\/?[\w]+[^>]*>/g, '')    // 移除所有标签
      .replace(/\s+/g, '')                // 移除所有空白字符
      .trim();

    // 只有当存在非空白、非引用、非标签的内容时才认为是内联内容
    return withoutReferences.length > 0;
  }

  /**
   * 提取组件内容
   */
  extractSection(content, sectionName) {
    const regex = new RegExp(`<${sectionName}>(.*?)<\/${sectionName}>`, 's');
    const match = content.match(regex);
    return match ? match[1] : null;
  }

  /**
   * 验证组件完整性
   */
  validateComponentIntegrity(rolePackage) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    // 检查文件存在性
    if (!rolePackage.mainFile) {
      result.errors.push('缺少主文件');
      result.isValid = false;
    }
    if (!rolePackage.thoughtFile) {
      result.errors.push('缺少thought组件文件');
      result.isValid = false;
    }
    if (!rolePackage.executionFile) {
      result.errors.push('缺少execution组件文件');
      result.isValid = false;
    }

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证thought组件结构
   */
  validateThoughtStructure(content) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    const requiredSections = ['exploration', 'reasoning', 'challenge', 'plan'];
    requiredSections.forEach(section => {
      if (!content.includes(`<${section}>`)) {
        result.errors.push(`thought组件缺少必需部分: ${section}`);
        result.isValid = false;
      }
    });

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证execution组件结构
   */
  validateExecutionStructure(content) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    const requiredSections = ['constraint', 'rule', 'guideline', 'process', 'criteria'];
    requiredSections.forEach(section => {
      if (!content.includes(`<${section}>`)) {
        result.errors.push(`execution组件缺少必需部分: ${section}`);
        result.isValid = false;
      }
    });

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证内容质量
   */
  validateContentQuality(content) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0,
      qualityMetrics: {}
    };

    // 内容长度检查
    if (content.length < 500) {
      result.errors.push('内容过短，可能缺乏足够的专业深度');
      result.score -= 0.2;
    }

    // 结构化内容检查
    const hasHeaders = content.includes('##') || content.includes('###');
    if (!hasHeaders) {
      result.errors.push('缺少结构化标题，影响可读性');
      result.score -= 0.1;
    }

    // 专业术语密度检查
    const professionalTerms = content.match(/\*\*[^*]+\*\*/g) || [];
    result.qualityMetrics.professionalTermCount = professionalTerms.length;

    if (professionalTerms.length < 5) {
      result.errors.push('专业术语较少，可能影响专业性');
      result.score -= 0.1;
    }

    result.isValid = result.score > 0.7;
    return result;
  }

  /**
   * 验证文件结构
   */
  validateFileStructure(rolePackage) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    // 检查目录结构
    const expectedPaths = [
      `${rolePackage.roleName}/${rolePackage.roleName}.role.md`,
      `${rolePackage.roleName}/thought/${rolePackage.roleName}.thought.md`,
      `${rolePackage.roleName}/execution/${rolePackage.roleName}.execution.md`
    ];

    expectedPaths.forEach(path => {
      if (!rolePackage.filePaths.includes(path)) {
        result.errors.push(`缺少预期文件路径: ${path}`);
        result.isValid = false;
      }
    });

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证命名一致性
   */
  validateNamingConsistency(rolePackage) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    const roleName = rolePackage.roleName;

    // 检查文件名一致性
    if (!rolePackage.mainFile.includes(roleName)) {
      result.errors.push('主文件名与角色名不一致');
      result.isValid = false;
    }

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证引用完整性
   */
  validateReferenceIntegrity(rolePackage) {
    const result = {
      isValid: true,
      errors: [],
      score: 1.0
    };

    // 检查引用的文件是否存在
    const thoughtRef = `@!thought://${rolePackage.roleName}`;
    const executionRef = `@!execution://${rolePackage.roleName}`;

    if (rolePackage.mainFile.includes(thoughtRef) && !rolePackage.thoughtFile) {
      result.errors.push(`引用的thought文件不存在: ${thoughtRef}`);
      result.isValid = false;
    }

    if (rolePackage.mainFile.includes(executionRef) && !rolePackage.executionFile) {
      result.errors.push(`引用的execution文件不存在: ${executionRef}`);
      result.isValid = false;
    }

    result.score = result.isValid ? 1.0 : 0.0;
    return result;
  }

  /**
   * 验证主文件
   */
  validateMainFile(content) {
    return {
      structure: this.validateMainFileStructure(content),
      references: this.validateReferenceFormat(content)
    };
  }

  /**
   * 验证thought组件
   */
  validateThoughtComponent(content) {
    return {
      structure: this.validateThoughtStructure(content),
      quality: this.validateContentQuality(content)
    };
  }

  /**
   * 验证execution组件
   */
  validateExecutionComponent(content) {
    return {
      structure: this.validateExecutionStructure(content),
      quality: this.validateContentQuality(content)
    };
  }

  /**
   * 验证系统集成
   */
  validateSystemIntegration(rolePackage) {
    return {
      fileStructure: this.validateFileStructure(rolePackage),
      namingConsistency: this.validateNamingConsistency(rolePackage),
      referenceIntegrity: this.validateReferenceIntegrity(rolePackage)
    };
  }

  /**
   * 计算总体合规性
   */
  calculateOverallCompliance(detailedResults) {
    // 递归检查所有结果对象
    const checkCompliance = (obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return true;
      }

      // 如果对象有isValid属性，检查它
      if (obj.hasOwnProperty('isValid')) {
        return obj.isValid === true;
      }

      // 递归检查子对象
      return Object.values(obj).every(value => checkCompliance(value));
    };

    return checkCompliance(detailedResults);
  }

  /**
   * 计算合规性评分
   */
  calculateComplianceScore(detailedResults) {
    let totalScore = 0;
    let count = 0;

    const collectScores = (obj) => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'object' && value.score !== undefined) {
          totalScore += value.score;
          count++;
        } else if (typeof value === 'object') {
          collectScores(value);
        }
      });
    };

    collectScores(detailedResults);
    return count > 0 ? totalScore / count : 0;
  }

  /**
   * 收集错误和建议
   */
  collectErrorsAndRecommendations(results) {
    const collectErrors = (obj) => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'object' && value.errors) {
          results.errors.push(...value.errors);
        } else if (typeof value === 'object') {
          collectErrors(value);
        }
      });
    };

    collectErrors(results.detailedResults);

    // 生成改进建议
    if (results.complianceScore < 1.0) {
      results.recommendations.push('建议使用自动修复功能改善合规性');
    }
    if (results.errors.length > 0) {
      results.recommendations.push('请参考PromptX标准格式文档进行修正');
    }
  }

  /**
   * 生成标准格式模板
   */
  generateStandardTemplate(roleName) {
    return {
      mainFile: `<role>
  <personality>
    @!thought://remember
    @!thought://recall
    @!thought://${roleName}

  </personality>

  <principle>
    @!execution://${roleName}
  </principle>
</role>`,

      thoughtTemplate: `<thought>
  <exploration>
    ## ${roleName}角色特质探索

    ### 核心能力维度
    - **专业能力**：[定义核心专业技能]
    - **思维特征**：[描述思维模式特点]
    - **价值创造**：[说明价值创造方式]
  </exploration>

  <reasoning>
    ## 思维框架逻辑推理

    ### 逻辑推理链
    \`\`\`
    问题识别 → 分析思考 → 方案设计 → 执行验证 → 结果优化
    \`\`\`
  </reasoning>

  <challenge>
    ## 思维模式的潜在限制

    ### 关键挑战点
    - [识别可能的思维局限]
    - [分析潜在风险点]
  </challenge>

  <plan>
    ## 思维模式的运用结构

    ### 应用框架
    1. **[步骤1]**：[具体描述]
    2. **[步骤2]**：[具体描述]
  </plan>
</thought>`,

      executionTemplate: `<execution>
  <constraint>
    ## 客观限制条件

    ### 系统约束
    - **[约束类型]**：[具体约束描述]
  </constraint>

  <rule>
    ## 强制执行规则

    ### 核心规则
    - **[规则类型]**：[具体规则要求]
  </rule>

  <guideline>
    ## 建议性指导原则

    ### 最佳实践
    - **[实践领域]**：[具体指导建议]
  </guideline>

  <process>
    ## 执行流程步骤

    ### 标准流程
    1. **[步骤1]**：[具体操作]
    2. **[步骤2]**：[具体操作]
  </process>

  <criteria>
    ## 评价标准

    ### 质量标准
    - **[评价维度]**：[具体标准要求]
  </criteria>
</execution>`
    };
  }

  /**
   * 生成合规性报告
   */
  generateComplianceReport(analysisResult) {
    const report = {
      summary: {
        overallCompliance: analysisResult.overallCompliance,
        complianceScore: Math.round(analysisResult.complianceScore * 100),
        totalErrors: analysisResult.errors.length,
        status: analysisResult.overallCompliance ? '✅ 合规' : '❌ 不合规'
      },
      details: analysisResult.detailedResults,
      errors: analysisResult.errors,
      recommendations: analysisResult.recommendations,
      timestamp: new Date().toISOString()
    };

    return report;
  }
}

module.exports = PromptXStandardAnalyzer;
