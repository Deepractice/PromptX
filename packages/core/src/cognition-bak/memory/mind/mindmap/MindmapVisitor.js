// MindmapVisitor.js - AST访问器，将CST转换为Schema对象
// 使用Chevrotain的访问器模式遍历语法树并构建Schema对象

const { mindmapParser } = require('./MindmapParser');
const { GraphSchema } = require('../components/GraphSchema');
const { WordCue } = require('../components/WordCue');

// 获取基础访问器类
const BaseCstVisitor = mindmapParser.getBaseCstVisitorConstructor();

class MindmapVisitor extends BaseCstVisitor {
  constructor() {
    super();
    // 必须验证访问器方法与parser规则匹配
    this.validateVisitor();
  }

  // 访问mindmap文档
  mindmapDocument(ctx) {
    // 获取根节点
    const rootNode = this.visit(ctx.rootNode);
    return rootNode;
  }

  // 访问根节点
  rootNode(ctx) {
    // 提取节点内容
    let nodeName = '';
    
    if (ctx.content) {
      const contentResult = this.visit(ctx.content);
      nodeName = contentResult.join(' ').trim();
    }
    
    // 创建根Schema
    const rootSchema = new GraphSchema(nodeName || 'Root');
    
    // 处理子节点
    if (ctx.childNode) {
      ctx.childNode.forEach(childCtx => {
        const childResult = this.visit(childCtx);
        if (childResult) {
          this.addNodeToSchema(rootSchema, childResult);
        }
      });
    }
    
    return rootSchema;
  }

  // 访问子节点
  childNode(ctx) {
    // 计算缩进级别
    const indentLevel = ctx.Indent ? ctx.Indent.length : 0;
    if (indentLevel === 0) {
      return null;
    }
    
    // 提取节点内容
    let nodeName = '';
    if (ctx.content) {
      const contentResult = this.visit(ctx.content);
      nodeName = contentResult.join(' ').trim();
    }
    
    // 创建节点对象
    const node = {
      name: nodeName,
      level: indentLevel,
      children: []
    };
    
    // 递归处理子节点
    if (ctx.childNode) {
      ctx.childNode.forEach(childCtx => {
        const childResult = this.visit(childCtx);
        if (childResult && childResult.level > indentLevel) {
          node.children.push(childResult);
        }
      });
    }
    
    return node;
  }

  // 访问节点内容
  nodeContent(ctx) {
    const content = [];
    
    if (ctx.Identifier) {
      ctx.Identifier.forEach(token => {
        content.push(token.image);
      });
    }
    
    return content;
  }

  // 访问图标声明
  iconDeclaration(ctx) {
    if (ctx.IconClass) {
      return ctx.IconClass[0].image;
    }
    return null;
  }

  // 辅助方法：将节点添加到Schema
  addNodeToSchema(schema, node) {
    // 创建Cue
    const cue = new WordCue(node.name);
    schema.addCue(cue);
    
    // 递归处理子节点，建立连接关系
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        const childCue = new WordCue(child.name);
        schema.addCue(childCue);
        cue.connect(childCue);
        
        // 递归处理更深层的子节点
        this.addChildrenToSchema(schema, child, childCue);
      });
    }
  }

  // 辅助方法：递归添加子节点
  addChildrenToSchema(schema, parentNode, parentCue) {
    if (parentNode.children && parentNode.children.length > 0) {
      parentNode.children.forEach(child => {
        const childCue = new WordCue(child.name);
        schema.addCue(childCue);
        parentCue.connect(childCue);
        
        // 继续递归
        this.addChildrenToSchema(schema, child, childCue);
      });
    }
  }
}

// 创建单例访问器实例
const mindmapVisitor = new MindmapVisitor();

module.exports = {
  MindmapVisitor,
  mindmapVisitor
};