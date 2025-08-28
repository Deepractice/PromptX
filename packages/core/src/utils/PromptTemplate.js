const { Eta } = require('eta');
const path = require('path');
const fs = require('fs-extra');

/**
 * PromptTemplate - 轻量级提示词模板渲染工具
 * 基于 Eta 模板引擎，专为管理和渲染 Markdown 格式的提示词设计
 */
class PromptTemplate {
  constructor(options = {}) {
    const defaultOptions = {
      views: path.join(process.cwd(), 'prompts'),
      cache: process.env.NODE_ENV === 'production',
      autoEscape: false, // 对 Markdown 很重要
      debug: process.env.NODE_ENV !== 'production',
      includeFile: (filePath, data) => {
        // 自定义 include 函数
        const fullPath = path.isAbsolute(filePath) 
          ? filePath 
          : path.join(this.options.views, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        return this.eta.render(content, data);
      }
    };

    this.options = { ...defaultOptions, ...options };
    this.eta = new Eta(this.options);
  }

  /**
   * 渲染模板文件
   * @param {string} templatePath - 模板文件路径（相对于 views 目录）
   * @param {object} data - 渲染数据
   * @returns {Promise<string>} 渲染后的内容
   */
  async render(templatePath, data = {}) {
    try {
      // 如果没有扩展名，默认添加 .md
      if (!path.extname(templatePath)) {
        templatePath += '.md';
      }

      const fullPath = path.join(this.options.views, templatePath);
      const template = await fs.readFile(fullPath, 'utf8');
      
      return this.eta.renderString(template, data);
    } catch (error) {
      throw new Error(`Failed to render template "${templatePath}": ${error.message}`);
    }
  }

  /**
   * 渲染字符串模板
   * @param {string} template - 模板字符串
   * @param {object} data - 渲染数据
   * @returns {string} 渲染后的内容
   */
  renderString(template, data = {}) {
    try {
      return this.eta.renderString(template, data);
    } catch (error) {
      throw new Error(`Failed to render string template: ${error.message}`);
    }
  }

  /**
   * 预编译模板以提高性能
   * @param {string} templatePath - 模板文件路径
   * @returns {Function} 编译后的模板函数
   */
  async compile(templatePath) {
    try {
      if (!path.extname(templatePath)) {
        templatePath += '.md';
      }

      const fullPath = path.join(this.options.views, templatePath);
      const template = await fs.readFile(fullPath, 'utf8');
      
      return this.eta.compile(template);
    } catch (error) {
      throw new Error(`Failed to compile template "${templatePath}": ${error.message}`);
    }
  }

  /**
   * 注册 partial（可复用片段）
   * @param {string} name - partial 名称
   * @param {string} content - partial 内容
   */
  registerPartial(name, content) {
    this.eta.loadTemplate(`@${name}`, content);
  }

  /**
   * 批量注册目录下的所有 partials
   * @param {string} partialsDir - partials 目录路径
   */
  async registerPartialsFromDir(partialsDir) {
    try {
      const files = await fs.readdir(partialsDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const name = path.basename(file, '.md');
          const content = await fs.readFile(path.join(partialsDir, file), 'utf8');
          this.registerPartial(name, content);
        }
      }
    } catch (error) {
      throw new Error(`Failed to register partials from directory: ${error.message}`);
    }
  }

  /**
   * 清除模板缓存
   */
  clearCache() {
    this.eta.templatesSync = {};
    this.eta.templatesAsync = {};
  }
}

// 创建默认实例
const defaultTemplate = new PromptTemplate();

// 导出类和默认实例
module.exports = PromptTemplate;
module.exports.defaultTemplate = defaultTemplate;