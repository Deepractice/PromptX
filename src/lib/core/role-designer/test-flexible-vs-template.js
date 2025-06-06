/**
 * 灵活生成 vs 模板生成对比测试
 * 展示两种生成方式的差异和优势
 * 
 * @author PromptX全栈开发者
 * @version 2.1.0
 */

const IntelligentRoleGenerator = require('./IntelligentRoleGenerator');
const FlexibleRoleGenerator = require('./FlexibleRoleGenerator');

class FlexibleVsTemplateTest {
  constructor() {
    this.templateGenerator = new IntelligentRoleGenerator({
      creativityLevel: 'balanced'
    });
    
    this.flexibleGenerator = new FlexibleRoleGenerator({
      creativityLevel: 'high',
      allowNonStandard: true,
      enableExperimental: true
    });
  }

  /**
   * 运行对比测试
   */
  async runComparisonTest() {
    console.log('🔬 开始灵活生成 vs 模板生成对比测试...\n');

    const testCases = [
      {
        name: '创新AI研究员',
        requirements: {
          roleName: 'innovative-ai-researcher',
          description: '我需要一个真正创新的AI研究员角色，不要千篇一律的模板',
          domain: 'artificial-intelligence',
          complexity: 'high',
          capabilities: ['前沿研究', '理论创新', '跨界思维', '突破性发现'],
          creativityLevel: 'extreme',
          allowNonStandard: true
        }
      },
      {
        name: '数字艺术创作者',
        requirements: {
          roleName: 'digital-art-creator',
          description: '希望生成一个独特的数字艺术创作者，要有艺术家的灵魂',
          domain: 'digital-art',
          complexity: 'medium',
          capabilities: ['视觉创新', '技术融合', '情感表达', '美学理论'],
          creativityLevel: 'high'
        }
      },
      {
        name: '传统项目经理',
        requirements: {
          roleName: 'project-manager',
          description: '标准的项目管理角色',
          domain: 'project-management',
          complexity: 'medium',
          capabilities: ['项目规划', '团队协调', '风险控制', '进度管理']
        }
      }
    ];

    for (const testCase of testCases) {
      await this.compareGenerationMethods(testCase);
      console.log('\n' + '='.repeat(80) + '\n');
    }

    console.log('🎯 对比测试完成！');
  }

  /**
   * 对比两种生成方法
   */
  async compareGenerationMethods(testCase) {
    console.log(`📋 测试案例: ${testCase.name}`);
    console.log(`📝 需求描述: ${testCase.requirements.description}`);
    console.log(`🎨 创意需求: ${testCase.requirements.creativityLevel || 'medium'}`);
    console.log('');

    // 模板生成
    console.log('🏭 模板生成结果:');
    const templateResult = await this.templateGenerator.generateRole(testCase.requirements);
    this.analyzeTemplateResult(templateResult);

    console.log('');

    // 灵活生成
    console.log('🎨 灵活生成结果:');
    const flexibleResult = await this.flexibleGenerator.generateFlexibleRole(testCase.requirements);
    this.analyzeFlexibleResult(flexibleResult);

    console.log('');

    // 对比分析
    this.compareResults(templateResult, flexibleResult, testCase);
  }

  /**
   * 分析模板生成结果
   */
  analyzeTemplateResult(result) {
    if (result.success) {
      console.log(`   ✅ 生成成功`);
      console.log(`   📊 质量评分: ${result.quality.score}%`);
      console.log(`   ⚡ 处理时间: ${result.metadata.processingTime}ms`);
      console.log(`   🎯 生成策略: ${result.metadata.strategy}`);
      
      // 分析内容特征
      const analysis = this.analyzeContentCharacteristics(result.rolePackage);
      console.log(`   📝 内容特征:`);
      console.log(`      - 模板化程度: ${analysis.templateLevel}%`);
      console.log(`      - 结构标准化: ${analysis.structureStandardization}%`);
      console.log(`      - 内容原创性: ${analysis.originality}%`);
    } else {
      console.log(`   ❌ 生成失败: ${result.error}`);
    }
  }

  /**
   * 分析灵活生成结果
   */
  analyzeFlexibleResult(result) {
    if (result.success) {
      console.log(`   ✅ 生成成功`);
      console.log(`   🧠 独特性评分: ${result.metadata.uniqueness}%`);
      console.log(`   ✨ 创新评分: ${result.metadata.innovation}%`);
      console.log(`   📋 合规性评分: ${result.metadata.compliance}%`);
      console.log(`   🎨 生成类型: ${result.metadata.generationType}`);
      
      // 分析结构创新
      console.log(`   🏗️ 结构创新:`);
      console.log(`      - Thought维度: ${result.customStructure.thoughtSections.join(', ')}`);
      console.log(`      - Execution维度: ${result.customStructure.executionSections.join(', ')}`);
      
      // 分析内容创新
      const innovation = this.analyzeContentInnovation(result.rolePackage);
      console.log(`   💡 内容创新:`);
      console.log(`      - 表达独特性: ${innovation.expressionUniqueness}%`);
      console.log(`      - 概念原创性: ${innovation.conceptOriginality}%`);
      console.log(`      - 结构突破性: ${innovation.structuralBreakthrough}%`);
    } else {
      console.log(`   ❌ 生成失败: ${result.error}`);
    }
  }

