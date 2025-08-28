# DPML#行为提示单元 框架

> **TL;DR:** DPML#行为提示单元 框架定义了结构化的#行为单元 模板，包含#流程(Process)、#指导原则(Guideline)、#规则(Rule)、#约束(Constraint)和#标准(Criteria)五个核心子概念，用于指导AI系统完成具体任务。

### 目的与功能

DPML#行为提示单元 框架定义了AI系统执行任务的#行为单元 模板，它的主要功能是：
- 提供执行任务的结构化#行为单元 定义
- 通过标准化#行为单元 明确#流程 步骤、#指导原则、#规则、#约束 和#标准
- 帮助AI系统通过规范化#行为单元 进行精确、可靠的任务执行
- 提供执行状态追踪和错误处理的#行为单元 模板

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
execution_element ::= '<execution' attributes? '>' content '</execution>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= (markdown_content | process_element | guideline_element | rule_element | constraint_element | criteria_element)+

process_element ::= '<process' attributes? '>' markdown_content '</process>'
guideline_element ::= '<guideline' attributes? '>' markdown_content '</guideline>'
rule_element ::= '<rule' attributes? '>' markdown_content '</rule>'
constraint_element ::= '<constraint' attributes? '>' markdown_content '</constraint>'
criteria_element ::= '<criteria' attributes? '>' markdown_content '</criteria>'

markdown_content ::= (* 任何有效的Markdown文本，可包含特定语法元素 *)
```

## 🧩 语义说明

#行为提示单元 标签表示一个完整的#行为单元 框架。标签内容可以包含五种不同概念的子标签，每个子标签都有明确的语义：

- **#流程**: 表示执行的具体步骤，包含正常和异常路径，是#行为单元 的核心路径定义
- **#指导原则**: 表示建议性指导原则，具有灵活性和可变通性，用于推荐最佳实践
- **#规则**: 表示强制性行为准则，必须严格遵守，通常涉及安全、合规或核心质量要求
- **#约束**: 表示客观限制条件，客观存在且不可改变，需要被动适应
- **#标准**: 表示评价标准，用于判断执行结果是否满足要求

这五个子概念构成了完整的#行为单元 框架，从不同维度定义了AI系统如何执行任务。

### 优先级关系

#行为提示单元 框架内的子概念具有以下固定的优先级关系，这种关系定义了如何理解和解释这些概念：

1. **#约束** - 最高优先级，表示客观存在的限制，不可违反
2. **#规则** - 次高优先级，表示必须遵循的行为准则
3. **#指导原则** - 较低优先级，表示可灵活调整的建议性原则
4. **#流程** - 在#约束 和#规则 的框架内定义执行路径
5. **#标准** - 作为评价依据，验证执行结果是否满足要求

这种优先级关系是框架的核心语义特征：
- 低优先级元素不能与高优先级元素产生冲突
- #流程 必须在#约束 和#规则 定义的边界内设计
- #指导原则 在不违反#规则 和#约束 的前提下可以灵活调整
- #标准 需要考虑所有优先级更高的元素的要求

