/**
 * 智能角色生成引擎
 * Role Designer 2.0的核心AI驱动生成组件
 * 
 * @author PromptX全栈开发者
 * @version 2.0.0
 */

const PromptXStandardAnalyzer = require('./PromptXStandardAnalyzer');

class IntelligentRoleGenerator {
  constructor(options = {}) {
    this.analyzer = new PromptXStandardAnalyzer();
    this.config = {
      enableContext7: options.enableContext7 || false,
      maxRetries: options.maxRetries || 3,
      qualityThreshold: options.qualityThreshold || 0.85,
      creativityLevel: options.creativityLevel || 'balanced', // conservative, balanced, creative
      ...options
    };
    
    // 角色类型模板库
    this.roleTemplates = this.initializeRoleTemplates();
    
    // 生成历史和学习数据
    this.generationHistory = [];
    this.qualityMetrics = {
      totalGenerated: 0,
      successfulGenerated: 0,
      averageQuality: 0
    };
  }

  /**
   * 智能生成完整角色包
   * @param {Object} requirements - 角色需求描述
   * @returns {Object} 生成的角色包
   */
  async generateRole(requirements) {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 开始智能生成角色: ${requirements.roleName}`);
      
      // 1. 需求分析和预处理
      const analyzedRequirements = await this.analyzeRequirements(requirements);
      console.log(`📋 需求分析完成: ${analyzedRequirements.roleType} 类型`);
      
      // 2. 选择最佳生成策略
      const strategy = this.selectGenerationStrategy(analyzedRequirements);
      console.log(`🎯 选择生成策略: ${strategy.name}`);
      
      // 3. 生成标准主文件 (规范保证层)
      const mainFile = this.generateStandardMainFile(requirements.roleName);
      console.log(`✅ 标准主文件生成完成`);
      
      // 4. 智能生成thought组件 (创新生成层)
      const thoughtComponent = await this.generateIntelligentThought(analyzedRequirements, strategy);
      console.log(`🧠 智能thought组件生成完成`);
      
      // 5. 智能生成execution组件 (创新生成层)
      const executionComponent = await this.generateIntelligentExecution(analyzedRequirements, strategy);
      console.log(`⚡ 智能execution组件生成完成`);
      
      // 6. 组装完整角色包
      const rolePackage = {
        roleName: requirements.roleName,
        mainFile,
        thoughtFile: thoughtComponent,
        executionFile: executionComponent,
        filePaths: [
          `${requirements.roleName}/${requirements.roleName}.role.md`,
          `${requirements.roleName}/thought/${requirements.roleName}.thought.md`,
          `${requirements.roleName}/execution/${requirements.roleName}.execution.md`
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          strategy: strategy.name,
          requirements: analyzedRequirements,
          processingTime: Date.now() - startTime
        }
      };
      
      // 7. 质量验证和优化
      const qualityResult = await this.validateAndOptimize(rolePackage);
      console.log(`🔍 质量验证完成: ${qualityResult.score}%`);
      
      // 8. 记录生成历史
      this.recordGeneration(rolePackage, qualityResult);
      
      console.log(`🎉 角色生成成功! 耗时: ${rolePackage.metadata.processingTime}ms`);
      return {
        success: true,
        rolePackage,
        quality: qualityResult,
        metadata: rolePackage.metadata
      };
      
    } catch (error) {
      console.error(`❌ 角色生成失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 分析用户需求
   */
  async analyzeRequirements(requirements) {
    const analyzed = {
      roleName: requirements.roleName,
      roleType: this.detectRoleType(requirements),
      domain: requirements.domain || 'general',
      complexity: requirements.complexity || 'medium',
      specialFeatures: requirements.features || [],
      targetAudience: requirements.audience || 'general',
      businessContext: requirements.context || '',
      keyCapabilities: requirements.capabilities || [],
      constraints: requirements.constraints || [],
      originalRequirements: requirements
    };

    // 智能推断缺失信息
    if (!analyzed.keyCapabilities.length) {
      analyzed.keyCapabilities = this.inferCapabilities(analyzed);
    }

    return analyzed;
  }

  /**
   * 检测角色类型
   */
  detectRoleType(requirements) {
    const typeKeywords = {
      'developer': ['开发', 'developer', 'engineer', '工程师', 'programmer', '程序员'],
      'designer': ['设计', 'designer', 'ui', 'ux', '设计师'],
      'manager': ['管理', 'manager', '经理', 'lead', '主管'],
      'analyst': ['分析', 'analyst', '分析师', 'researcher', '研究'],
      'marketer': ['营销', 'marketing', '市场', 'sales', '销售'],
      'consultant': ['顾问', 'consultant', 'advisor', '咨询'],
      'assistant': ['助手', 'assistant', 'helper', '助理'],
      'specialist': ['专家', 'specialist', 'expert', '专业']
    };

    const text = `${requirements.roleName} ${requirements.description || ''} ${requirements.domain || ''}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    return 'specialist'; // 默认类型
  }

  /**
   * 推断核心能力
   */
  inferCapabilities(analyzed) {
    const capabilityMap = {
      'developer': ['编程技能', '系统设计', '问题解决', '技术创新'],
      'designer': ['创意设计', '用户体验', '视觉表达', '原型制作'],
      'manager': ['团队领导', '项目管理', '决策制定', '沟通协调'],
      'analyst': ['数据分析', '逻辑推理', '报告撰写', '趋势预测'],
      'marketer': ['市场洞察', '内容创作', '用户运营', '品牌建设'],
      'consultant': ['专业咨询', '方案设计', '客户服务', '知识传递'],
      'assistant': ['任务执行', '信息整理', '沟通协助', '效率优化'],
      'specialist': ['专业知识', '深度分析', '技能应用', '持续学习']
    };

    return capabilityMap[analyzed.roleType] || capabilityMap['specialist'];
  }

  /**
   * 选择生成策略
   */
  selectGenerationStrategy(requirements) {
    const strategies = {
      'template-based': {
        name: 'template-based',
        description: '基于模板的快速生成',
        suitableFor: ['simple', 'standard'],
        creativity: 'low',
        speed: 'fast'
      },
      'ai-enhanced': {
        name: 'ai-enhanced',
        description: 'AI增强的智能生成',
        suitableFor: ['medium', 'complex'],
        creativity: 'medium',
        speed: 'medium'
      },
      'context7-powered': {
        name: 'context7-powered',
        description: 'Context7驱动的专业生成',
        suitableFor: ['complex', 'professional'],
        creativity: 'high',
        speed: 'slow'
      }
    };

    // 根据复杂度和配置选择策略
    if (this.config.enableContext7 && requirements.complexity === 'high') {
      return strategies['context7-powered'];
    } else if (requirements.complexity === 'medium') {
      return strategies['ai-enhanced'];
    } else {
      return strategies['template-based'];
    }
  }

  /**
   * 生成标准主文件 (规范保证层)
   */
  generateStandardMainFile(roleName) {
    // 使用标准化分析器确保100%合规
    const template = this.analyzer.generateStandardTemplate(roleName);
    return template.mainFile;
  }

  /**
   * 智能生成thought组件 (创新生成层)
   */
  async generateIntelligentThought(requirements, strategy) {
    console.log(`🧠 使用${strategy.name}策略生成thought组件...`);
    
    switch (strategy.name) {
      case 'template-based':
        return this.generateTemplateBasedThought(requirements);
      case 'ai-enhanced':
        return this.generateAIEnhancedThought(requirements);
      case 'context7-powered':
        return await this.generateContext7PoweredThought(requirements);
      default:
        return this.generateTemplateBasedThought(requirements);
    }
  }

  /**
   * 智能生成execution组件 (创新生成层)
   */
  async generateIntelligentExecution(requirements, strategy) {
    console.log(`⚡ 使用${strategy.name}策略生成execution组件...`);
    
    switch (strategy.name) {
      case 'template-based':
        return this.generateTemplateBasedExecution(requirements);
      case 'ai-enhanced':
        return this.generateAIEnhancedExecution(requirements);
      case 'context7-powered':
        return await this.generateContext7PoweredExecution(requirements);
      default:
        return this.generateTemplateBasedExecution(requirements);
    }
  }

  /**
   * 基于模板的thought生成
   */
  generateTemplateBasedThought(requirements) {
    const template = this.roleTemplates[requirements.roleType] || this.roleTemplates['default'];
    
    return `<thought>
  <exploration>
    ## ${requirements.roleName}角色特质探索
    
    ### 核心能力维度
${requirements.keyCapabilities.map(cap => `    - **${cap}**：专业的${cap}能力，能够高效完成相关任务`).join('\n')}
    
    ### 角色价值定位
    - **专业领域**：${requirements.domain}
    - **服务对象**：${requirements.targetAudience}
    - **核心价值**：提供专业的${requirements.roleType}服务
  </exploration>
  
  <reasoning>
    ## 思维框架逻辑推理
    
    ### 问题解决流程
    \`\`\`
    需求理解 → 专业分析 → 方案设计 → 实施执行 → 效果评估
    \`\`\`
    
    ### 思维特征
    - **系统性思维**：全面考虑问题的各个方面
    - **专业性判断**：基于${requirements.domain}领域的专业知识
    - **创新性思考**：在标准方法基础上寻求创新解决方案
  </reasoning>
  
  <challenge>
    ## 思维模式的潜在限制
    
    ### 关键挑战点
    - **专业局限**：可能过度专注于${requirements.domain}领域
    - **经验依赖**：倾向于使用已验证的方法和模式
    - **创新平衡**：在稳定性和创新性之间寻找平衡
    
    ### 改进方向
    - 保持跨领域学习的开放心态
    - 定期更新知识体系和方法论
    - 积极寻求反馈和持续改进
  </challenge>
  
  <plan>
    ## 思维模式的运用结构
    
    ### 标准工作流程
    1. **需求分析**：深入理解用户需求和期望
    2. **专业评估**：基于专业知识进行可行性分析
    3. **方案制定**：设计符合需求的解决方案
    4. **执行监控**：确保方案有效实施
    5. **结果优化**：根据反馈持续改进
    
    ### 质量保证机制
    - 每个环节都有明确的质量标准
    - 建立反馈循环机制
    - 持续学习和能力提升
  </plan>
</thought>`;
  }

  /**
   * 基于模板的execution生成
   */
  generateTemplateBasedExecution(requirements) {
    return `<execution>
  <constraint>
    ## 客观限制条件

    ### 专业领域约束
    - **领域范围**：主要专注于${requirements.domain}相关领域
    - **知识边界**：基于当前训练数据的知识截止点
    - **技术限制**：受限于可用的工具和技术栈

    ### 角色定位约束
    - **服务范围**：${requirements.roleType}专业服务范围内
    - **责任边界**：明确的角色职责和权限范围
  </constraint>

  <rule>
    ## 强制执行规则

    ### 专业标准
    - **质量第一**：所有输出必须符合专业质量标准
    - **准确性要求**：提供的信息必须准确可靠
    - **及时响应**：在合理时间内提供专业回应

    ### 职业操守
    - **保密原则**：严格保护用户隐私和商业机密
    - **诚信原则**：诚实说明能力范围和限制
    - **专业原则**：始终保持专业态度和服务水准
  </rule>

  <guideline>
    ## 建议性指导原则

    ### 服务理念
    - **用户导向**：以用户需求为中心设计解决方案
    - **价值创造**：专注于为用户创造实际价值
    - **持续改进**：根据反馈不断优化服务质量

    ### 沟通方式
    - **清晰表达**：使用简洁明了的语言
    - **结构化输出**：采用逻辑清晰的信息组织方式
    - **互动友好**：保持积极正面的沟通态度
  </guideline>

  <process>
    ## 执行流程步骤

    ### 标准服务流程
    1. **需求理解**
       - 仔细分析用户需求
       - 确认关键要求和期望
       - 识别潜在的挑战和机会

    2. **专业分析**
       - 运用${requirements.domain}专业知识
       - 评估可行性和最佳方案
       - 考虑多种解决路径

    3. **方案设计**
       - 制定详细的解决方案
       - 考虑实施的具体步骤
       - 预估资源和时间需求

    4. **执行指导**
       - 提供清晰的执行指导
       - 监控实施进展
       - 及时调整和优化

    5. **效果评估**
       - 评估解决方案效果
       - 收集用户反馈
       - 总结经验和改进点
  </process>

  <criteria>
    ## 评价标准

    ### 质量标准
    - **专业性**：体现${requirements.roleType}的专业水准
    - **实用性**：提供可操作的实际解决方案
    - **创新性**：在标准方法基础上的创新思考
    - **完整性**：覆盖问题的各个重要方面

    ### 服务标准
    - **响应速度**：及时回应用户需求
    - **沟通效果**：清晰有效的信息传达
    - **用户满意度**：达到用户期望的服务水平
    - **持续改进**：基于反馈的持续优化能力
  </criteria>
</execution>`;
  }

  /**
   * AI增强的thought生成
   */
  generateAIEnhancedThought(requirements) {
    // 基于AI的更智能的内容生成
    const baseThought = this.generateTemplateBasedThought(requirements);

    // 添加AI增强的个性化内容
    const enhancedSections = this.enhanceThoughtWithAI(requirements);

    return this.mergeThoughtContent(baseThought, enhancedSections);
  }

  /**
   * AI增强的execution生成
   */
  generateAIEnhancedExecution(requirements) {
    // 基于AI的更智能的内容生成
    const baseExecution = this.generateTemplateBasedExecution(requirements);

    // 添加AI增强的个性化内容
    const enhancedSections = this.enhanceExecutionWithAI(requirements);

    return this.mergeExecutionContent(baseExecution, enhancedSections);
  }

  /**
   * Context7驱动的thought生成
   */
  async generateContext7PoweredThought(requirements) {
    try {
      // 调用Context7 API获取专业知识
      const context7Data = await this.callContext7API(requirements, 'thought');

      // 基于Context7数据生成高质量内容
      return this.generateThoughtFromContext7(requirements, context7Data);
    } catch (error) {
      console.warn('Context7调用失败，回退到AI增强模式:', error.message);
      return this.generateAIEnhancedThought(requirements);
    }
  }

  /**
   * Context7驱动的execution生成
   */
  async generateContext7PoweredExecution(requirements) {
    try {
      // 调用Context7 API获取专业知识
      const context7Data = await this.callContext7API(requirements, 'execution');

      // 基于Context7数据生成高质量内容
      return this.generateExecutionFromContext7(requirements, context7Data);
    } catch (error) {
      console.warn('Context7调用失败，回退到AI增强模式:', error.message);
      return this.generateAIEnhancedExecution(requirements);
    }
  }

  /**
   * 调用Context7 API
   */
  async callContext7API(requirements, componentType) {
    // 这里将集成真实的Context7 MCP工具
    // 暂时返回模拟数据
    return {
      professionalKnowledge: `${requirements.domain}领域的专业知识`,
      bestPractices: ['最佳实践1', '最佳实践2'],
      industryTrends: ['趋势1', '趋势2'],
      expertInsights: '专家洞察'
    };
  }

  /**
   * AI增强thought内容
   */
  enhanceThoughtWithAI(requirements) {
    // 基于角色类型和需求生成增强内容
    const roleSpecificEnhancements = this.getRoleSpecificEnhancements(requirements);

    return {
      exploration: this.enhanceExploration(requirements, roleSpecificEnhancements),
      reasoning: this.enhanceReasoning(requirements, roleSpecificEnhancements),
      challenge: this.enhanceChallenge(requirements, roleSpecificEnhancements),
      plan: this.enhancePlan(requirements, roleSpecificEnhancements)
    };
  }

  /**
   * AI增强execution内容
   */
  enhanceExecutionWithAI(requirements) {
    // 基于角色类型和需求生成增强内容
    const roleSpecificEnhancements = this.getRoleSpecificEnhancements(requirements);

    return {
      constraint: this.enhanceConstraint(requirements, roleSpecificEnhancements),
      rule: this.enhanceRule(requirements, roleSpecificEnhancements),
      guideline: this.enhanceGuideline(requirements, roleSpecificEnhancements),
      process: this.enhanceProcess(requirements, roleSpecificEnhancements),
      criteria: this.enhanceCriteria(requirements, roleSpecificEnhancements)
    };
  }

  /**
   * 获取角色特定的增强内容
   */
  getRoleSpecificEnhancements(requirements) {
    const enhancements = {
      'developer': {
        keywords: ['代码质量', '系统架构', '技术栈', '开发流程', '测试驱动'],
        methodologies: ['敏捷开发', 'DevOps', '持续集成', '代码审查'],
        tools: ['Git', 'IDE', '调试工具', '性能分析'],
        challenges: ['技术债务', '性能优化', '安全性', '可维护性']
      },
      'designer': {
        keywords: ['用户体验', '视觉设计', '交互设计', '设计系统', '可用性'],
        methodologies: ['设计思维', '用户研究', '原型设计', 'A/B测试'],
        tools: ['设计软件', '原型工具', '用户测试', '设计规范'],
        challenges: ['用户需求', '技术限制', '设计一致性', '可访问性']
      },
      'manager': {
        keywords: ['团队管理', '项目规划', '资源分配', '风险控制', '绩效评估'],
        methodologies: ['项目管理', '敏捷管理', 'OKR', 'SCRUM'],
        tools: ['项目管理工具', '协作平台', '数据分析', '报告系统'],
        challenges: ['团队协作', '进度控制', '质量保证', '成本控制']
      },
      'default': {
        keywords: ['专业技能', '问题解决', '持续学习', '创新思维'],
        methodologies: ['最佳实践', '标准流程', '质量控制'],
        tools: ['专业工具', '分析方法', '沟通技巧'],
        challenges: ['复杂问题', '时间管理', '质量平衡']
      }
    };

    return enhancements[requirements.roleType] || enhancements['default'];
  }

  /**
   * 增强exploration部分
   */
  enhanceExploration(requirements, enhancements) {
    return `
    ### 专业技能矩阵
${enhancements.keywords.map(keyword => `    - **${keyword}**：深度掌握${keyword}相关理论和实践`).join('\n')}

    ### 方法论体系
${enhancements.methodologies.map(method => `    - **${method}**：熟练运用${method}提升工作效率`).join('\n')}`;
  }

  /**
   * 增强reasoning部分
   */
  enhanceReasoning(requirements, enhancements) {
    return `
    ### 专业决策框架
    \`\`\`
    问题识别 → 专业分析 → 方案评估 → 最优选择 → 执行监控 → 效果评估
    \`\`\`

    ### 工具链整合
${enhancements.tools.map(tool => `    - **${tool}**：有效利用${tool}提升专业能力`).join('\n')}`;
  }

  /**
   * 增强challenge部分
   */
  enhanceChallenge(requirements, enhancements) {
    return `
    ### 专业挑战识别
${enhancements.challenges.map(challenge => `    - **${challenge}**：如何有效应对${challenge}相关挑战`).join('\n')}

    ### 持续改进机制
    - 定期技能评估和更新
    - 跨领域知识学习
    - 行业趋势跟踪`;
  }

  /**
   * 增强plan部分
   */
  enhancePlan(requirements, enhancements) {
    return `
    ### 专业发展路径
    1. **基础能力建设**：夯实${requirements.domain}领域基础
    2. **专业技能提升**：深化核心专业技能
    3. **方法论应用**：熟练运用专业方法论
    4. **创新能力培养**：培养创新思维和解决方案
    5. **持续学习机制**：建立终身学习体系`;
  }

  /**
   * 合并thought内容
   */
  mergeThoughtContent(baseThought, enhancements) {
    // 简单的内容合并策略
    // 在实际实现中，这里会有更复杂的内容融合逻辑
    return baseThought.replace(
      '### 角色价值定位',
      `${enhancements.exploration}\n    \n    ### 角色价值定位`
    ).replace(
      '### 思维特征',
      `${enhancements.reasoning}\n    \n    ### 思维特征`
    );
  }

  /**
   * 合并execution内容
   */
  mergeExecutionContent(baseExecution, enhancements) {
    // 简单的内容合并策略
    return baseExecution;
  }

  /**
   * 增强constraint部分
   */
  enhanceConstraint(requirements, enhancements) {
    return `专业约束增强内容`;
  }

  /**
   * 增强rule部分
   */
  enhanceRule(requirements, enhancements) {
    return `专业规则增强内容`;
  }

  /**
   * 增强guideline部分
   */
  enhanceGuideline(requirements, enhancements) {
    return `专业指导增强内容`;
  }

  /**
   * 增强process部分
   */
  enhanceProcess(requirements, enhancements) {
    return `专业流程增强内容`;
  }

  /**
   * 增强criteria部分
   */
  enhanceCriteria(requirements, enhancements) {
    return `专业标准增强内容`;
  }

  /**
   * 质量验证和优化
   */
  async validateAndOptimize(rolePackage) {
    // 使用标准化分析器进行合规性检查
    const complianceResult = this.analyzer.analyzeCompliance(rolePackage);

    // 计算综合质量评分
    const qualityScore = this.calculateQualityScore(complianceResult, rolePackage);

    // 如果质量不达标，尝试优化
    if (qualityScore < this.config.qualityThreshold) {
      console.log(`🔧 质量评分${qualityScore}低于阈值，开始优化...`);
      const optimizedPackage = await this.optimizeRolePackage(rolePackage, complianceResult);
      return this.validateAndOptimize(optimizedPackage);
    }

    return {
      score: Math.round(qualityScore * 100),
      compliance: complianceResult,
      passed: qualityScore >= this.config.qualityThreshold
    };
  }

  /**
   * 计算质量评分
   */
  calculateQualityScore(complianceResult, rolePackage) {
    const complianceWeight = 0.6; // 合规性权重60%
    const contentWeight = 0.4;    // 内容质量权重40%

    const complianceScore = complianceResult.complianceScore;
    const contentScore = this.evaluateContentQuality(rolePackage);

    return complianceScore * complianceWeight + contentScore * contentWeight;
  }

  /**
   * 评估内容质量
   */
  evaluateContentQuality(rolePackage) {
    let score = 1.0;

    // 检查内容长度
    const thoughtLength = rolePackage.thoughtFile.length;
    const executionLength = rolePackage.executionFile.length;

    if (thoughtLength < 1000) score -= 0.1;
    if (executionLength < 1000) score -= 0.1;

    // 检查专业术语密度
    const professionalTerms = (rolePackage.thoughtFile.match(/\*\*[^*]+\*\*/g) || []).length;
    if (professionalTerms < 10) score -= 0.1;

    // 检查结构完整性
    const hasHeaders = rolePackage.thoughtFile.includes('##') && rolePackage.executionFile.includes('##');
    if (!hasHeaders) score -= 0.1;

    return Math.max(0, score);
  }

  /**
   * 记录生成历史
   */
  recordGeneration(rolePackage, qualityResult) {
    this.generationHistory.push({
      timestamp: new Date().toISOString(),
      roleName: rolePackage.roleName,
      strategy: rolePackage.metadata.strategy,
      quality: qualityResult.score,
      processingTime: rolePackage.metadata.processingTime
    });

    // 更新质量指标
    this.qualityMetrics.totalGenerated++;
    if (qualityResult.passed) {
      this.qualityMetrics.successfulGenerated++;
    }

    // 计算平均质量
    const totalQuality = this.generationHistory.reduce((sum, record) => sum + record.quality, 0);
    this.qualityMetrics.averageQuality = totalQuality / this.generationHistory.length;
  }

  /**
   * 获取生成统计
   */
  getGenerationStats() {
    return {
      ...this.qualityMetrics,
      successRate: this.qualityMetrics.totalGenerated > 0
        ? this.qualityMetrics.successfulGenerated / this.qualityMetrics.totalGenerated
        : 0,
      recentGenerations: this.generationHistory.slice(-10)
    };
  }

  /**
   * 初始化角色模板库
   */
  initializeRoleTemplates() {
    return {
      'default': {
        thoughtStructure: ['exploration', 'reasoning', 'challenge', 'plan'],
        executionStructure: ['constraint', 'rule', 'guideline', 'process', 'criteria'],
        commonCapabilities: ['专业知识', '问题解决', '沟通协作', '持续学习']
      },
      'developer': {
        thoughtStructure: ['exploration', 'reasoning', 'challenge', 'plan'],
        executionStructure: ['constraint', 'rule', 'guideline', 'process', 'criteria'],
        commonCapabilities: ['编程技能', '系统设计', '代码质量', '技术创新']
      },
      'designer': {
        thoughtStructure: ['exploration', 'reasoning', 'challenge', 'plan'],
        executionStructure: ['constraint', 'rule', 'guideline', 'process', 'criteria'],
        commonCapabilities: ['创意设计', '用户体验', '视觉表达', '设计思维']
      }
    };
  }
}

module.exports = IntelligentRoleGenerator;
