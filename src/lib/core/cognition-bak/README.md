# Cognition System

认知体系 = 心智(Mind) + 记忆(Memory)

## 目录结构

```
cognition/
├── stimulus/               # 刺激（认知触发源）
│   ├── Stimulus.js        # 刺激实体
│   └── StimulusType.js    # 刺激类型定义
├── mind/                   # 心智系统
│   ├── interfaces/        # 接口定义
│   │   └── Mind.js       # Mind接口
│   ├── semantic/          # 语义网络（Mind的核心）
│   │   └── Semantic.js   # 全局心智实现
│   ├── cue/              # 线索（认知原子）
│   │   └── Cue.js       # 单词级Mind
│   └── schema/           # 图式（认知结构）
│       └── Schema.js     # 事件级Mind
├── memory/                 # 记忆系统
│   ├── interfaces/        # 接口定义
│   │   └── Memory.js     # Memory接口
│   ├── declarative/       # 陈述性记忆（System 2）
│   │   ├── DeclarativeMemory.js
│   │   ├── shortterm/    # 短期记忆
│   │   │   └── ShortTerm.js
│   │   └── longterm/     # 长期记忆
│   │       └── LongTerm.js
│   └── implicit/          # 内隐记忆（System 1）
│       ├── ImplicitMemory.js
│       └── procedural/    # 程序性记忆
│           └── Procedural.js
├── engram/                # 记忆痕迹
│   ├── interfaces/       
│   │   └── Engram.js     # EngramType定义
│   └── Engram.js         # 记忆单元实现
├── consolidator/          # 巩固器
│   ├── interfaces/
│   │   └── Consolidator.js
│   └── TextOverlapConsolidator.js
├── thought/               # 思维
│   └── Thought.js        # 思维结果
└── Cognition.js          # 认知中心
```

## 认知流程

```
Stimulus（刺激） → Mind（心智激活） → Thought（思维产生）
     ↓                  ↕
  Engram ← Consolidator ← Semantic
     ↓
  Memory（记忆存储）
```

## 核心概念

### 1. 三层Mind架构
- **Cue**: 认知原子，单个概念
- **Schema**: 事件心智，单个记忆的结构
- **Semantic**: 全局心智，完整的认知网络

### 2. 双系统记忆
- **DeclarativeMemory**: System 2（慢思考），有意识的记忆处理
- **ImplicitMemory**: System 1（快思考），自动的记忆处理

### 3. 记忆巩固机制
- **Consolidator**: 将新的Engram整合到语义网络
- **TextOverlapConsolidator**: 通过文字重叠法自动建立知识连接

## 设计原则

1. **认知 = 心智 + 记忆**
2. **极简接口**：每个接口只暴露必要方法
3. **职责分离**：Mind负责思考，Memory负责存储
4. **奥卡姆剃刀**：用最简单的方式解决问题
5. **概念驱动**：每个认知概念独立成目录