// MindmapLexer.js - Mermaid Mindmap词法分析器
// 使用Chevrotain实现的词法分析器，识别mermaid mindmap语法的所有token

const { createToken, Lexer } = require('chevrotain');

// ===== Token定义 =====

// 标识符（节点文本）- 必须先定义，因为其他token依赖它
const Identifier = createToken({ 
  name: "Identifier", 
  pattern: /[^\n\r()[\]{}*_:\s]+/
});

// 关键字
const Mindmap = createToken({ 
  name: "Mindmap", 
  pattern: /mindmap/,
  longer_alt: Identifier
});

// 节点形状
const RootCircle = createToken({ name: "RootCircle", pattern: /\(\(/ });
const RootCircleEnd = createToken({ name: "RootCircleEnd", pattern: /\)\)/ });
const RootSquare = createToken({ name: "RootSquare", pattern: /\[\[/ });
const RootSquareEnd = createToken({ name: "RootSquareEnd", pattern: /\]\]/ });
const RootHexagon = createToken({ name: "RootHexagon", pattern: /\{\{/ });
const RootHexagonEnd = createToken({ name: "RootHexagonEnd", pattern: /\}\}/ });

// 图标标记
const IconMarker = createToken({ 
  name: "IconMarker", 
  pattern: /::icon\(/
});

const IconClass = createToken({ 
  name: "IconClass", 
  pattern: /[^)]+/
});

const IconEnd = createToken({ 
  name: "IconEnd", 
  pattern: /\)/
});

// 强调标记
const BoldMarker = createToken({ name: "BoldMarker", pattern: /\*\*/ });
const EmMarker = createToken({ name: "EmMarker", pattern: /__/ });

// 换行符（重要！用于识别节点边界）
const Newline = createToken({ 
  name: "Newline", 
  pattern: /\r?\n/,
  line_breaks: true
});

// 空白
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED
});

// ===== 词法分析器配置 =====

// 所有tokens（顺序很重要！）
const allTokens = [
  // 换行符必须在最前面
  Newline,
  
  // 空白
  WhiteSpace,
  
  // 关键字必须在Identifier之前
  Mindmap,
  
  // 节点形状标记
  RootCircle,
  RootCircleEnd,
  RootSquare,
  RootSquareEnd,
  RootHexagon,
  RootHexagonEnd,
  
  // 特殊标记
  IconMarker,
  IconEnd,
  IconClass,
  BoldMarker,
  EmMarker,
  
  // 标识符放在最后
  Identifier
];

// 创建词法分析器
const MindmapLexer = new Lexer(allTokens);

// 导出tokens供parser使用
module.exports = {
  // Lexer实例
  MindmapLexer,
  
  // 所有tokens
  tokens: {
    // 关键字
    Mindmap,
    
    // 节点形状
    RootCircle,
    RootCircleEnd,
    RootSquare,
    RootSquareEnd,
    RootHexagon,
    RootHexagonEnd,
    
    // 特殊标记
    IconMarker,
    IconClass,
    IconEnd,
    BoldMarker,
    EmMarker,
    
    // 基础
    Newline,
    WhiteSpace,
    Identifier
  }
};