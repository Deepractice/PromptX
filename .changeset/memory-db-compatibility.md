---
"@promptx/core": patch
---

# Memory Database Compatibility Fix - 解决 lmdb 到 sqlite 迁移问题

## 🎯 问题解决

### 旧用户记忆系统失败问题
- **问题描述**: 从 lmdb 迁移到 sqlite 后，旧用户的记忆文件格式不兼容
- **错误表现**: "Error calling tool toolx: Error: Error invoking remote method 'mcp:call-tool'"
- **根本原因**: 文件名未变化，但内容格式从 lmdb 变为 sqlite，导致 Database() 构造函数失败

### 解决方案：容错重建机制
在 Memory.js 构造函数中添加了数据库打开失败的容错处理：

1. **尝试正常打开数据库**
2. **失败时自动删除不兼容文件**
3. **重新创建新的 SQLite 数据库**
4. **友好的日志记录告知用户**

## 🔧 技术改进

### 自动修复流程
```javascript
try {
  // 尝试打开数据库
  this.db = new Database(this.dbPath);
  // 正常初始化...
} catch (error) {
  // 自动删除不兼容文件并重建
  if (fs.existsSync(this.dbPath)) {
    fs.removeSync(this.dbPath);
  }
  this.db = new Database(this.dbPath);
  // 重新初始化...
}
```

### 用户体验改进
- **无感知修复**: 用户完全无需手动干预
- **数据丢失提醒**: 通过日志提醒用户旧记忆会丢失
- **功能恢复**: 确保记忆系统能正常工作

## 📊 影响范围

### 用户群体
- ✅ **新用户**: 无影响，正常创建 SQLite 数据库
- ✅ **旧用户**: 自动修复，记忆功能恢复正常
- ⚠️ **数据影响**: 旧记忆会丢失，但系统恢复正常工作

### 技术细节
- **修改文件**: `packages/core/src/cognition/Memory.js`
- **向后兼容**: 新老版本都能正常工作
- **错误处理**: 完善的异常捕获和日志记录
- **性能影响**: 仅在首次打开失败时触发，后续无影响

## 🧪 测试验证

已通过实际测试验证：
1. 创建假的损坏数据库文件
2. 调用记忆功能触发修复
3. 验证自动删除并重建为正确的 SQLite 格式
4. 确认记忆功能正常工作

这个修复解决了困扰旧用户的核心问题，确保了系统的稳定性和可用性。