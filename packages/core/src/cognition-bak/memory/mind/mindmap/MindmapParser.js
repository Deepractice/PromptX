// MindmapParser.js - Mermaid Mindmap语法分析器
// 使用Chevrotain实现的语法分析器，将tokens转换为AST

const { CstParser } = require('chevrotain');
const { tokens } = require('./MindmapLexer');

class MindmapParser extends CstParser {
  constructor() {
    super(Object.values(tokens));
    
    // 必须在构造函数中定义所有规则
    this.performSelfAnalysis();
  }

  // 主规则：mindmap文档
  mindmapDocument = this.RULE("mindmapDocument", () => {
    this.CONSUME(tokens.Mindmap);
    this.OPTION(() => {
      this.CONSUME(tokens.Newline);
    });
    this.SUBRULE(this.rootNode);
  });

  // 根节点规则
  rootNode = this.RULE("rootNode", () => {
    this.OR([
      // 圆形根节点 ((text))
      {
        ALT: () => {
          this.CONSUME(tokens.RootCircle);
          this.SUBRULE(this.nodeContent, { LABEL: "content" });
          this.CONSUME(tokens.RootCircleEnd);
        }
      },
      // 方形根节点 [[text]]
      {
        ALT: () => {
          this.CONSUME(tokens.RootSquare);
          this.SUBRULE2(this.nodeContent, { LABEL: "content" });
          this.CONSUME(tokens.RootSquareEnd);
        }
      },
      // 六边形根节点 {{text}}
      {
        ALT: () => {
          this.CONSUME(tokens.RootHexagon);
          this.SUBRULE3(this.nodeContent, { LABEL: "content" });
          this.CONSUME(tokens.RootHexagonEnd);
        }
      },
      // 普通文本节点
      {
        ALT: () => {
          this.SUBRULE4(this.nodeContent, { LABEL: "content" });
        }
      }
    ]);
  });

  // 节点内容规则
  nodeContent = this.RULE("nodeContent", () => {
    this.AT_LEAST_ONE(() => {
      this.CONSUME(tokens.Identifier);
    });
  });
}

// 创建单例parser实例
const mindmapParser = new MindmapParser();

module.exports = {
  MindmapParser,
  mindmapParser
};