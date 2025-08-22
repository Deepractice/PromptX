/**
 * Mind - 认知网络（以 Cue 为中心的激活子图）
 * 
 * ## 设计理念
 * 
 * Mind代表一个当前激活的认知状态，相当于"工作记忆"（Working Memory）。
 * 它不是所有记忆的容器（那是Network的职责），而是当前正在思考的内容。
 * 
 * 类比：
 * - Network = 长期记忆（所有你知道的）
 * - Mind = 工作记忆（你现在正在想的）
 * 
 * ## 为什么这样设计
 * 
 * 1. **动态激活模型**
 *    - Mind是动态生成的，不是静态存储的
 *    - 每次Recall/Prime都会生成新的Mind
 *    - 反映了人类认知的动态性：同一个概念在不同时刻激活的相关内容可能不同
 * 
 * 2. **有向无环图（DAG）结构**
 *    - 从中心Cue向外扩散形成的子图
 *    - 避免环路，防止无限激活
 *    - 保持思维的方向性和层次性
 * 
 * 3. **轻量级设计**
 *    - 只存储激活的Cue集合和连接关系
 *    - 不复制Cue的内容，只引用
 *    - 便于序列化和传输（给大模型）
 * 
 * ## 数据结构说明
 * 
 * ```javascript
 * {
 *   center: Cue实例,              // 激活中心（起点）
 *   activatedCues: Set(['认知', '模型', ...]),  // 所有激活的节点
 *   connections: [                // 激活的连接
 *     {from: '认知', to: '模型', weight: 1234567890},
 *     {from: '模型', to: '训练', weight: 1234567880}
 *   ]
 * }
 * ```
 * 
 * ## Mind的用途
 * 
 * 1. **作为上下文提供给大模型**
 *    - 大模型可以根据Mind理解当前的思维脉络
 *    - 提供相关概念的关联性
 * 
 * 2. **可视化思维过程**
 *    - 可以渲染成mindmap
 *    - 展示概念之间的关系强度
 * 
 * 3. **思维链的基础**
 *    - 多个Mind可以组合成思维链
 *    - 支持复杂的推理过程
 * 
 * @class Mind
 */
class Mind {
  /**
   * 创建一个新的Mind
   * 
   * @param {Cue} center - 中心Cue（激活的起点）
   */
  constructor(center) {
    /**
     * 激活中心 - 思维的起点
     * 
     * 设计考虑：
     * - 可能为null（如Prime失败或多中心激活）
     * - 保存Cue引用而不是word，便于访问连接信息
     * 
     * @type {Cue|null}
     */
    this.center = center;
    
    /**
     * 激活的Cue集合 - 所有被激活的概念
     * 
     * 使用Set的原因：
     * - O(1)的查找性能（避免重复激活）
     * - 自动去重
     * - 便于统计激活数量
     * 
     * 存储word而不是Cue引用的原因：
     * - 减少内存占用
     * - 便于序列化
     * - 避免循环引用
     * 
     * @type {Set<string>}
     */
    this.activatedCues = new Set();
    
    /**
     * 连接关系 - 激活的边
     * 
     * 数组结构：便于保持激活顺序
     * 每个连接包含：
     * - from: 源节点word
     * - to: 目标节点word  
     * - weight: 连接权重
     * 
     * @type {Array<{from: string, to: string, weight: number}>}
     */
    this.connections = [];
    
    /**
     * 多中心支持（实验性）
     * 
     * 用于Prime.executeMultiple等场景
     * 允许多个起点同时激活
     * 
     * @type {Array<Cue>}
     */
    this.centers = [];
    
    /**
     * 激活深度记录
     * 
     * 记录每个节点距离中心的深度
     * 用于可视化和分析
     * 
     * @type {Map<string, number>}
     */
    this.depths = new Map();
    
    // 如果有中心，将其加入激活集合
    if (center) {
      this.activatedCues.add(center.word);
      this.depths.set(center.word, 0);
    }
  }
  
  /**
   * 添加一个激活的Cue
   * 
   * @param {string} word - 概念词
   * @param {number} depth - 距离中心的深度
   */
  addActivatedCue(word, depth = 0) {
    this.activatedCues.add(word);
    if (!this.depths.has(word) || this.depths.get(word) > depth) {
      this.depths.set(word, depth);
    }
  }
  
  /**
   * 添加一个连接
   * 
   * @param {string} from - 源节点
   * @param {string} to - 目标节点
   * @param {number} weight - 连接权重
   */
  addConnection(from, to, weight) {
    this.connections.push({ from, to, weight });
    // 确保两端都在激活集合中
    this.activatedCues.add(from);
    this.activatedCues.add(to);
  }
  