  /**
   * 分析内容特征
   */
  analyzeContentCharacteristics(rolePackage) {
    const thoughtContent = rolePackage.thoughtFile || '';
    const executionContent = rolePackage.executionFile || '';
    
    // 模板化程度分析
    const templatePhrases = [
      '核心能力维度', '专业技能', '标准流程', '质量标准',
      '专业能力', '工作流程', '评价标准', '执行步骤'
    ];
    
    const allContent = thoughtContent + executionContent;
    const templateMatches = templatePhrases.filter(phrase => 
      allContent.includes(phrase)
    ).length;
    
    const templateLevel = Math.round((templateMatches / templatePhrases.length) * 100);
    
    // 结构标准化程度
    const standardSections = ['exploration', 'reasoning', 'challenge', 'plan'];
    const hasStandardStructure = standardSections.every(section => 
      thoughtContent.includes(section)
    );
    
    const structureStandardization = hasStandardStructure ? 100 : 50;
    
    // 内容原创性
    const uniquePhrases = [
      '变革性影响', '创新突破点', '独特价值主张', '多维度探索'
    ];
    
    const uniqueMatches = uniquePhrases.filter(phrase => 
      allContent.includes(phrase)
    ).length;
    
    const originality = Math.round((uniqueMatches / uniquePhrases.length) * 100);
    
    return {
      templateLevel,
      structureStandardization,
      originality: Math.max(30, originality) // 最低30%原创性
    };
  }

  /**
   * 分析内容创新
   */
  analyzeContentInnovation(rolePackage) {
    const thoughtContent = rolePackage.thoughtContent || rolePackage.thoughtFile || '';
    const executionContent = rolePackage.executionContent || rolePackage.executionFile || '';
    
    // 表达独特性
    const uniqueExpressions = [
      '未来愿景', '变革性影响', '创新突破点', '多维度探索',
      '核心特质解析', '能力生态系统', '独特价值主张'
    ];
    
    const allContent = JSON.stringify(thoughtContent) + JSON.stringify(executionContent);
    const expressionMatches = uniqueExpressions.filter(expr => 
      allContent.includes(expr)
    ).length;
    
    const expressionUniqueness = Math.round((expressionMatches / uniqueExpressions.length) * 100);
    
    // 概念原创性
    const originalConcepts = [
      'AI驱动创新', '跨界融合', '创意方法论', '专业精深',
      '战略思维', '创新驱动', '适应性强'
    ];
    
    const conceptMatches = originalConcepts.filter(concept => 
      allContent.includes(concept)
    ).length;
    
    const conceptOriginality = Math.round((conceptMatches / originalConcepts.length) * 100);
    
    // 结构突破性
    const standardStructure = ['exploration', 'reasoning', 'challenge', 'plan'];
    const thoughtSections = typeof thoughtContent === 'object' ? 
      Object.keys(thoughtContent) : 
      this.extractSections(thoughtContent);
    
    const nonStandardSections = thoughtSections.filter(section => 
      !standardStructure.includes(section)
    ).length;
    
    const structuralBreakthrough = Math.min(100, nonStandardSections * 25);
    
    return {
      expressionUniqueness,
      conceptOriginality,
      structuralBreakthrough
    };
  }

  /**
   * 提取章节
   */
  extractSections(content) {
    const sections = [];
    const matches = content.match(/<(\w+)>/g);
    if (matches) {
      matches.forEach(match => {
        const section = match.replace(/<|>/g, '');
        if (!sections.includes(section) && section !== 'thought' && section !== 'execution') {
          sections.push(section);
        }
      });
    }
    return sections;
  }

  /**
   * 对比结果
   */
  compareResults(templateResult, flexibleResult, testCase) {
    console.log('📊 对比分析:');
    
    if (templateResult.success && flexibleResult.success) {
      // 速度对比
      const templateTime = templateResult.metadata.processingTime;
      const flexibleTime = 'N/A'; // 灵活生成暂时没有时间统计
      console.log(`   ⚡ 生成速度: 模板生成 ${templateTime}ms vs 灵活生成 ${flexibleTime}`);
      
      // 创新性对比
      const templateInnovation = this.analyzeContentInnovation(templateResult.rolePackage);
      const flexibleInnovation = flexibleResult.metadata.innovation || 0;
      
      console.log(`   💡 创新性对比:`);
      console.log(`      - 模板生成创新度: ${Math.round((templateInnovation.expressionUniqueness + templateInnovation.conceptOriginality + templateInnovation.structuralBreakthrough) / 3)}%`);
      console.log(`      - 灵活生成创新度: ${flexibleInnovation}%`);
      
      // 适用性分析
      console.log(`   🎯 适用性分析:`);
      if (testCase.requirements.creativityLevel === 'extreme' || testCase.requirements.creativityLevel === 'high') {
        console.log(`      - 高创意需求: 灵活生成更适合 ✨`);
      } else {
        console.log(`      - 标准需求: 模板生成更高效 ⚡`);
      }
      
      // 建议
      console.log(`   💡 建议:`);
      if (testCase.requirements.allowNonStandard) {
        console.log(`      - 用户明确要求非标准 → 推荐灵活生成`);
      } else if (testCase.requirements.creativityLevel === 'low') {
        console.log(`      - 标准化需求 → 推荐模板生成`);
      } else {
        console.log(`      - 平衡需求 → 两种方式都可考虑`);
      }
    }
  }
}

// 如果直接运行此文件，执行对比测试
if (require.main === module) {
  const test = new FlexibleVsTemplateTest();
  test.runComparisonTest().then(() => {
    console.log('\n🎊 对比测试完成！');
    process.exit(0);
  }).catch(error => {
    console.error('对比测试失败:', error);
    process.exit(1);
  });
}

module.exports = FlexibleVsTemplateTest;
