// Mermaid Mindmap 语法定义 V2
// 修复缩进层级处理

{
  // 辅助函数：构建节点
  function buildNode(name, children) {
    return {
      name: name,
      children: children || []
    };
  }
  
  // 辅助函数：根据缩进组织节点
  function organizeByIndent(nodes) {
    if (!nodes || nodes.length === 0) return [];
    
    const stack = [];
    const result = [];
    
    nodes.forEach(node => {
      const indent = node.indent || 0;
      
      // 移除比当前缩进深的节点
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      
      // 如果栈为空，这是顶级节点
      if (stack.length === 0) {
        result.push(node);
      } else {
        // 否则是栈顶节点的子节点
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
      
      // 将当前节点加入栈
      stack.push(node);
    });
    
    return result;
  }
}

// 主规则
Mindmap
  = "mindmap" _ root:RootNode children:ChildrenList? {
      const rootNode = buildNode(root.name, organizeByIndent(children));
      return rootNode;
    }

// 根节点
RootNode
  = CircleNode
  / PlainNode

// 圆形节点 ((text))
CircleNode
  = "((" _ name:NodeText _ "))" {
      return { name: name };
    }

// 普通节点
PlainNode
  = name:NodeText {
      return { name: name };
    }

// 子节点列表
ChildrenList
  = nodes:(node:IndentedNode { return node; })+ {
      return nodes;
    }

// 带缩进的节点
IndentedNode
  = nl indent:Indent name:NodeText {
      return {
        name: name,
        indent: indent.length
      };
    }

// 节点文本
NodeText
  = chars:NodeChar+ {
      return chars.join('').trim();
    }

// 节点字符（不包括特殊符号和换行）
NodeChar
  = [^\n\r()[\]{}]

// 缩进
Indent
  = spaces:[ ]+ {
      return spaces;
    }

// 换行
nl
  = [\r\n]+

// 可选空白
_
  = [ \t\r\n]*