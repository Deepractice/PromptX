import * as path from "path"
import * as fs from "fs"
import { promises as fsPromises } from "fs"
import { fileURLToPath } from "url"
import type { Resource, ResourceRegistry, ResourcePackage } from "./types"
import { PreinstalledDependenciesManager, getPreinstalledDependenciesManager, analyzeToolDependencies } from "./PreinstalledDependenciesManager"
import logger from "@promptx/logger"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let fixPathForAsarUnpack: ((path: string) => string) | undefined
try {
  if (process.versions && process.versions.electron) {
    const electronUtil = require("electron-util")
    fixPathForAsarUnpack = electronUtil.fixPathForAsarUnpack
  }
} catch (error) {
  fixPathForAsarUnpack = undefined
}

class PackageResource {
  private baseDir: string
  constructor() {
    this.baseDir = __dirname
  }

  resolvePath(resourcePath: string): string {
    const basePath = path.join(this.baseDir, resourcePath)
    return fixPathForAsarUnpack ? fixPathForAsarUnpack(basePath) : basePath
  }

  exists(resourcePath: string): boolean {
    try {
      return fs.existsSync(this.resolvePath(resourcePath))
    } catch {
      return false
    }
  }

  async existsAsync(resourcePath: string): Promise<boolean> {
    try {
      await fsPromises.access(this.resolvePath(resourcePath))
      return true
    } catch {
      return false
    }
  }

  async loadContent(resourcePath: string) {
    const resolvedPath = this.resolvePath(resourcePath)
    try {
      const content = await fsPromises.readFile(resolvedPath, "utf8")
      const stats = await fsPromises.stat(resolvedPath)
      return { content, metadata: { path: resolvedPath, size: content.length, lastModified: stats.mtime, relativePath: resourcePath } }
    } catch (error: any) {
      throw new Error(`Resource error: ${error.message} (Path: ${resolvedPath})`)
    }
  }

  loadContentSync(resourcePath: string): string {
    return fs.readFileSync(this.resolvePath(resourcePath), "utf8")
  }

  async loadRole(roleName: string) {
    return this.loadContent(`resources/role/${roleName}/${roleName}.role.md`)
  }
  async loadTool(toolName: string) {
    return this.loadContent(`resources/tool/${toolName}/${toolName}.tool.md`)
  }
  async loadManual(manualName: string) {
    return this.loadContent(`resources/manual/${manualName}/${manualName}.manual.md`)
  }
}

// --- 強化後的路徑解析邏輯 ---
function getValidRegistryPath(): string | null {
  const candidates = [path.join(__dirname, "registry.json"), path.join(__dirname, "../registry.json"), path.join(process.cwd(), "registry.json")]
  for (const c of candidates) {
    const target = fixPathForAsarUnpack ? fixPathForAsarUnpack(c) : c
    if (fs.existsSync(target)) return target
  }
  return null
}

const registryPath = getValidRegistryPath()
let registry: ResourceRegistry = { version: "2.0.0", resources: [] }

try {
  if (registryPath) {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))
    logger.info(`[@promptx/resource] Registry loaded from: ${registryPath}`)
  } else {
    logger.warn("[@promptx/resource] Registry not found. Starting with empty resources.")
  }
} catch (e: any) {
  logger.error(`[@promptx/resource] Load failed: ${e.message}`)
}

export const getResourcePath = (p: string) => path.join(__dirname, p.startsWith("resources/") ? p : `resources/${p}`)
export const findResourceById = (id: string) => registry.resources.find(r => r.id === id)
export const getResourcesByProtocol = (proto: string) => registry.resources.filter(r => r.protocol === proto)
export const getAllResources = () => registry.resources

const packageResource = new PackageResource()
const resourcePackage: ResourcePackage = { registry, getResourcePath, findResourceById, getResourcesByProtocol, getAllResources }

export { registry, packageResource, PackageResource, PreinstalledDependenciesManager, getPreinstalledDependenciesManager, analyzeToolDependencies }
export default resourcePackage
