import { BrowserWindow, IpcMainInvokeEvent, ipcMain, dialog } from 'electron'
import { ResourceService } from '~/main/application/ResourceService'
import * as path from 'path'
import { pathToFileURL } from 'node:url'
import { t } from '~/main/i18n'

/**
 * Resource List Window - 资源管理窗口
 */
export class ResourceListWindow {
  private window: BrowserWindow | null = null
  private static handlersRegistered = false

  constructor(private resourceService: ResourceService) {
    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    // 防止重复注册
    if (ResourceListWindow.handlersRegistered) {
      return
    }
    ResourceListWindow.handlersRegistered = true

    // 获取分组资源
    ipcMain.handle('resources:getGrouped', async () => {
      try {
        const grouped = await this.resourceService.getGroupedResources()
        const stats = await this.resourceService.getStatistics()

        return {
          success: true,
          data: {
            grouped,
            statistics: stats
          }
        }
      } catch (error: any) {
        console.error('Failed to get grouped resources:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    // 搜索资源
    ipcMain.handle('resources:search', async (_: IpcMainInvokeEvent, query: string) => {
      try {
        const resources = await this.resourceService.searchResources(query)
        return {
          success: true,
          data: resources
        }
      } catch (error: any) {
        console.error('Failed to search resources:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    // 激活角色
    ipcMain.handle('resources:activateRole', async (_: IpcMainInvokeEvent, roleId: string) => {
      try {
        const result = await this.resourceService.activateRole(roleId)
        return result
      } catch (error: any) {
        console.error('Failed to activate role:', error)
        return {
          success: false,
          message: error.message
        }
      }
    })


    // 获取资源统计
    ipcMain.handle('resources:getStatistics', async () => {
      try {
        const stats = await this.resourceService.getStatistics()
        return {
          success: true,
          data: stats
        }
      } catch (error: any) {
        console.error('Failed to get statistics:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    // 新增：下载资源（分享即下载，导出为 ZIP 压缩包）
    ipcMain.handle('resources:download', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string }) => {
      try {
        const id = payload?.id
        const type = payload?.type
        const source = payload?.source ?? 'user'
        if (!id || !type) {
          return { success: false, message: t('resources.missingParams') }
        }

        const path = require('path')
        const fs = require('fs-extra')
        const os = require('os')
        const { dialog } = require('electron')
        const AdmZip = require('adm-zip')

        // 定位资源目录
        let sourceDir: string | null = null
        if (source === 'user') {
          sourceDir = path.join(os.homedir(), '.promptx', 'resource', type, id)
        } else if (source === 'project') {
          try {
            const { ProjectPathResolver } = require('@promptx/core')
            const resolver = new ProjectPathResolver()
            const projectResDir = resolver.getResourceDirectory()
            sourceDir = path.join(projectResDir, type, id)
          } catch (e: any) {
            return { success: false, message: t('resources.projectNotInitialized') }
          }
        } else {
          // system/package
          try {
            const resourcePkg = require('@promptx/resource')
            const res = resourcePkg.findResourceById(id)
            if (!res || !res.metadata?.path) {
              return { success: false, message: t('resources.systemResourceNotFound') }
            }
            const absMainFile = resourcePkg.getResourcePath(res.metadata.path)
            sourceDir = path.dirname(absMainFile)
          } catch (e: any) {
            return { success: false, message: t('resources.cannotResolveSystemPath') }
          }
        }

        if (!sourceDir) return { success: false, message: t('resources.cannotLocateResourceDir') }
        const exists = await fs.pathExists(sourceDir)
        if (!exists) return { success: false, message: t('resources.directoryNotExists') + `: ${sourceDir}` }

        // 让用户选择保存 ZIP 文件的位置
        const ret = await dialog.showSaveDialog({
          title: t('resources.selectSaveLocation', { type }),
          defaultPath: `${type}-${id}.zip`,
          filters: [
            { name: 'ZIP Archive', extensions: ['zip'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        })

        if (ret.canceled || !ret.filePath) {
          return { success: false, message: t('resources.cancelled') }
        }
        const zipFilePath = ret.filePath

        // 创建 ZIP 压缩包（跨平台兼容）
        const zip = new AdmZip()

        // 递归添加目录中的所有文件
        const addDirectoryToZip = async (dirPath: string, zipPath: string = '') => {
          const entries = await fs.readdir(dirPath, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)
            const zipEntryPath = zipPath ? path.join(zipPath, entry.name) : entry.name

            if (entry.isDirectory()) {
              await addDirectoryToZip(fullPath, zipEntryPath)
            } else {
              zip.addLocalFile(fullPath, zipPath)
            }
          }
        }

        await addDirectoryToZip(sourceDir)

        // 写入 ZIP 文件
        zip.writeZip(zipFilePath)

        return { success: true, path: zipFilePath }
      } catch (error: any) {
        console.error('Failed to download resource:', error)
        return { success: false, message: error?.message || t('resources.downloadFailed') }
      }
    })

    // 新增：删除资源（仅支持删除用户资源）
    ipcMain.handle('resources:delete', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string }) => {
      try {
        const id = payload?.id
        const type = payload?.type
        const source = payload?.source ?? 'user'

        if (!id || !type) {
          return { success: false, message: t('resources.missingParams') }
        }
        if (source !== 'user') {
          return { success: false, message: t('resources.onlyUserDeletable') }
        }

        const fs = require('fs-extra')
        const path = require('path')
        const os = require('os')

        const targetDir = path.join(os.homedir(), '.promptx', 'resource', type, id)
        const exists = await fs.pathExists(targetDir)
        if (!exists) {
          return { success: false, message: t('resources.directoryNotExists') + `: ${targetDir}` }
        }

        await fs.remove(targetDir)

        // 刷新资源发现，确保UI能看到最新列表
        try {
          const core = require('@promptx/core')
          const { DiscoverCommand } = core.pouch.commands
          const discover = new DiscoverCommand()
          await discover.refreshAllResources()
        } catch (refreshErr) {
          console.warn('Resource refresh after delete failed:', refreshErr)
        }

        return { success: true }
      } catch (error: any) {
        console.error('Failed to delete resource:', error)
        return { success: false, message: error?.message || t('resources.deleteFailed') }
      }
    })

    // 新增：列出资源文件（仅返回 .md）
    ipcMain.handle('resources:listFiles', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string }) => {
      try {
        const id = payload?.id
        const type = payload?.type
        const source = payload?.source ?? 'user'
        if (!id || !type) return { success: false, message: t('resources.missingParams') }

        const path = require('path')
        const fs = require('fs-extra')
        const os = require('os')

        // 解析资源根目录
        let sourceDir: string | null = null
        if (source === 'user') {
          sourceDir = path.join(os.homedir(), '.promptx', 'resource', type, id)
        } else if (source === 'project') {
          try {
            const { ProjectPathResolver } = require('@promptx/core')
            const resolver = new ProjectPathResolver()
            const projectResDir = resolver.getResourceDirectory()
            sourceDir = path.join(projectResDir, type, id)
          } catch {
            return { success: false, message: t('resources.projectNotInitialized') }
          }
        } else {
          // system/package
          try {
            const resourcePkg = require('@promptx/resource')
            const res = resourcePkg.findResourceById(id)
            if (!res || !res.metadata?.path) {
              return { success: false, message: t('resources.systemResourceNotFound') }
            }
            const absMainFile = resourcePkg.getResourcePath(res.metadata.path)
            sourceDir = path.dirname(absMainFile)
          } catch {
            return { success: false, message: t('resources.cannotResolveSystemPath') }
          }
        }

        if (!sourceDir || !(await fs.pathExists(sourceDir))) {
          return { success: false, message: t('resources.directoryNotExists') + `: ${sourceDir}` }
        }

        // 递归列出文件，返回相对路径
        const result: string[] = []
        async function walk(dir: string, base: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true })
          for (const entry of entries) {
            const full = path.join(dir, entry.name)
            const rel = path.relative(base, full)
            if (entry.isDirectory()) {
              await walk(full, base)
            } else if (entry.isFile()) {
              // 对于工具，显示所有文件；对于角色，只显示.md文件
              const shouldInclude = type === 'tool' || entry.name.toLowerCase().endsWith('.md')
              if (shouldInclude) {
                // 统一使用正斜杠
                result.push(rel.split(path.sep).join('/'))
              }
            }
          }
        }
        await walk(sourceDir, sourceDir)

        // 特例：若无任何 .md，则尝试返回主目录中可能的 md
        return { success: true, files: result, baseDir: sourceDir }
      } catch (error: any) {
        console.error('Failed to list files:', error)
        return { success: false, message: error?.message || t('resources.listFilesFailed') }
      }
    })

    // 新增：读取资源文件内容
    ipcMain.handle('resources:readFile', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string; relativePath: string }) => {
      try {
        const { id, type, relativePath } = payload || {}
        const source = payload?.source ?? 'user'
        if (!id || !type || !relativePath) return { success: false, message: t('resources.missingParams') }

        const path = require('path')
        const fs = require('fs-extra')
        const os = require('os')

        let baseDir: string | null = null
        if (source === 'user') {
          baseDir = path.join(os.homedir(), '.promptx', 'resource', type, id)
        } else if (source === 'project') {
          try {
            const { ProjectPathResolver } = require('@promptx/core')
            const resolver = new ProjectPathResolver()
            const projectResDir = resolver.getResourceDirectory()
            baseDir = path.join(projectResDir, type, id)
          } catch {
            return { success: false, message: t('resources.projectNotInitialized') }
          }
        } else {
          try {
            const resourcePkg = require('@promptx/resource')
            const res = resourcePkg.findResourceById(id)
            if (!res || !res.metadata?.path) return { success: false, message: t('resources.systemResourceNotFound') }
            const absMainFile = resourcePkg.getResourcePath(res.metadata.path)
            baseDir = path.dirname(absMainFile)
          } catch {
            return { success: false, message: t('resources.cannotResolveSystemPath') }
          }
        }

        const absPath = path.join(baseDir!, relativePath)
        const exists = await fs.pathExists(absPath)
        if (!exists) return { success: false, message: t('resources.fileNotExists') + `: ${relativePath}` }
        const content = await fs.readFile(absPath, 'utf-8')
        return { success: true, content, path: absPath }
      } catch (error: any) {
        console.error('Failed to read file:', error)
        return { success: false, message: error?.message || t('resources.readFileFailed') }
      }
    })

    // 新增：保存资源文件内容（仅允许用户资源）
    ipcMain.handle('resources:saveFile', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string; relativePath: string; content: string }) => {
      try {
        const { id, type, relativePath, content } = payload || {}
        const source = payload?.source ?? 'user'
        if (!id || !type || !relativePath) return { success: false, message: t('resources.missingParams') }
        if (source !== 'user') return { success: false, message: t('resources.onlyUserEditable') }

        const path = require('path')
        const fs = require('fs-extra')
        const os = require('os')

        const baseDir = path.join(os.homedir(), '.promptx', 'resource', type, id)
        const absPath = path.join(baseDir, relativePath)
        const exists = await fs.pathExists(absPath)
        if (!exists) return { success: false, message: t('resources.fileNotExists') + `: ${relativePath}` }

        await fs.writeFile(absPath, content, 'utf-8')
        return { success: true, path: absPath }
      } catch (error: any) {
        console.error('Failed to save file:', error)
        return { success: false, message: error?.message || t('resources.saveFailed') }
      }
    })

    // 新增：更新资源元数据（名称和描述）
    ipcMain.handle('resources:updateMetadata', async (_evt, payload: { id: string; type: 'role' | 'tool'; source?: string; name?: string; description?: string }) => {
      try {
        const { id, type, name, description } = payload || {}
        const source = payload?.source ?? 'user'
        
        if (!id || !type) {
          return { success: false, message: t('resources.missingParams') }
        }
        
        if (source !== 'user') {
          return { success: false, message: t('resources.onlyUserEditable') }
        }

        const updates: { name?: string; description?: string } = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description

        if (Object.keys(updates).length === 0) {
          return { success: false, message: t('resources.noFieldsToUpdate') }
        }

        const result = await this.resourceService.updateResourceMetadata(id, updates)
        return result
      } catch (error: any) {
        console.error('Failed to update resource metadata:', error)
        return { success: false, message: error?.message || t('resources.updateMetadataFailed') }
      }
    })

    // 新增：导入资源（从压缩包）
    ipcMain.handle('resources:import', async (_evt, payload: {
      filePath: string
      type: 'role' | 'tool'
      customId?: string
      name?: string
      description?: string
    }) => {
      try {
        const { filePath, type, customId, name, description } = payload || {}

        if (!filePath || !type) {
          return { success: false, message: t('resources.missingParams') }
        }

        const fs = require('fs-extra')
        const path = require('path')
        const os = require('os')
        const AdmZip = require('adm-zip')

        // 验证文件存在
        if (!(await fs.pathExists(filePath))) {
          return { success: false, message: t('resources.fileNotFound') }
        }

        // 创建临时目录
        const tempDir = path.join(os.tmpdir(), `promptx-import-${Date.now()}`)
        await fs.ensureDir(tempDir)

        try {
          // 解压文件
          const zip = new AdmZip(filePath)
          zip.extractAllTo(tempDir, true)

          // 查找资源目录（可能在根目录或一级子目录中）
          let resourceDir: string | null = null
          let resourceId: string | null = null

          const entries = await fs.readdir(tempDir)

          // 检查是否直接在根目录
          const mainFiles = entries.filter((f: string) =>
            f.endsWith('.role.md') || f.endsWith('.tool.js')
          )

          if (mainFiles.length > 0) {
            resourceDir = tempDir
            resourceId = mainFiles[0].replace(/\.(role\.md|tool\.js)$/, '')
          } else if (entries.length === 1) {
            // 检查一级子目录
            const subDir = path.join(tempDir, entries[0])
            const stat = await fs.stat(subDir)
            if (stat.isDirectory()) {
              const subEntries = await fs.readdir(subDir)
              const subMainFiles = subEntries.filter((f: string) =>
                f.endsWith('.role.md') || f.endsWith('.tool.js')
              )
              if (subMainFiles.length > 0) {
                resourceDir = subDir
                resourceId = subMainFiles[0].replace(/\.(role\.md|tool\.js)$/, '')
              }
            }
          }

          if (!resourceDir || !resourceId) {
            await fs.remove(tempDir)
            return { success: false, message: t('resources.invalidResourceStructure') }
          }

          // 使用自定义ID或原ID
          const finalId = customId || resourceId

          // 目标目录
          const userResourceDir = path.join(os.homedir(), '.promptx', 'resource', type, finalId)

          // 检查是否已存在
          if (await fs.pathExists(userResourceDir)) {
            const overwrite = await dialog.showMessageBox({
              type: 'question',
              buttons: ['Cancel', 'Overwrite'],
              defaultId: 0,
              title: t('resources.resourceExists'),
              message: t('resources.resourceExistsMessage', { id: finalId })
            })

            if (overwrite.response === 0) {
              await fs.remove(tempDir)
              return { success: false, message: t('resources.cancelled') }
            }

            await fs.remove(userResourceDir)
          }

          // 复制到用户目录
          await fs.copy(resourceDir, userResourceDir)

          // 如果提供了自定义名称或描述，更新主文件
          if (name || description) {
            const mainFile = type === 'role'
              ? path.join(userResourceDir, `${finalId}.role.md`)
              : path.join(userResourceDir, `${finalId}.tool.js`)

            if (await fs.pathExists(mainFile)) {
              let content = await fs.readFile(mainFile, 'utf-8')

              // 简单的替换（可以根据实际格式调整）
              if (type === 'role' && (name || description)) {
                // TODO: 更新role文件的name和description
                // 这需要根据具体的DPML格式来解析和修改
              }
            }
          }

          // 清理临时目录
          await fs.remove(tempDir)

          // 刷新资源发现
          try {
            const core = require('@promptx/core')
            const { DiscoverCommand } = core.pouch.commands
            const discover = new DiscoverCommand()
            await discover.refreshAllResources()
          } catch (refreshErr) {
            console.warn('Resource refresh after import failed:', refreshErr)
          }

          return {
            success: true,
            id: finalId,
            message: t('resources.importSuccess', { id: finalId })
          }

        } finally {
          // 确保清理临时目录
          if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir)
          }
        }

      } catch (error: any) {
        console.error('Failed to import resource:', error)
        return { success: false, message: error?.message || t('resources.importFailed') }
      }
    })
  }

  show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
      return
    }

    this.createWindow()
  }

  hide(): void {
    this.window?.hide()
  }

  close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
    }
    this.window = null
  }

  private createWindow(): void {
    const preloadPath = path.join(__dirname, '../preload/preload.cjs')

    this.window = new BrowserWindow({
      width: 900,
      height: 700,
      title: t('tray.windows.resources'),
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        autoplayPolicy: 'user-gesture-required' // 禁用媒体自动播放
      },
      show: false,
      resizable: true,
      minimizable: true,
      maximizable: true,
      center: true
    })

    // 加载资源管理页面
    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:5173/#/resources')
    } else {
      const indexHtmlPath = path.join(__dirname, '../renderer/index.html')
      this.window.loadFile(indexHtmlPath, { hash: '/resources' })
    }

    this.window.once('ready-to-show', () => {
      this.window?.show()
    })

    this.window.on('closed', () => {
      this.window = null
    })
  }
}