  /**
   * 获取激活的节点数量
   * 
   * @returns {number} 节点数
   */
  size() {
    return this.activatedCues.size;
  }
  
  /**
   * 获取连接数量
   * 
   * @returns {number} 边数
   */
  connectionCount() {
    return this.connections.length;
  }
  
  /**
   * 检查是否为空Mind
   * 
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.activatedCues.size === 0;
  }
  
  /**
   * 获取按权重排序的连接
   * 
   * @returns {Array} 排序后的连接
   */
  getSortedConnections() {
    return [...this.connections].sort((a, b) => b.weight - a.weight);
  }
  
  /**
   * 获取特定节点的所有出边
   * 
   * @param {string} word - 节点词
   * @returns {Array} 出边列表
   */
  getOutgoingConnections(word) {
    return this.connections.filter(conn => conn.from === word);
  }
  
  /**
   * 获取特定节点的所有入边
   * 
   * @param {string} word - 节点词
   * @returns {Array} 入边列表
   */
  getIncomingConnections(word) {
    return this.connections.filter(conn => conn.to === word);
  }
  
  /**
   * 转换为可序列化的JSON对象
   * 
   * 用于：
   * - 发送给大模型
   * - 保存思维快照
   * - 可视化展示
   * 
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      center: this.center ? this.center.word : null,
      centers: this.centers.map(c => c.word),
      activatedCues: Array.from(this.activatedCues),
      connections: this.connections,
      depths: Array.from(this.depths.entries()).map(([word, depth]) => ({ word, depth })),
      statistics: {
        nodeCount: this.activatedCues.size,
        edgeCount: this.connections.length,
        maxDepth: Math.max(...this.depths.values(), 0)
      }
    };
  }
  
  /**
   * 生成Mermaid mindmap代码
   * 
   * 可以直接用于可视化展示
   * 
   * @returns {string} Mermaid mindmap代码
   */
  toMermaid() {
    if (!this.center || this.activatedCues.size === 0) {
      return 'mindmap\n  root((空))';
    }
    
    // 构建树形结构（从连接关系构建）
    const tree = this.buildTree();
    
    // 生成mindmap格式
    let mermaid = 'mindmap\n';
    mermaid += `  root((${this.center.word}))\n`;
    
    // 递归添加子节点
    const addChildren = (parent, indent) => {
      const children = tree.get(parent) || [];
      for (const child of children) {
        mermaid += ' '.repeat(indent) + child + '\n';
        addChildren(child, indent + 2);
      }
    };
    
    addChildren(this.center.word, 4);
    
    return mermaid;
  }
  
  /**
   * 构建树形结构
   * 用于生成mindmap
   * 
   * @returns {Map<string, Array<string>>} 父节点 -> 子节点列表
   */
  buildTree() {
    const tree = new Map();
    const visited = new Set();
    
    // 从连接构建父子关系
    for (const conn of this.connections) {
      if (!tree.has(conn.from)) {
        tree.set(conn.from, []);
      }
      // 避免重复添加
      if (!visited.has(`${conn.from}->${conn.to}`)) {
        tree.get(conn.from).push(conn.to);
        visited.add(`${conn.from}->${conn.to}`);
      }
    }
    
    // 按权重排序子节点（可选）
    for (const [parent, children] of tree) {
      // 获取每个子节点的权重
      const childrenWithWeight = children.map(child => {
        const conn = this.connections.find(c => c.from === parent && c.to === child);
        return { child, weight: conn ? conn.weight : 0 };
      });
      // 按权重降序排序
      childrenWithWeight.sort((a, b) => b.weight - a.weight);
      // 更新排序后的子节点
      tree.set(parent, childrenWithWeight.map(item => item.child));
    }
    
    return tree;
  }
  
  /**
   * 合并另一个Mind
   * 
   * 用于多线索思考的场景
   * 
   * @param {Mind} otherMind - 要合并的Mind
   */
  merge(otherMind) {
    // 合并激活集合
    for (const cue of otherMind.activatedCues) {
      this.activatedCues.add(cue);
    }
    
    // 合并连接（避免重复）
    const existingConns = new Set(
      this.connections.map(c => `${c.from}->${c.to}`)
    );
    
    for (const conn of otherMind.connections) {
      const key = `${conn.from}->${conn.to}`;
      if (!existingConns.has(key)) {
        this.connections.push(conn);
      }
    }
    
    // 合并深度信息
    for (const [word, depth] of otherMind.depths) {
      if (!this.depths.has(word) || this.depths.get(word) > depth) {
        this.depths.set(word, depth);
      }
    }
    
    // 添加到多中心列表
    if (otherMind.center) {
      this.centers.push(otherMind.center);
    }
  }
}

module.exports = Mind;