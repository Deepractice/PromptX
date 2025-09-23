// 调试 MCP 工具序列化问题
import { allTools } from './packages/mcp-server/dist/index.js';

console.log('工具数量:', allTools.length);

// 检查每个工具
allTools.forEach((tool, index) => {
  console.log(`\n工具 ${index + 1}: ${tool.name}`);

  // 移除 handler 后尝试序列化
  const { handler, ...toolWithoutHandler } = tool;

  try {
    const json = JSON.stringify(toolWithoutHandler);
    console.log('  ✅ 可以序列化');
    console.log('  长度:', json.length);

    // 检查是否有特殊字符在位置 5
    if (json.length > 5) {
      console.log('  位置 5 的字符:', json[5], '(charCode:', json.charCodeAt(5), ')');
    }
  } catch (error) {
    console.log('  ❌ 序列化失败:', error.message);
    console.log('  工具结构:', Object.keys(toolWithoutHandler));
  }
});

// 尝试模拟 MCP 的返回
try {
  const result = {
    tools: allTools.map(({ handler, ...tool }) => tool)
  };
  const json = JSON.stringify(result);
  console.log('\n完整序列化成功，长度:', json.length);
  console.log('前 20 个字符:', json.substring(0, 20));
} catch (error) {
  console.log('\n❌ 完整序列化失败:', error.message);
}