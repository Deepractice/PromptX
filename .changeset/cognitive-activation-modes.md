---
"@promptx/core": minor
"@promptx/mcp-server": minor
"@promptx/logger": patch
---

feat: 认知激活模式系统与recall工具增强

## 新增功能

### 认知激活模式 (Cognitive Activation Modes)
- 实现三种认知激活模式:Creative(创造性探索)、Balanced(平衡模式)、Focused(聚焦检索)
- 基于学术研究(ACT-R、探索-利用理论、双过程理论)设计参数体系
- 支持通过recall工具的mode参数切换激活模式
- 不同模式通过调节firingThreshold、maxCycles、synapticDecay等参数控制激活扩散行为

### Recall工具增强
- 严格限制recall必须使用记忆网络中实际存在的词汇
- 优化工具提示词,强制执行"action查看网络图 → 选择已存在的词 → recall"工作流
- 添加明确的失败处理指导,禁止AI推测或抽象不存在的词

## 修复

### 状态锚定bug修复
- 修复空Mind对象被错误锚定导致状态污染的问题
- 添加系统级防御:仅当recall成功激活节点时才保存状态
- 防止AI违规使用不存在词汇导致的状态损坏

### 其他修复
- 修复TwoPhaseRecallStrategy错误使用centerCue导致激活失败的bug
- 改进logger API支持自然顺序参数 logger.info(msg, obj)
- 添加详细的mode参数传递日志便于调试

## 技术细节

认知模式参数对比:
- Creative: firingThreshold=0.05, maxCycles=12, 广泛联想
- Balanced: firingThreshold=0.1, maxCycles=8, 系统默认
- Focused: firingThreshold=0.2, maxCycles=4, 精确检索