# DPML#资源提示单元 框架

> **TL;DR:** DPML#资源提示单元 框架定义了统一的#资源单元 模板，支持通过#资源引用（@协议名://路径）形式在提示词中访问和操作各类资源。

### 目的与功能

DPML#资源提示单元 框架用于定义特定类型的#资源单元，使开发者能够以标准化的方式在提示词中描述如何#定位 和处理各种资源。通过这个框架，可以明确#资源协议 的引用语法、#位置 规则和#查询参数，确保#资源引用 在不同环境中的一致性和可靠性。此框架是PromptX中#资源协议（RP）在提示词层面的具体实现方式。

主要功能包括：
- 定义#资源单元 的标识和#资源引用 方式
- 规范化#位置 的提示词语法结构和#解析 规则
- 指定#资源单元 支持的#查询参数 和格式
- 提供#资源单元 的标准化示例

### 默认支持的通用#资源协议

PromptX默认支持以下通用且已有共识的#资源协议，这些协议符合`@协议名://路径`格式，遵循其业界标准语法和规则，无需在#资源单元 中重新定义：

| #资源协议 | 描述 | 示例 |
|-------|------|------|
| file  | 文件系统资源 | `@file://path/to/file.txt` |
| http/https | HTTP/HTTPS网络资源 | `@https://example.com/api/data` |
| ftp/sftp | 文件传输协议 | `@ftp://user:pass@host/path` |
| ssh | 安全Shell协议 | `@ssh://user@host/path` |

这些通用#资源协议 的路径格式和#查询参数 遵循它们的标准规范。对于特定领域或自定义的#资源协议，才需要使用#资源单元 进行详细定义。

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
resource_element ::= '<resource' ' protocol="' protocol_name '"' '>' content '</resource>'
protocol_name ::= [a-zA-Z][a-zA-Z0-9_-]*
content ::= (markdown_content | location_element | params_element | registry_element)+

location_element ::= '<location>' markdown_content '</location>'
params_element ::= '<params>' markdown_content '</params>'
registry_element ::= '<registry>' markdown_content '</registry>'

markdown_content ::= (* 任何有效的Markdown文本，包括代码块、表格等 *)
```

## 🧩 语义说明

### 子标签语义

#资源单元 包含三个核心子标签，用于定义#资源协议 的具体内容：

- **#位置**：定义该#资源协议 的路径规则。通常采用EBNF形式化语法描述路径结构，并可包含示例说明。
- **#参数**：定义该#资源协议 支持的#查询参数。通常采用表格形式列出参数名称、类型、描述和用法示例。
- **#注册表**：根据#位置 和#参数 定义注册抽象参数与具体资源的映射关系。通常采用表格形式列出ID到实际资源路径的映射。

这三个子标签共同构成#资源协议 的完整定义：#位置 定义资源的#定位 格式，#参数 定义资源的访问选项，#注册表 将抽象ID映射到具体资源路径。标签应按照#位置、#参数、#注册表 的顺序定义，确保#注册表 可以基于前两个标签的内容建立正确的映射关系。

### `@` #资源引用 协议

#资源单元 定义了一个#资源协议，指定了如何使用`@`符号作为统一入口，遵循以下核心语法规则：

```ebnf
resource_reference ::= ('[@]' | '@!' | '@?') protocol_name ':' resource_location [query_params]
resource_location ::= uri | nested_reference
uri ::= protocol_name '://' path
nested_reference ::= ['[@]' | '@!' | '@?'] protocol_name ':' resource_location
path ::= path_segment {'/' path_segment}
query_params ::= '?' param_name '=' param_value {'&' param_name '=' param_value}
```

#### #加载语义

#资源引用 支持三种#加载语义 前缀：

| 前缀 | 语义 | 示例 |
|-----|------|------|
| `@` | 默认模式，由AI自行决定#加载 时机 | `@file://document.md` |
| `@!` | #热加载，AI看到引用时必须立即#加载 | `@!https://example.com/data` |
| `@?` | #懒加载，AI仅记录资源位置，在实际需要使用时才#加载 | `@?file://large-dataset.csv` |

#### 基础#资源引用

基础#资源引用 使用单一#资源协议：
```
@protocol://path
```

