/**
 * PromptX 资源文件命名管理器
 * 统一管理所有资源文件的命名规范：[id].[tag].md
 */
class ResourceFileNaming {
  
  /**
   * 资源文件命名模式
   * 格式：[id].[tag].md
   * 示例：sean-product-philosophy.thought.md
   */
  static NAMING_PATTERN = /^(.+)\.(\w+)\.md$/;
  
  /**
   * 解析资源文件名
   * @param {string} fileName - 文件名
   * @returns {Object|null} 解析结果 {id, tag} 或 null
   */
  static parseFileName(fileName) {
    const match = fileName.match(this.NAMING_PATTERN);
    if (match) {
      const [, id, tag] = match;
      return { id, tag };
    }
    return null;
  }
  
  /**
   * 生成资源文件名
   * @param {string} id - 资源ID
   * @param {string} tag - 资源标签
   * @returns {string} 生成的文件名
   */
  static generateFileName(id, tag) {
    return `${id}.${tag}.md`;
  }
  
  /**
   * 验证文件名是否符合规范
   * @param {string} fileName - 文件名
   * @returns {boolean} 是否符合规范
   */
  static isValidFileName(fileName) {
    return this.NAMING_PATTERN.test(fileName);
  }
  
  /**
   * 检查文件是否为指定标签类型
   * @param {string} fileName - 文件名
   * @param {string} expectedTag - 期望的标签
   * @returns {boolean} 是否匹配
   */
  static hasTag(fileName, expectedTag) {
    const parsed = this.parseFileName(fileName);
    return parsed && parsed.tag === expectedTag;
  }
  
  /**
   * 从文件路径提取资源ID
   * @param {string} filePath - 文件路径
   * @param {string} expectedTag - 期望的标签
   * @returns {string|null} 资源ID或null
   */
  static extractResourceId(filePath, expectedTag) {
    const path = require('path');
    const fileName = path.basename(filePath);
    const parsed = this.parseFileName(fileName);
    
    if (parsed && parsed.tag === expectedTag) {
      return parsed.id;
    }
    return null;
  }
  
  /**
   * 扫描目录中指定标签的所有文件
   * @param {string} directory - 目录路径
   * @param {string} tag - 标签类型
   * @returns {Promise<Array>} 文件路径数组
   */
  static async scanTagFiles(directory, tag) {
    const fs = require('fs-extra');
    const path = require('path');
    
    try {
      if (!await fs.pathExists(directory)) {
        return [];
      }
      
      const files = await fs.readdir(directory);
      const tagFiles = [];
      
      for (const file of files) {
        if (this.hasTag(file, tag)) {
          tagFiles.push(path.join(directory, file));
        }
      }
      
      return tagFiles;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * 获取支持的资源标签类型
   * @returns {Array<string>} 支持的标签类型
   */
  static getSupportedTags() {
    return ['role', 'thought', 'execution', 'knowledge'];
  }
}

module.exports = ResourceFileNaming; 