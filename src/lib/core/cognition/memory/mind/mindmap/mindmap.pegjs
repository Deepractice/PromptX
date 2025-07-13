// Mermaid Mindmap 语法定义
// 使用 Peggy (PEG.js) 语法

{
  // 辅助函数：构建节点树
  function buildNode(name, children) {
    return {
      name: name,
      children: children || []
    };
  }
  
  // 辅助函数：扁平化子节点
  function flattenChildren(first, rest) {
    const children = [first];
    if (rest) {
      rest.forEach(item => {
        if (item[1]) children.push(item[1]);
      });
    }
    return children;
  }
}

// 主规则
Mindmap
  = "mindmap" _ root:RootNode _ {
      return root;
    }

// 根节点
RootNode
  = CircleNode
  / SquareNode  
  / HexagonNode
  / PlainNode

// 圆形节点 ((text))
CircleNode
  = "((" _ name:NodeText _ "))" children:Children? {
      return buildNode(name, children);
    }

// 方形节点 [[text]]
SquareNode
  = "[[" _ name:NodeText _ "]]" children:Children? {
      return buildNode(name, children);
    }

// 六边形节点 {{text}}
HexagonNode
  = "{{" _ name:NodeText _ "}}" children:Children? {
      return buildNode(name, children);
    }

// 普通节点
PlainNode
  = name:NodeText children:Children? {
      return buildNode(name, children);
    }

// 子节点列表
Children
  = nl first:ChildNode rest:(nl node:ChildNode { return node; })* {
      return rest ? [first].concat(rest) : [first];
    }

// 子节点（带缩进）
ChildNode
  = indent:Indent node:PlainNode {
      node.indent = indent.length;
      return node;
    }

// 节点文本
NodeText
  = chars:NodeChar+ {
      return chars.join('').trim();
    }

// 节点字符（不包括特殊符号）
NodeChar
  = [^\n\r()[\]{}]

// 缩进
Indent
  = spaces:[ \t]+ {
      return spaces;
    }

// 换行
nl
  = [\r\n]+

// 可选空白
_
  = [ \t\r\n]*