例如：
- `@file://document.md` - 引用文件系统中的文档
- `@http://example.com/api/data.json` - 引用网络资源
- `@memory://user_preferences` - 引用内存中的数据
- `@!file://important.md` - #热加载 重要文档
- `@?file://large-dataset.csv` - #懒加载 大型数据集

#### #嵌套引用

#嵌套引用 允许一个#资源协议 处理另一个#资源协议 的输出：

**完整形式**（内部使用@符号）：
```
@outer:@inner://path
```

**简写形式**（内部省略@符号）：
```
@outer:inner://path
```

#嵌套引用 时也可以指定#加载语义：
```
@outer:@!inner://path  // 内部资源#热加载
@!outer:@?inner://path  // 外部#热加载，内部#懒加载
```

例如：
- `@thinking:@file://method.md` - 对文件内容应用thinking协议处理
- `@execution:file://workflow.md` - 对文件内容应用execution协议处理
- `@outer:middle:inner://resource` - 多层#嵌套引用（从内向外处理）
- `@!thinking:@?file://large-file.md` - 立即应用thinking，但文件内容#懒加载

#### #路径通配符

路径支持以下#路径通配符 模式：
- `*` - 匹配单层中的任意文件或目录，如`@file://docs/*.md`
- `**` - 匹配多层目录和文件，如`@file://src/**/*.js`
- `*.ext` - 匹配特定扩展名的文件，如`@file://docs/*.txt`
- `*.{ext1,ext2}` - 匹配多种扩展名，如`@file://src/*.{js,ts}`

#### #查询参数

#查询参数 提供额外的资源处理指令：
```
@protocol://path?param1=value1&param2=value2
```

例如：
- `@file://document.md?line=5-10` - 只获取文件的第5-10行
- `@http://api.example.com/data?format=json&cache=false` - 指定返回格式并禁用缓存

#### #注册表 解析与抽象引用

使用#注册表 定义的资源可以通过抽象ID引用，无需知道具体路径：
```
@protocol://resource_id
```

例如定义了以下#注册表：
```xml
<resource protocol="thought">
  <location>
    location ::= thought://{thought_id}
    thought_id ::= [a-zA-Z][a-zA-Z0-9_-]*
  </location>
  
  <registry>
    | 思维ID | 文件路径 |
    |--------|---------|
    | analytical | @file://PromptX/core/thoughts/analytical.thought.md |
    | creative | @file://PromptX/core/thoughts/creative.thought.md |
  </registry>
</resource>
```

使用时可以简单引用：
- `@thought://analytical` - 自动映射到对应文件
- `@thought://creative` - 自动映射到对应文件

这种抽象引用机制提供了路由层，使#资源引用 与实际存储位置解耦，方便管理和移植。

### #解析 规则

1. #资源引用 解析从左至右进行，先识别#资源协议 名称，再#解析 资源位置和#查询参数
2. #嵌套引用 从内向外#解析，内层#资源引用 的结果作为外层引用的输入
3. #查询参数 应用于资源#加载 后的处理阶段，不影响资源的基本#定位
4. 相对路径#定位 基于当前上下文的工作目录或基础路径
5. #加载语义 前缀（@、@!、@?）优先于其他部分#解析，决定资源的#加载 策略

### #加载 实现说明

对于支持工具调用能力的AI系统:
1. **主动#加载 责任**: AI需主动使用工具调用(例如read_file)获取@引用的资源，而非等待系统自动#加载
2. **#热加载 义务**: 特别是对于@!前缀资源，AI必须立即执行工具调用#加载 内容
3. **自主判断#懒加载**: 对于@?前缀资源，AI应记录位置但暂不#加载，直到实际需要使用时
4. **#加载 验证**: AI应验证资源是否成功#加载，并适当处理#加载 失败情况
5. **#注册表 解析**: 对于使用#注册表 注册的#资源引用，AI应首先#解析 资源ID，找到对应的实际资源路径，然后再应用上述规则获取资源

这种主动#加载 模式确保AI能正确执行协议定义的#加载语义，而不依赖系统层面的自动处理。#注册表 机制则提供了#资源引用 的抽象层，使资源组织更加灵活和模块化。


