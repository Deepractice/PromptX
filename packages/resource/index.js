/**
 * @promptx/resource - PromptX 资源包
 * 提供角色定义、协议模板和工具配置
 */

const path = require('path');
const fs = require('fs');

/**
 * 获取资源目录路径
 */
function getResourcePath(type) {
  return path.join(__dirname, type);
}

/**
 * 列出指定类型的所有资源
 */
function listResources(type) {
  const resourcePath = getResourcePath(type);
  if (!fs.existsSync(resourcePath)) {
    return [];
  }
  
  return fs.readdirSync(resourcePath)
    .filter(file => file.endsWith('.md') || file.endsWith('.json'))
    .map(file => ({
      name: path.basename(file, path.extname(file)),
      path: path.join(resourcePath, file),
      type: path.extname(file).slice(1)
    }));
}

/**
 * 加载资源文件
 */
function loadResource(type, name) {
  const resources = listResources(type);
  const resource = resources.find(r => r.name === name);
  
  if (!resource) {
    throw new Error(`Resource not found: ${type}/${name}`);
  }
  
  const content = fs.readFileSync(resource.path, 'utf-8');
  
  if (resource.type === 'json') {
    return JSON.parse(content);
  }
  
  return content;
}

module.exports = {
  getResourcePath,
  listResources,
  loadResource,
  
  // 便捷方法
  roles: () => listResources('role'),
  protocols: () => listResources('protocol'),
  tools: () => listResources('tool'),
  
  loadRole: (name) => loadResource('role', name),
  loadProtocol: (name) => loadResource('protocol', name),
  loadTool: (name) => loadResource('tool', name)
};