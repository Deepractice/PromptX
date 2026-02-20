import { ipcMain } from 'electron'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import Database from 'better-sqlite3'

/**
 * CognitionWindow - 认知/记忆数据 IPC 处理
 * 读取 ~/.promptx/cognition/{roleId}/ 下的认知数据
 */
export class CognitionWindow {
  private static handlersRegistered = false

  constructor() {
    this.setupIpcHandlers()
  }

  private getCognitionPath(roleId: string): string {
    return path.join(os.homedir(), '.promptx', 'cognition', roleId)
  }

  private setupIpcHandlers(): void {
    if (CognitionWindow.handlersRegistered) return
    CognitionWindow.handlersRegistered = true

    // 获取概览统计
    ipcMain.handle('cognition:getOverview', async (_, roleId: string) => {
      try {
        const dir = this.getCognitionPath(roleId)
        if (!fs.existsSync(dir)) {
          return { engramCount: 0, cueCount: 0, connectionCount: 0, lastActive: null, topCues: [] }
        }

        let engramCount = 0
        const dbPath = path.join(dir, 'engrams.db')
        if (fs.existsSync(dbPath)) {
          const db = new Database(dbPath, { readonly: true })
          try {
            const row = db.prepare('SELECT COUNT(*) as count FROM engrams').get() as any
            engramCount = row?.count ?? 0
          } finally {
            db.close()
          }
        }

        let cueCount = 0
        let connectionCount = 0
        let topCues: { word: string; recallFrequency: number }[] = []
        const networkPath = path.join(dir, 'network.json')
        if (fs.existsSync(networkPath)) {
          const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'))
          const cues = network.cues || {}
          cueCount = Object.keys(cues).length
          for (const cue of Object.values(cues) as any[]) {
            connectionCount += (cue.connections || []).length
          }
          topCues = Object.entries(cues)
            .map(([word, data]: [string, any]) => ({ word, recallFrequency: data.recallFrequency || 0 }))
            .sort((a, b) => b.recallFrequency - a.recallFrequency)
            .slice(0, 5)
        }

        let lastActive: string | null = null
        const statePath = path.join(dir, 'state.json')
        if (fs.existsSync(statePath)) {
          const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
          lastActive = state.lastActive || state.timestamp || null
        }

        return { engramCount, cueCount, connectionCount, lastActive, topCues }
      } catch (error: any) {
        console.error('Failed to get cognition overview:', error)
        return { engramCount: 0, cueCount: 0, connectionCount: 0, lastActive: null, topCues: [] }
      }
    })

    // 列出记忆印记
    ipcMain.handle('cognition:listEngrams', async (_, roleId: string, page = 0, pageSize = 20, type?: string, keyword?: string) => {
      try {
        const dbPath = path.join(this.getCognitionPath(roleId), 'engrams.db')
        if (!fs.existsSync(dbPath)) return { items: [], total: 0 }

        const db = new Database(dbPath, { readonly: true })
        try {
          let where = ''
          const params: any[] = []
          const conditions: string[] = []

          if (type) {
            conditions.push('type = ?')
            params.push(type)
          }
          if (keyword) {
            conditions.push('(content LIKE ? OR schema LIKE ?)')
            params.push(`%${keyword}%`, `%${keyword}%`)
          }
          if (conditions.length) where = 'WHERE ' + conditions.join(' AND ')

          const countRow = db.prepare(`SELECT COUNT(*) as count FROM engrams ${where}`).get(...params) as any
          const total = countRow?.count ?? 0

          const items = db.prepare(
            `SELECT * FROM engrams ${where} ORDER BY rowid DESC LIMIT ? OFFSET ?`
          ).all(...params, pageSize, page * pageSize)

          return { items, total }
        } finally {
          db.close()
        }
      } catch (error: any) {
        console.error('Failed to list engrams:', error)
        return { items: [], total: 0 }
      }
    })

    // 获取知识网络图
    ipcMain.handle('cognition:getNetwork', async (_, roleId: string, limit = 50) => {
      try {
        const networkPath = path.join(this.getCognitionPath(roleId), 'network.json')
        if (!fs.existsSync(networkPath)) return { nodes: [], edges: [] }

        const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'))
        const cues = network.cues || {}

        const sorted = Object.entries(cues)
          .map(([word, data]: [string, any]) => ({ word, ...data }))
          .sort((a, b) => (b.recallFrequency || 0) - (a.recallFrequency || 0))
          .slice(0, limit)

        const wordSet = new Set(sorted.map(c => c.word))
        const nodes = sorted.map(c => ({
          id: c.word,
          recallFrequency: c.recallFrequency || 0,
          connectionCount: (c.connections || []).length
        }))

        const edges: { source: string; target: string; weight: number }[] = []
        for (const cue of sorted) {
          for (const conn of (cue.connections || [])) {
            const target = typeof conn === 'string' ? conn : conn.target || conn.word
            const weight = typeof conn === 'object' ? (conn.weight || 1) : 1
            if (wordSet.has(target) && cue.word < target) {
              edges.push({ source: cue.word, target, weight })
            }
          }
        }

        return { nodes, edges }
      } catch (error: any) {
        console.error('Failed to get network:', error)
        return { nodes: [], edges: [] }
      }
    })

    // 获取线索详情
    ipcMain.handle('cognition:getCueDetail', async (_, roleId: string, cueWord: string) => {
      try {
        const dir = this.getCognitionPath(roleId)
        const networkPath = path.join(dir, 'network.json')
        if (!fs.existsSync(networkPath)) return null

        const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'))
        const cue = (network.cues || {})[cueWord]
        if (!cue) return null

        const connections = (cue.connections || []).map((conn: any) => {
          if (typeof conn === 'string') return { target: conn, weight: 1 }
          return { target: conn.target || conn.word, weight: conn.weight || 1 }
        }).sort((a: any, b: any) => b.weight - a.weight)

        let memories: any[] = []
        const dbPath = path.join(dir, 'engrams.db')
        if (fs.existsSync(dbPath)) {
          const db = new Database(dbPath, { readonly: true })
          try {
            memories = db.prepare(
              'SELECT * FROM engrams WHERE content LIKE ? OR schema LIKE ? LIMIT 20'
            ).all(`%${cueWord}%`, `%${cueWord}%`)
          } finally {
            db.close()
          }
        }

        return {
          word: cueWord,
          recallFrequency: cue.recallFrequency || 0,
          connections,
          memories
        }
      } catch (error: any) {
        console.error('Failed to get cue detail:', error)
        return null
      }
    })

    // 更新记忆印记
    ipcMain.handle('cognition:updateEngram', async (_, roleId: string, engramId: number, updates: { content?: string; type?: string; strength?: number; schema?: string }) => {
      try {
        const dbPath = path.join(this.getCognitionPath(roleId), 'engrams.db')
        if (!fs.existsSync(dbPath)) return { success: false, message: 'Database not found' }

        const db = new Database(dbPath)
        try {
          const sets: string[] = []
          const params: any[] = []
          if (updates.content !== undefined) { sets.push('content = ?'); params.push(updates.content) }
          if (updates.type !== undefined) { sets.push('type = ?'); params.push(updates.type) }
          if (updates.strength !== undefined) { sets.push('strength = ?'); params.push(updates.strength) }
          if (updates.schema !== undefined) { sets.push('schema = ?'); params.push(updates.schema) }
          if (sets.length === 0) return { success: false, message: 'No fields to update' }

          params.push(engramId)
          db.prepare(`UPDATE engrams SET ${sets.join(', ')} WHERE rowid = ?`).run(...params)
          return { success: true }
        } finally {
          db.close()
        }
      } catch (error: any) {
        console.error('Failed to update engram:', error)
        return { success: false, message: error.message }
      }
    })

    // 删除记忆印记
    ipcMain.handle('cognition:deleteEngram', async (_, roleId: string, engramId: number) => {
      try {
        const dbPath = path.join(this.getCognitionPath(roleId), 'engrams.db')
        if (!fs.existsSync(dbPath)) return { success: false, message: 'Database not found' }

        const db = new Database(dbPath)
        try {
          db.prepare('DELETE FROM engrams WHERE rowid = ?').run(engramId)
          return { success: true }
        } finally {
          db.close()
        }
      } catch (error: any) {
        console.error('Failed to delete engram:', error)
        return { success: false, message: error.message }
      }
    })

    // 删除线索节点
    ipcMain.handle('cognition:deleteCue', async (_, roleId: string, cueWord: string) => {
      try {
        const networkPath = path.join(this.getCognitionPath(roleId), 'network.json')
        if (!fs.existsSync(networkPath)) return { success: false, message: 'Network not found' }

        const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'))
        if (!network.cues || !network.cues[cueWord]) return { success: false, message: 'Cue not found' }

        delete network.cues[cueWord]
        // Also remove connections referencing this cue
        for (const cue of Object.values(network.cues) as any[]) {
          if (cue.connections) {
            cue.connections = cue.connections.filter((conn: any) => {
              const target = typeof conn === 'string' ? conn : conn.target || conn.word
              return target !== cueWord
            })
          }
        }
        fs.writeFileSync(networkPath, JSON.stringify(network, null, 2), 'utf-8')
        return { success: true }
      } catch (error: any) {
        console.error('Failed to delete cue:', error)
        return { success: false, message: error.message }
      }
    })
  }
}
