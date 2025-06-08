#!/usr/bin/env node
/**
 * @fileoverview PromptX MCP 诊断服务 - 健康检查和性能监控
 * @version 1.0.0
 * @author PromptX Team
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * PromptX诊断服务类
 */
class DiagnosticsService {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * 运行健康检查
   */
  async runHealthCheck() {
    const timestamp = new Date().toISOString();
    const components = {};
    let overallStatus = 'healthy';

    try {
      // 检查角色系统
      const roleCheck = await this.checkRoleSystem();
      components.roles = roleCheck;
      if (!roleCheck.healthy) overallStatus = 'degraded';

      // 检查工具系统
      const toolCheck = await this.checkToolSystem();
      components.tools = toolCheck;
      if (!toolCheck.healthy) overallStatus = 'degraded';

      // 检查内存使用
      const memoryCheck = await this.checkMemoryUsage();
      components.memory = memoryCheck;
      if (!memoryCheck.healthy) overallStatus = 'unhealthy';

    } catch (error) {
      overallStatus = 'unhealthy';
      components.error = {
        healthy: false,
        message: error.message
      };
    }

    return {
      status: overallStatus,
      timestamp,
      components,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 运行综合诊断
   */
  async runDiagnostics() {
    const startTime = performance.now();
    
    try {
      // 角色检查
      const roleCheck = await this.performRoleCheck();
      
      // 工具检查  
      const toolCheck = await this.performToolCheck();
      
      // 性能检查
      const performanceCheck = await this.runPerformanceCheck();
      
      const endTime = performance.now();
      const summary = {
        totalDiagnosticTime: `${(endTime - startTime).toFixed(2)}ms`,
        overallHealth: this.calculateOverallHealth(roleCheck, toolCheck, performanceCheck),
        recommendations: this.generateRecommendations(roleCheck, toolCheck, performanceCheck)
      };

      return {
        roleCheck,
        toolCheck,
        performanceCheck,
        summary
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检测常见问题
   */
  async detectIssues() {
    const issues = [];

    try {
      // 检查角色文件完整性
      const roleIssues = await this.detectRoleIssues();
      issues.push(...roleIssues);

      // 检查内存泄漏
      const memoryIssues = await this.detectMemoryIssues();
      issues.push(...memoryIssues);

      // 检查配置问题
      const configIssues = await this.detectConfigIssues();
      issues.push(...configIssues);

    } catch (error) {
      issues.push({
        type: 'system',
        severity: 'error',
        message: `诊断检测失败: ${error.message}`,
        recommendation: '请检查系统完整性并重启服务'
      });
    }

    return issues;
  }

  /**
   * 运行性能基准测试
   */
  async runPerformanceCheck() {
    const results = {};

    // 角色发现性能测试
    const roleDiscoveryStart = performance.now();
    try {
      const HelloCommand = require('../lib/core/pouch/commands/HelloCommand.js');
      const helloCommand = new HelloCommand();
      await helloCommand.discoverAllRoles();
      results.roleDiscoveryTime = performance.now() - roleDiscoveryStart;
    } catch (error) {
      results.roleDiscoveryTime = -1;
      results.roleDiscoveryError = error.message;
    }

    // 工具注册性能测试
    const toolRegistrationStart = performance.now();
    try {
      const { ToolHandler } = require('../bin/mcp-server.js');
      const toolHandler = new ToolHandler(null);
      toolHandler.getToolsDefinition();
      results.toolRegistrationTime = performance.now() - toolRegistrationStart;
    } catch (error) {
      results.toolRegistrationTime = -1;
      results.toolRegistrationError = error.message;
    }

    // 内存使用情况
    const memoryUsage = process.memoryUsage();
    results.memoryUsage = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    };

    // 性能建议
    results.recommendation = this.generatePerformanceRecommendation(results);

    return results;
  }

  /**
   * 检查资源泄漏
   */
  async checkResourceLeaks() {
    const report = {
      memoryLeaks: [],
      openHandles: [],
      recommendations: []
    };

    // 检查内存使用模式
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      report.memoryLeaks.push({
        type: 'high_memory_usage',
        value: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        threshold: '100MB',
        severity: 'warning'
      });
    }

    // 生成建议
    if (report.memoryLeaks.length > 0 || report.openHandles.length > 0) {
      report.recommendations.push('建议定期重启服务以释放资源');
    } else {
      report.recommendations.push('资源使用情况良好');
    }

    return report;
  }

  // 私有辅助方法

  async checkRoleSystem() {
    try {
      const HelloCommand = require('../lib/core/pouch/commands/HelloCommand.js');
      const helloCommand = new HelloCommand();
      const roles = await helloCommand.discoverAllRoles();
      const roleCount = Object.keys(roles).length;
      
      return {
        healthy: roleCount > 0,
        message: `发现 ${roleCount} 个角色`,
        details: { roleCount, roles: Object.keys(roles) }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `角色系统检查失败: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async checkToolSystem() {
    try {
      const { ToolHandler } = require('../bin/mcp-server.js');
      const toolHandler = new ToolHandler(null);
      const tools = toolHandler.getToolsDefinition();
      
      return {
        healthy: tools.length > 0,
        message: `注册 ${tools.length} 个工具`,
        details: { toolCount: tools.length, tools: tools.map(t => t.name) }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `工具系统检查失败: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const threshold = 500; // 500MB
    
    return {
      healthy: heapUsedMB < threshold,
      message: `内存使用: ${heapUsedMB.toFixed(2)}MB`,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: memoryUsage.heapTotal / 1024 / 1024,
        threshold
      }
    };
  }

  async performRoleCheck() {
    const start = performance.now();
    try {
      const HelloCommand = require('../lib/core/pouch/commands/HelloCommand.js');
      const helloCommand = new HelloCommand();
      const roles = await helloCommand.discoverAllRoles();
      const discovered = Object.keys(roles).length;
      
      // 验证角色有效性
      let valid = 0;
      for (const roleId of Object.keys(roles)) {
        try {
          const roleData = roles[roleId];
          if (roleData.file && fs.existsSync(roleData.file)) {
            valid++;
          }
        } catch (error) {
          // 角色验证失败，跳过
        }
      }

      return {
        discovered,
        valid,
        executionTime: performance.now() - start,
        efficiency: valid / discovered * 100
      };
    } catch (error) {
      return {
        discovered: 0,
        valid: 0,
        executionTime: performance.now() - start,
        error: error.message
      };
    }
  }

  async performToolCheck() {
    const start = performance.now();
    try {
      const { ToolHandler } = require('../bin/mcp-server.js');
      const toolHandler = new ToolHandler(null);
      const tools = toolHandler.getToolsDefinition();
      
      return {
        registered: tools.length,
        executionTime: performance.now() - start,
        tools: tools.map(t => t.name)
      };
    } catch (error) {
      return {
        registered: 0,
        executionTime: performance.now() - start,
        error: error.message
      };
    }
  }

  calculateOverallHealth(roleCheck, toolCheck, performanceCheck) {
    const scores = [];
    
    if (roleCheck.discovered > 0 && roleCheck.valid > 0) scores.push(85);
    else scores.push(0);
    
    if (toolCheck.registered > 0) scores.push(90);
    else scores.push(0);
    
    if (performanceCheck.roleDiscoveryTime > 0 && performanceCheck.roleDiscoveryTime < 1000) scores.push(80);
    else scores.push(40);

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (average >= 80) return 'excellent';
    if (average >= 60) return 'good';
    if (average >= 40) return 'fair';
    return 'poor';
  }

  generateRecommendations(roleCheck, toolCheck, performanceCheck) {
    const recommendations = [];
    
    if (roleCheck.discovered === 0) {
      recommendations.push('角色发现失败，请检查角色目录结构');
    }
    
    if (toolCheck.registered === 0) {
      recommendations.push('工具注册失败，请检查MCP服务器配置');
    }
    
    if (performanceCheck.roleDiscoveryTime > 1000) {
      recommendations.push('角色发现性能较差，考虑优化角色扫描算法');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('系统运行良好，无需特别优化');
    }
    
    return recommendations;
  }

  generatePerformanceRecommendation(results) {
    const recommendations = [];
    
    if (results.roleDiscoveryTime > 500) {
      recommendations.push('角色发现时间较长，考虑添加缓存机制');
    }
    
    if (results.memoryUsage.heapUsed > 100 * 1024 * 1024) {
      recommendations.push('内存使用较高，建议监控内存泄漏');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('性能表现良好');
    }
    
    return recommendations.join('; ');
  }

  async detectRoleIssues() {
    const issues = [];
    try {
      const HelloCommand = require('../lib/core/pouch/commands/HelloCommand.js');
      const helloCommand = new HelloCommand();
      const roles = await helloCommand.discoverAllRoles();
      
      for (const [roleId, roleData] of Object.entries(roles)) {
        if (!roleData.file || !fs.existsSync(roleData.file)) {
          issues.push({
            type: 'role_file_missing',
            severity: 'error',
            message: `角色文件不存在: ${roleId}`,
            recommendation: `检查角色文件路径: ${roleData.file}`
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'role_discovery',
        severity: 'error',
        message: `角色发现失败: ${error.message}`,
        recommendation: '检查角色目录结构和权限'
      });
    }
    return issues;
  }

  async detectMemoryIssues() {
    const issues = [];
    const memoryUsage = process.memoryUsage();
    
    if (memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
      issues.push({
        type: 'high_memory',
        severity: 'warning',
        message: `内存使用过高: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        recommendation: '考虑重启服务或优化内存使用'
      });
    }
    
    return issues;
  }

  async detectConfigIssues() {
    const issues = [];
    
    // 检查package.json
    try {
      const packageJson = require('../../package.json');
      if (!packageJson.bin || !packageJson.bin['promptx-mcp-server']) {
        issues.push({
          type: 'config_missing',
          severity: 'error',
          message: 'package.json缺少MCP服务器入口点配置',
          recommendation: '添加bin字段配置promptx-mcp-server'
        });
      }
    } catch (error) {
      issues.push({
        type: 'config_error',
        severity: 'error',
        message: `配置文件读取失败: ${error.message}`,
        recommendation: '检查package.json文件完整性'
      });
    }
    
    return issues;
  }
}

module.exports = { DiagnosticsService }; 