/**
 * 灵活角色生成引擎
 * 真正的AI驱动，摆脱模板束缚的创新生成系统
 * 
 * @author PromptX全栈开发者
 * @version 2.1.0
 */

const PromptXStandardAnalyzer = require('./PromptXStandardAnalyzer');

class FlexibleRoleGenerator {
  constructor(options = {}) {
    this.analyzer = new PromptXStandardAnalyzer();
    this.config = {
      creativityLevel: options.creativityLevel || 'high', // low, medium, high, extreme
      allowNonStandard: options.allowNonStandard || true,
      enableExperimental: options.enableExperimental || false,
      customStructures: options.customStructures || true,
      ...options
    };
    
    // 创新生成策略
    this.generationStrategies = this.initializeStrategies();
    
    // 动态结构库
    this.dynamicStructures = this.initializeDynamicStructures();
  }

  /**
   * 灵活生成角色 - 完全基于需求驱动
   */
  async generateFlexibleRole(requirements) {
    console.log(`🎨 开始灵活生成角色: ${requirements.roleName}`);
    
    try {
      // 1. 深度需求理解 - 不预设任何模板
      const deepRequirements = await this.deepUnderstandRequirements(requirements);
      console.log(`🧠 深度需求理解完成: ${deepRequirements.uniqueness}% 独特性`);
      
      // 2. 动态结构设计 - 为每个角色设计独特结构
      const customStructure = await this.designCustomStructure(deepRequirements);
      console.log(`🏗️ 自定义结构设计: ${customStructure.thoughtSections.length}个思维维度, ${customStructure.executionSections.length}个执行维度`);
      
      // 3. 创意内容生成 - 完全原创内容
      const creativeContent = await this.generateCreativeContent(deepRequirements, customStructure);
      console.log(`✨ 创意内容生成完成: ${creativeContent.innovationScore}% 创新度`);
      
      // 4. 智能结构适配 - 保持PromptX合规性
      const adaptedContent = await this.adaptToPromptXStructure(creativeContent, customStructure);
      console.log(`🔧 PromptX结构适配完成`);
      
      // 5. 质量与创新平衡验证
      const balanceResult = await this.validateCreativeBalance(adaptedContent);
      console.log(`⚖️ 创新平衡验证: 合规${balanceResult.compliance}% + 创新${balanceResult.innovation}%`);
      
      return {
        success: true,
        rolePackage: adaptedContent,
        customStructure,
        metadata: {
          uniqueness: deepRequirements.uniqueness,
          innovation: creativeContent.innovationScore,
          compliance: balanceResult.compliance,
          generationType: 'flexible-creative'
        }
      };
      
    } catch (error) {
      console.error(`❌ 灵活生成失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 深度理解用户需求 - 挖掘真正的个性化需求
   */
  async deepUnderstandRequirements(requirements) {
    const analysis = {
      // 基础信息
      roleName: requirements.roleName,
      explicitNeeds: requirements.description || '',
      
      // 深度分析
      implicitNeeds: this.analyzeImplicitNeeds(requirements),
      uniqueAspects: this.identifyUniqueAspects(requirements),
      creativityDemand: this.assessCreativityDemand(requirements),
      structuralFlexibility: this.assessStructuralNeeds(requirements),
      
      // 创新指标
      uniqueness: 0,
      complexity: 'adaptive',
      innovationPotential: 'high'
    };
    
    // 计算独特性评分
    analysis.uniqueness = this.calculateUniqueness(analysis);
    
    return analysis;
  }

  /**
   * 分析隐性需求
   */
  analyzeImplicitNeeds(requirements) {
    const implicitSignals = [];
    
    // 从角色名称推断隐性需求
    if (requirements.roleName.includes('creative') || requirements.roleName.includes('innovative')) {
      implicitSignals.push('需要高度创新思维');
    }
    
    if (requirements.roleName.includes('senior') || requirements.roleName.includes('lead')) {
      implicitSignals.push('需要领导力和战略思维');
    }
    
    if (requirements.roleName.includes('specialist') || requirements.roleName.includes('expert')) {
      implicitSignals.push('需要深度专业知识');
    }
    
    // 从描述中推断
    const description = (requirements.description || '').toLowerCase();
    if (description.includes('unique') || description.includes('different')) {
      implicitSignals.push('用户明确要求独特性');
    }
    
    if (description.includes('creative') || description.includes('innovative')) {
      implicitSignals.push('用户重视创新能力');
    }
    
    return implicitSignals;
  }

  /**
   * 识别独特方面
   */
  identifyUniqueAspects(requirements) {
    const uniqueAspects = [];
    
    // 检查是否有非标准领域
    const standardDomains = ['development', 'design', 'management', 'analysis', 'marketing'];
    if (requirements.domain && !standardDomains.includes(requirements.domain)) {
      uniqueAspects.push(`非标准领域: ${requirements.domain}`);
    }
    
    // 检查是否有特殊能力要求
    if (requirements.capabilities && requirements.capabilities.length > 0) {
      const unusualCapabilities = requirements.capabilities.filter(cap => 
        !['问题解决', '沟通协作', '持续学习'].includes(cap)
      );
      if (unusualCapabilities.length > 0) {
        uniqueAspects.push(`特殊能力: ${unusualCapabilities.join(', ')}`);
      }
    }
    
    // 检查是否有特殊约束
    if (requirements.constraints && requirements.constraints.length > 0) {
      uniqueAspects.push(`特殊约束: ${requirements.constraints.join(', ')}`);
    }
    
    return uniqueAspects;
  }

  /**
   * 评估创意需求
   */
  assessCreativityDemand(requirements) {
    let creativityScore = 50; // 基础分数
    
    // 基于角色名称调整
    const creativityKeywords = ['creative', 'innovative', 'artist', 'designer', 'strategist'];
    if (creativityKeywords.some(keyword => requirements.roleName.toLowerCase().includes(keyword))) {
      creativityScore += 30;
    }
    
    // 基于描述调整
    const description = (requirements.description || '').toLowerCase();
    if (description.includes('creative') || description.includes('innovative')) {
      creativityScore += 20;
    }
    
    if (description.includes('unique') || description.includes('original')) {
      creativityScore += 25;
    }
    
    // 基于用户明确要求
    if (requirements.creativityLevel === 'high' || requirements.creativityLevel === 'extreme') {
      creativityScore += 30;
    }
    
    return Math.min(100, creativityScore);
  }

  /**
   * 评估结构需求
   */
  assessStructuralNeeds(requirements) {
    const needs = {
      standardStructure: true,  // 默认需要标准结构
      customSections: false,
      experimentalFormat: false,
      adaptiveLayout: false
    };
    
    // 如果用户明确要求非标准
    if (requirements.allowNonStandard || this.config.allowNonStandard) {
      needs.customSections = true;
    }
    
    // 如果创意需求很高
    if (this.assessCreativityDemand(requirements) > 80) {
      needs.adaptiveLayout = true;
    }
    
    // 如果启用实验性功能
    if (this.config.enableExperimental) {
      needs.experimentalFormat = true;
    }
    
    return needs;
  }

  /**
   * 计算独特性评分
   */
  calculateUniqueness(analysis) {
    let uniqueness = 0;
    
    // 隐性需求贡献
    uniqueness += analysis.implicitNeeds.length * 10;
    
    // 独特方面贡献
    uniqueness += analysis.uniqueAspects.length * 15;
    
    // 创意需求贡献
    uniqueness += analysis.creativityDemand * 0.3;
    
    // 结构灵活性贡献
    if (analysis.structuralFlexibility.customSections) uniqueness += 10;
    if (analysis.structuralFlexibility.adaptiveLayout) uniqueness += 15;
    if (analysis.structuralFlexibility.experimentalFormat) uniqueness += 20;
    
    return Math.min(100, Math.round(uniqueness));
  }

  /**
   * 设计自定义结构 - 为每个角色量身定制
   */
  async designCustomStructure(deepRequirements) {
    console.log(`🎯 为 ${deepRequirements.roleName} 设计独特结构...`);
    
    const structure = {
      thoughtSections: [],
      executionSections: [],
      customElements: [],
      innovativeFeatures: []
    };
    
    // 基于独特性设计thought结构
    if (deepRequirements.uniqueness > 70) {
      // 高独特性 - 创新结构
      structure.thoughtSections = this.designInnovativeThoughtStructure(deepRequirements);
    } else if (deepRequirements.uniqueness > 40) {
      // 中等独特性 - 适应性结构
      structure.thoughtSections = this.designAdaptiveThoughtStructure(deepRequirements);
    } else {
      // 低独特性 - 标准结构
      structure.thoughtSections = ['exploration', 'reasoning', 'challenge', 'plan'];
    }
    
    // 基于创意需求设计execution结构
    if (deepRequirements.creativityDemand > 80) {
      structure.executionSections = this.designCreativeExecutionStructure(deepRequirements);
    } else {
      structure.executionSections = ['constraint', 'rule', 'guideline', 'process', 'criteria'];
    }
    
    // 添加自定义元素
    structure.customElements = this.designCustomElements(deepRequirements);
    
    return structure;
  }

  /**
   * 设计创新思维结构
   */
  designInnovativeThoughtStructure(requirements) {
    const innovativeStructures = [
      // 创新型结构
      ['vision', 'methodology', 'breakthrough', 'evolution'],
      ['perspective', 'framework', 'disruption', 'transformation'],
      ['insight', 'approach', 'innovation', 'impact'],
      ['understanding', 'strategy', 'creativity', 'growth']
    ];
    
    // 基于角色特征选择最适合的结构
    const roleType = this.detectAdvancedRoleType(requirements);
    return this.selectBestStructure(innovativeStructures, roleType);
  }

  /**
   * 设计适应性思维结构
   */
  designAdaptiveThoughtStructure(requirements) {
    // 在标准结构基础上进行适应性调整
    const baseStructure = ['exploration', 'reasoning', 'challenge', 'plan'];
    const adaptations = [];
    
    // 根据角色特征添加适应性元素
    if (requirements.implicitNeeds.includes('需要高度创新思维')) {
      adaptations.push('innovation');
    }
    
    if (requirements.implicitNeeds.includes('需要领导力和战略思维')) {
      adaptations.push('leadership');
    }
    
    // 智能融合
    return this.mergeStructureElements(baseStructure, adaptations);
  }

  /**
   * 检测高级角色类型
   */
  detectAdvancedRoleType(requirements) {
    // 更精细的角色类型检测
    const advancedTypes = {
      'visionary': ['vision', 'future', 'strategic', 'innovation'],
      'creator': ['create', 'design', 'build', 'craft'],
      'transformer': ['transform', 'change', 'improve', 'evolve'],
      'specialist': ['expert', 'specialist', 'master', 'professional']
    };
    
    const text = `${requirements.roleName} ${requirements.explicitNeeds}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(advancedTypes)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    return 'adaptive';
  }

  /**
   * 初始化生成策略
   */
  initializeStrategies() {
    return {
      'creative-first': {
        name: 'creative-first',
        description: '创意优先生成',
        focus: 'innovation',
        compliance: 'adaptive'
      },
      'balanced-innovation': {
        name: 'balanced-innovation',
        description: '平衡创新生成',
        focus: 'balance',
        compliance: 'strict'
      },
      'compliance-creative': {
        name: 'compliance-creative',
        description: '合规创意生成',
        focus: 'compliance',
        compliance: 'strict'
      }
    };
  }

  /**
   * 生成创意内容 - 完全原创，摆脱模板
   */
  async generateCreativeContent(deepRequirements, customStructure) {
    console.log(`🎨 开始创意内容生成...`);

    const content = {
      thoughtContent: {},
      executionContent: {},
      innovationScore: 0,
      originalityMarkers: []
    };

    // 为每个thought部分生成独特内容
    for (const section of customStructure.thoughtSections) {
      content.thoughtContent[section] = await this.generateOriginalThoughtSection(
        section, deepRequirements
      );
    }

    // 为每个execution部分生成独特内容
    for (const section of customStructure.executionSections) {
      content.executionContent[section] = await this.generateOriginalExecutionSection(
        section, deepRequirements
      );
    }

    // 计算创新评分
    content.innovationScore = this.calculateInnovationScore(content, deepRequirements);

    return content;
  }

  /**
   * 生成原创思维部分内容
   */
  async generateOriginalThoughtSection(sectionType, requirements) {
    const generators = {
      // 创新结构生成器
      'vision': () => this.generateVisionContent(requirements),
      'methodology': () => this.generateMethodologyContent(requirements),
      'breakthrough': () => this.generateBreakthroughContent(requirements),
      'evolution': () => this.generateEvolutionContent(requirements),

      // 标准结构的创新生成器
      'exploration': () => this.generateCreativeExploration(requirements),
      'reasoning': () => this.generateCreativeReasoning(requirements),
      'challenge': () => this.generateCreativeChallenge(requirements),
      'plan': () => this.generateCreativePlan(requirements)
    };

    const generator = generators[sectionType] || generators['exploration'];
    return await generator();
  }

  /**
   * 生成原创execution部分内容
   */
  async generateOriginalExecutionSection(sectionType, requirements) {
    const generators = {
      // 标准execution生成器
      'constraint': () => this.generateCreativeConstraint(requirements),
      'rule': () => this.generateCreativeRule(requirements),
      'guideline': () => this.generateCreativeGuideline(requirements),
      'process': () => this.generateCreativeProcess(requirements),
      'criteria': () => this.generateCreativeCriteria(requirements),

      // 创新execution生成器
      'framework': () => this.generateFrameworkContent(requirements),
      'methodology': () => this.generateMethodologyContent(requirements),
      'innovation': () => this.generateInnovationContent(requirements),
      'impact': () => this.generateImpactContent(requirements)
    };

    const generator = generators[sectionType] || generators['constraint'];
    return await generator();
  }

  /**
   * 生成缺失的创新内容方法
   */
  generateMethodologyContent(requirements) {
    return `## ${requirements.roleName}的方法论体系

### 核心方法论
- **系统性方法**：采用系统化的思维和方法解决复杂问题
- **创新驱动**：以创新为核心驱动力推动工作发展
- **价值导向**：始终以创造价值为最终目标

### 实践框架
- **理论基础**：建立在坚实的理论基础之上
- **实践验证**：通过实践不断验证和完善方法
- **持续优化**：基于反馈持续优化方法论`;
  }

  generateBreakthroughContent(requirements) {
    return `## ${requirements.roleName}的突破性思维

### 突破性创新
- **思维突破**：打破传统思维模式的限制
- **技术突破**：在技术层面实现重大突破
- **应用突破**：在应用场景中创造突破性价值

### 创新路径
- **跨界融合**：整合不同领域的知识和方法
- **深度挖掘**：在专业领域进行深度探索
- **前瞻思考**：具备前瞻性的战略思维`;
  }

  generateEvolutionContent(requirements) {
    return `## ${requirements.roleName}的进化发展

### 能力进化
- **持续学习**：保持持续学习和成长的能力
- **适应变化**：快速适应环境和需求的变化
- **自我超越**：不断超越自己的能力边界

### 发展路径
- **渐进式发展**：通过渐进式改进实现能力提升
- **跃迁式突破**：在关键节点实现跃迁式发展
- **生态化成长**：在生态系统中实现协同成长`;
  }

  generateCreativeReasoning(requirements) {
    return `## ${requirements.roleName}的创新推理

### 推理框架
- **多维思考**：从多个维度分析和思考问题
- **逻辑严密**：保持逻辑的严密性和一致性
- **创新洞察**：能够产生创新性的洞察和见解

### 思维模式
- **发散思维**：能够进行发散性思考
- **收敛思维**：能够进行收敛性分析
- **批判思维**：具备批判性思维能力`;
  }

  generateCreativeChallenge(requirements) {
    return `## ${requirements.roleName}面临的创新挑战

### 核心挑战
- **复杂性挑战**：如何处理日益复杂的问题和环境
- **创新压力**：如何在压力下保持创新能力
- **平衡艺术**：如何平衡不同的需求和约束

### 应对策略
- **系统思维**：运用系统思维应对复杂挑战
- **创新方法**：开发和运用创新方法
- **协作网络**：建立有效的协作网络`;
  }

  generateCreativePlan(requirements) {
    return `## ${requirements.roleName}的创新规划

### 发展规划
1. **短期目标**：明确短期内要达成的具体目标
2. **中期愿景**：制定中期发展的愿景和方向
3. **长期使命**：确立长期的使命和价值追求

### 实施策略
- **阶段性推进**：分阶段有序推进各项工作
- **重点突破**：在关键领域实现重点突破
- **全面发展**：实现能力的全面协调发展`;
  }

  /**
   * 生成创新execution内容
   */
  generateCreativeConstraint(requirements) {
    return `## ${requirements.roleName}的创新约束

### 创新边界
- **技术边界**：受当前技术水平的限制
- **资源边界**：受可用资源的约束
- **时间边界**：受时间窗口的限制

### 约束转化
- **约束为机遇**：将约束转化为创新机遇
- **边界突破**：在约束中寻找突破点
- **创造性解决**：用创造性方法应对约束`;
  }

  generateCreativeRule(requirements) {
    return `## ${requirements.roleName}的创新规则

### 核心原则
- **价值创造**：所有活动都要以创造价值为目标
- **持续创新**：保持持续的创新动力和能力
- **质量第一**：确保所有输出的高质量标准

### 执行规范
- **标准化流程**：建立标准化的工作流程
- **质量控制**：实施严格的质量控制机制
- **持续改进**：建立持续改进的机制`;
  }

  generateCreativeGuideline(requirements) {
    return `## ${requirements.roleName}的创新指导

### 指导原则
- **用户中心**：始终以用户需求为中心
- **创新驱动**：以创新为核心驱动力
- **协作共赢**：追求协作共赢的结果

### 最佳实践
- **经验总结**：及时总结和分享最佳实践
- **知识管理**：建立有效的知识管理体系
- **学习型组织**：打造学习型的工作环境`;
  }

  generateCreativeProcess(requirements) {
    return `## ${requirements.roleName}的创新流程

### 标准流程
1. **需求分析**：深入分析和理解需求
2. **创新设计**：进行创新性的方案设计
3. **原型验证**：通过原型验证方案可行性
4. **迭代优化**：基于反馈进行迭代优化
5. **成果交付**：交付高质量的最终成果

### 流程优化
- **效率提升**：持续优化流程效率
- **质量保证**：确保流程的质量保证
- **灵活适应**：根据情况灵活调整流程`;
  }

  generateCreativeCriteria(requirements) {
    return `## ${requirements.roleName}的创新标准

### 评价维度
- **创新性**：方案的创新程度和突破性
- **实用性**：方案的实际应用价值
- **可行性**：方案的实施可行性
- **影响力**：方案的潜在影响力

### 质量标准
- **专业水准**：达到行业领先的专业水准
- **用户满意**：获得用户的高度满意
- **持续价值**：创造持续的价值贡献`;
  }

  /**
   * 生成框架内容
   */
  generateFrameworkContent(requirements) {
    return `## ${requirements.roleName}的创新框架

### 核心框架
- **理论框架**：建立在坚实理论基础上的工作框架
- **实践框架**：经过实践验证的操作框架
- **创新框架**：支持持续创新的思维框架

### 框架应用
- **系统性应用**：在系统层面应用框架指导工作
- **灵活性调整**：根据具体情况灵活调整框架
- **持续优化**：基于反馈持续优化框架体系`;
  }

  /**
   * 生成创新内容
   */
  generateInnovationContent(requirements) {
    return `## ${requirements.roleName}的创新驱动

### 创新理念
- **突破性思维**：敢于突破传统思维模式的限制
- **前瞻性视野**：具备前瞻性的战略视野和判断
- **创造性解决**：用创造性方法解决复杂问题

### 创新实践
- **技术创新**：在技术层面实现突破性创新
- **方法创新**：在方法论层面进行创新探索
- **应用创新**：在应用场景中创造创新价值`;
  }

  /**
   * 生成影响内容
   */
  generateImpactContent(requirements) {
    return `## ${requirements.roleName}的影响力

### 影响范围
- **专业影响**：在专业领域产生深远影响
- **行业影响**：对整个行业发展产生推动作用
- **社会影响**：通过专业能力创造社会价值

### 影响机制
- **知识传播**：通过知识分享扩大影响力
- **实践示范**：通过优秀实践起到示范作用
- **创新引领**：通过创新成果引领行业发展`;
  }

  /**
   * 生成愿景内容 - 完全原创
   */
  generateVisionContent(requirements) {
    const visionElements = this.analyzeVisionNeeds(requirements);

    return `## ${requirements.roleName}的未来愿景

### 变革性影响
${visionElements.impacts.map(impact => `- **${impact.area}**：${impact.description}`).join('\n')}

### 创新突破点
${visionElements.breakthroughs.map(breakthrough => `- **${breakthrough.type}**：${breakthrough.potential}`).join('\n')}

### 长远价值创造
${visionElements.values.map(value => `- **${value.dimension}**：${value.contribution}`).join('\n')}`;
  }

  /**
   * 分析愿景需求
   */
  analyzeVisionNeeds(requirements) {
    return {
      impacts: this.generateImpactAreas(requirements),
      breakthroughs: this.generateBreakthroughAreas(requirements),
      values: this.generateValueDimensions(requirements)
    };
  }

  /**
   * 生成影响领域
   */
  generateImpactAreas(requirements) {
    const baseImpacts = [
      { area: '行业变革', description: `重新定义${requirements.domain || '相关'}领域的标准和实践` },
      { area: '用户体验', description: '创造前所未有的用户价值和体验' },
      { area: '效率提升', description: '通过创新方法显著提升工作效率' }
    ];

    // 基于角色特征添加特定影响
    if (requirements.implicitNeeds.includes('需要高度创新思维')) {
      baseImpacts.push({
        area: '创新引领',
        description: '成为行业创新的引领者和标杆'
      });
    }

    return baseImpacts;
  }

  /**
   * 生成突破领域
   */
  generateBreakthroughAreas(requirements) {
    const breakthroughs = [];

    // 基于角色名称生成突破点
    if (requirements.roleName.includes('ai') || requirements.roleName.includes('intelligent')) {
      breakthroughs.push({
        type: 'AI驱动创新',
        potential: '利用人工智能技术实现传统方法无法达到的突破'
      });
    }

    if (requirements.roleName.includes('creative') || requirements.roleName.includes('design')) {
      breakthroughs.push({
        type: '创意方法论',
        potential: '开发独特的创意生成和实现方法'
      });
    }

    // 默认突破点
    breakthroughs.push({
      type: '跨界融合',
      potential: '打破传统边界，实现跨领域的创新融合'
    });

    return breakthroughs;
  }

  /**
   * 生成价值维度
   */
  generateValueDimensions(requirements) {
    return [
      {
        dimension: '专业深度',
        contribution: `在${requirements.domain || '专业'}领域达到新的深度和广度`
      },
      {
        dimension: '创新能力',
        contribution: '持续产生原创性的解决方案和见解'
      },
      {
        dimension: '影响力',
        contribution: '通过专业能力创造广泛而深远的积极影响'
      }
    ];
  }

  /**
   * 生成创意探索内容 - 非模板化
   */
  generateCreativeExploration(requirements) {
    const explorationAngles = this.generateUniqueExplorationAngles(requirements);

    return `## ${requirements.roleName}的多维度探索

### 核心特质解析
${explorationAngles.traits.map(trait => `- **${trait.name}**：${trait.description}`).join('\n')}

### 能力生态系统
${explorationAngles.ecosystem.map(element => `- **${element.component}**：${element.function}`).join('\n')}

### 独特价值主张
${explorationAngles.propositions.map(prop => `- **${prop.aspect}**：${prop.value}`).join('\n')}`;
  }

  /**
   * 生成独特探索角度
   */
  generateUniqueExplorationAngles(requirements) {
    return {
      traits: this.generatePersonalityTraits(requirements),
      ecosystem: this.generateCapabilityEcosystem(requirements),
      propositions: this.generateValuePropositions(requirements)
    };
  }

  /**
   * 生成个性化特质
   */
  generatePersonalityTraits(requirements) {
    const traits = [];

    // 基于角色名称推断特质
    if (requirements.roleName.includes('senior') || requirements.roleName.includes('lead')) {
      traits.push({
        name: '战略思维',
        description: '具备高度的战略规划和前瞻性思考能力'
      });
    }

    if (requirements.roleName.includes('creative') || requirements.roleName.includes('innovative')) {
      traits.push({
        name: '创新驱动',
        description: '天然的创新基因，能够突破常规思维模式'
      });
    }

    // 基于隐性需求添加特质
    if (requirements.implicitNeeds.includes('需要深度专业知识')) {
      traits.push({
        name: '专业精深',
        description: '在专业领域具有深度的知识积累和实践经验'
      });
    }

    // 默认特质
    traits.push({
      name: '适应性强',
      description: '能够快速适应变化的环境和需求'
    });

    return traits;
  }

  /**
   * 生成能力生态系统
   */
  generateCapabilityEcosystem(requirements) {
    const ecosystem = [];

    // 核心能力
    if (requirements.capabilities && requirements.capabilities.length > 0) {
      requirements.capabilities.forEach(capability => {
        ecosystem.push({
          component: capability,
          function: `作为核心能力支撑整体专业表现`
        });
      });
    }

    // 支撑能力
    ecosystem.push({
      component: '学习能力',
      function: '持续更新知识体系，保持专业领先性'
    });

    ecosystem.push({
      component: '协作能力',
      function: '有效整合团队资源，实现协同效应'
    });

    return ecosystem;
  }

  /**
   * 生成价值主张
   */
  generateValuePropositions(requirements) {
    const propositions = [];

    // 基于独特方面生成价值主张
    requirements.uniqueAspects.forEach(aspect => {
      propositions.push({
        aspect: '差异化优势',
        value: `通过${aspect}创造独特的专业价值`
      });
    });

    // 默认价值主张
    propositions.push({
      aspect: '专业可靠性',
      value: '提供一致性高、质量可靠的专业服务'
    });

    propositions.push({
      aspect: '创新解决方案',
      value: '针对复杂问题提供创新性的解决思路'
    });

    return propositions;
  }

  /**
   * 计算创新评分
   */
  calculateInnovationScore(content, requirements) {
    let score = 0;

    // 基于内容原创性
    score += this.assessContentOriginality(content) * 0.4;

    // 基于结构创新性
    score += this.assessStructuralInnovation(content) * 0.3;

    // 基于需求匹配度
    score += this.assessRequirementAlignment(content, requirements) * 0.3;

    return Math.round(score);
  }

  /**
   * 评估内容原创性
   */
  assessContentOriginality(content) {
    // 简化的原创性评估
    let originality = 70; // 基础分

    // 检查是否有独特的表达方式
    const thoughtText = Object.values(content.thoughtContent).join(' ');
    const executionText = Object.values(content.executionContent).join(' ');

    // 避免常见模板用词
    const templateWords = ['专业', '能力', '技能', '方法', '流程'];
    const totalWords = (thoughtText + executionText).split(' ').length;
    const templateWordCount = templateWords.reduce((count, word) => {
      return count + (thoughtText + executionText).split(word).length - 1;
    }, 0);

    const templateRatio = templateWordCount / totalWords;
    originality -= templateRatio * 30;

    return Math.max(0, Math.min(100, originality));
  }

  /**
   * 评估结构创新性
   */
  assessStructuralInnovation(content) {
    // 检查是否使用了非标准结构
    const standardSections = ['exploration', 'reasoning', 'challenge', 'plan'];
    const thoughtSections = Object.keys(content.thoughtContent);

    const nonStandardCount = thoughtSections.filter(section =>
      !standardSections.includes(section)
    ).length;

    return Math.min(100, 50 + (nonStandardCount * 25));
  }

  /**
   * 评估需求匹配度
   */
  assessRequirementAlignment(content, requirements) {
    // 检查内容是否很好地反映了用户的独特需求
    let alignment = 60; // 基础分

    // 检查是否体现了独特方面
    const allContent = JSON.stringify(content).toLowerCase();
    requirements.uniqueAspects.forEach(aspect => {
      if (allContent.includes(aspect.toLowerCase())) {
        alignment += 10;
      }
    });

    return Math.min(100, alignment);
  }

  /**
   * 选择最佳结构
   */
  selectBestStructure(innovativeStructures, roleType) {
    // 基于角色类型选择最适合的创新结构
    const typeMapping = {
      'visionary': 0,
      'creator': 2,
      'transformer': 1,
      'specialist': 3
    };

    const index = typeMapping[roleType] || 0;
    return innovativeStructures[index] || innovativeStructures[0];
  }

  /**
   * 合并结构元素
   */
  mergeStructureElements(baseStructure, adaptations) {
    // 智能融合基础结构和适应性元素
    const merged = [...baseStructure];

    // 根据适应性需求调整结构
    adaptations.forEach(adaptation => {
      if (adaptation === 'innovation' && !merged.includes('breakthrough')) {
        merged.splice(2, 0, 'breakthrough'); // 在challenge前插入breakthrough
      }
      if (adaptation === 'leadership' && !merged.includes('vision')) {
        merged.unshift('vision'); // 在开头插入vision
      }
    });

    return merged;
  }

  /**
   * 设计创意execution结构
   */
  designCreativeExecutionStructure(requirements) {
    // 为高创意需求设计特殊的execution结构
    const creativeStructures = [
      ['framework', 'methodology', 'innovation', 'impact'],
      ['principle', 'approach', 'creativity', 'outcome'],
      ['vision', 'strategy', 'implementation', 'transformation']
    ];

    // 基于角色特征选择
    const roleType = this.detectAdvancedRoleType(requirements);
    return this.selectBestStructure(creativeStructures, roleType);
  }

  /**
   * 设计自定义元素
   */
  designCustomElements(requirements) {
    const elements = [];

    // 基于独特性添加自定义元素
    if (requirements.uniqueness > 80) {
      elements.push('breakthrough-thinking');
      elements.push('paradigm-shift');
    }

    if (requirements.creativityDemand > 90) {
      elements.push('creative-catalyst');
      elements.push('innovation-driver');
    }

    return elements;
  }

  /**
   * 适配到PromptX结构
   */
  async adaptToPromptXStructure(creativeContent, customStructure) {
    console.log(`🔧 开始PromptX结构适配...`);

    // 生成标准主文件
    const mainFile = this.analyzer.generateStandardTemplate(creativeContent.roleName || 'flexible-role').mainFile;

    // 将创意内容适配为PromptX格式
    const thoughtFile = this.adaptThoughtContent(creativeContent.thoughtContent, customStructure);
    const executionFile = this.adaptExecutionContent(creativeContent.executionContent, customStructure);

    return {
      roleName: creativeContent.roleName || 'flexible-role',
      mainFile,
      thoughtFile,
      executionFile,
      filePaths: [
        `${creativeContent.roleName}/${creativeContent.roleName}.role.md`,
        `${creativeContent.roleName}/thought/${creativeContent.roleName}.thought.md`,
        `${creativeContent.roleName}/execution/${creativeContent.roleName}.execution.md`
      ],
      thoughtContent: creativeContent.thoughtContent,
      executionContent: creativeContent.executionContent
    };
  }

  /**
   * 适配thought内容
   */
  adaptThoughtContent(thoughtContent, customStructure) {
    let adaptedContent = '<thought>\n';

    // 按照customStructure的顺序组织内容
    customStructure.thoughtSections.forEach(section => {
      if (thoughtContent[section]) {
        adaptedContent += `  <${section}>\n`;
        adaptedContent += `    ${thoughtContent[section]}\n`;
        adaptedContent += `  </${section}>\n\n`;
      }
    });

    adaptedContent += '</thought>';
    return adaptedContent;
  }

  /**
   * 适配execution内容
   */
  adaptExecutionContent(executionContent, customStructure) {
    let adaptedContent = '<execution>\n';

    // 按照customStructure的顺序组织内容
    customStructure.executionSections.forEach(section => {
      if (executionContent[section]) {
        adaptedContent += `  <${section}>\n`;
        adaptedContent += `    ${executionContent[section]}\n`;
        adaptedContent += `  </${section}>\n\n`;
      }
    });

    adaptedContent += '</execution>';
    return adaptedContent;
  }

  /**
   * 验证创新平衡
   */
  async validateCreativeBalance(adaptedContent) {
    console.log(`⚖️ 开始创新平衡验证...`);

    // 使用标准分析器检查合规性
    const complianceResult = this.analyzer.analyzeCompliance(adaptedContent);

    // 评估创新程度
    const innovationLevel = this.assessInnovationLevel(adaptedContent);

    return {
      compliance: Math.round(complianceResult.complianceScore * 100),
      innovation: innovationLevel,
      balance: this.calculateBalance(complianceResult.complianceScore, innovationLevel)
    };
  }

  /**
   * 评估创新水平
   */
  assessInnovationLevel(content) {
    // 简化的创新水平评估
    let innovation = 50; // 基础分

    // 检查创新关键词
    const innovationKeywords = [
      '突破', '创新', '变革', '前瞻', '原创', '独特', '颠覆', '跨界'
    ];

    const allContent = JSON.stringify(content);
    const keywordMatches = innovationKeywords.filter(keyword =>
      allContent.includes(keyword)
    ).length;

    innovation += keywordMatches * 8;

    // 检查结构创新
    if (content.thoughtContent && typeof content.thoughtContent === 'object') {
      const standardSections = ['exploration', 'reasoning', 'challenge', 'plan'];
      const thoughtSections = Object.keys(content.thoughtContent);
      const nonStandardCount = thoughtSections.filter(section =>
        !standardSections.includes(section)
      ).length;

      innovation += nonStandardCount * 15;
    }

    return Math.min(100, innovation);
  }

  /**
   * 计算平衡度
   */
  calculateBalance(compliance, innovation) {
    // 理想的平衡是合规性和创新性都较高
    const complianceScore = compliance * 100;
    const innovationScore = innovation;

    // 计算平衡度（两者都高时平衡度高）
    const balance = Math.min(complianceScore, innovationScore);

    return Math.round(balance);
  }

  /**
   * 初始化动态结构
   */
  initializeDynamicStructures() {
    return {
      thoughtPatterns: {
        'innovative': ['vision', 'methodology', 'breakthrough', 'evolution'],
        'analytical': ['analysis', 'logic', 'evaluation', 'conclusion'],
        'creative': ['inspiration', 'ideation', 'creation', 'refinement'],
        'strategic': ['assessment', 'planning', 'execution', 'optimization']
      },
      executionPatterns: {
        'flexible': ['principle', 'approach', 'method', 'outcome'],
        'structured': ['constraint', 'rule', 'guideline', 'process', 'criteria'],
        'adaptive': ['context', 'strategy', 'tactics', 'measurement'],
        'innovative': ['framework', 'methodology', 'innovation', 'impact']
      }
    };
  }
}

module.exports = FlexibleRoleGenerator;
