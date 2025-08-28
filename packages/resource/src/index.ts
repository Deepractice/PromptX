import * as path from 'path'
import * as fs from 'fs'
import type { Resource, ResourceRegistry, ResourcePackage } from './types'

// dist 目录就是包的实际根目录（运行时）
const packageRoot = __dirname

// 注册表路径（在 dist 中）
const registryPath = path.join(packageRoot, 'registry.json')

// 加载注册表
let registry: ResourceRegistry | null = null

try {
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, 'utf-8')
    registry = JSON.parse(content) as ResourceRegistry
  }
} catch (error: any) {
  console.warn('[@promptx/resource] Failed to load registry:', error.message)
  // 提供空注册表作为后备
  registry = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    total: 0,
    resources: {
      role: [],
      tool: [],
      protocol: []
    }
  }
}

/**
 * 获取资源的绝对路径
 */
export function getResourcePath(relativePath: string): string {
  // 处理两种可能的路径格式
  // 1. 'role/assistant/assistant.role.md'
  // 2. 'resources/role/assistant/assistant.role.md'
  if (!relativePath.startsWith('resources/')) {
    relativePath = `resources/${relativePath}`
  }
  return path.join(packageRoot, relativePath)
}

/**
 * 根据 ID 查找资源
 */
export function findResourceById(id: string): Resource | undefined {
  if (!registry) return undefined
  
  for (const category of ['role', 'tool', 'protocol'] as const) {
    const resource = registry.resources[category].find(r => r.id === id)
    if (resource) return resource
  }
  
  return undefined
}

/**
 * 根据分类获取资源列表
 */
export function getResourcesByCategory(category: 'role' | 'tool' | 'protocol'): Resource[] {
  if (!registry) return []
  return registry.resources[category] || []
}

/**
 * 获取所有资源列表
 */
export function getAllResources(): Resource[] {
  if (!registry) return []
  
  const allResources: Resource[] = []
  for (const category of ['role', 'tool', 'protocol'] as const) {
    allResources.push(...registry.resources[category])
  }
  
  return allResources
}

// 导出包信息
const resourcePackage: ResourcePackage = {
  registry: registry!,
  getResourcePath,
  findResourceById,
  getResourcesByCategory,
  getAllResources
}

// CommonJS 导出（兼容性）
module.exports = resourcePackage

// ES Module 导出
export { registry }
export default resourcePackage